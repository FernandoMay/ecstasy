import { describe, expect, it } from "vitest";
import { connectWallet, type WalletAdapter } from "../src/wallet";

const ADDRESS = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

function wallet(calls: string[], overrides: Partial<WalletAdapter> = {}): WalletAdapter {
  return {
    kind: "test",
    isConnected: async () => true,
    getAddress: async () => ADDRESS,
    requestAccess: async () => {
      calls.push("requestAccess");
      return ADDRESS;
    },
    getNetwork: async () => {
      calls.push("getNetwork");
      return { network: "TESTNET", networkPassphrase: "Testnet SDF" };
    },
    signTransaction: async () => ({ signedTxXdr: "", signerAddress: ADDRESS }),
    signAuthEntry: async () => ({ signedAuthEntry: "", signerAddress: ADDRESS }),
    watchChanges: () => () => {},
    ...overrides,
  } as unknown as WalletAdapter;
}

describe("connectWallet", () => {
  it("authorizes before reading the network and returns the approved address", async () => {
    const calls: string[] = [];
    await expect(connectWallet(wallet(calls), "Testnet SDF")).resolves.toBe(ADDRESS);
    // Freighter only reports its network once the site has been authorized.
    expect(calls).toEqual(["requestAccess", "getNetwork"]);
  });

  it("reports a network mismatch after access is granted", async () => {
    const calls: string[] = [];
    const adapter = wallet(calls, {
      getNetwork: async () => {
        calls.push("getNetwork");
        return {
          network: "PUBLIC",
          networkPassphrase: "Public Global Stellar Network ; September 2015",
        };
      },
    });
    await expect(connectWallet(adapter, "Testnet SDF")).rejects.toThrow(/Wallet is on "PUBLIC"/);
    expect(calls).toEqual(["requestAccess", "getNetwork"]);
  });

  it("does not query the network when access is denied", async () => {
    const calls: string[] = [];
    const adapter = wallet(calls, {
      requestAccess: async () => {
        calls.push("requestAccess");
        throw new Error("Access denied");
      },
    });
    await expect(connectWallet(adapter, "Testnet SDF")).rejects.toThrow("Access denied");
    expect(calls).toEqual(["requestAccess"]);
  });
});
