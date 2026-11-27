# Common Lifecycle Reference Chain

Contrato independiente `contracts/traceability`. Esquema común de referencias y eventos entre contratos para reconstruir el ciclo de vida de un acuerdo sin que cada pantalla rehaga las relaciones por separado.

```
agreement_id → escrow_id → case_id → arbitration_id → settlement_tx
```

## Registro

- `link` vincula los cinco identificadores y el hash de 32 bytes de la transacción de liquidación real en Testnet.
- Solo la autoridad o un escritor autorizado puede escribir (`NotAuthorized` #2).
- Un `agreement_id` solo puede vincularse una vez (`Duplicate` #3); los ceros se rechazan (`InvalidReference` #4).
- Cada enlace emite `TraceEvent` con `agreement_id` como topic, de modo que el índice de eventos sea consultable.
- `get_chain(agreement_id)` devuelve el registro completo.

El mismo esquema vive en el cliente compartido (`packages/stellar/src/lifecycle.ts`): `LIFECYCLE_STEPS`, `toLifecycleRef` y `settlementTxUrl`. `/reputation` consume ese único registro.

## Evidencia real

Contrato `CA4CVK4XCLOTRKJ7XTU556WKN7T4DTI7HHRWVSQ4U35Q6KUKQULLFOTC`, wasm `043c3ae299c63a816c2e830cf534088482f3a4e098c4a69967c4ca1b08040099`. Enlace confirmado en Horizon: https://stellar.expert/explorer/testnet/tx/f6401f41e3d5300f467876b13077ac4c833ee43eccd1522f6c993c2feae5dbef — cadena `7 → 1 → 1 → 1` con `settlement_tx` `c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460`, la transacción real de liquidación del panel. Tres tests Rust y tres tests compartidos cubren el esquema.

## Límites

- La cadena es un índice de referencias, no una prueba de que los contratos de origen se ejecutaran correctamente; cada `settlement_tx` se verifica por separado en Stellar Expert.
- El writer y la autoridad son cuentas designadas, no una selección descentralizada.
