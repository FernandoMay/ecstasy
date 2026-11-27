# ECSTASY

**Acuerdos secretos. Pruebas públicas en Stellar.**
*Private agreements. Public proof on Stellar.*

ECSTASY es un protocolo de acuerdos privados entre dos partes, construido sobre Stellar. Dos personas crean un encuentro, acuerdan términos en privado, bloquean valor en escrow de forma opcional, completan el encuentro, liquidan on-chain y dejan una señal de reputación verificable (`afterglow`) sin publicar los términos privados.

**Demo en vivo:** https://ecs-tasy.netlify.app · **Evidencia:** https://ecs-tasy.netlify.app/evidence

> **Privado por defecto. Liquidado en Stellar.**
> [Video: Acuerdos secretos y pruebas públicas en Stellar](https://youtube.com/shorts/zMHbDthidtI)

## Qué es (y qué no es)

Es una primitiva Web3 neutral para acuerdos bilaterales: privacidad, consentimiento explícito, compromisos criptográficos, liquidación y consecuencias.

Lo que dice la cadena no es la verdad del encuentro: es la prueba de que el contrato aceptó una transición de estado bajo sus reglas.

## Flujo

```text
Crear → Invitar → Consentir → Escrow opcional → Completar → Liquidar → Afterglow
```

### On-chain (público)
- direcciones de los participantes
- estado del encuentro
- stake + identificador del asset
- `terms_hash` (SHA-256 de los términos canónicos)
- timestamps / expiración
- completado y liquidado
- score grueso de afterglow

### Off-chain (privado)
- términos privados
- mensajes y contenido personal
- metadatos cifrados opcionales (fuera de este protocolo)

**Los términos privados nunca se publican en la cadena.** Un hash es un compromiso, **no cifrado**: si el preimage se comparte o se puede adivinar, no hay confidencialidad.

## Repositorio

```text
apps/web/                 Next.js Testnet app (flujos reales, sin mocks)
contracts/ecstasy/        contrato Soroban, tests y scripts deploy/smoke
packages/stellar/         SDK compartido, adapter de wallet y bindings tipados
docs/                     protocolo, seguridad, evidencia, runbook y release
netlify.toml              build del monorepo en Netlify
.github/workflows/        CI y smoke de producción
```

## Estado actual — Testnet Release Candidate 1

Detalle completo: `docs/RELEASES/testnet-rc-1.md`, `docs/EVIDENCE.md` y el archivo único de transacciones con URLs de Testnet: `docs/TESTNET_TRANSACTIONS.md`.

| Gate | Estado |
|---|---|
| Contrato desplegado y flujo completo en Testnet (CLI/RPC) | ✅ |
| Pago real desde la URL pública con memo `SHIP-S97KF8` | ✅ G1 |
| Match de términos, asset único fijado en constructor, auth y expiración | ✅ |
| Blobs disponible en producción (`shared` reportado por `/api/status`) | ✅ infra |
| Idempotencia atómica compartida (8 peticiones → 1 pago, 1 hash) | ✅ G2 |
| E2E en navegador con dos wallets Freighter | ✅ 9/9 confirmado por el owner (hashes por adjuntar) |
| Mainnet | ❌ decisión separada |

### Funciones de producto disponibles

- `/encounters` — índice local de encuentros creados/abiertos, con estado leído en vivo desde el contrato. No guarda términos privados.
- Actividad reciente — transiciones públicas de estado en la misma vista, sin contenido privado ni notificaciones push.
- Intercambio cifrado de términos — el creador genera un sobre AES-GCM con clave PBKDF2 y el participante lo descifra en la app; la frase secreta se comparte fuera de la app. No hay claves persistentes, pero no hay secreto perfecto hacia adelante ni recuperación sin la frase.
- `/boveda` — bóveda de 5555 XLM con reclamo por código.
- `/evidence` — 44 transacciones Testnet reales con enlace a Stellar Expert.
- `/encounters/:id` — detalle con timeline de hitos, reconciliación y recibo copiable.
- `/vault` — dashboard de la bóveda (estado on-chain e historial local de reclamos).
- `/analytics` — contadores derivados de encuentros observados y evidencia real.
- `/activity` — timeline global de transiciones y transacciones verificadas.
- `/afterglow` — historial y desglose de feedback estructurado calculado localmente.
- `/refunds` — reembolso mutuo con XLM real y doble autorización.
- `/recovery` — recuperación permisionless de fondos tras vencimiento del plazo.
- `/arbitration` — liquidación condicionada por resolución con XLM real.

Diferido a V2 (decisiones de producto): disputas con árbitro, identidad verificada, multiasset y multipartito. No están implementados y no se presentan como disponibles.

Registro para revisión: `docs/FUNCTIONS_FOR_REVIEW.md` (nombre de la función + transacción en Testnet) y `docs/TESTNET_TRANSACTIONS.md` (todos los hashes).

Dos pagos públicos verificados en Horizon:

- https://stellar.expert/explorer/testnet/tx/07a3183f03be6c6cea24e3380e84d5786217e2145a6f48d875081af7886d1064
- https://stellar.expert/explorer/testnet/tx/494d9e603cfb470ce6356027f199b6c95641839eaa237d11cdb2e739a138fc02

**Contrato actual:** `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65`
**Asset de escrow:** SAC nativo XLM `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
**App pública:** https://ecs-tasy.netlify.app

### Quickstart

```bash
npm install                        # workspaces: apps/web + packages/stellar
cp .env.example apps/web/.env.local
npm run build                      # shared package, luego web
npm test                           # 33 shared + 55 web
cd contracts/ecstasy && cargo test # 38 tests del contrato
cd ../.. && npm run dev            # http://localhost:3000
```

Total: **173 tests automatizados** = 33 shared + 88 web + 38 ECSTASY + 2 vault + 2 disputes + 3 refunds + 4 recovery + 3 arbitration + 38 ECSTASY Rust + 2 bóveda Rust (unitarios/de invariantes; **no** son 124 pruebas E2E). Typecheck, build, Clippy `-D warnings`, verificación de WASM y detección de drift de versiones pasan en CI.

Abre la app con Freighter en Testnet. Usa dos wallets/contextos para los dos roles. Los términos privados se guardan solo en el navegador si haces opt-in y se pueden borrar desde el formulario.

### Deploy y verificación

```bash
SOURCE=<stellar-identity> contracts/ecstasy/scripts/deploy.sh
CREATOR=<identity-a> PARTICIPANT=<identity-b> contracts/ecstasy/scripts/smoke.sh
SITE_URL=https://ecs-tasy.netlify.app SKIP_PAYMENT=1 scripts/production-smoke.sh
npm run docs:matrix && npm run verify:wasm && npm run verify:versions
```

`deploy.sh` fija el asset de escrow en el constructor e imprime el contract ID. `smoke.sh` ejecuta el flujo completo y printed cada hash. El checklist del E2E pendiente está en `docs/E2E_CHECKLIST.md`.

## Bóveda · reto exprés

`https://ecs-tasy.netlify.app/boveda` despliega una pantalla pública donde conectar un wallet de Testnet, escribir el código y reclamar los 5555 XLM bloqueados en `CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC`. La nueva función pública `reclamar` se ejerció en Testnet en una bóveda demo de 1 XLM: https://stellar.expert/explorer/testnet/tx/d1fb977f341adac241d11b645daa839a4899de785f89f8488a0908d94f2eb71a

## Seguridad y límites de confianza

- Nunca se piden ni se guardan seed phrases o claves privadas.
- Nunca se ponen términos privados, chats, fotos ni PII innecesaria en la cadena.
- Toda autorización se aplica on-chain (`require_auth` + chequeo de partes).
- El escrow es opcional; un encounter sin stake es posible.
- Los eventos no contienen payloads sensibles.
- No se presenta ECSTASY como mecanismo para evadir leyes, consentimiento, moderación o requisitos de identidad.

## Stellar

Versiones fijadas y validadas: ver `docs/adr/0001-stack.md`. El cliente TypeScript se genera desde el WASM compilado (`npm run generate:bindings`) y CI verifica que no haya drift.

## Licencia

Pendiente: no añadir licencia hasta que el dueño del proyecto elija una.
