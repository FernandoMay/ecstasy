use panel::{PanelContract, PanelContractClient, PanelError, PanelStatus};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Vec,
};

const NOW: u64 = 1_700_000_000;
const AMOUNT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: PanelContractClient<'static>,
    token: TokenClient<'static>,
    proposer: Address,
    recipient: Address,
    arbitrators: Vec<Address>,
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
    let recipient = Address::generate(&env);
    let arbitrators = Vec::from_array(
        &env,
        [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ],
    );
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&proposer, &(AMOUNT * 4));
    let id = env.register(PanelContract, (asset.clone(),));
    Setup {
        env: env.clone(),
        client: PanelContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        proposer,
        recipient,
        arbitrators,
        outsider,
    }
}

fn h(s: &Setup, byte: u8) -> BytesN<32> {
    BytesN::from_array(&s.env, &[byte; 32])
}

fn commitment(
    s: &Setup,
    case_id: u64,
    arbitrator: &Address,
    decision: u32,
    secret_byte: u8,
) -> BytesN<32> {
    let mut data = Bytes::new(&s.env);
    data.append(&Bytes::from_array(&s.env, &case_id.to_be_bytes()));
    data.append(&Bytes::from_array(&s.env, &[decision as u8]));
    data.append(&Bytes::from_array(&s.env, &[secret_byte; 32]));
    let arb_hash = s.env.crypto().sha256(&arbitrator.to_string().to_bytes());
    data.append(&arb_hash.to_bytes().into());
    s.env.crypto().sha256(&data).to_bytes()
}

fn create(s: &Setup) -> u64 {
    s.client.create(
        &s.proposer,
        &7,
        &s.recipient,
        &AMOUNT,
        &h(s, 1),
        &s.arbitrators,
        &(NOW + 10),
        &(NOW + 20),
    )
}

#[test]
fn two_matching_votes_release_funds() {
    let s = setup();
    let id = create(&s);
    for i in 0..2 {
        let arb = s.arbitrators.get(i).unwrap();
        s.client.commit(&arb, &id, &commitment(&s, id, &arb, 1, 10));
    }
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 15);
    for i in 0..2 {
        let arb = s.arbitrators.get(i).unwrap();
        s.client.reveal(&arb, &id, &1, &h(&s, 10));
    }
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 25);
    s.client.resolve(&s.outsider, &id);

    assert_eq!(s.client.get(&id).status, PanelStatus::Resolved);
    assert_eq!(s.client.get(&id).outcome_code, Some(1));
    assert_eq!(s.token.balance(&s.recipient), AMOUNT);
    assert_eq!(
        s.client.try_resolve(&s.outsider, &id),
        Err(Ok(PanelError::TooEarly))
    );
}

#[test]
fn no_quorum_refunds_proposer_not_arbitrator() {
    let s = setup();
    let id = create(&s);
    let a0 = s.arbitrators.get(0).unwrap();
    let a1 = s.arbitrators.get(1).unwrap();
    s.client.commit(&a0, &id, &commitment(&s, id, &a0, 1, 11));
    s.client.commit(&a1, &id, &commitment(&s, id, &a1, 2, 12));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 15);
    s.client.reveal(&a0, &id, &1, &h(&s, 11));
    s.client.reveal(&a1, &id, &2, &h(&s, 12));
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 25);
    s.client.resolve(&s.outsider, &id);

    assert_eq!(s.client.get(&id).status, PanelStatus::NoQuorum);
    assert_eq!(s.token.balance(&s.proposer), 4 * AMOUNT);
    assert_eq!(s.token.balance(&s.outsider), 0);
}

#[test]
fn invalid_reveals_and_duplicate_votes_are_rejected() {
    let s = setup();
    let id = create(&s);
    let a0 = s.arbitrators.get(0).unwrap();

    assert_eq!(
        s.client.try_commit(&s.outsider, &id, &h(&s, 20)),
        Err(Ok(PanelError::NotAuthorized))
    );
    s.client.commit(&a0, &id, &commitment(&s, id, &a0, 1, 13));
    assert_eq!(
        s.client.try_commit(&a0, &id, &h(&s, 21)),
        Err(Ok(PanelError::AlreadyCommitted))
    );
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 15);
    assert_eq!(
        s.client.try_reveal(&a0, &id, &1, &h(&s, 99)),
        Err(Ok(PanelError::CommitmentMismatch))
    );
    s.client.reveal(&a0, &id, &1, &h(&s, 13));
    assert_eq!(
        s.client.try_reveal(&a0, &id, &1, &h(&s, 13)),
        Err(Ok(PanelError::AlreadyRevealed))
    );
}
