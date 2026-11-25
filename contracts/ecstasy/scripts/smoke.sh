#!/usr/bin/env bash
# Real Testnet vertical slice: create → accept → complete → settle → afterglow.
# Every write is a real signed transaction; output is suitable for evidence.
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
ALIAS_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/stellar/contract-ids/ecstasy.json"
CONTRACT_ID="${CONTRACT_ID:-$(python3 -c 'import json,sys; print(next(iter(json.load(open(sys.argv[1]))["ids"].values())))' "$ALIAS_FILE" 2>/dev/null || true)}"
CREATOR="${CREATOR:?Set CREATOR to a funded Stellar CLI identity}"
PARTICIPANT="${PARTICIPANT:?Set PARTICIPANT to a second funded Stellar CLI identity}"
ASSET="${ASSET:-$(stellar contract id asset --asset native --network "$NETWORK")}"
STAKE="${STAKE:-10000000}"
TERMS_HASH="${TERMS_HASH:-$(printf 'ecstasy demo terms v1' | shasum -a 256 | awk '{print $1}')}"
EXPIRES_AT="${EXPIRES_AT:-$(( $(date +%s) + 3600 ))}"

if [[ -z "$CONTRACT_ID" ]]; then
  echo "Set CONTRACT_ID (or deploy with --alias ecstasy first)" >&2
  exit 1
fi

CREATOR_ADDR="$(stellar keys public-key "$CREATOR")"
PARTICIPANT_ADDR="$(stellar keys public-key "$PARTICIPANT")"

echo "network=$NETWORK contract=$CONTRACT_ID"
echo "creator=$CREATOR_ADDR participant=$PARTICIPANT_ADDR asset=$ASSET stake=$STAKE"

invoke() {
  local source="$1"
  shift
  echo "--- invoke $* (source=$source)" >&2
  stellar contract invoke --id "$CONTRACT_ID" --source-account "$source" --network "$NETWORK" -- "$@"
}

ID="$(invoke "$CREATOR" create_encounter \
  --creator "$CREATOR_ADDR" \
  --participant "$PARTICIPANT_ADDR" \
  --asset "$ASSET" \
  --stake "$STAKE" \
  --terms_hash "$TERMS_HASH" \
  --expires_at "$EXPIRES_AT")"
echo "encounter_id=$ID"

invoke "$CREATOR" get_encounter --encounter_id "$ID"
invoke "$PARTICIPANT" accept_encounter --participant "$PARTICIPANT_ADDR" --encounter_id "$ID"
invoke "$CREATOR" complete_encounter --caller "$CREATOR_ADDR" --encounter_id "$ID"
invoke "$PARTICIPANT" complete_encounter --caller "$PARTICIPANT_ADDR" --encounter_id "$ID"
invoke "$CREATOR" settle_encounter --caller "$CREATOR_ADDR" --encounter_id "$ID"
invoke "$CREATOR" submit_afterglow --caller "$CREATOR_ADDR" --encounter_id "$ID" --score 88
invoke "$PARTICIPANT" submit_afterglow --caller "$PARTICIPANT_ADDR" --encounter_id "$ID" --score 92
invoke "$CREATOR" get_encounter --encounter_id "$ID"
invoke "$CREATOR" get_afterglow --encounter_id "$ID" --participant "$PARTICIPANT_ADDR"

echo "✅ Vertical slice complete. Copy the transaction hashes printed above into docs/EVIDENCE.md"
