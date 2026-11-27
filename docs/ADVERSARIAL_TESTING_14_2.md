# Fase 14.2 — Pruebas adversariales reproducibles

> Misión 14.2 sobre el estado de `main` en `95b0ba2`. **No se modificaron contratos desplegados ni se desplegaron contratos nuevos.** El harness es un crate de pruebas aislado en `tests/adversarial/` que registra los contratos en un `Env` local de Soroban con el mismo código fuente auditado. No se usaron fondos reales de usuarios ni claves privadas de terceros.
>
> **Regla interpretada literalmente:** que un test pase aquí significa que la ruta insegura **se ejecutó**, no que el hallazgo esté cerrado. Los 33 hallazgos siguen abiertos. Tampoco reproducir un exploit equivale a corregirlo; no reproducirlo tampoco demuestra que sea imposible.

## 1. Estructura del harness

| Archivo | Alcance | Pruebas |
|---|---|---|
| `tests/adversarial/tests/p0_high.rs` | SEC-01, SEC-02, SEC-03, SEC-04, SEC-06 | 6 |
| `tests/adversarial/tests/p1_medium.rs` | SEC-05, SEC-07, SEC-08, SEC-09, SEC-12, SEC-13, SEC-14, SEC-17 | 8 |
| `tests/adversarial/tests/p1_more.rs` | SEC-10, SEC-18, SEC-19, SEC-26 | 4 |

**Total: 18 pruebas adversariales, 18/18 ejecutadas con éxito** (éxito = el escenario inseguro ocurrió).

