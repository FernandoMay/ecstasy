#![no_std]

//! Mutual refund protocol. Holds a real SAC asset and releases it only after
//! both parties authorize the same intent. It never moves escrow from the
//! encounters contract; it is an opt-in, separately funded agreement.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RefundError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    IntentMismatch = 4,
    InvalidAmount = 5,
    InsufficientFunds = 6,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RefundStatus {
    Pending,
    Approved,
    Rejected,
    Revoked,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Refund {
    pub id: u64,
    pub proposer: Address,
    pub counterparty: Address,
    pub recipient: Address,
    pub amount: i128,
    pub intent_hash: BytesN<32>,
    pub status: RefundStatus,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Refund(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RefundEvent {
    #[topic]
    pub kind: Symbol,
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct RefundsContract;

#[contractimpl]
impl RefundsContract {
    /// Pins the single Stellar Asset Contract used for all refunds.
    pub fn __constructor(env: Env, asset: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
    }

    /// Propose a refund and lock the amount from the proposer into this
    /// contract. The counterparty must later approve the same intent digest.
    pub fn propose(
        env: Env,
        caller: Address,
        counterparty: Address,
        recipient: Address,
        amount: i128,
        intent_hash: BytesN<32>,
    ) -> Result<u64, RefundError> {
        caller.require_auth();
        if amount <= 0 || caller == counterparty {
            return Err(RefundError::InvalidAmount);
        }
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(RefundError::InvalidState)?;
        let refund = Refund {
            id,
            proposer: caller.clone(),
            counterparty,
            recipient,
            amount,
            intent_hash,
            status: RefundStatus::Pending,
            created_at: env.ledger().timestamp(),
        };
        env.storage().instance().set(&DataKey::Refund(id), &refund);
        env.storage().instance().set(&DataKey::Counter, &id);
        RefundEvent {
            kind: Symbol::new(&env, "requested"),
            id,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Counterparty approves the exact same intent that was proposed.
    pub fn approve(
        env: Env,
        caller: Address,
        refund_id: u64,
        intent_hash: BytesN<32>,
    ) -> Result<(), RefundError> {
        caller.require_auth();
        let mut refund: Refund = env
            .storage()
            .instance()
            .get(&DataKey::Refund(refund_id))
            .ok_or(RefundError::NotFound)?;
        if caller != refund.counterparty {
            return Err(RefundError::NotAuthorized);
        }
        if refund.status != RefundStatus::Pending {
            return Err(RefundError::InvalidState);
        }
        if refund.intent_hash != intent_hash {
            return Err(RefundError::IntentMismatch);
        }
        refund.status = RefundStatus::Approved;
        env.storage()
            .instance()
            .set(&DataKey::Refund(refund_id), &refund);
        RefundEvent {
            kind: Symbol::new(&env, "approved"),
            id: refund_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Counterparty rejects: funds return to the proposer, terminal.
    pub fn reject(env: Env, caller: Address, refund_id: u64) -> Result<(), RefundError> {
        caller.require_auth();
        let mut refund: Refund = env
            .storage()
            .instance()
            .get(&DataKey::Refund(refund_id))
            .ok_or(RefundError::NotFound)?;
        if caller != refund.counterparty || refund.status != RefundStatus::Pending {
            return Err(RefundError::InvalidState);
        }
        Self::return_funds(&env, &refund, &refund.proposer)?;
        refund.status = RefundStatus::Rejected;
        env.storage()
            .instance()
            .set(&DataKey::Refund(refund_id), &refund);
        RefundEvent {
            kind: Symbol::new(&env, "rejected"),
            id: refund_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Proposer revokes before approval: funds return, terminal.
    pub fn revoke(env: Env, caller: Address, refund_id: u64) -> Result<(), RefundError> {
        caller.require_auth();
        let mut refund: Refund = env
            .storage()
            .instance()
            .get(&DataKey::Refund(refund_id))
            .ok_or(RefundError::NotFound)?;
        if caller != refund.proposer || refund.status != RefundStatus::Pending {
            return Err(RefundError::InvalidState);
        }
        Self::return_funds(&env, &refund, &refund.proposer)?;
        refund.status = RefundStatus::Revoked;
        env.storage()
            .instance()
            .set(&DataKey::Refund(refund_id), &refund);
        RefundEvent {
            kind: Symbol::new(&env, "revoked"),
            id: refund_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Execute the mutual refund: real token transfer to the recipient.
    pub fn execute(env: Env, caller: Address, refund_id: u64) -> Result<(), RefundError> {
        caller.require_auth();
        let mut refund: Refund = env
            .storage()
            .instance()
            .get(&DataKey::Refund(refund_id))
            .ok_or(RefundError::NotFound)?;
        if caller != refund.proposer && caller != refund.counterparty {
            return Err(RefundError::NotAuthorized);
        }
        if refund.status != RefundStatus::Approved {
            return Err(RefundError::InvalidState);
        }
        Self::return_funds(&env, &refund, &refund.recipient)?;
        refund.status = RefundStatus::Refunded;
        env.storage()
            .instance()
            .set(&DataKey::Refund(refund_id), &refund);
        RefundEvent {
            kind: Symbol::new(&env, "refunded"),
            id: refund_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    fn return_funds(env: &Env, refund: &Refund, to: &Address) -> Result<(), RefundError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(env, &asset).balance(&env.current_contract_address());
        if balance < refund.amount {
            return Err(RefundError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &refund.amount,
        );
        Ok(())
    }

    pub fn get(env: Env, refund_id: u64) -> Result<Refund, RefundError> {
        env.storage()
            .instance()
            .get(&DataKey::Refund(refund_id))
            .ok_or(RefundError::NotFound)
    }
}
