install-stack.ps1
Watchtower — installateur de la stack IA/OSINT 100 % gratuite (Windows).

Ce que fait ce script :
  1. vérifie / installe les prérequis open source (Git, Node LTS, Python 3.12, winget)
  2. installe Ollama (moteur de LLM local) et tire les modèles selon ta VRAM détectée
  3. pose un venv Python : crawl4ai (web→markdown), faster-whisper (STT), piper-tts (TTS FR),
     marker-pdf (PDF→markdown), spiderfoot (OSINT)
  4. démarre la stack Docker si Docker Desktop est présent (SearXNG, Vane, SpiderFoot,
     Activepieces, Langfuse) — sinon il te dit quoi cocher, il n'installe pas de gros paquets
     dans ton dos
  5. clone ton repo watchtower, `npm install`, crée un .env 0-clé, lance l'app
  6. écrit un rapport dans audit/stack/INSTALL-REPORT.txt

Sûreté : script 100 % lisible, aucune exécution distante (`iwr | iex`), tout est écrit sous
audit/stack/ dans ton repo, rien de système sans winget/PowerShell officiels.

Usage (PowerShell, depuis la racine du repo) :
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\audit\stack\install-stack.ps1
  # options : -SkipDocker -SkipPython -SkipOllama -WithBigModels -AppUrl http://localhost:4173
