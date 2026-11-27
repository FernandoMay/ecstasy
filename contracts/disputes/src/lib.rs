#![no_std]

//! Dispute registry: a neutral, code-gated record of a contested encounter.
//! It does not move escrow or decide real-world facts: it records who opened
//! a dispute, the responses and the resolver's published outcome, with events
//! suitable for external verification.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum DisputeError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    AlreadyResponded = 4,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DisputeStatus {
    Open,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub id: u64,
    pub encounter_id: u64,
    pub opener: Address,
    pub counterparty: Address,
    pub reason_hash: BytesN<32>,
    pub status: DisputeStatus,
    pub opener_responded: bool,
    pub counterparty_responded: bool,
    pub opener_response: Option<BytesN<32>>,
    pub counterparty_response: Option<BytesN<32>>,
    pub opened_at: u64,
    pub outcome_hash: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Resolver,
    Dispute(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeEvent {
    #[topic]
    pub kind: Symbol,
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct DisputesContract;

#[contractimpl]
impl DisputesContract {
    /// Pins the resolver that may publish outcomes.
    pub fn __constructor(env: Env, resolver: Address) {
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// Open a dispute for an encounter id. Any authenticated party may open
    /// one; the counterparty and the reason digest are recorded on-chain.
    pub fn open(
        env: Env,
        caller: Address,
        encounter_id: u64,
        counterparty: Address,
        reason_hash: BytesN<32>,
    ) -> Result<u64, DisputeError> {
        caller.require_auth();
        if caller == counterparty {
            return Err(DisputeError::NotAuthorized);
        }
        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(DisputeError::InvalidState)?;
        let dispute = Dispute {
            id,
            encounter_id,
            opener: caller.clone(),
            counterparty: counterparty.clone(),
            reason_hash,
            status: DisputeStatus::Open,
            opener_responded: false,
            counterparty_responded: false,
            opener_response: None,
            counterparty_response: None,
            opened_at: env.ledger().timestamp(),
            outcome_hash: None,
        };
        env.storage()
            .instance()
            .set(&DataKey::Dispute(id), &dispute);
        env.storage().instance().set(&DataKey::Counter, &id);
        DisputeEvent {
            kind: Symbol::new(&env, "opened"),
            id,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Record one party's response digest. Both parties may respond once.
    pub fn respond(
        env: Env,
        caller: Address,
        dispute_id: u64,
        response_hash: BytesN<32>,
    ) -> Result<(), DisputeError> {
        caller.require_auth();
        let mut dispute: Dispute = env
            .storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .ok_or(DisputeError::NotFound)?;
        if dispute.status != DisputeStatus::Open {
            return Err(DisputeError::InvalidState);
        }
        let opener = caller == dispute.opener;
        let counterparty = caller == dispute.counterparty;
        if !opener && !counterparty {
            return Err(DisputeError::NotAuthorized);
        }
        if (opener && dispute.opener_responded) || (counterparty && dispute.counterparty_responded)
        {
            return Err(DisputeError::AlreadyResponded);
        }
        if opener {
            dispute.opener_responded = true;
            dispute.opener_response = Some(response_hash);
        } else {
            dispute.counterparty_responded = true;
            dispute.counterparty_response = Some(response_hash);
        }
        env.storage()
            .instance()
            .set(&DataKey::Dispute(dispute_id), &dispute);
        DisputeEvent {
            kind: Symbol::new(&env, "responded"),
            id: dispute_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Resolver publishes the outcome digest. Terminal transition.
    pub fn resolve(
        env: Env,
        caller: Address,
        dispute_id: u64,
        outcome_hash: BytesN<32>,
    ) -> Result<(), DisputeError> {
        caller.require_auth();
        let resolver: Address = env
            .storage()
            .instance()
            .get(&DataKey::Resolver)
            .ok_or(DisputeError::NotAuthorized)?;
        if caller != resolver {
            return Err(DisputeError::NotAuthorized);
        }
        let mut dispute: Dispute = env
            .storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .ok_or(DisputeError::NotFound)?;
        if dispute.status != DisputeStatus::Open {
            return Err(DisputeError::InvalidState);
        }
        dispute.status = DisputeStatus::Resolved;
        dispute.outcome_hash = Some(outcome_hash);
        env.storage()
            .instance()
            .set(&DataKey::Dispute(dispute_id), &dispute);
        DisputeEvent {
            kind: Symbol::new(&env, "resolved"),
            id: dispute_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    pub fn get(env: Env, dispute_id: u64) -> Result<Dispute, DisputeError> {
        env.storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .ok_or(DisputeError::NotFound)
    }
}
