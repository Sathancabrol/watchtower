# 🔭 AUDIT OUTILS — OSINT / IA locale / open source
### Ce que les liens que tu as envoyés apportent à **ta tour** (Watchtower + Cognitorium)
Audit produit le 2026-09-05 · sources vérifiées en ligne · liens dans chaque ligne

> **Périmètre** : les 11 liens YouTube + 1 repo GitHub que tu as fournis, croisés avec **tes 8 repos publics** (`watchtower`, `COGNITORIUM`, `proto-cognitorium`, `reaserch-engine`, `HCSM`, `ETAT-DE-LART-PSYCHOLOGIE`, `Language-decoder`, `animation-chronos`).
> **Verdict en une ligne** : ~85 % de ce que montrent ces vidéos est **faisable 100 % gratuit chez toi**, sans abonnement ; et ~70 % du boulot d'installation peut être fait par un **agent IA** (moi) directement dans tes repos, pour que tu n'aies qu'un script à lancer.

---

## 0. Ce que tu as déjà (l'inventaire, avant de comparer)

| Repo | Ce que c'est réellement | État | Ce qui manque |
|---|---|---|---|
| `watchtower` (la tour) | Fork de [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) (CesiumJS) + 57 modules maison dans `COGNITORIUM/watchtower-mods/src` : `startGate.js` (MODE GRATUIT / PAYANT), `freeVoice.js` (Web Speech), `chatConsole.js` (console de commandes FR), `intelTwin.js` (jumeau numérique, heuristiques geo.gouv.fr/OSM), `posteCommandement.js`, `ficheLieu.js`, `osmBuildings3D.js`, `mapStackController.js` (tuiles CARTO), `locations.js` (Photon/Nominatim) | ⚠️ **Le repo `watchtower` en ligne est vide** (juste un README). Les 57 modules vivent dans `COGNITORIUM/watchtower-mods` + la procédure `APPLIQUER.md` | Un repo `watchtower` qui contient vraiment l'app + l'install |
| `COGNITORIUM` | Visualisation cognitive + Learning Engine (PoC « comprendre l'argent ») + archive des mods tour | actif | Idem : les briques sont là, pas packagées |
| `proto-cognitorium` | App Vite + React 19 + Three.js + Express, dépendance `@google/genai` (donc **cloud Google**) | 95 Mo, proto | 135 Mo de repo dont du `raw/` non nettoyé ; sortie du 100 % local |
| `reaserch-engine` | **Le plus aligné** avec ces vidéos : moteur de recherche autonome (question → plan → preuve → claim → contradiction → synthèse → sufficiency), graphe d'évidence, checkpoints JSON, `CrossrefRetriever`, doc `ARCHITECTURE_HERMES_INTEGRATION.md` | v0.1 + ~20 tests | **Le LLM branché derrière**, l'ingestion web, le store vectoriel, la qualité de source en base réelle |
| `HCSM` | Modèle scientifique d'état cognitif (specs, ontologie, validator) | PROPOSED | Implémentation/instrumentation (les données que les outils ci-dessous peuvent produire) |
| `ETAT-DE-LART-PSYCHOLOGIE` | État de l'art psycho/cognition, données + scripts HTML | actif | Chaîne doc → markdown → RAG (exactement le job de `marker` + `chonkie`) |
| `Language-decoder` | README vide (« décodeur de langage multimodale ») | 🫥 rien dedans | Tout. C'est là que ASR + TTS + OCR gratuits s'installent |
| `animation-chronos` | Animation TS | secondaire | — |

**Conclusion d'inventaire** : tu as construit **le client** (tour 3D, modules, UI, heuristiques) et **le contrôle-plan de recherche** (moteur, schémas, graphes). Ce qui te manque, c'est **le serveur d'IA local + les collecteurs** (LLM, ASR, TTS, OCR, crawl, OSINT, RAG/mémoire). C'est très exactement ce que tes 11 liens apportent.

---

## 1. Audit des 11 liens, outil par outil

Légende coût : 🟢 100 % gratuit local · 🟡 gratuit **avec compte/clé** (quota) · 🟠 semi-payant (gratuit puis usage) · 🔴 payant obligatoire · ⚫ matériel requis

### 1.1 Les vidéos « boîtes à outils IA » (le plus rentable pour toi)

| # | Vidéo | Chaîne / date | Outils cités (lien officiel) | Verdict pour ta tour |
|---|---|---|---|---|
| 1 | [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) | The Stack · 22 juin 2026 · 16 min | [Chonkie](https://github.com/chonkie-ai/chonkie) chunking 🟢 · [Marker](https://github.com/datalab-to/marker) PDF→MD 🟢 · [Langfuse](https://github.com/langfuse/langfuse) observabilité 🟢 · [Qdrant](https://github.com/qdrant/qdrant) vecteurs 🟢 · [Ollama](https://github.com/ollama/ollama) 🟢 · [DSPy](https://github.com/stanfordnlp/dspy) optimisation de prompts 🟢 · [Crawl4AI](https://github.com/unclecode/crawl4ai) crawl→markdown 🟢 · [Outlines](https://github.com/dottxt-ai/outlines) JSON garanti 🟢 · [LiteLLM](https://github.com/BerriAI/litellm) routage 100+ API 🟢 · [Instructor](https://github.com/567-labs/instructor) sortie typée Pydantic 🟢 | 🎯 **Cœur de la V2 de ta tour.** 10/10 gratuits et auto-installables. Marker est passé **Apache-2.0** (39,5k★) → usage commercial OK. Crawl4AI **Apache-2.0**. |
| 2 | [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) | The Stack · 19 août 2026 · 10 min | [Tesseract](https://github.com/tesseract-ocr/tesseract) OCR 🟢 · [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) traduction offline 🟢 · [Scriberr](https://github.com/rishikanthc/Scriberr) transcription Docker 🟢 (MIT, 3k★) · [SearXNG](https://github.com/searxng/searxng) méta-recherche privée 🟢 · [Perplexica → **Vane**](https://github.com/ItzCrazyKns/Vane) moteur de réponse à la Perplexity 🟢 (MIT, 36,6k★, renommé mars 2026, 1 seule image Docker avec SearXNG inclus) · [Khoj](https://github.com/khoj-ai/khoj) second brain 🟢 (AGPL ; **Khoj Cloud déprécié → self-host forcé**) · [Open WebUI](https://github.com/open-webui/open-webui) 🟢 (BSD-3 + clause de marque au-delà de 50 users) · Ollama 🟢 · [Activepieces](https://github.com/activepieces/activepieces) automatisation n8n-like 🟢 · [OpenHands](https://github.com/All-Hands-AI/OpenHands) agent de code 🟢 | 🎯 **Le « OSINT + IA » gratuit clé-en-main.** Attention : dans cette vidéo, n8n est en **fair-code** (203k★, NOASSERTION) → pour du 100 % libre, prends **Activepieces (MIT)**. |
| 3 | [9 BORING AI Automations That Can Make $1,200 A Day!](https://www.youtube.com/watch?v=XYMcBrFSJ4c) | Michele Torti · 30 août 2026 · 34 min | n8n / Make / **Retell AI** (voix téléprospection) / Claude ; 9 systèmes : triage boîte mail + brouillons + alerte Telegram, relances factures, etc. | 🟰 **Zéro bénéfice pour la tour** (sauf si tu veux vendre). C'est un plan business « agence IA », très orienté outils payants (Make, Retell, Twilio). Les **patterns** (inbox triage, relances, escalation) sont en revanche réutilisables 100 % gratuit avec Activepieces/n8n + SearXNG + modèle local. **À ne pas prendre comme stack.** |

### 1.2 Les assistants vocaux « Jarvis » (voice layer de ta tour)

| # | Vidéo | Chaîne / date | Ce qui est vraiment proposé | Verdict |
|---|---|---|---|---|
| 4 | [I Built a Local AI Assistant: 100% Free & No Subscriptions!](https://www.youtube.com/watch?v=7ffF3fumhcQ) | Naz Louis · 27 janv. 2026 · 11 min43 | Repo **[nazirlouis/ada_local](https://github.com/nazirlouis/ada_local)** (216★, **pas de licence** = tous droits réservés) + poids [nlouis/ada_model](https://huggingface.co/nlouis/ada_model). **Architecture : FunctionGemma 270M comme routeur** (a appris à décider « think / no-think » : 52 % → **95 % de précision après 200 exemples de fine-tuning**, routage 1,7 s → **1,0 s**) → Qwen3 (thinking / non-thinking) → **Piper TTS sur CPU**. Test à 8 Go VRAM GPU (OS ≈ 2,1 Go + modèles ≈ 2,3 Go) | 🏆 **LE meilleur modèle d'architecture pour ta tour** : c'est exactement le « moindre coût » que tu demandes (petit routeur + gros modèle à la demande + TTS CPU). À **réécrire** (licence manquante) plutôt qu'à cloner tel quel. Tutoriel complet chez lui = Patreon (payant) → **on n'en a pas besoin, l'agent le refait pour toi**. |
| 5 | [\[Free on Github\] My Jarvis AI Assistant](https://www.youtube.com/watch?v=FiOTrxq9ckM) | jaredrhod · 20 août 2026 · 203 k vues | **[fullstack-agent](https://github.com/jaredrhod/fullstack-agent)** = installeur qui pose 4 systèmes d'un coup (717★, **AGPL-3.0**, **script .bat**, ⚠️ **ne fonctionne qu'avec Claude Code = abonnement payant**) · [ai-memory-vault](https://github.com/jaredrhod/ai-memory-vault) = mémoire persistente **Obsidian/markdown, pas de base vectorielle** (624★, CC-BY-SA-4.0) · [ai-visualizer](https://github.com/jaredrhod/ai-visualizer) · [backtalk](https://github.com/jaredrhod/backtalk) (Claude SDK) · [barehands](https://github.com/jaredrhod/barehands) (contrôle écran à main nue) | 🟡 **Concepts oui, outil non.** L'installeur AGPL + Claude-only ne tourne pas sans paywall. Mais **`ai-memory-vault` (markdown comme mémoire d'agent, sans vector DB) est exactement ce qu'il faut à `HCSM` + `COGNITORIUM`**, gratuit, et **copiable par un agent en 30 min**. |
| 6 | [Jarvis Mark 51 Installation — Step by Step Guide](https://www.youtube.com/watch?v=u6c-6RF6J_g) | FatihMakes · 20 août 2026 · 9 min | Repo **[FatihMakes/Mark-LII](https://github.com/FatihMakes/Mark-LII)** (1 035★) — ⚠️ **aucun fichier LICENSE → légalement « all rights reserved »**, donc **pas « open source »** malgré le titre. Fonctionne avec **clé API Google Gemini (gratuite)** via Gemini Live API ; système de plugins (un fichier = une compétence) ; « Mark 54 » et Academy **payants** (Whop/lien affilié) | 🔻 **Piège à éviter** : « gratuit sur GitHub » ≠ open source (licence absente) + démo → communauté payante. Utile **uniquement** pour son **pattern de plugins** (`plugins/mon-fichier.js`), et pour sa clé Gemini gratuite (voir §3). |

### 1.3 Voix / TTS / clonage

| # | Vidéo | Chaîne / date | Outils | Verdict |
|---|---|---|---|---|
| 7 | [Elevenlabs just got wrecked. This free AI text to speech is WILD!](https://www.youtube.com/watch?v=eC8mZceIy5k) | AI Search · 24 janv. 2026 · 26 min · 484 k vues | **Qwen3-TTS** (sorti 22 janv. 2026, **[QwenLM/Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS)**, **Apache-2.0**, 0,6 B / 1,7 B, ~**4 Go VRAM** pour le petit, clonage de voix sur **3 s** d'échantillon, 10 langues **dont le français**, contrôle d'émotion par prompt, latence ~97 ms, API compatible OpenAI via [groxaxo/Qwen3-TTS-Openai-Fastapi](https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi) (Apache-2.0)) · install par workflow ComfyUI : [flybirdxx/ComfyUI-Qwen-TTS](https://github.com/flybirdxx/ComfyUI-Qwen-TTS) (~6 Go de poids) | 🏆 **Ta voix de tour, à 0 €** : remplace `freeVoice.js` (voix robotique du navigateur) par une voix clonée qui parle FR, sans API, sans facture. Nécessite GPU NVIDIA (0,6 B ≈ 4-8 Go VRAM). **Sans GPU → Piper (MIT, CPU)**. Sponsor de la vidéo = Abacus AI 🟠 : ignorer. |
| 8 | [The 1-Click Chatbot Alternative You Actually Own: GobboNet](https://www.youtube.com/watch?v=wxMB1OvJX2I&t=141s) (timestamp 2:21) | Elodine · 15 août 2026 · 17 min · 77 k vues | **[GobboNet](https://goblincorps.com/gobbonet)** v1.5.3→1.7.0 : installeur **.exe 699 Ko** Windows 10/11, **0 compte, 0 clé, 0 télémétrie**, va chercher **llama.cpp** (~300 Mo) + le **modèle sur Hugging Face** selon la VRAM détectée, puis **fonctionne entièrement débranché** ; chat depuis le téléphone en LAN ; cartes de personnages ; 7 familles de modèles (Llama, Gemma, DeepSeek, Mistral…). ⚠️ **Licence « Other » (pas d'open source au sens OSI)** dans [ElodineOfficial/GobboNet](https://github.com/ElodineOfficial/GobboNet) ; **exe non signé** (SmartScreen) ; Windows only, Linux « probably buggy » ; l'auteur le dit lui-même : marche bien mais reste un **pont vers SillyTavern**, pas un moteur d'agents complexes | 🥇 **La meilleure réponse littérale à ta demande** « un fichier qui installe tout ». Usage : chat local + téléphone. Mais pour **ton** usage (agents, tour, recherche) : **Open WebUI + Ollama, ou Hermes Agent**, qui eux sont MIT et extensibles. GobboNet = **option confort**, pas le socle. |

### 1.4 Réseaux hors-internet (OSINT/résilience)

| # | Vidéo | Chaîne / date | Outils | Verdict |
|---|---|---|---|---|
| 9 | [How to Become Your Own ISP](https://www.youtube.com/watch?v=V3kZwsysuqQ) | Data Slayer · 9 août 2026 · 22 min · 831 k vues | **Reticulum** (stack réseau chiffrée, destinations cryptographiques, pas d'IP, multi-médias LoRa/Wi-Fi/HF/TCP) · [CrossTalk](https://github.com/buildwithparallel/crosstalk) client multi-plateforme · [Columba](https://columba.network/) Android · [RatSpeak](https://ratspeak.org/) · carte live [rmap.world](https://rmap.world/) · nœud public TCP `rns1.buildwithparallel.com:4242` · pont sur VPS GCP (gratuit à 0 $ en free tier) | ⚫🟢 **Faisable à 0 € en logiciel** (`pip install RNS` + nœud local sur ta tour = ton **canal de messagerie/résilience intégré à l'app**), ~30-90 € **seulement si** tu veux du LoRa réel. ⚠️ Exposer un nœud TCP public = surface d'attaque à assumer (firewall + interface `interface_only`). |
| 10 | [Meshtastic Crash Course Part 1 — What is Meshtastic?](https://www.youtube.com/watch?v=n_Cie7uGu4c) | MAD Gear · 27 sept. 2025 · 16 min43 | **Meshtastic** (fw + apps gratuits, GPL) ; 1 repeur + 3 appareils ≈ 100 acres (cas chasse) ; « Austin Mesh » = mesh municipal autonome solaire ; PACE plan (Primary/Alternate/Contingency/Emergency) | ⚫ **Non automatisable à 100 % par un agent** : il faut du **matériel radio** (≈ 25-45 €/radio,Heltec T114 /RAK4631). Gratuit côté logiciel (client + MQTT + **bridge Meshtastic→Reticulum**). Lien avec ta tour : afficher les **contacts mesh sur le globe** (couche `meshNodes.js`) — ça, je peux l'écrire. |

### 1.5 3D / rendu (l'outil qui « manque » à ta tour)

| # | Lien | Ce que c'est | Verdict |
|---|---|---|---|
| 11a | [A Billion 3D Splats Rendering in Your Browser (And It's Open Source)](https://www.youtube.com/watch?v=2t-PLeenqqA) | Stefan 3D AI · 6 juin 2026 · 10 min · 107 k vues. 3D Gaussian Splatting : LOD + streaming « game-dev », format **SPZ**, collisions générées, rendu dans un onglet, scène d'1 milliard de splats ; **aussi** capture par téléphone/drone, licence des scans = CC-4.0, écosystème de CLI de transformation | 🟢 |
| 11b | [manycoretech/aholo-viewer](https://github.com/manycoretech/aholo-viewer) | **Renderer 3DGS + mesh haute performance** (npm [`@manycore/aholo-viewer`](https://www.npmjs.com/package/@manycore/aholo-viewer) + [`@manycore/aholo-splat-transform`](https://www.npmjs.com/package/@manycore/aholo-splat-transform)), schéma *Chunked Streaming LOD*, **MIT**, 1 k★ / 108 forks, Node ≥ 22.22.1 + pnpm, sous-module `external/egs-core`. Livré avec **`AGENTS.md` + `docs/ai/skills/use-aholo-viewer/SKILL.md`** (guide d'intégration écrit **pour** un agent IA) et un playground qui sérialise le code dans l'URL (`lz-string`) → site de démo [aholojs.dev](https://aholojs.dev/), plateforme constructeur [aholo3d.com](https://www.aholo3d.com/) | 🏆 **Le saut visuel de ta tour** : CesiumJS (ta base) + 3DGS (scans réels de sites : friches, patrimoine, chantier, digues) → une couche `splats.js` dans `watchtower-mods`. Et le repo est **conçu pour être piloté par un agent** (SKILL.md fourni) : c'est le cas d'usage n°1 de ton « l'IA copie un repo public, le modifie pour moi ». |

---

## 2. Comparaison : ce qu'ils ont vs ce que **tu** as

| Capacité montrée dans les liens | Dans tes repos aujourd'hui | Écart réel | Outil qui le ferme |
|---|---|---|---|
| Globe 3D + couches live (avions, CCTV, séismes…) | ✅ **déjà mieux** : tour CesiumJS + 57 modules + données sans clé (Esri, CARTO, Photon, EONET, OpenSky…) | rien à reprendre ; c'est **ta force** — le `gods-eye-view` amont est même passé en licence ambiguë (NOASSERTION) alors que tes mods sont à toi | — |
| Chat/voix **avec IA** (pas des heuristiques) | ⚠️ partiel : `chatConsole.js` = commandes + Open-Meteo/BAN, `freeVoice.js` = voix navigateur, `intelTwin.js` = heuristiques (« pas une IA ») | **aucun LLM branché** | Ollama (local) + Open WebUI ; routeur style `ada_local` ; sortie → `watchtower-mods/src/ai/*` |
| ASR (parler à la tour) | ❌ absent (Web Speech uniquement, dépend du navigateur/réseau) | latence + pas de transcription hors-ligne de tes mémos/radios | **whisper.cpp** (MIT) / faster-whisper |
| TTS expressive + clonage de voix | ❌ absent (voix robot) | image de marque, écoutabilité | **Piper** (CPU, FR) → **Qwen3-TTS** (GPU, FR, 3 s de clonage) |
| OCR (lire capture CCTV / PDF / plan cadastral scanné) | ❌ absent | la tour voit des images mais ne les **lit** pas | **Tesseract** (Apache-2.0) / PaddleOCR ; `marker` pour PDF |
| Traduction hors-ligne | ❌ absent | docs étrangers, flux non-FR | **LibreTranslate** (MODERN MT, offline) |
| Recherche web privée + réponse citée | ❌ absent (`reaserch-engine` a `CrossrefRetriever` et un `LocalFirstRetriever`, **mais aucun retriever web**) | ton moteur n'a pas d'yeux sur le web | **SearXNG** (méta-recherche) + **Crawl4AI** (page→markdown) + **Vane** (UI de réponse) → à câbler dans `engine/retrieval.py` comme `SearxngRetriever` |
| Chunking / RAG / base vectorielle / mémoire | ❌ absent | ta doc (`ETAT-DE-LART-PSYCHOLOGIE`, `HCSM`) dort en fichiers | **Chonkie** + **Qdrant** (ou LanceDB si peu de RAM) + **ai-memory-vault** (markdown = mémoire d'agent, sans vector DB) |
| Sortie structurée fiable (JSON pour les schémas de `reaserch-engine`) | ⚠️ tu as des `schemas/*.schema.json` mais rien qui **garantit** le JSON | LLM qui sort du texte libre → parsing fragile | **Outlines** (contrainte au niveau token) / **Instructor** (Pydantic + retries) → validation **directement contre tes JSON Schema** |
| Observabilité des appels (déboguer un run) | ❌ absent | runs non auditable en UI | **Langfuse** self-host (traces/evals) |
| Optimisation de prompts automatique | ❌ absent | prompts écrits à la main | **DSPy** (optimise au lieu de bricoler) |
| Routage multi-LLM (local ↔ gratuit ↔ payant) | ❌ absent, mais `proto-cognitorium` est collé à `@google/genai` | lock-in Google | **LiteLLM** (proxy local unique, gratuit) → bascule de fournisseur sans toucher au code |
| Automatisation (tâches planifiées, alertes, triage) | ❌ absent | tout est manuel dans la tour | **Activepieces** (MIT) ou n8n (fair-code) + Telegram/mail/flux → scénarios « boring » de la vidéo n°3 |
| Agent autonome (exécute, installe, apprend) | ⚠️ ton `reaserch-engine` **veut** s'y brancher (`ARCHITECTURE_HERMES_INTEGRATION.md`) mais rien d'installé | runtime d'agent | **Hermes Agent** (MIT, 241 k★, installeur 1 ligne, 118 skills, Ollama-compatible) · **OpenClaw** (388 k★, gateway 18789, ~2 Go RAM) · **OpenHands** (MIT, code) |
| Rendu de scan réel (3DGS) dans le globe | ❌ absent (`osmBuildings3D.js` = extrusion OSM, pas du scan) | la tour est « plate » sur le terrain | **aholo-viewer** + **Brush** (Apache-2.0, entraînement 3DGS local gratuit) |
| Messagerie de secours hors-réseau | ❌ absent | dépendance totale à internet | **Reticulum** ( logiciel gratuit) + **Meshtastic** (⚫ radios) |

**Bilan chiffré** : sur 15 capacités, tu en as **1 en avance** (globe + couches sans clé — c'est ton avantage compétitif), **12 absentes ou partielles** et toutes comblables par des outils **gratuits et open source (MIT/Apache/AGPL)**.

---

## 3. « Qu'est-ce qui est faisable en gratuit sur ma tour ? »

Hypothèse : tour = PC de maison, **16-32 Go RAM, SSD ≥ 512 Go, sans GPU dédié ou GPU ≤ 8 Go**. Les 3 paliers ci-dessous sont les seuls vrais décideurs du reste.

| Palier matos | Ce qui tourne | Ce qu'on lâche |
|---|---|---|
| **A. CPU only / ≤ 8 Go RAM** | Tour (déjà), SearXNG, Tesseract, LibreTranslate (petit), Piper (CPU), whisper.cpp `base/small`, Ollama 1-3 B (`qwen3:0.6b`/`gemma3:1b`), Crawl4AI, Activepieces, Reticulum (logiciel) | gros agents, 3DGS, clonage vocal expressif |
| **B. GPU 6-8 Go VRAM** (RTX 3060/4060, ou tour avec eGPU) | + LLM 7-8B quantifié (`qwen3:4b`, `llama3.1:8b`), **Qwen3-TTS 0,6B** (FR, clonage), faster-whisper `medium`, Vane + Ollama (4 GB RAM), Marker, embeddings + Qdrant léger, Hermes/OpenClaw | 3DGS lourd, modèles 30 B+ |
| **C. GPU 12-24 Go VRAM** (3090/4070Ti Super et +) | + Qwen3-TTS 1,7B, LLM 14-32B, **entraînement 3DGS (Brush/Postshot)**, OpenHands en autonomie, Qdrant sur gros corpus | rien de bloquant |

### Verdict par outil (ton budget : 0 €/mois)

| Outil | Coût réel sur ta tour | Compte obligatoire ? | Faisable ? |
|---|---|---|---|
| Ollama + Qwen3/Gemma3/Llama3.3 | 🟢 0 € (électricité) | non | ✅ palier A-B |
| SearXNG | 🟢 0 € | non | ✅ |
| Vane (ex-Perplexica) | 🟢 0 € | non (si LLM local) | ✅ 1 conteneur |
| Crawl4AI | 🟢 0 € | non | ✅ |
| Tesseract / PaddleOCR | 🟢 0 € | non | ✅ |
| LibreTranslate | 🟢 0 € | non | ✅ (qualité < DeepL hors FR/EN/ES) |
| whisper.cpp / faster-whisper | 🟢 0 € | non | ✅ FR très correct |
| Piper (TTS FR) | 🟢 0 € | non | ✅ palier A |
| Qwen3-TTS | 🟢 0 € (GPU requis) | non | ✅ palier B/C · 🥲 **sinon API Alibaba ~0,013 $/1k car.** |
| Marker (PDF→MD) | 🟢 0 € | non | ✅ palier B recommandé |
| Chonkie / Outlines / Instructor / DSPy / LiteLLM / Langfuse / Qdrant / Activepieces / Open WebUI / Khoj / OpenHands | 🟢 0 € | non | ✅ |
| Hermes Agent / OpenClaw | 🟢 0 € (le runtime) | non | ✅ mais **il faut un LLM derrière** (local = 0 € ; ou clés gratuites ci-dessous) |
| Cesium ion (3D photoréaliste de la tour) | 🟡 0 € | oui (compte **gratuit**) | ✅ [cesium.com/ion](https://ion.cesium.com/) |
| Google Gemini API (le tier gratuit que le vidéo n°6 t'oblige à créer) | 🟡 0 € | oui, sans CB (Flash-Lite ~1,5 k req/j ; attention : le free tier a été **raboté** en 2026 et Google peut entraîner sur tes prompts hors UE) | ⚠️ dépannage uniquement → [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq / OpenRouter `:free` / GitHub Models / Cerebras | 🟡 0 € | oui, sans CB | ✅ **le meilleur filet gratuit** quand ton LLM local est trop court (Groq ≈ 30-14 400 req/j selon modèle & doc ; OpenRouter ≈ 50-1000 req/j en `:free`) |
| AISStream (navires) / NASA FIRMS / TomTom / OpenSky OAuth | 🟡 0 € | clé gratuite | ✅ tu les as déjà prévus côté amont |
| Google Maps (3D + Places) | 🟠 gratuit ≤ 1 000 sessions/mois puis facturé (CB obligatoire) | oui | 🚫 **inutile** : tes mods remplacent par Esri + CARTO + Photon → garde le MODE GRATUIT |
| n8n | ⚠️ **fair-code** (non OSI) + features « enterprise » verrouillées | non | 🥲 préfère Activepieces (MIT) |
| Make / Zapier / Retell AI / Twilio / ElevenLabs / OpenAI Realtime / Claude SDK / Maltego Pro / SpiderFoot HX / Social Links / Lampyre / Intelligence X / VPS cloud | 🔴 5-100 $/mois | oui | 🚫 **remplaçables** (tableau §6) |
| GobboNet / Mark-LII / ada_local | 🟢 gratuits **mais** ⚠️ licence absente ou « Other » | non | 🟡 à utiliser, pas à redistribuer ni fork-er commercialement |
| Reticulum (logiciel) / Meshtastic (fw+apps) | 🟢 0 € | non | ✅ |
| Radios LoRa (RNode / Heltec / T-Echo) | ⚫ 25-90 € **one-shot** | non | ⚠️ **seul vrai coût matériel de tout cet audit** |

---

## 4. Ce que l'agent (moi) peut faire **à ta place**

### 🟢 4.1 — L'agent fait tout, tu ne touches à rien
*Cloner un repo public → le patcher pour toi → pousser sur ton GitHub → te livrer un installeur reproducible.*

| Tâche | Comment | Livrable que je pousse | Délai agent |
|---|---|---|---|
| Reconstruire `watchtower` proprement (les 57 mods + app, au lieu d'un README vide) | `APPLIQUER.md` existe déjà chez toi : je l'exécute, corrige les chemins, ajoute `.env.example`, lockfile, CI | repo complet | 1 session |
| Installer le **cerveau local** | `install-stack.ps1` / `install-stack.sh` : Node, Git, Ollama + modèles selon VRAM détectée, venv Python + Crawl4AI/whisper.cpp/Piper/Tesseract, `docker compose` (SearXNG/Vane/Langfuse/Activepieces/SpiderFoot) | scripts dans `scripts/` (déjà écrits, §7) | déjà fait |
| Brancher un LLM dans la tour | module `src/ai/llmClient.js` (fetch → `http://127.0.0.1:11434`), `src/ai/agents.js`, repli automatique cloud-gratuit → local, garde-fou « sans clé » | patch dans `watchtower-mods` | 1-2 sessions |
| Retirer le lock-in Google de `proto-cognitorium` | remplacer `@google/genai` par LiteLLM-compatible `/v1/chat/completions` | patch | 1 session |
| Donner des yeux web à `reaserch-engine` | `SearxngRetriever` + `Crawl4AiRetriever` + `OpenAlexRetriever`/`SemanticScholarRetriever` (gratuits) dans `engine/retrieval.py` | patch + tests | 1-2 sessions |
| Garantir le JSON de tes schémas | `Outlines`/`Instructor` branchés sur les 9 `schemas/*.schema.json` | patch | 1 session |
| OCR dans la tour (lire une capture CCTV, un PDF) | module `src/ocr.js` (Tesseract.js / worker local) + `src/docs/markerClient.js` | patch | 1-2 sessions |
| Voix : STT + TTS | `src/voice/sttLocal.js` (whisper) + `src/voice/ttsLocal.js` (Piper/Qwen3-TTS si GPU) → remplace `freeVoice.js` sans le casser (flag) | patch | 1-2 sessions |
| Mémoire de tour (HCSM/Cognitorium) | dossier `memory/` en markdown (pattern `ai-memory-vault`), index SearXNG-local + RAG Chonkie/Qdrant | patch | 2 sessions |
| Couche 3DGS (aholo-viewer) | `src/splats.js` (chunked LOD) + pipeline `@manycore/aholo-splat-transform` (LOD + collision), guidé par leur `SKILL.md` | patch | 2-4 sessions |
| Boucle « repo public → modifié pour moi → installeur » | **GitHub Actions** qui build l'app + génère un `watchtower-setup.exe`-ish (NSIS via action open source) à chaque tag ; tu télécharges depuis **ton** repo, pas un lien YouTube | `.github/workflows/release.yml` | 1 session |
| Un agent **chez toi** qui fait le ménage, recherche, prépare tes dossiers | Hermes Agent (`install.sh` 1 ligne, MIT, Ollama) ou OpenClaw | patch de config | 1 session |

### 🟡 4.2 — L'agent prépare, **toi tu cliques 2 fois** (impossible autrement)
- Créer les **comptes** qui donnent les clés gratuites : Cesium ion, (option) Groq/OpenRouter/Gemini/GitHub Models, AISStream, FIRMS. Je te laisse des liens directs + un blocage de quota dans le script.
- **SmartScreen Windows** : « Exécuter quand même » sur l'installeur (moi ou GobboNet), car ni l'un ni l'autre n'achète de certificat (l'auteur de GobboNet le dit textuellement dans sa vidéo).
- **Accepter les CGU/CGV** (OpenSky, TomTom, Google, Meshtastic bande de fréquence) — je ne peux pas légalement le faire pour toi, et c'est une bonne chose.
- Entrer **tes clés** dans l'app (`keySetup.js` est fait pour ça : coller → ✓ vert → localStorage).
- **Redémarrer** après installation de Node/Git/Ollama, et autoriser Docker (si tu prends la branche compose).

### 🔴 4.3 — L'agent **ne peut pas** (logiciel tiers / matériel obligatoire)
| Besoin | Pourquoi l'agent bloque | Solution gratuite la plus simple + lien |
|---|---|---|
| Radio longue portée (Meshtastic/RNode) | physique : il faut du silicium | [meshtastic.org/docs/getting-started/hardware-suggestions](https://meshtastic.org/docs/getting-started/hardware-suggestions/) · Heltec V3 ≈ 25 €, RAK4631 ≈ 35 € · [RNode](https://github.com/liamcottrell/hamlib-rnode) |
| Entrée d'une **carte bancaire** pour un tier gratuit (Google Maps, Together, Fireworks) | je ne manipule pas tes paiements | **à éviter** : remplacements §6 |
| Abonnement « agent de code » (Claude Code demandé par `fullstack-agent`, Copilot, Cursor) | payant, non open source | **OpenHands** (MIT) + **Hermes Agent** (MIT) + [Ollama](https://ollama.com/download) — ou me demander à moi : je fais le patch ici |
| Un **GPU** si tu n'en as pas (3DGS, Qwen3-TTS 1,7B, Marker à l'aise) | matériel | Google **Colab T4 gratuit** (les vidéos le montrent pour Qwen3-TTS) ; ou rester palier A (Piper + CPU) |
| Certificat de signature (le SmartScreen) | 200-600 $/an | ne pas acheter : garder **scripts lisibles** (c'est mieux que l'exe) — c'est exactement pourquoi mes `install-stack.*` sont des fichiers texte que tu peux lire avant de lancer |
| « Application mobile Android/iOS signée » | stores payants (25 $/ 99 $) | PWA installable depuis la tour (0 $) + `?setup=1`/LAN |

### 🚨 4.4 — La ligne que je ne franchis pas (et qui protège ton projet)
`gods-eye-view` amont est explicite : **pas de recherche de personne nommée, pas de reconnaissance faciale, pas de tracking d'individus** — l'upstream refuse ces PR. Je garde la même ligne : les outils OSINT de la liste ci-dessus seront branchés **sur des infrastructures, flux, documents et données ouvertes**, pas sur des individus. Idem : pas d'installation de GobboNet/Mark-LII/`ada_local` sur **ton** repo en tant que dépendance (licences « Other »/absentes) → **patterns copiés, code réécrit**.

---

## 5. Le scénario que tu décris (« l'IA copie un repo, le modifie, je télécharge un installeur »)

C'est **faisable à 0 €/mois de façon 100 % open source**. Voici le dessin exact, et ce qui le rend légal et reproductible :

```
 1. Agent (moi) : git clone le repo public amont (gods-eye-view / aholo-viewer / Vane …)
 2. Agent : applique TES patches (modules FR, sans-clé, keyless, ton UI) → branche arena/…
 3. Agent : push sur github.com/Sathancabrol/<repo>   ← ton contrôle, ta licence, ta signature de commit
 4. GitHub Actions (gratuit pour repo public) : build + tests + NSIS/inno → artefact
       watchtower-setup-windows.zip  ← c'est TON « fichier installeur », pas un .exe louche de YouTube
 5. Toi : double-clic, ou PowerShell :  iwr https://github.com/Sathancabrol/watchtower/releases/.../install-stack.ps1 | iex
       (mieux : télécharger le fichier, LIRE les 60 premières lignes, puis Set-ExecutionPolicy -Scope Process Bypass)
 6. L'installeur ne fait que : vérifier/poser les prérequis open source, choisir les modèles selon TA VRAM,
    écrire .env local (permissions 600), docker compose up, lancer l'app sur http://localhost:4173
```

Coûts de ce pipeline : **0 $** (Actions gratuit sur repo public, outils MIT/Apache, Ollama local). Les 3 seules choses payantes possibles du scénario sont à éviter : certificat de signature, cloud LLM, abonnement agent de code.

**Déjà écrit pour toi dans ce repo** (§7) : les 2 installeurs + le compose + le catalogue.

---

## 6. Tableau « payant → gratuit » (remplacements nets)

| Payant / SaaS montré | Alternatif open source sur ta tour | Gain | Ce que tu perds |
|---|---|---|---|
| ElevenLabs (5-99 $/mois) | **Qwen3-TTS** (GPU, Apache-2.0) → **Piper** (CPU, MIT) | 0 € | moins de 50 langues, un peu de « polish » |
| OpenAI Realtime voice (centimes/min) | **whisper.cpp** + **Piper** + wake word maison | 0 € | latence un peu plus haute ; qualité voix |
| ChatGPT/Claude abonnement | **Ollama** (qwen3, gemma3, llama3.3) + **Open WebUI** | 0 € | moins de raisonnement long ; sur les gros dossiers → clés 🟡 §3 |
| Perplexity Pro 20 $/mois | **Vane** (1 conteneur, SearXNG inclus) + Ollama | 0 € | un peu de réglage |
| Zapier / Make / n8n Cloud | **Activepieces** (MIT) | 0 € | un peu de upkeep « quelques heures/mois » (la vidéo l'avoue) |
| Google Maps 3D/Places | déjà fait : **Esri World Imagery + CARTO + Photon/Nominatim** | 0 €, 0 CB | moins joli que les tuiles photoréalistes Google |
| Maltego Pro / Social Links / Lampyre (100-1000 $+) | **SpiderFoot** (21,7 k★, 200+ modules) + **Gephi** (graphe) + **OpenCTI** (si ≥ 16 Go RAM) | 0 € | pas de « transforms » commerciaux, UI moins léchée |
| Shodan API payante | Shodan free tier + **crt.sh**, **Amass**, **theHarvester**, **Holehe**, **Maigret** (MIT 37 k★), **OSINT Framework**, **ExifTool** | 0 € | quotas, historique limité → **Intelligence X** (freemium) si besoin d'archives |
| Abonnement « Jarvis » / Whop / Academy | `ada_local`+`Mark-LII` = **patterns à réécrire** (licence manquante chez les deux) | 0 € | tu perds le support du créateur ; tu gagnes un code que **tu** possèdes |
| GobboNet (gratuit mais Windows + licence « Other ») | **Open WebUI** (BSD-3) ou **Jan** (Apache-2.0) | 0 € + multi-OS + licence claire | le confort du .exe 699 Ko |
| Hugging Face Inference API payant | `huggingface_hub` + modèles locaux | 0 € | débit |
| VPS cloud pour nœud Reticulum (4-20 $/mois) | **ta tour elle-même** (LAN) ; ou Oracle/Google free tier | 0 € | pas d'adresse publique permanente |

---

## 7. Ce que j'ai déjà mis dans le repo (exécutable maintenant)

| Fichier | Rôle |
|---|---|
| `AUDIT-OUTILS-2026.md` | ce document |
| `audit/CATALOGUE-OUTILS.md` | tous les outils, lien officiel, licence, RAM/VRAM, note « agent ou pas », **liens de téléchargement** |
| `audit/COUTS-LICENCES-LEGAL.md` | argent réel + pièges de licence (fair-code n8n, « Other » GobboNet/Mark-LII, AGPL, clause Open WebUI, RGPD/cadre FR) |
| `audit/CAPACITES-AGENT.md` | ce que l'agent fait / ne fait pas, tâche par tâche, avec les prompts à me recoller |
| `audit/stack/README.md` | mode d'emploi de la stack gratuite |
| `audit/stack/install-stack.ps1` | installeur Windows **lisible** : prérequis ailes (winget) → Ollama + modèles **selon la VRAM détectée** → Python (crawl4ai/whisper/piper/marker/spiderfoot) → `docker compose up` |
| `audit/stack/install-stack.sh` | idem Linux (apt/dnf) — version tour/serveur |
| `audit/stack/docker-compose.yml` | SearXNG + **Vane** + **SpiderFoot** + **Activepieces** + **Langfuse**, tous 0 clé, ports localhost |

Démarrage manuel minimal, si tu veux goûter avant de lancer les scripts (Windows) :
```powershell
winget install Ollama.Ollama          # ou https://ollama.com/download/windows
ollama pull qwen3:4b                  # ~2,5 Go, tourne même à 8 Go sans GPU
cd <repo-watchtower> ; npm install ; npm run dev   # http://localhost:4173 → MODE GRATUIT
```

---

## 8. Feuille de route par phases (toutes à 0 €)

| Phase | Contenu | Effort agent | Effort toi | Gains |
|---|---|---|---|---|
| **P0 — socle** (cette semaine) | lancer `install-stack.ps1`/`.sh` : Node+Ollama+compose ; reconstruire le repo `watchtower` complet | ~1-2 h | 2 clics + 1 mot de passe | tour + cerveau local dans le même repo |
| **P1 — la tour pense** | `src/ai/*` (LLM local, garde-fou sans clé), sortie structurée via **tes** schémas (`Outlines`/`Instructor`), traces Langfuse | 2-3 sessions | test | `chatConsole`/`intelTwin` passent d'heuristiques à vrai raisonnement sourcé |
| **P2 — la tour entend et parle** | whisper.cpp STT + Piper TTS (P3 : Qwen3-TTS si GPU), wake word ; remplace Web Speech | 2 sessions | casque/micro | voix FR naturelle, hors-ligne |
| **P3 — la tour lit le monde** | Tesseract/PaddleOCR + `marker` (PDF/scans) + LibreTranslate, branchés sur les fiches `ficheLieu.js` | 2-3 sessions | 0 | images et documents deviennent interrogeables |
| **P4 — la tour cherche** | `SearxngRetriever` + `Crawl4AiRetriever` + `OpenAlexRetriever` dans `reaserch-engine`, RAG Chonkie + Qdrant/LanceDB | 2-4 sessions | 0 | dossiers de recherche autonomes, sourcés, auditable |
| **P5 — la tour se souvient** | mémoire markdown (pattern `ai-memory-vault`) pour `HCSM`/`Cognitorium` + agent Hermes/OpenClaw en service | 2 sessions | 0 | continuité entre sessions, sans base vectorielle obligatoire |
| **P6 — la tour voit le terrain réel** | `aholo-viewer` + `@manycore/aholo-splat-transform` (LOD/streaming/collision), scans via **Brush** gratuit (GPU requis) | 3-5 sessions | capture de quelques sites | friches/patrimoine scannés dans le globe, 60-120 FPS |
| **P7 — la tour tient sans internet** | Reticulum (logiciel) + Sideband/CrossTalk ; option radios Meshtastic ; couche `meshNodes.js` sur le globe | 1-3 sessions | ⚫ achat radios éventuel | messagerie + état du territoire hors-réseau |
| **P8 — la tour travaille pendant que tu dors** | Activepieces : veille de flux, triage mail, relances, briefing matin, publication de l'état de la tour | 1-2 sessions | 0 | les patterns « boring automations » de la vidéo n°3, à 0 €/mois |

---

## 9. Pièges (pour que tu ne perdes ni temps ni argent)

1. **« Gratuit sur GitHub » ≠ open source.** `Mark-LII` (aucune licence), `ada_local` (aucune licence), GobboNet (« Other ») → **usage OK, redistribution/non**. Le tuto Naz Louis est verrouillé derrière Patreon : inutile, on le refait à plat.
2. **n8n est fair-code**, pas libre (la vidéo n°2 le vend comme « gratuit » : c'est vrai pour l'auto-hébergement, faux pour la licence). **Activepieces** est MIT.
3. **Open WebUI** garde une clause de marque au-delà de ~50 utilisateurs → sans importance pour une tour perso.
4. **AGPL** (SearXNG, Khoj, SpiderFoot, LibreTranslate) : obligatoire de rediffuser tes modifs **seulement si** tu vends/héberges pour des tiers. Usage perso + repo public = déjà conforme.
5. **Le free tier Gemini a été raboté en 2026** (~10-15 RPM, Flash-Lite, et Google peut entraîner sur tes prompts hors UE/EEE). **Ne jamais y envoyer de données de tour sensibles** → local par défaut, cloud en secours conscient.
6. **Ne pas exposer la tour sur le réseau** sans garde-fou : en amont, le serveur « broker » tes clés API à quiconque peut l'atteindre (`0.0.0.0` + LAN = fuite de clés). Reste sur `localhost` + reverse-proxy authentifié si tu veux partager ; l'installeur écrit un `.env` en `chmod 600`.
7. **Les scripts Pinokio exécutent du code tiers en 1 clic** (c'est leur force et leur risque) : l'option que je te livre (scripts texte dans **ton** repo, lisibles avant exécution + release GitHub Actions) est la plus sûre des trois.
8. **Marker/Qdrant/OpenCTI sont gourmands** : sous 16 Go RAM sans GPU, prends LanceDB + `tesseract` + skip Marker.
9. **CCTV public + géoloc = zone grise juridique** (diffusion, RGPD, droit à l'image) : en usage privé/local c'est toléré, dès que tu exposes ou archives, il faut une base légale — d'où `CAPACITES-AGENT.md` §« je ne fais pas ».
10. **Un modèle local ne « sait pas » la date ni l'actualité** : d'où SearXNG/Vane obligatoires pour un OSINT qui ne délire pas.

---

## 10. Prochain pas (choisis une ligne, j'exécute)

1. **P0 maintenant** : je reconstruis le repo `watchtower` complet (57 mods + `APPLIQUER.md` exécuté) et je te pousse une release avec l'installeur → tu as tour + cerveau local.
2. **P1** : je branche Ollama dans `chatConsole.js`/`intelTwin.js` + validation JSON sur tes schémas (`Outlines`/`Instructor`).
3. **P4** : je câble SearXNG + Crawl4AI + OpenAlex dans `reaserch-engine` (vraie recherche autonome, gratuite, sourcée).
4. **P6** : je monte `aholo-viewer` comme couche 3DGS de la tour (leur `SKILL.md` est fait pour un agent).
5. **P7** : je monte un nœud Reticulum local + la couche mesh dans le globe (0 €, radio optionnelle).
