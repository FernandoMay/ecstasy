//! P0 adversarial harness — the four High findings from Fase 14.1.
//! Local Soroban test environment only: no Testnet deployment, no user funds.

use arbitration::{
    ArbitrationContract, ArbitrationContractClient, ArbitrationError, Outcome as ArbOutcome,
};
use ecstasy::{EcstasyContract, EcstasyContractClient};
use milestones::{
    MilestoneError, MilestonesContract, MilestonesContractClient, Outcome as MsOutcome,
};
use panel::{PanelContract, PanelContractClient, PanelError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Vec,
};

const NOW: u64 = 1_700_000_000;
const UNIT: i128 = 10_000_000;

fn h(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn asset(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone())
        .address()
}

fn panel_commitment(
    env: &Env,
    case_id: u64,
    arbitrator: &Address,
    decision: u32,
    secret: u8,
) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &case_id.to_be_bytes()));
    data.append(&Bytes::from_array(env, &[decision as u8]));
    data.append(&Bytes::from_array(env, &[secret; 32]));
    let arb_hash = env.crypto().sha256(&arbitrator.to_string().to_bytes());
    data.append(&arb_hash.to_bytes().into());
    env.crypto().sha256(&data).to_bytes()
}

// ---------------------------------------------------------------------------
// SEC-02 — Milestones: recover escapes Disputed / Submitted
// ---------------------------------------------------------------------------

#[test]
fn sec02_recover_escapes_a_disputed_milestone() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(MilestonesContract, (token.clone(), resolver.clone()));
    let client = MilestonesContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let amounts = Vec::from_array(&env, [UNIT]);
    let deadlines = Vec::from_array(&env, [NOW + 100]);
    let agreement = client.create(&proposer, &recipient, &amounts, &deadlines, &h(&env, 1));

    client.submit(&recipient, &agreement, &0, &h(&env, 2));
    client.dispute(&proposer, &agreement, &0, &h(&env, 3));
    assert_eq!(
        client.get(&agreement).milestones.get(0).unwrap().status,
        milestones::MilestoneStatus::Disputed
    );

    env.ledger().with_mut(|li| li.timestamp = NOW + 200);
    // Attacker is any account: recover is permissionless.
    client.recover(&outsider, &agreement, &0);

    let milestone = client.get(&agreement).milestones.get(0).unwrap();
    assert_eq!(milestone.status, milestones::MilestoneStatus::Recovered);
    assert_eq!(token_client.balance(&recipient), 0);
    assert_eq!(token_client.balance(&proposer), 10 * UNIT);
    // The resolver can no longer honour the dispute.
    assert_eq!(
        client.try_resolve(&resolver, &agreement, &0, &MsOutcome::Release),
        Err(Ok(MilestoneError::InvalidState))
    );
    // No double exit: a second recover is rejected.
    assert_eq!(
        client.try_recover(&outsider, &agreement, &0),
        Err(Ok(MilestoneError::AlreadySettled))
    );
}

#[test]
fn sec02_recover_escapes_a_submitted_milestone() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(MilestonesContract, (token.clone(), resolver.clone()));
    let client = MilestonesContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let agreement = client.create(
        &proposer,
        &recipient,
        &Vec::from_array(&env, [UNIT]),
        &Vec::from_array(&env, [NOW + 100]),
        &h(&env, 4),
    );
    client.submit(&recipient, &agreement, &0, &h(&env, 5));
    env.ledger().with_mut(|li| li.timestamp = NOW + 200);
    client.recover(&proposer, &agreement, &0);

    assert_eq!(
        client.get(&agreement).milestones.get(0).unwrap().status,
        milestones::MilestoneStatus::Recovered
    );
    assert_eq!(token_client.balance(&recipient), 0);
    assert_eq!(token_client.balance(&proposer), 10 * UNIT);
}

// ---------------------------------------------------------------------------
// SEC-04 — ECSTASY: an unrelated creator withdraws the surplus
// ---------------------------------------------------------------------------

