#!/usr/bin/env bash
# Deploy the Bóveda vault, pin the claim-code digest and fund it with 5555 XLM.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-${STELLAR_ACCOUNT:-}}"
ASSET="${ASSET:-CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC}"
CODE_HASH="${CODE_HASH:-7121f6ba9548cb8cf29a1d8dafcae8cefd0f5b97dbb5af2532eb6ffcb799e66e}"
AMOUNT="${AMOUNT:-55550000000}"
WASM="${WASM:-$ROOT/contracts/boveda/target/wasm32v1-none/release/boveda.wasm}"

if [[ -z "$SOURCE" ]]; then
  echo "SOURCE is required (Stellar CLI identity)" >&2
  exit 1
fi

echo "==> Building boveda"
stellar contract build --manifest-path "$ROOT/contracts/boveda/Cargo.toml"

echo "==> Deploying"
CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source-account "$SOURCE" \
  --network "$NETWORK" \
  --alias boveda \
  -- --asset "$ASSET" --code_hash "$CODE_HASH")"

echo "Contract ID: $CONTRACT_ID"
echo "==> Funding with $AMOUNT stroops (5555 XLM)"
stellar contract invoke --id "$CONTRACT_ID" --source-account "$SOURCE" --network "$NETWORK" -- \
  fund --caller "$SOURCE" --amount "$AMOUNT"

echo "==> Status"
stellar contract invoke --id "$CONTRACT_ID" --source-account "$SOURCE" --network "$NETWORK" -- status

echo "$CONTRACT_ID"
