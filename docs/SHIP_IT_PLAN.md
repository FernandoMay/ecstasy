# Ship It: Builder Challenge Plan

## Goal

Ship a real, reproducible Stellar vertical slice by the end of the challenge window, not a mock-heavy prototype.

## Mission mapping

### Mission 02 — Toca Stellar ✅
Delivered:
- Soroban contract compiles (`stellar contract build`, wasm 12.7 KB);
- Testnet deployment;
- contract ID recorded in `docs/EVIDENCE.md`;
- seven real transactions and readback.

### Mission 03 — En el aire (build ready, hosting pending)
Delivered:
- Next.js production build passing;
- Freighter wallet connection with network assertion;
- Testnet configuration via public env vars;
- no mock chain data in production build.
Pending: choose a public host and deploy the built app.

### Mission 04 — Demo (script + CLI evidence ready, recording pending)
Deliver a 2-minute path:

```text
Wallet A → Create → Invite → Wallet B → Accept → Complete → Settle → Afterglow → Explorer proof
```

### Mission 05 — Ship it
Deliver:
- final public repo;
- reproducible setup;
- contract evidence;
- public demo;
- known limitations;
- no unsupported claims.

## Commit strategy

Prioritize meaningful commits:

1. foundation/docs
2. contract state machine
3. contract tests
4. Testnet deployment tooling
5. wallet adapter
6. create/invite flow
7. accept/complete flow
8. settlement receipt
9. afterglow
10. public deployment
11. evidence pack
12. final polish

Do not create empty or filler commits merely to increase a leaderboard score.
