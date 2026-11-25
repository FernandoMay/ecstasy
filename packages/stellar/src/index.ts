export { getConfig, isConfigured, NETWORK_PRESETS } from "./config";
export type { AppConfig, NetworkName, NetworkPreset } from "./config";

export {
  canonicalizeTerms,
  fromHex,
  shortHash,
  TERMS_SCHEMA,
  termsDigest,
  termsDigestAsync,
  toHex,
} from "./terms";
export type { TermsDocument } from "./terms";

export { accountUrl, contractUrl, shortAddress, transactionUrl } from "./explorer";

export { FreighterWallet, assertWalletNetwork } from "./wallet";
export type { WalletAdapter, WalletIdentity } from "./wallet";

export { createEcstasyClient, createReadOnlyClient } from "./contract";
export type { EcstasyClient, ClientOptions } from "./contract";

export { EcstasyService, statusName } from "./encounter";
export type { CreateEncounterInput, Receipt, WriteResult } from "./encounter";

export {
  EcstasyError,
  Client as GeneratedEcstasyClient,
} from "./generated/ecstasy";
export type { Encounter, EncounterStatus } from "./generated/ecstasy";
