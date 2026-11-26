import { describe, expect, it } from "vitest";
import { CONTRACT_ERRORS, describeContractError, parseContractErrorCode } from "../src/errors";

describe("contract error mapping", () => {
  it("parses CLI and RPC error formats", () => {
    expect(parseContractErrorCode("HostError: Error(Contract, #11)")).toBe(11);
    expect(parseContractErrorCode("Error(Contract, #6)")).toBe(6);
    expect(parseContractErrorCode("contract #10 failed")).toBeNull();
  });

  it("maps every ABI code to a deterministic message", () => {
    for (const code of Object.keys(CONTRACT_ERRORS)) {
      const info = describeContractError(`Error(Contract, #${code})`);
      expect(info?.code).toBe(Number(code));
      expect(info?.message.length).toBeGreaterThan(10);
    }
    expect(describeContractError("Error(Contract, #11)")?.name).toBe("InvalidAsset");
    expect(describeContractError("Error(Contract, #10)")?.retryable).toBe(false);
  });

  it("returns null for unknown codes and non-contract failures", () => {
    expect(describeContractError("Error(Contract, #99)")).toBeNull();
    expect(describeContractError("network timeout")).toBeNull();
  });
});
