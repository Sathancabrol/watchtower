# 💶 Coûts réels, licences, légal

## 1. L'ardoise honnête (par mois, tout compris)

| Poste | Solution retenue | Coût/mois |
|---|---|---|
| LLM de raisonnement | Ollama local (`qwen3:4b`/`llama3.1:8b`) | **0 €** |
| Filet de secours (dossiers lourds) | Groq / OpenRouter `:free` / GitHub Models / Cerebras / Gemini Flash-Lite | **0 €** (quotas, comptes gratuits sans CB) |
| Web + réponse citée | SearXNG + Vane + Crawl4AI | **0 €** |
| OCR / PDF / traduction | Tesseract + Marker + LibreTranslate | **0 €** |
| Voix (STT/TTS) | whisper.cpp + Piper (→ Qwen3-TTS si GPU) | **0 €** |
| Vecteurs / chunking / schémas | LanceDB ou Qdrant + Chonkie + Outlines/Instructor | **0 €** |
| Observabilité | Langfuse self-host | **0 €** |
| Automatisation | Activepieces | **0 €** |
| OSINT | SpiderFoot + Amass + theHarvester + Maigret + ExifTool | **0 €** |
| Imagerie globe | Esri World Imagery + CARTO (déjà en place dans tes mods) | **0 €** |
| Option terrain 3D | aholo-viewer + Brush | **0 €** (GPU requis) |
| **Total** | | **0 €/mois** |

**Coûts one-shot éventuels (les seuls réels)** :
| Poste | Prix | Obligatoire ? |
|---|---|---|
| GPU NVIDIA 12-24 Go (occasion 3090 ≈ 600-800 €, 4060 Ti 16 Go ≈ 500 €) | one-shot | ❌ non → dépannage **Google Colab T4 gratuit** |
| Radios Meshtastic (Heltec V3 ≈ 25 €, RAK ≈ 35 €, x2-3) | one-shot | ❌ non, sauf si tu veux du mesh réel |
| Certificat de signature Windows (SmartScreen) | 200-600 $/an | ❌ non → **scripts texte lisibles** à la place |
| Compte Cesium ion | 0 € | optionnel (tuile 3D photoréaliste) |
| VPS 2 vCPU / 4 Go (nœud Reticulum public, accès distant) | 4-8 €/mois | ❌ non → ta tour suffit |
| Stockage (modèles = 3-40 Go pièce) | 0,03-0,10 €/Go/mois si NAS cloud | ❌ non → SSD local |

## 2. Pièges de licence (vérifiés repo par repo)

