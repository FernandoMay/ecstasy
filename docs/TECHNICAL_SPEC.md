# ECSTASY — Technical Specification

## 1. Product invariant

ECSTASY is a bilateral state machine. No settlement occurs unless the contract's required authorization and state conditions are satisfied. The contract records a public state transition, never the truth of a private off-chain event.

## 2. Encounter lifecycle

```text
CREATED (invitation pending)
   ├─ accept  → ACCEPTED
   │               ├─ complete by both parties → COMPLETED → settle → SETTLED
   │               ├─ cancel by either party   → CANCELLED
   │               └─ expiry before completion  → EXPIRED (via expire_encounter)
   ├─ decline → CANCELLED
   ├─ cancel (creator) → CANCELLED
   └─ expiry → EXPIRED (via expire_encounter)
```

`ReservedStake` tracks all locked stakes so `retirar` cannot withdraw escrow.

`SETTLED`, `CANCELLED` and `EXPIRED` are terminal. The MVP has no separate `INVITED` or `ACTIVE` state: `create_encounter` emits the invitation and `accept_encounter` records consent directly. A later implementation may add `DISPUTED`, but the MVP should not ship an under-specified dispute system.

## 3. State

On-chain state (no private terms, chat, photos or PII):

```text
Encounter {
  id: u64,
  creator: Address,
  participant: Address,
  asset: Address,
  stake: i128,
  terms_hash: BytesN<32>,
  created_at: u64,
  expires_at: u64,
  status: EncounterStatus,
  creator_completed: bool,
  participant_completed: bool,
  settlement_marker: Option<BytesN<32>>,
}
```

`settlement_marker` is a deterministic on-chain digest derived from `(encounter id, settlement ledger timestamp)`. It is **not** the Stellar transaction hash; obtain that from the RPC receipt/explorer. All state lives in instance storage with a monotonic `Counter` and per-participant afterglow entries keyed by `(id, address)`.

## 4. Contract methods

| Method | Actor | Effect |
|---|---|---|
| `create_encounter(creator, participant, asset, stake, terms_hash, expires_at)` | creator | Creates invitation; pulls stake into escrow; returns id |
| `accept_encounter(participant, encounter_id)` | participant | Records explicit consent |
| `decline_encounter(participant, encounter_id)` | participant | Cancels invitation and refunds creator |
| `complete_encounter(caller, encounter_id)` | either party | Records one completion flag; both → `COMPLETED` |
| `settle_encounter(caller, encounter_id)` | either party | Terminal; releases escrow to participant |
| `cancel_encounter(caller, encounter_id)` | either party | Cancels an open encounter and refunds creator |
| `expire_encounter(encounter_id)` | permissionless | Commits expiry and refunds creator |
| `retirar(caller, encounter_id) -> i128` | creator of that encounter | Withdraws contract surplus above `ReservedStake`; real token transfer + event |
| `submit_afterglow(caller, encounter_id, score)` | either party | One bounded score per party, only after settlement |
| `get_encounter(encounter_id)` | public | Reads state with derived expiry |
| `get_afterglow(encounter_id, participant)` | public | Reads one submitted score |

Every mutating method returns `Result<(), EcstasyError>`; `create_encounter` returns `Result<u64, EcstasyError>`. Error codes (part of the ABI): `1 NotFound`, `2 NotParty`, `3 SelfEncounter`, `4 InvalidStake`, `5 InvalidExpiry`, `6 InvalidState`, `7 InvalidScore`, `8 AlreadyCompleted`, `9 AlreadySubmitted`, `10 Expired`.

## 5. Authorization

Every state-changing method authenticates its actor with `Address::require_auth()`. A party check (`NotParty`) runs in the contract even when a signature exists. The contract never trusts a client-supplied address as proof of identity.

Expiry refunds are committed by a **successful** permissionless transaction. A method that returns an error rolls back all state changes, so refunds cannot be performed in a call that also reports `Expired`.

## 6. Escrow model

One fungible Stellar Asset Contract per deployment, configured by `assetContractId`. No issuer is invented: the demo uses the native XLM SAC (`CDLZFC3S…YSC`). A no-stake encounter is always possible (`stake = 0`), and no token call is made in that case.

Escrow rules:

1. creator authorizes the pull into the contract during creation;
2. participant accepts;
3. both parties record completion;
4. settlement transfers the whole stake to the participant (an explicit conditional gift/commitment rule);
5. decline, cancel or expiry refunds the creator;
6. every transfer emits a standard SAC `transfer` event plus an ECSTASY `EncounterEvent`.

## 7. Terms hash

The web client canonicalizes the private terms document (UTF-8, NFC, CRLF→LF, trailing whitespace removed, sorted keys, explicit `ecstasy.terms/v1` schema) and stores only the SHA-256 digest on-chain. The demo shows that changing one term changes the hash, and lets the participant paste the private document to verify it matches the commitment before consenting.

## 8. Afterglow

After settlement, each participant may submit one integer score `0..100`. Scores are reputation metadata, not a claim that the encounter was good, safe, legal or truthful.

## 9. Frontend boundaries

```text
UI
  ↓
EncounterService (@ecstasy/stellar)
  ↓
WalletAdapter (Freighter)
  ↓
Stellar contract client / RPC
  ↓
Soroban contract
```

Wallet-specific code stays behind `WalletAdapter`. The generated typed client embeds the contract spec, so no binding code is hand-written and no chain responses are mocked.

## 10. Events

Every transition emits `EncounterEvent` with topics `("ecstasy", id, name)` and data `{ status, stake, actor }`. No private payloads are included.

## 11. Evidence requirements

Every demo-critical flow must produce a source commit, contract ID, transaction hash, event/state read, screenshot or recorded UI state, and reproduction steps. See `docs/EVIDENCE.md`. Do not claim E2E success from mocked responses.
