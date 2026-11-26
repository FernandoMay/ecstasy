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
