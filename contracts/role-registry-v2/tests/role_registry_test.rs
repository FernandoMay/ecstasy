use role_registry_v2::{RoleError, RoleRegistryV2Contract, RoleRegistryV2ContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

#[test]
fn roles_are_granted_revoked_and_rotated() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let manager = Address::generate(&env);
    let next = Address::generate(&env);
    let id = env.register(RoleRegistryV2Contract, (admin.clone(),));
    let client = RoleRegistryV2ContractClient::new(&env, &id);
    let fund = Symbol::new(&env, "fund_manager");

    assert!(!client.has_role(&fund, &manager));
    client.grant(&admin, &fund, &manager);
    assert!(client.has_role(&fund, &manager));
    assert_eq!(client.get_holders(&fund, &0, &10).len(), 1);

    client.revoke(&admin, &fund, &manager);
    assert!(!client.has_role(&fund, &manager));

    client.grant(&admin, &fund, &manager);
    client.rotate(&admin, &fund, &manager, &next);
    assert!(!client.has_role(&fund, &manager));
    assert!(client.has_role(&fund, &next));
}

#[test]
fn only_admin_can_change_roles_and_roles_are_validated() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let intruder = Address::generate(&env);
    let account = Address::generate(&env);
    let id = env.register(RoleRegistryV2Contract, (admin.clone(),));
    let client = RoleRegistryV2ContractClient::new(&env, &id);
    let fund = Symbol::new(&env, "fund_manager");
    let bogus = Symbol::new(&env, "superuser");

    assert_eq!(
        client.try_grant(&intruder, &fund, &account),
        Err(Ok(RoleError::NotAuthorized))
    );
    assert_eq!(
        client.try_grant(&admin, &bogus, &account),
        Err(Ok(RoleError::InvalidRole))
    );
    client.grant(&admin, &fund, &account);
    assert_eq!(
        client.try_grant(&admin, &fund, &account),
        Err(Ok(RoleError::AlreadyGranted))
    );
    assert_eq!(
        client.try_revoke(&intruder, &fund, &account),
        Err(Ok(RoleError::NotAuthorized))
    );
}

#[test]
fn holders_are_paginated() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(RoleRegistryV2Contract, (admin.clone(),));
    let client = RoleRegistryV2ContractClient::new(&env, &id);
    let role = Symbol::new(&env, "resolver");
    for _ in 0..12 {
        client.grant(&admin, &role, &Address::generate(&env));
    }
    assert_eq!(client.get_holders(&role, &0, &5).len(), 5);
    assert_eq!(client.get_holders(&role, &5, &5).len(), 5);
    assert_eq!(client.get_holders(&role, &10, &5).len(), 2);
    assert_eq!(client.get_holders(&role, &1, &5).len(), 5);
}
