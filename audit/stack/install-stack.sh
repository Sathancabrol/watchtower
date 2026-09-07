#!/usr/bin/env bash
# Watchtower — installateur de la stack IA/OSINT 100 % gratuite (Linux / WSL2 / Raspberry Pi 5 / tour-serveur)
#
#   1. prérequis (git, node 22+, python3-venv) — apt ou dnf, rien en curl|bash
#   2. Ollama + modèles selon la VRAM détectée (nvidia-smi) ; repli CPU + petit modèle
#   3. venv Python : crawl4ai, faster-whisper, piper-tts, marker-pdf, chonkie, outlines,
#      instructor, spiderfoot
#   4. docker compose (SearXNG, Vane, SpiderFoot, Activepieces, Langfuse) si docker présent
#   5. clone de ton repo watchtower, npm install, .env 0-clé, npm run dev
#   6. rapport : audit/stack/INSTALL-REPORT.txt
#
# Lecture conseillée avant exécution (c'est un script texte, pas un .exe) :  less install-stack.sh
# Usage :  bash install-stack.sh [--skip-docker] [--skip-python] [--skip-ollama] [--big] [--dry-run]
set -uo pipefail

REPO_URL="${REPO_URL:-https://github.com/Sathancabrol/watchtower.git}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${WORK_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
APP_DIR="$WORK_DIR/app"
VENV_DIR="$SCRIPT_DIR/.venv"
REPORT="$SCRIPT_DIR/INSTALL-REPORT.txt"
MODEL_SMALL="qwen3:4b"; MODEL_MID="llama3.1:8b"; MODEL_BIG="qwen3:30b-a3b"
PIPER_VOICE="${PIPER_VOICE:-fr_FR-siwis-medium}"
PIPER_VOICE_ALT="${PIPER_VOICE_ALT:-fr_FR-fr_FR-medium}"
SKIP_DOCKER=0; SKIP_PYTHON=0; SKIP_OLLAMA=0; BIG=0; DRY=0
for a in "$@"; do
  case "$a" in
    --skip-docker) SKIP_DOCKER=1;; --skip-python) SKIP_PYTHON=1;;
    --skip-ollama) SKIP_OLLAMA=1;; --big) BIG=1;; --dry-run) DRY=1;;
    *) echo "option inconnue : $a"; exit 2;;
  esac
done

log()  { printf '[%s] %-5s %s\n' "$(date +%H:%M:%S)" "${2:-INFO}" "$1" | tee -a "$REPORT"; }
run()  { if [ "$DRY" = 1 ]; then log "DRY-RUN : $*" SKIP; return 0; else "$@"; fi; }
have() { command -v "$1" >/dev/null 2>&1; }
os_family() { . /etc/os-release 2>/dev/null || true; case "${ID:-}" in ubuntu|debian|pop|linuxmint|elementary) echo apt;; fedora|rhel|centos|rocky|almalinux) echo dnf;; arch|manjaro) echo pacman;; *) echo apt;; esac; }
: > "$REPORT"
log "=== Watchtower / install-stack · $(date '+%F %R') · hôte $(hostname) ==="

# ── 0. inventaire ───────────────────────────────────────────────────────────
RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)
RAM_GB=$(( RAM_KB / 1024 / 1024 ))
DISK_GB=$(df -BG "$WORK_DIR" 2>/dev/null | awk 'NR==2{gsub("G","",$4);print $4}')
VRAM_MB=0
if have nvidia-smi; then
  GPU=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null | head -1)
  VRAM_MB=$(echo "$GPU" | awk -F', ' '{print $2+0}')
  log "GPU : $GPU"
else
  log "Pas de nvidia-smi → palier CPU-only (GPU 0 Mo). Les gros modèles/3DGS seront hors de portée ; utilise --skip-ollama si <8 Go."
fi
log "RAM ${RAM_GB} Go · disque libre ${DISK_GB} Go · VRAM ${VRAM_MB} Mo"
[ "${DISK_GB:-0}" -lt 40 ] && log "Espace disque serré : les modèles pèsent 3-40 Go. Allège (--skip-python, --skip-ollama)." WARN

# ── 1. prérequis ────────────────────────────────────────────────────────────
FAM=$(os_family); log "Distro : $FAM"
need=()
have git || need+=(git)
have python3 || need+=(python3 python3-venv python3-pip)
have curl || need+=(curl)
if ! have node || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 22 ]; then need+=(nodejs npm); fi
if [ "${#need[@]}" -gt 0 ]; then
  log "Paquets manquants : ${need[*]}"
  case "$FAM" in
    apt)  run sudo apt-get update -y && run sudo apt-get install -y "${need[@]}";;
    dnf)  run sudo dnf install -y "${need[@]}";;
    pacman) run sudo pacman -Sy --noconfirm "${need[@]}";;
  esac
fi
if have node; then log "node $(node -v) · npm $(npm -v)"; else log "Node ≥22 introuvable : installe-le (https://nodejs.org ou nvm) puis relance." ERROR; fi

