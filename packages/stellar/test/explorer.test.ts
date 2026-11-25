import { describe, expect, it } from "vitest";
import { NETWORK_PRESETS, getConfig, isAssetConfigured, isConfigured } from "../src/config";
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

describe("config fails closed", () => {
  it("rejects unknown networks", () => {
    expect(() => getConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "local" })).toThrow(/Invalid/);
    expect(() => getConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "" })).not.toThrow();
  });

  it("requires an explicit Mainnet release switch and IDs", () => {
    expect(() => getConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" })).toThrow(/MAINNET_RELEASE/);
    expect(() =>
      getConfig({
        NEXT_PUBLIC_STELLAR_NETWORK: "mainnet",
        NEXT_PUBLIC_MAINNET_RELEASE: "confirmed",
      }),
    ).toThrow(/explicit valid/);
  });

  it("uses the reviewed Testnet preset by default", () => {
    const config = getConfig({});
    expect(config.network).toBe("testnet");
    expect(isConfigured(config)).toBe(true);
    expect(isAssetConfigured(config)).toBe(true);
  });
});
