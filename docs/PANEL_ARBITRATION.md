# Multi-Party Arbitration Protocol

Contrato independiente `contracts/panel`. Sustituye la dependencia de un único resolver por un panel de tres árbitros con quórum de dos votos coincidentes y votación commit-reveal.

## Ciclo

```text
create (XLM real + 3 árbitros) → commit (antes de commit_deadline)
      → reveal (entre commit_deadline y reveal_deadline)
      → resolve (después de reveal_deadline, permisionless)
```

- Compromiso: `sha256(case_id || decisión || secreto || sha256(strkey del árbitro))`. El contrato y el cliente usan el mismo layout (`packages/stellar`/`apps/web/lib/panel-commitment.ts`).
- Decisiones: `1 Release`, `2 Refund`, `3 Split`. Dos votos iguales determinan el resultado y ejecutan la transferencia XLM real.
- Sin quórum: los fondos vuelven al proponente y el estado es `NoQuorum`. Nunca se liberan a un árbitro ni al último votante.
- Rechazos: árbitro no designado (#2), voto duplicado (#6/#7), revelación inválida (#5), fuera de plazo (#3), panel duplicado (#9). La liquidación es terminal.

## Límites

- El panel es designado por las partes: no hay selección descentralizada.
- Commit-reveal protege la independencia temporal de los votos, no la honestidad de los árbitros.
- Los digests de evidencia prueban compromiso con datos off-chain, no su veracidad.

## Evidencia

Ocho transacciones reales en Testnet (crear, tres commits, tres reveals y resolución con quórum) están en el Evidence Center y en `docs/TESTNET_TRANSACTIONS.md`. Los rechazos se documentan como tests/simulación, sin hashes inventados.
