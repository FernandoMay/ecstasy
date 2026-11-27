#![no_std]

//! Reusable trust infrastructure: verifiable participation records, not scores.
//! Voting with a majority is not evidence of correctness, so this registry
//! stores participation digests and case outcomes without opinions.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReputationError {
    NotFound = 1,
    NotAuthorized = 2,
    AlreadyRegistered = 3,
    DuplicateRecord = 4,
    InvalidDuration = 5,
    InvalidSubject = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub address: Address,
    pub profile_hash: BytesN<32>,
    pub registered_at: u64,
    pub cases_recorded: u32,
    pub votes_recorded: u32,
    pub suspended_until: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CaseRecord {
    pub subject: Address,
    pub case_id: u64,
    pub source: Address,
    pub outcome_hash: BytesN<32>,
    pub recorded_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteRecord {
    pub subject: Address,
    pub case_id: u64,
    pub source: Address,
    pub participation_hash: BytesN<32>,
    pub recorded_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Authority,
    Source(Address),
    Profile(Address),
    Case(Address, u64, Address),
    Vote(Address, u64, Address),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationEvent {
    #[topic]
    pub kind: Symbol,
    pub subject: Address,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn __constructor(env: Env, authority: Address) {
        env.storage()
            .instance()
            .set(&DataKey::Authority, &authority);
    }

    /// The authority enables a source contract to write records.
    pub fn authorize_source(
        env: Env,
        caller: Address,
        source: Address,
    ) -> Result<(), ReputationError> {
        caller.require_auth();
        Self::ensure_authority(&env, &caller)?;
        env.storage()
            .instance()
            .set(&DataKey::Source(source), &true);
        Ok(())
    }

    /// A participant registers a public profile digest (never private terms).
    pub fn register(
        env: Env,
        caller: Address,
        profile_hash: BytesN<32>,
    ) -> Result<(), ReputationError> {
        caller.require_auth();
        if env
            .storage()
            .instance()
            .has(&DataKey::Profile(caller.clone()))
        {
            return Err(ReputationError::AlreadyRegistered);
        }
        let profile = Profile {
            address: caller.clone(),
            profile_hash,
            registered_at: env.ledger().timestamp(),
            cases_recorded: 0,
            votes_recorded: 0,
            suspended_until: 0,
        };
        env.storage()
            .instance()
            .set(&DataKey::Profile(caller.clone()), &profile);
        ReputationEvent {
            kind: Symbol::new(&env, "registered"),
            subject: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Record a finalized case outcome digest from an authorized writer.
    pub fn record_case(
        env: Env,
        caller: Address,
        subject: Address,
        case_id: u64,
        source: Address,
        outcome_hash: BytesN<32>,
    ) -> Result<(), ReputationError> {
        caller.require_auth();
        Self::ensure_writer(&env, &caller)?;
        let mut profile = Self::profile(&env, &subject)?;
        let key = DataKey::Case(subject.clone(), case_id, source.clone());
        if env.storage().instance().has(&key) {
            return Err(ReputationError::DuplicateRecord);
        }
        let record = CaseRecord {
            subject: subject.clone(),
            case_id,
            source,
            outcome_hash,
            recorded_at: env.ledger().timestamp(),
        };
        env.storage().instance().set(&key, &record);
        profile.cases_recorded += 1;
        env.storage()
            .instance()
            .set(&DataKey::Profile(subject.clone()), &profile);
        ReputationEvent {
            kind: Symbol::new(&env, "case_recorded"),
            subject,
        }
        .publish(&env);
        Ok(())
    }

    /// Record panel participation as a digest; the secret vote is not revealed.
    pub fn record_vote(
        env: Env,
        caller: Address,
        subject: Address,
        case_id: u64,
        source: Address,
        participation_hash: BytesN<32>,
    ) -> Result<(), ReputationError> {
        caller.require_auth();
        Self::ensure_writer(&env, &caller)?;
        let mut profile = Self::profile(&env, &subject)?;
        let key = DataKey::Vote(subject.clone(), case_id, source.clone());
        if env.storage().instance().has(&key) {
            return Err(ReputationError::DuplicateRecord);
        }
        let record = VoteRecord {
            subject: subject.clone(),
            case_id,
            source,
            participation_hash,
            recorded_at: env.ledger().timestamp(),
        };
        env.storage().instance().set(&key, &record);
        profile.votes_recorded += 1;
        env.storage()
            .instance()
            .set(&DataKey::Profile(subject.clone()), &profile);
        ReputationEvent {
            kind: Symbol::new(&env, "vote_recorded"),
            subject,
        }
        .publish(&env);
        Ok(())
    }

    /// Temporary suspension with an explicit end timestamp.
    pub fn suspend(
        env: Env,
        caller: Address,
        subject: Address,
        reason_hash: BytesN<32>,
        until: u64,
    ) -> Result<(), ReputationError> {
        caller.require_auth();
        Self::ensure_authority(&env, &caller)?;
        let mut profile = Self::profile(&env, &subject)?;
        if until <= env.ledger().timestamp() {
            return Err(ReputationError::InvalidDuration);
        }
        profile.suspended_until = until;
        let _ = reason_hash;
        env.storage()
            .instance()
            .set(&DataKey::Profile(subject.clone()), &profile);
        ReputationEvent {
            kind: Symbol::new(&env, "suspended"),
            subject,
        }
        .publish(&env);
        Ok(())
    }

    pub fn get_profile(env: Env, subject: Address) -> Result<Profile, ReputationError> {
        Self::profile(&env, &subject)
    }

    /// Eligibility is factual: registered and not currently suspended.
    pub fn get_eligibility(env: Env, subject: Address) -> bool {
        match Self::profile(&env, &subject) {
            Ok(profile) => env.ledger().timestamp() > profile.suspended_until,
            Err(_) => false,
        }
    }

    pub fn get_case(
        env: Env,
        subject: Address,
        case_id: u64,
        source: Address,
    ) -> Result<CaseRecord, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Case(subject, case_id, source))
            .ok_or(ReputationError::NotFound)
    }

    fn profile(env: &Env, subject: &Address) -> Result<Profile, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Profile(subject.clone()))
            .ok_or(ReputationError::InvalidSubject)
    }

    fn ensure_authority(env: &Env, caller: &Address) -> Result<(), ReputationError> {
        let authority: Address = env.storage().instance().get(&DataKey::Authority).unwrap();
        if caller == &authority {
            Ok(())
        } else {
            Err(ReputationError::NotAuthorized)
        }
    }

    fn ensure_writer(env: &Env, caller: &Address) -> Result<(), ReputationError> {
        let authority: Address = env.storage().instance().get(&DataKey::Authority).unwrap();
        if caller == &authority
            || env
                .storage()
                .instance()
                .get::<DataKey, bool>(&DataKey::Source(caller.clone()))
                .unwrap_or(false)
        {
            Ok(())
        } else {
            Err(ReputationError::NotAuthorized)
        }
    }
}
