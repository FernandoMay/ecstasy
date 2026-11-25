#!/usr/bin/env bash
# Build and deploy the ECSTASY Soroban contract, then optionally write the
# public contract ID into the web app's local environment file.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-${STELLAR_ACCOUNT:-}}"
ALIAS="${ALIAS:-ecstasy}"
WASM="${WASM:-$ROOT/contracts/ecstasy/target/wasm32v1-none/release/ecstasy.wasm}"
ENV_OUT="${ENV_OUT:-$ROOT/apps/web/.env.local}"

if [[ -z "$SOURCE" ]]; then
  echo "SOURCE is required (a Stellar CLI identity, e.g. SOURCE=ecstasy-deployer)" >&2
  exit 1
fi

echo "==> Building contract"
stellar contract build --manifest-path "$ROOT/contracts/ecstasy/Cargo.toml"

echo "==> Deploying to $NETWORK as $SOURCE"
CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source-account "$SOURCE" \
  --network "$NETWORK" \
  --alias "$ALIAS")"

echo "Contract ID: $CONTRACT_ID"

if [[ -n "${WRITE_ENV:-}" ]]; then
  mkdir -p "$(dirname "$ENV_OUT")"
  touch "$ENV_OUT"
  if grep -q '^NEXT_PUBLIC_CONTRACT_ID=' "$ENV_OUT"; then
    sed -i '' "s|^NEXT_PUBLIC_CONTRACT_ID=.*|NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID|" "$ENV_OUT"
  else
    echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_OUT"
  fi
  echo "Wrote $ENV_OUT"
fi

echo "$CONTRACT_ID"
