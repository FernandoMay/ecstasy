# Browser E2E checklist — generated

Generated from `apps/web/e2e/scenarios.mjs`: 6 scenarios, 22 steps.
Not executed: requires Freighter with two funded Testnet wallets.

- Wallet A: creator
- Wallet B: participant

## Create → accept → complete ×2 → settle → afterglow ×2 (`happy-path`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| hp-1 | A | Connect Freighter | `button:has-text('Connect wallet')` | Wallet address shown | screenshot + account | [ ] |
| hp-2 | A | Fill participant and private terms, preview hash | `button:has-text('Preview terms hash')` | SHA-256 badge visible | screenshot + hash | [ ] |
| hp-3 | A | Create encounter | `button:has-text('Create encounter')` | Receipt with tx hash and invitation link | tx hash A1 | [ ] |
| hp-4 | B | Open invitation, paste terms, verify hash | `button:has-text('Verify terms hash')` | Terms match the commitment | screenshot | [ ] |
| hp-5 | B | Consent | `button:has-text('Consent / Accept')` | Status ACCEPTED for both viewers | tx hash B1 | [ ] |
| hp-6 | A | Record completion | `button:has-text('Record completion')` | creator_completed true | tx hash A2 | [ ] |
| hp-7 | B | Record completion | `button:has-text('Record completion')` | Status COMPLETED for both | tx hash B2 | [ ] |
| hp-8 | A | Settle | `button:has-text('Settle encounter')` | Status SETTLED + explorer receipt | tx hash A3 | [ ] |
| hp-9 | A | Submit afterglow | `button:has-text('Submit afterglow')` | Score A visible, submit disabled for A | tx hash A4 | [ ] |
| hp-10 | B | Submit afterglow | `button:has-text('Submit afterglow')` | Both scores visible | tx hash B3 | [ ] |

## Decline refunds creator and is terminal (`decline`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| dc-1 | A | Create with stake | `button:has-text('Create encounter')` | Status CREATED | tx hash | [ ] |
| dc-2 | B | Decline | `button:has-text('Decline')` | Status CANCELLED, escrow refunded | tx hash | [ ] |
| dc-3 | A | Try accept again | `button:has-text('Consent / Accept')` | Action hidden/rejected | screenshot | [ ] |

## Cancel from Accepted refunds creator (`cancel`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| cn-1 | A | Create, B accepts | `button:has-text('Consent / Accept')` | Status ACCEPTED | tx hashes | [ ] |
| cn-2 | B | Cancel | `button:has-text('Cancel')` | Status CANCELLED, creator refunded | tx hash | [ ] |

## Permissionless expiry and refund (`expiry`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| ex-1 | any | Advance Testnet time past expiry | `n/a (network time)` | Status EXPIRED for any viewer | screenshot | [ ] |
| ex-2 | any | Finalize expiry | `button:has-text('Finalize expiry & refund')` | Creator refunded; repeat rejected (#6) | tx hash | [ ] |

## Account switch, network switch and rejected signature (`wallet-session`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| ws-1 | A | Switch Freighter account while page open | `Freighter extension` | App updates identity; writes blocked | screenshot | [ ] |
| ws-2 | A | Switch Freighter network to Mainnet | `Freighter extension` | Visible warning, no signing possible | screenshot | [ ] |
| ws-3 | A | Reject a signature in Freighter | `Freighter extension` | Distinct wallet rejection message, state unchanged | screenshot | [ ] |

## Participant cannot consent to substituted terms (`terms-tampering`)

| Step | Actor | Action | Selector | Expected | Evidence | Done |
|---|---|---|---|---|---|---|
| tt-1 | B | Paste altered terms JSON | `textarea[aria-label='Private terms document']` | Hash mismatch warning | screenshot | [ ] |
| tt-2 | B | Try to accept | `button:has-text('Consent / Accept')` | Accept disabled | screenshot | [ ] |

After execution, paste transaction hashes and screenshots into `docs/EVIDENCE.md` and mark RC-1 accordingly.
