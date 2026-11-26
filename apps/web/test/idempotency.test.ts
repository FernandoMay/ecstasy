import { describe, expect, it } from "vitest";
import { IdempotencyGuard } from "../lib/idempotency";

describe("payment idempotency", () => {
  it("validates header keys", () => {
    const guard = new IdempotencyGuard(1000);
    expect(guard.isValidKey("abc12345")).toBe(true);
    expect(guard.isValidKey("short")).toBe(false);
    expect(guard.isValidKey("has spaces here")).toBe(false);
  });

  it("rejects duplicates inside the window and allows them after it", () => {
    const guard = new IdempotencyGuard(1000);
    expect(guard.isDuplicate("key-1234", 0)).toBe(false);
    guard.remember("key-1234", "hash-1", 0);
    expect(guard.isDuplicate("key-1234", 500)).toBe(true);
    expect(guard.recordedHash("key-1234")).toBe("hash-1");
    expect(guard.isDuplicate("key-1234", 1001)).toBe(false);
  });
});

describe("idempotency edge cases", () => {
  it("keeps different keys independent even when they map to the same hash", () => {
    const guard = new IdempotencyGuard(1_000);
    guard.remember("key-aaaa", "same-hash", 0);
    expect(guard.isDuplicate("key-bbbb", 10)).toBe(false);
    expect(guard.recordedHash("key-aaaa")).toBe("same-hash");
    expect(guard.recordedHash("key-bbbb")).toBeUndefined();
  });

  it("reuses an expired key with a new hash", () => {
    const guard = new IdempotencyGuard(1_000);
    guard.remember("key-1234", "old-hash", 0);
    expect(guard.isDuplicate("key-1234", 999)).toBe(true);
    expect(guard.isDuplicate("key-1234", 1_000)).toBe(false);
    guard.remember("key-1234", "new-hash", 1_000);
    expect(guard.recordedHash("key-1234")).toBe("new-hash");
  });

  it("handles concurrent identical requests as a single accepted submission", async () => {
    const guard = new IdempotencyGuard(60_000);
    const attempts = await Promise.all(
      Array.from({ length: 8 }, async () => {
        if (guard.isDuplicate("concurrent-key")) return "duplicate";
        guard.remember("concurrent-key", "tx-hash");
        return "accepted";
      }),
    );
    expect(attempts.filter((value) => value === "accepted")).toHaveLength(1);
    expect(attempts.filter((value) => value === "duplicate")).toHaveLength(7);
  });
});
