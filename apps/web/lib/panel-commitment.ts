/** Off-chain mirror of the contract's commit-reveal digest layout. */

export interface PanelCommitmentInput {
  caseId: bigint;
  arbitrator: string;
  decision: number;
  /** 32-byte secret as hex. */
  secretHex: string;
}

function fromHex(value: string): Uint8Array {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error("Secret must be 32 bytes of hex");
  return Uint8Array.from(value.match(/.{2}/g)!, (pair) => parseInt(pair, 16));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/** id (u64 BE) | decision (u8) | secret (32B) | sha256(arbitrator strkey) */
export async function panelCommitment(input: PanelCommitmentInput): Promise<string> {
  if (input.decision < 1 || input.decision > 3) throw new Error("Invalid decision");
  const idBytes = new Uint8Array(8);
  new DataView(idBytes.buffer).setBigUint64(0, input.caseId);
  const arbHash = new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.arbitrator)),
  );
  const data = concat(idBytes, Uint8Array.of(input.decision), fromHex(input.secretHex), arbHash);
  return toHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", data as unknown as BufferSource)));
}
