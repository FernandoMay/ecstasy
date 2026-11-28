#![no_std]

//! Composed V2 flow registry. Records real cross-protocol steps with their
//! Testnet transaction hashes. Persistent per-key storage and paginated reads
//! avoid the unbounded instance growth of SEC-09.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    IntoVal, Symbol, TryFromVal, Vec,
};

const TTL_THRESHOLD: u32 = 1000;
const TTL_EXTEND: u32 = 100_000;
const PAGE_LIMIT: u32 = 10;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FlowError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidStep = 4,
    DuplicateStep = 5,
    MissingStep = 6,
    InvalidPage = 7,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FlowStatus {
    Open,
    Settled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Flow {
    pub id: u64,
    pub vault_id: u64,
    pub agreement_id: u64,
    pub status: FlowStatus,
    pub settlement_tx: Option<BytesN<32>>,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StepRecord {
    pub flow_id: u64,
    pub step: Symbol,
    pub ref_id: u64,
    pub tx_hash: BytesN<32>,
    pub actor: Address,
    pub recorded_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Roles,
    Counter,
    Flow(u64),
    Step(u64, Symbol),
    StepList(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FlowEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub flow_id: u64,
    pub actor: Address,
}

#[contract]
pub struct FlowV2Contract;

#[contractimpl]
impl FlowV2Contract {
    pub fn __constructor(env: Env, roles: Address) {
        env.storage().instance().set(&DataKey::Roles, &roles);
        env.storage().instance().set(&DataKey::Counter, &0u64);
    }

    /// Open a composed flow. Only the fund manager role may start it.
    pub fn start(
        env: Env,
        caller: Address,
        vault_id: u64,
        agreement_id: u64,
    ) -> Result<u64, FlowError> {
        caller.require_auth();
        Self::require_role(&env, &caller, Symbol::new(&env, "fund_manager"))?;
        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(FlowError::InvalidState)?;
        let flow = Flow {
            id,
            vault_id,
            agreement_id,
            status: FlowStatus::Open,
            settlement_tx: None,
            created_at: env.ledger().timestamp(),
        };
        Self::put(&env, &DataKey::Flow(id), &flow);
        Self::put(&env, &DataKey::StepList(id), &Vec::<Symbol>::new(&env));
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "flow_started", id, caller);
        Ok(id)
    }

    /// Link one real step with its on-chain transaction hash.
    pub fn link_step(
        env: Env,
        caller: Address,
        flow_id: u64,
        step: Symbol,
        ref_id: u64,
        tx_hash: BytesN<32>,
    ) -> Result<(), FlowError> {
        caller.require_auth();
        let role = Self::role_for(&env, &step).ok_or(FlowError::InvalidStep)?;
        Self::require_role(&env, &caller, role)?;
        let mut flow = Self::flow(&env, flow_id)?;
        if flow.status != FlowStatus::Open {
            return Err(FlowError::InvalidState);
        }
        let mut list: Vec<Symbol> =
            Self::get(&env, &DataKey::StepList(flow_id)).ok_or(FlowError::NotFound)?;
        if list.contains(step.clone()) {
            return Err(FlowError::DuplicateStep);
        }
        let key = DataKey::Step(flow_id, step.clone());
        let record = StepRecord {
            flow_id,
            step: step.clone(),
            ref_id,
            tx_hash,
            actor: caller.clone(),
            recorded_at: env.ledger().timestamp(),
        };
        Self::put(&env, &key, &record);
        list.push_back(step);
        Self::put(&env, &DataKey::StepList(flow_id), &list);
        flow.status = FlowStatus::Open;
        Self::put(&env, &DataKey::Flow(flow_id), &flow);
        Self::emit(&env, "step_linked", flow_id, caller);
        Ok(())
    }

    /// Close the composed flow after the required primitives have been linked.
    pub fn settle(
        env: Env,
        caller: Address,
        flow_id: u64,
        settlement_tx: BytesN<32>,
    ) -> Result<(), FlowError> {
        caller.require_auth();
        Self::require_role(&env, &caller, Symbol::new(&env, "resolver"))?;
        let mut flow = Self::flow(&env, flow_id)?;
        if flow.status != FlowStatus::Open {
            return Err(FlowError::InvalidState);
        }
        for required in [
            Symbol::new(&env, "vault_fund"),
            Symbol::new(&env, "milestone"),
            Symbol::new(&env, "dispute"),
            Symbol::new(&env, "arbitration"),
            Symbol::new(&env, "panel"),
        ] {
            if !Self::has(&env, &DataKey::Step(flow_id, required)) {
                return Err(FlowError::MissingStep);
            }
        }
        flow.status = FlowStatus::Settled;
        flow.settlement_tx = Some(settlement_tx);
        Self::put(&env, &DataKey::Flow(flow_id), &flow);
        Self::emit(&env, "flow_settled", flow_id, caller);
        Ok(())
    }

    pub fn get_flow(env: Env, flow_id: u64) -> Result<Flow, FlowError> {
        Self::flow(&env, flow_id)
    }

    pub fn get_step(env: Env, flow_id: u64, step: Symbol) -> Result<StepRecord, FlowError> {
        Self::get(&env, &DataKey::Step(flow_id, step)).ok_or(FlowError::NotFound)
    }

    /// Bounded page of steps: a large flow never requires reading the whole list.
    pub fn get_steps(env: Env, flow_id: u64, offset: u32) -> Vec<StepRecord> {
        let mut result = Vec::new(&env);
        if !offset.is_multiple_of(PAGE_LIMIT) {
            return result;
        }
        let list: Vec<Symbol> =
            Self::get(&env, &DataKey::StepList(flow_id)).unwrap_or_else(|| Vec::new(&env));
        let end = (offset + PAGE_LIMIT).min(list.len());
        for i in offset..end {
            if let Some(step) = list.get(i) {
                if let Some(record) =
                    Self::get::<DataKey, StepRecord>(&env, &DataKey::Step(flow_id, step))
                {
                    result.push_back(record);
                }
            }
        }
        result
    }

    fn role_for(env: &Env, step: &Symbol) -> Option<Symbol> {
        if step == &Symbol::new(env, "vault_fund") || step == &Symbol::new(env, "withdrawal") {
            Some(Symbol::new(env, "fund_manager"))
        } else if step == &Symbol::new(env, "milestone") {
            Some(Symbol::new(env, "registrar"))
        } else if step == &Symbol::new(env, "dispute")
            || step == &Symbol::new(env, "arbitration")
            || step == &Symbol::new(env, "panel")
            || step == &Symbol::new(env, "settlement")
        {
            Some(Symbol::new(env, "resolver"))
        } else {
            None
        }
    }

    fn require_role(env: &Env, caller: &Address, role: Symbol) -> Result<(), FlowError> {
        let roles: Address = env.storage().instance().get(&DataKey::Roles).unwrap();
        let ok: bool = env.invoke_contract(
            &roles,
            &Symbol::new(env, "has_role"),
            (role, caller.clone()).into_val(env),
        );
        if ok {
            Ok(())
        } else {
            Err(FlowError::NotAuthorized)
        }
    }

    fn flow(env: &Env, flow_id: u64) -> Result<Flow, FlowError> {
        Self::get(env, &DataKey::Flow(flow_id)).ok_or(FlowError::NotFound)
    }

    fn put<K, V>(env: &Env, key: &K, value: &V)
    where
        K: soroban_sdk::IntoVal<Env, soroban_sdk::Val>,
        V: soroban_sdk::IntoVal<Env, soroban_sdk::Val> + TryFromVal<Env, soroban_sdk::Val>,
    {
        env.storage().persistent().set(key, value);
        env.storage()
            .persistent()
            .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND);
    }

    fn get<K, V>(env: &Env, key: &K) -> Option<V>
    where
        K: soroban_sdk::IntoVal<Env, soroban_sdk::Val>,
        V: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>,
    {
        env.storage().persistent().get(key)
    }

    fn has<K>(env: &Env, key: &K) -> bool
    where
        K: soroban_sdk::IntoVal<Env, soroban_sdk::Val>,
    {
        env.storage().persistent().has(key)
    }

    fn emit(env: &Env, kind: &str, flow_id: u64, actor: Address) {
        FlowEvent {
            kind: Symbol::new(env, kind),
            flow_id,
            actor,
        }
        .publish(env);
    }
}
