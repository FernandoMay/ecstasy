import { getStore } from "@netlify/blobs";
import {
  Account,
  Asset,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

/**
 * Native Netlify Function: atomic, shared idempotency for the challenge
 * payment. Blobs onlyIfNew is a real create-if-absent operation, so exactly
 * one concurrent request can acquire a key. This code deliberately does NOT
 * live in the Next.js bundle, where Blobs hung the function runtime.
 */

const HORIZON = "https://horizon-testnet.stellar.org";
const FRIEND_BOT = "https://friendbot.stellar.org";
const DESTINATION = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";
const MEMO = "SHIP-S97KF8";
const AMOUNT = "0.0001";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function validKey(key) {
  return /^[A-Za-z0-9_-]{8,64}$/.test(key ?? "");
}

async function fund(source) {
  const response = await fetch(`${FRIEND_BOT}?addr=${source}`, {
    signal: AbortSignal.timeout(9_000),
  });
  if (!response.ok) throw new Error("friendbot_unavailable");
  const data = await response.json();
  if (!data.hash) throw new Error("friendbot_unavailable");

  const txInfo = await fetch(`${HORIZON}/transactions/${data.hash}`, {
    signal: AbortSignal.timeout(6_000),
  });
  if (txInfo.ok) {
    const info = await txInfo.json();
    if (typeof info.ledger === "number") return String(BigInt(info.ledger) << 32n);
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const account = await fetch(`${HORIZON}/accounts/${source}`);
    if (account.ok) return (await account.json()).sequence;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("rpc_unavailable");
}

export default async (request) => {
  if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const key = request.headers.get("x-idempotency-key")?.trim();
  if (!validKey(key)) return json({ code: "invalid_idempotency_key" }, 400);
  const correlation = request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();

  const store = getStore("ecstasy-payment-idempotency");
  const claim = await store.setJSON(
    key,
    { status: "pending", correlation, at: Date.now() },
    { onlyIfNew: true },
  );

  if (claim.modified === false) {
    let existing = await store.get(key, { type: "json", consistency: "strong" });
    // Wait for the winning request to finish so every caller receives the
    // same final outcome when it can be observed within the function budget.
    const deadline = Date.now() + 9_000;
    while (existing?.status === "pending" && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      existing = await store.get(key, { type: "json", consistency: "strong" });
    }
    return json({ ...existing, reused: true, correlation });
  }

  const keypair = Keypair.random();
  const source = keypair.publicKey();
  try {
    const sequence = await fund(source);
    const tx = new TransactionBuilder(new Account(source, sequence), {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({ destination: DESTINATION, asset: Asset.native(), amount: AMOUNT }))
      .addMemo(Memo.text(MEMO))
      .setTimeout(180)
      .build();
    tx.sign(keypair);

    const submitted = await fetch(`${HORIZON}/transactions`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tx: tx.toXdr() }).toString(),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await submitted.json();
    if (!submitted.ok || !result.hash) throw new Error("transaction_rejected");

    await store.setJSON(key, {
      status: "settled",
      hash: result.hash,
      source,
      correlation,
      at: Date.now(),
    });
    return json({
      status: "settled",
      hash: result.hash,
      memo: MEMO,
      destination: DESTINATION,
      network: "testnet",
      correlation,
    });
  } catch (cause) {
    const kind = cause instanceof Error ? cause.message : "internal";
    // Timeouts stay pending with the source address so a later Horizon
    // reconciliation can resolve the real outcome.
    await store.setJSON(key, {
      status: kind === "transaction_rejected" ? "failed" : "pending",
      kind,
      source,
      correlation,
      at: Date.now(),
    });
    return json({ status: kind === "transaction_rejected" ? "failed" : "pending", code: kind, correlation }, 502);
  }
};
