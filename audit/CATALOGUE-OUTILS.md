# 📦 CATALOGUE OUTILS (vu de l'audit) — licence · coût · matériel · download

> ⚠️ **Document d'archive de l'audit.** La référence de travail pour construire, c'est
> [`REFERENCE.md`](REFERENCE.md) (68 outils, étapes A→B→C) générée depuis
> [`reference/generate-reference.py`](reference/generate-reference.py), lue par les agents via
> [`reference/REGISTRE-OUTILS.json`](reference/REGISTRE-OUTILS.json) et vérifiée par
> [`reference/doctor.py`](reference/doctor.py). Ne complète plus ce fichier : ajoute une entrée dans le générateur.

Extraits des 11 liens audités. « Agent OK » = je peux installer/patcher sans toi. `●` = 8 Go RAM / sans GPU, `◐` = GPU 6-8 Go, `◯` = GPU 12-24 Go.

## A. Cerveau & exécution (à installer en premier)

| Outil | Rôle | Licence | Coût | Matériel | Agent OK | Lien officiel / download |
|---|---|---|---|---|---|---|
| **Ollama** | moteur de modèles locaux, API OpenAI-compatible | MIT | 0 € | `●` | ✅ | https://github.com/ollama/ollama · https://ollama.com/download |
| **LM Studio** | même chose, en GUI (si tu ne veux pas de ligne de commande) | gratuit, fermé | 0 € | `●` | ⚠️ (GUI) | https://lmstudio.ai |
| **GobboNet** | 1-click .exe Windows (llama.cpp + modèles HF, offline, LAN) | ⚠️ « Other » | 0 € | `●` | ⚠️ exe non signé | https://goblincorps.com/gobbonet · https://github.com/ElodineOfficial/GobboNet |
| **llama.cpp** | runtime C/C++ (le moteur sous GobboNet) | MIT | 0 € | `●` | ✅ | https://github.com/ggml-org/llama.cpp |
| **Open WebUI** | chat UI multi-modèles, RAG, pipelines | BSD-3 (+ clause marque >50 users) | 0 € | `●` (Docker) | ✅ | https://github.com/open-webui/open-webui |
| **LiteLLM** | proxy unique → local + 100 API, bascule sans code | MIT | 0 € | `●` | ✅ | https://github.com/BerriAI/litellm |
| **Hermes Agent** (Nous Research) | agent auto-améliorant, 118 skills, mémoire 3 couches | **MIT** | 0 € | `●` + LLM | ✅ 1 ligne | https://github.com/NousResearch/hermes-agent · `curl -fsSL .../scripts/install.sh \| bash` |
| **OpenClaw** | agent « always-on », gateway 18789, messaging | source-available (⚠️ vérifier la LICENSE courante) | 0 € | 2-4 Go RAM | ✅ | https://github.com/openclaw/openclaw · https://docs.openclaw.ai |
| **OpenHands** | agent de code autonome (remplace Cursor/Claude Code) | MIT | 0 € | `●` | ✅ | https://github.com/All-Hands-AI/OpenHands |
| **n8n** | automatisation (⚠️ **fair-code**, non OSI) | fair-code | 0 € self-host | `●` | ✅ | https://github.com/n8n-io/n8n |
| **Activepieces** | l'équivalent **MIT** de n8n | MIT | 0 € | `●` (Docker) | ✅ | https://github.com/activepieces/activepieces |

## B. Recherche / RAG (donne des yeux à ta tour)

