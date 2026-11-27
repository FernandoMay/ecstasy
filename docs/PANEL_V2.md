# Panel V2 — independencia verificable del árbitro

Dos contratos nuevos e independientes: `contracts/arbitrators-registry` y `contracts/panel-v2`. V1 (`CCFRBPLV…`) permanece desplegado e intacto. Política previa: `docs/PANEL_V2_POLICY.md`.

## Arbitrators Registry
`CDUYDNPWLXQLC3D2JFEVEJN2BISWNY52WCQLOTBQVCG2GZVOWKPCDBTJ` · wasm `ebd88ef9dc9bcc849a82f20d1fdcab60f618cf77fa7ac7424fcb3a4331378d52`.

- `register` es automático (el mismo `caller` firma su perfil); `attest` lo hace el registrador y vincula un `controller_hash`.
- Un controlador solo puede estar atestado en **una** dirección: `DuplicateController` (#4). Un intento real fue rechazado en simulación, sin hash.
- `revoke` permite retirar elegibilidad. 4 tests Rust cubren registro, atestado, revocación, duplicado de controlador y autoridad.
- `get_eligible()` devuelve la lista en orden de registro: es la instantánea que congela Panel V2.

## Panel V2
`CDLK3J5UYFRT3TWOVWSR6BOIKICJ5B6SOSCHMWQB44JXHPXKZPSAGEE3` · wasm `c5a7ec91a14d43a710f48a51a89c0376fdbdce2e2b34f8f9f79d0d7dede85c5a`.

- `create` **no tiene parámetro `arbitrators`**: el pagador deposita pero no puede nombrar árbitros. Congela la lista elegible y una semilla de `timestamp || sequence || case_id`.
- `select_panel` es permissionless y deterministico: toma tres direcciones distintas de la instantánea; quien llama no puede alterar el resultado.
- `commit` / `reveal` usan digest con tag `ECSTASY-PANEL-V2`, contract ID, `case_id`, decisión `u32`, secreto y dirección del árbitro. El helper web `panelV2Commitment` reproduce el vector on-chain.
- Quórum 2/3 → Release / Refund / Split; sin quórum → Refund al pagador. Estado terminal: no hay doble liquidación.
- 11 tests Rust cubren selección desde la instantánea congelada, tres direcciones distintas, commit duplicado, secreto incorrecto, reveal duplicado, los tres quórum, sin quórum, terminalidad, dominio del digest y elegibilidad insuficiente.

## Evidencia Testnet
Cinco árbitros registrados y atestados en el registry, con controladores distintos. Caso 1 creado por `arceus-deployer` con `recipient = voltx-recipient`; el panel seleccionó a `escrow-arbiter`, `suite-resolver-suite` y `cc2026-new` — **ninguno controlado por el pagador**. Dos votos Release y uno Refund → quórum Release.

Transacciones confirmadas: crear caso `0e401b1e…`, seleccionar panel `637f1b67…`, commits `bb86aa10…`, `02802a92…`, `5e4ac700…`, reveals `b974d44e…`, `48c4b5e4…`, `71fd4fab…` y settlement `bdcd3678…`. La suplantación de controlador fue rechazada en simulación (#4), sin hash. Vista pública `/panel-v2`.
