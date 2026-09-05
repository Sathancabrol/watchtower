#!/usr/bin/env bash
# Génère des secrets locaux dans .env (et seulement .env). 0 service cloud, 0 clé d'API payante.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || cp .env.example .env
rand() { head -c 48 /dev/urandom | base64 | tr -d '/+=' | head -c "${1:-32}"; }
setv() { # setv VAR VALUE -> remplace la ligne VAR=... dans .env
  local k="$1" v="$2"
  if grep -q "^${k}=" .env; then
    python3 - "$k" "$v" <<'PY'
import sys, re, pathlib
k, v = sys.argv[1], sys.argv[2]
p = pathlib.Path('.env'); s = p.read_text()
s = re.sub(rf'(?m)^{re.escape(k)}=.*$', f'{k}={v}', s)
p.write_text(s)
PY
  else
    printf '%s=%s\n' "$k" "$v" >> .env
  fi
}
setv SEARXNG_SECRET "$(rand 40)"
setv SEARXNG_API_KEY "$(rand 24)"
setv PIECES_PG_PASSWORD "$(rand 24)"
setv AP_API_KEY "$(rand 32)"
chmod 600 .env
echo ".env écrit (permissions 600). Relance : docker compose up -d"
