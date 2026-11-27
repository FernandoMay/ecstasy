# Streaming Payments Protocol

Contrato independiente `contracts/streaming`. Pago continuo por tiempo con XLM real (SAC nativo). El devengo usa **el timestamp del ledger**, nunca el reloj del navegador.

## Ciclo

```text
create_stream (depósito == tasa × duración) → Active
   ├─ claim (solo lo devengado, sin duplicados)
   ├─ pause → Paused → resume → Active
   ├─ cancel → Cancelled  (devengado al destinatario, remanente al pagador)
   └─ close  → Closed     (solo si withdrawn == deposit)
```

## Reglas económicas

- Todo en stroops enteros. `deposit` debe ser exactamente `rate × duration`; se rechaza otro valor con `InvalidAmount` (#4).
- `duration` entre 1 y 31.536.000 segundos (un año); fuera de rango, `InvalidDuration` (#5).
- `accrued = min(tiempo_efectivo − inicio, duración) × tasa`, limitado por `deposit`. Nunca se puede retirar más de lo depositado.
- Un `claim` sin importe pendiente falla con `NothingToClaim` (#6); el estado `withdrawn` impide cobrar dos veces el mismo intervalo.
- `pause` congela el reloj en `paused_at − paused_total`; `resume` suma cada segundo pausado. No se devenga nada durante la pausa.
- `cancel` (pagador o destinatario) es terminal: transfiere `accrued − withdrawn` al destinatario y `deposit − accrued` al pagador.
- `close` es permisionless pero solo se concreta si `withdrawn == deposit`. `Cancelled` y `Closed` son terminales.

Solo el pagador puede pausar/reanudar; solo el destinatario puede reclamar. Errores: `NotFound` #1, `NotAuthorized` #2, `InvalidState` #3, `InsufficientFunds` #7.

## Evidencia real

Contrato `CA7T6F6CJTDURIHZRPWGJYKURGLH3PTMAFVBQGN7CXZ5BJ7GIWJJPJF2`, wasm `5d8c6db73d32c463b099cfb0213c2f3ead7b16071da9715a9ee839ee34631331`. Diez transacciones confirmadas en Horizon: creación, tres claims parciales, pausa, reanudación, cancelación, creación/claim/cierre del segundo flujo. Seis tests Rust cubren devengo, duplicados, pausa, cancelación, cierre, límites y autorización.

Reconciliación exacta del flujo 1: depósito 6.000.000 = claims 900.000 + liquidación 200.000 + remanente 4.900.000; saldo final del contrato 0. Flujo 2: 3.000.000 = claim total 3.000.000 → `Closed`. Las comisiones de red se pagan aparte y no forman parte de la reconciliación.

Vista pública `/streaming`.
