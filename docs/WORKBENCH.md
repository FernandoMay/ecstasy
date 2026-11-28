# Workbench — ECSTASY como producto utilizable (15.8)

Ruta `/workbench`. Capa de experiencia sobre los primitives V2 ya desplegados; **no introduce contratos nuevos** ni estados ficticios.

## Qué hace

1. **Dashboard:** lee en vivo `vault-v2`, `milestones-v2`, `flow-v2` y `role-registry-v2`. Muestra vault, hito, flujo y los roles del wallet conectado.
2. **Flow Workspace:** con Freighter conectado, firma transacciones reales:
   - `create_vault(label_hash)` — el digest se calcula en el navegador con SHA-256.
   - `fund(vault_id, amount)` — ruta oficial que crea atribución.
   - `create(...)` en Milestones V2 con importe y vencimiento del formulario.
   - Operaciones de hito y retiro de la atribución del vault.
3. **Permisos:** la UI consulta `has_role` on-chain y deshabilita acciones cuando la wallet no tiene el rol. El contrato vuelve a validar la autoridad en cada transacción, así que el rechazo de la UI no es la única barrera.
4. **Evidence & Receipts:** timeline construido solo con hashes reales del Evidence Center; exportación de un JSON con snapshot on-chain, direcciones de contrato y URLs de Stellar Expert. Tras recargar, el historial se reconstruye desde la cadena y la evidencia publicada, no desde un estado local inventado.

## Comprobante exportado

Incluye: red, contratos V2, estado leído en el momento de la exportación, hashes con enlace a Stellar Expert y una nota explícita de que los datos provienen de contratos y transacciones verificadas. No contiene estimaciones ni referencias a transacciones simuladas.

## Demostración real ejecutada

Secuencia completa sobre Testnet con el vault V2 y Milestones V2:

- Financiar vault 1: `bc4c8c71…` — 1 XLM atribuido.
- Crear acuerdo 4: `23a79548…`; entrega: `008a066f…`; aprobación: `b21ff199…` — 1 XLM pagado al destinatario.
- Retiro del creador del vault: `8594d73a…` — atribución del vault 1 a 0.
- Intento de `sweep_surplus` sin surplus rechazado en simulación (#6), sin hash.

Estado final del vault 1: saldo 0, atribución 0, surplus 0. El saldo restante del contrato pertenece a otro vault con atribución legítima, no a fondos sin dueño.

## Criterios

| Criterio | Resultado |
|---|---|
| Flujo desde wallet hasta retiro | Demostrado con transacciones reales |
| Permisos en contrato y UI | `has_role` on-chain + validación en el contrato |
| Sin datos críticos simulados | Todos los hashes verificados en Horizon |
| Historial tras recargar | Se reconstruye desde contratos + Evidence Center |
| Comprobantes desde eventos/evidencia | Exportación JSON con hashes reales |

El Workbench es la superficie de producto del Release Candidate V2. Mainnet continúa NO-GO y los 36 findings V1 permanecen abiertos.
