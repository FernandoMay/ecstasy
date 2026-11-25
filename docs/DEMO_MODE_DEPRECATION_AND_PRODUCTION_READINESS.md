# ECSTASY — Demo Mode Deprecation & Production Readiness Plan

> **Status:** audit and implementation plan; this document does not claim that the pending work has already been implemented.  
> **Repository reviewed:** `FernandoMay/ecstasy`  
> **Branch / audited HEAD:** `main` / `3f3490458750d3ea4b620604484a6440fc3376a8`  
> **Production URL:** https://ecs-tasy.netlify.app/  
> **Contract (Testnet):** `CB7IX7KXOT7EDVNRFKN5UAT5TNNBVIAGM2IFLZIHIZXPXW7WH7I35DJV`  
> **Audit date:** 2026-11-25

---

## 1. Executive decision

ECSTASY should move from a **Testnet demo/demonstrator** presentation to a **Testnet production-candidate dApp** presentation. Do not remove the real flows or rewrite the application. The repository already contains a real Soroban state machine, a typed Stellar client, a Freighter adapter, a Next.js App Router frontend, and a Netlify deployment configuration.

“Deprecate demo mode” means:

1. remove demo-only language and demo-only affordances from the product's primary experience;
2. never substitute fixtures, mock chain state, simulated balances, fake receipts, or fallback success states for real network data;
3. make network, contract, and asset configuration explicit and validated;
4. make all supported state transitions discoverable and usable from the UI;
5. provide honest loading, empty, error, pending, and confirmed states;
6. prove the complete journey with two independent wallet sessions against the deployed Testnet contract;
7. keep Mainnet disabled until separate security, operational, legal, asset, and release gates pass.

**Do not call the current system Mainnet-ready or independently security-audited.** The repository and the evidence pack support a Testnet vertical slice. The owner-reported production checks include a successful Netlify homepage response, a deployed Next.js function, a real public-route Testnet payment, and a real `retirar` transaction. Browser E2E with two Freighter wallets and UI screenshots are still explicitly outstanding in `docs/EVIDENCE.md`.

## 2. Scope and repository map

There is one deployed web application in scope: the Next.js application at `https://ecs-tasy.netlify.app/`. The repository does not currently define separate web apps, mobile apps, or a second production site. The contract and shared package are libraries/runtime components, not separate websites.

| Area | Files | Responsibility | Audit focus |
|---|---|---|---|
| Monorepo | `package.json`, `package-lock.json`, `.env.example` | npm workspaces, scripts, public configuration | reproducible install/build, config validation |
| Web app / routes | `apps/web/app/page.tsx`, `app/layout.tsx`, `app/encounter/[id]/page.tsx` | home, shell, encounter route | no demo fixtures, routing, UX states |
| Web API | `apps/web/app/api/challenge-payment/route.ts` | Mission 02 Testnet payment endpoint | public abuse, destination validation, rate limits, scope |
| Web components | `apps/web/components/*.tsx` | create, consent, actions, receipts, wallet, evidence | stale form hash, account changes, duplicate actions, accessibility |
| Web runtime | `apps/web/package.json`, `next.config.ts`, `tsconfig.json`, `AGENTS.md` | Next.js 16 / React / TypeScript | build and type safety |
| Shared Stellar domain | `packages/stellar/src/config.ts`, `contract.ts`, `encounter.ts`, `terms.ts`, `wallet.ts`, `explorer.ts` | network config, contract client, state transitions, terms hash, Freighter | network/asset invariants, identity, receipts |
| Generated binding | `packages/stellar/src/generated/ecstasy.ts` | generated Soroban client and ABI | regenerate from current WASM; API parity |
| Shared package tests | `packages/stellar/test/*.test.ts` | terms and explorer tests | validation and boundary coverage |
| Soroban contract | `contracts/ecstasy/src/lib.rs` | authoritative state machine and escrow | auth, state transitions, accounting, TTL |
| Contract tests | `contracts/ecstasy/tests/contract_test.rs` | Rust state-machine tests | adversarial cases and accounting invariants |
| Contract scripts | `contracts/ecstasy/scripts/deploy.sh`, `smoke.sh` | deployment and CLI smoke test | reproducible deployment and two-identity evidence |
| CI | `.github/workflows/ci.yml` | Rust, WASM, npm, docs checks | same toolchain as production |
| Netlify | `netlify.toml`, `netlify/functions/README.md` | Next.js runtime, workspace build, functions | deploy parity and route availability |
| Product docs | `docs/PROTOCOL.md`, `TECHNICAL_SPEC.md`, `API.md`, `BRANDING.md`, `ROADMAP.md`, `SHIP_IT_PLAN.md`, `DEMO_SCRIPT.md` | product and technical contract | keep claims and behavior aligned |
| Security / proof | `docs/SECURITY.md`, `docs/EVIDENCE.md`, `docs/adr/0001-stack.md` | threat model, chain proof, decisions | evidence completeness and audit status |

