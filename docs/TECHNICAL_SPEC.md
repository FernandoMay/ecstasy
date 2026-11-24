# ECSTASY — Technical Specification

## 1. Product invariant

ECSTASY is a bilateral state machine. No settlement occurs unless the contract's required authorization and state conditions are satisfied.

## 2. Encounter lifecycle

```text
CREATED
  └─ invite → INVITED
                  ├─ decline → CANCELLED
                  └─ accept → ACCEPTED
                                 └─ start/activate → ACTIVE
                                      ├─ cancel → CANCELLED
                                      ├─ expire → EXPIRED
                                      └─ complete → COMPLETED
                                                     └─ settle → SETTLED
```

A later implementation may add `DISPUTED`, but the MVP should not ship an under-specified dispute system.

## 3. State

Minimum contract state:

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
  settlement_tx_marker: optional BytesN<32>,
}
```

Do not store free-form private text on-chain.

## 4. Contract methods

MVP API:

- `create_encounter(creator, participant, asset, stake, terms_hash, expires_at)`
- `accept_encounter(participant, encounter_id)`
- `decline_encounter(participant, encounter_id)`
- `complete_encounter(caller, encounter_id)`
- `settle_encounter(caller, encounter_id)`
- `cancel_encounter(caller, encounter_id)` where the state permits it
- `submit_afterglow(caller, encounter_id, score)`
- `get_encounter(encounter_id)`

The exact API can change during implementation; update this document in the same commit as any contract-interface change.

## 5. Authorization

Every state-changing method must authenticate the actor with Soroban `Address::require_auth()` semantics. Never trust a wallet address supplied by the client without contract-side authorization.

## 6. Escrow model

For MVP, the contract should support one fungible Stellar asset selected by configuration. Do not invent an asset issuer or pretend that a token exists.

Escrow rules:

1. creator funds the contract before or during creation;
2. participant accepts;
3. completion requirements are satisfied;
4. settlement transfers according to the explicit contract rule;
5. every transfer emits an event suitable for demo evidence.

A no-stake encounter must be possible.

## 7. Terms hash

The web client canonicalizes the private terms document, hashes it with SHA-256, and stores only the 32-byte digest on-chain.

Canonicalization requirements:

- UTF-8;
- deterministic field ordering;
- normalized line endings;
- explicit schema version;
- no wallet secrets;
- no raw personal data unless the user deliberately chooses to expose it.

The demo should show that changing one term changes the hash.

## 8. Afterglow

After settlement, each participant may submit one bounded score. The score is reputation metadata, not a claim that the underlying encounter was objectively good, safe, legal, or truthful.

MVP: integer score `0..100`, one submission per participant per encounter.

## 9. Frontend boundaries

```text
UI
 ↓
encounter service
 ↓
wallet adapter
 ↓
Stellar transaction builder
 ↓
Soroban contract
```

Keep wallet-specific code behind an adapter so Freighter or another supported Stellar wallet can be changed without rewriting domain logic.

## 10. Evidence requirements

Every demo-critical flow must produce:

- source commit;
- contract ID;
- transaction hash;
- relevant event/state read;
- screenshot or recorded UI state;
- reproduction steps.

Do not claim E2E success from mocked responses.
