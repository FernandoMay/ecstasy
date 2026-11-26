# Testnet Release Candidate 1

Versioned, independently checkable snapshot of the ECSTASY Testnet release. This document pins the exact source, build, deployment and evidence; `docs/EVIDENCE.md` keeps the full transaction log.

## Identity

| Item | Value |
|---|---|
| Release label | Testnet Release Candidate 1 (not Mainnet, not a production financial product) |
| Source commit | `e592829` (Sprint D + P1 hardening: status endpoint, privacy controls, wallet identity and state-read resilience) |
| Contract ID | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` |
| Wasm SHA-256 | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` |
| Network | Testnet (`Test SDF Network ; September 2015`) |
| Escrow asset | native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| RPC / explorer | `https://soroban-testnet.stellar.org` / https://explorer.stellar.org?chain=testnet |
| Public app | https://ecs-tasy.netlify.app |

The identity above pins the deployed wasm snapshot; it is not the source used for the test counts below, which were re-measured on the current checked-out tree (`33c42d7`, the `main` head before this documentation-only change).

Reproduce the wasm hash:

```bash
git checkout e592829
cd contracts/ecstasy && stellar contract build
```

## Verification matrix

Counts in the "Current checkout" column were re-measured on `33c42d7` with the commands below. The "Historical RC1 record" column preserves the earlier numbers in this document and `docs/EVIDENCE.md`; they were captured across several commits (including the pinned source `e592829`) and are not a single re-run.

```bash
npm test
cd contracts/ecstasy && cargo test
cd ../boveda && cargo test
```

| Check | Current checkout (`33c42d7`) | Historical RC1 record |
|---|---|---|
| Contract tests — `contracts/ecstasy` (`cargo test`) | 38 passed in `tests/contract_test.rs`; 0 lib/unit, 0 doc-tests | 24 passed, including auth, replay, expiry, bounds, multi-asset and 200k-ledger TTL |
| Contract tests — `contracts/boveda` (`cargo test`) | 2 passed; separate vault contract, not the RC1 escrow contract | not in RC1 scope |
| Shared package tests (Vitest) | 26 passed / 8 files | 12 passed |
| Web tests (Vitest) | 48 passed / 11 files | 12 passed |
| Automated total | **114** (38 + 2 + 26 + 48) | 48 (24 + 12 + 12) |
| Typecheck / production build | clean | clean |
| Clippy `-D warnings` / `cargo fmt --check` | `contracts/ecstasy` clean; `contracts/boveda` clippy fails locally (unused import + two needless borrows) | clean |
| Generated bindings vs final wasm | no diff (Stellar CLI deprecation warning only) | no diff |
| `npm run verify:wasm` / `npm run verify:versions` | wasm hash matches 3/3 docs; pinned versions match `docs/adr/0001-stack.md` | pass |
| Clean clone (`npm ci`) / production smoke | not re-run in this reconciliation; historical evidence in `docs/EVIDENCE.md` | homepage 200, encounter route 200, new contract ID in public bundle; `GET /api/status` reports `rpc: healthy` |

Scope of the automated counts:

- **Unit/invariant tests (Vitest):** 74 = 26 shared + 48 web. Three of the web tests validate the browser-E2E harness definition; they do not launch a browser.
- **Contract tests (Soroban `cargo test`):** 40 = 38 ECSTASY state-machine tests + 2 vault tests. They exercise on-chain rules and invariants in the Rust test harness, not a browser.
- **Integration tests:** no separate automated integration suite exists in this checkout. Live CLI/RPC smoke and `scripts/production-smoke.sh` (HTTP; `SKIP_PAYMENT=1` in CI) are integration evidence outside the 114-test count; see `docs/EVIDENCE.md`.
- **Browser E2E:** 0 executed. `docs/E2E_CHECKLIST.md` defines 9 scenarios / 32 steps, all unchecked; the two-wallet Freighter flow remains pending.

## Evidence links

- Full state-machine smoke (7 signed transactions): `docs/EVIDENCE.md`, Sprint C section.
- `retirar`: https://stellar.expert/explorer/testnet/tx/1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6
- Mission 02 payment (memo `SHIP-S97KF8`): https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8
- Function/transaction review log: `docs/FUNCTIONS_FOR_REVIEW.md`.

## Known limitations (release blockers for "fully validated")

1. Two-wallet Freighter browser E2E and screenshots are not executed; CLI/RPC evidence is not a substitute.
2. Netlify Blobs is now available and `/api/status` reports `shared` mode, but real cross-instance rate-limit enforcement cannot be demonstrated while the payment function times out before responding.
3. `/api/challenge-payment` returns 502/504 when Friendbot latency exceeds the function timeout. The historical transaction above was successful; this is an operational limitation, not a contract failure.
4. One asset and one escrow rule; no dispute arbitration, identity verification or encrypted off-chain storage.
5. Mainnet deployment, independent security review and license choice are separate owner decisions.
6. On the current checkout, `cargo clippy --all-targets -- -D warnings` fails in `contracts/boveda` (one unused import and two needless-borrow lints) while `contracts/ecstasy` passes. This is outside the RC1 escrow contract, but it means the repository-wide clippy gate is not currently reproducible locally.

Release label may be upgraded to "validated Testnet demo" only after items 1–3 are closed. No Mainnet claim follows from this document.
