/**
 * Network and deployment configuration.
 *
 * Secrets never live here. Only public RPC URLs and public contract/asset
 * IDs are read from the environment. `NEXT_PUBLIC_*` is used so the same
 * module works in the Next.js browser bundle and in Node tests.
 */

import { Networks } from "@stellar/stellar-sdk";

export type NetworkName = "testnet" | "mainnet";

export interface NetworkPreset {
  rpcUrl: string;
  networkPassphrase: string;
  explorerBaseUrl: string;
  /** Public deployment defaults; environment variables override them. */
  contractId: string;
  assetContractId: string;
  bovedaContractId: string;
}

export const NETWORK_PRESETS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65",
    assetContractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    bovedaContractId: "CDJNBZDPR633QEAWNQ2FOCJCMIMJSXFA3LHY6SV2WGPQPV6WATERIZUM",
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: Networks.PUBLIC,
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "",
    assetContractId: "",
    bovedaContractId: "",
  },
};

export interface AppConfig extends NetworkPreset {
  network: NetworkName;
  /** Deployed ECSTASY contract ID (C...). Empty means "not configured". */
  contractId: string;
  /** Stellar Asset Contract ID used for optional escrow (C...). */
  assetContractId: string;
  /** Human-readable asset code shown in the UI. */
  assetSymbol: string;
  /** Bóveda vault contract ID. */
  bovedaContractId: string;
}

function env(name: string, source: Record<string, string | undefined>): string | undefined {
  const value = source[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

/** Fail closed on unknown networks and on an unapproved Mainnet release. */
export function getConfig(
  source: Record<string, string | undefined> = process.env,
): AppConfig {
  const requested = env("NEXT_PUBLIC_STELLAR_NETWORK", source) ?? "testnet";
  if (requested !== "testnet" && requested !== "mainnet") {
    throw new Error(
      `Invalid NEXT_PUBLIC_STELLAR_NETWORK "${requested}". Use "testnet" or "mainnet".`,
    );
  }
  const network: NetworkName = requested;
  const preset = NETWORK_PRESETS[network];

  if (network === "mainnet" && env("NEXT_PUBLIC_MAINNET_RELEASE", source) !== "confirmed") {
    throw new Error(
      "Mainnet requires NEXT_PUBLIC_MAINNET_RELEASE=confirmed after the release review",
    );
  }

  const contractId = env("NEXT_PUBLIC_CONTRACT_ID", source) ?? preset.contractId;
  const assetContractId = env("NEXT_PUBLIC_ASSET_CONTRACT_ID", source) ?? preset.assetContractId;
  if (!/^C[A-Z2-7]{55}$/.test(contractId) || !/^C[A-Z2-7]{55}$/.test(assetContractId)) {
    throw new Error(`Network ${network} requires explicit valid contract and asset IDs`);
  }
  if (contractId === assetContractId) {
    throw new Error("Contract and escrow asset IDs must be different contracts");
  }

  return {
    network,
    ...preset,
    rpcUrl: env("NEXT_PUBLIC_RPC_URL", source) ?? preset.rpcUrl,
    contractId,
    assetContractId,
    assetSymbol: env("NEXT_PUBLIC_ASSET_SYMBOL", source) ?? "XLM",
    bovedaContractId: env("NEXT_PUBLIC_BOVEDA_CONTRACT_ID", source) ?? preset.bovedaContractId,
  };
}

export function isConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.contractId);
}

/** The deployment supports exactly one escrow asset; validate that it is set. */
export function isAssetConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.assetContractId);
}
