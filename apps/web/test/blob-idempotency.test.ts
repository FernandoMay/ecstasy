import { describe, expect, it } from "vitest";
import { sharedIdempotencyEnabled } from "../lib/blob-idempotency";

describe("shared idempotency flag", () => {
  it("is opt-in and off by default", () => {
    expect(sharedIdempotencyEnabled({})).toBe(false);
    expect(sharedIdempotencyEnabled({ USE_SHARED_IDEMPOTENCY: "0" })).toBe(false);
    expect(sharedIdempotencyEnabled({ USE_SHARED_IDEMPOTENCY: "1" })).toBe(true);
  });
});
