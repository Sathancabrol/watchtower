# Tri des outils — que faire des 51 « absents » ?

> Suite de l'audit du 7 octobre 2026. Le registre (`audit/reference/REGISTRE-OUTILS.json`)
> recense **86 outils** : **2 intégrés**, **4 partiels**, **29 de référence**, **51 absents**.
> Ce document tranche : quoi installer, quoi plus tard, quoi écarter — et pourquoi.
>
> **Méthode** : un outil n'entre dans « à installer » que s'il sert une fonction qui
> **existe déjà** dans Watchtower (sinon c'est du matériel qui dort). Le tri est un
> jugement de l'agent, assumé comme tel ; les données (licence, prix, GPU) viennent du
> registre.

## 1 · Les quatre paniers

| Panier | Nombre | Critère |
|---|---|---|
| ⏩ **À installer** | 11 | Sert une vue ou une base existante, licence libre, tourne sur un poste normal |
| 🔜 **Plus tard** | 16 | Utile mais suppose un usage qu'on n'a pas encore (3D temps réel, sortie terrain) |
| ⚠️ **À trancher d'abord** | 6 | Licence non confirmée ou service propriétaire : rien à copier tant que ce n'est pas clair |
| 🚫 **Écarté** | 6 | Payant, lock-in, ou sans licence |
| 🗂 **Hors Watchtower** | 12 | Recensés pour mémoire (OSINT pur, communications radio, matériel) — pas notre périmètre |

## 2 · ⏩ À installer (11) — parce qu'une fonction existe déjà

| Outil | Licence | Ce que ça débloque **maintenant** | Rôle dans une vue |
|---|---|---|---|
| **Ollama** | MIT | Un LLM local : le chat de l'app cesse de dépendre d'une clé | CHAT, INTEL |
| **Qdrant** | Apache-2.0 | Recherche sémantique dans la base INTEL (149 sources, 13 projets) | INTEL 📚 DOSSIER |
| **Docling** (IBM) | MIT | PDF → texte structuré : les rapports du monorepo deviennent requêtables | INTEL 📚 DOSSIER |
| **Tesseract OCR** | Apache-2.0 | Lire une capture d'écran ou un PDF scanné (les 220 pièces de chantier !) | INTEL 🏗 CHANTIER |
| **Marker** | Apache-2.0 | PDF → markdown de qualité, tableaux compris | INTEL 📚 DOSSIER |
| **whisper.cpp** | MIT | Transcription locale des mémos audio, sur CPU | CHAT |
| **faster-whisper** | MIT | Idem, plus rapide GPU | CHAT |
| **Piper TTS** | MIT (voix CC-BY) | Voix de synthèse hors ligne (le mode gratuit existe, sans serveur) | mobiGlas, voix |
| **SearXNG** | AGPL-3.0 | Recherche web privée, sans tracer l'utilisateur | CHAT |
| **Crawl4AI** | Apache-2.0 | Page web → markdown propre : alimenter la veille | INTEL 📡 VEILLE |
| **SQLite + sqlite-vec** | MIT/Apache-2.0 | Base locale avec vecteurs — alternative légère à Qdrant | stockage |

## 3 · 🔜 Plus tard (16)

| Outil | Pourquoi pas maintenant |
|---|---|
| aholo-viewer · @manycore/aholo-splat-transform · Brush · OpenSplat / gsplat.tech | Le rendu par *splats* suppose des scans 3D qu'on n'a pas encore (V7/R12) |
| Skyfield + CelesTrak | Prédictions de passage satellite : utile quand l'enregistreur temporel existera |
| NASA GIBS · Copernicus Browser | Imagerie quotidienne : même dépendance |
| hloc · COLMAP | VPS et reconstruction : liés aux scans |
| Reticulum · Meshtastic · RTL-SDR | Communications hors réseau : matériel à acquérir |
| Open WebUI · Jan · OpenHands · Hermes Agent · Activepieces · n8n | Agents et automatisation : le périmètre Watchtower n'en a pas encore besoin |
| GobboNet (Elodine) · Obsidian · Syncthing · ai-memory-vault · LanceDB · Chunker (Chonkie) · LibreTranslate · OCRmyPDF · PaddleOCR | Confort et alternatives : à prendre quand un besoin précis se présente |
| GlobalFishingWatch/pipe-gaps · NOTAM · EIA API | OSINT maritime/aérien : hors des 8 vues actuelles |

## 4 · ⚠️ À trancher d'abord (6) — licence non confirmée

| Outil | Problème | Décision proposée |
|---|---|---|
| **OpenCTI** | `NOASSERTION` — la LICENSE du commit visé n'est pas identifiée | Vérifier le fichier LICENSE avant tout usage |
| **Postshot** | « gratuit » mais licence à vérifier | Usage personnel d'évaluation seulement |
| **OpenClaw** | `NOASSERTION` sur GitHub | Vérifier, sinon écarter |
| **God's Eye View** (amont de la tour) | README dit MIT, l'API GitHub renvoie `NOASSERTION` | Déjà forké : conserver la traçabilité, ne pas redistribuer au-delà |
| **COLMAP** | Le fichier LICENSE dit new BSD, GitHub renvoie `NOASSERTION` | Lire le fichier, c'est lui qui fait foi |
| **ada_local** / **Mark-LII** | ❌ **aucune licence** (tous droits réservés) | **Ne pas copier, ne pas réutiliser** |

## 5 · 🚫 Écarté (6)

| Outil | Motif |
|---|---|
| fullstack-agent (jaredrhod) | Payant |
| MultiSet AI (VPS commercial) | Freemium propriétaire, SDK fermé |
| Aholo Platform (cloud) | Service propriétaire — la version auto-hébergée suffit |
| Google ARCore Geospatial API · Niantic Spatial VPS · Capture Meta Ray-Ban | Services et matériel propriétaires : utiles seulement si un usage terrain le justifie |
| La catégorie « à éviter (payant ou lock-in) » du registre | Liste noire tenue par le registre lui-même |

## 6 · 🗂 Hors Watchtower (12) — recensés pour mémoire

SpiderFoot · theHarvester · Amass · Maigret · ExifTool · OSINT Framework · Maltego CE ·
Gephi · ShadowBroker · Infrastructures critiques (désalination, centrales) · Surveillance
des pannes internet (Cloudflare Radar, IODA, Restless) · SAR (NASA OPERA, Copernicus EGMS, Sentinel-1).

Ces outils relèvent de la recherche ouverte et du renseignement d'infrastructure. Ils sont
dans le registre parce qu'ils ont été étudiés — pas parce qu'ils sont prévus dans l'app.

## 7 · Ce que le tri change concrètement

| Avant | Après |
|---|---|
| 51 outils « absents », sans priorité | **11 à installer**, 16 plus tard, 6 à trancher, 6 écartés, 12 hors périmètre |
| Aucun critère affiché | Un critère unique : **l'outil sert-il une fonction qui existe déjà ?** |
| Licences douteuses noyées dans la masse | 2 sans licence **interdits de réutilisation**, 4 à vérifier avant usage |

## 8 · Les deux premiers à installer, si vous voulez un ordre

1. **Tesseract OCR** — il débloque immédiatement les 220 pièces de chantier et les PDF
   scannés du monorepo : c'est le meilleur rapport effet/effort.
2. **Ollama + Qdrant** — le couple qui rend la base INTEL interrogeable en langage naturel,
   sans clé ni facture.

> Recalculer ce tri : `node -e "const r=require('./audit/reference/REGISTRE-OUTILS.json');
> console.table(r.outils.filter(o=>o.statut==='absent').map(o=>({nom:o.nom,cat:o.cat,prix:o.prix,licence:o.licence})))"`
