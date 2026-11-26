import { describe, expect, it } from "vitest";
import { PaymentRouteError, classifyPaymentFailure } from "../lib/payment-errors";

describe("payment failure classification", () => {
  it("distinguishes friendbot timeout from unavailability", () => {
    expect(classifyPaymentFailure(new PaymentRouteError("friendbot_timeout")).httpStatus).toBe(504);
    expect(classifyPaymentFailure(new PaymentRouteError("friendbot_unavailable")).kind).toBe("friendbot_unavailable");
    expect(classifyPaymentFailure(new Error("Friendbot request timed out")).kind).toBe("friendbot_timeout");
    expect(classifyPaymentFailure(new Error("Friendbot failed with HTTP 429")).kind).toBe("friendbot_unavailable");
  });

  it("distinguishes RPC, rejected transactions and internal errors", () => {
    expect(classifyPaymentFailure(new Error("fetch failed")).kind).toBe("rpc_unavailable");
    expect(classifyPaymentFailure(new Error("tx_bad_seq")).kind).toBe("transaction_rejected");
    expect(classifyPaymentFailure(new Error("unexpected bug")).kind).toBe("internal");
  });

  it("never returns secrets in messages", () => {
    const failure = classifyPaymentFailure(new Error("secret seed SC1234 leaked"));
    expect(failure.message).not.toMatch(/SC1234|seed/);
  });
});
