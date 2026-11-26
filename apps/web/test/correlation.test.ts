import { describe, expect, it } from "vitest";
import { correlationId, sanitizeCorrelationId } from "../lib/correlation";

describe("correlation IDs", () => {
  it("sanitizes caller-provided IDs to safe characters and length", () => {
    expect(sanitizeCorrelationId("  abc-123_XYZ  ")).toBe("abc-123_XYZ");
    expect(sanitizeCorrelationId("bad<id>with spaces")).toBe("badidwithspaces");
    expect(sanitizeCorrelationId("short")).toBeNull();
    expect(sanitizeCorrelationId(null)).toBeNull();
  });

  it("generates a UUID when none is provided", () => {
    expect(correlationId(null)).toMatch(/^[0-9a-f-]{36}$/);
    expect(correlationId("valid-key-1234")).toBe("valid-key-1234");
  });
});

describe("correlation ID abuse resistance", () => {
  it("caps long headers and never reflects control characters", () => {
    const long = "a".repeat(500);
    expect(sanitizeCorrelationId(long)).toHaveLength(64);
    expect(sanitizeCorrelationId("abc\n\rdef\tghi")).toBe("abcdefghi");
  });
});
