# ADR 0001 — Stack

## Decision

Use a TypeScript web app, a Rust/Soroban contract, and a thin shared Stellar integration package.

## Rationale

- fast path to a public demo;
- Rust contract satisfies the core Stellar smart-contract requirement;
- wallet integration remains replaceable through `WalletAdapter`;
- domain logic can be tested independently from UI.

## Pinned versions (implementation PR)

Verified locally on Testnet:

| Component | Version |
|---|---|
| Rust / Cargo | 1.99.1 |
| `soroban-sdk` (manifest) | 29.0.0 (resolves to 29.0.1) |
| Stellar CLI | 30.0.1 |
| Wasm target | `wasm32v1-none` |
| Node | 26.13.1 |
| TypeScript | 7.0.2 |
| Next.js | 16.4.6 |
| React / React DOM | 19.3.1 |
| `@stellar/stellar-sdk` | 17.4.0 |
| `@stellar/freighter-api` | 6.0.1 |
| Vitest | 5.1.1 |

Do not invent version numbers in documentation: update this table when dependencies change. Contract builds must use `stellar contract build` (SDK 29 rejects a raw `cargo build` on Rust 1.82+ unless `wasm32v1-none` and a current CLI are used).

## Contract client strategy

Typed bindings are generated from the compiled wasm with `stellar contract bindings typescript` and committed at `packages/stellar/src/generated/ecstasy.ts`. The generated client embeds the contract spec, so no hand-written ABI encoding is needed in the web app.