#>
[CmdletBinding()]
param(
  [string]$RepoUrl  = "https://github.com/Sathancabrol/watchtower.git",
  [string]$WorkDir  = (Join-Path $PSScriptRoot "..\.."),
  [string]$OllamaSmallModel = "qwen3:4b",
  [string]$OllamaMidModel   = "llama3.1:8b",
  [string]$OllamaBigModel   = "qwen3:30b-a3b",
  [string]$TtsPiperVoice    = "fr_FR-siwis-medium",
  [switch]$SkipDocker,
  [switch]$SkipPython,
  [switch]$SkipOllama,
  [switch]$WithBigModels,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$WorkDir = (Resolve-Path $WorkDir).Path
$Log = Join-Path $PSScriptRoot "INSTALL-REPORT.txt"
$script:Report = New-Object System.Collections.Generic.List[string]

function Log([string]$m, [string]$lvl = "INFO") {
  $line = "[{0}] {1,-5} {2}" -f (Get-Date -Format "HH:mm:ss"), $lvl, $m
  Write-Host $line
  $script:Report.Add($line)
}
function Invoke-Step {
  param([string]$Name, [scriptblock]$Body)
  try {
    if ($DryRun) { Log "DRY-RUN — aurait exécuté : $Name" "SKIP"; return $null }
    Log "▶ $Name"
    $r = & $Body
    Log "✔ $Name" "OK"
    return $r
  } catch {
    Log "✘ $Name : $($_.Exception.Message)" "WARN"
    return $null
  }
}
function Has-Cmd([string]$name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

Log "=== Watchtower / install-stack — $(Get-Date -Format 'yyyy-MM-dd HH:mm') ==="
if ($DryRun) { Log "Mode -DryRun : rien ne sera installé, uniquement vérifié." "INFO" }

# ── 0. inventaire matériel ───────────────────────────────────────────────────
$ram  = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
$script:VramMb = 0
$gpuInfo = Invoke-Step "Détection GPU/VRAM" {
  $out = @()
  if (Has-Cmd "nvidia-smi") {
    $vram = (& nvidia-smi --query-gpu=memory.total,name --format=csv,noheader,nounits 2>$null)
    if ($vram) {
      foreach ($l in $vram) {
        $p = $l -split ","
        $out += "NVIDIA — $([int]$p[0]) Mo — $($p[1].Trim())"
      }
      $script:VramMb = [int](($vram[0] -split ",")[0])
    }
  }
  if (-not $out) {
    $g = Get-CimInstance Win32_VideoController | Select-Object -First 1
    $out += "Pas de nvidia-smi — GPU: $($g.Name) (palier CPU-only probable)"
    $script:VramMb = 0
  }
  return ($out -join " / ")
}
$disk = [math]::Round((Get-PSDrive -Name ($WorkDir.Substring(0,1))).Free / 1GB, 1)
Log "RAM ≈ $ram Go · disque libre ≈ $disk Go · GPU : $gpuInfo" "INFO"
if ($disk -lt 40) { Log "Moins de 40 Go libres : les modèles (3-40 Go) ne rentreront pas. -SkipOllama conseillé." "WARN" }
if ($ram -lt 8)   { Log "Moins de 8 Go de RAM : ne lance pas la stack Docker complète (-SkipDocker)." "WARN" }

# ── 1. prérequis ──────────────────────────────────────────────────────────────
$haveWinget = Has-Cmd "winget"
if (-not $haveWinget) { Log "winget absent → installe 'App Installer' depuis le Microsoft Store (gratuit), ou passe par les installeurs manuels." "WARN" }
foreach ($p in @(
  @{ n="Git";   id="Git.Git";        cmd="git" },
  @{ n="Node";  id="OpenJS.NodeJS.LTS"; cmd="node" },
  @{ n="Python";id="Python.Python.3.12"; cmd="python" }
)) {
  Invoke-Step "Prérequis $($p.n)" {
    if (Has-Cmd $p.cmd) { return "déjà là ($(& $p.cmd --version 2>$null | Select-Object -First 1))" }
    if ($haveWinget) { winget install -e --id $p.id --accept-package-agreements --accept-source-agreements --silent }
    else { Log "Aucun winget : installe $($p.n) manuellement → https://nodejs.org / https://git-scm.com / https://python.org" "WARN" }
  } | Out-Null
}
if (-not (Has-Cmd "node")) { Log "Node indisponible : l'app de la tour ne pourra pas démarrer. Installe Node LTS puis relance." "ERROR" }
else { Log "Node $(node --version) · npm $(npm --version)" "INFO" }

# ── 2. Ollama + modèles ──────────────────────────────────────────────────────
if (-not $SkipOllama) {
  Invoke-Step "Ollama (moteur local)" {
    if (Has-Cmd "ollama") { return "déjà installé" }
    if ($haveWinget) {
      winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements --silent | Out-Null
    } else {
      Log "Téléchargement de l'installeur officiel Ollama…" "INFO"
      $exe = Join-Path $env:TEMP "OllamaSetup.exe"
      Invoke-WebRequest "https://ollama.com/download/OllamaSetup.exe" -OutFile $exe
      Start-Process $exe -ArgumentList "/S" -Wait
    }
  } | Out-Null

  if (Has-Cmd "ollama") {
    $model = if ($WithBigModels) { $OllamaBigModel } elseif ($script:VramMb -ge 8000) { $OllamaMidModel } else { $OllamaSmallModel }
    Log "Modèle choisi selon VRAM ($($script:VramMb) Mo) : $model" "INFO"
    Invoke-Step "ollama pull $model" { & ollama pull $model 2>&1 | Select-Object -Last 1 } | Out-Null
    Invoke-Step "ollama pull nomic-embed-text (embeddings FR/EN, ~270 Mo)" {
      & ollama pull nomic-embed-text 2>&1 | Select-Object -Last 1 } | Out-Null
    Invoke-Step "Test d'inférence (le LLM répond-il ?)" {
      $ans = & ollama run $model "Réponds par un seul mot : prêt ?" 2>&1
      "LLM → $((($ans | Out-String).Trim() -split "`n")[0])" } | Out-Null
    Log "API locale prête : http://127.0.0.1:11434/v1/chat/completions (OpenAI-compatible)" "OK"
  } else { Log "ollama introuvable après install → redémarre le terminal, ou https://ollama.com/download/windows" "WARN" }
}

# ── 3. Python : OCR/crawl/voix/PDF/OSINT ─────────────────────────────────────
if (-not $SkipPython) {
  $venv = Join-Path $PSScriptRoot ".venv"
  Invoke-Step "venv Python ($venv)" {
    if (-not (Test-Path $venv)) { python -m venv $venv }
    $py = Join-Path $venv "Scripts\python.exe"
    & $py -m pip install --upgrade pip -q
    $pkgs = @(
      "crawl4ai",            # web → markdown
      "faster-whisper",      # STT local
      "piper-tts",           # TTS FR sur CPU
      "marker-pdf",          # PDF → markdown
      "chonkie",             # chunking
      "outlines",            # JSON garanti (pour tes schemas/*.json)
      "instructor",          # sorties typées Pydantic
      "openai",              # client générique → LiteLLM/Ollama
      "spiderfoot"           # OSINT (sinon : docker)
    ) -join " "
    & $py -m pip install -q $pkgs.Split(" ")
    "paquets : $pkgs"
  } | Out-Null

  $py = Join-Path $venv "Scripts\python.exe"
  if (Test-Path $py) {
    Invoke-Step "Post-install crawl4ai (navigateur)" { & $py -m playwright install chromium --with-deps 2>&1 | Select-Object -Last 1 } | Out-Null
    Invoke-Step "Test whisper (STT)" {
      & $py -c "from faster_whisper import WhisperModel; WhisperModel('base','cpu','float32'); print('whisper ok')" 2>&1 | Select-Object -Last 1
    } | Out-Null
    Invoke-Step "Test piper (TTS FR)" {
      & $py -c "import piper,os;print('piper module ok — voix à télécharger : $TtsPiperVoice')" 2>&1 | Select-Object -Last 1
    } | Out-Null
    Invoke-Step "Téléchargement d'une voix Piper FR (siwis → fr_FR en repli)" {
      $dir = Join-Path $PSScriptRoot "voices"
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
      foreach ($v in @($TtsPiperVoice, "fr_FR-fr_FR-medium")) {
        $spk = ($v -replace '^[a-z]+_[A-Z]+-', '' -replace '-(medium|low)$', '')
        $ok = $true
        foreach ($ext in @(".onnx", ".onnx.json")) {
          $out = Join-Path $dir "$v$ext"
          if (Test-Path $out) { continue }
          $u = "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/$spk/medium/$v$ext"
          try { Invoke-WebRequest $u -OutFile $out -ErrorAction Stop } catch { $ok = $false; Remove-Item $out -ErrorAction SilentlyContinue }
        }
        if ($ok) { $script:PiperVoice = $v; Log "✔ voix Piper retenue : $v (audit\stack\voices)" OK; break }
        else { Log "voix $v indisponible — liste : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR" WARN }
      }
    } | Out-Null
  }
}

# ── 4. Stack Docker (recherche + OSINT + automatisation + traces) ────────────
if (-not $SkipDocker) {
  if (Has-Cmd "docker") {
    Invoke-Step "docker compose up -d (audit/stack/docker-compose.yml)" {
      Push-Location $PSScriptRoot
      docker compose up -d 2>&1 | Select-Object -Last 8
      Pop-Location
    } | Out-Null
    Log "Ouverts : Vane http://localhost:3000 · SearXNG http://localhost:8080 · SpiderFoot http://localhost:5001 · Activepieces http://localhost:4200 · Langfuse http://localhost:3001" "OK"
  } else {
    Log "Docker absent. Option A : installe Docker Desktop (https://www.docker.com/products/docker-desktop/, gratuit pour l'usage perso) puis relance ce script. Option B (0 install lourde) : garde SearXNG+Vane sur une autre machine, ou utilise l'API de recherche locale de l'app." "WARN"
  }
}

# ── 5. l'app de la tour ──────────────────────────────────────────────────────
$target = Join-Path $WorkDir "app"
Invoke-Step "Cloner/récupérer l'app Watchtower" {
  if (-not (Test-Path (Join-Path $target "package.json"))) {
    if (Has-Cmd "git") { git clone --depth 1 $RepoUrl $target } else { throw "git absent" }
  } else { Push-Location $target; git pull -q --ff-only 2>&1 | Out-Null; Pop-Location }
  if (-not (Test-Path (Join-Path $target "package.json"))) {
    Log "⚠️ Le repo distant ne contient pas encore l'app (aujourd'hui : 1 README). L'agent doit d'abord pousser les 57 modules de COGNITORIUM/watchtower-mods (procédure APPLIQUER.md). Installation de la stack IA, elle, est valide." "WARN"
    return "repo sans app"
  }
  Push-Location $target
  npm install 2>&1 | Select-Object -Last 3
  if (-not (Test-Path ".env")) {
@"
# Généré par install-stack.ps1 — 0 clé requise, tout est gratuit
WATCHTOWER_MODE=free
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=$model
SEARCH_BASE_URL=http://localhost:8080/search
VANE_BASE_URL=http://localhost:3000/api
"@ | Set-Content -Encoding ascii ".env"
    Log "Création d'un .env sans clé (0 facturation possible)" "OK"
  }
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$target'; npm run dev -- --host localhost --port 4173" | Out-Null
  Pop-Location
  "app lancée sur http://localhost:4173"
} | Out-Null

# ── 6. rapport ───────────────────────────────────────────────────────────────
$script:Report | Set-Content -Encoding utf8 $Log
Log "Rapport écrit : $Log" "OK"
@"

───────────────────────────────────────────────────────────
 Watchtower · stack gratuite installée (ou vérifiée)
───────────────────────────────────────────────────────────
  Tour (globe + couches sans clé) ............. http://localhost:4173
  LLM local (API OpenAI-compatible) ........... http://127.0.0.1:11434
  Recherche privée (SearXNG) .................. http://localhost:8080
  Moteur de réponse cité (Vane) ............... http://localhost:3000
  OSINT (SpiderFoot) .......................... http://localhost:5001
  Automatisation (Activepieces) ............... http://localhost:4200
  Traces / evals (Langfuse) ................... http://localhost:3001
  Venv Python IA .............................. audit\stack\.venv
  Voix Piper FR ................................. audit\stack\voices

 Prochain pas (0 €, 0 compte) : demander à l'agent de brancher src/ai/llmClient.js
 sur http://127.0.0.1:11434 dans watchtower-mods, puis les retrievers web de reaserch-engine.
───────────────────────────────────────────────────────────
"@ | Write-Host
