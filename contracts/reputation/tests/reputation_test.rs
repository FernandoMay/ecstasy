use reputation::{ReputationContract, ReputationContractClient, ReputationError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env,
};

const NOW: u64 = 1_700_000_000;

struct Setup {
    env: Env,
    client: ReputationContractClient<'static>,
    authority: Address,
    source: Address,
    subject: Address,
    outsider: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let authority = Address::generate(&env);
    let source = Address::generate(&env);
    let subject = Address::generate(&env);
    let outsider = Address::generate(&env);
    let id = env.register(ReputationContract, (authority.clone(),));
    Setup {
        env: env.clone(),
        client: ReputationContractClient::new(&env, &id),
        authority,
        source,
        subject,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn register_and_record_case_from_authorized_source() {
    let s = setup();
    s.client.register(&s.subject, &h(&s, 1));
    s.client.authorize_source(&s.authority, &s.source);
    s.client
        .record_case(&s.source, &s.subject, &7, &s.source, &h(&s, 2));

    let profile = s.client.get_profile(&s.subject);
    assert_eq!(profile.cases_recorded, 1);
    assert_eq!(profile.votes_recorded, 0);
    assert_eq!(
        s.client.get_case(&s.subject, &7, &s.source).outcome_hash,
        h(&s, 2)
    );
    assert_eq!(
        s.client
            .try_record_case(&s.source, &s.subject, &7, &s.source, &h(&s, 3)),
        Err(Ok(ReputationError::DuplicateRecord))
    );
}

#[test]
fn unauthorized_writers_and_subjects_are_rejected() {
    let s = setup();
    s.client.register(&s.subject, &h(&s, 4));
    assert_eq!(
        s.client
            .try_record_case(&s.outsider, &s.subject, &1, &s.source, &h(&s, 5)),
        Err(Ok(ReputationError::NotAuthorized))
    );
    assert_eq!(
        s.client
            .try_record_vote(&s.outsider, &s.subject, &1, &s.source, &h(&s, 6)),
        Err(Ok(ReputationError::NotAuthorized))
    );
    assert_eq!(
        s.client.try_register(&s.subject, &h(&s, 7)),
        Err(Ok(ReputationError::AlreadyRegistered))
    );
    assert_eq!(
        s.client.try_authorize_source(&s.outsider, &s.source),
        Err(Ok(ReputationError::NotAuthorized))
    );
}

#[test]
fn vote_records_participation_without_revealing_decision() {
    let s = setup();
    s.client.register(&s.subject, &h(&s, 8));
    s.client
        .record_vote(&s.authority, &s.subject, &1, &s.source, &h(&s, 9));

    let profile = s.client.get_profile(&s.subject);
    assert_eq!(profile.votes_recorded, 1);
    assert_eq!(
        s.client
            .try_record_vote(&s.authority, &s.subject, &1, &s.source, &h(&s, 10)),
        Err(Ok(ReputationError::DuplicateRecord))
    );
}

#[test]
fn suspension_is_temporary_and_eligibility_is_factual() {
    let s = setup();
    assert!(!s.client.get_eligibility(&s.subject));
    s.client.register(&s.subject, &h(&s, 11));
    assert!(s.client.get_eligibility(&s.subject));

    s.client
        .suspend(&s.authority, &s.subject, &h(&s, 12), &(NOW + 100));
    assert!(!s.client.get_eligibility(&s.subject));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 101);
    assert!(s.client.get_eligibility(&s.subject));

    assert_eq!(
        s.client
            .try_suspend(&s.authority, &s.subject, &h(&s, 13), &NOW),
        Err(Ok(ReputationError::InvalidDuration))
    );
    assert_eq!(
        s.client
            .try_suspend(&s.outsider, &s.subject, &h(&s, 14), &(NOW + 200)),
        Err(Ok(ReputationError::NotAuthorized))
    );
}
