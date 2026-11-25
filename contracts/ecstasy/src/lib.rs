#![no_std]

//! ECSTASY — consent-first private-agreement protocol.
//!
//! The contract is the source of truth for the *state transition* only.
//! Private terms never enter the ledger: the web client commits to a
//! canonical terms document with a SHA-256 digest and stores only that
//! digest (`terms_hash`) on-chain.
//!
//! Escrow rule (explicit and intentionally simple for the MVP):
//! - the creator's optional `stake` is pulled into the contract at creation;
//! - on mutual completion, settlement releases the whole stake to the
//!   participant;
//! - on decline, cancel, or expiry before completion, the stake is refunded
//!   to the creator.
//!
//! No settlement is possible without both completion flags and an
//! authenticated call by one of the two parties. Terminal states
//! (`SETTLED`, `CANCELLED`, `EXPIRED`) cannot transition again, which makes
//! double settlement impossible.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient, Address,
    Bytes, BytesN, Env, MuxedAddress, Symbol,
};

/// Every state transition emits this typed event.
/// Topics: `("ecstasy", id, name)`, data: `{ status, stake, actor }`.
#[contractevent(topics = ["ecstasy"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncounterEvent {
    #[topic]
    pub id: u64,
    #[topic]
    pub name: Symbol,
    pub status: Symbol,
    pub stake: i128,
    pub actor: Address,
}

/// Contract errors. Numeric codes are part of the ABI and must stay stable.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EcstasyError {
    NotFound = 1,
    NotParty = 2,
    SelfEncounter = 3,
    InvalidStake = 4,
    InvalidExpiry = 5,
    InvalidState = 6,
    InvalidScore = 7,
    AlreadyCompleted = 8,
    AlreadySubmitted = 9,
    Expired = 10,
    InvalidAsset = 11,
}

/// Lifecycle of an encounter.
///
/// `Created` is the pending invitation. There is no separate `INVITED` or
/// `ACTIVE` state in the MVP: `create_encounter` emits the invitation and
/// `accept_encounter` moves directly to `Accepted`.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EncounterStatus {
    Created,
    Accepted,
    Completed,
    Settled,
    Cancelled,
    Expired,
}

/// Public on-chain state. Never add private terms or personal content here.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Encounter {
    pub id: u64,
    pub creator: Address,
    pub participant: Address,
    pub asset: Address,
    pub stake: i128,
    pub terms_hash: BytesN<32>,
    pub created_at: u64,
    pub expires_at: u64,
    pub status: EncounterStatus,
    pub creator_completed: bool,
    pub participant_completed: bool,
    /// Deterministic on-chain settlement marker derived from the settlement
    /// receipt. This is *not* the Stellar transaction hash; obtain that from
    /// the RPC receipt / explorer (see `docs/API.md`).
    pub settlement_marker: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Encounter(u64),
    Afterglow(u64, Address),
    /// Total stake still locked across all non-terminal encounters. Used to
    /// protect escrow from the `retirar` withdrawal of surplus funds.
    ReservedStake,
    /// The single asset contract allowed for escrow in this deployment.
    EscrowAsset,
}

#[contract]
pub struct EcstasyContract;

/// Uniform event payload so demo tooling can parse every transition the
/// same way: `[status_symbol, stake, actor]`, topics `("event_name", id)`.
fn emit_symbol(env: &Env, name: &str, id: u64, status: Symbol, stake: i128, actor: &Address) {
    EncounterEvent {
        id,
        name: Symbol::new(env, name),
        status,
        stake,
        actor: actor.clone(),
    }
    .publish(env);
}

fn emit(env: &Env, name: &str, id: u64, status: EncounterStatus, stake: i128, actor: &Address) {
    let status_symbol = match status {
        EncounterStatus::Created => Symbol::new(env, "created"),
        EncounterStatus::Accepted => Symbol::new(env, "accepted"),
        EncounterStatus::Completed => Symbol::new(env, "completed"),
        EncounterStatus::Settled => Symbol::new(env, "settled"),
        EncounterStatus::Cancelled => Symbol::new(env, "cancelled"),
        EncounterStatus::Expired => Symbol::new(env, "expired"),
    };
    emit_symbol(env, name, id, status_symbol, stake, actor);
}

/// Accounting helpers for funds that belong to an encounter and therefore
/// must never be withdrawable by `retirar`.
fn reserved_stake(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::ReservedStake).unwrap_or(0)
}

fn reserve(env: &Env, amount: i128) -> Result<(), EcstasyError> {
    let next = reserved_stake(env)
        .checked_add(amount)
        .ok_or(EcstasyError::InvalidState)?;
    env.storage().instance().set(&DataKey::ReservedStake, &next);
    Ok(())
}

