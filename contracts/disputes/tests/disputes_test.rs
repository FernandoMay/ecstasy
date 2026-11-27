use disputes::{DisputeError, DisputeStatus, DisputesContract, DisputesContractClient};
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

struct Setup {
    env: Env,
    client: DisputesContractClient<'static>,
    resolver: Address,
    opener: Address,
    counterparty: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let resolver = Address::generate(&env);
    let opener = Address::generate(&env);
    let counterparty = Address::generate(&env);
    let outsider = Address::generate(&env);
    let id = env.register(DisputesContract, (resolver.clone(),));
    Setup {
        env: env.clone(),
        client: DisputesContractClient::new(&env, &id),
        resolver,
        opener,
        counterparty,
        outsider,
    }
}

fn hash(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn dispute_lifecycle_with_both_responses_and_resolution() {
    let s = setup();
    let id = s.client.open(&s.opener, &7, &s.counterparty, &hash(&s, 1));
    let dispute = s.client.get(&id);
    assert_eq!(dispute.status, DisputeStatus::Open);
    assert_eq!(dispute.encounter_id, 7);

    s.client.respond(&s.opener, &id, &hash(&s, 2));
    s.client.respond(&s.counterparty, &id, &hash(&s, 3));
    let dispute = s.client.get(&id);
    assert!(dispute.opener_responded && dispute.counterparty_responded);
    assert_eq!(dispute.opener_response, Some(hash(&s, 2)));
    assert_eq!(dispute.counterparty_response, Some(hash(&s, 3)));

    s.client.resolve(&s.resolver, &id, &hash(&s, 4));
    let dispute = s.client.get(&id);
    assert_eq!(dispute.status, DisputeStatus::Resolved);
    assert_eq!(dispute.outcome_hash, Some(hash(&s, 4)));

    assert_eq!(
        s.client.try_respond(&s.opener, &id, &hash(&s, 5)),
        Err(Ok(DisputeError::InvalidState))
    );
}

#[test]
fn disputes_reject_unauthorized_and_duplicate_actions() {
    let s = setup();
    let id = s.client.open(&s.opener, &7, &s.counterparty, &hash(&s, 1));

    assert_eq!(
        s.client.try_respond(&s.outsider, &id, &hash(&s, 2)),
        Err(Ok(DisputeError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_resolve(&s.opener, &id, &hash(&s, 3)),
        Err(Ok(DisputeError::NotAuthorized))
    );

    s.client.respond(&s.opener, &id, &hash(&s, 2));
    assert_eq!(
        s.client.try_respond(&s.opener, &id, &hash(&s, 6)),
        Err(Ok(DisputeError::AlreadyResponded))
    );
    assert_eq!(
        s.client.try_open(&s.opener, &7, &s.opener, &hash(&s, 1)),
        Err(Ok(DisputeError::NotAuthorized))
    );
}
