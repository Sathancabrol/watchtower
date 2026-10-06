# Où vit « watchtower » — inventaire des dépôts, branches et copies

> Question posée : « check tous les repos où il y a un watchtower ». Réponse
> ci-dessous, vérifiée le **7 octobre 2026** sur le compte `Sathancabrol`
> (9 dépôts), sur les branches distantes de chaque dépôt et sur l'amont du fork.
> Ce document dit aussi **ce que chaque endroit apporte à la base INTEL**.

---

## 1. Vue d'ensemble

| Emplacement | Nature | Ce qu'il contient | Intérêt INTEL |
|---|---|---|---|
| `Sathancabrol/watchtower` (ce dépôt) | **l'application** | CesiumJS + Vite : INTEL (7 vues), chantier, cadastre, jumeau, mobiDock… | **la source de vérité du code** |
| ↳ branche `main` | l'app publiée | sans la livraison IMPORT DE CSV ni la base INTEL | cible de fusion |
| ↳ branche `arena/dec9cd88-watchtower` | **branche de travail** (PR #3 ouverte) | + import CSV, + carte stratégique, + **base INTEL** | **tout ce qui est nouveau** |
| `Sathancabrol/monorepo` → `projects/watchtower/` | copie de l'app | build Vite (`dist/index.html`), servie par l'explorateur `/preview/watchtower/...` | vitrine ; **à resynchroniser** |
| `Sathancabrol/monorepo` → `projects/COGNITORIUM/watchtower-mods/` | **l'amont du fork** | écran gratuit/payant, tuiles CARTO, Photon/Nominatim, voix libre, EONET, `SOURCES-FR.md` | documente **pourquoi** chaque couche existe |
| `Sathancabrol/monorepo` → `projects/frontignan/` | **le gisement territorial** | rapport d'analyse (134 ko, 249 sources), vision 2026-2040, deck 18 slides, 14 figures, `atlas/` | **la matière de la vue 📚 DOSSIER** |
| `Sathancabrol/monorepo` → branche `arena/01a08203-monorepo` | l'atlas (1 commit, 22 fichiers) | `atlas.json` (79 nœuds/167 liens), `communes-thau.csv` (14 communes), cartes et figures | **base de l'atlas INTEL** |
| `Sathancabrol/monorepo` → branche `arena/01a08449-monorepo` | **chantier BTP** (22 commits, 248 fichiers) | corpus DCE complet (CCTP, CCAP, BPU, DQE, DT, planning, comptes rendus, DOE) + `patch_v50_watchtower_engine.py`, `patch_v51_leaflet_watchtower.py` | **fiches chantier** : ce qu'un chantier contient réellement |
| `Sathancabrol/COGNITORIUM` → `watchtower-mods/` | copie du fork + docs | `README.md` (38 ko), `SOURCES-FR.md`, `src/watchtowerExtras.js`, `src/chantier.js` | contrats et intentions d'origine |
| `Sathancabrol/COGNITORIUM` → `docs/` | **la doctrine** | `etat-des-lieux/06-watchtower.md`, `agents/gis-agent.md`, `architecture/convergence.md` | **le contrat d'échange** que cette base doit honorer |
| `bilawalsidhu/gods-eye-view` | l'amont d'origine | commit `65bc522` — point de fork | à ne pas modifier |

Aucun **autre** dépôt ne contient de Watchtower : `gh search repos watchtower`
ne renvoie que des homonymes (containrrr/watchtower, etc.). Les branches
`arena/01a07e3c`, `arena/01a08168` du monorepo sont vides (0 fichier d'écart
avec `main`) et `arena/01a08385` porte `nexus_os` (agents, sans lien avec
Watchtower).

## 2. Les branches du dépôt de l'app

| Branche | Dernier commit | Contenu |
|---|---|---|
| `main` | 2026-09-07 | l'app sans la livraison IMPORT DE CSV (‑1183/+58 lignes d'écart) ni la base INTEL |
| `arena/dec9cd88-watchtower` | en cours | **+ import CSV (9 fichiers), + carte stratégique (France → Thau → Frontignan), + base INTEL** |

État des pull requests : **#1 fusionnée**, **#2 fusionnée** (livraison AUDIT),
**#3 ouverte** sur `arena/dec9cd88-watchtower` — c'est elle qui porte la base
INTEL vers `main`.

