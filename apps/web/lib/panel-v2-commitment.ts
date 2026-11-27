/** Off-chain mirror of Panel V2's domain-separated commitment digest. */

export interface PanelV2CommitmentInput {
  caseId: bigint;
  contractId: string;
  arbitrator: string;
  decision: number;
  /** 32-byte secret as hex. */
  secretHex: string;
}

function fromHex(value: string): Uint8Array {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error("Secret must be 32 bytes of hex");
  return Uint8Array.from(value.match(/.{2}/g)!, (pair) => parseInt(pair, 16));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/** sha256(tag || contract || case || decision || secret || arbitrator) */
export async function panelV2Commitment(input: PanelV2CommitmentInput): Promise<string> {
  if (!Number.isInteger(input.decision) || input.decision < 1 || input.decision > 3) {
    throw new Error("Invalid decision");
  }
  const id = new Uint8Array(8);
  new DataView(id.buffer).setBigUint64(0, input.caseId);
  const decision = new Uint8Array(4);
  new DataView(decision.buffer).setUint32(0, input.decision);
  const data = concat(
    new TextEncoder().encode("ECSTASY-PANEL-V2"),
    new TextEncoder().encode(input.contractId),
    id,
    decision,
    fromHex(input.secretHex),
    new TextEncoder().encode(input.arbitrator),
  );
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data as unknown as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
