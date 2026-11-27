use milestones::{
    MilestoneError, MilestoneStatus, MilestonesContract, MilestonesContractClient, Outcome,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env, Vec,
};

const NOW: u64 = 1_700_000_000;
const MILESTONE: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: MilestonesContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
    recipient: Address,
    resolver: Address,
    third_party: Address,
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
    let third_party = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(MILESTONE * 10));
    let id = env.register(MilestonesContract, (asset.clone(), resolver.clone()));
    Setup {
        env: env.clone(),
        client: MilestonesContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        recipient,
        resolver,
        third_party,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

fn create(s: &Setup, second_deadline: u64) -> u64 {
    let amounts = Vec::from_array(&s.env, [MILESTONE, MILESTONE]);
    let deadlines = Vec::from_array(&s.env, [NOW + 1000, second_deadline]);
    s.client
        .create(&s.proposer, &s.recipient, &amounts, &deadlines, &h(s, 1))
}

#[test]
fn approved_milestone_releases_only_its_amount() {
    let s = setup();
    let id = create(&s, NOW + 1000);

    s.client.submit(&s.recipient, &id, &0, &h(&s, 2));
    s.client.approve(&s.proposer, &id, &0);

    let agreement = s.client.get(&id);
    assert_eq!(
        agreement.milestones.get(0).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(
        agreement.milestones.get(1).unwrap().status,
        MilestoneStatus::Pending
    );
    assert_eq!(s.token.balance(&s.recipient), MILESTONE);
    assert_eq!(s.token.balance(&s.proposer), 8 * MILESTONE);

    assert_eq!(
        s.client.try_approve(&s.proposer, &id, &0),
        Err(Ok(MilestoneError::InvalidState))
    );
}

#[test]
fn disputed_milestone_is_resolved_without_unlocking_others() {
    let s = setup();
    let id = create(&s, NOW + 1000);

    s.client.dispute(&s.proposer, &id, &1, &h(&s, 3));
    s.client.resolve(&s.resolver, &id, &1, &Outcome::Release);

    let agreement = s.client.get(&id);
    assert_eq!(
        agreement.milestones.get(1).unwrap().status,
        MilestoneStatus::Paid
    );
    assert_eq!(
        agreement.milestones.get(0).unwrap().status,
        MilestoneStatus::Pending
    );
    assert_eq!(s.token.balance(&s.recipient), MILESTONE);
    assert_eq!(
        s.client.try_resolve(&s.resolver, &id, &1, &Outcome::Refund),
        Err(Ok(MilestoneError::InvalidState))
    );
}

#[test]
fn expired_milestone_can_be_recovered_by_any_account() {
    let s = setup();
    let id = create(&s, NOW + 10);

    assert_eq!(
        s.client.try_recover(&s.third_party, &id, &1),
        Err(Ok(MilestoneError::DeadlineNotPassed))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 20);
    s.client.recover(&s.third_party, &id, &1);

    let agreement = s.client.get(&id);
    assert_eq!(
        agreement.milestones.get(1).unwrap().status,
        MilestoneStatus::Recovered
    );
    assert_eq!(
        agreement.milestones.get(0).unwrap().status,
        MilestoneStatus::Pending
    );
    assert_eq!(s.token.balance(&s.proposer), 9 * MILESTONE);
    assert_eq!(s.token.balance(&s.recipient), 0);
    assert_eq!(
        s.client.try_recover(&s.proposer, &id, &1),
        Err(Ok(MilestoneError::AlreadySettled))
    );
}

#[test]
fn zero_amount_milestones_are_rejected() {
    let s = setup();
    let amounts = Vec::from_array(&s.env, [MILESTONE, 0]);
    let deadlines = Vec::from_array(&s.env, [NOW + 1000, NOW + 1000]);
    assert_eq!(
        s.client
            .try_create(&s.proposer, &s.recipient, &amounts, &deadlines, &h(&s, 9)),
        Err(Ok(MilestoneError::InvalidAmount))
    );
}
