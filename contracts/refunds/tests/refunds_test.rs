use refunds::{RefundError, RefundStatus, RefundsContract, RefundsContractClient};
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

const AMOUNT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: RefundsContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
    counterparty: Address,
    recipient: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let asset = sac.address();
    let proposer = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let recipient = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(AMOUNT * 4));
    let id = env.register(RefundsContract, (asset.clone(),));
    Setup {
        env: env.clone(),
        client: RefundsContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        counterparty,
        recipient,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn mutual_refund_executes_real_transfer_once() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 1),
    );
    assert_eq!(s.client.get(&id).status, RefundStatus::Pending);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);
    assert_eq!(s.token.balance(&s.recipient), 0);

    s.client.approve(&s.counterparty, &id, &h(&s, 1));
    assert_eq!(s.client.get(&id).status, RefundStatus::Approved);
    assert_eq!(s.token.balance(&s.recipient), 0);

    s.client.execute(&s.proposer, &id);
    assert_eq!(s.client.get(&id).status, RefundStatus::Refunded);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);

    assert_eq!(
        s.client.try_execute(&s.counterparty, &id),
        Err(Ok(RefundError::InvalidState))
    );
}

#[test]
fn reject_and_revoke_return_funds_without_approval() {
    let s = setup();
    let rejected = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 2),
    );
    s.client.reject(&s.counterparty, &rejected);
    assert_eq!(s.client.get(&rejected).status, RefundStatus::Rejected);
    assert_eq!(s.token.balance(&s.proposer), 4 * AMOUNT);
    assert_eq!(s.token.balance(&s.recipient), 0);

    let revoked = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 3),
    );
    s.client.revoke(&s.proposer, &revoked);
    assert_eq!(s.client.get(&revoked).status, RefundStatus::Revoked);
    assert_eq!(s.token.balance(&s.proposer), 4 * AMOUNT);
}

#[test]
fn approval_requires_matching_intent_and_only_counterparty() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 4),
    );
    assert_eq!(
        s.client.try_approve(&s.proposer, &id, &h(&s, 4)),
        Err(Ok(RefundError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_approve(&s.outsider, &id, &h(&s, 4)),
        Err(Ok(RefundError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_approve(&s.counterparty, &id, &h(&s, 5)),
        Err(Ok(RefundError::IntentMismatch))
    );
    // One-sided authorization leaves funds locked in the contract.
    assert_eq!(s.client.get(&id).status, RefundStatus::Pending);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);
    assert_eq!(s.token.balance(&s.recipient), 0);
}
