# ECSTASY — Security & Privacy Model

## Threat model

Assume:

- the frontend is observable;
- blockchain data is public;
- RPC responses can be stale or malicious;
- a wallet can reject or alter a transaction before signing;
- users may misunderstand what a hash proves;
- private terms can become identifying even when encrypted off-chain.

## Non-negotiables

1. Never request or store seed phrases/private keys.
2. Never put private terms, chat, photos, or unnecessary PII on-chain.
3. Never describe a hash as privacy if the preimage is public elsewhere.
4. Never call an encounter `verified` merely because a transaction exists.
5. All contract authorization must be enforced on-chain.
6. All token/asset identifiers must be explicit and configurable.
7. Prevent replay/double settlement through contract state checks.
8. Enforce expiry on-chain; do not rely only on frontend timers.
9. Emit deterministic events for state transitions.
10. Keep a clear separation between protocol proof and real-world truth.

## Abuse cases

### Fake invitation
Mitigation: invitation references an exact participant address and expiry.

### Unauthorized completion
Mitigation: contract authorization and state checks.

### Double settlement
Mitigation: terminal `SETTLED` state plus idempotent rejection of repeated settlement.

### Terms substitution
Mitigation: canonical terms + SHA-256 hash recorded before acceptance; UI displays matching hash/evidence.

### Client tampering
Mitigation: contract is the source of truth for financial state.

### Sensitive metadata leakage
Mitigation: no private content on-chain; avoid putting raw IPFS/public URLs in events.

## Audit checklist

- [x] auth checks on every mutating function
- [x] state transition guards
- [x] expiry checks (`expire_encounter` commits the refund in a successful tx)
- [x] amount validation (`stake >= 0`, `expires_at > now`)
- [x] asset validation (explicit configured SAC ID; no issuer invented)
- [x] no integer overflow/underflow assumptions (`overflow-checks = true`, checked id counter)
- [x] no unbounded storage growth in MVP paths (one entry per encounter/score)
- [x] events do not contain sensitive payloads (typed `[status, stake, actor]` only)
- [x] tests for unauthorized callers
- [x] tests for replay/double execution
- [x] tests for expiry
- [x] tests for malformed hashes (32-byte commitment enforced in client and contract ABI)
- [x] tests for zero/negative stake

### Storage TTL

All contract state lives in instance storage. Every successful mutating call extends the instance TTL (`TTL_THRESHOLD = 5_000_000`, `TTL_EXTEND = 6_000_000` ledgers, below the 6_312_000 protocol maximum), so an encounter with live escrow cannot silently expire while funds are held. A test advances 200,000 ledgers and verifies the encounter, reserve accounting, surplus withdrawal and expiry refund still work.

### Deployment-specific note

`payout_from_contract` deliberately does **not** call `require_auth()` on the contract's own address. Doing so produces an auth entry that external wallets cannot sign; Soroban already treats the contract as the authorized direct invoker of the Stellar Asset Contract. This was verified on Testnet: settlement with the explicit self-auth failed, and succeeded after its removal.
