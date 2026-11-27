use arbitration::{
    ArbitrationContract, ArbitrationContractClient, ArbitrationError, CaseStatus, Outcome,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

const AMOUNT: i128 = 10_000_000;
const NOW: u64 = 1_700_000_000;

struct Setup {
    env: Env,
    client: ArbitrationContractClient<'static>,
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
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(AMOUNT * 4));
    let id = env.register(ArbitrationContract, (asset.clone(), resolver.clone()));
    Setup {
        env: env.clone(),
        client: ArbitrationContractClient::new(&env, &id),
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

fn deposit(s: &Setup, byte: u8) -> u64 {
    s.client.deposit(
        &s.proposer,
        &7,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(s, byte),
        &(NOW + 100),
    )
}

#[test]
fn all_three_outcomes_move_real_funds() {
    let s = setup();

    let release = deposit(&s, 1);
    s.client.argue(&s.proposer, &release, &h(&s, 10));
    s.client.resolve(&s.resolver, &release, &Outcome::Release);
    assert_eq!(s.client.get(&release).status, CaseStatus::Resolved);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);

    let refund = deposit(&s, 2);
    s.client.resolve(&s.resolver, &refund, &Outcome::Refund);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);

    let split = deposit(&s, 3);
    s.client.resolve(&s.resolver, &split, &Outcome::Split);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT + AMOUNT / 2);
    assert_eq!(s.token.balance(&s.proposer), 2 * AMOUNT + AMOUNT / 2);
    assert_eq!(s.token.balance(&env_contract(&s)), 0);
}

fn env_contract(s: &Setup) -> Address {
    s.client.address.clone()
}

#[test]
fn only_resolver_resolves_and_never_twice() {
    let s = setup();
    let id = deposit(&s, 4);
    assert_eq!(
        s.client.try_resolve(&s.proposer, &id, &Outcome::Release),
        Err(Ok(ArbitrationError::NotAuthorized))
    );
    s.client.resolve(&s.resolver, &id, &Outcome::Release);
    assert_eq!(
        s.client.try_resolve(&s.resolver, &id, &Outcome::Refund),
        Err(Ok(ArbitrationError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
}

#[test]
fn arguments_are_limited_to_parties_before_deadline() {
    let s = setup();
    let id = deposit(&s, 5);
    assert_eq!(
        s.client.try_argue(&s.outsider, &id, &h(&s, 11)),
        Err(Ok(ArbitrationError::NotAuthorized))
    );
    s.client.argue(&s.counterparty, &id, &h(&s, 12));
    assert_eq!(
        s.client.try_argue(&s.counterparty, &id, &h(&s, 13)),
        Err(Ok(ArbitrationError::AlreadyArgued))
    );

    s.env.ledger().with_mut(|li| li.timestamp = NOW + 200);
    assert_eq!(
        s.client.try_argue(&s.proposer, &id, &h(&s, 14)),
        Err(Ok(ArbitrationError::DeadlinePassed))
    );
    // A resolver may still settle after the argument window closes.
    s.client.resolve(&s.resolver, &id, &Outcome::Release);
    assert_eq!(s.client.get(&id).status, CaseStatus::Resolved);
}
