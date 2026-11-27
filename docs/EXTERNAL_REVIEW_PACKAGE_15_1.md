# Misión 15.1 — Paquete para revisión técnica independiente

> **Estado del encargo: NO hay auditor externo contratado.** Este documento prepara el material para entregarlo a un revisor independiente. **No afirma que la revisión se haya realizado** y no sustituye una auditoría de tercero. El revisor puede cuestionar tanto los hallazgos como las soluciones propuestas, incluidas sus severidades, reproducciones e invariantes.
>
> Restricción de la fase: sin cambios en contratos, sin despliegues, sin mover fondos y sin usar claves privadas de terceros.

## 1. Instrucciones de entrada para el revisor

```bash
git clone https://github.com/FernandoMay/ecstasy.git
cd ecstasy
git checkout 8a2835545c1c5a6bfd0c905d55f718ff0827601b
```

Toolchain fijado: Rust `1.99.1`, `soroban-sdk 29.0.0`, Stellar CLI `30.0.1`, target `wasm32v1-none`, Node `24`.

Orden de lectura recomendado:

1. `docs/SECURITY_REVIEW_14_1.md` — inventario y 33 hallazgos iniciales.
2. `docs/ADVERSARIAL_TESTING_14_2.md` — 18 reproducciones y matriz.
3. `docs/MAINNET_READINESS_14_3.md` — autoridades, titularidad y 3 riesgos operativos.
4. `docs/REMEDIATION_PLAN_14_4.md` — 36 hallazgos vinculados a propuestas e invariantes.
5. `docs/review/manifest.json` — línea base legible por máquina.

## 2. Línea base exacta

| Elemento | Valor |
|---|---|
| Commit auditado | `8a2835545c1c5a6bfd0c905d55f718ff0827601b` |
| Tag preservado | `v1.0.0` → `86c2fa7ff38583dd66b86032b58cf52d483089a6` (intacto) |
| Fin de misiones funcionales | `4d64bb7` |
| 14.1 / 14.2 / 14.3 / 14.4 | `95b0ba2` / `32086e4` / `56e28ff` / `8a28355` |
| Repositorio | `https://github.com/FernandoMay/ecstasy` |

Árbol relevante: `contracts/` (12 crates), `tests/adversarial/` (harness aislado), `packages/stellar/` (cliente y configuración), `apps/web/` (dApp), `.github/workflows/ci.yml` (CI con 12 contratos + harness).

## 3. Inventario de instancias desplegadas

