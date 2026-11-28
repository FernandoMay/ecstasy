# Transacciones y acciones en Stellar Testnet

Archivo único de evidencia operacional: todos los pagos, despliegues, transiciones de contrato y acciones ejecutadas en Testnet, con sus URLs públicas de stellar.expert y Horizon.

| Dato | Valor |
|---|---|
| Red | Testnet (`Test SDF Network ; September 2015`) |
| RPC | https://soroban-testnet.stellar.org |
| Explorer | https://explorer.stellar.org (chain=testnet) · https://stellar.expert/explorer/testnet |
| App pública | https://ecs-tasy.netlify.app |
| Contrato actual | `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` |
| Asset de escrow | SAC nativo XLM `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Wasm actual | `4929c91d90915d4aac8e314e2fc7fc0f5f217ab37d1037db544a9d8bf773da0e` |
| Memo del reto | `SHIP-S97KF8` |

Todas las transacciones listadas son reales y fueron submitidas a Testnet. Las verificaciones que solo simularon una transacción (por ejemplo, `settle` repetido o `InvalidAsset`) se documentan al final y **no** tienen hash.

## 1. Despliegues del contrato

### `CCWVCW2BW2IGDZSTJG4IYSHD42CIPKTM7FGBOO7L4P7OBZ4YQZRSOKHO` (inicial, reemplazado)

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| Upload wasm | `2e760258ab0cb4cdf128b12e90e8dd552540152b418dff39462a1a55a8dfd33a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2e760258ab0cb4cdf128b12e90e8dd552540152b418dff39462a1a55a8dfd33a) |
| Instantiate | `5dfb90baba673763291dcd3390689e9472aab966424e0ff8036b00e53d4d538b` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5dfb90baba673763291dcd3390689e9472aab966424e0ff8036b00e53d4d538b) |

### `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` (fix self-auth en payout)

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| Upload wasm | `f1cca7c468bef0842c5f4e71eb53ed0e7d54ad5b4b5b05fc98a8a097e53c38e4` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f1cca7c468bef0842c5f4e71eb53ed0e7d54ad5b4b5b05fc98a8a097e53c38e4) |
| Instantiate | `1627c1fe3625178713d713885b616d1487eb33ccd2b55b60b212c55c9eb8545e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1627c1fe3625178713d713885b616d1487eb33ccd2b55b60b212c55c9eb8545e) |

### `CB7IX7KXOT7EDVNRFKN5UAT5TNNBVIAGM2IFLZIHIZXPXW7WH7I35DJV` (retirar)

El hash de despliegue de esta iteración no fue capturado en el log; el contract ID y el wasm están registrados en `docs/EVIDENCE.md`.

### `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` (TTL/single asset)

El hash de despliegue de esta iteración no fue capturado en el log; el contract ID y el wasm están registrados en `docs/EVIDENCE.md`.

### `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` (TTL final)

El hash de despliegue de esta iteración no fue capturado en el log; el contract ID y el wasm están registrados en `docs/EVIDENCE.md`.

### `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` (constructor asset, actual)

El hash de despliegue de esta iteración no fue capturado en el log; el contract ID y el wasm están registrados en `docs/EVIDENCE.md`.

## 2. Flujos completos del state machine (7 tx por contrato)

Cada secuencia corresponde a: create → accept → complete ×2 → settle → afterglow ×2, con stake de 1 XLM y dos identidades reales.

### Contrato `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W`

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · create_encounter (stake bloqueado) | `361e5a29b7b426ae7d0f31c080c32b0f6d4204bb292021705c47ae79f90ac956` | [Ver tx](https://stellar.expert/explorer/testnet/tx/361e5a29b7b426ae7d0f31c080c32b0f6d4204bb292021705c47ae79f90ac956) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · accept_encounter (consentimiento) | `f58e52bdb5dcd1612af2f73b706e902525ad4c184cbe9f0856f125865cacc54a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f58e52bdb5dcd1612af2f73b706e902525ad4c184cbe9f0856f125865cacc54a) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · complete_encounter (creador) | `47926ed9478a0b078875fb5b4d48ffa1e3c4f200ff9c58f8a64d82fdba0eb14e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/47926ed9478a0b078875fb5b4d48ffa1e3c4f200ff9c58f8a64d82fdba0eb14e) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · complete_encounter (participante) | `8884afc56be9e3ff7a2ea5a833fb3108e401d04e05f26202225c57a1789c2629` | [Ver tx](https://stellar.expert/explorer/testnet/tx/8884afc56be9e3ff7a2ea5a833fb3108e401d04e05f26202225c57a1789c2629) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · settle_encounter (transferencia de escrow) | `4bb317e9ddbf1e53d918297f44ad953998924ecf85aed04b0c1604255dab0665` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4bb317e9ddbf1e53d918297f44ad953998924ecf85aed04b0c1604255dab0665) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · submit_afterglow (creador, 88) | `3846b16768b4cd66f56475cd36ded29d343f832c6927543f6bc60c1c989ddd95` | [Ver tx](https://stellar.expert/explorer/testnet/tx/3846b16768b4cd66f56475cd36ded29d343f832c6927543f6bc60c1c989ddd95) |
| `CBZKLJGQP6ZYYY7CV37RWAGU72U4I5HXXHAPYW657YI2VQIZDGLNBP7W` · submit_afterglow (participante, 92) | `2c6fbc5f45ecf45d95fea97dabd8bf629e6c4a9d2d3306c9c7b6005996537aa8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2c6fbc5f45ecf45d95fea97dabd8bf629e6c4a9d2d3306c9c7b6005996537aa8) |

