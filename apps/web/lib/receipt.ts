/** Human-readable, copyable evidence block for a confirmed transaction. */

export interface VerificationInput {
  encounterId?: string;
  action: string;
  hash: string;
  contractId?: string;
  network?: string;
}

export function formatVerification(input: VerificationInput): string {
  const lines = [
    "ECSTASY Testnet Evidence",
    ...(input.encounterId ? [`Encounter: #${input.encounterId}`] : []),
    `Action: ${input.action}`,
    `Network: ${input.network ?? "testnet"}`,
    `Transaction: ${input.hash}`,
    ...(input.contractId ? [`Contract: ${input.contractId}`] : []),
    `Explorer: https://stellar.expert/explorer/testnet/tx/${input.hash}`,
  ];
  return lines.join("\n");
}
