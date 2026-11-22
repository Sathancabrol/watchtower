---
title: "WATCHTOWER — matrice de conflits T versus 2D et trajectoire de convergence"
created: 2026-11-22
document_type: git-merge-risk-map
tags: [watchtower, fusion, 2d, intel, branches, risque]
---

# WATCHTOWER — Matrice de convergence de branches

> [!important] Comparaison Git, pas tentative de fusion
> Variantes comparées **par chemin et empreinte SHA Git** au 22/11/2026. Les empreintes de blob différentes signalent deux contenus différents, **pas nécessairement un conflit Git au merge** (le merge tient compte du graphe des ancêtres et des lignes). À l'inverse des réécritures sémantiques peuvent se heurter malgré des chemins séparés.

| Version | SHA Git de tête | Périmètre |
|---|---|---|
| main | `5b02a1a3ff1389ebcf4953d48d013d54b35fc363` | socle documenté, API et vieux HUD |
| T / TERRITOIRE-INTEL | `4151e2e25b27efcdb500f4a47601cca96bb03388` | PR #3, CSV, base INTEL et vues |
| 2D / MapLibre-territoire | `be0cceff24d6f1d63df882d74623c4fdf49994de` | autre stratégie territoriale, moteurs 2D/3D, UI |
| CSV / hardening | `d15ac5dabee3e4d2c46f6dd73a31ab399ee1533b` | PR #5 sur T, fix du format CSV |

## Chiffres des différences de fichiers

- **9 chemins modifiés différemment** dans T et 2D par rapport à main, dont **7 chemins de code/config/styles**.
- **35 changements identiques** dans les deux variantes (même SHA de blob).
- **45 chemins modifiés/ajoutés uniquement côté T**.
- **155 chemins modifiés/ajoutés uniquement côté 2D**.
- Le correctif de sécurité CSV `src/data/attributsTerritoire.js` : **SHA différent de T (vrai correctif à examiner)**.

## Conflits potentiels du code (différence d'empreinte)

| Chemin | T vs main | 2D vs main | Diff SHA T/2D |
|---|---|---|---|
| `src/data/telegeographySubmarineCables.js` | modified | modified | 7251542e3 / 4e9dfb988 |
| `src/filInfo.js` | modified | modified | b840e1174 / 60c3ea7bc |
| `src/firstRunExperience.test.mjs` | modified | modified | 4c37c9a44 / d822d4fd9 |
| `src/main.js` | modified | modified | 6e6466bd7 / fc998c586 |
| `src/voice/gevActions.js` | modified | modified | 59dc659c3 / ab211b2df |
| `src/vuesIntel.js` | modified | modified | d948ca44a / 65cbd5b42 |
| `vite.config.js` | modified | modified | 2a6b973b4 / 0c2b57374 |

## Autres divergences

- `README.md` — T `modified`, 2D `modified`
- `ROADMAP.md` — T `modified`, 2D `modified`

## Changements propres à la variante T (45)

- `CHANGELOG.md` : modified
- `docs/AUDIT-2026-10-07.md` : added
- `docs/CURRENT-STATE.md` : modified
- `docs/IMPORTER.md` : added
- `docs/INTEL-BASE.md` : added
- `docs/REPOS-WATCHTOWER.md` : added
- `docs/SOURCES-FR.md` : modified
- `docs/SYNTHESE-DELTA.md` : added
- `docs/TRI-OUTILS-2026.md` : added
- `public/data/intel/communes-thau.csv` : added
- `public/data/intel/indicateurs.csv` : added
- `public/data/intel/lacunes.csv` : added
- `public/data/intel/projets.csv` : added
- `public/data/intel/sources.csv` : added
- `public/data/intel/veille.csv` : added
- `public/data/intel/watchtower-intel.json` : added
- `src/data/atlasThau.js` : added
- `src/data/attributsTerritoire.js` : added
- `src/data/attributsTerritoire.test.mjs` : added
- `src/data/dossierChantier.js` : added
- `src/data/frontignan.js` : added
- `src/data/frontignan.test.mjs` : added
- `src/data/frontignanDossier.js` : added
- `src/data/hudCatalogue.js` : modified
- `src/data/importCsv.js` : added
- `src/data/importCsv.test.mjs` : added
- `src/data/imprevusTp.js` : added
- `src/data/imprevusTp.test.mjs` : added
- `src/data/thauTerritoire.js` : added
- `src/data/thauTerritoire.test.mjs` : added
- `src/data/veilleOfficielle.js` : added
- `src/dossierIntel.js` : added
- `src/dossierIntel.test.mjs` : added
- `src/intelDossierVue.js` : added
- `src/intelTerrainVue.js` : added
- `src/sourcesOfficielles.js` : added
- `src/sourcesOfficielles.test.mjs` : added
- `src/territoire.js` : added
- `src/territoireScenes.js` : added
- `src/territoireScenes.test.mjs` : added
- `src/voice/freeVoice.js` : modified
- `tools/exporter-intel.mjs` : added
- `tools/extraire-atlas-thau.mjs` : added
- `tools/extraire-dossier-chantier.mjs` : added
- `tools/extraire-dossier-frontignan.mjs` : added

