# ECSTASY — Testnet evidence pack

Everything below was produced by real signed Stellar Testnet transactions. No RPC response is mocked.

## Artifacts

| Item | Value |
|---|---|
| Network | Testnet (`Test SDF Network ; September 2015`) |
| Source commit | `7c04816` (`feat: implement ECSTASY Testnet vertical slice`) |
| Contract ID | `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` |
| Wasm SHA-256 | `20babecd59bea1c0e94625f9a93143565f5aac34fcf28a0fe8f1eccdf3c8fcca` |
| Escrow asset | native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Creator identity | `arceus-deployer` → `GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ` |
| Participant identity | `suite-admin` → `GBQV7XDOMA6342BHICZGIRBDOZVTMRL7A7A3MWVL4SRP7EH37NAPO5KQ` |
| Contract explorer | https://lab.stellar.org/r/testnet/contract/CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W |

## Deployment transactions

| Step | Transaction hash |
|---|---|
| Upload wasm | `f1cca7c468bef0842c5f4e71eb53ed0e7d54ad5b4b5b05fc98a8a097e53c38e4` |
| Instantiate contract | `1627c1fe3625178713d713885b616d1487eb33ccd2b55b60b212c55c9eb8545e` |

An earlier deployment (`CCWVCW2B…OBZ4YQZRSOKHO`) was superseded: its settlement path called `require_auth()` on the contract's own address, which produced an auth entry no wallet can sign. The fix and the successful redeploy are described in `docs/SECURITY.md`.

## Vertical slice — encounter #1

Stake: `10_000_000` stroops (1 XLM). Terms commitment: `ef5383014931c31c85b40119ac149f3d5dae5eb8874d5e56ed88a74905ac6aa6` (SHA-256 of the demo terms string, not private content).

| Step | Transaction hash | Event emitted |
|---|---|---|
| create (creator, escrow pull) | `361e5a29b7b426ae7d0f31c080c32b0f6d4204bb292021705c47ae79f90ac956` | SAC `transfer` 10,000,000 creator→contract; `encounter_created` |
| accept (participant) | `f58e52bdb5dcd1612af2f73b706e902525ad4c184cbe9f0856f125865cacc54a` | `encounter_accepted` |
| complete (creator) | `47926ed9478a0b078875fb5b4d48ffa1e3c4f200ff9c58f8a64d82fdba0eb14e` | `encounter_completion` |
| complete (participant) | `8884afc56be9e3ff7a2ea5a833fb3108e401d04e05f26202225c57a1789c2629` | `encounter_completion`, `encounter_completed` |
| settle (escrow release) | `4bb317e9ddbf1e53d918297f44ad953998924ecf85aed04b0c1604255dab0665` | SAC `transfer` 10,000,000 contract→participant; `encounter_settled` |
| afterglow (creator, 88) | `3846b16768b4cd66f56475cd36ded29d343f832c6927543f6bc60c1c989ddd95` | `afterglow_submitted` |
| afterglow (participant, 92) | `2c6fbc5f45ecf45d95fea97dabd8bf629e6c4a9d2d3306c9c7b6005996537aa8` | `afterglow_submitted` |

## State readback (RPC simulation, after settlement)

```json
{
  "asset": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  "created_at": 1795577923,
  "creator": "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ",
  "creator_completed": true,
  "expires_at": 1795581520,
  "id": 1,
  "participant": "GBQV7XDOMA6342BHICZGIRBDOZVTMRL7A7A3MWVL4SRP7EH37NAPO5KQ",
  "participant_completed": true,
  "settlement_marker": "d6d0129296e466639148ad5f08c96317eb604201b94a63fbab3a70bcbb7e1641",
  "stake": "10000000",
  "status": "Settled",
  "terms_hash": "ef5383014931c31c85b40119ac149f3d5dae5eb8874d5e56ed88a74905ac6aa6"
}
```

Afterglow readback for the participant returned `92`.

## Negative checks on the live contract

| Attempt | Observed result |
|---|---|
| Call `settle_encounter` again on settled encounter #1 | simulation rejected with `HostError: Error(Contract, #6)` = `InvalidState` |
| Submit a second afterglow from the creator | simulation rejected with `HostError: Error(Contract, #9)` = `AlreadySubmitted` |

## Reproduction

```bash
# 1. Source and build
git clone <repo> && cd ecstasy
npm install && npm run build
cd contracts/ecstasy && cargo test && stellar contract build

# 2. Deploy (requires a funded Stellar CLI identity)
cd ../..
SOURCE=<identity> contracts/ecstasy/scripts/deploy.sh

# 3. Run the full flow with two funded identities
CREATOR=<identity-a> PARTICIPANT=<identity-b> \
  CONTRACT_ID=<deployed-id> contracts/ecstasy/scripts/smoke.sh
```

The smoke script prints the contract ID, both addresses, every transaction hash and every emitted event. `contracts/ecstasy/tests/contract_test.rs` covers the equivalent state machine offline (19 tests).

## Mission 02 — Pago relámpago (`SHIP-S97KF8`)

A real Testnet **payment** (classic `payment` operation, not a contract invoke) sent by the app itself through its own route `apps/web/app/api/challenge-payment/route.ts`, exposed in the UI by `apps/web/components/ChallengePayment.tsx`. The source is an ephemeral keypair funded by Testnet friendbot per request; no key is stored or logged.

| Item | Value |
|---|---|
| Transaction hash | `94f69d66bb3019a9adeaef5071cfe73e0fd58794fb891a600af12f47aff7f893` |
| stellar.expert | https://stellar.expert/explorer/testnet/tx/94f69d66bb3019a9adeaef5071cfe73e0fd58794fb891a600af12f47aff7f893 |
| Memo (text) | `SHIP-S97KF8` |
| Operation | `payment`, 0.0001 XLM (native) |
| Source (ephemeral) | `GDVXRUISPEWL7EBMU2TRFYTLTSZFNZCSVNYID7LTVXW2QKS2WMCLTX3D` |
| Destination | `GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ` |
| Horizon readback | `successful: true`, `memo_type: text`, `memo: SHIP-S97KF8`, `to: GAUZS…6IKISJ` |

Reproduce from the running app (the code that builds and submits lives in the committed route):

```bash
npm run dev
curl -X POST http://localhost:3000/api/challenge-payment
```

## Known limitations

- Browser E2E with two Freighter wallets and UI screenshots are still pending; this pack is CLI/RPC evidence plus a production web build.
- One asset (native XLM) and one escrow rule (creator's stake → participant on mutual completion) are implemented.
- No dispute arbitration, identity verification or encrypted off-chain storage.
- A hash is a commitment, not encryption: if the terms are shared openly, confidentiality is lost.
- Mainnet deployment is intentionally deferred pending review; no license has been chosen.