### User-facing routes and surfaces

- `/`: create encounter, enter invitation, product explanation, challenge payment, explorer evidence.
- `/encounter/[id]`: read on-chain encounter and expose role/state-dependent actions.
- `POST /api/challenge-payment`: separate Mission 02 utility; it is not part of the bilateral encounter protocol.
- External explorer: Stellar Expert links rendered from transaction receipts.
- Netlify production deploy: `https://ecs-tasy.netlify.app/`.

No other site or subdomain was discovered in the repository tree. Verify Netlify deploy previews and custom domains in the Netlify dashboard before release; they are external configuration and are not enumerable from this repository alone.

## 3. Current implementation inventory

### Implemented in source

- Soroban encounter lifecycle: create, accept, decline, complete, settle, cancel, expire, afterglow, and `retirar`.
- Creator and participant authorization is enforced in the contract with `require_auth()` and party checks.
- Optional creator-funded escrow; settlement transfers the stake to the participant; decline/cancel/expiry refund the creator.
- Aggregate `ReservedStake` accounting is intended to protect escrow from `retirar`.
- Private terms are canonicalized and SHA-256 committed; only the digest is submitted on-chain.
- Shared TypeScript domain service and generated Soroban client.
- Freighter wallet adapter and wallet-network passphrase check during explicit connect.
- Next.js pages/components for create, consent, encounter state, completion, settlement, afterglow and explorer receipts.
- Netlify workspace build configuration and explicit Next.js runtime plugin.
- Rust and TypeScript test suites plus CI workflows.

### Evidence currently recorded

See `docs/EVIDENCE.md` for exact transaction hashes and reproduction commands. At the audited HEAD it records:

- deployed Testnet contract and CLI/RPC state-machine evidence;
- successful create/consent/complete/settle/afterglow flow;
- successful real payment from the deployed public API route, memo `SHIP-S97KF8`;
- a real `retirar` transfer of 2 XLM surplus and a rejected repeat withdrawal;
- production deploy identifier `6b06649447b9b18c14f52c4a`, associated with commit `a711a2c1`;
- 21 Rust contract tests in the current evidence section;
- pending two-Freighter browser E2E and UI screenshots.

These are different evidence classes. A successful payment endpoint does not prove the encounter UX. CLI transactions do not prove browser wallet integration. A green build does not prove contract security.

### Documentation drift to fix

- Root `README.md` still says 19 contract tests in the quickstart, while current `docs/EVIDENCE.md` and `docs/ROADMAP.md` say 21.
- `docs/API.md` does not list the implemented `retirar(caller, encounter_id)` method, despite the generated client and contract containing it.
- `docs/SECURITY.md` marks a broad audit checklist complete. Reclassify it as **internal checks completed / independent audit pending** and add the issues in this plan.
- Product docs call the web app a “demo dApp” in several places. Keep the historical challenge/demo script if useful, but label it as a demo script, not the product's runtime mode.
- Root CI uses Node 26 while Netlify is configured for Node 24. Choose one supported Node version and use it in local docs, CI, and Netlify.
- Root README says `npm test` and the contract test command but does not make the latest test count authoritative. Prefer commands over hard-coded counts.

## 4. Findings requiring action

### P0 — Correct before calling the Testnet product flow complete

#### P0.1 — Stale terms commitment after editing the form

**File:** `apps/web/components/CreateEncounterForm.tsx`

After `previewHash()`, the component stores `terms` and `hash`. If the creator edits title, summary, boundaries, duration, or location afterwards, the old `terms` and `hash` remain. `submit()` reuses the cached document/digest instead of rebuilding from the currently displayed values. The UI can therefore show one set of terms while committing another.

