# Política económica de Arbitration V2 — definida antes del código

Contrato independiente `contracts/arbitration-v2`. V1 permanece desplegado e intacto. Esta política es **conocida por ambas partes antes de depositar** y está codificada en el contrato; no es una decisión discrecional posterior al incidente.

## 1. Línea de tiempo

```text
deposit ──► [0, respond_by] ──► (respond_by, resolve_by] ──► (resolve_by, ∞)
            argumentos          resolver puede decidir        cualquiera puede timeout
```

- `respond_by > now` y `resolve_by > respond_by` se validan en `deposit`.
- Los digests de evidencia solo se aceptan en `[0, respond_by]`.
- `resolve` solo entre `respond_by` y `resolve_by`.
- `timeout` solo después de `resolve_by`.

No hay solapamiento: un `resolve` y un `timeout` no pueden ser válidos en el mismo instante. Si ambos se envían, el primero en orden de ledger gana y el segundo encuentra un estado terminal y es rechazado.

## 2. Salidas deterministas

| Escenario | Salida | Código | Justificación |
|---|---|---:|---|
| Resolver decide dentro de la ventana | Ejecuta su decisión: Release / Refund / Split | 1 / 2 / 3 | Autoridad designada, acotada a las tres salidas y a las dos partes |
| Resolver ausente, **ambas** partes presentaron evidencia | **Split** 50/50 | 3 | Ninguna parte puede ser preferida; ambas comparecieron |
| Resolver ausente, **solo proponente** presentó evidencia | **Refund** al proponente | 2 | La contraparte no respondió |
| Resolver ausente, **solo destinatario** presentó evidencia | **Release** al destinatario | 1 | El proponente no impugnó |
| Resolver ausente, **ninguna** evidencia | **Refund** al proponente | 2 | No hay reclamación que atender; vuelve al origen |
| Resolver comprometido | Puede elegir Release / Refund / Split dentro de la ventana | 1 / 2 / 3 | Riesgo residual: la autoridad sigue siendo de confianza. Se limita su poder: no puede pagar a terceros, no puede actuar fuera de ventana y no puede liquidar dos veces. La eliminación total de confianza corresponde al Panel V2 (15.4) |

El `timeout` **no es una puerta trasera**: su resultado depende de la evidencia registrada antes de `respond_by`, no de una preferencia del llamador. El llamador del `timeout` es irrelevante para la decisión.

## 3. Invariantes

1. **Conservación exacta:** `pago_total == depósito`; el saldo del contrato para el caso es 0 tras la terminal.
2. **Liquidación única:** `Resolved` y `TimedOut` son terminales; cualquier segunda intento de `resolve`, `timeout` o pago falla.
3. **Autoridad acotada:** solo el resolver puede `resolve`, y solo dentro de la ventana; nadie puede pagar a una dirección distinta de `proposer` o `recipient`.
4. **Sin bloqueo indefinido:** todo casoOpen tiene una salida ejecutable a lo sumo en `resolve_by` + 1 transacción de `timeout`.
5. **Split determinista:** `recipient` recibe `amount / 2`; `proposer` recibe `amount - amount / 2` (el stroop impar, si lo hay, al proponente).
6. **Precedencia temporal:** `resolve` antes de `respond_by` → `TooEarly`; `timeout` antes de `resolve_by` → `DeadlineNotPassed`. Ninguna resolución puede adelantarse a la evidencia.
7. **Trazabilidad:** cada transición emite `CaseEvent` con `case_id` como topic; cada digests queda vinculado al caso y a la parte.

## 4. Qué NO se promete

- No se afirma que los digests sean verdad ni que el resolver sea honesto.
- No se elimina la confianza en el resolver en esta versión; se hace **limitada, auditable y con salida independiente**.
- No se mueven fondos de V1 ni se altera `v1.0.0`.
