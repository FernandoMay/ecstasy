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
apps/web/                 Next.js demo dApp (real Testnet flows)
contracts/ecstasy/        Soroban contract, tests and deploy/smoke scripts
packages/stellar/         shared Stellar SDK, wallet adapter and typed bindings
docs/                     product, protocol, security, evidence and demo docs
.github/workflows/        CI (contract, web, docs)
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

**Stage: Testnet vertical slice shipped.** The Soroban contract, its test suite, the shared Stellar package and the Next.js demo are implemented. The contract is deployed on Testnet and the full create → consent → complete → settle → afterglow flow has been executed with two real signed transactions per party. See `docs/EVIDENCE.md`.

### Quickstart

```bash
npm install                       # installs the web + shared package workspaces
cp .env.example apps/web/.env.local
npm run build                     # builds the shared package, then the web app
npm test                          # shared package unit tests
cd contracts/ecstasy && cargo test # 19 contract state-machine tests
npm run dev                       # http://localhost:3000
```

Open the app with Freighter on Testnet. Use two wallets/contexts for the two roles. Private terms never leave the browser; the app only submits their SHA-256 commitment.

### Deploy / smoke test

```bash
SOURCE=<stellar-identity> contracts/ecstasy/scripts/deploy.sh
CREATOR=<identity-a> PARTICIPANT=<identity-b> contracts/ecstasy/scripts/smoke.sh
```

`deploy.sh` prints the public contract ID. `smoke.sh` runs the full flow on-chain and prints every transaction hash for the evidence pack.

## Stellar

The implementation should use the current Stellar CLI/Soroban toolchain and current JavaScript wallet tooling at build time. Pin actual dependency versions in the implementation PR and record the versions in `docs/TECHNICAL_SPEC.md` and `docs/ADR/0001-stack.md`.

## Safety and trust boundaries

ECSTASY must not be presented as a mechanism for evading law, consent, moderation, or identity requirements. Escrow is optional. The protocol records proof of an agreed state transition, not proof that an off-chain real-world event was objectively true.

## License

TBD before public production launch. Do not add a license until the project owner chooses one.
