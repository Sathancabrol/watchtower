#!/usr/bin/env python3
"""Générateur de la référence outils de Watchtower.

Source de vérité unique : OUTILS (ci-dessous).
Produit, à partir des mêmes données :
  - audit/reference/REGISTRE-OUTILS.json   (machine-readable, pour agents)
  - audit/REFERENCE.md                     (humain + agent, tables par catégorie, étapes A→B→C)

Chaque fiche peut porter un champ `origine` (le lien de l'audit qui l'a fait naître) : il est
dérivé automatiquement d'AUDIT-OUTILS-2026.md §1 par `charger_origines()` — ne pas le saisir à la main.

Règle d'or pour les agents : ne JAMAIS éditer REFERENCE.md / REGISTRE-OUTILS.json à la main.
Modifier OUTILS ici, puis  :  python3 audit/reference/generate-reference.py
"""
from __future__ import annotations
import json, datetime, pathlib, sys, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent

# cost: materiel | avec-compte | freemium | payant | option-publique | a-verifier | deja-en-place | non
# tier: 0 = CPU/8 Go · 1 = GPU 6-8 Go · 2 = GPU 12-24 Go · None = pas de GPU requis (léger)
# status: present | partiel | absent | reference (référence/documentation)
OUTILS: list[dict] = []


def T(**kw):
    OUTILS.append(kw)


C_INFRA = "0 · Socle local (aucune donnée ne sort)"
C_SEARCH = "1 · Recherche & collecte web"
C_RAG = "2 · Docs, RAG, sortie structurée"
C_OSINT = "3 · OSINT infrastructures"
C_GEO = "4 · Géoservices & imagerie de la tour"
C_VPS = "4b · Positionnement spatial (VPS) & ancrage des scans"
C_3D = "5 · Rendu 3D réel (splats)"
C_VOICE = "6 · Voix (entendre / parler)"
C_AGENT = "7 · Agents, chat, automatisation"
C_COM = "8 · Communications hors-réseau"
C_MEM = "9 · Mémoire, stockage, sauvegarde"
C_REF = "10 · Références, modèles et pièges à éviter"

# ─────────────────────────────────────────────────────────── 0 · Socle local
T(id="ollama", nom="Ollama", cat=C_INFRA, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Moteur d'inférence local : sert les LLM à toute la tour via une API compatible OpenAI (http://127.0.0.1:11434/v1). Le socle de tout le reste.",
  urls=["https://github.com/ollama/ollama", "https://ollama.com/download"],
  install=["[A] Installer : Windows `winget install -e --id Ollama.Ollama` (ou https://ollama.com/download/OllamaSetup.exe) · Linux `curl -fsSL https://ollama.com/install.sh | sh` (à lire avant)",
           "[B] Modèle selon le matériel : sans GPU `ollama pull qwen3:0.6b` · 6-8 Go VRAM `ollama pull llama3.1:8b` · 12-24 Go `ollama pull qwen3:30b-a3b`",
           "[C] Embeddings : `ollama pull nomic-embed-text` (≈ 270 Mo, FR correct)",
           "[D] Vérifier : `curl http://127.0.0.1:11434/api/tags` et `ollama run qwen3:0.6b 'prêt ?'`"],
  integree="src/ai/llmClient.js lit OLLAMA_BASE_URL + OLLAMA_MODEL depuis .env ; repli silencieusement désactivé si l'API ne répond pas.",
  verifier="curl -s http://127.0.0.1:11434/api/tags | head -c 200",
  notes="Le seul composant obligatoire de la V2. Rien ne part sur internet avec un modèle local.",
  gpu="CPU possible (lent), GPU recommandé ≥ 6 Go pour 8B")

T(id="litellm", nom="LiteLLM", cat=C_INFRA, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Proxy unique devant Ollama + fournisseurs gratuits (Groq/OpenRouter :free) + payants : changer de modèle = changer une ligne de config, jamais du code.",
  urls=["https://github.com/BerriAI/litellm", "https://docs.litellm.ai"],
  install=["[A] `python3 -m pip install -U 'litellm[proxy]'`",
           "[B] Créer `audit/stack/config/litellm.config.yaml` : `model_list` avec `ollama/qwen3:0.6b` en défaut + `groq/llama-3.3-70b-versatile` en secours",
           "[C] Lancer : `litellm --config audit/stack/config/litellm.config.yaml --port 4000`",
           "[D] La tour pointe désormais sur http://127.0.0.1:4000/v1"],
  integree="Un seul endpoint pour `chatConsole`, `intelTwin`, `reaserch-engine`, les agents. Budgets/limits dans le config.",
  verifier="curl -s http://127.0.0.1:4000/v1/models | head -c 300",
  notes="Gratuit et local. Ne colle une clé payante que si tu choisis explicitement un secours cloud.")

T(id="lm-studio", nom="LM Studio", cat=C_INFRA, statut="absent", prix="materiel", licence="gratuit / source fermée", tier=0,
  role="Alternative GUI à Ollama pour charger/tester des GGUF sans ligne de commande (sert aussi une API locale).",
  urls=["https://lmstudio.ai", "https://lmstudio.ai/docs"],
  install=["[A] Télécharger l'installeur (Win/mac/Linux) → https://lmstudio.ai/download",
           "[B] Developer → Local Server → charger un GGUF → activer le serveur sur 1234",
           "[C] Alternative de secours pour la tour si Ollama est absent (décocher dans .env)"],
  integree="Optionnel. À privilégier pour un usage non technique d'un proche, pas comme socle.",
  verifier="curl -s http://127.0.0.1:1234/v1/models",
  notes="Ferme = pas auditable par agent ; garder Ollama comme référence.")

T(id="gobbonet", nom="GobboNet (Elodine)", cat=C_INFRA, statut="reference", prix="materiel", licence="« Other » (non-OSI)", tier=None,
  role="Référence du scénario « un seul fichier qui installe tout » : .exe 699 Ko qui pose llama.cpp + un modèle choisi selon la VRAM, puis tourne débranché. C'est le modèle UX de notre installeur.",
  urls=["https://goblincorps.com/gobbonet", "https://github.com/ElodineOfficial/GobboNet"],
  install=["[A] ⚠️ Référence uniquement, pas une dépendance : licence non ouverte, binaire non signé (SmartScreen)",
           "[B] Si envie de goûter : télécharger le setup sur la page, lire les .bat/.ps1 du repo (le code est du script Windows lisible)",
           "[C] Ce qu'on en copie : probe matériel → liste de modèles adaptés → 1 mot de passe local → serveur LAN"],
  integree="Ne pas lier. Nos équivalents : `audit/stack/install-stack.ps1|.sh` + Ollama + Open WebUI.",
  verifier="—",
  notes="Gratuit et honnête mais « open source » au sens large seulement. Windows only, Linux « probablement buggé » dixit l'auteur.")

T(id="pinokio", nom="Pinokio", cat=C_INFRA, statut="absent", prix="materiel", licence="MIT (launcher)", tier=0,
  role="Launcher « 1 clic » qui clone, installe et démarre des projets open source. Utile pour tester une idée vite.",
  urls=["https://pinokio.computer", "https://github.com/cocktailpeanut/pinokio"],
  install=["[A] Télécharger depuis le site officiel (Windows/macOS/Linux)",
           "[B] Discover → Download from URL → coller l'URL du repo (ex. la tour amont)",
           "[C] ⚠️ Toujours lire le `main.json`/script avant Install : un script Pinokio exécute du code tiers avec tes droits"],
  integree="Ne remplace pas notre installeur versionné ; nos scripts restent la voie de référence (lisibles, relançables, dans ton repo).",
  verifier="—",
  notes="Communauté = certains scripts non revus ; ne jamais exécuter un lien reçu en DM comme un .exe.")

T(id="whisper-cpp", nom="whisper.cpp", cat=C_INFRA, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Transcription locale de mémos/radios/captures audio, sur CPU. Alimente l'input texte de la tour.",
  urls=["https://github.com/ggml-org/whisper.cpp", "https://huggingface.co/ggerganov/whisper.cpp"],
  install=["[A] `git clone --depth 1 https://github.com/ggml-org/whisper.cpp && cd whisper.cpp`",
           "[B] `make -j` (Windows : `cmake -B build && cmake --build build --config Release`)",
           "[C] Télécharger un modèle : `sh ./models/download-ggml-model.sh base`",
           "[D] Test : `./build/bin/whisper-cli -m models/ggml-base.bin -f note.wav -l fr`"],
  integree="src/voice/sttLocal.js appelle le binaire en local (file d'attente de fichiers), pas de cloud.",
  verifier="ls models/ggml-base.bin && ./build/bin/whisper-cli --help >/dev/null && echo ok",
  notes="Si Python : faster-whisper est plus simple à brancher. GPU → vitesse x10.",
  gpu="CPU OK (0,5-2x temps réel selon taille de modèle)")

# ─────────────────────────────────────────────────────── 1 · Recherche/collecte
T(id="searxng", nom="SearXNG", cat=C_SEARCH, statut="absent", prix="materiel", licence="AGPL-3.0", tier=0,
  role="Méta-recherche privée auto-hébergée : tes requêtes ne sont plus attachées à ton identité auprès des moteurs. Devient le `SearxngRetriever` de `reaserch-engine` et le « cherche » de la tour.",
  urls=["https://github.com/searxng/searxng", "https://docs.searxng.org"],
  install=["[A] `docker run -d --name wt-searxng -p 127.0.0.1:8080:8080 -e SEARXNG_SECRET=$(openssl rand -hex 20) -v $PWD/config/searxng:/etc/searxng searxng/searxng:latest`",
           "[B] Activer la sortie JSON (indispensable pour un agent) : dans `settings.yml`, `search.formats: [html, json]`",
           "[C] Engines FR utiles à activer : duckduckgo, google, bing, wikipedia, wikidata, qwant, mojeek",
           "[D] Vérifier : `curl -s 'http://127.0.0.1:8080/search?q=test&format=json' | head -c 200`"],
  integree="SEARCH_BASE_URL=http://localhost:8080/search dans .env ; Vane peut l'utiliser comme backend.",
  verifier="curl -s 'http://127.0.0.1:8080/search?q=frontignan&format=json' | python3 -c 'import json,sys;print(len(json.load(sys.stdin)[\"results\"]))'",
  notes="Sans le `format=json`, un agent ne peut pas consommer le résultat : ne pas oublier le [B].")

T(id="vane-perplexica", nom="Vane (ex-Perplexica)", cat=C_SEARCH, statut="absent", prix="materiel", licence="MIT (36,6 k★)", tier=0,
  role="Moteur de réponse avec citations : lit le web via SearXNG, rerank, répond. Remplace un Perplexity à 20 $/mois. UI de recherche « dossier » pour la tour.",
  urls=["https://github.com/ItzCrazyKns/Vane", "https://hub.docker.com/r/itzcrazykns1337/vane"],
  install=["[A] `docker run -d --name wt-vane -p 127.0.0.1:3000:3000 -v vane-data:/home/vane/data itzcrazykns1337/vane:latest`",
           "[B] Ouvrir http://localhost:3000 → Settings → Model : ajouter `http://host.docker.internal:11434/v1` (Ollama) → 0 API externe",
           "[C] (option) Brancher notre SearXNG : `SEARXNG_API_URL=http://127.0.0.1:8080`",
           "[D] Vérifier : poser « Quelle est la population de Frontignan ? » → réponse citée"],
  integree="VANE_BASE_URL=http://localhost:3000/api ; les réponses citées nourrissent `hudSummaryResponse.js` et les dossiers de recherche.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
  notes="⚠️ Le nom a changé en mars 2026 (repo `Perplexica` → `Vane`) : les vieux tutos donnent une image Docker obsolète. Vérifier le nom d'image au build.")

T(id="crawl4ai", nom="Crawl4AI", cat=C_SEARCH, statut="absent", prix="materiel", licence="Apache-2.0 (66-80 k★)", tier=0,
  role="Page web → markdown propre / JSON structuré, avec rendu JS. Le « yeux » qui manque à `reaserch-engine` pour lire les pages que SearXNG trouve.",
  urls=["https://github.com/unclecode/crawl4ai", "https://docs.crawl4ai.com"],
  install=["[A] `python3 -m venv .venv && source .venv/bin/activate` (Win : `.venv\\Scripts\\activate`)",
           "[B] `pip install -U crawl4ai && crawl4ai-setup` (pose Chromium/Playwright)",
           "[C] Test : `crwl https://example.com -o markdown`",
           "[D] En service : `crawl4ai-server --port 11235` (API) ou `AsyncWebCrawler` dans le moteur"],
  integree="engine/retrieval.py → `Crawl4AiRetriever(search_request)` renvoie du markdown horodaté, prêt pour l'extraction d'évidence.",
  verifier="crwl https://en.wikipedia.org/wiki/Frontignan -o markdown | head -20",
  notes="Pas de clé, pas de facture ; le mode extraction LLM est optionnel et marchera sur Ollama. ~300 Mo de RAM idle + Chromium.")

T(id="firecrawl", nom="Firecrawl (self-host)", cat=C_SEARCH, statut="absent", prix="materiel", licence="AGPL-3.0 (core)", tier=1,
  role="Alternative à Crawl4AI : crawl + scrape + map + extract en REST, avec SDK compatibles. À considérer seulement si tu veux un service multi-projets.",
  urls=["https://github.com/firecrawl/firecrawl", "https://docs.firecrawl.dev/contributing/self-host"],
  install=["[A] `git clone --depth 1 https://github.com/firecrawl/firecrawl && cd firecrawl`",
           "[B] `docker compose -f apps/api/docker-compose.yaml up -d` (⚠️ nécessite Redis ; image ~500 Mo)",
           "[C] Endpoint local : `http://localhost:3002/v1/scrape`"],
  integree="Non recommandé pour une tour légère : Crawl4AI couvre le besoin à plus petite empreinte.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/v0/scrape",
  notes="AGPL + service lourd. Le cloud Firecrawl est freemium/crédités → éviter.")

# ─────────────────────────────────────────────────── 2 · Docs, RAG, structured
T(id="marker", nom="Marker", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0 (39,5 k★, a migré depuis GPLv3)", tier=1,
  role="PDF/EPUB/DOCX → markdown propre (layout-aware : colonnes, tableaux, équations). La porte d'entrée de `ETAT-DE-LART-PSYCHOLOGIE` et des arrêtés/DOC d'urbanisme vers le RAG.",
  urls=["https://github.com/datalab-to/marker", "https://pypi.org/project/marker-pdf/"],
  install=["[A] `pip install marker-pdf`",
           "[B] Un fichier : `marker_single chemin/vers/doc.pdf /sortie --use_llm False`",
           "[C] Dossier entier : `marker /corpus /out --workers 4`",
           "[D] CPU possible (lent) ; GPU ≈ x10. Modèles ≈ 1-2 Go téléchargés au premier run."],
  integree="corpus/ + CLI `python -m engine.ingest <pdf>` → alimente le graphe d'évidence.",
  verifier="marker_single --help >/dev/null && echo ok",
  notes="La licence est revenue en Apache-2.0 : usage commercial redevenu propre (à re-vérifier au moment de l'install).")

T(id="docling", nom="Docling (IBM)", cat=C_RAG, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Convertit PDF/DOCX/PPTX/HTML en markdown + JSON typé, robuste sur les documents de bureau. Alternative plus légère que Marker quand le GPU manque.",
  urls=["https://github.com/docling-project/docling", "https://docling-project.github.io/docling/"],
  install=["[A] `pip install docling`",
           "[B] `docling conversion mondocument.pdf --to md`",
           "[C] En Python : `DocumentConverter().convert(path).document.export_to_markdown()`"],
  integree="Choix par défaut pour `ETAT-DE-LART-PSYCHOLOGIE` (pptx/pdf mélangés).",
  verifier="docling --version",
  notes="Moins bon que Marker sur les équations, plus simple sur les PPTX.")

T(id="ocrmypdf", nom="OCRmyPDF", cat=C_RAG, statut="absent", prix="materiel", licence="MPL-2.0", tier=0,
  role="Rend cherchable un PDF scanné (ajoute une couche texte), corrige l'inclinaison, déskew. Indispensable pour les documents anciens/arrêtés numérisés.",
  urls=["https://gitlab.cern.ch/ocrmypdf/ocrmypdf", "https://ocrmypdf.readthedocs.io"],
  install=["[A] `sudo apt install ocrmypdf ghostscript` (ou `pip install ocrmypdf`)",
           "[B] `ocrmypdf -l fra entree.pdf sortie.pdf`",
           "[C] Chaîne utile : `ocrmypdf` → `docling` → chunking → index"],
  integree="Pré-traitement du `corpus/` de `reaserch-engine`.",
  verifier="ocrmypdf --version",
  notes="Ghostscript est AGPL mais appelé en CLI : pas d'obligation de licence sur tes documents.")

T(id="tesseract", nom="Tesseract OCR", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="OCR d'image (capture CCTV, photo de panneau, plan, capture d'écran). Ce qui manque à la tour pour « lire » ce qu'elle voit.",
  urls=["https://github.com/tesseract-ocr/tesseract", "https://github.com/UB-Mannheim/tesseract/wiki"],
  install=["[A] Linux : `sudo apt install tesseract-ocr tesseract-ocr-fra` · Windows : installeur UB-Mannheim (lien) · macOS : `brew install tesseract tesseract-lang`",
           "[B] Test : `tesseract capture.png stdout -l fra+eng --psm 6`",
           "[C] Dans le navigateur (zéro install serveur) : `npm i tesseract.js` + worker, ou `--lang fra`",
           "[D] Pour les rendus lourds : PaddleOCR (Apache-2.0, 88,9 k★)"],
  integree="src/ocr.js : bouton « lire cette image » sur `ficheLieu` et les flux CCTV ; texte → `reaserch-engine`.",
  verifier="tesseract --version && tesseract --list-langs | grep -i fra",
  notes="Sur captures basse qualité, PaddleOCR gagne ; Tesseract gagne en zéro-dépendance et vitesse CPU.")

