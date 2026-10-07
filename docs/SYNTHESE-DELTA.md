# Synthèse — ce qui a été ajouté au projet

> Périmètre : tout le travail de cette session, mesuré entre **`main`** (`d44ef7c`) et la
> branche **`arena/dec9cd88-watchtower`** (`2e34c21`). Chiffres calculés le 7 octobre 2026
> (`git diff --numstat`, comptage des `test(`).

## 1 · Vue d'ensemble

| Indicateur | Valeur |
|---|---|
| Commits ajoutés | **4** |
| Fichiers touchés | **45** (+14 079 / −17 lignes) |
| Tests ajoutés | **111** (suite complète : 3 255 tests, 0 échec) |
| Livraisons | **3** : carte stratégique TERRITOIRE · import CSV · base INTEL + vue DOSSIER |
| Nouveaux documents | **3** : `docs/IMPORTER.md`, `docs/INTEL-BASE.md`, `docs/REPOS-WATCHTOWER.md` |
| Dépôts inspectés | **9** (5 emplacements contiennent un Watchtower) |
| Pull request | **#3**, ouverte, 45 fichiers |

## 2 · Les quatre commits

| Commit | Titre | Fichiers | Lignes | Tests |
|---|---|---|---|---|
| `e38fb2a` | TERRITOIRE — la carte stratégique (France → Thau → Frontignan) | 20 | +3 835 / −12 | 76 |
| `8e1070b` | TERRITOIRE — import de CSV : la porte d'entrée des fichiers | 9 | +1 183 / −58 | 17 |
| `89ff4e5` | docs : comment importer un CSV dans TERRITOIRE | 1 | +79 | — |
| `2e34c21` | INTEL — base territoriale consolidée et vue 📚 DOSSIER | 22 | +9 040 / −5 | 18 |

## 3 · Livraison par livraison

### 3.1 · TERRITOIRE — la carte stratégique (interface façon jeu de stratégie)

| Ajout | Fichier | Ce que ça fait |
|---|---|---|
| Hiérarchie réelle France → quartier | `src/data/thauTerritoire.js` (396 l.) | 14 communes de Sète Agglopôle, 11 quartiers de Frontignan, 3 niveaux de précision géographique |
| Schéma d'attributs | `src/data/attributsTerritoire.js` (709 l.) | Contrat des colonnes : réseaux techniques, événements culturels, associations, complétude, validation |
| Base locale d'amorçage | `src/data/frontignan.js` (193 l.) | 21 sources, 18 lieux, 6 réseaux, 4 transformations — tout vérifiable et sourcé |
| Base d'imprévus chantier TP | `src/data/imprevusTp.js` (431 l.) | 81 fiches, 18 phases A→R, 12 cascades, 22 signaux faibles, 13 sources, 3 niveaux de preuve |
| Scènes du territoire | `src/territoireScenes.js` (543 l.) | Maillage hexagonal → géométrie réelle, frise temporelle 2020→2040, diagnostic réseau |
| Fenêtre TERRITOIRE | `src/territoire.js` (590 l.) | Panneau DOM/Cesium : fil d'Ariane, TERRITOIRE, INSPECTEUR, frise TEMPS, bandeau projets |
| Tests | 5 fichiers `.test.mjs` | 76 tests (27 + 14 + 13 + 13 + 9) |

### 3.2 · Import de CSV — la porte d'entrée des fichiers

| Ajout | Fichier | Ce que ça fait |
|---|---|---|
| Analyseur d'import | `src/data/importCsv.js` (525 l.) | Détection de type, analyse de CSV, fabrication d'identifiants stables, fusion par id |
| Couche d'imports | `src/territoireScenes.js` (+151 l.) | `importerDans`, `compteImports`, frise datée, retrait propre |
| Bouton et glisser-déposer | `src/territoire.js` (+157 l.) | 📥 IMPORTER UN CSV · ⌫ EFFACER · rapport d'import complet |
| Mode d'emploi | `docs/IMPORTER.md` (79 l.) | Colonnes et synonymes par table, exemple de rapport, 3 règles |
| Tests | `src/data/importCsv.test.mjs` | 17 tests |

**Les 3 règles** : rien n'est jeté · rien n'est inventé (`confiance: 'à vérifier'`,
`source_id: 'src_import_utilisateur'`) · rien n'est caché (le rapport dit tout).

### 3.3 · INTEL — base territoriale consolidée et vue 📚 DOSSIER

