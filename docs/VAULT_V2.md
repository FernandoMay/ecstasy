# Vault V2 — contabilidad por atribución

Contrato nuevo `contracts/vault-v2`, desplegado en `CDEV3GITSAFJZIY54QJ4UMXXSMHMJIHU7CZIGG34TIQCUXYL2KNJO57B` (wasm `9242aedf752fd1d3cd103de2d8dfc99cc113fcafd16bc62b5607fa9f91c311dd`). V1 (`CAWOC5VH…`) y sus 5.555 XLM **intactos**. Política previa: `docs/VAULT_V2_POLICY.md`.

## Modelo

```text
create_vault → fund (XLM + atribución en la misma tx) → withdraw (solo atribución propia)
                    └─ transferencia directa ──> surplus ──> sweep_surplus (destino fijado)
```

- `attributed[vault]` es la única cantidad que el contrato reconoce como perteneciente a un vault.
- `withdraw` exige `caller == owner` y `amount <= attributed`; nunca consulta el saldo total.
- `sweep_surplus` es permissionless y transfiere exactamente `balance − Σ attributed` a la dirección fijada en el constructor.
- `close` solo con atribución cero; `Paid`/`Closed` no permiten seguir operando.

## Invariantes verificadas

- `Σ attributed <= balance` en todo momento.
- Un tercero que crea un vault sin fondear y envía XLM directamente **no puede retirar**: #5.
- El owner de A no puede retirar del vault B: #2.
- Tras `sweep_surplus`, `balance == Σ attributed`.
- Todo XLM atribuible tiene ruta de retiro; todo surplus tiene destino declarado.

## Pruebas

8 tests Rust: ataque SEC-04 rechazado, fondeo/retiro exacto, aislamiento multi-vault, retiro doble y excesivo rechazado, cierre con saldo rechazado, sweep al destino fijado, reconciliación completa y vault inexistente. Clippy y build limpios.

## Evidencia Testnet

Dos vaults (A: 2 XLM, B: 1 XLM vía `fund`), una transferencia directa de 2 XLM, dos intentos de apropiación rechazados en simulación (#5 y #2, sin hash), sweep de 2 XLM al destino `vault-v2-surplus`, y retiros legítimos de 2 y 1 XLM. Estado final: atribución total 0, surplus 0, saldo del contrato 0.

Transacciones: crear A `5130769f…`, crear B `6db6a895…`, fondear A `895b4887…`, fondear B `86dea8c4…`, transferencia directa `99eec7ff…`, sweep `fcce5830…`, retiro A `653494dd…`, retiro B `12a2a2eb…`. Vista pública `/vault-v2`.
