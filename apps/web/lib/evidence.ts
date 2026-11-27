/** Curated, real Testnet evidence. Every hash was submitted and verified in Horizon. */

export interface EvidenceRecord {
  feature: string;
  functionName: string;
  hash: string;
  contract: string;
  expected: string;
  observed: string;
}

const ESCROW = "CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65";
const VAULT = "CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC";
const VAULT_DEMO = "CAXMW6JYOZZ2OO2XWZ35E6EI7SNO6QV7ACPVJA2RZSXXZ6YX6D7DDUYD";
const PAYMENT = "Netlify payment coordinator";

export const EVIDENCE: readonly EvidenceRecord[] = [
  { feature: "Crear encuentro", functionName: "create_encounter", hash: "cb9554a1fa2568e0254cdf9a1d59932b5edb8e1e65f3782e859b3a7204ec6347", contract: ESCROW, expected: "Created + escrow lock", observed: "Success · encounter_created" },
  { feature: "Consentir", functionName: "accept_encounter", hash: "5c26b980c2cb32878caeda0e5482f58d3bdc6f8dc813e97be0429ecd6e16894f", contract: ESCROW, expected: "Accepted", observed: "Success · encounter_accepted" },
  { feature: "Completar (creador)", functionName: "complete_encounter", hash: "e69577c0acdd05f7282b9cf802c8e661f8d833dd37ee7fe609a9a1b4934a099c", contract: ESCROW, expected: "creator_completed", observed: "Success · encounter_completion" },
  { feature: "Completar (participante)", functionName: "complete_encounter", hash: "0acb3f850db6ff5433caf63d686fc04e9bcb78537ea42d4ec2f5e238953d4113", contract: ESCROW, expected: "Completed", observed: "Success · encounter_completed" },
  { feature: "Liquidar", functionName: "settle_encounter", hash: "e18c7ed7ddf14e3fd3ecb99d731f4d09f9d920e14425faed9ca06504fe523fc8", contract: ESCROW, expected: "Settled + escrow release", observed: "Success · encounter_settled" },
  { feature: "Afterglow creador", functionName: "submit_afterglow", hash: "d8697cf74935c3c4f17b7d085d9338f51088d0ca8c463d1a2b248e4a3aae3290", contract: ESCROW, expected: "Score 88 recorded", observed: "Success · afterglow_submitted" },
  { feature: "Afterglow participante", functionName: "submit_afterglow", hash: "e264b7fa210390068d2410fee0c36418ecf4221c8be604a2a13022cc9ae1f3fa", contract: ESCROW, expected: "Score 92 recorded", observed: "Success · afterglow_submitted" },
  { feature: "Rechazar", functionName: "decline_encounter", hash: "f9a03e14d9ab7d6f907bcca55fbedff6936f99c20ae962e175d56b2f74500afb", contract: ESCROW, expected: "Cancelled + refund", observed: "Success · encounter_declined" },
  { feature: "Cancelar", functionName: "cancel_encounter", hash: "80d8a4748e3b3ac9c35776b49a5a7b1f95177fa54955128c8d9ec73b6c6879a1", contract: ESCROW, expected: "Cancelled + refund", observed: "Success · encounter_cancelled" },
  { feature: "Expirar (permisionless)", functionName: "expire_encounter", hash: "d7a4f6eb73d018e99418986ef831f3ff5cc29c0f8a36e4ba7c499bdac2cc977d", contract: ESCROW, expected: "Expired + creator refund", observed: "Success · encounter_expired" },
  { feature: "Leer encuentro", functionName: "get_encounter", hash: "0017a93ee0284d52553c7fd652366e36f28cc8cec03eebcf2b35ad375b7084c9", contract: ESCROW, expected: "Read-only tx", observed: "Success" },
  { feature: "Leer afterglow", functionName: "get_afterglow", hash: "d155b9193d50f7f3a6cbee17032a7a92e1ddfd5e43ad06db7bd5e54b216ef3d1", contract: ESCROW, expected: "Read-only tx", observed: "Success" },
  { feature: "Retirar excedente", functionName: "retirar", hash: "2333ac89b2e536506d174a0fff690aadc636432ebeb9fd3a4a435be665559bfe", contract: ESCROW, expected: "Surplus withdrawn only", observed: "Success · funds_withdrawn" },
  { feature: "Bóveda · estado", functionName: "status", hash: "2a2eca8edab6c991e2e7d779fbd08c60fc240972330e6535e7f24c11aebfa9b9", contract: VAULT, expected: "[false, 55550000000]", observed: "Success · vault funded" },
  { feature: "Bóveda · reclamar", functionName: "reclamar", hash: "d1fb977f341adac241d11b645daa839a4899de785f89f8488a0908d94f2eb71a", contract: VAULT_DEMO, expected: "Claim code matched", observed: "Success · ClaimEvent" },
  { feature: "Bóveda · fondeo 5555 XLM", functionName: "fund", hash: "d31078891788f47453833ccc71794d92973a00fcda9bb60d814df5b191868f9a", contract: VAULT, expected: "5555 XLM locked", observed: "Success · transfer" },
  { feature: "Pago público G1", functionName: "POST /api/challenge-payment", hash: "07a3183f03be6c6cea24e3380e84d5786217e2145a6f48d875081af7886d1064", contract: PAYMENT, expected: "Memo SHIP-S97KF8", observed: "Success · Horizon confirmed" },
  { feature: "Crear encuentro (ciclo 2)", functionName: "create_encounter", hash: "f2af900947d8c1dfb65b2543695d60cf6f6451156e858f52f8f59dd1b3a90d34", contract: ESCROW, expected: "Created + escrow lock", observed: "Success · encounter_created" },
  { feature: "Consentir (ciclo 2)", functionName: "accept_encounter", hash: "7f904589fc8381f1b752eb3ad0d239698c77db8fc0ff7509ce0add4810e55c95", contract: ESCROW, expected: "Accepted", observed: "Success · encounter_accepted" },
  { feature: "Completar creador (ciclo 2)", functionName: "complete_encounter", hash: "b236551fea6578a644b3c1f942d38d8204c1ddf37bdccf80673414ba530fb937", contract: ESCROW, expected: "creator_completed", observed: "Success · encounter_completion" },
  { feature: "Completar participante (ciclo 2)", functionName: "complete_encounter", hash: "dfd73405a38b1b54dc84704384014646c7386d4e6b5029cfce9d86b94142c95d", contract: ESCROW, expected: "Completed", observed: "Success · encounter_completed" },
  { feature: "Liquidar (ciclo 2)", functionName: "settle_encounter", hash: "6c99b92570d56f747d70526a7eef5ad6d14eb61b41ca50467fb5421b734564b5", contract: ESCROW, expected: "Settled + escrow release", observed: "Success · encounter_settled" },
  { feature: "Afterglow creador (ciclo 2)", functionName: "submit_afterglow", hash: "e51596792ae482e4ead5db7ff062f06ba04d0674cdee7cf6a0308303e48e4d40", contract: ESCROW, expected: "Score 88", observed: "Success · afterglow_submitted" },
  { feature: "Afterglow participante (ciclo 2)", functionName: "submit_afterglow", hash: "5648fb106608c278dc0a133e0718a9fb30d0e6379423a5bb8bb5e401d869b90c", contract: ESCROW, expected: "Score 92", observed: "Success · afterglow_submitted" },
  { feature: "Disputa · abrir", functionName: "open", hash: "53f923f858146249e0189f4325579aef9c552a15f4450738ef1345f27d259966", contract: "CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6", expected: "Open + reason digest", observed: "Success · opened" },
  { feature: "Disputa · respuesta A", functionName: "respond", hash: "e696eb85591644ab3142406aa6a95518a95a8d9dd257f3369318960ad9084aa8", contract: "CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6", expected: "opener response", observed: "Success · responded" },
  { feature: "Disputa · respuesta B", functionName: "respond", hash: "8f738afe3413735b16b5a9f12b7f67ae5d6b28b3ae20924064c32052793eb7fa", contract: "CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6", expected: "counterparty response", observed: "Success · responded" },
  { feature: "Disputa · resolver", functionName: "resolve", hash: "33124458b1f233fdb688ecd99719a2dbcc1f6166c1bcd0b0d2ed0cf36ffeffea", contract: "CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6", expected: "Resolved + outcome digest", observed: "Success · resolved" },
  { feature: "Refund · proponer", functionName: "propose", hash: "bb1381e3faea18dde11620832b1d68f60b750485bd7eaadcfbde6e826ff2de19", contract: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5", expected: "Pending + XLM locked", observed: "Success · requested" },
  { feature: "Refund · aprobar (B)", functionName: "approve", hash: "f994e2eb2b8f8d9bbbf8ecdbe133587cd125bbc56d9b4426b0b0e945c47cbd01", contract: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5", expected: "Approved, same intent", observed: "Success · approved" },
  { feature: "Refund · ejecutar", functionName: "execute", hash: "31b708a2a94b1b712a0cb1b0f7d7050afbb7e7677f401a07941bb9eba2c462e2", contract: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5", expected: "Real XLM transfer", observed: "Success · refunded" },
  { feature: "Refund · rechazar", functionName: "reject", hash: "50263a74841ef999e2a93e92d28bdf3f1247828a7a892d41dc6e2485da970523", contract: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5", expected: "No refund, funds returned", observed: "Success · rejected" },
  { feature: "Refund · revocar", functionName: "revoke", hash: "50e0a196ebf94c29dbfffd2a3c71d153a7102f44ba49f72673f71ac01e6cea97", contract: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5", expected: "Funds returned", observed: "Success · revoked" },
  { feature: "Recovery · proponer", functionName: "propose", hash: "0b6437ec56f6876954f2572a549e9c277fcf5ede8316bfa7980d4becddcff4f7", contract: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ", expected: "Pending + XLM locked", observed: "Success · proposed" },
  { feature: "Recovery · aprobar", functionName: "approve", hash: "6eb51c0a8cc1f8f22dfa020cd58eb372c487df99c3fe84f4185b0cc68a2c89d4", contract: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ", expected: "Approved before expiry", observed: "Success · approved" },
  { feature: "Recovery · ejecutar", functionName: "execute", hash: "9894dc3cb47c3d2e9b7edc1861f4581710a173994f7615e51e99868bc1fbb09b", contract: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ", expected: "Real XLM transfer", observed: "Success · executed" },
  { feature: "Recovery · proponer (timeout)", functionName: "propose", hash: "325013c149fcca63b6cfc16deb42cf5921ea398150f53447c643bd61d67a44ea", contract: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ", expected: "Pending with deadline", observed: "Success · proposed" },
  { feature: "Recovery · recuperar por tercero", functionName: "recover", hash: "ebc2f2403341c36701940ea2ab4fc3f6679e47feace69cf40f744c73ddb81579", contract: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ", expected: "Funds back to proposer", observed: "Success · recovered" },
  { feature: "Arbitraje · depositar", functionName: "deposit", hash: "6eb11aa8a67d1a76364df514e5a355170a15f4044b5ca7143de1dcce40295554", contract: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN", expected: "XLM locked + case open", observed: "Success · deposited" },
  { feature: "Arbitraje · argumento", functionName: "argue", hash: "7f4b26b3d0e4b212ab58557fcb5d6dda58f53060a37610ca0c0e15d1ae701f0f", contract: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN", expected: "Argument digest", observed: "Success · argued" },
  { feature: "Arbitraje · Release", functionName: "resolve", hash: "7dde0fbf8bbabad2a10100e71792f759f6d6b35e9f306a4f79cc0394dd74854a", contract: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN", expected: "XLM to recipient", observed: "Success · resolved" },
  { feature: "Arbitraje · Refund", functionName: "resolve", hash: "2cd356bae3452a922ed57fb134dd77de19ae5d01a45f358cef828f739354de1d", contract: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN", expected: "XLM to proposer", observed: "Success · resolved" },
  { feature: "Arbitraje · Split", functionName: "resolve", hash: "d5ba24a810434e443c25fc201ff27d3a537dbc3fff258086b3765c09e2ed9e13", contract: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN", expected: "XLM split 50/50", observed: "Success · resolved" },
  { feature: "Hitos · crear depósito", functionName: "create", hash: "18a681274cd9e8c47d1040a63db60b99b15b0d56651b27ac477f5175f63b5be8", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "3 XLM deposited", observed: "Success · created" },
  { feature: "Hitos · evidencia", functionName: "submit", hash: "0cfcbde2948e9eac8bb495461647485b9ad38436aa649ce27cebf063f97a4066", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "Milestone 0 submitted", observed: "Success · submitted" },
  { feature: "Hitos · aprobar", functionName: "approve", hash: "c17a91fa0db82b7c1a26cd7d53b877537c35896d249259810b5fe9eb0a64bc6c", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "Only milestone 0 paid", observed: "Success · approved" },
  { feature: "Hitos · disputar", functionName: "dispute", hash: "4e38f6a27c5eca04fe090bfcbf0f2a4a8e9ddada8a2974e38465fda8b3bd93e0", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "Milestone 1 isolated", observed: "Success · disputed" },
  { feature: "Hitos · resolver", functionName: "resolve", hash: "37a2e1176eb0b2e260aa2176fdc06a9a2769231e6647088f4910505f12bd4af8", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "Milestone 1 released", observed: "Success · resolved" },
  { feature: "Hitos · recuperar", functionName: "recover", hash: "479ddc98ee23ebf67c12bcaca4d2aedcd9f9229b3534eb2b68080b937e0c05ff", contract: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7", expected: "Milestone 2 to proposer", observed: "Success · recovered" },
  { feature: "Idempotencia atómica G2", functionName: "payment-coordinator", hash: "d4cc0b48cf1e8295cfb46164156c62430b4452a147622e646f4771457a63361e", contract: PAYMENT, expected: "8 requests → 1 payment", observed: "Success · 7 reused" },
];

export function explorerUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export interface CoverageRow {
  functionName: string;
  verified: boolean;
  hash?: string;
}

export function coverageMatrix(records: readonly EvidenceRecord[]): CoverageRow[] {
  const byFunction = new Map<string, string>();
  for (const record of records) {
    if (!byFunction.has(record.functionName)) byFunction.set(record.functionName, record.hash);
  }
  return Array.from(byFunction, ([functionName, hash]) => ({
    functionName,
    verified: /^[0-9a-f]{64}$/.test(hash),
    hash,
  }));
}

export interface NegativeCase {
  scenario: string;
  expected: string;
  verification: "unit" | "simulation" | "transaction";
  reference: string;
}

export const NEGATIVE_CASES: readonly NegativeCase[] = [
  { scenario: "Passphrase incorrecta", expected: "Descifrado rechazado", verification: "unit", reference: "apps/web/test/terms-envelope.test.ts" },
  { scenario: "Envelope manipulado", expected: "AES-GCM detecta tampering", verification: "unit", reference: "apps/web/test/terms-envelope.test.ts" },
  { scenario: "Envelope malformado", expected: "Formato rechazado", verification: "unit", reference: "apps/web/test/terms-envelope.test.ts" },
  { scenario: "Hash de términos distinto", expected: "Accept bloqueado", verification: "unit", reference: "apps/web/components/ConsentSheet.tsx" },
  { scenario: "Red incorrecta", expected: "Conexión rechazada", verification: "unit", reference: "packages/stellar/test/wallet-connect.test.ts" },
  { scenario: "Usuario no participante", expected: "NotParty (#2)", verification: "unit", reference: "contracts/ecstasy/tests/contract_test.rs" },
  { scenario: "Doble settlement", expected: "InvalidState (#6)", verification: "simulation", reference: "docs/EVIDENCE.md · negativos sin hash" },
  { scenario: "Afterglow duplicado", expected: "AlreadySubmitted (#9)", verification: "simulation", reference: "docs/EVIDENCE.md · negativos sin hash" },
  { scenario: "Asset no configurado", expected: "InvalidAsset (#11)", verification: "simulation", reference: "docs/EVIDENCE.md · negativos sin hash" },
  { scenario: "Bóveda sin saldo", expected: "Empty (#3)", verification: "unit", reference: "contracts/boveda/tests/boveda_test.rs" },
  { scenario: "Retiro duplicado", expected: "AlreadyClaimed (#2)", verification: "unit", reference: "contracts/boveda/tests/boveda_test.rs" },
  { scenario: "Tercer pago rápido", expected: "HTTP 429 rate_limited", verification: "simulation", reference: "docs/EVIDENCE.md · G2 production (HTTP, no tx)" },
];
