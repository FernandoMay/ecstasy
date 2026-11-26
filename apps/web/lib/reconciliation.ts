/** Compare the three layers used as evidence for an encounter. */

export interface ReconciliationInput {
  /** Last status stored in the local index. */
  local?: string;
  /** Status read from the Soroban contract. */
  contract?: string;
  /** Status of the last submitted transaction receipt on Horizon. */
  horizon?: string;
}

export type ReconciliationState = "consistent" | "divergent" | "incomplete";

export interface ReconciliationResult {
  state: ReconciliationState;
  reason: string;
}

export function reconcile(input: ReconciliationInput): ReconciliationResult {
  if (!input.local || !input.contract) {
    return { state: "incomplete", reason: "Falta el índice local o la lectura del contrato." };
  }
  if (!input.horizon) {
    return {
      state: "incomplete",
      reason: "No hay recibo confirmado en Horizon todavía; el estado local y el contrato coinciden pero no se puede afirmar verificación completa.",
    };
  }
  if (input.local !== input.contract) {
    return { state: "divergent", reason: "El índice local difiere del contrato; refrescar on-chain." };
  }
  if (input.horizon !== "SUCCESS") {
    return { state: "incomplete", reason: "El último recibo no está confirmado en Horizon." };
  }
  return { state: "consistent", reason: "Índice local, contrato y recibo de Horizon coinciden." };
}