## 3. Ce que chaque gisement apporte à la base

| Gisement | Ce qui en est extrait | Outil de reprise |
|---|---|---|
| `projects/frontignan/rapport-frontignan-analyse-territoriale.md` | 13 fiches projets §7, 32 chiffres, 110 sources (annexe A), 13 lacunes (annexe B), 10 contradictions | `tools/extraire-dossier-frontignan.mjs` → `src/data/frontignanDossier.js` |
| `projects/frontignan/vision-frontignan-2026-2040.md` | focale 2030, conditions de succès, 3 scénarios 2040, 7 fragilités, signaux faibles | idem |
| `arena/01a08203-monorepo` → `atlas/atlas.json` | 79 nœuds (territoires, quartiers, acteurs, projets, risques, futurs), 167 liens, faits et sources par nœud | `tools/extraire-atlas-thau.mjs` → `src/data/atlasThau.js` |
| `arena/01a08203-monorepo` → `atlas/communes-thau.csv` | 14 communes × 23 indicateurs INSEE | idem |
| annexe A du rapport (sites officiels) | registre de veille : ce qui est cité, ce qui est à brancher, ce qui a été vérifié en ligne le 07/10/2026 | travail manuel → `src/data/veilleOfficielle.js` |
| `arena/01a08449-monorepo` (chantier BTP) | structure réelle d'un dossier de chantier public (DCE, DT/DICT, planning, DOE, prix) | piste pour la **fiche CHANTIER** de la vue INTEL |

## 4. Ce que la doctrine des autres dépôts attend de nous

`projects/COGNITORIUM/docs/architecture/convergence.md` (statut `PROPOSED`,
2026-09-05) fixe deux câblages qui touchent Watchtower :

- **lien 6 · watchtower → Core** : brancher `Place`/`Project` sur PostGIS —
  la base INTEL fournit `entites.lieux` et `entites.projets` normalisés ;
- **lien 7 · proto ↔ watchtower** : `intelTwin` « carte cognitive T0 » ← contrat
  HCSM — la base INTEL fournit `entites.indicateurs` et `entites.sources` avec
  leurs marqueurs de fiabilité.

`docs/agents/gis-agent.md` rappelle la frontière à tenir : périmètre IGN /
data.gouv / cadastre apicarto / Overpass, « **pas de décision d'urbanisme** »,
et « les sources peuvent être retardées ou incomplètes — toujours vérifier ».
La base applique cette règle littéralement : elle publie ses lacunes.

## 5. Risque documenté : la double copie

Le monorepo conserve une copie du code (`projects/watchtower/`) et une copie de
l'amont du fork (`projects/COGNITORIUM/watchtower-mods/`). La doctrine du
monorepo identifie elle-même le risque de **désynchronisation** et prévoit de le
traiter « en Phase 3 (Gods Eye View) ». Tant que ce n'est pas fait :

1. la copie du monorepo sert à **montrer**, pas à décider ;
2. la copie du monorepo doit être rafraîchie après chaque fusion sur `main`
   (`npx vite build --base=./` dans `projects/watchtower/`) ;
3. la base INTEL, elle, est **exportable** (`public/data/intel/`) : un dépôt qui
   veut juste les données n'a pas besoin de la copie du code.

## 6. Où sont les sources d'origine

`docs/SOURCES_ET_OUTILS.md`, `docs/SOURCES-FR.md`, `audit/reference/REGISTRE-OUTILS.json`
(86 outils, 12 catégories) et `DATA_SOURCES.md` documentent les outils de
l'application. La base INTEL ajoute la couche **territoriale** et sa
**veille** : `src/data/veilleOfficielle.js` — 24 sources publiques en 10
familles, chacune avec sa cadence, sa licence, son état (citée / identifiée /
humaine) et sa date de vérification.

## 7. Comment tenir cet inventaire à jour

```bash
gh repo list Sathancabrol --limit 100                     # les dépôts
gh api repos/Sathancabrol/monorepo/branches --jq '.[].name'  # les branches du monorepo
gh pr list --state all                                    # les livraisons en cours
grep -ril watchtower --include='*.md' .                   # les mentions dans un clone
```

À revérifier à chaque fusion : le tableau §1 (emplacements) et le tableau §2
(branches et PR).
