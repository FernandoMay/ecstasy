# Subscription & Recurring Escrow Protocol

Contrato independiente `contracts/subscription`. Obligaciones recurrentes con periodos financiados explícitamente. **No hay cobros automáticos ni allowance ilimitado**: sin depósito firmado no existe deuda ejecutable contra el pagador.

## Ciclo

```text
create_plan (solo términos, sin fondos) → Plan activo
   └─ fund_period (depósito XLM firmado por el pagador) → Funded
        ├─ submit_delivery (digest del destinatario) → Submitted
        │    └─ approve (pagador) → Approved (terminal)
        └─ dispute (cualquiera de las partes) → Disputed
             └─ resolve_dispute (resolver) → Approved | Refunded
cancel_plan → los periodos ya financiados siguen ejecutables; los nuevos se rechazan
```

## Reglas

- `period_id` único por plan; un duplicado falla con `DuplicatePeriod` (#6).
- `fund_period` transfiere exactamente `plan.amount` en stroops y exige `due_at` futuro (#8).
- `approve` solo paga el importe del periodo. Los fondos de otros periodos nunca se liberan.
- `cancel_plan` no borra obligaciones financiadas: los periodos existentes pueden entregarse, aprobarse o disputarse.
- `resolve_dispute` solo el resolver designado; terminal (#2/#3).
- `amount > 0` y `frequency` entre 1 y 31.536.000 s (#4/#5).
- `get_periods` devuelve el historial completo de periodos del plan.

## Integración con los registros

El contrato emite `SubscriptionEvent` con `plan_id` y `period_id` como topics. La integración con el Reputation Registry y el Traceability Registry se hace con transacciones explícitas de la autoridad, usando el hash real de la liquidación como `settlement_tx`: el contrato no puede conocer el hash de su propia transacción y no debe inventar un identificador. Así se mantiene la trazabilidad verificable sin comprometer la honestidad del dato.

## Evidencia real

Contrato `CBOHLODIJJZ7ABFVBQSFDJ3DFVWMA4GZEDBYVVSHBCQIEWWCMAWVABRZ`, wasm `80ca7661fe12329a69179ea098618de6bbd405ab415f1ee71ce47327f4b225e2`. Once transacciones confirmadas en Horizon y seis tests Rust. Plan 1: periodo 1 aprobado (1,000,000 al destinatario), periodo 2 disputado y devuelto (1,000,000 al pagador), saldo final 0. Intento de financiar el periodo 3 tras cancelar rechazado en simulación (#7), sin hash. Vista pública `/subscriptions`.

## Límites

- Los digests de entrega y motivo son compromisos criptográficos, no pruebas de que el servicio fuera correcto.
- El resolver decide la disputa; no se afirma que su decisión sea la verdad.
- La cancelación depende del pagador; no hay pausa de emergencia centralizada.
