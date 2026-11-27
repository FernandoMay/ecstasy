use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env,
};
use traceability::{TraceError, TraceabilityContract, TraceabilityContractClient};

const NOW: u64 = 1_700_000_000;

struct Setup {
    env: Env,
    client: TraceabilityContractClient<'static>,
    authority: Address,
    writer: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let authority = Address::generate(&env);
    let writer = Address::generate(&env);
    let outsider = Address::generate(&env);
    let id = env.register(TraceabilityContract, (authority.clone(),));
    Setup {
        env: env.clone(),
        client: TraceabilityContractClient::new(&env, &id),
        authority,
        writer,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn links_full_lifecycle_and_is_queryable() {
    let s = setup();
    s.client.authorize_writer(&s.authority, &s.writer);
    s.client.link(&s.writer, &7, &1, &1, &1, &h(&s, 9));

    let chain = s.client.get_chain(&7);
    assert_eq!(chain.agreement_id, 7);
    assert_eq!(chain.escrow_id, 1);
    assert_eq!(chain.case_id, 1);
    assert_eq!(chain.arbitration_id, 1);
    assert_eq!(chain.settlement_tx, h(&s, 9));
    assert_eq!(chain.writer, s.writer);
}

#[test]
fn duplicate_and_invalid_references_are_rejected() {
    let s = setup();
    s.client.link(&s.authority, &7, &1, &1, &1, &h(&s, 1));
    assert_eq!(
        s.client.try_link(&s.authority, &7, &2, &2, &2, &h(&s, 2)),
        Err(Ok(TraceError::Duplicate))
    );
    assert_eq!(
        s.client.try_link(&s.authority, &0, &1, &1, &1, &h(&s, 3)),
        Err(Ok(TraceError::InvalidReference))
    );
    assert_eq!(s.client.try_get_chain(&99), Err(Ok(TraceError::NotFound)));
}

#[test]
fn only_authorized_writers_can_link_and_authorize() {
    let s = setup();
    assert_eq!(
        s.client.try_link(&s.outsider, &7, &1, &1, &1, &h(&s, 4)),
        Err(Ok(TraceError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_authorize_writer(&s.outsider, &s.writer),
        Err(Ok(TraceError::NotAuthorized))
    );
    s.client.authorize_writer(&s.authority, &s.writer);
    s.client.link(&s.writer, &7, &1, &1, &1, &h(&s, 5));
    assert_eq!(s.client.get_chain(&7).writer, s.writer);
}