**Required fix:**
- invalidate `terms`, `hash`, and any copied/verified indicator whenever a term field changes; or always rebuild and hash the current form values immediately before create;
- show a clear “terms changed — preview again” state;
- ensure the exact canonical document copied to the participant is the document whose digest is submitted;
- add regression tests: preview → edit one field → submit must commit the new value; preview → no edit → submit must preserve the same digest.

**Acceptance:** impossible for visible form terms and submitted commitment to diverge.

#### P0.2 — Asset accounting invariant is not enforced by the UI/config

**Files:** `apps/web/components/CreateEncounterForm.tsx`, `packages/stellar/src/encounter.ts`, `packages/stellar/src/config.ts`, `contracts/ecstasy/src/lib.rs`

The create form lets the user enter an arbitrary asset contract. The contract stores one aggregate `ReservedStake` value, but `retirar` reads the token balance of the asset associated with the caller's referenced encounter and subtracts the global aggregate reserve. This accounting is only coherent if the deployment uses exactly one escrow asset. The docs describe a one-asset deployment, but the UI does not enforce that invariant.

**Required fix — choose one design before further deployment:**
1. **MVP / recommended:** enforce one configured asset contract per deployment. Remove the free-form asset field, display the configured asset as read-only, validate the configured SAC ID, and reject a create request with a different asset in the service and contract policy; or
2. implement per-asset reserved accounting, e.g. `ReservedStake(asset)`, and test multiple assets independently.

Do not merely change the UI; the contract must enforce the invariant. Add tests with two asset contracts proving that no asset can withdraw or consume another asset's reserved escrow.

**Acceptance:** for every supported asset, contract balance is always greater than or equal to the reserve attributed to that same asset; no cross-asset reserve subtraction.

#### P0.3 — Public challenge-payment route can be abused

**File:** `apps/web/app/api/challenge-payment/route.ts`

The route generates a new friendbot-funded keypair and sends a payment on every request. It also accepts `destination` from an unauthenticated request body (or environment override). The current endpoint is a public faucet-backed payment utility, not a safe general payment API. It can be spammed to consume friendbot resources and create unwanted Testnet transactions; a caller can also select the destination.

**Required fix:**
- decide whether Mission 02 remains in the product. If it is challenge-only, remove it from the primary production home and move it to a clearly isolated challenge/evidence route or deprecate it;
- remove caller-controlled destination; use a validated server-side allowlist or a fixed configured destination;
- validate the destination as a Stellar account address before contacting Friendbot;
- implement rate limiting / abuse protection at the edge or service layer, plus request-size and method handling;
- add structured operational logging without secrets, and never return private key material;
- document that the route is Testnet-only and disable it outside Testnet;
- test repeated calls, malformed JSON, invalid addresses, rate limits, and upstream failure paths.

**Acceptance:** no arbitrary public caller can turn this endpoint into an unrestricted faucet-backed transfer mechanism.

#### P0.4 — Complete two-wallet browser E2E

**Files:** `apps/web/components/WalletProvider.tsx`, `EncounterWorkspace.tsx`, `ConsentSheet.tsx`, `CreateEncounterForm.tsx`; evidence in `docs/EVIDENCE.md`.

The current evidence explicitly says browser E2E with two Freighter wallets is pending. The current provider restores an approved wallet once on mount and stores one address in React state; it does not expose an explicit disconnect/account-switch control or visibly reconcile an account/network change while the app remains open.

**Required fix and test:**
- add explicit connect, disconnect/reset and account refresh behavior;
- detect wallet account/network changes where supported by the installed Freighter API, and re-check network before each write;
- ensure every action is shown only to the current creator/participant and the connected account matches the actor being signed;
- verify two separate browser profiles/contexts with independent Freighter accounts;
- run create → accept → both complete → settle → both afterglow; also test decline, cancel and expiry/refund;
- capture screenshots and transaction hashes for every action; record browser, extension, network, contract ID, commit and timestamp.

**Acceptance:** the full happy path and terminal branches succeed from the deployed UI with real signatures from both accounts. CLI smoke tests alone do not satisfy this gate.

### P1 — Required for a reliable Testnet release

#### P1.1 — Robust encounter route and ID validation

**Files:** `apps/web/app/encounter/[id]/page.tsx`, `EncounterWorkspace.tsx`, `packages/stellar/src/encounter.ts`.

