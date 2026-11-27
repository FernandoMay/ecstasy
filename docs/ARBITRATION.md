# Escrow Arbitration Protocol

Contrato independiente `contracts/arbitration`. Custodia XLM nativo (SAC) y permite que un resolver designado decida el destino real de los fondos. No sustituye ni modifica los contratos de encounters, disputes, refunds ni recovery.

## Ciclo

```text
deposit (XLM real) → Open ──(argue de las partes antes de respond_by)──> Open
                          └──(resolve del resolver)──> Resolved + transferencia on-chain
```

Resultados posibles:

- `Release`: XLM al destinatario.
- `Refund`: XLM al proponente.
- `Split`: mitad al destinatario, mitad al proponente (el sobrante, si lo hay, al proponente).

El resolver se fija en el constructor; cualquier otra cuenta es rechazada con `NotAuthorized` (#2). `resolve` es terminal: una segunda resolución falla con `InvalidState` (#3). Los argumentos son digests off-chain y solo se aceptan antes de `respond_by` (#4). No se registran documentos privados en la cadena.

## Límites

- El resolver aplica una decisión económica, no determina la verdad de los hechos.
- No hay apelación automática ni arbitraje externo.
- El activo queda fijado en el constructor (SAC nativo XLM en el despliegue actual).

## Evidencia

Siete transacciones reales (depósito, argumento y tres resoluciones) están en el Evidence Center y en `docs/TESTNET_TRANSACTIONS.md`. El intento de doble resolución fue rechazado en simulación (#3) y no tiene hash inventado.
