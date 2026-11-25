# Contract API

The ABI is generated from the contract spec; `packages/stellar/src/generated/ecstasy.ts` is the typed TypeScript client. All mutating methods require `require_auth()` from the named actor.

| Method | Actor | Effect | Errors |
|---|---|---|---|
| `create_encounter(creator, participant, asset, stake, terms_hash, expires_at) -> u64` | creator | Creates invitation and optional escrow | `SelfEncounter`, `InvalidStake`, `InvalidExpiry` |
| `accept_encounter(participant, id)` | participant | Explicit consent | `NotFound`, `NotParty`, `Expired`, `InvalidState` |
| `decline_encounter(participant, id)` | participant | Cancels and refunds creator | `NotFound`, `NotParty`, `Expired`, `InvalidState` |
| `complete_encounter(caller, id)` | either party | Records one completion flag | `NotFound`, `NotParty`, `Expired`, `InvalidState`, `AlreadyCompleted` |
| `settle_encounter(caller, id)` | either party | Releases escrow; terminal | `NotFound`, `NotParty`, `Expired`, `InvalidState` |
| `cancel_encounter(caller, id)` | either party | Refunds creator; terminal | `NotFound`, `NotParty`, `Expired`, `InvalidState` |
| `expire_encounter(id)` | permissionless | Commits expiry and refund | `NotFound`, `InvalidState` |
| `submit_afterglow(caller, id, score)` | either party | One bounded score after settlement | `NotFound`, `NotParty`, `InvalidState`, `InvalidScore`, `AlreadySubmitted` |
| `get_encounter(id) -> Encounter` | public | State with derived expiry | `NotFound` |
| `get_afterglow(id, participant) -> Option<u32>` | public | Submitted score | — |

## Error codes

| Code | Name |
|---|---|
| 1 | `NotFound` |
| 2 | `NotParty` |
| 3 | `SelfEncounter` |
| 4 | `InvalidStake` |
| 5 | `InvalidExpiry` |
| 6 | `InvalidState` |
| 7 | `InvalidScore` |
| 8 | `AlreadyCompleted` |
| 9 | `AlreadySubmitted` |
| 10 | `Expired` |

## Events

`EncounterEvent` — topics `("ecstasy", id, name)`, data `{ status, stake, actor }`. Names: `encounter_created`, `encounter_accepted`, `encounter_declined`, `encounter_completion`, `encounter_completed`, `encounter_settled`, `encounter_cancelled`, `encounter_expired`, `afterglow_submitted`. No private terms appear in events or state.