Validate IDs before calling `BigInt(id)`: require a canonical positive integer string, reject empty, negative, decimal, exponent, whitespace, and excessive-length values. Show a dedicated invalid-ID/not-found state rather than an indefinite “Loading on-chain state…” panel. Add retry and distinguish RPC unavailable from encounter not found.

#### P1.2 — Refresh behavior after a transaction

**File:** `apps/web/components/EncounterWorkspace.tsx`.

`refresh()` clears the encounter on any read error. If a transaction succeeds but the subsequent read fails, the UI can drop the workspace into a loading/error view even though a receipt exists. Preserve the last known encounter, show stale/read-error state separately, and add a manual retry. Do not display a success status until the transaction response is confirmed and the refreshed state agrees.

#### P1.3 — Action-state consistency

**Files:** `EncounterWorkspace.tsx`, `AfterglowSlider.tsx`.

- Hide/disable each afterglow submission once that wallet's score exists; do not rely on a contract error as the normal UX.
- Distinguish pending, submitted, confirmed, rejected, and RPC-unknown outcomes.
- Prevent duplicate clicks at both component and action-controller levels.
- Make terminal states explicit; do not show actions to unrelated wallets.
- Make the permissionless expiry action available for any viewer when the on-chain expiry is reached, with a clear explanation that it refunds the creator.
- Ensure cancel semantics are described accurately: the contract allows either party to cancel an open encounter; the creator receives the refund.

#### P1.4 — Network configuration must fail closed

**File:** `packages/stellar/src/config.ts`.

The current parser silently maps every network value other than the exact string `mainnet` to Testnet. Replace this with strict validation: only `testnet` and `mainnet` are accepted; invalid values must produce a visible setup error. Validate contract and asset IDs and ensure the configured RPC URL/passphrase/network are a coherent preset. Mainnet must require an explicit release switch and a separately reviewed contract ID.

#### P1.5 — Wallet identity and signing

**Files:** `packages/stellar/src/wallet.ts`, `WalletProvider.tsx`, `packages/stellar/src/encounter.ts`.

- Re-check active wallet address and network before writes, not only at initial connect.
- Clear stale identity when access is revoked or account changes.
- Ensure the signing adapter's requested address is the active actor and surface wallet rejection distinctly.
- Add tests for wrong network, account changed between page load and action, denied access, disconnected extension, and rejected signature.
- Avoid assuming that an address in a React state variable is still the wallet's current account.

#### P1.6 — Soroban storage TTL and long-lived funds

**File:** `contracts/ecstasy/src/lib.rs`.

Review the TTL lifecycle of contract instance storage and all encounter/afterglow/reserve records. The contract stores the counter, encounters, afterglow entries, and aggregate reserve using instance storage. Add an explicit, documented TTL strategy appropriate for escrow records, including extension behavior and a test that advances ledger sequence/time across the intended retention window. Never allow an outstanding escrow record or its reserve accounting to expire while the contract still holds the funds.

**Acceptance:** a ledger-advance test demonstrates that active encounters, reserve accounting, and terminal state remain readable for the promised retention period; expired storage cannot silently orphan funds.

#### P1.7 — CI and deployment parity

**Files:** `.github/workflows/ci.yml`, `netlify.toml`, `package.json`.

- Align Node version in CI and Netlify; currently CI uses Node 26 and Netlify Node 24.
- Pin Rust toolchain / Stellar CLI consistently with deployment docs.
- Add a CI check that regenerates Soroban bindings from the compiled WASM and fails if generated client output differs.
- Run Rust formatting/lints and TypeScript linting if configured.
- Keep `npm ci`, typecheck, shared tests, production build, contract tests and WASM build mandatory.
- Add a post-deploy smoke check for `/`, `/encounter/<known-test-id>` (expected behavior documented), and the challenge endpoint only if it remains enabled.
- Verify Netlify's production branch, package directory, base directory, build command, publish output, and plugin/runtime configuration after each structural change.

### P2 — Product quality and operations

