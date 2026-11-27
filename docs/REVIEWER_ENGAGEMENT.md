# Encargo de revisión externa independiente — Misión 15.1

> **No se ha seleccionado ni contratado ningún revisor.** Este documento define el encargo y el registro que se completará cuando exista uno. **No es un informe de auditoría** y no debe presentarse como auditoría ya realizada hasta recibir el informe firmado del revisor.

## 1. Perfil exigido (requisitos no negociables)

El revisor debe acreditar experiencia **demostrable** en las cuatro áreas siguientes:

| Área | Evidencia mínima exigible |
|---|---|
| **Soroban** | Trabajo previo con `soroban-sdk` 29.x; dominio del modelo de autorizaciones (`require_auth`, firmas de contrato vs EOA), `instance()` vs storage persistente, TTL/archivado, `Budget/ExceededLimit`, SAC nativo |
| **Rust** | Auditoría de código `no_std`, macros `contract*`, manejo de `Result`, `checked_*`, `panic = abort` y perfiles de compilación |
| **Seguridad de contratos** | Historial verificable en commit-reveal, control de reentrada, autoridad cruzada, máquinas de estados, DoS por crecimiento de storage y conservación de fondos |
| **Migración de activos** | Experiencia en contratos inmutables sin `upgrade`, migración de saldos, reconciliación exacta en stroops y distinción entre rollback de software y reversión económica |

**No suficiente:** revisión general de Solidity, pentest convencional de aplicación web, o revisión de frontend sin profundidad en Soroban.

## 2. Independencia y acceso

- El revisor **no debe haber implementado** los contratos, el harness ni las remediaciones propuestas.
- Debe declarar por escrito conflictos de interés, rol en el proyecto y cualquier participación financiera que condicione el informe.
- Se le entrega **acceso de solo lectura** a repositorio, documentación y red Testnet. **No se entregan claves privadas propias ni de terceros.**
- Puede cuestionar libremente los hallazgos, sus severidades, las reproducciones y las siete invariantes propuestas. Puede reportar hallazgos nuevos o declarar inconclusivos los casos que no pueda verificar.

## 3. Alcance del encargo

1. **Reproducción independiente de los cuatro High** (SEC-01 a SEC-04), con sus propios comandos y evidencia.
2. **Verificación de los 36 hallazgos y sus severidades**, confirmando, discrepando o reclasificando cada uno.
3. **Revisión crítica de las siete invariantes** de `docs/REMEDIATION_PLAN_14_4.md`, buscando contraejemplos, no solo validación.
4. **Reconstrucción de la discrepancia de procedencia de la bóveda**: relación entre el tx citado `beb1ad83…` y la instancia activa `CAWOC5VH…`, con tooling propio.
5. **Análisis de concentración de autoridad y migración de fondos**, incluyendo la bóveda de 5.555 XLM y los 1 XLM de ECSTASY.
6. **Informe final** con hallazgos, evidencia, limitaciones y recomendaciones.

Material de entrada: commits `8a28355`, `56e28ff`, `32086e4`, `95b0ba2`, tag `v1.0.0` (`86c2fa7`), `docs/EXTERNAL_REVIEW_PACKAGE_15_1.md`, `docs/review/manifest.json`, los cuatro documentos 14.1–14.4 y el harness `tests/adversarial/`.

## 4. Formato exigido del informe

| Sección | Contenido obligatorio |
|---|---|
| Resumen ejecutivo | Veredicto `GO` / `CONDITIONAL GO` / `NO-GO` **por componente** y global |
| Hallazgos | ID, severidad, evidencia, comandos de reproducción, estado (confirmado / discrepado / nuevo / inconcluso) |
| Los 36 hallazgos | Tabla de confirmación o disputa, una fila por hallazgo |
| Invariantes | Veredicto por invariante: sólida / requiere cambio / insuficiente, con contraejemplo si aplica |
| Procedencia | Resultado de la reconstrucción de la bóveda y de los 12 contratos |
| Autoridad y migración | Riesgos de concentración, quién puede autorizar, contingencia sin autoridad comprometida |
| Limitaciones | Qué no pudo verificarse y por qué |
| Recomendaciones | Priorizadas, sin aplicar cambios |

## 5. Criterios de aceptación del informe

- Cada uno de los cuatro High se reproduce o se refuta con comandos propios del revisor.
- Toda afirmación distingue claramente: prueba local, verificación Testnet o confirmación del owner.
- No se aceptan afirmaciones sin hash, comando o referencia a documento.
- El informe declara explícitamente si las siete invariantes son falsables y si alguna es incorrecta.
- El informe no sustituye la decisión del owner sobre Mainnet ni autoriza la migración de fondos.
- Hasta recibirlo, ECSTASY **no se presenta como auditado**.

## 6. Registro de aceptación del revisor — PENDIENTE

Completar este bloque solo cuando exista un candidato aceptado. **Estado actual: PENDIENTE.**

| Campo | Valor |
|---|---|
| Nombre / organización | `PENDIENTE` |
| Contacto | `PENDIENTE` |
| Evidencia Soroban (enlaces) | `PENDIENTE` |
| Evidencia Rust / contratos (enlaces) | `PENDIENTE` |
| Evidencia migración de activos (enlaces) | `PENDIENTE` |
| Declaración de conflictos | `PENDIENTE` |
| Alcance aceptado (sección 3) | `PENDIENTE` |
| Fecha de inicio / entrega prevista | `PENDIENTE` |
| Referencia de aceptación firmada | `PENDIENTE` |
| Estado | **PENDIENTE — sin revisor asignado** |

## 7. Rúbrica de evaluación de candidatos

| Criterio | Peso |
|---|---:|
| Profundidad en Soroban y modelos de autorización | 30 % |
| Seguridad de contratos y Rust `no_std` | 25 % |
| Trayectoria en auditorías de contratos | 20 % |
| Experiencia en migración de activos inmutables | 15 % |
| Independencia y declaración de conflictos | 10 % |

Un candidato que no acredite el área de Soroban queda descartado aunque destaque en las demás.

## 8. Estado actual de ECSTASY

| Elemento | Estado |
|---|---|
| V1.0.0 | Preservada |
| Hallazgos abiertos | 36 |
| Revisión externa | **Pendiente — sin revisor asignado** |
| Fondos | Sin mover (1 XLM ECSTASY, 5.555 XLM bóveda) |
| V2 | Diseño pendiente de validación |
| Mainnet | **NO-GO** |

**Siguiente hito:** obtener y documentar la aceptación del revisor. Después, incorporar sus observaciones a `docs/REMEDIATION_PLAN_14_4.md` y solo entonces autorizar 15.2 con una línea base de seguridad revisada. No se escribe código de remediación hasta que un tercero independiente haya cuestionado las hipótesis de diseño.
