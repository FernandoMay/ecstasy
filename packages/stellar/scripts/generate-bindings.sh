#!/usr/bin/env bash
# Regenerate the typed contract client from the locally built wasm.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM="${WASM:-$HERE/../../contracts/ecstasy/target/wasm32v1-none/release/ecstasy.wasm}"
OUT="$HERE/src/generated/ecstasy.ts"
TMP="${TMPDIR:-/tmp}/ecstasy-bindings-$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

if [[ ! -f "$WASM" ]]; then
  echo "Wasm not found: $WASM. Run: cd contracts/ecstasy && stellar contract build" >&2
  exit 1
fi

stellar contract bindings typescript --wasm "$WASM" --output-dir "$TMP" --overwrite

HASH="$(shasum -a 256 "$WASM" | awk '{print $1}')"
{
  echo "// GENERATED FILE — do not edit by hand."
  echo "// Source: contracts/ecstasy (wasm hash"
  echo "// $HASH)"
  echo "// Regenerate with: npm run generate:bindings --workspace=@ecstasy/stellar"
  echo "//"
  cat "$TMP/src/index.ts"
} > "$OUT"

echo "Regenerated $OUT"
