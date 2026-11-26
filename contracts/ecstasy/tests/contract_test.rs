use ecstasy::{EcstasyContract, EcstasyContractClient, EcstasyError, EncounterStatus};
use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env, Symbol, TryFromVal, Vec,
};

const STAKE: i128 = 500;
const START: u64 = 1_700_000_000;
const EXPIRY: u64 = START + 3_600;
const FUNDS: i128 = 10_000;

struct Setup {
    env: Env,
    client: EcstasyContractClient<'static>,
    token: TokenClient<'static>,
    issuer: StellarAssetClient<'static>,
    contract_id: Address,
    creator: Address,
    participant: Address,
    outsider: Address,
    asset: Address,
    terms_hash: BytesN<32>,
}

fn setup(_stake: i128) -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = START);

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let asset = sac.address();
    let issuer = StellarAssetClient::new(&env, &asset);
    let token = TokenClient::new(&env, &asset);

    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    let outsider = Address::generate(&env);
    issuer.mint(&creator, &FUNDS);

    let contract_id = env.register(EcstasyContract, (asset.clone(),));
    let client = EcstasyContractClient::new(&env, &contract_id);
    let terms_hash = BytesN::from_array(&env, &[0xAB; 32]);

    Setup {
        env,
        client,
        token,
        issuer,
        contract_id,
        creator,
        participant,
        outsider,
        asset,
        terms_hash,
    }
}

fn create(s: &Setup) -> u64 {
    s.client.create_encounter(
        &s.creator,
        &s.participant,
        &s.asset,
        &STAKE,
        &s.terms_hash,
        &EXPIRY,
    )
}

fn accept_and_complete(s: &Setup, id: u64) {
    s.client.accept_encounter(&s.participant, &id);
    s.client.complete_encounter(&s.creator, &id);
    s.client.complete_encounter(&s.participant, &id);
}

/// Event names emitted by our contract, in order, read from the typed event
/// topics `("ecstasy", id, name)`.
fn event_names(s: &Setup) -> Vec<Symbol> {
    let mut names = Vec::new(&s.env);
    for event in s
        .env
        .events()
        .all()
        .filter_by_contract(&s.contract_id)
        .events()
    {
        let soroban_sdk::xdr::ContractEventBody::V0(body) = &event.body;
        for topic in body.topics.iter() {
            if let soroban_sdk::xdr::ScVal::Symbol(name) = topic {
                names.push_back(
                    Symbol::try_from_val(&s.env, &soroban_sdk::xdr::ScVal::Symbol(name.clone()))
                        .unwrap(),
                );
            }
        }
    }
    names
}

#[test]
fn create_stores_public_state_and_increments_ids() {
    let s = setup(STAKE);
    let first = create(&s);
    let second = create(&s);
    let created_events = event_names(&s);

    assert_eq!(first, 1);
    assert_eq!(second, 2);

    let e = s.client.get_encounter(&first);
    assert_eq!(e.id, 1);
    assert_eq!(e.creator, s.creator);
    assert_eq!(e.participant, s.participant);
    assert_eq!(e.asset, s.asset);
    assert_eq!(e.stake, STAKE);
    assert_eq!(e.terms_hash, s.terms_hash);
    assert_eq!(e.created_at, START);
    assert_eq!(e.expires_at, EXPIRY);
    assert_eq!(e.status, EncounterStatus::Created);
    assert!(!e.creator_completed);
    assert!(!e.participant_completed);
    assert_eq!(e.settlement_marker, None);

    assert!(created_events.contains(Symbol::new(&s.env, "encounter_created")));
}

#[test]
fn create_rejects_self_encounter() {
    let s = setup(STAKE);
    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.creator,
            &s.asset,
            &STAKE,
            &s.terms_hash,
            &EXPIRY,
        ),
        Err(Ok(EcstasyError::SelfEncounter))
    );
}

#[test]
fn create_rejects_negative_stake() {
    let s = setup(STAKE);
    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.participant,
            &s.asset,
            &-1,
            &s.terms_hash,
            &EXPIRY,
        ),
        Err(Ok(EcstasyError::InvalidStake))
    );
}

#[test]
fn create_rejects_past_expiry() {
    let s = setup(STAKE);
    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.participant,
            &s.asset,
            &STAKE,
            &s.terms_hash,
            &START,
        ),
        Err(Ok(EcstasyError::InvalidExpiry))
    );
}

