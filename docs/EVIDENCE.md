# ECSTASY — Testnet evidence pack

Everything below was produced by real signed Stellar Testnet transactions. No RPC response is mocked.

## Artifacts

| Item | Value |
|---|---|
| Network | Testnet (`Test SDF Network ; September 2015`) |
| Source commit | `7c04816` (`feat: implement ECSTASY Testnet vertical slice`) |
| Contract ID (current, Sprint A) | `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` |
| Wasm SHA-256 (current) | `f0dccce254ad73bd831eef5d3c9eb74462e165bb6c28004e695dbff728d0cf61` |
| Previous contract IDs | `CB7IX7KXOT7EDVNRFKN5UAT5TNNBVIAGM2IFLZIHIZXPXW7WH7I35DJV` (`retirar`), `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` (earlier evidence below) |
| Escrow asset | native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Creator identity | `arceus-deployer` → `GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ` |
| Participant identity | `suite-admin` → `GBQV7XDOMA6342BHICZGIRBDOZVTMRL7A7A3MWVL4SRP7EH37NAPO5KQ` |
| Contract explorer (current) | https://lab.stellar.org/r/testnet/contract/CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY |

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


## New public function — `retirar`

`retirar(caller, encounter_id)` withdraws funds held by the contract that are **not** reserved as escrow for any encounter. It requires the caller to be the creator of the referenced encounter, computes `balance - ReservedStake`, transfers that surplus, emits `funds_withdrawn`, and returns the amount. Locked escrow can never be drained; a second call with no surplus fails with `InvalidState` (error `#6`, verified on-chain). It has two dedicated tests in `contracts/ecstasy/tests/contract_test.rs` (21 tests total).

| Step | Transaction hash |
|---|---|
| Create encounter with 1 XLM reserved stake | `c8351a20aecdb6b73f802d6ea14f2032abe8bd3694733057aa7af2162cfa9aa4` |
| Send 2 XLM surplus to the contract via native SAC | `1c8f55c56d3b89c19605c18fa5ad7d15d0aa3733f99ceef4d4ab09fe76792eb5` |
| **`retirar` — withdraw the 2 XLM surplus** | `14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e` |

stellar.expert link for the `retirar` transaction:
https://stellar.expert/explorer/testnet/tx/14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e

Observed events: SAC `transfer` of `20000000` stroops contract → creator, and ECSTASY `EncounterEvent` with name `funds_withdrawn`, status `withdrawn`, stake `20000000`. Return value: `"20000000"`. Re-running `retirar` failed with `HostError: Error(Contract, #6)` as expected.

## Netlify deployment configuration

`netlify.toml` sets the monorepo build explicitly: base = repo root, `command = "npm run build"` (builds `@ecstasy/stellar` then `@ecstasy/web`), `publish = "apps/web/.next"`, Node 24. The Next.js Runtime (OpenNext adapter, auto-installed by Netlify) serves App Router route handlers, including `POST /api/challenge-payment`. No additional Netlify plugins are declared. Netlify UI package directory should be `apps/web`; no Stellar secret keys are configured in Netlify environment variables.

### Production verification (done)