| Outil | Rôle | Licence | Coût | Matériel | Agent OK | Lien |
|---|---|---|---|---|---|---|
| **SearXNG** | méta-recherche privée auto-hébergée (0 log de ton FAI sur toi) | AGPL-3.0 | 0 € | `●` | ✅ | https://github.com/searxng/searxng |
| **Vane** (ex-Perplexica) | moteur de réponse citée, 1 image Docker avec SearXNG intégré | MIT | 0 € | 2-4 Go RAM | ✅ | https://github.com/ItzCrazyKns/Vane · `docker run -d -p 3000:3000 -v vane-data:/home/vane/data itzcrazykns1337/vane:latest` |
| **Crawl4AI** | web → markdown propre/JSON « LLM-ready » | Apache-2.0 | 0 € | `●` + Chromium | ✅ | https://github.com/unclecode/crawl4ai · `pip install crawl4ai && crawl4ai-setup` |
| **Chonkie** | stratégies de chunking (token/sentence/recursive/semantic/late) | MIT | 0 € | `●` | ✅ | https://github.com/chonkie-ai/chonkie |
| **Qdrant** | base vectorielle Rust | Apache-2.0 | 0 € | `●` | ✅ | https://github.com/qdrant/qdrant |
| **LanceDB** | vecteurs **sans serveur** (mieux sur une tour légère) | Apache-2.0 | 0 € | `●` | ✅ | https://github.com/lancedb/lancedb |
| **Marker** | PDF/EPUB → markdown (layout-aware ; **devenu Apache-2.0**, 39,5 k★) | Apache-2.0 | 0 € | `◐` (CPU possible, lent) | ✅ | https://github.com/datalab-to/marker · `pip install marker-pdf` |
| **Docling** (IBM) | alternative PDF/DOCX → JSON/MD | MIT | 0 € | `●` | ✅ | https://github.com/docling-project/docling |
| **ocrmypdf** | PDF scanné → PDF cherchable | MPL-2.0 | 0 € | `●` | ✅ | https://gitlab.cern.ch/ocrmypdf/ocrmypdf · https://ocrmypdf.readthedocs.io |
| **Khoj** | second brain sur tes fichiers (Obsidian, org, md) | AGPL-3.0 (Cloud déprécié → self-host) | 0 € | `●` | ✅ | https://github.com/khoj-ai/khoj |
| **Langfuse** | traces / evals / prompts (débogage de run) | MIT (core) | 0 € self-host | `●` (Postgres+ClickHouse) | ✅ | https://github.com/langfuse/langfuse |
| **DSPy** | optimisation programmatique de prompts | MIT | 0 € | `●` + LLM | ✅ | https://github.com/stanfordnlp/dspy |
| **Outlines** | sortie JSON **garantie** par grammaire (au niveau token) | Apache-2.0 | 0 € | `●` | ✅ | https://github.com/dottxt-ai/outlines |
| **Instructor** | sortie typée Pydantic + retries | MIT | 0 € | `●` | ✅ | https://github.com/567-labs/instructor |
| **NVIDIA NIM** | 1 k req/j gratuits si tu as une GPU RTX | gratuit (compte) | 0 € | GPU | ⚠️ compte | https://build.nvidia.com |

## C. Parler / entendre (voice layer de la tour)

| Outil | Rôle | Licence | Coût | Matériel | Agent OK | Lien |
|---|---|---|---|---|---|---|
| **whisper.cpp** | STT C/C++ local, temps réel `●` | MIT | 0 € | `●` | ✅ | https://github.com/ggml-org/whisper.cpp |
| **faster-whisper** | STT rapide (CTranslate2), diarisation possible | MIT | 0 € | `●`/`◐` | ✅ | https://github.com/SYSTRAN/faster-whisper |
| **Piper** | **TTS FR sur CPU**, quasi instantané (choisi par `ada_local`) | MIT | 0 € | `●` | ✅ | https://github.com/rhasspy/piper · https://huggingface.co/rhasspy/piper-voices |
| **Qwen3-TTS** | TTS SOTA open source : clonage 3 s, design de voix par prompt, émotion, **10 langues dont FR**, ~97 ms de latence, 0,6 B ≈ 4 Go VRAM | **Apache-2.0** | 0 € | `◐`/`◯` | ✅ | https://github.com/QwenLM/Qwen3-TTS · API OpenAI-compat : https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi · ComfyUI : https://github.com/flybirdxx/ComfyUI-Qwen-TTS |
| **Kokoro** | TTS léger 82 M, FR correct, CPU | Apache-2.0 | 0 € | `●` | ✅ | https://github.com/resemble-ai/kokoro · https://huggingface.co/hexgrad/Kokoro-82M |
| **openwakeword** | wake word hors-ligne (remplace « Hey Jarvis » cloud) | Apache-2.0 | 0 € | `●` | ✅ | https://github.com/dscripka/openWakeWord |
| **Home Assistant Assist / Wyoming** | pipeline voice domestique si la tour pilote la maison | Apache-2.0 | 0 € | `●` | ✅ | https://www.home-assistant.io/ |

