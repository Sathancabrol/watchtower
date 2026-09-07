# 🤖 Ce que l'agent fait à ta place (et ce qu'il ne fera pas)

Document opératoire : chaque ligne = une tâche réelle, avec le livrable, le coût, la part
d'automatisation, et ce qu'il reste **obligatoirement** pour toi.

## Échelle
`🤖 100 %` l'agent fait tout · `🤖+👆` l'agent prépare, toi tu cliques · `👆/⚫` hors de portée (humain, matériel, contrat)

| # | Tâche | Automatisation | Livrable dans tes repos | Coût | Ce que tu fais |
|---|---|---|---|---|---|
| 1 | Reconstruire le repo `watchtower` (les 57 modules de `COGNITORIUM/watchtower-mods` + l'app au lieu d'un README vide) en appliquant `APPLIQUER.md` | 🤖 100 % | `watchtower` : `src/`, `vite.config.js`, `startGate.js`, `.env.example`, CI | 0 € | relire le diff, pousser |
| 2 | Installeur gratuit lisible (Windows/Linux) posant Ollama + modèles selon la VRAM + stack de recherche/OSINT | 🤖 100 % | `audit/stack/install-stack.{ps1,sh}`, `docker-compose.yml`, `gen-secrets.sh` — **déjà écrits** | 0 € | lire le script, le lancer |
| 3 | Brancher un LLM (local) dans la tour : `src/ai/llmClient.js`, garde-fou « MODE GRATUIT », repli si Ollama absent | 🤖 100 % | patch `watchtower-mods/src/ai/*` + `chatConsole.js`/`hudSummaryResponse.js` | 0 € | `npm run dev`, tester 5 commandes |
| 4 | Forcer la sortie structurée **contre tes 9 `schemas/*.json`** (Outlines/Instructor) au lieu du parsing fragile | 🤖 100 % | patch `reaserch-engine/engine/` + tests | 0 € | `pytest` |
| 5 | Donner des yeux web au moteur de recherche : `SearxngRetriever`, `Crawl4AiRetriever`, `OpenAlexRetriever`, `SemanticScholarRetriever` (tous 0 clé, gratuits) | 🤖 100 % | patch `engine/retrieval.py` + `providers.py` + tests | 0 € | 1 requête de test |
| 6 | Mémoire d'agent en markdown (pattern `ai-memory-vault`, sans base vectorielle) pour `HCSM`/`Cognitorium` | 🤖 100 % | `memory/` + skill/`AGENTS.md` + règles d'écriture | 0 € | relire la structure |
| 7 | RAG léger sur tes docs : `marker`/`docling` (PDF→MD) + `chonkie` + LanceDB (pas de serveur) | 🤖 100 % | `reaserch-engine/corpus/` + ingest CLI | 0 € | déposer les PDF |
| 8 | STT local dans la tour (whisper.cpp/faster-whisper) + TTS local (Piper FR, puis Qwen3-TTS si GPU) ; remplace `freeVoice.js` sans le casser (feature flag) | 🤖 90 % | `src/voice/sttLocal.js`, `ttsLocal.js`, modèle voix + poids | 0 € | **brancher un micro**, autoriser le micro |
| 9 | OCR dans la tour (capture CCTV, plan cadastral, arrêté municipal) + traduction offline | 🤖 100 % | `src/ocr.js`, `src/docs/*`, worker Tesseract | 0 € | 0 |
| 10 | Sortir `proto-cognitorium` du lock-in Google (`@google/genai` → LiteLLM/Ollama compatible OpenAI) | 🤖 100 % | patch client + config | 0 € | 0 |
| 11 | Couche 3DGS : `@manycore/aholo-viewer` + `@manycore/aholo-splat-transform` dans le globe (`src/splats.js`, LOD/streaming/collisions) — leur `SKILL.md`/`AGENTS.md` est écrit pour un agent | 🤖 80 % | patch + exemples + script de conversion `.splat→.spz` | 0 € | **fournir les scans** (drone/tél.) ou lancer Brush sur GPU |
| 12 | Nœud Reticulum local + `src/meshNodes.js` (contacts mesh sur le globe), config `interface_only` sécurisée | 🤖 90 % | patch + `reticulum/` config + tests | 0 € | choisir si tu exposes un nœud public (et le firewall) |
| 13 | Automatisations (veille de flux, triage mail, briefing matin, alertes) dans Activepieces | 🤖 90 % | flows JSON + docs | 0 € | **te connecter les comptes** (mail/Telegram) |
| 14 | Agent runtime chez toi : Hermes Agent (MIT, install 1 ligne, Ollama) ou OpenClaw, avec tes skills « tour » | 🤖 95 % | `agents/` + config + skills FR | 0 € | approuver la config, créer les clés gratuites si tu sors du local |
| 15 | Pipeline « repo public → patché → release avec installeur » via GitHub Actions (NSIS/zip) | 🤖 100 % | `.github/workflows/release.yml` | 0 € (repo public) | créer le tag, télécharger l'artefact |
| 16 | Nettoyage des dépôts (135 Mo dans `proto-cognitorium`, images générées à la racine de `COGNITORIUM`, poids morts) + `.gitignore`/LFS | 🤖 100 % | patch + rapport de taille | 0 € | valider ce qui est supprimé |
| 17 | **Journal 4D de la tour** : collecteurs idempotents (OpenSky, aisstream, CelesTrak, EONET, USGS, GDELT) → NDJSON gzippé → consolidation DuckDB/Parquet + curseur temporel Cesium (`viewer.clock`) | 🤖 100 % | `src/recorder/*.mjs`, `src/timeline/replayer.js`, `data/4d/`, docs | 0 € (1-3 Go/mois) | lancer le collecteur (`systemd`/cron, je fournis l'unité) |
| 18 | **Essaim de capture avant expiration** (la recette des vidéos God's Eye 4D) : au déclenchement d'un événement, N agents en parallèle archivent chaque flux OSINT **tant que le cache public est vivant**, puis publient un dossier daté et signé | 🤖 100 % | flows Activepieces + file d'attente + script `capture-run.mjs` | 0 € | dire « capture maintenant » (ou laisser l'alerte le déclencher) |
| 19 | **Ancrage spatial (VPS) libre** : `hloc` + `colmap` sur tes splats, API de pose WebSocket pour caméras/drones/téléphone dans le modèle 3D ; scan via Scaniverse/Polycam/Brush | 🤖 85 % | `src/anchors/cameraPose.js`, `scripts/photo-to-model.sh`, notebook de prédiction | 0 € (GPU conseillé) | scanner un site au téléphone |
| 20 | **Créer les comptes** qui donnent les clés gratuites (Cesium ion, Groq, OpenRouter, GitHub Models, AISStream, FIRMS) | 👆 | — | 0 € | toi : 2FA, CGU, e-mail |
| 21 | **Cliquer SmartScreen** sur un installeur non signé (GobboNet, Docker Desktop) ; accepter les licences | 👆 | — | 0 € | toi (et c'est bien ainsi) |
| 22 | **Achat de matériel** : GPU (3DGS/Qwen3-TTS/Marker confortables), radios LoRa (Meshtastic/RNode), micro-casque | ⚫ | — | 0 → 800 € | toi |
| 23 | Abonnement « agent de code » (Claude Code, exigé par `fullstack-agent` ; Copilot ; Cursor) | ⚠️ non requis | — | 20 $/mois | **inutile** : l'agent Arena/OpenHands + Ollama font le travail |
| 24 | Fournir des flux **commerciaux** (SAR, AIS mondial premium, imagery très haute résolution, historiques « temps réel inversé ») | ⚫ | — | cher, contrats | hors périmètre gratuit ; l'amont le dit lui-même |
| 25 | Recherche de personne nommée, reconnaissance faciale, pistage d'individus, aspiration de données privées — **y compris par ancrage de personnes dans le VPS ou suivi de trajectoires individuelles** (le défaut des calques « superyachts / jets d'oligarques » de Shadowbroker, qui seront retirés) | 🚫 **refus** | — | — | — (ligne du projet amont, et du bon sens juridique) |

## Ce que tu gagnes en déléguant à l'agent, concrètement

- **Zéro dépendance aux tutoriels** : la vidéo n°4 (Naz Louis) cache son install complète derrière un
  Patreon — l'agent réécrit la même architecture (routeur + Qwen + Piper) sous ta licence, sans paywall.
- **Zéro .exe suspect** : la vidéo n°8 vend un `.exe` non signé (699 Ko) — l'agent te livre des scripts
  **texte lisibles** dans ton repo + une release GitHub Actions.
- **Zéro lock-in payant** : la vidéo n°5 vend un installeur qui **n'existe que** pour Claude Code (abonné)
  et la vidéo n°6 une « Academy » payante — l'agent remplace par Hermes/OpenClaw/Ollama (MIT).
- **Zéro événement perdu** : la leçon du détroit d'Ormuz (n°14) est que l'auteur « enregistrait depuis le
  25 février » — la tour qui interroge à la demande ne peut rien rejouer. L'agent installe le journal continu
  dès le premier jour, ce qui rend les 40 calques rétrospectifs **à posteriori**, gratuitement.
- **Reproductibilité** : un `git clone && ./install-stack.sh` remplacera « j'ai suivi 3 tutos et ça marche
  sur aucune de mes machines ».

## Comment me le demander (formats qui marchent le mieux)

1. « **P0** : reconstruis le repo `watchtower` complet avec mes 57 mods + l'installeur, et pousse sur la branche. »
2. « **P1** : branche Ollama dans `chatConsole.js` et `intelTwin.js`, avec repli sans clé, et des tests. »
3. « **P4** : écris `SearxngRetriever` + `Crawl4AiRetriever` dans `reaserch-engine`, validés par `pytest`. »
4. « **P6** : ajoute la couche 3DGS aholo-viewer dans la tour + un CLI de conversion SPZ/LOD/collisions. »
5. « **P7** : nœud Reticulum local + calque mesh sur le globe, config non-exposée par défaut. »
6. « **P9** : pose le `recorder-4d` (journal continu + curseur temps) et le calque de trous AIS, puis branche
   Skyfield/CelesTrak pour les passes satellites. » — la tâche à faire **avant** tout nouveau calque.

Tu peux aussi me demander, pour n'importe quel outil du catalogue, « **fork-adapte-installe** » :
je clone le repo public, j'applique tes patches, je pousse chez toi, et je génère l'installeur + la release.
