#![no_std]

//! Streaming payments in real XLM. Accrual uses ledger time and integer
//! stroops; the deposit must equal rate × duration exactly, so every stroop
//! is accounted for by claims, a cancellation refund, or a final close.

use core::cmp::min;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, Env, MuxedAddress, Symbol,
};

const MAX_DURATION: u64 = 31_536_000; // one year in seconds

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StreamError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InvalidDuration = 5,
    NothingToClaim = 6,
    InsufficientFunds = 7,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum StreamStatus {
    Active,
    Paused,
    Cancelled,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    pub id: u64,
    pub payer: Address,
    pub recipient: Address,
    pub deposit: i128,
    pub rate: i128,
    pub duration: u64,
    pub start: u64,
    pub withdrawn: i128,
    pub paused_at: Option<u64>,
    pub paused_total: u64,
    pub status: StreamStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Stream(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct StreamingContract;

#[contractimpl]
impl StreamingContract {
    pub fn __constructor(env: Env, asset: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
    }

    /// Deposit real XLM. `deposit == rate * duration` is required so the
    /// stream can never strand or overdraw stroops.
    pub fn create_stream(
        env: Env,
        caller: Address,
        recipient: Address,
        deposit: i128,
        rate: i128,
        duration: u64,
    ) -> Result<u64, StreamError> {
        caller.require_auth();
        if rate <= 0 {
            return Err(StreamError::InvalidAmount);
        }
        if duration == 0 || duration > MAX_DURATION {
            return Err(StreamError::InvalidDuration);
        }
        let expected = rate
            .checked_mul(duration as i128)
            .ok_or(StreamError::InvalidAmount)?;
        if expected != deposit || deposit <= 0 {
            return Err(StreamError::InvalidAmount);
        }

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &deposit,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(StreamError::InvalidState)?;
        let stream = Stream {
            id,
            payer: caller.clone(),
            recipient,
            deposit,
            rate,
            duration,
            start: env.ledger().timestamp(),
            withdrawn: 0,
            paused_at: None,
            paused_total: 0,
            status: StreamStatus::Active,
        };
        env.storage().instance().set(&DataKey::Stream(id), &stream);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "created", id, caller);
        Ok(id)
    }

    /// Recipient withdraws accrued-but-unclaimed stroops. Repeated claims
    /// within the same interval return `NothingToClaim` (#6).
    pub fn claim(env: Env, caller: Address, stream_id: u64) -> Result<i128, StreamError> {
        caller.require_auth();
        let mut stream = Self::load(&env, stream_id)?;
        if caller != stream.recipient {
            return Err(StreamError::NotAuthorized);
        }
        if !matches!(stream.status, StreamStatus::Active | StreamStatus::Paused) {
            return Err(StreamError::InvalidState);
        }
        let due = Self::accrued(&stream, env.ledger().timestamp())
            .checked_sub(stream.withdrawn)
            .ok_or(StreamError::InvalidState)?;
        if due <= 0 {
            return Err(StreamError::NothingToClaim);
        }
        Self::transfer(&env, &stream.recipient, due)?;
        stream.withdrawn = stream
            .withdrawn
            .checked_add(due)
            .ok_or(StreamError::InvalidState)?;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);
        Self::emit(&env, "claimed", stream_id, caller);
        Ok(due)
    }

    /// Payer freezes accrual. The stream clock stops at the pause timestamp.
    pub fn pause(env: Env, caller: Address, stream_id: u64) -> Result<(), StreamError> {
        caller.require_auth();
        let mut stream = Self::load(&env, stream_id)?;
        if caller != stream.payer {
            return Err(StreamError::NotAuthorized);
        }
        if stream.status != StreamStatus::Active {
            return Err(StreamError::InvalidState);
        }
        stream.paused_at = Some(env.ledger().timestamp());
        stream.status = StreamStatus::Paused;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);
        Self::emit(&env, "paused", stream_id, caller);
        Ok(())
    }

    /// Payer restarts accrual, accounting for every paused second.
    pub fn resume(env: Env, caller: Address, stream_id: u64) -> Result<(), StreamError> {
        caller.require_auth();
        let mut stream = Self::load(&env, stream_id)?;
        if caller != stream.payer {
            return Err(StreamError::NotAuthorized);
        }
        if stream.status != StreamStatus::Paused {
            return Err(StreamError::InvalidState);
        }
        let paused_at = stream.paused_at.ok_or(StreamError::InvalidState)?;
        let now = env.ledger().timestamp();
        if now < paused_at {
            return Err(StreamError::InvalidState);
        }
        stream.paused_total = stream
            .paused_total
            .checked_add(now - paused_at)
            .ok_or(StreamError::InvalidState)?;
        stream.paused_at = None;
        stream.status = StreamStatus::Active;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);
        Self::emit(&env, "resumed", stream_id, caller);
        Ok(())
    }

    /// Either party ends the stream: accrued stroops go to the recipient,
    /// the untouched remainder returns to the payer. Terminal.
    pub fn cancel(env: Env, caller: Address, stream_id: u64) -> Result<(), StreamError> {
        caller.require_auth();
        let mut stream = Self::load(&env, stream_id)?;
        if caller != stream.payer && caller != stream.recipient {
            return Err(StreamError::NotAuthorized);
        }
        if !matches!(stream.status, StreamStatus::Active | StreamStatus::Paused) {
            return Err(StreamError::InvalidState);
        }
        let accrued = Self::accrued(&stream, env.ledger().timestamp());
        let due = accrued - stream.withdrawn;
        let remaining = stream.deposit - accrued;
        if due > 0 {
            Self::transfer(&env, &stream.recipient, due)?;
        }
        if remaining > 0 {
            Self::transfer(&env, &stream.payer, remaining)?;
        }
        stream.withdrawn = accrued;
        stream.paused_at = None;
        stream.status = StreamStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);
        Self::emit(&env, "cancelled", stream_id, caller);
        Ok(())
    }

    /// Permissionless close of a fully vested stream. Terminal.
    pub fn close(env: Env, caller: Address, stream_id: u64) -> Result<(), StreamError> {
        caller.require_auth();
        let mut stream = Self::load(&env, stream_id)?;
        if !matches!(stream.status, StreamStatus::Active | StreamStatus::Paused) {
            return Err(StreamError::InvalidState);
        }
        if stream.withdrawn != stream.deposit {
            return Err(StreamError::InvalidState);
        }
        stream.paused_at = None;
        stream.status = StreamStatus::Closed;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);
        Self::emit(&env, "closed", stream_id, caller);
        Ok(())
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, StreamError> {
        Self::load(&env, stream_id)
    }

    /// Currently claimable stroops, computed from ledger time only.
    pub fn claimable(env: Env, stream_id: u64) -> Result<i128, StreamError> {
        let stream = Self::load(&env, stream_id)?;
        if !matches!(stream.status, StreamStatus::Active | StreamStatus::Paused) {
            return Ok(0);
        }
        Ok(Self::accrued(&stream, env.ledger().timestamp()) - stream.withdrawn)
    }

    fn accrued(stream: &Stream, now: u64) -> i128 {
        // While paused the clock freezes at paused_at - paused_total.
        let effective = match stream.paused_at {
            Some(at) => at.saturating_sub(stream.paused_total),
            None => now.saturating_sub(stream.paused_total),
        };
        let elapsed = min(effective.saturating_sub(stream.start), stream.duration);
        min((elapsed as i128) * stream.rate, stream.deposit)
    }

    fn load(env: &Env, stream_id: u64) -> Result<Stream, StreamError> {
        env.storage()
            .instance()
            .get(&DataKey::Stream(stream_id))
            .ok_or(StreamError::NotFound)
    }

    fn transfer(env: &Env, to: &Address, amount: i128) -> Result<(), StreamError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        if TokenClient::new(env, &asset).balance(&env.current_contract_address()) < amount {
            return Err(StreamError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, id: u64, actor: Address) {
        StreamEvent {
            kind: Symbol::new(env, kind),
            id,
            actor,
        }
        .publish(env);
    }
}