## Changements propres à la variante 2D (155)

- `.gitignore` : modified
- `AGENTS.md` : modified
- `AUDIT-OUTILS-2026.md` : removed
- `audit/CAPACITES-AGENT.md` : removed
- `audit/CATALOGUE-OUTILS.md` : removed
- `audit/COUTS-LICENCES-LEGAL.md` : removed
- `audit/REFERENCE.md` : removed
- `audit/reference/cherche.py` : removed
- `audit/reference/doctor.py` : removed
- `audit/reference/generate-reference.py` : removed
- `audit/reference/REGISTRE-OUTILS.json` : removed
- `audit/reference/REGISTRE.tsv` : removed
- `audit/RND-PROPOSITIONS-2026.md` : removed
- `audit/stack/.env.example` : removed
- `audit/stack/config/searxng/.gitkeep` : removed
- `audit/stack/docker-compose.yml` : removed
- `audit/stack/gen-secrets.sh` : removed
- `audit/stack/install-stack.ps1` : removed
- `audit/stack/install-stack.sh` : removed
- `audit/stack/README.md` : removed
- `docs/ARCHITECTURE-MODULE.md` : added
- `docs/AUDIT-2026-09-25.md` : added
- `docs/AUDIT-SOURCES-2026-10-06.md` : added
- `docs/AUDIT-UI.md` : added
- `docs/audit/01-ce-quon-a.csv` : added
- `docs/audit/02-ce-quon-veut.csv` : added
- `docs/audit/03-publication-scientifique-eu.csv` : added
- `docs/audit/04-repos-github.csv` : added
- `docs/audit/05-ce-qui-existe-cout.csv` : added
- `docs/audit/06-catalogue-outils.csv` : added
- `docs/audit/AUDIT-watchtower-2026-10-06.xlsx` : added
- `docs/CARTE-2D.md` : added
- `docs/CHARGE-MENTALE.md` : added
- `docs/INTEL-TERRITOIRE.md` : added
- `docs/PARITE-SOURCE.md` : added
- `docs/VOLANT.md` : added
- `index.html` : modified
- `package-lock.json` : modified
- `package.json` : modified
- `src/barreFonctions.js` : added
- `src/barreFonctions.test.mjs` : added
- `src/basculeMinicarte.js` : added
- `src/basculeMinicarte.test.mjs` : added
- `src/batiRapide.js` : modified
- `src/calques.js` : modified
- `src/cameraVerbs.js` : modified
- `src/carte2dControleur.js` : added
- `src/carte2dControleur.test.mjs` : added
- `src/cinematique.js` : modified
- `src/cockpit.js` : modified
- `src/compte.js` : modified
- `src/data/archives.js` : added
- `src/data/archives.test.mjs` : added
- `src/data/carte2d/etatCamera.js` : added
- `src/data/carte2d/etatCamera.test.mjs` : added
- `src/data/carte2d/styleIgn.js` : added
- `src/data/carte2d/styleIgn.test.mjs` : added
- `src/data/crues.js` : added
- `src/data/crues.test.mjs` : added
- `src/data/dataCredits.js` : modified
- `src/data/dossiers.js` : modified
- `src/data/fil/panneauFil.js` : added
- `src/data/fil/panneauFil.test.mjs` : added
- `src/data/fil/preferencesFil.js` : added
- `src/data/fil/preferencesFil.test.mjs` : added
- `src/data/geo/echelleVue.js` : added
- `src/data/geo/echelleVue.test.mjs` : added
- `src/data/installationFeedback.js` : added
- `src/data/installationFeedback.test.mjs` : added
- `src/data/intel/niveaux.js` : added
- `src/data/intel/niveaux.test.mjs` : added
- `src/data/matrixTrame.js` : added
- `src/data/matrixTrame.test.mjs` : added
- `src/data/osint/sourcesDocuments.js` : added
- `src/data/osint/sourcesDocuments.test.mjs` : added
- `src/data/reprisRendu.js` : added
- `src/data/reprisRendu.test.mjs` : added
- `src/data/soleil/calculSolaire.js` : added
- `src/data/soleil/calculSolaire.test.mjs` : added
- `src/data/telegeographySubmarineCables.test.mjs` : modified
- `src/data/territoire/accesTerritoire.js` : added
- `src/data/territoire/accesTerritoire.test.mjs` : added
- `src/data/territoire/dossierTerritorial.js` : added
- `src/data/territoire/dossierTerritorial.test.mjs` : added
- `src/data/territoire/frontignan.js` : added
- `src/data/territoire/frontignan.test.mjs` : added
- `src/data/territoire/frontignanDetail.js` : added
- `src/data/territoire/frontignanDetail.test.mjs` : added
- `src/data/territoire/gouvernance.js` : added
- `src/data/territoire/gouvernance.test.mjs` : added
- `src/data/territoire/grapheThau.js` : added
- `src/data/territoire/grapheThau.test.mjs` : added
- `src/data/territoire/sourcesOfficielles.js` : added
- `src/data/territoire/sourcesOfficielles.test.mjs` : added
- `src/data/territoire/sourcesThau.js` : added
- `src/data/territoire/sourcesThau.test.mjs` : added
- `src/data/ui/calques.js` : added
- `src/data/ui/calques.test.mjs` : added
- `src/data/volant/registreBascules.js` : added
- `src/data/volant/registreBascules.test.mjs` : added
- `src/data/volant/taxonomie.js` : added
- `src/data/volant/taxonomie.test.mjs` : added
- `src/data/volVues.js` : modified
- `src/data/volVues.test.mjs` : modified
- `src/diagnostic.js` : modified
- `src/displayOptions.js` : modified
- `src/dispositifs.js` : modified
- `src/ergonomieDock.js` : added
- `src/ergonomieDock.test.mjs` : added
- `src/fenetres.js` : modified
- `src/fenetres.test.mjs` : removed
- `src/flightMode.js` : modified
- `src/frenchHud.js` : modified
- `src/gardeFous.test.mjs` : modified
- `src/grapheVue.js` : added
- `src/grapheVue.test.mjs` : added
- `src/hq.js` : modified
- `src/hq.test.mjs` : modified
- `src/hud.js` : modified
- `src/hudCentral.js` : modified
- `src/integriteUI.test.mjs` : added
- `src/intelTwin.js` : modified
- `src/lisibilite.js` : added
- `src/lisibilite.test.mjs` : added
- `src/llm.js` : modified
- `src/localisation.js` : modified
- `src/locationStatus.js` : modified
- `src/locationStatus.test.mjs` : modified
- `src/mapStackController.js` : modified
- `src/medaillons.js` : modified
- `src/minimap.js` : modified
- `src/mobiDock.js` : modified
- `src/nearbyPlaces.js` : modified
- `src/nomsLieux.js` : modified
- `src/palais.js` : modified
- `src/paywallGate.js` : modified
- `src/photoSearch.js` : modified
- `src/radio.js` : modified
- `src/radioMarkup.test.mjs` : modified
- `src/rechercheDocs.js` : added
- `src/reunion.js` : added
- `src/reunion.test.mjs` : added
- `src/reunionUI.js` : added
- `src/soleil.js` : added
- `src/soleil.test.mjs` : added
- `src/theme.js` : modified
- `src/tracabilite.js` : modified
- `src/ui.js` : modified
- `src/urgence.js` : modified
- `src/volant.js` : added
- `src/volantLateral.js` : added
- `src/volantLateral.test.mjs` : added
- `src/vueCommunale.js` : modified
- `src/watchtowerExtras.js` : modified
- `style.css` : modified

