# 📖 RÉFÉRENCE OUTILS — Watchtower (source de vérité pour les agents)

> **Statut** : référence canonique. Générée le `2026-09-06` depuis `audit/reference/generate-reference.py`
> — **ne pas éditer ce fichier à la main** : modifier le générateur, puis
> `python3 audit/reference/generate-reference.py` (qui réécrit aussi `reference/REGISTRE-OUTILS.json`).
> **Traçabilité** : **47/86 fiches** sont rattachées au lien analysé qui les a fait naître (champ `origine`, croisé automatiquement depuis l'audit §1) — les autres sont des outils ajoutés **hors lien**, par nous, à partir de la vérification des licences et des remplacements de tiers payants.

> **86 outils catalogués** en **12 catégories**, dont **68 🟢 100 % gratuits et locaux**, **12 🟡 avec compte gratuit**, **4 🔴/🟠 payants ou semi-payants (remplacements écrits dans le §6 d’`AUDIT-OUTILS-2026.md`)**. Toute décision d'outillage se prend ici, pas dans une vidéo.

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


---

## 0 bis · Trouver en 10 secondes

| Tu veux… | Faire |
|---|---|
| chercher un outil par mot | `python3 audit/reference/cherche.py "pdf scanné"` |
| tout ce qui est gratuit **et sans clé** | `python3 audit/reference/cherche.py --sans-cle` |
| ce qui tient **sans GPU** | `python3 audit/reference/cherche.py --palier A` |
| la fiche complète d'un outil | `python3 audit/reference/cherche.py --fiche marker` |
| partir d'un besoin, pas d'un nom | `python3 audit/reference/cherche.py --besoin vps` |
| ce qui tourne **déjà** ici | `python3 audit/reference/doctor.py --json` |
| grepper sans Python | `grep -i ais audit/reference/REGISTRE.tsv` (colonnes : `cut -f1,5,6`) |
| une décision d'architecture | §0 (règles) puis §1 (ordre d'implémentation) |

L'`id` (entre backticks) **est l'ancre** de la fiche : `audit/REFERENCE.md#hloc`. Source de vérité : `audit/reference/generate-reference.py` — `REFERENCE.md`, `REGISTRE-OUTILS.json`, `REGISTRE.tsv` et `AGENTS.md` sont générés, jamais édités à la main.

### Par besoin

