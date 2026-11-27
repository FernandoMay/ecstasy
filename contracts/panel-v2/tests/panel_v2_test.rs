use arbitrators_registry::{ArbitratorsRegistryContract, ArbitratorsRegistryContractClient};
use panel_v2::{CaseStatus, PanelV2Contract, PanelV2ContractClient, PanelV2Error};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Vec,
};

const NOW: u64 = 1_700_000_000;
const UNIT: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: PanelV2ContractClient<'static>,
    registry: ArbitratorsRegistryContractClient<'static>,
    token: TokenClient<'static>,
    payer: Address,
    recipient: Address,
    registrar: Address,
    outsider: Address,
    contract_id: Address,
    arbitrators: Vec<Address>,
}

fn h(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

fn setup(n: usize) -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = NOW);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let asset = sac.address();
    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let registrar = Address::generate(&env);
    let outsider = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&payer, &(UNIT * 10));

    let reg_id = env.register(ArbitratorsRegistryContract, (registrar.clone(),));
    let registry = ArbitratorsRegistryContractClient::new(&env, &reg_id);
    let mut arbitrators = Vec::new(&env);
    for i in 0..n {
        let a = Address::generate(&env);
        registry.register(&a, &h(&env, (i + 1) as u8));
        registry.attest(&registrar, &a, &h(&env, (i + 20) as u8));
        arbitrators.push_back(a);
    }

    let id = env.register(PanelV2Contract, (asset.clone(), reg_id));
    Setup {
        env: env.clone(),
        client: PanelV2ContractClient::new(&env, &id),
        registry,
        token: TokenClient::new(&env, &asset),
        payer,
        recipient,
        registrar,
        outsider,
        contract_id: id,
        arbitrators,
    }
}

fn create(s: &Setup) -> u64 {
    s.client
        .create(&s.payer, &7, &s.recipient, &UNIT, &h(&s.env, 1))
}

fn selected(s: &Setup, case_id: u64) -> Vec<Address> {
    s.client.select_panel(&s.outsider, &case_id);
    let case = s.client.get(&case_id);
    case.arbitrators
}

#[test]
fn panel_has_three_distinct_arbitrators_from_registry() {
    let s = setup(5);
    let case_id = create(&s);
    let panel = selected(&s, case_id);
    assert_eq!(panel.len(), 3);
    for i in 0..3 {
        for j in (i + 1)..3 {
            assert_ne!(panel.get(i).unwrap(), panel.get(j).unwrap());
        }
        assert!(s.arbitrators.contains(panel.get(i).unwrap()));
    }
}

#[test]
fn eligible_snapshot_is_frozen_at_creation() {
    let s = setup(5);
    let case_id = create(&s);
    let before = s.client.get(&case_id).eligible_snapshot;
    let removed = before.get(0).unwrap();
    s.registry.revoke(&s.registrar, &removed);
    assert!(!s.registry.is_eligible(&removed));
    let panel = selected(&s, case_id);
    assert!(s.client.get(&case_id).eligible_snapshot.len() == before.len());
    for arb in panel.iter() {
        assert!(before.contains(arb));
    }
}

#[test]
fn non_arbitrator_cannot_commit_and_duplicate_commit_rejected() {
    let s = setup(5);
    let case_id = create(&s);
    let panel = selected(&s, case_id);
    assert_eq!(
        s.client.try_commit(&s.outsider, &case_id, &h(&s.env, 30)),
        Err(Ok(PanelV2Error::NotArbitrator))
    );
    s.client
        .commit(&panel.get(0).unwrap(), &case_id, &h(&s.env, 31));
    assert_eq!(
        s.client
            .try_commit(&panel.get(0).unwrap(), &case_id, &h(&s.env, 32)),
        Err(Ok(PanelV2Error::AlreadyCommitted))
    );
}

#[test]
fn wrong_secret_reveal_is_rejected() {
    let s = setup(5);
    let case_id = create(&s);
    let panel = selected(&s, case_id);
    let arb = panel.get(0).unwrap();
    let good = s.client.commitment(&case_id, &arb, &1, &h(&s.env, 40));
    s.client.commit(&arb, &case_id, &good);
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 310);
    assert_eq!(
        s.client.try_reveal(&arb, &case_id, &1, &h(&s.env, 41)),
        Err(Ok(PanelV2Error::CommitmentMismatch))
    );
    s.client.reveal(&arb, &case_id, &1, &h(&s.env, 40));
    assert_eq!(
        s.client.try_reveal(&arb, &case_id, &1, &h(&s.env, 40)),
        Err(Ok(PanelV2Error::AlreadyRevealed))
    );
}

