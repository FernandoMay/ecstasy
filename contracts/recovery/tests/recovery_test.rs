use recovery::{ProposalStatus, RecoveryContract, RecoveryContractClient, RecoveryError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

const AMOUNT: i128 = 10_000_000;
const NOW: u64 = 1_700_000_000;

struct Setup {
    env: Env,
    client: RecoveryContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
    counterparty: Address,
    recipient: Address,
    third_party: Address,
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
    let third_party = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(AMOUNT * 4));
    let id = env.register(RecoveryContract, (asset.clone(),));
    Setup {
        env: env.clone(),
        client: RecoveryContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        counterparty,
        recipient,
        third_party,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

#[test]
fn timely_approval_executes_real_transfer() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 1),
        &(NOW + 100),
    );
    s.client.approve(&s.counterparty, &id, &h(&s, 1));
    s.client.execute(&s.proposer, &id);

    assert_eq!(s.client.get(&id).status, ProposalStatus::Executed);
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);
}

#[test]
fn expired_proposal_is_recovered_by_any_account_once() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 2),
        &(NOW + 5),
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 10);

    s.client.recover(&s.third_party, &id);
    assert_eq!(s.client.get(&id).status, ProposalStatus::Recovered);
    assert_eq!(s.token.balance(&s.proposer), 4 * AMOUNT);
    assert_eq!(s.token.balance(&s.recipient), 0);
    assert_eq!(
        s.client.try_recover(&s.proposer, &id),
        Err(Ok(RecoveryError::InvalidState))
    );
}

#[test]
fn late_approval_and_late_execution_are_rejected() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 3),
        &(NOW + 5),
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 10);

    assert_eq!(
        s.client.try_approve(&s.counterparty, &id, &h(&s, 3)),
        Err(Ok(RecoveryError::InvalidState))
    );
    // Funds remain locked until a permissionless recovery.
    assert_eq!(s.client.get(&id).status, ProposalStatus::Pending);
    assert_eq!(s.token.balance(&s.proposer), 3 * AMOUNT);

    s.client.recover(&s.third_party, &id);
    assert_eq!(
        s.client.try_execute(&s.proposer, &id),
        Err(Ok(RecoveryError::InvalidState))
    );
}

#[test]
fn recovery_before_expiry_is_rejected() {
    let s = setup();
    let id = s.client.propose(
        &s.proposer,
        &s.counterparty,
        &s.recipient,
        &AMOUNT,
        &h(&s, 4),
        &(NOW + 100),
    );
    assert_eq!(
        s.client.try_recover(&s.third_party, &id),
        Err(Ok(RecoveryError::StillPending))
    );
}