Site: https://ecs-tasy.netlify.app — production deploy `6b06649447b9b18c14f52c4a` for commit `a711a2c1`. The first deploy after adding `netlify.toml` had **no functions** because Next.js lives in the `apps/web` workspace and Netlify's auto-detection missed it; `@netlify/plugin-nextjs@5.16.9` was declared explicitly and the new deploy reports "1 function deployed".

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://ecs-tasy.netlify.app/          # 200
curl -X POST https://ecs-tasy.netlify.app/api/challenge-payment                # payment tx
```

| Item | Value |
|---|---|
| Production payment tx | `600f91ff10957cabb990ea4cd9a182c3b280f1ecba8f8b77d0cec655b9884f0f` |
| stellar.expert | https://stellar.expert/explorer/testnet/tx/600f91ff10957cabb990ea4cd9a182c3b280f1ecba8f8b77d0cec655b9884f0f |
| Memo | `SHIP-S97KF8` (text) |
| Horizon readback | `successful: true`, `payment`, `0.0001000 XLM`, `to: GAUZSVWQ…6IKISJ` |

No Stellar secret keys or seed phrases are configured in Netlify environment variables. The endpoint generates an ephemeral friendbot-funded keypair per request.

**Current limitation (Sprint B follow-up):** production calls to `/api/challenge-payment` now return HTTP 502/504 intermittently. Instrumented local runs show Friendbot taking up to ~7.6 s and submission ~2.8 s, above the Netlify function timeout. The account sequence is now derived from the Friendbot transaction ledger (`ledger << 32`) instead of polling `/accounts`, removing a few seconds and fixing an earlier `tx_bad_seq` off-by-one; three local payments succeeded after that fix (`643c1bc9…`, `bca2db49…`, `ef8daa35…`). Raising the function timeout or moving the payment to an asynchronous flow is a platform decision; no secrets are stored.


## Sprint A — P0 corrections (audit `DEMO_MODE_DEPRECATION_AND_PRODUCTION_READINESS.md`)

### P0.1 — Stale terms commitment

`apps/web/lib/terms-form.ts` now builds the terms document and digest from the current form values on **every** preview and on submit. Any edit clears the preview and shows "Terms changed — preview again"; the form locks after a successful create and the copy button emits the exact submitted document. Four regression tests cover preview→edit→submit, preview→no-edit stability, edits to every term field, and malformed values.

### P0.2 — Single escrow asset enforced on-chain

The contract pins `EscrowAsset` on the first `create_encounter` and rejects any different asset with `InvalidAsset` (code `11`), including zero-stake creates. `retirar` also verifies the encounter asset matches the pinned asset, so one asset's reserve cannot be consumed through another. Two new contract tests cover pinning and cross-asset surplus.

Testnet verification on the current contract:

| Check | Result |
|---|---|
| Full create → accept → complete ×2 → settle → afterglow ×2 | succeeded, 7 real transactions: `f53d02f1…`, `f4cc2d64…`, `9eb9f213…`, `f272bdc0…`, `f685c8bd…`, `a9388eb8…`, `4ec7f294…`; final readback `Settled`, marker `88b7df30…` |
| `create_encounter` with a different asset, stake 0 | `HostError: Error(Contract, #11)` = `InvalidAsset` |

The web app no longer accepts a free-form asset: the configured SAC is read-only, the service injects it and rejects an unconfigured value before building a transaction. Network presets carry explicit public defaults so production works without extra Netlify env vars; env vars still override.

### P0.3 — Payment route hardened

`apps/web/lib/payment-policy.ts` + the route now: ignore caller-controlled destination, validate the server-configured destination as a classic Stellar account (`G…`), reject non-Testnet configurations, cap request size, rate-limit per client (2 requests / 10 minutes), ignore request bodies, and emit structured logs with public hashes only. No secret material is stored, logged or returned. Five policy tests cover invalid addresses, config override, network gate, body size and rate limiting.

**Production re-verification after Sprint A:** Netlify deploy `6b0669acdbff4010076d85a6` for commit `a5040462` reports "1 function deployed"; `GET /` → 200; the public JS bundle contains contract ID `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` (committed testnet preset, no UI override needed). `POST /api/challenge-payment` produced `da1d9f6018df0a93336e5b0294738c64d52b6c1d60d9d3317d10e8a327f600ed` with `successful: true` and memo `SHIP-S97KF8`; the third rapid call returned HTTP 429 `{"error":"Too many requests"}`, confirming the rate limit in production.

### P0.4 — Two-wallet browser E2E

Still pending: no Freighter extension is available in this execution environment. CLI/RPC E2E and production payment evidence remain valid; browser evidence will be added separately.


## Sprint B — concurrency, wallet hardening and browser E2E gate

Work is on branch `sprint-b`; `main` remains the stable baseline.

### Endpoint concurrency

Against a local production build of the app (`next dev -p 3101`), six parallel `POST /api/challenge-payment` requests with the same `X-Forwarded-For` returned **2 × HTTP 200 and 4 × HTTP 429**. Six parallel requests with six distinct client keys returned **6 × HTTP 200**, confirming per-client isolation. The in-process limiter is therefore correct under concurrency, but it is per function instance: a caller could multiply the allowance by hitting many Netlify instances.

To close that gap, `apps/web/lib/payment-policy.ts` adds `SharedRateLimiter` backed by Netlify Blobs with optimistic concurrency (`getWithMetadata` ETag + `setJSON` `onlyIfMatch` / `onlyIfNew`). It is used automatically when `NETLIFY === "true"`; elsewhere the local limiter remains. Three tests simulate two independent limiter instances sharing one store: only 2 of 4 concurrent requests succeed. It fails closed on repeated CAS contention, and falls back to local limiting if Blobs is unavailable. Production behaviour with the shared store was re-verified after merge: the deploy for commit `9a04bb9` serves the homepage with HTTP 200 and produces real payments (e.g. `20d01d8e013d76ef8feb4b5ffb13781f2a6f92ed6dfd0eb4b6b3a2ad62097875`, memo `SHIP-S97KF8`, Horizon `successful: true`). The response header `x-ecstasy-rate-limit-mode` reports `local`: this site's function runtime does not expose `NETLIFY_BLOBS_CONTEXT`, so the safe fallback is active. Repeated rapid calls still return HTTP 429. The distributed limiter activates automatically when Netlify Blobs is enabled for the site (or the context is provided); no code change is needed.

### Wallet and input hardening

- `WalletProvider` adds explicit `disconnect()` and `refresh()` controls, and subscribes to Freighter account/network changes (`WatchWalletChanges`, 3 s poll). A network switch clears the connected account and blocks writes until Testnet is restored; a visible warning is shown in `WalletStatus`.
- `EcstasyService.send()` re-checks the wallet network with `assertWalletNetwork` immediately before signing, so a switch while the page is open cannot produce a signature on the wrong network.
- `parseEncounterId()` strictly validates route IDs (digits only, positive, ≤20 digits) with two regression tests; invalid IDs now fail before RPC calls.

### Browser E2E gate (blocked, not claimed)

The in-app browser successfully loaded https://ecs-tasy.netlify.app/ (title and UI rendered), but `window.freighter` is absent: **Freighter is not installed in this browser**. No two-wallet signing flow, rejection, account switch or screenshots were executed. This gate remains explicitly open. Required next steps: install Freighter, create/fund two independent Testnet wallets, then run create → accept → complete ×2 → settle → afterglow ×2, plus decline/cancel/expiry, capturing hashes and screenshots.


## Sprint C — Contract hardening and CI/deploy parity

All work is on `main`; no new feature branches were needed.

### Storage TTL

Every successful mutating contract call now calls `extend_ttl(5_000_000, 6_000_000)` on instance storage (below the 6_312_000 ledger protocol maximum; Testnet ledger ≈ 5 s). A new test advances 200,000 ledgers and timestamps while an encounter holds escrow, then verifies: state is readable, status derives `Expired`, the reserve still blocks withdrawal of locked funds, surplus withdrawal works, and `expire_encounter` refunds the creator. 24 contract tests total.

### Final WASM and deployment

| Item | Value |
|---|---|
| Contract ID (Sprint C) | `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` |
| Wasm SHA-256 | `f0dccce254ad73bd831eef5d3c9eb74462e165bb6c28004e695dbff728d0cf61` |
| Full flow after redeploy | `584f839f…`, `b2739e80…`, `f0bd3830…`, `772dd8c2…`, `9692ac0b…`, `f17e588f…`, `af6bf779…` (final state `Settled`, marker `c8a8ccbc…`) |
| `retirar` on final contract | `1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6` (2 XLM surplus withdrawn) |

The generated TypeScript client was regenerated from this exact WASM. CI now fails if the committed generated file differs from a fresh generation.

### Parity and fail-closed config

CI and Netlify both use Node 24; Rust 1.99.1 is pinned in `rust-toolchain.toml`; Stellar CLI 30.0.1 is pinned in CI and scripts. CI runs cargo check, fmt, clippy, 24 contract tests, wasm build, npm ci, 12 shared + 12 web tests, typecheck, production build and the bindings-sync check. `getConfig()` rejects unknown networks and requires `NEXT_PUBLIC_MAINNET_RELEASE=confirmed` plus explicit valid IDs for Mainnet; two new tests cover those gates.

### Production smoke after Sprint C

`scripts/production-smoke.sh` against https://ecs-tasy.netlify.app (deploy of `9c1c985`) reports homepage 200, encounter route 200, and the public JS bundle contains the new contract ID `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY`. The payment step still returns HTTP 502 (Netlify function timeout with Friendbot latency), as documented above — this remains an open operational item, not a contract failure.

### Clean-clone verification

Executed from a fresh `git clone https://github.com/FernandoMay/ecstasy.git` (commit `90b8471`): `npm ci`, `npm test` (12 shared + 12 web), `npm run typecheck` (clean), `npm run build` (compiled), `cargo clippy --all-targets -- -D warnings` (clean), `cargo test` (24 passed), `stellar contract build` (wasm hash `f0dccce254ad73bd831eef5d3c9eb74462e165bb6c28004e695dbff728d0cf61`), `npm run generate:bindings` + `git diff --exit-code` on the generated client (no diff). Two ordering issues found during this check were fixed: the root `test`/`typecheck` scripts now build the shared package first, and clippy lints in the contract/tests were resolved.


## Sprint D — release documentation and operations

- `GET /api/status` is live in production: `{"network":"testnet","rpc":"healthy","latestLedger":5912321,...}` with the pinned contract and asset IDs. The home page renders this in `StatusPanel` with an explorer link. No secrets or private terms are exposed.
- `scripts/production-smoke.sh` (manual + scheduled every 6 h via `.github/workflows/production-smoke.yml`): homepage 200, encounter route 200, payment step skipped by default because of the known Friendbot/function-timeout issue. Full smoke including payment still reports 502 and is documented above.
- Privacy controls: private-terms local storage is now opt-in and clearable from the create form; the UI states that a hash is a commitment, not encryption, that terms are not encrypted by this protocol, and that location hints must stay coarse.
- `docs/RUNBOOK.md` covers RPC outage, pending transactions, failed deploy, payment 502/504, contract incidents, compromised credentials and privacy incidents. `docs/RELEASES/testnet-rc-1.md` pins source commit, wasm hash, contract, verification matrix and known limitations.
- `docs/FUNCTIONS_FOR_REVIEW.md` records every new function with its transaction link (read-only endpoints are marked N/A).

## Known limitations

- Browser E2E with two Freighter wallets and UI screenshots are still pending; this pack is CLI/RPC evidence plus a production web build and a production payment verified from the public Netlify URL.
- One asset (native XLM) and one escrow rule (creator's stake → participant on mutual completion) are implemented.
- No dispute arbitration, identity verification or encrypted off-chain storage.
- A hash is a commitment, not encryption: if the terms are shared openly, confidentiality is lost.
- Mainnet deployment is intentionally deferred pending review; no license has been chosen.
