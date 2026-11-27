/** Local structured context for an on-chain afterglow score. No private terms. */

export interface AfterglowFeedback {
  encounterId: string;
  score: number;
  tags: string[];
  submittedAt: number;
}

export const FEEDBACK_KEY = "ecstasy:afterglow-feedback";

export const FEEDBACK_TAGS = [
  "Claridad",
  "Puntualidad",
  "Respeto",
  "Cumplimiento",
  "Comunicación",
] as const;

export function parseFeedback(raw: string | null): AfterglowFeedback[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is AfterglowFeedback =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as AfterglowFeedback).encounterId === "string" &&
        /^\d+$/.test((item as AfterglowFeedback).encounterId) &&
        Number.isInteger((item as AfterglowFeedback).score) &&
        (item as AfterglowFeedback).score >= 0 &&
        (item as AfterglowFeedback).score <= 100 &&
        Array.isArray((item as AfterglowFeedback).tags) &&
        typeof (item as AfterglowFeedback).submittedAt === "number",
    );
  } catch {
    return [];
  }
}

export function addFeedback(raw: string | null, entry: AfterglowFeedback, max = 50): string {
  const current = parseFeedback(raw).filter(
    (item) => item.encounterId !== entry.encounterId,
  );
  return JSON.stringify([entry, ...current].slice(0, max));
}
