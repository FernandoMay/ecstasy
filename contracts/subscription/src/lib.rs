#![no_std]

//! Subscription & recurring escrow. Each period is funded by an explicit,
//! signed XLM deposit; there is no automatic debit and no executable debt
//! against the payer. A dispute blocks only its own period.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol, Vec,
};

const MAX_FREQUENCY: u64 = 31_536_000; // one year in seconds

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SubscriptionError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InvalidFrequency = 5,
    DuplicatePeriod = 6,
    PlanCancelled = 7,
    InvalidDueDate = 8,
    InsufficientFunds = 9,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PeriodStatus {
    Funded,
    Submitted,
    Approved,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Outcome {
    Release,
    Refund,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Period {
    pub plan_id: u64,
    pub period_id: u32,
    pub due_at: u64,
    pub amount: i128,
    pub status: PeriodStatus,
    pub delivery_hash: Option<BytesN<32>>,
    pub reason_hash: Option<BytesN<32>>,
    pub funded_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Plan {
    pub id: u64,
    pub payer: Address,
    pub recipient: Address,
    pub amount: i128,
    pub frequency: u64,
    pub created_at: u64,
    pub cancelled: bool,
    pub period_ids: Vec<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Resolver,
    Plan(u64),
    Period(u64, u32),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SubscriptionEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub plan_id: u64,
    pub period_id: u32,
    pub actor: Address,
}

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn __constructor(env: Env, asset: Address, resolver: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// Define terms only. No funds move here and no debt is created.
    pub fn create_plan(
        env: Env,
        caller: Address,
        recipient: Address,
        amount: i128,
        frequency: u64,
    ) -> Result<u64, SubscriptionError> {
        caller.require_auth();
        if amount <= 0 {
            return Err(SubscriptionError::InvalidAmount);
        }
        if frequency == 0 || frequency > MAX_FREQUENCY {
            return Err(SubscriptionError::InvalidFrequency);
        }
        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous
            .checked_add(1)
            .ok_or(SubscriptionError::InvalidState)?;
        let plan = Plan {
            id,
            payer: caller.clone(),
            recipient,
            amount,
            frequency,
            created_at: env.ledger().timestamp(),
            cancelled: false,
            period_ids: Vec::new(&env),
        };
        env.storage().instance().set(&DataKey::Plan(id), &plan);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "plan_created", id, 0, caller);
        Ok(id)
    }

    /// Explicitly fund one period with real XLM from the payer.
    pub fn fund_period(
        env: Env,
        caller: Address,
        plan_id: u64,
        period_id: u32,
        due_at: u64,
    ) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let mut plan = Self::plan(&env, plan_id)?;
        if caller != plan.payer {
            return Err(SubscriptionError::NotAuthorized);
        }
        if plan.cancelled {
            return Err(SubscriptionError::PlanCancelled);
        }
        let now = env.ledger().timestamp();
        if due_at <= now {
            return Err(SubscriptionError::InvalidDueDate);
        }
        let key = DataKey::Period(plan_id, period_id);
        if env.storage().instance().has(&key) {
            return Err(SubscriptionError::DuplicatePeriod);
        }
        Self::deposit(&env, &caller, plan.amount)?;
        let period = Period {
            plan_id,
            period_id,
            due_at,
            amount: plan.amount,
            status: PeriodStatus::Funded,
            delivery_hash: None,
            reason_hash: None,
            funded_at: now,
        };
        env.storage().instance().set(&key, &period);
        plan.period_ids.push_back(period_id);
        env.storage().instance().set(&DataKey::Plan(plan_id), &plan);
        Self::emit(&env, "period_funded", plan_id, period_id, caller);
        Ok(())
    }

    /// The recipient registers an evidence digest for one funded period.
    pub fn submit_delivery(
        env: Env,
        caller: Address,
        plan_id: u64,
        period_id: u32,
        delivery_hash: BytesN<32>,
    ) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let plan = Self::plan(&env, plan_id)?;
        if caller != plan.recipient {
            return Err(SubscriptionError::NotAuthorized);
        }
        let mut period = Self::period(&env, plan_id, period_id)?;
        if period.status != PeriodStatus::Funded {
            return Err(SubscriptionError::InvalidState);
        }
        period.status = PeriodStatus::Submitted;
        period.delivery_hash = Some(delivery_hash);
        env.storage()
            .instance()
            .set(&DataKey::Period(plan_id, period_id), &period);
        Self::emit(&env, "delivery_submitted", plan_id, period_id, caller);
        Ok(())
    }

    /// The payer releases exactly one period's amount.
    pub fn approve(
        env: Env,
        caller: Address,
        plan_id: u64,
        period_id: u32,
    ) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let plan = Self::plan(&env, plan_id)?;
        if caller != plan.payer {
            return Err(SubscriptionError::NotAuthorized);
        }
        let mut period = Self::period(&env, plan_id, period_id)?;
        if period.status != PeriodStatus::Submitted {
            return Err(SubscriptionError::InvalidState);
        }
        Self::payout(&env, &plan.recipient, period.amount)?;
        period.status = PeriodStatus::Approved;
        env.storage()
            .instance()
            .set(&DataKey::Period(plan_id, period_id), &period);
        Self::emit(&env, "period_approved", plan_id, period_id, caller);
        Ok(())
    }

    /// Either party blocks one period without touching the others.
    pub fn dispute(
        env: Env,
        caller: Address,
        plan_id: u64,
        period_id: u32,
        reason_hash: BytesN<32>,
    ) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let plan = Self::plan(&env, plan_id)?;
        if caller != plan.payer && caller != plan.recipient {
            return Err(SubscriptionError::NotAuthorized);
        }
        let mut period = Self::period(&env, plan_id, period_id)?;
        if !matches!(
            period.status,
            PeriodStatus::Funded | PeriodStatus::Submitted
        ) {
            return Err(SubscriptionError::InvalidState);
        }
        period.status = PeriodStatus::Disputed;
        period.reason_hash = Some(reason_hash);
        env.storage()
            .instance()
            .set(&DataKey::Period(plan_id, period_id), &period);
        Self::emit(&env, "period_disputed", plan_id, period_id, caller);
        Ok(())
    }

    /// The designated resolver settles one disputed period. Terminal.
    pub fn resolve_dispute(
        env: Env,
        caller: Address,
        plan_id: u64,
        period_id: u32,
        outcome: Outcome,
    ) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let resolver: Address = env.storage().instance().get(&DataKey::Resolver).unwrap();
        if caller != resolver {
            return Err(SubscriptionError::NotAuthorized);
        }
        let plan = Self::plan(&env, plan_id)?;
        let mut period = Self::period(&env, plan_id, period_id)?;
        if period.status != PeriodStatus::Disputed {
            return Err(SubscriptionError::InvalidState);
        }
        match outcome {
            Outcome::Release => Self::payout(&env, &plan.recipient, period.amount)?,
            Outcome::Refund => Self::payout(&env, &plan.payer, period.amount)?,
        }
        period.status = match outcome {
            Outcome::Release => PeriodStatus::Approved,
            Outcome::Refund => PeriodStatus::Refunded,
        };
        env.storage()
            .instance()
            .set(&DataKey::Period(plan_id, period_id), &period);
        Self::emit(&env, "dispute_resolved", plan_id, period_id, caller);
        Ok(())
    }

    /// Stop future periods. Already-funded periods remain executable.
    pub fn cancel_plan(env: Env, caller: Address, plan_id: u64) -> Result<(), SubscriptionError> {
        caller.require_auth();
        let mut plan = Self::plan(&env, plan_id)?;
        if caller != plan.payer {
            return Err(SubscriptionError::NotAuthorized);
        }
        if plan.cancelled {
            return Err(SubscriptionError::InvalidState);
        }
        plan.cancelled = true;
        env.storage().instance().set(&DataKey::Plan(plan_id), &plan);
        Self::emit(&env, "plan_cancelled", plan_id, 0, caller);
        Ok(())
    }

    pub fn get_plan(env: Env, plan_id: u64) -> Result<Plan, SubscriptionError> {
        Self::plan(&env, plan_id)
    }

    pub fn get_period(env: Env, plan_id: u64, period_id: u32) -> Result<Period, SubscriptionError> {
        Self::period(&env, plan_id, period_id)
    }

    /// Verifiable history of every period created under a plan.
    pub fn get_periods(env: Env, plan_id: u64) -> Result<Vec<Period>, SubscriptionError> {
        let plan = Self::plan(&env, plan_id)?;
        let mut periods = Vec::new(&env);
        for id in plan.period_ids.iter() {
            periods.push_back(Self::period(&env, plan_id, id)?);
        }
        Ok(periods)
    }

    fn plan(env: &Env, plan_id: u64) -> Result<Plan, SubscriptionError> {
        env.storage()
            .instance()
            .get(&DataKey::Plan(plan_id))
            .ok_or(SubscriptionError::NotFound)
    }

    fn period(env: &Env, plan_id: u64, period_id: u32) -> Result<Period, SubscriptionError> {
        env.storage()
            .instance()
            .get(&DataKey::Period(plan_id, period_id))
            .ok_or(SubscriptionError::NotFound)
    }

    fn deposit(env: &Env, from: &Address, amount: i128) -> Result<(), SubscriptionError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(env, &asset).transfer(
            from,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );
        Ok(())
    }

    fn payout(env: &Env, to: &Address, amount: i128) -> Result<(), SubscriptionError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = TokenClient::new(env, &asset);
        if token.balance(&env.current_contract_address()) < amount {
            return Err(SubscriptionError::InsufficientFunds);
        }
        token.transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, plan_id: u64, period_id: u32, actor: Address) {
        SubscriptionEvent {
            kind: Symbol::new(env, kind),
            plan_id,
            period_id,
            actor,
        }
        .publish(env);
    }
}
