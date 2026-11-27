# Política de Panel V2 — definida antes del código

## Modelo elegido: Registry de árbitros elegibles + selección determinista

**No existe un parámetro `arbitrators` en `create`.** El fondeador no puede proponer, eligir ni influir en los árbitros de su caso. El panel sale de un registro on-chain de árbitros elegibles, atestados por un registrador independiente, y se selecciona de forma determinista con una semilla fijada en el momento de la solicitud.

## Separación de roles

| Rol | Quién | Función |
|---|---|---|
| Depositor | pagador | `create` deposita XLM; **no elige árbitros** |
| Requester | pagador o destinatario | `create` solicita el panel |
| Selector | cualquiera | `select_panel` ejecuta el algoritmo determinista; no puede alterar el resultado |
| Registrador | autoridad del registry | `attest` / `revoke` de elegibilidad y de controlador |
| Árbitros | seleccionados del registry | `commit` / `reveal` |
| Ejecutor | cualquiera | `resolve` calcula el quórum y liquida |

El llamador de `select_panel` y de `resolve` es irrelevante para el resultado.

## Invariantes

1. Un mismo `controller_hash` solo puede estar atestado en **una** dirección: `DuplicateController`.
2. El panel contiene tres direcciones **distintas** y tres controladores **distintos**.
3. La lista elegible se **congela en `create`** (`eligible_snapshot`); cambios posteriores en el registry no alteran el caso.
4. La semilla se fija en `create` con `timestamp || sequence || case_id`; la selección es reproducible por cualquiera desde esos datos.
5. `commit` antes de `commit_deadline`; `reveal` entre `commit_deadline` y `reveal_deadline`; digest con tag `ECSTASY-PANEL-V2`, contract ID, `case_id`, decisión `u32`, secreto y dirección del árbitro.
6. Quórum 2/3 → Release / Refund / Split; sin quórum → **Refund al pagador**. Nunca al árbitro ni al último votante.
7. `Resolved` y `NoQuorum` son terminales: no hay settlement doble.

## Riesgo residual

El registrador es una autoridad de confianza: decide qué identidades son elegibles y qué controlador representa. El contrato **no demuestra identidad legal**, solo que una dirección fue atestada por esa autoridad. La independencia real depende de que los atestados correspondan a operadores distintos; esto es verificable en el registry pero no es automatizable criptográficamente.