### Contrato `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2`

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · create_encounter (stake bloqueado) | `f53d02f19586beeca88dcdd334f8938f534c85ae53af16542432950cf00771a9` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f53d02f19586beeca88dcdd334f8938f534c85ae53af16542432950cf00771a9) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · accept_encounter (consentimiento) | `f4cc2d64bddf1e23783354cbcf82ff3311b009d4ad410f627658c5c2d0c4b7c9` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f4cc2d64bddf1e23783354cbcf82ff3311b009d4ad410f627658c5c2d0c4b7c9) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · complete_encounter (creador) | `9eb9f213109d162f3bdfcdbd3f74d7fb2400a467664ae14ff7552b6a6bbb45d3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/9eb9f213109d162f3bdfcdbd3f74d7fb2400a467664ae14ff7552b6a6bbb45d3) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · complete_encounter (participante) | `f272bdc0e2f1d03e82b6938e07aa76d194c6efde493ef2a3ece153f505de8201` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f272bdc0e2f1d03e82b6938e07aa76d194c6efde493ef2a3ece153f505de8201) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · settle_encounter (transferencia de escrow) | `f685c8bdd0e963c96300a39674af67d2ed9072a7328a769bcab5de4b8a22bb12` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f685c8bdd0e963c96300a39674af67d2ed9072a7328a769bcab5de4b8a22bb12) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · submit_afterglow (creador, 88) | `a9388eb82a64d83ed75ed4c4080ad6c8c5f0687f5a94dbef30925a40c4e248e8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/a9388eb82a64d83ed75ed4c4080ad6c8c5f0687f5a94dbef30925a40c4e248e8) |
| `CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2` · submit_afterglow (participante, 92) | `4ec7f294d50b86b23a6fa344f5fc98fffd32b675f1cabaa773a81d0620fe856c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4ec7f294d50b86b23a6fa344f5fc98fffd32b675f1cabaa773a81d0620fe856c) |

### Contrato `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY`

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · create_encounter (stake bloqueado) | `584f839f2e3f069ec74d91ad0d3b59ae73e264bf9490605e37c6e1b528870138` | [Ver tx](https://stellar.expert/explorer/testnet/tx/584f839f2e3f069ec74d91ad0d3b59ae73e264bf9490605e37c6e1b528870138) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · accept_encounter (consentimiento) | `b2739e809f2c799236a00c352f45b1a9378a968174c3432e17df45d4bda99e9e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b2739e809f2c799236a00c352f45b1a9378a968174c3432e17df45d4bda99e9e) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · complete_encounter (creador) | `f0bd3830e6bf0a59f8f9b0c8040c6dc68b16734fa959451867ee5ad37d202858` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f0bd3830e6bf0a59f8f9b0c8040c6dc68b16734fa959451867ee5ad37d202858) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · complete_encounter (participante) | `772dd8c2f263b5beb66c5f112778d322596bc74c197ec651e33635128f2f5a05` | [Ver tx](https://stellar.expert/explorer/testnet/tx/772dd8c2f263b5beb66c5f112778d322596bc74c197ec651e33635128f2f5a05) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · settle_encounter (transferencia de escrow) | `9692ac0b8730e75a68616dd1d74b460c5bb0355017882f18819111fae568151b` | [Ver tx](https://stellar.expert/explorer/testnet/tx/9692ac0b8730e75a68616dd1d74b460c5bb0355017882f18819111fae568151b) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · submit_afterglow (creador, 88) | `f17e588fce802ac7d83a9d69922cbf5ef16c534041fb1c1bdd5563084b84e467` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f17e588fce802ac7d83a9d69922cbf5ef16c534041fb1c1bdd5563084b84e467) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · submit_afterglow (participante, 92) | `af6bf77993ee06633c7af88cfeb4c1b9c2b6d28159fcacb0344ec77c96c68b3f` | [Ver tx](https://stellar.expert/explorer/testnet/tx/af6bf77993ee06633c7af88cfeb4c1b9c2b6d28159fcacb0344ec77c96c68b3f) |

### Contrato `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65`

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · create_encounter (stake bloqueado) | `42d87dbe215f0a63810e07279cb9cc34044feb1e5bc4907ce29a9a28b6529b1e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/42d87dbe215f0a63810e07279cb9cc34044feb1e5bc4907ce29a9a28b6529b1e) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · accept_encounter (consentimiento) | `541bf37ea78435e34e3b6f72c9e419846cec6bb299653e3e0908c3aa72d1dbe3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/541bf37ea78435e34e3b6f72c9e419846cec6bb299653e3e0908c3aa72d1dbe3) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · complete_encounter (creador) | `1b89f9d91423b7e9fe9fa9a0c11354cfe83fe32e2c12cf1e75edd1aa89c2c931` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1b89f9d91423b7e9fe9fa9a0c11354cfe83fe32e2c12cf1e75edd1aa89c2c931) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · complete_encounter (participante) | `b757aa9c001e80defb8434d635116da80726b196259664b23f4b1a01c598811b` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b757aa9c001e80defb8434d635116da80726b196259664b23f4b1a01c598811b) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · settle_encounter (transferencia de escrow) | `0b7221986bf74f50e2ee946c9ff08ea8b5fa3c1258f5c3f421b8f672353e3f19` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0b7221986bf74f50e2ee946c9ff08ea8b5fa3c1258f5c3f421b8f672353e3f19) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · submit_afterglow (creador, 88) | `e897b11a77124e94b5dbe1d56e1ea4641b988bf45fd6722c94e9ac840cfbe625` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e897b11a77124e94b5dbe1d56e1ea4641b988bf45fd6722c94e9ac840cfbe625) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · submit_afterglow (participante, 92) | `4f32c16bff15ec124bad51f474d46a90c14310f64f1ae90f97811c3c7d87e52a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4f32c16bff15ec124bad51f474d46a90c14310f64f1ae90f97811c3c7d87e52a) |

## 2b. Terminal branches y lecturas on-chain (ejecutadas 26 nov)

| Acción | Hash | Enlace |
|---|---|---|
| `decline_encounter` (encuentro #3) | `f9a03e14d9ab7d6f907bcca55fbedff6936f99c20ae962e175d56b2f74500afb` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f9a03e14d9ab7d6f907bcca55fbedff6936f99c20ae962e175d56b2f74500afb) |
| `cancel_encounter` (encuentro #4) | `80d8a4748e3b3ac9c35776b49a5a7b1f95177fa54955128c8d9ec73b6c6879a1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/80d8a4748e3b3ac9c35776b49a5a7b1f95177fa54955128c8d9ec73b6c6879a1) |
| `expire_encounter` (encuentro #5, permissionless desde Wallet B) | `d7a4f6eb73d018e99418986ef831f3ff5cc29c0f8a36e4ba7c499bdac2cc977d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d7a4f6eb73d018e99418986ef831f3ff5cc29c0f8a36e4ba7c499bdac2cc977d) |
| `get_encounter` (`--send=yes`) | `0017a93ee0284d52553c7fd652366e36f28cc8cec03eebcf2b35ad375b7084c9` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0017a93ee0284d52553c7fd652366e36f28cc8cec03eebcf2b35ad375b7084c9) |
| `get_afterglow` (`--send=yes`) | `d155b9193d50f7f3a6cbee17032a7a92e1ddfd5e43ad06db7bd5e54b216ef3d1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d155b9193d50f7f3a6cbee17032a7a92e1ddfd5e43ad06db7bd5e54b216ef3d1) |
| `status` de la bóveda (`--send=yes`) | `8d83b3d72251afbd5a071e6c1be2f96822b3922dfdddbdba47d739d9e734ddb3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/8d83b3d72251afbd5a071e6c1be2f96822b3922dfdddbdba47d739d9e734ddb3) |

Las tres ramas terminales devolvieron eventos `encounter_declined`, `encounter_cancelled` y `encounter_expired` respectivamente. `expire_encounter` fue llamada por una wallet que no es parte del encuentro, confirmando que es permisionless y que el reembolso va al creador. Los hashes de lectura se generaron con `--send=yes`; las mismas funciones siguen siendo de solo lectura en la app.

## 2c. Re-verificación funcional (26 nov, commit `6154d2e`)

Smoke completo reejecutado sobre el contrato activo `CDG4L3FJ…` y lectura on-chain de la bóveda activa `CAWOC5VH…`. Los ocho hashes fueron localizados en Horizon con `successful: true`.

| Acción | Hash | Enlace |
|---|---|---|
| `create_encounter` | `cb9554a1fa2568e0254cdf9a1d59932b5edb8e1e65f3782e859b3a7204ec6347` | [Ver tx](https://stellar.expert/explorer/testnet/tx/cb9554a1fa2568e0254cdf9a1d59932b5edb8e1e65f3782e859b3a7204ec6347) |
| `accept_encounter` | `5c26b980c2cb32878caeda0e5482f58d3bdc6f8dc813e97be0429ecd6e16894f` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5c26b980c2cb32878caeda0e5482f58d3bdc6f8dc813e97be0429ecd6e16894f) |
| `complete_encounter` (creador) | `e69577c0acdd05f7282b9cf802c8e661f8d833dd37ee7fe609a9a1b4934a099c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e69577c0acdd05f7282b9cf802c8e661f8d833dd37ee7fe609a9a1b4934a099c) |
| `complete_encounter` (participante) | `0acb3f850db6ff5433caf63d686fc04e9bcb78537ea42d4ec2f5e238953d4113` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0acb3f850db6ff5433caf63d686fc04e9bcb78537ea42d4ec2f5e238953d4113) |
| `settle_encounter` | `e18c7ed7ddf14e3fd3ecb99d731f4d09f9d920e14425faed9ca06504fe523fc8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e18c7ed7ddf14e3fd3ecb99d731f4d09f9d920e14425faed9ca06504fe523fc8) |
| `submit_afterglow` (creador, 88) | `d8697cf74935c3c4f17b7d085d9338f51088d0ca8c463d1a2b248e4a3aae3290` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d8697cf74935c3c4f17b7d085d9338f51088d0ca8c463d1a2b248e4a3aae3290) |
| `submit_afterglow` (participante, 92) | `e264b7fa210390068d2410fee0c36418ecf4221c8be604a2a13022cc9ae1f3fa` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e264b7fa210390068d2410fee0c36418ecf4221c8be604a2a13022cc9ae1f3fa) |
| `status` bóveda activa (`--send=yes`) | `2a2eca8edab6c991e2e7d779fbd08c60fc240972330e6535e7f24c11aebfa9b9` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2a2eca8edab6c991e2e7d779fbd08c60fc240972330e6535e7f24c11aebfa9b9) |