T(id="paddleocr", nom="PaddleOCR", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0 (88,9 k★)", tier=0,
  role="OCR moderne robuste (manuscrits, tableaux, multilingue, PP-OCRv5). Le choix qualité.",
  urls=["https://github.com/PaddlePaddle/PaddleOCR", "https://www.paddleocr.ai/latest/"],
  install=["[A] `pip install paddlepaddle rapidocr-onnxruntime` (ou `pip install paddleocr`)",
           "[B] CLI : `rapidocr --image_dir capture.png`",
           "[C] En Python : `from rapidocr_onnxruntime import RapidOCR; RapidOCR()(path)`"],
  integree="Remplaçable avec Tesseract derrière la même interface `src/ocr.js`.",
  verifier="python3 -c 'import rapidocr_onnxruntime,sys;print(\"ok\")'",
  notes="RapidOCR (ONNX) évite la grosse dépendance Paddle. ~1 Go de poids initial.")

T(id="libretranslate", nom="LibreTranslate", cat=C_RAG, statut="absent", prix="materiel", licence="AGPL-3.0", tier=0,
  role="Traduction hors-ligne (API) : documents étrangers lus par la tour sans upload chez un tiers.",
  urls=["https://github.com/LibreTranslate/LibreTranslate", "https://libretranslate.com/docs"],
  install=["[A] `docker run -d --name wt-translate -p 127.0.0.1:5000:5000 --init ghcr.io/argosopentech/argos-translate:latest`",
           "[B] `curl -s -X POST http://127.0.0.1:5000/translate -d '{\"q\":\"bonjour\",\"source\":\"fr\",\"target\":\"en\"}'`",
           "[C] Ou `pip install libretranslate && libretranslate --host 127.0.0.1`"],
  integree="src/i18n/translateLocal.js, branché sur les fiches et les résultats de recherche.",
  verifier="curl -s http://127.0.0.1:5000/languages | head -c 200",
  notes="Qualité correcte FR↔EN/ES/DE ; loin de DeepL sur les langues hors européen. Version hébergée publique = dépannage, pas confidentiel.")

T(id="chonkie", nom="Chonkie", cat=C_RAG, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Stratégies de découpe pour le RAG (token, sentence, recursive, semantic, late chunking) — la qualité de récupération se joue ici.",
  urls=["https://github.com/chonkie-ai/chonkie", "https://docs.chonkie.ai"],
  install=["[A] `pip install chonkie`",
           "[B] `python -c \"from chonkie import SemanticChunker; print(SemanticChunker(model='ollama/qwen3:0.6b'))\"`",
           "[C] Utiliser `RecursiveChunker` pour les DOC markdown issus de docling/marker"],
  integree="`reaserch-engine` : l'étape d'ingestion d'évidence avant l'extraction.",
  verifier="python3 -c 'import chonkie;print(chonkie.__version__)'",
  notes="Léger, mono-mainteneur : épingler la version dans requirements.")

T(id="qdrant", nom="Qdrant", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="Base vectorielle (Rust) pour corpus importants (100 k+ chunks), avec filtres temporels/méta — pratique pour un graphe d'évidence daté.",
  urls=["https://github.com/qdrant/qdrant", "https://qdrant.tech/documentation/"],
  install=["[A] `docker run -d --name wt-qdrant -p 127.0.0.1:6333:6333 -v qdrant:/qdrant/storage qdrant/qdrant:latest`",
           "[B] `curl -s http://127.0.0.1:6333/collections`",
           "[C] Python : `from qdrant_client import QdrantClient; QdrantClient(url='http://127.0.0.1:6333')`"],
  integree="Optionnel au-dessous de ~50 k chunks → sinon LanceDB.",
  verifier="curl -s http://127.0.0.1:6333/readyz",
  notes="Qdrant Cloud a un tier gratuit (avec compte) : inutile ici.")

T(id="lancedb", nom="LanceDB", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="Vecteurs + colonnes typées **en fichiers**, sans serveur : le choix par défaut d'une tour. Zéro conteneur, zéro port.",
  urls=["https://github.com/lancedb/lancedb", "https://lancedb.com/docs"],
  install=["[A] `pip install lancedb`",
           "[B] `python -c \"import lancedb; db=lancedb.connect('data/lancedb'); print(db.table_names())\"`",
           "[C] Indexer avec le même embedder qu'Ollama (`nomic-embed-text`)"],
  integree="`reaserch-engine/engine/persistence.py` → store vectoriel local derrière l'interface existante.",
  verifier="python3 -c 'import lancedb;print(\"ok\")'",
  notes="Recommandé avant Qdrant : moins de pièces, mêmes usages jusqu'à ~1 M de lignes.")

T(id="outlines", nom="Outlines", cat=C_RAG, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="Contraint la génération token par token → JSON **qui valide le schéma**, par construction. Fini le parsing fragile.",
  urls=["https://github.com/dottxt-ai/outlines", "https://dottxt-ai.github.io/outlines/"],
  install=["[A] `pip install outlines`",
           "[B] Charger un de TES schémas : `json.loads(open('schemas/evidence.schema.json').read())` → `outlines.from_json(schema)`",
           "[C] `Generator('hugging-quants/...', backend='transformers')` ou via un endpoint compatible",
           "[D] Alternative sans GPU : valider avec `jsonschema` + retry (Instructor)"],
  integree="`reaserch-engine` : chaque agent (claims/evidence/conclusion) sort du validé par `schemas/*.schema.json`.",
  verifier="python3 -c 'import outlines;print(\"ok\")'",
  notes="Marche avec modèles locaux (transformers/vLLM/llamacpp). Avec Ollama, préfère Instructor+jsonschema si Outlines refuse le backend.",
  gpu="GPU utile, pas obligatoire")

T(id="instructor", nom="Instructor", cat=C_RAG, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Sorties typées Pydantic + retries + validation, sur n'importe quel endpoint OpenAI-compatible → marche avec Ollama et LiteLLM.",
  urls=["https://github.com/567-labs/instructor", "https://python.useinstructor.com"],
  install=["[A] `pip install instructor pydantic`",
           "[B] `client = instructor.from_openai(OpenAI(base_url='http://127.0.0.1:11434/v1', api_key='x'), mode=instructor.Mode.JSON)`",
           "[C] Déclarer `class Evidence(BaseModel): ...` calqué sur `schemas/evidence.schema.json`",
           "[D] `client.chat.completions.create(response_model=Evidence, messages=..., max_retries=3)`"],
  integree="Le pont propre entre les LLM et les schémas JSON du repo.",
  verifier="python3 -c 'import instructor;print(instructor.__version__)'",
  notes="La voie la plus simple pour une tour sans GPU. Recommandé en premier choix.")

T(id="dspy", nom="DSPy", cat=C_RAG, statut="absent", prix="materiel", licence="MIT", tier=1,
  role="Optimise les prompts et les poids par programme (métrique → compilation) au lieu du tuning manuel.",
  urls=["https://github.com/stanfordnlp/dspy", "https://dspy.ai"],
  install=["[A] `pip install dspy`",
           "[B] `dspy.LM('ollama_chat/qwen3:4b', api_base='http://127.0.0.1:11434')`",
           "[C] Définir un `Signature` (question → claims) + un dataset de 20-50 exemples de ton domaine",
           "[D] `dspy.GRPO`/`BootstrapFewShot` puis sauvegarder `program.json`"],
  integree="`reaserch-engine` : optimiser la stratégie de décomposition de question sur tes dossiers archivés.",
  verifier="python3 -c 'import dspy;print(dspy.__version__)'",
  notes="Avant d'optimiser : il te faut des exemples annotés. Ne pas commencer par là.")

T(id="langfuse", nom="Langfuse", cat=C_RAG, statut="absent", prix="materiel", licence="MIT (core)", tier=1,
  role="Observabilité des runs : traces par étape, coûts, evals, gestion de prompts. Ce qui rend `reaserch-engine` débogable.",
  urls=["https://github.com/langfuse/langfuse", "https://langfuse.com/self-hosting"],
  install=["[A] `git clone --depth 1 https://github.com/langfuse/langfuse && cd langfuse`",
           "[B] `cp .env.example .env` → générer les secrets → `docker compose up -d` (Postgres + ClickHouse + MinIO)",
           "[C] `pip install langfuse` puis décorer les étapes : `@observe()`",
           "[D] UI : http://localhost:3001 (projet créé en local, sans compte cloud)"],
  integree="Chaque agent du moteur émet une trace nommée ; le `docs/` de l'audit recommande de logger `run.context`.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://localhost:3001",
  notes="Lourd (~4 Go RAM) : sur une tour 8 Go, préfère des traces JSONL dans `data/traces/` — ton moteur écrit déjà des checkpoints JSON, c'est à 80 % ça.")

# ───────────────────────────────────────────────────────── 3 · OSINT infra
T(id="spiderfoot", nom="SpiderFoot", cat=C_OSINT, statut="absent", prix="materiel", licence="MIT (21,7 k★)", tier=0,
  role="Collecte OSINT automatisée sur 200+ sources (domaine, IP, e-mail, empreinte d'infra), UI web + API + scans programmables.",
  urls=["https://github.com/smicallef/spiderfoot", "https://www.spiderfoot.net/documentation/"],
  install=["[A] `docker run -d --name wt-spiderfoot -p 127.0.0.1:5001:5001 -v spiderfoot:/root/.spiderfoot blacktop/spiderfoot:latest`",
           "[B] (ou source) `git clone --depth 1 https://github.com/smicallef/spiderfoot && pip install -r requirements.txt && python sf.py -l 127.0.0.1:5001`",
           "[C] Ouvrir http://localhost:5001 → New Scan → cible = un domaine d'infrastructure",
           "[D] Désactiver les modules non conformes (personnes, réseaux sociaux de particuliers)"],
  integree="Résultats → entités de `intelTwin.js` (ports, services, sous-domaines d'une collectivité, d'un site).",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://localhost:5001",
  notes="La version hébergée « HX » est payante : inutile. Les modules les plus utiles demandent des clés gratuites (Shodan, VirusTotal, SecurityTrails) — optionnel.")

T(id="theharvester", nom="theHarvester", cat=C_OSINT, statut="absent", prix="avec-compte", licence="GPL-3.0", tier=0,
  role="E-mails + sous-domaines + hosts d'une organisation, en 5 minutes.",
  urls=["https://github.com/laramies/theHarvester"],
  install=["[A] `pipx install theHarvester` (ou `pip install theHarvester`)",
           "[B] `theHarvester -d exemple.fr -b all`",
           "[C] Sortie JSON : `-f out.json` pour la consommer dans le moteur"],
  integree="Phase de cadrage d'un dossier `reaserch-engine`.",
  verifier="theHarvester -h >/dev/null && echo ok",
  notes="Certaines sources demandent une clé gratuite (Hunter, Shodan) : sinon le reste marche quand même.")

T(id="amass", nom="Amass (OWASP)", cat=C_OSINT, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="Énumération de sous-domaines la plus complète en free (brute + passif + JS).",
  urls=["https://github.com/owasp-amass/amass", "https://owasp-amass.com"],
  install=["[A] `go install github.com/owasp-amass/amass/v4/...@master` (ou binaire release)",
           "[B] `amass enum -passive -d exemple.fr -o sub.txt`",
           "[C] Actif (optionnel) : `amass enum -active -brutes -d exemple.fr` ⚠️ plus intrusif"]
  ,
  integree="Alimente la carte des entités (infrastructures) de la tour.",
  verifier="amass -version",
  notes="Ne scanner que ce que tu as le droit de scanner ; mode passif par défaut.")

T(id="maigret", nom="Maigret", cat=C_OSINT, statut="absent", prix="materiel", licence="MIT (37,3 k★)", tier=0,
  role="Dossier de présence par pseudo sur 3000+ sites (professionnel : empreinte d'une organisation/marque).",
  urls=["https://github.com/soxoj/maigret", "https://maigret.readthedocs.io"],
  install=["[A] `pipx install maigret`",
           "[B] `maigret -c data/cookies.jsonl nom_de_marque -f reports/x.html`",
           "[C] Utiliser `--no-recursion` et un profil dédié pour ne rien polluer"],
  integree="⚠️ Uniquement sur des identifiants **organisationnels** (entité publique, service, marque). Jamais sur une personne physique : la ligne du projet amont est explicite.",
  verifier="maigret --version",
  notes="Puissant donc sensible. En FR : droit à la vie privée (art. 9 C. civ.) + RGPD dès que tu stockes/exposes.")

T(id="exiftool", nom="ExifTool", cat=C_OSINT, statut="absent", prix="materiel", licence="Perl Artistic", tier=0,
  role="Métadonnées de fichiers (photo, PDF, capture) : géoloc, modèle d'appareil, dates, logiciel, historique de rédac.",
  urls=["https://exiftool.org"],
  install=["[A] `sudo apt install libimage-exiftool-perl` (ou télécharger le binaire)",
           "[B] `exiftool capture.png`",
           "[C] En masse : `exiftool -csv /corpus/images > meta.csv`"],
  integree="Bouton « métadonnées » sur `ficheLieu` ; alerte « image sans géoloc » = potentiellement recadrée.",
  verifier="exiftool -ver",
  notes="Aussi l'outil de **nettoyage** (`-all=`) avant de publier une capture. Les 2 sens, à connaître.")

T(id="osint-framework", nom="OSINT Framework", cat=C_OSINT, statut="reference", prix="materiel", licence="web", tier=None,
  role="Index arborescent de sources ouvertes (la carte mentale du métier). À absorber comme catalogue de connecteurs, pas comme outil.",
  urls=["https://osintframework.com", "https://github.com/lockfale/OSINT-Framework"],
  install=["[A] Parcourir l'arbre, repérer les sources **gratuites sans clé** pertinentes pour ton territoire",
           "[B] En dériver un fichier `connecteurs-osint.json` (id, url, auth: none|free-key, type de sortie)",
           "[C] Brancher les 5 meilleurs dans `intelTwin.js` comme calques optionnels"],
  integree="Le fichier de connecteurs devient la config lue par les agents : ils savent quoi est gratuit.",
  verifier="—",
  notes="Beaucoup d'entrées sont payantes ou mortes : filtrer, ne jamais intégrer sans tester.")

T(id="maltego-ce", nom="Maltego CE", cat=C_OSINT, statut="reference", prix="avec-compte", licence="propriétaire (CE gratuit)", tier=None,
  role="Graphe + transforms historique du domaine. Payant pour l'usage sérieux.",
  urls=["https://www.maltego.com/pricing/", "https://www.maltego.com/continue-to-hub/?hub=https://www.maltego.com/editions/"],
  install=["[A] À ne PAS installer : SpiderFoot (collecte) + Gephi (graphe) + `intelTwin` (visualisation dans le globe) couvrent le besoin à 0 €",
           "[B] Si besoin absolu : CE = credits mensuels limités + compte obligatoire"],
  integree="Non.",
  verifier="—",
  notes="Piège du « gratuit puis bloqué ». Notre stack maison fait le graphe dans le globe, c'est un avantage sur Maltego.")

T(id="opencti", nom="OpenCTI", cat=C_OSINT, statut="reference", prix="materiel", licence="⚠️ NOASSERTION (vérifier la LICENSE du commit visé)", tier=None,
  role="Plateforme de threat-intel (observable → infra → groupe). Très au-dessus du besoin d'une tour de veille.",
  urls=["https://github.com/OpenCTI-Platform/opencti", "https://docs.opencti.io/latest/deployment/installation/"],
  install=["[A] Non recommandé : 16-32 Go RAM, Elasticsearch + Redis + RabbitMQ + MinIO",
           "[B] Si impératif : `docker compose` officiel + `opencti_worker`",
           "[C] Équivalent léger pour toi : SpiderFoot → LanceDB → `intelTwin`"],
  integree="Non.",
  verifier="—",
  notes="Licence ambigüe sur GitHub : à clarifier avant tout usage public.")

T(id="gephi", nom="Gephi", cat=C_OSINT, statut="reference", prix="materiel", licence="GPL-3.0", tier=0,
  role="Visualisation/analyse de graphes (layout, métriques) pour explorer les liens sortis de SpiderFoot.",
  urls=["https://gephi.org", "https://github.com/gephi/gephi"],
  install=["[A] Télécharger l'installeur (nécessite JDK 17+)",
           "[B] Importer un CSV/GEXF généré par notre exporter",
           "[C] ⚠️ Alternative intégrée : dessiner le graphe **dans le globe** (calque `linksGraph.js`), c'est mieux pour la tour"],
  integree="Exporter `graph.gexf` depuis `evidence_graph.py` → utile pour les présentations.",
  verifier="—",
  notes="Desktop Java : pas automatisable par un agent au-delà de l'export.")

# ─────────────────────────────────────────────────── 4 · Géoservices / imagerie
T(id="esri-carto-tuiles", nom="Tuiles Esri World Imagery + CARTO (déjà en place)", cat=C_GEO, statut="present", prix="materiel", licence="Esri (usage perso) / CARTO-OSM", tier=None,
  role="Le globe satellite et la carte routière de la tour, **sans clé** — l'avantage structurel de ton fork sur l'amont.",
  urls=["https://github.com/Sathancabrol/watchtower-mods (mapStackController.js)", "https://basemaps.cartocdn.com"],
  install=["[A] Rien : déjà dans `COGNITORIUM/watchtower-mods/src/mapStackController.js` (CARTO Voyager remplace osm.org, bloqué)",
           "[B] Vérifier au build que les URL de tuiles ne sont pas rate-limitées (user-agent + cache)"],
  integree="Base de tous les calques.",
  verifier="curl -sI 'https://basemaps.cartocdn.com/rastertiles/voyager/12/2114/1437.png' | head -1",
  notes="CGU : usage non commercial pour les tuiles « community » ; vérifier à chaque mise à jour de l'app.")

T(id="photon-nominatim", nom="Photon → Nominatim (géocodage sans clé, déjà en place)", cat=C_GEO, statut="present", prix="materiel", licence="OSM (ODbL)", tier=None,
  role="Recherche de lieux de la tour, sans clé Google. Déjà remplacé dans tes mods (`locations.js`).",
  urls=["https://photon.komoot.io", "https://github.com/komoot/photon", "https://nominatim.org"],
  install=["[A] Déjà en place dans `src/locations.js`",
           "[B] Pour retirer la dépendance aux instances publiques : `docker run -d -p 127.0.1:2322 komoot/photon` (⚠️ nécessite l'import d'un dump ~30 Go → ne le faire que si tu as le disque)",
           "[C] Respect du 1 req/s sur Nominatim public, User-Agent obligatoire"],
  integree="Le cœur du « va à Marseille ».",
  verifier="curl -s 'https://photon.komoot.io/api/?q=frontignan&limit=1' | head -c 200",
  notes="Ne pas spammer les instances publiques, sinon bannissement : cache + throttle côté app.")

