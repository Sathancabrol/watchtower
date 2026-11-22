---
title: "WATCHTOWER — Encyclopédie Git et mémoire externe des agents"
aliases:
  - "Watchtower — audit exhaustif GitHub"
  - "Carré d'As — inventaire global"
  - "Cognitorium — panorama des intégrations"
created: 2026-11-22
updated: 2026-11-22
version: "2.0"
document_type: agent-external-memory-master
status: github-audit-complete-with-stated-limits
owner_repository: Sathancabrol/watchtower
canonical_location: docs/agent-memory/08-WATCHTOWER-AUDIT-MAITRE-2026-11-22.md
verified_scope: "9 dépôts du compte (84 branches), 49 branches de l'upstream, arbres Git de tête, historiques de commits des 84 branches, PR, CI, documents et code ciblé"
not_verified: "disque externe, worktrees privés/non committés, runtime Windows/téléphones, tests physiques, toutes les API live, chaque ligne de chaque fichier"
tags:
  - watchtower
  - obsidian
  - agent-memory
  - cognitorium
  - carre-d-as
  - cronos
  - hermes
  - olympus
  - github
  - audit
  - provenance
---

# WATCHTOWER — Audit maître GitHub, mémoire externe et guide de reprise

> [!abstract] Mission
> Constituer **un point d'entrée stable pour les agents IA** qui permette de comprendre le monde Watchtower, ses modules, ses sources, ses variantes Git, leur historique, leurs rapports, leurs contradictions et les raccordements au reste de Cognitorium/Carré d'As. Réutiliser le code et les preuves existants sans réécriture intempestive.
>
> **Nature de l'audit :** lecture des **références GitHub** du 22 novembre 2026. « Tout scanné » signifie ici : tous les **noms de branches accessibles** des neuf dépôts du compte et de leur upstream direct, **leurs arbres Git**, et toutes les pages d'historique récupérées pour les 84 branches du compte. Cela ne signifie pas inspection manuelle de chaque ligne, dépôts inconnus/privés, commits Git orphelins, postes locaux ni vérification de toutes les fonctionnalités en exécution.

## 0. Résultat global et critère d'arrêt de la passe

