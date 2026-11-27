#![no_std]

//! Arbitration V2. Bounded resolver authority plus a deterministic,
//! evidence-based timeout. Policy: docs/ARBITRATION_V2_POLICY.md.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol,
};

const MAX_WINDOW: u64 = 31_536_000; // one year

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ArbitrationV2Error {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InvalidDeadline = 5,
    DuplicateEvidence = 6,
    EvidenceDeadlinePassed = 7,
    TooEarly = 8,
    InsufficientFunds = 9,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CaseStatus {
    Open,
    Resolved,
    TimedOut,
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
    pub respond_by: u64,
    pub resolve_by: u64,
    pub proposer_evidence: Option<BytesN<32>>,
    pub counterparty_evidence: Option<BytesN<32>>,
    pub status: CaseStatus,
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
pub struct CaseEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub case_id: u64,
    pub actor: Address,
}

#[contract]
pub struct ArbitrationV2Contract;

#[contractimpl]
impl ArbitrationV2Contract {
    pub fn __constructor(env: Env, asset: Address, resolver: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// Deposit the exact amount and fix both deadlines on-chain.
    #[allow(clippy::too_many_arguments)]
    pub fn deposit(
        env: Env,
        caller: Address,
        agreement_id: u64,
        counterparty: Address,
        recipient: Address,
        amount: i128,
        respond_by: u64,
        resolve_by: u64,
    ) -> Result<u64, ArbitrationV2Error> {
        caller.require_auth();
        let now = env.ledger().timestamp();
        if amount <= 0 || caller == counterparty {
            return Err(ArbitrationV2Error::InvalidAmount);
        }
        if respond_by <= now
            || resolve_by <= respond_by
            || resolve_by > now.saturating_add(MAX_WINDOW)
        {
            return Err(ArbitrationV2Error::InvalidDeadline);
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
            .ok_or(ArbitrationV2Error::InvalidState)?;
        let case = Case {
            id,
            agreement_id,
            proposer: caller.clone(),
            counterparty,
            recipient,
            amount,
            respond_by,
            resolve_by,
            proposer_evidence: None,
            counterparty_evidence: None,
            status: CaseStatus::Open,
            outcome_code: None,
        };
        env.storage().instance().set(&DataKey::Case(id), &case);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "deposited", id, caller);
        Ok(id)
    }

    /// Each party records one evidence digest before `respond_by`.
    pub fn argue(
        env: Env,
        caller: Address,
        case_id: u64,
        argument_hash: BytesN<32>,
    ) -> Result<(), ArbitrationV2Error> {
        caller.require_auth();
        let mut case = Self::load(&env, case_id)?;
        if caller != case.proposer && caller != case.counterparty {
            return Err(ArbitrationV2Error::NotAuthorized);
        }
        if case.status != CaseStatus::Open || env.ledger().timestamp() > case.respond_by {
            return Err(ArbitrationV2Error::EvidenceDeadlinePassed);
        }
        if caller == case.proposer {
            if case.proposer_evidence.is_some() {
                return Err(ArbitrationV2Error::DuplicateEvidence);
            }
            case.proposer_evidence = Some(argument_hash);
        } else {
            if case.counterparty_evidence.is_some() {
                return Err(ArbitrationV2Error::DuplicateEvidence);
            }
            case.counterparty_evidence = Some(argument_hash);
        }
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        Self::emit(&env, "argued", case_id, caller);
        Ok(())
    }

    /// Resolver decides only between `respond_by` and `resolve_by`.
    pub fn resolve(
        env: Env,
        caller: Address,
        case_id: u64,
        outcome: Outcome,
    ) -> Result<(), ArbitrationV2Error> {
        caller.require_auth();
        let resolver: Address = env.storage().instance().get(&DataKey::Resolver).unwrap();
        if caller != resolver {
            return Err(ArbitrationV2Error::NotAuthorized);
        }
        let mut case = Self::load(&env, case_id)?;
        if case.status != CaseStatus::Open {
            return Err(ArbitrationV2Error::InvalidState);
        }
        let now = env.ledger().timestamp();
        if now <= case.respond_by {
            return Err(ArbitrationV2Error::TooEarly);
        }
        if now > case.resolve_by {
            return Err(ArbitrationV2Error::InvalidDeadline);
        }
        Self::settle(&env, &mut case, outcome)?;
        case.status = CaseStatus::Resolved;
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        Self::emit(&env, "resolved", case_id, caller);
        Ok(())
    }

    /// Permissionless deterministic exit after `resolve_by`.
    /// The caller has no influence over the outcome.
    pub fn timeout(env: Env, caller: Address, case_id: u64) -> Result<(), ArbitrationV2Error> {
        caller.require_auth();
        let mut case = Self::load(&env, case_id)?;
        if case.status != CaseStatus::Open {
            return Err(ArbitrationV2Error::InvalidState);
        }
        if env.ledger().timestamp() <= case.resolve_by {
            return Err(ArbitrationV2Error::TooEarly);
        }

        let outcome = match (
            case.proposer_evidence.is_some(),
            case.counterparty_evidence.is_some(),
        ) {
            (true, true) => Outcome::Split,
            (true, false) => Outcome::Refund,
            (false, true) => Outcome::Release,
            (false, false) => Outcome::Refund,
        };
        Self::settle(&env, &mut case, outcome)?;
        case.status = CaseStatus::TimedOut;
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        Self::emit(&env, "timed_out", case_id, caller);
        Ok(())
    }

    pub fn get(env: Env, case_id: u64) -> Result<Case, ArbitrationV2Error> {
        Self::load(&env, case_id)
    }

    fn settle(env: &Env, case: &mut Case, outcome: Outcome) -> Result<(), ArbitrationV2Error> {
        match outcome {
            Outcome::Release => Self::payout(env, &case.recipient, case.amount)?,
            Outcome::Refund => Self::payout(env, &case.proposer, case.amount)?,
            Outcome::Split => {
                let first = case.amount / 2;
                Self::payout(env, &case.recipient, first)?;
                Self::payout(env, &case.proposer, case.amount - first)?;
            }
        }
        case.outcome_code = Some(match outcome {
            Outcome::Release => 1,
            Outcome::Refund => 2,
            Outcome::Split => 3,
        });
        Ok(())
    }

    fn load(env: &Env, case_id: u64) -> Result<Case, ArbitrationV2Error> {
        env.storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(ArbitrationV2Error::NotFound)
    }

    fn payout(env: &Env, to: &Address, amount: i128) -> Result<(), ArbitrationV2Error> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = TokenClient::new(env, &asset);
        if token.balance(&env.current_contract_address()) < amount {
            return Err(ArbitrationV2Error::InsufficientFunds);
        }
        token.transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, case_id: u64, actor: Address) {
        CaseEvent {
            kind: Symbol::new(env, kind),
            case_id,
            actor,
        }
        .publish(env);
    }
}
