/** Reconciliation of unknown payment outcomes against Horizon responses. */

import { CHALLENGE_CODE } from "./payment-policy";

export interface HorizonTransaction {
  hash?: string;
  successful?: boolean;
  memo?: string;
  memo_type?: string;
}

/** Find the successful challenge payment in a source account's history. */
export function findChallengePayment(transactions: readonly HorizonTransaction[]): string | null {
  for (const tx of transactions) {
    if (tx.successful === true && tx.memo_type === "text" && tx.memo === CHALLENGE_CODE && tx.hash) {
      return tx.hash;
    }
  }
  return null;
}
