# 15.6 — Integración V2 real, storage segmentado y autoridad delegada

## 1. Storage escalable

Dos contratos nuevos evitan el patrón que produjo SEC-09:

- `flow-v2` guarda `Flow`, `StepRecord` y `StepList` en **storage persistente por clave**, con `extend_ttl` en cada escritura. La lista de pasos se lee con `get_steps(flow_id, offset)` en páginas de 10; ninguna lectura recorre toda la cadena.
- `role-registry-v2` mantiene cada rol como una entrada acotada (`MAX_HOLDERS = 16`) y expone `get_holders(role, offset, limit)` paginado.

Prueba de crecimiento: 200 flujos con sus pasos escritos y leídos correctamente al final (`hundreds_of_flows_keep_state_readable`), más 12 titulares de rol paginados en 5/5/2. Las instancias no crecen con el número de registros.

## 2. Autoridad delegada

`contracts/role-registry-v2` desplegado en `CDYLAMODBA5M5ZMFND33DXGDXPYIOAP6PHA5TVVFPJTBJA62EXDPU3BV` (wasm `b2b93c62…`).

| Rol | Titular Testnet | Control |
|---|---|---|
| `admin` | `suite-admin` | Solo `grant`/`revoke`/`rotate`. **Sin rol operativo.** |
| `fund_manager` | `arceus-deployer` | `start` del flujo y pasos `vault_fund`/`withdrawal` |
| `registrar` | `cc2026-new` | Paso `milestone` |
| `resolver` | `escrow-arbiter` | Pasos `dispute`/`arbitration`/`panel` y `settle` |

Verificado en cadena: `has_role(fund_manager, suite-admin) = false`; `start` y `link_step` por admin rechazados con `#2` en simulación, sin hash. El admin no puede mover fondos ni alterar un flujo.

## 3. Flujo compuesto ejecutado

`contracts/flow-v2` en `CCZ2ADMIZPKWFM2V2KA3F67XWV4V2UP7KBL53OVE3UDXMOBNHLLHHZKW` (wasm `607fc677…`). Registra cada paso con su hash de transacción real y exige todos los pasos antes de `settle`.

```text
Vault V2 (1 XLM) → Milestones V2 (1 XLM, disputado) → Arbitration V2 (1 XLM, Release)
      → Panel V2 (1 XLM, quórum 2/3 Release) → settlement → Flow settled
```

Cada primitivo V2 ejecutó su lógica real en Testnet con su propio contrato y su propio XLM. El orquestador **no simula** los estados: enlaza las transacciones reales y elEvidence Center las indexa. La reconciliación es por primitivo (cada contrato termina en saldo 0) y el flujo agrega los hashes en un único registro consultable.

## 4. Evidencia

Los hashes de todas las transacciones están en `docs/TESTNET_TRANSACTIONS.md` y en el Evidence Center. Los intentos de `start`/`link_step` por admin fueron rechazados (#2), sin hash inventado. Vista pública `/flow-v2`.

`v1.0.0` permanece intacta; los 5.555 XLM de la Vault V1 no se tocaron.
