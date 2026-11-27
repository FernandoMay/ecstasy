# Fase 14.1 — Revisión adversarial interna e inventario de contratos

> **Descargo obligatorio.** Este documento es una **revisión adversarial interna** realizada por el equipo del proyecto sobre el código fuente. **No es una auditoría de seguridad independiente realizada por un tercero.** Ningún hallazgo se considera cerrado porque exista un test que pase: los tests actuales usan `Env` fresco por caso, `mock_all_auths()`, actores honestos y balances semilla, y no modelan adversarios, colusión, carreras por fondos ni agotamiento de almacenamiento.

## 0. Estado de la auditoría externa

**No hay auditor externo contratado.** Se entrega este paquete (inventario + hallazgos reproducibles) como insumo para una futura auditoría independiente. No se desplegaron contratos nuevos ni se modificaron los contratos auditados durante esta fase.

## 1. Línea base y reproducibilidad

- Árbol auditado: base `4d64bb7` más los cambios de consolidación de la Fase 14 (UI/documentación, sin cambios de contratos).
- Toolchain: Rust `1.99.1`, `soroban-sdk 29.0.0`, Stellar CLI `30.0.1`, target `wasm32v1-none`.
- Verificación realizada el 27 nov 2026: para **los 12 contratos desplegados**, el hash WASM leído on-chain (`stellar contract info hash --id … --network testnet`) es **idéntico** al hash del artefacto construido localmente (`stellar contract info hash --wasm …`). No hay deriva de artefactos.
- No existe ninguna llamada entre contratos financieros ni hacia los registros: el único `Client` invocado es `TokenClient` del SAC. La composición ocurre en el cliente y en transacciones explícitas firmadas por la autoridad.

## 2. Inventario de contratos desplegados

Hay **12 contratos desplegados** (10 protocolos financieros + 2 registros transversales). Con el SAC nativo de XLM son **13 IDs públicos**, que es el origen del conteo "13" usado en fases anteriores.

