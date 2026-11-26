import { describe, expect, it } from "vitest";
import { summarizeHealth } from "../lib/health";

describe("deployment health summary", () => {
  it("is healthy when RPC is healthy and no shared store is expected", () => {
    expect(summarizeHealth({ rpc: "healthy", rateLimitMode: "local", blobsAvailable: false })).toEqual({
      degraded: false,
      reasons: [],
    });
  });

  it("reports RPC degradation", () => {
    expect(summarizeHealth({ rpc: "unavailable", rateLimitMode: "local", blobsAvailable: false })).toEqual({
      degraded: true,
      reasons: ["rpc_unhealthy"],
    });
  });

  it("reports a broken shared store only when shared mode is expected", () => {
    expect(
      summarizeHealth({ rpc: "healthy", rateLimitMode: "shared", blobsAvailable: false }),
    ).toEqual({ degraded: true, reasons: ["shared_rate_limit_store_unavailable"] });
    expect(
      summarizeHealth({ rpc: "healthy", rateLimitMode: "shared", blobsAvailable: true }),
    ).toEqual({ degraded: false, reasons: [] });
  });
});
