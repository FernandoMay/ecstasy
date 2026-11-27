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
  disputesContractId: string;
  refundsContractId: string;
  recoveryContractId: string;
  arbitrationContractId: string;
  milestonesContractId: string;
  panelContractId: string;
  reputationContractId: string;
  traceabilityContractId: string;
  streamingContractId: string;
  subscriptionContractId: string;
}

export const NETWORK_PRESETS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65",
    assetContractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    bovedaContractId: "CAWOC5VH7QFM55YT7ICEACGTEOS5BF747IREQWK2DHTYKG25UTISAVZC",
    disputesContractId: "CCEZO3DVXQXWDM2OURVODDJ72JRQCLQPIO5E27FLXKW2THQUJOZKS4R6",
    refundsContractId: "CCMLBZ3U6QATIVKZREQC4JYYWQO3EK42GFNDYYEDC2YIAJ5RHKC36CG5",
    recoveryContractId: "CBCJFISHME7MSOQO43XH53YA3QVRCEEGO3DC6YIPU4XKMRGRY2WFOWNJ",
    arbitrationContractId: "CBPZKX3I5OR5WLDQGH2FSLOXPQOMQKPEZ2ENQQGASRF3HWP7GNTVJIDN",
    milestonesContractId: "CCNJVQLIXREAGJTLEZDI7T3C2PEXSB3FXCKI2HCQ2EBDVGF6MDYNOJJ7",
    panelContractId: "CCFRBPLVJPQWKIDGFDJY7BQEJQRZZ554G2Y5JZQBFJ62IQIXXGHJWNQ3",
    reputationContractId: "CDSKVD2HNSYAF7VZ44UQ3B4MG5RZTO33MJSCY3PKDJW37JM7OM5JYR7P",
    traceabilityContractId: "CA4CVK4XCLOTRKJ7XTU556WKN7T4DTI7HHRWVSQ4U35Q6KUKQULLFOTC",
    streamingContractId: "CA7T6F6CJTDURIHZRPWGJYKURGLH3PTMAFVBQGN7CXZ5BJ7GIWJJPJF2",
    subscriptionContractId: "CBOHLODIJJZ7ABFVBQSFDJ3DFVWMA4GZEDBYVVSHBCQIEWWCMAWVABRZ",
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: Networks.PUBLIC,
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "",
    assetContractId: "",
    bovedaContractId: "",
    disputesContractId: "",
    refundsContractId: "",
    recoveryContractId: "",
    arbitrationContractId: "",
    milestonesContractId: "",
    panelContractId: "",
    reputationContractId: "",
    traceabilityContractId: "",
    streamingContractId: "",
    subscriptionContractId: "",
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
  /** Dispute registry contract ID. */
  disputesContractId: string;
  /** Mutual refunds contract ID. */
  refundsContractId: string;
  /** Timeout recovery contract ID. */
  recoveryContractId: string;
  /** Escrow arbitration contract ID. */
  arbitrationContractId: string;
  /** Milestone escrow contract ID. */
  milestonesContractId: string;
  /** Multi-party panel contract ID. */
  panelContractId: string;
  /** Reputation & arbitration registry contract ID. */
  reputationContractId: string;
  /** Lifecycle reference-chain contract ID. */
  traceabilityContractId: string;
  /** Streaming payments contract ID. */
  streamingContractId: string;
  /** Subscription & recurring escrow contract ID. */
  subscriptionContractId: string;
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
    disputesContractId: env("NEXT_PUBLIC_DISPUTES_CONTRACT_ID", source) ?? preset.disputesContractId,
    refundsContractId: env("NEXT_PUBLIC_REFUNDS_CONTRACT_ID", source) ?? preset.refundsContractId,
    recoveryContractId: env("NEXT_PUBLIC_RECOVERY_CONTRACT_ID", source) ?? preset.recoveryContractId,
    arbitrationContractId: env("NEXT_PUBLIC_ARBITRATION_CONTRACT_ID", source) ?? preset.arbitrationContractId,
    milestonesContractId: env("NEXT_PUBLIC_MILESTONES_CONTRACT_ID", source) ?? preset.milestonesContractId,
    panelContractId: env("NEXT_PUBLIC_PANEL_CONTRACT_ID", source) ?? preset.panelContractId,
    reputationContractId: env("NEXT_PUBLIC_REPUTATION_CONTRACT_ID", source) ?? preset.reputationContractId,
    traceabilityContractId: env("NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID", source) ?? preset.traceabilityContractId,
    streamingContractId: env("NEXT_PUBLIC_STREAMING_CONTRACT_ID", source) ?? preset.streamingContractId,
    subscriptionContractId: env("NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ID", source) ?? preset.subscriptionContractId,
  };
}

export function isConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.contractId);
}

/** The deployment supports exactly one escrow asset; validate that it is set. */
export function isAssetConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.assetContractId);
}
