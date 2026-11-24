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
2. Never put private terms, chat, photos, sexual content, or unnecessary PII on-chain.
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

- [ ] auth checks on every mutating function
- [ ] state transition guards
- [ ] expiry checks
- [ ] amount validation
- [ ] asset validation
- [ ] no integer overflow/underflow assumptions
- [ ] no unbounded storage growth in MVP paths
- [ ] events do not contain sensitive payloads
- [ ] tests for unauthorized callers
- [ ] tests for replay/double execution
- [ ] tests for expiry
- [ ] tests for malformed hashes
- [ ] tests for zero/negative/maximum stake
