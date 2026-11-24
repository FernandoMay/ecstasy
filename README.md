# ECSTASY

**Private encounters. Public proof.**

ECSTASY is a consent-first private-agreement protocol built on Stellar. Two people can create an encounter, agree to terms, optionally lock value in escrow, complete the encounter, settle on-chain, and leave verifiable afterglow/reputation without publishing private terms.

> **Private by default. Settled on Stellar.**

## Why

ECSTASY turns the narrative of secret encounters into a neutral Web3 primitive: privacy, explicit consent, commitments, settlement, and consequences. It is **not a dating app** and does not require sexual content. An encounter can represent a date, experience, challenge, collaboration, conditional gift, or other bilateral agreement.

## MVP

```text
Create → Invite → Consent → Optional Escrow → Complete → Settle → Afterglow
```

### On-chain
- participant addresses
- encounter status
- stake amount + asset identifier
- cryptographic `terms_hash`
- timestamps / expiry
- completion and settlement state
- coarse afterglow score / reputation event

### Off-chain
- private terms
- messages and personal content
- optional encrypted metadata

**Never put private terms or sensitive personal content on-chain.**

## Repository

```text
apps/web/                 Next.js frontend scaffold
contracts/ecstasy/        Soroban contract
packages/stellar/         shared Stellar integration boundary
docs/                     product, protocol, security, branding and demo docs
.github/workflows/        CI
```

## Build target

The Ship It: Builder Challenge target is a small, demonstrable vertical slice rather than a feature-heavy social network:

1. deploy Soroban contract to Stellar Testnet;
2. connect two wallets;
3. create an encounter;
4. accept/decline;
5. complete and settle;
6. show transaction evidence;
7. submit afterglow;
8. deploy a public web demo;
9. only after Testnet evidence is solid, prepare Mainnet.

## Current status

**Stage: foundation / implementation ready.** This repository intentionally contains the architecture, contracts boundary, security model, branding system, demo script and delivery checklist before claiming functionality.

## Stellar

The implementation should use the current Stellar CLI/Soroban toolchain and current JavaScript wallet tooling at build time. Pin actual dependency versions in the implementation PR and record the versions in `docs/TECHNICAL_SPEC.md` and `docs/ADR/0001-stack.md`.

## Safety and trust boundaries

ECSTASY must not be presented as a mechanism for evading law, consent, moderation, or identity requirements. Escrow is optional. The protocol records proof of an agreed state transition, not proof that an off-chain real-world event was objectively true.

## License

TBD before public production launch. Do not add a license until the project owner chooses one.
