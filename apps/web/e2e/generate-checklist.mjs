import { writeFileSync } from "node:fs";
import { SCENARIOS, TEST_WALLETS, validateScenarios } from "./scenarios.mjs";

const summary = validateScenarios();
const lines = [
  "# Browser E2E checklist — generated",
  "",
  `Generated from \`apps/web/e2e/scenarios.mjs\`: ${summary.scenarios} scenarios, ${summary.steps} steps.`,
  "Not executed: requires Freighter with two funded Testnet wallets.",
  "",
  `- ${TEST_WALLETS.A.label}: ${TEST_WALLETS.A.role}`,
  `- ${TEST_WALLETS.B.label}: ${TEST_WALLETS.B.role}`,
  "",
];

for (const scenario of SCENARIOS) {
  lines.push(`## ${scenario.name} (\`${scenario.id}\`)`, "");
  lines.push("| Step | Actor | Action | Selector | Expected | Evidence | Done |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const step of scenario.steps) {
    lines.push(
      `| ${step.id} | ${step.actor} | ${step.action} | \`${step.selector}\` | ${step.expect} | ${step.evidence} | [ ] |`,
    );
  }
  lines.push("");
}

lines.push(
  "After execution, paste transaction hashes and screenshots into `docs/EVIDENCE.md` and mark RC-1 accordingly.",
  "",
);

writeFileSync(new URL("../../docs/E2E_CHECKLIST.md", import.meta.url), lines.join("\n"));
console.log(`Wrote docs/E2E_CHECKLIST.md (${summary.scenarios} scenarios, ${summary.steps} steps)`);
