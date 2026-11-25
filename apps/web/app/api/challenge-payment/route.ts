import {
  Account,
  Asset,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";
import {
  CHALLENGE_CODE,
  PAYMENT_AMOUNT,
  bodyTooLarge,
  createPaymentRateLimiter,
  isPaymentRouteEnabled,
  resolveDestination,
} from "@/lib/payment-policy";

/**
 * Mission 02 payment, enabled only on Testnet.
 *
 * Hardened after the production-readiness audit:
 * - destination is server-controlled and validated, never caller-supplied;
 * - per-client rate limit and request-size cap before any Friendbot call;
 * - ephemeral friendbot-funded keypair per request; no secret is stored,
 *   logged or returned;
 * - structured logs contain only public hashes/addresses.
 */
export const runtime = "nodejs";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIEND_BOT = "https://friendbot.stellar.org";
const limiter = createPaymentRateLimiter();

function explorerUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

async function waitForAccount(address: string): Promise<{ sequence: string }> {
  let lastError = "unknown error";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
    if (response.ok) return (await response.json()) as { sequence: string };
    lastError = await response.text();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Funded account not available on Horizon: ${lastError}`);
}

export async function POST(request: Request) {
  if (!isPaymentRouteEnabled(process.env.NEXT_PUBLIC_STELLAR_NETWORK)) {
    return NextResponse.json({ error: "Payment route is Testnet-only" }, { status: 403 });
  }
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (bodyTooLarge(request.headers.get("content-length"))) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  const activeLimiter = await limiter;
  const limitHeaders = { "x-ecstasy-rate-limit-mode": activeLimiter.mode };
  if (!(await activeLimiter.check(clientKey(request)))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: limitHeaders });
  }

  let destination: string;
  try {
    destination = resolveDestination(process.env.PAYMENT_DESTINATION);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : String(cause) },
      { status: 500 },
    );
  }
  // The request body is deliberately ignored: no caller-controlled input can
  // change the memo, amount, asset or destination.

  try {
    const started = Date.now();
    const source = Keypair.random();
    const keygenMs = Date.now() - started;
    const fundResponse = await fetch(`${FRIEND_BOT}?addr=${source.publicKey()}`);
    if (!fundResponse.ok) {
      console.warn(JSON.stringify({ event: "friendbot_failed", status: fundResponse.status }));
      throw new Error(`Friendbot failed with HTTP ${fundResponse.status}`);
    }

    // Derive the new account's sequence from the friendbot transaction ledger
    // instead of polling /accounts until it appears. Stellar encodes classic
    // account sequences as (ledger << 32) after a createAccount operation; the builder adds 1.
    let sequence: string | undefined;
    const funded = (await fundResponse.json()) as { hash?: string };
    if (funded.hash) {
      const fundingTx = await fetch(`${HORIZON_TESTNET}/transactions/${funded.hash}`);
      if (fundingTx.ok) {
        const info = (await fundingTx.json()) as { ledger?: number };
        if (typeof info.ledger === "number") {
          sequence = String(BigInt(info.ledger) << 32n);
        }
      }
    }
    const fundedMs = Date.now() - started;
    const account = sequence
      ? { sequence }
      : await waitForAccount(source.publicKey());
    const accountMs = Date.now() - started;
    const transaction = new TransactionBuilder(new Account(source.publicKey(), account.sequence), {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: PAYMENT_AMOUNT,
        }),
      )
      .addMemo(Memo.text(CHALLENGE_CODE))
      .setTimeout(180)
      .build();
    transaction.sign(source);

    const submitResponse = await fetch(`${HORIZON_TESTNET}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tx: transaction.toXdr() }).toString(),
    });
    const submitted = (await submitResponse.json()) as { hash?: string; result_codes?: unknown };
    console.info(JSON.stringify({ event: "payment_timing", keygenMs, fundedMs, accountMs, totalMs: Date.now() - started }));
    if (!submitResponse.ok || !submitted.hash) {
      console.warn(JSON.stringify({ event: "payment_rejected", detail: submitted }));
      return NextResponse.json({ error: "Transaction rejected", detail: submitted }, { status: 502 });
    }

    console.info(
      JSON.stringify({
        event: "challenge_payment_submitted",
        network: "testnet",
        memo: CHALLENGE_CODE,
        amount: PAYMENT_AMOUNT,
        source: source.publicKey(),
        destination,
        hash: submitted.hash,
      }),
    );

    return NextResponse.json({
      hash: submitted.hash,
      explorerUrl: explorerUrl(submitted.hash),
      memo: CHALLENGE_CODE,
      amount: PAYMENT_AMOUNT,
      destination,
      network: "testnet",
    }, { headers: limitHeaders });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : String(cause) },
      { status: 500 },
    );
  }
}
