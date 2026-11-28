#![no_std]

//! Vault V2. Attribution-based accounting: a creator can only withdraw the
//! balance the contract explicitly attributed to their vault. Direct transfers
//! are surplus and can only go to a destination fixed at construction.
//! Policy: docs/VAULT_V2_POLICY.md.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultV2Error {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidAmount = 4,
    InsufficientAttributed = 5,
    NoSurplus = 6,
    InsufficientFunds = 7,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VaultStatus {
    Active,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vault {
    pub id: u64,
    pub owner: Address,
    pub label_hash: BytesN<32>,
    pub attributed: i128,
    pub created_at: u64,
    pub status: VaultStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    SurplusDestination,
    Vault(u64),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultEvent {
    #[topic]
    pub kind: Symbol,
    #[topic]
    pub vault_id: u64,
    pub amount: i128,
    pub actor: Address,
}

#[contract]
pub struct VaultV2Contract;

#[contractimpl]
impl VaultV2Contract {
    /// The surplus destination is immutable and known before any deposit.
    pub fn __constructor(env: Env, asset: Address, surplus_destination: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage()
            .instance()
            .set(&DataKey::SurplusDestination, &surplus_destination);
        env.storage().instance().set(&DataKey::Counter, &0u64);
    }

    /// Create an empty vault. No funds move and no attribution is created.
    pub fn create_vault(
        env: Env,
        caller: Address,
        label_hash: BytesN<32>,
    ) -> Result<u64, VaultV2Error> {
        caller.require_auth();
        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(VaultV2Error::InvalidState)?;
        let vault = Vault {
            id,
            owner: caller.clone(),
            label_hash,
            attributed: 0,
            created_at: env.ledger().timestamp(),
            status: VaultStatus::Active,
        };
        env.storage().instance().set(&DataKey::Vault(id), &vault);
        env.storage().instance().set(&DataKey::Counter, &id);
        Self::emit(&env, "vault_created", id, 0, caller);
        Ok(id)
    }

    /// The only legitimate funding path: XLM and attribution move together.
    pub fn fund(
        env: Env,
        caller: Address,
        vault_id: u64,
        amount: i128,
    ) -> Result<(), VaultV2Error> {
        caller.require_auth();
        if amount <= 0 {
            return Err(VaultV2Error::InvalidAmount);
        }
        let mut vault = Self::load(&env, vault_id)?;
        if vault.status != VaultStatus::Active {
            return Err(VaultV2Error::InvalidState);
        }
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );
        vault.attributed = vault
            .attributed
            .checked_add(amount)
            .ok_or(VaultV2Error::InvalidAmount)?;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);
        Self::emit(&env, "funded", vault_id, amount, caller);
        Ok(())
    }

    /// Withdraw only from the caller's own attributed balance.
    pub fn withdraw(
        env: Env,
        caller: Address,
        vault_id: u64,
        amount: i128,
    ) -> Result<i128, VaultV2Error> {
        caller.require_auth();
        if amount <= 0 {
            return Err(VaultV2Error::InvalidAmount);
        }
        let mut vault = Self::load(&env, vault_id)?;
        if vault.owner != caller {
            return Err(VaultV2Error::NotAuthorized);
        }
        if vault.status != VaultStatus::Active {
            return Err(VaultV2Error::InvalidState);
        }
        if vault.attributed < amount {
            return Err(VaultV2Error::InsufficientAttributed);
        }
        Self::payout(&env, &caller, amount)?;
        vault.attributed -= amount;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);
        Self::emit(&env, "withdrawn", vault_id, amount, caller);
        Ok(amount)
    }

    /// Close an empty vault. Attributed funds always keep a withdrawal path.
    pub fn close(env: Env, caller: Address, vault_id: u64) -> Result<(), VaultV2Error> {
        caller.require_auth();
        let mut vault = Self::load(&env, vault_id)?;
        if vault.owner != caller {
            return Err(VaultV2Error::NotAuthorized);
        }
        if vault.status != VaultStatus::Active || vault.attributed != 0 {
            return Err(VaultV2Error::InvalidState);
        }
        vault.status = VaultStatus::Closed;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);
        Self::emit(&env, "vault_closed", vault_id, 0, caller);
        Ok(())
    }

    /// Permissionless, deterministic: sweep only balance minus attribution.
    pub fn sweep_surplus(env: Env, caller: Address) -> Result<i128, VaultV2Error> {
        caller.require_auth();
        let total = Self::total_attributed(&env);
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(&env, &asset).balance(&env.current_contract_address());
        let surplus = balance - total;
        if surplus <= 0 {
            return Err(VaultV2Error::NoSurplus);
        }
        let destination: Address = env
            .storage()
            .instance()
            .get(&DataKey::SurplusDestination)
            .unwrap();
        Self::payout(&env, &destination, surplus)?;
        Self::emit(&env, "surplus_swept", 0, surplus, caller);
        Ok(surplus)
    }

    pub fn get_vault(env: Env, vault_id: u64) -> Result<Vault, VaultV2Error> {
        Self::load(&env, vault_id)
    }

    pub fn get_total_attributed(env: Env) -> i128 {
        Self::total_attributed(&env)
    }

    pub fn get_surplus(env: Env) -> i128 {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(&env, &asset).balance(&env.current_contract_address());
        balance - Self::total_attributed(&env)
    }

    fn load(env: &Env, vault_id: u64) -> Result<Vault, VaultV2Error> {
        env.storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .ok_or(VaultV2Error::NotFound)
    }

    fn total_attributed(env: &Env) -> i128 {
        let mut total = 0i128;
        let count: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        for id in 1..=count {
            if let Ok(vault) = Self::load(env, id) {
                total += vault.attributed;
            }
        }
        total
    }

    fn payout(env: &Env, to: &Address, amount: i128) -> Result<(), VaultV2Error> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = TokenClient::new(env, &asset);
        if token.balance(&env.current_contract_address()) < amount {
            return Err(VaultV2Error::InsufficientFunds);
        }
        token.transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }

    fn emit(env: &Env, kind: &str, vault_id: u64, amount: i128, actor: Address) {
        VaultEvent {
            kind: Symbol::new(env, kind),
            vault_id,
            amount,
            actor,
        }
        .publish(env);
    }
}
