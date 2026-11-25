# ECSTASY — 2-Minute Demo

## Setup

Use two real Stellar Testnet wallets with Freighter. Fund them before recording. Open the app in two browser contexts. The deployed contract/environment values are in `docs/EVIDENCE.md`; the private terms document is shared out-of-band so the participant can paste it to verify the on-chain hash before consenting.

For CLI-only evidence (no browser), `contracts/ecstasy/scripts/smoke.sh` executes the same sequence with real signed transactions and prints every hash.

## Script

**0:00 — Hook**

> “ECSTASY is a private-agreement protocol. Private terms stay off-chain; the commitment and settlement are public on Stellar.”

**0:15 — Create**

Wallet A creates an encounter with Wallet B, expiry, terms and optional stake.

Show the generated terms hash.

**0:35 — Consent**

Switch to Wallet B. Show the invitation. Review terms. Accept.

**0:55 — Complete**

Both sides perform the required completion action.

**1:10 — Settlement**

Execute settlement. Show the receipt with contract ID and transaction hash.

**1:30 — Afterglow**

Both parties submit bounded afterglow scores.

**1:45 — Proof**

Open the Stellar explorer/RPC evidence and show the state transition.

**1:55 — Close**

> “The private encounter stays private. The agreed state transition is verifiable.”
