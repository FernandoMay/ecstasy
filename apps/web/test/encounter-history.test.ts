import { describe, expect, it } from "vitest";
import {
  addEncounterRef,
  parseHistory,
  removeEncounterRef,
  roleLabel,
} from "../lib/encounter-history";

describe("local encounter history", () => {
  it("ignores malformed or non-numeric entries", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("not json")).toEqual([]);
    expect(parseHistory('{"id":"1"}')).toEqual([]);
    expect(parseHistory('[{"id":"abc","role":"creator","addedAt":1}]')).toEqual([]);
  });

  it("adds without duplicates and keeps newest first", () => {
    let raw = addEncounterRef(null, { id: "1", role: "creator", addedAt: 100 });
    raw = addEncounterRef(raw, { id: "2", role: "participant", addedAt: 200 });
    raw = addEncounterRef(raw, { id: "1", role: "viewer", addedAt: 300 });
    const list = parseHistory(raw);
    expect(list.map((item) => item.id)).toEqual(["1", "2"]);
    expect(list[0]?.role).toBe("viewer");
  });

  it("bounds the index and supports removal", () => {
    let raw: string | null = null;
    for (let i = 0; i < 60; i += 1) {
      raw = addEncounterRef(raw, { id: String(i), role: "viewer", addedAt: i }, 10);
    }
    expect(parseHistory(raw)).toHaveLength(10);
    raw = removeEncounterRef(raw, "59");
    expect(parseHistory(raw).some((item) => item.id === "59")).toBe(false);
  });

  it("never stores private terms, only the optional public commitment", () => {
    const raw = addEncounterRef(null, {
      id: "7",
      role: "creator",
      addedAt: 1,
      termsHash: "abc123",
    });
    const stored = JSON.parse(raw) as Array<Record<string, unknown>>;
    expect(Object.keys(stored[0] ?? {}).sort()).toEqual(["addedAt", "id", "role", "termsHash"]);
    expect(raw).not.toMatch(/private agreement|boundaries|summary/i);
    expect(roleLabel("creator")).toBe("Creador");
  });
});
