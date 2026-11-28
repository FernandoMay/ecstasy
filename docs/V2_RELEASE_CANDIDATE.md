# Release Candidate V2 — Testnet (15.7)

> Este documento reporta una corrida **fresca** sobre artefactos reproducibles. No reutiliza los hashes históricos de 15.2–15.6 como si fueran una ejecución nueva. Estado: **corrida cerrada**, 27 transacciones confirmadas en Horizon con hashes nuevos, indexadas en el Evidence Center.

## 1. Línea base

- Commit de referencia V2: `1ec0b3b` (producto hasta 15.6).
- Regresión completa ejecutada: **257/257 tests** (128 JS + 129 Rust).
- Toolchain: Rust 1.99.1, Soroban SDK 29.0.0, Stellar CLI 30.0.1, wasm32v1-none.

## 2. Reproducibilidad de artefactos

Los 7 contratos V2 fueron reconstruidos desde el árbol y comparados con las instancias desplegadas. En los 7, `stellar contract info hash --id` coincide con `--wasm`:

| Contrato | Hash WASM |
|---|---|
| milestones-v2 | `c261509bd2070ab4f0773722125d6ac18af3753c6c71d8d16cc938c2e6a04e06` |
| arbitration-v2 | `0af9ce4515be3eb7009d3ebd788999bf7bb6c2ab4ae3f68050ae3ee5e1bf7671` |
| panel-v2 | `c5a7ec91a14d43a710f48a51a89c0376fdbdce2e2b34f8f9f79d0d7dede85c5a` |
| vault-v2 | `9242aedf752fd1d3cd103de2d8dfc99cc113fcafd16bc62b5607fa9f91c311dd` |
| arbitrators-registry | `ebd88ef9dc9bcc849a82f20d1fdcab60f618cf77fa7ac7424fcb3a4331378d52` |
| role-registry-v2 | `b2b93c6210e9e9d8c610560feccfdd4b5612dd8ca824b4d11508033a90fe0d3a` |
| flow-v2 | `607fc6777206e86e6b1004fca6542fa7fbd65e410aa027334ace9468e9292a61` |

## 3. Instancias frescas RC

| Contrato | ID Testnet |
|---|---|
| role-registry-v2 | `CBONV7IUCRAEXH336PL6YKL7ODNXIW5O5QMAWRRFX2BYO45MPNNORC65` |
| flow-v2 | `CDGVTZ4VIVM4MXQXM7OXHVVDHH5GMKUWX3OMF6LPFDPMDMSRFGWAAQVI` |
| vault-v2 | `CCRVFCTLNVQNEQ5YYQ6PRO5Z7FGHPQX6K4AHWKGADO2G7FTERK2E5YWC` |
| milestones-v2 | `CD5Y6WOUM5QRDJDD663RF6Q4HDPK4CTI5CECWX225ZGAZGNOV3E4LJUT` |
| arbitration-v2 | `CCTR5XGJWHMIVYRAPNASRSOQICP5QAMWGYFIO5WQPDB4HJDIX574U5YP` |
| arbitrators-registry | `CBUGZQV5RGDXZ3LE2XXGSNNKM7QTXMVAI4MX65TZUD6VK5M3VHXDWRYI` |
| panel-v2 | `CCVB7I3IEIPRUYELPGGMR3QJZEQNAP76DREKZTKZMAJUJIGDXLPMTU7T` |

## 4. Autoridad y regresiones adversariales

Cuatro roles en claves distintas; `admin` sin rol operativo. `start` y `link_step` ejecutados por el admin fueron **rechazados en simulación (#2)**, sin hash. `has_role(fund_manager, admin) = false`.

También se repitieron contra V2 los escenarios de 14.2 que aplican: `recover` sobre hito disputado (#10 en Milestones V2), retiro sobre atribución insuficiente (#5 en Vault V2), retiro de vault ajeno (#2), resolución fuera de ventana (#5/#8 en Arbitration V2) y controlador duplicado (#4 en Registry). Todos rechazados; ninguno contabilizado como transacción exitosa.

## 5. Flujo compuesto fresco

`Vault V2 → Milestones V2 → Arbitration V2 → Panel V2 → Flow settlement`, con XLM nuevo y hashes nuevos. Estado final del flujo RC: **`Settled`** con cinco pasos enlazados; settlement `40bbedd6275600d942c450d943827417a6f6e7cc92a8203e5cba0e0f1dc80123`; cierre del flujo `c9f21822e24d763fa8e5e49e5127023c61a6a62b29290d99e9e11ba3a59cbf39`.

Reconciliación observada al cierre: Milestones RC 0, Arbitration RC 0, Panel RC 0 y Vault RC 10.000.000 stroops **atribuidos** (1 XLM legítimamente retirable por su creador, no surplus). No hay saldo no atribuido. Los 27 hashes están en `docs/TESTNET_TRANSACTIONS.md` y en el Evidence Center.

## 6. Release gate

| Gate | Resultado |
|---|---|
| Regresión 257/257 | **GO** |
| Reproducibilidad WASM (7/7) | **GO** |
| Corrida fresca con hashes nuevos | **GO** |
| Autoridad separada y admin sin fondos | **GO** |
| Salidas legítimas y doble pago rechazado | **GO** |
| Storage segmentado (200 flujos) | **GO** |
| Flujo compuesto real en Testnet | **GO** |
| Mainnet | **NO-GO** — sin auditoría externa ni migración autorizada |
| Findings V1 | **36 abiertos** — no se cierran por la existencia de V2 |

**Formulación correcta:** `V1 finding abierto → V2 comportamiento corregido y demostrado`. La mitigación en V2 no reescribe la historia de V1.

`v1.0.0` permanece intacta y los 5.555 XLM de la Vault V1 no se movieron.
