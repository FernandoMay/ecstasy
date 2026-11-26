import { describe, expect, it } from "vitest";
import { withRetry } from "../lib/retry";

describe("read-after-write retry", () => {
  it("returns the first successful result", async () => {
    let calls = 0;
    const value = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("RPC stale");
        return "confirmed";
      },
      { attempts: 3, delaysMs: [1, 1] },
    );
    expect(value).toBe("confirmed");
    expect(calls).toBe(3);
  });

  it("throws the last error after exhausting attempts", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new Error(`failure ${calls}`);
        },
        { attempts: 3, delaysMs: [1, 1] },
      ),
    ).rejects.toThrow("failure 3");
    expect(calls).toBe(3);
  });

  it("does not retry when attempts is one", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new Error("single");
      }, { attempts: 1 }),
    ).rejects.toThrow("single");
    expect(calls).toBe(1);
  });
});