## Proposition de trajectoire (pas une autorisation à fusionner)

1. Reproduire l'état des deux branches en clone/branche isolés, consigner commit SHA et tests de référence.
2. **Priorité sécurité :** inclure le fix #5 (neutralisation des formules CSV sans corrompre les nombres) dans la trajectoire T avant le premier export public.
3. **Contrat de données :** préserver `watchtower.intel@1.0.0` et relier le modèle `src/data/territoire/dossierTerritorial.js` de 2D via un adaptateur plutôt que copier/coller les objets.
4. **Couche carte :** extraire le module 2D MapLibre (état caméra neutre) derrière un contrôleur testable et sans casser Cesium ou le HUD.
5. **UI / startup :** relire et comparer explicitement `src/main.js`, `src/vuesIntel.js`, `src/filInfo.js`, `src/voice/gevActions.js`, les CSS et les tests d'ergonomie. Un merge syntaxiquement réussi peut masquer des panneaux.
6. **Observation vérifiable :** refaire le diagnostic F3, la bascule 2D/3D, les exports INTEL, les appels voix, les tests unitaires et les images UI sur la version du disque externe.
7. Documenter les décisions KEEP/ADAPT/MERGE/DEFER et l'ownership avant toute intégration à Carré d’As.

## Critères d'acceptation

- Tous les chemins de la matrice ont une décision explicite et un test de non-régression.
- Le module n'expose aucune clé/secrets en Git ; couches externes respectent licences et quotas.
- Les données de provenance et la différence `observation` / `inférence` / `hypothèse` subsistent.
- La 2D est réellement utilisable à faible charge GPU et le retour 3D restaure l'état caméra sans dérive.
- La CI `main` connue en échec sur deux mappings `ign-ortho` doit être revue ; **aucun test n'a été lancé ici**.

[Hub de mémoire](01-HUB-SUIVI-AGENTS.md) · [Carte des capacités](03-CAPACITES-ARCHITECTURE-DIVERGENCES.md) · [PR #3](https://github.com/Sathancabrol/watchtower/pull/3) · [PR #5](https://github.com/Sathancabrol/watchtower/pull/5).
