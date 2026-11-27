#![no_std]

//! Milestone escrow V2. Fix for SEC-02: `Disputed` is frozen and can never be
//! recovered by a permissionless call. Every non-terminal milestone has
//! exactly one legitimate, time-bounded exit.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol, Vec,
};

/// Window after `dispute` during which the resolver may decide.
const DISPUTE_WINDOW: u64 = 300;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MilestoneV2Error {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InvalidMilestone = 5,
    DeadlineNotPassed = 6,
    AlreadySettled = 7,
    InsufficientFunds = 8,
    DisputeNotAllowed = 9,
    DisputeActive = 10,
    DeadlinePassed = 11,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Paid,
    Disputed,
    Refunded,
    Recovered,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Outcome {
    Release,
    Refund,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub amount: i128,
    pub deadline: u64,
    pub status: MilestoneStatus,
    pub evidence_hash: Option<BytesN<32>>,
    pub reason_hash: Option<BytesN<32>>,
    pub dispute_deadline: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Agreement {
    pub id: u64,
    pub proposer: Address,
    pub recipient: Address,
    pub agreement_hash: BytesN<32>,
    pub total: i128,
    pub milestones: Vec<Milestone>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Resolver,
    Agreement(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub id: u64,
    #[topic]
    pub index: u32,
    pub actor: Address,
}

#[contract]
pub struct MilestonesV2Contract;

#[contractimpl]
impl MilestonesV2Contract {
    pub fn __constructor(env: Env, asset: Address, resolver: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// The deposit must equal the exact sum of milestone amounts.
    #[allow(clippy::too_many_arguments)]
    pub fn create(
        env: Env,
        caller: Address,
        recipient: Address,
        amounts: Vec<i128>,
        deadlines: Vec<u64>,
        agreement_hash: BytesN<32>,
    ) -> Result<u64, MilestoneV2Error> {
        caller.require_auth();
        if amounts.is_empty() || amounts.len() != deadlines.len() || amounts.len() > 10 {
            return Err(MilestoneV2Error::InvalidMilestone);
        }
        let now = env.ledger().timestamp();
        let mut total = 0i128;
        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for index in 0..amounts.len() {
            let amount = amounts
                .get(index)
                .ok_or(MilestoneV2Error::InvalidMilestone)?;
            let deadline = deadlines
                .get(index)
                .ok_or(MilestoneV2Error::InvalidMilestone)?;
            if amount <= 0 || deadline <= now {
                return Err(MilestoneV2Error::InvalidAmount);
            }
            total = total
                .checked_add(amount)
                .ok_or(MilestoneV2Error::InvalidAmount)?;
            milestones.push_back(Milestone {
                amount,
                deadline,
                status: MilestoneStatus::Pending,
                evidence_hash: None,
                reason_hash: None,
                dispute_deadline: None,
            });
        }

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &total,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous
            .checked_add(1)
            .ok_or(MilestoneV2Error::InvalidState)?;
        let agreement = Agreement {
            id,
            proposer: caller.clone(),
            recipient,
            agreement_hash,
            total,
            milestones,
        };
        env.storage()
            .instance()
            .set(&DataKey::Agreement(id), &agreement);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "created", id, 0, caller);
        Ok(id)
    }

    pub fn submit(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        evidence_hash: BytesN<32>,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.recipient {
            return Err(MilestoneV2Error::NotAuthorized);
        }
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Pending {
            return Err(MilestoneV2Error::InvalidState);
        }
        milestone.status = MilestoneStatus::Submitted;
        milestone.evidence_hash = Some(evidence_hash);
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "submitted", agreement_id, index, caller);
        Ok(())
    }

    /// Explicit approval pays only this milestone. Still available before the deadline.
    pub fn approve(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.proposer {
            return Err(MilestoneV2Error::NotAuthorized);
        }
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(MilestoneV2Error::InvalidState);
        }
        Self::payout(&env, &agreement.recipient, milestone.amount)?;
        milestone.status = MilestoneStatus::Paid;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "approved", agreement_id, index, caller);
        Ok(())
    }

    pub fn dispute(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        reason_hash: BytesN<32>,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.proposer && caller != agreement.recipient {
            return Err(MilestoneV2Error::NotAuthorized);
        }
        let mut milestone = Self::milestone(&agreement, index)?;
        if !matches!(
            milestone.status,
            MilestoneStatus::Pending | MilestoneStatus::Submitted
        ) {
            return Err(MilestoneV2Error::DisputeNotAllowed);
        }
        milestone.status = MilestoneStatus::Disputed;
        milestone.reason_hash = Some(reason_hash);
        milestone.dispute_deadline = Some(
            env.ledger()
                .timestamp()
                .checked_add(DISPUTE_WINDOW)
                .ok_or(MilestoneV2Error::InvalidState)?,
        );
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "disputed", agreement_id, index, caller);
        Ok(())
    }

    /// Resolver decides a disputed milestone, only within the dispute window.
    pub fn resolve(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        outcome: Outcome,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let resolver: Address = env.storage().instance().get(&DataKey::Resolver).unwrap();
        if caller != resolver {
            return Err(MilestoneV2Error::NotAuthorized);
        }
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(MilestoneV2Error::InvalidState);
        }
        let dispute_deadline = milestone
            .dispute_deadline
            .ok_or(MilestoneV2Error::InvalidState)?;
        if env.ledger().timestamp() > dispute_deadline {
            return Err(MilestoneV2Error::DeadlinePassed);
        }
        match outcome {
            Outcome::Release => Self::payout(&env, &agreement.recipient, milestone.amount)?,
            Outcome::Refund => Self::payout(&env, &agreement.proposer, milestone.amount)?,
        }
        milestone.status = match outcome {
            Outcome::Release => MilestoneStatus::Paid,
            Outcome::Refund => MilestoneStatus::Refunded,
        };
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "resolved", agreement_id, index, caller);
        Ok(())
    }

    /// SEC-02 fix: only Pending milestones are recoverable. Disputed and
    /// Submitted can never be recovered by a permissionless call.
    pub fn recover(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        match milestone.status {
            MilestoneStatus::Disputed => return Err(MilestoneV2Error::DisputeActive),
            MilestoneStatus::Submitted => return Err(MilestoneV2Error::InvalidState),
            MilestoneStatus::Paid | MilestoneStatus::Refunded | MilestoneStatus::Recovered => {
                return Err(MilestoneV2Error::AlreadySettled)
            }
            MilestoneStatus::Pending => {}
        }
        if env.ledger().timestamp() <= milestone.deadline {
            return Err(MilestoneV2Error::DeadlineNotPassed);
        }
        Self::payout(&env, &agreement.proposer, milestone.amount)?;
        milestone.status = MilestoneStatus::Recovered;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "recovered", agreement_id, index, caller);
        Ok(())
    }

    /// Legitimate exit for a delivered but unapproved milestone: after its
    /// deadline, the recorded delivery is honoured if no dispute was raised.
    pub fn settle_after_deadline(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(MilestoneV2Error::InvalidState);
        }
        if env.ledger().timestamp() <= milestone.deadline {
            return Err(MilestoneV2Error::DeadlineNotPassed);
        }
        Self::payout(&env, &agreement.recipient, milestone.amount)?;
        milestone.status = MilestoneStatus::Paid;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "settled_late", agreement_id, index, caller);
        Ok(())
    }

    /// Guaranteed exit for a disputed milestone when the resolver disappears.
    pub fn timeout_refund(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneV2Error> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(MilestoneV2Error::InvalidState);
        }
        let dispute_deadline = milestone
            .dispute_deadline
            .ok_or(MilestoneV2Error::InvalidState)?;
        if env.ledger().timestamp() <= dispute_deadline {
            return Err(MilestoneV2Error::DeadlineNotPassed);
        }
        Self::payout(&env, &agreement.proposer, milestone.amount)?;
        milestone.status = MilestoneStatus::Refunded;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "timeout_refunded", agreement_id, index, caller);
        Ok(())
    }

    pub fn get(env: Env, agreement_id: u64) -> Result<Agreement, MilestoneV2Error> {
        Self::load(&env, agreement_id)
    }

    fn load(env: &Env, agreement_id: u64) -> Result<Agreement, MilestoneV2Error> {
        env.storage()
            .instance()
            .get(&DataKey::Agreement(agreement_id))
            .ok_or(MilestoneV2Error::NotFound)
    }

    fn milestone(agreement: &Agreement, index: u32) -> Result<Milestone, MilestoneV2Error> {
        agreement
            .milestones
            .get(index)
            .ok_or(MilestoneV2Error::InvalidMilestone)
    }

    fn save(env: &Env, agreement: &mut Agreement, index: u32, milestone: Milestone) {
        agreement.milestones.set(index, milestone);
        env.storage()
            .instance()
            .set(&DataKey::Agreement(agreement.id), agreement);
    }

    fn payout(env: &Env, to: &Address, amount: i128) -> Result<(), MilestoneV2Error> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = TokenClient::new(env, &asset);
        if token.balance(&env.current_contract_address()) < amount {
            return Err(MilestoneV2Error::InsufficientFunds);
        }
        token.transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, id: u64, index: u32, actor: Address) {
        MilestoneEvent {
            kind: Symbol::new(env, kind),
            id,
            index,
            actor,
        }
        .publish(env);
    }
}
