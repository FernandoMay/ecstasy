use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};
use vault_v2::{VaultStatus, VaultV2Contract, VaultV2ContractClient, VaultV2Error};

const NOW: u64 = 1_700_000_000;
const UNIT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: VaultV2ContractClient<'static>,
    token: TokenClient<'static>,
    a: Address,
    b: Address,
    destination: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let asset = sac.address();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let destination = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&a, &(UNIT * 10));
    StellarAssetClient::new(&env, &asset).mint(&b, &(UNIT * 10));
    let id = env.register(VaultV2Contract, (asset.clone(), destination.clone()));
    Setup {
        env: env.clone(),
        client: VaultV2ContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        a,
        b,
        destination,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn sec04_direct_transfer_is_not_attributed_or_withdrawable() {
    let s = setup();
    let vault = s.client.create_vault(&s.a, &h(&s, 1));
    // Direct, unofficial transfer into the contract.
    StellarAssetClient::new(&s.env, &s.token.address).mint(&s.client.address, &(5 * UNIT));

    assert_eq!(s.client.get_surplus(), 5 * UNIT);
    assert_eq!(s.client.get_vault(&vault).attributed, 0);
    assert_eq!(
        s.client.try_withdraw(&s.a, &vault, &UNIT),
        Err(Ok(VaultV2Error::InsufficientAttributed))
    );
    assert_eq!(s.client.get_surplus(), 5 * UNIT);
}

#[test]
fn legitimate_funding_and_withdrawal_are_exact() {
    let s = setup();
    let vault = s.client.create_vault(&s.a, &h(&s, 2));
    s.client.fund(&s.a, &vault, &(3 * UNIT));
    assert_eq!(s.client.get_vault(&vault).attributed, 3 * UNIT);

    assert_eq!(s.client.withdraw(&s.a, &vault, &UNIT), UNIT);
    assert_eq!(s.client.get_vault(&vault).attributed, 2 * UNIT);
    assert_eq!(s.token.balance(&s.a), 10 * UNIT - 3 * UNIT + UNIT);
    assert_eq!(s.client.get_surplus(), 0);
}

#[test]
fn multi_vault_attribution_is_isolated() {
    let s = setup();
    let va = s.client.create_vault(&s.a, &h(&s, 3));
    let vb = s.client.create_vault(&s.b, &h(&s, 4));
    s.client.fund(&s.a, &va, &(2 * UNIT));
    s.client.fund(&s.b, &vb, &(3 * UNIT));

    assert_eq!(
        s.client.try_withdraw(&s.a, &vb, &UNIT),
        Err(Ok(VaultV2Error::NotAuthorized))
    );
    StellarAssetClient::new(&s.env, &s.token.address).mint(&s.client.address, &UNIT);
    assert_eq!(s.client.get_vault(&va).attributed, 2 * UNIT);
    assert_eq!(s.client.get_vault(&vb).attributed, 3 * UNIT);
    assert_eq!(s.client.get_surplus(), UNIT);
}

#[test]
fn double_and_excess_withdrawals_are_rejected() {
    let s = setup();
    let vault = s.client.create_vault(&s.a, &h(&s, 5));
    s.client.fund(&s.a, &vault, &UNIT);
    s.client.withdraw(&s.a, &vault, &UNIT);
    assert_eq!(
        s.client.try_withdraw(&s.a, &vault, &UNIT),
        Err(Ok(VaultV2Error::InsufficientAttributed))
    );
    assert_eq!(s.token.balance(&s.a), 10 * UNIT);
}

#[test]
fn close_requires_zero_attribution() {
    let s = setup();
    let vault = s.client.create_vault(&s.a, &h(&s, 6));
    s.client.fund(&s.a, &vault, &UNIT);
    assert_eq!(
        s.client.try_close(&s.a, &vault),
        Err(Ok(VaultV2Error::InvalidState))
    );
    s.client.withdraw(&s.a, &vault, &UNIT);
    s.client.close(&s.a, &vault);
    assert_eq!(s.client.get_vault(&vault).status, VaultStatus::Closed);
    assert_eq!(
        s.client.try_fund(&s.a, &vault, &UNIT),
        Err(Ok(VaultV2Error::InvalidState))
    );
}

#[test]
fn surplus_sweeps_only_to_the_declared_destination() {
    let s = setup();
    let vault = s.client.create_vault(&s.a, &h(&s, 7));
    s.client.fund(&s.a, &vault, &(2 * UNIT));
    StellarAssetClient::new(&s.env, &s.token.address).mint(&s.client.address, &(4 * UNIT));

    assert_eq!(s.client.sweep_surplus(&s.outsider), 4 * UNIT);
    assert_eq!(s.token.balance(&s.destination), 4 * UNIT);
    assert_eq!(s.client.get_vault(&vault).attributed, 2 * UNIT);
    assert_eq!(
        s.client.try_sweep_surplus(&s.outsider),
        Err(Ok(VaultV2Error::NoSurplus))
    );
}

#[test]
fn full_reconciliation_ends_at_zero() {
    let s = setup();
    let va = s.client.create_vault(&s.a, &h(&s, 8));
    let vb = s.client.create_vault(&s.b, &h(&s, 9));
    s.client.fund(&s.a, &va, &(2 * UNIT));
    s.client.fund(&s.b, &vb, &UNIT);
    StellarAssetClient::new(&s.env, &s.token.address).mint(&s.client.address, &(4 * UNIT));

    s.client.sweep_surplus(&s.outsider);
    s.client.withdraw(&s.a, &va, &(2 * UNIT));
    s.client.withdraw(&s.b, &vb, &UNIT);

    assert_eq!(s.client.get_total_attributed(), 0);
    assert_eq!(s.client.get_surplus(), 0);
    assert_eq!(s.token.balance(&s.a), 10 * UNIT);
    assert_eq!(s.token.balance(&s.b), 10 * UNIT);
    assert_eq!(s.token.balance(&s.destination), 4 * UNIT);
}

#[test]
fn unknown_vault_is_rejected() {
    let s = setup();
    assert_eq!(s.client.try_get_vault(&99), Err(Ok(VaultV2Error::NotFound)));
    assert_eq!(
        s.client.try_withdraw(&s.a, &99, &UNIT),
        Err(Ok(VaultV2Error::NotFound))
    );
}