T(id="cesium-ion", nom="Cesium ion (tuiles 3D photoréalistes)", cat=C_GEO, statut="partiel", prix="avec-compte", licence="Cesium (token gratuit usage perso)", tier=None,
  role="Upgrade visuel optionnel de la tour : 3D photoréaliste + terrain. Ton startGate « MODE PAYANT » est fait pour ça.",
  urls=["https://ion.cesium.com", "https://cesium.com/platform/cesium-for-unreal/cesium-ion-pricing", "https://github.com/Sathancabrol/watchtower-mods (keySetup.js)"],
  install=["[A] Créer un compte gratuit → copier le token par défaut",
           "[B] Le coller dans l'app (POWER UP / `keySetup.js`) → ✓ vert → redémarrage auto",
           "[C] Vérifier le quota sur le dashboard ion, ne pas exposer l'instance"],
  integree="`src/startGate.js` + `keySetup.js` : déjà conçus pour ça.",
  verifier="curl -s -o /dev/null -w '%{http_code}' 'https://assets.cesium.com/' ",
  notes="Gratuit **avec compte** et quotas éligibles (perso/non commercial). L'alternative 0 compte = rester sur Esri (moins joli, gratuit).")

T(id="opensky", nom="OpenSky Network", cat=C_GEO, statut="partiel", prix="avec-compte", licence="données ouvertes (compte = quota supérieur)", tier=None,
  role="Positions de vol (le calque avions de la tour / des amonts).",
  urls=["https://opensky-network.org", "https://opensky-network.org/monitor"],
  install=["[A] Anonyme : `curl -s 'https://opensky-network.org/api/states/all?bbox=3.4,43.3,4.2,43.7'` (quota faible, souvent 429)",
           "[B] Mieux : créer un compte gratuit (client_id/secret) ou utiliser `adsb.lol` (sans clé)",
           "[C] Dans la tour, `OPENSKY_AUTH_MODE=anon` reste le mode par défaut"],
  integree="Déjà traité par l'amont + ton fork.",
  verifier="curl -s -o /dev/null -w '%{http_code}' https://opensky-network.org/api/states/all",
  notes="Avec un agent local, `adsb.lol` + un dongle RTL-SDR (~30 €) = zéro dépendance à un tiers et couverture locale. Voir P7.")

# ─────────────────────────────────────────────────────────── 5 · 3D splats
T(id="aholo-viewer", nom="aholo-viewer (Manycore)", cat=C_3D, statut="absent", prix="materiel", licence="MIT (1 k★)", tier=0,
  role="Renderer 3DGS + mesh haute perf avec *Chunked Streaming LOD* (jusqu'à 1 Md splats en navigateur, WebGPU/WebGL2). Le saut visuel de la tour : friches/patrimoine/chantiers scannés dans le globe.",
  urls=["https://github.com/manycoretech/aholo-viewer", "https://aholojs.dev/en-US/manual/getting-started/", "https://www.npmjs.com/package/@manycore/aholo-viewer"],
  install=["[A] `npm i @manycore/aholo-viewer` (Node ≥ 22.22.1, pnpm pour le monorepo)",
           "[B] Suivre **leur `docs/ai/skills/use-aholo-viewer/SKILL.md`** : il est écrit pour un agent d'implémentation",
           "[C] Créer `src/splats.js` : conteneur monté sur la scène Cesium (ancrage géo via `SplatMesh` transform)",
           "[D] Vérifier dans un navigateur avec WebGPU (Chrome ≥ 113) ; repli WebGL2"],
  integree="Nouveau calque `splats` dans `displayOptions.js` ; partage d'URL via le pattern `sharelink.js`.",
  verifier="node -e \"import('@manycore/aholo-viewer').then(m=>{if(!m)process.exit(1);console.log('ok')}).catch(()=>process.exit(1))\"",
  notes="Le repo amont est **conçu pour le pilotage par agent** (AGENTS.md + skills) : c'est le cas d'usage n°1 de « copier un repo public et l'adapter ». Sous-module `external/egs-core` → cloner avec `--recurse-submodules`.")

T(id="aholo-splat-transform", nom="@manycore/aholo-splat-transform", cat=C_3D, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="CLI de préparation des splats : formats (SPZ optimisé), découpe en chunks/LOD pour le streaming, et **génération des collisions** (marcher dans le scan).",
  urls=["https://www.npmjs.com/package/@manycore/aholo-splat-transform", "https://github.com/manycoretech/aholo-viewer/tree/master/packages"],
  install=["[A] `npm i -g @manycore/aholo-splat-transform`",
           "[B] `aholo-splat-transform scan.ply --format spz --lod --out site/`",
           "[C] Collisions : `--collider` (mesh simplifié) → à brancher sur un contrôleur de déplacement",
           "[D] Servir le dossier en statique (le viewer charge les chunks à la demande)"],
  integree="Pipeline `scripts/prepare-splat.sh` appelé par l'agent après chaque capture.",
  verifier="aholo-splat-transform --help | head -5",
  notes="C'est l'outil qui rend le 3DGS *utilisable* sur une tour : sans LOD/streaming, une scène de 20 Go plante le poste.")

T(id="brush", nom="Brush", cat=C_3D, statut="absent", prix="materiel", licence="Apache-2.0 (5 k★)", tier=2,
  role="Entraînement 3DGS/2DGS **local et gratuit** depuis tes photos/vidéos : tu n'achètes pas le scanner, tu produis les splats.",
  urls=["https://github.com/ArthurBrussee/brush", "https://github.com/ArthurBrussee/brush#installation"],
  install=["[A] `cargo install brush` ou télécharger le binaire release (Rust, CUDA/Metal)",
           "[B] Préparer un dossier de 50-300 photos d'un site (recouvrement 80 %)",
           "[C] `brush data=./site/ --output_dir ./out` puis `brush eval`",
           "[D] Convertir `./out/*.ply` avec aholo-splat-transform"],
  integree="`scripts/capture-to-globe.sh` : photos → splats → LOD → calque de la tour.",
  verifier="brush --help | head -3",
  notes="GPU nécessaire (~8-24 Go). Sans GPU : Colab (T4 gratuit) ou le cloud aholo3d (freemium, à éviter pour la souveraineté).",
  gpu="NVIDIA/AMD/Metal requis")

T(id="postshot", nom="Postshot", cat=C_3D, statut="reference", prix="materiel", licence="gratuit (⚠️ licence à vérifier)", tier=1,
  role="GUI Windows capture → splats (le plus doux pour un non-technicien). Utile pour produire tes scans sans CLI.",
  urls=["https://github.com/PostshotApp/postshot-desktop", "https://www.postshot.ai"],
  install=["[A] Télécharger la release GitHub",
           "[B] Importer photos/vidéo → entraîner → exporter .ply/.splat",
           "[C] Passer le résultat par aholo-splat-transform pour le LOD"],
  integree="Étape amont manuelle ; la tour consomme le `.spz`.",
  verifier="—",
  notes="Vérifier la licence avant d'en faire une dépendance ; sinon Brush.")

T(id="opensplat", nom="OpenSplat / gsplat.tech", cat=C_3D, statut="reference", prix="materiel", licence="MIT", tier=None,
  role="Viewer + éditeur de splats dans le navigateur (nettoyage, cadrage, export) ; gsplat.tech pour visualiser des scans CC.",
  urls=["https://github.com/ElleXav/OpenSplat", "https://opensplattime.org", "https://gsplat.tech"],
  install=["[A] Ouvrir OpenSplat (web), charger le `.ply`, supprimer les floches, exporter",
           "[B] Télécharger des datasets CC-4 (ex. scans partagés) pour tester la couche splats sans rien capturer"],
  integree="Prévisualisation pendant le dev de `src/splats.js`.",
  verifier="—",
  notes="Les datasets de démo sont souvent CC-BY/CC-4 : citer la source si tu exposes.")

T(id="aholo-platform", nom="Aholo Platform (cloud)", cat=C_3D, statut="reference", prix="freemium", licence="service propriétaire", tier=None,
  role="Génération de splats depuis images/vidéo sur le cloud du constructeur (la vidéo n°11 en parle comme accompagnement du repo).",
  urls=["https://www.aholo3d.com"],
  install=["[A] Non requis : Brush + Postshot font pareil en local",
           "[B] Si un jour tu manques de GPU : uploade, récupère le .ply, puis supprime les données du service"],
  integree="Non.",
  verifier="—",
  notes="⚠️ Comptes/crédits + tes photos chez un tiers. Le viewer GitHub reste MIT et gratuit : ne pas confondre les deux.")

# ─────────────────────────────────────────────────────────────── 6 · Voix
T(id="faster-whisper", nom="faster-whisper", cat=C_VOICE, statut="absent", prix="materiel", licence="MIT (25,2 k★)", tier=0,
  role="STT Python rapide (CTranslate2) pour transcrire mémos, radios, réunions. Plus simple à brancher que whisper.cpp si tu es déjà en Python.",
  urls=["https://github.com/SYSTRAN/faster-whisper"],
  install=["[A] `pip install faster-whisper`",
           "[B] Sans GPU : `WhisperModel('base','cpu','int8')` (int8 = x2 et tient en RAM)",
           "[C] `segments,_ = model.transcribe(audio, language='fr', vad_filter=True)`",
           "[D] Service : `docker run -p 127.0.0.1:9000:9000 ghcr.io/fedirz/faster-whisper-server:latest`"],
  integree="src/voice/sttLocal.js (file d'attente + transcription → champ texte de `chatConsole`).",
  verifier="python3 -c \"from faster_whisper import WhisperModel;WhisperModel('tiny','cpu','int8');print('ok')\"",
  notes="`base` FR ≈ correct, `small` nettement mieux ; GPU = x5-x20.")

T(id="piper", nom="Piper TTS", cat=C_VOICE, statut="absent", prix="materiel", licence="MIT (moteur) / voix CC-BY", tier=0,
  role="TTS neural sur **CPU**, quasi instantané — la voix par défaut de la tour, choisie aussi par le projet `ada_local` pour ne pas consommer de VRAM.",
  urls=["https://github.com/rhasspy/piper", "https://huggingface.co/rhasspy/piper-voices", "https://github.com/OHF-Voice/piper1-gpl"],
  install=["[A] `pip install piper-tts` (ou `piper1-gpl`)",
           "[B] Voix FR : télécharger `fr_FR-siwis-medium.onnx` + `.onnx.json` depuis le dépôt HF `piper-voices` (chemin `fr/fr_FR/siwis/medium/`) — repli `fr_FR-fr_FR-medium`",
           "[C] Test : `echo 'Tour opérationnelle.' | piper --model fr_FR-siwis-medium.onnx --output_file out.wav`",
           "[D] Serveur : `docker run -p 127.0.0.1:5002:5000 --rm -v $PWD/voices:/voice ghcr.io/rhasspy/piper:latest`"],
  integree="Remplace la voix du navigateur dans `freeVoice.js` (garde le Web Speech en repli si `PIPER=off`).",
  verifier="ls voices/*.onnx && piper --list-voices 2>/dev/null | head -3",
  notes="Voix monocorde mais 0 latence GPU. Qualité supérieure → Qwen3-TTS (nécessite GPU).")

T(id="qwen3-tts", nom="Qwen3-TTS", cat=C_VOICE, statut="absent", prix="materiel", licence="Apache-2.0", tier=1,
  role="TTS open source SOTA (janv. 2026) : clonage de voix sur 3 s, design de voix par description, contrôle d'émotion/rythme, 10 langues **dont le français**, ~97 ms de latence, 0,6 B ≈ 4 Go VRAM.",
  urls=["https://github.com/QwenLM/Qwen3-TTS", "https://huggingface.co/spaces/Qwen/Qwen3-TTS", "https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi", "https://github.com/flybirdxx/ComfyUI-Qwen-TTS"],
  install=["[A] `pip install -U qwen3-tts` (+ `pip install flash-attn --no-build-isolation` pour économiser la VRAM)",
           "[B] Poids : `huggingface-cli download Qwen/Qwen3-TTS-12Hz-0.6B` (≈ 1,5 Go ; 1,7 B ≈ 4 Go)",
           "[C] Serveur OpenAI-compatible : `git clone https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi && docker compose up qwen3-tts-gpu` → `http://127.0.0.1:8880/v1/audio/speech`",
           "[D] La tour appelle cet endpoint ; sans GPU : rester sur Piper, ou Colab T4 gratuit"],
  integree="src/voice/ttsLocal.js : `PIPER` par défaut, `QWEN_TTS_URL` si l'endpoint répond (détection au boot).",
  verifier="curl -s http://127.0.0.1:8880/v1/models | head -c 120",
  notes="La vidéo n°7 montre ça dans ComfyUI : le workflow est pratique pour itérer, mais pour la tour un **endpoint HTTP** est plus simple à brancher. Cloner **ta** voix ; pas celle d'un tiers sans son accord.")

T(id="kokoro", nom="Kokoro-82M", cat=C_VOICE, statut="reference", prix="materiel", licence="Apache-2.0", tier=0,
  role="TTS ultra-léger (82 M) avec voix FR, tourne sur CPU correctement. Bon compromis entre Piper (moche) et Qwen (GPU).",
  urls=["https://github.com/resemble-ai/kokoro", "https://huggingface.co/hexgrad/Kokoro-82M"],
  install=["[A] `pip install kokoro-onnx soundfile`",
           "[B] Télécharger `kokoro-v1.0.onnx` + `voices.bin`",
           "[C] `python -c \"from kokoro import KPipeline; KPipeline(lang_code='f')('Tour prête.')\"` (lang `f` = français)"],
  integree="Candidat n°2 pour `ttsLocal.js`.",
  verifier="python3 -c 'import kokoro_onnx;print(\"ok\")'",
  notes="Qualité/naturalité > Piper, coût CPU raisonnable. Voix FR moins expressive que Qwen3-TTS.")

T(id="openwakeword", nom="openWakeWord", cat=C_VOICE, statut="absent", prix="materiel", licence="Apache-2.0", tier=0,
  role="Mot d'éveil hors-ligne (« tour », « veille »…) : ce qui manque pour que la voix de la tour soit utilisable sans bouton.",
  urls=["https://github.com/dscripka/openWakeWord", "https://github.com/dscripka/openWakeWord/releases"],
  install=["[A] `pip install openwakeword`",
           "[B] Télécharger un modèle (ou en entraîner un sur 15-30 échantillons de **ta** voix)",
           "[C] Boucle : 16 kHz PCM → `model.predict(frame)` > 0,5 → armer le STT"],
  integree="src/voice/wakeWord.js (worker), micro en continu, zéro cloud.",
  verifier="python3 -c 'import openwakeword;print(\"ok\")'",
  notes="Faux positifs en ambiance bruitée : exiger 2 frames > 0,6 + fenêtre de vérouillage 1,5 s.")

# ─────────────────────────────────────────────────── 7 · Agents & automatisation
T(id="hermes-agent", nom="Hermes Agent (Nous Research)", cat=C_AGENT, statut="absent", prix="materiel", licence="MIT (241 k★)", tier=0,
  role="Agent auto-améliorant : skills persistés, mémoire 3 couches, outils, MCP, 15+ fournisseurs de modèles dont Ollama. **C'est le runtime que `reaserch-engine/docs/ARCHITECTURE_HERMES_INTEGRATION.md` vise déjà.**",
  urls=["https://github.com/NousResearch/hermes-agent", "https://hermes-agent.nousresearch.com/docs/"],
  install=["[A] `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash` (lire avant)",
           "[B] `hermes setup` → provider : `ollama` + base_url `http://127.0.0.1:11434` → 0 clé",
           "[C] `hermes model` pour choisir `qwen3:4b`/`llama3.1:8b` ; `hermes tools` pour l'état",
           "[D] `hermes` (CLI) puis créer un skill local `watchtower-osint` (recherche, scan, rapport)"],
  integree="Le moteur de recherche devient un skill ; l'agent exécute, le moteur garde la vérité (principe de ton doc : ne pas refaire un framework).",
  verifier="hermes --version 2>/dev/null || echo 'à relancer après install'",
  notes="Version managée payante (~3 $/mois) : inutile, l'auto-hébergement est la voie prévue par ton architecture.")

T(id="openclaw", nom="OpenClaw", cat=C_AGENT, statut="reference", prix="materiel", licence="⚠️ vérifier la LICENSE courante (GitHub: NOASSERTION)", tier=0,
  role="Agent personnel « always-on » (gateway 18789, messageries, skills, cron). Très populaire en 2026.",
  urls=["https://github.com/openclaw/openclaw", "https://docs.openclaw.ai"],
  install=["[A] Node ≥ 22.14 ; `npm i -g openclaw` puis `openclaw onboard`",
           "[B] Service : `openclaw gateway install` + `systemctl --user enable --now openclaw-gateway`",
           "[C] Configurer un provider Ollama ; workspace `~/.openclaw` (⚠️ contient des secrets : 600)",
           "[D] ⚠️ Relire la **license du tag installé** avant tout usage public ou distribution"],
  integree="Concurrent de Hermes : choisir UN runtime. Hermes = skills appris + MIT clair ; OpenClaw = messageries + always-on.",
  verifier="openclaw --version 2>/dev/null",
  notes="388 k★ mais licence affichée ambiguë par l'API GitHub : à clarifier avant d'en faire une dépendance de la tour.")

T(id="openhands", nom="OpenHands", cat=C_AGENT, statut="reference", prix="materiel", licence="MIT", tier=1,
  role="Agent de code autonome (edite, exécute, teste) : le remplaçant libre de Cursor/Claude Code pour les grosses mécaniques.",
  urls=["https://github.com/All-Hands-AI/OpenHands", "https://docs.all-hands.dev"],
  install=["[A] `pip install openhands` (ou `docker run -it --pull=never -v /var/run/docker.sock:/var/run/docker-runtime allhandsai/openhands:latest`)",
           "[B] `openhands config` → LLM : `ollama/qwen3:30b-a3b` (⚠️ un 8B code mal : viser ≥ 30 B ou une clé gratuite)",
           "[C] Sandbox : Docker obligatoire pour lui laisser toucher des fichiers"],
  integree="Les tâches de refactor lourdes (P1/P5) peuvent lui être confiées, sous revue de diff.",
  verifier="openhands --version 2>/dev/null",
  notes="Nécessite un bon modèle : sur un petit modèle local, il fait plus de dégâts que de bien. À utiliser avec garde-fous (branche dédiée, diffs revus).",
  gpu="GPU fortement conseillé (ou secours cloud gratuit)")

