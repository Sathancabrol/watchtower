#!/usr/bin/env bash
# Relance l'aperçu WATCHTOWER en une commande.
#
# Trois pièges que ce script évite (décrits dans docs/DIAGNOSTIC.md §8) :
#   1. `npm install` échoue sur Puppeteer, qui télécharge Chrome → on pose
#      PUPPETEER_SKIP_DOWNLOAD=1.
#   2. `--host 0.0.0.0` ne suffit pas : vite.config.js lit la variable
#      d'environnement HOST pour autoriser l'hôte de l'aperçu (sinon 403).
#   3. ALLOW_FRAMING=1, sinon X-Frame-Options: DENY bloque l'iframe.
#
# Usage : ./scripts/preview.sh   (puis ouvrir http://localhost:4173/)
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d node_modules ] || [ -x node_modules/.bin/vite ] || PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --fund=false
if [ ! -x node_modules/.bin/vite ]; then
  PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --fund=false
fi

HOST=0.0.0.0 PORT=4173 ALLOW_FRAMING=1 exec node_modules/.bin/vite --strictPort
