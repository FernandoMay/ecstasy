# Fase 14.4 — Diseño de remediación por riesgo

> **Fase de diseño únicamente.** No se modificó ningún contrato, no se desplegó nada y **ninguno de los 36 hallazgos se cierra aquí**. Los 33 hallazgos de `SECURITY_REVIEW_14_1.md`, los 18 escenarios reproducidos en `ADVERSARIAL_TESTING_14_2.md` (todos abiertos) y los 3 riesgos operativos de `MAINNET_READINESS_14_3.md` se trasladan sin rebajar severidades. No se sacrifican fondos existentes ni se altera `v1.0.0`.
>
> Hecho verificado en esta fase: **ninguno de los 12 contratos expone `upgrade`, `set_code` ni función de administración del código**. No existe autoridad de actualización WASM. Toda corrección on-chain exige una nueva instancia y, donde haya saldo, una migración de fondos.

## 1. Los 36 hallazgos y su vía de remediación

| Vía | Hallazgos | Destino |
|---|---|---|
| **R1 — Salidas de fondos (P0)** | SEC-01, SEC-02, SEC-04, SEC-26, SEC-29, SEC-07 | Contratos nuevos con máquinas de estados corregidas |
| **R2 — Autoridad y gobernanza (P0)** | SEC-11, 14.3-A, 14.3-C | Módulo de gobernanza con roles separados, revocación y rotación |
| **R3 — Panel e independencia (P0)** | SEC-03, SEC-05, SEC-20 | Panel co-firmado, pool de árbitros elegibles, commit-reveal con dominio |
| **R4 — Storage y DoS (P1)** | SEC-09, SEC-22 | Storage persistente por clave, límites, paginación y TTL |
| **R5 — Registros y proveniencia (P1)** | SEC-12, SEC-13, SEC-14, SEC-31, SEC-32, 14.3-B | Registros con `source` auténtico, unicidad de hash, eventos y cadena de despliegue |
| **R6 — Integridad de datos de entrada (P1)** | SEC-06, SEC-08, SEC-10, SEC-17, SEC-18, SEC-19, SEC-25, SEC-27, SEC-28 | Digest canónico, plazos vinculantes, límites y eventos completos |
| **R7 — Cliente y configuración (P2)** | SEC-15, SEC-16, SEC-23, SEC-24 | Verificación RPC en tiempo real, fail-closed y URLs por red |
| **R8 — Defensa en profundidad (P2)** | SEC-21, SEC-30, SEC-33 | Efectos antes de transferencias externas y allowlist de asset |

## 2. Matriz `finding → root cause → proposed change → invariant → adversarial regression test`