| Besoin | Outils (→ fiche) | Note |
|---|---|---|
| faire tourner un LLM **sans aucune clé** | [`ollama`](#ollama) · [`litellm`](#litellm) · [`lm-studio`](#lm-studio) · [`open-webui`](#open-webui) | Ollama sert le modèle, LiteLLM unifie l'API, Open WebUI donne un chat dans le navigateur. |
| sortir un **JSON conforme à mes schémas** d'un LLM | [`instructor`](#instructor) · [`outlines`](#outlines) · [`dspy`](#dspy) | Instructor = Pydantic, Outlines = grammaire garantie, DSPy = optimisation des prompts. |
| répondre à une question **avec sources**, sans Perplexity | [`searxng`](#searxng) · [`vane-perplexica`](#vane-perplexica) · [`crawl4ai`](#crawl4ai) · [`litellm`](#litellm) | SearXNG (activer `format=json`) + Vane par-dessus ; Crawl4AI lit les pages en markdown. |
| transformer **PDF, scans, factures, dossiers administratifs** en texte interrogeable | [`marker`](#marker) · [`docling`](#docling) · [`ocrmypdf`](#ocrmypdf) · [`chonkie`](#chonkie) | Marker sort un markdown propre (GPU conseillé), Docling garde la structure, OCRmyPDF rend cherchable un scan (reçu, facture, arrêté, devis, plan cadastral, facture d'énergie). |
| lire une **capture d'écran, une photo, un plan, une plaque, un document** (OCR) | [`tesseract`](#tesseract) · [`paddleocr`](#paddleocr) · [`exiftool`](#exiftool) | Tesseract = léger sur CPU ; PaddleOCR = bien meilleur sur le FR et les mises en page ; ExifTool = métadonnées. |
| **transcrire** un mémo vocal ou une écoute radio | [`whisper-cpp`](#whisper-cpp) · [`faster-whisper`](#faster-whisper) · [`scriberr`](#scriberr) | whisper.cpp sur CPU, faster-whisper si GPU, Scriberr si tu veux une API Docker déjà emballée. |
| faire **parler** la tour en français | [`piper`](#piper) · [`kokoro`](#kokoro) · [`qwen3-tts`](#qwen3-tts) · [`openwakeword`](#openwakeword) | Piper = CPU et quasi instantané ; Qwen3-TTS = clonage de voix (GPU ~4 Go) ; openWakeWord = réveil local. |
| découper et **indexer** un corpus (RAG) sans serveur | [`chonkie`](#chonkie) · [`lancedb`](#lancedb) · [`sqlite-vec`](#sqlite-vec) · [`qdrant`](#qdrant) | LanceDB / sqlite-vec = aucun daemon ; Qdrant seulement quand le corpus grossit. |
| traduire **hors ligne** | [`libretranslate`](#libretranslate) | 0 cloud, lent sur CPU mais parfait en tâche de fond ; ne pas l'utiliser pour un texte juridiquement sensible hors de chez toi. |
| trouver une **adresse, un lieu** sans Google | [`photon-nominatim`](#photon-nominatim) | Déjà branché dans `locations.js` ; le serveur public suffit, Photon auto-hébergé en zone blanche. |
| afficher des **images satellite** gratuites | [`esri-carto-tuiles`](#esri-carto-tuiles) · [`gibis`](#gibis) · [`cesium-ion`](#cesium-ion) · [`sar-opera`](#sar-opera) | GIBS sert des tuiles **datées** (compatibles avec le curseur temporel) ; Cesium ion = terrain et 3D Tiles avec compte gratuit. |
| scanner un site réel et l'**afficher en 3D** dans le globe | [`aholo-viewer`](#aholo-viewer) · [`aholo-splat-transform`](#aholo-splat-transform) · [`brush`](#brush) · [`postshot`](#postshot) · [`opensplat`](#opensplat) | Capture téléphone/drone → Brush (3DGS) → splat-transform (LOD + collisions) → calque Cesium. |
| **ancrer** une caméra, un drone, un téléphone dans ce modèle 3D (VPS) | [`hloc`](#hloc) · [`colmap`](#colmap) · [`niantic-vps`](#niantic-vps) · [`arcore-geospatial`](#arcore-geospatial) · [`multiset-vps`](#multiset-vps) · [`rayban-capture`](#rayban-capture) | hloc + COLMAP = la voie libre, hors-ligne et sans compte ; les VPS du commerce restent du benchmark ou de la capture. |
| **rejouer** une crise minute par minute (4D) | [`recorder-4d`](#recorder-4d) · [`aisstream`](#aisstream) · [`gdelt`](#gdelt) · [`notams`](#notams) · [`outages`](#outages) · [`satellite-passes`](#satellite-passes) · [`gibis`](#gibis) | Le journal continu d'abord : sans lui les caches expirent et il n'y a plus rien à rejouer. |
| suivre des **navires**, et voir ceux qui **éteignent leur AIS** | [`aisstream`](#aisstream) · [`pipe-gaps`](#pipe-gaps) · [`recorder-4d`](#recorder-4d) | pipe-gaps (Apache-2.0) détecte les trous temporels de position : c'est exactement la détection de « dark vessel ». |
| suivre des **avions** et repérer un **brouillage GPS** | [`opensky`](#opensky) · [`shadowbroker`](#shadowbroker) · [`recorder-4d`](#recorder-4d) | OpenSky = flux gratuit ; le brouillage se déduit des écarts de trajectoire et de la qualité ADS-B (pattern ShadowBroker). |
| prédire le **passage d'un satellite** au-dessus d'un site | [`satellite-passes`](#satellite-passes) | Skyfield + TLE CelesTrak : 0 clé, et ça donne la fenêtre où l'image sera effectivement utile. |
| cartographier l'**infrastructure vitale** d'un territoire | [`desal-power`](#desal-power) · [`esri-carto-tuiles`](#esri-carto-tuiles) · [`sar-opera`](#sar-opera) | Centrales via Overpass (ODbL) ; la désalination se constitue à la main, une source datée par entrée. |
| suivre les **prix du carburant et du brut** sur la timeline | [`eia-oil`](#eia-oil) | Seules les données publiques (EIA) sont redistribuables — jamais Bloomberg/Refinitiv. |
| état de l'**internet** d'un pays (blackout, censure) | [`outages`](#outages) | Cloudflare Radar + IODA (comptes gratuits), ou RIPE Restless en auto-hébergé si tu veux zéro tiers. |
| empreinte web d'une **organisation** (et d'elle seule) | [`spiderfoot`](#spiderfoot) · [`theharvester`](#theharvester) · [`amass`](#amass) · [`maigret`](#maigret) · [`osint-framework`](#osint-framework) · [`opencti`](#opencti) · [`gephi`](#gephi) | ⚠️ Règle n°7 : aucune personne physique. Gephi ou OpenCTI pour lire le graphe, SpiderFoot pour le construire. |
| **communiquer sans internet** | [`reticulum`](#reticulum) · [`meshtastic`](#meshtastic) · [`rtl-sdr`](#rtl-sdr) | Reticulum en logiciel d'abord (0 €) ; les radios LoRa sont l'option, pas le prérequis. |
| garder la **mémoire** de l'agent et la sauvegarder | [`ai-memory-vault`](#ai-memory-vault) · [`obsidian`](#obsidian) · [`syncthing`](#syncthing) · [`sqlite-vec`](#sqlite-vec) | Des markdown dans le repo, synchronisés ; aucune base vectorielle n'est obligatoire. |
| automatiser les tâches répétitives (veille, triage, briefing) | [`activepieces`](#activepieces) · [`hermes-agent`](#hermes-agent) · [`openclaw`](#openclaw) · [`openhands`](#openhands) | Activepieces (MIT) remplace n8n (fair-code) ; Hermes et OpenHands pour le travail de code. |
| alternative **GUI** à tout ça, sans terminal | [`jan`](#jan) · [`pinokio`](#pinokio) · [`lm-studio`](#lm-studio) · [`gobbonet`](#gobbonet) | Jan et LM Studio = chat local ; Pinokio = lanceur de projets ; GobboNet = patron de l'installeur à un fichier. |


---

## 0 · Socle local (aucune donnée ne sort)

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **Ollama** `ollama` | Moteur d'inférence local : sert les LLM à toute la tour via une API compatible OpenAI… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/ollama/ollama) · [ollama.com](https://ollama.com/download) |
| **LiteLLM** `litellm` | Proxy unique devant Ollama + fournisseurs gratuits (Groq/OpenRouter :free) + payants : changer de… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/BerriAI/litellm) · [docs.litellm.ai](https://docs.litellm.ai) |
| **LM Studio** `lm-studio` | Alternative GUI à Ollama pour charger/tester des GGUF sans ligne de commande (sert aussi une API… | 🅰 | 🟢 gratuit | gratuit / source fermée | [lmstudio.ai](https://lmstudio.ai) · [lmstudio.ai](https://lmstudio.ai/docs) |
| **GobboNet (Elodine)** `gobbonet` | Référence du scénario « un seul fichier qui installe tout » : .exe 699 Ko qui pose llama.cpp + un… | 🅰 | 🟢 gratuit | « Other » (non-OSI) | [goblincorps.com](https://goblincorps.com/gobbonet) · [github.com](https://github.com/ElodineOfficial/GobboNet) |
| **Pinokio** `pinokio` | Launcher « 1 clic » qui clone, installe et démarre des projets open source | 🅰 | 🟢 gratuit | MIT (launcher) | [pinokio.computer](https://pinokio.computer) · [github.com](https://github.com/cocktailpeanut/pinokio) |
| **whisper.cpp** `whisper-cpp` | Transcription locale de mémos/radios/captures audio, sur CPU | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/ggml-org/whisper.cpp) · [huggingface.co](https://huggingface.co/ggerganov/whisper.cpp) |

<a id="ollama"></a>

### Ollama — `ollama`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Matériel** : CPU possible (lent), GPU recommandé ≥ 6 Go pour 8B
- **Rôle** : Moteur d'inférence local : sert les LLM à toute la tour via une API compatible OpenAI (http://127.0.0.1:11434/v1). Le socle de tout le reste.
- **Étapes d'installation** :
  - [A] Installer : Windows `winget install -e --id Ollama.Ollama` (ou https://ollama.com/download/OllamaSetup.exe) · Linux `curl -fsSL https://ollama.com/install.sh | sh` (à lire avant)
  - [B] Modèle selon le matériel : sans GPU `ollama pull qwen3:0.6b` · 6-8 Go VRAM `ollama pull llama3.1:8b` · 12-24 Go `ollama pull qwen3:30b-a3b`
  - [C] Embeddings : `ollama pull nomic-embed-text` (≈ 270 Mo, FR correct)
  - [D] Vérifier : `curl http://127.0.0.1:11434/api/tags` et `ollama run qwen3:0.6b 'prêt ?'`
- **Intégration dans la tour** : src/ai/llmClient.js lit OLLAMA_BASE_URL + OLLAMA_MODEL depuis .env ; repli silencieusement désactivé si l'API ne répond pas.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:11434/api/tags | head -c 200`
- **Notes / pièges** : Le seul composant obligatoire de la V2. Rien ne part sur internet avec un modèle local.
- **Sources** : https://github.com/ollama/ollama · https://ollama.com/download
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "ollama"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="litellm"></a>

### LiteLLM — `litellm`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Proxy unique devant Ollama + fournisseurs gratuits (Groq/OpenRouter :free) + payants : changer de modèle = changer une ligne de config, jamais du code.
- **Étapes d'installation** :
  - [A] `python3 -m pip install -U 'litellm[proxy]'`
  - [B] Créer `audit/stack/config/litellm.config.yaml` : `model_list` avec `ollama/qwen3:0.6b` en défaut + `groq/llama-3.3-70b-versatile` en secours
  - [C] Lancer : `litellm --config audit/stack/config/litellm.config.yaml --port 4000`
  - [D] La tour pointe désormais sur http://127.0.0.1:4000/v1
- **Intégration dans la tour** : Un seul endpoint pour `chatConsole`, `intelTwin`, `reaserch-engine`, les agents. Budgets/limits dans le config.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:4000/v1/models | head -c 300`
- **Notes / pièges** : Gratuit et local. Ne colle une clé payante que si tu choisis explicitement un secours cloud.
- **Sources** : https://github.com/BerriAI/litellm · https://docs.litellm.ai
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "litellm"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="lm-studio"></a>

### LM Studio — `lm-studio`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : gratuit / source fermée · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Alternative GUI à Ollama pour charger/tester des GGUF sans ligne de commande (sert aussi une API locale).
- **Étapes d'installation** :
  - [A] Télécharger l'installeur (Win/mac/Linux) → https://lmstudio.ai/download
  - [B] Developer → Local Server → charger un GGUF → activer le serveur sur 1234
  - [C] Alternative de secours pour la tour si Ollama est absent (décocher dans .env)
- **Intégration dans la tour** : Optionnel. À privilégier pour un usage non technique d'un proche, pas comme socle.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:1234/v1/models`
- **Notes / pièges** : Ferme = pas auditable par agent ; garder Ollama comme référence.
- **Sources** : https://lmstudio.ai · https://lmstudio.ai/docs
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "lm-studio"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="gobbonet"></a>

### GobboNet (Elodine) — `gobbonet`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : « Other » (non-OSI) · **Tour** : A/B/C indifféremment
- **Rôle** : Référence du scénario « un seul fichier qui installe tout » : .exe 699 Ko qui pose llama.cpp + un modèle choisi selon la VRAM, puis tourne débranché. C'est le modèle UX de notre installeur.
- **Étapes d'installation** :
  - [A] ⚠️ Référence uniquement, pas une dépendance : licence non ouverte, binaire non signé (SmartScreen)
  - [B] Si envie de goûter : télécharger le setup sur la page, lire les .bat/.ps1 du repo (le code est du script Windows lisible)
  - [C] Ce qu'on en copie : probe matériel → liste de modèles adaptés → 1 mot de passe local → serveur LAN
- **Intégration dans la tour** : Ne pas lier. Nos équivalents : `audit/stack/install-stack.ps1|.sh` + Ollama + Open WebUI.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Gratuit et honnête mais « open source » au sens large seulement. Windows only, Linux « probablement buggé » dixit l'auteur.
- **Sources** : https://goblincorps.com/gobbonet · https://github.com/ElodineOfficial/GobboNet
- **Né du lien analysé** : [The 1-Click Chatbot Alternative You Actually Own: GobboNet](https://www.youtube.com/watch?v=wxMB1OvJX2I&t=141s) *(audit, réf. n°8)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "gobbonet"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="pinokio"></a>

### Pinokio — `pinokio`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (launcher) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Launcher « 1 clic » qui clone, installe et démarre des projets open source. Utile pour tester une idée vite.
- **Étapes d'installation** :
  - [A] Télécharger depuis le site officiel (Windows/macOS/Linux)
  - [B] Discover → Download from URL → coller l'URL du repo (ex. la tour amont)
  - [C] ⚠️ Toujours lire le `main.json`/script avant Install : un script Pinokio exécute du code tiers avec tes droits
- **Intégration dans la tour** : Ne remplace pas notre installeur versionné ; nos scripts restent la voie de référence (lisibles, relançables, dans ton repo).
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Communauté = certains scripts non revus ; ne jamais exécuter un lien reçu en DM comme un .exe.
- **Sources** : https://pinokio.computer · https://github.com/cocktailpeanut/pinokio
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "pinokio"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="whisper-cpp"></a>

### whisper.cpp — `whisper-cpp`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Matériel** : CPU OK (0,5-2x temps réel selon taille de modèle)
- **Rôle** : Transcription locale de mémos/radios/captures audio, sur CPU. Alimente l'input texte de la tour.
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/ggml-org/whisper.cpp && cd whisper.cpp`
  - [B] `make -j` (Windows : `cmake -B build && cmake --build build --config Release`)
  - [C] Télécharger un modèle : `sh ./models/download-ggml-model.sh base`
  - [D] Test : `./build/bin/whisper-cli -m models/ggml-base.bin -f note.wav -l fr`
- **Intégration dans la tour** : src/voice/sttLocal.js appelle le binaire en local (file d'attente de fichiers), pas de cloud.
- **Vérification (à mettre dans `doctor`)** : `ls models/ggml-base.bin && ./build/bin/whisper-cli --help >/dev/null && echo ok`
- **Notes / pièges** : Si Python : faster-whisper est plus simple à brancher. GPU → vitesse x10.
- **Sources** : https://github.com/ggml-org/whisper.cpp · https://huggingface.co/ggerganov/whisper.cpp
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "whisper-cpp"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 1 · Recherche & collecte web

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **SearXNG** `searxng` | Méta-recherche privée auto-hébergée : tes requêtes ne sont plus attachées à ton identité auprès des… | 🅰 | 🟢 gratuit | AGPL-3.0 | [github.com](https://github.com/searxng/searxng) · [docs.searxng.org](https://docs.searxng.org) |
| **Vane (ex-Perplexica)** `vane-perplexica` | Moteur de réponse avec citations : lit le web via SearXNG, rerank, répond | 🅰 | 🟢 gratuit | MIT (36,6 k★) | [github.com](https://github.com/ItzCrazyKns/Vane) · [hub.docker.com](https://hub.docker.com/r/itzcrazykns1337/vane) |
| **Crawl4AI** `crawl4ai` | Page web → markdown propre / JSON structuré, avec rendu JS | 🅰 | 🟢 gratuit | Apache-2.0 (66-80 k★) | [github.com](https://github.com/unclecode/crawl4ai) · [docs.crawl4ai.com](https://docs.crawl4ai.com) |
| **Firecrawl (self-host)** `firecrawl` | Alternative à Crawl4AI : crawl + scrape + map + extract en REST, avec SDK compatibles | 🅱 | 🟢 gratuit | AGPL-3.0 (core) | [github.com](https://github.com/firecrawl/firecrawl) · [docs.firecrawl.dev](https://docs.firecrawl.dev/contributing/self-host) |

<a id="searxng"></a>

### SearXNG — `searxng`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : AGPL-3.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Méta-recherche privée auto-hébergée : tes requêtes ne sont plus attachées à ton identité auprès des moteurs. Devient le `SearxngRetriever` de `reaserch-engine` et le « cherche » de la tour.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-searxng -p 127.0.0.1:8080:8080 -e SEARXNG_SECRET=$(openssl rand -hex 20) -v $PWD/config/searxng:/etc/searxng searxng/searxng:latest`
  - [B] Activer la sortie JSON (indispensable pour un agent) : dans `settings.yml`, `search.formats: [html, json]`
  - [C] Engines FR utiles à activer : duckduckgo, google, bing, wikipedia, wikidata, qwant, mojeek
  - [D] Vérifier : `curl -s 'http://127.0.0.1:8080/search?q=test&format=json' | head -c 200`
- **Intégration dans la tour** : SEARCH_BASE_URL=http://localhost:8080/search dans .env ; Vane peut l'utiliser comme backend.
- **Vérification (à mettre dans `doctor`)** : `curl -s 'http://127.0.0.1:8080/search?q=frontignan&format=json' | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["results"]))'`
- **Notes / pièges** : Sans le `format=json`, un agent ne peut pas consommer le résultat : ne pas oublier le [B].
- **Sources** : https://github.com/searxng/searxng · https://docs.searxng.org
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "searxng"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="vane-perplexica"></a>

### Vane (ex-Perplexica) — `vane-perplexica`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (36,6 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Moteur de réponse avec citations : lit le web via SearXNG, rerank, répond. Remplace un Perplexity à 20 $/mois. UI de recherche « dossier » pour la tour.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-vane -p 127.0.0.1:3000:3000 -v vane-data:/home/vane/data itzcrazykns1337/vane:latest`
  - [B] Ouvrir http://localhost:3000 → Settings → Model : ajouter `http://host.docker.internal:11434/v1` (Ollama) → 0 API externe
  - [C] (option) Brancher notre SearXNG : `SEARXNG_API_URL=http://127.0.0.1:8080`
  - [D] Vérifier : poser « Quelle est la population de Frontignan ? » → réponse citée
- **Intégration dans la tour** : VANE_BASE_URL=http://localhost:3000/api ; les réponses citées nourrissent `hudSummaryResponse.js` et les dossiers de recherche.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000`
- **Notes / pièges** : ⚠️ Le nom a changé en mars 2026 (repo `Perplexica` → `Vane`) : les vieux tutos donnent une image Docker obsolète. Vérifier le nom d'image au build.
- **Sources** : https://github.com/ItzCrazyKns/Vane · https://hub.docker.com/r/itzcrazykns1337/vane
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "vane-perplexica"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="crawl4ai"></a>

### Crawl4AI — `crawl4ai`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (66-80 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Page web → markdown propre / JSON structuré, avec rendu JS. Le « yeux » qui manque à `reaserch-engine` pour lire les pages que SearXNG trouve.
- **Étapes d'installation** :
  - [A] `python3 -m venv .venv && source .venv/bin/activate` (Win : `.venv\Scripts\activate`)
  - [B] `pip install -U crawl4ai && crawl4ai-setup` (pose Chromium/Playwright)
  - [C] Test : `crwl https://example.com -o markdown`
  - [D] En service : `crawl4ai-server --port 11235` (API) ou `AsyncWebCrawler` dans le moteur
- **Intégration dans la tour** : engine/retrieval.py → `Crawl4AiRetriever(search_request)` renvoie du markdown horodaté, prêt pour l'extraction d'évidence.
- **Vérification (à mettre dans `doctor`)** : `crwl https://en.wikipedia.org/wiki/Frontignan -o markdown | head -20`
- **Notes / pièges** : Pas de clé, pas de facture ; le mode extraction LLM est optionnel et marchera sur Ollama. ~300 Mo de RAM idle + Chromium.
- **Sources** : https://github.com/unclecode/crawl4ai · https://docs.crawl4ai.com
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "crawl4ai"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="firecrawl"></a>

### Firecrawl (self-host) — `firecrawl`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : AGPL-3.0 (core) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : Alternative à Crawl4AI : crawl + scrape + map + extract en REST, avec SDK compatibles. À considérer seulement si tu veux un service multi-projets.
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/firecrawl/firecrawl && cd firecrawl`
  - [B] `docker compose -f apps/api/docker-compose.yaml up -d` (⚠️ nécessite Redis ; image ~500 Mo)
  - [C] Endpoint local : `http://localhost:3002/v1/scrape`
- **Intégration dans la tour** : Non recommandé pour une tour légère : Crawl4AI couvre le besoin à plus petite empreinte.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/v0/scrape`
- **Notes / pièges** : AGPL + service lourd. Le cloud Firecrawl est freemium/crédités → éviter.
- **Sources** : https://github.com/firecrawl/firecrawl · https://docs.firecrawl.dev/contributing/self-host
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "firecrawl"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 2 · Docs, RAG, sortie structurée

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **Marker** `marker` | PDF/EPUB/DOCX → markdown propre (layout-aware : colonnes, tableaux, équations) | 🅱 | 🟢 gratuit | Apache-2.0 (39,5 k★, a migré depuis GPLv3) | [github.com](https://github.com/datalab-to/marker) · [pypi.org](https://pypi.org/project/marker-pdf/) |
| **Docling (IBM)** `docling` | Convertit PDF/DOCX/PPTX/HTML en markdown + JSON typé, robuste sur les documents de bureau | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/docling-project/docling) · [docling-project.github.io](https://docling-project.github.io/docling/) |
| **OCRmyPDF** `ocrmypdf` | Rend cherchable un PDF scanné (ajoute une couche texte), corrige l'inclinaison, déskew | 🅰 | 🟢 gratuit | MPL-2.0 | [gitlab.cern.ch](https://gitlab.cern.ch/ocrmypdf/ocrmypdf) · [ocrmypdf.readthedocs.io](https://ocrmypdf.readthedocs.io) |
| **Tesseract OCR** `tesseract` | OCR d'image (capture CCTV, photo de panneau, plan, capture d'écran) | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/tesseract-ocr/tesseract) · [github.com](https://github.com/UB-Mannheim/tesseract/wiki) |
| **PaddleOCR** `paddleocr` | OCR moderne robuste (manuscrits, tableaux, multilingue, PP-OCRv5) | 🅰 | 🟢 gratuit | Apache-2.0 (88,9 k★) | [github.com](https://github.com/PaddlePaddle/PaddleOCR) · [paddleocr.ai](https://www.paddleocr.ai/latest/) |
| **LibreTranslate** `libretranslate` | Traduction hors-ligne (API) : documents étrangers lus par la tour sans upload chez un tiers. | 🅰 | 🟢 gratuit | AGPL-3.0 | [github.com](https://github.com/LibreTranslate/LibreTranslate) · [libretranslate.com](https://libretranslate.com/docs) |
| **Chonkie** `chonkie` | Stratégies de découpe pour le RAG (token, sentence, recursive, semantic, late chunking) — la qualité de… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/chonkie-ai/chonkie) · [docs.chonkie.ai](https://docs.chonkie.ai) |
| **Qdrant** `qdrant` | Base vectorielle (Rust) pour corpus importants (100 k+ chunks), avec filtres temporels/méta — pratique… | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/qdrant/qdrant) · [qdrant.tech](https://qdrant.tech/documentation/) |
| **LanceDB** `lancedb` | Vecteurs + colonnes typées **en fichiers**, sans serveur : le choix par défaut d'une tour | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/lancedb/lancedb) · [lancedb.com](https://lancedb.com/docs) |
| **Outlines** `outlines` | Contraint la génération token par token → JSON **qui valide le schéma**, par construction | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/dottxt-ai/outlines) · [dottxt-ai.github.io](https://dottxt-ai.github.io/outlines/) |
| **Instructor** `instructor` | Sorties typées Pydantic + retries + validation, sur n'importe quel endpoint OpenAI-compatible → marche… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/567-labs/instructor) · [python.useinstructor.com](https://python.useinstructor.com) |
| **DSPy** `dspy` | Optimise les prompts et les poids par programme (métrique → compilation) au lieu du tuning manuel. | 🅱 | 🟢 gratuit | MIT | [github.com](https://github.com/stanfordnlp/dspy) · [dspy.ai](https://dspy.ai) |
| **Langfuse** `langfuse` | Observabilité des runs : traces par étape, coûts, evals, gestion de prompts | 🅱 | 🟢 gratuit | MIT (core) | [github.com](https://github.com/langfuse/langfuse) · [langfuse.com](https://langfuse.com/self-hosting) |

<a id="marker"></a>

### Marker — `marker`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (39,5 k★, a migré depuis GPLv3) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : PDF/EPUB/DOCX → markdown propre (layout-aware : colonnes, tableaux, équations). La porte d'entrée de `ETAT-DE-LART-PSYCHOLOGIE` et des arrêtés/DOC d'urbanisme vers le RAG.
- **Étapes d'installation** :
  - [A] `pip install marker-pdf`
  - [B] Un fichier : `marker_single chemin/vers/doc.pdf /sortie --use_llm False`
  - [C] Dossier entier : `marker /corpus /out --workers 4`
  - [D] CPU possible (lent) ; GPU ≈ x10. Modèles ≈ 1-2 Go téléchargés au premier run.
- **Intégration dans la tour** : corpus/ + CLI `python -m engine.ingest <pdf>` → alimente le graphe d'évidence.
- **Vérification (à mettre dans `doctor`)** : `marker_single --help >/dev/null && echo ok`
- **Notes / pièges** : La licence est revenue en Apache-2.0 : usage commercial redevenu propre (à re-vérifier au moment de l'install).
- **Sources** : https://github.com/datalab-to/marker · https://pypi.org/project/marker-pdf/
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "marker"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="docling"></a>

### Docling (IBM) — `docling`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Convertit PDF/DOCX/PPTX/HTML en markdown + JSON typé, robuste sur les documents de bureau. Alternative plus légère que Marker quand le GPU manque.
- **Étapes d'installation** :
  - [A] `pip install docling`
  - [B] `docling conversion mondocument.pdf --to md`
  - [C] En Python : `DocumentConverter().convert(path).document.export_to_markdown()`
- **Intégration dans la tour** : Choix par défaut pour `ETAT-DE-LART-PSYCHOLOGIE` (pptx/pdf mélangés).
- **Vérification (à mettre dans `doctor`)** : `docling --version`
- **Notes / pièges** : Moins bon que Marker sur les équations, plus simple sur les PPTX.
- **Sources** : https://github.com/docling-project/docling · https://docling-project.github.io/docling/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "docling"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="ocrmypdf"></a>

### OCRmyPDF — `ocrmypdf`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MPL-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Rend cherchable un PDF scanné (ajoute une couche texte), corrige l'inclinaison, déskew. Indispensable pour les documents anciens/arrêtés numérisés.
- **Étapes d'installation** :
  - [A] `sudo apt install ocrmypdf ghostscript` (ou `pip install ocrmypdf`)
  - [B] `ocrmypdf -l fra entree.pdf sortie.pdf`
  - [C] Chaîne utile : `ocrmypdf` → `docling` → chunking → index
- **Intégration dans la tour** : Pré-traitement du `corpus/` de `reaserch-engine`.
- **Vérification (à mettre dans `doctor`)** : `ocrmypdf --version`
- **Notes / pièges** : Ghostscript est AGPL mais appelé en CLI : pas d'obligation de licence sur tes documents.
- **Sources** : https://gitlab.cern.ch/ocrmypdf/ocrmypdf · https://ocrmypdf.readthedocs.io
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "ocrmypdf"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="tesseract"></a>

### Tesseract OCR — `tesseract`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : OCR d'image (capture CCTV, photo de panneau, plan, capture d'écran). Ce qui manque à la tour pour « lire » ce qu'elle voit.
- **Étapes d'installation** :
  - [A] Linux : `sudo apt install tesseract-ocr tesseract-ocr-fra` · Windows : installeur UB-Mannheim (lien) · macOS : `brew install tesseract tesseract-lang`
  - [B] Test : `tesseract capture.png stdout -l fra+eng --psm 6`
  - [C] Dans le navigateur (zéro install serveur) : `npm i tesseract.js` + worker, ou `--lang fra`
  - [D] Pour les rendus lourds : PaddleOCR (Apache-2.0, 88,9 k★)
- **Intégration dans la tour** : src/ocr.js : bouton « lire cette image » sur `ficheLieu` et les flux CCTV ; texte → `reaserch-engine`.
- **Vérification (à mettre dans `doctor`)** : `tesseract --version && tesseract --list-langs | grep -i fra`
- **Notes / pièges** : Sur captures basse qualité, PaddleOCR gagne ; Tesseract gagne en zéro-dépendance et vitesse CPU.
- **Sources** : https://github.com/tesseract-ocr/tesseract · https://github.com/UB-Mannheim/tesseract/wiki
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "tesseract"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="paddleocr"></a>

### PaddleOCR — `paddleocr`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (88,9 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : OCR moderne robuste (manuscrits, tableaux, multilingue, PP-OCRv5). Le choix qualité.
- **Étapes d'installation** :
  - [A] `pip install paddlepaddle rapidocr-onnxruntime` (ou `pip install paddleocr`)
  - [B] CLI : `rapidocr --image_dir capture.png`
  - [C] En Python : `from rapidocr_onnxruntime import RapidOCR; RapidOCR()(path)`
- **Intégration dans la tour** : Remplaçable avec Tesseract derrière la même interface `src/ocr.js`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import rapidocr_onnxruntime,sys;print("ok")'`
- **Notes / pièges** : RapidOCR (ONNX) évite la grosse dépendance Paddle. ~1 Go de poids initial.
- **Sources** : https://github.com/PaddlePaddle/PaddleOCR · https://www.paddleocr.ai/latest/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "paddleocr"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="libretranslate"></a>

### LibreTranslate — `libretranslate`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : AGPL-3.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Traduction hors-ligne (API) : documents étrangers lus par la tour sans upload chez un tiers.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-translate -p 127.0.0.1:5000:5000 --init ghcr.io/argosopentech/argos-translate:latest`
  - [B] `curl -s -X POST http://127.0.0.1:5000/translate -d '{"q":"bonjour","source":"fr","target":"en"}'`
  - [C] Ou `pip install libretranslate && libretranslate --host 127.0.0.1`
- **Intégration dans la tour** : src/i18n/translateLocal.js, branché sur les fiches et les résultats de recherche.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:5000/languages | head -c 200`
- **Notes / pièges** : Qualité correcte FR↔EN/ES/DE ; loin de DeepL sur les langues hors européen. Version hébergée publique = dépannage, pas confidentiel.
- **Sources** : https://github.com/LibreTranslate/LibreTranslate · https://libretranslate.com/docs
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "libretranslate"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="chonkie"></a>

### Chonkie — `chonkie`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Stratégies de découpe pour le RAG (token, sentence, recursive, semantic, late chunking) — la qualité de récupération se joue ici.
- **Étapes d'installation** :
  - [A] `pip install chonkie`
  - [B] `python -c "from chonkie import SemanticChunker; print(SemanticChunker(model='ollama/qwen3:0.6b'))"`
  - [C] Utiliser `RecursiveChunker` pour les DOC markdown issus de docling/marker
- **Intégration dans la tour** : `reaserch-engine` : l'étape d'ingestion d'évidence avant l'extraction.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import chonkie;print(chonkie.__version__)'`
- **Notes / pièges** : Léger, mono-mainteneur : épingler la version dans requirements.
- **Sources** : https://github.com/chonkie-ai/chonkie · https://docs.chonkie.ai
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "chonkie"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="qdrant"></a>

### Qdrant — `qdrant`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Base vectorielle (Rust) pour corpus importants (100 k+ chunks), avec filtres temporels/méta — pratique pour un graphe d'évidence daté.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-qdrant -p 127.0.0.1:6333:6333 -v qdrant:/qdrant/storage qdrant/qdrant:latest`
  - [B] `curl -s http://127.0.0.1:6333/collections`
  - [C] Python : `from qdrant_client import QdrantClient; QdrantClient(url='http://127.0.0.1:6333')`
- **Intégration dans la tour** : Optionnel au-dessous de ~50 k chunks → sinon LanceDB.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:6333/readyz`
- **Notes / pièges** : Qdrant Cloud a un tier gratuit (avec compte) : inutile ici.
- **Sources** : https://github.com/qdrant/qdrant · https://qdrant.tech/documentation/
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "qdrant"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="lancedb"></a>

### LanceDB — `lancedb`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Vecteurs + colonnes typées **en fichiers**, sans serveur : le choix par défaut d'une tour. Zéro conteneur, zéro port.
- **Étapes d'installation** :
  - [A] `pip install lancedb`
  - [B] `python -c "import lancedb; db=lancedb.connect('data/lancedb'); print(db.table_names())"`
  - [C] Indexer avec le même embedder qu'Ollama (`nomic-embed-text`)
- **Intégration dans la tour** : `reaserch-engine/engine/persistence.py` → store vectoriel local derrière l'interface existante.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import lancedb;print("ok")'`
- **Notes / pièges** : Recommandé avant Qdrant : moins de pièces, mêmes usages jusqu'à ~1 M de lignes.
- **Sources** : https://github.com/lancedb/lancedb · https://lancedb.com/docs
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "lancedb"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="outlines"></a>

### Outlines — `outlines`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Matériel** : GPU utile, pas obligatoire
- **Rôle** : Contraint la génération token par token → JSON **qui valide le schéma**, par construction. Fini le parsing fragile.
- **Étapes d'installation** :
  - [A] `pip install outlines`
  - [B] Charger un de TES schémas : `json.loads(open('schemas/evidence.schema.json').read())` → `outlines.from_json(schema)`
  - [C] `Generator('hugging-quants/...', backend='transformers')` ou via un endpoint compatible
  - [D] Alternative sans GPU : valider avec `jsonschema` + retry (Instructor)
- **Intégration dans la tour** : `reaserch-engine` : chaque agent (claims/evidence/conclusion) sort du validé par `schemas/*.schema.json`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import outlines;print("ok")'`
- **Notes / pièges** : Marche avec modèles locaux (transformers/vLLM/llamacpp). Avec Ollama, préfère Instructor+jsonschema si Outlines refuse le backend.
- **Sources** : https://github.com/dottxt-ai/outlines · https://dottxt-ai.github.io/outlines/
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "outlines"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="instructor"></a>

### Instructor — `instructor`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Sorties typées Pydantic + retries + validation, sur n'importe quel endpoint OpenAI-compatible → marche avec Ollama et LiteLLM.
- **Étapes d'installation** :
  - [A] `pip install instructor pydantic`
  - [B] `client = instructor.from_openai(OpenAI(base_url='http://127.0.0.1:11434/v1', api_key='x'), mode=instructor.Mode.JSON)`
  - [C] Déclarer `class Evidence(BaseModel): ...` calqué sur `schemas/evidence.schema.json`
  - [D] `client.chat.completions.create(response_model=Evidence, messages=..., max_retries=3)`
- **Intégration dans la tour** : Le pont propre entre les LLM et les schémas JSON du repo.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import instructor;print(instructor.__version__)'`
- **Notes / pièges** : La voie la plus simple pour une tour sans GPU. Recommandé en premier choix.
- **Sources** : https://github.com/567-labs/instructor · https://python.useinstructor.com
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "instructor"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="dspy"></a>

### DSPy — `dspy`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : Optimise les prompts et les poids par programme (métrique → compilation) au lieu du tuning manuel.
- **Étapes d'installation** :
  - [A] `pip install dspy`
  - [B] `dspy.LM('ollama_chat/qwen3:4b', api_base='http://127.0.0.1:11434')`
  - [C] Définir un `Signature` (question → claims) + un dataset de 20-50 exemples de ton domaine
  - [D] `dspy.GRPO`/`BootstrapFewShot` puis sauvegarder `program.json`
- **Intégration dans la tour** : `reaserch-engine` : optimiser la stratégie de décomposition de question sur tes dossiers archivés.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import dspy;print(dspy.__version__)'`
- **Notes / pièges** : Avant d'optimiser : il te faut des exemples annotés. Ne pas commencer par là.
- **Sources** : https://github.com/stanfordnlp/dspy · https://dspy.ai
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "dspy"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="langfuse"></a>

### Langfuse — `langfuse`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (core) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : Observabilité des runs : traces par étape, coûts, evals, gestion de prompts. Ce qui rend `reaserch-engine` débogable.
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/langfuse/langfuse && cd langfuse`
  - [B] `cp .env.example .env` → générer les secrets → `docker compose up -d` (Postgres + ClickHouse + MinIO)
  - [C] `pip install langfuse` puis décorer les étapes : `@observe()`
  - [D] UI : http://localhost:3001 (projet créé en local, sans compte cloud)
- **Intégration dans la tour** : Chaque agent du moteur émet une trace nommée ; le `docs/` de l'audit recommande de logger `run.context`.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001`
- **Notes / pièges** : Lourd (~4 Go RAM) : sur une tour 8 Go, préfère des traces JSONL dans `data/traces/` — ton moteur écrit déjà des checkpoints JSON, c'est à 80 % ça.
- **Sources** : https://github.com/langfuse/langfuse · https://langfuse.com/self-hosting
- **Né du lien analysé** : [Open-Source AI Tools That Feel ILLEGAL To Use](https://www.youtube.com/watch?v=-9Iw86Y991E) *(audit, réf. n°1)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "langfuse"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 3 · OSINT infrastructures

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **SpiderFoot** `spiderfoot` | Collecte OSINT automatisée sur 200+ sources (domaine, IP, e-mail, empreinte d'infra), UI web + API +… | 🅰 | 🟢 gratuit | MIT (21,7 k★) | [github.com](https://github.com/smicallef/spiderfoot) · [spiderfoot.net](https://www.spiderfoot.net/documentation/) |
| **theHarvester** `theharvester` | E-mails + sous-domaines + hosts d'une organisation, en 5 minutes. | 🅰 | 🟡 compte gratuit | GPL-3.0 | [github.com](https://github.com/laramies/theHarvester) |
| **Amass (OWASP)** `amass` | Énumération de sous-domaines la plus complète en free (brute + passif + JS). | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/owasp-amass/amass) · [owasp-amass.com](https://owasp-amass.com) |
| **Maigret** `maigret` | Dossier de présence par pseudo sur 3000+ sites (professionnel : empreinte d'une organisation/marque). | 🅰 | 🟢 gratuit | MIT (37,3 k★) | [github.com](https://github.com/soxoj/maigret) · [maigret.readthedocs.io](https://maigret.readthedocs.io) |
| **ExifTool** `exiftool` | Métadonnées de fichiers (photo, PDF, capture) : géoloc, modèle d'appareil, dates, logiciel, historique… | 🅰 | 🟢 gratuit | Perl Artistic | [exiftool.org](https://exiftool.org) |
| **OSINT Framework** `osint-framework` | Index arborescent de sources ouvertes (la carte mentale du métier) | 🅰 | 🟢 gratuit | web | [osintframework.com](https://osintframework.com) · [github.com](https://github.com/lockfale/OSINT-Framework) |
| **Maltego CE** `maltego-ce` | Graphe + transforms historique du domaine | 🅰 | 🟡 compte gratuit | propriétaire (CE gratuit) | [maltego.com](https://www.maltego.com/pricing/) · [maltego.com](https://www.maltego.com/continue-to-hub/?hub=https://www.maltego.com/editions/) |
| **OpenCTI** `opencti` | Plateforme de threat-intel (observable → infra → groupe) | 🅰 | 🟢 gratuit | ⚠️ NOASSERTION (vérifier la LICENSE du commit visé) | [github.com](https://github.com/OpenCTI-Platform/opencti) · [docs.opencti.io](https://docs.opencti.io/latest/deployment/installation/) |
| **Gephi** `gephi` | Visualisation/analyse de graphes (layout, métriques) pour explorer les liens sortis de SpiderFoot. | 🅰 | 🟢 gratuit | GPL-3.0 | [gephi.org](https://gephi.org) · [github.com](https://github.com/gephi/gephi) |
| **GDELT (événements mondiaux géolocalisés)** `gdelt` | Un point par événement géopolitique (manifestation, incident aérien, explosion…) avec date, lieu, tons… | 🅰 | 🟢 gratuit | données ouvertes (usage gratuit, non commercial pour les gros volumes) | [gdeltproject.org](https://www.gdeltproject.org) · [blog.gdeltproject.org](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) · [api.gdeltproject.org](https://api.gdeltproject.org/api/v2/doc/doc) |

<a id="spiderfoot"></a>

### SpiderFoot — `spiderfoot`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (21,7 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Collecte OSINT automatisée sur 200+ sources (domaine, IP, e-mail, empreinte d'infra), UI web + API + scans programmables.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-spiderfoot -p 127.0.0.1:5001:5001 -v spiderfoot:/root/.spiderfoot blacktop/spiderfoot:latest`
  - [B] (ou source) `git clone --depth 1 https://github.com/smicallef/spiderfoot && pip install -r requirements.txt && python sf.py -l 127.0.0.1:5001`
  - [C] Ouvrir http://localhost:5001 → New Scan → cible = un domaine d'infrastructure
  - [D] Désactiver les modules non conformes (personnes, réseaux sociaux de particuliers)
- **Intégration dans la tour** : Résultats → entités de `intelTwin.js` (ports, services, sous-domaines d'une collectivité, d'un site).
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://localhost:5001`
- **Notes / pièges** : La version hébergée « HX » est payante : inutile. Les modules les plus utiles demandent des clés gratuites (Shodan, VirusTotal, SecurityTrails) — optionnel.
- **Sources** : https://github.com/smicallef/spiderfoot · https://www.spiderfoot.net/documentation/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "spiderfoot"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="theharvester"></a>

### theHarvester — `theharvester`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : GPL-3.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : E-mails + sous-domaines + hosts d'une organisation, en 5 minutes.
- **Étapes d'installation** :
  - [A] `pipx install theHarvester` (ou `pip install theHarvester`)
  - [B] `theHarvester -d exemple.fr -b all`
  - [C] Sortie JSON : `-f out.json` pour la consommer dans le moteur
- **Intégration dans la tour** : Phase de cadrage d'un dossier `reaserch-engine`.
- **Vérification (à mettre dans `doctor`)** : `theHarvester -h >/dev/null && echo ok`
- **Notes / pièges** : Certaines sources demandent une clé gratuite (Hunter, Shodan) : sinon le reste marche quand même.
- **Sources** : https://github.com/laramies/theHarvester
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "theharvester"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="amass"></a>

### Amass (OWASP) — `amass`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Énumération de sous-domaines la plus complète en free (brute + passif + JS).
- **Étapes d'installation** :
  - [A] `go install github.com/owasp-amass/amass/v4/...@master` (ou binaire release)
  - [B] `amass enum -passive -d exemple.fr -o sub.txt`
  - [C] Actif (optionnel) : `amass enum -active -brutes -d exemple.fr` ⚠️ plus intrusif
- **Intégration dans la tour** : Alimente la carte des entités (infrastructures) de la tour.
- **Vérification (à mettre dans `doctor`)** : `amass -version`
- **Notes / pièges** : Ne scanner que ce que tu as le droit de scanner ; mode passif par défaut.
- **Sources** : https://github.com/owasp-amass/amass · https://owasp-amass.com
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "amass"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="maigret"></a>

### Maigret — `maigret`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (37,3 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Dossier de présence par pseudo sur 3000+ sites (professionnel : empreinte d'une organisation/marque).
- **Étapes d'installation** :
  - [A] `pipx install maigret`
  - [B] `maigret -c data/cookies.jsonl nom_de_marque -f reports/x.html`
  - [C] Utiliser `--no-recursion` et un profil dédié pour ne rien polluer
- **Intégration dans la tour** : ⚠️ Uniquement sur des identifiants **organisationnels** (entité publique, service, marque). Jamais sur une personne physique : la ligne du projet amont est explicite.
- **Vérification (à mettre dans `doctor`)** : `maigret --version`
- **Notes / pièges** : Puissant donc sensible. En FR : droit à la vie privée (art. 9 C. civ.) + RGPD dès que tu stockes/exposes.
- **Sources** : https://github.com/soxoj/maigret · https://maigret.readthedocs.io
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "maigret"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="exiftool"></a>

### ExifTool — `exiftool`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Perl Artistic · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Métadonnées de fichiers (photo, PDF, capture) : géoloc, modèle d'appareil, dates, logiciel, historique de rédac.
- **Étapes d'installation** :
  - [A] `sudo apt install libimage-exiftool-perl` (ou télécharger le binaire)
  - [B] `exiftool capture.png`
  - [C] En masse : `exiftool -csv /corpus/images > meta.csv`
- **Intégration dans la tour** : Bouton « métadonnées » sur `ficheLieu` ; alerte « image sans géoloc » = potentiellement recadrée.
- **Vérification (à mettre dans `doctor`)** : `exiftool -ver`
- **Notes / pièges** : Aussi l'outil de **nettoyage** (`-all=`) avant de publier une capture. Les 2 sens, à connaître.
- **Sources** : https://exiftool.org
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "exiftool"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="osint-framework"></a>

### OSINT Framework — `osint-framework`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : web · **Tour** : A/B/C indifféremment
- **Rôle** : Index arborescent de sources ouvertes (la carte mentale du métier). À absorber comme catalogue de connecteurs, pas comme outil.
- **Étapes d'installation** :
  - [A] Parcourir l'arbre, repérer les sources **gratuites sans clé** pertinentes pour ton territoire
  - [B] En dériver un fichier `connecteurs-osint.json` (id, url, auth: none|free-key, type de sortie)
  - [C] Brancher les 5 meilleurs dans `intelTwin.js` comme calques optionnels
- **Intégration dans la tour** : Le fichier de connecteurs devient la config lue par les agents : ils savent quoi est gratuit.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Beaucoup d'entrées sont payantes ou mortes : filtrer, ne jamais intégrer sans tester.
- **Sources** : https://osintframework.com · https://github.com/lockfale/OSINT-Framework
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "osint-framework"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="maltego-ce"></a>

### Maltego CE — `maltego-ce`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : propriétaire (CE gratuit) · **Tour** : A/B/C indifféremment
- **Rôle** : Graphe + transforms historique du domaine. Payant pour l'usage sérieux.
- **Étapes d'installation** :
  - [A] À ne PAS installer : SpiderFoot (collecte) + Gephi (graphe) + `intelTwin` (visualisation dans le globe) couvrent le besoin à 0 €
  - [B] Si besoin absolu : CE = credits mensuels limités + compte obligatoire
- **Intégration dans la tour** : Non.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Piège du « gratuit puis bloqué ». Notre stack maison fait le graphe dans le globe, c'est un avantage sur Maltego.
- **Sources** : https://www.maltego.com/pricing/ · https://www.maltego.com/continue-to-hub/?hub=https://www.maltego.com/editions/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "maltego-ce"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="opencti"></a>

### OpenCTI — `opencti`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : ⚠️ NOASSERTION (vérifier la LICENSE du commit visé) · **Tour** : A/B/C indifféremment
- **Rôle** : Plateforme de threat-intel (observable → infra → groupe). Très au-dessus du besoin d'une tour de veille.
- **Étapes d'installation** :
  - [A] Non recommandé : 16-32 Go RAM, Elasticsearch + Redis + RabbitMQ + MinIO
  - [B] Si impératif : `docker compose` officiel + `opencti_worker`
  - [C] Équivalent léger pour toi : SpiderFoot → LanceDB → `intelTwin`
- **Intégration dans la tour** : Non.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Licence ambigüe sur GitHub : à clarifier avant tout usage public.
- **Sources** : https://github.com/OpenCTI-Platform/opencti · https://docs.opencti.io/latest/deployment/installation/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "opencti"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="gephi"></a>

### Gephi — `gephi`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : GPL-3.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Visualisation/analyse de graphes (layout, métriques) pour explorer les liens sortis de SpiderFoot.
- **Étapes d'installation** :
  - [A] Télécharger l'installeur (nécessite JDK 17+)
  - [B] Importer un CSV/GEXF généré par notre exporter
  - [C] ⚠️ Alternative intégrée : dessiner le graphe **dans le globe** (calque `linksGraph.js`), c'est mieux pour la tour
- **Intégration dans la tour** : Exporter `graph.gexf` depuis `evidence_graph.py` → utile pour les présentations.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Desktop Java : pas automatisable par un agent au-delà de l'export.
- **Sources** : https://gephi.org · https://github.com/gephi/gephi
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "gephi"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="gdelt"></a>

### GDELT (événements mondiaux géolocalisés) — `gdelt`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : données ouvertes (usage gratuit, non commercial pour les gros volumes) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Un point par événement géopolitique (manifestation, incident aérien, explosion…) avec date, lieu, tons émotionnels : la **couche temporelle** qui transforme une carte en 4D, sans aucune clé.
- **Étapes d'installation** :
  - [A] DOC 2.0 API (GET, sans clé) : `curl 'https://api.gdeltproject.org/api/v2/doc/doc?query=location:FR&mode=artlist&format=json&maxrecords=50&timespan=1h'`
  - [B] En gros volume : télécharger les 15-min GDELT 2.0 export CSV (3 GB/jour ⚠️ → ne garder que la bbox cible et 30 j)
  - [C] GKG pour les tons : filtrer « conflict / protest » → pins colorés
  - [D] Écrire dans le `recorder-4d` pour la lecture rétrospective
- **Intégration dans la tour** : `src/gdelt.js` → pins « incidents » cliquables dans `ficheLieu` ; nourrit le MODE ANALYSE de `intelTwin`.
- **Vérification (à mettre dans `doctor`)** : `curl -s 'https://api.gdeltproject.org/api/v2/doc/doc?query=FRANCE&mode=artlist&format=json&maxrecords=1' | head -c 200`
- **Notes / pièges** : ⚠️ **Ne jamais transformer cette couche en surveillance de personnes** : agrégats thématiques/géographiques uniquement. GDELT est bruyant : toujours afficher la source, jamais une interprétation seule.
- **Sources** : https://www.gdeltproject.org · https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ · https://api.gdeltproject.org/api/v2/doc/doc
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "gdelt"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 4 · Géoservices & imagerie de la tour

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **Tuiles Esri World Imagery + CARTO (déjà en place)** `esri-carto-tuiles` | Le globe satellite et la carte routière de la tour, **sans clé** — l'avantage structurel de ton fork… | 🅰 | 🟢 gratuit | Esri (usage perso) / CARTO-OSM | [github.com](https://github.com/Sathancabrol/watchtower-mods (mapStackController.js)) · [basemaps.cartocdn.com](https://basemaps.cartocdn.com) |
| **Photon → Nominatim (géocodage sans clé, déjà en place)** `photon-nominatim` | Recherche de lieux de la tour, sans clé Google | 🅰 | 🟢 gratuit | OSM (ODbL) | [photon.komoot.io](https://photon.komoot.io) · [github.com](https://github.com/komoot/photon) · [nominatim.org](https://nominatim.org) |
| **Cesium ion (tuiles 3D photoréalistes)** `cesium-ion` | Upgrade visuel optionnel de la tour : 3D photoréaliste + terrain | 🅰 | 🟡 compte gratuit | Cesium (token gratuit usage perso) | [ion.cesium.com](https://ion.cesium.com) · [cesium.com](https://cesium.com/platform/cesium-for-unreal/cesium-ion-pricing) · [github.com](https://github.com/Sathancabrol/watchtower-mods (keySetup.js)) |
| **OpenSky Network** `opensky` | Positions de vol (le calque avions de la tour / des amonts). | 🅰 | 🟡 compte gratuit | données ouvertes (compte = quota supérieur) | [opensky-network.org](https://opensky-network.org) · [opensky-network.org](https://opensky-network.org/monitor) |
| **God's Eye View (amont de ta tour)** `gods-eye-view` | Le projet amont (17,9 k★) que ton fork adapte : globe + couches live + voix | 🅰 | 🟢 gratuit | ⚠️ README dit MIT, l'API GitHub renvoie NOASSERTION | [github.com](https://github.com/bilawalsidhu/gods-eye-view) · [youtube.com](https://www.youtube.com/watch?v=GRJaKcXZS94) |
| **ShadowBroker (réf. amont)** `shadowbroker` | La V2 4D de « God's Eye View » déjà construite par quelqu'un d'autre : 60+ flux OSINT (ADS-B, AIS 25… | 🅰 | 🟢 gratuit | AGPL-3.0 (11,1 k★, actif) | [github.com](https://github.com/BigBodyCobain/Shadowbroker) |
| **Enregistreur temporel (le vrai manque)** `recorder-4d` | La leçon des vidéos Hormuz : ce qui rend une tour « 4D », ce n'est pas un calque de plus, c'est… | 🅰 | 🟢 gratuit | à écrire (nous) | [duckdb.org](https://duckdb.org/docs/stable/guides/ingestion/ingesting_parquet.html) · [cesium.com](https://cesium.com/learn/cesiumjs/ref-doc/Clock.html) |
| **Prédictions de passage satellite (Skyfield + CelesTrak)** `satellite-passes` | Le calque « un satellite passe au-dessus de ce site à 14 h 07 » : TLE/OMM gratuits, propagation locale,… | 🅰 | 🟢 gratuit | MIT (Skyfield, sgp4) · CelesTrak = données gratuites | [github.com](https://github.com/skyfielders/python-skyfield) · [celestrak.org](https://celestrak.org) · [github.com](https://github.com/brandon-rhodes/python-sgp4) |
| **aisstream.io (flux AIS temps réel)** `aisstream` | WebSocket mondial d'AIS : c'est la source qui a permis l'analyse du détroit d'Ormuz (130 traversées/j →… | 🅰 | 🟡 compte gratuit | service gratuit, clé sur inscription | [aisstream.io](https://aisstream.io) · [app.aisstream.io](https://app.aisstream.io) |
| **GlobalFishingWatch/pipe-gaps (navires sombres)** `pipe-gaps` | Détection de **trous temporels dans les messages de position AIS** : l'algo public derrière le… | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/GlobalFishingWatch/pipe-gaps) |
| **NOTAM / fermetures d'espace aérien** `notams` | Les « airspace closures » en cascade que la vidéo 2 montre en timeline : la tour doit savoir où et… | 🅰 | 🟢 gratuit | données publiques (FAA/EASA) ; parseurs MIT | [notamweb.faa.gov](https://notamweb.faa.gov) · [github.com](https://github.com/svoop/notam) · [easa.europa.eu](https://www.easa.europa.eu/en/domains/airspaces) |
| **Surveillance des pannes internet (Cloudflare Radar / IODA / Restless)** `outages` | Le calque « Téhéran en blackout » : corréler coupures réseau et événements, sur une timeline. | 🅰 | 🟡 compte gratuit | API gratuites (compte) ; Restless MIT | [developers.cloudflare.com](https://developers.cloudflare.com/radar/) · [ioda.caida.org](https://ioda.caida.org) · [github.com](https://github.com/RIPE-NCC/restless) |
| **SAR : NASA OPERA + Copernicus EGMS + Sentinel-1** `sar-opera` | Voir à travers les nuages et mesurer le déplacement du sol au millimètre : digues, friches,… | 🅰 | 🟡 compte gratuit | données ouvertes (comptes Earthdata / Copernicus gratuits) | [search.earthdata.nasa.gov](https://search.earthdata.nasa.gov/search?q=OPERA) · [asf.alaska.edu](https://asf.alaska.edu/datasets/operational-products/opera/) · [egms.land.copernicus.eu](https://egms.land.copernicus.eu) |
| **NASA GIBS + Copernicus Browser (imagerie quotidienne gratuite)** `gibis` | Les images « before/after » du reportage, à 0 $ : tuiles WMTS quotidiennes MODIS/VIIRS/Sentinel-2, sans… | 🅰 | 🟢 gratuit | domaine public / Copernicus (citer) | [nasa-gibs.github.io](https://nasa-gibs.github.io/gibs-api-docs/) · [worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov) · [browser.dataspace.copernicus.eu](https://browser.dataspace.copernicus.eu) |
| **EIA API (futures et prix du carburant)** `eia-oil` | Les courbes de brut du reportage (Brent, WTI, essai) synchronisées sur la timeline du globe. | 🅰 | 🟡 compte gratuit | données publiques US, clé gratuite immédiate | [eia.gov](https://www.eia.gov/api/) · [eia.gov](https://www.eia.gov/opendata/) |
| **Infrastructures critiques : désalination + centrales** `desal-power` | Le chapitre « Desalination Plants & The Water Crisis » : la tour doit connaître l'infrastructure vitale… | 🅰 | 🟢 gratuit | OSM (ODbL) / datasets à vérifier | [ida-desalination.org](https://ida-desalination.org/publications/ida-desalination-performance-guide) · [powerplants.copernicus.fr](https://powerplants.copernicus.fr/) · [openstreetmap.fr](https://openstreetmap.fr) |

<a id="esri-carto-tuiles"></a>

### Tuiles Esri World Imagery + CARTO (déjà en place) — `esri-carto-tuiles`
- **Statut** : 🟩 **présent** (déjà dans la tour, à consolider) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Esri (usage perso) / CARTO-OSM · **Tour** : A/B/C indifféremment
- **Rôle** : Le globe satellite et la carte routière de la tour, **sans clé** — l'avantage structurel de ton fork sur l'amont.
- **Étapes d'installation** :
  - [A] Rien : déjà dans `COGNITORIUM/watchtower-mods/src/mapStackController.js` (CARTO Voyager remplace osm.org, bloqué)
  - [B] Vérifier au build que les URL de tuiles ne sont pas rate-limitées (user-agent + cache)
- **Intégration dans la tour** : Base de tous les calques.
- **Vérification (à mettre dans `doctor`)** : `curl -sI 'https://basemaps.cartocdn.com/rastertiles/voyager/12/2114/1437.png' | head -1`
- **Notes / pièges** : CGU : usage non commercial pour les tuiles « community » ; vérifier à chaque mise à jour de l'app.
- **Sources** : https://github.com/Sathancabrol/watchtower-mods (mapStackController.js) · https://basemaps.cartocdn.com
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "esri-carto-tuiles"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="photon-nominatim"></a>

### Photon → Nominatim (géocodage sans clé, déjà en place) — `photon-nominatim`
- **Statut** : 🟩 **présent** (déjà dans la tour, à consolider) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : OSM (ODbL) · **Tour** : A/B/C indifféremment
- **Rôle** : Recherche de lieux de la tour, sans clé Google. Déjà remplacé dans tes mods (`locations.js`).
- **Étapes d'installation** :
  - [A] Déjà en place dans `src/locations.js`
  - [B] Pour retirer la dépendance aux instances publiques : `docker run -d -p 127.0.1:2322 komoot/photon` (⚠️ nécessite l'import d'un dump ~30 Go → ne le faire que si tu as le disque)
  - [C] Respect du 1 req/s sur Nominatim public, User-Agent obligatoire
- **Intégration dans la tour** : Le cœur du « va à Marseille ».
- **Vérification (à mettre dans `doctor`)** : `curl -s 'https://photon.komoot.io/api/?q=frontignan&limit=1' | head -c 200`
- **Notes / pièges** : Ne pas spammer les instances publiques, sinon bannissement : cache + throttle côté app.
- **Sources** : https://photon.komoot.io · https://github.com/komoot/photon · https://nominatim.org
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "photon-nominatim"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="cesium-ion"></a>

### Cesium ion (tuiles 3D photoréalistes) — `cesium-ion`
- **Statut** : 🟨 **partiel** (existant à compléter/remplacer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : Cesium (token gratuit usage perso) · **Tour** : A/B/C indifféremment
- **Rôle** : Upgrade visuel optionnel de la tour : 3D photoréaliste + terrain. Ton startGate « MODE PAYANT » est fait pour ça.
- **Étapes d'installation** :
  - [A] Créer un compte gratuit → copier le token par défaut
  - [B] Le coller dans l'app (POWER UP / `keySetup.js`) → ✓ vert → redémarrage auto
  - [C] Vérifier le quota sur le dashboard ion, ne pas exposer l'instance
- **Intégration dans la tour** : `src/startGate.js` + `keySetup.js` : déjà conçus pour ça.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' 'https://assets.cesium.com/' `
- **Notes / pièges** : Gratuit **avec compte** et quotas éligibles (perso/non commercial). L'alternative 0 compte = rester sur Esri (moins joli, gratuit).
- **Sources** : https://ion.cesium.com · https://cesium.com/platform/cesium-for-unreal/cesium-ion-pricing · https://github.com/Sathancabrol/watchtower-mods (keySetup.js)
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "cesium-ion"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="opensky"></a>

### OpenSky Network — `opensky`
- **Statut** : 🟨 **partiel** (existant à compléter/remplacer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : données ouvertes (compte = quota supérieur) · **Tour** : A/B/C indifféremment
- **Rôle** : Positions de vol (le calque avions de la tour / des amonts).
- **Étapes d'installation** :
  - [A] Anonyme : `curl -s 'https://opensky-network.org/api/states/all?bbox=3.4,43.3,4.2,43.7'` (quota faible, souvent 429)
  - [B] Mieux : créer un compte gratuit (client_id/secret) ou utiliser `adsb.lol` (sans clé)
  - [C] Dans la tour, `OPENSKY_AUTH_MODE=anon` reste le mode par défaut
- **Intégration dans la tour** : Déjà traité par l'amont + ton fork.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' https://opensky-network.org/api/states/all`
- **Notes / pièges** : Avec un agent local, `adsb.lol` + un dongle RTL-SDR (~30 €) = zéro dépendance à un tiers et couverture locale. Voir P7.
- **Sources** : https://opensky-network.org · https://opensky-network.org/monitor
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "opensky"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="gods-eye-view"></a>

### God's Eye View (amont de ta tour) — `gods-eye-view`
- **Statut** : 🟨 **partiel** (existant à compléter/remplacer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : ⚠️ README dit MIT, l'API GitHub renvoie NOASSERTION · **Tour** : A/B/C indifféremment
- **Rôle** : Le projet amont (17,9 k★) que ton fork adapte : globe + couches live + voix. Ta valeur ajoutée = le MODE GRATUIT sans clé et les modules FR.
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/bilawalsidhu/gods-eye-view` puis appliquer `COGNITORIUM/watchtower-mods/APPLIQUER.md`
  - [B] `npm install && npm run dev` → http://localhost:4173 (le repo `watchtower` en ligne est encore vide de l'app)
  - [C] Vérifier le fichier `LICENSE` du commit `65bc522` et ouvrir une issue si ambigu
  - [D] Ne pas remonter tes clés sur une instance partagée (`--host 0.0.0.0` = fuite de clés, averti par leur SECURITY.md)
- **Intégration dans la tour** : C'est la base de la tour ; l'audit §0 décrit ce qui en a déjà été dérivé.
- **Vérification (à mettre dans `doctor`)** : `test -d app/node_modules && echo 'déjà en place'`
- **Notes / pièges** : La ligne amont est claire : pas de recherche de personne, pas de visage, pas de pistage — à conserver.
- **Sources** : https://github.com/bilawalsidhu/gods-eye-view · https://www.youtube.com/watch?v=GRJaKcXZS94
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "gods-eye-view"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="shadowbroker"></a>

### ShadowBroker (réf. amont) — `shadowbroker`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : AGPL-3.0 (11,1 k★, actif) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : La V2 4D de « God's Eye View » déjà construite par quelqu'un d'autre : 60+ flux OSINT (ADS-B, AIS 25 000+ navires via aisstream.io, satellites, GPS jamming par dégradation NAC-P, pannes internet via IODA, SAR NASA OPERA/Copernicus EGMS, CCTV, Meshtastic, APRS, KiwiSDR, GDELT), 40 calques commutables, dossier pays au clic droit, toolkit de recon côté serveur **sans clé**, backend FastAPI self-host, aucun compte ni télémétrie, et un canal de commande pour agent (OpenClaw).
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/BigBodyCobain/Shadowbroker && cd Shadowbroker`
  - [B] `docker compose pull && docker compose up -d` (frontend :3000, backend :8000 — `BACKEND_PORT` dans `.env` si collision)
  - [C] **Ne pas l'adopter tel quel** : le faire comme banc d'essai, puis **piober les connecteurs** dans `watchtower-mods` (nos modules FR + notre startGate sans clé restent la base)
  - [D] Désactiver/retirer avant toute publication les calques qui visent des **personnes** : superyachts de milliardaires, bases militaires, chefs d'État, Telegram de guerre. Notre ligne (audit §4.4) ne les admet pas
  - [E] Clés optionnelles déjà prévues : `SHODAN_API_KEY` (gratuit avec compte) ; le reste fonctionne sans clé
- **Intégration dans la tour** : Source de patterns pour 8 couches de la tour : `gpsJamming.js`, `darkVessels.js`, `satPasses.js`, `notams.js`, `outages.js`, `sarChanges.js`, `telegramPins.js`, `countryDossier.js`. Et surtout son **modèle serveur** : recon proxifiée côté backend + SSRF guard + auth opérateur local = exactement ce que notre tour doit imiter.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000`
- **Notes / pièges** : AGPL : si tu **publies un service** dérivé, tu rediffuses les modifs (usage perso = aucun souci). Projet jeune (1 fork de migration de repo en mars 2026, README le dit) → ne jamais le mettre en dépendance de build, seulement en source d'idées et de connecteurs. **C'est la découverte la plus rentable de cet audit.**
- **Sources** : https://github.com/BigBodyCobain/Shadowbroker
- **Né du lien analysé** : [Ex-Google PM Builds God's Eye to Monitor Iran in 4D](https://www.youtube.com/watch?v=0p8o7AeHDzg) *(audit, réf. n°13)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "shadowbroker"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="recorder-4d"></a>

### Enregistreur temporel (le vrai manque) — `recorder-4d`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : à écrire (nous) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : La leçon des vidéos Hormuz : ce qui rend une tour « 4D », ce n'est pas un calque de plus, c'est **l'enregistrement continu** (il « enregistrait depuis le 25 février ») + une timeline réplayable. Sans ça, la tour est éternellement au présent et tout disparaît quand le cache du fournisseur se vide.
- **Étapes d'installation** :
  - [A] Un collecteur par flux, idempotent et bon marché : `collector.mjs` (OpenSky, aisstream, CelesTrak, EONET, USGS) toutes les 60 s → lignes NDJSON gzippées dans `data/4d/YYYY-MM-DD/`
  - [B] Consolidation nocturne en DuckDB/Parquet : `duckdb -c "COPY (SELECT * FROM read_ndjson_auto('data/4d/*/*.ndjson')) TO 'data/4d.parquet'"`
  - [C] API de lecture temporale dans le serveur dev : `GET /api/4d?from=..&to=..&layer=ais` → renvoie l'état à t
  - [D] UI : brancher `viewer.clock` Cesium (CurrentTime + timeline scrubber, multiplicateur x3600) + un calque « trajectoires » (lignes datées, pointillés = trous de signal)
  - [E] Règle de rétention : 30 j en chaud, compression ensuite — jamais de données personnelles, jamais de contenus sous copyright tiers archivés
- **Intégration dans la tour** : `src/timeline/replayer.js`, `src/recorder/collectors/*.mjs`, et le calque `darkVessels.js` qui n'existe **que** grâce à l'historique (un trou dans l'AIS = une détection, sinon rien à détecter).
- **Vérification (à mettre dans `doctor`)** : `ls data/4d/ && sqlite3 data/4d.duckdb 'select count(*) from ais' 2>/dev/null || python3 -c "import duckdb;print(duckdb.sql('select count(*) from \u0027data/4d.parquet\u0027').fetchone())"`
- **Notes / pièges** : Coût : 0 €. Disque : ~1-3 Go/mois pour 4-5 flux à 60 s. C'est le P8 prioritaire, avant tout nouveau calque.
- **Sources** : https://duckdb.org/docs/stable/guides/ingestion/ingesting_parquet.html · https://cesium.com/learn/cesiumjs/ref-doc/Clock.html
- **Né du lien analysé** : [Ex-Google PM Builds God's Eye to Monitor Iran in 4D](https://www.youtube.com/watch?v=0p8o7AeHDzg) *(audit, réf. n°13)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "recorder-4d"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="satellite-passes"></a>

### Prédictions de passage satellite (Skyfield + CelesTrak) — `satellite-passes`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (Skyfield, sgp4) · CelesTrak = données gratuites · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Le calque « un satellite passe au-dessus de ce site à 14 h 07 » : TLE/OMM gratuits, propagation locale, liens avec les couches imagerie et alertes.
- **Étapes d'installation** :
  - [A] `pip install skyfield sgp4`
  - [B] Récupérer les TLE : `curl -s 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle' -o data/tle/visual.tle` (groupes utiles : `stations`, `geodetic` (imagerie), `military` n'existe pas → catalogue complet + filtrage par nom)
  - [C] Prédire : `from skyfield.api import load, EarthSatellite; …` → `satellite.at(t).subpoint()` pour la trace, `pass_of(t0,t1)` pour l'AOS/LOS
  - [D] Rafraîchir 2x/jour via cron (Activepieces ou systemd timer) — les TLE pourrissent en ~3 jours
- **Intégration dans la tour** : `src/satPasses.js` : lignes de visée vers une zone suivie + fenêtre d'imagerie Sentinel-2 (nuages via Open-Meteo) → la tour dit **quand** photographier.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import skyfield,sgp4;print(skyfield.__version__)'`
- **Notes / pièges** : Space-Track (compte gratuit) = catalogue plus complet/à jour ; utile seulement si tu veux les objets classifiés légaux (USA-234 Topaz est public, lui).
- **Sources** : https://github.com/skyfielders/python-skyfield · https://celestrak.org · https://github.com/brandon-rhodes/python-sgp4
- **Né du lien analysé** : [Ex-Google PM Builds God's Eye to Monitor Iran in 4D](https://www.youtube.com/watch?v=0p8o7AeHDzg) *(audit, réf. n°13)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "satellite-passes"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="aisstream"></a>

### aisstream.io (flux AIS temps réel) — `aisstream`
- **Statut** : 🟨 **partiel** (existant à compléter/remplacer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : service gratuit, clé sur inscription · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : WebSocket mondial d'AIS : c'est la source qui a permis l'analyse du détroit d'Ormuz (130 traversées/j → ~10, soit -92 %). L'amont de ta tour prévoyait déjà cette clé.
- **Étapes d'installation** :
  - [A] Inscription gratuite (e-mail) → clé
  - [B] `wss://stream.aisstream.io/v0/stream` avec un message de souscription `{bounding_box, filters_type, mmsi}` — **se limiter à des bbox**, le flux mondial tuerait la tour
  - [C] Parser avec `libais` (ou `pip install ais`) et écrire dans le `recorder-4d`
  - [D] Sans clé : désactivation propre du calque (comportement actuel du fork — ne pas casser)
- **Intégration dans la tour** : `src/vessels.js` (déjà prévu amont) + enregistrement → indispensable pour `darkVessels.js`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c "import websockets;print(1)"`
- **Notes / pièges** : La clé ne doit jamais transiter par le navigateur : côté serveur uniquement (modèle déjà appliqué par `shadowbroker`).
- **Sources** : https://aisstream.io · https://app.aisstream.io
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "aisstream"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="pipe-gaps"></a>

### GlobalFishingWatch/pipe-gaps (navires sombres) — `pipe-gaps`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Détection de **trous temporels dans les messages de position AIS** : l'algo public derrière le phénomène « dark transit » décrit dans l'article (Jag Vasant : pointillés = passage sous escorte).
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/GlobalFishingWatch/pipe-gaps`
  - [B] Le faire tourner sur **notre** Parquet de positions (pas leur infra GFW)
  - [C] Configurer le seuil de trou (les données de zones denses sont bruitées : signaux s'annulent → exclure les détroits saturés hors cible)
  - [D] Croiser avec un registre de pavillon pour le tri (Inde/Pakistan/Liberia/Comores dans le cas Hormuz)
- **Intégration dans la tour** : `src/darkVessels.js` : le navire disparaît → un pointillé + une fiche « dernière position connue » ; **aucune** identification de personne, uniquement des entités maritimes.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import pandas,shapely;print("deps gaps ok")'`
- **Notes / pièges** : La GFW API (clé gratuite) fournit déjà des événements `ais_gaps` prêts à l'emploi : commencer par l'API, puis passer au calcul local pour les zones qui intéressent la tour.
- **Sources** : https://github.com/GlobalFishingWatch/pipe-gaps
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "pipe-gaps"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="notams"></a>

### NOTAM / fermetures d'espace aérien — `notams`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : données publiques (FAA/EASA) ; parseurs MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Les « airspace closures » en cascade que la vidéo 2 montre en timeline : la tour doit savoir où et quand le ciel est fermé.
- **Étapes d'installation** :
  - [A] Source : `GET https://notamweb.faa.gov/REST/AdcNotamSearch/api/v1/notam/list` (États-Unis) et Eurocontrol/EASA pour l'Europe ; en FR aussi l'INFOAéronautique (SIA)
  - [B] Parser le format F-Series (regex ou `notam` gem MIT / `notam-parsers` JS) → `{icao, radius_nm, altitude, debut, fin}`
  - [C] Alimenter le `recorder-4d` pour que les fermetures soient **réplayables**
  - [D] Dessiner sur Cesium (cercles + fuseaux d'altitude, rouge = actif)
- **Intégration dans la tour** : `src/airspace.js` (nouveau) + agrégat `nearbyPlaces.js` ; alerte quand une zone surveillée est couverte.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' https://notamweb.faa.gov/ 2>/dev/null || echo 'réseau à valider depuis la tour'`
- **Notes / pièges** : Le parsing NOTAM est ingrat (format texte de 1970) : accepter un taux de faux positifs, et toujours afficher le texte brut à côté de l'interprétation.
- **Sources** : https://notamweb.faa.gov · https://github.com/svoop/notam · https://www.easa.europa.eu/en/domains/airspaces
- **Né du lien analysé** : [Ex-Google PM Builds God's Eye to Monitor Iran in 4D](https://www.youtube.com/watch?v=0p8o7AeHDzg) *(audit, réf. n°13)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "notams"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="outages"></a>

### Surveillance des pannes internet (Cloudflare Radar / IODA / Restless) — `outages`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : API gratuites (compte) ; Restless MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Le calque « Téhéran en blackout » : corréler coupures réseau et événements, sur une timeline.
- **Étapes d'installation** :
  - [A] Cloudflare Radar (gratuit, compte + jeton) : `GET /api/v1/networks/traffic/outages?countryCode=IR&since=…`
  - [B] IODA (Georgia Tech, gratuit sans clé) : agrégat de connectivité par pays
  - [C] En local : `docker run` de RIPE **Restless** (MIT) → surveillance des préfixes AS, alertes NRT en temps réel
  - [D] Restless = le seul des trois qui ne dépend d'aucun tiers : à privilégier si la tour devient autonome
- **Intégration dans la tour** : `src/outages.js` + un KPI `intelTwin.js` (« connectivité territoriale ») — très pertinent pour un usage FR (outre-mer, crises).
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' https://api.cloudflare.com/client/v4/radar/datasets 2>/dev/null || echo 'nécessite jeton'`
- **Notes / pièges** : API tier gratuit → prévoir cache 15 min et repli silencieux si le quota tombe.
- **Sources** : https://developers.cloudflare.com/radar/ · https://ioda.caida.org · https://github.com/RIPE-NCC/restless · https://radar.cloudflare.com
- **Né du lien analysé** : [Ex-Google PM Builds God's Eye to Monitor Iran in 4D](https://www.youtube.com/watch?v=0p8o7AeHDzg) *(audit, réf. n°13)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "outages"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="sar-opera"></a>

### SAR : NASA OPERA + Copernicus EGMS + Sentinel-1 — `sar-opera`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : données ouvertes (comptes Earthdata / Copernicus gratuits) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Voir à travers les nuages et mesurer le déplacement du sol au millimètre : digues, friches, affaissements, glissements — le calque qui rend la tour utile **en France** (et ce que la vidéo 2 appelle le « ground change detection »).
- **Étapes d'installation** :
  - [A] Créer 2 comptes gratuits : **NASA Earthdata** et **Copernicus Data Space Ecosystem**
  - [B] OPERA CSLC/DISP → ASF DAAC via `pip install asf-search` + earthaccess ; EGMS (Service TMP) → téléchargement GeoTIFF par bbox + `snap`/`gdal`
  - [C] Sentinelsat : `pip install sentinelsat` → requête Sentinel-1 GRD avant/après un événement
  - [D] Rendu : `gdal_calc` sur les paires → image de différence → calque Cesium (opacité + curseur temporel lié au `recorder-4d`)
- **Intégration dans la tour** : `src/sar.js` (diff avant/après) + alertes de déformation sur les sites suivis (via l'API alertes d'EGMS).
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import asf_search;print(asf_search.__version__)'`
- **Notes / pièges** : Traitement lourd : 20-60 s par interférométrie sur CPU, quelques minutes sur GPU → lancer en tâche de fond (Activepieces), jamais dans le cycle de rendu de la tour.
- **Sources** : https://search.earthdata.nasa.gov/search?q=OPERA · https://asf.alaska.edu/datasets/operational-products/opera/ · https://egms.land.copernicus.eu · https://dataspace.copernicus.eu
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "sar-opera"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="gibis"></a>

### NASA GIBS + Copernicus Browser (imagerie quotidienne gratuite) — `gibis`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : domaine public / Copernicus (citer) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Les images « before/after » du reportage, à 0 $ : tuiles WMTS quotidiennes MODIS/VIIRS/Sentinel-2, sans clé.
- **Étapes d'installation** :
  - [A] Tuile test : `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-04/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`
  - [B] Dans Cesium : `WebMapTileServiceImageryProvider` avec `Time` dans `GetResource` → tuiles datées → **déjà compatible avec le curseur temporel**
  - [C] Sentinel-2 via Copernicus Browser pour le avant/après à 10 m ; PNA (Planet) = payant → ne pas promettre
  - [D] Attribuer (« NASA GIBS », « Copernicus ») dans `DATA_SOURCES.md`
- **Intégration dans la tour** : Calque `dailyImagery.js` dans la pile `mapStackController` (3e source gratuite, après Esri et CARTO).
- **Vérification (à mettre dans `doctor`)** : `curl -sI 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-04/GoogleMapsCompatible_Level9/5/16/11.jpg' | head -1`
- **Notes / pièges** : La force de GIBS : c'est **temporel par conception**. Avec le recorder, la tour devient rétrospective sans aucun abonnement.
- **Sources** : https://nasa-gibs.github.io/gibs-api-docs/ · https://worldview.earthdata.nasa.gov · https://browser.dataspace.copernicus.eu
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "gibis"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="eia-oil"></a>

### EIA API (futures et prix du carburant) — `eia-oil`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : données publiques US, clé gratuite immédiate · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Les courbes de brut du reportage (Brent, WTI, essai) synchronisées sur la timeline du globe.
- **Étapes d'installation** :
  - [A] Clé gratuite : https://www.eia.gov/opendata/register.php
  - [B] `curl 'https://api.eia.gov/v2/petroleum/pri/spw/data?frequency=weekly&data[]=Price&facets[series_id]=EMD_EPD2D_PTE_SCA_DPC&api_key=***'`
  - [C] Alternative zéro-clé à tester : `pip install open-meteo` (le fournisseur a une API de prix du carburant dans ~20 pays) + Yahoo/Stooq pour le brut (non redistribuable ⚠️)
  - [D] Séries → mini-graphe dans `splitFlap`/`hudSummaryResponse`, aligné sur l'horloge du `recorder-4d`
- **Intégration dans la tour** : `src/markets.js` + un KPI dans le bandeau `intelTwin.js`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import requests;print(requests.get("https://api.eia.gov/v2",timeout=8).status_code)'`
- **Notes / pièges** : ⚠️ Les cotations (Bloomberg/Refinitiv) ne sont **pas** redistribuables : n'afficher que des données publiques (EIA) ou un lien sortant.
- **Sources** : https://www.eia.gov/api/ · https://www.eia.gov/opendata/
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "eia-oil"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="desal-power"></a>

### Infrastructures critiques : désalination + centrales — `desal-power`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : OSM (ODbL) / datasets à vérifier · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Le chapitre « Desalination Plants & The Water Crisis » : la tour doit connaître l'infrastructure vitale du territoire qu'elle surveille.
- **Étapes d'installation** :
  - [A] Centrales : dataset Copernicus « European Power Plants » (CC-BY, à re-vérifier) **ou** requête Overpass `power=plant` sur l'emprise (ODbL)
  - [B] Désalination : pas de jeu ouvert mondial fiable → créer `data/critical/desalination.yml` (source par entrée, date de relevé, capacité) ; la GDIDA/WAVES est payante — ne pas promettre
  - [C] Overpass : `curl -s 'https://overpass-api.de/api/interpreter' --data-urlencode 'data=[out:json];area["name"="Hérault"]->.a;node[power=plant](area.a);out;'`
  - [D] Calque `criticalInfra.js` avec niveau de criticité + sources par entité (règle : aucune entité sans source datée)
- **Intégration dans la tour** : KPI « civilisation territoriale » déjà dans `intelTwin.js` → devient alimenté par des données sourcées au lieu d'heuristiques.
- **Vérification (à mettre dans `doctor`)** : `curl -s 'https://overpass-api.de/api/interpreter?data=[out:json];node[power=plant](43.4,3.0,43.8,4.0);out%205;' | head -c 200`
- **Notes / pièges** : La valeur ajoutée ici, c'est **la rigueur des sources**, pas la quantité de points. Chaque entité : lien + date + licence.
- **Sources** : https://ida-desalination.org/publications/ida-desalination-performance-guide · https://powerplants.copernicus.fr/ · https://openstreetmap.fr
- **Né du lien analysé** : [One Chokepoint Controls Everything](https://spatialintelligence.ai/p/one-chokepoint-controls-everything) *(audit, réf. n°14)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "desal-power"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 4b · Positionnement spatial (VPS) & ancrage des scans

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **hloc (localisation visuelle 6-DoF)** `hloc` | La version **libre et auto-hébergée** du VPS montré avec les Ray-Bans : image requête → retrieval +… | 🅱 | 🟢 gratuit | Apache-2.0 (4,2 k★) | [github.com](https://github.com/cvg/Hierarchical-Localization) · [github.com](https://github.com/cvg/SuperGluePretrainedNetwork) |
| **COLMAP (SfM de référence)** `colmap` | Reconstruction 3D + poses caméra à partir de photos : c'est la « 3D map pré-scanée » dont parle la… | 🅰 | 🟢 gratuit | new BSD (le fichier LICENSE l'affirme ; GitHub renvoie NOASSERTION ⚠️) | [github.com](https://github.com/colmap/colmap) · [colmap.github.io](https://colmap.github.io) |
| **Google ARCore Geospatial API** `arcore-geospatial` | Le VPS « mondial » par défaut : Localisation VLM sur 15 ans d'images Street View dans 100+ pays | 🅰 | 🟡 compte gratuit | gratuit (sans facturation à l'appel), quota + compte obligatoire | [developers.google.com](https://developers.google.com/ar/develop/geospatial) · [developers.google.com](https://developers.google.com/ar/develop/geospatial/android/placecolors) |
| **Niantic Spatial VPS + Scaniverse** `niantic-vps` | Le VPS communautaire : 30 Md de photos issues de Pokémon GO/Ingress, et **Scaniverse** qui produit des… | 🅰 | 🟡 compte gratuit | gratuit < 50 k MAU (VPS/ARDK) ; Scaniverse = app gratuite + crédits | [nianticspatial.com](https://www.nianticspatial.com/products/visual-positioning-system) · [scaniverse.com](https://scaniverse.com) · [nianticspatial.com](https://www.nianticspatial.com/en/faq/scaniverse) |
| **MultiSet AI (VPS commercial)** `multiset-vps` | Le VPS utilisé dans la vidéo Ray-Ban : scan-agnostique (E57, Matterport, PLY, **3DGS**, Polycam,… | 🅰 | 🟠 semi-payant | service propriétaire (SDK Unity/iOS/Android/WebXR/Quest/ROS 2) | [multiset.ai](https://www.multiset.ai/visual-positioning-system) · [multiset.ai](https://www.multiset.ai/pricing) · [multiset.ai](https://www.multiset.ai/developers) |

<a id="hloc"></a>

### hloc (localisation visuelle 6-DoF) — `hloc`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (4,2 k★) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Matériel** : 6 Go+ recommandé (PyTorch)
- **Rôle** : La version **libre et auto-hébergée** du VPS montré avec les Ray-Bans : image requête → retrieval + SuperPoint/SuperGlue → pose 6-DoF contre un modèle SfM. Centimétrique, hors-ligne, aucune API.
- **Étapes d'installation** :
  - [A] `git clone --recurse-submodules https://github.com/cvg/Hierarchical-Localization && pip install -e .` + `pip install pycolmap`
  - [B] Construire la carte : `python hloc/run_all.py --dataset path/to/site --sfm glomap|colmap --features local` (SuperPoint+SuperGlue)
  - [C] Localiser une photo : étape 5 du pipeline → `predictions.h5` (position + orientation)
  - [D] Version moderne plus rapide : `pablovela5620/hloc-glomap` (Apache-2.0, Pixi + UI Gradio + Rerun)
- **Intégration dans la tour** : Anchoring des calques : positionner une caméra CCTV, un drone ou un téléphone **dans** le scan 3DGS, puis relier « qui regarde quoi » dans `cctvFocusPolicy.js` / `intelTwin.js`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import hloc;print("hloc ok")'`
- **Notes / pièges** : GPU fortement conseillé. C'est le chemin 100 % gratuit quand Google/Niantic/MultiSet coûtent ou exigent un compte — et le seul qui marche sans réseau sur un site isolé.
- **Sources** : https://github.com/cvg/Hierarchical-Localization · https://github.com/cvg/SuperGluePretrainedNetwork
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "hloc"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="colmap"></a>

### COLMAP (SfM de référence) — `colmap`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : new BSD (le fichier LICENSE l'affirme ; GitHub renvoie NOASSERTION ⚠️) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Reconstruction 3D + poses caméra à partir de photos : c'est la « 3D map pré-scanée » dont parle la vidéo — l'intrant de hloc **et** des splats.
- **Étapes d'installation** :
  - [A] `sudo apt install colmap` (ou binaire release ; GUI dispo)
  - [B] CLI sans GUI pour un agent : `colmap feature_extractor && colmap exhaustive_matcher && colmap mapper && colmap bundle_adjuster`
  - [C] Sortie `sparse/0/` → directement consommé par Brush (3DGS) et par hloc
  - [D] ⚠️ **GLOMAP** (le successeur 10-100x plus rapide) est marqué `[DEPRECATED]` sur `colmap/glomap` depuis janv. 2026 : ne pas en faire une dépendance, tester `hloc-glomap` en option seulement
- **Intégration dans la tour** : `scripts/photo-to-model.sh` : 150 photos d'un site → COLMAP → Brush → splats → ancrage via hloc.
- **Vérification (à mettre dans `doctor`)** : `colmap help >/dev/null && echo 'colmap ok'`
- **Notes / pièges** : ⚠️ Cas d'école de la règle n°4 du §0 : la licence est bonne (BSD) mais **l'API GitHub ne la voit pas** → vérifier le fichier LICENSE, pas l'auto-détection.
- **Sources** : https://github.com/colmap/colmap · https://colmap.github.io
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "colmap"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="arcore-geospatial"></a>

### Google ARCore Geospatial API — `arcore-geospatial`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : gratuit (sans facturation à l'appel), quota + compte obligatoire · **Tour** : A/B/C indifféremment
- **Rôle** : Le VPS « mondial » par défaut : Localisation VLM sur 15 ans d'images Street View dans 100+ pays. C'est ce que l'auteur a construit chez Google.
- **Étapes d'installation** :
  - [A] ⚠️ Nécessite un device ARCore compatible + le SDK Google AR : **pas embarquable dans la tour web**, utilisable depuis une app mobile
  - [B] Si tu veux le tester : Android Studio + `com.google.ar:core` + API activée dans un projet Google Cloud (clé gratuite, quota)
  - [C] Pour nous : **garder hloc en local**, et considérer ARCore uniquement comme benchmark de précision
- **Intégration dans la tour** : Non (dépendance mobile + compte Google). Pattern utile : « match image → modèle 3D », c'est exactement `hloc`.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Gratuit mais : indoor = mort, zones sans Street View = mort, et tes images partent chez Google. Les deux cas où l'on paie ou où l'on est bloqué sont précisément ceux où hloc gagne.
- **Sources** : https://developers.google.com/ar/develop/geospatial · https://developers.google.com/ar/develop/geospatial/android/placecolors
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "arcore-geospatial"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="niantic-vps"></a>

### Niantic Spatial VPS + Scaniverse — `niantic-vps`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : gratuit < 50 k MAU (VPS/ARDK) ; Scaniverse = app gratuite + crédits · **Tour** : A/B/C indifféremment
- **Rôle** : Le VPS communautaire : 30 Md de photos issues de Pokémon GO/Ingress, et **Scaniverse** qui produit des splats 3D + maps VPS depuis un téléphone — la chaîne complète « capture → ancrage ».
- **Étapes d'installation** :
  - [A] Scaniverse (iOS ≥ 13, ARKit) : scanner un site → exporter Gaussian Splats / mesh → **alimente directement P6 de la tour**
  - [B] Scaniverse est également open source (viewer GitHub) → vérifier la licence avant intégration
  - [C] Lightship/ARDK VPS : gratuit en dessous de 50 000 utilisateurs actifs mensuels → très largement suffisant ; compte développeur requis
  - [D] Coverage FR = dense en villes, vide en rural : tester sur le site cible avant de promettre quoi que ce soit
- **Intégration dans la tour** : `scripts/scan-to-globe.sh` : Scaniverse export `.splat` → aholo-splat-transform (SPZ + LOD + collisions) → calque de la tour. Le VPS de Niantic, lui, ne sert pas si on reste en local.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Le meilleur compromis capture/gratuit pour un **site précis** (ton domicile, une friche, un poste de garde). Attention : tes scans partent dans leur cloud → lire la politique, et ne scanner aucun site sensible.
- **Sources** : https://www.nianticspatial.com/products/visual-positioning-system · https://scaniverse.com · https://www.nianticspatial.com/en/faq/scaniverse
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "niantic-vps"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="multiset-vps"></a>

### MultiSet AI (VPS commercial) — `multiset-vps`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟠 semi-payant : tier gratuit puis facturation à l'usage · **Licence** : service propriétaire (SDK Unity/iOS/Android/WebXR/Quest/ROS 2) · **Tour** : A/B/C indifféremment
- **Rôle** : Le VPS utilisé dans la vidéo Ray-Ban : scan-agnostique (E57, Matterport, PLY, **3DGS**, Polycam, NavVis, Leica, XGRIDs, captures 360°), 6-DoF annoncé **« < 10 cm »** au départ à froid, indoor-extérieur via indice GNSS, multi-utilisateur, et — seul point décisif — **supporte le SDK Meta Ray-Ban**.
- **Étapes d'installation** :
  - [A] Plan gratuit **de prototypage** : 5 cartes actives / 5 traitées / **1 000 appels API à vie** / ~11 600 m² → watermark, donc inutilisable en prod
  - [B] Lite 49 $/mois (39 $ en annuel) = 10 000 appels/mois + retrait du watermark ; Plus 249 $/mois (199 $ en annuel) = 25 cartes, 50 000 appels/mois, 60 387 m² ; Enterprise = Private Cloud / On-Prem / **On-Device** (seul plan qui sort du cloud MultiSet)
  - [B2] ⚠️ Sur Free et Lite, la latence est explicitement « best-effort » et chiffrée **1 500-2 500 ms (mono-image) / 2 700-3 500 ms (multi-images)** sur la page de tarifs : l'argument « 52 ms » de la vidéo n'est pas garanti contractuellement avant Enterprise
  - [C] Usage recommandé : **tester la faisabilité**, jamais dépendance durable ; l'alternatif self-host = hloc + Brush + ton propre serveur d'ancrage
  - [D] L'ingestion accepte nos `.ply`/`.splat` : on peut donc évaluer leur moteur **avec nos propres scans**, sans rien leur confier d'autre
- **Intégration dans la tour** : Aucune. Si un jour du hardware (lunettes, drone, robot) doit être ancré sur un site, évaluer MultiSet **vs** hloc en coût total, pas en démo.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Tarifs relus le 2026-09-05 sur https://multiset.ai/pricing — **à re-vérifier le jour où tu décides** (règle n°9 : les tiers gratuits bougent tout seuls). « L'entreprise a un an et déjà notée plus robuste que Niantic » dixit la vidéo — c'est le seul acteur qui touche les lunettes grand public ; le modèle économique reste fragile, ne pas s'y marier. Point qui compte pour la tour : l'**on-device** n'existe qu'en Enterprise → aucun VPS du commerce ne te donne l'autonomie hors-ligne que `hloc` te donne à 0 €. 
- **Sources** : https://www.multiset.ai/visual-positioning-system · https://www.multiset.ai/pricing · https://www.multiset.ai/developers
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "multiset-vps"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 5 · Rendu 3D réel (splats)

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **aholo-viewer (Manycore)** `aholo-viewer` | Renderer 3DGS + mesh haute perf avec *Chunked Streaming LOD* (jusqu'à 1 Md splats en navigateur,… | 🅰 | 🟢 gratuit | MIT (1 k★) | [github.com](https://github.com/manycoretech/aholo-viewer) · [aholojs.dev](https://aholojs.dev/en-US/manual/getting-started/) · [npmjs.com](https://www.npmjs.com/package/@manycore/aholo-viewer) |
| **@manycore/aholo-splat-transform** `aholo-splat-transform` | CLI de préparation des splats : formats (SPZ optimisé), découpe en chunks/LOD pour le streaming, et… | 🅰 | 🟢 gratuit | MIT | [npmjs.com](https://www.npmjs.com/package/@manycore/aholo-splat-transform) · [github.com](https://github.com/manycoretech/aholo-viewer/tree/master/packages) |
| **Brush** `brush` | Entraînement 3DGS/2DGS **local et gratuit** depuis tes photos/vidéos : tu n'achètes pas le scanner, tu… | 🅲 | 🟢 gratuit | Apache-2.0 (5 k★) | [github.com](https://github.com/ArthurBrussee/brush) · [github.com](https://github.com/ArthurBrussee/brush#installation) |
| **Postshot** `postshot` | GUI Windows capture → splats (le plus doux pour un non-technicien) | 🅱 | 🟢 gratuit | gratuit (⚠️ licence à vérifier) | [github.com](https://github.com/PostshotApp/postshot-desktop) · [postshot.ai](https://www.postshot.ai) |
| **OpenSplat / gsplat.tech** `opensplat` | Viewer + éditeur de splats dans le navigateur (nettoyage, cadrage, export) ; gsplat.tech pour… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/ElleXav/OpenSplat) · [opensplattime.org](https://opensplattime.org) · [gsplat.tech](https://gsplat.tech) |
| **Aholo Platform (cloud)** `aholo-platform` | Génération de splats depuis images/vidéo sur le cloud du constructeur (la vidéo n°11 en parle comme… | 🅰 | 🟠 semi-payant | service propriétaire | [aholo3d.com](https://www.aholo3d.com) |

<a id="aholo-viewer"></a>

### aholo-viewer (Manycore) — `aholo-viewer`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (1 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Renderer 3DGS + mesh haute perf avec *Chunked Streaming LOD* (jusqu'à 1 Md splats en navigateur, WebGPU/WebGL2). Le saut visuel de la tour : friches/patrimoine/chantiers scannés dans le globe.
- **Étapes d'installation** :
  - [A] `npm i @manycore/aholo-viewer` (Node ≥ 22.22.1, pnpm pour le monorepo)
  - [B] Suivre **leur `docs/ai/skills/use-aholo-viewer/SKILL.md`** : il est écrit pour un agent d'implémentation
  - [C] Créer `src/splats.js` : conteneur monté sur la scène Cesium (ancrage géo via `SplatMesh` transform)
  - [D] Vérifier dans un navigateur avec WebGPU (Chrome ≥ 113) ; repli WebGL2
- **Intégration dans la tour** : Nouveau calque `splats` dans `displayOptions.js` ; partage d'URL via le pattern `sharelink.js`.
- **Vérification (à mettre dans `doctor`)** : `node -e "import('@manycore/aholo-viewer').then(m=>{if(!m)process.exit(1);console.log('ok')}).catch(()=>process.exit(1))"`
- **Notes / pièges** : Le repo amont est **conçu pour le pilotage par agent** (AGENTS.md + skills) : c'est le cas d'usage n°1 de « copier un repo public et l'adapter ». Sous-module `external/egs-core` → cloner avec `--recurse-submodules`.
- **Sources** : https://github.com/manycoretech/aholo-viewer · https://aholojs.dev/en-US/manual/getting-started/ · https://www.npmjs.com/package/@manycore/aholo-viewer
- **Né du lien analysé** : [manycoretech/aholo-viewer](https://github.com/manycoretech/aholo-viewer) *(audit, réf. n°11b)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "aholo-viewer"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="aholo-splat-transform"></a>

### @manycore/aholo-splat-transform — `aholo-splat-transform`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : CLI de préparation des splats : formats (SPZ optimisé), découpe en chunks/LOD pour le streaming, et **génération des collisions** (marcher dans le scan).
- **Étapes d'installation** :
  - [A] `npm i -g @manycore/aholo-splat-transform`
  - [B] `aholo-splat-transform scan.ply --format spz --lod --out site/`
  - [C] Collisions : `--collider` (mesh simplifié) → à brancher sur un contrôleur de déplacement
  - [D] Servir le dossier en statique (le viewer charge les chunks à la demande)
- **Intégration dans la tour** : Pipeline `scripts/prepare-splat.sh` appelé par l'agent après chaque capture.
- **Vérification (à mettre dans `doctor`)** : `aholo-splat-transform --help | head -5`
- **Notes / pièges** : C'est l'outil qui rend le 3DGS *utilisable* sur une tour : sans LOD/streaming, une scène de 20 Go plante le poste.
- **Sources** : https://www.npmjs.com/package/@manycore/aholo-splat-transform · https://github.com/manycoretech/aholo-viewer/tree/master/packages
- **Né du lien analysé** : [manycoretech/aholo-viewer](https://github.com/manycoretech/aholo-viewer) *(audit, réf. n°11b)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "aholo-splat-transform"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="brush"></a>

### Brush — `brush`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (5 k★) · **Tour** : **C** — GPU 12-24 Go VRAM (ou Colab gratuit)
- **Matériel** : NVIDIA/AMD/Metal requis
- **Rôle** : Entraînement 3DGS/2DGS **local et gratuit** depuis tes photos/vidéos : tu n'achètes pas le scanner, tu produis les splats.
- **Étapes d'installation** :
  - [A] `cargo install brush` ou télécharger le binaire release (Rust, CUDA/Metal)
  - [B] Préparer un dossier de 50-300 photos d'un site (recouvrement 80 %)
  - [C] `brush data=./site/ --output_dir ./out` puis `brush eval`
  - [D] Convertir `./out/*.ply` avec aholo-splat-transform
- **Intégration dans la tour** : `scripts/capture-to-globe.sh` : photos → splats → LOD → calque de la tour.
- **Vérification (à mettre dans `doctor`)** : `brush --help | head -3`
- **Notes / pièges** : GPU nécessaire (~8-24 Go). Sans GPU : Colab (T4 gratuit) ou le cloud aholo3d (freemium, à éviter pour la souveraineté).
- **Sources** : https://github.com/ArthurBrussee/brush · https://github.com/ArthurBrussee/brush#installation
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "brush"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="postshot"></a>

### Postshot — `postshot`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : gratuit (⚠️ licence à vérifier) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : GUI Windows capture → splats (le plus doux pour un non-technicien). Utile pour produire tes scans sans CLI.
- **Étapes d'installation** :
  - [A] Télécharger la release GitHub
  - [B] Importer photos/vidéo → entraîner → exporter .ply/.splat
  - [C] Passer le résultat par aholo-splat-transform pour le LOD
- **Intégration dans la tour** : Étape amont manuelle ; la tour consomme le `.spz`.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Vérifier la licence avant d'en faire une dépendance ; sinon Brush.
- **Sources** : https://github.com/PostshotApp/postshot-desktop · https://www.postshot.ai
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "postshot"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="opensplat"></a>

### OpenSplat / gsplat.tech — `opensplat`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : A/B/C indifféremment
- **Rôle** : Viewer + éditeur de splats dans le navigateur (nettoyage, cadrage, export) ; gsplat.tech pour visualiser des scans CC.
- **Étapes d'installation** :
  - [A] Ouvrir OpenSplat (web), charger le `.ply`, supprimer les floches, exporter
  - [B] Télécharger des datasets CC-4 (ex. scans partagés) pour tester la couche splats sans rien capturer
- **Intégration dans la tour** : Prévisualisation pendant le dev de `src/splats.js`.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Les datasets de démo sont souvent CC-BY/CC-4 : citer la source si tu exposes.
- **Sources** : https://github.com/ElleXav/OpenSplat · https://opensplattime.org · https://gsplat.tech
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "opensplat"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="aholo-platform"></a>

### Aholo Platform (cloud) — `aholo-platform`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟠 semi-payant : tier gratuit puis facturation à l'usage · **Licence** : service propriétaire · **Tour** : A/B/C indifféremment
- **Rôle** : Génération de splats depuis images/vidéo sur le cloud du constructeur (la vidéo n°11 en parle comme accompagnement du repo).
- **Étapes d'installation** :
  - [A] Non requis : Brush + Postshot font pareil en local
  - [B] Si un jour tu manques de GPU : uploade, récupère le .ply, puis supprime les données du service
- **Intégration dans la tour** : Non.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : ⚠️ Comptes/crédits + tes photos chez un tiers. Le viewer GitHub reste MIT et gratuit : ne pas confondre les deux.
- **Sources** : https://www.aholo3d.com
- **Né du lien analysé** : [manycoretech/aholo-viewer](https://github.com/manycoretech/aholo-viewer) *(audit, réf. n°11b)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "aholo-platform"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 6 · Voix (entendre / parler)

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **faster-whisper** `faster-whisper` | STT Python rapide (CTranslate2) pour transcrire mémos, radios, réunions | 🅰 | 🟢 gratuit | MIT (25,2 k★) | [github.com](https://github.com/SYSTRAN/faster-whisper) |
| **Piper TTS** `piper` | TTS neural sur **CPU**, quasi instantané — la voix par défaut de la tour, choisie aussi par le projet… | 🅰 | 🟢 gratuit | MIT (moteur) / voix CC-BY | [github.com](https://github.com/rhasspy/piper) · [huggingface.co](https://huggingface.co/rhasspy/piper-voices) · [github.com](https://github.com/OHF-Voice/piper1-gpl) |
| **Qwen3-TTS** `qwen3-tts` | TTS open source SOTA (janv | 🅱 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/QwenLM/Qwen3-TTS) · [huggingface.co](https://huggingface.co/spaces/Qwen/Qwen3-TTS) · [github.com](https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi) |
| **Kokoro-82M** `kokoro` | TTS ultra-léger (82 M) avec voix FR, tourne sur CPU correctement | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/resemble-ai/kokoro) · [huggingface.co](https://huggingface.co/hexgrad/Kokoro-82M) |
| **openWakeWord** `openwakeword` | Mot d'éveil hors-ligne (« tour », « veille »…) : ce qui manque pour que la voix de la tour soit… | 🅰 | 🟢 gratuit | Apache-2.0 | [github.com](https://github.com/dscripka/openWakeWord) · [github.com](https://github.com/dscripka/openWakeWord/releases) |
| **Scriberr** `scriberr` | Transcription de réunions/audios en Docker (Whisper dedans) : si tu veux une UI de transcription sans… | 🅰 | 🟢 gratuit | MIT (3 k★) | [github.com](https://github.com/rishikanthc/Scriberr) · [scriberr.app](https://scriberr.app) |

<a id="faster-whisper"></a>

### faster-whisper — `faster-whisper`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (25,2 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : STT Python rapide (CTranslate2) pour transcrire mémos, radios, réunions. Plus simple à brancher que whisper.cpp si tu es déjà en Python.
- **Étapes d'installation** :
  - [A] `pip install faster-whisper`
  - [B] Sans GPU : `WhisperModel('base','cpu','int8')` (int8 = x2 et tient en RAM)
  - [C] `segments,_ = model.transcribe(audio, language='fr', vad_filter=True)`
  - [D] Service : `docker run -p 127.0.0.1:9000:9000 ghcr.io/fedirz/faster-whisper-server:latest`
- **Intégration dans la tour** : src/voice/sttLocal.js (file d'attente + transcription → champ texte de `chatConsole`).
- **Vérification (à mettre dans `doctor`)** : `python3 -c "from faster_whisper import WhisperModel;WhisperModel('tiny','cpu','int8');print('ok')"`
- **Notes / pièges** : `base` FR ≈ correct, `small` nettement mieux ; GPU = x5-x20.
- **Sources** : https://github.com/SYSTRAN/faster-whisper
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "faster-whisper"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="piper"></a>

### Piper TTS — `piper`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (moteur) / voix CC-BY · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : TTS neural sur **CPU**, quasi instantané — la voix par défaut de la tour, choisie aussi par le projet `ada_local` pour ne pas consommer de VRAM.
- **Étapes d'installation** :
  - [A] `pip install piper-tts` (ou `piper1-gpl`)
  - [B] Voix FR : télécharger `fr_FR-siwis-medium.onnx` + `.onnx.json` depuis le dépôt HF `piper-voices` (chemin `fr/fr_FR/siwis/medium/`) — repli `fr_FR-fr_FR-medium`
  - [C] Test : `echo 'Tour opérationnelle.' | piper --model fr_FR-siwis-medium.onnx --output_file out.wav`
  - [D] Serveur : `docker run -p 127.0.0.1:5002:5000 --rm -v $PWD/voices:/voice ghcr.io/rhasspy/piper:latest`
- **Intégration dans la tour** : Remplace la voix du navigateur dans `freeVoice.js` (garde le Web Speech en repli si `PIPER=off`).
- **Vérification (à mettre dans `doctor`)** : `ls voices/*.onnx && piper --list-voices 2>/dev/null | head -3`
- **Notes / pièges** : Voix monocorde mais 0 latence GPU. Qualité supérieure → Qwen3-TTS (nécessite GPU).
- **Sources** : https://github.com/rhasspy/piper · https://huggingface.co/rhasspy/piper-voices · https://github.com/OHF-Voice/piper1-gpl
- **Né du lien analysé** : [I Built a Local AI Assistant: 100% Free & No Subscriptions!](https://www.youtube.com/watch?v=7ffF3fumhcQ) *(audit, réf. n°4)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "piper"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="qwen3-tts"></a>

### Qwen3-TTS — `qwen3-tts`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : TTS open source SOTA (janv. 2026) : clonage de voix sur 3 s, design de voix par description, contrôle d'émotion/rythme, 10 langues **dont le français**, ~97 ms de latence, 0,6 B ≈ 4 Go VRAM.
- **Étapes d'installation** :
  - [A] `pip install -U qwen3-tts` (+ `pip install flash-attn --no-build-isolation` pour économiser la VRAM)
  - [B] Poids : `huggingface-cli download Qwen/Qwen3-TTS-12Hz-0.6B` (≈ 1,5 Go ; 1,7 B ≈ 4 Go)
  - [C] Serveur OpenAI-compatible : `git clone https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi && docker compose up qwen3-tts-gpu` → `http://127.0.0.1:8880/v1/audio/speech`
  - [D] La tour appelle cet endpoint ; sans GPU : rester sur Piper, ou Colab T4 gratuit
- **Intégration dans la tour** : src/voice/ttsLocal.js : `PIPER` par défaut, `QWEN_TTS_URL` si l'endpoint répond (détection au boot).
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:8880/v1/models | head -c 120`
- **Notes / pièges** : La vidéo n°7 montre ça dans ComfyUI : le workflow est pratique pour itérer, mais pour la tour un **endpoint HTTP** est plus simple à brancher. Cloner **ta** voix ; pas celle d'un tiers sans son accord.
- **Sources** : https://github.com/QwenLM/Qwen3-TTS · https://huggingface.co/spaces/Qwen/Qwen3-TTS · https://github.com/groxaxo/Qwen3-TTS-Openai-Fastapi · https://github.com/flybirdxx/ComfyUI-Qwen-TTS
- **Né du lien analysé** : [Elevenlabs just got wrecked. This free AI text to speech is WILD!](https://www.youtube.com/watch?v=eC8mZceIy5k) *(audit, réf. n°7)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "qwen3-tts"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="kokoro"></a>

### Kokoro-82M — `kokoro`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : TTS ultra-léger (82 M) avec voix FR, tourne sur CPU correctement. Bon compromis entre Piper (moche) et Qwen (GPU).
- **Étapes d'installation** :
  - [A] `pip install kokoro-onnx soundfile`
  - [B] Télécharger `kokoro-v1.0.onnx` + `voices.bin`
  - [C] `python -c "from kokoro import KPipeline; KPipeline(lang_code='f')('Tour prête.')"` (lang `f` = français)
- **Intégration dans la tour** : Candidat n°2 pour `ttsLocal.js`.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import kokoro_onnx;print("ok")'`
- **Notes / pièges** : Qualité/naturalité > Piper, coût CPU raisonnable. Voix FR moins expressive que Qwen3-TTS.
- **Sources** : https://github.com/resemble-ai/kokoro · https://huggingface.co/hexgrad/Kokoro-82M
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "kokoro"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="openwakeword"></a>

### openWakeWord — `openwakeword`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Mot d'éveil hors-ligne (« tour », « veille »…) : ce qui manque pour que la voix de la tour soit utilisable sans bouton.
- **Étapes d'installation** :
  - [A] `pip install openwakeword`
  - [B] Télécharger un modèle (ou en entraîner un sur 15-30 échantillons de **ta** voix)
  - [C] Boucle : 16 kHz PCM → `model.predict(frame)` > 0,5 → armer le STT
- **Intégration dans la tour** : src/voice/wakeWord.js (worker), micro en continu, zéro cloud.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import openwakeword;print("ok")'`
- **Notes / pièges** : Faux positifs en ambiance bruitée : exiger 2 frames > 0,6 + fenêtre de vérouillage 1,5 s.
- **Sources** : https://github.com/dscripka/openWakeWord · https://github.com/dscripka/openWakeWord/releases
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "openwakeword"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="scriberr"></a>

### Scriberr — `scriberr`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (3 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Transcription de réunions/audios en Docker (Whisper dedans) : si tu veux une UI de transcription sans écrire le pont.
- **Étapes d'installation** :
  - [A] `docker run -d -p 127.0.0.1:8090:8080 -v scriberr:/data ghcr.io/rishikanthc/scriberr:latest`
  - [B] Uploader → SRT/TXT ; ou skip : faster-whisper + 20 lignes de Python
- **Intégration dans la tour** : Peut servir de « voutre de transcriptions » indexée par le RAG.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090`
- **Notes / pièges** : Petit projet mono-mainteneur : épingler l'image, ne pas en dépendre pour le cœur.
- **Sources** : https://github.com/rishikanthc/Scriberr · https://scriberr.app
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "scriberr"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 7 · Agents, chat, automatisation

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **Hermes Agent (Nous Research)** `hermes-agent` | Agent auto-améliorant : skills persistés, mémoire 3 couches, outils, MCP, 15+ fournisseurs de modèles… | 🅰 | 🟢 gratuit | MIT (241 k★) | [github.com](https://github.com/NousResearch/hermes-agent) · [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/docs/) |
| **OpenClaw** `openclaw` | Agent personnel « always-on » (gateway 18789, messageries, skills, cron) | 🅰 | 🟢 gratuit | ⚠️ vérifier la LICENSE courante (GitHub: NOASSERTION) | [github.com](https://github.com/openclaw/openclaw) · [docs.openclaw.ai](https://docs.openclaw.ai) |
| **OpenHands** `openhands` | Agent de code autonome (edite, exécute, teste) : le remplaçant libre de Cursor/Claude Code pour les… | 🅱 | 🟢 gratuit | MIT | [github.com](https://github.com/All-Hands-AI/OpenHands) · [docs.all-hands.dev](https://docs.all-hands.dev) |
| **Open WebUI** `open-webui` | ChatGPT local dans le navigateur : multi-modèles, RAG sur tes fichiers, outils/fonctions, pipelines | 🅰 | 🟢 gratuit | BSD-3 (+ clause de marque >50 users) | [github.com](https://github.com/open-webui/open-webui) · [docs.openwebui.com](https://docs.openwebui.com/getting-started/quick-start/) |
| **Jan** `jan` | App desktop 100 % offline, MCP, gestion de modèles GGUF | 🅰 | 🟢 gratuit | Apache-2.0 (40 k★) | [github.com](https://github.com/menloresearch/jan) · [jan.ai](https://jan.ai/download) |
| **Activepieces** `activepieces` | Automatisation (le « boring » qui rapporte dans la vidéo n°3) : veille de flux, triage de boîte mail,… | 🅰 | 🟢 gratuit | MIT | [github.com](https://github.com/activepieces/activepieces) · [docs.activepieces.com](https://docs.activepieces.com/docs/activepieces/setup/installation) |
| **n8n** `n8n` | Automatisation la plus populaire ; la vidéo n°3 la donne comme outil de métier. | 🅰 | 🟢 gratuit | ⚠️ fair-code (Sustainable Use, non-OSI) | [github.com](https://github.com/n8n-io/n8n) · [docs.n8n.io](https://docs.n8n.io/hosting/) |

<a id="hermes-agent"></a>

### Hermes Agent (Nous Research) — `hermes-agent`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT (241 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Agent auto-améliorant : skills persistés, mémoire 3 couches, outils, MCP, 15+ fournisseurs de modèles dont Ollama. **C'est le runtime que `reaserch-engine/docs/ARCHITECTURE_HERMES_INTEGRATION.md` vise déjà.**
- **Étapes d'installation** :
  - [A] `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash` (lire avant)
  - [B] `hermes setup` → provider : `ollama` + base_url `http://127.0.0.1:11434` → 0 clé
  - [C] `hermes model` pour choisir `qwen3:4b`/`llama3.1:8b` ; `hermes tools` pour l'état
  - [D] `hermes` (CLI) puis créer un skill local `watchtower-osint` (recherche, scan, rapport)
- **Intégration dans la tour** : Le moteur de recherche devient un skill ; l'agent exécute, le moteur garde la vérité (principe de ton doc : ne pas refaire un framework).
- **Vérification (à mettre dans `doctor`)** : `hermes --version 2>/dev/null || echo 'à relancer après install'`
- **Notes / pièges** : Version managée payante (~3 $/mois) : inutile, l'auto-hébergement est la voie prévue par ton architecture.
- **Sources** : https://github.com/NousResearch/hermes-agent · https://hermes-agent.nousresearch.com/docs/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "hermes-agent"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="openclaw"></a>

### OpenClaw — `openclaw`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : ⚠️ vérifier la LICENSE courante (GitHub: NOASSERTION) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Agent personnel « always-on » (gateway 18789, messageries, skills, cron). Très populaire en 2026.
- **Étapes d'installation** :
  - [A] Node ≥ 22.14 ; `npm i -g openclaw` puis `openclaw onboard`
  - [B] Service : `openclaw gateway install` + `systemctl --user enable --now openclaw-gateway`
  - [C] Configurer un provider Ollama ; workspace `~/.openclaw` (⚠️ contient des secrets : 600)
  - [D] ⚠️ Relire la **license du tag installé** avant tout usage public ou distribution
- **Intégration dans la tour** : Concurrent de Hermes : choisir UN runtime. Hermes = skills appris + MIT clair ; OpenClaw = messageries + always-on.
- **Vérification (à mettre dans `doctor`)** : `openclaw --version 2>/dev/null`
- **Notes / pièges** : 388 k★ mais licence affichée ambiguë par l'API GitHub : à clarifier avant d'en faire une dépendance de la tour.
- **Sources** : https://github.com/openclaw/openclaw · https://docs.openclaw.ai
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "openclaw"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="openhands"></a>

### OpenHands — `openhands`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Matériel** : GPU fortement conseillé (ou secours cloud gratuit)
- **Rôle** : Agent de code autonome (edite, exécute, teste) : le remplaçant libre de Cursor/Claude Code pour les grosses mécaniques.
- **Étapes d'installation** :
  - [A] `pip install openhands` (ou `docker run -it --pull=never -v /var/run/docker.sock:/var/run/docker-runtime allhandsai/openhands:latest`)
  - [B] `openhands config` → LLM : `ollama/qwen3:30b-a3b` (⚠️ un 8B code mal : viser ≥ 30 B ou une clé gratuite)
  - [C] Sandbox : Docker obligatoire pour lui laisser toucher des fichiers
- **Intégration dans la tour** : Les tâches de refactor lourdes (P1/P5) peuvent lui être confiées, sous revue de diff.
- **Vérification (à mettre dans `doctor`)** : `openhands --version 2>/dev/null`
- **Notes / pièges** : Nécessite un bon modèle : sur un petit modèle local, il fait plus de dégâts que de bien. À utiliser avec garde-fous (branche dédiée, diffs revus).
- **Sources** : https://github.com/All-Hands-AI/OpenHands · https://docs.all-hands.dev
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "openhands"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="open-webui"></a>

### Open WebUI — `open-webui`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : BSD-3 (+ clause de marque >50 users) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : ChatGPT local dans le navigateur : multi-modèles, RAG sur tes fichiers, outils/fonctions, pipelines. L'interface humaine au-dessus d'Ollama.
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-openwebui -p 127.0.0.1:3005:8080 -v openwebui:/app -e OLLAMA_BASE_URL=http://host.docker.internal:11434 ghcr.io/open-webui/open-webui:main`
  - [B] Premier compte = admin, **local uniquement** (ne jamais exposer 0.0.0.0 sans proxy auth)
  - [C] Documents → déposer le corpus → les chunks servent de RAG sans Qdrant
  - [D] (option) activer Whisper/Piper intégrés
- **Intégration dans la tour** : Console humaine de la tour ; `reaserch-engine` peut y lire des knowledge bases.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3005/health`
- **Notes / pièges** : Au-dessus de ~50 users la clause de branding s'applique → sans objet pour une tour. Alternative 100 % sans conteneur : `pip install open-webui`.
- **Sources** : https://github.com/open-webui/open-webui · https://docs.openwebui.com/getting-started/quick-start/
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "open-webui"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="jan"></a>

### Jan — `jan`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : Apache-2.0 (40 k★) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : App desktop 100 % offline, MCP, gestion de modèles GGUF. L'alternative « je veux un .exe propre et libre ».
- **Étapes d'installation** :
  - [A] Télécharger Jan (Win/mac/Linux)
  - [B] Installer un modèle depuis le hub intégré (ou pointer `~/.jan/models`)
  - [C] Activer le serveur local `http://localhost:1337/v1` = endpoint pour la tour
- **Intégration dans la tour** : Repli de confort quand Ollama n'est pas voulu.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:1337/v1/models`
- **Notes / pièges** : Plus limité côté RAG/agents qu'Open WebUI.
- **Sources** : https://github.com/menloresearch/jan · https://jan.ai/download
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "jan"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="activepieces"></a>

### Activepieces — `activepieces`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Automatisation (le « boring » qui rapporte dans la vidéo n°3) : veille de flux, triage de boîte mail, briefing matin, alertes Telegram, runs illimités en self-host. **MIT là où n8n est fair-code.**
- **Étapes d'installation** :
  - [A] `docker run -d --name wt-pieces -p 127.0.0.1:4200:4200 -e AP_API_KEY=$(openssl rand -hex 16) -e DATABASE_URL=postgresql://... -v pieces:/root/.activepieces activepieces/activepieces:latest` (voir `audit/stack/docker-compose.yml`, déjà prêt)
  - [B] Ouvrir http://localhost:4200 → créer un flow `INBOX triage` (trigger IMAP → agent LLM Ollama → label + Telegram)
  - [C] Importer les flows JSON de `audit/stack/flows/` (si présents)
  - [D] Cron : `0 7 * * 1-5` pour le briefing de la tour
- **Intégration dans la tour** : Peut déclencher l'API de la tour, publier l'état quotidien dans un canal, et lancer `reaserch-engine` sur des sujets.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4200/health`
- **Notes / pièges** : n8n : 203 k★ mais **Sustainable Use License** (non-OSI) + fonctions enterprise → garder Activepieces comme choix par défaut.
- **Sources** : https://github.com/activepieces/activepieces · https://docs.activepieces.com/docs/activepieces/setup/installation
- **Né du lien analysé** : [OpenSource AI Tools That Feel ILLEGAL To Get Free](https://www.youtube.com/watch?v=PeYlw9OOqmw) *(audit, réf. n°2)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "activepieces"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="n8n"></a>

### n8n — `n8n`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : ⚠️ fair-code (Sustainable Use, non-OSI) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Automatisation la plus populaire ; la vidéo n°3 la donne comme outil de métier.
- **Étapes d'installation** :
  - [A] `docker run -d --name n8n -p 127.0.0.1:5678:5678 -v n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n`
  - [B] ⚠️ Licence : usage interne OK, revente de service = payant ; des features sont enterprise-only
- **Intégration dans la tour** : Pas de dépendance dans la tour : si besoin, passer par notre couche `audit/stack/flows` (agnostique).
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5678/healthz`
- **Notes / pièges** : Acceptable pour toi en usage perso, mais ce n'est **pas** du logiciel libre : à dire clairement si tu publies.
- **Sources** : https://github.com/n8n-io/n8n · https://docs.n8n.io/hosting/
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "n8n"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 8 · Communications hors-réseau

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **Reticulum (RNS)** `reticulum` | Stack réseau chiffrée multi-média (LoRa, Wi-Fi, TCP, HF) sans IP, par destinations cryptographiques | 🅰 | 🟢 gratuit | AGPL-3.0 (logiciel) | [github.com](https://github.com/softwaregroupdm/reticulum) · [reticulum.network](https://reticulum.network) · [rmap.world](https://rmap.world) |
| **Meshtastic** `meshtastic` | Mesh LoRa texte longue portée : 1 repeater + 3 radios ≈ 100 acres ; mesh municipal autonome (Austin) | 🅰 | ⚫ matériel optionnel | GPL-3.0 (fw/apps) + matériel | [meshtastic.org](https://meshtastic.org) · [github.com](https://github.com/meshtastic/firmware) · [meshtastic.org](https://meshtastic.org/docs/getting-started/hardware-suggestions/) |
| **RTL-SDR (option réception locale)** `rtl-sdr` | Recevoir ADS-B (avions), AIS (navires), météo, poches radio **chez toi** : transforme la tour en nœud… | 🅰 | 🟢 gratuit | matériel ~30 € + logiciels libres | [rtl-sdr.com](https://www.rtl-sdr.com/buyers-guide/) · [github.com](https://github.com/wiedehopf/tar1090) · [github.com](https://github.com/adsb-feeder) |

<a id="reticulum"></a>

### Reticulum (RNS) — `reticulum`
- **Statut** : 🟥 **absent** (à installer) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : AGPL-3.0 (logiciel) · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Stack réseau chiffrée multi-média (LoRa, Wi-Fi, TCP, HF) sans IP, par destinations cryptographiques. Canal de secours pair-à-pair, auto-hébergé par la tour.
- **Étapes d'installation** :
  - [A] `python3 -m venv .venv && pip install RNS LXMF RNS-Interface-Plugin-TCP`
  - [B] `~/.reticulum/config` : mode **local/LAN par défaut** (`interface_only`, `enabled: True` sur TCP), announcements à `enabled: True` seulement si tu choisis d'être public
  - [C] `python -m RNS.daemon` puis client : `pip install sideband` ou CrossTalk
  - [D] Vérifier : `rnsd` log → destination générée ; test en envoyant un LXMF à ta propre destination
  - [E] ⚠️ Ne jamais ouvrir un nœud TCP public sans firewall + `interface_only` + limites de taux
- **Intégration dans la tour** : `src/meshNodes.js` : afficher les nœuds announced (rmap) + l'état du canal dans le globe ; la tour peut **envoyer** une alerte par Reticulum quand internet tombe.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import RNS;print(RNS.__version__)' 2>/dev/null || echo absent`
- **Notes / pièges** : Logiciel 0 €. Le LoRa réel demande du matériel (~15-40 €). Exposer un backbone = responsabilité (abus, relai de trafic) : par défaut, garder privé.
- **Sources** : https://github.com/softwaregroupdm/reticulum · https://reticulum.network · https://rmap.world · https://github.com/buildwithparallel/crosstalk · https://columba.network
- **Né du lien analysé** : [How to Become Your Own ISP](https://www.youtube.com/watch?v=V3kZwsysuqQ) *(audit, réf. n°9)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "reticulum"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="meshtastic"></a>

### Meshtastic — `meshtastic`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : ⚫ option matérielle (achat one-shot), logiciel libre · **Licence** : GPL-3.0 (fw/apps) + matériel · **Tour** : A/B/C indifféremment
- **Rôle** : Mesh LoRa texte longue portée : 1 repeater + 3 radios ≈ 100 acres ; mesh municipal autonome (Austin). Zéro abonnement.
- **Étapes d'installation** :
  - [A] ⚫ Achat : 2 radios minimum (Heltec V3 ≈ 25 €, RAK4631 ≈ 35 €, T-Echo ≈ 70 €)
  - [B] Flasher le firmware depuis https://flasher.meshtastic.org (USB, gratuit)
  - [C] App Android/iOS → joindre le canal long-fast, configurer la région 868 MHz (Europe)
  - [D] Pont vers la tour : activer le **MQTT** du nœud puis `meshtastic-mqtt-bridge.js` → calque `meshNodes.js`
  - [E] Agent : peut tout faire SAUF acheter et visser les antennes
- **Intégration dans la tour** : Calque « contacts mesh » sur le globe + alertes de la tour qui partent par mesh quand le net tombe.
- **Vérification (à mettre dans `doctor`)** : `mosquitto_sub -h <noeud> -t msh/2/e/# 2>/dev/null | head -3`
- **Notes / pièges** : ⚠️ Réglementation 868 MHz (puissance/duty), pas d'usurpation, pas de contenu illicite. Le seul vrai coût matériel de tout cet audit.
- **Sources** : https://meshtastic.org · https://github.com/meshtastic/firmware · https://meshtastic.org/docs/getting-started/hardware-suggestions/
- **Né du lien analysé** : [Meshtastic Crash Course Part 1 — What is Meshtastic?](https://www.youtube.com/watch?v=n_Cie7uGu4c) *(audit, réf. n°10)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "meshtastic"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="rtl-sdr"></a>

### RTL-SDR (option réception locale) — `rtl-sdr`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : matériel ~30 € + logiciels libres · **Tour** : A/B/C indifféremment
- **Rôle** : Recevoir ADS-B (avions), AIS (navires), météo, poches radio **chez toi** : transforme la tour en nœud de données au lieu d'emprunté à un tiers.
- **Étapes d'installation** :
  - [A] ⚫ RTL-SDR v4 (≈ 30 €) + antenne 1090 MHz
  - [B] `git clone https://github.com/wiedehopf/tar1090 && sudo ./install.sh` (ou Docker)
  - [C] `readsb --json` → le serveur de la tour sert ses **propres** positions, sans quota ni OpenSky
- **Intégration dans la tour** : Calque avions/vaisseau « source locale », valeur souveraine énorme pour 30 €.
- **Vérification (à mettre dans `doctor`)** : `curl -s http://127.0.0.1:8080/data/aircraft.json | head -c 200`
- **Notes / pièges** : Réception passive = légale ; ne pas émettre. Un des rares ajouts qui font vraiment monter la tour en gamme à coût minime.
- **Sources** : https://www.rtl-sdr.com/buyers-guide/ · https://github.com/wiedehopf/tar1090 · https://github.com/adsb-feeder
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "rtl-sdr"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 9 · Mémoire, stockage, sauvegarde

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **ai-memory-vault (jaredrhod)** `ai-memory-vault` | Mémoire d'agent **en markdown dans un vault Obsidian, sans base vectorielle** : patterns (profil,… | 🅰 | 🟢 gratuit | CC-BY-SA-4.0 | [github.com](https://github.com/jaredrhod/ai-memory-vault) |
| **Obsidian** `obsidian` | Éditeur/visualiseur du vault markdown : c'est l'UI humaine de la mémoire de la tour. | 🅰 | 🟢 gratuit | propriétaire gratuit (usage perso) | [obsidian.md](https://obsidian.md) · [help.obsidian.md](https://help.obsidian.md) |
| **Syncthing** `syncthing` | Synchro/duplication P2P des dossiers de la tour (corpus, mémoire, scans 3D) vers NAS/portable, sans… | 🅰 | 🟢 gratuit | MPL-2.0 | [github.com](https://github.com/syncthing/syncthing) · [syncthing.net](https://syncthing.net) |
| **SQLite + sqlite-vec** `sqlite-vec` | La base « un fichier » avec recherche vectorielle : l'option la plus légère si LanceDB/Qdrant sont trop. | 🅰 | 🟢 gratuit | MIT/Apache-2.0 | [github.com](https://github.com/asg017/sqlite-vec) · [sqlite.org](https://www.sqlite.org/intro.html) |

<a id="ai-memory-vault"></a>

### ai-memory-vault (jaredrhod) — `ai-memory-vault`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : CC-BY-SA-4.0 · **Tour** : A/B/C indifféremment
- **Rôle** : Mémoire d'agent **en markdown dans un vault Obsidian, sans base vectorielle** : patterns (profil, tâches, décisions, leçons). Le modèle à copier pour `HCSM`/`Cognitorium`.
- **Étapes d'installation** :
  - [A] `git clone --depth 1 https://github.com/jaredrhod/ai-memory-vault memory-vault` pour **lire** la structure
  - [B] Recréer chez toi `watchtower/memory/` avec les mêmes rôles (0 dépendance de licence : tu réécris les templates)
  - [C] Règle d'or pour les agents : 1 fichier = 1 sujet, front-matter YAML (`sujet`, `maj`, `sources`), jamais de secret dedans
  - [D] Index = `memory/INDEX.md` maintenu par l'agent à chaque tâche
- **Intégration dans la tour** : `HCSM` écrit son état T0 dans `memory/` ; `reaserch-engine` y puise le contexte persistant.
- **Vérification (à mettre dans `doctor`)** : `test -f memory/INDEX.md && echo ok`
- **Notes / pièges** : Choix délibéré : markdown > vector DB pour un usage personnel. Ouvrage partagé → obligation d'attribution/partage à l'identique (CC-BY-SA) sur les templates, pas sur tes notes.)
- **Sources** : https://github.com/jaredrhod/ai-memory-vault
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "ai-memory-vault"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="obsidian"></a>

### Obsidian — `obsidian`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : propriétaire gratuit (usage perso) · **Tour** : A/B/C indifféremment
- **Rôle** : Éditeur/visualiseur du vault markdown : c'est l'UI humaine de la mémoire de la tour.
- **Étapes d'installation** :
  - [A] Télécharger l'installeur (gratuit pour usage personnel, compte non obligatoire pour le local)
  - [B] Ouvrir `watchtower/memory/` comme vault
  - [C] Plugins optionnels : Dataview (requêtes sur front-matter), Templater
- **Intégration dans la tour** : Aucune API nécessaire : les agents lisent/écrivent les fichiers, Obsidian n'est qu'un œil.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Gratuit ≠ open source ; les **données** sont à toi (fichiers .md). Syncthing/git suffisent pour la synchro.
- **Sources** : https://obsidian.md · https://help.obsidian.md
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "obsidian"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="syncthing"></a>

### Syncthing — `syncthing`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MPL-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : Synchro/duplication P2P des dossiers de la tour (corpus, mémoire, scans 3D) vers NAS/portable, sans cloud.
- **Étapes d'installation** :
  - [A] `sudo apt install syncthing` (ou paquet natif Win/mac)
  - [B] `systemctl --user enable --now syncthing` → UI http://127.0.0.1:8384
  - [C] Partager `corpus/`, `memory/`, `scans/` vers le 2e poste ; ne pas exposer l'UI
- **Intégration dans la tour** : Sauvegarde des 40 Go de modèles non ; sauvegarde des **données produites**, oui.
- **Vérification (à mettre dans `doctor`)** : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8384/rest/2/system/status`
- **Notes / pièges** : La sauvegarde est le point mort de 90 % des tours : ce point-là est à 0 € et 100 % automatisable.
- **Sources** : https://github.com/syncthing/syncthing · https://syncthing.net
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "syncthing"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="sqlite-vec"></a>

### SQLite + sqlite-vec — `sqlite-vec`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : MIT/Apache-2.0 · **Tour** : **A** — CPU seul, 8-16 Go RAM
- **Rôle** : La base « un fichier » avec recherche vectorielle : l'option la plus légère si LanceDB/Qdrant sont trop.
- **Étapes d'installation** :
  - [A] `pip install sqlite-vec`
  - [B] `CREATE VIRTUAL TABLE chunks USING vec0(embedding float[768]);`
  - [C] Alimenté par `nomic-embed-text` (768 dim)
- **Intégration dans la tour** : `persistence.py` du moteur a déjà un store JSON : ce n'est qu'un palier au-dessus.
- **Vérification (à mettre dans `doctor`)** : `python3 -c 'import sqlite_vec;print("ok")'`
- **Notes / pièges** : Simple, portable, sauvegardable par copie de fichier.
- **Sources** : https://github.com/asg017/sqlite-vec · https://www.sqlite.org/intro.html
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "sqlite-vec"` (généré par `generate-reference.py`, ne pas éditer le markdown)


---

## 10 · Références, modèles et pièges à éviter

| Outil | Rôle (une phrase) | Faisabilité tour | Prix | Licence | URLs |
|---|---|---|---|---|---|
| **ada_local (Naz Louis)** `ada-local` | Référence **d'architecture** : routeur FunctionGemma 270 M (fine-tuné sur 200 exemples → 95 % de… | 🅱 | 🟢 gratuit | ❌ aucune licence (tous droits réservés) | [github.com](https://github.com/nazirlouis/ada_local) · [huggingface.co](https://huggingface.co/nlouis/ada_model) · [youtube.com](https://www.youtube.com/watch?v=7ffF3fumhcQ) |
| **Mark-LII (FatihMakes)** `mark-lii` | Référence UX du « Jarvis PC » : système de plugins (1 fichier = 1 compétence), awareness audio (savoir… | 🅰 | 🟡 compte gratuit | ❌ aucune licence dans le repo (GitHub: NOASSERTION) | [github.com](https://github.com/FatihMakes/Mark-LII) · [aistudio.google.com](https://aistudio.google.com/apikey) · [youtube.com](https://www.youtube.com/watch?v=u6c-6RF6J_g) |
| **fullstack-agent (jaredrhod)** `jared-fullstack` | Installeur « tout-en-un » dont parle la vidéo n°5 : memory-vault + visualizer + backtalk + barehands. | 🅰 | 🔴 payant | AGPL-3.0 | [github.com](https://github.com/jaredrhod/fullstack-agent) |
| **API LLM gratuites (secours, avec compte)** `tiers-gratuits-llm` | Filet quand le modèle local est trop court : raisonnement long, gros contexte, réécriture | 🅰 | 🟡 compte gratuit | CGU des fournisseurs | [console.groq.com](https://console.groq.com/keys) · [openrouter.ai](https://openrouter.ai/models?q=free) · [aistudio.google.com](https://aistudio.google.com/apikey) |
| **À éviter (payant ou lock-in)** `pistes-evitees` | Liste négative : ce que les vidéos vendent comme « gratuit » et qui ne l'est pas (ou pas durable). | 🅰 | 🔴 payant | — | [elevenlabs.io](https://elevenlabs.io/pricing) · [maltego.com](https://www.maltego.com/pricing/) · [spiderfoot.net](https://www.spiderfoot.net/pricing/) |
| **Capture Meta Ray-Ban / téléphone (option matériel)** `rayban-capture` | La leçon matérielle : avec une simple caméra (+ un scan 3D préalable), on remplace un casque militaire… | 🅰 | ⚫ matériel optionnel | matériel (300 $) — SDK lunette gratuit | [anduril.com](https://www.anduril.com/eagleeye) · [developers.meta.com](https://developers.meta.com/horizon/) |

<a id="ada-local"></a>

### ada_local (Naz Louis) — `ada-local`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟢 gratuit, 100 % local — seul coût : ton matériel/électricité · **Licence** : ❌ aucune licence (tous droits réservés) · **Tour** : **B** — GPU NVIDIA 6-8 Go VRAM
- **Rôle** : Référence **d'architecture** : routeur FunctionGemma 270 M (fine-tuné sur 200 exemples → 95 % de précision de routage, 1,0 s) → Qwen3 think/no-think → Piper sur CPU. C'est LE patron « moindre coût ».
- **Étapes d'installation** :
  - [A] Lire le repo (structure + tests), ne **pas** dépendre du code ni du modèle (licence absente)
  - [B] Réimplémenter : `src/ai/router.js` → petit modèle qui renvoie `{thinking: bool}` ; gros modèle derrière
  - [C] Fine-tuner le routeur sur tes 150-250 exemples (20 min de GPU en Colab gratuit)
  - [D] TTS CPU (Piper/Kokoro) pour ne pas manger la VRAM
- **Intégration dans la tour** : Modèle de `src/ai/router.js` + `.env` `ROUTER=on|off`.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : ⚠️ Son tutoriel complet est derrière un Patreon : pas besoin, le motif est simple et on le documente ici.
- **Sources** : https://github.com/nazirlouis/ada_local · https://huggingface.co/nlouis/ada_model · https://www.youtube.com/watch?v=7ffF3fumhcQ
- **Né du lien analysé** : [I Built a Local AI Assistant: 100% Free & No Subscriptions!](https://www.youtube.com/watch?v=7ffF3fumhcQ) *(audit, réf. n°4)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "ada-local"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="mark-lii"></a>

### Mark-LII (FatihMakes) — `mark-lii`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : ❌ aucune licence dans le repo (GitHub: NOASSERTION) · **Tour** : A/B/C indifféremment
- **Rôle** : Référence UX du « Jarvis PC » : système de plugins (1 fichier = 1 compétence), awareness audio (savoir qu'on ne lui parle pas), sessions longues, écran + webcam.
- **Étapes d'installation** :
  - [A] ⚠️ Ne pas fork ni redistribuer (aucune licence). Et le titre « gratuit » vend une Academy/Whop payante pour les versions récentes
  - [B] Ce qui est copiable légalement (le comportement, pas le code) : `plugins/` chargés au boot, chaque plugin exportant `{nom, declencheurs, executer}`
  - [C] Si un jour tu veux son runtime : il impose une **clé Gemini API** (gratuite avec compte) → chez toi on met Ollama à la place
- **Intégration dans la tour** : Notre `src/plugins/` dans la tour, avec la même règle : un plugin cassé ne tue pas l'app (try/catch par module).
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Cas d'école de « open source sur GitHub » qui ne l'est pas juridiquement.
- **Sources** : https://github.com/FatihMakes/Mark-LII · https://aistudio.google.com/apikey · https://www.youtube.com/watch?v=u6c-6RF6J_g
- **Né du lien analysé** : [Jarvis Mark 51 Installation — Step by Step Guide](https://www.youtube.com/watch?v=u6c-6RF6J_g) *(audit, réf. n°6)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "mark-lii"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="jared-fullstack"></a>

### fullstack-agent (jaredrhod) — `jared-fullstack`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🔴 payant — on documente le remplacement gratuit · **Licence** : AGPL-3.0 · **Tour** : A/B/C indifféremment
- **Rôle** : Installeur « tout-en-un » dont parle la vidéo n°5 : memory-vault + visualizer + backtalk + barehands.
- **Étapes d'installation** :
  - [A] ⚠️ Inutilisable sans **Claude Code** (abonnement) : son propre README le dit — donc payant dans les faits
  - [B] Ce qu'on retient : un installeur qui **demande ce qu'on veut** (les 4 briques cochables) et un wizard qui finit par « ouvre ça dans ton navigateur »
  - [C] Notre équivalent gratuit et lisible : `audit/stack/install-stack.{ps1,sh}` + `-DryRun`
- **Intégration dans la tour** : Modèle d'UX de l'installeur, rien de plus.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : AGPL + dépendance à un SDK propriétaire : ne pas mettre dans la chaîne de build.
- **Sources** : https://github.com/jaredrhod/fullstack-agent
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "jared-fullstack"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="tiers-gratuits-llm"></a>

### API LLM gratuites (secours, avec compte) — `tiers-gratuits-llm`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🟡 gratuit **avec compte** (clé/quota), sans CB dans le meilleur cas · **Licence** : CGU des fournisseurs · **Tour** : A/B/C indifféremment
- **Rôle** : Filet quand le modèle local est trop court : raisonnement long, gros contexte, réécriture. ⚠️ ne jamais y envoyer de données sensibles.
- **Étapes d'installation** :
  - [A] Choix par défaut : **aucune** (Ollama local)
  - [B] Groq : compte gratuit, 30 RPM / ~1 k req/j par modèle, pas d'entraînement → le meilleur secours
  - [C] OpenRouter `:free` : ~20 RPM, 50-1000 req/j selon modèle ; attention à la politique de données par modèle
  - [D] GitHub Models : 150-1000 req/j, pratique si tu as déjà un compte GitHub
  - [E] Gemini AI Studio : Flash-Lite ~15 RPM / Flash réduit en 2026 ; ⚠️ Google peut entraîner sur les prompts hors UE/EEE
  - [F] Les coller dans `.env` + `litellm.config.yaml` comme `fallbacks`, jamais en dur dans le code
- **Intégration dans la tour** : `src/ai/llmClient.js` : local d'abord, `if (cloud) fallback` conscient avec bannière d'avertissement dans l'UI.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Chiffres de quotas = début/mi 2026, à revérifier : les tiers gratuits sont le premier poste de régression d'une année.
- **Sources** : https://console.groq.com/keys · https://openrouter.ai/models?q=free · https://aistudio.google.com/apikey · https://ai.azure.com/... (GitHub Models : https://github.com/features/models) · https://cerebras.ai
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "tiers-gratuits-llm"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="pistes-evitees"></a>

### À éviter (payant ou lock-in) — `pistes-evitees`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : 🔴 payant — on documente le remplacement gratuit · **Licence** : — · **Tour** : A/B/C indifféremment
- **Rôle** : Liste négative : ce que les vidéos vendent comme « gratuit » et qui ne l'est pas (ou pas durable).
- **Étapes d'installation** :
  - [A] ElevenLabs (5-99 $/mois) → Qwen3-TTS / Piper / Kokoro
  - [B] OpenAI Realtime voice (centimes/min) → whisper + TTS local
  - [C] ChatGPT/Claude abonnements → Ollama (+ secours Groq gratuit)
  - [D] Perplexity Pro 20 $/mois → Vane + SearXNG
  - [E] Make/Zapier (runs facturés) → Activepieces
  - [F] Maltego Pro / Social Links / Lampyre / SpiderFoot HX / Intelligence X → SpiderFoot + Gephi + `intelTwin`
  - [G] Whop/Patreon des créateurs Jarvis → on réécrit le motif
  - [H] Google Maps billing (CB obligatoire, facturation au-delà de ~1000 sessions) → Esri + CARTO + Photon (déjà fait)
  - [I] Shodan/APIs payantes → free tier + crt.sh + Amass + le mode passif
- **Intégration dans la tour** : Cette table négative est celle que les agents doivent consulter avant d'ajouter une dépendance payante.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Règle de conception de la tour : **toute** fonctionnalité a un chemin 0 € ; le payant n'est jamais un prérequis.
- **Sources** : https://elevenlabs.io/pricing · https://www.maltego.com/pricing/ · https://www.spiderfoot.net/pricing/ · https://app.make.com/pricing · https://www.retellai.com/pricing · https://lampyre.io/pricing · https://si.social-links.io · https://intelligencex.io · https://www.whop.com/fatihmakes/ · https://www.patreon.com/cw/NazLouisYT
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "pistes-evitees"` (généré par `generate-reference.py`, ne pas éditer le markdown)

<a id="rayban-capture"></a>

### Capture Meta Ray-Ban / téléphone (option matériel) — `rayban-capture`
- **Statut** : ⬜ **référence** (à lire/copier le motif, pas de dépendance) · **Prix** : ⚫ option matérielle (achat one-shot), logiciel libre · **Licence** : matériel (300 $) — SDK lunette gratuit · **Tour** : A/B/C indifféremment
- **Rôle** : La leçon matérielle : avec une simple caméra (+ un scan 3D préalable), on remplace un casque militaire à 30 000 $ (Anduril EagleEye). Un téléphone suffit ; les lunettes ne sont que l'ergonomie.
- **Étapes d'installation** :
  - [A] ⚫ Achat optionnel : Meta Ray-Ban (~300 $) — sinon **ton téléphone suffit**, c'est littéralement ce que la vidéo démontre
  - [B] Côté logiciel : `pip install opencv-python` + enregistrement des frames + `hloc` pour les ancrer ; la tour sert de « mini-map » comme dans EagleEye
  - [C] ⚠️ Filmer des personnes dans l'espace public = RGPD + droit à l'image ; la tour n'ancrera **jamais** une pose humaine (audit §4.4)
  - [D] Ne pas acheter pour « faire EagleEye » : acheter seulement si un usage réel existe (relevé de site, inspection, suivi d'ouvrage)
- **Intégration dans la tour** : `src/anchors/cameraPose.js` : recevoir des poses depuis un client mobile (WebSocket vers la tour) et les dessiner — c'est **tout** l'effet « voir à travers les murs » : plusieurs caméras, une seule carte.
- **Vérification (à mettre dans `doctor`)** : `—`
- **Notes / pièges** : Le vrai sujet n'est pas le hardware, c'est la carte ancrée partagée. Et là, tu l'as déjà (splats) — il manque l'API de pose, qui est une demi-journée de code.
- **Sources** : https://www.anduril.com/eagleeye · https://developers.meta.com/horizon/
- **Né du lien analysé** : [This Shouldn't Be Possible With an iPhone](https://www.youtube.com/watch?v=CU02AeUCIHc) *(audit, réf. n°12)*
- **Registre** : `audit/reference/REGISTRE-OUTILS.json` → champ `id: "rayban-capture"` (généré par `generate-reference.py`, ne pas éditer le markdown)

---

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



---

## 5 · Index alphabétique (86 outils)

| `id` | Nom | Cat. | Prix | Palier | Compte/clé | Licence | État | Origine |
|---|---|---|---|---|---|---|---|---|
| [`activepieces`](#activepieces) | Activepieces | 7 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 2 |
| [`ada-local`](#ada-local) | ada_local (Naz Louis) | 10 | 🟢 gratuit | 🅱 | — | ❌ aucune licence (tous droits réservés | ⬜ réf. seule | 4 |
| [`aholo-platform`](#aholo-platform) | Aholo Platform (cloud) | 5 | 🟠 semi-payant | 🅰🅱🅲 | 🔴 | service propriétaire | ⬜ réf. seule | 11b |
| [`aholo-splat-transform`](#aholo-splat-transform) | @manycore/aholo-splat-transform | 5 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 11b |
| [`aholo-viewer`](#aholo-viewer) | aholo-viewer (Manycore) | 5 | 🟢 gratuit | 🅰 | — | MIT (1 k★) | 🟥 à installer | 11b |
| [`ai-memory-vault`](#ai-memory-vault) | ai-memory-vault (jaredrhod) | 9 | 🟢 gratuit | 🅰🅱🅲 | — | CC-BY-SA-4.0 | ⬜ réf. seule | — |
| [`aisstream`](#aisstream) | aisstream.io (flux AIS temps réel) | 4 | 🟡 compte gratuit | 🅰 | 🟡 | service gratuit, clé sur inscription | ◑ partiel | 14 |
| [`amass`](#amass) | Amass (OWASP) | 3 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | — |
| [`arcore-geospatial`](#arcore-geospatial) | Google ARCore Geospatial API | 4b | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | gratuit (sans facturation à l'appel),  | ⬜ réf. seule | 12 |
| [`brush`](#brush) | Brush | 5 | 🟢 gratuit | 🅲 | — | Apache-2.0 (5 k★) | 🟥 à installer | — |
| [`cesium-ion`](#cesium-ion) | Cesium ion (tuiles 3D photoréalistes) | 4 | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | Cesium (token gratuit usage perso) | ◑ partiel | — |
| [`chonkie`](#chonkie) | Chonkie | 2 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 1 |
| [`colmap`](#colmap) | COLMAP (SfM de référence) | 4b | 🟢 gratuit | 🅰 | — | new BSD (le fichier LICENSE l'affirme  | 🟥 à installer | 12 |
| [`crawl4ai`](#crawl4ai) | Crawl4AI | 1 | 🟢 gratuit | 🅰 | — | Apache-2.0 (66-80 k★) | 🟥 à installer | 1 |
| [`desal-power`](#desal-power) | Infrastructures critiques : désalination + c | 4 | 🟢 gratuit | 🅰 | — | OSM (ODbL) / datasets à vérifier | 🟥 à installer | 14 |
| [`docling`](#docling) | Docling (IBM) | 2 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | — |
| [`dspy`](#dspy) | DSPy | 2 | 🟢 gratuit | 🅱 | — | MIT | 🟥 à installer | 1 |
| [`eia-oil`](#eia-oil) | EIA API (futures et prix du carburant) | 4 | 🟡 compte gratuit | 🅰 | 🟡 | données publiques US, clé gratuite imm | 🟥 à installer | 14 |
| [`esri-carto-tuiles`](#esri-carto-tuiles) | Tuiles Esri World Imagery + CARTO (déjà en p | 4 | 🟢 gratuit | 🅰🅱🅲 | — | Esri (usage perso) / CARTO-OSM | ✅ en place | — |
| [`exiftool`](#exiftool) | ExifTool | 3 | 🟢 gratuit | 🅰 | — | Perl Artistic | 🟥 à installer | — |
| [`faster-whisper`](#faster-whisper) | faster-whisper | 6 | 🟢 gratuit | 🅰 | — | MIT (25,2 k★) | 🟥 à installer | — |
| [`firecrawl`](#firecrawl) | Firecrawl (self-host) | 1 | 🟢 gratuit | 🅱 | — | AGPL-3.0 (core) | 🟥 à installer | — |
| [`gdelt`](#gdelt) | GDELT (événements mondiaux géolocalisés) | 3 | 🟢 gratuit | 🅰 | — | données ouvertes (usage gratuit, non c | 🟥 à installer | 14 |
| [`gephi`](#gephi) | Gephi | 3 | 🟢 gratuit | 🅰 | — | GPL-3.0 | ⬜ réf. seule | — |
| [`gibis`](#gibis) | NASA GIBS + Copernicus Browser (imagerie quo | 4 | 🟢 gratuit | 🅰 | — | domaine public / Copernicus (citer) | 🟥 à installer | 14 |
| [`gobbonet`](#gobbonet) | GobboNet (Elodine) | 0 | 🟢 gratuit | 🅰🅱🅲 | — | « Other » (non-OSI) | ⬜ réf. seule | 8 |
| [`gods-eye-view`](#gods-eye-view) | God's Eye View (amont de ta tour) | 4 | 🟢 gratuit | 🅰🅱🅲 | — | ⚠️ README dit MIT, l'API GitHub renvoi | ◑ partiel | 12 |
| [`hermes-agent`](#hermes-agent) | Hermes Agent (Nous Research) | 7 | 🟢 gratuit | 🅰 | — | MIT (241 k★) | 🟥 à installer | — |
| [`hloc`](#hloc) | hloc (localisation visuelle 6-DoF) | 4b | 🟢 gratuit | 🅱 | — | Apache-2.0 (4,2 k★) | 🟥 à installer | 12 |
| [`instructor`](#instructor) | Instructor | 2 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 1 |
| [`jan`](#jan) | Jan | 7 | 🟢 gratuit | 🅰 | — | Apache-2.0 (40 k★) | ⬜ réf. seule | — |
| [`jared-fullstack`](#jared-fullstack) | fullstack-agent (jaredrhod) | 10 | 🔴 payant | 🅰🅱🅲 | 🔴 | AGPL-3.0 | ⬜ réf. seule | — |
| [`kokoro`](#kokoro) | Kokoro-82M | 6 | 🟢 gratuit | 🅰 | — | Apache-2.0 | ⬜ réf. seule | — |
| [`lancedb`](#lancedb) | LanceDB | 2 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | — |
| [`langfuse`](#langfuse) | Langfuse | 2 | 🟢 gratuit | 🅱 | — | MIT (core) | 🟥 à installer | 1 |
| [`libretranslate`](#libretranslate) | LibreTranslate | 2 | 🟢 gratuit | 🅰 | — | AGPL-3.0 | 🟥 à installer | 2 |
| [`litellm`](#litellm) | LiteLLM | 0 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 1 |
| [`lm-studio`](#lm-studio) | LM Studio | 0 | 🟢 gratuit | 🅰 | — | gratuit / source fermée | 🟥 à installer | — |
| [`maigret`](#maigret) | Maigret | 3 | 🟢 gratuit | 🅰 | — | MIT (37,3 k★) | 🟥 à installer | — |
| [`maltego-ce`](#maltego-ce) | Maltego CE | 3 | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | propriétaire (CE gratuit) | ⬜ réf. seule | — |
| [`mark-lii`](#mark-lii) | Mark-LII (FatihMakes) | 10 | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | ❌ aucune licence dans le repo (GitHub: | ⬜ réf. seule | 6 |
| [`marker`](#marker) | Marker | 2 | 🟢 gratuit | 🅱 | — | Apache-2.0 (39,5 k★, a migré depuis GP | 🟥 à installer | 1 |
| [`meshtastic`](#meshtastic) | Meshtastic | 8 | ⚫ matériel optionnel | 🅰🅱🅲 | 🔴 | GPL-3.0 (fw/apps) + matériel | ⬜ réf. seule | 10 |
| [`multiset-vps`](#multiset-vps) | MultiSet AI (VPS commercial) | 4b | 🟠 semi-payant | 🅰🅱🅲 | 🔴 | service propriétaire (SDK Unity/iOS/An | ⬜ réf. seule | 12 |
| [`n8n`](#n8n) | n8n | 7 | 🟢 gratuit | 🅰 | — | ⚠️ fair-code (Sustainable Use, non-OSI | ⬜ réf. seule | — |
| [`niantic-vps`](#niantic-vps) | Niantic Spatial VPS + Scaniverse | 4b | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | gratuit < 50 k MAU (VPS/ARDK) ; Scaniv | 🟥 à installer | 12 |
| [`notams`](#notams) | NOTAM / fermetures d'espace aérien | 4 | 🟢 gratuit | 🅰 | — | données publiques (FAA/EASA) ; parseur | 🟥 à installer | 13 |
| [`obsidian`](#obsidian) | Obsidian | 9 | 🟢 gratuit | 🅰🅱🅲 | — | propriétaire gratuit (usage perso) | ⬜ réf. seule | — |
| [`ocrmypdf`](#ocrmypdf) | OCRmyPDF | 2 | 🟢 gratuit | 🅰 | — | MPL-2.0 | 🟥 à installer | — |
| [`ollama`](#ollama) | Ollama | 0 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | 1 |
| [`open-webui`](#open-webui) | Open WebUI | 7 | 🟢 gratuit | 🅰 | — | BSD-3 (+ clause de marque >50 users) | 🟥 à installer | 2 |
| [`openclaw`](#openclaw) | OpenClaw | 7 | 🟢 gratuit | 🅰 | — | ⚠️ vérifier la LICENSE courante (GitHu | ⬜ réf. seule | — |
| [`opencti`](#opencti) | OpenCTI | 3 | 🟢 gratuit | 🅰🅱🅲 | — | ⚠️ NOASSERTION (vérifier la LICENSE du | ⬜ réf. seule | — |
| [`openhands`](#openhands) | OpenHands | 7 | 🟢 gratuit | 🅱 | — | MIT | ⬜ réf. seule | 2 |
| [`opensky`](#opensky) | OpenSky Network | 4 | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | données ouvertes (compte = quota supér | ◑ partiel | — |
| [`opensplat`](#opensplat) | OpenSplat / gsplat.tech | 5 | 🟢 gratuit | 🅰🅱🅲 | — | MIT | ⬜ réf. seule | — |
| [`openwakeword`](#openwakeword) | openWakeWord | 6 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | — |
| [`osint-framework`](#osint-framework) | OSINT Framework | 3 | 🟢 gratuit | 🅰🅱🅲 | — | web | ⬜ réf. seule | — |
| [`outages`](#outages) | Surveillance des pannes internet (Cloudflare | 4 | 🟡 compte gratuit | 🅰 | 🟡 | API gratuites (compte) ; Restless MIT | 🟥 à installer | 13 |
| [`outlines`](#outlines) | Outlines | 2 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | 1 |
| [`paddleocr`](#paddleocr) | PaddleOCR | 2 | 🟢 gratuit | 🅰 | — | Apache-2.0 (88,9 k★) | 🟥 à installer | — |
| [`photon-nominatim`](#photon-nominatim) | Photon → Nominatim (géocodage sans clé, déjà | 4 | 🟢 gratuit | 🅰🅱🅲 | — | OSM (ODbL) | ✅ en place | — |
| [`pinokio`](#pinokio) | Pinokio | 0 | 🟢 gratuit | 🅰 | — | MIT (launcher) | 🟥 à installer | — |
| [`pipe-gaps`](#pipe-gaps) | GlobalFishingWatch/pipe-gaps (navires sombre | 4 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | 14 |
| [`piper`](#piper) | Piper TTS | 6 | 🟢 gratuit | 🅰 | — | MIT (moteur) / voix CC-BY | 🟥 à installer | 4 |
| [`pistes-evitees`](#pistes-evitees) | À éviter (payant ou lock-in) | 10 | 🔴 payant | 🅰🅱🅲 | 🔴 | — | ⬜ réf. seule | — |
| [`postshot`](#postshot) | Postshot | 5 | 🟢 gratuit | 🅱 | — | gratuit (⚠️ licence à vérifier) | ⬜ réf. seule | — |
| [`qdrant`](#qdrant) | Qdrant | 2 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | 1 |
| [`qwen3-tts`](#qwen3-tts) | Qwen3-TTS | 6 | 🟢 gratuit | 🅱 | — | Apache-2.0 | 🟥 à installer | 7 |
| [`rayban-capture`](#rayban-capture) | Capture Meta Ray-Ban / téléphone (option mat | 10 | ⚫ matériel optionnel | 🅰🅱🅲 | 🔴 | matériel (300 $) — SDK lunette gratuit | ⬜ réf. seule | 12 |
| [`recorder-4d`](#recorder-4d) | Enregistreur temporel (le vrai manque) | 4 | 🟢 gratuit | 🅰 | — | à écrire (nous) | 🟥 à installer | 13 |
| [`reticulum`](#reticulum) | Reticulum (RNS) | 8 | 🟢 gratuit | 🅰 | — | AGPL-3.0 (logiciel) | 🟥 à installer | 9 |
| [`rtl-sdr`](#rtl-sdr) | RTL-SDR (option réception locale) | 8 | 🟢 gratuit | 🅰🅱🅲 | — | matériel ~30 € + logiciels libres | ⬜ réf. seule | — |
| [`sar-opera`](#sar-opera) | SAR : NASA OPERA + Copernicus EGMS + Sentine | 4 | 🟡 compte gratuit | 🅰 | 🟡 | données ouvertes (comptes Earthdata /  | 🟥 à installer | 14 |
| [`satellite-passes`](#satellite-passes) | Prédictions de passage satellite (Skyfield + | 4 | 🟢 gratuit | 🅰 | — | MIT (Skyfield, sgp4) · CelesTrak = don | 🟥 à installer | 13 |
| [`scriberr`](#scriberr) | Scriberr | 6 | 🟢 gratuit | 🅰 | — | MIT (3 k★) | ⬜ réf. seule | 2 |
| [`searxng`](#searxng) | SearXNG | 1 | 🟢 gratuit | 🅰 | — | AGPL-3.0 | 🟥 à installer | 2 |
| [`shadowbroker`](#shadowbroker) | ShadowBroker (réf. amont) | 4 | 🟢 gratuit | 🅰 | — | AGPL-3.0 (11,1 k★, actif) | ⬜ réf. seule | 13 |
| [`spiderfoot`](#spiderfoot) | SpiderFoot | 3 | 🟢 gratuit | 🅰 | — | MIT (21,7 k★) | 🟥 à installer | — |
| [`sqlite-vec`](#sqlite-vec) | SQLite + sqlite-vec | 9 | 🟢 gratuit | 🅰 | — | MIT/Apache-2.0 | ⬜ réf. seule | — |
| [`syncthing`](#syncthing) | Syncthing | 9 | 🟢 gratuit | 🅰 | — | MPL-2.0 | ⬜ réf. seule | — |
| [`tesseract`](#tesseract) | Tesseract OCR | 2 | 🟢 gratuit | 🅰 | — | Apache-2.0 | 🟥 à installer | 2 |
| [`theharvester`](#theharvester) | theHarvester | 3 | 🟡 compte gratuit | 🅰 | 🟡 | GPL-3.0 | 🟥 à installer | — |
| [`tiers-gratuits-llm`](#tiers-gratuits-llm) | API LLM gratuites (secours, avec compte) | 10 | 🟡 compte gratuit | 🅰🅱🅲 | 🟡 | CGU des fournisseurs | ⬜ réf. seule | — |
| [`vane-perplexica`](#vane-perplexica) | Vane (ex-Perplexica) | 1 | 🟢 gratuit | 🅰 | — | MIT (36,6 k★) | 🟥 à installer | 2 |
| [`whisper-cpp`](#whisper-cpp) | whisper.cpp | 0 | 🟢 gratuit | 🅰 | — | MIT | 🟥 à installer | — |

*Filtrer plutôt que défiler : `cherche.py` (ci-dessus) ou `cut -f1,3,5,6 audit/reference/REGISTRE.tsv | sort -k2` (1 ligne = 1 outil).*

