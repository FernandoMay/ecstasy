#![no_std]

//! Panel V2: independent arbitrators selected deterministically from a
//! registry. The funder cannot name arbitrators; the executor cannot alter
//! the outcome. Policy: docs/PANEL_V2_POLICY.md.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, Bytes, BytesN, Env, Map, MuxedAddress, Symbol, Val, Vec,
};

const COMMIT_WINDOW: u64 = 300;
const REVEAL_WINDOW: u64 = 600;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PanelV2Error {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    NotArbitrator = 5,
    AlreadyCommitted = 6,
    AlreadyRevealed = 7,
    TooEarly = 8,
    TooLate = 9,
    CommitmentMismatch = 10,
    InvalidDecision = 11,
    RegistryUnavailable = 12,
    InsufficientArbitrators = 13,
    InsufficientFunds = 14,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CaseStatus {
    PanelPending,
    Open,
    Resolved,
    NoQuorum,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Case {
    pub id: u64,
    pub agreement_id: u64,
    pub payer: Address,
    pub recipient: Address,
    pub amount: i128,
    pub evidence_hash: BytesN<32>,
    pub status: CaseStatus,
    pub eligible_snapshot: Vec<Address>,
    pub selection_salt: BytesN<32>,
    pub arbitrators: Vec<Address>,
    pub commit_deadline: u64,
    pub reveal_deadline: u64,
    pub outcome_code: Option<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Registry,
    Case(u64),
    Commit(u64, Address),
    Vote(u64, Address),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PanelEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub case_id: u64,
    pub actor: Address,
}

#[contract]
pub struct PanelV2Contract;

#[contractimpl]
impl PanelV2Contract {
    pub fn __constructor(env: Env, asset: Address, registry: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Registry, &registry);
    }

    /// Deposit and freeze the eligible snapshot. No arbitrator can be passed here.
    #[allow(clippy::too_many_arguments)]
    pub fn create(
        env: Env,
        caller: Address,
        agreement_id: u64,
        recipient: Address,
        amount: i128,
        evidence_hash: BytesN<32>,
    ) -> Result<u64, PanelV2Error> {
        caller.require_auth();
        if amount <= 0 {
            return Err(PanelV2Error::InvalidAmount);
        }
        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let eligible: Vec<Address> = env.invoke_contract::<Vec<Address>>(
            &registry,
            &Symbol::new(&env, "get_eligible"),
            Vec::<Val>::new(&env),
        );
        if eligible.len() < 3 {
            return Err(PanelV2Error::InsufficientArbitrators);
        }

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(PanelV2Error::InvalidState)?;
        let mut salt_data = Bytes::new(&env);
        salt_data.append(&Bytes::from_array(
            &env,
            &env.ledger().timestamp().to_be_bytes(),
        ));
        salt_data.append(&Bytes::from_array(
            &env,
            &env.ledger().sequence().to_be_bytes(),
        ));
        salt_data.append(&Bytes::from_array(&env, &id.to_be_bytes()));
        salt_data.append(&caller.to_string().to_bytes());

        let now = env.ledger().timestamp();
        let case = Case {
            id,
            agreement_id,
            payer: caller.clone(),
            recipient,
            amount,
            evidence_hash,
            status: CaseStatus::PanelPending,
            eligible_snapshot: eligible,
            selection_salt: env.crypto().sha256(&salt_data).to_bytes(),
            arbitrators: Vec::new(&env),
            commit_deadline: now + COMMIT_WINDOW,
            reveal_deadline: now + REVEAL_WINDOW,
            outcome_code: None,
        };
        env.storage().instance().set(&DataKey::Case(id), &case);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "created", id, caller);
        Ok(id)
    }

    /// Permissionless deterministic selection from the frozen snapshot.
    pub fn select_panel(env: Env, caller: Address, case_id: u64) -> Result<(), PanelV2Error> {
        caller.require_auth();
        let mut case = Self::load(&env, case_id)?;
        if case.status != CaseStatus::PanelPending {
            return Err(PanelV2Error::InvalidState);
        }
        let salt = case.selection_salt.to_bytes();
        let len = case.eligible_snapshot.len();
        let mut picked: Vec<Address> = Vec::new(&env);
        for k in 0..len {
            let b = salt.get(k % 32).unwrap_or(0) as usize;
            let index = (b + k as usize) % len as usize;
            let candidate = case
                .eligible_snapshot
                .get(index as u32)
                .ok_or(PanelV2Error::InsufficientArbitrators)?;
            if !picked.contains(candidate.clone()) {
                picked.push_back(candidate);
            }
            if picked.len() == 3 {
                break;
            }
        }
        if picked.len() != 3 {
            return Err(PanelV2Error::InsufficientArbitrators);
        }
        case.arbitrators = picked;
        case.status = CaseStatus::Open;
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        Self::emit(&env, "panel_selected", case_id, caller);
        Ok(())
    }

    pub fn commit(
        env: Env,
        caller: Address,
        case_id: u64,
        commitment: BytesN<32>,
    ) -> Result<(), PanelV2Error> {
        caller.require_auth();
        let case = Self::load(&env, case_id)?;
        Self::ensure_arbitrator(&case, &caller)?;
        if case.status != CaseStatus::Open || env.ledger().timestamp() > case.commit_deadline {
            return Err(PanelV2Error::TooLate);
        }
        let key = DataKey::Commit(case_id, caller.clone());
        if env.storage().instance().has(&key) {
            return Err(PanelV2Error::AlreadyCommitted);
        }
        env.storage().instance().set(&key, &commitment);
        Self::emit(&env, "committed", case_id, caller);
        Ok(())
    }

    pub fn reveal(
        env: Env,
        caller: Address,
        case_id: u64,
        decision: u32,
        secret: BytesN<32>,
    ) -> Result<(), PanelV2Error> {
        caller.require_auth();
        let case = Self::load(&env, case_id)?;
        Self::ensure_arbitrator(&case, &caller)?;
        if case.status != CaseStatus::Open {
            return Err(PanelV2Error::InvalidState);
        }
        let now = env.ledger().timestamp();
        if now <= case.commit_deadline || now > case.reveal_deadline {
            return Err(PanelV2Error::TooEarly);
        }
        if !(1..=3).contains(&decision) {
            return Err(PanelV2Error::InvalidDecision);
        }
        let commitment: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::Commit(case_id, caller.clone()))
            .ok_or(PanelV2Error::InvalidState)?;
        if env
            .storage()
            .instance()
            .has(&DataKey::Vote(case_id, caller.clone()))
        {
            return Err(PanelV2Error::AlreadyRevealed);
        }
        if Self::commitment(&env, case_id, &caller, decision, &secret) != commitment {
            return Err(PanelV2Error::CommitmentMismatch);
        }
        Self::store_vote(&env, case_id, &caller, decision)?;
        Self::emit(&env, "revealed", case_id, caller);
        Ok(())
    }

    /// Permissionless quorum settlement after the reveal window.
    pub fn resolve(env: Env, caller: Address, case_id: u64) -> Result<(), PanelV2Error> {
        caller.require_auth();
        let mut case = Self::load(&env, case_id)?;
        if case.status != CaseStatus::Open {
            return Err(PanelV2Error::InvalidState);
        }
        if env.ledger().timestamp() <= case.reveal_deadline {
            return Err(PanelV2Error::TooEarly);
        }
        let mut votes: Map<u32, u32> = Map::new(&env);
        for arbitrator in case.arbitrators.iter() {
            if let Some(decision) = Self::vote(&env, case_id, &arbitrator) {
                votes.set(decision, votes.get(decision).unwrap_or(0) + 1);
            }
        }
        let mut winner: Option<u32> = None;
        for (decision, count) in votes.iter() {
            if count >= 2 {
                winner = Some(decision);
                break;
            }
        }
        match winner {
            Some(1) => Self::payout(&env, &case.recipient, case.amount)?,
            Some(2) => Self::payout(&env, &case.payer, case.amount)?,
            Some(3) => {
                let first = case.amount / 2;
                Self::payout(&env, &case.recipient, first)?;
                Self::payout(&env, &case.payer, case.amount - first)?;
            }
            _ => Self::payout(&env, &case.payer, case.amount)?,
        }
        case.status = if matches!(winner, Some(1..=3)) {
            CaseStatus::Resolved
        } else {
            CaseStatus::NoQuorum
        };
        case.outcome_code = winner;
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        Self::emit(&env, "settled", case_id, caller);
        Ok(())
    }

    pub fn get(env: Env, case_id: u64) -> Result<Case, PanelV2Error> {
        Self::load(&env, case_id)
    }

    /// Off-chain mirror: sha256("ECSTASY-PANEL-V2" || contract_id || case_id ||
    /// decision(u32) || secret || arbitrator).
    pub fn commitment(
        env: &Env,
        case_id: u64,
        arbitrator: &Address,
        decision: u32,
        secret: &BytesN<32>,
    ) -> BytesN<32> {
        let mut data = Bytes::new(env);
        data.append(&Bytes::from_array(env, b"ECSTASY-PANEL-V2"));
        data.append(&env.current_contract_address().to_string().to_bytes());
        data.append(&Bytes::from_array(env, &case_id.to_be_bytes()));
        data.append(&Bytes::from_array(env, &decision.to_be_bytes()));
        data.append(&secret.to_bytes());
        data.append(&arbitrator.to_string().to_bytes());
        env.crypto().sha256(&data).to_bytes()
    }

    fn store_vote(
        env: &Env,
        case_id: u64,
        arbitrator: &Address,
        decision: u32,
    ) -> Result<(), PanelV2Error> {
        let key = DataKey::Vote(case_id, arbitrator.clone());
        if env.storage().instance().has(&key) {
            return Err(PanelV2Error::AlreadyRevealed);
        }
        env.storage().instance().set(&key, &decision);
        Ok(())
    }

    fn vote(env: &Env, case_id: u64, arbitrator: &Address) -> Option<u32> {
        env.storage()
            .instance()
            .get(&DataKey::Vote(case_id, arbitrator.clone()))
    }

    fn ensure_arbitrator(case: &Case, caller: &Address) -> Result<(), PanelV2Error> {
        if case.arbitrators.contains(caller.clone()) {
            Ok(())
        } else {
            Err(PanelV2Error::NotArbitrator)
        }
    }

    fn load(env: &Env, case_id: u64) -> Result<Case, PanelV2Error> {
        env.storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(PanelV2Error::NotFound)
    }

    fn payout(env: &Env, to: &Address, amount: i128) -> Result<(), PanelV2Error> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = TokenClient::new(env, &asset);
        if token.balance(&env.current_contract_address()) < amount {
            return Err(PanelV2Error::InsufficientFunds);
        }
        token.transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, case_id: u64, actor: Address) {
        PanelEvent {
            kind: Symbol::new(env, kind),
            case_id,
            actor,
        }
        .publish(env);
    }
}