- Add a public status panel showing configured network, contract ID, asset, RPC health, and a link to the contract explorer.
- Add clear privacy warnings: terms are off-chain but are not encrypted by this protocol; a hash is not encryption; wallet addresses and state transitions are public.
- Add a “copy private terms” flow with a warning to share through a trusted private channel. Do not save sensitive terms in browser storage by default unless the user explicitly opts in; if retained, explain local-only storage and provide delete/clear controls.
- Review the optional `locationHint` field: keep it coarse, optional, and discourage identifying or precise location details.
- Add responsive/mobile, keyboard, screen-reader, reduced-motion, and contrast checks.
- Add a production runbook: RPC outage, stuck/pending transaction, failed deployment, contract incident, compromised deploy credential, and user-reported privacy incident.
- Add monitoring for app errors and RPC/Netlify availability without collecting private terms or wallet secrets.
- Choose and publish a license only after the owner makes the decision; the repository currently intentionally has no license.

## 5. Proposed deprecation strategy

Do not do a broad find-and-replace of the word “demo”. Keep historical challenge documentation and reproducible test scripts. Change product semantics in a controlled sequence.

1. **Product naming:** describe the app as “ECSTASY — Stellar Testnet app” or “Testnet dApp”; reserve “demo script” for `docs/DEMO_SCRIPT.md`.
2. **Runtime mode:** remove any future mock/demo toggle if one is introduced. There must be one source of truth: the configured Soroban contract on the selected network.
3. **No fake fallback:** missing config produces a setup error; RPC failure produces an error/retry state; absent encounter produces not-found; pending transactions remain pending. None may fabricate data.
4. **Network banner:** show Testnet prominently on all pages. Never imply that Testnet assets have real-world monetary value.
5. **Challenge payment:** isolate or deprecate the Mission 02 utility separately from the encounter product; it is not a core encounter feature.
6. **Documentation:** update README, web README, API, roadmap, security, evidence and demo script so the same capability/status claims appear everywhere.
7. **Release label:** use “Testnet Release Candidate” only after P0 gates pass. Use “Mainnet production” only after the independent review and Mainnet gates pass.

## 6. Ordered implementation plan

### Sprint A — Correctness and abuse prevention

