#![no_std]

//! Bóveda — a one-shot, code-gated Testnet vault.
//!
//! The creator locks XLM in the contract. Anyone who presents the correct
//! code commitment can claim the whole balance exactly once. The code itself
//! is never stored: only its SHA-256 digest is pinned at deployment.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, BytesN, Env, MuxedAddress,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum BovedaError {
    InvalidCode = 1,
    AlreadyClaimed = 2,
    Empty = 3,
    InvalidAmount = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Asset,
    CodeHash,
    Claimed,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimEvent {
    #[topic]
    pub kind: soroban_sdk::Symbol,
    pub amount: i128,
}

#[contract]
pub struct BovedaContract;

#[contractimpl]
impl BovedaContract {
    /// Pins the escrow asset and the SHA-256 commitment of the claim code.
    pub fn __constructor(env: Env, asset: Address, code_hash: BytesN<32>) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::CodeHash, &code_hash);
        env.storage().instance().set(&DataKey::Claimed, &false);
    }

    /// Lock funds in the vault. Anyone can fund it; only `reclamar` can move
    /// them out.
    pub fn fund(env: Env, caller: Address, amount: i128) -> Result<(), BovedaError> {
        caller.require_auth();
        if amount <= 0 {
            return Err(BovedaError::InvalidAmount);
        }
        if env
            .storage()
            .instance()
            .get(&DataKey::Claimed)
            .unwrap_or(false)
        {
            return Err(BovedaError::AlreadyClaimed);
        }
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );
        Ok(())
    }

    /// NEW PUBLIC FUNCTION — claim the whole vault with the correct code.
    /// The caller supplies a 32-byte SHA-256 digest of the code; the contract
    /// compares it with the digest pinned at deployment and never sees the
    /// code itself. Terminal: one claim per vault.
    pub fn reclamar(env: Env, caller: Address, code_hash: BytesN<32>) -> Result<i128, BovedaError> {
        caller.require_auth();
        if env
            .storage()
            .instance()
            .get(&DataKey::Claimed)
            .unwrap_or(false)
        {
            return Err(BovedaError::AlreadyClaimed);
        }
        let expected: BytesN<32> = env.storage().instance().get(&DataKey::CodeHash).unwrap();
        if expected != code_hash {
            return Err(BovedaError::InvalidCode);
        }

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let amount = TokenClient::new(&env, &asset).balance(&env.current_contract_address());
        if amount <= 0 {
            return Err(BovedaError::Empty);
        }
        // No explicit require_auth on the contract address: Soroban treats the
        // contract as the authorized direct invoker of the token contract.
        TokenClient::new(&env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(caller),
            &amount,
        );
        env.storage().instance().set(&DataKey::Claimed, &true);
        ClaimEvent {
            kind: soroban_sdk::Symbol::new(&env, "claimed"),
            amount,
        }
        .publish(&env);
        Ok(amount)
    }

    /// Public read: whether the vault was claimed and its current balance.
    pub fn status(env: Env) -> (bool, i128) {
        let claimed = env
            .storage()
            .instance()
            .get(&DataKey::Claimed)
            .unwrap_or(false);
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(&env, &asset).balance(&env.current_contract_address());
        (claimed, balance)
    }
}
