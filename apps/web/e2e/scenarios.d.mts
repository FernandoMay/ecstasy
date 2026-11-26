export interface E2eStep {
  id: string;
  actor: "A" | "B" | "any";
  action: string;
  selector: string;
  expect: string;
  evidence: string;
}
export interface E2eScenario {
  id: string;
  name: string;
  steps: E2eStep[];
}
export declare const TEST_WALLETS: {
  A: { label: string; role: string };
  B: { label: string; role: string };
};
export declare const SCENARIOS: E2eScenario[];
export declare function validateScenarios(scenarios?: E2eScenario[]): {
  scenarios: number;
  steps: number;
};
