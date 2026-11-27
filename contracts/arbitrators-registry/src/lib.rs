#![no_std]

//! Arbitrators Registry V2. Eligibility is granted by an independent registrar
//! and bound to a controller hash: two addresses cannot share one controller.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    NotFound = 1,
    NotAuthorized = 2,
    AlreadyRegistered = 3,
    DuplicateController = 4,
    NotEligible = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Arbitrator {
    pub address: Address,
    pub profile_hash: BytesN<32>,
    pub controller_hash: Option<BytesN<32>>,
    pub eligible: bool,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Registrar,
    Arbitrator(Address),
    Order,
    OrderEntry(u32),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegistryEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub subject: Address,
}

#[contract]
pub struct ArbitratorsRegistryContract;

#[contractimpl]
impl ArbitratorsRegistryContract {
    pub fn __constructor(env: Env, registrar: Address) {
        env.storage()
            .instance()
            .set(&DataKey::Registrar, &registrar);
        env.storage().instance().set(&DataKey::Order, &0u32);
    }

    /// Self-registration. Eligibility requires a registrar attestation.
    pub fn register(
        env: Env,
        caller: Address,
        profile_hash: BytesN<32>,
    ) -> Result<(), RegistryError> {
        caller.require_auth();
        if env
            .storage()
            .instance()
            .has(&DataKey::Arbitrator(caller.clone()))
        {
            return Err(RegistryError::AlreadyRegistered);
        }
        let entry = Arbitrator {
            address: caller.clone(),
            profile_hash,
            controller_hash: None,
            eligible: false,
            registered_at: env.ledger().timestamp(),
        };
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator(caller.clone()), &entry);
        let index: u32 = env.storage().instance().get(&DataKey::Order).unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::OrderEntry(index), &caller);
        env.storage().instance().set(&DataKey::Order, &(index + 1));
        Self::emit(&env, "registered", caller);
        Ok(())
    }

    /// The registrar binds one controller to one address, and can revoke it.
    pub fn attest(
        env: Env,
        caller: Address,
        arbitrator: Address,
        controller_hash: BytesN<32>,
    ) -> Result<(), RegistryError> {
        caller.require_auth();
        Self::ensure_registrar(&env, &caller)?;
        let mut entry = Self::load(&env, &arbitrator)?;
        let count: u32 = env.storage().instance().get(&DataKey::Order).unwrap_or(0);
        for index in 0..count {
            let other: Address = env
                .storage()
                .instance()
                .get(&DataKey::OrderEntry(index))
                .ok_or(RegistryError::NotFound)?;
            if other == arbitrator {
                continue;
            }
            let candidate = Self::load(&env, &other)?;
            if candidate.controller_hash == Some(controller_hash.clone()) {
                return Err(RegistryError::DuplicateController);
            }
        }
        entry.controller_hash = Some(controller_hash);
        entry.eligible = true;
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator(arbitrator.clone()), &entry);
        Self::emit(&env, "attested", arbitrator);
        Ok(())
    }

    pub fn revoke(env: Env, caller: Address, arbitrator: Address) -> Result<(), RegistryError> {
        caller.require_auth();
        Self::ensure_registrar(&env, &caller)?;
        let mut entry = Self::load(&env, &arbitrator)?;
        entry.eligible = false;
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator(arbitrator.clone()), &entry);
        Self::emit(&env, "revoked", arbitrator);
        Ok(())
    }

    /// Eligible arbitrators in registration order: the snapshot used by Panel V2.
    pub fn get_eligible(env: Env) -> Vec<Address> {
        let mut result = Vec::new(&env);
        let count: u32 = env.storage().instance().get(&DataKey::Order).unwrap_or(0);
        for index in 0..count {
            if let Some(address) = env
                .storage()
                .instance()
                .get::<DataKey, Address>(&DataKey::OrderEntry(index))
            {
                if let Ok(entry) = Self::load(&env, &address) {
                    if entry.eligible {
                        result.push_back(address);
                    }
                }
            }
        }
        result
    }

    pub fn get_profile(env: Env, arbitrator: Address) -> Result<Arbitrator, RegistryError> {
        Self::load(&env, &arbitrator)
    }

    pub fn is_eligible(env: Env, arbitrator: Address) -> bool {
        Self::load(&env, &arbitrator)
            .map(|entry| entry.eligible)
            .unwrap_or(false)
    }

    fn load(env: &Env, arbitrator: &Address) -> Result<Arbitrator, RegistryError> {
        env.storage()
            .instance()
            .get(&DataKey::Arbitrator(arbitrator.clone()))
            .ok_or(RegistryError::NotFound)
    }

    fn ensure_registrar(env: &Env, caller: &Address) -> Result<(), RegistryError> {
        let registrar: Address = env.storage().instance().get(&DataKey::Registrar).unwrap();
        if caller == &registrar {
            Ok(())
        } else {
            Err(RegistryError::NotAuthorized)
        }
    }

    fn emit(env: &Env, kind: &str, subject: Address) {
        RegistryEvent {
            kind: Symbol::new(env, kind),
            subject,
        }
        .publish(env);
    }
}
