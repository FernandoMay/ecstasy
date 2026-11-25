# @ecstasy/stellar

Shared Stellar integration boundary for ECSTASY. It must never handle private keys or seed phrases.

## Contents

| Module | Responsibility |
|---|---|
| `config.ts` | Network presets, public env configuration, contract/asset IDs |
| `wallet.ts` | `WalletAdapter` interface, Freighter implementation, network assertion |
| `contract.ts` | Typed contract client construction (signed or read-only) |
| `encounter.ts` | `EcstasyService`: domain-level flow methods and RPC receipts |
| `terms.ts` | Canonical terms, SHA-256 commitment, hex helpers |
| `explorer.ts` | Public transaction/contract/account links |
| `generated/ecstasy.ts` | Typed client generated from the compiled wasm contract spec |

## Commands

```bash
npm test                 # vitest unit tests
npm run build            # tsc -> dist/
npm run generate:bindings # regenerate typed client from contracts/ecstasy wasm
```

Regeneration requires the Stellar CLI and a locally built contract:

```bash
cd contracts/ecstasy && stellar contract build
cd ../../packages/stellar && npm run generate:bindings
```

## Boundary rules

- Wallet-specific code stays inside `wallet.ts`; domain code depends only on `WalletAdapter`.
- Every write goes through the generated typed client and is signed by the connected wallet.
- Reads use simulation; no response is fabricated or cached as "success".
- Private terms never enter this package's storage or transaction arguments — only their digest.