#[test]
fn create_locks_stake_and_zero_stake_is_allowed() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(s.token.balance(&s.creator), FUNDS - STAKE);
    assert_eq!(s.token.balance(&s.contract_id), STAKE);

    let free = setup_with_zero_stake();
    let free_id = free.client.create_encounter(
        &free.creator,
        &free.participant,
        &free.asset,
        &0,
        &free.terms_hash,
        &EXPIRY,
    );
    assert_eq!(free.token.balance(&free.creator), FUNDS);
    assert_eq!(free.token.balance(&free.contract_id), 0);
    accept_and_complete(&free, free_id);
    free.client.settle_encounter(&free.creator, &free_id);
    assert_eq!(
        free.client.get_encounter(&free_id).status,
        EncounterStatus::Settled
    );
    let _ = id;
}

fn setup_with_zero_stake() -> Setup {
    setup(0)
}

#[test]
fn accept_records_explicit_consent() {
    let s = setup(STAKE);
    let id = create(&s);

    s.client.accept_encounter(&s.participant, &id);
    let events = event_names(&s);

    assert_eq!(
        s.client.get_encounter(&id).status,
        EncounterStatus::Accepted
    );
    assert!(events.contains(Symbol::new(&s.env, "encounter_accepted")));
}

#[test]
fn accept_rejects_wrong_participant() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_accept_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Created);
}

#[test]
fn decline_refunds_creator_and_is_terminal() {
    let s = setup(STAKE);
    let id = create(&s);

    s.client.decline_encounter(&s.participant, &id);
    let events = event_names(&s);

    assert_eq!(
        s.client.get_encounter(&id).status,
        EncounterStatus::Cancelled
    );
    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.contract_id), 0);
    assert_eq!(
        s.client.try_accept_encounter(&s.participant, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert!(events.contains(Symbol::new(&s.env, "encounter_declined")));
}

#[test]
fn cancel_refunds_creator_from_created_and_accepted() {
    for accepted in [false, true] {
        let s = setup(STAKE);
        let id = create(&s);
        if accepted {
            s.client.accept_encounter(&s.participant, &id);
        }

        s.client.cancel_encounter(&s.creator, &id);

        assert_eq!(
            s.client.get_encounter(&id).status,
            EncounterStatus::Cancelled
        );
        assert_eq!(s.token.balance(&s.creator), FUNDS);
        assert_eq!(s.token.balance(&s.contract_id), 0);
    }
}

#[test]
fn completion_requires_both_parties_and_rejects_duplicates() {
    let s = setup(STAKE);
    let id = create(&s);
    s.client.accept_encounter(&s.participant, &id);

    s.client.complete_encounter(&s.creator, &id);
    let partial = s.client.get_encounter(&id);
    assert_eq!(partial.status, EncounterStatus::Accepted);
    assert!(partial.creator_completed);
    assert!(!partial.participant_completed);

    assert_eq!(
        s.client.try_complete_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::AlreadyCompleted))
    );
    assert_eq!(
        s.client.try_complete_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );

    s.client.complete_encounter(&s.participant, &id);
    let events = event_names(&s);
    let done = s.client.get_encounter(&id);
    assert_eq!(done.status, EncounterStatus::Completed);
    assert!(done.creator_completed && done.participant_completed);
    assert!(events.contains(Symbol::new(&s.env, "encounter_completed")));
}

#[test]
fn complete_rejects_out_of_order_calls() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_complete_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    s.client.accept_encounter(&s.participant, &id);
    assert_eq!(
        s.client.try_settle_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
}

