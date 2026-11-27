# Fase 14.3 — Mainnet Readiness Assessment: autoridades y titularidad

> Perímetro conservador: **no se modificó ni desplegó ningún contrato**, no se usaron claves privadas de terceros ni fondos de usuarios, y **ningún hallazgo de 14.1/14.2 se cerró ni rebajó**. Estado de `main`: `32086e4`.
>
> **Distinción obligatoria:** una dirección pública no identifica a su titular, y una política documentada no es un mecanismo técnico ejecutable. Aquí `declared` es lo que el contrato codifica; `effective` es lo que se verificó que puede ejecutar; `controlled_by` es la titularidad operativa observable, no una identidad legal.

## 1. Metodología y estados de evidencia

- **verificado**: leído o probado en cadena (getter, simulación con `--send=no` o transacción confirmada en Horizon).
- **documentado**: consta en comandos de despliegue o documentación del repositorio, sin lectura on-chain directa.
- **owner-confirmed**: afirmado por el owner sin artefacto adjunto.
- **desconocido**: sin evidencia disponible.

Técnica empleada para resolvers y autoridades sin getter: simular una función reservada con un identificador inexistente y distintos `--caller`. Un no autorizado devuelve `NotAuthorized` (#2); el autorizado avanza y devuelve `NotFound` u otro error de estado. Esto **no firma ni envía nada** y usa únicamente claves locales propias.

## 2. Inventario de claves operativas

Todas las claves están presentes en el keystore local del entorno (`stellar keys ls`). Su titular legal es **desconocido**; la presencia en el mismo entorno es evidencia de **control operativo conjunto**, no de entidades independientes.

| Alias | Dirección | Uso observado | Titularidad |
|---|---|---|---|
| `suite-admin` | `GBQV7XDOMA6342BHICZGIRBDOZVTMRL7A7A3MWVL4SRP7EH37NAPO5KQ` | Resolver en 4 contratos; authority en 2 registros; fondeador de la bóveda; desplegador de registros | Operativa: este entorno. Legal: **desconocido** |
| `arceus-deployer` | `GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ` | Despliegue de bóveda (verificado) y de la mayoría de contratos; pagador en flujos de prueba | Operativa: este entorno. Legal: **desconocido** |
| `arceus-approver` | `GBR5G5CEYM5NXYYYEMT7BFWIFWKC4H25FONQ4K4KYZSZS7TCKU4U6ERV` | Árbitro del panel; recipient en múltiples flujos | Operativa: este entorno. Legal: **desconocido** |
| `cc2026-new` | `GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR` | Árbitro del panel | Operativa: este entorno. Legal: **desconocido** |
| `voltx-deployer` | `GACEAMIFYOXSQKHNAVTJIBFBTD2LWUURLAXHH4NXMI7O5BLUNRIEWXUU` | Árbitro del panel | Operativa: este entorno. Legal: **desconocido** |
| `escrow-arbiter` | `GB3E57PYF6DQ6FVYXGPXUU2LTZYTPROPICDLZ5C5MEJZOSGWMBUPMPH3` | Sin autoridad efectiva detectada en los 12 contratos | Operativa: este entorno |
| `suite-resolver-suite` | `GAGYAJDUEGBOAA4AGLZVDEREBKACLQQE2RWDAY4C45TK67HS3F3SXBRG` | Sin autoridad efectiva detectada | Operativa: este entorno |

**Hallazgo operativo 14.3-A (Informational, abierto):** los tres árbitros del caso 1 del panel son exactamente `arceus-approver`, `cc2026-new` y `voltx-deployer`, las tres claves del mismo keystore. El quórum 2/3 es técnicamente correcto, pero **no hay evidencia de independencia entre los árbitros**. Esto confirma en producción lo reproducido en SEC-03.

## 3. Exposición económica actual (lectura on-chain del SAC, 27 nov 2026)

| Contrato | Saldo XLM | Nota |
|---|---:|---|
| Bóveda `CAWOC5VH…` | **5.555** | Sin reclamar; controlado por un `code_hash` de titular desconocido |
| ECSTASY `CDG4L3FJ…` | **1** | `ReservedStake`; expuesto a SEC-04 |
| Otros 10 contratos | 0 | Sin fondos en el momento de la lectura |

**Total en custodia: 5.556 XLM.** No es una cifra de Mainnet; es la exposición observable en Testnet.

## 4. Matriz de autoridades (los 12 contratos + SAC)

Los campos son: `declared` / `effective` / `controlled_by` / `revocable` / `compromise_impact` / `recovery_path` / `evidence_status`.

### 4.1 ECSTASY `CDG4L3FJ…`
- **Creador de encounter** — declared: `caller == encounter.creator` para `settle`, `cancel`, `retirar`. effective: igual, pero `retirar` permite a cualquier creador apropiarse del excedente (SEC-04). controlled_by: la clave que creó cada encounter; titular desconocido. revocable: N/A (rol por encounter, no global). compromise_impact: liquidación del stake y apropiación del excedente no reservado. recovery_path: **inexistente** si se pierde la clave; `Completed` sin salida permissionless (SEC-26). evidence_status: **verificado** (código + 14.2) / titular **desconocido**.
- **Admin global**: **no existe**. No hay pausa, upgrade ni rotación.

### 4.2 Bóveda `CAWOC5VH…`
- **Portador del `code_hash`** — declared: cualquier cuenta que presente el SHA-256 fijado en el constructor. effective: **el primero** que lo presente (SEC-17). controlled_by: **desconocido**; el código no consta en el repositorio y se introduce en el navegador. revocable: **no**; `Claimed` es terminal. compromise_impact: **5.555 XLM** al primero que reclame. recovery_path: **inexistente** si se pierde el código (SEC-29). evidence_status: **documentado** (deploy `beb1ad83…`, source `arceus-deployer`, y `status` on-chain) / portador **desconocido**.

### 4.3 Disputes `CCEZO3DV…`
- **Resolver** — declared: fijado en constructor. effective: `suite-admin` (**verificado** por sonda #1 vs #2). controlled_by: keystore local; titular desconocido. revocable: **no**. compromise_impact: publicación de `outcome_hash` falsos; no mueve fondos, pero contamina el historial (SEC-10). recovery_path: **inexistente**. evidence_status: **verificado**.

### 4.4 Refunds `CCMLBZ3U…`
- **Proposer / counterparty** — declared y effective: roles por propuesta; `execute` pagadero a un recipient elegido por el proposer. controlled_by: claves de las partes; desconocidas. revocable: N/A; `revoke` solo mientras `Pending`. compromise_impact: desvío del reembolso mediante un digest no vinculado al recipient (SEC-18). recovery_path: `revoke` antes de `approve`; **inexistente** después. evidence_status: **verificado** (código + 14.2).

### 4.5 Recovery `CBCJFISH…`
- **Proposer / counterparty** — declared y effective: roles por propuesta; `recover` es permissionless y devuelve al proposer. revocable: N/A. compromise_impact: auto-bloqueo con `expires_at` arbitrario (SEC-19); el caller de `recover` nunca recibe fondos. recovery_path: `recover` tras el vencimiento. evidence_status: **verificado**.

### 4.6 Arbitration `CBPZKX3I…`
- **Resolver** — declared: fijado en constructor. effective: `suite-admin` (**verificado**). controlled_by: keystore local; titular desconocido. revocable: **no**. compromise_impact: `Release`/`Refund`/`Split` arbitrario desde el mismo ledger del depósito, y bloqueo indefinido si no firma (SEC-01/06). recovery_path: **inexistente**. evidence_status: **verificado**.

### 4.7 Milestones `CCNJVQLI…`
- **Resolver** — declared: constructor. effective: `suite-admin` (**verificado**). revocable: **no**. compromise_impact: decisión sobre el hito disputado, anulable por `recover` (SEC-02). recovery_path: `recover` permisionless tras deadline, pero rompe la máquina de estados. evidence_status: **verificado**.
- **Proposer / recipient** — por acuerdo; titular desconocido; `recover` devuelve al proposer.

### 4.8 Panel `CCFRBPLV…`
- **Árbitros del caso 1** — declared: 3 designados por quien fondea. effective: `arceus-approver`, `cc2026-new`, `voltx-deployer` (**verificado** on-chain). controlled_by: **las tres claves del mismo keystore**; no se asume independencia. revocable: **no**. compromise_impact: liquidación unilateral por el fondeador (SEC-03) y veto por abstención (SEC-05). recovery_path: devolución al proposer por `NoQuorum` tras `reveal_deadline`; no protege al recipiente. evidence_status: **verificado** (direcciones) / independencia **desconocida**.
- **Admin global**: no existe; `resolve` es permissionless.

### 4.9 Streaming `CA7T6F6C…`
- **Payer / recipient** — por stream; `pause`/`resume` solo payer, `claim` solo recipient, `close` permissionless. revocable: N/A. compromise_impact: el payer puede congelar un stream; el recipient solo reclama lo devengado. recovery_path: `cancel` con liquidación exacta. evidence_status: **verificado**. Sin autoridad global ni admin.

### 4.10 Subscription `CBOHLODI…`
- **Resolver** — declared: constructor. effective: `suite-admin` (**verificado**). revocable: **no**. compromise_impact: decisión sobre periodos disputados. evidence_status: **verificado**.
- **Payer** — declared: `fund_period`, `approve`, `cancel_plan`. effective: igual; `cancel_plan` bloquea nuevos periodos pero **no reembolsa** los financiados (SEC-07). recovery_path: **inexistente** para `Funded`/`Submitted`.

### 4.11 Reputation `CDSKVD2H…`
- **Authority** — declared: constructor. effective: `suite-admin` (**verificado** por sonda #6 vs #2). revocable: **no** (SEC-11). compromise_impact: suspender identidades, escribir outcomes falsos, habilitar fuentes. recovery_path: **inexistente**; requiere redespliegue. evidence_status: **verificado**.
- **Authorized sources** — declared: contratos habilitados por `authorize_source`. effective: **Panel** y **Subscription** (**verificado** por simulación: `record_case` avanza; un EOA devuelve #2). revocable: **no**. compromise_impact: suplantación de `source` y fabricación de outcomes (SEC-12/14). recovery_path: **inexistente**. evidence_status: **verificado**.

### 4.12 Traceability `CA4CVK4X…`
- **Authority** — declared: constructor. effective: `suite-admin` (**verificado** por simulación de `authorize_writer`). revocable: **no**. compromise_impact: enlazar ciclos falsos o con hashes replayados (SEC-13). recovery_path: **inexistente**. evidence_status: **verificado**.
- **Authorized writers** — efectivos: **ninguno** además de la authority (**verificado**: panel, subscription y un EOA devuelven #2). No hay transacción `authorize_writer` registrada.

### 4.13 SAC nativo XLM `CDLZFC3S…`
- Sin autoridad de aplicación: es el asset fijado en todos los constructores. No hay admin propio que el protocolo controle. **GO**. Dependencia: red Stellar.

## 5. Deployer y permisos residuales

| Contrato | Deployer observado | Evidencia | Permisos residuales del deployer |
|---|---|---|---|
| Bóveda | `arceus-deployer` | **verificado** (tx `beb1ad83…`, source_account de Horizon) | Ninguno: el `code_hash` es la única autoridad |
| Reputation, Traceability | `suite-admin` | documentado (comandos de despliegue) | Sí: es además la `Authority` fijada en el constructor |
| Otros 10 | `arceus-deployer` | documentado (comandos); hashes de despliegue no capturados para las primeras iteraciones de ECSTASY | Ninguno salvo que el propio deployer sea la autoridad (no es el caso de los resolvers verificados) |

**Hallazgo operativo 14.3-B (Medium, abierto):** los hashes de despliegue de las primeras iteraciones de ECSTASY (`CB7IX`, `CBX2`, `CARK`, `CDG4`) no fueron capturados en el log (`docs/TESTNET_TRANSACTIONS.md:33-47`). El WASM on-chain coincide con el local, pero **la identidad del deployer de esas iteraciones no es verificable desde el registro público del proyecto**.

## 6. Revocación, compromiso y recuperación

| Mecanismo | Estado real |
|---|---|
| Revocar fuentes/escritores de registros | **Inexistente** (SEC-11). No hay `deauthorize_*` ni eventos de autorización (SEC-32). |
| Rotar resolver | **Inexistente**. Fijado en constructor; requiere redesplegar y actualizar 12 IDs y variables de entorno. |
| Pausa de emergencia global | **Inexistente** en los 12 contratos. `pause` de Streaming es por stream y la ejerce el payer, no es un control de incidentes. |
| Recuperación de clave comprometida | **Inexistente**. No hay multisig, timelock ni sustitución de autoridad. |
| Retirar fondos tras incidente | Solo donde hay ruta contractual: `cancel`/`recover`/`claim`. En Arbitration, Subscription `Funded`, ECSTASY `Completed` y Bóveda sin código, **no hay ruta**. |
| Continuidad ante compromiso de `suite-admin` | **Una sola clave afecta 6 contratos** (4 resolvers + 2 authorities). No hay segmentación de autoridades. |

## 7. Dependencias operativas

| Dependencia | Uso | Estado / evidencia |
|---|---|---|
| SAC nativo XLM | Único asset de custodia en los 12 contratos | verificado; `CDLZFC3S…` |
| RPC `soroban-testnet.stellar.org` | Simulación y envío de todas las operaciones | `/api/status` reporta `rpc: healthy`, latestLedger 5.957.168 |
| Horizon `horizon-testnet.stellar.org` | Confirmación de hashes y trazas de error | verificado en todas las misiones |
| Stellar Expert | Enlaces públicos de evidencia | verificado; URLs fijas a Testnet (SEC-24) |
| Freighter | Firma de wallet en el flujo E2E | 9/9 owner-confirmed, sin hashes por escenario adjuntos |
| Netlify Blobs | Idempotencia del pagador | `blobsAvailable: true` |
| Netlify Functions | Coordinador de pago Testnet-only | verificado en `/api/status` y txs G1/G2 |
| Stellar CLI 30.0.1 / Rust 1.99.1 / SDK 29.0.0 | Build, despliegue y harness | verificado en CI |
| GitHub Actions | CI de 12 contratos + harness adversarial | verificado en `.github/workflows/ci.yml` |
| Keystore local | Control de todas las claves operativas | verificado; **titularidad legal desconocida** |

## 8. Riesgos que siguen abiertos (trasladados sin cambios)

Los 33 hallazgos de `docs/SECURITY_REVIEW_14_1.md` y los 18 escenarios reproducidos en `docs/ADVERSARIAL_TESTING_14_2.md` permanecen **abiertos**. Adicionalmente:

- **14.3-A** (Informational): los 3 árbitros del panel son claves del mismo entorno; independencia no demostrada.
- **14.3-B** (Medium): hashes de despliegue de ECSTASY no capturados; deployer no verificable públicamente.
- **14.3-C** (High, operativo): concentración de 6 autoridades en una sola clave (`suite-admin`) sin revocación ni rotación.

## 9. Veredicto por componente

| Componente | Veredicto | Justificación |
|---|---|---|
| SAC XLM | **GO** | Asset canónico, sin permisos de aplicación |
| Streaming | **CONDITIONAL GO** | Sin High; requiere TTL/revocación documentada antes de fondos reales |
| Refunds, Recovery | **CONDITIONAL GO** | Sin High; SEC-18/19 abiertos |
| ECSTASY, Bóveda, Disputes, Arbitration, Milestones, Panel, Subscription, Reputation, Traceability | **NO-GO** | High reproducidos (SEC-01…04), autoridades irrevocables o fondos sin ruta de salida |

**Veredicto global: NO-GO para Mainnet.** No hay remediaciones aplicadas en esta fase; este documento es un inventario de riesgo, no un plan de corrección ejecutado.

## 10. Siguiente paso

Diseñar la remediación **por riesgo**, no por parche aislado: empezar por la concentración de autoridad (14.3-C), las rutas de salida de fondos (SEC-01/02/07/29) y la independencia del panel (SEC-03 / 14.3-A), con verificación posterior de que el comportamiento inseguro queda **impedido**.
