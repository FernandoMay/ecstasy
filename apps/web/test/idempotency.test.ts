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
