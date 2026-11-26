# Release matrix — generated

Generated: 2026-11-26T04:15:12.441Z

| Item | Value |
|---|---|
| Source commit | `44a1b41118cc26196c2f5fe35f0a03f27039756c` — fix(e2e): correct checklist path and add scenario type declarations |
| Network | testnet (public preset in `packages/stellar/src/config.ts`) |
| Contract ID | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` |
| Escrow asset | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Wasm SHA-256 | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` |
| Node (CI/Netlify) | >=20 / 24 |
| Next.js | 16.4.6 |
| React | 19.3.1 |
| @stellar/stellar-sdk | 17.4.0 |
| @stellar/freighter-api | 6.0.1 |
| soroban-sdk (manifest) | 29.0.0 |

## Verification commands

```bash
npm ci && npm test && npm run typecheck && npm run build
cd contracts/ecstasy && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build
cd ../.. && npm run generate:bindings --workspace=@ecstasy/stellar && git diff --exit-code -- packages/stellar/src/generated/ecstasy.ts
SITE_URL=https://ecs-tasy.netlify.app SKIP_PAYMENT=1 scripts/production-smoke.sh
```

Transaction evidence: `docs/FUNCTIONS_FOR_REVIEW.md`, `docs/EVIDENCE.md` and `docs/RELEASES/testnet-rc-1.md`.
Browser E2E status: `docs/E2E_CHECKLIST.md`.
