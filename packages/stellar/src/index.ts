export { getConfig, isConfigured, isAssetConfigured, NETWORK_PRESETS } from "./config";
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

export {
  FreighterWallet,
  assertTransactionSource,
  assertWalletIdentity,
  assertWalletNetwork,
  connectWallet,
  networkFamily,
  networkMatches,
} from "./wallet";
export type { WalletAdapter, WalletIdentity } from "./wallet";

export { CONTRACT_ERRORS, describeContractError, parseContractErrorCode } from "./errors";
export type { ContractErrorInfo } from "./errors";

export { createEcstasyClient, createReadOnlyClient } from "./contract";
export type { EcstasyClient, ClientOptions } from "./contract";

export { EcstasyService, parseEncounterId, statusName } from "./encounter";
export { canTransition, isTerminal, nextStates, statusNameOf } from "./state-machine";
export { assertStellarAccount, isStellarAccount } from "./validation";
export type { StatusName } from "./state-machine";
export type { CreateEncounterInput, Receipt, WriteResult } from "./encounter";

export {
  EcstasyError,
  Client as GeneratedEcstasyClient,
} from "./generated/ecstasy";
export type { Encounter, EncounterStatus } from "./generated/ecstasy";

export {
  Client as BovedaClient,
  BovedaError,
} from "./generated/boveda";

export {
  Client as DisputesClient,
  DisputeError,
} from "./generated/disputes";

export {
  Client as RefundsClient,
  RefundError,
} from "./generated/refunds";

export {
  Client as RecoveryClient,
  RecoveryError,
} from "./generated/recovery";

export {
  Client as ArbitrationClient,
  ArbitrationError,
} from "./generated/arbitration";

export {
  Client as MilestonesClient,
  MilestoneError,
} from "./generated/milestones";

export {
  Client as PanelClient,
  PanelError,
} from "./generated/panel";

export {
  Client as ReputationClient,
  ReputationError,
} from "./generated/reputation";
export {
  Client as TraceabilityClient,
  TraceError,
} from "./generated/traceability";

export * from "./lifecycle";

export {
  Client as StreamingClient,
  StreamError,
} from "./generated/streaming";
