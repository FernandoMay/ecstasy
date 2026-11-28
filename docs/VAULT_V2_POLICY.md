# Política económica de Vault V2 — definida antes del código

## Problema

En V1, `retirar` comparaba el saldo total del contrato menos `ReservedStake` y pagaba al creador del encounter referenciado. SEC-04 demostró que un tercero podía crear un encounter sin stake y apropiarse de cualquier transferencia directa al contrato.

## Modelo V2: Registry → Vault → Funding → Attribution → Withdrawal → Surplus → Receipt

| Concepto | Definición |
|---|---|
| Vault | Registro con `id`, `owner`, `label_hash`, `attributed`, `status` |
| Funding | **Única** ruta legítima: `fund(caller, vault_id, amount)`; incrementa `attributed` del vault en la misma transacción que mueve el XLM |
| Attribution | `attributed[vault]` es la cantidad que el contrato reconoce explícitamente como perteneciente a ese vault |
| Withdrawal | `withdraw(caller, vault_id, amount)` solo puede debitar `attributed` del vault cuyo `owner` es `caller` |
| Surplus | `contract_balance − Σ attributed`; son fondos que **nunca** entraron por `fund` |
| Surplus destination | Dirección fijada en el constructor, conocida por todos antes de cualquier depósito |

## Reglas

1. **Un creador solo retira lo que el estado le atribuye.** Nunca puede usar el saldo total del contrato.
2. **Una transferencia directa no crea atribución.** Puede inflar el saldo del contrato, pero no `attributed` de ningún vault.
3. **Aislamiento entre vaults:** `attributed[A]` nunca puede ser debitado por el owner de B.
4. **Surplus con destino predeterminado:** `sweep_surplus` es permissionless y transfiere exactamente el surplus a la dirección fijada en el constructor. No hay discreción sobre el monto ni el destino.
5. **Sin fondos perdidos:** todo XLM atribuible tiene ruta de retiro del owner; todo XLM no atribuible tiene ruta de sweep al destino declarado.
6. **Terminalidad:** `close` solo con `attributed == 0`; vaults cerrados rechazan fund/withdraw. Retiro duplicado o superior a la atribución se rechaza.

## Invariantes demostrables

- `Σ attributed[vault] <= balance del contrato` en todo momento.
- Tras un `sweep_surplus`, `balance == Σ attributed`.
- Un atacante que crea un vault sin fondear y envía XLM directamente **no puede retirar**; el importe sigue siendo surplus.
- `withdraw` sobre un vault ajeno falla; `withdraw` por encima de la atribución falla.

## Riesgo residual

Si la dirección de surplus queda comprometida, quien la controle recibirá futuros surplus. No existe pausa ni redirección: el destino es inmutable por diseño. Por eso se elige una dirección separada de los creadores; el constructor no otorga poderes extraordinarios, y se declara antes de fondear.

## Migración de V1

**Los 5.555 XLM de `CAWOC5VH…` no se mueven.** V2 se prueba con fondos nuevos y pequeños. Cualquier migración futura requiere autorización independiente del titular del `code_hash` y un procedimiento separado.
