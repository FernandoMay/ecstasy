import { describe, expect, it } from "vitest";
import { formatVerification } from "../lib/receipt";

describe("verification receipt", () => {
  it("includes action, hash and explorer link", () => {
    const text = formatVerification({
      encounterId: "7",
      action: "settle_encounter",
      hash: "e18c7ed7ddf14e3fd3ecb99d731f4d09f9d920e14425faed9ca06504fe523fc8",
      contractId: "CDG4L3FJRQRGL3AX53RM35ZKJNVSH4IT3JHMFZ73S2GO3ESWMFCFTT65",
    });
    expect(text).toContain("Encounter: #7");
    expect(text).toContain("Action: settle_encounter");
    expect(text).toContain("stellar.expert/explorer/testnet/tx/e18c7ed7");
  });

  it("works without optional fields", () => {
    expect(formatVerification({ action: "reclamar", hash: "abc" })).not.toContain("Encounter:");
  });
});
