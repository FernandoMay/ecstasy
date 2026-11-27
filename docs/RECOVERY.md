# Timeout Recovery Protocol

Contrato independiente `contracts/recovery`, desplegado en Testnet. Custodia XLM nativo (SAC) con una fecha límite on-chain para resolver el caso en que la contraparte nunca responde.

## Ciclo

```text
Pending ──(approve antes de expires_at, mismo intent_hash)──> Approved ──(execute antes de expires_at)──> Executed
   └──(cualquier cuenta, ahora > expires_at)──> Recovered  (XLM devueltos al proponente)
```

- `propose(caller, counterparty, recipient, amount, intent_hash, expires_at)`: depósito real y deadline fijado; expiración en el pasado se rechaza.
- `approve`: solo la contraparte, mismo digest, antes del vencimiento.
- `execute`: cualquiera de las dos partes, solo `Approved` y antes del vencimiento.
- `recover`: **permisionless**, solo después del vencimiento y en estados no terminales; transfiere XLM real al proponente, nunca a quien ejecuta.
- Errores: `NotFound` #1, `NotAuthorized` #2, `InvalidState` #3, `IntentMismatch` #4, `InvalidAmount` #5, `InvalidExpiry` #6, `StillPending` #7, `InsufficientFunds` #8.

## Límites

- No sustituye al contrato de encuentros ni mueve su escrow.
- No juzga por qué la contraparte no respondió: solo aplica el plazo acordado.
- El activo queda fijado en el constructor (SAC nativo XLM en el despliegue actual).

## Evidencia

Cinco transacciones reales (proponer/aprobar/ejecutar y proponer/recuperar) están en el Evidence Center y en `docs/TESTNET_TRANSACTIONS.md`. El intento de aprobación tardía fue rechazado en simulación con `Error(Contract, #3)` y **no** tiene hash: no se inventan transacciones para casos negativos.
