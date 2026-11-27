use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};
use subscription::{
    Outcome, PeriodStatus, SubscriptionContract, SubscriptionContractClient, SubscriptionError,
};

const NOW: u64 = 1_700_000_000;
const AMOUNT: i128 = 1_000_000;
const FREQUENCY: u64 = 60;

struct Setup {
    env: Env,
    client: SubscriptionContractClient<'static>,
    token: TokenClient<'static>,
    payer: Address,
    recipient: Address,
    resolver: Address,
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
    let resolver = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&payer, &(AMOUNT * 10));
    let id = env.register(SubscriptionContract, (asset.clone(), resolver.clone()));
    Setup {
        env: env.clone(),
        client: SubscriptionContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        payer,
        recipient,
        resolver,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

fn plan(s: &Setup) -> u64 {
    s.client
        .create_plan(&s.payer, &s.recipient, &AMOUNT, &FREQUENCY)
}

#[test]
fn funded_period_pays_only_after_delivery_and_approval() {
    let s = setup();
    let id = plan(&s);
    s.client.fund_period(&s.payer, &id, &1, &(NOW + 1000));
    assert_eq!(s.token.balance(&s.payer), 9 * AMOUNT);

    s.client.submit_delivery(&s.recipient, &id, &1, &h(&s, 2));
    s.client.approve(&s.payer, &id, &1);

    assert_eq!(s.client.get_period(&id, &1).status, PeriodStatus::Approved);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(s.token.balance(&s.payer), 9 * AMOUNT);
    assert_eq!(
        s.client.try_fund_period(&s.payer, &id, &1, &(NOW + 1000)),
        Err(Ok(SubscriptionError::DuplicatePeriod))
    );
    assert_eq!(
        s.client.try_approve(&s.payer, &id, &1),
        Err(Ok(SubscriptionError::InvalidState))
    );
}

#[test]
fn disputed_period_does_not_affect_other_periods() {
    let s = setup();
    let id = plan(&s);
    s.client.fund_period(&s.payer, &id, &1, &(NOW + 1000));
    s.client.fund_period(&s.payer, &id, &2, &(NOW + 1000));
    s.client.submit_delivery(&s.recipient, &id, &1, &h(&s, 3));
    s.client.approve(&s.payer, &id, &1);
    s.client.dispute(&s.recipient, &id, &2, &h(&s, 4));
    s.client
        .resolve_dispute(&s.resolver, &id, &2, &Outcome::Refund);

    assert_eq!(s.client.get_period(&id, &1).status, PeriodStatus::Approved);
    assert_eq!(s.client.get_period(&id, &2).status, PeriodStatus::Refunded);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(s.token.balance(&s.payer), 9 * AMOUNT);
    assert_eq!(
        s.client
            .try_resolve_dispute(&s.resolver, &id, &2, &Outcome::Release),
        Err(Ok(SubscriptionError::InvalidState))
    );
}

#[test]
fn cancelling_plan_blocks_new_periods_but_keeps_funded_ones() {
    let s = setup();
    let id = plan(&s);
    s.client.fund_period(&s.payer, &id, &1, &(NOW + 1000));
    s.client.cancel_plan(&s.payer, &id);

    assert_eq!(
        s.client.try_fund_period(&s.payer, &id, &2, &(NOW + 1000)),
        Err(Ok(SubscriptionError::PlanCancelled))
    );
    s.client.submit_delivery(&s.recipient, &id, &1, &h(&s, 5));
    s.client.approve(&s.payer, &id, &1);
    assert_eq!(s.client.get_period(&id, &1).status, PeriodStatus::Approved);
    assert_eq!(s.client.get_periods(&id).len(), 1);
    assert!(s.client.get_plan(&id).cancelled);
}

#[test]
fn no_deposit_means_no_executable_obligation() {
    let s = setup();
    let id = plan(&s);
    assert_eq!(
        s.client.try_get_period(&id, &1),
        Err(Ok(SubscriptionError::NotFound))
    );
    assert_eq!(
        s.client.try_approve(&s.payer, &id, &1),
        Err(Ok(SubscriptionError::NotFound))
    );
    assert_eq!(
        s.client
            .try_fund_period(&s.outsider, &id, &1, &(NOW + 1000)),
        Err(Ok(SubscriptionError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_fund_period(&s.payer, &id, &1, &NOW),
        Err(Ok(SubscriptionError::InvalidDueDate))
    );
    assert_eq!(s.token.balance(&s.payer), 10 * AMOUNT);
}

#[test]
fn only_resolver_settles_and_only_once() {
    let s = setup();
    let id = plan(&s);
    s.client.fund_period(&s.payer, &id, &1, &(NOW + 1000));
    s.client.dispute(&s.payer, &id, &1, &h(&s, 6));

    assert_eq!(
        s.client
            .try_resolve_dispute(&s.outsider, &id, &1, &Outcome::Release),
        Err(Ok(SubscriptionError::NotAuthorized))
    );
    s.client
        .resolve_dispute(&s.resolver, &id, &1, &Outcome::Release);
    assert_eq!(s.client.get_period(&id, &1).status, PeriodStatus::Approved);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(
        s.client
            .try_resolve_dispute(&s.resolver, &id, &1, &Outcome::Refund),
        Err(Ok(SubscriptionError::InvalidState))
    );
}

#[test]
fn plan_limits_and_complete_history_are_enforced() {
    let s = setup();
    assert_eq!(
        s.client
            .try_create_plan(&s.payer, &s.recipient, &0, &FREQUENCY),
        Err(Ok(SubscriptionError::InvalidAmount))
    );
    assert_eq!(
        s.client
            .try_create_plan(&s.payer, &s.recipient, &AMOUNT, &0),
        Err(Ok(SubscriptionError::InvalidFrequency))
    );
    assert_eq!(
        s.client
            .try_create_plan(&s.payer, &s.recipient, &AMOUNT, &31_536_001),
        Err(Ok(SubscriptionError::InvalidFrequency))
    );

    let id = plan(&s);
    for period_id in 1..=3 {
        s.client
            .fund_period(&s.payer, &id, &period_id, &(NOW + 1000));
    }
    let history = s.client.get_periods(&id);
    assert_eq!(history.len(), 3);
    for (index, period) in history.iter().enumerate() {
        assert_eq!(period.period_id as usize, index + 1);
        assert_eq!(period.amount, AMOUNT);
        assert_eq!(period.status, PeriodStatus::Funded);
    }
}