T(id="open-webui", nom="Open WebUI", cat=C_AGENT, statut="absent", prix="materiel", licence="BSD-3 (+ clause de marque >50 users)", tier=0,
  role="ChatGPT local dans le navigateur : multi-modèles, RAG sur tes fichiers, outils/fonctions, pipelines. L'interface humaine au-dessus d'Ollama.",
  urls=["https://github.com/open-webui/open-webui", "https://docs.openwebui.com/getting-started/quick-start/"],
  install=["[A] `docker run -d --name wt-openwebui -p 127.0.0.1:3005:8080 -v openwebui:/app -e OLLAMA_BASE_URL=http://host.docker.internal:11434 ghcr.io/open-webui/open-webui:main`",
           "[B] Premier compte = admin, **local uniquement** (ne jamais exposer 0.0.0.0 sans proxy auth)",
           "[C] Documents → déposer le corpus → les chunks servent de RAG sans Qdrant",
           "[D] (option) activer Whisper/Piper intégrés"],
  integree="Console humaine de la tour ; `reaserch-engine` peut y lire des knowledge bases.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3005/health",
  notes="Au-dessus de ~50 users la clause de branding s'applique → sans objet pour une tour. Alternative 100 % sans conteneur : `pip install open-webui`.")

T(id="jan", nom="Jan", cat=C_AGENT, statut="reference", prix="materiel", licence="Apache-2.0 (40 k★)", tier=0,
  role="App desktop 100 % offline, MCP, gestion de modèles GGUF. L'alternative « je veux un .exe propre et libre ».",
  urls=["https://github.com/menloresearch/jan", "https://jan.ai/download"],
  install=["[A] Télécharger Jan (Win/mac/Linux)",
           "[B] Installer un modèle depuis le hub intégré (ou pointer `~/.jan/models`)",
           "[C] Activer le serveur local `http://localhost:1337/v1` = endpoint pour la tour"],
  integree="Repli de confort quand Ollama n'est pas voulu.",
  verifier="curl -s http://127.0.0.1:1337/v1/models",
  notes="Plus limité côté RAG/agents qu'Open WebUI.")

T(id="activepieces", nom="Activepieces", cat=C_AGENT, statut="absent", prix="materiel", licence="MIT", tier=0,
  role="Automatisation (le « boring » qui rapporte dans la vidéo n°3) : veille de flux, triage de boîte mail, briefing matin, alertes Telegram, runs illimités en self-host. **MIT là où n8n est fair-code.**",
  urls=["https://github.com/activepieces/activepieces", "https://docs.activepieces.com/docs/activepieces/setup/installation"],
  install=["[A] `docker run -d --name wt-pieces -p 127.0.0.1:4200:4200 -e AP_API_KEY=$(openssl rand -hex 16) -e DATABASE_URL=postgresql://... -v pieces:/root/.activepieces activepieces/activepieces:latest` (voir `audit/stack/docker-compose.yml`, déjà prêt)",
           "[B] Ouvrir http://localhost:4200 → créer un flow `INBOX triage` (trigger IMAP → agent LLM Ollama → label + Telegram)",
           "[C] Importer les flows JSON de `audit/stack/flows/` (si présents)",
           "[D] Cron : `0 7 * * 1-5` pour le briefing de la tour"],
  integree="Peut déclencher l'API de la tour, publier l'état quotidien dans un canal, et lancer `reaserch-engine` sur des sujets.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4200/health",
  notes="n8n : 203 k★ mais **Sustainable Use License** (non-OSI) + fonctions enterprise → garder Activepieces comme choix par défaut.")

T(id="n8n", nom="n8n", cat=C_AGENT, statut="reference", prix="materiel", licence="⚠️ fair-code (Sustainable Use, non-OSI)", tier=0,
  role="Automatisation la plus populaire ; la vidéo n°3 la donne comme outil de métier.",
  urls=["https://github.com/n8n-io/n8n", "https://docs.n8n.io/hosting/"],
  install=["[A] `docker run -d --name n8n -p 127.0.0.1:5678:5678 -v n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n`",
           "[B] ⚠️ Licence : usage interne OK, revente de service = payant ; des features sont enterprise-only"],
  integree="Pas de dépendance dans la tour : si besoin, passer par notre couche `audit/stack/flows` (agnostique).",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5678/healthz",
  notes="Acceptable pour toi en usage perso, mais ce n'est **pas** du logiciel libre : à dire clairement si tu publies.")

T(id="scriberr", nom="Scriberr", cat=C_VOICE, statut="reference", prix="materiel", licence="MIT (3 k★)", tier=0,
  role="Transcription de réunions/audios en Docker (Whisper dedans) : si tu veux une UI de transcription sans écrire le pont.",
  urls=["https://github.com/rishikanthc/Scriberr", "https://scriberr.app"],
  install=["[A] `docker run -d -p 127.0.0.1:8090:8080 -v scriberr:/data ghcr.io/rishikanthc/scriberr:latest`",
           "[B] Uploader → SRT/TXT ; ou skip : faster-whisper + 20 lignes de Python"],
  integree="Peut servir de « voutre de transcriptions » indexée par le RAG.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090",
  notes="Petit projet mono-mainteneur : épingler l'image, ne pas en dépendre pour le cœur.")

# ───────────────────────────────────────────────── 8 · Communications
T(id="reticulum", nom="Reticulum (RNS)", cat=C_COM, statut="absent", prix="materiel", licence="AGPL-3.0 (logiciel)", tier=0,
  role="Stack réseau chiffrée multi-média (LoRa, Wi-Fi, TCP, HF) sans IP, par destinations cryptographiques. Canal de secours pair-à-pair, auto-hébergé par la tour.",
  urls=["https://github.com/softwaregroupdm/reticulum", "https://reticulum.network", "https://rmap.world", "https://github.com/buildwithparallel/crosstalk", "https://columba.network"],
  install=["[A] `python3 -m venv .venv && pip install RNS LXMF RNS-Interface-Plugin-TCP`",
           "[B] `~/.reticulum/config` : mode **local/LAN par défaut** (`interface_only`, `enabled: True` sur TCP), announcements à `enabled: True` seulement si tu choisis d'être public",
           "[C] `python -m RNS.daemon` puis client : `pip install sideband` ou CrossTalk",
           "[D] Vérifier : `rnsd` log → destination générée ; test en envoyant un LXMF à ta propre destination",
           "[E] ⚠️ Ne jamais ouvrir un nœud TCP public sans firewall + `interface_only` + limites de taux"],
  integree="`src/meshNodes.js` : afficher les nœuds announced (rmap) + l'état du canal dans le globe ; la tour peut **envoyer** une alerte par Reticulum quand internet tombe.",
  verifier="python3 -c 'import RNS;print(RNS.__version__)' 2>/dev/null || echo absent",
  notes="Logiciel 0 €. Le LoRa réel demande du matériel (~15-40 €). Exposer un backbone = responsabilité (abus, relai de trafic) : par défaut, garder privé.")

T(id="meshtastic", nom="Meshtastic", cat=C_COM, statut="reference", prix="option-publique", licence="GPL-3.0 (fw/apps) + matériel", tier=None,
  role="Mesh LoRa texte longue portée : 1 repeater + 3 radios ≈ 100 acres ; mesh municipal autonome (Austin). Zéro abonnement.",
  urls=["https://meshtastic.org", "https://github.com/meshtastic/firmware", "https://meshtastic.org/docs/getting-started/hardware-suggestions/"],
  install=["[A] ⚫ Achat : 2 radios minimum (Heltec V3 ≈ 25 €, RAK4631 ≈ 35 €, T-Echo ≈ 70 €)",
           "[B] Flasher le firmware depuis https://flasher.meshtastic.org (USB, gratuit)",
           "[C] App Android/iOS → joindre le canal long-fast, configurer la région 868 MHz (Europe)",
           "[D] Pont vers la tour : activer le **MQTT** du nœud puis `meshtastic-mqtt-bridge.js` → calque `meshNodes.js`",
           "[E] Agent : peut tout faire SAUF acheter et visser les antennes"],
  integree="Calque « contacts mesh » sur le globe + alertes de la tour qui partent par mesh quand le net tombe.",
  verifier="mosquitto_sub -h <noeud> -t msh/2/e/# 2>/dev/null | head -3",
  notes="⚠️ Réglementation 868 MHz (puissance/duty), pas d'usurpation, pas de contenu illicite. Le seul vrai coût matériel de tout cet audit.")

T(id="rtl-sdr", nom="RTL-SDR (option réception locale)", cat=C_COM, statut="reference", prix="materiel", licence="matériel ~30 € + logiciels libres", tier=None,
  role="Recevoir ADS-B (avions), AIS (navires), météo, poches radio **chez toi** : transforme la tour en nœud de données au lieu d'emprunté à un tiers.",
  urls=["https://www.rtl-sdr.com/buyers-guide/", "https://github.com/wiedehopf/tar1090", "https://github.com/adsb-feeder"],
  install=["[A] ⚫ RTL-SDR v4 (≈ 30 €) + antenne 1090 MHz",
           "[B] `git clone https://github.com/wiedehopf/tar1090 && sudo ./install.sh` (ou Docker)",
           "[C] `readsb --json` → le serveur de la tour sert ses **propres** positions, sans quota ni OpenSky"],
  integree="Calque avions/vaisseau « source locale », valeur souveraine énorme pour 30 €.",
  verifier="curl -s http://127.0.0.1:8080/data/aircraft.json | head -c 200",
  notes="Réception passive = légale ; ne pas émettre. Un des rares ajouts qui font vraiment monter la tour en gamme à coût minime.")

# ─────────────────────────────────────────────────── 9 · Mémoire & stockage
T(id="ai-memory-vault", nom="ai-memory-vault (jaredrhod)", cat=C_MEM, statut="reference", prix="materiel", licence="CC-BY-SA-4.0", tier=None,
  role="Mémoire d'agent **en markdown dans un vault Obsidian, sans base vectorielle** : patterns (profil, tâches, décisions, leçons). Le modèle à copier pour `HCSM`/`Cognitorium`.",
  urls=["https://github.com/jaredrhod/ai-memory-vault"],
  install=["[A] `git clone --depth 1 https://github.com/jaredrhod/ai-memory-vault memory-vault` pour **lire** la structure",
           "[B] Recréer chez toi `watchtower/memory/` avec les mêmes rôles (0 dépendance de licence : tu réécris les templates)",
           "[C] Règle d'or pour les agents : 1 fichier = 1 sujet, front-matter YAML (`sujet`, `maj`, `sources`), jamais de secret dedans",
           "[D] Index = `memory/INDEX.md` maintenu par l'agent à chaque tâche"],
  integree="`HCSM` écrit son état T0 dans `memory/` ; `reaserch-engine` y puise le contexte persistant.",
  verifier="test -f memory/INDEX.md && echo ok",
  notes="Choix délibéré : markdown > vector DB pour un usage personnel. Ouvrage partagé → obligation d'attribution/partage à l'identique (CC-BY-SA) sur les templates, pas sur tes notes.)")

T(id="obsidian", nom="Obsidian", cat=C_MEM, statut="reference", prix="materiel", licence="propriétaire gratuit (usage perso)", tier=None,
  role="Éditeur/visualiseur du vault markdown : c'est l'UI humaine de la mémoire de la tour.",
  urls=["https://obsidian.md", "https://help.obsidian.md"],
  install=["[A] Télécharger l'installeur (gratuit pour usage personnel, compte non obligatoire pour le local)",
           "[B] Ouvrir `watchtower/memory/` comme vault",
           "[C] Plugins optionnels : Dataview (requêtes sur front-matter), Templater"],
  integree="Aucune API nécessaire : les agents lisent/écrivent les fichiers, Obsidian n'est qu'un œil.",
  verifier="—",
  notes="Gratuit ≠ open source ; les **données** sont à toi (fichiers .md). Syncthing/git suffisent pour la synchro.")

T(id="syncthing", nom="Syncthing", cat=C_MEM, statut="reference", prix="materiel", licence="MPL-2.0", tier=0,
  role="Synchro/duplication P2P des dossiers de la tour (corpus, mémoire, scans 3D) vers NAS/portable, sans cloud.",
  urls=["https://github.com/syncthing/syncthing", "https://syncthing.net"],
  install=["[A] `sudo apt install syncthing` (ou paquet natif Win/mac)",
           "[B] `systemctl --user enable --now syncthing` → UI http://127.0.0.1:8384",
           "[C] Partager `corpus/`, `memory/`, `scans/` vers le 2e poste ; ne pas exposer l'UI"],
  integree="Sauvegarde des 40 Go de modèles non ; sauvegarde des **données produites**, oui.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8384/rest/2/system/status",
  notes="La sauvegarde est le point mort de 90 % des tours : ce point-là est à 0 € et 100 % automatisable.")

T(id="sqlite-vec", nom="SQLite + sqlite-vec", cat=C_MEM, statut="reference", prix="materiel", licence="MIT/Apache-2.0", tier=0,
  role="La base « un fichier » avec recherche vectorielle : l'option la plus légère si LanceDB/Qdrant sont trop.",
  urls=["https://github.com/asg017/sqlite-vec", "https://www.sqlite.org/intro.html"],
  install=["[A] `pip install sqlite-vec`",
           "[B] `CREATE VIRTUAL TABLE chunks USING vec0(embedding float[768]);`",
           "[C] Alimenté par `nomic-embed-text` (768 dim)"],
  integree="`persistence.py` du moteur a déjà un store JSON : ce n'est qu'un palier au-dessus.",
  verifier="python3 -c 'import sqlite_vec;print(\"ok\")'",
  notes="Simple, portable, sauvegardable par copie de fichier.")

# ─────────────────────────────────────────────────── 10 · Références & pièges
T(id="ada-local", nom="ada_local (Naz Louis)", cat=C_REF, statut="reference", prix="materiel", licence="❌ aucune licence (tous droits réservés)", tier=1,
  role="Référence **d'architecture** : routeur FunctionGemma 270 M (fine-tuné sur 200 exemples → 95 % de précision de routage, 1,0 s) → Qwen3 think/no-think → Piper sur CPU. C'est LE patron « moindre coût ».",
  urls=["https://github.com/nazirlouis/ada_local", "https://huggingface.co/nlouis/ada_model", "https://www.youtube.com/watch?v=7ffF3fumhcQ"],
  install=["[A] Lire le repo (structure + tests), ne **pas** dépendre du code ni du modèle (licence absente)",
           "[B] Réimplémenter : `src/ai/router.js` → petit modèle qui renvoie `{thinking: bool}` ; gros modèle derrière",
           "[C] Fine-tuner le routeur sur tes 150-250 exemples (20 min de GPU en Colab gratuit)",
           "[D] TTS CPU (Piper/Kokoro) pour ne pas manger la VRAM"],
  integree="Modèle de `src/ai/router.js` + `.env` `ROUTER=on|off`.",
  verifier="—",
  notes="⚠️ Son tutoriel complet est derrière un Patreon : pas besoin, le motif est simple et on le documente ici.")

T(id="mark-lii", nom="Mark-LII (FatihMakes)", cat=C_REF, statut="reference", prix="avec-compte", licence="❌ aucune licence dans le repo (GitHub: NOASSERTION)", tier=None,
  role="Référence UX du « Jarvis PC » : système de plugins (1 fichier = 1 compétence), awareness audio (savoir qu'on ne lui parle pas), sessions longues, écran + webcam.",
  urls=["https://github.com/FatihMakes/Mark-LII", "https://aistudio.google.com/apikey", "https://www.youtube.com/watch?v=u6c-6RF6J_g"],
  install=["[A] ⚠️ Ne pas fork ni redistribuer (aucune licence). Et le titre « gratuit » vend une Academy/Whop payante pour les versions récentes",
           "[B] Ce qui est copiable légalement (le comportement, pas le code) : `plugins/` chargés au boot, chaque plugin exportant `{nom, declencheurs, executer}`",
           "[C] Si un jour tu veux son runtime : il impose une **clé Gemini API** (gratuite avec compte) → chez toi on met Ollama à la place"],
  integree="Notre `src/plugins/` dans la tour, avec la même règle : un plugin cassé ne tue pas l'app (try/catch par module).",
  verifier="—",
  notes="Cas d'école de « open source sur GitHub » qui ne l'est pas juridiquement.")

T(id="gods-eye-view", nom="God's Eye View (amont de ta tour)", cat=C_GEO, statut="partiel", prix="materiel", licence="⚠️ README dit MIT, l'API GitHub renvoie NOASSERTION", tier=None,
  role="Le projet amont (17,9 k★) que ton fork adapte : globe + couches live + voix. Ta valeur ajoutée = le MODE GRATUIT sans clé et les modules FR.",
  urls=["https://github.com/bilawalsidhu/gods-eye-view", "https://www.youtube.com/watch?v=GRJaKcXZS94"],
  install=["[A] `git clone --depth 1 https://github.com/bilawalsidhu/gods-eye-view` puis appliquer `COGNITORIUM/watchtower-mods/APPLIQUER.md`",
           "[B] `npm install && npm run dev` → http://localhost:4173 (le repo `watchtower` en ligne est encore vide de l'app)",
           "[C] Vérifier le fichier `LICENSE` du commit `65bc522` et ouvrir une issue si ambigu",
           "[D] Ne pas remonter tes clés sur une instance partagée (`--host 0.0.0.0` = fuite de clés, averti par leur SECURITY.md)"],
  integree="C'est la base de la tour ; l'audit §0 décrit ce qui en a déjà été dérivé.",
  verifier="test -d app/node_modules && echo 'déjà en place'",
  notes="La ligne amont est claire : pas de recherche de personne, pas de visage, pas de pistage — à conserver.")

T(id="jared-fullstack", nom="fullstack-agent (jaredrhod)", cat=C_REF, statut="reference", prix="payant", licence="AGPL-3.0", tier=None,
  role="Installeur « tout-en-un » dont parle la vidéo n°5 : memory-vault + visualizer + backtalk + barehands.",
  urls=["https://github.com/jaredrhod/fullstack-agent"],
  install=["[A] ⚠️ Inutilisable sans **Claude Code** (abonnement) : son propre README le dit — donc payant dans les faits",
           "[B] Ce qu'on retient : un installeur qui **demande ce qu'on veut** (les 4 briques cochables) et un wizard qui finit par « ouvre ça dans ton navigateur »",
           "[C] Notre équivalent gratuit et lisible : `audit/stack/install-stack.{ps1,sh}` + `-DryRun`"],
  integree="Modèle d'UX de l'installeur, rien de plus.",
  verifier="—",
  notes="AGPL + dépendance à un SDK propriétaire : ne pas mettre dans la chaîne de build.")

