#![no_std]

//! Timeout recovery protocol: a bilateral escrow with an on-chain deadline.
//! Before expiry the normal mutual-approval flow applies. After expiry, any
//! account may recover the funds to the proposer, so a missing counterparty
//! cannot lock the deposit forever.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RecoveryError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    IntentMismatch = 4,
    InvalidAmount = 5,
    InvalidExpiry = 6,
    StillPending = 7,
    InsufficientFunds = 8,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Executed,
    Recovered,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub counterparty: Address,
    pub recipient: Address,
    pub amount: i128,
    pub intent_hash: BytesN<32>,
    pub expires_at: u64,
    pub created_at: u64,
    pub status: ProposalStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Proposal(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecoveryEvent {
    #[topic]
    pub kind: Symbol,
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct RecoveryContract;

#[contractimpl]
impl RecoveryContract {
    pub fn __constructor(env: Env, asset: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
    }

    /// Deposit real SAC funds and fix the deadline for mutual approval.
    pub fn propose(
        env: Env,
        caller: Address,
        counterparty: Address,
        recipient: Address,
        amount: i128,
        intent_hash: BytesN<32>,
        expires_at: u64,
    ) -> Result<u64, RecoveryError> {
        caller.require_auth();
        if amount <= 0 || caller == counterparty {
            return Err(RecoveryError::InvalidAmount);
        }
        if expires_at <= env.ledger().timestamp() {
            return Err(RecoveryError::InvalidExpiry);
        }
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(RecoveryError::InvalidState)?;
        let proposal = Proposal {
            id,
            proposer: caller.clone(),
            counterparty,
            recipient,
            amount,
            intent_hash,
            expires_at,
            created_at: env.ledger().timestamp(),
            status: ProposalStatus::Pending,
        };
        env.storage()
            .instance()
            .set(&DataKey::Proposal(id), &proposal);
        env.storage().instance().set(&DataKey::Counter, &id);
        RecoveryEvent {
            kind: Symbol::new(&env, "proposed"),
            id,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Approve the same intent before the deadline.
    pub fn approve(
        env: Env,
        caller: Address,
        proposal_id: u64,
        intent_hash: BytesN<32>,
    ) -> Result<(), RecoveryError> {
        caller.require_auth();
        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(RecoveryError::NotFound)?;
        if caller != proposal.counterparty {
            return Err(RecoveryError::NotAuthorized);
        }
        if proposal.status != ProposalStatus::Pending
            || env.ledger().timestamp() > proposal.expires_at
        {
            return Err(RecoveryError::InvalidState);
        }
        if proposal.intent_hash != intent_hash {
            return Err(RecoveryError::IntentMismatch);
        }
        proposal.status = ProposalStatus::Approved;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        RecoveryEvent {
            kind: Symbol::new(&env, "approved"),
            id: proposal_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Execute an approved transfer, only before expiry.
    pub fn execute(env: Env, caller: Address, proposal_id: u64) -> Result<(), RecoveryError> {
        caller.require_auth();
        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(RecoveryError::NotFound)?;
        if caller != proposal.proposer && caller != proposal.counterparty {
            return Err(RecoveryError::NotAuthorized);
        }
        if proposal.status != ProposalStatus::Approved
            || env.ledger().timestamp() > proposal.expires_at
        {
            return Err(RecoveryError::InvalidState);
        }
        Self::transfer(&env, &proposal, &proposal.recipient)?;
        proposal.status = ProposalStatus::Executed;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        RecoveryEvent {
            kind: Symbol::new(&env, "executed"),
            id: proposal_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Permissionless recovery after expiry. Funds always return to the
    /// proposer, never to the caller. Terminal and single-shot.
    pub fn recover(env: Env, caller: Address, proposal_id: u64) -> Result<(), RecoveryError> {
        caller.require_auth();
        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(RecoveryError::NotFound)?;
        if !matches!(
            proposal.status,
            ProposalStatus::Pending | ProposalStatus::Approved
        ) {
            return Err(RecoveryError::InvalidState);
        }
        if env.ledger().timestamp() <= proposal.expires_at {
            return Err(RecoveryError::StillPending);
        }
        Self::transfer(&env, &proposal, &proposal.proposer)?;
        proposal.status = ProposalStatus::Recovered;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        RecoveryEvent {
            kind: Symbol::new(&env, "recovered"),
            id: proposal_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    fn transfer(env: &Env, proposal: &Proposal, to: &Address) -> Result<(), RecoveryError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(env, &asset).balance(&env.current_contract_address());
        if balance < proposal.amount {
            return Err(RecoveryError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &proposal.amount,
        );
        Ok(())
    }

    pub fn get(env: Env, proposal_id: u64) -> Result<Proposal, RecoveryError> {
        env.storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(RecoveryError::NotFound)
    }
}