| Contrato | ID Testnet | Hash WASM (on-chain = local, verificado) |
|---|---|---|
| ECSTASY | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` |
| Bóveda | `CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC` | `7d19a5e979def3bb33cbfdabb91dea167e837abe8e9186d0542d97d3a5a30d5a` |
| Disputes | `CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6` | `828497de62aa5c115e46985ff3b0b39dc3d251b55796ab50e7e7d126cc5e1079` |
| Refunds | `CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5` | `727d4eb0007e1fed1983ea3651628c71ee26b5cd6d29ad95b3c4beefdd892550` |
| Recovery | `CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ` | `c5764ba1f628acc300142e1159958afe9f750567a57824d228422e17e1d944c6` |
| Arbitration | `CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN` | `836f13fdb386ea02f82bcb7e90c3d56231f9a0d77c47dd4814aafe53e8957185` |
| Milestones | `CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7` | `83a6735d32b4d175305f07c5817fc9239edfc236231ae2ba756eec1393e86b30` |
| Panel | `CCFRBPLVJPQWKIDGFDJY7BQEJQRZZ554G2Y5JZQBFJ62IQIXXGHJWNQ3` | `8bca4467d7a50cb0eefdd8ce6753d2962ab4bbf4bbc3913d10cd7c8901f04d3a` |
| Streaming | `CA7T6F6CJTDURIHZRPWGJYKURGLH3PTMAFVBQGN7CXZ5BJ7GIWJJPJF2` | `5d8c6db73d32c463b099cfb0213c2f3ead7b16071da9715a9ee839ee34631331` |
| Subscription | `CBOHLODIJJZ7ABFVBQSFDJ3DFVWMA4GZEDBYVVSHBCQIEWWCMAWVABRZ` | `80ca7661fe12329a69179ea098618de6bbd405ab415f1ee71ce47327f4b225e2` |
| Reputation | `CDSKVD2HNSYAF7VZ44UQ3B4MG5RZTO33MJSCY3PKDJW37JM7OM5JYR7P` | `f19122fc720979b94e1249e9085f11e2da453a99842897d1fb77fbc515536bae` |
| Traceability | `CA4CVK4XCLOTRKJ7XTU556WKN7T4DTI7HHRWVSQ4U35Q6KUKQULLFOTC` | `043c3ae299c63a816c2e830cf534088482f3a4e098c4a69967c4ca1b08040099` |
| SAC XLM | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | nativo |

**Laguna de procedencia (14.3-B, abierta):** no se capturaron los hashes de despliegue de las primeras iteraciones de ECSTASY (`CB7IX`, `CBX2`, `CARK`, `CDG4`). `docs/FUNCTIONS_FOR_REVIEW.md` cita `beb1ad83…` como despliegue de la bóveda, pero un intento de decodificar `create_contract_v2` desde Horizon no produjo un ID que coincida con la instancia activa. **El revisor debe verificar esta discrepancia con su propio tooling**; el paquete no la da por resuelta.

## 4. Hallazgos y reproducciones

- **36 hallazgos abiertos**: 33 de 14.1 + 14.3-A/B/C.
- **18 reproducciones** en `tests/adversarial/`: 6 P0 (`p0_high.rs`), 8 P1 (`p1_medium.rs`), 4 P1 (`p1_more.rs`).
- Resultado: 18/18 escenarios inseguros ejecutados. **Esto no cierra hallazgo alguno**: un test que pasa significa que la ruta insegura ocurrió.
- Matriz: 18 `reproduced`, 2 `inconclusive`, 13 `not tested`. No reproducir no demuestra imposibilidad.

```bash
cd tests/adversarial && cargo test
cargo fmt --check && cargo clippy --all-targets -- -D warnings
```

## 5. Clasificación de evidencia (no mezclar)

| Clase | Qué incluye | Qué NO demuestra |
|---|---|---|
| **Prueba local** | 204 tests previos + 18 adversariales en `Env` de Soroban | No demuestra comportamiento de una instancia Testnet ni firmas reales (`mock_all_auths`) |
| **Verificación Testnet** | 82 hashes en el Evidence Center, `successful: true` en Horizon, sondas `--send=no` para resolvers/autoridades | No demuestra titularidad legal ni procedimientos de recuperación |
| **Owner-confirmed** | Flujo Freighter 9/9 | Sin hashes ni capturas por escenario: no es verificación independiente |
| **Revisión interna** | 14.1–14.4, realizada por el equipo | **No es auditoría de un tercero** |

## 6. Diseño de remediación e invariantes a cuestionar

El plan propuesto (`docs/REMEDIATION_PLAN_14_4.md`) no ejecuta cambios. Invariantes centrales que el revisor debe evaluar y atacar:

1. `Disputed` nunca transiciona a `Recovered` por llamada permissionless.
2. Todo caso `Open` de Arbitration tiene salida ejecutable dentro de `resolve_by`.
3. Un `settlement_tx` no puede asociarse a más de un acuerdo.
4. Ninguna cuenta controla dos o más posiciones arbitrales.
5. Una fuente revocada deja de escribir en el mismo ledger.
6. El saldo del contrato es siempre igual a la suma de reservas atribuidas.
7. Ningún fondo carece de ruta de salida legítima, incluso con autoridad comprometida.

Preguntas abiertas para el revisor: ¿son suficientes estas invariantes?, ¿preservan las salidas legítimas?, ¿introducen nuevos riesgos de centralización o de migración?

## 7. Preguntas obligatorias al revisor

1. ¿Los cuatro High son explotables en las **instancias desplegadas**, o solo en el harness local?
2. ¿Son correctas las severidades asignadas? ¿Falta algún Critical?
3. ¿Es SEC-02 realmente una violación de máquina de estados o un comportamiento de diseño documentado?
4. ¿La gobernanza 2/3 propuesta separa autoridad si las claves pertenecen al mismo operador?
5. ¿Puede migrarse la bóveda de 5.555 XLM sin conocer el `code_hash`? ¿Quién puede autorizarla legítimamente?
6. ¿Es suficiente el dominio del digest commit-reveal (SEC-20) o falta enlace al contrato y a la versión?
7. ¿El cambio a storage persistente (SEC-09) acota realmente el límite de recursos del host?
8. ¿Deben los 13 hallazgos `not tested` reclasificarse?
9. ¿Es aceptable que el Evidence Center muestre "Verified" sin consultar Horizon en tiempo real (SEC-15)?
10. ¿Qué interacciones entre contratos no cubiertas por los 18 escenarios podrían bloquear fondos?
11. ¿El plan de rollback trata adecuadamente la distinción entre revertir la app y revertir una migración económica?
12. ¿La separación v1/v2 preserva la evidencia histórica sin introducir ambigüedad de versiones?

## 8. Restricciones y exclusiones

- No se moverán fondos durante esta revisión (1 XLM en ECSTASY, 5.555 XLM en bóveda).
- No se modifica `v1.0.0` ni las 12 instancias.
- **Rollback de software ≠ reversión económica**: volver a apuntar la app a V1 no revierte transacciones ni recupera fondos migrados. El revisor debe tratarlos como problemas separados.
- No se usan claves privadas de terceros ni fondos de usuarios.

## 9. Entregable esperado del revisor

Informe con: (a) confirmación o discrepancia de cada uno de los 36 hallazgos con evidencia propia; (b) severidad revisada; (c) nuevos hallazgos; (d) aceptación o rechazo de cada invariante; (e) opinión sobre la migración de fondos; (f) recomendación `GO` / `CONDITIONAL GO` / `NO-GO` por componente, con justificación.

## 10. Estado declarado

`v1.0.0` preservada · 36 hallazgos abiertos · fondos sin mover · **Mainnet NO-GO** · sin auditoría independiente realizada.
