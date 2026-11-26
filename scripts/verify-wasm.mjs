import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wasm = resolve(root, "contracts/ecstasy/target/wasm32v1-none/release/ecstasy.wasm");
if (!existsSync(wasm)) {
  console.error("Wasm not built. Run: cd contracts/ecstasy && stellar contract build");
  process.exit(1);
}
const actual = createHash("sha256").update(readFileSync(wasm)).digest("hex");

const sources = [
  "docs/RELEASES/testnet-rc-1.md",
  "docs/RELEASE_MATRIX.md",
  "docs/EVIDENCE.md",
];
let verified = 0;
for (const source of sources) {
  const content = readFileSync(resolve(root, source), "utf8");
  if (content.includes(actual)) verified += 1;
  else console.error(`MISMATCH: ${source} does not contain ${actual}`);
}
if (verified === 0) {
  console.error("No release document matches the compiled wasm hash");
  process.exit(1);
}
console.log(`Wasm hash ${actual} matches ${verified}/${sources.length} release documents`);