| Projet | Licence **réelle** (vérifiée le 2026-09-05) | Ce que ça change pour toi |
|---|---|---|
| `FatihMakes/Mark-LII` (vidéo « Jarvis gratuit ») | ❌ **aucune licence dans le repo** (GitHub affiche `NOASSERTION`) | **Tous droits réservés par défaut** : tu peux regarder, pas copier/redistribuer. Si tu veux le comportement → je le réécris sous **ta** licence MIT. |
| `nazirlouis/ada_local` | ❌ aucune licence | idem. L'architecture (routeur + TTS CPU) est libre d'idées : on la réimplémente. |
| `ElodineOfficial/GobboNet` | ⚠️ « Other » | gratuit d'usage, **pas open source au sens OSI**. Tu l'installes chez toi, tu ne le redistribues pas. |
| `jaredrhod/fullstack-agent` + `backtalk` + `barehands` | AGPL-3.0 | tu peux l'utiliser/le modifier ; si tu diffuses un service dérivé → publier les modifs. Et **dépend de Claude Code (payant)**. |
| `jaredrhod/ai-memory-vault` | CC-BY-SA-4.0 | partage à l'identique + attribution. Parfait pour tes templates. |
| **n8n** | fair-code « Sustainable Use », **non OSI** (GitHub : `NOASSERTION`) | gratuit en self-host mais **pas un logiciel libre** ; des briques sont enterprise-only. → **Activepieces (MIT)** si tu tiens à la licence. |
| **Open WebUI** | BSD-3 avec clause de marque au-delà de ~50 utilisateurs | aucun souci pour une tour personnelle. |
| **SearXNG / Khoj / SpiderFoot* / LibreTranslate / OpenCTI** | AGPL-3.0 | obligations seulement si tu **fournis un service** à des tiers. Perso + code public = OK. (*SpiderFoot est en fait MIT, 21,7 k★.) |
| **Marker** | **Apache-2.0** (a migré depuis GPLv3 + modèles CC-BY-NC ; 39,5 k★) | usage commercial redevenu propre. |
| **Crawl4AI** | Apache-2.0 | idem, + 66-80 k★, pas de cloud obligatoire. |
| **Qwen3-TTS** | Apache-2.0 (usage commercial inclus) | tu peux cloner **ta** voix ; ⚠️ cloner la voix **d'autrui** sans son accord = république des droits voisins + droit à la voix (FR : art. 9 Code civil). |
| **Hermes Agent** | MIT | le runtime « agent » libre de contrainte. |
| **gods-eye-view** (l'amont de ta tour) | ⚠️ GitHub renvoie `NOASSERTION` alors que le README annonce MIT | **ne casse pas ta tour** : tes 57 mods sont tiens ; mais n'importons rien de plus de l'amont sans clarifier la LICENSE (action : leur ouvrir une issue / vérifier le fichier LICENSE du commit que tu as forké `65bc522`). |

## 3. Légal, côté France (le strict nécessaire, pas un avis juridique)

1. **Sources ouvertes** (Esri, OSM/ODbL, geo.gouv.fr, Open-Meteo, NASA, AIS, ADS-B, SearXNG) : consultation **légale**. Attention aux **licences de redistribution** : OSM = **ODbL** → si tu **diffuses** des produits dérivés de la carte, attribution + partage sont dus ; c'est écrit dans ton `DATA_SOURCES.md` amont.
2. **Ne pas construire de fonctionnalité de recherche de personne, de reconnaissance faciale ou de pistage individuel.** La ligne est celle du projet amont : *« People are not a query type here. »* Garde-la : ça protège le repo, et toi.
3. **RGPD** : dès que tu **stockes/exposes des données relatives à des personnes identifiées** (transitaires ADS-B, noms de files CCTV, pseudo collectés par Maigret), tu as une base légale à trouver, un droit d'effacement à honorer, et une durée de conservation à fixer. En **local + usage privé**, l'exemption « foyer » s'applique ; dès que tu **publies** (site, instance partagée, vidéo), non.
4. **CCTV publiques** : le flux est accessible, mais le **rediffuser** ou l'**archiver** peut heurter le droit à l'image ; le plus sûr = affichage temps réel, pas d'archive, et lien vers la source.
5. **Radio** : Meshtastic/LoRa en **868 MHz** = usage libre en Europe (puissance limitée), **pas de chiffrement interdit**, mais **pas de contenu illicite** et pas d'usurpation d'identité ; Reticulum idem. Ne pas brouiller, pas saturer, ne pas se faire passer pour un service d'urgence.
6. **Ne jamais exposer une instance qui broker tes clés API** : le README amont avertit explicitement (`0.0.0.0` = tes clés accessibles à tout le LAN). Garde `--host localhost`, et si tu partages → **reverse proxy authentifié** + quotas par IP + **caps de facturation côté fournisseur**.
7. **Clés gratuites ≠ données gratuites** : le palier gratuit de Google (et le tier « Experiment » de certains fournisseurs) **entraîne potentiellement sur tes prompts** hors UE/EEE. Envoie-y uniquement du contenu public ou synthétique.
8. **Modèles à usage restreint** : certains poids Llama/Qwen/Gemma portent une *community license* avec seuil de revenus ; si tu ne commercialises pas, tu es bon — mais **lis la fiche Hugging Face** avant de redistribuer un installeur qui embarque les poids.

## 4. Décision rationnelle

| Situation | Choix recommandé |
|---|---|
| Tour sans GPU, 8-16 Go | palier A : Ollama petit modèle + Piper + whisper.cpp `base` + Tesseract + SearXNG/Vane (sans LLM lourd) — tout tient |
| GPU 6-8 Go | + Qwen3-TTS 0,6 B, LLM 7-8 B, Marker (lent), RAG complet |
| GPU 12-24 Go | + 3DGS (Brush), Qwen3-TTS 1,7 B, OpenHands autonome, dossier `reaserch-engine` complet |
| Pas de GPU mais besoin ponctuel | **Google Colab gratuit** (T4) pour Qwen3-TTS / Marker / Brush, une fois par dossier |
| Besoin de « 1 fichier installeur » | mes `install-stack.ps1`/`.sh` dans **ton** repo + release GitHub Actions (gratuit, lisible, reproductible) — **pas** le `.exe` GobboNet si tu veux que ce soit auditable |
| Besoin d'UX non-technique pour un proche | GobboNet ou LM Studio (GUI) ; garde la ligne de commande pour toi |