| ID | Root cause | Cambio propuesto | Invariante demostrable | Test adversarial de regresión |
|---|---|---|---|---|
| SEC-01 | Resolver único sin plazo ni salida alternativa | Ventana `resolve` entre `respond_by` y `resolve_by`; `default_refund` permisionless tras `resolve_by` | Todo caso `Open` tiene salida determinista a lo sumo en `resolve_by`; `resolve` antes de `respond_by` → `TooEarly` | Avanzar ledger, `default_refund` por outsider, rechazar `resolve` posterior y doble salida |
| SEC-02 | `recover` excluye solo estados terminales | `Disputed` congelado; `Submitted` sin disputa paga al recipient tras deadline; disputa con resolver ausente → `timeout_refund` al proposer | **`Disputed` nunca transiciona a `Recovered` mediante llamada permissionless** | `recover` sobre `Disputed` → error; sobre `Submitted` → error; las tres salidas legítimas siguen funcionando |
| SEC-03 | El fondeador elige árbitros y recipient | `create` exige `counterparty.require_auth()`; árbitros deben pertenecer a un registro de elegibles; prohibido nombrar >1 clave bajo mismo operador | El conjunto de árbitros requiere firma de ambas partes; ninguna cuenta controla ≥2 árbitros | Crear sin firma de la contraparte → `NotAuthorized`; panel controlado por el fondeador → `InvalidPanel` |
| SEC-04 | `retirar` usa el saldo global menos `ReservedStake` | Ledger `surplus[encounter_id]` atribuido en cada depósito; `retirar` solo del encounter propio | `retirable(caller) == Σ surplus[encounters de caller]`; nunca se retira excedente ajeno | Creador de encounter con `stake=0` intenta retirar depósito directo → `NotAuthorized`; retiro legítimo sigue disponible |
| SEC-05 | Un no-revelado fuerza `NoQuorum` | `replace_arbitrator` desde el pool antes de cerrar; quórum sobre votos revelados con mínimo 2 | Una abstención no puede cambiar el resultado económico | Dos votos discrepantes + una abstención → reemplazo y resolución, no devolución automática |
| SEC-06 | `respond_by` no limita `resolve` | Comprobar `now > respond_by` en `resolve` | Ninguna resolución puede ocurrir durante el plazo de argumentos | `resolve` en el mismo ledger que `deposit` → `TooEarly` |
| SEC-07 | Periodos `Funded`/`Submitted` sin salida temporal | `deadline_refund` tras `due_at` si no hay entrega ni disputa; `timeout_refund` tras disputa sin resolver | Todo periodo no terminal tiene exactamente una salida temporal | Fondear, cancelar plan, avanzar tiempo, recuperar al pagador; doble salida rechazada |
| SEC-08 | `frequency` y `due_at` inertes | `period_id` secuencial; `due_at >= previous_due_at + frequency` | El calendario del plan es observable y vinculante | `fund_period` con `period_id` salta o `due_at` adelantado → `InvalidPeriod` |
| SEC-09 | Todo registro en una entrada de instancia | Storage persistente por clave, `MAX_RECORDS`, paginación, `extend_ttl` | El tamaño de la entrada de instancia es constante en el número de registros | 10.000 registros y después una escritura legítima exitosa; consulta paginada correcta |
| SEC-10 | `open` sin vínculo con encounter | Exigir prueba de pertenencia y bond reembolsable por disputa | Solo una parte del encounter puede abrir disputa; el spam tiene coste | `open` por tercero → `NotAuthorized`; 100 disputas falsas rechazadas |
| SEC-11 | Sin revocación de fuentes ni rotación | `RoleRegistry` con `grant`, `revoke`, `rotate` y eventos | Una fuente revocada deja de poder escribir en el mismo ledger | `revoke_source` y escritura posterior → `NotAuthorized`; rotación sin perder registros |
| SEC-12 | `ensure_writer` valida `caller`, no `source` | `source` debe igualar `caller` o estar en el conjunto autorizado | Un registro atribuido a X solo puede escribirlo X | `record_case` etiquetando otro `source` → `NotAuthorized` |
| SEC-13 | `settlement_tx` sin unicidad | Mapa `hash → agreement_id`; segundo enlace rechazado | Un hash de liquidación solo puede vincularse a un acuerdo | Replay del mismo hash en otro acuerdo → `DuplicateRecord` |
| SEC-14 | Outcome arbitrario sobre `case_id` inexistente | Digest canónico con `case_id`, `source`, `outcome` y firma de la fuente | Todo outcome registrado corresponde a un caso existente en la fuente | `case_id=999999` → `NotFound`; digest alterado → `CommitmentMismatch` |
| SEC-15 | UI marca "Verified" por regex | Llamada `getTransaction` y comparación de `successful` antes de mostrar "Verified" | "Verified" implica confirmación RPC en la sesión actual | Test con RPC simulado: tx inexistente → "No verificado" |
| SEC-16 | IDs auxiliares sin validar | Regex para los 12 IDs y fail-closed en mainnet | Configuración inválida lanza error antes de renderizar | ID malicioso en env → `getConfig` lanza |
| SEC-17 | Bóveda por portador de hash | Compromiso/revelación o destinatario enlazado; bond al reclamar | Solo el reclamante vinculado puede recibir el saldo | Atacante con el hash pero sin vínculo → `NotAuthorized` |
| SEC-18 | `intent_hash` opaco | Digest canónico on-chain de `amount`, `recipient`, `counterparty` y dominio | El digest aprobado describe exactamente esos campos | Reutilizar el digest con otro recipient → `IntentMismatch` |
| SEC-19 | `expires_at` sin cota | `expires_at <= now + MAX_DURATION` y `revoke` previo | Ningún proposal puede auto-bloquear más allá del máximo | Proposal a 100 años → `InvalidExpiry` |
| SEC-20 | Sin separador de dominio; `u32→u8` | Tag `ECSTASY-PANEL-v2` + contract ID en el digest; sin truncamiento | Un commitment de otro protocolo o versión es rechazado | Commitment de v1 en v2 → `CommitmentMismatch` |
| SEC-21 | Estado escrito tras llamada externa | Patrón checks-effects-interactions y allowlist de SAC | El estado terminal se persiste antes de cualquier `transfer` | Token reentrante simulado → pago único |
| SEC-22 | Sin `extend_ttl` | Extensión en cada escritura y lectura crítica | Un flujo de larga duración sigue legible | Ledger envejecido 1 año → `claim` funciona |
| SEC-23 | `catch` único y `Promise.all` | Estado de error por llamada y renderizado explícito | Fallo RPC nunca se muestra como "sin datos" | RPC caído → mensaje "registro no disponible" |
| SEC-24 | URLs fijas a testnet | `explorerBaseUrl` y `network` de config | Los enlaces apuntan a la red activa | Config mainnet → URL mainnet |
| SEC-25 | `reason_hash` descartado | Incluirlo en el evento con `until` y autoridad; tope de duración | La suspensión es auditable desde el evento | Inspección de evento: contiene `reason`, `until`, `authority` |
| SEC-26 | `Completed` sin salida | `settle_timeout` permisionless tras ventana de finalización | Todo encounter no terminal tiene salida | Ambas completan, nadie firma, timeout liquida |
| SEC-27 | `terms_hash` solo del creador | Ambas partes comprometen el mismo hash antes de `accept` | El settlement usa el hash acordado por ambos | Hash distinto al comprometido → `TermsMismatch` |
| SEC-28 | Código de error incorrecto | `NotAuthorized` en `reject` | El ABI distingue autorización de estado | Llamada no autorizada devuelve #2 |
| SEC-29 | Bóveda sin rescate | `funder_refund` con timelock si nadie reclama | Los fondos siempre tienen una ruta de salida legítima | Sin código tras timelock, el fondeador recupera |
| SEC-30 | Balance pool sin invariante por registro | Reserva por caso/periodo | `Σ reservas <= balance del contrato` | Intento de sobrepago rechazado por reserva insuficiente |
| SEC-31 | Sin `get_vote` | Getter de `VoteRecord` | La participación es consultable on-chain | Lectura del digest de participación |
| SEC-32 | Eventos insuficientes | Eventos en `authorize_*` y `subject` como topic | Cambios de autoridad indexables | Evento de revocación con topic de identidad |
| SEC-33 | Flag escrito tras transferencia | Misma regla que SEC-21 | Ídem SEC-21 | Ídem SEC-21 |
| 14.3-A | Tres árbitros del mismo keystore | Pool de elegibles con claves custodiadas por operadores distintos y atestación | Ningún operador controla ≥2 árbitros | Nombrar dos claves del mismo operador → `InvalidPanel` |
| 14.3-B | Hashes de despliegue no capturados | Script de reconstrucción decodificando `create_contract_v2` de las cuentas deployer y tabla de procedencia | Los 12 contratos tienen tx de despliegue, deployer y commit fuente verificables | El script reproduce los 12 IDs desde el ledger |
| 14.3-C | Seis autoridades en una clave | Gobernanza 2/3 con roles separados, `revoke`/`rotate` y timelock | Ninguna EOA posee más de un rol crítico; la revocación es inmediata | Clave comprometida revocada → las 6 acciones fallan en el mismo ledger |