T(id="tiers-gratuits-llm", nom="API LLM gratuites (secours, avec compte)", cat=C_REF, statut="reference", prix="avec-compte", licence="CGU des fournisseurs", tier=None,
  role="Filet quand le modèle local est trop court : raisonnement long, gros contexte, réécriture. ⚠️ ne jamais y envoyer de données sensibles.",
  urls=["https://console.groq.com/keys", "https://openrouter.ai/models?q=free", "https://aistudio.google.com/apikey", "https://ai.azure.com/... (GitHub Models : https://github.com/features/models)", "https://cerebras.ai"],
  install=["[A] Choix par défaut : **aucune** (Ollama local)",
           "[B] Groq : compte gratuit, 30 RPM / ~1 k req/j par modèle, pas d'entraînement → le meilleur secours",
           "[C] OpenRouter `:free` : ~20 RPM, 50-1000 req/j selon modèle ; attention à la politique de données par modèle",
           "[D] GitHub Models : 150-1000 req/j, pratique si tu as déjà un compte GitHub",
           "[E] Gemini AI Studio : Flash-Lite ~15 RPM / Flash réduit en 2026 ; ⚠️ Google peut entraîner sur les prompts hors UE/EEE",
           "[F] Les coller dans `.env` + `litellm.config.yaml` comme `fallbacks`, jamais en dur dans le code"],
  integree="`src/ai/llmClient.js` : local d'abord, `if (cloud) fallback` conscient avec bannière d'avertissement dans l'UI.",
  verifier="—",
  notes="Chiffres de quotas = début/mi 2026, à revérifier : les tiers gratuits sont le premier poste de régression d'une année.")

T(id="pistes-evitees", nom="À éviter (payant ou lock-in)", cat=C_REF, statut="reference", prix="payant", licence="—", tier=None,
  role="Liste négative : ce que les vidéos vendent comme « gratuit » et qui ne l'est pas (ou pas durable).",
  urls=["https://elevenlabs.io/pricing", "https://www.maltego.com/pricing/", "https://www.spiderfoot.net/pricing/", "https://app.make.com/pricing", "https://www.retellai.com/pricing", "https://lampyre.io/pricing", "https://si.social-links.io", "https://intelligencex.io", "https://www.whop.com/fatihmakes/", "https://www.patreon.com/cw/NazLouisYT"],
  install=["[A] ElevenLabs (5-99 $/mois) → Qwen3-TTS / Piper / Kokoro",
           "[B] OpenAI Realtime voice (centimes/min) → whisper + TTS local",
           "[C] ChatGPT/Claude abonnements → Ollama (+ secours Groq gratuit)",
           "[D] Perplexity Pro 20 $/mois → Vane + SearXNG",
           "[E] Make/Zapier (runs facturés) → Activepieces",
           "[F] Maltego Pro / Social Links / Lampyre / SpiderFoot HX / Intelligence X → SpiderFoot + Gephi + `intelTwin`",
           "[G] Whop/Patreon des créateurs Jarvis → on réécrit le motif",
           "[H] Google Maps billing (CB obligatoire, facturation au-delà de ~1000 sessions) → Esri + CARTO + Photon (déjà fait)",
           "[I] Shodan/APIs payantes → free tier + crt.sh + Amass + le mode passif"],
  integree="Cette table négative est celle que les agents doivent consulter avant d'ajouter une dépendance payante.",
  verifier="—",
  notes="Règle de conception de la tour : **toute** fonctionnalité a un chemin 0 € ; le payant n'est jamais un prérequis.")


# ─────────────── ajout 2026-09-05 : God's Eye 4D (Hormuz) + VPS (Bilawal Sidhu)
T(id="shadowbroker", nom="ShadowBroker (réf. amont)", cat=C_GEO, statut="reference", prix="materiel",
  licence="AGPL-3.0 (11,1 k★, actif)", tier=0,
  role="La V2 4D de « God's Eye View » déjà construite par quelqu'un d'autre : 60+ flux OSINT (ADS-B, AIS 25 000+ navires via aisstream.io, satellites, GPS jamming par dégradation NAC-P, pannes internet via IODA, SAR NASA OPERA/Copernicus EGMS, CCTV, Meshtastic, APRS, KiwiSDR, GDELT), 40 calques commutables, dossier pays au clic droit, toolkit de recon côté serveur **sans clé**, backend FastAPI self-host, aucun compte ni télémétrie, et un canal de commande pour agent (OpenClaw).",
  urls=["https://github.com/BigBodyCobain/Shadowbroker"],
  install=["[A] `git clone --depth 1 https://github.com/BigBodyCobain/Shadowbroker && cd Shadowbroker`",
           "[B] `docker compose pull && docker compose up -d` (frontend :3000, backend :8000 — `BACKEND_PORT` dans `.env` si collision)",
           "[C] **Ne pas l'adopter tel quel** : le faire comme banc d'essai, puis **piober les connecteurs** dans `watchtower-mods` (nos modules FR + notre startGate sans clé restent la base)",
           "[D] Désactiver/retirer avant toute publication les calques qui visent des **personnes** : superyachts de milliardaires, bases militaires, chefs d'État, Telegram de guerre. Notre ligne (audit §4.4) ne les admet pas",
           "[E] Clés optionnelles déjà prévues : `SHODAN_API_KEY` (gratuit avec compte) ; le reste fonctionne sans clé"],
  integree="Source de patterns pour 8 couches de la tour : `gpsJamming.js`, `darkVessels.js`, `satPasses.js`, `notams.js`, `outages.js`, `sarChanges.js`, `telegramPins.js`, `countryDossier.js`. Et surtout son **modèle serveur** : recon proxifiée côté backend + SSRF guard + auth opérateur local = exactement ce que notre tour doit imiter.",
  verifier="curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
  notes="AGPL : si tu **publies un service** dérivé, tu rediffuses les modifs (usage perso = aucun souci). Projet jeune (1 fork de migration de repo en mars 2026, README le dit) → ne jamais le mettre en dépendance de build, seulement en source d'idées et de connecteurs. **C'est la découverte la plus rentable de cet audit.**")

T(id="recorder-4d", nom="Enregistreur temporel (le vrai manque)", cat=C_GEO, statut="absent", prix="materiel",
  licence="à écrire (nous)", tier=0,
  role="La leçon des vidéos Hormuz : ce qui rend une tour « 4D », ce n'est pas un calque de plus, c'est **l'enregistrement continu** (il « enregistrait depuis le 25 février ») + une timeline réplayable. Sans ça, la tour est éternellement au présent et tout disparaît quand le cache du fournisseur se vide.",
  urls=["https://duckdb.org/docs/stable/guides/ingestion/ingesting_parquet.html", "https://cesium.com/learn/cesiumjs/ref-doc/Clock.html"],
  install=["[A] Un collecteur par flux, idempotent et bon marché : `collector.mjs` (OpenSky, aisstream, CelesTrak, EONET, USGS) toutes les 60 s → lignes NDJSON gzippées dans `data/4d/YYYY-MM-DD/`",
           "[B] Consolidation nocturne en DuckDB/Parquet : `duckdb -c \"COPY (SELECT * FROM read_ndjson_auto('data/4d/*/*.ndjson')) TO 'data/4d.parquet'\"`",
           "[C] API de lecture temporale dans le serveur dev : `GET /api/4d?from=..&to=..&layer=ais` → renvoie l'état à t",
           "[D] UI : brancher `viewer.clock` Cesium (CurrentTime + timeline scrubber, multiplicateur x3600) + un calque « trajectoires » (lignes datées, pointillés = trous de signal)",
           "[E] Règle de rétention : 30 j en chaud, compression ensuite — jamais de données personnelles, jamais de contenus sous copyright tiers archivés"],
  integree="`src/timeline/replayer.js`, `src/recorder/collectors/*.mjs`, et le calque `darkVessels.js` qui n'existe **que** grâce à l'historique (un trou dans l'AIS = une détection, sinon rien à détecter).",
  verifier="ls data/4d/ && sqlite3 data/4d.duckdb 'select count(*) from ais' 2>/dev/null || python3 -c \"import duckdb;print(duckdb.sql('select count(*) from \\u0027data/4d.parquet\\u0027').fetchone())\"",
  notes="Coût : 0 €. Disque : ~1-3 Go/mois pour 4-5 flux à 60 s. C'est le P8 prioritaire, avant tout nouveau calque.")

T(id="satellite-passes", nom="Prédictions de passage satellite (Skyfield + CelesTrak)", cat=C_GEO, statut="absent",
  prix="materiel", licence="MIT (Skyfield, sgp4) · CelesTrak = données gratuites", tier=0,
  role="Le calque « un satellite passe au-dessus de ce site à 14 h 07 » : TLE/OMM gratuits, propagation locale, liens avec les couches imagerie et alertes.",
  urls=["https://github.com/skyfielders/python-skyfield", "https://celestrak.org", "https://github.com/brandon-rhodes/python-sgp4"],
  install=["[A] `pip install skyfield sgp4`",
           "[B] Récupérer les TLE : `curl -s 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle' -o data/tle/visual.tle` (groupes utiles : `stations`, `geodetic` (imagerie), `military` n'existe pas → catalogue complet + filtrage par nom)",
           "[C] Prédire : `from skyfield.api import load, EarthSatellite; …` → `satellite.at(t).subpoint()` pour la trace, `pass_of(t0,t1)` pour l'AOS/LOS",
           "[D] Rafraîchir 2x/jour via cron (Activepieces ou systemd timer) — les TLE pourrissent en ~3 jours"],
  integree="`src/satPasses.js` : lignes de visée vers une zone suivie + fenêtre d'imagerie Sentinel-2 (nuages via Open-Meteo) → la tour dit **quand** photographier.",
  verifier="python3 -c 'import skyfield,sgp4;print(skyfield.__version__)'",
  notes="Space-Track (compte gratuit) = catalogue plus complet/à jour ; utile seulement si tu veux les objets classifiés légaux (USA-234 Topaz est public, lui).")

T(id="aisstream", nom="aisstream.io (flux AIS temps réel)", cat=C_GEO, statut="partiel", prix="avec-compte",
  licence="service gratuit, clé sur inscription", tier=0,
  role="WebSocket mondial d'AIS : c'est la source qui a permis l'analyse du détroit d'Ormuz (130 traversées/j → ~10, soit -92 %). L'amont de ta tour prévoyait déjà cette clé.",
  urls=["https://aisstream.io", "https://app.aisstream.io"],
  install=["[A] Inscription gratuite (e-mail) → clé",
           "[B] `wss://stream.aisstream.io/v0/stream` avec un message de souscription `{bounding_box, filters_type, mmsi}` — **se limiter à des bbox**, le flux mondial tuerait la tour",
           "[C] Parser avec `libais` (ou `pip install ais`) et écrire dans le `recorder-4d`",
           "[D] Sans clé : désactivation propre du calque (comportement actuel du fork — ne pas casser)"],
  integree="`src/vessels.js` (déjà prévu amont) + enregistrement → indispensable pour `darkVessels.js`.",
  verifier='python3 -c "import websockets;print(1)"',
  notes="La clé ne doit jamais transiter par le navigateur : côté serveur uniquement (modèle déjà appliqué par `shadowbroker`).")

T(id="pipe-gaps", nom="GlobalFishingWatch/pipe-gaps (navires sombres)", cat=C_GEO, statut="absent", prix="materiel",
  licence="Apache-2.0", tier=0,
  role="Détection de **trous temporels dans les messages de position AIS** : l'algo public derrière le phénomène « dark transit » décrit dans l'article (Jag Vasant : pointillés = passage sous escorte).",
  urls=["https://github.com/GlobalFishingWatch/pipe-gaps"],
  install=["[A] `git clone --depth 1 https://github.com/GlobalFishingWatch/pipe-gaps`",
           "[B] Le faire tourner sur **notre** Parquet de positions (pas leur infra GFW)",
           "[C] Configurer le seuil de trou (les données de zones denses sont bruitées : signaux s'annulent → exclure les détroits saturés hors cible)",
           "[D] Croiser avec un registre de pavillon pour le tri (Inde/Pakistan/Liberia/Comores dans le cas Hormuz)"],
  integree="`src/darkVessels.js` : le navire disparaît → un pointillé + une fiche « dernière position connue » ; **aucune** identification de personne, uniquement des entités maritimes.",
  verifier="python3 -c 'import pandas,shapely;print(\"deps gaps ok\")'",
  notes="La GFW API (clé gratuite) fournit déjà des événements `ais_gaps` prêts à l'emploi : commencer par l'API, puis passer au calcul local pour les zones qui intéressent la tour.")

T(id="notams", nom="NOTAM / fermetures d'espace aérien", cat=C_GEO, statut="absent", prix="materiel",
  licence="données publiques (FAA/EASA) ; parseurs MIT", tier=0,
  role="Les « airspace closures » en cascade que la vidéo 2 montre en timeline : la tour doit savoir où et quand le ciel est fermé.",
  urls=["https://notamweb.faa.gov", "https://github.com/svoop/notam", "https://www.easa.europa.eu/en/domains/airspaces"],
  install=["[A] Source : `GET https://notamweb.faa.gov/REST/AdcNotamSearch/api/v1/notam/list` (États-Unis) et Eurocontrol/EASA pour l'Europe ; en FR aussi l'INFOAéronautique (SIA)",
           "[B] Parser le format F-Series (regex ou `notam` gem MIT / `notam-parsers` JS) → `{icao, radius_nm, altitude, debut, fin}`",
           "[C] Alimenter le `recorder-4d` pour que les fermetures soient **réplayables**",
           "[D] Dessiner sur Cesium (cercles + fuseaux d'altitude, rouge = actif)"],
  integree="`src/airspace.js` (nouveau) + agrégat `nearbyPlaces.js` ; alerte quand une zone surveillée est couverte.",
  verifier="curl -s -o /dev/null -w '%{http_code}' https://notamweb.faa.gov/ 2>/dev/null || echo 'réseau à valider depuis la tour'",
  notes="Le parsing NOTAM est ingrat (format texte de 1970) : accepter un taux de faux positifs, et toujours afficher le texte brut à côté de l'interprétation.")

T(id="outages", nom="Surveillance des pannes internet (Cloudflare Radar / IODA / Restless)", cat=C_GEO, statut="absent",
  prix="avec-compte", licence="API gratuites (compte) ; Restless MIT", tier=0,
  role="Le calque « Téhéran en blackout » : corréler coupures réseau et événements, sur une timeline.",
  urls=["https://developers.cloudflare.com/radar/", "https://ioda.caida.org", "https://github.com/RIPE-NCC/restless", "https://radar.cloudflare.com"],
  install=["[A] Cloudflare Radar (gratuit, compte + jeton) : `GET /api/v1/networks/traffic/outages?countryCode=IR&since=…`",
           "[B] IODA (Georgia Tech, gratuit sans clé) : agrégat de connectivité par pays",
           "[C] En local : `docker run` de RIPE **Restless** (MIT) → surveillance des préfixes AS, alertes NRT en temps réel",
           "[D] Restless = le seul des trois qui ne dépend d'aucun tiers : à privilégier si la tour devient autonome"],
  integree="`src/outages.js` + un KPI `intelTwin.js` (« connectivité territoriale ») — très pertinent pour un usage FR (outre-mer, crises).",
  verifier="curl -s -o /dev/null -w '%{http_code}' https://api.cloudflare.com/client/v4/radar/datasets 2>/dev/null || echo 'nécessite jeton'",
  notes="API tier gratuit → prévoir cache 15 min et repli silencieux si le quota tombe.")

T(id="gdelt", nom="GDELT (événements mondiaux géolocalisés)", cat=C_OSINT, statut="absent", prix="materiel",
  licence="données ouvertes (usage gratuit, non commercial pour les gros volumes)", tier=0,
  role="Un point par événement géopolitique (manifestation, incident aérien, explosion…) avec date, lieu, tons émotionnels : la **couche temporelle** qui transforme une carte en 4D, sans aucune clé.",
  urls=["https://www.gdeltproject.org", "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/", "https://api.gdeltproject.org/api/v2/doc/doc"],
  install=["[A] DOC 2.0 API (GET, sans clé) : `curl 'https://api.gdeltproject.org/api/v2/doc/doc?query=location:FR&mode=artlist&format=json&maxrecords=50&timespan=1h'`",
           "[B] En gros volume : télécharger les 15-min GDELT 2.0 export CSV (3 GB/jour ⚠️ → ne garder que la bbox cible et 30 j)",
           "[C] GKG pour les tons : filtrer « conflict / protest » → pins colorés",
           "[D] Écrire dans le `recorder-4d` pour la lecture rétrospective"],
  integree="`src/gdelt.js` → pins « incidents » cliquables dans `ficheLieu` ; nourrit le MODE ANALYSE de `intelTwin`.",
  verifier="curl -s 'https://api.gdeltproject.org/api/v2/doc/doc?query=FRANCE&mode=artlist&format=json&maxrecords=1' | head -c 200",
  notes="⚠️ **Ne jamais transformer cette couche en surveillance de personnes** : agrégats thématiques/géographiques uniquement. GDELT est bruyant : toujours afficher la source, jamais une interprétation seule.")

T(id="sar-opera", nom="SAR : NASA OPERA + Copernicus EGMS + Sentinel-1", cat=C_GEO, statut="absent", prix="avec-compte",
  licence="données ouvertes (comptes Earthdata / Copernicus gratuits)", tier=0,
  role="Voir à travers les nuages et mesurer le déplacement du sol au millimètre : digues, friches, affaissements, glissements — le calque qui rend la tour utile **en France** (et ce que la vidéo 2 appelle le « ground change detection »).",
  urls=["https://search.earthdata.nasa.gov/search?q=OPERA", "https://asf.alaska.edu/datasets/operational-products/opera/", "https://egms.land.copernicus.eu", "https://dataspace.copernicus.eu"],
  install=["[A] Créer 2 comptes gratuits : **NASA Earthdata** et **Copernicus Data Space Ecosystem**",
           "[B] OPERA CSLC/DISP → ASF DAAC via `pip install asf-search` + earthaccess ; EGMS (Service TMP) → téléchargement GeoTIFF par bbox + `snap`/`gdal`",
           "[C] Sentinelsat : `pip install sentinelsat` → requête Sentinel-1 GRD avant/après un événement",
           "[D] Rendu : `gdal_calc` sur les paires → image de différence → calque Cesium (opacité + curseur temporel lié au `recorder-4d`)"],
  integree="`src/sar.js` (diff avant/après) + alertes de déformation sur les sites suivis (via l'API alertes d'EGMS).",
  verifier="python3 -c 'import asf_search;print(asf_search.__version__)'",
  notes="Traitement lourd : 20-60 s par interférométrie sur CPU, quelques minutes sur GPU → lancer en tâche de fond (Activepieces), jamais dans le cycle de rendu de la tour.")

