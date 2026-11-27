//! P1 adversarial harness — selected Medium findings (SEC-05, 07, 08, 12, 13, 14, 17)
//! plus a bounded storage-growth probe for SEC-09. Local only.

use boveda::{BovedaContract, BovedaContractClient};
use panel::{PanelContract, PanelContractClient};
use reputation::{ReputationContract, ReputationContractClient, ReputationError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Vec,
};
use subscription::{SubscriptionContract, SubscriptionContractClient, SubscriptionError};
use traceability::{TraceabilityContract, TraceabilityContractClient};

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

#[test]
fn sec05_single_abstention_forces_no_quorum() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let arbitrators = Vec::from_array(
        &env,
        [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ],
    );
    StellarAssetClient::new(&env, &token).mint(&payer, &(UNIT * 10));
    let id = env.register(PanelContract, (token.clone(),));
    let client = PanelContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let case = client.create(
        &payer,
        &9,
        &recipient,
        &UNIT,
        &h(&env, 21),
        &arbitrators,
        &(NOW + 10),
        &(NOW + 20),
    );
    let a0 = arbitrators.get(0).unwrap();
    let a1 = arbitrators.get(1).unwrap();
    client.commit(&a0, &case, &panel_commitment(&env, case, &a0, 1, 31));
    client.commit(&a1, &case, &panel_commitment(&env, case, &a1, 2, 32));
    // Third arbitrator never commits/reveals.
    env.ledger().with_mut(|li| li.timestamp = NOW + 15);
    client.reveal(&a0, &case, &1, &h(&env, 31));
    client.reveal(&a1, &case, &2, &h(&env, 32));
    env.ledger().with_mut(|li| li.timestamp = NOW + 25);
    client.resolve(&recipient, &case);

    assert_eq!(client.get(&case).status, panel::PanelStatus::NoQuorum);
    assert_eq!(token_client.balance(&payer), 10 * UNIT);
    assert_eq!(token_client.balance(&recipient), 0);
}

#[test]
fn sec07_subscription_funded_period_has_no_time_exit() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&payer, &(UNIT * 10));
    let id = env.register(SubscriptionContract, (token.clone(), resolver.clone()));
    let client = SubscriptionContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let plan = client.create_plan(&payer, &recipient, &UNIT, &60);
    client.fund_period(&payer, &plan, &1, &(NOW + 100));
    // Recipient never delivers; payer cancels to stop future obligations.
    client.cancel_plan(&payer, &plan);
    env.ledger().with_mut(|li| li.timestamp = NOW + 10_000);

    assert!(client.get_plan(&plan).cancelled);
    assert_eq!(
        client.get_period(&plan, &1).status,
        subscription::PeriodStatus::Funded
    );
    assert_eq!(token_client.balance(&id), UNIT);
    // No function exists to recover a Funded period; only dispute + resolver remain.
    assert_eq!(
        client.try_submit_delivery(&payer, &plan, &1, &h(&env, 22)),
        Err(Ok(SubscriptionError::NotAuthorized))
    );
    assert_eq!(token_client.balance(&id), UNIT);
}

#[test]
fn sec08_subscription_approve_ignores_due_at() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&payer, &(UNIT * 10));
    let id = env.register(SubscriptionContract, (token.clone(), resolver.clone()));
    let client = SubscriptionContractClient::new(&env, &id);

    let plan = client.create_plan(&payer, &recipient, &UNIT, &60);
    // due_at is 10,000 seconds in the future: not a period boundary in practice.
    client.fund_period(&payer, &plan, &1, &(NOW + 10_000));
    client.submit_delivery(&recipient, &plan, &1, &h(&env, 23));
    client.approve(&payer, &plan, &1); // succeeds long before due_at

    assert_eq!(
        client.get_period(&plan, &1).status,
        subscription::PeriodStatus::Approved
    );
}