#[test]
fn settle_releases_escrow_and_cannot_run_twice() {
    let s = setup(STAKE);
    let id = create(&s);
    accept_and_complete(&s, id);

    s.client.settle_encounter(&s.participant, &id);
    let events = event_names(&s);

    let settled = s.client.get_encounter(&id);
    assert_eq!(settled.status, EncounterStatus::Settled);
    assert!(settled.settlement_marker.is_some());
    assert_eq!(s.token.balance(&s.participant), STAKE);
    assert_eq!(s.token.balance(&s.contract_id), 0);
    assert_eq!(s.token.balance(&s.creator), FUNDS - STAKE);
    assert!(events.contains(Symbol::new(&s.env, "encounter_settled")));

    // Replay / double settlement must be rejected and must not move funds.
    assert_eq!(
        s.client.try_settle_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.participant), STAKE);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn settle_rejects_unauthorized_party() {
    let s = setup(STAKE);
    let id = create(&s);
    accept_and_complete(&s, id);

    assert_eq!(
        s.client.try_settle_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(s.token.balance(&s.contract_id), STAKE);
}

#[test]
fn expiry_is_enforced_on_chain_and_refunds_creator() {
    let s = setup(STAKE);
    let id = create(&s);

    s.env.ledger().with_mut(|li| li.timestamp = EXPIRY + 1);

    // Read-only view derives EXPIRED even before any transaction touches it.
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Expired);
    assert_eq!(
        s.client.try_accept_encounter(&s.participant, &id),
        Err(Ok(EcstasyError::Expired))
    );
    // A failed call rolls back; the refund is committed by the dedicated,
    // permissionless expiry transaction.
    assert_eq!(s.token.balance(&s.contract_id), STAKE);

    s.client.expire_encounter(&id);
    let events = event_names(&s);
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Expired);
    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.contract_id), 0);
    assert!(events.contains(Symbol::new(&s.env, "encounter_expired")));

    assert_eq!(
        s.client.try_expire_encounter(&id),
        Err(Ok(EcstasyError::InvalidState))
    );
}

#[test]
fn expire_encounter_rejects_open_encounter() {
    let s = setup(STAKE);
    let id = create(&s);
    assert_eq!(
        s.client.try_expire_encounter(&id),
        Err(Ok(EcstasyError::InvalidState))
    );
}

#[test]
fn afterglow_is_bounded_one_per_party_and_only_after_settlement() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_submit_afterglow(&s.creator, &id, &80),
        Err(Ok(EcstasyError::InvalidState))
    );
    accept_and_complete(&s, id);
    s.client.settle_encounter(&s.creator, &id);

    assert_eq!(
        s.client.try_submit_afterglow(&s.creator, &id, &101),
        Err(Ok(EcstasyError::InvalidScore))
    );
    s.client.submit_afterglow(&s.creator, &id, &0);
    s.client.submit_afterglow(&s.participant, &id, &100);

    assert_eq!(s.client.get_afterglow(&id, &s.creator), Some(0));
    assert_eq!(s.client.get_afterglow(&id, &s.participant), Some(100));
    assert_eq!(s.client.get_afterglow(&id, &s.outsider), None);

    assert_eq!(
        s.client.try_submit_afterglow(&s.creator, &id, &50),
        Err(Ok(EcstasyError::AlreadySubmitted))
    );
    assert_eq!(
        s.client.try_submit_afterglow(&s.outsider, &id, &50),
        Err(Ok(EcstasyError::NotParty))
    );
}

#[test]
fn unknown_encounter_is_not_found() {
    let s = setup(STAKE);
    assert_eq!(
        s.client.try_get_encounter(&999),
        Err(Ok(EcstasyError::NotFound))
    );
}

#[test]
fn signatures_are_required_for_state_changing_calls() {
    let s = setup(STAKE);
    s.env.set_auths(&[]);

    assert!(s
        .client
        .try_create_encounter(
            &s.creator,
            &s.participant,
            &s.asset,
            &STAKE,
            &s.terms_hash,
            &EXPIRY,
        )
        .is_err());
}

#[test]
fn terms_hash_changes_are_recorded_as_distinct_commitments() {
    let s = setup(STAKE);
    let id = create(&s);

    let mut changed = [0xABu8; 32];
    changed[0] = 0xAC;
    let different = BytesN::from_array(&s.env, &changed);
    assert_ne!(s.terms_hash, different);

    s.client.create_encounter(
        &s.creator,
        &s.participant,
        &s.asset,
        &0,
        &different,
        &EXPIRY,
    );
    assert_eq!(s.client.get_encounter(&id).terms_hash, s.terms_hash);
    assert_eq!(s.client.get_encounter(&2).terms_hash, different);
}

