#![no_std]

//! Escrow Arbitration Protocol: a resolver with explicitly bounded authority
//! decides how a real SAC deposit is distributed. It does not decide whether
//! off-chain facts are true; it publishes an economically enforceable outcome.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ArbitrationError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    DeadlinePassed = 4,
    AlreadyArgued = 5,
    InvalidAmount = 6,
    InvalidDeadline = 7,
    InsufficientFunds = 8,
    InvalidOutcome = 9,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CaseStatus {
    Open,
    Resolved,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Outcome {
    Release,
    Refund,
    Split,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Case {
    pub id: u64,
    pub agreement_id: u64,
    pub proposer: Address,
    pub counterparty: Address,
    pub recipient: Address,
    pub amount: i128,
    pub evidence_hash: BytesN<32>,
    pub respond_by: u64,
    pub status: CaseStatus,
    pub proposer_argued: bool,
    pub counterparty_argued: bool,
    pub outcome_code: Option<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Resolver,
    Case(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArbitrationEvent {
    #[topic]
    pub kind: Symbol,
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct ArbitrationContract;

#[contractimpl]
impl ArbitrationContract {
    /// Pin the escrow asset and the only authorized resolver.
    pub fn __constructor(env: Env, asset: Address, resolver: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// Deposit real funds and open a case linked to an agreement id.
    #[allow(clippy::too_many_arguments)]
    pub fn deposit(
        env: Env,
        caller: Address,
        agreement_id: u64,
        counterparty: Address,
        recipient: Address,
        amount: i128,
        evidence_hash: BytesN<32>,
        respond_by: u64,
    ) -> Result<u64, ArbitrationError> {
        caller.require_auth();
        if amount <= 0 || caller == counterparty {
            return Err(ArbitrationError::InvalidAmount);
        }
        if respond_by <= env.ledger().timestamp() {
            return Err(ArbitrationError::InvalidDeadline);
        }
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous
            .checked_add(1)
            .ok_or(ArbitrationError::InvalidState)?;
        let case = Case {
            id,
            agreement_id,
            proposer: caller.clone(),
            counterparty,
            recipient,
            amount,
            evidence_hash,
            respond_by,
            status: CaseStatus::Open,
            proposer_argued: false,
            counterparty_argued: false,
            outcome_code: None,
        };
        env.storage().instance().set(&DataKey::Case(id), &case);
        env.storage().instance().set(&DataKey::Counter, &id);
        ArbitrationEvent {
            kind: Symbol::new(&env, "deposited"),
            id,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Submit an off-chain argument digest. Open only until `respond_by`.
    pub fn argue(
        env: Env,
        caller: Address,
        case_id: u64,
        argument_hash: BytesN<32>,
    ) -> Result<(), ArbitrationError> {
        caller.require_auth();
        let mut case: Case = env
            .storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(ArbitrationError::NotFound)?;
        if case.status != CaseStatus::Open {
            return Err(ArbitrationError::InvalidState);
        }
        if env.ledger().timestamp() > case.respond_by {
            return Err(ArbitrationError::DeadlinePassed);
        }
        let proposer = caller == case.proposer;
        let counterparty = caller == case.counterparty;
        if !proposer && !counterparty {
            return Err(ArbitrationError::NotAuthorized);
        }
        if (proposer && case.proposer_argued) || (counterparty && case.counterparty_argued) {
            return Err(ArbitrationError::AlreadyArgued);
        }
        if proposer {
            case.proposer_argued = true;
        } else {
            case.counterparty_argued = true;
        }
        let _ = argument_hash;
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        ArbitrationEvent {
            kind: Symbol::new(&env, "argued"),
            id: case_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Resolver publishes and executes the economic outcome. Single-shot.
    pub fn resolve(
        env: Env,
        caller: Address,
        case_id: u64,
        outcome: Outcome,
    ) -> Result<(), ArbitrationError> {
        caller.require_auth();
        let resolver: Address = env
            .storage()
            .instance()
            .get(&DataKey::Resolver)
            .ok_or(ArbitrationError::NotAuthorized)?;
        if caller != resolver {
            return Err(ArbitrationError::NotAuthorized);
        }
        let mut case: Case = env
            .storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(ArbitrationError::NotFound)?;
        if case.status != CaseStatus::Open {
            return Err(ArbitrationError::InvalidState);
        }

        match outcome {
            Outcome::Release => Self::transfer(&env, &case.recipient, case.amount)?,
            Outcome::Refund => Self::transfer(&env, &case.proposer, case.amount)?,
            Outcome::Split => {
                let first = case.amount / 2;
                let second = case.amount - first;
                Self::transfer(&env, &case.recipient, first)?;
                Self::transfer(&env, &case.proposer, second)?;
            }
        }

        case.status = CaseStatus::Resolved;
        case.outcome_code = Some(match outcome {
            Outcome::Release => 1,
            Outcome::Refund => 2,
            Outcome::Split => 3,
        });
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        ArbitrationEvent {
            kind: Symbol::new(&env, "resolved"),
            id: case_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    fn transfer(env: &Env, to: &Address, amount: i128) -> Result<(), ArbitrationError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(env, &asset).balance(&env.current_contract_address());
        if balance < amount {
            return Err(ArbitrationError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    pub fn get(env: Env, case_id: u64) -> Result<Case, ArbitrationError> {
        env.storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(ArbitrationError::NotFound)
    }
}
