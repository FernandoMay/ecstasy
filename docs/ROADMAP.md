# Roadmap

## Phase 0 — Foundation
- [x] product concept
- [x] architecture
- [x] privacy model
- [x] branding
- [x] demo script
- [x] challenge plan

## Phase 1 — Testnet MVP
- [x] Soroban contract implementation (state machine + escrow + events + `retirar`)
- [x] unit tests (21 tests, including auth, replay, expiry, bounds and `retirar`)
- [x] Testnet deployment (contract ID in `docs/EVIDENCE.md`)
- [x] wallet adapter (Freighter, replaceable interface)
- [x] create/invite/accept (real signed transactions)
- [x] complete/settle (real escrow transfer and receipt)
- [x] afterglow (one bounded score per party)
- [x] explorer evidence (`docs/EVIDENCE.md`)
- [x] public web deployment config (`netlify.toml`, monorepo build + publish); production verification pending site URL

## Phase 2 — Public demo
- [x] web application implemented and production build passing
- [ ] real Testnet E2E through the browser UI with two Freighter wallets
- [ ] evidence pack screenshots
- [x] accessibility pass on core flow (labels, semantic markup, visible focus)
- [x] error-state pass (setup notice, tx failures, invalid scores, hash mismatch)

## Phase 3 — Mainnet readiness
- [ ] independent security review
- [ ] asset policy finalized
- [ ] production monitoring
- [ ] incident/runbook
- [ ] legal/product review
- [ ] mainnet deployment decision

## Explicitly out of MVP

- chat
- matching/recommendation engine
- token launch
- NFT collection
- DAO
- mobile app
- generalized dispute arbitration
- anonymous identity claims
- complex privacy cryptography