## 3. Diagrama de autoridad: antes / después

**Antes (verificado en 14.3):**
```text
suite-admin (GBQV7…)
 ├── resolver: disputes
 ├── resolver: arbitration
 ├── resolver: milestones
 ├── resolver: subscription
 ├── authority: reputation
 └── authority: traceability
arceus-deployer ──> deploy de 10 contratos (sin permisos residuales salvo bóveda)
panel ──> 3 árbitros = 3 claves del mismo keystore (arceus-approver, cc2026-new, voltx-deployer)
```

**Después (propuesto):**
```text
Governance (contrato nuevo, 2 de 3)
 ├── miembros: 3 claves con custodia separada y atestación
 ├── grant / revoke / rotate  (eventos indexados)
 └── roles delegados a cada contrato como dirección de rol, nunca a una EOA
       ├── RESOLVER → disputes, arbitration, milestones, subscription
       └── REGISTRY_AUTHORITY → reputation, traceability

Panel:
 ├── create co-firmado por payer y counterparty
 ├── árbitros seleccionados de un pool elegible (una clave por operador)
 └── commit-reveal con tag "ECSTASY-PANEL-v2" + contract ID
```

La gobernanza **no puede mover fondos directamente**: solo autoriza o revoca roles. Las salidas económicas siguen reglas por contrato con plazos y fallback permisionless.