- [x] Fix stale terms hash/document state in `CreateEncounterForm.tsx` (`lib/terms-form.ts` + 4 regression tests).
- [x] Enforce one asset per deployment end-to-end (`EscrowAsset` + `InvalidAsset` #11, verified on Testnet; 2 contract tests).
- [x] Retain `POST /api/challenge-payment` as a Testnet-only fixed-destination route with validation, rate limit, size cap and structured logs (5 policy tests).
- [ ] Validate encounter IDs and improve not-found/RPC error states.
- [x] Add regression tests for each fix (23 contract tests, 7 shared-package tests, 9 web tests).

**Exit criteria:** no visible-vs-committed terms mismatch; no cross-asset reserve ambiguity; no unrestricted public payment route. Sprint A implementation complete; P0.4 browser E2E remains pending (see `docs/EVIDENCE.md`).

### Sprint B — Wallet and complete UX

- [ ] Add wallet disconnect/account refresh and active-network revalidation.
- [ ] Make the workspace preserve state during transient RPC failures and support retry.
- [ ] Make action visibility and afterglow state accurate for each role.
- [ ] Complete two-wallet browser E2E on the public Netlify deployment.
- [ ] Capture screenshots and transaction evidence for create, accept, completion by both parties, settle, afterglow by both parties, decline, cancel, expiry and refund.

**Exit criteria:** a new user can complete the supported protocol without CLI intervention or developer-only steps.

### Sprint C — Contract hardening and parity

- [ ] Review and test Soroban storage TTL for active escrow and historical records.
- [ ] Add adversarial tests for multi-asset behavior (or prove rejection of any asset other than the configured one).
- [ ] Add ledger-advance/TTL tests.
- [ ] Regenerate bindings from the final WASM and verify the generated source is in sync.
- [ ] Align Node/Rust/Stellar CLI versions and enforce CI/deploy parity.
- [ ] Run all checks from a clean clone.

**Exit criteria:** contract accounting and storage invariants are tested; generated client matches the deployed candidate WASM; CI is green.

### Sprint D — Release documentation and operations

- [ ] Update all status and API documentation.
- [ ] Replace “demo dApp” product language with “Testnet app” while preserving historical demo instructions.
- [ ] Publish Testnet status, contract, asset, RPC and explorer references in the UI.
- [ ] Add runbook and monitoring.
- [ ] Assemble a versioned evidence pack tied to the exact source commit and deployed contract WASM hash.
- [ ] Tag a Testnet Release Candidate only after all P0 gates pass.

**Exit criteria:** the release can be reproduced and independently checked from source, build, deployed app, contract and transaction evidence.

### Mainnet gate — Separate project decision

- [ ] Independent Soroban/security review and remediation.
- [ ] Final asset policy and accounting model.
- [ ] Contract storage/TTL and upgrade/admin strategy documented.
- [ ] Operational monitoring, incident response and deploy access controls.
- [ ] Legal/product/privacy review, including consent and jurisdictional considerations.
- [ ] License decision.
- [ ] Mainnet deployment from a reviewed immutable release with new contract ID and separate environment.
- [ ] Mainnet E2E with low-value test transactions and a rollback/incident plan.

**No Mainnet deployment should be inferred from passing Testnet tests.**

## 7. Required test matrix

| Layer | Scenario | Expected result |
|---|---|---|
| Terms | edit any field after preview | previous hash invalidated; new hash submitted |
| Terms | participant pastes altered terms | verification fails; accept remains disabled |
| Wallet | wrong network | write blocked with actionable message |
| Wallet | account changes after connect | stale session cleared/reconciled; no action signed as old account |
| Wallet | user rejects signature | clear rejected state; no false success |
| Encounter | invalid / huge / negative ID | client validation; no uncaught BigInt exception |
| Encounter | unknown ID | explicit not-found state |
| RPC | unavailable during read | last known state preserved; retry available |
| State | creator creates | Created, correct parties/asset/stake/hash |
| State | participant accepts | Accepted; only invited participant can accept |
| State | both complete | Completed only after both authenticated calls |
| State | settle | one transfer; terminal state; repeat rejected |
| State | decline/cancel | Cancelled and creator refunded |
| State | expiry | permissionless finalization; creator refunded |
| Afterglow | each party submits once | bounded 0–100; duplicate rejected and hidden in UI |
| Escrow | zero stake | no token transfer; lifecycle still works |
| Escrow | one supported asset | contract balance >= reserved stake at every transition |
| Escrow | unsupported second asset | rejected, unless per-asset accounting is implemented |
| Withdraw | surplus above reserves | only surplus transferred |
| Withdraw | no surplus / repeat | rejected; reserved escrow unchanged |
| TTL | ledger advances with active escrow | state and reserve remain available |
| API | malformed destination/body | rejected before Friendbot call |
| API | repeated public calls | rate-limited/abuse-protected |
| Deploy | production homepage | HTTP 200 |
| Deploy | encounter route | app shell and expected state/error response |
| Deploy | build runtime | Netlify functions/runtime present; no missing route handler |
| CI | clean checkout | Rust tests, WASM, npm tests, typecheck, build, docs integrity pass |

## 8. Evidence pack format

For every release candidate, record:

- source commit SHA and branch;
- Rust toolchain, Stellar CLI, Node and npm versions;
- WASM SHA-256 and contract ID;
- network passphrase and RPC endpoint;
- asset contract ID and asset policy;
- Netlify deploy ID, deploy URL, published URL and build settings;
- two wallet public addresses (never seeds/private keys);
- encounter ID and each transaction hash;
- transaction result, ledger, event names and post-transaction state read;
- screenshots or screen recording of the real browser flow;
- test command output and CI run URL;
- known limitations and unresolved findings.

Do not publish private terms, screenshots containing sensitive content, secret keys, seed phrases, or unnecessary personal data in the evidence pack.

## 9. Definition of done

ECSTASY is ready to be called a **Testnet Release Candidate** only when:

- [ ] P0.1–P0.4 are closed and evidenced.
- [ ] P1.1–P1.7 are closed or have an explicitly accepted, documented risk.
- [ ] The contract's escrow/reserve invariant is proven for every supported asset.
- [ ] The full UI journey works with two independent Freighter wallets on the public deployment.
- [ ] No demo fixtures, mock chain state, or fake success fallbacks exist in production paths.
- [ ] The production deploy corresponds to the reviewed source commit and contract WASM.
- [ ] Documentation and evidence match the exact release.
- [ ] Mainnet remains disabled until the separate Mainnet gate is approved.

**Current assessment:** strong Testnet implementation with meaningful on-chain evidence; not yet a verified end-to-end browser release candidate. The highest-priority code issues are stale terms commitment, asset/reserve invariant enforcement, and abuse protection for the public challenge-payment endpoint. The highest-priority validation gap is two-wallet browser E2E.
