use arbitration_v2::{
    ArbitrationV2Contract, ArbitrationV2ContractClient, ArbitrationV2Error, CaseStatus, Outcome,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

const NOW: u64 = 1_700_000_000;
const UNIT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: ArbitrationV2ContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
    counterparty: Address,
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
    let counterparty = Address::generate(&env);
    let recipient = Address::generate(&env);
    let resolver = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(UNIT * 10));
    let id = env.register(ArbitrationV2Contract, (asset.clone(), resolver.clone()));
    Setup {
        env: env.clone(),
        client: ArbitrationV2ContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        counterparty,
        recipient,
        resolver,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

fn create(s: &Setup, amount: i128) -> u64 {
    s.client.deposit(
        &s.proposer,
        &7,
        &s.counterparty,
        &s.recipient,
        &amount,
        &(NOW + 100),
        &(NOW + 200),
    )
}

#[test]
fn resolver_release_after_window_pays_recipient() {
    let s = setup();
    let case = create(&s, UNIT);
    s.client.argue(&s.proposer, &case, &h(&s, 1));
    s.client.argue(&s.counterparty, &case, &h(&s, 2));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 150);
    s.client.resolve(&s.resolver, &case, &Outcome::Release);

    assert_eq!(s.client.get(&case).status, CaseStatus::Resolved);
    assert_eq!(s.client.get(&case).outcome_code, Some(1));
    assert_eq!(s.token.balance(&s.recipient), UNIT);
    assert_eq!(s.token.balance(&s.proposer), 9 * UNIT);
}

#[test]
fn resolver_refund_and_split_reconcile_exactly() {
    let s = setup();
    let refund = create(&s, UNIT);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 150);
    s.client.resolve(&s.resolver, &refund, &Outcome::Refund);
    assert_eq!(s.token.balance(&s.proposer), 10 * UNIT);
    assert_eq!(s.token.balance(&s.recipient), 0);

    let s2 = setup();
    let odd = 1_000_001;
    let split = create(&s2, odd);
    s2.env.ledger().with_mut(|li| li.timestamp = NOW + 150);
    s2.client.resolve(&s2.resolver, &split, &Outcome::Split);
    assert_eq!(s2.token.balance(&s2.recipient), odd / 2);
    assert_eq!(
        s2.token.balance(&s2.proposer),
        10 * UNIT - odd + (odd - odd / 2)
    );
}

#[test]
fn timeout_with_both_evidence_splits() {
    let s = setup();
    let case = create(&s, UNIT);
    s.client.argue(&s.proposer, &case, &h(&s, 3));
    s.client.argue(&s.counterparty, &case, &h(&s, 4));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 300);

    s.client.timeout(&s.outsider, &case);

    assert_eq!(s.client.get(&case).status, CaseStatus::TimedOut);
    assert_eq!(s.client.get(&case).outcome_code, Some(3));
    assert_eq!(s.token.balance(&s.recipient), UNIT / 2);
    assert_eq!(s.token.balance(&s.proposer), 9 * UNIT + UNIT / 2);
}

#[test]
fn timeout_with_proposer_only_evidence_refunds() {
    let s = setup();
    let case = create(&s, UNIT);
    s.client.argue(&s.proposer, &case, &h(&s, 5));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 300);
    s.client.timeout(&s.outsider, &case);

    assert_eq!(s.client.get(&case).outcome_code, Some(2));
    assert_eq!(s.token.balance(&s.proposer), 10 * UNIT);
    assert_eq!(s.token.balance(&s.recipient), 0);
}

#[test]
fn timeout_with_recipient_only_evidence_releases() {
    let s = setup();
    let case = create(&s, UNIT);
    s.client.argue(&s.counterparty, &case, &h(&s, 6));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 300);
    s.client.timeout(&s.outsider, &case);

    assert_eq!(s.client.get(&case).outcome_code, Some(1));
    assert_eq!(s.token.balance(&s.recipient), UNIT);
}

#[test]
fn timeout_with_no_evidence_refunds_to_origin() {
    let s = setup();
    let case = create(&s, UNIT);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 300);
    s.client.timeout(&s.outsider, &case);

    assert_eq!(s.client.get(&case).status, CaseStatus::TimedOut);
    assert_eq!(s.client.get(&case).outcome_code, Some(2));
    assert_eq!(s.token.balance(&s.proposer), 10 * UNIT);
    assert_eq!(s.token.balance(&s.recipient), 0);
}

#[test]
fn sec01_resolver_absent_never_blocks_funds() {
    let s = setup();
    let case = create(&s, UNIT);
    // Resolver never signs. Far beyond resolve_by.
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 10_000);
    assert_eq!(s.client.get(&case).status, CaseStatus::Open);
    assert_eq!(s.token.balance(&s.recipient), 0);
    s.client.timeout(&s.outsider, &case);
    assert_eq!(s.client.get(&case).status, CaseStatus::TimedOut);
}

#[test]
fn resolve_outside_window_is_rejected_and_timeout_requires_deadline() {
    let s = setup();
    let case = create(&s, UNIT);
    assert_eq!(
        s.client.try_resolve(&s.resolver, &case, &Outcome::Release),
        Err(Ok(ArbitrationV2Error::TooEarly))
    );
    assert_eq!(
        s.client.try_timeout(&s.outsider, &case),
        Err(Ok(ArbitrationV2Error::TooEarly))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 150);
    s.client.resolve(&s.resolver, &case, &Outcome::Refund);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 250);
    assert_eq!(
        s.client.try_resolve(&s.resolver, &case, &Outcome::Release),
        Err(Ok(ArbitrationV2Error::InvalidState))
    );
    assert_eq!(
        s.client.try_timeout(&s.outsider, &case),
        Err(Ok(ArbitrationV2Error::InvalidState))
    );
}

#[test]
fn late_resolve_after_resolve_by_is_rejected() {
    let s = setup();
    let case = create(&s, UNIT);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 300);
    assert_eq!(
        s.client.try_resolve(&s.resolver, &case, &Outcome::Release),
        Err(Ok(ArbitrationV2Error::InvalidDeadline))
    );
}

#[test]
fn evidence_deadline_and_duplicates_are_enforced() {
    let s = setup();
    let case = create(&s, UNIT);
    s.client.argue(&s.proposer, &case, &h(&s, 7));
    assert_eq!(
        s.client.try_argue(&s.proposer, &case, &h(&s, 8)),
        Err(Ok(ArbitrationV2Error::DuplicateEvidence))
    );
    assert_eq!(
        s.client.try_argue(&s.outsider, &case, &h(&s, 9)),
        Err(Ok(ArbitrationV2Error::NotAuthorized))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 150);
    assert_eq!(
        s.client.try_argue(&s.counterparty, &case, &h(&s, 10)),
        Err(Ok(ArbitrationV2Error::EvidenceDeadlinePassed))
    );
}

#[test]
fn invalid_windows_and_amounts_are_rejected() {
    let s = setup();
    assert_eq!(
        s.client.try_deposit(
            &s.proposer,
            &1,
            &s.counterparty,
            &s.recipient,
            &0,
            &(NOW + 100),
            &(NOW + 200),
        ),
        Err(Ok(ArbitrationV2Error::InvalidAmount))
    );
    assert_eq!(
        s.client.try_deposit(
            &s.proposer,
            &1,
            &s.counterparty,
            &s.recipient,
            &UNIT,
            &(NOW + 200),
            &(NOW + 100),
        ),
        Err(Ok(ArbitrationV2Error::InvalidDeadline))
    );
}