## D. Lire les images et documents

| Outil | Rôle | Licence | Coût | Matériel | Lien |
|---|---|---|---|---|---|
| **Tesseract** | OCR 100 % local (5 = version avec LSTM) | Apache-2.0 | 0 € | `●` | https://github.com/tesseract-ocr/tesseract · installeur Windows : https://github.com/UB-Mannheim/tesseract/wiki |
| **PaddleOCR** | OCR robuste manuscrits/tableaux/multilingue (88,9 k★) | Apache-2.0 | 0 € | `●`/`◐` | https://github.com/PaddlePaddle/PaddleOCR |
| **EasyOCR** | OCR 80+ langues | Apache-2.0 | 0 € | `●` | https://github.com/JaidedAI/EasyOCR |
| **LibreTranslate** | traduction hors-ligne | AGPL-3.0 | 0 € | `●` | https://github.com/LibreTranslate/LibreTranslate |
| **ExifTool** | métadonnées (photos, captures, PDF) | Artistic/Perl | 0 € | `●` | https://exiftool.org |

## E. OSINT (collecte sur données ouvertes — **pas sur les personnes**)

| Outil | Rôle | Licence | Coût | Lien |
|---|---|---|---|---|
| **SpiderFoot** | 200+ modules de collecte, UI web, tourne non-stop | **MIT** (21,7 k★) | 0 € | https://github.com/smicallef/spiderfoot |
| **Recon-ng** | framework de recon modulaire CLI | GPL-3.0 | 0 € | https://github.com/lanmaster53/recon-ng |
| **theHarvester** | e-mails + sous-domaines d'une organisation | GPL-3.0 | 0 € | https://github.com/laramies/theHarvester |
| **Amass** | énumération de sous-domaines (OWASP) | Apache-2.0 | 0 € | https://github.com/owasp-amass/amass |
| **Maigret** | dossier par pseudo sur 3000+ sites | **MIT** (37,3 k★) | 0 € | https://github.com/soxoj/maigret |
| **Sherlock** | recherche de pseudo multi-sites | MIT | 0 € | https://github.com/sherlock-project/sherlock |
| **Holehe** | existence d'un e-mail sur 120+ services | GPL-3.0 | 0 € | https://github.com/megadose/holehe |
| **OSINT Framework** | index de sources (à importer dans `intelTwin`) | 0 € | 0 € | https://osintframework.com/ |
| **Gephi** | visualisation de graphe (le « Maltego gratuit ») | GPL-3.0 | 0 € | https://gephi.org |
| **OpenCTI** | plateforme threat-intel (⚠️ lourd : 16-32 Go RAM) | AGPL/⚠️ NOASSERTION (licence à vérifier) | 0 € | https://github.com/OpenCTI-Platform/opencti |
| **crt.sh / Shodan free / HIBP** | certs, devices exposés, fuites | web, gratuits (compte Shodan) | 0 € | https://crt.sh · https://shodan.io · https://haveibeenpwned.com |
| Maltego CE | graphe + transforms | propriétaire, credits limités | 🟠 | https://www.maltego.com — **non nécessaire vu SpiderFoot+Gephi** |

## F. 3D réel dans le globe

