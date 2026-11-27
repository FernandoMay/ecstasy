#![no_std]

//! Milestone escrow: a real SAC deposit released per completed milestone.
//! Each milestone is isolated: a dispute or recovery on one never unlocks
//! funds belonging to another.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MilestoneError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InvalidMilestone = 5,
    DeadlineNotPassed = 6,
    AlreadySettled = 7,
    InsufficientFunds = 8,
    DisputeNotAllowed = 9,
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
    pub id: u64,
    #[topic]
    pub index: u32,
    pub actor: Address,
}

#[contract]
pub struct MilestonesContract;

#[contractimpl]
impl MilestonesContract {
    pub fn __constructor(env: Env, asset: Address, resolver: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::Resolver, &resolver);
    }

    /// Deposit the exact sum of the milestone amounts.
    #[allow(clippy::too_many_arguments)]
    pub fn create(
        env: Env,
        caller: Address,
        recipient: Address,
        amounts: Vec<i128>,
        deadlines: Vec<u64>,
        agreement_hash: BytesN<32>,
    ) -> Result<u64, MilestoneError> {
        caller.require_auth();
        if amounts.is_empty() || amounts.len() != deadlines.len() || amounts.len() > 10 {
            return Err(MilestoneError::InvalidMilestone);
        }
        let mut total = 0i128;
        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for (index, amount) in amounts.iter().enumerate() {
            let deadline = deadlines
                .get(index as u32)
                .ok_or(MilestoneError::InvalidMilestone)?;
            if amount <= 0 || deadline <= env.ledger().timestamp() {
                return Err(MilestoneError::InvalidAmount);
            }
            total = total
                .checked_add(amount)
                .ok_or(MilestoneError::InvalidAmount)?;
            milestones.push_back(Milestone {
                amount,
                deadline,
                status: MilestoneStatus::Pending,
                evidence_hash: None,
                reason_hash: None,
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
            .ok_or(MilestoneError::InvalidState)?;
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
        MilestoneEvent {
            kind: Symbol::new(&env, "created"),
            id,
            index: 0,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Recipient submits an evidence digest for one milestone.
    pub fn submit(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        evidence_hash: BytesN<32>,
    ) -> Result<(), MilestoneError> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.recipient {
            return Err(MilestoneError::NotAuthorized);
        }
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Pending {
            return Err(MilestoneError::InvalidState);
        }
        milestone.status = MilestoneStatus::Submitted;
        milestone.evidence_hash = Some(evidence_hash);
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "submitted", agreement_id, index, caller);
        Ok(())
    }

    /// Proposer approves one milestone: only its amount is released.
    pub fn approve(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneError> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.proposer {
            return Err(MilestoneError::NotAuthorized);
        }
        let milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(MilestoneError::InvalidState);
        }
        Self::transfer(&env, &agreement.recipient, milestone.amount)?;
        let mut milestone = milestone;
        milestone.status = MilestoneStatus::Paid;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "approved", agreement_id, index, caller);
        Ok(())
    }

    /// Either party disputes a single milestone; other funds stay locked.
    pub fn dispute(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        reason_hash: BytesN<32>,
    ) -> Result<(), MilestoneError> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        if caller != agreement.proposer && caller != agreement.recipient {
            return Err(MilestoneError::NotAuthorized);
        }
        let mut milestone = Self::milestone(&agreement, index)?;
        if !matches!(
            milestone.status,
            MilestoneStatus::Pending | MilestoneStatus::Submitted
        ) {
            return Err(MilestoneError::DisputeNotAllowed);
        }
        milestone.status = MilestoneStatus::Disputed;
        milestone.reason_hash = Some(reason_hash);
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "disputed", agreement_id, index, caller);
        Ok(())
    }

    /// Resolver decides only the disputed milestone.
    pub fn resolve(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
        outcome: Outcome,
    ) -> Result<(), MilestoneError> {
        caller.require_auth();
        let resolver: Address = env.storage().instance().get(&DataKey::Resolver).unwrap();
        if caller != resolver {
            return Err(MilestoneError::NotAuthorized);
        }
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(MilestoneError::InvalidState);
        }
        match outcome {
            Outcome::Release => Self::transfer(&env, &agreement.recipient, milestone.amount)?,
            Outcome::Refund => Self::transfer(&env, &agreement.proposer, milestone.amount)?,
        }
        milestone.status = match outcome {
            Outcome::Release => MilestoneStatus::Paid,
            Outcome::Refund => MilestoneStatus::Refunded,
        };
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "resolved", agreement_id, index, caller);
        Ok(())
    }

    /// Permissionless recovery of one unresolved milestone after its deadline.
    pub fn recover(
        env: Env,
        caller: Address,
        agreement_id: u64,
        index: u32,
    ) -> Result<(), MilestoneError> {
        caller.require_auth();
        let mut agreement = Self::load(&env, agreement_id)?;
        let mut milestone = Self::milestone(&agreement, index)?;
        if matches!(
            milestone.status,
            MilestoneStatus::Paid | MilestoneStatus::Refunded | MilestoneStatus::Recovered
        ) {
            return Err(MilestoneError::AlreadySettled);
        }
        if env.ledger().timestamp() <= milestone.deadline {
            return Err(MilestoneError::DeadlineNotPassed);
        }
        Self::transfer(&env, &agreement.proposer, milestone.amount)?;
        milestone.status = MilestoneStatus::Recovered;
        Self::save(&env, &mut agreement, index, milestone);
        Self::emit(&env, "recovered", agreement_id, index, caller);
        Ok(())
    }

    pub fn get(env: Env, agreement_id: u64) -> Result<Agreement, MilestoneError> {
        Self::load(&env, agreement_id)
    }

    fn load(env: &Env, id: u64) -> Result<Agreement, MilestoneError> {
        env.storage()
            .instance()
            .get(&DataKey::Agreement(id))
            .ok_or(MilestoneError::NotFound)
    }

    fn milestone(agreement: &Agreement, index: u32) -> Result<Milestone, MilestoneError> {
        agreement
            .milestones
            .get(index)
            .ok_or(MilestoneError::InvalidMilestone)
    }

    fn save(env: &Env, agreement: &mut Agreement, index: u32, milestone: Milestone) {
        agreement.milestones.set(index, milestone);
        env.storage()
            .instance()
            .set(&DataKey::Agreement(agreement.id), agreement);
    }

    fn transfer(env: &Env, to: &Address, amount: i128) -> Result<(), MilestoneError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(env, &asset).balance(&env.current_contract_address());
        if balance < amount {
            return Err(MilestoneError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
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
