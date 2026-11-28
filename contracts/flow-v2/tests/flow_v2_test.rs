use flow_v2::{FlowError, FlowStatus, FlowV2Contract, FlowV2ContractClient};
use role_registry_v2::{RoleRegistryV2Contract, RoleRegistryV2ContractClient};
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Symbol};

struct Setup {
    env: Env,
    client: FlowV2ContractClient<'static>,
    admin: Address,
    manager: Address,
    registrar: Address,
    resolver: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let manager = Address::generate(&env);
    let registrar = Address::generate(&env);
    let resolver = Address::generate(&env);
    let roles_id = env.register(RoleRegistryV2Contract, (admin.clone(),));
    let roles = RoleRegistryV2ContractClient::new(&env, &roles_id);
    roles.grant(&admin, &Symbol::new(&env, "fund_manager"), &manager);
    roles.grant(&admin, &Symbol::new(&env, "registrar"), &registrar);
    roles.grant(&admin, &Symbol::new(&env, "resolver"), &resolver);
    let id = env.register(FlowV2Contract, (roles_id,));
    Setup {
        env: env.clone(),
        client: FlowV2ContractClient::new(&env, &id),
        admin,
        manager,
        registrar,
        resolver,
    }
}

fn h(s: &Setup, b: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[b; 32])
}

fn link_all(s: &Setup, id: u64) {
    let steps: [(Address, &str, u8); 5] = [
        (s.manager.clone(), "vault_fund", 10),
        (s.registrar.clone(), "milestone", 11),
        (s.resolver.clone(), "dispute", 12),
        (s.resolver.clone(), "arbitration", 13),
        (s.resolver.clone(), "panel", 14),
    ];
    for (actor, step, byte) in steps {
        s.client
            .link_step(&actor, &id, &Symbol::new(&s.env, step), &1, &h(s, byte));
    }
}

#[test]
fn start_requires_fund_manager_role() {
    let s = setup();
    assert_eq!(
        s.client.try_start(&s.admin, &1, &1),
        Err(Ok(FlowError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_start(&s.registrar, &1, &1),
        Err(Ok(FlowError::NotAuthorized))
    );
    assert_eq!(s.client.start(&s.manager, &1, &1), 1);
    assert_eq!(s.client.get_flow(&1).status, FlowStatus::Open);
}

#[test]
fn steps_require_the_exact_delegated_role() {
    let s = setup();
    let id = s.client.start(&s.manager, &1, &1);
    let fund = Symbol::new(&s.env, "vault_fund");
    let milestone = Symbol::new(&s.env, "milestone");

    assert_eq!(
        s.client.try_link_step(&s.admin, &id, &fund, &1, &h(&s, 1)),
        Err(Ok(FlowError::NotAuthorized))
    );
    assert_eq!(
        s.client
            .try_link_step(&s.registrar, &id, &fund, &1, &h(&s, 1)),
        Err(Ok(FlowError::NotAuthorized))
    );
    s.client.link_step(&s.manager, &id, &fund, &1, &h(&s, 2));
    assert_eq!(
        s.client
            .try_link_step(&s.resolver, &id, &milestone, &1, &h(&s, 3)),
        Err(Ok(FlowError::NotAuthorized))
    );
    s.client
        .link_step(&s.registrar, &id, &milestone, &1, &h(&s, 3));
    assert_eq!(s.client.get_step(&id, &fund).ref_id, 1);
    assert_eq!(s.client.get_step(&id, &fund).tx_hash, h(&s, 2));
}

#[test]
fn duplicate_steps_are_rejected() {
    let s = setup();
    let id = s.client.start(&s.manager, &1, &1);
    let fund = Symbol::new(&s.env, "vault_fund");
    s.client.link_step(&s.manager, &id, &fund, &1, &h(&s, 4));
    assert_eq!(
        s.client
            .try_link_step(&s.manager, &id, &fund, &2, &h(&s, 5)),
        Err(Ok(FlowError::DuplicateStep))
    );
}

#[test]
fn settle_requires_all_steps_and_resolver_role() {
    let s = setup();
    let id = s.client.start(&s.manager, &1, &1);
    assert_eq!(
        s.client.try_settle(&s.resolver, &id, &h(&s, 6)),
        Err(Ok(FlowError::MissingStep))
    );
    link_all(&s, id);
    assert_eq!(
        s.client.try_settle(&s.admin, &id, &h(&s, 6)),
        Err(Ok(FlowError::NotAuthorized))
    );
    s.client.settle(&s.resolver, &id, &h(&s, 6));
    assert_eq!(s.client.get_flow(&id).status, FlowStatus::Settled);
    assert_eq!(s.client.get_flow(&id).settlement_tx, Some(h(&s, 6)));
    assert_eq!(
        s.client.try_link_step(
            &s.manager,
            &id,
            &Symbol::new(&s.env, "withdrawal"),
            &1,
            &h(&s, 7)
        ),
        Err(Ok(FlowError::InvalidState))
    );
}

#[test]
fn steps_are_paginated() {
    let s = setup();
    let id = s.client.start(&s.manager, &1, &1);
    link_all(&s, id);
    assert_eq!(s.client.get_steps(&id, &0).len(), 5);
    assert_eq!(s.client.get_steps(&id, &5).len(), 0);
    assert_eq!(s.client.get_steps(&id, &1).len(), 0);
}

#[test]
fn hundreds_of_flows_keep_state_readable() {
    let s = setup();
    for i in 1..=200u64 {
        let id = s.client.start(&s.manager, &i, &i);
        s.client.link_step(
            &s.manager,
            &id,
            &Symbol::new(&s.env, "vault_fund"),
            &i,
            &h(&s, 20),
        );
    }
    assert_eq!(s.client.get_flow(&200).vault_id, 200);
    assert_eq!(s.client.get_steps(&200, &0).len(), 1);
    assert_eq!(s.client.get_flow(&1).status, FlowStatus::Open);
}
