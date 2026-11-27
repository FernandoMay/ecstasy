# Mutual Refund Protocol

Contrato independiente `contracts/refunds`, desplegado en Testnet. Custodia XLM nativo mediante su SAC y solo lo libera con autorizaciones complementarias.

## Ciclo

```text
Pending ──(counterparty approve, mismo intent_hash)──> Approved ──(execute)──> Refunded
   ├──(counterparty reject)──> Rejected  (fondos al proponente)
   └──(proposer revoke)─────> Revoked    (fondos al proponente)
```

- `propose(caller, counterparty, recipient, amount, intent_hash)`: el proponente firma y **transfiere realmente** el XLM al contrato.
- `approve(caller, refund_id, intent_hash)`: solo la contraparte, y el digest debe coincidir exactamente con el propuesto. Así ambas firmas autorizan la misma intención.
- `execute(caller, refund_id)`: cualquiera de las dos partes, solo en `Approved`, transfiere XLM real al destinatario. Terminal.
- `reject` / `revoke`: devuelven los fondos al proponente y cierran la solicitud.
- `get(refund_id)`: lectura pública.

Errores: `NotFound` #1, `NotAuthorized` #2, `InvalidState` #3, `IntentMismatch` #4, `InvalidAmount` #5, `InsufficientFunds` #6. Eventos: `requested`, `approved`, `rejected`, `revoked`, `refunded`.

## Límites

- No mueve el escrow del contrato de encuentros; es un acuerdo complementario y financiado explícitamente.
- No juzga si la cancelación es justa: solo prueba que ambas partes autorizaron el mismo intent.
- El activo queda fijado en el constructor (SAC nativo XLM en el despliegue actual).

## Evidencia

Siete transacciones reales del ciclo (proponer/aprobar/ejecutar, rechazar, revocar) están enlazadas en `docs/TESTNET_TRANSACTIONS.md` y en el Evidence Center. Las operaciones rechazadas se documentan como tests o simulaciones, nunca con hashes inventados.
