use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};
use streaming::{StreamError, StreamStatus, StreamingContract, StreamingContractClient};

const NOW: u64 = 1_700_000_000;
const RATE: i128 = 1_000;
const DURATION: u64 = 100;
const DEPOSIT: i128 = RATE * DURATION as i128;

struct Setup {
    env: Env,
    client: StreamingContractClient<'static>,
    token: TokenClient<'static>,
    payer: Address,
    recipient: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let asset = sac.address();
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&payer, &(DEPOSIT * 10));
    let id = env.register(StreamingContract, (asset.clone(),));
    Setup {
        env: env.clone(),
        client: StreamingContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        payer,
        recipient,
        outsider,
    }
}

fn create(s: &Setup) -> u64 {
    s.client
        .create_stream(&s.payer, &s.recipient, &DEPOSIT, &RATE, &DURATION)
}

#[test]
fn claim_releases_only_accrued_stroops_and_rejects_duplicate() {
    let s = setup();
    let id = create(&s);
    assert_eq!(s.token.balance(&s.payer), 9 * DEPOSIT);

    s.env.ledger().with_mut(|li| li.timestamp = NOW + 10);
    assert_eq!(s.client.claim(&s.recipient, &id), 10_000);
    assert_eq!(s.token.balance(&s.recipient), 10_000);
    assert_eq!(
        s.client.try_claim(&s.recipient, &id),
        Err(Ok(StreamError::NothingToClaim))
    );

    s.env.ledger().with_mut(|li| li.timestamp = NOW + 25);
    assert_eq!(s.client.claimable(&id), 15_000);
    assert_eq!(s.client.claim(&s.recipient, &id), 15_000);
    assert_eq!(s.token.balance(&s.recipient), 25_000);
    assert_eq!(s.client.get_stream(&id).withdrawn, 25_000);
}

#[test]
fn pause_freezes_accrual_and_resume_accounts_every_second() {
    let s = setup();
    let id = create(&s);

    s.env.ledger().with_mut(|li| li.timestamp = NOW + 10);
    s.client.claim(&s.recipient, &id);
    s.client.pause(&s.payer, &id);
    assert_eq!(s.client.get_stream(&id).status, StreamStatus::Paused);

    s.env.ledger().with_mut(|li| li.timestamp = NOW + 50);
    assert_eq!(s.client.claimable(&id), 0);
    assert_eq!(
        s.client.try_claim(&s.recipient, &id),
        Err(Ok(StreamError::NothingToClaim))
    );

    s.client.resume(&s.payer, &id);
    assert_eq!(s.client.get_stream(&id).paused_total, 40);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 55);
    assert_eq!(s.client.claimable(&id), 5_000);
    assert_eq!(s.client.claim(&s.recipient, &id), 5_000);
    assert_eq!(s.token.balance(&s.recipient), 15_000);
}

#[test]
fn cancel_settles_accrued_and_refunds_the_remainder() {
    let s = setup();
    let id = create(&s);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 30);
    s.client.cancel(&s.payer, &id);

    assert_eq!(s.token.balance(&s.recipient), 30_000);
    assert_eq!(s.token.balance(&s.payer), 9 * DEPOSIT + 70_000);
    assert_eq!(s.client.get_stream(&id).status, StreamStatus::Cancelled);
    assert_eq!(s.client.claimable(&id), 0);
    assert_eq!(
        s.client.try_claim(&s.recipient, &id),
        Err(Ok(StreamError::InvalidState))
    );
    assert_eq!(
        s.client.try_resume(&s.payer, &id),
        Err(Ok(StreamError::InvalidState))
    );
}

#[test]
fn fully_vested_stream_closes_terminally() {
    let s = setup();
    let id = create(&s);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 100);
    assert_eq!(s.client.claim(&s.recipient, &id), DEPOSIT);
    s.client.close(&s.outsider, &id);

    assert_eq!(s.client.get_stream(&id).status, StreamStatus::Closed);
    assert_eq!(s.token.balance(&s.recipient), DEPOSIT);
    assert_eq!(s.token.balance(&s.payer), 9 * DEPOSIT);
    assert_eq!(
        s.client.try_claim(&s.recipient, &id),
        Err(Ok(StreamError::InvalidState))
    );
    assert_eq!(
        s.client.try_cancel(&s.payer, &id),
        Err(Ok(StreamError::InvalidState))
    );
}

#[test]
fn deposit_must_equal_rate_times_duration() {
    let s = setup();
    assert_eq!(
        s.client
            .try_create_stream(&s.payer, &s.recipient, &(DEPOSIT - 1), &RATE, &DURATION),
        Err(Ok(StreamError::InvalidAmount))
    );
    assert_eq!(
        s.client
            .try_create_stream(&s.payer, &s.recipient, &DEPOSIT, &RATE, &0),
        Err(Ok(StreamError::InvalidDuration))
    );
    assert_eq!(
        s.client
            .try_create_stream(&s.payer, &s.recipient, &DEPOSIT, &0, &DURATION),
        Err(Ok(StreamError::InvalidAmount))
    );
    assert_eq!(
        s.client
            .try_create_stream(&s.payer, &s.recipient, &DEPOSIT, &RATE, &31_536_001),
        Err(Ok(StreamError::InvalidDuration))
    );
}

#[test]
fn only_the_payer_can_pause_and_only_the_recipient_can_claim() {
    let s = setup();
    let id = create(&s);
    assert_eq!(
        s.client.try_pause(&s.outsider, &id),
        Err(Ok(StreamError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_claim(&s.outsider, &id),
        Err(Ok(StreamError::NotAuthorized))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 5);
    s.client.pause(&s.payer, &id);
    assert_eq!(
        s.client.try_resume(&s.outsider, &id),
        Err(Ok(StreamError::NotAuthorized))
    );
}