## 2d. Segundo ciclo completo (cobertura adicional)

| Acción | Hash | Enlace |
|---|---|---|
| Crear encuentro (ciclo 2) | `f2af900947d8c1dfb65b2543695d60cf6f6451156e858f52f8f59dd1b3a90d34` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f2af900947d8c1dfb65b2543695d60cf6f6451156e858f52f8f59dd1b3a90d34) |
| Consentir (ciclo 2) | `7f904589fc8381f1b752eb3ad0d239698c77db8fc0ff7509ce0add4810e55c95` | [Ver tx](https://stellar.expert/explorer/testnet/tx/7f904589fc8381f1b752eb3ad0d239698c77db8fc0ff7509ce0add4810e55c95) |
| Completar creador (ciclo 2) | `b236551fea6578a644b3c1f942d38d8204c1ddf37bdccf80673414ba530fb937` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b236551fea6578a644b3c1f942d38d8204c1ddf37bdccf80673414ba530fb937) |
| Completar participante (ciclo 2) | `dfd73405a38b1b54dc84704384014646c7386d4e6b5029cfce9d86b94142c95d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/dfd73405a38b1b54dc84704384014646c7386d4e6b5029cfce9d86b94142c95d) |
| Liquidar (ciclo 2) | `6c99b92570d56f747d70526a7eef5ad6d14eb61b41ca50467fb5421b734564b5` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6c99b92570d56f747d70526a7eef5ad6d14eb61b41ca50467fb5421b734564b5) |
| Afterglow creador (ciclo 2) | `e51596792ae482e4ead5db7ff062f06ba04d0674cdee7cf6a0308303e48e4d40` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e51596792ae482e4ead5db7ff062f06ba04d0674cdee7cf6a0308303e48e4d40) |
| Afterglow participante (ciclo 2) | `5648fb106608c278dc0a133e0718a9fb30d0e6379423a5bb8bb5e401d869b90c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5648fb106608c278dc0a133e0718a9fb30d0e6379423a5bb8bb5e401d869b90c) |

Todos los hashes localizados en Horizon con `successful: true`.

## 3. `retirar` y contabilidad de escrow

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| `CB7IX7KXOT7EDVNRFKN5UAT5TNNBVIAGM2IFLZIHIZXPXW7WH7I35DJV` · surplus 2 XLM | `14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/14a8a267412de480364c8f27fdb021eb47c36e8190589fe998b7db752b0ecf0e) |
| `CARK3GAFTYJEGBSECO7MEDA2WVNTP7L4OJQ4PTQN7336OLJVR5ZAIZRY` · surplus 2 XLM | `1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1f595ef796ff309c630b5d909cd7a27dd57a2c826b5d6c651139fb230b6d9ec6) |
| `CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65` · surplus 2 XLM | `2333ac89b2e536506d174a0fff690aadc636432ebeb9fd3a4a435be665559bfe` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2333ac89b2e536506d174a0fff690aadc636432ebeb9fd3a4a435be665559bfe) |
| SAC nativo · fondeo excedente al contrato | `1c8f55c56d3b89c19605c18fa5ad7d15d0aa3733f99ceef4d4ab09fe76792eb5` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1c8f55c56d3b89c19605c18fa5ad7d15d0aa3733f99ceef4d4ab09fe76792eb5) |

No se capturó una transacción de `retirar` para la iteración `CBX2IKIF…`; las versiones con evidencia son `CB7IX7KX…`, `CARK3GAF…` y `CDG4L3FJ…`.

El evento observado en cada `retirar` fue `EncounterEvent` con `name=funds_withdrawn`, `status=withdrawn`, `stake=20000000` junto con un `transfer` del SAC nativo por 20.000.000 stroops. Un segundo intento sin excedente fue rechazado con `Error(Contract, #6)`.