fn release(env: &Env, amount: i128) -> Result<(), EcstasyError> {
    let next = reserved_stake(env)
        .checked_sub(amount)
        .ok_or(EcstasyError::InvalidState)?;
    env.storage().instance().set(&DataKey::ReservedStake, &next);
    Ok(())
}

/// Move tokens held by the contract. The contract authorizes as itself
/// because it is the direct invoker of the Stellar Asset Contract.
fn payout_from_contract(env: &Env, asset: &Address, to: &Address, amount: i128) {
    // No explicit require_auth() on the contract address: a contract is
    // implicitly authorized as the direct invoker of the token contract.
    // Calling require_auth() here would create an auth entry that no external
    // wallet or CLI identity can sign.
    TokenClient::new(env, asset).transfer(
        &env.current_contract_address(),
        &MuxedAddress::from(to.clone()),
        &amount,
    );
}

/// Pull tokens from an authenticated actor into the contract.
fn pull_from_actor(env: &Env, asset: &Address, from: &Address, amount: i128) {
    TokenClient::new(env, asset).transfer(
        from,
        &MuxedAddress::from(env.current_contract_address()),
        &amount,
    );
}

/// Read an encounter or fail.
fn load(env: &Env, id: u64) -> Result<Encounter, EcstasyError> {
    env.storage()
        .instance()
        .get(&DataKey::Encounter(id))
        .ok_or(EcstasyError::NotFound)
}

fn store(env: &Env, encounter: &Encounter) {
    env.storage()
        .instance()
        .set(&DataKey::Encounter(encounter.id), encounter);
}

/// Pure expiry check. Refunds cannot happen inside a method that returns an
/// error, because a failed Soroban invocation rolls back all state changes.
/// Expiry is therefore finalized by the permissionless `expire_encounter`
/// transaction, which succeeds and performs the refund.
fn is_expired(env: &Env, encounter: &Encounter) -> bool {
    let is_open = matches!(
        encounter.status,
        EncounterStatus::Created | EncounterStatus::Accepted
    );
    is_open && env.ledger().timestamp() > encounter.expires_at
}

fn ensure_party(encounter: &Encounter, caller: &Address) -> Result<(), EcstasyError> {
    if caller != &encounter.creator && caller != &encounter.participant {
        Err(EcstasyError::NotParty)
    } else {
        Ok(())
    }
}

#[contractimpl]
impl EcstasyContract {
    /// Create an invitation and optionally pull the creator's stake into
    /// escrow. Returns the monotonically increasing encounter id.
    pub fn create_encounter(
        env: Env,
        creator: Address,
        participant: Address,
        asset: Address,
        stake: i128,
        terms_hash: BytesN<32>,
        expires_at: u64,
    ) -> Result<u64, EcstasyError> {
        creator.require_auth();

        if creator == participant {
            return Err(EcstasyError::SelfEncounter);
        }
        if stake < 0 {
            return Err(EcstasyError::InvalidStake);
        }
        let now = env.ledger().timestamp();
        if expires_at <= now {
            return Err(EcstasyError::InvalidExpiry);
        }

        let configured_asset: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowAsset)
            .unwrap_or_else(|| asset.clone());
        if asset != configured_asset {
            return Err(EcstasyError::InvalidAsset);
        }
        env.storage()
            .instance()
            .set(&DataKey::EscrowAsset, &configured_asset);

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(EcstasyError::InvalidState)?;

        if stake > 0 {
            pull_from_actor(&env, &asset, &creator, stake);
            reserve(&env, stake)?;
        }

        let encounter = Encounter {
            id,
            creator: creator.clone(),
            participant: participant.clone(),
            asset: asset.clone(),
            stake,
            terms_hash: terms_hash.clone(),
            created_at: now,
            expires_at,
            status: EncounterStatus::Created,
            creator_completed: false,
            participant_completed: false,
            settlement_marker: None,
        };
        store(&env, &encounter);
        env.storage().instance().set(&DataKey::Counter, &id);