| Objet audité | Résultat de la passe | Trace |
|---|---:|---|
| Dépôts principaux du compte `Sathancabrol` accessibles | **9** | [Voir §1](#1-les-neuf-dépôts-leurs-frontières-et-leurs-branches) |
| Branches Git de ces dépôts | **84** | [05A–D](05A-MONOREPO-BRANCHES-PRIORITAIRES.md), [06A–D](06A-COGNITORIUM-TOUTES-BRANCHES.md), [inventaire Watchtower](02-INVENTAIRE-GITHUB-COMPLET.md) |
| Branches publiques du fork d'origine `bilawalsidhu/gods-eye-view` | **49** | [10B](10B-UPSTREAM-BRANCHES-01-10.md) · [10C](10C-UPSTREAM-BRANCHES-11-20.md) · [10D](10D-UPSTREAM-BRANCHES-21-30.md) · [10E](10E-UPSTREAM-BRANCHES-31-40.md) · [10F](10F-UPSTREAM-BRANCHES-41-49.md) |
| Branches au total avec upstream | **133** | Les 84 internes + 49 de l'amont |
| **Références de commits uniques** indexées avec lien (dépôts du compte) | **1 389** dans les annexes `07A–07I` (dédoublonnées à partir de leurs liens) | [07A](07A-WATCHTOWER-TOUS-COMMITS.md) et séries [07B](07B-MONOREPO-COMMITS-OLYMPUS.md) à [07I](07I-MODULES-ADJACENTS-TOUS-COMMITS.md) |
| Watchtower : commits uniques atteignables des **11 branches** dans le relevé initial | **114** | [07A](07A-WATCHTOWER-TOUS-COMMITS.md), avant les ajouts ultérieurs de cette documentation |
| Chemins distincts dans l'index transversal de base Watchtower et copies sélectionnées | **1 131** | [02](02-INVENTAIRE-GITHUB-COMPLET.md) · [JSON SHA](WATCHTOWER-FILE-INDEX.json) |
| PR Watchtower ouvertes au point de contrôle | **4** : #3, #4, #5, #6 | [04](04-VALIDATION-CI-REPRISE.md) · [09A](09A-PR-TAGS-CI-CORE.md) |
| Tests unitaires `watchtower/main` observés sur GitHub Actions le 22/11 | **3 144**, **2 échecs**, Windows onboarding OK | [Run 45033922316](https://github.com/Sathancabrol/watchtower/actions/runs/45033922316) |
| Test complet de la tour Windows / disque externe / modèles locaux | **NON EFFECTUÉ** | Accès direct indisponible dans cette session |

> [!warning] Le niveau de complétude est borné
> Les **84 historiques des dépôts personnels** ont été examinés avec pagination, dont la grande branche OLYMPUS Studio qui dépasse 700 commits. L'**amont externe** a été scanné par **arbre des 49 pointes de branches** et comparé à son `main`, mais **l'intégralité de son historique ancestral et des forks tiers n'a pas été reconstruite** : ce serait un autre périmètre. L'inventaire de **1 131 chemins** est une base de comparaison ciblée, **pas** le total de tous les chemins de tous les autres dépôts ni les >5 000 fichiers de l'amont.
>
> Le journal ci-dessous est un **instantané** : un commit documentaire supplémentaire change `watchtower/main`. Les chiffres d'un snapshot ne s'actualisent pas d'eux-mêmes.

## 1. Les neuf dépôts, leurs frontières et leurs branches

| Dépôt | Branches | Propriété fonctionnelle | Ce qu'il ne faut pas confondre |
|---|---:|---|---|
| [`watchtower`](https://github.com/Sathancabrol/watchtower) | 11 | Application Cesium/Vite, globe, INTEL, territoire, données spatiales, enquêtes, HUD | `main` ≠ branches T/2D ≠ disque externe |
| [`monorepo`](https://github.com/Sathancabrol/monorepo) | 35 | Copies intégrées, Carré d'As, Olympus Studio, CRONOS Fleet, Laplace, X-Ray Mirror, Frontignan, outils et données | `projects/watchtower` copie ≠ source canonique du code |
| [`COGNITORIUM`](https://github.com/Sathancabrol/COGNITORIUM) | 5 | Origine du fork, constitution, Learning Engine, **OSINT Workbench** | `watchtower-mods` ≠ `watchtower/main` ; doc « dépôt vide » obsolète |
| [`proto-cognitorium`](https://github.com/Sathancabrol/proto-cognitorium) | 10 | Prototype React/TS, profils, parcours, graphe cognitif, preuves | Hôte potentiel non intégré à Cesium |
| [`ETAT-DE-LART-PSYCHOLOGIE`](https://github.com/Sathancabrol/ETAT-DE-LART-PSYCHOLOGIE) | 11 | Références scientifiques, FastAPI/D3, agent recherche, **Cosmos / Olympus** en branches | Des rôles dans le code ≠ workers actifs dans Watchtower |
| [`HCSM`](https://github.com/Sathancabrol/HCSM) | 4 | Modèle scientifique / validateur cognitif | Hypothèse ou modèle ≠ diagnostic d'individu |
| [`reaserch-engine`](https://github.com/Sathancabrol/reaserch-engine) | 2 | Recherche, preuves, graphe de provenance, checkpoints | Moteur de recherche distinct de la couche `analystEngine.js` Watchtower |
| [`Language-decoder`](https://github.com/Sathancabrol/Language-decoder) | 4 | Interface et moteurs multimodaux en branches non fusionnées | `main` très minimal ≠ absence de code dans les branches |
| [`animation-chronos`](https://github.com/Sathancabrol/animation-chronos) | 2 | Narration/animation | N'est **pas** le service CRONOS/Hermes |

**Volet upstream direct :** [`bilawalsidhu/gods-eye-view`](https://github.com/bilawalsidhu/gods-eye-view), 49 branches publiques inventoriées, produit d'origine ayant continué à évoluer.

## 2. Carte mentale et architecture transversale

```mermaid
flowchart TD
    U[Humain / mission / demande] --> ORCH[CRONOS / Carré d'As / Hermes — choix du runtime]
    ORCH --> WT[WATCHTOWER — territoire / monde physique]
    ORCH --> RE[Research Engine / preuves]
    ORCH --> CG[COGNITORIUM / profils / apprentissage]
    ORCH --> ST[OLYMPUS Studio / médias]
    WT --> CZ[Cesium 3D main]
    WT -. "Branche 2D non fusionnée" .-> M2[MapLibre 2D]
    WT -. "PR #3 non fusionnée" .-> IT[INTEL DOSSIER / TERRAIN / CSV]
    WT --> EV[Sources / provenance / événements]
    EV --> MEM[(Mémoire locale versionnée)]
    RE --> MEM
    CG --> MEM
    ST -. "Adaptateur Watchtower prévu" .-> WT
    XR[X-Ray Mirror — branche monorepo] -. "Adaptateur en attente" .-> ST
    CA[Carré d'As module watchtower — branche Arena] --> API[/api/carto et canonical records]
    API -. "Couplage 3D à valider" .-> WT
    ORCH --> AUD[Logs / CI / contrôle humain]
    AUD --> MEM
```

Les flèches pleines décrivent des **rôles ou du code constaté dans les espaces indiqués** ; les flèches pointillées sont **des liens d'intégration non démontrés en production**. Le diagramme ne constitue pas une recette fonctionnelle.

## 3. Versions concurrentes de Watchtower

### 3.1 Le socle `main`

- **Vite, JavaScript, Cesium** ; toujours une application autonome.
- **Écran d'entrée gratuit, géocodage, fonds satellite, navigation, vols et caméra, données et stations publiques, radio, historique temporel, terrain/BTP, diagnostic F3, palais mental** : structures présentes dans les sources et décrites par les documents.
- **INTEL** : six vues historiques dans `src/vuesIntel.js` ; interfaces étendues sur les branches T et 2D.
- **Assistant local** : `src/llm.js` possède Ollama et des réponses de secours ; aucun raccordement direct au **Core CRONOS :8789** n'est établi dans ce code.
- **Source de vérité historique** : [ROADMAP](../../ROADMAP.md) → [REPRISE](../REPRISE.md) → [AUDIT](../AUDIT.md), sans déduire le fonctionnement de la seule documentation.

### 3.2 Variante `T` : TERRITOIRE + INTEL

Référence : [`arena/dec9cd88-watchtower`](https://github.com/Sathancabrol/watchtower/tree/arena/dec9cd88-watchtower), [PR #3](https://github.com/Sathancabrol/watchtower/pull/3) ouverte.

Contenus trouvés : `src/territoire.js` + `src/territoireScenes.js` (carte stratégique), `src/data/thauTerritoire.js`, `src/data/frontignanDossier.js`, `src/data/atlasThau.js`, `src/data/importCsv.js`, `src/dossierIntel.js`, `src/intelDossierVue.js`, `src/intelTerrainVue.js`, `src/sourcesOfficielles.js`, `public/data/intel/`, scripts d'extraction/export.

[Dossier INTEL](https://github.com/Sathancabrol/watchtower/blob/arena/dec9cd88-watchtower/docs/INTEL-BASE.md) : volumes **historiquement rapportés** 13 projets, 32 indicateurs, 110 sources, 13 lacunes, 10 contradictions, 79 nœuds, 167 liens, 14 communes et 24 sources de veille. Contrat `watchtower.intel@1.0.0`, JSON + CSV. Un résultat de tâche Hermes **124/124 POI** le 13/11 n'est pas un commit de `main`.

**Correctif de sécurité distinct :** [PR #5](https://github.com/Sathancabrol/watchtower/pull/5) s'applique à la branche T : `src/data/attributsTerritoire.js` et son test protègent les exports CSV contre les formules interprétées par tableur. Avant diffusion, intégrer ou adapter ce correctif avec tests.

### 3.3 Variante `2D` : MapLibre + autre INTEL

Référence : [`arena/01a072e1-watchtower`](https://github.com/Sathancabrol/watchtower/tree/arena/01a072e1-watchtower), aussi alias `fix/map2d-lifecycle-2026-10-18` au même SHA de tête.

Contenus : `src/carte2dControleur.js`, `src/data/carte2d/etatCamera.js`, `src/data/carte2d/styleIgn.js`, composants de `src/data/territoire/`, `src/volant.js`, ergonomie HUD. **La bascule franche Cesium ↔ MapLibre est codée dans cette branche**, pas dans `main`; les couches applicatives 2D et l'activation adaptative par FPS restent à valider/compléter selon [CARTE-2D](https://github.com/Sathancabrol/watchtower/blob/arena/01a072e1-watchtower/docs/CARTE-2D.md).

**Conflits de chemin** : [`11-MATRICE-CONVERGENCE-TERRITOIRE-2D.md`](11-MATRICE-CONVERGENCE-TERRITOIRE-2D.md) mesure neuf chemins aux SHA divergents, sept en code/configuration, dont `src/main.js`, `src/vuesIntel.js`, `src/filInfo.js`, `src/voice/gevActions.js`, `vite.config.js`. Un diff de fichiers ne remplace pas un merge à trois points ni des tests d'intégration.

### 3.4 Quatre PR ouvertes du dépôt

| PR | Nature | Traitement |
|---|---|---|
| [#3 TERRITOIRE / INTEL](https://github.com/Sathancabrol/watchtower/pull/3) | Intégration non fusionnée | Tests et contrats de données |
| [#5 CSV hardening](https://github.com/Sathancabrol/watchtower/pull/5) | Correction sécurité vers #3 | Préserver avant export |
| [#4 Agent Handoff](https://github.com/Sathancabrol/watchtower/pull/4) | Mémoire agent historique | À référencer, pas doubler |
| [#6 Oracle Axis](https://github.com/Sathancabrol/watchtower/pull/6) | **32 capacités proposées en document** | Pas d'application Oracle intégrée |

## 4. Carré d'As : deux dépôts apparents, deux implémentations

**Branche A :** [`monorepo/arena/0034230e-monorepo`](https://github.com/Sathancabrol/monorepo/tree/arena/0034230e-monorepo) introduit `carredas/` avec noyau et agents. Il contient :

| Code réel | Rôle | Degré d'intégration |
|---|---|---|
| [`carredas/modules/watchtower/module.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/watchtower/module.json) | Module `watchtower`, version `0.1.0`, cartographie activée dans la configuration de cette branche, endpoints `/api/carto` | Déclaré/codé dans branche |
| [`carredas/modules/watchtower/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/watchtower/router.py) | Catalogue de couches, points, annotations, sources et vues | Routes implémentées, **moteur 3D complet encore à raccorder** selon commentaire du module |
| [`carredas/core/canonical-record.schema.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/core/canonical-record.schema.json) | `id`, `type`, `source`, `status`, `geometry`, provenance, dates, relations, licence | Contrat intermodulaire codé |
| [`carredas/core/canonical.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/core/canonical.py) | Adaptateurs points/preuves/outils/profils et statuts `fact/inference/hypothesis/unknown` | Implémentation consultée, validation runtime non exécutée |
| [`carredas/modules/osint/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) | Cas, registres et preuves ; `charger_watchtower` plutôt que recopier | Intégration de registre codée |
| [`carredas/modules/agents/orchestrateur.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/agents/orchestrateur.py) | SOL orchestrateur déterministe, agents et sous-agents | **Pas une preuve de connexion Hermes/CRONOS** |
| [`carredas/modules/laplace/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/laplace/router.py) | Façade chat et mémoire contextuelle vers SOL | Autre implémentation que le bot Discord Laplace |

**Branche B :** [`monorepo/arena/15c77b59-monorepo`](https://github.com/Sathancabrol/monorepo/tree/arena/15c77b59-monorepo) contient **`projects/carre-d-as/`**, un ensemble d'application et de documents orientés tutorat. **Nom semblable mais propriété fonctionnelle différente : ne pas le substituer à `carredas/`.**

**Règle des agents :** établir un identifiant de produit, un propriétaire canonique et un contrat de transport avant de mélanger ces deux formes de Carré d’As.

## 5. Le Workbench OSINT oublié dans COGNITORIUM

Branche [`COGNITORIUM/watchtower/osint-workbench-v0.1`](https://github.com/Sathancabrol/COGNITORIUM/tree/watchtower/osint-workbench-v0.1) : **12 chemins ajoutés**. Ce n'est **pas** le module `src/dossierIntel.js` de la branche T ; il s'agit d'une autre couche d'enquête.

- [`OSINT-MASTER-SPEC.md`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/docs/OSINT-MASTER-SPEC.md), draft v0.2 : primitives `ENTITY`, `OBSERVATION`, `SOURCE`, `RELATION`, `EVENT`, `QUESTION`, `VALIDATION`; reconstruction du monde, preuves, sources, temps, questions et cas.
- [`OSINT-ROADMAP.md`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/docs/OSINT-ROADMAP.md) : version V0.1 de registre, vocabulaire de preuve, JSON et démo ; schéma canonique de cas `.wtcase.json`, graphe temporel et connecteurs **prévus**, non réalisés.
- [`osintCase.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintCase.js), [`osintEvidence.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintEvidence.js), [`osintRegistry.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintRegistry.js), [`osintWorkbench.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintWorkbench.js) : modèle de cas, états `FACT / INFERENCE / HYPOTHESIS / UNKNOWN`, catalogue descriptif et UI de démo.
- **Avertissement important :** la démo construit des observations **exemplaires codées en dur**, certaines étiquetées `FACT`. Elles ne proviennent pas de collectes BAN/DVF/SIRENE réellement exécutées : l'agent ne doit jamais les publier comme preuves réelles. Les connecteurs exigent revue de licence, quotas et confidentialité. Les outils d'identité personnelle du registre ne doivent pas déclencher de ciblage individuel.

**Convergence possible :** réutiliser les primitives de cas et validation, préserver les exports `watchtower.intel@1.0.0`, adapter `carredas/core/canonical-record.schema.json` et rendre les preuves humaines explicitement vérifiables. **Aucun copier-coller des trois modèles de données sans arbitrage.**

## 6. OLYMPUS Studio, XR, LAPLACE, HERMES et CRONOS Fleet

| Ensemble et branche | Code ou contrat retrouvé | État honnête |
|---|---|---|
| [OLYMPUS Studio](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-studio-20261112/projects/olympus-studio) | Node local :8787, interface en 12 espaces, storyboard, OBS, ComfyUI, IndexedDB et exports | **Preview alpha** ; Windows final, Watchtower, X-Ray, Hermes non intégrés selon [integration-registry.js](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/src/integration-registry.js) |
| [OLYMPUS Studio Fleet](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-fleet-247-20261113/projects/olympus-studio) | Branches et docs d'intégration multi-appareils | Plan et code historique, pas healthcheck 24/7 vérifié |
| [OLYMPUS Mobile Preview](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-mobile-preview-20261113/projects/olympus-studio) | Script de preview téléphones, launcher et mobile-access | Prévisualisation séparée, ne pas confondre avec une app native |
| [X-Ray Mirror v0.7](https://github.com/Sathancabrol/monorepo/tree/arena/d036959d-monorepo/projects/xraymirror) | MediaPipe, perception locale, gestes, audio, règles, anatomie schématique, panneau cognition, plugins | Prototype. Pas de validation webcam réelle sur la tour dans ce dépôt, modèles et SHA partiellement absents |
| [Chronos Fleet](https://github.com/Sathancabrol/monorepo/tree/feat/chronos-fleet-free-fallback-20261113/scripts/chronos-fleet) | Routeur Python HTTP local :18888, `cronos-local` et `cronos-light`, failover avant réponse et tests simulés | **N'est pas CRONOS Core :8789**, 4 appareils déclarés mais non connectés/vérifiés par le code livré |
| [Hermes Continuity](https://github.com/Sathancabrol/monorepo/tree/fix/hermes-autonomy-rescue-20261114/ops/hermes-continuity) | Diagnostic PowerShell et inventaire des modèles | Documentation et scripts, pas réparation générale du runtime |
| [LAPLACE Discord](https://github.com/Sathancabrol/monorepo/tree/arena/00f44a26-monorepo/projects/laplace) | Bot Python, Ollama, SQLite FTS, mémoire privée/partagée opt-in | Bot **à configurer**, non intégré Carré d’As dans cette branche ; autre que `carredas/modules/laplace` |
| [Nexus OS](https://github.com/Sathancabrol/monorepo/tree/arena/01a08385-monorepo/nexus_os) | 85+ fichiers ajoutés (runtime, providers, MCP, mémoire, agents, skills et tests) | Un **autre** plan d'agent ; ne pas créer de duplicata gratuit |
| [Cosmos et Sathyr](https://github.com/Sathancabrol/ETAT-DE-LART-PSYCHOLOGIE/tree/feat/sathyr-optional-interjections-2026-11-12) | Agent, skills et graphes de rôles | Existence de code ≠ service opérationnel sur Watchtower |

**Point d'intégration OLYMPUS** : [`docs/ARCHITECTURE.md`](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/docs/ARCHITECTURE.md) demande des capacités `available/configured/tested`, des commandes `request_id/dry_run/ack`, des événements ordonnés et des identifiants d'assets. Il précise qu'une scène Canvas 2D ne fusionne pas automatiquement avec la scène Cesium. Le chemin réel est un **adaptateur** scène/caméra/média/métadonnées avec test d'acceptation.

## 7. Upstream et potentiel de récupération

**God's Eye View** est le code d'origine, **pas** une copie figée de Watchtower. Au 22/11, son `main` contient **5 086 fichiers** contre environ **611** fichiers Watchtower au point de comparaison initial (référence de mémoire en croissance depuis).

- **4 670 chemins** upstream absents de Watchtower `main` ; **353 chemins** de même nom et SHA différent ; **195 chemins** fork sans homologue upstream (comptages à date dans [10](10-UPSTREAM-GODS-EYE-VIEW-COMPARAISON.md)).
- Candidats : nouvelles sources géospatiales, météo, mobilité/transit, voix, mobile, performance, contextes, scènes, stockage et interfaces.
- **49 branches amont comparées** à leur `main` : [01–10](10B-UPSTREAM-BRANCHES-01-10.md), [11–20](10C-UPSTREAM-BRANCHES-11-20.md), [21–30](10D-UPSTREAM-BRANCHES-21-30.md), [31–40](10E-UPSTREAM-BRANCHES-31-40.md), [41–49](10F-UPSTREAM-BRANCHES-41-49.md).
- Certaines anciennes branches en sont très éloignées ; d'autres sont des correctifs récents voisins de `main`. **Diff de fichier ≠ feature utile et non régressive.** Préparer la sélection sur besoin, licence et compatibilité avant un portage.

## 8. Résultats CI, sécurité et sens des preuves

**Watchtower :** [GitHub CI 45033922316](https://github.com/Sathancabrol/watchtower/actions/runs/45033922316), Windows onboarding **success**, tests Node 24 et 26 **failure**, **3 144 tests / 2 échecs** :

1. `MAP_STACKS id 'ign-ortho' has no cable classification mapping`.
2. `set_map_stack 'ign-ortho' has no self-mapping alias — voice selection would throw`.

Cela correspond aux deux échecs préexistants signalés par [REPRISE](../REPRISE.md) ; ne pas confondre un runner GitHub vert sur Windows **onboarding** avec tous les tests verts, ni avec le PC de l'utilisateur. La CI récente de **OLYMPUS Studio** a connu succès puis échecs, sa dernière observation doit être relue via [Actions Monorepo](https://github.com/Sathancabrol/monorepo/actions). Les tests historiques rapportés dans les branches T/2D ne sont pas une exécution de ces branches au 22/11.

**Garde-fous d'architecture :** zéro abonnement obligatoire ; provenance et licence de toute source ; refuser le suivi ciblé d'individus ; ne pas exposer clés, médias privés, empreintes vocales ni données sensibles ; données manquantes `null/unknown`, **jamais 0 inventé** ; repli local et dégradation annoncée ; ressources GPU contraignantes ; ne pas éditer `AGENTS.md`, `audit/REFERENCE.md` et registres générés directement (modifier `audit/reference/generate-reference.py` et régénérer).

## 9. Tableau des grandes divergences encore ouvertes

| Point | Ce que Git prouve | Ce qu'il manque pour clore |
|---|---|---|
| Watchtower carte 2D | Implémentation MapLibre dans 2D | Portage contrôlé, FPS GPU Windows et tests de retour caméra |
| INTEL consolidé | T porte la base et les deux vues DOSSIER/TERRAIN | Fusion sûre et tests contre données, licences et API |
| OSINT Workbench | Démo et primitives dans COGNITORIUM | Connecteurs vérifiés, gabarit `.wtcase`, graphe et validation humaine |
| Carré d'As | API `/api/carto`, enregistrements canoniques et adaptation de sources | Viewer Cesium réel et flux d'actions dans l'interface |
| OLYMPUS | Shell et registre d'intégrations | Adaptateur SPATIAL réellement validé et export reproductible |
| CRONOS/Hermes | Plusieurs versions de routeurs et guides | Propriétaire unique, healthchecks, quotas et dispatch réel |
| X-Ray Mirror | Code perception local | Tests webcam/micro/permissions, horodatage et règles de confidentialité |
| COGNITORIUM/HCSM | Branches modèles, validateurs et UI | Contrats scientifiques, anonymisation et non-déduction automatique |
| Disque externe | Mention historique, aucun montage de ce support ici | SHA de la copie, fichiers non suivis, état Git, répertoires réels |
| Upstream | 49 arbres/refs et delta `main` | Sélection des portages utiles, comparaison de fonctions et non-régression |

## 10. Index de toutes les annexes produites — Obsidian

**Lire d'abord :** [[01-HUB-SUIVI-AGENTS]] → [[00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP]] → ce document → [[03-CAPACITES-ARCHITECTURE-DIVERGENCES]] → [[04-VALIDATION-CI-REPRISE]].

### Arbres, versions et fichiers

- [[02-INVENTAIRE-GITHUB-COMPLET]] — chemins Watchtower et versions comparées.
- `WATCHTOWER-FILE-INDEX.json` — SHA et tailles machine, schéma `watchtower.public-file-index@1.0.0`.
- [[05A-MONOREPO-BRANCHES-PRIORITAIRES]] — huit branches prioritaires Olympus/CRONOS/Nexus/Atlas.
- [[05B-MONOREPO-BRANCHES-ARENA]] — groupe Arena B.
- [[05C-MONOREPO-BRANCHES-ARENA-AUDIT]] — groupe Arena C, Carré d’As et outils.
- [[05D-MONOREPO-BRANCHES-FEATURES]] — groupe features D.
- [[06A-COGNITORIUM-TOUTES-BRANCHES]] — Workbench OSINT inclus.
- [[06B-PROTO-COGNITORIUM-TOUTES-BRANCHES]].
- [[06C-PSYCHOLOGIE-OLYMPUS-TOUTES-BRANCHES]].
- [[06D-MODULES-ADJACENTS-TOUTES-BRANCHES]] — HCSM, reaserch-engine, Language Decoder et animation.

### Historique des commits — SHA et message

- [[07A-WATCHTOWER-TOUS-COMMITS]] — 11 branches du dépôt Watchtower.
- [[07B-MONOREPO-COMMITS-OLYMPUS]] ; [[07B2-MONOREPO-COMMITS-OLYMPUS-PAGINATION]] ; [[07B3-OLYMPUS-STUDIO-COMMITS-PAGINATION]] — tous commits récupérés des grandes branches Olympus avec pagination.
- [[07C-MONOREPO-COMMITS-ARENA-B]], [[07D-MONOREPO-COMMITS-ARENA-C]], [[07E-MONOREPO-COMMITS-FEATURES-D]] — autres branches monorepo.
- [[07F-COGNITORIUM-TOUS-COMMITS]], [[07G-PROTO-COGNITORIUM-TOUS-COMMITS]], [[07H-OLYMPUS-COSMOS-TOUS-COMMITS]], [[07I-MODULES-ADJACENTS-TOUS-COMMITS]].

### PR, CI, risques et amont

- [[09A-PR-TAGS-CI-CORE]], [[09B-PR-TAGS-CI-COGNITION]], [[09C-PR-TAGS-CI-RECHERCHE]] — tickets, PR, tags, releases et dernières CI.
- [[10-UPSTREAM-GODS-EYE-VIEW-COMPARAISON]] — comparaison détaillée du `main` upstream et Watchtower.
- [[10B-UPSTREAM-BRANCHES-01-10]], [[10C-UPSTREAM-BRANCHES-11-20]], [[10D-UPSTREAM-BRANCHES-21-30]], [[10E-UPSTREAM-BRANCHES-31-40]], [[10F-UPSTREAM-BRANCHES-41-49]].
- [[11-MATRICE-CONVERGENCE-TERRITOIRE-2D]] — vrais écarts entre les deux branches de code les plus divergentes.
- [ROADMAP](../../ROADMAP.md), [REPRISE](../REPRISE.md), [DIAGNOSTIC](../DIAGNOSTIC.md), [AUDIT](../AUDIT.md), [AGENTS](../../AGENTS.md).

> [!tip] Import Obsidian
> Pour que tous les wikilinks internes d'Obsidian fonctionnent, **conserver ensemble les fichiers Markdown du dossier `docs/agent-memory/`** dans un même coffre Obsidian (ou préserver leur arborescence). Les liens GitHub absolus restent utilisables si l'on n'importe que ce document.

## 11. Format de mémoire machine pour un agent

Toute assertion produite à l'avenir doit comporter **l'identité de la source et la preuve**, pas seulement une phrase dans un README.

```yaml
id: wt.capability.0001
claim: "Carte 2D MapLibre implémentée dans une branche"
claim_type: source_code_observation
repository: Sathancabrol/watchtower
ref: arena/01a072e1-watchtower
commit_sha: be0cceff24d6f1d63df882d74623c4fdf49994de
file: src/carte2dControleur.js
observed_at: "2026-11-22"
runtime_status: not_tested_on_user_device
environment: github_source_read
dependencies:
  - MapLibre
  - Cesium
evidence:
  - https://github.com/Sathancabrol/watchtower/blob/arena/01a072e1-watchtower/src/carte2dControleur.js
contradictions: []
owner: watchtower
decision: preserve_and_evaluate
next_action: run_2d_3d_smoke_with_graphics_metrics
```

Conventions obligatoires : `CODE_OBSERVE` ≠ `DOC_HISTORIQUE` ≠ `TEST_CI` ≠ `TEST_LOCAL` ≠ `DEPLOYE` ; `source_at`, `observed_at`, `retrieved_at` et `valid_from/to` restent distincts. Les simulacres de données, y compris la démo OSINT, restent marqués `MOCK`.

## 12. Priorités de convergence et protocole de reprise

1. **P0 – Sauvegarder la version réelle du disque externe** en lecture seule : `git remote -v`, `git status --porcelain=v1`, `git branch -avv`, `git rev-parse HEAD`, emplacement et inventaire de tous les fichiers non suivis (sans divulgation). La copie locale peut être supérieure aux versions GitHub.
2. **P0 – Identifier l'unique implémentation canonique** des cartes et contrats. Conserver `watchtower/main` comme dépôt source pour l'app, mais **ne pas déclarer** la branche `main` comme version fonctionnelle la plus riche.
3. **P0 – Reproduire la CI rouge** `ign-ortho` et corriger les deux mappings dans un changement isolé avec tests.
4. **P0 – Protéger la couche CSV** via le correctif #5, puis rapprocher branches T/2D avec la [matrice des sept chemins techniques divergents](11-MATRICE-CONVERGENCE-TERRITOIRE-2D.md).
5. **P1 – Contrat `Place/Project/Evidence/Time/Geometry`** vers Carré d’As et OSINT Workbench, versionner schéma, refuser un fait sans source et marquer les hypothèses.
6. **P1 – Adapter Cesium à `carredas/modules/watchtower`** par commande typée et événements, sans montage WebGL simultané dangereux.
7. **P1 – Préparer Olympus Studio SPATIAL et X-Ray Mirror** avec états de capacité sincères et latence/performance testées sur les appareils.
8. **P2 – Revisiter l'upstream** par besoin (mobilité, rendu, sources, scène, voix), pas en remplaçant le fork complet.
9. **P2 – Enrichir la mémoire d'agents** : chaque commit/PR/test porte un `source_url`, une date, un résultat exact et un prochain point de vérification.

**Conditions d'arrêt de ce scan documentaire** : tous les noms de branches du périmètre sont recensés, leurs arbres comparés, l'historique des dépôts du compte paginé, les PR/CI et documents canoniques repérés, les intégrations ambiguës explicitement marquées, les résultats enregistrés en Markdown/JSON sur GitHub. **Les conditions d'arrêt d'un audit runtime sont différentes** et nécessitent les vrais appareils.

---

## 13. Journal et règle de mise à jour

| Date | Révision | Fait | Reste |
|---|---|---|---|
| 2026-11-22 | v1.0–1.2 | Mindmap, hub, inventaire et diagnostics GitHub | Audit plus large |
| 2026-11-22 | v2.0 | 84 branches du compte, 49 upstream, histoires de commits paginées, nouveaux modules Carré d’As/OSINT/OLYMPUS/XR, comparaison T/2D, PR/CI | Réalité du disque externe et tests de composants |

**Règle :** ne jamais supprimer les preuves historiques lors d'une actualisation. Mettre à jour les **instantanés datés**, l'index de fichiers et l'assertion correspondante après constat de nouvelles empreintes SHA ; ne pas remplacer l'historique d'une branche par l'annonce d'un agent.

**Fin de l'audit documentaire GitHub — 22 novembre 2026.**