#[test]
fn sec12_reputation_source_can_be_spoofed() {
    let env = Env::default();
    env.mock_all_auths();
    let authority = Address::generate(&env);
    let legitimate_source = Address::generate(&env);
    let fake_panel = Address::generate(&env);
    let subject = Address::generate(&env);
    let id = env.register(ReputationContract, (authority.clone(),));
    let client = ReputationContractClient::new(&env, &id);

    client.register(&subject, &h(&env, 24));
    client.authorize_source(&authority, &legitimate_source);
    // Authorized writer lies about `source`; the contract validates caller, not source.
    client.record_case(&legitimate_source, &subject, &1, &fake_panel, &h(&env, 25));

    let forged = client.get_case(&subject, &1, &fake_panel);
    assert_eq!(forged.source, fake_panel);
    assert_eq!(forged.outcome_hash, h(&env, 25));
    // The legitimate source can no longer record the true outcome for that key.
    assert_eq!(
        client.try_record_case(&legitimate_source, &subject, &1, &fake_panel, &h(&env, 26)),
        Err(Ok(ReputationError::DuplicateRecord))
    );
}

#[test]
fn sec14_reputation_fabricates_outcome_for_nonexistent_case() {
    let env = Env::default();
    env.mock_all_auths();
    let authority = Address::generate(&env);
    let subject = Address::generate(&env);
    let source = Address::generate(&env);
    let id = env.register(ReputationContract, (authority.clone(),));
    let client = ReputationContractClient::new(&env, &id);

    client.register(&subject, &h(&env, 27));
    client.record_case(&authority, &subject, &99_999, &source, &h(&env, 28));

    assert_eq!(client.get_profile(&subject).cases_recorded, 1);
    assert_eq!(
        client.get_case(&subject, &99_999, &source).outcome_hash,
        h(&env, 28)
    );
}

#[test]
fn sec13_settlement_hash_can_be_replayed_across_agreements() {
    let env = Env::default();
    env.mock_all_auths();
    let authority = Address::generate(&env);
    let writer = Address::generate(&env);
    let id = env.register(TraceabilityContract, (authority.clone(),));
    let client = TraceabilityContractClient::new(&env, &id);
    let real_settlement = h(&env, 29);

    client.link(&authority, &1, &1, &1, &1, &real_settlement);
    client.link(&authority, &2, &2, &2, &2, &real_settlement);

    assert_eq!(client.get_chain(&1).settlement_tx, real_settlement);
    assert_eq!(client.get_chain(&2).settlement_tx, real_settlement);
    let _ = writer;
}

#[test]
fn sec17_boveda_any_hash_holder_claims_the_full_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let funder = Address::generate(&env);
    let attacker = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&funder, &(UNIT * 10));
    let id = env.register(BovedaContract, (token.clone(), h(&env, 30)));
    let client = BovedaContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    client.fund(&funder, &UNIT);
    let claimed = client.reclamar(&attacker, &h(&env, 30));

    assert_eq!(claimed, UNIT);
    assert_eq!(token_client.balance(&attacker), UNIT);
    assert_eq!(token_client.balance(&funder), 9 * UNIT);
}

#[test]
fn sec09_instance_storage_denial_of_service() {
    use std::panic::{catch_unwind, AssertUnwindSafe};

    let env = Env::default();
    env.mock_all_auths();
    let authority = Address::generate(&env);
    let id = env.register(ReputationContract, (authority.clone(),));
    let client = ReputationContractClient::new(&env, &id);

    let mut succeeded = 0u32;
    let outcome = catch_unwind(AssertUnwindSafe(|| {
        for i in 0..500u32 {
            let subject = Address::generate(&env);
            client.register(&subject, &h(&env, (i % 251) as u8));
            succeeded += 1;
        }
    }));

    // A legitimate permissionless `register` hits the 65,536-byte instance-entry ceiling.
    assert!(
        outcome.is_err(),
        "expected the instance storage ceiling to be reached"
    );
    assert!(succeeded > 0);
    println!(
        "SEC-09 reproduced: instance entry limit hit after {} registrations",
        succeeded
    );
}
