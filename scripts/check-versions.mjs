import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const adr = read("docs/adr/0001-stack.md").replace(/`/g, "");

function documented(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("\\| " + escaped + " \\| ([^|]+) \\|").exec(adr);
  if (!match) throw new Error(`ADR is missing a row for ${label}`);
  return match[1].trim().split(/\s|\(/)[0];
}

const web = json("apps/web/package.json");
const stellar = json("packages/stellar/package.json");
const cargo = read("contracts/ecstasy/Cargo.toml");
const ci = read(".github/workflows/ci.yml");
const toolchain = read("contracts/ecstasy/rust-toolchain.toml");

const checks = [
  ["Next.js", web.dependencies.next],
  ["React / React DOM", web.dependencies.react],
  ["@stellar/stellar-sdk", stellar.dependencies["@stellar/stellar-sdk"]],
  ["@stellar/freighter-api", stellar.dependencies["@stellar/freighter-api"]],
  ["soroban-sdk (manifest)", cargo.match(/soroban-sdk\s*=\s*"([^"]+)"/)?.[1]],
  ["Stellar CLI", /STELLAR_CLI_VERSION:\s*"([^"]+)"/.exec(ci)?.[1]],
  ["Rust toolchain", /channel\s*=\s*"([^"]+)"/.exec(toolchain)?.[1]],
];

let failed = 0;
for (const [label, actual] of checks) {
  const expected = documented(label);
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${actual ?? "missing"} (ADR ${expected})`);
  if (!ok) failed += 1;
}
if (failed > 0) {
  console.error(`${failed} dependency drift(s) detected`);
  process.exit(1);
}
console.log("All pinned versions match docs/adr/0001-stack.md");
