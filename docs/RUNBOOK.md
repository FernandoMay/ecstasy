# ECSTASY — Testnet operations runbook

Scope: the deployed Next.js app on Netlify, the Soroban contract on Testnet and the challenge payment endpoint. No Mainnet procedures are implied. Never put Stellar secret keys or seed phrases in Netlify environment variables, logs, issues or chat.

## Reference values (Testnet RC-1)

| Item | Value |
|---|---|
| Site | https://ecs-tasy.netlify.app |
| Production branch | `main` (Netlify auto-deploy) |
| Contract | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` |
| Wasm hash | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` |
| Escrow asset | native XLM SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| RPC | `https://soroban-testnet.stellar.org` |
| Explorer | https://explorer.stellar.org (chain=testnet) |

## Routine verification

```bash
SITE_URL=https://ecs-tasy.netlify.app scripts/production-smoke.sh
```

The scheduled GitHub Action runs the homepage and encounter-route checks and skips the payment call (`SKIP_PAYMENT=1`) because Friendbot latency can exceed the function timeout. Record failures in `docs/EVIDENCE.md` with timestamp and commit.

## RPC unavailable or stale

1. Check `GET /api/status` — `rpc` should be `healthy`; a stale `latestLedger` indicates an RPC problem.
2. The UI must show an error/retry state, never cached or fabricated encounter data.
3. Retry reads; do not submit writes while RPC is unhealthy. If a write was submitted but confirmation is unknown, treat it as **pending**, not failed, and check the transaction hash in the explorer before retrying — never blindly resend.

## Stuck or pending transaction

1. Copy the transaction hash from the receipt and open it in Stellar Expert.
2. If `PENDING`, wait for the ledger to advance; do not submit the same operation again.
3. If the transaction failed, read back the on-chain encounter state before deciding the next action. A failed invocation rolls back all state changes, including refunds.
4. For an expired encounter, use `expire_encounter` — it is permissionless and commits the creator refund in a successful transaction.

## Failed deployment

1. Check the Netlify deploy log and the CI run for the same commit.
2. Required checks: `npm ci`, shared + web tests, typecheck, production build, cargo tests, wasm build, bindings diff.
3. If the generated client differs from the wasm, regenerate with `npm run generate:bindings --workspace=@ecstasy/stellar` and commit.
4. Confirm the public bundle contains the expected contract ID, then rerun the smoke script.

## Challenge payment endpoint (502/504)

1. `POST /api/challenge-payment` can exceed the Netlify function timeout when Friendbot is slow (measured ~7.6 s plus ~2.8 s submit).
2. Check the response header `x-ecstasy-rate-limit-mode`: `local` means the per-instance limiter is active; `shared` requires Netlify Blobs context in the function runtime.
3. A 429 is expected abuse protection, not an incident. A 5xx requires investigation of function logs.
4. Do not add a Stellar secret key to Netlify as a workaround. Options: raise the function timeout, or move the payment to an asynchronous flow.

## Contract incident / escrow accounting

1. Read the encounter with `get_encounter` and verify `asset`, `stake`, `status` and completion flags.
2. Verify `retirar` cannot touch reserved escrow: it only transfers the balance above `ReservedStake` of the pinned asset.
3. If a state transition looks wrong, stop writes and compare the deployed wasm hash with `stellar contract build`. Do not upgrade the contract in place without a reviewed migration plan.

## Compromised deploy credential

1. Revoke the Netlify/GitHub token and rotate deploy access immediately.
2. Verify the latest production deploy corresponds to a reviewed `main` commit and expected wasm/contract IDs.
3. If an unexpected contract ID appears in the bundle, treat the app as untrusted and take it offline until audited.

## User-reported privacy incident

1. Remember the protocol never puts private terms on-chain. A hash is a commitment, not encryption; if terms were shared publicly, confidentiality cannot be restored.
2. If a user stored terms locally via the opt-in checkbox, instruct them to use "Clear locally stored terms" and clear browser session storage.
3. Collect only the encounter ID, transaction hash and a description. Never request or record the private terms document, seed phrases or private keys.
4. Escalate to the product owner; legal/product review is outside this runbook.
