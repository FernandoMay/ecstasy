/**
 * Network and deployment configuration.
 *
 * Secrets never live here. Only public RPC URLs and public contract/asset
 * IDs are read from the environment. `NEXT_PUBLIC_*` is used so the same
 * module works in the Next.js browser bundle and in Node tests.
 */

export type NetworkName = "testnet" | "mainnet";

export interface NetworkPreset {
  rpcUrl: string;
  networkPassphrase: string;
  explorerBaseUrl: string;
  /** Public deployment defaults; environment variables override them. */
  contractId: string;
  assetContractId: string;
}

export const NETWORK_PRESETS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Testnet SDF",
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "CBX2IKIF63HKHNIMA4RCJTIMNPXTBWIPJPWAPKZUW5GAKJNCOUQ4ZCN2",
    assetContractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    explorerBaseUrl: "https://explorer.stellar.org",
    contractId: "",
    assetContractId: "",
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
}

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getConfig(): AppConfig {
  const requested = (env("NEXT_PUBLIC_STELLAR_NETWORK") ?? "testnet") as NetworkName;
  const network: NetworkName = requested === "mainnet" ? "mainnet" : "testnet";
  const preset = NETWORK_PRESETS[network];

  return {
    network,
    ...preset,
    rpcUrl: env("NEXT_PUBLIC_RPC_URL") ?? preset.rpcUrl,
    contractId: env("NEXT_PUBLIC_CONTRACT_ID") ?? preset.contractId,
    assetContractId: env("NEXT_PUBLIC_ASSET_CONTRACT_ID") ?? preset.assetContractId,
    assetSymbol: env("NEXT_PUBLIC_ASSET_SYMBOL") ?? "XLM",
  };
}

export function isConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.contractId);
}

/** The deployment supports exactly one escrow asset; validate that it is set. */
export function isAssetConfigured(config: AppConfig): boolean {
  return /^C[A-Z2-7]{55}$/.test(config.assetContractId);
}
