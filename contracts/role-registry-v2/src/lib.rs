#![no_std]

//! Delegated roles for V2 flows. Administrative authority is separated from
//! fund movement, registration and resolution. No admin role can move funds.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RoleError {
    NotAuthorized = 1,
    InvalidRole = 2,
    AlreadyGranted = 3,
    NotGranted = 4,
    LimitReached = 5,
}

const MAX_HOLDERS: u32 = 16;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Members(Symbol, Address),
    Holders(Symbol),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub role: Symbol,
    pub account: Address,
}

#[contract]
pub struct RoleRegistryV2Contract;

#[contractimpl]
impl RoleRegistryV2Contract {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    fn known_role(role: &Symbol, env: &Env) -> bool {
        role == &Symbol::new(env, "admin")
            || role == &Symbol::new(env, "fund_manager")
            || role == &Symbol::new(env, "registrar")
            || role == &Symbol::new(env, "resolver")
    }

    pub fn grant(
        env: Env,
        caller: Address,
        role: Symbol,
        account: Address,
    ) -> Result<(), RoleError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            return Err(RoleError::NotAuthorized);
        }
        if !Self::known_role(&role, &env) {
            return Err(RoleError::InvalidRole);
        }
        let key = DataKey::Members(role.clone(), account.clone());
        if env.storage().instance().has(&key) {
            return Err(RoleError::AlreadyGranted);
        }
        let mut holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Holders(role.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        if holders.len() >= MAX_HOLDERS {
            return Err(RoleError::LimitReached);
        }
        holders.push_back(account.clone());
        env.storage()
            .instance()
            .set(&DataKey::Holders(role.clone()), &holders);
        env.storage().instance().set(&key, &true);
        Self::emit(&env, "granted", role, account);
        Ok(())
    }

    pub fn revoke(
        env: Env,
        caller: Address,
        role: Symbol,
        account: Address,
    ) -> Result<(), RoleError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            return Err(RoleError::NotAuthorized);
        }
        let key = DataKey::Members(role.clone(), account.clone());
        if !env.storage().instance().has(&key) {
            return Err(RoleError::NotGranted);
        }
        env.storage().instance().remove(&key);
        let mut holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Holders(role.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        // Rebuild without the revoked account (bounded by MAX_HOLDERS).
        let mut kept = Vec::new(&env);
        for holder in holders.iter() {
            if holder != account {
                kept.push_back(holder);
            }
        }
        holders = kept;
        env.storage()
            .instance()
            .set(&DataKey::Holders(role.clone()), &holders);
        Self::emit(&env, "revoked", role, account);
        Ok(())
    }

    pub fn rotate(
        env: Env,
        caller: Address,
        role: Symbol,
        from: Address,
        to: Address,
    ) -> Result<(), RoleError> {
        caller.require_auth();
        Self::ensure_admin(&env, &caller)?;
        Self::revoke_unchecked(&env, &role, &from)?;
        Self::grant_unchecked(&env, &role, &to)
    }

    fn ensure_admin(env: &Env, caller: &Address) -> Result<(), RoleError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller == &admin {
            Ok(())
        } else {
            Err(RoleError::NotAuthorized)
        }
    }

    fn revoke_unchecked(env: &Env, role: &Symbol, account: &Address) -> Result<(), RoleError> {
        let key = DataKey::Members(role.clone(), account.clone());
        if !env.storage().instance().has(&key) {
            return Err(RoleError::NotGranted);
        }
        env.storage().instance().remove(&key);
        let holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Holders(role.clone()))
            .unwrap_or_else(|| Vec::new(env));
        let mut kept = Vec::new(env);
        for holder in holders.iter() {
            if holder != *account {
                kept.push_back(holder);
            }
        }
        env.storage()
            .instance()
            .set(&DataKey::Holders(role.clone()), &kept);
        Self::emit(env, "revoked", role.clone(), account.clone());
        Ok(())
    }

    fn grant_unchecked(env: &Env, role: &Symbol, account: &Address) -> Result<(), RoleError> {
        if !Self::known_role(role, env) {
            return Err(RoleError::InvalidRole);
        }
        let key = DataKey::Members(role.clone(), account.clone());
        if env.storage().instance().has(&key) {
            return Err(RoleError::AlreadyGranted);
        }
        let mut holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Holders(role.clone()))
            .unwrap_or_else(|| Vec::new(env));
        if holders.len() >= MAX_HOLDERS {
            return Err(RoleError::LimitReached);
        }
        holders.push_back(account.clone());
        env.storage()
            .instance()
            .set(&DataKey::Holders(role.clone()), &holders);
        env.storage().instance().set(&key, &true);
        Self::emit(env, "granted", role.clone(), account.clone());
        Ok(())
    }

    pub fn has_role(env: Env, role: Symbol, account: Address) -> bool {
        env.storage()
            .instance()
            .has(&DataKey::Members(role, account))
    }

    /// Paginated read: bounded response regardless of holder count.
    pub fn get_holders(env: Env, role: Symbol, offset: u32, limit: u32) -> Vec<Address> {
        if limit == 0 || limit > MAX_HOLDERS {
            return Vec::new(&env);
        }
        let holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Holders(role))
            .unwrap_or_else(|| Vec::new(&env));
        let mut result = Vec::new(&env);
        let end = (offset + limit).min(holders.len());
        for i in offset..end {
            if let Some(holder) = holders.get(i) {
                result.push_back(holder);
            }
        }
        result
    }

    fn emit(env: &Env, kind: &str, role: Symbol, account: Address) {
        RoleEvent {
            kind: Symbol::new(env, kind),
            role,
            account,
        }
        .publish(env);
    }
}
