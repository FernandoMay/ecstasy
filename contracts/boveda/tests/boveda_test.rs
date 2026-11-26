use boveda::{BovedaContract, BovedaContractClient, BovedaError};
use soroban_sdk::{
    testutils::{Address as _, Events as _},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

const VAULT: i128 = 55_550_000_000; // 5555 XLM in stroops
const CODE_HASH: [u8; 32] = [
    0x71, 0x21, 0xf6, 0xba, 0x95, 0x48, 0xcb, 0x8c, 0xf2, 0x9a, 0x1d, 0x8d, 0xaf, 0xca, 0xe8, 0xce,
    0xfd, 0x0f, 0x5b, 0x97, 0xdb, 0xb5, 0xaf, 0x25, 0x32, 0xeb, 0x6f, 0xfc, 0xb7, 0x99, 0xe6, 0x6e,
];

struct Setup {
    env: Env,
    client: BovedaContractClient<'static>,
    token: TokenClient<'static>,
    funder: Address,
    claimer: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let asset = sac.address();
    let funder = Address::generate(&env);
    let claimer = Address::generate(&env);
    StellarAssetClient::new(&env, &asset).mint(&funder, &(VAULT * 2));

    let id = env.register(
        BovedaContract,
        (asset.clone(), BytesN::from_array(&env, &CODE_HASH)),
    );
    Setup {
        env: env.clone(),
        client: BovedaContractClient::new(&env, &id),
        token: TokenClient::new(&env, &asset),
        funder,
        claimer,
    }
}

#[test]
fn boveda_releases_only_to_correct_code_once() {
    let s = setup();
    s.client.fund(&s.funder, &VAULT);
    assert_eq!(s.token.balance(&s.funder), VAULT);

    let mut wrong = CODE_HASH;
    wrong[0] ^= 0xff;
    assert_eq!(
        s.client
            .try_reclamar(&s.claimer, &BytesN::from_array(&s.env, &wrong)),
        Err(Ok(BovedaError::InvalidCode))
    );
    assert_eq!(s.client.status(), (false, VAULT));

    let claimed = s
        .client
        .reclamar(&s.claimer, &BytesN::from_array(&s.env, &CODE_HASH));
    assert_eq!(claimed, VAULT);
    assert_eq!(s.client.status(), (true, 0));
    assert_eq!(s.token.balance(&s.claimer), VAULT);

    assert_eq!(
        s.client
            .try_reclamar(&s.claimer, &BytesN::from_array(&s.env, &CODE_HASH)),
        Err(Ok(BovedaError::AlreadyClaimed))
    );
    assert_eq!(
        s.client.try_fund(&s.funder, &VAULT),
        Err(Ok(BovedaError::AlreadyClaimed))
    );
}

#[test]
fn boveda_rejects_invalid_and_zero_amounts() {
    let s = setup();
    assert_eq!(
        s.client.try_fund(&s.funder, &0),
        Err(Ok(BovedaError::InvalidAmount))
    );
    assert_eq!(
        s.client
            .try_reclamar(&s.claimer, &BytesN::from_array(&s.env, &CODE_HASH)),
        Err(Ok(BovedaError::Empty))
    );
}