T(id="gibis", nom="NASA GIBS + Copernicus Browser (imagerie quotidienne gratuite)", cat=C_GEO,
  statut="absent", prix="materiel", licence="domaine public / Copernicus (citer)", tier=0,
  role="Les images « before/after » du reportage, à 0 $ : tuiles WMTS quotidiennes MODIS/VIIRS/Sentinel-2, sans clé.",
  urls=["https://nasa-gibs.github.io/gibs-api-docs/", "https://worldview.earthdata.nasa.gov", "https://browser.dataspace.copernicus.eu"],
  install=["[A] Tuile test : `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-04/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`",
           "[B] Dans Cesium : `WebMapTileServiceImageryProvider` avec `Time` dans `GetResource` → tuiles datées → **déjà compatible avec le curseur temporel**",
           "[C] Sentinel-2 via Copernicus Browser pour le avant/après à 10 m ; PNA (Planet) = payant → ne pas promettre",
           "[D] Attribuer (« NASA GIBS », « Copernicus ») dans `DATA_SOURCES.md`"],
  integree="Calque `dailyImagery.js` dans la pile `mapStackController` (3e source gratuite, après Esri et CARTO).",
  verifier="curl -sI 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-04/GoogleMapsCompatible_Level9/5/16/11.jpg' | head -1",
  notes="La force de GIBS : c'est **temporel par conception**. Avec le recorder, la tour devient rétrospective sans aucun abonnement.")

T(id="eia-oil", nom="EIA API (futures et prix du carburant)", cat=C_GEO, statut="absent", prix="avec-compte",
  licence="données publiques US, clé gratuite immédiate", tier=0,
  role="Les courbes de brut du reportage (Brent, WTI, essai) synchronisées sur la timeline du globe.",
  urls=["https://www.eia.gov/api/", "https://www.eia.gov/opendata/"],
  install=["[A] Clé gratuite : https://www.eia.gov/opendata/register.php",
           "[B] `curl 'https://api.eia.gov/v2/petroleum/pri/spw/data?frequency=weekly&data[]=Price&facets[series_id]=EMD_EPD2D_PTE_SCA_DPC&api_key=***'`",
           "[C] Alternative zéro-clé à tester : `pip install open-meteo` (le fournisseur a une API de prix du carburant dans ~20 pays) + Yahoo/Stooq pour le brut (non redistribuable ⚠️)",
           "[D] Séries → mini-graphe dans `splitFlap`/`hudSummaryResponse`, aligné sur l'horloge du `recorder-4d`"],
  integree="`src/markets.js` + un KPI dans le bandeau `intelTwin.js`.",
  verifier="python3 -c 'import requests;print(requests.get(\"https://api.eia.gov/v2\",timeout=8).status_code)'",
  notes="⚠️ Les cotations (Bloomberg/Refinitiv) ne sont **pas** redistribuables : n'afficher que des données publiques (EIA) ou un lien sortant.")

T(id="desal-power", nom="Infrastructures critiques : désalination + centrales", cat=C_GEO, statut="absent",
  prix="materiel", licence="OSM (ODbL) / datasets à vérifier", tier=0,
  role="Le chapitre « Desalination Plants & The Water Crisis » : la tour doit connaître l'infrastructure vitale du territoire qu'elle surveille.",
  urls=["https://ida-desalination.org/publications/ida-desalination-performance-guide", "https://powerplants.copernicus.fr/", "https://openstreetmap.fr"],
  install=["[A] Centrales : dataset Copernicus « European Power Plants » (CC-BY, à re-vérifier) **ou** requête Overpass `power=plant` sur l'emprise (ODbL)",
           "[B] Désalination : pas de jeu ouvert mondial fiable → créer `data/critical/desalination.yml` (source par entrée, date de relevé, capacité) ; la GDIDA/WAVES est payante — ne pas promettre",
           "[C] Overpass : `curl -s 'https://overpass-api.de/api/interpreter' --data-urlencode 'data=[out:json];area[\"name\"=\"Hérault\"]->.a;node[power=plant](area.a);out;'`",
           "[D] Calque `criticalInfra.js` avec niveau de criticité + sources par entité (règle : aucune entité sans source datée)"],
  integree="KPI « civilisation territoriale » déjà dans `intelTwin.js` → devient alimenté par des données sourcées au lieu d'heuristiques.",
  verifier="curl -s 'https://overpass-api.de/api/interpreter?data=[out:json];node[power=plant](43.4,3.0,43.8,4.0);out%205;' | head -c 200",
  notes="La valeur ajoutée ici, c'est **la rigueur des sources**, pas la quantité de points. Chaque entité : lien + date + licence.")

T(id="hloc", nom="hloc (localisation visuelle 6-DoF)", cat=C_VPS, statut="absent", prix="materiel",
  licence="Apache-2.0 (4,2 k★)", tier=1,
  role="La version **libre et auto-hébergée** du VPS montré avec les Ray-Bans : image requête → retrieval + SuperPoint/SuperGlue → pose 6-DoF contre un modèle SfM. Centimétrique, hors-ligne, aucune API.",
  urls=["https://github.com/cvg/Hierarchical-Localization", "https://github.com/cvg/SuperGluePretrainedNetwork"],
  install=["[A] `git clone --recurse-submodules https://github.com/cvg/Hierarchical-Localization && pip install -e .` + `pip install pycolmap`",
           "[B] Construire la carte : `python hloc/run_all.py --dataset path/to/site --sfm glomap|colmap --features local` (SuperPoint+SuperGlue)",
           "[C] Localiser une photo : étape 5 du pipeline → `predictions.h5` (position + orientation)",
           "[D] Version moderne plus rapide : `pablovela5620/hloc-glomap` (Apache-2.0, Pixi + UI Gradio + Rerun)"],
  integree="Anchoring des calques : positionner une caméra CCTV, un drone ou un téléphone **dans** le scan 3DGS, puis relier « qui regarde quoi » dans `cctvFocusPolicy.js` / `intelTwin.js`.",
  verifier="python3 -c 'import hloc;print(\"hloc ok\")'",
  notes="GPU fortement conseillé. C'est le chemin 100 % gratuit quand Google/Niantic/MultiSet coûtent ou exigent un compte — et le seul qui marche sans réseau sur un site isolé.",
  gpu="6 Go+ recommandé (PyTorch)")

T(id="colmap", nom="COLMAP (SfM de référence)", cat=C_VPS, statut="absent", prix="materiel",
  licence="new BSD (le fichier LICENSE l'affirme ; GitHub renvoie NOASSERTION ⚠️)", tier=0,
  role="Reconstruction 3D + poses caméra à partir de photos : c'est la « 3D map pré-scanée » dont parle la vidéo — l'intrant de hloc **et** des splats.",
  urls=["https://github.com/colmap/colmap", "https://colmap.github.io"],
  install=["[A] `sudo apt install colmap` (ou binaire release ; GUI dispo)",
           "[B] CLI sans GUI pour un agent : `colmap feature_extractor && colmap exhaustive_matcher && colmap mapper && colmap bundle_adjuster`",
           "[C] Sortie `sparse/0/` → directement consommé par Brush (3DGS) et par hloc",
           "[D] ⚠️ **GLOMAP** (le successeur 10-100x plus rapide) est marqué `[DEPRECATED]` sur `colmap/glomap` depuis janv. 2026 : ne pas en faire une dépendance, tester `hloc-glomap` en option seulement"],
  integree="`scripts/photo-to-model.sh` : 150 photos d'un site → COLMAP → Brush → splats → ancrage via hloc.",
  verifier="colmap help >/dev/null && echo 'colmap ok'",
  notes="⚠️ Cas d'école de la règle n°4 du §0 : la licence est bonne (BSD) mais **l'API GitHub ne la voit pas** → vérifier le fichier LICENSE, pas l'auto-détection.")

T(id="arcore-geospatial", nom="Google ARCore Geospatial API", cat=C_VPS, statut="reference", prix="avec-compte",
  licence="gratuit (sans facturation à l'appel), quota + compte obligatoire", tier=None,
  role="Le VPS « mondial » par défaut : Localisation VLM sur 15 ans d'images Street View dans 100+ pays. C'est ce que l'auteur a construit chez Google.",
  urls=["https://developers.google.com/ar/develop/geospatial", "https://developers.google.com/ar/develop/geospatial/android/placecolors"],
  install=["[A] ⚠️ Nécessite un device ARCore compatible + le SDK Google AR : **pas embarquable dans la tour web**, utilisable depuis une app mobile",
           "[B] Si tu veux le tester : Android Studio + `com.google.ar:core` + API activée dans un projet Google Cloud (clé gratuite, quota)",
           "[C] Pour nous : **garder hloc en local**, et considérer ARCore uniquement comme benchmark de précision"],
  integree="Non (dépendance mobile + compte Google). Pattern utile : « match image → modèle 3D », c'est exactement `hloc`.",
  verifier="—",
  notes="Gratuit mais : indoor = mort, zones sans Street View = mort, et tes images partent chez Google. Les deux cas où l'on paie ou où l'on est bloqué sont précisément ceux où hloc gagne.")

T(id="niantic-vps", nom="Niantic Spatial VPS + Scaniverse", cat=C_VPS, statut="absent", prix="avec-compte",
  licence="gratuit < 50 k MAU (VPS/ARDK) ; Scaniverse = app gratuite + crédits", tier=None,
  role="Le VPS communautaire : 30 Md de photos issues de Pokémon GO/Ingress, et **Scaniverse** qui produit des splats 3D + maps VPS depuis un téléphone — la chaîne complète « capture → ancrage ».",
  urls=["https://www.nianticspatial.com/products/visual-positioning-system", "https://scaniverse.com", "https://www.nianticspatial.com/en/faq/scaniverse"],
  install=["[A] Scaniverse (iOS ≥ 13, ARKit) : scanner un site → exporter Gaussian Splats / mesh → **alimente directement P6 de la tour**",
           "[B] Scaniverse est également open source (viewer GitHub) → vérifier la licence avant intégration",
           "[C] Lightship/ARDK VPS : gratuit en dessous de 50 000 utilisateurs actifs mensuels → très largement suffisant ; compte développeur requis",
           "[D] Coverage FR = dense en villes, vide en rural : tester sur le site cible avant de promettre quoi que ce soit"],
  integree="`scripts/scan-to-globe.sh` : Scaniverse export `.splat` → aholo-splat-transform (SPZ + LOD + collisions) → calque de la tour. Le VPS de Niantic, lui, ne sert pas si on reste en local.",
  verifier="—",
  notes="Le meilleur compromis capture/gratuit pour un **site précis** (ton domicile, une friche, un poste de garde). Attention : tes scans partent dans leur cloud → lire la politique, et ne scanner aucun site sensible.")

T(id="multiset-vps", nom="MultiSet AI (VPS commercial)", cat=C_VPS, statut="reference", prix="freemium",
  licence="service propriétaire (SDK Unity/iOS/Android/WebXR/Quest/ROS 2)", tier=None,
  role="Le VPS utilisé dans la vidéo Ray-Ban : scan-agnostique (E57, Matterport, PLY, **3DGS**, Polycam, NavVis, Leica, XGRIDs, captures 360°), 6-DoF annoncé **« < 10 cm »** au départ à froid, indoor-extérieur via indice GNSS, multi-utilisateur, et — seul point décisif — **supporte le SDK Meta Ray-Ban**.",
  urls=["https://www.multiset.ai/visual-positioning-system", "https://www.multiset.ai/pricing", "https://www.multiset.ai/developers"],
  install=["[A] Plan gratuit **de prototypage** : 5 cartes actives / 5 traitées / **1 000 appels API à vie** / ~11 600 m² → watermark, donc inutilisable en prod",
           "[B] Lite 49 $/mois (39 $ en annuel) = 10 000 appels/mois + retrait du watermark ; Plus 249 $/mois (199 $ en annuel) = 25 cartes, 50 000 appels/mois, 60 387 m² ; Enterprise = Private Cloud / On-Prem / **On-Device** (seul plan qui sort du cloud MultiSet)",
           "[B2] ⚠️ Sur Free et Lite, la latence est explicitement « best-effort » et chiffrée **1 500-2 500 ms (mono-image) / 2 700-3 500 ms (multi-images)** sur la page de tarifs : l'argument « 52 ms » de la vidéo n'est pas garanti contractuellement avant Enterprise",
           "[C] Usage recommandé : **tester la faisabilité**, jamais dépendance durable ; l'alternatif self-host = hloc + Brush + ton propre serveur d'ancrage",
           "[D] L'ingestion accepte nos `.ply`/`.splat` : on peut donc évaluer leur moteur **avec nos propres scans**, sans rien leur confier d'autre"],
  integree="Aucune. Si un jour du hardware (lunettes, drone, robot) doit être ancré sur un site, évaluer MultiSet **vs** hloc en coût total, pas en démo.",
  verifier="—",
  notes="Tarifs relus le 2026-09-05 sur https://multiset.ai/pricing — **à re-vérifier le jour où tu décides** (règle n°9 : les tiers gratuits bougent tout seuls). « L'entreprise a un an et déjà notée plus robuste que Niantic » dixit la vidéo — c'est le seul acteur qui touche les lunettes grand public ; le modèle économique reste fragile, ne pas s'y marier. Point qui compte pour la tour : l'**on-device** n'existe qu'en Enterprise → aucun VPS du commerce ne te donne l'autonomie hors-ligne que `hloc` te donne à 0 €. ")

T(id="rayban-capture", nom="Capture Meta Ray-Ban / téléphone (option matériel)", cat=C_REF, statut="reference",
  prix="option-publique", licence="matériel (300 $) — SDK lunette gratuit", tier=None,
  role="La leçon matérielle : avec une simple caméra (+ un scan 3D préalable), on remplace un casque militaire à 30 000 $ (Anduril EagleEye). Un téléphone suffit ; les lunettes ne sont que l'ergonomie.",
  urls=["https://www.anduril.com/eagleeye", "https://developers.meta.com/horizon/"],
  install=["[A] ⚫ Achat optionnel : Meta Ray-Ban (~300 $) — sinon **ton téléphone suffit**, c'est littéralement ce que la vidéo démontre",
           "[B] Côté logiciel : `pip install opencv-python` + enregistrement des frames + `hloc` pour les ancrer ; la tour sert de « mini-map » comme dans EagleEye",
           "[C] ⚠️ Filmer des personnes dans l'espace public = RGPD + droit à l'image ; la tour n'ancrera **jamais** une pose humaine (audit §4.4)",
           "[D] Ne pas acheter pour « faire EagleEye » : acheter seulement si un usage réel existe (relevé de site, inspection, suivi d'ouvrage)"],
  integree="`src/anchors/cameraPose.js` : recevoir des poses depuis un client mobile (WebSocket vers la tour) et les dessiner — c'est **tout** l'effet « voir à travers les murs » : plusieurs caméras, une seule carte.",
  verifier="—",
  notes="Le vrai sujet n'est pas le hardware, c'est la carte ancrée partagée. Et là, tu l'as déjà (splats) — il manque l'API de pose, qui est une demi-journée de code.")

# ─────────────────────────────────────────────────────────────── Génération
CATEGORIES = [C_INFRA, C_SEARCH, C_RAG, C_OSINT, C_GEO, C_VPS, C_3D, C_VOICE, C_AGENT, C_COM, C_MEM, C_REF]
PRICE_ICON = {
    "materiel": "🟢 gratuit",
    "avec-compte": "🟡 compte gratuit",
    "freemium": "🟠 semi-payant",
    "payant": "🔴 payant",
    "option-publique": "⚫ matériel optionnel",
    "deja-en-place": "🟢 acquis",
    "a-verifier": "⚠️ à vérifier",
}
LEGEND_COST = {
    "materiel": "🟢 gratuit, 100 % local — seul coût : ton matériel/électricité",
    "avec-compte": "🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas",
    "freemium": "🟠 semi-payant : tier gratuit puis facturation à l'usage",
    "payant": "🔴 payant — on documente le remplacement gratuit",
    "option-publique": "⚫ option matérielle (achat one-shot), logiciel libre",
    "deja-en-place": "🟢 déjà acquis dans la tour",
    "a-verifier": "⚠️ statut à confirmer",
}
LEGEND_TIER = {
    0: "**A** — CPU seul, 8-16 Go RAM",
    1: "**B** — GPU NVIDIA 6-8 Go VRAM",
    2: "**C** — GPU 12-24 Go VRAM (ou Colab gratuit)",
    None: "A/B/C indifféremment",
}
LEGEND_STATUS = {
    "present": "🟩 **présent** (déjà dans la tour, à consolider)",
    "partiel": "🟨 **partiel** (existant à compléter/remplacer)",
    "absent": "🟥 **absent** (à installer)",
    "reference": "⬜ **référence** (à lire/copier le motif, pas de dépendance)",
}


# ───────────────── Rattachement : quel lien analysé a produit quel outil (auto-dérivé)
# L'audit §1 d'AUDIT-OUTILS-2026.md liste les liens sources avec, dans chaque ligne, les URLs
# officielles des outils cités. On recroise ces URLs avec le champ `urls` de chaque fiche pour
# que toute affirmation reste vérifiable à la source. SOURCE_MANUELLE couvre les entrées nées
# d'un **motif** (et non d'un lien d'outil) dans une ligne du tableau.
SOURCE_MANUELLE = {
    "hloc": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "colmap": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "arcore-geospatial": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "niantic-vps": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "multiset-vps": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "rayban-capture": "https://www.youtube.com/watch?v=CU02AeUCIHc",
    "recorder-4d": "https://www.youtube.com/watch?v=0p8o7AeHDzg",
    "shadowbroker": "https://www.youtube.com/watch?v=0p8o7AeHDzg",
    "satellite-passes": "https://www.youtube.com/watch?v=0p8o7AeHDzg",
    "notams": "https://www.youtube.com/watch?v=0p8o7AeHDzg",
    "outages": "https://www.youtube.com/watch?v=0p8o7AeHDzg",
    "aisstream": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "pipe-gaps": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "gdelt": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "sar-opera": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "gibis": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "eia-oil": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
    "desal-power": "https://www.spatialintelligence.ai/p/one-chokepoint-controls-everything",
}