| Outil | Rôle | Licence | Coût | Matériel | Lien |
|---|---|---|---|---|---|
| **aholo-viewer** | renderer **3DGS + mesh** avec *Chunked Streaming LOD* (1 Md splats en navigateur), + `AGENTS.md`/`SKILL.md` pensés pour un agent | **MIT** (1 k★) | 0 € | WebGL2/WebGPU | https://github.com/manycoretech/aholo-viewer · https://aholojs.dev · npm `@manycore/aholo-viewer` |
| **@manycore/aholo-splat-transform** | CLI : SPZ, LOD/chunks, **collisions** | MIT | 0 € | `●` | https://www.npmjs.com/package/@manycore/aholo-splat-transform |
| **Brush** | entraînement 3DGS/2DGS **local gratuit**, sans CUDA obligatoire | **Apache-2.0** (5 k★) | 0 € | `◐`/`◯` | https://github.com/ArthurBrussee/brush |
| **Postshot** | GUI capture→splat (Windows) | gratuit, à vérifier | 0 € | GPU | https://github.com/PostshotApp/postshot-desktop |
| **Nerfstudio** | toolbox NeRF/GS (gsplat) | MIT | 0 € | `◯` | https://github.com/nerfstudio-project/nerfstudio |
| **OpenSplat** | éditeur/viewer de .splat | MIT | 0 € | `●` | https://github.com/ElleXav/OpenSplat · https://gsplat.tech |
| Aholo *Platform* | génération de splats depuis images/vidéo (service du constructeur de scanners 3D) | **cloud, comptes/credits** | 🟠 | — | https://www.aholo3d.com/ (⚠️ le viewer GitHub, lui, est gratuit) |
| **CesiumJS** (déjà ta base) | globe, terrain, tuiles Esri/CARTO | Apache-2.0 | 0 € | `●` | https://cesium.com/platform/cesiumjs/ · https://ion.cesium.com (token gratuit pour le 3D photoréaliste) |

## G. Communications hors-internet

| Outil | Rôle | Licence | Coût | Lien |
|---|---|---|---|---|
| **Reticulum** (RNS) | stack réseau chiffrée multi-média (LoRa, Wi-Fi, HF, TCP), pas d'IP | AGPL-3.0 | 0 € logiciel | https://github.com/softwaregroupdm/reticulum · https://reticulum.network · `pip install RNS` |
| **Sideband** | client desktop tout-en-un (chat, files, meshmap) | GPL-3.0 | 0 € | https://github.com/mark-q/sideband · https://sideband.app |
| **CrossTalk** | client cross-platform (la vidéo n°9) | open source | 0 € | https://github.com/buildwithparallel/crosstalk |
| **Columba** | client Android | open source | 0 € | https://columba.network/ |
| **rmap.world** | carte live des nœuds announced | web | 0 € | https://rmap.world/ |
| **RNode** | modem LoRa maison/fait-main pour Reticulum (≈ 15-40 €) | GPL / open hardware | ⚫ matos | https://github.com/liamcottrell/hamlib-rnode |
| **Meshtastic** | mesh LoRa + firmware/apps (le « 1 repeater + 3 radios ≈ 100 acres ») | GPL-3.0 | 0 € logiciel / ⚫ radios | https://meshtastic.org · https://github.com/meshtastic/firmware |

## H. Les 4 briques « Jarvis » à **piocher sans cloner**

| Repo | Intérêt réel pour toi | Licence | Piège |
|---|---|---|---|
| [nazirlouis/ada_local](https://github.com/nazirlouis/ada_local) | routeur FunctionGemma 270 M (think/no-think), Qwen3, Piper, wake word | ❌ **aucune licence** | tuto complet = Patreon payant ; modèle `nlouis/ada_model` à re-check |
| [jaredrhod/fullstack-agent](https://github.com/jaredrhod/fullstack-agent) | UX d'installeur 4-en-1 (à imiter, pas à exécuter) | AGPL-3.0 | ⚠️ **.bat + fonctionne uniquement avec Claude Code (payant)** |
| [jaredrhod/ai-memory-vault](https://github.com/jaredrhod/ai-memory-vault) | **mémoire d'agent en markdown Obsidian, zéro vector DB** → parfait pour `HCSM`/`Cognitorium` | CC-BY-SA-4.0 | partage à l'identique si tu publies les templates |
| [FatihMakes/Mark-LII](https://github.com/FatihMakes/Mark-LII) | système de plugins « 1 fichier = 1 compétence », clé Gemini gratuite | ❌ **aucune licence** (README renvoie vers Whop/Academy) | version « Mark 54 » bridée derrière un communauty payant |
