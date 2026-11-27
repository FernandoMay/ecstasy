/** Aggregations computed only from feedback stored in this browser. */

import type { AfterglowFeedback } from "./afterglow-feedback";

export interface AfterglowInsights {
  count: number;
  average: number | null;
  tags: Record<string, number>;
  byEncounter: Array<{ encounterId: string; score: number; tags: string[] }>;
}

export function afterglowInsights(feedback: readonly AfterglowFeedback[]): AfterglowInsights {
  const tags: Record<string, number> = {};
  let sum = 0;
  const byEncounter = feedback.map((entry) => {
    sum += entry.score;
    for (const tag of entry.tags) tags[tag] = (tags[tag] ?? 0) + 1;
    return { encounterId: entry.encounterId, score: entry.score, tags: entry.tags };
  });
  return {
    count: feedback.length,
    average: feedback.length ? Math.round((sum / feedback.length) * 10) / 10 : null,
    tags,
    byEncounter,
  };
}

export function filterFeedback(
  feedback: readonly AfterglowFeedback[],
  minScore: number,
): AfterglowFeedback[] {
  return feedback.filter((entry) => entry.score >= minScore);
}
