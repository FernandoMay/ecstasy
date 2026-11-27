# Disputas — registro neutral on-chain

El contrato `contracts/disputes` es un registro de disputas para encuentros de ECSTASY. **No mueve escrow y no decide hechos del mundo real**: publica quién abrió una disputa, las respuestas de las partes y el desenlace que el resolver decide publicar, con eventos verificables.

## Modelo

```text
OPEN ──(respuesta de cada parte)──> OPEN ──(resolver publica outcome)──> RESOLVED
```

- `__constructor(resolver)`: fija la única identidad que puede resolver.
- `open(caller, encounter_id, counterparty, reason_hash) -> id`: cualquiera de las partes puede abrir; se guarda el digest del motivo, no el motivo en claro.
- `respond(caller, dispute_id, response_hash)`: una respuesta por parte, con digest.
- `resolve(caller, dispute_id, outcome_hash)`: solo el resolver; transición terminal.
- `get(dispute_id)`: lectura pública.

Errores: `NotFound` (#1), `NotAuthorized` (#2), `InvalidState` (#3), `AlreadyResponded` (#4).

## Límites explícitos

- No hay árbitro automático ni lógica de reparto de fondos.
- El resolver puede publicar un desenlace, pero eso no prueba que el encuentro haya sido justo, seguro o legal.
- Los motivos y respuestas se almacenan como digests SHA-256; el contenido privado permanece off-chain.
- El encuentro original y su escrow siguen gobernados por `contracts/ecstasy`.

## Evidencia

Cada transición real en Testnet se documenta en `docs/TESTNET_TRANSACTIONS.md` y se enlaza desde el Evidence Center. Las operaciones rechazadas se documentan como simulación o test, nunca con un hash inventado.
