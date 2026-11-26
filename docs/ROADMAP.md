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
- [x] unit tests (38 tests, including auth, replay, expiry, bounds, multi-asset, TTL and `retirar`)
- [x] Testnet deployment (contract IDs and wasm hash in `docs/EVIDENCE.md`)
- [x] wallet adapter (replaceable Freighter adapter)
- [x] create/invite/accept (real Testnet transactions)
- [x] complete/settle (real escrow transfer and receipt)
- [x] afterglow (one bounded score per party)
- [x] explorer evidence (`docs/TESTNET_TRANSACTIONS.md`, 60+ hashes)
- [x] public web deployment on Netlify; production homepage and API smoke verified

## Phase 2 — Public demo / release candidate
- [x] web application implemented and production build passing
- [x] browser Lighthouse 1.00 on `/` and `/boveda`
- [x] local encounter inbox + in-app activity feed + detail timeline + public Evidence Center
- [ ] real Testnet E2E through the browser UI with two Freighter wallets — **G3 pending, 0/9 scenarios**
- [ ] screenshots and hashes for the nine E2E scenarios
- [x] accessibility pass (automated) and error-state pass
- [x] versioned evidence pack tied to commit and wasm hash (`docs/RELEASES/testnet-rc-1.md`)

## Phase 3 — Mainnet readiness (not started)
- [ ] independent Soroban/security review
- [ ] asset policy finalized
- [ ] production monitoring and runbook enforcement
- [ ] incident/runbook drill
- [ ] legal/product review
- [ ] mainnet deployment decision

## V2 — funcionalidades no incluidas en el MVP actual

- [x] Intercambio privado cifrado de términos (AES-GCM + PBKDF2 en el cliente; frase compartida fuera de la app).
- [ ] Resolución de disputas con árbitro y política de fondos (requiere especificación).
- [ ] Identidad verificada.
- [ ] Soporte multiasset y multipartito.
- [ ] Notificaciones push (la app solo tiene actividad in-app local).

Estas funciones **no están implementadas**; no se cuentan como parte de RC-1.

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
