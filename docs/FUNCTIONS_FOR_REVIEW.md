# Funciones nuevas para revisión

Registro dedicado — **se actualiza cada vez que se añade una funcionalidad nueva**. Para cada entrada se anota el **nombre de la función** y el **enlace a la transacción en Testnet que la usa**. Este documento existe para envío a revisión; no sustituye a `docs/EVIDENCE.md`, que contiene el resto de hashes y repro steps.

| Nombre de la función | Tipo | Enlace a la transacción que la usa |
|---|---|---|
| `retirar(caller, encounter_id)` | Contrato Soroban (nueva función pública) | https://stellar.expert/explorer/testnet/tx/14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e |
| `POST /api/challenge-payment` (pago Testnet con memo `SHIP-S97KF8`) | Endpoint de la app | https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8 |

## Detalle de `retirar`

- Contrato `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` (wasm `42dafbf5864ea4d008783ed5c40a3e6f70d78d2ee4a85300304f854796adddb6`).
- Retira solo el excedente sobre `ReservedStake`; transfiere XLM real, emite `funds_withdrawn` y no puede vaciar el escrow reservado. Un segundo retiro sin excedente falla con `InvalidState` (#6).
- Operación observada: transferencia de `20000000` stroops desde el contrato al creador + evento `funds_withdrawn`.
- Tests: `contracts/ecstasy/tests/contract_test.rs`.

## Detalle de `POST /api/challenge-payment`

- Pago clásico de 0.0001 XLM con memo `SHIP-S97KF8`, construido y enviado por la propia app.
- Cuenta origen efímera financiada por Friendbot; sin claves privadas almacenadas ni devueltas.
- Destino fijo y validado server-side; Testnet-only; rate limit por cliente con fallback local y store compartido vía Netlify Blobs cuando está disponible.
- Tests: `apps/web/test/payment-policy.test.ts`.
- **Production status:** the historical transaction above was successful. Recent production calls returned HTTP 502 because Friendbot latency (up to ~8 s in measurements) plus submission can exceed the Netlify function timeout. The code now derives the account sequence from the Friendbot transaction ledger to remove the account polling step; the endpoint remains Testnet-only and rate-limited. Enabling a longer function timeout or a pre-funded account pool would require a separate decision — no Stellar secret keys are stored in Netlify.

## Regla para futuras funciones

Al añadir cualquier función pública nueva (contrato, endpoint o servicio), agregar aquí una fila con:

1. **Nombre de la función** (firma completa si aplica).
2. **Enlace a la transacción que la usa** en `https://stellar.expert/explorer/testnet/tx/...`.
3. Una nota breve con el efecto observado y el archivo de tests.