        emit(
            &env,
            "encounter_created",
            id,
            EncounterStatus::Created,
            stake,
            &creator,
        );
        let _ = (participant, asset, terms_hash);
        Ok(id)
    }

    /// Explicit consent by the invited participant.
    pub fn accept_encounter(
        env: Env,
        participant: Address,
        encounter_id: u64,
    ) -> Result<(), EcstasyError> {
        participant.require_auth();
        let mut encounter = load(&env, encounter_id)?;
        if encounter.participant != participant {
            return Err(EcstasyError::NotParty);
        }
        if is_expired(&env, &encounter) {
            return Err(EcstasyError::Expired);
        }
        if encounter.status != EncounterStatus::Created {
            return Err(EcstasyError::InvalidState);
        }

        encounter.status = EncounterStatus::Accepted;
        store(&env, &encounter);
        emit(
            &env,
            "encounter_accepted",
            encounter_id,
            EncounterStatus::Accepted,
            encounter.stake,
            &participant,
        );
        Ok(())
    }

    /// Decline the invitation. Always refunds the creator.
    pub fn decline_encounter(
        env: Env,
        participant: Address,
        encounter_id: u64,
    ) -> Result<(), EcstasyError> {
        participant.require_auth();
        let mut encounter = load(&env, encounter_id)?;
        if encounter.participant != participant {
            return Err(EcstasyError::NotParty);
        }
        if is_expired(&env, &encounter) {
            return Err(EcstasyError::Expired);
        }
        if encounter.status != EncounterStatus::Created {
            return Err(EcstasyError::InvalidState);
        }

        if encounter.stake > 0 {
            payout_from_contract(&env, &encounter.asset, &encounter.creator, encounter.stake);
            release(&env, encounter.stake)?;
        }
        encounter.status = EncounterStatus::Cancelled;
        store(&env, &encounter);
        emit(
            &env,
            "encounter_declined",
            encounter_id,
            EncounterStatus::Cancelled,
            encounter.stake,
            &participant,
        );
        Ok(())
    }

    /// Record one party's completion. Both parties must call this before the
    /// encounter can be settled. Calling twice by the same party is rejected.
    pub fn complete_encounter(
        env: Env,
        caller: Address,
        encounter_id: u64,
    ) -> Result<(), EcstasyError> {
        caller.require_auth();
        let mut encounter = load(&env, encounter_id)?;
        ensure_party(&encounter, &caller)?;
        if is_expired(&env, &encounter) {
            return Err(EcstasyError::Expired);
        }
        if encounter.status != EncounterStatus::Accepted {
            return Err(EcstasyError::InvalidState);
        }

        if caller == encounter.creator {
            if encounter.creator_completed {
                return Err(EcstasyError::AlreadyCompleted);
            }
            encounter.creator_completed = true;
        } else {
            if encounter.participant_completed {
                return Err(EcstasyError::AlreadyCompleted);
            }
            encounter.participant_completed = true;
        }

        let both_completed = encounter.creator_completed && encounter.participant_completed;
        if both_completed {
            encounter.status = EncounterStatus::Completed;
        }
        store(&env, &encounter);

        emit(
            &env,
            "encounter_completion",
            encounter_id,
            if both_completed {
                EncounterStatus::Completed
            } else {
                EncounterStatus::Accepted
            },
            encounter.stake,
            &caller,
        );
        if both_completed {
            emit(
                &env,
                "encounter_completed",
                encounter_id,
                EncounterStatus::Completed,
                encounter.stake,
                &caller,
            );
        }
        Ok(())
    }

    /// Terminal transition: release escrow to the participant, attach a
    /// deterministic receipt marker, and prevent any further state change.
    pub fn settle_encounter(
        env: Env,
        caller: Address,
        encounter_id: u64,
    ) -> Result<(), EcstasyError> {
        caller.require_auth();
        let mut encounter = load(&env, encounter_id)?;
        ensure_party(&encounter, &caller)?;
        if encounter.status != EncounterStatus::Completed {
            if is_expired(&env, &encounter) {
                return Err(EcstasyError::Expired);
            }
            return Err(EcstasyError::InvalidState);
        }

        if encounter.stake > 0 {
            payout_from_contract(&env, &encounter.asset, &encounter.participant, encounter.stake);
            release(&env, encounter.stake)?;
        }

        let mut marker_input = Bytes::new(&env);
        marker_input.append(&Bytes::from_array(&env, &encounter_id.to_be_bytes()));
        marker_input.append(&Bytes::from_array(
            &env,
            &env.ledger().timestamp().to_be_bytes(),
        ));
        encounter.settlement_marker = Some(env.crypto().sha256(&marker_input).to_bytes());
        encounter.status = EncounterStatus::Settled;
        store(&env, &encounter);

        emit(
            &env,
            "encounter_settled",
            encounter_id,
            EncounterStatus::Settled,
            encounter.stake,
            &caller,
        );
        Ok(())
    }

    /// Cancel a still-open encounter and refund the creator. Either party may
    /// withdraw consent before completion; after completion, only settlement
    /// is possible.
    pub fn cancel_encounter(
        env: Env,
        caller: Address,
        encounter_id: u64,
    ) -> Result<(), EcstasyError> {
        caller.require_auth();
        let mut encounter = load(&env, encounter_id)?;
        ensure_party(&encounter, &caller)?;
        if is_expired(&env, &encounter) {
            return Err(EcstasyError::Expired);
        }
        if !matches!(
            encounter.status,
            EncounterStatus::Created | EncounterStatus::Accepted
        ) {
            return Err(EcstasyError::InvalidState);
        }

        if encounter.stake > 0 {
            payout_from_contract(&env, &encounter.asset, &encounter.creator, encounter.stake);
            release(&env, encounter.stake)?;
        }
        encounter.status = EncounterStatus::Cancelled;
        store(&env, &encounter);
        emit(
            &env,
            "encounter_cancelled",
            encounter_id,
            EncounterStatus::Cancelled,
            encounter.stake,
            &caller,
        );
        Ok(())
    }

    /// Permissionless finalization of an expired encounter. Anyone may call
    /// it: the refund always goes back to the creator, never to the caller.
    /// A failed invocation would roll back the refund, so expiry is committed
    /// in this successful, idempotent-on-terminal-state transition.
    pub fn expire_encounter(env: Env, encounter_id: u64) -> Result<(), EcstasyError> {
        let mut encounter = load(&env, encounter_id)?;
        if !is_expired(&env, &encounter) {
            return Err(EcstasyError::InvalidState);
        }

        if encounter.stake > 0 {
            payout_from_contract(&env, &encounter.asset, &encounter.creator, encounter.stake);
            release(&env, encounter.stake)?;
        }
        encounter.status = EncounterStatus::Expired;
        store(&env, &encounter);
        emit(
            &env,
            "encounter_expired",
            encounter_id,
            EncounterStatus::Expired,
            encounter.stake,
            &encounter.creator,
        );
        Ok(())
    }

    /// Withdraw funds sent to the contract that are not reserved as escrow
    /// for any encounter. Only the creator of the referenced encounter may
    /// call it, and only the surplus above `ReservedStake` is transferred.
    /// This is a real value-moving state transition with an event; it cannot
    /// drain locked stakes. Returns the amount withdrawn.
    pub fn retirar(
        env: Env,
        caller: Address,
        encounter_id: u64,
    ) -> Result<i128, EcstasyError> {
        caller.require_auth();
        let encounter = load(&env, encounter_id)?;
        if caller != encounter.creator {
            return Err(EcstasyError::NotParty);
        }

        let configured_asset: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowAsset)
            .ok_or(EcstasyError::InvalidAsset)?;
        if encounter.asset != configured_asset {
            return Err(EcstasyError::InvalidAsset);
        }

        let balance = TokenClient::new(&env, &encounter.asset).balance(&env.current_contract_address());
        let reserved = reserved_stake(&env);
        if balance <= reserved {
            return Err(EcstasyError::InvalidState);
        }
        let amount = balance - reserved;

        payout_from_contract(&env, &encounter.asset, &caller, amount);
        emit_symbol(
            &env,
            "funds_withdrawn",
            encounter_id,
            Symbol::new(&env, "withdrawn"),
            amount,
            &caller,
        );
        Ok(amount)
    }

    /// One bounded afterglow score (0..=100) per participant, only after
    /// settlement. Reputation metadata, not a truth or safety claim.
    pub fn submit_afterglow(
        env: Env,
        caller: Address,
        encounter_id: u64,
        score: u32,
    ) -> Result<(), EcstasyError> {
        caller.require_auth();
        let encounter = load(&env, encounter_id)?;
        ensure_party(&encounter, &caller)?;
        if encounter.status != EncounterStatus::Settled {
            return Err(EcstasyError::InvalidState);
        }
        if score > 100 {
            return Err(EcstasyError::InvalidScore);
        }

        let key = DataKey::Afterglow(encounter_id, caller.clone());
        if env.storage().instance().has(&key) {
            return Err(EcstasyError::AlreadySubmitted);
        }
        env.storage().instance().set(&key, &score);
        emit(
            &env,
            "afterglow_submitted",
            encounter_id,
            EncounterStatus::Settled,
            encounter.stake,
            &caller,
        );
        Ok(())
    }

    /// Public read. Expiry is derived so a stale stored state is reported
    /// correctly even before a transaction touches the encounter.
    pub fn get_encounter(env: Env, encounter_id: u64) -> Result<Encounter, EcstasyError> {
        let encounter = load(&env, encounter_id)?;
        if is_expired(&env, &encounter) {
            Ok(Encounter {
                status: EncounterStatus::Expired,
                ..encounter
            })
        } else {
            Ok(encounter)
        }
    }

    /// Public read of one participant's afterglow, if submitted.
    pub fn get_afterglow(env: Env, encounter_id: u64, participant: Address) -> Option<u32> {
        env.storage()
            .instance()
            .get(&DataKey::Afterglow(encounter_id, participant))
    }
}
