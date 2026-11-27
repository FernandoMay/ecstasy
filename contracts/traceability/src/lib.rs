#![no_std]

//! Common reference chain across ECSTASY contracts:
//! agreement_id → escrow_id → case_id → arbitration_id → settlement_tx.
//! One queryable record reconstructs an agreement's full lifecycle without
//! each screen rebuilding the relationships separately.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TraceError {
    NotFound = 1,
    NotAuthorized = 2,
    Duplicate = 3,
    InvalidReference = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChainRecord {
    pub agreement_id: u64,
    pub escrow_id: u64,
    pub case_id: u64,
    pub arbitration_id: u64,
    /// 32-byte hash of the real settlement transaction on Testnet.
    pub settlement_tx: BytesN<32>,
    pub recorded_at: u64,
    pub writer: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Authority,
    Writer(Address),
    Chain(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TraceEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub agreement_id: u64,
    pub writer: Address,
}

#[contract]
pub struct TraceabilityContract;

#[contractimpl]
impl TraceabilityContract {
    pub fn __constructor(env: Env, authority: Address) {
        env.storage()
            .instance()
            .set(&DataKey::Authority, &authority);
    }

    /// The authority enables a contract or account to write chain records.
    pub fn authorize_writer(env: Env, caller: Address, writer: Address) -> Result<(), TraceError> {
        caller.require_auth();
        Self::ensure_authority(&env, &caller)?;
        env.storage()
            .instance()
            .set(&DataKey::Writer(writer), &true);
        Ok(())
    }

    /// Link the lifecycle of an agreement. Only authorized writers may write,
    /// and an agreement_id may only be linked once.
    #[allow(clippy::too_many_arguments)]
    pub fn link(
        env: Env,
        caller: Address,
        agreement_id: u64,
        escrow_id: u64,
        case_id: u64,
        arbitration_id: u64,
        settlement_tx: BytesN<32>,
    ) -> Result<(), TraceError> {
        caller.require_auth();
        Self::ensure_writer(&env, &caller)?;
        if agreement_id == 0 || escrow_id == 0 || case_id == 0 || arbitration_id == 0 {
            return Err(TraceError::InvalidReference);
        }
        let key = DataKey::Chain(agreement_id);
        if env.storage().instance().has(&key) {
            return Err(TraceError::Duplicate);
        }
        let record = ChainRecord {
            agreement_id,
            escrow_id,
            case_id,
            arbitration_id,
            settlement_tx,
            recorded_at: env.ledger().timestamp(),
            writer: caller.clone(),
        };
        env.storage().instance().set(&key, &record);
        TraceEvent {
            kind: Symbol::new(&env, "linked"),
            agreement_id,
            writer: caller,
        }
        .publish(&env);
        Ok(())
    }

    pub fn get_chain(env: Env, agreement_id: u64) -> Result<ChainRecord, TraceError> {
        env.storage()
            .instance()
            .get(&DataKey::Chain(agreement_id))
            .ok_or(TraceError::NotFound)
    }

    fn ensure_authority(env: &Env, caller: &Address) -> Result<(), TraceError> {
        let authority: Address = env.storage().instance().get(&DataKey::Authority).unwrap();
        if caller == &authority {
            Ok(())
        } else {
            Err(TraceError::NotAuthorized)
        }
    }

    fn ensure_writer(env: &Env, caller: &Address) -> Result<(), TraceError> {
        let authority: Address = env.storage().instance().get(&DataKey::Authority).unwrap();
        if caller == &authority
            || env
                .storage()
                .instance()
                .get::<DataKey, bool>(&DataKey::Writer(caller.clone()))
                .unwrap_or(false)
        {
            Ok(())
        } else {
            Err(TraceError::NotAuthorized)
        }
    }
}
