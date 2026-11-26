/** Deterministic mapping of Soroban contract error codes to UI messages. */

export interface ContractErrorInfo {
  code: number;
  name: string;
  message: string;
  retryable: boolean;
}

export const CONTRACT_ERRORS: Record<number, ContractErrorInfo> = {
  1: {
    code: 1,
    name: "NotFound",
    message: "This encounter does not exist on-chain.",
    retryable: false,
  },
  2: {
    code: 2,
    name: "NotParty",
    message: "Your connected wallet is not a participant of this encounter.",
    retryable: false,
  },
  3: {
    code: 3,
    name: "SelfEncounter",
    message: "Creator and participant must be different addresses.",
    retryable: false,
  },
  4: {
    code: 4,
    name: "InvalidStake",
    message: "The stake must be zero or positive.",
    retryable: false,
  },
  5: {
    code: 5,
    name: "InvalidExpiry",
    message: "The expiry must be in the future.",
    retryable: false,
  },
  6: {
    code: 6,
    name: "InvalidState",
    message: "This action is not allowed in the encounter's current state.",
    retryable: false,
  },
  7: {
    code: 7,
    name: "InvalidScore",
    message: "Afterglow score must be an integer from 0 to 100.",
    retryable: false,
  },
  8: {
    code: 8,
    name: "AlreadyCompleted",
    message: "This participant already recorded completion.",
    retryable: false,
  },
  9: {
    code: 9,
    name: "AlreadySubmitted",
    message: "This participant already submitted afterglow.",
    retryable: false,
  },
  10: {
    code: 10,
    name: "Expired",
    message: "The encounter expired before completion. Finalize the refund with expire_encounter.",
    retryable: false,
  },
  11: {
    code: 11,
    name: "InvalidAsset",
    message: "This deployment supports a single escrow asset; the submitted asset is not configured.",
    retryable: false,
  },
};

/** Extract an error code from CLI/RPC text such as `HostError: Error(Contract, #11)`. */
export function parseContractErrorCode(text: string): number | null {
  const match = /(?:Error\(Contract,\s*#|Contract,\s*#)(\d+)/.exec(text);
  if (!match) return null;
  const code = Number(match[1]);
  return Number.isInteger(code) ? code : null;
}

export function describeContractError(text: string): ContractErrorInfo | null {
  const code = parseContractErrorCode(text);
  return code === null ? null : CONTRACT_ERRORS[code] ?? null;
}
