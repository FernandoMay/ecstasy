import { getConfig } from "@ecstasy/stellar";
import { NextResponse } from "next/server";

/** Read-only deployment health. No private terms, wallet data or secrets. */
export const runtime = "nodejs";

export async function GET() {
  const config = getConfig();
  let rpc = "unavailable";
  let latestLedger: number | undefined;

  try {
    const response = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: {} }),
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const data = (await response.json()) as {
        result?: { status?: string; latestLedger?: number };
      };
      rpc = data.result?.status ?? "unknown";
      latestLedger = data.result?.latestLedger;
    }
  } catch {
    // Report the outage; never fabricate a healthy response.
  }

  return NextResponse.json(
    {
      network: config.network,
      contractId: config.contractId,
      assetContractId: config.assetContractId,
      assetSymbol: config.assetSymbol,
      rpc,
      latestLedger,
      rpcUrl: config.rpcUrl,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
