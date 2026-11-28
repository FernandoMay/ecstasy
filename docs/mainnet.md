# Misión Mainnet — estado REAL y mapeo frontend → contrato

> **Estado: BLOQUEADA por falta de financiación en Mainnet.** No hay ningún despliegue realizado y no se va a inventar hash ni enlace. Cuenta Mainnet generada para la misión (alias `ecstasy-mainnet`): `GAPGAYCEAWPJTU35U3DFYDOWACU7RBDSRFWRDSYZHNKU4DBZ5XGRDIVX`. Requiere al menos 5 XLM reales para crear cuenta, pagar fees y desplegar. No existe faucet de Mainnet: Friendbot solo funciona en Testnet/Futurenet. Freighter no está instalado en el navegador de la sesión y ninguna clave local tiene cuenta en `horizon.stellar.org`.

## Contrato seleccionado

`contracts/vault-v2`, WASM reproducible `9242aedf752fd1d3cd103de2d8dfc99cc113fcafd16bc62b5607fa9f91c311dd`.

Asset nativo Mainnet SAC: `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`.

## Las 5 funciones más importantes que el frontend usa

Todas están cableadas en `apps/web/app/workbench/page.tsx` (ruta `/workbench`) sobre `VaultV2Client`. No son funciones de demostración: el Workbench las ejecuta contra el contrato real configurado en `config.vaultV2ContractId`.

| # | Función | Qué hace | Pantalla/componente | Llamada exacta |
|---|---|---|---|---|
| 1 | `get_vault(vault_id)` | Lee el registrador real del vault: `id`, `owner`, `label_hash`, `attributed`, `status`. Alimenta el dashboard. | `/workbench` → Dashboard | `apps/web/app/workbench/page.tsx:70` — `vault.get_vault({ vault_id: 1n })` |
| 2 | `create_vault(caller, label_hash)` | Crea un vault vacío; el digest `label_hash` se calcula con SHA-256 en el navegador. Firma con Freighter. | `/workbench` → Flow Workspace → “Crear vault” | `apps/web/app/workbench/page.tsx:231` — `c.create_vault({ caller: address!, label_hash: toBuffer(await digest(label)) })` |
| 3 | `fund(caller, vault_id, amount)` | Única ruta legítima: mueve XLM al contrato e incrementa `attributed` en la misma transacción. Firma con Freighter. | `/workbench` → Flow Workspace → “Financiar vault” | `apps/web/app/workbench/page.tsx:245` — `c.fund({ caller: address!, vault_id: 1n, amount: … })` |
| 4 | `withdraw(caller, vault_id, amount)` | Retira únicamente la atribución del vault del caller; nunca usa el saldo total del contrato. Firma con Freighter. | `/workbench` → Flow Workspace → “Retirar atribución” | `apps/web/app/workbench/page.tsx:294` — `c.withdraw({ caller: address!, vault_id: 1n, amount: … })` |
| 5 | `get_surplus()` | Lee `balance − Σ attributed`. Es la comprobación de que una transferencia directa no se convierte en saldo retirable. | `/workbench` → Flow Workspace → “Leer surplus” | `apps/web/app/workbench/page.tsx:308` — `(await c.get_surplus()).result` |

La sexta operación del contrato, `sweep_surplus`, mueve el surplus a la dirección fijada en el constructor y queda como siguiente ampliación del Workbench. No se presenta aquí como función usada ya por el frontend.

## Comando de despliegue pendiente

```bash
cd contracts/vault-v2
stellar contract deploy \
  --wasm target/wasm32v1-none/release/vault_v2.wasm \
  --source-account ecstasy-mainnet \
  --network mainnet \
  --alias vault-v2-mainnet \
  --asset CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA \
  --surplus_destination <DIRECCIÓN_DESTINO_DECLARADA>
```

## Configuración del frontend para Mainnet

El frontend ya tiene fail-closed: `getConfig` exige `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` y `NEXT_PUBLIC_MAINNET_RELEASE=confirmed`. Tras el despliegue hay que publicar en Netlify:

```text
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_MAINNET_RELEASE=confirmed
NEXT_PUBLIC_RPC_URL=https://mainnet.sorobanrpc.com
NEXT_PUBLIC_CONTRACT_ID=<contrato ECSTASY o vault principal>
NEXT_PUBLIC_ASSET_CONTRACT_ID=CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
NEXT_PUBLIC_VAULT_V2_CONTRACT_ID=<ID del despliegue Mainnet>
```

Sin esos valores, la app se niega a arrancar en Mainnet. Eso es intencionado.

## Evidencia que se entregaría tras la financiación

- Contrato: `https://stellar.expert/explorer/public/contract/<ID>`
- Cinco transacciones, una por función: `https://stellar.expert/explorer/public/tx/<HASH>`
- Cada una verificada en `https://horizon.stellar.org/transactions/<HASH>` con `successful: true`.

**No se han generado esos enlaces porque no existe ninguna transacción Mainnet real.**
