import { describe, expect, it } from "vitest";
import { assertWalletIdentity, type WalletAdapter } from "../src/wallet";

const ADDRESS = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

function wallet(address: string | null | (() => Promise<string | null>)): WalletAdapter {
  return {
    kind: "test",
    isConnected: async () => true,
    getAddress: typeof address === "function" ? address : async () => address,
    requestAccess: async () => ADDRESS,
    signTransaction: async () => ({ signedTxXdr: "", signerAddress: ADDRESS }),
    signAuthEntry: async () => ({ signedAuthEntry: "", signerAddress: ADDRESS }),
    getNetwork: async () => ({ network: "testnet", networkPassphrase: "Test SDF Network ; September 2015" }),
    watchChanges: () => () => {},
  } as unknown as WalletAdapter;
}

describe("wallet identity before signing", () => {
  it("accepts the currently connected actor", async () => {
    await expect(assertWalletIdentity(wallet(ADDRESS), ADDRESS)).resolves.toBeUndefined();
  });

  it("rejects a changed account", async () => {
    await expect(assertWalletIdentity(wallet("GBNV3K7K7524XYPMDM2YHP3ORQVDCZ6SFUCKKLPFPKEFCHVCN6RGI2FR"), ADDRESS)).rejects.toThrow(/account changed/);
  });

  it("rejects revoked access and a disconnected extension distinctly", async () => {
    await expect(assertWalletIdentity(wallet(null), ADDRESS)).rejects.toThrow(/revoked/);
    await expect(assertWalletIdentity(wallet(async () => { throw new Error("no extension"); }), ADDRESS)).rejects.toThrow(/unavailable/);
  });
});
