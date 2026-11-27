# Milestone Escrow Protocol

Contrato independiente `contracts/milestones`. Custodia XLM nativo (SAC) y libera fondos **por hito completado**, sin desbloquear el resto del acuerdo.

## Ciclo por hito

```text
Pending ──(submit del destinatario, evidence_hash)──> Submitted
        ──(approve del proponente)──> Paid  (transfiere solo ese importe)
        ──(dispute de cualquiera)──> Disputed ──(resolve del resolver)──> Paid | Refunded
        ──(recover permisionless tras deadline)──> Recovered (devuelve ese importe al proponente)
```

- `create`: el depósito debe ser la suma exacta de los importes de los hitos; se rechazan importes <= 0 y fechas pasadas.
- `submit`/`approve`: el proponente autoriza cada hito de forma explícita y solo ese importe sale del contrato.
- `dispute`/`resolve`: el resolver designado decide **ese hito**; los demás fondos permanecen intactos.
- `recover`: cualquier cuenta puede recuperar un hito no liquidado después de su deadline; los fondos vuelven al proponente.

Errores: `NotFound` #1, `NotAuthorized` #2, `InvalidState` #3, `InvalidAmount` #4, `InvalidMilestone` #5, `DeadlineNotPassed` #6, `AlreadySettled` #7, `InsufficientFunds` #8, `DisputeNotAllowed` #9.

## Límites

- Cada acuerdo admite hasta 10 hitos.
- No reutiliza el contrato de arbitraje: el arbitraje por hito está definido aquí de forma explícita.
- Los digests demuestran compromiso con datos off-chain, no que las pruebas sean verdaderas.

## Evidencia

Siete transacciones reales ejecutadas en Testnet (crear, dos entregas, aprobación, disputa, resolución y recuperación) están en el Evidence Center y en `docs/TESTNET_TRANSACTIONS.md`. Las operaciones rechazadas se documentan como tests/simulación, sin hashes inventados.
