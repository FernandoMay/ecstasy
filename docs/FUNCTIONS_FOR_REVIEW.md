# Funciones nuevas y transacciones registradas para revisión

Archivo de envío a revisión: para cada funcionalidad se anota el **nombre de la función** y el **enlace a la transacción en Testnet que la usa**. El registro completo de hashes (incluidos despliegues, fondeos, pagos y negativos) está en `docs/TESTNET_TRANSACTIONS.md`; la narrativa y las condiciones de verificación en `docs/EVIDENCE.md`.

Cuando una función tiene varias ejecuciones, los enlaces se agrupan en la misma fila por contrato (CBZKL, CBX2, CARK, CDG4).

## A. Máquina de estados de ECSTASY

| Nombre de la función | Enlace a la transacción que la usa |
|---|---|
| `create_encounter` | [CBZKL](https://stellar.expert/explorer/testnet/tx/361e5a29b7b426ae7d0f31c080c32b0f6d4204bb292021705c47ae79f90ac956) · [CBX2](https://stellar.expert/explorer/testnet/tx/f53d02f19586beeca88dcdd334f8938f534c85ae53af16542432950cf00771a9) · [CARK](https://stellar.expert/explorer/testnet/tx/584f839f2e3f069ec74d91ad0d3b59ae73e264bf9490605e37c6e1b528870138) · [CDG4](https://stellar.expert/explorer/testnet/tx/42d87dbe215f0a63810e07279cb9cc34044feb1e5bc4907ce29a9a28b6529b1e) |
| `accept_encounter` | [CBZKL](https://stellar.expert/explorer/testnet/tx/f58e52bdb5dcd1612af2f73b706e902525ad4c184cbe9f0856f125865cacc54a) · [CBX2](https://stellar.expert/explorer/testnet/tx/f4cc2d64bddf1e23783354cbcf82ff3311b009d4ad410f627658c5c2d0c4b7c9) · [CARK](https://stellar.expert/explorer/testnet/tx/b2739e809f2c799236a00c352f45b1a9378a968174c3432e17df45d4bda99e9e) · [CDG4](https://stellar.expert/explorer/testnet/tx/541bf37ea78435e34e3b6f72c9e419846cec6bb299653e3e0908c3aa72d1dbe3) |
| `complete_encounter (creador)` | [CBZKL](https://stellar.expert/explorer/testnet/tx/47926ed9478a0b078875fb5b4d48ffa1e3c4f200ff9c58f8a64d82fdba0eb14e) · [CBX2](https://stellar.expert/explorer/testnet/tx/9eb9f213109d162f3bdfcdbd3f74d7fb2400a467664ae14ff7552b6a6bbb45d3) · [CARK](https://stellar.expert/explorer/testnet/tx/f0bd3830e6bf0a59f8f9b0c8040c6dc68b16734fa959451867ee5ad37d202858) · [CDG4](https://stellar.expert/explorer/testnet/tx/1b89f9d91423b7e9fe9fa9a0c11354cfe83fe32e2c12cf1e75edd1aa89c2c931) |
| `complete_encounter (participante)` | [CBZKL](https://stellar.expert/explorer/testnet/tx/8884afc56be9e3ff7a2ea5a833fb3108e401d04e05f26202225c57a1789c2629) · [CBX2](https://stellar.expert/explorer/testnet/tx/f272bdc0e2f1d03e82b6938e07aa76d194c6efde493ef2a3ece153f505de8201) · [CARK](https://stellar.expert/explorer/testnet/tx/772dd8c2f263b5beb66c5f112778d322596bc74c197ec651e33635128f2f5a05) · [CDG4](https://stellar.expert/explorer/testnet/tx/b757aa9c001e80defb8434d635116da80726b196259664b23f4b1a01c598811b) |
| `settle_encounter` | [CBZKL](https://stellar.expert/explorer/testnet/tx/4bb317e9ddbf1e53d918297f44ad953998924ecf85aed04b0c1604255dab0665) · [CBX2](https://stellar.expert/explorer/testnet/tx/f685c8bdd0e963c96300a39674af67d2ed9072a7328a769bcab5de4b8a22bb12) · [CARK](https://stellar.expert/explorer/testnet/tx/9692ac0b8730e75a68616dd1d74b460c5bb0355017882f18819111fae568151b) · [CDG4](https://stellar.expert/explorer/testnet/tx/0b7221986bf74f50e2ee946c9ff08ea8b5fa3c1258f5c3f421b8f672353e3f19) |
| `submit_afterglow (creador)` | [CBZKL](https://stellar.expert/explorer/testnet/tx/3846b16768b4cd66f56475cd36ded29d343f832c6927543f6bc60c1c989ddd95) · [CBX2](https://stellar.expert/explorer/testnet/tx/a9388eb82a64d83ed75ed4c4080ad6c8c5f0687f5a94dbef30925a40c4e248e8) · [CARK](https://stellar.expert/explorer/testnet/tx/f17e588fce802ac7d83a9d69922cbf5ef16c534041fb1c1bdd5563084b84e467) · [CDG4](https://stellar.expert/explorer/testnet/tx/e897b11a77124e94b5dbe1d56e1ea4641b988bf45fd6722c94e9ac840cfbe625) |
| `submit_afterglow (participante)` | [CBZKL](https://stellar.expert/explorer/testnet/tx/2c6fbc5f45ecf45d95fea97dabd8bf629e6c4a9d2d3306c9c7b6005996537aa8) · [CBX2](https://stellar.expert/explorer/testnet/tx/4ec7f294d50b86b23a6fa344f5fc98fffd32b675f1cabaa773a81d0620fe856c) · [CARK](https://stellar.expert/explorer/testnet/tx/af6bf77993ee06633c7af88cfeb4c1b9c2b6d28159fcacb0344ec77c96c68b3f) · [CDG4](https://stellar.expert/explorer/testnet/tx/4f32c16bff15ec124bad51f474d46a90c14310f64f1ae90f97811c3c7d87e52a) |
| `retirar(caller, encounter_id)` — **función nueva** | [CB7IX](https://stellar.expert/explorer/testnet/tx/14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e) · [CARK](https://stellar.expert/explorer/testnet/tx/1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6) · [CDG4](https://stellar.expert/explorer/testnet/tx/2333ac89b2e536506d174a0fff690aadc636432ebeb9fd3a4a435be665559bfe) |
| `decline_encounter` | [decline](https://stellar.expert/explorer/testnet/tx/f9a03e14d9ab7d6f907bcca55fbedff6936f99c20ae962e175d56b2f74500afb) |
| `cancel_encounter` | [cancel](https://stellar.expert/explorer/testnet/tx/80d8a4748e3b3ac9c35776b49a5a7b1f95177fa54955128c8d9ec73b6c6879a1) |
| `expire_encounter` | [expire](https://stellar.expert/explorer/testnet/tx/d7a4f6eb73d018e99418986ef831f3ff5cc29c0f8a36e4ba7c499bdac2cc977d) |
| `get_encounter` | [read tx](https://stellar.expert/explorer/testnet/tx/0017a93ee0284d52553c7fd652366e36f28cc8cec03eebcf2b35ad375b7084c9) (ejecutada con `--send=yes`; solo lectura) |
| `get_afterglow` | [read tx](https://stellar.expert/explorer/testnet/tx/d155b9193d50f7f3a6cbee17032a7a92e1ddfd5e43ad06db7bd5e54b216ef3d1) (ejecutada con `--send=yes`; solo lectura) |

## B. Bóveda (reto exprés, contrato `boveda`)

| Nombre de la función | Enlace a la transacción que la usa |
|---|---|
| `fund(caller, amount)` — fondeo de 5555 XLM | [fondeo](https://stellar.expert/explorer/testnet/tx/9cc9866247bdb5975f56b677645187739fecebf463cb0e9905f434476fc9ad01) |
| `reclamar(caller, code_hash)` — **función nueva** | [demo 1 XLM](https://stellar.expert/explorer/testnet/tx/d1fb977f341adac241d11b645daa839a4899de785f89f8488a0908d94f2eb71a) |
| `__constructor(asset, code_hash)` | [deploy](https://stellar.expert/explorer/testnet/tx/beb1ad83b831dbc3d3c3e81b4ab2d8e0d81c710a0403c9daffc1c47aa99b98ca) |
| `status()` (bóveda activa) | [Ver tx](https://stellar.expert/explorer/testnet/tx/2a2eca8edab6c991e2e7d779fbd08c60fc240972330e6535e7f24c11aebfa9b9) · [read tx](https://stellar.expert/explorer/testnet/tx/8d83b3d72251afbd5a071e6c1be2f96822b3922dfdddbdba47d739d9e734ddb3) (ejecutada con `--send=yes`; solo lectura) |

## C. Endpoints y funciones de aplicación

| Nombre de la función | Enlace a la transacción que la usa |
|---|---|
| `POST /api/challenge-payment` (memo `SHIP-S97KF8`) | [G1](https://stellar.expert/explorer/testnet/tx/07a3183f03be6c6cea24e3380e84d5786217e2145a6f48d875081af7886d1064) · [G1-2](https://stellar.expert/explorer/testnet/tx/494d9e603cfb470ce6356027f199b6c95641839eaa237d11cdb2e739a138fc02) · [producción](https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8) |
| `POST /.netlify/functions/payment-coordinator` (idempotencia atómica) | [G2-1](https://stellar.expert/explorer/testnet/tx/d4cc0b48cf1e8295cfb46164156c62430b4452a147622e646f4771457a63361e) · [G2-2](https://stellar.expert/explorer/testnet/tx/3defdf7822d33aed8cab1eabc7f4a793bdcd1fbf67effda4103eac173997c723) · [directo](https://stellar.expert/explorer/testnet/tx/d108b2ab77456cc9caa99258a2f4ccce8d27a414b47b9d685d89e3dfa14796e3) |
| `GET /api/challenge-payment` (reconciliación) | N/A — consulta Horizon, no crea transacciones |
| `GET /api/status` (health + Blobs + RPC) | N/A — solo lectura |

## Detalle de las funciones nuevas (elegibles para «Función nueva»)

### `retirar(caller, encounter_id)`

- Contrato ECSTASY actual `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` (wasm `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e`).
- Retira solo el excedente sobre `ReservedStake`; transfiere XLM real, emite `funds_withdrawn` y no puede vaciar el escrow. Segundo retiro sin excedente → `InvalidState` (#6).
- Test: `contracts/ecstasy/tests/contract_test.rs`.

### `reclamar(caller, code_hash)`

- Bóveda principal `CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC` con 5555 XLM **sin reclamar**; la transacción enlazada usa una bóveda demo de 1 XLM (`CAXMW6JYOZZ2OO2XWZ35E6EI7SNO6QV7ACPVJA2RZSXXZ6YX6D7DDUYD`) para no vaciar el premio.
- Compara el SHA-256 del código con el digest fijado en el constructor; transfiere todo el saldo una sola vez y emite `ClaimEvent`. Código inválido → #1; duplicado → #2.
- Test: `contracts/boveda/tests/boveda_test.rs`.

### `POST /.netlify/functions/payment-coordinator`

- Coordinador nativo con adquisición atómica `onlyIfNew` en Netlify Blobs: 8 peticiones concurrentes → 1 pago, 1 hash, 7 respuestas reutilizadas.
- Tests: `apps/web/test/payment-policy.test.ts`, `payment-params.test.ts`, `payment-reconcile.test.ts`.

## Regla para futuras funciones

Al añadir cualquier función pública nueva (contrato, endpoint o servicio), agregar aquí una fila con el nombre completo, el enlace de la transacción en stellar.expert y una nota con el efecto observado y el archivo de tests. Si es de solo lectura o no tiene transacción publicada, indicar `N/A` y el motivo.
