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

## 6. Chequeos negativos (sin hash de transacción)

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