#[test]
fn sec04_unrelated_creator_withdraws_unowned_surplus() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let attacker = Address::generate(&env);
    let other_party = Address::generate(&env);
    let victim = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&attacker, &UNIT);
    let id = env.register(EcstasyContract, (token.clone(),));
    let client = EcstasyContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    // A zero-stake encounter costs nothing to create.
    let encounter = client.create_encounter(
        &attacker,
        &other_party,
        &token,
        &0,
        &h(&env, 6),
        &(NOW + 1000),
    );
    // Simulate an unrelated direct transfer into the contract.
    let surplus = 5 * UNIT;
    StellarAssetClient::new(&env, &token).mint(&id, &surplus);
    assert_eq!(token_client.balance(&id), surplus);

    let withdrawn = client.retirar(&attacker, &encounter);

    assert_eq!(withdrawn, surplus);
    assert_eq!(token_client.balance(&attacker), UNIT + surplus);
    assert_eq!(token_client.balance(&id), 0);
    // The intended recipient of the funds never had a claim encoded on-chain.
    assert_eq!(token_client.balance(&victim), 0);
}

// ---------------------------------------------------------------------------
// SEC-01 — Arbitration: locked funds and early resolution
// ---------------------------------------------------------------------------

#[test]
fn sec01_funds_locked_when_resolver_never_signs() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let recipient = Address::generate(&env);
    let absent_resolver = Address::generate(&env); // never signs
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(
        ArbitrationContract,
        (token.clone(), absent_resolver.clone()),
    );
    let client = ArbitrationContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let case = client.deposit(
        &proposer,
        &1,
        &counterparty,
        &recipient,
        &UNIT,
        &h(&env, 7),
        &(NOW + 100),
    );
    // Long after respond_by, and with no resolver signature.
    env.ledger().with_mut(|li| li.timestamp = NOW + 10_000);
    assert_eq!(client.get(&case).status, arbitration::CaseStatus::Open);
    assert_eq!(token_client.balance(&id), UNIT);
    assert_eq!(
        client.try_resolve(&outsider, &case, &ArbOutcome::Refund),
        Err(Ok(ArbitrationError::NotAuthorized))
    );
    // The only state-mutating functions are deposit/argue/resolve; none offers a refund.
    assert_eq!(token_client.balance(&id), UNIT);
}

#[test]
fn sec01_and_sec06_resolver_settles_before_argument_deadline() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(ArbitrationContract, (token.clone(), resolver.clone()));
    let client = ArbitrationContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let case = client.deposit(
        &proposer,
        &2,
        &counterparty,
        &recipient,
        &UNIT,
        &h(&env, 8),
        &(NOW + 100),
    );
    // Same ledger: the counterparty had no chance to argue.
    client.resolve(&resolver, &case, &ArbOutcome::Refund);

    assert_eq!(client.get(&case).status, arbitration::CaseStatus::Resolved);
    assert_eq!(token_client.balance(&proposer), 10 * UNIT);
    assert_eq!(token_client.balance(&recipient), 0);
}

// ---------------------------------------------------------------------------
// SEC-03 — Panel: the funder appoints the panel and reclaims its payment
// ---------------------------------------------------------------------------

#[test]
fn sec03_funder_uses_controlled_panel_to_reclaim_payment() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let funder = Address::generate(&env);
    let recipient = Address::generate(&env); // service provider
    let controlled = Vec::from_array(
        &env,
        [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ],
    );
    StellarAssetClient::new(&env, &token).mint(&funder, &(UNIT * 10));
    let id = env.register(PanelContract, (token.clone(),));
    let client = PanelContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let case = client.create(
        &funder,
        &7,
        &recipient,
        &UNIT,
        &h(&env, 9),
        &controlled,
        &(NOW + 10),
        &(NOW + 20),
    );
    for i in 0..3 {
        let arb = controlled.get(i).unwrap();
        client.commit(&arb, &case, &panel_commitment(&env, case, &arb, 2, 11));
    }
    env.ledger().with_mut(|li| li.timestamp = NOW + 15);
    for i in 0..3 {
        let arb = controlled.get(i).unwrap();
        client.reveal(&arb, &case, &2, &h(&env, 11));
    }
    env.ledger().with_mut(|li| li.timestamp = NOW + 25);
    client.resolve(&recipient, &case); // permissionless settlement

    assert_eq!(client.get(&case).status, panel::PanelStatus::Resolved);
    assert_eq!(client.get(&case).outcome_code, Some(2)); // Refund
    assert_eq!(token_client.balance(&funder), 10 * UNIT); // money back
    assert_eq!(token_client.balance(&recipient), 0); // provider unpaid

    let _ = PanelError::NotAuthorized; // keep the error type referenced in the harness
}
