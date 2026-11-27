# Reputation & Arbitration Registry

Contrato independiente `contracts/reputation`. Infraestructura de confianza reutilizable: registra actividad verificable sin convertir la reputación en una puntuación arbitraria.

## Principio

Votar con la mayoría **no demuestra la verdad**. El registro no afirma que un árbitro fuera "correcto"; solo almacena hechos comprobables ligados a un `case_id` y al contrato de origen.

## Funciones

| Función | Autoridad | Efecto |
|---|---|---|
| `register` | la propia identidad | Perfil con digest público y timestamp; una sola vez. |
| `record_case` | autoridad o fuente autorizada | Resultado ligado a `case_id` + contrato de origen; sin duplicados. |
| `record_vote` | autoridad o fuente autorizada | Digest de participación; **no revela el voto secreto**. |
| `suspend` | autoridad | Suspensión temporal con `until` explícito. |
| `get_profile` | cualquiera | Contadores de casos/votos, suspensión, sin score. |
| `get_eligibility` | cualquiera | Hecho binario: registrado y no suspendido. |

`authorize_source` permite a la autoridad habilitar contratos escritores. Los registros se rechazan con `NotAuthorized` (#2) si el escritor no está habilitado, con `DuplicateRecord` (#4) si ya existe y con `InvalidDuration` (#5) si la suspensión no es futura.

## Evidencia real

Contrato `CDSKVD2HNSYAF7VZ44UQ3B4MG5RZTO33MJSCY3PKDJW37JM7OM5JYR7P`, wasm `f19122fc720979b94e1249e9085f11e2da453a99842897d1fb77fbc515536bae`. Siete transacciones confirmadas en Horizon: autorizar fuente, dos registros, un resultado, dos participaciones y una suspensión. Cuatro tests Rust cubren autorización, integridad, duplicados y suspensiones. Vista pública `/reputation`.

## Límites

- Sin puntuaciones, rankings ni pesos subjetivos.
- Los digests de perfil/participación son compromisos criptográficos, no garantía de honestidad.
- La suspensión es temporal y la decide una autoridad explícita; no es un mecanismo de consenso.
