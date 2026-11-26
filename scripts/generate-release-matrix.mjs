import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));

const commit = execFileSync("git", ["log", "-1", "--format=%H %s"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const [commitHash, ...titleParts] = commit.split(" ");

const wasmPath = resolve(root, "contracts/ecstasy/target/wasm32v1-none/release/ecstasy.wasm");
const wasmHash = existsSync(wasmPath)
  ? createHash("sha256").update(readFileSync(wasmPath)).digest("hex")
  : "not built locally — run `stellar contract build`";

const env = read(".env.example");
const contractId = env.match(/NEXT_PUBLIC_CONTRACT_ID=(C[A-Z2-7]{55})/)?.[1] ?? "unconfigured";
const assetId = env.match(/NEXT_PUBLIC_ASSET_CONTRACT_ID=(C[A-Z2-7]{55})/)?.[1] ?? "unconfigured";

const rootPkg = json("package.json");
const webPkg = json("apps/web/package.json");
const stellarPkg = json("packages/stellar/package.json");
const cargo = read("contracts/ecstasy/Cargo.toml");
const sdkVersion = cargo.match(/soroban-sdk\s*=\s*"([^"]+)"/)?.[1] ?? "unknown";

const lines = [
  "# Release matrix — generated",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "| Item | Value |",
  "|---|---|",
  `| Source commit | \`${commitHash}\` — ${titleParts.join(" ")} |`,
  `| Network | testnet (public preset in \`packages/stellar/src/config.ts\`) |`,
  `| Contract ID | \`${contractId}\` |`,
  `| Escrow asset | \`${assetId}\` |`,
  `| Wasm SHA-256 | \`${wasmHash}\` |`,
  `| Node (CI/Netlify) | ${rootPkg.engines?.node ?? "unspecified"} / 24 |`,
  `| Next.js | ${webPkg.dependencies.next} |`,
  `| React | ${webPkg.dependencies.react} |`,
  `| @stellar/stellar-sdk | ${stellarPkg.dependencies["@stellar/stellar-sdk"]} |`,
  `| @stellar/freighter-api | ${stellarPkg.dependencies["@stellar/freighter-api"]} |`,
  `| soroban-sdk (manifest) | ${sdkVersion} |`,
  "",
  "## Verification commands",
  "",
  "```bash",
  "npm ci && npm test && npm run typecheck && npm run build",
  "cd contracts/ecstasy && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build",
  "cd ../.. && npm run generate:bindings --workspace=@ecstasy/stellar && git diff --exit-code -- packages/stellar/src/generated/ecstasy.ts",
  "SITE_URL=https://ecs-tasy.netlify.app SKIP_PAYMENT=1 scripts/production-smoke.sh",
  "```",
  "",
  "Transaction evidence: `docs/FUNCTIONS_FOR_REVIEW.md`, `docs/EVIDENCE.md` and `docs/RELEASES/testnet-rc-1.md`.",
  "Browser E2E status: `docs/E2E_CHECKLIST.md`.",
  "",
];

writeFileSync(resolve(root, "docs/RELEASE_MATRIX.md"), lines.join("\n"));
console.log("Wrote docs/RELEASE_MATRIX.md");