_LIGNE_LIEN = re.compile(r"^\|\s*(\d+[a-z]?)\s*\|\s*\[([^\]]+)\]\((\S+?)\)")
_URL = re.compile(r"\((https?://[^)\s]+)\)")


def _norm(u: str) -> str:
    u = u.strip().rstrip("/").lower()
    return u.replace("://www.", "://", 1)


def _plat(x: str) -> str:
    """Comparaison tolérante : liens réduits à leur libellé, markdown et ponctuation retirés."""
    x = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", x)
    x = re.sub(r"\((?:https?|mailto):[^)]*\)", " ", x)
    x = re.sub(r"\*+|`|→", " ", x)
    return re.sub(r"[^a-z0-9]+", " ", x.lower()).strip()


def _nom_court(nom: str) -> str:
    """"hloc (localisation visuelle 6-DoF)" → "hloc"."""
    return _plat(re.split(r"\s*[\(—–:]", nom)[0])


def charger_origines() -> dict:
    """Rattache chaque outil au lien de l'audit (§1) qui l'a fait naître.

    Deux croisements : les **URLs** citées dans la ligne (fiable), puis le **nom** de l'outil
    tel qu'il est écrit dans les colonnes de citation (jamais dans la colonne « verdict », pour
    ne pas s'auto-attribuer nos propres commentaires). `SOURCE_MANUELLE` couvre les entrées nées
    d'un motif et non d'un lien d'outil. Retourne {} sans lever d'erreur si l'audit est absent :
    le registre reste produisible.
    """
    doc = ROOT / "AUDIT-OUTILS-2026.md"
    if not doc.exists():
        return {}
    lignes = doc.read_text(encoding="utf-8").splitlines()
    try:
        debut = next(i for i, l in enumerate(lignes) if l.startswith("## 1. Audit"))
    except StopIteration:
        return {}
    fin = next((i for i in range(debut + 1, len(lignes)) if lignes[i].startswith("## 2.")), len(lignes))

    rows = []
    for l in lignes[debut:fin]:
        m = _LIGNE_LIEN.match(l)
        if not m:
            continue
        cellules = [c for c in l.strip().strip("|").split("|")]
        # format : | réf | lien analysé | chaîne·date·vues | outils cités | verdict |
        # on ne croise que « outils cités » : ni notre prose (verdict), ni la ligne éditoriale (chaîne/date)
        cite = cellules[3:-1] if len(cellules) >= 5 else cellules[2:-1] if len(cellules) == 4 else cellules[1:-1]
        corps = " ".join(cite or cellules[1:-1])
        citees = [_norm(u) for u in _URL.findall(l) if _norm(u)]
        rows.append({"ref": m.group(1), "titre": m.group(2).strip(), "url": m.group(3),
                     "citees": [c for c in citees if c != _norm(m.group(3))],
                     "plat": " " + _plat(corps) + " "})
    if not rows:
        return {}
    par_url = {_norm(r["url"]): r for r in rows}

    out: dict = {}
    for t in OUTILS:
        trace = None
        for u in t.get("urls", []):
            cu = _norm(u)
            for r in rows:
                if any(cu == c or cu.startswith(c + "/") or c.startswith(cu + "/") for c in r["citees"]):
                    trace = r
                    break
            if trace:
                break
        if trace is None:  # 2e croisement : le nom, dans les colonnes de citation
            cles = {c for c in (_nom_court(t["nom"]), _plat(t["id"])) if len(c) >= 5}
            for r in rows:
                if any(re.search(r"(?<![a-z0-9])" + re.escape(c) + r"(?![a-z0-9])", r["plat"]) for c in cles):
                    trace = r
                    break
        if trace is None:
            continue
        out[t["id"]] = {"ref": trace["ref"], "titre": trace["titre"], "url": trace["url"]}
    for id_, url in SOURCE_MANUELLE.items():  # priorités explicites, y compris contre un croisement ambigu
        r = par_url.get(_norm(url))
        if r:
            out[id_] = {"ref": r["ref"], "titre": r["titre"], "url": r["url"]}
    return out


ORIGINES = charger_origines()

BESOINS: list[tuple[str, list[str], str]] = [
    ("faire tourner un LLM **sans aucune clé**", ["ollama", "litellm", "lm-studio", "open-webui"],
     "Ollama sert le modèle, LiteLLM unifie l'API, Open WebUI donne un chat dans le navigateur."),
    ("sortir un **JSON conforme à mes schémas** d'un LLM", ["instructor", "outlines", "dspy"],
     "Instructor = Pydantic, Outlines = grammaire garantie, DSPy = optimisation des prompts."),
    ("répondre à une question **avec sources**, sans Perplexity", ["searxng", "vane-perplexica", "crawl4ai", "litellm"],
     "SearXNG (activer `format=json`) + Vane par-dessus ; Crawl4AI lit les pages en markdown."),
    ("transformer **PDF, scans, factures, dossiers administratifs** en texte interrogeable",
     ["marker", "docling", "ocrmypdf", "chonkie"],
     "Marker sort un markdown propre (GPU conseillé), Docling garde la structure, OCRmyPDF rend cherchable un scan "
     "(reçu, facture, arrêté, devis, plan cadastral, facture d'énergie)."),
    ("lire une **capture d'écran, une photo, un plan, une plaque, un document** (OCR)",
     ["tesseract", "paddleocr", "exiftool"],
     "Tesseract = léger sur CPU ; PaddleOCR = bien meilleur sur le FR et les mises en page ; ExifTool = métadonnées."),
    ("**transcrire** un mémo vocal ou une écoute radio", ["whisper-cpp", "faster-whisper", "scriberr"],
     "whisper.cpp sur CPU, faster-whisper si GPU, Scriberr si tu veux une API Docker déjà emballée."),
    ("faire **parler** la tour en français", ["piper", "kokoro", "qwen3-tts", "openwakeword"],
     "Piper = CPU et quasi instantané ; Qwen3-TTS = clonage de voix (GPU ~4 Go) ; openWakeWord = réveil local."),
    ("découper et **indexer** un corpus (RAG) sans serveur", ["chonkie", "lancedb", "sqlite-vec", "qdrant"],
     "LanceDB / sqlite-vec = aucun daemon ; Qdrant seulement quand le corpus grossit."),
    ("traduire **hors ligne**", ["libretranslate"],
     "0 cloud, lent sur CPU mais parfait en tâche de fond ; ne pas l'utiliser pour un texte juridiquement sensible hors de chez toi."),
    ("trouver une **adresse, un lieu** sans Google", ["photon-nominatim"],
     "Déjà branché dans `locations.js` ; le serveur public suffit, Photon auto-hébergé en zone blanche."),
    ("afficher des **images satellite** gratuites", ["esri-carto-tuiles", "gibis", "cesium-ion", "sar-opera"],
     "GIBS sert des tuiles **datées** (compatibles avec le curseur temporel) ; Cesium ion = terrain et 3D Tiles avec compte gratuit."),
    ("scanner un site réel et l'**afficher en 3D** dans le globe", ["aholo-viewer", "aholo-splat-transform", "brush", "postshot", "opensplat"],
     "Capture téléphone/drone → Brush (3DGS) → splat-transform (LOD + collisions) → calque Cesium."),
    ("**ancrer** une caméra, un drone, un téléphone dans ce modèle 3D (VPS)",
     ["hloc", "colmap", "niantic-vps", "arcore-geospatial", "multiset-vps", "rayban-capture"],
     "hloc + COLMAP = la voie libre, hors-ligne et sans compte ; les VPS du commerce restent du benchmark ou de la capture."),
    ("**rejouer** une crise minute par minute (4D)",
     ["recorder-4d", "aisstream", "gdelt", "notams", "outages", "satellite-passes", "gibis"],
     "Le journal continu d'abord : sans lui les caches expirent et il n'y a plus rien à rejouer."),
    ("suivre des **navires**, et voir ceux qui **éteignent leur AIS**", ["aisstream", "pipe-gaps", "recorder-4d"],
     "pipe-gaps (Apache-2.0) détecte les trous temporels de position : c'est exactement la détection de « dark vessel »."),
    ("suivre des **avions** et repérer un **brouillage GPS**", ["opensky", "shadowbroker", "recorder-4d"],
     "OpenSky = flux gratuit ; le brouillage se déduit des écarts de trajectoire et de la qualité ADS-B (pattern ShadowBroker)."),
    ("prédire le **passage d'un satellite** au-dessus d'un site", ["satellite-passes"],
     "Skyfield + TLE CelesTrak : 0 clé, et ça donne la fenêtre où l'image sera effectivement utile."),
    ("cartographier l'**infrastructure vitale** d'un territoire", ["desal-power", "esri-carto-tuiles", "sar-opera"],
     "Centrales via Overpass (ODbL) ; la désalination se constitue à la main, une source datée par entrée."),
    ("suivre les **prix du carburant et du brut** sur la timeline", ["eia-oil"],
     "Seules les données publiques (EIA) sont redistribuables — jamais Bloomberg/Refinitiv."),
    ("état de l'**internet** d'un pays (blackout, censure)", ["outages"],
     "Cloudflare Radar + IODA (comptes gratuits), ou RIPE Restless en auto-hébergé si tu veux zéro tiers."),
    ("empreinte web d'une **organisation** (et d'elle seule)",
     ["spiderfoot", "theharvester", "amass", "maigret", "osint-framework", "opencti", "gephi"],
     "⚠️ Règle n°7 : aucune personne physique. Gephi ou OpenCTI pour lire le graphe, SpiderFoot pour le construire."),
    ("**communiquer sans internet**", ["reticulum", "meshtastic", "rtl-sdr"],
     "Reticulum en logiciel d'abord (0 €) ; les radios LoRa sont l'option, pas le prérequis."),
    ("garder la **mémoire** de l'agent et la sauvegarder", ["ai-memory-vault", "obsidian", "syncthing", "sqlite-vec"],
     "Des markdown dans le repo, synchronisés ; aucune base vectorielle n'est obligatoire."),
    ("automatiser les tâches répétitives (veille, triage, briefing)", ["activepieces", "hermes-agent", "openclaw", "openhands"],
     "Activepieces (MIT) remplace n8n (fair-code) ; Hermes et OpenHands pour le travail de code."),
    ("alternative **GUI** à tout ça, sans terminal", ["jan", "pinokio", "lm-studio", "gobbonet"],
     "Jan et LM Studio = chat local ; Pinokio = lanceur de projets ; GobboNet = patron de l'installeur à un fichier."),
]
CJK = re.compile(r"[\u3000-\u9fff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]")
BESOINS_IDS = {i for _, ids, _ in BESOINS for i in ids}


def build_json() -> dict:
    tools = []
    for t in OUTILS:
        t = dict(t)
        t.setdefault("notes", "")
        t.setdefault("gpu", "")
        t.setdefault("integree", "")
        t.setdefault("verifier", "")
        o = ORIGINES.get(t["id"])
        if o:
            t["origine"] = o
        tools.append(t)
    return {
        "version": 1,
        "genere_le": datetime.date.today().isoformat(),
        "source": "audit/reference/generate-reference.py (ne pas éditer ce fichier à la main)",
        "legende": {
            "prix": LEGEND_COST,
            "statut": {k: v.strip("* ").replace("**", "") for k, v in LEGEND_STATUS.items()},
            "materiel": LEGEND_TIER,
        },
        "categories": CATEGORIES,
        "besoins": [{"besoin": b, "outils": ids, "note": note} for b, ids, note in BESOINS],
        "outils": tools,
    }


def tsv_rows() -> str:
    """1 ligne = 1 outil, colonnes tabulées : de quoi trier et filtrer sans Python."""
    cols = ["id", "nom", "cat", "prix", "palier", "cle", "statut", "licence", "origine", "mots_cles", "resume", "urls"]
    out = ["\t".join(cols)]
    for t in OUTILS:
        palier = {0: "A", 1: "B", 2: "C"}.get(t["tier"], "ABC")
        cle = "non" if t["prix"] == "materiel" else "compte" if t["prix"] == "avec-compte" else "payant"
        o = ORIGINES.get(t["id"], {})
        mots = " ".join(x for x in (_plat(t["nom"]), _plat(t["id"]), _plat(t["cat"].split(" · ")[-1]),
                                    _plat(t.get("integree", "")), "gpu" if t["tier"] in (1, 2) else "cpu") if x)
        vals = {"id": t["id"], "nom": t["nom"], "cat": t["cat"], "prix": t["prix"], "palier": palier,
                "cle": cle, "statut": t["statut"], "licence": t["licence"], "origine": o.get("ref", ""),
                "mots_cles": mots, "resume": re.sub(r"\s+", " ", t["role"])[:220], "urls": " ".join(t["urls"])}
        out.append("\t".join(vals[c].replace("\t", " ").replace("\n", " ") for c in cols))
    return "\n".join(out) + "\n"


def block_aide() -> str:
    """« Trouver en 10 secondes » : commandes + routage besoin → fiches, posé avant les 86 fiches."""
    L = ["\n---\n", "## 0 bis · Trouver en 10 secondes", ""]
    L.append("| Tu veux… | Faire |")
    L.append("|---|---|")
    L.append('| chercher un outil par mot | `python3 audit/reference/cherche.py "pdf scanné"` |')
    L.append("| tout ce qui est gratuit **et sans clé** | `python3 audit/reference/cherche.py --sans-cle` |")
    L.append("| ce qui tient **sans GPU** | `python3 audit/reference/cherche.py --palier A` |")
    L.append("| la fiche complète d'un outil | `python3 audit/reference/cherche.py --fiche marker` |")
    L.append("| partir d'un besoin, pas d'un nom | `python3 audit/reference/cherche.py --besoin vps` |")
    L.append("| ce qui tourne **déjà** ici | `python3 audit/reference/doctor.py --json` |")
    L.append("| grepper sans Python | `grep -i ais audit/reference/REGISTRE.tsv` (colonnes : `cut -f1,5,6`) |")
    L.append("| une décision d'architecture | §0 (règles) puis §1 (ordre d'implémentation) |")
    L.append("")
    L.append("L'`id` (entre backticks) **est l'ancre** de la fiche : `audit/REFERENCE.md#hloc`. "
             "Source de vérité : `audit/reference/generate-reference.py` — `REFERENCE.md`, `REGISTRE-OUTILS.json`, "
             "`REGISTRE.tsv` et `AGENTS.md` sont générés, jamais édités à la main.\n")
    L.append("### Par besoin\n")
    L.append("| Besoin | Outils (→ fiche) | Note |")
    L.append("|---|---|---|")
    for besoin, ids, note in BESOINS:
        liens = " · ".join(f"[`{i}`](#{i})" for i in ids)
        L.append(f"| {besoin} | {liens} | {note} |")
    L.append("")
    return "\n".join(L)


def block_index() -> str:
    """Index alphabétique : une ligne par outil, triée par id."""
    L = ["\n---\n", f"## 5 · Index alphabétique ({len(OUTILS)} outils)", "",
         "| `id` | Nom | Cat. | Prix | Palier | Compte/clé | Licence | État | Origine |",
         "|---|---|---|---|---|---|---|---|---|"]
    for t in sorted(OUTILS, key=lambda x: x["id"]):
        palier = {0: "🅰", 1: "🅱", 2: "🅲"}.get(t["tier"], "🅰🅱🅲")
        cle = "—" if t["prix"] == "materiel" else "🟡" if t["prix"] == "avec-compte" else "🔴"
        etat = {"present": "✅ en place", "partiel": "◑ partiel", "absent": "🟥 à installer",
                "reference": "⬜ réf. seule"}.get(t["statut"], t["statut"])
        L.append(f"| [`{t['id']}`](#{t['id']}) | {t['nom'][:44]} | {t['cat'].split(' · ')[0]} "
                 f"| {PRICE_ICON.get(t['prix'], '⚪')} | {palier} | {cle} | {t['licence'][:38]} "
                 f"| {etat} | {ORIGINES.get(t['id'], {}).get('ref', '—')} |")
    L.append("")
    L.append("*Filtrer plutôt que défiler : `cherche.py` (ci-dessus) ou "
             "`cut -f1,3,5,6 audit/reference/REGISTRE.tsv | sort -k2` (1 ligne = 1 outil).*")
    L.append("")
    return "\n".join(L)