## 4. Máquinas de estados corregidas

### Arbitration
```text
deposit → Open
Open --argue (antes respond_by)--> Open
Open --resolve (solo rol RESOLVER, respond_by < now <= resolve_by)--> Resolved
Open --default_refund (permisionless, now > resolve_by)--> Refunded
Terminales: Resolved, Refunded. Sin escape.
```

### Milestones
```text
Pending --submit--> Submitted
Submitted --approve--> Paid
Submitted --dispute--> Disputed
Pending --recover (tras deadline)--> Recovered
Submitted --settle_after_deadline (sin disputa)--> Paid
Disputed --resolve (rol RESOLVER)--> Paid | Refunded
Disputed --timeout_refund (tras dispute_deadline)--> Refunded
INVARIANTE: Disputed ∉ {recover}; Paid/Refunded/Recovered terminales.
```

### Panel
```text
create (firma de ambas partes) → Open
Open --commit (árbitros elegibles, antes commit_deadline)--> Open
Open --replace_arbitrator (pool, antes reveal_deadline)--> Open
Open --reveal (entre deadlines)--> Open
Open --quorum 2/3--> Resolved
Open --sin quórum tras reveal_deadline--> NoQuorum (devolución al proposer)
INVARIANTE: el fondeador no puede fijar el panel ni el resultado por sí solo.
```

### Subscription
```text
create_plan (sin fondos) → Activo
Activo --fund_period (firma del payer, secuencial)--> Funded
Funded --submit_delivery--> Submitted
Submitted --approve--> Approved
Funded|Submitted --dispute--> Disputed
Disputed --resolve--> Approved | Refunded
Funded|Submitted --deadline_refund--> Refunded
Activo --cancel_plan--> Cancelado (nuevos periodos bloqueados; financiados siguen con salida)
```

### ECSTASY
```text
Created --accept--> Accepted --complete×2--> Completed --settle--> Settled
Created --decline/cancel/expire--> Cancelled/Expired
Completed --settle_timeout (permisionless)--> Settled
retirar: solo surplus atribuido al encounter del caller, nunca saldo global
```

### Bóveda
```text
Funded --reclamar (reclamante vinculado + prueba)--> Claimed
Funded --funder_refund (tras timelock sin claim)--> Refunded
INVARIANTE: el saldo siempre tiene salida; el portador del hash no es automáticamente el dueño.
```

