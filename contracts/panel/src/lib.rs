#![no_std]

//! Multi-party arbitration with commit-reveal voting and a 2-of-3 quorum.
//! The panel is designated by the parties: temporal independence is enforced,
//! but honesty and decentralization of selection are not claimed.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, Bytes, BytesN, Env, Map, MuxedAddress, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PanelError {
    NotFound = 1,
    NotAuthorized = 2,
    InvalidState = 3,
    InvalidDecision = 4,
    CommitmentMismatch = 5,
    AlreadyCommitted = 6,
    AlreadyRevealed = 7,
    TooEarly = 8,
    InvalidPanel = 9,
    InsufficientFunds = 10,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PanelStatus {
    Open,
    Resolved,
    NoQuorum,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PanelCase {
    pub id: u64,
    pub agreement_id: u64,
    pub proposer: Address,
    pub recipient: Address,
    pub amount: i128,
    pub evidence_hash: BytesN<32>,
    pub arbitrators: Vec<Address>,
    pub commit_deadline: u64,
    pub reveal_deadline: u64,
    pub status: PanelStatus,
    pub outcome_code: Option<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Counter,
    Asset,
    Case(u64),
    Commit(u64, Address),
    Vote(u64, Address),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PanelEvent {
    #[topic]
    pub kind: Symbol,
    pub id: u64,
    pub actor: Address,
}

#[contract]
pub struct PanelContract;

#[contractimpl]
impl PanelContract {
    pub fn __constructor(env: Env, asset: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
    }

    /// Open a case funded with real XLM and designate exactly three arbitrators.
    #[allow(clippy::too_many_arguments)]
    pub fn create(
        env: Env,
        caller: Address,
        agreement_id: u64,
        recipient: Address,
        amount: i128,
        evidence_hash: BytesN<32>,
        arbitrators: Vec<Address>,
        commit_deadline: u64,
        reveal_deadline: u64,
    ) -> Result<u64, PanelError> {
        caller.require_auth();
        if amount <= 0 || arbitrators.len() != 3 {
            return Err(PanelError::InvalidPanel);
        }
        let now = env.ledger().timestamp();
        if commit_deadline <= now || reveal_deadline <= commit_deadline {
            return Err(PanelError::InvalidState);
        }
        for i in 0..3 {
            let a = arbitrators.get(i).unwrap();
            for j in (i + 1)..3 {
                if a == arbitrators.get(j).unwrap() {
                    return Err(PanelError::InvalidPanel);
                }
            }
        }

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(
            &caller,
            MuxedAddress::from(env.current_contract_address()),
            &amount,
        );

        let previous: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let id = previous.checked_add(1).ok_or(PanelError::InvalidState)?;
        let case = PanelCase {
            id,
            agreement_id,
            proposer: caller.clone(),
            recipient,
            amount,
            evidence_hash,
            arbitrators,
            commit_deadline,
            reveal_deadline,
            status: PanelStatus::Open,
            outcome_code: None,
        };
        env.storage().instance().set(&DataKey::Case(id), &case);
        env.storage().instance().set(&DataKey::Counter, &id);
        PanelEvent {
            kind: Symbol::new(&env, "created"),
            id,
            actor: caller,
        }
        .publish(&env);
        Ok(id)
    }

    /// Arbitrator commits a digest binding case, arbitrator, decision, secret.
    pub fn commit(
        env: Env,
        caller: Address,
        case_id: u64,
        commitment: BytesN<32>,
    ) -> Result<(), PanelError> {
        caller.require_auth();
        let case = Self::load(&env, case_id)?;
        Self::ensure_arbitrator(&case, &caller)?;
        if case.status != PanelStatus::Open || env.ledger().timestamp() > case.commit_deadline {
            return Err(PanelError::InvalidState);
        }
        let key = DataKey::Commit(case_id, caller.clone());
        if env.storage().instance().has(&key) {
            return Err(PanelError::AlreadyCommitted);
        }
        env.storage().instance().set(&key, &commitment);
        PanelEvent {
            kind: Symbol::new(&env, "committed"),
            id: case_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Reveal the committed decision. Decision codes: 1 Release, 2 Refund, 3 Split.
    pub fn reveal(
        env: Env,
        caller: Address,
        case_id: u64,
        decision: u32,
        secret: BytesN<32>,
    ) -> Result<(), PanelError> {
        caller.require_auth();
        let case = Self::load(&env, case_id)?;
        Self::ensure_arbitrator(&case, &caller)?;
        if case.status != PanelStatus::Open || env.ledger().timestamp() <= case.commit_deadline {
            return Err(PanelError::InvalidState);
        }
        if env.ledger().timestamp() > case.reveal_deadline {
            return Err(PanelError::InvalidState);
        }
        if !(1..=3).contains(&decision) {
            return Err(PanelError::InvalidDecision);
        }
        let commit_key = DataKey::Commit(case_id, caller.clone());
        let commitment: BytesN<32> = env
            .storage()
            .instance()
            .get(&commit_key)
            .ok_or(PanelError::InvalidState)?;
        let vote_key = DataKey::Vote(case_id, caller.clone());
        if env.storage().instance().has(&vote_key) {
            return Err(PanelError::AlreadyRevealed);
        }
        if Self::commitment(&env, case_id, &caller, decision, &secret) != commitment {
            return Err(PanelError::CommitmentMismatch);
        }
        env.storage().instance().set(&vote_key, &decision);
        PanelEvent {
            kind: Symbol::new(&env, "revealed"),
            id: case_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    /// Permissionless settlement after the reveal window. 2-of-3 quorum.
    pub fn resolve(env: Env, caller: Address, case_id: u64) -> Result<(), PanelError> {
        caller.require_auth();
        let mut case = Self::load(&env, case_id)?;
        if case.status != PanelStatus::Open || env.ledger().timestamp() <= case.reveal_deadline {
            return Err(PanelError::TooEarly);
        }

        let mut votes: Map<u32, u32> = Map::new(&env);
        for arbitrator in case.arbitrators.iter() {
            if let Some(decision) = env
                .storage()
                .instance()
                .get::<DataKey, u32>(&DataKey::Vote(case_id, arbitrator))
            {
                votes.set(decision, votes.get(decision).unwrap_or(0) + 1);
            }
        }

        let mut winner: Option<u32> = None;
        for (decision, count) in votes.iter() {
            if count >= 2 {
                winner = Some(decision);
                break;
            }
        }

        if let Some(decision) = winner {
            match decision {
                1 => Self::transfer(&env, &case.recipient, case.amount)?,
                2 => Self::transfer(&env, &case.proposer, case.amount)?,
                _ => {
                    let first = case.amount / 2;
                    Self::transfer(&env, &case.recipient, first)?;
                    Self::transfer(&env, &case.proposer, case.amount - first)?;
                }
            }
            case.status = PanelStatus::Resolved;
            case.outcome_code = Some(decision);
        } else {
            // No quorum: funds return to the proposer, never to an arbitrator.
            Self::transfer(&env, &case.proposer, case.amount)?;
            case.status = PanelStatus::NoQuorum;
        }
        env.storage().instance().set(&DataKey::Case(case_id), &case);
        PanelEvent {
            kind: Symbol::new(&env, "resolved"),
            id: case_id,
            actor: caller,
        }
        .publish(&env);
        Ok(())
    }

    pub fn get(env: Env, case_id: u64) -> Result<PanelCase, PanelError> {
        Self::load(&env, case_id)
    }

    /// Same byte layout as the web client helper `panelCommitment`.
    pub fn commitment(
        env: &Env,
        case_id: u64,
        arbitrator: &Address,
        decision: u32,
        secret: &BytesN<32>,
    ) -> BytesN<32> {
        let mut data = Bytes::new(env);
        data.append(&Bytes::from_array(env, &case_id.to_be_bytes()));
        data.append(&Bytes::from_array(env, &[decision as u8]));
        data.append(&BytesN::<32>::to_bytes(secret));
        let arb_hash = env.crypto().sha256(&arbitrator.to_string().to_bytes());
        data.append(&arb_hash.to_bytes().into());
        env.crypto().sha256(&data).to_bytes()
    }

    fn load(env: &Env, case_id: u64) -> Result<PanelCase, PanelError> {
        env.storage()
            .instance()
            .get(&DataKey::Case(case_id))
            .ok_or(PanelError::NotFound)
    }

    fn ensure_arbitrator(case: &PanelCase, caller: &Address) -> Result<(), PanelError> {
        if case.arbitrators.contains(caller.clone()) {
            Ok(())
        } else {
            Err(PanelError::NotAuthorized)
        }
    }

    fn transfer(env: &Env, to: &Address, amount: i128) -> Result<(), PanelError> {
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let balance = TokenClient::new(env, &asset).balance(&env.current_contract_address());
        if balance < amount {
            return Err(PanelError::InsufficientFunds);
        }
        TokenClient::new(env, &asset).transfer(
            &env.current_contract_address(),
            MuxedAddress::from(to.clone()),
            &amount,
        );
        Ok(())
    }
}