| # | Contrato | ID Testnet | WASM (on-chain = local) | Fuente |
|---|---|---|---|---|
| 1 | ECSTASY state machine | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` | `contracts/ecstasy`, v0.1.0 |
| 2 | Bóveda 5555 XLM | `CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC` | `7d19a5e979def3bb33cbfdabb91dea167e837abe8e9186d0542d97d3a5a30d5a` | `contracts/boveda`, v0.1.0 |
| 3 | Disputes | `CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6` | `828497de62aa5c115e46985ff3b0b39dc3d251b55796ab50e7e7d126cc5e1079` | `contracts/disputes`, v0.1.0 |
| 4 | Refunds | `CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5` | `727d4eb0007e1fed1983ea3651628c71ee26b5cd6d29ad95b3c4beefdd892550` | `contracts/refunds`, v0.1.0 |
| 5 | Recovery | `CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ` | `c5764ba1f628acc300142e1159958afe9f750567a57824d228422e17e1d944c6` | `contracts/recovery`, v0.1.0 |
| 6 | Arbitration | `CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN` | `836f13fdb386ea02f82bcb7e90c3d56231f9a0d77c47dd4814aafe53e8957185` | `contracts/arbitration`, v0.1.0 |
| 7 | Milestones | `CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7` | `83a6735d32b4d175305f07c5817fc9239edfc236231ae2ba756eec1393e86b30` | `contracts/milestones`, v0.1.0 |
| 8 | Panel arbitration | `CCFRBPLVJPQWKIDGFDJY7BQEJQRZZ554G2Y5JZQBFJ62IQIXXGHJWNQ3` | `8bca4467d7a50cb0eefdd8ce6753d2962ab4bbf4bbc3913d10cd7c8901f04d3a` | `contracts/panel`, v0.1.0 |
| 9 | Streaming | `CA7T6F6CJTDURIHZRPWGJYKURGLH3PTMAFVBQGN7CXZ5BJ7GIWJJPJF2` | `5d8c6db73d32c463b099cfb0213c2f3ead7b16071da9715a9ee839ee34631331` | `contracts/streaming`, v0.1.0 |
| 10 | Subscription | `CBOHLODIJJZ7ABFVBQSFDJ3DFVWMA4GZEDBYVVSHBCQIEWWCMAWVABRZ` | `80ca7661fe12329a69179ea098618de6bbd405ab415f1ee71ce47327f4b225e2` | `contracts/subscription`, v0.1.0 |
| 11 | **Reputation Registry** | `CDSKVD2HNSYAF7VZ44UQ3B4MG5RZTO33MJSCY3PKDJW37JM7OM5JYR7P` | `f19122fc720979b94e1249e9085f11e2da453a99842897d1fb77fbc515536bae` | `contracts/reputation`, v0.1.0 |
| 12 | **Traceability Registry** | `CA4CVK4XCLOTRKJ7XTU556WKN7T4DTI7HHRWVSQ4U35Q6KUKQULLFOTC` | `043c3ae299c63a816c2e830cf534088482f3a4e098c4a69967c4ca1b08040099` | `contracts/traceability`, v0.1.0 |
| — | SAC nativo XLM | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | — | Stellar Asset Contract |

## 3. Funciones públicas, autoridades y movimiento de fondos

| Contrato | Funciones públicas | Autoridad real | Quién mueve fondos y cuándo | Terminal / salida |
|---|---|---|---|---|
| ECSTASY | `create_encounter`, `accept_encounter`, `decline_encounter`, `complete_encounter`, `settle_encounter`, `cancel_encounter`, `expire_encounter`, `retirar`, `submit_afterglow`, `get_encounter`, `get_afterglow` | Creador, participante o cualquiera en `expire_encounter`; `retirar` solo creador del encounter referenciado | `create` (stake), `decline`/`cancel`/`expire`/`retirar` → creador; `settle` → participante | `Settled`, `Cancelled`, `Expired`; `Completed` **sin salida permissionless** |
| Bóveda | `fund`, `reclamar`, `status` | Cualquier dirección con el digest correcto | `reclamar` → todo el saldo al primero que presente el hash | `Claimed`; sin rescate del fondeador |
| Disputes | `open`, `respond`, `resolve`, `get` | Partes nominales; resolver designado | No mueve fondos | `Resolved`; terminal |
| Refunds | `propose`, `approve`, `reject`, `revoke`, `execute`, `get` | Proposer / counterparty | `execute` → recipient; `reject`/`revoke` → proposer | `Rejected`, `Revoked`, `Refunded`; terminales |
| Recovery | `propose`, `approve`, `execute`, `recover`, `get` | Proposer / counterparty; `recover` permissionless | `execute` → recipient; `recover` → proposer (nunca al caller) | `Executed`, `Recovered`; terminales |
| Arbitration | `deposit`, `argue`, `resolve`, `get` | Partes para `argue`; **resolver único** para `resolve` | `resolve` → recipient / proposer / split | `Resolved`; terminal, **sin salida alternativa** |
| Milestones | `create`, `submit`, `approve`, `dispute`, `resolve`, `recover`, `get` | Recipient, proposer, resolver; `recover` permissionless | `approve`/`resolve`→recipient o proposer; `recover`→proposer | `Paid`, `Refunded`, `Recovered`; `Disputed` **no es terminal** |
| Panel | `create`, `commit`, `reveal`, `resolve`, `get`, `commitment` | Árbitros designados por quien fondea; `resolve` permissionless | `resolve` → Release/Refund/Split o devolución al proposer | `Resolved`, `NoQuorum`; terminales |
| Streaming | `create_stream`, `claim`, `pause`, `resume`, `cancel`, `close`, `get_stream`, `claimable` | Payer, recipient; `close` permissionless | `claim`/`cancel`→recipient; `cancel`→remanente al payer | `Cancelled`, `Closed`; terminales, reconciliación exacta |
| Subscription | `create_plan`, `fund_period`, `submit_delivery`, `approve`, `dispute`, `resolve_dispute`, `cancel_plan`, `get_plan`, `get_period`, `get_periods` | Payer, recipient, resolver | `approve`/`resolve_dispute`→recipient o payer | `Approved`, `Refunded`; `Funded`/`Submitted` **sin salida por tiempo** |
| Reputation | `authorize_source`, `register`, `record_case`, `record_vote`, `suspend`, `get_profile`, `get_eligibility`, `get_case` | `Authority`; escritores autorizados | No mueve fondos | Sin revocación de permisos |
| Traceability | `authorize_writer`, `link`, `get_chain` | `Authority`; escritores autorizados | No mueve fondos | Sin revocación de permisos |

## 4. Grafo de dependencias

```text
Navegador / app  ──►  12 contratos (lecturas y escrituras firmadas por wallet)
SAC XLM          ──►  todos los contratos con custodia (única llamada on-chain)
Reputation       ◄──  transacciones explícitas de la Authority (fuentes autorizadas)
Traceability     ◄──  transacciones explícitas de la Authority (escritores autorizados)
```

No hay composición on-chain entre protocolos. `panel`, `subscription` y los demás no invocan a los registros; la "integración" es un índice pasivo escrito por la autoridad. Esto limita el radio de explosión, pero también significa que **los registros no verifican la ejecución que afirma representar** (SEC-13/14/15).

## 5. Hallazgos

Clasificación: **Critical / High / Medium / Low / Informational**. Estado inicial de todos: **ABIERTO**. Ninguno se cierra por la existencia de tests.

### Critical

Ninguno identificado en esta revisión.

### High

| ID | Contrato · ubicación | Hallazgo y escenario |
|---|---|---|
| SEC-01 | Arbitration `src/lib.rs:83-85, 187-236` | **Resolver único sin fallback.** No hay timeout, `resolve` permisionless ni reembolso alternativo. Si la clave del resolver se pierde o queda offline, todo depósito `Open` con XLM real queda inmueble indefinidamente; si se compromete, decide Release/Refund/Split a voluntad. |
| SEC-02 | Milestones `src/lib.rs:271-294` | **`recover` anula disputas y resoluciones.** La lista excluida es solo `{Paid, Refunded, Recovered}`, por lo que `Disputed` y `Submitted` son recuperables tras el deadline. Un tercero adelanta un `recover` y el posterior `resolve` falla con `InvalidState`: la decisión del resolver queda sin efecto. Un hito entregado también puede ser recuperado por el proposer. |
| SEC-03 | Panel `src/lib.rs:82-115, 295-301` | **El fondeador controla el panel.** `create` solo exige auth del `caller`, que elige a los 3 árbitros y al `recipient` y es el único que deposita. Quien paga puede nombrar tres direcciones propias y forzar el resultado (incluso `Refund` para recuperar un pago ya devengado). La documentación dice "designado por las partes", lo cual no se corresponde con el código. |
| SEC-04 | ECSTASY `src/lib.rs:562-596` | **`retirar` atribuye el excedente a cualquier creador.** El único control es `caller == encounter.creator`; no se exige estado ni relación con el origen de los fondos. Un atacante crea un encounter con `stake=0` (gratis) y, si un tercero envía XLM directamente al contrato, llama `retirar` y se apropia de todo el excedente antes que el legítimo afectado. |

### Medium

| ID | Contrato · ubicación | Hallazgo y escenario |
|---|---|---|
| SEC-05 | Panel `src/lib.rs:171-211, 252-256` | Un árbitro que se abstiene de `reveal` puede forzar `NoQuorum` cuando los otros dos no coinciden, anulando la intención de la mayoría. Sin penalización ni reemplazo. |
| SEC-06 | Arbitration `src/lib.rs:159, 175, 187-236` | `respond_by` no restringe `resolve` (puede ejecutarse en el mismo ledger que `deposit`) y el `argument_hash` se descarta (`let _ = …`) sin publicarse en el evento. El plazo es cosmético y un observador no puede verificar qué argumento se presentó. |
| SEC-07 | Subscription `src/lib.rs:207-307` | Los estados `Funded` y `Submitted` no tienen salida por tiempo: si el recipient nunca entrega y nadie disputa, el importe queda atrapado incluso tras `cancel_plan`. Si el resolver tampoco firma, ni un periodo disputado tiene salida. |
| SEC-08 | Subscription `src/lib.rs:115-117, 128, 143-157, 219` | `frequency` se valida pero nunca se usa; `created_at` y `due_at` son inertes; `approve` ignora `due_at`. El contrato no implementa recurrencia: son depósitos sueltos con IDs arbitrarios. |
| SEC-09 | Cross-contract (panel, arbitration, milestones, subscription, disputes, reputation, traceability, streaming, ecstasy) | **Crecimiento ilimitado en `instance()` storage.** Todos los registros viven en una única entrada de instancia y nunca se eliminan. Un atacante puede inflarla hasta el límite del host; entonces fallan también las escrituras de `resolve`/`approve`/`recover`, con fondos restantes varados. |
| SEC-10 | Disputes `src/lib.rs:76-114, 132-136, 184-185` | `open` no exige prueba de participación ni unicidad de `encounter_id`: un atacante puede abrir miles de disputas contra una víctima con IDs falsos y `outcome_hash` arbitrario, contaminando su historial público sin coste de protocolo. |
| SEC-11 | Reputation `src/lib.rs:85-96`; Traceability `src/lib.rs:66-73` | **Sin revocación.** No hay `deauthorize_source`/`deauthorize_writer` ni rotación de autoridad. Una fuente comprometida mantiene el permiso para siempre; hay que redesplegar y actualizar todos los IDs. |
| SEC-12 | Reputation `src/lib.rs:136-154, 172-190, 242-252` | `ensure_writer` valida `caller`, **no** `source`. Una fuente autorizada puede etiquetar un registro como proveniente del panel y bloquear la clave `(subject, case_id, source)` para el registro legítimo. |
| SEC-13 | Traceability `src/lib.rs:78-105` | **Replay de `settlement_tx`.** El mismo hash de liquidación real puede vincularse a infinitos `agreement_id`. La UI lo muestra como "vinculado al caso real", induciendo a creer que otro acuerdo fue liquidado. |
| SEC-14 | Reputation `src/lib.rs:132-201` | Un escritor autorizado puede registrar `outcome_hash`/`participation_hash` arbitrarios para un `case_id` inexistente o un árbitro cualquiera; los contadores aumentan y `/reputation` lo presenta como hecho verificable. |
| SEC-15 | Cliente: `reputation/page.tsx`, `subscriptions/page.tsx`, `evidence/page.tsx`, `lib/evidence.ts`, `lifecycle.ts` | **Datos mostrados como "verificados" sin verificar.** Ninguna pantalla llama `getTransaction` ni comprueba que el hash corresponda al caso mostrado; el Evidence Center marca "Verified" por un regex sobre hashes hardcodeados. |
| SEC-16 | `packages/stellar/src/config.ts:65-68, 128-135, 144-154` | Solo `contractId` y `assetContractId` se validan con regex. Los IDs de registros y protocolos se leen de `NEXT_PUBLIC_*` sin validación; en mainnet los presets están vacíos y no hay fail-closed. Apuntar a un contrato atacante hace que la UI muestre datos falsos como canónicos. |
| SEC-17 | Bóveda `src/lib.rs:46-49, 80-106` | El único control es un digest público sin binding al reclamante ni commit/reveal: `reclamar` transfiere el 100% al **primero** que presente el hash. Si el código es de baja entropía o se divulgó, un atacante puede hacer fuerza bruta offline y adelantarse. Condicionado a entropía/divulgación; escalable a High. |
| SEC-18 | Refunds `src/lib.rs:76-105, 137, 217`; Recovery `src/lib.rs:77-112, 147` | `intent_hash` no está vinculado on-chain a `amount`, `recipient` ni `counterparty`. La contraparte autoriza un digest opaco sin que el contrato demuestre que corresponde a esos campos. |
| SEC-19 | Recovery `src/lib.rs:90` | `expires_at` no tiene cota superior y no hay `revoke` antes del vencimiento: el proposer puede auto-bloquear fondos hasta una fecha arbitrariamente lejana. |

### Low

| ID | Contrato · ubicación | Hallazgo y escenario |
|---|---|---|
| SEC-20 | Panel `src/lib.rs:272-286`; `apps/web/lib/panel-commitment.ts` | Sin separador de dominio (protocolo/versión/contract ID) en el digest y `decision: u32` se trunca a `u8`. Hoy `reveal` restringe 1..=3, así que no hay exploit directo; el riesgo es colisión con otro protocolo que use el mismo layout. **No hay vulnerabilidad por reutilización de secreto**: `case_id` y el árbitro están dentro del digest. |
| SEC-21 | Panel, Arbitration, Milestones, Subscription | El estado terminal se escribe **después** de la llamada al token externo. Con el SAC canónico no hay callback, pero `asset` es una `Address` fijada en el constructor: un token hostil podría reentrar y duplicar pagos. Condicionado a despliegue hostil del asset. |
| SEC-22 | Streaming, ECSTASY `retirar` | Sin `extend_ttl` en storage de instancia. Un stream de hasta un año o un encounter inactivo podrían archivarse antes de reclamar, dificultando la salida de fondos. Impacto condicionado a la semántica de restauración de la red. |
| SEC-23 | `reputation/page.tsx:52-104` | Un único `try/catch` y un `Promise.all` hacen que una sola llamada fallida borre todos los datos y muestre "sin registros" en lugar de "registro no disponible". |
| SEC-24 | `lifecycle.ts`, `evidence.ts`, varias páginas | Las URLs de explorador están fijas a `testnet`, ignorando `config.network` y `config.explorerBaseUrl`. En mainnet los enlaces apuntarían a la red equivocada. |
| SEC-25 | Reputation `src/lib.rs:208, 217-226` | `reason_hash` se descarta (`let _ = reason_hash`) y no entra en el evento; el evento tampoco incluye `until` ni la autoridad. Auditoría imposible sin reconstruir la transacción. Además `until` puede fijarse arbitrariamente lejos. |
| SEC-26 | ECSTASY `src/lib.rs:382-439, 216-222` | `Completed` no es terminal y `is_expired` solo aplica a `Created|Accepted`: ambas partes pueden completar y luego negarse a firmar `settle`, dejando el stake cerrado sin salida. |
| SEC-27 | ECSTASY `src/lib.rs:289, 313-342, 469-475` | `terms_hash` lo fija solo el creador; `accept_encounter` no lo recibe ni lo verifica. El marcador de liquidación se deriva de `id || timestamp`, no de términos, monto ni partes: el contrato no puede demostrar acuerdo sobre el mismo documento. |
| SEC-28 | Refunds `src/lib.rs:161-162` | `reject` devuelve `InvalidState` para un llamador no autorizado en lugar de `NotAuthorized`. Solo semántica de ABI. |
| SEC-29 | Bóveda `src/lib.rs:46-49, 80-99` | Si se pierde el código no existe función de rescate del fondeador: los fondos quedan bloqueados permanentemente. |

### Informational

| ID | Ubicación | Observación |
|---|---|---|
| SEC-30 | Panel, Arbitration, Milestones, Subscription | Los helpers de transferencia comparan el balance **total** del contrato, no los fondos respaldantes de cada caso. Hoy es seguro porque depósito y pago son simétricos; cualquier sobrepago futuro dejaría impagables registros honestos. |
| SEC-31 | Reputation | No existe `get_vote`: el digest de participación no es consultable on-chain, solo el contador y los eventos. |
| SEC-32 | Reputation, Traceability | `authorize_source`/`authorize_writer` no emiten eventos; `ReputationEvent.subject` no es `#[topic]`. Dificulta indexación y auditoría de cambios de autoridad. |
| SEC-33 | Bóveda `src/lib.rs:102-107` | El flag `Claimed` se escribe después de la transferencia. Sin reentrancia explotable con el SAC canónico; se registra como orden de escritura no óptimo. |

