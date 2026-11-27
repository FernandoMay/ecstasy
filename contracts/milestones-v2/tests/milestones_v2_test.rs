use milestones_v2::{
    MilestoneStatus, MilestoneV2Error, MilestonesV2Contract, MilestonesV2ContractClient, Outcome,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env, Vec,
};

const NOW: u64 = 1_700_000_000;
const UNIT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: MilestonesV2ContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
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
    let proposer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(UNIT * 10));
    let id = env.register(MilestonesV2Contract, (asset.clone(), resolver.clone()));
    Setup {
        env: env.clone(),
        client: MilestonesV2ContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        recipient,
        resolver,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

fn create(s: &Setup) -> u64 {
    s.client.create(
        &s.proposer,
        &s.recipient,
        &Vec::from_array(&s.env, [UNIT, UNIT]),
        &Vec::from_array(&s.env, [NOW + 100, NOW + 100]),
        &h(s, 1),
    )
}

#[test]
fn sec02_recover_on_disputed_is_rejected_and_resolution_survives() {
    let s = setup();
    let id = create(&s);
    s.client.submit(&s.recipient, &id, &0, &h(&s, 2));
    s.client.dispute(&s.proposer, &id, &0, &h(&s, 3));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 200);

    assert_eq!(
        s.client.try_recover(&s.outsider, &id, &0),
        Err(Ok(MilestoneV2Error::DisputeActive))
    );
    s.client.resolve(&s.resolver, &id, &0, &Outcome::Release);
    assert_eq!(
        s.client.get(&id).milestones.get(0).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
}

#[test]
fn sec02_recover_on_submitted_is_rejected_then_late_settlement_pays_recipient() {
    let s = setup();
    let id = create(&s);
    s.client.submit(&s.recipient, &id, &1, &h(&s, 4));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 200);

    assert_eq!(
        s.client.try_recover(&s.proposer, &id, &1),
        Err(Ok(MilestoneV2Error::InvalidState))
    );
    s.client.settle_after_deadline(&s.outsider, &id, &1);
    assert_eq!(
        s.client.get(&id).milestones.get(1).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
    assert_eq!(s.token.balance(&s.proposer), 8 * UNIT);
}

#[test]
fn pending_milestone_recovers_to_proposer_after_deadline() {
    let s = setup();
    let id = create(&s);
    assert_eq!(
        s.client.try_recover(&s.outsider, &id, &0),
        Err(Ok(MilestoneV2Error::DeadlineNotPassed))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 200);
    s.client.recover(&s.outsider, &id, &0);

    assert_eq!(
        s.client.get(&id).milestones.get(0).unwrap().status,
        MilestoneStatus::Recovered
    );
    assert_eq!(s.token.balance(&s.proposer), 9 * UNIT);
    assert_eq!(s.token.balance(&s.recipient), 0);
}

#[test]
fn approve_releases_only_the_submitted_milestone() {
    let s = setup();
    let id = create(&s);
    s.client.submit(&s.recipient, &id, &0, &h(&s, 5));
    s.client.approve(&s.proposer, &id, &0);

    assert_eq!(
        s.client.get(&id).milestones.get(0).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(
        s.client.get(&id).milestones.get(1).unwrap().status,
        MilestoneStatus::Pending
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
    assert_eq!(s.token.balance(&s.proposer), 8 * UNIT);
    assert_eq!(
        s.client.try_approve(&s.proposer, &id, &0),
        Err(Ok(MilestoneV2Error::InvalidState))
    );
}

#[test]
fn resolver_can_release_or_refund_each_disputed_milestone() {
    let s = setup();
    let id = create(&s);
    s.client.dispute(&s.recipient, &id, &0, &h(&s, 6));
    s.client.resolve(&s.resolver, &id, &0, &Outcome::Refund);
    s.client.dispute(&s.proposer, &id, &1, &h(&s, 7));
    s.client.resolve(&s.resolver, &id, &1, &Outcome::Release);

    assert_eq!(
        s.client.get(&id).milestones.get(0).unwrap().status,
        MilestoneStatus::Refunded
    );
    assert_eq!(
        s.client.get(&id).milestones.get(1).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
    assert_eq!(s.token.balance(&s.proposer), 9 * UNIT);
}

#[test]
fn timeout_refund_is_the_guaranteed_exit_for_dispute() {
    let s = setup();
    let id = create(&s);
    s.client.dispute(&s.proposer, &id, &0, &h(&s, 8));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 400);

    assert_eq!(
        s.client
            .try_resolve(&s.resolver, &id, &0, &Outcome::Release),
        Err(Ok(MilestoneV2Error::DeadlinePassed))
    );
    s.client.timeout_refund(&s.outsider, &id, &0);
    assert_eq!(
        s.client.get(&id).milestones.get(0).unwrap().status,
        MilestoneStatus::Refunded
    );
    assert_eq!(s.token.balance(&s.proposer), 9 * UNIT);
}

#[test]
fn terminal_states_reject_every_second_exit() {
    let s = setup();
    let id = create(&s);
    s.client.submit(&s.recipient, &id, &0, &h(&s, 9));
    s.client.approve(&s.proposer, &id, &0);

    assert_eq!(
        s.client.try_recover(&s.outsider, &id, &0),
        Err(Ok(MilestoneV2Error::AlreadySettled))
    );
    assert_eq!(
        s.client.try_dispute(&s.proposer, &id, &0, &h(&s, 10)),
        Err(Ok(MilestoneV2Error::DisputeNotAllowed))
    );
    assert_eq!(
        s.client.try_timeout_refund(&s.outsider, &id, &0),
        Err(Ok(MilestoneV2Error::InvalidState))
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
}

#[test]
fn deposits_must_match_the_exact_milestone_sum() {
    let s = setup();
    assert_eq!(
        s.client.try_create(
            &s.proposer,
            &s.recipient,
            &Vec::from_array(&s.env, [UNIT, 0]),
            &Vec::from_array(&s.env, [NOW + 100, NOW + 100]),
            &h(&s, 11),
        ),
        Err(Ok(MilestoneV2Error::InvalidAmount))
    );
    assert_eq!(
        s.client.try_create(
            &s.proposer,
            &s.recipient,
            &Vec::from_array(&s.env, [UNIT]),
            &Vec::from_array(&s.env, [NOW + 100, NOW + 200]),
            &h(&s, 12),
        ),
        Err(Ok(MilestoneV2Error::InvalidMilestone))
    );
}
