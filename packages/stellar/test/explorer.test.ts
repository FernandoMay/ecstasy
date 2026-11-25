import { describe, expect, it } from "vitest";
import { NETWORK_PRESETS, getConfig, isConfigured } from "../src/config";
import { accountUrl, contractUrl, shortAddress, transactionUrl } from "../src/explorer";

const config = {
  network: "testnet" as const,
  ...NETWORK_PRESETS.testnet,
  contractId: "C".padEnd(56, "A"),
  assetContractId: "C".padEnd(56, "B"),
  assetSymbol: "XLM",
};

describe("explorer helpers", () => {
  it("builds network-scoped links without leaking secrets", () => {
    expect(transactionUrl(config, "abc123")).toBe(
      "https://explorer.stellar.org/tx/abc123?chain=testnet",
    );
    expect(contractUrl(config, "CABC")).toBe(
      "https://explorer.stellar.org/contract/CABC?chain=testnet",
    );
    expect(accountUrl(config, "GXYZ")).toBe(
      "https://explorer.stellar.org/account/GXYZ?chain=testnet",
    );
  });

  it("shortens addresses", () => {
    expect(shortAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("GABCDE…UVWXYZ");
  });
});

describe("config", () => {
  it("defaults to testnet and reports missing contract id", () => {
    expect(getConfig().network).toBe("testnet");
    expect(isConfigured({ ...config, contractId: "" })).toBe(false);
    expect(isConfigured(config)).toBe(true);
  });
});
