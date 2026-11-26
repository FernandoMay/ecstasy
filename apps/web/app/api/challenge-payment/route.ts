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
import { correlationId, sanitizeCorrelationId } from "@/lib/correlation";
import {
  CHALLENGE_CODE,
  PAYMENT_AMOUNT,
  RateLimiter,
  bodyTooLarge,
  isPaymentRouteEnabled,
  resolveDestination,
} from "@/lib/payment-policy";
import { PaymentRouteError, classifyPaymentFailure } from "@/lib/payment-errors";
import { IdempotencyGuard } from "@/lib/idempotency";
import {
  findChallengePayment,
  reconciliationStatus,
  type HorizonTransaction,
} from "@/lib/payment-reconcile";

/**
 * Mission 02 payment — Testnet only.
 *
 * Kept deliberately free of Netlify Blobs: the shared store hung in the
 * Next.js function runtime and caused gateway timeouts (see docs/EVIDENCE.md).
 * Abuse protection is local, idempotency is in-memory, and unknown outcomes
 * are reconciled against Horizon rather than guessed.
 */
export const runtime = "nodejs";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIEND_BOT = "https://friendbot.stellar.org";
const limiter = new RateLimiter();
const idempotency = new IdempotencyGuard();

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const correlation = correlationId(request.headers.get("x-correlation-id"));
  const respond = (body: unknown, init: ResponseInit = {}) =>
    NextResponse.json(body, {
      ...init,
      headers: { ...(init.headers ?? {}), "x-correlation-id": correlation },
    });

  if (!isPaymentRouteEnabled(process.env.NEXT_PUBLIC_STELLAR_NETWORK)) {
    return respond({ error: "Payment route is Testnet-only", code: "wrong_network" }, { status: 403 });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed", code: "method_not_allowed" }, { status: 405 });
  }
  if (bodyTooLarge(request.headers.get("content-length"))) {
    return respond({ error: "Request too large", code: "payload_too_large" }, { status: 413 });
  }
  if (!limiter.check(clientKey(request))) {
    return respond({ error: "Too many requests", code: "rate_limited" }, { status: 429 });
  }

  // On Netlify, all financial processing and idempotency live in the native
  // coordinator function with an atomic Blobs claim. Nothing from that store
  // is touched in this Next.js bundle.
  const production = process.env.NODE_ENV === "production" || Boolean(process.env.NETLIFY);
  if (production) {
    const key = request.headers.get("x-idempotency-key")?.trim() || crypto.randomUUID();
    const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "https://ecs-tasy.netlify.app";
    try {
      const forwarded = await fetch(
        new URL("/.netlify/functions/payment-coordinator", siteUrl),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-idempotency-key": key,
            "x-correlation-id": correlation,
          },
          body: "{}",
          signal: AbortSignal.timeout(25_000),
        },
      );
      const body = (await forwarded.json()) as Record<string, unknown>;
      const response = respond(body, { status: forwarded.status });
      response.headers.set("x-ecstasy-payment-path", "coordinator");
      return response;
    } catch {
      return respond({ code: "coordinator_unavailable" }, { status: 502 });
    }
  }

  const idemKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
  if (idemKey && !idempotency.isValidKey(idemKey)) {
    return respond({ error: "Invalid idempotency key", code: "invalid_idempotency_key" }, { status: 400 });
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
        ...(pending ? { reconcile: `/api/challenge-payment?key=${encodeURIComponent(idemKey)}` } : {}),
      },
      { status: 409 },
    );
  }

  let destination: string;
  try {
    destination = resolveDestination(process.env.PAYMENT_DESTINATION);
  } catch {
    return respond(
      { error: "The payment destination is not configured correctly.", code: "invalid_configuration" },
      { status: 500 },
    );
  }

  let reachedSubmit = false;
  let sourcePublicKey: string | undefined;
  try {
    const started = Date.now();
    const source = Keypair.random();
    sourcePublicKey = source.publicKey();

    let fundResponse: Response;
    try {
      fundResponse = await fetch(`${FRIEND_BOT}?addr=${sourcePublicKey}`, {
        signal: AbortSignal.timeout(9_000),
      });
    } catch (cause) {
      const timedOut = cause instanceof Error && /time(d)?\s*out|abort/i.test(cause.message);
      throw new PaymentRouteError(timedOut ? "friendbot_timeout" : "friendbot_unavailable");
    }
    if (!fundResponse.ok) throw new PaymentRouteError("friendbot_unavailable");

    const funded = (await fundResponse.json()) as { hash?: string };
    let sequence: string | undefined;
    if (funded.hash) {
      const fundingTx = await fetch(`${HORIZON_TESTNET}/transactions/${funded.hash}`, {
        signal: AbortSignal.timeout(6_000),
      });
      if (fundingTx.ok) {
        const info = (await fundingTx.json()) as { ledger?: number };
        if (typeof info.ledger === "number") sequence = String(BigInt(info.ledger) << 32n);
      }
    }
    if (!sequence) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const accountResponse = await fetch(`${HORIZON_TESTNET}/accounts/${sourcePublicKey}`);
        if (accountResponse.ok) {
          sequence = ((await accountResponse.json()) as { sequence: string }).sequence;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (!sequence) throw new PaymentRouteError("rpc_unavailable");

    const transaction = new TransactionBuilder(new Account(sourcePublicKey, sequence), {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({ destination, asset: Asset.native(), amount: PAYMENT_AMOUNT }))
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
    const submitted = (await submitResponse.json()) as { hash?: string };
    if (!submitResponse.ok || !submitted.hash) throw new PaymentRouteError("transaction_rejected");

    if (idemKey) idempotency.remember(idemKey, submitted.hash, Date.now(), sourcePublicKey);
    console.info(
      JSON.stringify({
        event: "challenge_payment_submitted",
        correlation,
        memo: CHALLENGE_CODE,
        amount: PAYMENT_AMOUNT,
        source: sourcePublicKey,
        destination,
        hash: submitted.hash,
        elapsedMs: Date.now() - started,
      }),
    );

    return respond({
      hash: submitted.hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${submitted.hash}`,
      memo: CHALLENGE_CODE,
      amount: PAYMENT_AMOUNT,
      destination,
      network: "testnet",
    });
  } catch (cause) {
    if (idemKey && reachedSubmit) idempotency.rememberPending(idemKey, Date.now(), sourcePublicKey);
    const failure = classifyPaymentFailure(cause);
    console.warn(JSON.stringify({ event: "payment_failed", kind: failure.kind, correlation }));
    return respond(
      { error: failure.message, code: failure.kind },
      { status: failure.httpStatus },
    );
  }
}

/** Reconcile an unknown outcome using the stored ephemeral source address. */
export async function GET(request: Request) {
  const key = sanitizeCorrelationId(new URL(request.url).searchParams.get("key"));
  if (!key) return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  const source = idempotency.sourceOf(key);
  if (!source) {
    return NextResponse.json({ status: reconciliationStatus({ recordExists: false }) }, { status: 404 });
  }
  if (!idempotency.isPending(key)) {
    return NextResponse.json({ status: "settled", hash: idempotency.recordedHash(key) });
  }

  const response = await fetch(
    `${HORIZON_TESTNET}/accounts/${encodeURIComponent(source)}/transactions?limit=20&order=desc`,
    { signal: AbortSignal.timeout(6_000) },
  );
  if (!response.ok) return NextResponse.json({ status: "unavailable" }, { status: 502 });
  const data = (await response.json()) as { _embedded?: { records?: HorizonTransaction[] } };
  const hash = findChallengePayment(data._embedded?.records ?? []);
  const status = reconciliationStatus({ recordExists: true, foundHash: hash });
  if (status === "settled" && hash) {
    idempotency.resolve(key, hash);
    return NextResponse.json({ status, hash });
  }
  return NextResponse.json({ status });
}
