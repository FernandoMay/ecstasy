/** Safe correlation IDs for structured logs and HTTP responses. */

export function sanitizeCorrelationId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  return cleaned.length >= 8 ? cleaned : null;
}

export function correlationId(raw: string | null | undefined): string {
  return sanitizeCorrelationId(raw) ?? globalThis.crypto.randomUUID();
}