## 5. Análisis de compatibilidad

| Categoría | Hallazgos | Acción |
|---|---|---|
| **Corregible sin migrar** | SEC-15, SEC-16, SEC-23, SEC-24, SEC-32 (documentación y UI), 14.3-B (solo investigación) | Cambios en cliente/config/docs; ningún contrato se toca |
| **Requiere contrato nuevo (sin upgrade possible)** | SEC-01…14, SEC-17…22, SEC-25…31, SEC-33, 14.3-A/C | Nuevas instancias con el mismo patrón de contratos independientes; `v1.0.0` intacto |
| **Requiere migración de fondos** | ECSTASY (1 XLM), Bóveda (5.555 XLM) | Migración solo tras verificar la nueva instancia con fondos propios; la bóveda necesita además una ruta de rescate acordada porque el código es desconocido |
| **No hay autoridad de actualización WASM** | Los 12 contratos | Confirmado por inspección: cero funciones `upgrade`/`set_code`. No existe un "parche" aplicable a un contrato desplegado |

**Restricción de migración:** no se moverá ningún XLM hasta que (a) la nueva instancia pase la batería adversarial, (b) se verifique el saldo de origen y destino en Horizon, y (c) exista una transacción de rollback documentada. Los 5.555 XLM de la bóveda no se tocarán sin una decisión explícita del owner sobre el `code_hash`.

## 6. Plan de despliegue y rollback (precondiciones verificables)

1. **Congelar diseño** — este documento revisado; los 36 hallazgos siguen abiertos.
2. **Implementar en copia de los contratos** — sin tocar las rutas `contracts/*` desplegadas; nuevo prefijo `v2`.
3. **Harness adversarial v2** — cada invariante de la sección 2 como test; 18 escenarios antiguos + los nuevos deben pasar; los escenarios que antes se reproducían ahora deben ser rechazados.
4. **Revisión externa** — paquete de 14.1/14.2/14.3 + resultados v2 entregado a un auditor independiente.
5. **Despliegue Testnet de v2** — fondos propios, montos mínimos; verificar `successful: true` y reconciliación stroop.
6. **Feature flag en la app** — rutas v2 tras `NEXT_PUBLIC_*_V2_*`; comparar lecturas v1/v2.
7. **Migración (solo si aplica)** — transacción por contrato con saldo, doble verificación de balances.
8. **Rollback** — conservar v1 desplegado y financiado; el flag permite volver a v1 sin mover fondos. La migración es irreversible, por lo que su precondición es la revisión externa favorable.
9. **Mainnet** — decisión posterior y separada; NO-GO hasta cerrar los gates.

## 7. Riesgo residual y criterios de aceptación

| Riesgo residual tras la propuesta | Criterio de aceptación para cerrar el hallazgo |
|---|---|
| Gobernanza 2/3 puede coludir | Atestación de custodia separada y auditoría de claves; `revoke` probado en cadena |
| Resolver sigue siendo un rol de confianza | Ventana temporal + fallback permisionless verificados; ningún fondo sin salida |
| Migración de la bóveda | Decisión del owner sobre el `code_hash` + reconciliación de 5.555 XLM en Horizon |
| Storage persistente tiene coste | Prueba de 10.000 registros y medición de fees publicada |
| Cliente sin verificación en tiempo real | Test de RPC caído y de tx inexistente; "Verified" solo tras `getTransaction` |
| Proveniencia de despliegues | Los 12 IDs reproducidos por script desde transacciones `create_contract_v2` |

**Regla de cierre:** un hallazgo solo se cierra cuando el test adversarial correspondiente cambia de "ruta insegura ejecutada" a "ruta insegura rechazada", **y** las salidas legítimas siguen funcionando. Añadir una comprobación sin esa doble demostración no cuenta como remediación.

**Estado final de la fase: diseño completo, 36 hallazgos abiertos, Mainnet NO-GO.**