fn run_votes(s: &Setup, case_id: u64, decisions: [u32; 3], secrets: [u8; 3]) {
    let panel = selected(s, case_id);
    for i in 0..3 {
        let arb = panel.get(i).unwrap();
        let commitment = s.client.commitment(
            &case_id,
            &arb,
            &decisions[i as usize],
            &h(&s.env, secrets[i as usize]),
        );
        s.client.commit(&arb, &case_id, &commitment);
    }
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 310);
    for i in 0..3 {
        let arb = panel.get(i).unwrap();
        s.client.reveal(
            &arb,
            &case_id,
            &decisions[i as usize],
            &h(&s.env, secrets[i as usize]),
        );
    }
    s.env.ledger().with_mut(|li| li.timestamp = NOW + 610);
}

#[test]
fn quorum_release_pays_recipient() {
    let s = setup(5);
    let case_id = create(&s);
    run_votes(&s, case_id, [1, 1, 2], [50, 51, 52]);
    s.client.resolve(&s.outsider, &case_id);
    assert_eq!(s.client.get(&case_id).status, CaseStatus::Resolved);
    assert_eq!(s.client.get(&case_id).outcome_code, Some(1));
    assert_eq!(s.token.balance(&s.recipient), UNIT);
}

#[test]
fn quorum_refund_pays_payer() {
    let s = setup(5);
    let case_id = create(&s);
    run_votes(&s, case_id, [2, 2, 1], [53, 54, 55]);
    s.client.resolve(&s.outsider, &case_id);
    assert_eq!(s.client.get(&case_id).outcome_code, Some(2));
    assert_eq!(s.token.balance(&s.payer), 10 * UNIT);
}

#[test]
fn quorum_split_reconciles_exactly() {
    let s = setup(5);
    let case_id = create(&s);
    run_votes(&s, case_id, [3, 3, 1], [56, 57, 58]);
    s.client.resolve(&s.outsider, &case_id);
    assert_eq!(s.client.get(&case_id).outcome_code, Some(3));
    assert_eq!(s.token.balance(&s.recipient), UNIT / 2);
    assert_eq!(s.token.balance(&s.payer), 9 * UNIT + UNIT / 2);
}

#[test]
fn no_quorum_refunds_payer_not_arbitrator() {
    let s = setup(5);
    let case_id = create(&s);
    run_votes(&s, case_id, [1, 2, 3], [59, 60, 61]);
    s.client.resolve(&s.outsider, &case_id);
    assert_eq!(s.client.get(&case_id).status, CaseStatus::NoQuorum);
    assert_eq!(s.token.balance(&s.payer), 10 * UNIT);
}

#[test]
fn settlement_is_terminal() {
    let s = setup(5);
    let case_id = create(&s);
    run_votes(&s, case_id, [1, 1, 2], [62, 63, 64]);
    s.client.resolve(&s.outsider, &case_id);
    assert_eq!(
        s.client.try_resolve(&s.outsider, &case_id),
        Err(Ok(PanelV2Error::InvalidState))
    );
    assert_eq!(s.token.balance(&s.recipient), UNIT);
}

#[test]
fn commitment_is_domain_separated() {
    let s = setup(5);
    let case_id = create(&s);
    let panel = selected(&s, case_id);
    let arb = panel.get(0).unwrap();
    let on_chain = s.client.commitment(&case_id, &arb, &1, &h(&s.env, 70));

    let mut data = Bytes::new(&s.env);
    data.append(&Bytes::from_array(&s.env, b"ECSTASY-PANEL-V2"));
    data.append(&s.contract_id.to_string().to_bytes());
    data.append(&Bytes::from_array(&s.env, &case_id.to_be_bytes()));
    data.append(&Bytes::from_array(&s.env, &1u32.to_be_bytes()));
    data.append(&h(&s.env, 70).to_bytes());
    data.append(&arb.to_string().to_bytes());
    assert_eq!(on_chain, s.env.crypto().sha256(&data).to_bytes());
}

#[test]
fn insufficient_eligible_arbitrators_is_rejected() {
    let s = setup(2);
    assert_eq!(
        s.client
            .try_create(&s.payer, &7, &s.recipient, &UNIT, &h(&s.env, 9)),
        Err(Ok(PanelV2Error::InsufficientArbitrators))
    );
}