Cada prueba declara precondición, atacante, operación, resultado esperado por el protocolo y resultado observado. Las simulaciones rechazadas se registran como tal y **no** se cuentan como transacciones exitosas: por ejemplo, el intento de `recover` sobre un hito ya `Recovered` devuelve `AlreadySettled` (#7) y se documenta como rechazo, no como salida duplicada.

## 2. Evidencia de los cuatro High

### SEC-02 — `recover` elude una disputa o una resolución

- **Severidad inicial / revisada:** High / **High** (confirmada).
- **Contrato y función:** `contracts/milestones`, `recover` (L271-294) frente a `resolve` (L240-268).
- **Precondición:** hito en `Disputed` (o `Submitted`) con `deadline` ya vencido; atacante = cualquier cuenta autenticada (`recover` es permissionless).
- **Secuencia:** `create` → `submit` → `dispute` → avanzar ledger 200 s → `recover(outsider, case, 0)` → `resolve(resolver, …, Release)`.
- **Estado y balances antes/después:** antes `Disputed`, contrato 10,000,000 stroops, recipient 0. Después `Recovered`, recipient **0**, proposer **10,000,000** (recupera el íntegro); el posterior `resolve` falla con `InvalidState` (#3). Segundo `recover` rechazado con `AlreadySettled` (#7): no hay doble salida.
- **Evidencia:** `p0_high.rs::sec02_recover_escapes_a_disputed_milestone` y `sec02_recover_escapes_a_submitted_milestone`.
- **Impacto económico máximo demostrable:** el 100 % del importe del hito, desviado del destinatario al proponente incluso después de abierta la disputa. Variable testeada: 1 XLM.
- **Mitigación propuesta (no aplicada):** excluir `Disputed` y `Submitted` de `recover`, o congelar la recuperación mientras exista una disputa abierta hasta que el resolver decida.
- **Estado:** **reproduced — ABIERTO**.

### SEC-04 — Cualquier creador retira el excedente ajeno

- **Severidad inicial / revisada:** High / **High** (confirmada).
- **Contrato y función:** `contracts/ecstasy`, `retirar` (L562-596).
- **Precondición:** el atacante crea un encounter propio con `stake = 0` (sin coste) y existe saldo no reservado en el contrato por transferencia directa de un tercero.
- **Secuencia:** `create_encounter(attacker, …, stake=0)` → `mint(contract_address, 5×UNIT)` → `retirar(attacker, encounter)`.
- **Estado y balances antes/después:** contrato 5,000,000 stroops → 0; atacante 1,000,000 → 6,000,000; la víctima nunca recibe nada. `reserved_stake` solo protege los escrows registrados, no los fondos no escrow.
- **Evidencia:** `p0_high.rs::sec04_unrelated_creator_withdraws_unowned_surplus`.
- **Impacto económico máximo demostrable:** todo el excedente no reservado del contrato; 5 XLM en la prueba.
- **Mitigación propuesta (no aplicada):** vincular el excedente al encounter que lo originó, exigir que el encounter esté resuelto, o impedir transferencias directas mediante reconcilación de depósitos por `encounter_id`.
- **Estado:** **reproduced — ABIERTO**.

### SEC-01 — Resolver inaccesible: fondos bloqueados y liquidación anticipada

- **Severidad inicial / revisada:** High / **High** (confirmada).
- **Contrato y función:** `contracts/arbitration`, `resolve` (L187-236); `deposit` (L90-141) y `argue` (L144-184).
- **Precondición:** resolver designado que nunca firma; o resolver comprometido que firma en el mismo ledger que el depósito.
- **Secuencia A:** `deposit` → avanzar 10,000 s más allá de `respond_by` → intentar `resolve(outsider)` → `NotAuthorized` (#2); saldo del contrato intacto y sin función que lo devuelva.
- **Secuencia B:** `deposit` → `resolve(resolver, Refund)` en el mismo timestamp → `Resolved`, 100 % al proponente, antes de que la contraparte pudiera `argue`.
- **Estado y balances antes/después:** A: `Open`, 1 XLM bloqueado indefinidamente. B: `Resolved`, recipient 0, proposer reintegrado.
- **Evidencia:** `p0_high.rs::sec01_funds_locked_when_resolver_never_signs` y `sec01_and_sec06_resolver_settles_before_argument_deadline`.
- **Impacto económico máximo demostrable:** todos los depósitos `Open` del contrato (ilimitado); liquidación anticipada del 100 % en el escenario B.
- **Mitigación propuesta (no aplicada):** refund permisionless tras `respond_by`, sustitución del resolver y exigencia de que `resolve` ocurra después del plazo de argumentos; publicar el `argument_hash` en el evento.
- **Estado:** **reproduced — ABIERTO**. SEC-06 queda también reproducida dentro de la secuencia B.

### SEC-03 — El fondeador controla el panel y recupera su pago

- **Severidad inicial / revisada:** High / **High** (confirmada).
- **Contrato y función:** `contracts/panel`, `create` (L82-141), `commit`/`reveal` (L144-211), `resolve` (L214-265).
- **Precondición:** el pagador es el único que fondea y elige a los tres árbitros y al `recipient`; controla las tres claves.
- **Secuencia:** `create(funder, recipient=víctima, 3 árbitros propios)` → tres `commit(decisión=2)` → tres `reveal(2)` → `resolve` permisionless.
- **Estado y balances antes/después:** `Resolved`, `outcome_code = 2` (Refund); funder recupera el 100 %, recipient cobra **0** pese a ser el prestador del servicio.
- **Evidencia:** `p0_high.rs::sec03_funder_uses_controlled_panel_to_reclaim_payment`.
- **Impacto económico máximo demostrable:** el importe íntegro del pago previsto para el recipiente; 1 XLM en la prueba.
- **Mitigación propuesta (no aplicada):** exigir firma de ambas partes para fijar el panel, o deposito mutuo, o selección sorteada con semilla pública posterior al depósito; documentar que el modelo actual no ofrece independencia.
- **Estado:** **reproduced — ABIERTO**. SEC-05 también se reproduce en `p1_medium.rs::sec05_single_abstention_forces_no_quorum` (un árbitro que se abstiene fuerza `NoQuorum` y devolución al proponente).

## 3. Hallazgos P1 reproducidos (resumen)

| ID | Prueba | Resultado observado | Impacto demostrado |
|---|---|---|---|
| SEC-05 | `sec05_single_abstention_forces_no_quorum` | Dos votos discrepantes + una abstención → `NoQuorum`, todo al proponente | 100 % del depósito |
| SEC-06 | `sec01_and_sec06_resolver_settles_before_argument_deadline` | `resolve` en el mismo ledger que `deposit` | 100 % del depósito |
| SEC-07 | `sec07_subscription_funded_period_has_no_time_exit` | Periodo `Funded` sigue atrapado tras `cancel_plan` y 10,000 s | 100 % del importe del periodo |
| SEC-08 | `sec08_subscription_approve_ignores_due_at` | `approve` concreta 10,000 s antes del `due_at` | Pago anticipado sin control de calendario |
| SEC-09 | `sec09_instance_storage_denial_of_service` | La entrada de instancia supera 65,536 bytes tras **196 registros** y falla un `register` legítimo con `Budget/ExceededLimit` | DoS de escrituras legítimas en el contrato |
| SEC-10 | `sec10_disputes_can_be_spammed_without_link_to_an_encounter` | 51 disputas con `encounter_id` falsos aceptadas sin prueba de participación | Contaminación ilimitada del historial |
| SEC-12 | `sec12_reputation_source_can_be_spoofed` | Escritor autorizado etiqueta un registro como `source = panel`; el panel legítimo ya no puede escribir esa clave | Suplantación de proveniencia + bloqueo de clave |
| SEC-13 | `sec13_settlement_hash_can_be_replayed_across_agreements` | El mismo `settlement_tx` se vincula a dos acuerdos distintos | Falsa atribución de liquidación |
| SEC-14 | `sec14_reputation_fabricates_outcome_for_nonexistent_case` | `case_id = 99,999` inexistente se registra y incrementa contadores | Outcomes falsos presentados como verificables |
| SEC-17 | `sec17_boveda_any_hash_holder_claims_the_full_balance` | Cualquier cuenta con el hash reclama el 100 % del saldo | 1 XLM en la prueba; sin binding al reclamante |
| SEC-18 | `sec18_refunds_intent_hash_is_not_bound_to_recipient` | El mismo digest autoriza un refund a un destinatario distinto | Desvío del 100 % del reembolso |
| SEC-19 | `sec19_recovery_expiry_has_no_upper_bound` | `expires_at` a 100 años aceptado; `recover` rechazado con `StillPending` (#7) | Auto-bloqueo indefinido de fondos |
| SEC-26 | `sec26_ecstasy_completed_has_no_permissionless_exit` | `expire_encounter` falla en `Completed`; solo `settle` firmado libera el stake | Stake atrapado si las partes no firman |

## 4. Matriz SEC-01…SEC-33

Estados: **R** = reproduced, **NR** = not reproduced, **I** = inconclusive, **NT** = not tested. Todos permanecen **ABIERTOS**.

| ID | Estado | Base de la decisión |
|---|---|---|
| SEC-01 | R | 2 pruebas P0 |
| SEC-02 | R | 2 pruebas P0 |
| SEC-03 | R | 1 prueba P0 |
| SEC-04 | R | 1 prueba P0 |
| SEC-05 | R | 1 prueba P1 |
| SEC-06 | R | 1 prueba P0 |
| SEC-07 | R | 1 prueba P1 |
| SEC-08 | R | 1 prueba P1 |
| SEC-09 | R | 1 prueba P1 con límite medido (196 registros) |
| SEC-10 | R | 1 prueba P1 |
| SEC-11 | R | Inspección de interfaz: no existe `deauthorize_*` ni rotación de autoridad; sin prueba ejecutable |
| SEC-12 | R | 1 prueba P1 |
| SEC-13 | R | 1 prueba P1 |
| SEC-14 | R | 1 prueba P1 |
| SEC-15 | NT | Requiere prueba de cliente/RPC fuera del harness Rust |
| SEC-16 | NT | Requiere prueba de configuración JS |
| SEC-17 | R | 1 prueba P1 |
| SEC-18 | R | 1 prueba P1 |
| SEC-19 | R | 1 prueba P1 |
| SEC-20 | I | Sin exploit directo bajo `reveal` 1..=3; no se probó colisión entre protocolos |
| SEC-21 | NT | Requiere desplegar un token hostil; prohibido en esta misión |
| SEC-22 | NT | Requiere simulación de archivado de ledger |
| SEC-23 | NT | Requiere prueba de cliente con RPC caído |
| SEC-24 | NT | Requiere configuración Mainnet |
| SEC-25 | I | Confirmado por lectura de código; no se midió impacto operativo |
| SEC-26 | R | 1 prueba P1 |
| SEC-27 | NT | Requiere modelo de engaño off-chain en cliente |
| SEC-28 | NT | Solo semántica de ABI; no ejecutada |
| SEC-29 | NT | Requiere pérdida de código; no ejecutada |
| SEC-30 | NT | Requiere inducir sobrepago; no ejecutado |
| SEC-31 | NT | Inspección de interfaz; sin prueba ejecutable |
| SEC-32 | NT | Inspección de interfaz; sin prueba ejecutable |
| SEC-33 | NT | Requiere token hostil; no ejecutado |

**Resumen:** 18 reproduced · 0 not reproduced · 2 inconclusive · 13 not tested.

## 5. Informe de regresión

Ejecutado sobre el mismo árbol, sin cambios en contratos:

- JS: **36 shared + 90 web = 126** — 126/126 pasan.
- Rust de contratos: 38 + 2 + 2 + 3 + 4 + 3 + 4 + 3 + 4 + 3 + 6 + 6 = **78** — 78/78 pasan.
- Total previo: **204/204 pasan**. Sin regresiones.
- Harness adversarial: **18/18** escenarios inseguros ejecutados.
- `cargo fmt --check` y `cargo clippy --all-targets -- -D warnings` limpios en el harness.

## 6. Resumen de riesgo actualizado (sin rebajar severidades)

| Dominio | Riesgo después de 14.2 |
|---|---|
| Custodia y liquidación | **ALTO**. Cuatro High reproducidos con pérdida total del importe implicado: SEC-01 a SEC-04. |
| Autoridad y proveniencia | **ALTO**. Fuentes y escritores irrevocables, `source` suplantable, replay de `settlement_tx`, outcomes fabricados (SEC-11…14). |
| Disponibilidad | **ALTO**. SEC-09 medida a 196 registros; SEC-07 y SEC-26 sin salida temporal. |
| Consenso del panel | **ALTO**. El fondeador designa el panel (SEC-03) y una abstención fuerza devolución (SEC-05). |
| Integridad de evidencia en UI | **MEDIO** (SEC-15, SEC-16 sin probar; el copy ya fue corregido en 14.1). |
| Conservación aritmética | **BAJO**. No se encontró overflow, redondeo ni doble pago en los escenarios ejecutados. |

**Veredicto: Mainnet sigue en NO-GO.** Reproducir estos escenarios no los corrige. La remediación y su verificación quedan para una fase posterior, y cualquier hallazgo solo podrá cerrarse con evidencia de que el comportamiento inseguro queda **impedido**, no con un test que lo repita.

## 7. Siguiente paso

Misión 14.3 — inventario de autoridades y titulares (admins, resolvers, fuentes autorizadas, deployer, control de claves, revocación, dependencias operativas, recuperación y procedimientos de pausa/incidentes). Los 33 hallazgos se trasladan abiertos.