def build_md() -> str:
    today = datetime.date.today().isoformat()
    n = len(OUTILS)
    gratuit = sum(1 for t in OUTILS if t["prix"] == "materiel")
    compte = sum(1 for t in OUTILS if t["prix"] == "avec-compte")
    payant = sum(1 for t in OUTILS if t["prix"] in ("payant", "freemium"))
    ncat = len(CATEGORIES)
    norig = sum(1 for t in OUTILS if t["id"] in ORIGINES)
    L = []
    L.append(f"""# 📖 RÉFÉRENCE OUTILS — Watchtower (source de vérité pour les agents)

> **Statut** : référence canonique. Générée le `{today}` depuis `audit/reference/generate-reference.py`
> — **ne pas éditer ce fichier à la main** : modifier le générateur, puis
> `python3 audit/reference/generate-reference.py` (qui réécrit aussi `reference/REGISTRE-OUTILS.json`).
> **Traçabilité** : **{norig}/{n} fiches** sont rattachées au lien analysé qui les a fait naître (champ `origine`, croisé automatiquement depuis l'audit §1) — les autres sont des outils ajoutés **hors lien**, par nous, à partir de la vérification des licences et des remplacements de tiers payants.

> **{n} outils catalogués** en **{ncat} catégories**, dont **{gratuit} 🟢 100 % gratuits et locaux**, **{compte} 🟡 avec compte gratuit**, **{payant} 🔴/🟠 payants ou semi-payants (remplacements écrits dans le §6 d’`AUDIT-OUTILS-2026.md`)**. Toute décision d'outillage se prend ici, pas dans une vidéo.

## 0. Règles d'ingénierie (à lire avant de toucher au code)

1. **Zéro clé par défaut.** Un module ne doit pas échouer sans API : chemin 🟢 d'abord, 🔴/🟡 en `power-up` conscient (pattern `startGate.js` + `keySetup.js` déjà en place).
2. **Local en premier, cloud en secours explicite.** Tout appel réseau sort par `src/ai/llmClient.js` (Ollama `http://127.0.0.1:11434/v1` → LiteLLM → fallback compte gratuit). Un fallback cloud affiche une bannière.
3. **Secrets = `.env` (permissions 600), jamais commités** ; rien n'est exposé sur le LAN sans proxy authentifié (le serveur brokerait tes clés : cf. SECURITY amont).
4. **Licences** : dépendance autorisée uniquement si licence explicite (MIT/Apache/BSD/ISC, AGPL accepté pour un service interne). **Refusés** : `NOASSERTION`, aucune licence, « Other », fair-code (n8n) comme dépendance de build. Voir le §4 de `COUTS-LICENCES-LEGAL.md`.
5. **Un module = un fichier** dans `src/…` (pattern plugin) ; try/catch à l'enregistrement pour qu'un module cassé ne tue pas la tour.
6. **Validé par schéma** : tout objet structuré passe par `schemas/*.schema.json` (Instructor/Outlines + `jsonschema`), pas de parsing ad hoc.
7. **Pas de personnes.** Aucune fonctionnalité de recherche nominative, de visage ou de pistage individuel : la tour porte sur **infrastructures, flux, documents, données ouvertes**. (Ligne héritée de l'amont, et obligation juridique.)
8. **Avant d'installer** : `python3 audit/reference/doctor.py` → ce qui tourne déjà, ce qui manque, ce qui bloque. Après : relancer `doctor` et consigner dans `audit/stack/INSTALL-REPORT.txt`.
9. **Toujours vérifier les prix/quotas** au moment de l'écriture : les tiers gratuits sont le premier poste de régression (le tier Gemini l'a été en avril 2026).
10. **Traçabilité** : une décision = une ligne dans ce fichier (via le générateur) + une note de commit. Les liens sources sont dans les champs `urls`, et le champ `origine` (auto-dérivé des tableaux du §1 de `AUDIT-OUTILS-2026.md`, cf. `charger_origines()`) rattache chaque fiche au lien qui l'a fait naître : **une affirmation non rattachée = une affirmation à re-vérifier avant de coder**.
11. **Journal d'abord, calque ensuite.** Tout flux public consommé par la tour est **aussi écrit** dans le `recorder-4d` (`data/4d/` → Parquet) : un flux interrogé à la demande est un flux perdu (caches TTL, latence imposée sur l'imagerie). Un nouveau calque sans collecteur est refusé en revue.
12. **Chercher avant de proposer.** `python3 audit/reference/cherche.py "pdf"` (ou `--besoin vps`, `--sans-cle`) : le registre répond en une seconde ; proposer un outil déjà catalogué — ou un tiers payant qui a un équivalent 🟢 — est une régression.
13. **Un événement = un alignement temporel, jamais une assertion.** La tour affiche des coïncidences datées et sourcées (« 3 coupures AIS entre 02:10 et 03:40 dans cette bbox », « satellite X au-dessus à 14:07 »), pas des conclusions (« ce navire fait de la contrebande »).

### Grilles de lecture

- **Prix (colonne des tableaux)** : 🟢 gratuit = 0 €, 100 % local (seul coût : matériel + électricité) · 🟡 compte gratuit = clé/quota, sans CB au mieux · 🟠 semi-payant = tier gratuit puis facturation · 🔴 payant = on documente le remplacement gratuit · ⚫ matériel optionnel = achat one-shot, logiciel libre
- **Faisabilité (colonne)** : 🅰 = tient sur le palier A (CPU, 8-16 Go RAM) · 🅱 = veut un GPU 6-8 Go · 🅲 = veut un GPU 12-24 Go · 🅰🅱🅲 = indifférent

### Matériel : les 3 paliers
| Palier | Config type | Ce qui devient possible |
|---|---|---|
| **A** | 8-16 Go RAM, **sans GPU**, SSD 512 Go | Tour + Ollama `qwen3:0.6b/4b` + SearXNG + Vane + Crawl4AI + Tesseract + LibreTranslate + whisper `base/int8` + **Piper** + LanceDB + Activepieces + SpiderFoot + Reticulum (logiciel) |
| **B** | GPU NVIDIA 6-8 Go | + `llama3.1:8b`, **Qwen3-TTS 0,6 B (FR, clonage 3 s)**, `faster-whisper small`, Marker, Outlines, Hermes Agent, DSPy |
| **C** | GPU 12-24 Go | + `qwen3:30b-a3b`, Qwen3-TTS 1,7 B, **entraînement 3DGS (Brush)**, OpenHands en autonomie, Qdrant sur gros corpus, Langfuse |
| Hors-tour | Colab T4 **gratuit** | dépannage B/C à la demande : Marker, Brush, Qwen3-TTS, fine-tune du routeur |
""")

    L.append(block_aide())

    for cat in CATEGORIES:
        rows = [t for t in OUTILS if t["cat"] == cat]
        if not rows:
            continue
        L.append(f"\n---\n\n## {cat}\n")
        L.append("| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |")
        L.append("|---|---|---|---|---|---|")
        for t in rows:
            role = t["role"].split(". ")[0]
            if len(role) > 104:
                role = role[:104].rsplit(" ", 1)[0] + "…"
            feas = LEGEND_TIER.get(t["tier"], "—").replace("**", "")
            icon = {"A": "🅰", "B": "🅱", "C": "🅲"}.get(feas[0], "🅰🅱🅲")
            urls = " · ".join(f"[{u.split('/')[2].replace('www.','')}]({u})" for u in t["urls"][:3])
            L.append(f"| **{t['nom']}** `{t['id']}` | {role} | {icon} | {PRICE_ICON.get(t['prix'],'⚪')} | {t['licence']} | {urls} |")
        L.append("")
        for t in rows:
            L.append(f'<a id="{t["id"]}"></a>')
            L.append("")
            L.append(f"### {t['nom']} — `{t['id']}`")
            L.append(f"- **Statut** : {LEGEND_STATUS.get(t['statut'], t['statut'])} · **Prix** : {LEGEND_COST.get(t['prix'], t['prix'])} · **Licence** : {t['licence']} · **Tour** : {LEGEND_TIER.get(t['tier'], '')}")
            if t.get("gpu"):
                L.append(f"- **Matériel** : {t['gpu']}")
            L.append(f"- **Rôle** : {t['role']}")
            L.append("- **Étapes d'installation** :")
            for st in t["install"]:
                L.append(f"  - {st}")
            if t.get("integree"):
                L.append(f"- **Intégration dans la tour** : {t['integree']}")
            if t.get("verifier"):
                L.append(f"- **Vérification (à mettre dans `doctor`)** : `{t['verifier']}`")
            if t.get("notes"):
                L.append(f"- **Notes / pièges** : {t['notes']}")
            L.append("- **Sources** : " + " · ".join(t["urls"]))
            o = ORIGINES.get(t["id"])
            if o:
                L.append(f"- **Né du lien analysé** : [{o['titre']}]({o['url']}) *(audit, réf. n°{o['ref']})*")
            L.append(f"- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: \"{t['id']}\"` (généré par `generate-reference.py`, ne pas éditer le markdown)")
            L.append("")

    L.append("""---

## 1. Tableau de décision rapide (ordre d'implémentation)

| Phase | Ajouter (ids du registre) | Pourquoi cet ordre | Effort agent |
|---|---|---|---|
| **P0 socle** | `ollama`, `doctor.py`, `install-stack.ps1/sh` | sans LLM local, rien d'autre n'a de sens | ~1-2 h |
| **P1 la tour pense** | `instructor`, `outlines`, `litellm`, `langfuse`(option) | sortie valide + traces → `chatConsole`, `intelTwin`, `hudSummaryResponse` | 2-3 sessions |
| **P2 entendre/parler** | `faster-whisper`, `piper`, `openwakeword` → `qwen3-tts`, `kokoro` | remplace `freeVoice.js`, 0 cloud, 0 latence payante | 2 sessions |
| **P3 lire le monde** | `tesseract`/`paddleocr`, `marker`/`docling`, `ocrmypdf`, `libretranslate`, `exiftool` | les captures et PDF de la tour deviennent interrogeables | 2-3 sessions |
| **P4 chercher** | `searxng`, `vane-perplexica`, `crawl4ai`, `chonkie`, `lancedb`/`qdrant`, `dspy` | `reaserch-engine` reçoit des yeux web + RAG, sans API payante | 2-4 sessions |
| **P5 se souvenir** | `ai-memory-vault` (motif réécrit), `obsidian`, `syncthing`, `sqlite-vec` | continuité entre runs, état `HCSM`, sauvegarde | 2 sessions |
| **P6 terrain réel** | `aholo-viewer`, `aholo-splat-transform`, `brush`/`postshot`, `opensplat`, `niantic-vps`(capture Scaniverse) | splats LOD/collisions dans le globe | 3-5 sessions |
| **P7 hors-réseau** | `reticulum`, `meshtastic`(⚫ matériel), `rtl-sdr`(⚫ ~30 €) | messagerie de secours + source de données locale souveraine | 1-3 sessions |
| **P8 pendant que tu dors** | `hermes-agent`, `activepieces`, `openhands` (prudent) + release GitHub Actions/installeur | les boucles tournent sans toi, et « l'agent clone, patche, tu télécharges depuis **ton** repo » | 1-2 sessions |
| **P9 rejouabilité 4D** ⭐ | `recorder-4d`, `aisstream`, `pipe-gaps`, `satellite-passes`, `notams`, `outages`, `gibis`, `sar-opera`, `eia-oil`, `gdelt` | **la leçon du 2ᵉ lot** : sans journal continu, la tour reste au présent et ne peut rien rejouer. À faire avant tout nouveau calque | 2-4 sessions |
| **P10 ancrage spatial** | `hloc`, `colmap`, `rayban-capture`(option) | caméras/drones/téléphone positionnés au cm **dans** les splats de P6, hors-ligne ; remplace les VPS à compte | 2-3 sessions |

## 2. Ce que les agents font à ta place / ce qu'ils ne peuvent pas

| Automatisable à 100 % (agent) | Nécessite toi (👆) | Hors de portée / refus |
|---|---|---|
| cloner + patcher + pousser (toute tâche des phases P0-P10) ; écrire `install-stack.*` et `doctor` ; config SearXNG `format=json` ; créer les flows Activepieces (hors login) ; convertir les splats ; câbler `schemas/*.json` ; rédiger les tests ; open `issues` amont pour clarifier une licence | créer les comptes gratuits (Cesium ion, Groq, OpenRouter, AISStream, FIRMS) · accepter CGU/licences · cliquer SmartScreen sur un installeur · brancher micro/haut-parleur · coller une clé dans `keySetup.js` | achat matériel (GPU, radios LoRa, RTL-SDR) · paywall d'abonnement (Claude Code, n8n enterprise, Maltego Pro) · signature de certificat · **toute fonctionnalité visant une personne physique** |

## 3. Vérification d'installation (à faire tourner après chaque phase)

```bash
python3 audit/reference/doctor.py            # qui répond ? qui manque ?
python3 audit/reference/doctor.py --json     # sortie machine, pour un agent
bash audit/stack/install-stack.sh --dry-run  # ce qui serait fait, sans rien toucher
```

## 4. Contrôles de licence et de prix avant d'ajouter une dépendance (checklist)

- [ ] `curl -s https://api.github.com/repos/<owner>/<repo> | jq .license` → `spdx_id` **non null** et dans la liste autorisée
- [ ] page LICENSE lue (les README mentent : `gods-eye-view`, `Mark-LII`, `ada_local` en sont la preuve)
- [ ] quota/prix relevés à la date du jour dans `notes`, avec le lien de la page de pricing
- [ ] aucun secret dans le dépôt, aucun port ouvert sur `0.0.0.0`, `.env` en 600
- [ ] plan de sortie documenté : comment on retire ce composant sans casser la tour
""")
    L.append("\n" + block_index())
    return "\n".join(L) + "\n"


def build_agents_md() -> str:
    """Routeur pour les agents : où est la vérité, quelles commandes, ce qui est interdit."""
    n = len(OUTILS)
    g = sum(1 for t in OUTILS if t["prix"] == "materiel")
    c = sum(1 for t in OUTILS if t["prix"] == "avec-compte")
    p = sum(1 for t in OUTILS if t["prix"] in ("payant", "freemium"))
    deja = [t for t in OUTILS if t["statut"] in ("present", "partiel")]
    deja_l = "\n".join(f"- `{t['id']}` — {t['nom']}" for t in deja) or "- rien : `doctor.py` renvoie tout `absent`"
    return f"""# AGENTS.md — mode d'emploi du repo

> ⚙️ **Généré** par `audit/reference/generate-reference.py` (le {datetime.date.today().isoformat()}).
> Ne pas éditer : modifier le générateur puis `python3 audit/reference/generate-reference.py`.

Ce repo = une tour de veille **CesiumJS** (`watchtower-mods`, 57 modules) + un plan de contrôle de
recherche (`reaserch-engine`) + l'**audit d'outillage** qui dit quoi installer, à quel prix, sous quelle licence.

## Où chercher

| Question | Où la réponse vit |
|---|---|
| Quel outil pour tel besoin ? | `audit/REFERENCE.md` §0 **bis** (tableau « par besoin ») |
| Fiche d'un outil (rôle, prix, licence, étapes A→B→C, vérif) | `audit/REFERENCE.md`, ancre = l'`id` (ex. `#hloc`) |
| Est-ce déjà installé / fonctionnel ici ? | `python3 audit/reference/doctor.py` |
| Faisable à 0 € ? | `AUDIT-OUTILS-2026.md` §3 (verdict par outil) et §6 (remplacements des tiers payants) |
| Droit, licences, CGU | `audit/COUTS-LICENCES-LEGAL.md` |
| Ce que l'agent fait à ta place | `audit/CAPACITES-AGENT.md` (25 tâches cotées) |
| Par quoi commencer | `audit/REFERENCE.md` §1 puis `AUDIT-OUTILS-2026.md` §8 (P0 → P10) |
| Installer le socle | `audit/stack/install-stack.sh` / `.ps1` (courts, relisibles, `-DryRun`) |

## Les commandes

```bash
python3 audit/reference/cherche.py "pdf" --sans-cle   # recherche plein texte + filtres
python3 audit/reference/cherche.py --besoin vps       # partir du besoin, pas du nom
python3 audit/reference/cherche.py --fiche marker     # une fiche en texte court
python3 audit/reference/doctor.py --json               # état réel de la machine (exit 1 si socle incomplet)
python3 audit/reference/generate-reference.py          # régénère REFERENCE.md, REGISTRE-*.json/tsv, AGENTS.md
```

Registre : **{n} outils** ({g} 🟢 sans clé, {c} 🟡 avec compte gratuit, {p} 🔴/🟠 payants ou semi-payants) en
12 catégories. Machine : `audit/reference/REGISTRE-OUTILS.json` ; plat : `audit/reference/REGISTRE.tsv`.

## Interdits et obligations (le détail est dans `REFERENCE.md` §0)

1. Ne **jamais** éditer `REFERENCE.md`, `REGISTRE-OUTILS.json`, `REGISTRE.tsv`, `AGENTS.md` : la source de vérité est la liste `OUTILS` de `audit/reference/generate-reference.py`.
2. **Aucune fonctionnalité visant une personne physique** : pas de pistage, pas de visage, pas d'ancrage de personnes dans le VPS, pas de calque « yachts / jets d'oligarques ».
3. Licence **refusée** si `NOASSERTION`, absente, « Other » ou fair-code → réécrire le motif. Vérifier le **fichier** LICENSE, pas l'auto-détection GitHub.
4. **Zéro clé par défaut** ; `.env` en 600 et jamais commité ; aucun binding `0.0.0.0` ; un repli cloud s'affiche à l'écran.
5. Ajouter un outil = **une entrée du générateur** avec `role`, `tier`, `prix`, `licence`, `urls`, `install` (A→B→C), `verifier` (exécuté par `doctor.py`), puis régénérer, puis committer.
6. **Journal d'abord, calque ensuite** : tout flux public consommé est aussi écrit dans `recorder-4d`.
7. **Un événement = un alignement temporel, jamais une assertion** : la tour cite, elle n'accuse pas.
8. `doctor.py` avant **et** après chaque installation ; une commande de vérification se termine par un **exit code** (jamais un `| head` qui masque l'absence).
9. Prix et quotas **re-vérifiés à la date d'écriture** (les tiers gratuits sont le premier poste de régression).

## Déjà en place

{deja_l}
"""


def main() -> int:
    ids = [t["id"] for t in OUTILS]
    assert len(ids) == len(set(ids)), "ids dupliqués"
    inconnus = BESOINS_IDS - set(ids)
    assert not inconnus, f"§Besoins : ids inconnus {sorted(inconnus)}"
    for t in OUTILS:
        assert t.get("install"), f"{t['id']} : étapes d'installation vides"
        assert t.get("urls"), f"{t['id']} : aucune URL source"
    md = build_md()
    assert not CJK.search(md), "caractères non latins dans REFERENCE.md (corriger le générateur)"
    ancres = set(re.findall(r'<a id="([^"]+)"></a>', md))
    orphelines = {c for c in re.findall(r"\]\(#([^)]+)\)", md)} - ancres
    assert not orphelines, f"liens internes sans ancre : {sorted(orphelines)}"
    (HERE / "REGISTRE-OUTILS.json").write_text(
        json.dumps(build_json(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (HERE / "REGISTRE.tsv").write_text(tsv_rows(), encoding="utf-8")
    md_path = ROOT / "audit" / "REFERENCE.md"
    md_path.write_text(md, encoding="utf-8")
    (ROOT / "AGENTS.md").write_text(build_agents_md(), encoding="utf-8")
    print(f"✔ {len(OUTILS)} outils → {md_path.relative_to(ROOT)} + audit/reference/REGISTRE-OUTILS.json")
    print("  gratuit/local :", sum(1 for t in OUTILS if t['prix'] == 'materiel'),
          "| avec compte :", sum(1 for t in OUTILS if t['prix'] == 'avec-compte'),
          "| payant :", sum(1 for t in OUTILS if t['prix'] == 'payant'))
    return 0


if __name__ == "__main__":
    sys.exit(main())