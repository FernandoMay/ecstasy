/**
 * Wallet boundary. Domain code depends only on this interface, so Freighter
 * can be swapped without rewriting encounter logic. This package never sees
 * private keys or seed phrases.
 */

import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signAuthEntry,
  signTransaction,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import type { SignAuthEntryLike, SignTransactionLike } from "@stellar/stellar-sdk/contract";

export interface WalletIdentity {
  address: string;
  kind: string;
}

export interface WalletAdapter {
  readonly kind: string;
  isConnected(): Promise<boolean>;
  getAddress(): Promise<string | null>;
  requestAccess(): Promise<string>;
  signTransaction: SignTransactionLike;
  signAuthEntry: SignAuthEntryLike;
  getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  /** Subscribe to account/network changes; returns an unsubscribe function. */
  watchChanges(callback: (info: { address: string; networkPassphrase: string }) => void): () => void;
}

function message(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export class FreighterWallet implements WalletAdapter {
  readonly kind = "freighter";

  async isConnected(): Promise<boolean> {
    const result = await isConnected();
    if (result.error) return false;
    return result.isConnected === true;
  }

  async getAddress(): Promise<string | null> {
    const result = await getAddress();
    if (result.error || !result.address) return null;
    return result.address;
  }

  async requestAccess(): Promise<string> {
    const result = await requestAccess();
    if (result.error || !result.address) {
      throw new Error(result.error ? message(result.error) : "Freighter did not return an address");
    }
    return result.address;
  }

  signTransaction: SignTransactionLike = async (xdr, opts) => {
    const result = await signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase,
      address: opts?.address,
    });
    if (result.error || !result.signedTxXdr) {
      throw new Error(result.error ? message(result.error) : "Transaction rejected");
    }
    return { signedTxXdr: result.signedTxXdr, signerAddress: result.signerAddress };
  };

  signAuthEntry: SignAuthEntryLike = async (authEntry, opts) => {
    const result = await signAuthEntry(authEntry, {
      networkPassphrase: opts?.networkPassphrase,
      address: opts?.address,
    });
    if (result.error || !result.signedAuthEntry) {
      throw new Error(result.error ? message(result.error) : "Auth entry rejected");
    }
    return { signedAuthEntry: result.signedAuthEntry, signerAddress: result.signerAddress };
  };

  async getNetwork(): Promise<{ network: string; networkPassphrase: string }> {
    const result = await getNetwork();
    if (result.error || !result.networkPassphrase) {
      throw new Error(result.error ? message(result.error) : "Could not read wallet network");
    }
    return { network: result.network, networkPassphrase: result.networkPassphrase };
  }

  watchChanges(callback: (info: { address: string; networkPassphrase: string }) => void): () => void {
    const watcher = new WatchWalletChanges(3000);
    watcher.watch((params) => {
      if (params.error || !params.address) return;
      callback({ address: params.address, networkPassphrase: params.networkPassphrase });
    });
    return () => watcher.stop();
  }
}

/**
 * Grant site access, then verify the wallet is on the expected network.
 * Access must be requested first: some extensions do not report their network
 * until the site has been authorized.
 */
export async function connectWallet(
  wallet: WalletAdapter,
  expectedPassphrase: string,
): Promise<string> {
  const address = await wallet.requestAccess();
  await assertWalletNetwork(wallet, expectedPassphrase);
  return address;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const TESTNET_NAMES = new Set(["testnet", "test", "test sdf"]);
const MAINNET_NAMES = new Set(["public", "mainnet", "public global", "pub net"]);

export type NetworkFamily = "testnet" | "mainnet" | "unknown";

export function networkFamily(passphrase: string): NetworkFamily {
  const value = normalize(passphrase);
  if (value.includes("testnet") || value.includes("test sdf")) return "testnet";
  if (value.includes("public global") || value.includes("mainnet")) return "mainnet";
  return "unknown";
}

/**
 * Freighter may report the network name ("TESTNET") and a longer passphrase
 * than the app preset ("Testnet SDF"). Accept exact passphrase matches or a
 * consistent name+family match, and reject mixed or unknown combinations.
 */
export function networkMatches(
  actual: { network: string; networkPassphrase: string },
  expectedPassphrase: string,
): boolean {
  const actualPass = normalize(actual.networkPassphrase);
  const expectedPass = normalize(expectedPassphrase);
  const family = networkFamily(expectedPassphrase);
  const name = normalize(actual.network);
  const nameFamily: NetworkFamily = TESTNET_NAMES.has(name)
    ? "testnet"
    : MAINNET_NAMES.has(name)
      ? "mainnet"
      : "unknown";
  const actualFamily = networkFamily(actual.networkPassphrase);

  // Wallets that do not report a usable network name fall back to the exact
  // passphrase comparison.
  if (nameFamily === "unknown" || family === "unknown") {
    return actualPass === expectedPass && actualPass.length > 0;
  }
  // Never accept a wallet whose reported network name contradicts the
  // configured family, even if its passphrase string happens to match.
  if (nameFamily !== family) return false;

  return (
    actualPass === expectedPass ||
    actualFamily === family ||
    actualPass.includes(family)
  );
}

/** Fail early if the wallet is on a different network than the app config. */
export async function assertWalletNetwork(
  wallet: WalletAdapter,
  expectedPassphrase: string,
): Promise<void> {
  const actual = await wallet.getNetwork();
  if (!networkMatches(actual, expectedPassphrase)) {
    throw new Error(
      `Wallet is on "${actual.network}" but this demo expects "${expectedPassphrase}". Switch the wallet network and retry.`,
    );
  }
}

/**
 * Fail closed if the wallet account changed, access was revoked, or the
 * extension disappeared between page load and a signing action.
 */
export async function assertWalletIdentity(
  wallet: WalletAdapter,
  expectedAddress: string,
): Promise<void> {
  let current: string | null;
  try {
    current = await wallet.getAddress();
  } catch {
    throw new Error("Wallet extension is unavailable — reconnect and retry");
  }
  if (!current) {
    throw new Error("Wallet access was revoked — reconnect and retry");
  }
  if (current !== expectedAddress) {
    throw new Error("Wallet account changed since the page loaded — reconnect and retry");
  }
}

/**
 * The wallet may switch accounts while a signature request is open. If the
 * RPC reports the submitted transaction source, require it to match the
 * actor the UI intended to sign with.
 */
export function assertTransactionSource(expected: string, sourceAccount?: string): void {
  if (!sourceAccount) return;
  if (sourceAccount !== expected) {
    throw new Error("Transaction source does not match the connected wallet — do not retry blindly");
  }
}