#[test]
fn retirar_withdraws_only_surplus_and_protects_reserved_escrow() {
    let s = setup(STAKE);
    let id = create(&s);

    // Simulate funds sent to the contract by mistake, outside any encounter.
    let extra = 777i128;
    s.issuer.mint(&s.contract_id, &extra);
    assert_eq!(s.token.balance(&s.contract_id), STAKE + extra);

    let withdrawn = s.client.retirar(&s.creator, &id);
    let events = event_names(&s);

    assert_eq!(withdrawn, extra);
    assert_eq!(s.token.balance(&s.creator), FUNDS - STAKE + extra);
    assert_eq!(s.token.balance(&s.contract_id), STAKE);
    assert!(events.contains(Symbol::new(&s.env, "funds_withdrawn")));

    // A second call has no surplus: reserved escrow cannot be withdrawn.
    assert_eq!(
        s.client.try_retirar(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.contract_id), STAKE);

    // The protected escrow still settles normally.
    accept_and_complete(&s, id);
    s.client.settle_encounter(&s.creator, &id);
    assert_eq!(s.token.balance(&s.contract_id), 0);
    assert_eq!(s.token.balance(&s.participant), STAKE);
}

#[test]
fn retirar_rejects_non_creator_and_empty_surplus() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_retirar(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_retirar(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.contract_id), STAKE);
}

#[test]
fn escrow_asset_is_pinned_per_deployment() {
    let s = setup(STAKE);
    let other_asset = s
        .env
        .register_stellar_asset_contract_v2(Address::generate(&s.env))
        .address();

    let id = create(&s);
    assert_eq!(s.client.get_encounter(&id).asset, s.asset);

    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.participant,
            &other_asset,
            &0,
            &s.terms_hash,
            &EXPIRY,
        ),
        Err(Ok(EcstasyError::InvalidAsset))
    );

    // Even a zero-stake encounter cannot switch the pinned asset.
    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.participant,
            &other_asset,
            &0,
            &s.terms_hash,
            &EXPIRY,
        ),
        Err(Ok(EcstasyError::InvalidAsset))
    );
}

