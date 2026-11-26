/**
 * Local index of encounters the user created or opened. Only public data is
 * stored (id, role, timestamp, optional commitment) — never private terms.
 * The contract remains the source of truth for the actual state.
 */

export type EncounterRole = "creator" | "participant" | "viewer";

export interface EncounterRef {
  id: string;
  role: EncounterRole;
  addedAt: number;
  termsHash?: string;
}

export const HISTORY_KEY = "ecstasy:encounters";

export function parseHistory(raw: string | null): EncounterRef[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is EncounterRef =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as EncounterRef).id === "string" &&
        /^\d+$/.test((item as EncounterRef).id) &&
        ["creator", "participant", "viewer"].includes((item as EncounterRef).role) &&
        typeof (item as EncounterRef).addedAt === "number",
    );
  } catch {
    return [];
  }
}

export function addEncounterRef(
  raw: string | null,
  ref: EncounterRef,
  maxEntries = 50,
): string {
  const current = parseHistory(raw).filter((item) => item.id !== ref.id);
  const next = [ref, ...current]
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, maxEntries);
  return JSON.stringify(next);
}

export function removeEncounterRef(raw: string | null, id: string): string {
  return JSON.stringify(parseHistory(raw).filter((item) => item.id !== id));
}

export function roleLabel(role: EncounterRole): string {
  return role === "creator" ? "Creador" : role === "participant" ? "Participante" : "Observador";
}