| Ajout | Fichier | Contenu |
|---|---|---|
| Base du dossier territorial | `src/data/frontignanDossier.js` (391 l.) | **13 fiches projets**, **32 chiffres sourcés**, **110 sources datées**, **13 lacunes**, **10 contradictions**, 5 vigilances, focale 2030, **3 scénarios 2040**, 7 fragilités, signaux faibles |
| Atlas de Thau | `src/data/atlasThau.js` (516 l.) | **79 nœuds**, **167 liens**, **14 communes × 23 indicateurs INSEE** (131 216 hab.) |
| Veille officielle | `src/data/veilleOfficielle.js` (451 l.) | **24 sources publiques**, 10 familles, cadence, licence, état, date de vérification |
| Cœur de la base | `src/dossierIntel.js` (471 l.) | Fiches projet/commune, lacunes, scénarios, contrat `watchtower.intel@1.0.0`, export JSON + 6 CSV |
| 7ᵉ vue de l'INTEL | `src/intelDossierVue.js` (241 l.) | Vue 📚 DOSSIER : 7 onglets, exports téléchargeables, fil local hors réseau |
| Extracteurs | `tools/extraire-dossier-frontignan.mjs` (589 l.), `tools/extraire-atlas-thau.mjs` (327 l.) | Rangement reproductible du dossier et de l'atlas — rien n'est interprété |
| Exporteur | `tools/exporter-intel.mjs` (50 l.) | Écrit JSON + CSV dans `public/data/intel/` |
| Tests | `src/dossierIntel.test.mjs` | 18 tests (intégrité, volumes, forme des exports) |

## 4 · Données désormais dans le projet

| Table | Volume | Origine | Date |
|---|---|---|---|
| Fiches projets | 13 | dossier territorial (annexe §7) | 08/09/2026 |
| Chiffres sourcés | 32 | INSEE, Ville, agglo, presse | 2023-2026 |
| Sources datées | 110 | annexe A du dossier | 08/09/2026 |
| Lacunes publiées | 13 (dont 1 angle mort nº1) | annexe B du dossier | 08/09/2026 |
| Contradictions arbitrées | 10 | annexe B.1 | 08/09/2026 |
| Nœuds / liens d'atlas | 79 / 167 | branche `arena/01a08203-monorepo` | 08/09/2026 |
| Communes de l'agglo | 14 × 23 indicateurs | atlas (INSEE recalculé) | 08/09/2026 |
| Sources de veille | 24 (8 revérifiées en ligne) | agent | 07/10/2026 |
| Imprévus chantier TP | 81 fiches, 18 phases, 12 cascades, 22 signaux | bibliographie + REX | — |

## 5 · Ce que le projet sait faire maintenant, et ne savait pas avant

| Avant | Après |
|---|---|
| Une carte du monde avec des vues généralistes | Une **hiérarchie territoriale navigable** France → quartier → parcelle, avec maillage hexagonal puis géométrie réelle |
| Aucun moyen d'entrer ses propres données | **Import de CSV** avec rapport complet, trois règles de traçabilité |
| 6 vues INTEL branchées sur des API en direct | **7 vues**, dont 📚 DOSSIER qui **fonctionne hors réseau** et publie ses lacunes |
| Aucune base territoriale consolidée | **3 bases** générées, contrôlées par test, **exportables** (JSON + CSV) |
| Rien pour les autres dépôts | **Contrat `watchtower.intel@1.0.0`** : entités `lieu / projet / indicateur / source / lacune` pour les câblages PostGIS et `intelTwin` |
| Aucune vue d'ensemble des dépôts | **`docs/REPOS-WATCHTOWER.md`** : où vit chaque Watchtower et ce qu'il apporte |

## 6 · Ce qui reste à faire

| Point | État |
|---|---|
| Fusion dans `main` | **PR #3 ouverte** — `main` n'a ni l'import CSV ni la base INTEL |
| Copie du monorepo (`projects/watchtower/`) | À resynchroniser après fusion (build `--base=./`) |
| Les 6 CSV annoncés par l'utilisateur | jamais reçus — l'import fonctionne désormais par le bouton 📥 |
| Fiche CHANTIER (matériau du corpus BTP) | piste identifiée dans `arena/01a08449-monorepo` (DCE, DT/DICT, planning, DOE) |
| Sources de veille « identifiées » | 6 à brancher (GPU, DVF, BOAMP, DECP, INPN, Cerema) |
