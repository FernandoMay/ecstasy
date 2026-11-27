# Registro de discrepancias del revisor — plantilla

> **Estado: SIN ENTRADAS.** El revisor independiente aún no ha sido seleccionado ni ha entregado informe.
>
> Regla: **los 36 hallazgos originales son inmutables**. Si el revisor propone cambiar una severidad, reclasificar un hallazgo, declararlo no reproducible o añadir uno nuevo, **no se sobrescribe** el registro original: se añade una entrada aquí con su justificación y evidencia. El conjunto "hallazgo original + discrepancia" es lo que se entrega a un segundo revisor.

## Esquema de cada entrada

| Campo | Obligatorio | Descripción |
|---|---|---|
| `entry_id` | sí | `D-001`, `D-002`, … secuencial |
| `finding_id` | sí | `SEC-01`…`SEC-33`, `14.3-A/B/C` o `NUEVO` |
| `reviewer` | sí | Identidad profesional del revisor (según `manifest.json`) |
| `review_date` | sí | Fecha del informe o comunicación escrita |
| `original_severity` | sí | Severidad en `docs/SECURITY_REVIEW_14_1.md` o `MAINNET_READINESS_14_3.md` |
| `proposed_severity` | sí | Severidad propuesta, o `confirmada` / `no reproducible` / `nuevo` |
| `discrepancy_type` | sí | `severidad` / `reproducción` / `nuevo hallazgo` / `invariante` / `procedencia` |
| `justification` | sí | Argumento técnico del revisor |
| `evidence` | sí | Comandos, hashes, capturas o referencias a documentos; **no vale una conclusión verbal** |
| `status` | sí | `propuesta` / `aceptada por el owner` / `rechazada con justificación` |
| `source_report` | sí | Referencia al informe escrito firmado |

## Entradas

| entry_id | finding_id | reviewer | review_date | original_severity | proposed_severity | discrepancy_type | justification | evidence | status | source_report |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | **SIN ENTRADAS** | — |

## Notas de preservación

- `docs/SECURITY_REVIEW_14_1.md`, `docs/ADVERSARIAL_TESTING_14_2.md`, `docs/MAINNET_READINESS_14_3.md` y `docs/REMEDIATION_PLAN_14_4.md` permanecen como fueron congelados en el tag `review-package-v1.0`.
- La severidad "revisada" que aparece en los informes internos se mantiene solo como hipótesis; no reemplaza la severidad original.
- Cualquier cambio posterior al paquete se documenta como **material complementario**, nunca como edición del dossier congelado.
