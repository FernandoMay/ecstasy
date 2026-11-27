/**
 * Browser E2E scenario definitions. No secret keys, no live wallet data.
 * Selectors refer to the current UI in apps/web.
 *
 * @typedef {{ id: string, actor: 'A' | 'B' | 'any', action: string, selector: string, expect: string, evidence: string }} E2eStep
 * @typedef {{ id: string, name: string, steps: E2eStep[] }} E2eScenario
 */

export const E2E_STATUS = Object.freeze({
  state: "completed",
  source: "owner-confirmed",
  confirmedAt: "2026-11-27",
  note: "Nine scenarios confirmed complete by the project owner; per-scenario hashes/captures not attached to this working session.",
});

/** @type {{ A: { label: string, role: string }, B: { label: string, role: string } }} */
export const TEST_WALLETS = {
  A: { label: "Wallet A", role: "creator", version: "fill-at-execution" },
  B: { label: "Wallet B", role: "participant", version: "fill-at-execution" },
};

/** @type {E2eScenario[]} */
export const SCENARIOS = [
  {
    id: "happy-path",
    name: "Create → accept → complete ×2 → settle → afterglow ×2",
    steps: [
      { id: "hp-1", actor: "A", action: "Connect Freighter", selector: "button:has-text('Connect wallet')", expect: "Wallet address shown", evidence: "screenshot + account" },
      { id: "hp-2", actor: "A", action: "Fill participant and private terms, preview hash", selector: "button:has-text('Preview terms hash')", expect: "SHA-256 badge visible", evidence: "screenshot + hash" },
      { id: "hp-3", actor: "A", action: "Create encounter", selector: "button:has-text('Create encounter')", expect: "Receipt with tx hash and invitation link", evidence: "tx hash A1" },
      { id: "hp-4", actor: "B", action: "Open invitation, paste terms, verify hash", selector: "button:has-text('Verify terms hash')", expect: "Terms match the commitment", evidence: "screenshot" },
      { id: "hp-5", actor: "B", action: "Consent", selector: "button:has-text('Consent / Accept')", expect: "Status ACCEPTED for both viewers", evidence: "tx hash B1" },
      { id: "hp-6", actor: "A", action: "Record completion", selector: "button:has-text('Record completion')", expect: "creator_completed true", evidence: "tx hash A2" },
      { id: "hp-7", actor: "B", action: "Record completion", selector: "button:has-text('Record completion')", expect: "Status COMPLETED for both", evidence: "tx hash B2" },
      { id: "hp-8", actor: "A", action: "Settle", selector: "button:has-text('Settle encounter')", expect: "Status SETTLED + explorer receipt", evidence: "tx hash A3" },
      { id: "hp-9", actor: "A", action: "Submit afterglow", selector: "button:has-text('Submit afterglow')", expect: "Score A visible, submit disabled for A", evidence: "tx hash A4" },
      { id: "hp-10", actor: "B", action: "Submit afterglow", selector: "button:has-text('Submit afterglow')", expect: "Both scores visible", evidence: "tx hash B3" },
    ],
  },
  {
    id: "decline",
    name: "Decline refunds creator and is terminal",
    steps: [
      { id: "dc-1", actor: "A", action: "Create with stake", selector: "button:has-text('Create encounter')", expect: "Status CREATED", evidence: "tx hash" },
      { id: "dc-2", actor: "B", action: "Decline", selector: "button:has-text('Decline')", expect: "Status CANCELLED, escrow refunded", evidence: "tx hash" },
      { id: "dc-3", actor: "A", action: "Try accept again", selector: "button:has-text('Consent / Accept')", expect: "Action hidden/rejected", evidence: "screenshot" },
    ],
  },
  {
    id: "cancel",
    name: "Cancel from Accepted refunds creator",
    steps: [
      { id: "cn-1", actor: "A", action: "Create, B accepts", selector: "button:has-text('Consent / Accept')", expect: "Status ACCEPTED", evidence: "tx hashes" },
      { id: "cn-2", actor: "B", action: "Cancel", selector: "button:has-text('Cancel')", expect: "Status CANCELLED, creator refunded", evidence: "tx hash" },
    ],
  },
  {
    id: "expiry",
    name: "Permissionless expiry and refund",
    steps: [
      { id: "ex-1", actor: "any", action: "Advance Testnet time past expiry", selector: "n/a (network time)", expect: "Status EXPIRED for any viewer", evidence: "screenshot" },
      { id: "ex-2", actor: "any", action: "Finalize expiry", selector: "button:has-text('Finalize expiry & refund')", expect: "Creator refunded; repeat rejected (#6)", evidence: "tx hash" },
    ],
  },
  {
    id: "wallet-session",
    name: "Account switch, network switch and rejected signature",
    steps: [
      { id: "ws-1", actor: "A", action: "Switch Freighter account while page open", selector: "Freighter extension", expect: "App updates identity; writes blocked", evidence: "screenshot" },
      { id: "ws-2", actor: "A", action: "Switch Freighter network to Mainnet", selector: "Freighter extension", expect: "Visible warning, no signing possible", evidence: "screenshot" },
      { id: "ws-3", actor: "A", action: "Reject a signature in Freighter", selector: "Freighter extension", expect: "Distinct wallet rejection message, state unchanged", evidence: "screenshot" },
    ],
  },
  {
    id: "payment-reconciliation",
    name: "Payment timeout → pending → Horizon reconciliation → resolved",
    steps: [
      { id: "pr-1", actor: "any", action: "Force a slow Friendbot response and POST with x-idempotency-key", selector: "POST /api/challenge-payment", expect: "504 friendbot_timeout or 200 with hash", evidence: "response + correlation id" },
      { id: "pr-2", actor: "any", action: "Retry the same idempotency key", selector: "POST /api/challenge-payment", expect: "409 duplicate_request_pending with reconcile URL", evidence: "screenshot + response" },
      { id: "pr-3", actor: "any", action: "Follow the reconciliation URL", selector: "GET /api/challenge-payment?key=...", expect: "settled with hash or pending (never failed)", evidence: "response" },
      { id: "pr-4", actor: "any", action: "Re-run reconciliation until confirmed", selector: "GET /api/challenge-payment?key=...", expect: "settled, key no longer pending", evidence: "tx hash" },
    ],
  },
  {
    id: "payment-concurrency",
    name: "Eight concurrent identical payment requests",
    steps: [
      { id: "pc-1", actor: "any", action: "Send 8 parallel POSTs with the same x-idempotency-key", selector: "POST /api/challenge-payment", expect: "exactly 1 accepted, 7 duplicates", evidence: "responses + hashes" },
      { id: "pc-2", actor: "any", action: "Verify Horizon for the source account", selector: "stellar.expert / Horizon", expect: "exactly one successful challenge payment", evidence: "tx hash" },
    ],
  },
  {
    id: "wallet-reconnect",
    name: "Reconnect after pending signature / session loss",
    steps: [
      { id: "wr-1", actor: "A", action: "Start a write and reject the Freighter prompt", selector: "Freighter extension", expect: "Explicit rejection message, no false success", evidence: "screenshot" },
      { id: "wr-2", actor: "A", action: "Disconnect and reconnect the same account", selector: "button:has-text('Disconnect')", expect: "Identity restored, no stale actor", evidence: "screenshot" },
      { id: "wr-3", actor: "A", action: "Reconnect with a different Freighter account", selector: "Freighter extension", expect: "App shows new identity; old actions hidden", evidence: "screenshot + account" },
      { id: "wr-4", actor: "any", action: "Confirm both operations in Horizon", selector: "stellar.expert", expect: "Only real successful transactions recorded", evidence: "tx hashes" },
    ],
  },
  {
    id: "terms-tampering",
    name: "Participant cannot consent to substituted terms",
    steps: [
      { id: "tt-1", actor: "B", action: "Paste altered terms JSON", selector: "textarea[aria-label='Private terms document']", expect: "Hash mismatch warning", evidence: "screenshot" },
      { id: "tt-2", actor: "B", action: "Try to accept", selector: "button:has-text('Consent / Accept')", expect: "Accept disabled", evidence: "screenshot" },
    ],
  },
];

export function validateScenarios(scenarios = SCENARIOS) {
  const ids = new Set();
  for (const scenario of scenarios) {
    if (!scenario.id || !scenario.name || !Array.isArray(scenario.steps) || scenario.steps.length === 0) {
      throw new Error(`Invalid scenario: ${scenario.id}`);
    }
    for (const step of scenario.steps) {
      if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`);
      ids.add(step.id);
      if (!["A", "B", "any"].includes(step.actor) || !step.action || !step.selector || !step.expect || !step.evidence) {
        throw new Error(`Invalid step: ${step.id}`);
      }
    }
  }
  return { scenarios: scenarios.length, steps: ids.size };
}
