# ADR 0001 — Stack

## Decision

Use a small TypeScript web app, a Rust/Soroban contract, and a thin shared Stellar integration package.

## Rationale

- fast path to a public demo;
- Rust contract satisfies the core Stellar smart-contract requirement;
- wallet integration remains replaceable;
- domain logic can be tested independently from UI.

## Version policy

Use the current supported Stellar CLI/Soroban SDK and wallet tooling when implementation begins. Record exact versions in lockfiles and this ADR. Do not invent version numbers in documentation.
