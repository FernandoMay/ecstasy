# Milestones V2 — SEC-02 remediado

Contrato independiente `contracts/milestones-v2`, desplegado en Testnet en `CARHRH5SX7BWKYWUWW347URD5NQTYNKX5MHWIVQARDSU2ZHZXR6VRDPO` (wasm `c261509bd2070ab4f0773722125d6ac18af3753c6c71d8d16cc938c2e6a04e06`). **No modifica ni reemplaza** el contrato V1 `CCNJVQLI…`, que permanece desplegado.

## Máquina de estados corregida

```text
Pending  --submit--> Submitted
Submitted --approve--> Paid
Submitted --dispute--> Disputed
Pending  --recover (tras deadline)--> Recovered
Submitted --settle_after_deadline (tras deadline, sin disputa)--> Paid
Disputed --resolve (resolver, dentro de dispute_window)--> Paid | Refunded
Disputed --timeout_refund (tras dispute_window)--> Refunded
```

**Invariante:** `Disputed` nunca transiciona a `Recovered` mediante una llamada permissionless. `recover` solo acepta `Pending`; `Submitted` devuelve `InvalidState` (#3), `Disputed` devuelve `DisputeActive` (#10) y los terminales `AlreadySettled` (#7). Toda transición escribe el estado terminal antes de retornar y emite `MilestoneEvent` con `id` e `index` como topics.

`dispute_window = 300 s` fija la ventana del resolver: `resolve` después de ella falla con `DeadlinePassed` (#11) y `timeout_refund` garantiza la salida al proponente. Así ningún hito financiado carece de ruta de salida.

## Pruebas

8 tests Rust: el exploit SEC-02 es rechazado tanto sobre `Disputed` como sobre `Submitted`; se verifican aprobación aislada, resolución Release/Refund, recuperación legítima de `Pending`, liquidación tardía de `Submitted`, `timeout_refund`, doble salida rechazada e integridad del depósito. `cargo clippy --all-targets -- -D warnings` limpio.

## Evidencia Testnet

Nueve transacciones confirmadas en Horizon. Acuerdo 1 (3 XLM): m0 aprobado, m1 disputado y resuelto con `Release`, m2 recuperado tras vencimiento — saldo final del contrato para ese acuerdo 0. Acuerdo 2 (1 XLM): hito en `Disputed` con saldo 1 XLM; el intento de `recover` fue **rechazado en simulación con `Error(Contract, #10)`**, sin hash inventado. Vista pública `/milestones-v2`.

La reconciliación del acuerdo 1 es exacta: 10.000.000 + 10.000.000 + 10.000.000 stroops = 30.000.000 depositados.
