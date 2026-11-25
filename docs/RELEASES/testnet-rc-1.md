# Testnet Release Candidate 1

Versioned, independently checkable snapshot of the ECSTASY Testnet release. This document pins the exact source, build, deployment and evidence; `docs/EVIDENCE.md` keeps the full transaction log.

## Identity

| Item | Value |
|---|---|
| Release label | Testnet Release Candidate 1 (not Mainnet, not a production financial product) |
| Source commit | `d82a57d` (Sprint D final; includes status endpoint, privacy controls, runbook and this pack) |
| Contract ID | `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` |
| Wasm SHA-256 | `f0dccce254ad73bd831eef5d3c9eb74462e165bb6c28004e695dbff728d0cf61` |
| Network | Testnet (`Test SDF Network ; September 2015`) |
| Escrow asset | native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| RPC / explorer | `https://soroban-testnet.stellar.org` / https://explorer.stellar.org?chain=testnet |
| Public app | https://ecs-tasy.netlify.app |

Reproduce the wasm hash:

```bash
git checkout d82a57d
cd contracts/ecstasy && stellar contract build
```

## Verification matrix

| Check | Result |
|---|---|
| Contract tests | 24 passed, including auth, replay, expiry, bounds, multi-asset and 200k-ledger TTL |
| Shared package tests | 12 passed |
| Web tests | 12 passed |
| Typecheck / production build | clean |
| Clippy `-D warnings` / cargo fmt | clean |
| Generated bindings vs final wasm | no diff |
| Clean clone | `npm ci`, tests, typecheck, build, wasm, clippy, bindings sync all pass |
| Production smoke | homepage 200, encounter route 200, new contract ID in public bundle; `GET /api/status` reports `rpc: healthy` |

## Evidence links

- Full state-machine smoke (7 signed transactions): `docs/EVIDENCE.md`, Sprint C section.
- `retirar`: https://stellar.expert/explorer/testnet/tx/1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6
- Mission 02 payment (memo `SHIP-S97KF8`): https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8
- Function/transaction review log: `docs/FUNCTIONS_FOR_REVIEW.md`.

## Known limitations (release blockers for "fully validated")

1. Two-wallet Freighter browser E2E and screenshots are not executed; CLI/RPC evidence is not a substitute.
2. Netlify Blobs context is absent in the function runtime, so the payment rate limiter runs in `local` mode (per instance) rather than shared.
3. `/api/challenge-payment` returns 502/504 when Friendbot latency exceeds the function timeout. The historical transaction above was successful; this is an operational limitation, not a contract failure.
4. One asset and one escrow rule; no dispute arbitration, identity verification or encrypted off-chain storage.
5. Mainnet deployment, independent security review and license choice are separate owner decisions.

Release label may be upgraded to "validated Testnet demo" only after items 1–3 are closed. No Mainnet claim follows from this document.
