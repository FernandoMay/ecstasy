/**
 * Typed contract client. No private keys are handled here: every write is
 * signed by the wallet adapter supplied by the caller.
 */

import { Client, EcstasyError } from "./generated/ecstasy";
import type { AppConfig } from "./config";
import type { WalletAdapter } from "./wallet";

export type EcstasyClient = Client;

export interface ClientOptions {
  address: string;
}

/** Build a client bound to the connected account. */
export function createEcstasyClient(
  config: AppConfig,
  wallet: WalletAdapter,
  options: ClientOptions,
): EcstasyClient {
  if (!config.contractId) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ID is not configured");
  }
  return new Client({
    contractId: config.contractId,
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    publicKey: options.address,
    signTransaction: wallet.signTransaction,
    signAuthEntry: wallet.signAuthEntry,
    errorTypes: EcstasyError,
    allowHttp: config.rpcUrl.startsWith("http://"),
  });
}

/** Read-only client: no wallet required, no signing function supplied. */
export function createReadOnlyClient(config: AppConfig): EcstasyClient {
  if (!config.contractId) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ID is not configured");
  }
  return new Client({
    contractId: config.contractId,
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    errorTypes: EcstasyError,
    allowHttp: config.rpcUrl.startsWith("http://"),
  });
}
