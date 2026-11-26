/** Secret-free deployment health summary used by /api/status. */

export interface HealthInput {
  rpc: string;
  rateLimitMode: "local" | "shared";
  blobsAvailable: boolean;
}

export interface HealthSummary {
  degraded: boolean;
  reasons: string[];
}

export function summarizeHealth(input: HealthInput): HealthSummary {
  const reasons: string[] = [];
  if (input.rpc !== "healthy") reasons.push("rpc_unhealthy");
  if (input.rateLimitMode === "shared" && !input.blobsAvailable) {
    reasons.push("shared_rate_limit_store_unavailable");
  }
  return { degraded: reasons.length > 0, reasons };
}
