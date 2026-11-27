//! P1 additional harness — SEC-10, SEC-18, SEC-19, SEC-26. Local only.

use disputes::{DisputesContract, DisputesContractClient};
use ecstasy::{EcstasyContract, EcstasyContractClient};
use recovery::{RecoveryContract, RecoveryContractClient, RecoveryError};
use refunds::{RefundsContract, RefundsContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
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

#[test]
fn sec10_disputes_can_be_spammed_without_link_to_an_encounter() {
    let env = Env::default();
    env.mock_all_auths();
    let resolver = Address::generate(&env);
    let attacker = Address::generate(&env);
    let victim = Address::generate(&env);
    let id = env.register(DisputesContract, (resolver.clone(),));
    let client = DisputesContractClient::new(&env, &id);

    for i in 0..50u64 {
        client.open(&attacker, &i, &victim, &h(&env, (i % 251) as u8));
    }
    assert_eq!(client.open(&attacker, &0, &victim, &h(&env, 1)), 51);
    // No proof of encounter participation and no uniqueness constraint on encounter_id.
}

#[test]
fn sec19_recovery_expiry_has_no_upper_bound() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let recipient = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(RecoveryContract, (token.clone(),));
    let client = RecoveryContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let far_future = NOW + 100 * 365 * 24 * 3600; // 100 years
    let case = client.propose(
        &proposer,
        &counterparty,
        &recipient,
        &UNIT,
        &h(&env, 40),
        &far_future,
    );
    client.approve(&counterparty, &case, &h(&env, 40));
    assert_eq!(
        client.try_recover(&counterparty, &case),
        Err(Ok(RecoveryError::StillPending))
    );
    assert_eq!(token_client.balance(&id), UNIT);
}

#[test]
fn sec26_ecstasy_completed_has_no_permissionless_exit() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&creator, &(UNIT * 10));
    let id = env.register(EcstasyContract, (token.clone(),));
    let client = EcstasyContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    let encounter = client.create_encounter(
        &creator,
        &participant,
        &token,
        &UNIT,
        &h(&env, 41),
        &(NOW + 100),
    );
    client.accept_encounter(&participant, &encounter);
    client.complete_encounter(&creator, &encounter);
    client.complete_encounter(&participant, &encounter);
    env.ledger().with_mut(|li| li.timestamp = NOW + 200);

    // is_expired only covers Created|Accepted, so expire cannot finish Completed.
    assert!(client.try_expire_encounter(&encounter).is_err());
    assert_eq!(token_client.balance(&id), UNIT);
    // Settlement still requires one of the parties to sign.
    client.settle_encounter(&creator, &encounter);
    assert_eq!(token_client.balance(&id), 0);
}

#[test]
fn sec18_refunds_intent_hash_is_not_bound_to_recipient() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token = asset(&env, &admin);
    let proposer = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let honest_recipient = Address::generate(&env);
    let attacker = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&proposer, &(UNIT * 10));
    let id = env.register(RefundsContract, (token.clone(),));
    let client = RefundsContractClient::new(&env, &id);
    let token_client = TokenClient::new(&env, &token);

    // The counterparty agreed off-chain to a digest for `honest_recipient`.
    let digest = h(&env, 42);
    let agreed = client.propose(&proposer, &counterparty, &honest_recipient, &UNIT, &digest);
    // The same digest is reused with an attacker-controlled recipient; no binding is checked.
    let hijacked = client.propose(&proposer, &counterparty, &attacker, &UNIT, &digest);
    client.approve(&counterparty, &hijacked, &digest);
    client.execute(&counterparty, &hijacked);

    assert_eq!(token_client.balance(&attacker), UNIT);
    assert_eq!(token_client.balance(&honest_recipient), 0);
    assert_eq!(client.get(&agreed).status, refunds::RefundStatus::Pending);
}
