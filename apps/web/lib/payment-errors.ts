/** Failure classification for the Mission 02 payment route. */

export type PaymentFailureKind =
  | "friendbot_unavailable"
  | "friendbot_timeout"
  | "rpc_unavailable"
  | "transaction_rejected"
  | "invalid_configuration"
  | "internal";

export interface PaymentFailure {
  kind: PaymentFailureKind;
  httpStatus: number;
  message: string;
}

const FAILURES: Record<PaymentFailureKind, PaymentFailure> = {
  friendbot_unavailable: {
    kind: "friendbot_unavailable",
    httpStatus: 502,
    message: "Friendbot could not fund a temporary Testnet account. Retry later.",
  },
  friendbot_timeout: {
    kind: "friendbot_timeout",
    httpStatus: 504,
    message: "Friendbot did not respond in time. No payment was submitted; retry later.",
  },
  rpc_unavailable: {
    kind: "rpc_unavailable",
    httpStatus: 502,
    message: "Stellar Testnet RPC is unavailable. No payment was submitted.",
  },
  transaction_rejected: {
    kind: "transaction_rejected",
    httpStatus: 400,
    message: "The Testnet transaction was rejected. Check the receipt before retrying.",
  },
  invalid_configuration: {
    kind: "invalid_configuration",
    httpStatus: 500,
    message: "The payment destination is not configured correctly.",
  },
  internal: {
    kind: "internal",
    httpStatus: 500,
    message: "The payment could not be completed. Retry later.",
  },
};

export class PaymentRouteError extends Error {
  readonly kind: PaymentFailureKind;
  constructor(kind: PaymentFailureKind, message?: string) {
    super(message ?? FAILURES[kind].message);
    this.kind = kind;
  }
}

export function classifyPaymentFailure(cause: unknown): PaymentFailure {
  if (cause instanceof PaymentRouteError) return FAILURES[cause.kind];
  const text = cause instanceof Error ? cause.message : String(cause);
  if (/friendbot/i.test(text) && /time(d)?\s*out|abort/i.test(text)) return FAILURES.friendbot_timeout;
  if (/friendbot/i.test(text) || /HTTP 429|HTTP 5\d\d/.test(text)) return FAILURES.friendbot_unavailable;
  if (/timeout|abort|fetch failed|network/i.test(text)) return FAILURES.rpc_unavailable;
  if (/transaction|tx_bad_seq|op_/.test(text)) return FAILURES.transaction_rejected;
  return FAILURES.internal;
}
