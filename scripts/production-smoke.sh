#!/usr/bin/env bash
# Post-deploy smoke check for a Netlify production URL.
# Set SITE_URL (default: https://ecs-tasy.netlify.app).
set -euo pipefail

SITE_URL="${SITE_URL:-https://ecs-tasy.netlify.app}"
SITE_URL="${SITE_URL%/}"

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS $label ($actual)"
  else
    echo "FAIL $label expected $expected got $actual" >&2
    return 1
  fi
}

echo "==> $SITE_URL"
check "homepage" "200" "$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/")"

# A dynamically rendered encounter route must return an HTML document, not
# a 404 or a server error. The id below is a known Testnet encounter.
check "encounter route" "200" "$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/encounter/1")"

# The challenge endpoint is Testnet-only, fixed-destination and rate-limited.
# A POST either succeeds with a hash or is rate-limited (429). Any 5xx is a
# production failure and must be investigated (function timeout / Blobs).
STATUS="$(curl -s -o /tmp/ecstasy-prod-payment.json -w '%{http_code}' \
  -X POST "$SITE_URL/api/challenge-payment" \
  -H 'Content-Type: application/json' -d '{}')"
if [[ "$STATUS" == "200" ]]; then
  python3 -c "import json; d=json.load(open('/tmp/ecstasy-prod-payment.json')); assert d['memo']=='SHIP-S97KF8'; print('PASS payment', d['hash'])"
elif [[ "$STATUS" == "429" ]]; then
  echo "PASS payment (rate limited, no new transaction)"
else
  echo "FAIL payment HTTP $STATUS" >&2
  cat /tmp/ecstasy-prod-payment.json >&2
  exit 1
fi

echo "✅ Production smoke finished. Record the output in docs/EVIDENCE.md"
