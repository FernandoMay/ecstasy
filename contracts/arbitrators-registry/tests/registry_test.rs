use arbitrators_registry::{
    ArbitratorsRegistryContract, ArbitratorsRegistryContractClient, RegistryError,
};
use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Address, BytesN, Env};

const NOW: u64 = 1_700_000_000;

fn h(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

#[test]
fn eligible_arbitrators_are_registred_and_attested() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let registrar = Address::generate(&env);
    let id = env.register(ArbitratorsRegistryContract, (registrar.clone(),));
    let client = ArbitratorsRegistryContractClient::new(&env, &id);

    let a = Address::generate(&env);
    let b = Address::generate(&env);
    client.register(&a, &h(&env, 1));
    client.register(&b, &h(&env, 2));
    assert_eq!(client.get_eligible().len(), 0);

    client.attest(&registrar, &a, &h(&env, 11));
    client.attest(&registrar, &b, &h(&env, 12));
    assert_eq!(client.get_eligible().len(), 2);
    assert!(client.is_eligible(&a));
}

#[test]
fn one_controller_cannot_control_two_addresses() {
    let env = Env::default();
    env.mock_all_auths();
    let registrar = Address::generate(&env);
    let id = env.register(ArbitratorsRegistryContract, (registrar.clone(),));
    let client = ArbitratorsRegistryContractClient::new(&env, &id);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    client.register(&a, &h(&env, 3));
    client.register(&b, &h(&env, 4));
    client.attest(&registrar, &a, &h(&env, 13));

    assert_eq!(
        client.try_attest(&registrar, &b, &h(&env, 13)),
        Err(Ok(RegistryError::DuplicateController))
    );
    assert_eq!(client.get_eligible().len(), 1);
}

#[test]
fn revocation_removes_eligibility() {
    let env = Env::default();
    env.mock_all_auths();
    let registrar = Address::generate(&env);
    let id = env.register(ArbitratorsRegistryContract, (registrar.clone(),));
    let client = ArbitratorsRegistryContractClient::new(&env, &id);
    let a = Address::generate(&env);
    client.register(&a, &h(&env, 5));
    client.attest(&registrar, &a, &h(&env, 14));
    assert!(client.is_eligible(&a));

    client.revoke(&registrar, &a);
    assert!(!client.is_eligible(&a));
    assert_eq!(client.get_eligible().len(), 0);
}

#[test]
fn only_registrar_can_attest_or_revoke() {
    let env = Env::default();
    env.mock_all_auths();
    let registrar = Address::generate(&env);
    let intruder = Address::generate(&env);
    let a = Address::generate(&env);
    let id = env.register(ArbitratorsRegistryContract, (registrar.clone(),));
    let client = ArbitratorsRegistryContractClient::new(&env, &id);
    client.register(&a, &h(&env, 6));

    assert_eq!(
        client.try_attest(&intruder, &a, &h(&env, 15)),
        Err(Ok(RegistryError::NotAuthorized))
    );
    assert_eq!(
        client.try_revoke(&intruder, &a),
        Err(Ok(RegistryError::NotAuthorized))
    );
    assert_eq!(
        client.try_register(&a, &h(&env, 7)),
        Err(Ok(RegistryError::AlreadyRegistered))
    );
}
