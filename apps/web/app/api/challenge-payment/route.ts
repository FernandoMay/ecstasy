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
  detectRateLimitMode,
  isPaymentRouteEnabled,
  rateLimitHeaders,
  resolveDestination,
} from "@/lib/payment-policy";
import { correlationId, sanitizeCorrelationId } from "@/lib/correlation";
import {
  findChallengePayment,
  reconciliationStatus,
  type HorizonTransaction,
} from "@/lib/payment-reconcile";
import { IdempotencyGuard } from "@/lib/idempotency";
import {
  PaymentRouteError,
  classifyPaymentFailure,
} from "@/lib/payment-errors";

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
const idempotency = new IdempotencyGuard();

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
  const preflightStarted = Date.now();
  const correlation = correlationId(request.headers.get("x-correlation-id"));
  const respond = (body: unknown, init: ResponseInit = {}) =>
    NextResponse.json(body, {
      ...init,
      headers: { ...(init.headers ?? {}), "x-correlation-id": correlation },
    });
  if (new URL(request.url).searchParams.has("dry")) {
    return respond(
      {
        status: "preflight-ok",
        rateLimitMode: detectRateLimitMode(),
        elapsedMs: Date.now() - preflightStarted,
        correlation,
      },
      { status: 200 },
    );
  }
  const telemetry = rateLimitHeaders(detectRateLimitMode());
  if (!isPaymentRouteEnabled(process.env.NEXT_PUBLIC_STELLAR_NETWORK)) {
    return respond({ error: "Payment route is Testnet-only", code: "wrong_network" }, { status: 403, headers: telemetry });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed", code: "method_not_allowed" }, { status: 405, headers: telemetry });
  }
  if (bodyTooLarge(request.headers.get("content-length"))) {
    return respond({ error: "Request too large", code: "payload_too_large" }, { status: 413, headers: telemetry });
  }
  const idemKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
  if (idemKey && !idempotency.isValidKey(idemKey)) {
    return respond(
      { error: "Invalid idempotency key", code: "invalid_idempotency_key" },
      { status: 400 },
    );
  }
  if (idemKey && idempotency.isDuplicate(idemKey)) {
    const pending = idempotency.isPending(idemKey);
    return respond(
      {
        error: pending
          ? "A previous attempt may have submitted a payment. Check its hash before retrying."
          : "Duplicate payment request",
        code: pending ? "duplicate_request_pending" : "duplicate_request",
        hash: idempotency.recordedHash(idemKey),
        ...(pending
          ? { reconcile: `/api/challenge-payment?key=${encodeURIComponent(idemKey)}` }
          : {}),
      },
      { status: 409 },
    );
  }

  const activeLimiter = await limiter;
  const limitHeaders = rateLimitHeaders(activeLimiter.mode);
  if (!(await activeLimiter.check(clientKey(request)))) {
    return respond(
      { error: "Too many requests", code: "rate_limited" },
      { status: 429, headers: limitHeaders },
    );
  }

  let destination: string;
  try {
    destination = resolveDestination(process.env.PAYMENT_DESTINATION);
  } catch (cause) {
    return respond(
      { error: "The payment destination is not configured correctly.", code: "invalid_configuration" },
      { status: 500 },
    );
  }
  // The request body is deliberately ignored: no caller-controlled input can
  // change the memo, amount, asset or destination.

  let reachedSubmit = false;
  let sourcePublicKey: string | undefined;
  try {
    const started = Date.now();
    const source = Keypair.random();
    sourcePublicKey = source.publicKey();
    const keygenMs = Date.now() - started;
    let fundResponse: Response;
    try {
      fundResponse = await fetch(`${FRIEND_BOT}?addr=${source.publicKey()}`, {
        signal: AbortSignal.timeout(9_000),
      });
    } catch (cause) {
      const timedOut = cause instanceof Error && /timeout|abort/i.test(cause.message);
      throw new PaymentRouteError(timedOut ? "friendbot_timeout" : "friendbot_unavailable");
    }
    if (!fundResponse.ok) {
      console.warn(JSON.stringify({ event: "friendbot_failed", status: fundResponse.status }));
      throw new PaymentRouteError("friendbot_unavailable");
    }

    // Derive the new account's sequence from the friendbot transaction ledger
    // instead of polling /accounts until it appears. Stellar encodes classic
    // account sequences as (ledger << 32) after a createAccount operation; the builder adds 1.
    let sequence: string | undefined;
    const funded = (await fundResponse.json()) as { hash?: string };
    if (funded.hash) {
      const fundingTx = await fetch(`${HORIZON_TESTNET}/transactions/${funded.hash}`, {
        signal: AbortSignal.timeout(6_000),
      });
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
    reachedSubmit = true;

    let submitResponse: Response;
    try {
      submitResponse = await fetch(`${HORIZON_TESTNET}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tx: transaction.toXdr() }).toString(),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new PaymentRouteError("rpc_unavailable");
    }
    const submitted = (await submitResponse.json()) as { hash?: string; result_codes?: unknown };
    console.info(JSON.stringify({ event: "payment_timing", keygenMs, fundedMs, accountMs, totalMs: Date.now() - started }));
    if (!submitResponse.ok || !submitted.hash) {
      console.warn(JSON.stringify({ event: "payment_rejected", detail: submitted }));
      return respond(
        { error: classifyPaymentFailure(new PaymentRouteError("transaction_rejected")).message, code: "transaction_rejected", detail: submitted },
        { status: 502, headers: limitHeaders },
      );
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

    if (idemKey) idempotency.remember(idemKey, submitted.hash, Date.now(), source.publicKey());

    return respond({
      hash: submitted.hash,
      explorerUrl: explorerUrl(submitted.hash),
      memo: CHALLENGE_CODE,
      amount: PAYMENT_AMOUNT,
      destination,
      network: "testnet",
    }, { headers: limitHeaders });
  } catch (cause) {
    // Once a submit was attempted the outcome may be unknown. Keep the key
    // blocked so a retry cannot silently double-spend.
    if (idemKey && reachedSubmit) idempotency.rememberPending(idemKey, Date.now(), sourcePublicKey);
    const failure = classifyPaymentFailure(cause);
    console.warn(JSON.stringify({ event: "payment_failed", kind: failure.kind, correlation }));
    return respond(
      { error: failure.message, code: failure.kind },
      { status: failure.httpStatus, headers: limitHeaders },
    );
  }
}


/**
 * Reconcile a pending idempotency key. The source public key was stored when
 * the request was accepted, so Horizon can confirm whether the payment
 * actually landed without exposing any secret material.
 */
export async function GET(request: Request) {
  const key = sanitizeCorrelationId(
    new URL(request.url).searchParams.get("key") ?? undefined,
  );
  if (!key) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  const source = idempotency.sourceOf(key);
  if (!source) {
    return NextResponse.json({ status: "unknown" }, { status: 404 });
  }
  if (!idempotency.isPending(key)) {
    return NextResponse.json({ status: "settled", hash: idempotency.recordedHash(key) });
  }

  const response = await fetch(
    `${HORIZON_TESTNET}/accounts/${encodeURIComponent(source)}/transactions?limit=20&order=desc`,
    { signal: AbortSignal.timeout(6_000) },
  );
  if (!response.ok) {
    return NextResponse.json({ status: "unavailable" }, { status: 502 });
  }
  const data = (await response.json()) as {
    _embedded?: { records?: HorizonTransaction[] };
  };
  const hash = findChallengePayment(data._embedded?.records ?? []);
  if (hash) {
    idempotency.resolve(key, hash);
    return NextResponse.json({ status: "settled", hash });
  }
  return NextResponse.json({ status: "pending" });
}
