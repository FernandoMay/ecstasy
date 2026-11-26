# Funciones nuevas para revisión

Registro dedicado — **se actualiza cada vez que se añade una funcionalidad nueva**. Para cada entrada se anota el **nombre de la función** y el **enlace a la transacción en Testnet que la usa**. Este documento existe para envío a revisión; no sustituye a `docs/EVIDENCE.md`, que contiene el resto de hashes y repro steps.

| Nombre de la función | Tipo | Enlace a la transacción que la usa |
|---|---|---|
| `retirar(caller, encounter_id)` | Contrato Soroban (nueva función pública) | https://stellar.expert/explorer/testnet/tx/2333ac89b2e536506d174a0fff690aadc636432ebeb9fd3a4a435be665559bfe |
| `POST /api/challenge-payment` (pago Testnet con memo `SHIP-S97KF8`) | Endpoint de la app | https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8 |
| `GET /api/status` (health de despliegue y RPC) | Endpoint de solo lectura | N/A — no crea transacciones; ver `GET /api/status` en producción |

## Detalle de `retirar`

- Contrato `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` (wasm `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e`).
- Retira solo el excedente sobre `ReservedStake`; transfiere XLM real, emite `funds_withdrawn` y no puede vaciar el escrow reservado. Un segundo retiro sin excedente falla con `InvalidState` (#6).
- Operación observada: transferencia de `20000000` stroops desde el contrato al creador + evento `funds_withdrawn`.
- Tests: `contracts/ecstasy/tests/contract_test.rs`.

## Detalle de `POST /api/challenge-payment`

- Pago clásico de 0.0001 XLM con memo `SHIP-S97KF8`, construido y enviado por la propia app.
- Cuenta origen efímera financiada por Friendbot; sin claves privadas almacenadas ni devueltas.
- Destino fijo y validado server-side; Testnet-only; rate limit por cliente con fallback local y store compartido vía Netlify Blobs cuando está disponible.
- Tests: `apps/web/test/payment-policy.test.ts`.
- **Production status:** the transaction linked above was successful. Recent production calls return HTTP 502/504 because Friendbot latency (measured 7.6 s in the route, plus ~2.8 s for submit) exceeds the Netlify function timeout. The endpoint now derives the account sequence as `(friendbot_tx.ledger << 32)` — the builder adds 1 — removing the `/accounts` polling step. Verified locally after the fix with successful payments `643c1bc9e7b77682bfcc25cc8146ae4028ae6d02de6b06876c8486e7356b054e`, `bca2db49674a7bb9cb5b3ad1324f6e4c93209809c9c4e5e58bcd739324b7fb41` and `ef8daa35503a7614e43d1593bfb7b37bef2f4fb7b873e6c4b4961c65103dcdee` (all memo `SHIP-S97KF8`). Earlier `tx_bad_seq` rejections came from an off-by-one in that derivation and are resolved. Production remains flaky until the function timeout is raised or the payment is made asynchronous; no Stellar secret keys are stored in Netlify.

## Regla para futuras funciones

Al añadir cualquier función pública nueva (contrato, endpoint o servicio), agregar aquí una fila con:

1. **Nombre de la función** (firma completa si aplica).
2. **Enlace a la transacción que la usa** en `https://stellar.expert/explorer/testnet/tx/...`.
3. Una nota breve con el efecto observado y el archivo de tests.
4. Si es de solo lectura, indicar `N/A — no crea transacciones`.
