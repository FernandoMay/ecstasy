# ECSTASY Web

Next.js demo dApp. It uses real Testnet RPC transactions — there are no mock chain responses in any path.

## Setup

```bash
cp ../../.env.example .env.local
npm install       # from the repository root
npm run dev
```

Required environment:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` (or `mainnet` once approved) |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed ECSTASY contract |
| `NEXT_PUBLIC_ASSET_CONTRACT_ID` | Stellar Asset Contract used for escrow |
| `NEXT_PUBLIC_ASSET_SYMBOL` | Display symbol for the asset |

If the contract ID is missing, the page renders a setup notice instead of fake data.

## Flows

1. Connect Freighter (network is checked against the configured passphrase).
2. Create encounter: fill private terms, preview the SHA-256 commitment, then sign the creation transaction. The terms document stays in this browser; only its digest is submitted.
3. Copy the private terms through your own channel and copy the invitation link (id only).
4. The participant opens the link, pastes the private terms to verify the hash, then consents or declines.
5. Both parties record completion; either party settles. The receipt shows the real transaction hash and explorer link.
6. Each party submits one bounded afterglow score after settlement.

## Mission 02 payment

`POST /api/challenge-payment` builds and submits a real Testnet payment with memo `SHIP-S97KF8` from an ephemeral friendbot-funded account. The UI exposes it as "Pago relámpago · Testnet" on the home page and renders the resulting stellar.expert link. No secret keys are stored, logged or sent to the browser. Evidence: `docs/EVIDENCE.md`.

## Components

`EncounterCard`, `ConsentSheet`, `TermsHashBadge`, `StakePanel`, `EncounterTimeline`, `SettlementReceipt`, `AfterglowSlider`, `WalletStatus`, `ExplorerEvidence`.

## Safety

No seed phrases or private keys are handled. Consent is gated on a verified hash in the UI, and contracts enforce authorization on-chain. An on-chain transaction proves an agreed state transition, not that an off-chain event was objectively true.