# ── 2. Ollama + modèles ─────────────────────────────────────────────────────
if [ "$SKIP_OLLAMA" = 0 ]; then
  if ! have ollama; then
    log "Installation d'Ollama (script officiel, à vérifier) — alternative : paquet de distro ou https://ollama.com/download"
    if [ "$DRY" = 0 ]; then
      curl -fsSL https://ollama.com/install.sh -o /tmp/ollama-install.sh \
        && log "Installeur téléchargé dans /tmp/ollama-install.sh (relance avec sudo sh /tmp/ollama-install.sh après l'avoir lu)" WARN
    fi
  fi
  if have ollama; then
    if [ "$BIG" = 1 ]; then MODEL="$MODEL_BIG"
    elif [ "$VRAM_MB" -ge 8000 ]; then MODEL="$MODEL_MID"
    elif [ "$VRAM_MB" -ge 4000 ]; then MODEL="$MODEL_SMALL"
    else MODEL="${MODEL_SMALL%%:*}:0.6b"; log "Pas de VRAM → tout petit modèle ($MODEL) sur CPU"
    fi
    log "Modèle retenu : $MODEL"
    run ollama pull "$MODEL" && log "✔ $MODEL pulled"
    run ollama pull nomic-embed-text && log "✔ embeddings (nomic-embed-text)"
    if [ "$DRY" = 0 ]; then
      ANS=$(ollama run "$MODEL" "Réponds par un seul mot : prêt ?" 2>&1 | head -1)
      log "Test LLM → $ANS"
    fi
    log "API locale : http://127.0.0.1:11434/v1 (OpenAI-compatible)" OK
  fi
fi

# ── 3. Python : crawl / STT / TTS / PDF / OSINT ───────────────────────────────
if [ "$SKIP_PYTHON" = 0 ]; then
  if ! have python3; then log "python3 absent → branche IA non installée" WARN
  else
    [ -d "$VENV_DIR" ] || run python3 -m venv "$VENV_DIR"
    PY="$VENV_DIR/bin/python"
    if [ -x "$PY" ] && [ "$DRY" = 0 ]; then
      "$PY" -m pip install -q --upgrade pip
      log "Python : crawl4ai · faster-whisper · piper-tts · marker-pdf · chonkie · outlines · instructor · openai"
      "$PY" -m pip install -q crawl4ai faster-whisper piper-tts marker-pdf chonkie outlines instructor openai \
        && log "✔ paquets IA installés" OK || log "✘ pip a échoué (souvent 4 Go de RAM) : relance avec --skip-python" WARN
      "$PY" -m playwright install chromium >/dev/null 2>&1 && log "✔ Chromium (crawl4ai)" || log "Chromium non installé (crawl4ai utilisera le mode HTTP simple)" WARN
      mkdir -p "$SCRIPT_DIR/voices"
      for v in "$PIPER_VOICE" "$PIPER_VOICE_ALT"; do
        spk=$(echo "$v" | sed 's/^[a-z]*_[A-Z]*-//; s/-medium$//; s/-low$//')
        for ext in onnx onnx.json; do
          f="$SCRIPT_DIR/voices/$v.$ext"
          [ -s "$f" ] && continue
          url="https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/$spk/medium/$v.$ext"
          log "voix Piper FR : téléchargement $v ($ext)"
          curl -fsSL --retry 2 -o "$f" "$url" || { rm -f "$f"; log "échec $url → voir https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR" WARN; }
        done
        [ -s "$SCRIPT_DIR/voices/$v.onnx" ] && { PIPER_VOICE="$v"; log "✔ voix Piper retenue : $v" OK; break; }
      done
      "$PY" -c "from faster_whisper import WhisperModel; WhisperModel('base','cpu','float32'); print('whisper ok')" >>"$REPORT" 2>&1 && log "✔ test STT" || log "test STT non concluant (poids non téléchargés = normal)"
    fi
  fi
fi

# ── 4. Stack Docker ─────────────────────────────────────────────────────────
if [ "$SKIP_DOCKER" = 0 ]; then
  if have docker; then
    ( cd "$SCRIPT_DIR" && run docker compose up -d ) && log "✔ stack de recherche/OSINT démarrée" OK
    log "Vane http://localhost:3000 · SearXNG http://localhost:8080 · SpiderFoot http://localhost:5001 · Activepieces http://localhost:4200 · Langfuse http://localhost:3001"
  else
    log "Docker absent. Installe le moteur « docker-ce » de ta distro (gratuit) puis relance, ou sors la stack SearXNG/Vane sur une autre machine." WARN
  fi
fi

# ── 5. l'app de la tour ─────────────────────────────────────────────────────
if [ -f "$APP_DIR/package.json" ]; then
  ( cd "$APP_DIR" && git pull -q --ff-only 2>/dev/null; run npm install; )
  [ -f "$APP_DIR/.env" ] || cat > "$APP_DIR/.env" <<EOF
# généré par install-stack.sh — 0 clé, 0 facturation possible
WATCHTOWER_MODE=free
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=${MODEL:-$MODEL_SMALL}
SEARCH_BASE_URL=http://localhost:8080/search
VANE_BASE_URL=http://localhost:3000/api
EOF
  chmod 600 "$APP_DIR/.env" 2>/dev/null || true
  log ".env créé en 600 (les clés restent hors du repo)" OK
  ( cd "$APP_DIR" && run npm run dev -- --host localhost --port 4173 & )
  log "Tour lancée sur http://localhost:4173 (MODE GRATUIT)" OK
else
  log "Aucune app dans $APP_DIR : le repo watchtower en ligne ne contient pour l'instant qu'un README. Fais pousser l'app par l'agent (57 modules de COGNITORIUM/watchtower-mods + APPLIQUER.md) puis relance ce script." WARN
fi

log "Rapport complet : $REPORT" OK
cat <<'EOF'
───────────────────────────────────────────────────────────
 Watchtower · stack gratuite (0 €/mois, 0 compte requis)
───────────────────────────────────────────────────────────
  Tour ..................... http://localhost:4173
  LLM local ................ http://127.0.0.1:11434
  Recherche privée ......... http://localhost:8080
  Réponses citées (Vane) ... http://localhost:3000
  OSINT (SpiderFoot) ....... http://localhost:5001
  Automatisations .......... http://localhost:4200
  Traces / evals ........... http://localhost:3001
  Venv Python IA ........... audit/stack/.venv
  Voix Piper FR ............ audit/stack/voices
───────────────────────────────────────────────────────────
EOF