## 4. Pagos del reto (memo `SHIP-S97KF8`)

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| Challenge payment · local (primera prueba) | `94f69d66bb3019a9adeaef5071cfe73e0fd58794fb891a600af12f47aff7f893` | [Ver tx](https://stellar.expert/explorer/testnet/tx/94f69d66bb3019a9adeaef5071cfe73e0fd58794fb891a600af12f47aff7f893) |
| Challenge payment · producción (rate limit verificado) | `da1d9f6018df0a93336e5b0294738c64d52b6c1d60d9d3317d10e8a327f600ed` | [Ver tx](https://stellar.expert/explorer/testnet/tx/da1d9f6018df0a93336e5b0294738c64d52b6c1d60d9d3317d10e8a327f600ed) |
| Challenge payment · producción (modo compartido) | `20d01d8e013d76ef8feb4b5ffb13781f2a6f92ed6dfd0eb4b6b3a2ad62097875` | [Ver tx](https://stellar.expert/explorer/testnet/tx/20d01d8e013d76ef8feb4b5ffb13781f2a6f92ed6dfd0eb4b6b3a2ad62097875) |
| Challenge payment · producción (evidencia RC-1) | `84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/84d812fbbcc5098f6c028eda6a4396ae07fde049db74f0ef27d86762561e9fd8) |
| Challenge payment · producción (telemetría) | `600f91ff10957cabb990ea4cd9a182c3b280f1ecba8f8b77d0cec655b9884f0f` | [Ver tx](https://stellar.expert/explorer/testnet/tx/600f91ff10957cabb990ea4cd9a182c3b280f1ecba8f8b77d0cec655b9884f0f) |
| **G1 · pago público desde Netlify (1)** | `07a3183f03be6c6cea24e3380e84d5786217e2145a6f48d875081af7886d1064` | [Ver tx](https://stellar.expert/explorer/testnet/tx/07a3183f03be6c6cea24e3380e84d5786217e2145a6f48d875081af7886d1064) |
| **G1 · pago público desde Netlify (2, tras revert)** | `494d9e603cfb470ce6356027f199b6c95641839eaa237d11cdb2e739a138fc02` | [Ver tx](https://stellar.expert/explorer/testnet/tx/494d9e603cfb470ce6356027f199b6c95641839eaa237d11cdb2e739a138fc02) |

Todos los pagos anteriores fueron verificados en Horizon con `successful: true`, `memo_type: text` y `memo: SHIP-S97KF8`. Formato de verificación alternativo: `https://horizon-testnet.stellar.org/transactions/<hash>`

## 5. Prueba de concurrencia inicial (G2: evidencia del fallo)

Ocho peticiones paralelas con la misma `x-idempotency-key` desde la URL pública: **7 pagos aceptados y 1 `friendbot_timeout`**. Esto demuestra que la guarda en memoria no se comparte entre instancias de Netlify.

| Acción | Hash | Enlace stellar.expert |
|---|---|---|
| Pago concurrente #1 | `e8b216a68828d0c8884c276671242e9c1de6d615d6b79885f63673cc4651f90d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e8b216a68828d0c8884c276671242e9c1de6d615d6b79885f63673cc4651f90d) |
| Pago concurrente #2 | `997dfd8b4fd3174d5093f8a4c52a9181b6d5cc0433333a438e47dd8f7c6cb3c1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/997dfd8b4fd3174d5093f8a4c52a9181b6d5cc0433333a438e47dd8f7c6cb3c1) |
| Pago concurrente #3 | `a05656eed7ca391b2400732d811516f8ec0e2a31e3b729bcec346248b7a59e41` | [Ver tx](https://stellar.expert/explorer/testnet/tx/a05656eed7ca391b2400732d811516f8ec0e2a31e3b729bcec346248b7a59e41) |
| Pago concurrente #4 | `5d92ab4ca66901bd3646d4409df6fbb48c915e4f1d429fcbdb9911aed99f885d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5d92ab4ca66901bd3646d4409df6fbb48c915e4f1d429fcbdb9911aed99f885d) |
| Pago concurrente #5 | `beeebeaabd8c5b164222bc9e1e41312fc6a4531b870d8c52d951568da45c853d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/beeebeaabd8c5b164222bc9e1e41312fc6a4531b870d8c52d951568da45c853d) |
| Pago concurrente #6 | `45c4e47ca09fe6bdbdd418d5473dcfe55328509a277ce9b3dbdef34c9352c49c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/45c4e47ca09fe6bdbdd418d5473dcfe55328509a277ce9b3dbdef34c9352c49c) |
| Pago concurrente #7 | `3528d684e4a02aa7b998f3e93efc452845fa217a5e2bad0449e9c0eb25e2f754` | [Ver tx](https://stellar.expert/explorer/testnet/tx/3528d684e4a02aa7b998f3e93efc452845fa217a5e2bad0449e9c0eb25e2f754) |

## 5b. Idempotencia atómica distribuida (G2)

Ocho peticiones concurrentes con la misma `x-idempotency-key`: **1 pago, 1 hash, 7 respuestas reutilizadas**. Coordinador nativo con `onlyIfNew` en Netlify Blobs.

| Ronda | Hash ganador | Enlace |
|---|---|---|
| Concurrencia final | `d4cc0b48cf1e8295cfb46164156c62430b4452a147622e646f4771457a63361e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d4cc0b48cf1e8295cfb46164156c62430b4452a147622e646f4771457a63361e) |
| Concurrencia con espera de resultados | `3defdf7822d33aed8cab1eabc7f4a793bdcd1fbf67effda4103eac173997c723` | [Ver tx](https://stellar.expert/explorer/testnet/tx/3defdf7822d33aed8cab1eabc7f4a793bdcd1fbf67effda4103eac173997c723) |
| Pago vía coordinador (directo) | `d108b2ab77456cc9caa99258a2f4ccce8d27a414b47b9d685d89e3dfa14796e3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d108b2ab77456cc9caa99258a2f4ccce8d27a414b47b9d685d89e3dfa14796e3) |
| Pago vía ruta → coordinador | `0018e35b01026504533c8845c2fa649993c8d10108da1da00577a82f94810bbc` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0018e35b01026504533c8845c2fa649993c8d10108da1da00577a82f94810bbc) |

## 5c. Bóveda (reto exprés 26 nov)

| Acción | Hash | Enlace |
|---|---|---|
| Deploy bóveda principal | `beb1ad83b831dbc3d3c3e81b4ab2d8e0d81c710a0403c9daffc1c47aa99b98ca` | [Ver tx](https://stellar.expert/explorer/testnet/tx/beb1ad83b831dbc3d3c3e81b4ab2d8e0d81c710a0403c9daffc1c47aa99b98ca) |
| Fondeo 5555 XLM | `9cc9866247bdb5975f56b677645187739fecebf463cb0e9905f434476fc9ad01` | [Ver tx](https://stellar.expert/explorer/testnet/tx/9cc9866247bdb5975f56b677645187739fecebf463cb0e9905f434476fc9ad01) |
| `reclamar` en bóveda demo | `d1fb977f341adac241d11b645daa839a4899de785f89f8488a0908d94f2eb71a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d1fb977f341adac241d11b645daa839a4899de785f89f8488a0908d94f2eb71a) |
| **Nuevo fondeo 5555 XLM** (bóveda activa `CAWOC5VH…`) | `d31078891788f47453833ccc71794d92973a00fcda9bb60d814df5b191868f9a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d31078891788f47453833ccc71794d92973a00fcda9bb60d814df5b191868f9a) |

## 6. Refund mutuo (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Refund proponer | `bb1381e3faea18dde11620832b1d68f60b750485bd7eaadcfbde6e826ff2de19` | [Ver tx](https://stellar.expert/explorer/testnet/tx/bb1381e3faea18dde11620832b1d68f60b750485bd7eaadcfbde6e826ff2de19) |
| Refund aprobar | `f994e2eb2b8f8d9bbbf8ecdbe133587cd125bbc56d9b4426b0b0e945c47cbd01` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f994e2eb2b8f8d9bbbf8ecdbe133587cd125bbc56d9b4426b0b0e945c47cbd01) |
| Refund ejecutar | `31b708a2a94b1b712a0cb1b0f7d7050afbb7e7677f401a07941bb9eba2c462e2` | [Ver tx](https://stellar.expert/explorer/testnet/tx/31b708a2a94b1b712a0cb1b0f7d7050afbb7e7677f401a07941bb9eba2c462e2) |
| Refund proponer (rechazo) | `c9809f1fe9af7518c666e3dfb97b1e628da06ddf0946990f02a5b7b2ba6b1d5e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/c9809f1fe9af7518c666e3dfb97b1e628da06ddf0946990f02a5b7b2ba6b1d5e) |
| Refund rechazar | `50263a74841ef999e2a93e92d28bdf3f1247828a7a892d41dc6e2485da970523` | [Ver tx](https://stellar.expert/explorer/testnet/tx/50263a74841ef999e2a93e92d28bdf3f1247828a7a892d41dc6e2485da970523) |
| Refund proponer (revocación) | `2c1fb704e02e1ede1ef8a64af9c101465299fa45f999835b5db9c2becad3bd61` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2c1fb704e02e1ede1ef8a64af9c101465299fa45f999835b5db9c2becad3bd61) |
| Refund revocar | `50e0a196ebf94c29dbfffd2a3c71d153a7102f44ba49f72673f71ac01e6cea97` | [Ver tx](https://stellar.expert/explorer/testnet/tx/50e0a196ebf94c29dbfffd2a3c71d153a7102f44ba49f72673f71ac01e6cea97) |

Todos los hashes verificados en Horizon con `successful: true`.

## 7. Timeout recovery (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Recovery proponer | `0b6437ec56f6876954f2572a549e9c277fcf5ede8316bfa7980d4becddcff4f7` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0b6437ec56f6876954f2572a549e9c277fcf5ede8316bfa7980d4becddcff4f7) |
| Recovery aprobar | `6eb51c0a8cc1f8f22dfa020cd58eb372c487df99c3fe84f4185b0cc68a2c89d4` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6eb51c0a8cc1f8f22dfa020cd58eb372c487df99c3fe84f4185b0cc68a2c89d4) |
| Recovery ejecutar | `9894dc3cb47c3d2e9b7edc1861f4581710a173994f7615e51e99868bc1fbb09b` | [Ver tx](https://stellar.expert/explorer/testnet/tx/9894dc3cb47c3d2e9b7edc1861f4581710a173994f7615e51e99868bc1fbb09b) |
| Recovery proponer (timeout) | `325013c149fcca63b6cfc16deb42cf5921ea398150f53447c643bd61d67a44ea` | [Ver tx](https://stellar.expert/explorer/testnet/tx/325013c149fcca63b6cfc16deb42cf5921ea398150f53447c643bd61d67a44ea) |
| Recovery recuperar (tercero) | `ebc2f2403341c36701940ea2ab4fc3f6679e47feace69cf40f744c73ddb81579` | [Ver tx](https://stellar.expert/explorer/testnet/tx/ebc2f2403341c36701940ea2ab4fc3f6679e47feace69cf40f744c73ddb81579) |

El intento de aprobación tardía fue rechazado en simulación (#3), sin hash.

## 8. Escrow arbitration (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Arbitraje depositar | `6eb11aa8a67d1a76364df514e5a355170a15f4044b5ca7143de1dcce40295554` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6eb11aa8a67d1a76364df514e5a355170a15f4044b5ca7143de1dcce40295554) |
| Arbitraje argumento | `7f4b26b3d0e4b212ab58557fcb5d6dda58f53060a37610ca0c0e15d1ae701f0f` | [Ver tx](https://stellar.expert/explorer/testnet/tx/7f4b26b3d0e4b212ab58557fcb5d6dda58f53060a37610ca0c0e15d1ae701f0f) |
| Arbitraje Release | `7dde0fbf8bbabad2a10100e71792f759f6d6b35e9f306a4f79cc0394dd74854a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/7dde0fbf8bbabad2a10100e71792f759f6d6b35e9f306a4f79cc0394dd74854a) |
| Arbitraje depositar (refund) | `ae2f2b24f7516ae9d1c2bfa8b33699ef3bc85bf21f0f880e096187bcfe43b7b2` | [Ver tx](https://stellar.expert/explorer/testnet/tx/ae2f2b24f7516ae9d1c2bfa8b33699ef3bc85bf21f0f880e096187bcfe43b7b2) |
| Arbitraje Refund | `2cd356bae3452a922ed57fb134dd77de19ae5d01a45f358cef828f739354de1d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2cd356bae3452a922ed57fb134dd77de19ae5d01a45f358cef828f739354de1d) |
| Arbitraje depositar (split) | `e282a4e3750e0778abcdb158684e220408d05ddb4f55a062cdcba146a46089fd` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e282a4e3750e0778abcdb158684e220408d05ddb4f55a062cdcba146a46089fd) |
| Arbitraje Split | `d5ba24a810434e443c25fc201ff27d3a537dbc3fff258086b3765c09e2ed9e13` | [Ver tx](https://stellar.expert/explorer/testnet/tx/d5ba24a810434e443c25fc201ff27d3a537dbc3fff258086b3765c09e2ed9e13) |

El intento de doble resolución fue rechazado en simulación (#3), sin hash.

## 9. Milestone escrow (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Hitos crear | `18a681274cd9e8c47d1040a63db60b99b15b0d56651b27ac477f5175f63b5be8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/18a681274cd9e8c47d1040a63db60b99b15b0d56651b27ac477f5175f63b5be8) |
| Hitos submit 0 | `0cfcbde2948e9eac8bb495461647485b9ad38436aa649ce27cebf063f97a4066` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0cfcbde2948e9eac8bb495461647485b9ad38436aa649ce27cebf063f97a4066) |
| Hitos approve 0 | `c17a91fa0db82b7c1a26cd7d53b877537c35896d249259810b5fe9eb0a64bc6c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/c17a91fa0db82b7c1a26cd7d53b877537c35896d249259810b5fe9eb0a64bc6c) |
| Hitos submit 1 | `68f715f9ad833e5e8d0ead9760f4d01f45719e961ba9d13053bb99e2161ce31c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/68f715f9ad833e5e8d0ead9760f4d01f45719e961ba9d13053bb99e2161ce31c) |
| Hitos dispute 1 | `4e38f6a27c5eca04fe090bfcbf0f2a4a8e9ddada8a2974e38465fda8b3bd93e0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4e38f6a27c5eca04fe090bfcbf0f2a4a8e9ddada8a2974e38465fda8b3bd93e0) |
| Hitos resolve 1 | `37a2e1176eb0b2e260aa2176fdc06a9a2769231e6647088f4910505f12bd4af8` | [Ver tx](https://stellar.expert/explorer/testnet/tx/37a2e1176eb0b2e260aa2176fdc06a9a2769231e6647088f4910505f12bd4af8) |
| Hitos recover 2 | `479ddc98ee23ebf67c12bcaca4d2aedcd9f9229b3534eb2b68080b937e0c05ff` | [Ver tx](https://stellar.expert/explorer/testnet/tx/479ddc98ee23ebf67c12bcaca4d2aedcd9f9229b3534eb2b68080b937e0c05ff) |

## 10. Panel arbitration (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Panel crear | `98263acb250b3e82bd2d38f0a13adf6bdf83f525b3d0f22ee7059275e825a602` | [Ver tx](https://stellar.expert/explorer/testnet/tx/98263acb250b3e82bd2d38f0a13adf6bdf83f525b3d0f22ee7059275e825a602) |
| Panel commit 1 | `171f1028138ea691fba69ac80252b281b1551b6595672e05cd621d38a296bef2` | [Ver tx](https://stellar.expert/explorer/testnet/tx/171f1028138ea691fba69ac80252b281b1551b6595672e05cd621d38a296bef2) |
| Panel commit 2 | `9e8cfe8b27e3746547f2c25ed12e28f7b4b69e51e3f0a3978ee905cf694e5bdb` | [Ver tx](https://stellar.expert/explorer/testnet/tx/9e8cfe8b27e3746547f2c25ed12e28f7b4b69e51e3f0a3978ee905cf694e5bdb) |
| Panel commit 3 | `47d39715471bfc0b390063128d8bd7ec767b1c50b6bcb6ba2690c4fa7b68958e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/47d39715471bfc0b390063128d8bd7ec767b1c50b6bcb6ba2690c4fa7b68958e) |
| Panel reveal 1 | `05e6da527366c5f166fa1d042c5a0ce8eeb7b370a4b030d93d1d9e8769088936` | [Ver tx](https://stellar.expert/explorer/testnet/tx/05e6da527366c5f166fa1d042c5a0ce8eeb7b370a4b030d93d1d9e8769088936) |
| Panel reveal 2 | `f877de9a6455d759f5741b36ee885fa7b82d4fa853dd7f9b71014562b86c97a0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f877de9a6455d759f5741b36ee885fa7b82d4fa853dd7f9b71014562b86c97a0) |
| Panel reveal 3 | `13a99ea2534ba9c75569d6aec3b155e57d17dc5cd189698420242b0095c9e151` | [Ver tx](https://stellar.expert/explorer/testnet/tx/13a99ea2534ba9c75569d6aec3b155e57d17dc5cd189698420242b0095c9e151) |
| Panel resolver quórum | `c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460` | [Ver tx](https://stellar.expert/explorer/testnet/tx/c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460) |

## 11. Reputación y trazabilidad (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Registro autorizar fuente | `07e715e8f71922cdec105d8494027ff1f4c5b63cc29c580694e2b70b3e644da0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/07e715e8f71922cdec105d8494027ff1f4c5b63cc29c580694e2b70b3e644da0) |
| Registro perfil árbitro 1 | `4530b6247ae15b6f668638903dcce054b2b6f7a913cb7e003127c71f9d75a764` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4530b6247ae15b6f668638903dcce054b2b6f7a913cb7e003127c71f9d75a764) |
| Registro perfil árbitro 2 | `84974f588d5533ffb3e8d200541de8d9d942e76ab180bef7285186c84fdf6310` | [Ver tx](https://stellar.expert/explorer/testnet/tx/84974f588d5533ffb3e8d200541de8d9d942e76ab180bef7285186c84fdf6310) |
| Registro caso finalizado | `c9ec7ae231791af261e705f1c213128b1496bad6903ab9e8e7404f85368e443d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/c9ec7ae231791af261e705f1c213128b1496bad6903ab9e8e7404f85368e443d) |
| Registro participación 1 | `b517c1ed4e0aa966b5f15bc3a0cd3f603f94a1c8744af309639760500f216ca7` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b517c1ed4e0aa966b5f15bc3a0cd3f603f94a1c8744af309639760500f216ca7) |
| Registro participación 2 | `50c4f635e3f3f42bd1eac643211c4bd996275b6a808a4abd384edc76470a95b9` | [Ver tx](https://stellar.expert/explorer/testnet/tx/50c4f635e3f3f42bd1eac643211c4bd996275b6a808a4abd384edc76470a95b9) |
| Registro suspensión | `2b304c53ae7a39b85744ba52cf6eca9c80dfacda9571bd142c04caa8689b6859` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2b304c53ae7a39b85744ba52cf6eca9c80dfacda9571bd142c04caa8689b6859) |
| Trazabilidad enlace ciclo | `f6401f41e3d5300f467876b13077ac4c833ee43eccd1522f6c993c2feae5dbef` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f6401f41e3d5300f467876b13077ac4c833ee43eccd1522f6c993c2feae5dbef) |

El hash de liquidación enlazado es `c011a3d30b320181bd67eca3ede85e63ecdc4d4598f5bb48db2416a1024cd460`, la transacción real de resolución del panel.

## 12. Streaming payments (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Streaming crear flujo 1 | `6af36f4df534ea3fccb98dd5dbca89f862d5868dc913579b76f09f207cfc7e93` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6af36f4df534ea3fccb98dd5dbca89f862d5868dc913579b76f09f207cfc7e93) |
| Streaming claim 1 | `618bfa9c6a5fc0d5984890aa6edce755bef00b346b205723a8bbf3ec203852b5` | [Ver tx](https://stellar.expert/explorer/testnet/tx/618bfa9c6a5fc0d5984890aa6edce755bef00b346b205723a8bbf3ec203852b5) |
| Streaming pausar | `7dabf9fbb5bbe219d747a6876f42d8c7f262591e77b351e9f37ac6727d5d8148` | [Ver tx](https://stellar.expert/explorer/testnet/tx/7dabf9fbb5bbe219d747a6876f42d8c7f262591e77b351e9f37ac6727d5d8148) |
| Streaming claim en pausa | `cbed6d41df81d7394199195a66f3439b6ca3d0718abe9596d14522725d4de54b` | [Ver tx](https://stellar.expert/explorer/testnet/tx/cbed6d41df81d7394199195a66f3439b6ca3d0718abe9596d14522725d4de54b) |
| Streaming reanudar | `440d7633a3a486b551b6fdd7e90c7a7fe2cade307d18d38f518f2423dc8a11da` | [Ver tx](https://stellar.expert/explorer/testnet/tx/440d7633a3a486b551b6fdd7e90c7a7fe2cade307d18d38f518f2423dc8a11da) |
| Streaming claim 2 | `029ff8940899f05d1b27e7e45231c6a0259f2a387799b5ad5274f95e5ffa472e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/029ff8940899f05d1b27e7e45231c6a0259f2a387799b5ad5274f95e5ffa472e) |
| Streaming cancelar | `1cf7f41bf5293819edd311478a41b93fa408a3af2246c43b96b1f76ae7dcd74e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1cf7f41bf5293819edd311478a41b93fa408a3af2246c43b96b1f76ae7dcd74e) |
| Streaming crear flujo 2 | `3c6191bfa06d90341fb9d92bc4ed6279561a090ac0986f0e913673e8f823866d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/3c6191bfa06d90341fb9d92bc4ed6279561a090ac0986f0e913673e8f823866d) |
| Streaming claim total | `ca8b8965b7f6c873354178e67b3dc232e0915c3a484989c00be7876efa60c614` | [Ver tx](https://stellar.expert/explorer/testnet/tx/ca8b8965b7f6c873354178e67b3dc232e0915c3a484989c00be7876efa60c614) |
| Streaming cerrar | `a9c58b7545ee6d4a64a0a83a600990a660ae2b700a1b68a7877a7ab569c71ab5` | [Ver tx](https://stellar.expert/explorer/testnet/tx/a9c58b7545ee6d4a64a0a83a600990a660ae2b700a1b68a7877a7ab569c71ab5) |

Reconciliación flujo 1: 6,000,000 = 900,000 (claims) + 200,000 (cancel) + 4,900,000 (remanente). Flujo 2: 3,000,000 = 3,000,000 (claim total) → `Closed`. Comisiones de red excluidas.

## 13. Subscription escrow (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| Suscripción crear plan | `94f22917e9d7b17fc6f848e8acba8c8120e62e11270c1041ef69c5cdbcd81082` | [Ver tx](https://stellar.expert/explorer/testnet/tx/94f22917e9d7b17fc6f848e8acba8c8120e62e11270c1041ef69c5cdbcd81082) |
| Suscripción financiar 1 | `70cf87b78649e6214888bb621c5259ac4827f9454e56f7f640cad62e81f5f20f` | [Ver tx](https://stellar.expert/explorer/testnet/tx/70cf87b78649e6214888bb621c5259ac4827f9454e56f7f640cad62e81f5f20f) |
| Suscripción entrega 1 | `44cd999f197e3bc102ba8a7ff4c6e078a13ecf6e3d4b9efc00e4889223fba918` | [Ver tx](https://stellar.expert/explorer/testnet/tx/44cd999f197e3bc102ba8a7ff4c6e078a13ecf6e3d4b9efc00e4889223fba918) |
| Suscripción aprobar 1 | `fd9fe84cfd918b423d168b6b83f0fab2726bd98e398cffd048c03856f3ac88c2` | [Ver tx](https://stellar.expert/explorer/testnet/tx/fd9fe84cfd918b423d168b6b83f0fab2726bd98e398cffd048c03856f3ac88c2) |
| Suscripción financiar 2 | `a60b62d610aa3b740d3210c8246da351d120c26629a0b8488be1315eaed33f67` | [Ver tx](https://stellar.expert/explorer/testnet/tx/a60b62d610aa3b740d3210c8246da351d120c26629a0b8488be1315eaed33f67) |
| Suscripción disputar 2 | `f333e06feb5b972965aed2ceeaac7c7f068e6eee4077b60b54505bce98e34f8d` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f333e06feb5b972965aed2ceeaac7c7f068e6eee4077b60b54505bce98e34f8d) |
| Suscripción resolver 2 | `678190dbb08075ff7e17372188a0f04f6f94cf8745318154505927955edf488c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/678190dbb08075ff7e17372188a0f04f6f94cf8745318154505927955edf488c) |
| Suscripción cancelar plan | `28acb88e04bd1e1cb96cadef528de1f4a225a407bbe87d23993884ca5c940b60` | [Ver tx](https://stellar.expert/explorer/testnet/tx/28acb88e04bd1e1cb96cadef528de1f4a225a407bbe87d23993884ca5c940b60) |
| Suscripción autorizar fuente | `5bcebdd72450be46e0257077b054cbfd6b50cc2a13e3f59caab1b9e0aa46bab3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5bcebdd72450be46e0257077b054cbfd6b50cc2a13e3f59caab1b9e0aa46bab3) |
| Suscripción registrar resultado | `acc5b2c3d8ea0e737c27316832e250619bcae8b7c520d9bc8ad0fa5e06cab646` | [Ver tx](https://stellar.expert/explorer/testnet/tx/acc5b2c3d8ea0e737c27316832e250619bcae8b7c520d9bc8ad0fa5e06cab646) |
| Suscripción enlazar ciclo | `bff926f11809348dab317956a216409f6a1016a1dba3a359b58c55b2692c1066` | [Ver tx](https://stellar.expert/explorer/testnet/tx/bff926f11809348dab317956a216409f6a1016a1dba3a359b58c55b2692c1066) |

Reconciliación: 2,000,000 = 1,000,000 (periodo 1 aprobado) + 1,000,000 (periodo 2 devuelto); saldo 0. El intento de financiar el periodo 3 tras cancelar fue rechazado en simulación (#7), sin hash.

## 14. Milestones V2 (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| V2 hitos crear 1 | `72fa8f001214b6625cd01b9f5677467419b27b561a8a79f3ff059e2f6ebb8ff3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/72fa8f001214b6625cd01b9f5677467419b27b561a8a79f3ff059e2f6ebb8ff3) |
| V2 hitos entrega m0 | `b802aa3fb3b0cb905e2f5facfa69ae43ae4ab289c5c91cc5904405dd8c98a69e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b802aa3fb3b0cb905e2f5facfa69ae43ae4ab289c5c91cc5904405dd8c98a69e) |
| V2 hitos aprobar m0 | `5355cee396e57013bbf7eeda916009bd826efee1a4757c73665284f1f3b7542a` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5355cee396e57013bbf7eeda916009bd826efee1a4757c73665284f1f3b7542a) |
| V2 hitos entrega m1 | `701e199ec350ae38549cea36ae0ea79a0c96707b8970d7e52d52d44a0349a61e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/701e199ec350ae38549cea36ae0ea79a0c96707b8970d7e52d52d44a0349a61e) |
| V2 hitos disputar m1 | `aaee99d52515838c3c6ad5a1c185ecd0a623cf5c841df043bc485d3fa2c4c729` | [Ver tx](https://stellar.expert/explorer/testnet/tx/aaee99d52515838c3c6ad5a1c185ecd0a623cf5c841df043bc485d3fa2c4c729) |
| V2 hitos resolver m1 | `da60f72cdef229c3136a9eb3eaf771464a04367e625e2633a78abeec4aeba9c0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/da60f72cdef229c3136a9eb3eaf771464a04367e625e2633a78abeec4aeba9c0) |
| V2 hitos recuperar m2 | `4ed1c4c0915dc1ee7c5b65dcea4f028611a4e4951ac98d3838d05433eb6bc352` | [Ver tx](https://stellar.expert/explorer/testnet/tx/4ed1c4c0915dc1ee7c5b65dcea4f028611a4e4951ac98d3838d05433eb6bc352) |
| V2 hitos crear 2 | `041d4cc35bcdcbf5ef1762986118d13ddcf3e131f16cfa3b0b7d037c5ba3b510` | [Ver tx](https://stellar.expert/explorer/testnet/tx/041d4cc35bcdcbf5ef1762986118d13ddcf3e131f16cfa3b0b7d037c5ba3b510) |
| V2 hitos disputar 2 | `0b7d101de3061e628b6a95ddfdb8fdae48755039cc4c62b44d4dcc29a80532cd` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0b7d101de3061e628b6a95ddfdb8fdae48755039cc4c62b44d4dcc29a80532cd) |

El intento de `recover` sobre el hito disputado del acuerdo 2 fue rechazado en simulación (#10), sin hash.

## 15. Arbitration V2 (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| V2 arbitraje crear 1 | `3a6bdc8c6ef6fb6979871745dd23744b098406422b1e244bbe045f8be774b7d7` | [Ver tx](https://stellar.expert/explorer/testnet/tx/3a6bdc8c6ef6fb6979871745dd23744b098406422b1e244bbe045f8be774b7d7) |
| V2 arbitraje crear 2 | `7915c21f1392e92b4e5039ba4aa2ed145a215b0cb36ced6ddff25aa07fdbc229` | [Ver tx](https://stellar.expert/explorer/testnet/tx/7915c21f1392e92b4e5039ba4aa2ed145a215b0cb36ced6ddff25aa07fdbc229) |
| V2 arbitraje crear 3 | `e6a4b351504aef70cec00c6251477e717870e68088c48b3729827dd7a75096f4` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e6a4b351504aef70cec00c6251477e717870e68088c48b3729827dd7a75096f4) |
| V2 arbitraje crear 4 | `93a3065fbd3604c584598b4a4e0d196c2f3aefb18f9c29d1f8553a7a75f5e0e1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/93a3065fbd3604c584598b4a4e0d196c2f3aefb18f9c29d1f8553a7a75f5e0e1) |
| V2 arbitraje evidencia 1a | `8f05740f288c96433891973ed6d10b0d9848d4496c258c52159e04dbe7983fb1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/8f05740f288c96433891973ed6d10b0d9848d4496c258c52159e04dbe7983fb1) |
| V2 arbitraje evidencia 1b | `178099db4055ce82d79248fb42ab26ddaadc3d717639154a91a87760e81a03ac` | [Ver tx](https://stellar.expert/explorer/testnet/tx/178099db4055ce82d79248fb42ab26ddaadc3d717639154a91a87760e81a03ac) |
| V2 arbitraje evidencia 2 | `f51856869469ae4bca7ffa593fe98d46fb4a114df4a4e96fe33bb753e0923bb4` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f51856869469ae4bca7ffa593fe98d46fb4a114df4a4e96fe33bb753e0923bb4) |
| V2 arbitraje evidencia 3 | `1c024f0e664a54343066d065157062580ea9b0fb52f1a1018899ecf5eb268add` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1c024f0e664a54343066d065157062580ea9b0fb52f1a1018899ecf5eb268add) |
| V2 arbitraje evidencia 4a | `f47bcbca9ad6733afd94e012bc1cc4b4f4d5c93a7eae31a22ed47aa505b0c349` | [Ver tx](https://stellar.expert/explorer/testnet/tx/f47bcbca9ad6733afd94e012bc1cc4b4f4d5c93a7eae31a22ed47aa505b0c349) |
| V2 arbitraje evidencia 4b | `6948f94d4ad93a1a83e23c02ae5ee7c4693eabdb27cc8c6acb5ffe644a603779` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6948f94d4ad93a1a83e23c02ae5ee7c4693eabdb27cc8c6acb5ffe644a603779) |
| V2 arbitraje timeout split 1 | `a311cb341b3becf94af443b87f73ff3b439fc9fa91f968ce80f4d7b2c1759bb0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/a311cb341b3becf94af443b87f73ff3b439fc9fa91f968ce80f4d7b2c1759bb0) |
| V2 arbitraje timeout refund 2 | `48e55a518f9e6d1221ba9404b3f562a8f2ab6e3f516e698dc3a27c4d7c9a0f76` | [Ver tx](https://stellar.expert/explorer/testnet/tx/48e55a518f9e6d1221ba9404b3f562a8f2ab6e3f516e698dc3a27c4d7c9a0f76) |
| V2 arbitraje timeout release 3 | `eb7f8e21415eb0d6c54f29462e130be6b52f769e362e7a70f6d59ec532006cb2` | [Ver tx](https://stellar.expert/explorer/testnet/tx/eb7f8e21415eb0d6c54f29462e130be6b52f769e362e7a70f6d59ec532006cb2) |
| V2 arbitraje timeout split 4 | `e4a2657dda1f2d0f9a6787e5e4450ed9451a223d9851319deb80d2c6a94c0401` | [Ver tx](https://stellar.expert/explorer/testnet/tx/e4a2657dda1f2d0f9a6787e5e4450ed9451a223d9851319deb80d2c6a94c0401) |
| V2 arbitraje crear 5 | `bd3b96ec477fc8e23c92564a93e9717b75c0faf6e10f785ea14a6391d485d8e3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/bd3b96ec477fc8e23c92564a93e9717b75c0faf6e10f785ea14a6391d485d8e3) |
| V2 arbitraje evidencia 5a | `2ea216397a7fde46eb5ff38b74dad0c6bfc02865dc38ebbe893a8a9546728566` | [Ver tx](https://stellar.expert/explorer/testnet/tx/2ea216397a7fde46eb5ff38b74dad0c6bfc02865dc38ebbe893a8a9546728566) |
| V2 arbitraje evidencia 5b | `1e774c98230862122ccbb03458199a664d4c267503afb55d171d94f79333a301` | [Ver tx](https://stellar.expert/explorer/testnet/tx/1e774c98230862122ccbb03458199a664d4c267503afb55d171d94f79333a301) |
| V2 arbitraje resolver Release 5 | `82b53d3aaddd0a0c215fa938ccf0eb5c6fb7bbea712c5b903a6e266bcfc52ba1` | [Ver tx](https://stellar.expert/explorer/testnet/tx/82b53d3aaddd0a0c215fa938ccf0eb5c6fb7bbea712c5b903a6e266bcfc52ba1) |

Los intentos de `resolve` fuera de ventana (#8 y #5) fueron rechazados en simulación, sin hash. Saldo final del contrato: 0.

## 16. Panel V2 independiente (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| V2 panel crear caso | `0e401b1ed88dc3398040117c3e0f2ff69381e83bc0de9391557dfbeb7ce584cf` | [Ver tx](https://stellar.expert/explorer/testnet/tx/0e401b1ed88dc3398040117c3e0f2ff69381e83bc0de9391557dfbeb7ce584cf) |
| V2 panel seleccionar | `637f1b67a3263ca97d8df967aea6cc5b0c2db17ef84aeeae372b1f1ecd8721ff` | [Ver tx](https://stellar.expert/explorer/testnet/tx/637f1b67a3263ca97d8df967aea6cc5b0c2db17ef84aeeae372b1f1ecd8721ff) |
| V2 panel commit 1 | `bb86aa100fc1cac49da74d14b66a2141d848debc02c0facf14b54adb7ec7e739` | [Ver tx](https://stellar.expert/explorer/testnet/tx/bb86aa100fc1cac49da74d14b66a2141d848debc02c0facf14b54adb7ec7e739) |
| V2 panel commit 2 | `02802a9233dc26494450cb05e9b36a8ddbfa303ddedc1ec4f7b1b6fb3be597e3` | [Ver tx](https://stellar.expert/explorer/testnet/tx/02802a9233dc26494450cb05e9b36a8ddbfa303ddedc1ec4f7b1b6fb3be597e3) |
| V2 panel commit 3 | `5e4ac700e8e92f49df832f692ea678fb1e2cfddd0e74ea209d26e72ad2ee69e6` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5e4ac700e8e92f49df832f692ea678fb1e2cfddd0e74ea209d26e72ad2ee69e6) |
| V2 panel reveal 1 | `b974d44e23d6b581434793564dc97af458deb2e028c72604ef14e8de22e41b3c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/b974d44e23d6b581434793564dc97af458deb2e028c72604ef14e8de22e41b3c) |
| V2 panel reveal 2 | `48c4b5e47ef1e8d8ce3604d38259b25bed9222795dbbf658f3d2c622bb6583a0` | [Ver tx](https://stellar.expert/explorer/testnet/tx/48c4b5e47ef1e8d8ce3604d38259b25bed9222795dbbf658f3d2c622bb6583a0) |
| V2 panel reveal 3 | `71fd4fabfdb1ae41efdf898ddaa86374dcb1d1dea97c246ca73d4fe69c25b81e` | [Ver tx](https://stellar.expert/explorer/testnet/tx/71fd4fabfdb1ae41efdf898ddaa86374dcb1d1dea97c246ca73d4fe69c25b81e) |
| V2 panel settlement | `bdcd36785ec716fa9c0d343813d3976ef5274fb50ddfc68c2bc570360872199c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/bdcd36785ec716fa9c0d343813d3976ef5274fb50ddfc68c2bc570360872199c) |

El intento de atestar un controlador duplicado fue rechazado en simulación (#4), sin hash. Saldo final del contrato: 0.

## 17. Vault V2 por atribución (XLM real)

| Acción | Hash | Enlace |
|---|---|---|
| V2 vault crear A | `5130769fc71704db5e61a2c6424739f9f67b16ebae15109c49dc2d6f0d082f31` | [Ver tx](https://stellar.expert/explorer/testnet/tx/5130769fc71704db5e61a2c6424739f9f67b16ebae15109c49dc2d6f0d082f31) |
| V2 vault crear B | `6db6a8950bc7452e7383a8c984d2a02bdb661c4305b2b2fa92008a011ad2bf97` | [Ver tx](https://stellar.expert/explorer/testnet/tx/6db6a8950bc7452e7383a8c984d2a02bdb661c4305b2b2fa92008a011ad2bf97) |
| V2 vault fondear A | `895b4887b22c581e55737769aa1a3d8156980c79d68123e41c77f9c057e1b783` | [Ver tx](https://stellar.expert/explorer/testnet/tx/895b4887b22c581e55737769aa1a3d8156980c79d68123e41c77f9c057e1b783) |
| V2 vault fondear B | `86dea8c4f0f1d8467e3d6ff2c8d370382c65b39b352a3bd8dd6c879902864443` | [Ver tx](https://stellar.expert/explorer/testnet/tx/86dea8c4f0f1d8467e3d6ff2c8d370382c65b39b352a3bd8dd6c879902864443) |
| V2 vault transferencia directa | `99eec7ffd70cb6f92c48e848aa8d782507841ee7d89affcc2b1b6b8a503ea180` | [Ver tx](https://stellar.expert/explorer/testnet/tx/99eec7ffd70cb6f92c48e848aa8d782507841ee7d89affcc2b1b6b8a503ea180) |
| V2 vault sweep surplus | `fcce58300f3a6ecfcc28bd8bc7aa287912a3b6f7e42fc53a3e63419c1d56593c` | [Ver tx](https://stellar.expert/explorer/testnet/tx/fcce58300f3a6ecfcc28bd8bc7aa287912a3b6f7e42fc53a3e63419c1d56593c) |
| V2 vault retiro A | `653494dd0200152b5a591deafd2f1e1b134e78c3ce122c9ba2bff463f1e46558` | [Ver tx](https://stellar.expert/explorer/testnet/tx/653494dd0200152b5a591deafd2f1e1b134e78c3ce122c9ba2bff463f1e46558) |
| V2 vault retiro B | `12a2a2eb134967632e9ebe8950b7f4ea62a96da6c6d6832362af9405bece1346` | [Ver tx](https://stellar.expert/explorer/testnet/tx/12a2a2eb134967632e9ebe8950b7f4ea62a96da6c6d6832362af9405bece1346) |

Retiro por encima de la atribución (#5) y retiro del vault ajeno (#2) rechazados en simulación, sin hash. Saldo final: 0.

## 6f. Chequeos negativos (sin hash de transacción)

| Acción | Resultado observado |
|---|---|
| `settle_encounter` repetido sobre `Settled` | `HostError: Error(Contract, #6)` `InvalidState` |
| `submit_afterglow` duplicado | `HostError: Error(Contract, #9)` `AlreadySubmitted` |
| `create_encounter` con asset distinto al configurado | `HostError: Error(Contract, #11)` `InvalidAsset` (antes de cualquier transferencia) |
| `retirar` sin excedente | `HostError: Error(Contract, #6)` `InvalidState` |
| Tercer pago rápido al endpoint | HTTP 429 `rate_limited` |
| Pago con account origin equivocado | rechazado por validación post-firma |

## 7. Reproducción y verificación

```bash
# desplegar (fija el asset en el constructor)
SOURCE=<identity> contracts/ecstasy/scripts/deploy.sh

# flujo completo en Testnet
CREATOR=<a> PARTICIPANT=<b> contracts/ecstasy/scripts/smoke.sh

# pago real desde la app desplegada
curl -X POST https://ecs-tasy.netlify.app/api/challenge-payment \
  -H 'Content-Type: application/json' -H 'x-idempotency-key: <key>' -d '{}'

# verificar un hash en Horizon
curl https://horizon-testnet.stellar.org/transactions/<hash>
```

La matriz reproducible de release se genera con `npm run docs:matrix` (`docs/RELEASE_MATRIX.md`). El detalle narrativo está en `docs/EVIDENCE.md`; el registro de funciones nuevas y sus transacciones en `docs/FUNCTIONS_FOR_REVIEW.md`.