#[test]
fn retirar_cannot_consume_another_assets_surplus() {
    let s = setup(STAKE);
    let other_asset = s
        .env
        .register_stellar_asset_contract_v2(Address::generate(&s.env))
        .address();
    let other_token = TokenClient::new(&s.env, &other_asset);
    let other_issuer = StellarAssetClient::new(&s.env, &other_asset);

    let id = s.client.create_encounter(
        &s.creator,
        &s.participant,
        &s.asset,
        &0,
        &s.terms_hash,
        &EXPIRY,
    );
    assert_eq!(s.client.get_encounter(&id).asset, s.asset);

    // The only surplus is in a non-configured asset; retirar is scoped to the
    // asset pinned at deployment and must not touch it.
    other_issuer.mint(&s.contract_id, &999);
    assert_eq!(other_token.balance(&s.contract_id), 999);
    assert_eq!(s.token.balance(&s.contract_id), 0);

    assert_eq!(
        s.client.try_retirar(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(other_token.balance(&s.contract_id), 999);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn escrow_state_survives_long_ledger_advance() {
    let s = setup(STAKE);
    let id = create(&s);

    // Advance far beyond both the encounter expiry and any default TTL. The
    // mutating create call extended the instance storage TTL.
    s.env.ledger().with_mut(|li| {
        li.sequence_number += 200_000;
        li.timestamp += 200_000 * 5;
    });

    let after = s.client.get_encounter(&id);
    assert_eq!(after.id, id);
    assert_eq!(after.stake, STAKE);
    assert_eq!(after.asset, s.asset);
    assert_eq!(after.status, EncounterStatus::Expired);

    // Surplus withdrawal still honours the reserve after the ledger advance.
    s.issuer.mint(&s.contract_id, &321);
    assert_eq!(s.client.retirar(&s.creator, &id), 321);
    assert_eq!(s.token.balance(&s.contract_id), STAKE);

    // Expiry refund is committed after the same advance.
    s.client.expire_encounter(&id);
    assert_eq!(s.token.balance(&s.contract_id), 0);
    assert_eq!(s.token.balance(&s.creator), FUNDS + 321);
}

#[test]
fn zero_stake_encounter_has_no_token_movement() {
    let s = setup(0);
    let id = s.client.create_encounter(
        &s.creator,
        &s.participant,
        &s.asset,
        &0,
        &s.terms_hash,
        &EXPIRY,
    );
    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.contract_id), 0);

    s.client.decline_encounter(&s.participant, &id);
    assert_eq!(
        s.client.get_encounter(&id).status,
        EncounterStatus::Cancelled
    );
    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn large_stake_is_accounted_end_to_end() {
    let s = setup(0);
    let large = 1_000_000_000_000_000_000i128;
    s.issuer.mint(&s.creator, &large);
    let starting = FUNDS + large;

    let id = s.client.create_encounter(
        &s.creator,
        &s.participant,
        &s.asset,
        &large,
        &s.terms_hash,
        &EXPIRY,
    );
    assert_eq!(s.token.balance(&s.contract_id), large);
    accept_and_complete(&s, id);
    s.client.settle_encounter(&s.creator, &id);

    assert_eq!(s.token.balance(&s.participant), large);
    assert_eq!(s.token.balance(&s.creator), starting - large);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn terminal_operations_are_idempotently_rejected() {
    let s = setup(STAKE);
    let id = create(&s);
    s.client.decline_encounter(&s.participant, &id);

    assert_eq!(
        s.client.try_decline_encounter(&s.participant, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(
        s.client.try_cancel_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn expiry_boundary_is_strictly_greater_than() {
    let s = setup(STAKE);
    let id = create(&s);

    s.env.ledger().with_mut(|li| li.timestamp = EXPIRY);
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Created);

    s.env.ledger().with_mut(|li| li.timestamp = EXPIRY + 1);
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Expired);
}

#[test]
fn afterglow_rejects_maximum_u32_score() {
    let s = setup(STAKE);
    let id = create(&s);
    accept_and_complete(&s, id);
    s.client.settle_encounter(&s.creator, &id);

    assert_eq!(
        s.client.try_submit_afterglow(&s.creator, &id, &u32::MAX),
        Err(Ok(EcstasyError::InvalidScore))
    );
}

#[test]
fn wrong_asset_with_stake_is_rejected_before_transfer() {
    let s = setup(STAKE);
    let other = s
        .env
        .register_stellar_asset_contract_v2(Address::generate(&s.env))
        .address();

    assert_eq!(
        s.client.try_create_encounter(
            &s.creator,
            &s.participant,
            &other,
            &STAKE,
            &s.terms_hash,
            &EXPIRY,
        ),
        Err(Ok(EcstasyError::InvalidAsset))
    );
    assert_eq!(s.token.balance(&s.creator), FUNDS);
}

#[test]
fn authorization_matrix_rejects_outsiders_on_every_party_action() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_accept_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_decline_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_complete_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_cancel_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_settle_encounter(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_retirar(&s.outsider, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(
        s.client.try_submit_afterglow(&s.outsider, &id, &50),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(s.token.balance(&s.contract_id), STAKE);
}

#[test]
fn permissionless_expiry_refunds_creator_not_caller() {
    let s = setup(STAKE);
    let id = create(&s);
    s.env.ledger().with_mut(|li| li.timestamp = EXPIRY + 1);

    s.client.expire_encounter(&id);

    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.outsider), 0);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn completed_encounter_cannot_be_expired() {
    let s = setup(STAKE);
    let id = create(&s);
    accept_and_complete(&s, id);

    s.env.ledger().with_mut(|li| li.timestamp = EXPIRY + 1);

    assert_eq!(
        s.client.try_expire_encounter(&id),
        Err(Ok(EcstasyError::InvalidState))
    );
    s.client.settle_encounter(&s.creator, &id);
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Settled);
    assert_eq!(s.token.balance(&s.participant), STAKE);
}

#[test]
fn accepted_cancel_is_terminal_and_refunds_creator() {
    let s = setup(STAKE);
    let id = create(&s);
    s.client.accept_encounter(&s.participant, &id);

    s.client.cancel_encounter(&s.participant, &id);

    assert_eq!(
        s.client.get_encounter(&id).status,
        EncounterStatus::Cancelled
    );
    assert_eq!(
        s.client.try_cancel_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::InvalidState))
    );
    assert_eq!(s.token.balance(&s.creator), FUNDS);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn creator_cannot_decline_an_invitation() {
    let s = setup(STAKE);
    let id = create(&s);

    assert_eq!(
        s.client.try_decline_encounter(&s.creator, &id),
        Err(Ok(EcstasyError::NotParty))
    );
    assert_eq!(s.client.get_encounter(&id).status, EncounterStatus::Created);
    assert_eq!(s.token.balance(&s.contract_id), STAKE);
}
