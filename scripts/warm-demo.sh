#!/usr/bin/env bash
# Pre-riscalda la cache dei repo della demo: lanciarlo PRIMA di presentare,
# così durante la demo ogni repo si carica ISTANTANEAMENTE (Next.js cache-a i risultati).
#
# Uso:  bash scripts/warm-demo.sh [BASE_URL]
#   BASE_URL default = http://localhost:4321
set -u
BASE="${1:-http://localhost:4321}"

# Set curato (misurato con OpenAI): contrasto A (pulito) -> C (reale, il nostro) -> D (anti-pattern)
REPOS=(
  "https://github.com/sindresorhus/is-obj"                # misurato A (95, 0 findings) - il "buono"
  "https://github.com/ThoKlith/GreenCode"                 # misurato C (findings reali) - il nostro, onesto
  "https://github.com/felixge/node-memory-leak-tutorial"  # misurato D (memory leak) - anti-pattern
)

echo "Warm-up cache demo su $BASE"
echo "(la prima analisi di ogni repo e' lenta ~30-120s; poi resta in cache ed e' istantanea)"
echo

# scalda la home
curl -s --max-time 60 "$BASE/" -o /dev/null

for r in "${REPOS[@]}"; do
  printf "  scaldo %-55s ... " "$r"
  code=$(curl -s --max-time 240 "$BASE/results?repo=$r" -o /dev/null -w "%{http_code}")
  if [ "$code" = "200" ]; then echo "OK"; else echo "HTTP $code (riprova)"; fi
done

echo
echo "Fatto. Ora questi repo si aprono istantaneamente durante la demo."