## 6. Verificación negativa (buscado y NO encontrado)

Para evitar conclusiones infladas, se documenta explícitamente lo que **no** se encontró:

- No hay doble liquidación: el estado terminal se persiste antes de retornar y toda segunda llamada es rechazada.
- No hay overflow ni error de redondeo real en stroops: `checked_add`/`checked_mul`, splits con `amount/2` y `amount - first`.
- No hay replay multi-caso en commit-reveal: `case_id` y el árbitro están dentro del digest.
- No hay confusión de autoridad `Address` vs contrato: `require_auth` siempre se aplica a `Address`.
- No hay fallo de conservación, clock pausado ni doble claim en Streaming.
- No hay salida no autorizada en Refunds ni en Recovery; `recover` devuelve al proposer, nunca al caller.
- No hay bug aritmético en bóveda ni en los 13 protocolos auditados que permita retirar más de lo depositado.

## 7. Estado de los gates de salida

| Gate | Condición | Estado |
|---|---|---|
| Security | Ningún Critical o High sin resolver | **NO** — SEC-01 a SEC-04 abiertos (4 High) |
| Integración | Flujos económicos reconciliados | PENDIENTE — Misión 14.2 |
| Custodia | Ningún fondo sin ruta de salida documentada | **NO** — SEC-01, SEC-07, SEC-26, SEC-29 |
| Autoridades | Todos los permisos y titulares identificados | PARCIAL — inventario de permisos completo; titulares reales pendiente (14.3) |
| Operaciones | Procedimientos de incidentes probados | PENDIENTE — Misión 14.3 |
| Licencia | Decisión documentada y compatible | PENDIENTE — Misión 14.4 |
| Evidencia | Artefactos reproducibles y verificables | PARCIAL — 12 hashes WASM on-chain = locales; faltan pruebas adversariales de los hallazgos |

**Resultado de esta fase: NO-GO para Mainnet**, coherente con la decisión del owner de no mover fondos de usuarios hasta cerrar la revisión.

## 8. Siguiente paso

La Misión 14.2 debe convertir SEC-01…SEC-33 en pruebas adversariales reproducibles (sin desplegar contratos nuevos), priorizando:

1. `recover` sobre `Disputed` en Milestones (SEC-02).
2. Resolución anticipada y bloqueo del resolver en Arbitration (SEC-01/06).
3. Colusión del fondeador en Panel (SEC-03/05).
4. `retirar` por un creador ajeno en ECSTASY (SEC-04).
5. Suplantación de `source` y replay de `settlement_tx` en los registros (SEC-11…14).
