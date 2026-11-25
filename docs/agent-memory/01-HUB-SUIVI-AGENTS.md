---
title: "WATCHTOWER — Hub de suivi et mémoire externe des agents"
aliases: ["Watchtower — suivi agents", "Carré d'As — hub de reprise"]
created: 2026-11-22
updated: 2026-11-22
document_type: agent-handoff-index
status: documentary_snapshot
repo: Sathancabrol/watchtower
source_branch: main
privacy: public-no-personal-data
tags: [watchtower, suivi, reprise, agents-ia, cognitorium, obsidian]
---

# WATCHTOWER — HUB DE SUIVI ET DE REPRISE POUR AGENTS

> [!important] Routeur HTTP, collisions et dispatch — 24/11/2026
> [[19-CARREDAS-ROUTER-DISPATCH-SECURITE-2026-11-24]] : lecture statique de `httpsrv.py`, `server.py` et du chargeur de modules ; garde fail-open, ordre des routes, HEAD/OPTIONS, limites de corps, CORS et plan de tests. **Aucun runtime testé.**


> [!important] Manifeste de modules et routes Carré d'As — 24/11/2026
> [[18-CARREDAS-MANIFESTES-ROUTES-CHARGEMENT-2026-11-24]] : inspection de 11 fichiers Git sur `monorepo/arena/0034230e-monorepo` ; contrat `discover → load → register → canonique`, divergences de chemins Meeting (`generate` / `generer`), routes sous-documentées, configuration `modules.desactives` non consultée par le chargeur inspecté. **Audit statique uniquement.**


> [!warning] Configuration, plugins et mises à jour — 23/11/2026
> [[17-CARREDAS-CONFIG-MODULES-UPDATER-2026-11-23]] : audit statique de `paths.py`, `modules/__init__.py`, `updater.py` et du câblage HTTP. Risques à vérifier : token vide par défaut, mise à jour malgré sauvegarde échouée, configuration sans validation, plugin de confiance et clé `profil` dupliquée. **Pas de runtime testé.**


> [!warning] Câblage réel de la garde et routes fichiers (23/11/2026)
> [[16-CARREDAS-CABLAGE-ACCES-FICHIERS-2026-11-23]] : `router.garde` est bien installée dans `carredas/server.py` sur la branche Arena ; politique token local/distant, routes de fichiers, exposition potentielle de configuration, sauvegarde excluant les blobs. **Lecture statique, runtime et exposition réseau non testés.**


> [!warning] Audit de sécurité et persistance OSINT (23/11/2026)
> [[15-OSINT-STORE-HTTP-REGISTRES-AUDIT-2026-11-23]] : analyse statique de `store.py`, `httpsrv.py`, `registries.py`, `router.py` dans `monorepo/arena/0034230e-monorepo` ; garde HTTP potentiellement fail-open, validation des chemins/IDs, limites HTTP et journal de preuves à vérifier avant exposition réseau. **Aucun exploit ni runtime confirmé.**


> [!important] Navigation à profondeur non limitée
> Nouvelle arborescence détaillée : [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]] ([fichier GitHub](12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX.md)). Lire l'index pour traverser les domaines et sous-domaines, puis ouvrir les preuves précises et consulter la branche correspondante.


> [!important] Point d'entrée, **pas une seconde roadmap**
> Ce document est le **routeur documentaire** d'Obsidian et des agents IA. Le suivi produit reste dans [`ROADMAP.md`](../../ROADMAP.md) ; la sauvegarde historique de session dans [`docs/REPRISE.md`](../REPRISE.md). Ne jamais copier ici un statut sans le dater, lui associer une source et préciser s'il s'agit d'un test réellement rejoué.


> [!note] Audit OSINT au niveau des fonctions — 23/11/2026
> [[13-OSINT-WORKBENCH-AUDIT-CODE-2026-11-23]] : lecture de quatre fichiers JS et deux spécifications de la branche `COGNITORIUM/watchtower/osint-workbench-v0.1` ; inventaire des contrats, limites de preuve et risques de rendu HTML. Aucun runtime exécuté.


> [!note] Convergence OSINT / Carré d'As / INTEL — 23/11/2026
> [[14-CONVERGENCE-OSINT-CANONICAL-INTEL-2026-11-23]] : comparaison champ par champ des trois contrats, six blobs Git relus, risques de promotion abusive en `fact`, projection canonique sans perte et invariants de tests. Aucun runtime exécuté.

## L'audit maître GitHub — v2 du 22 novembre 2026

**Le nouveau point d'entrée global** est [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]] — [ouvrir le document maître sur GitHub](08-WATCHTOWER-AUDIT-MAITRE-2026-11-22.md). Il rassemble les conclusions, les modules, les preuves et les 29+ annexes techniques, sans remplacer `ROADMAP.md` ni la sauvegarde de session `REPRISE.md`.

| Question de l'agent | Lecture immédiate |
|---|---|
| Quel état de code existe dans tous les dépôts et toutes les branches ? | [Audit maître](08-WATCHTOWER-AUDIT-MAITRE-2026-11-22.md) → annexes 05A–D et 06A–D ; 84 branches, neuf dépôts |
| Quel commit a fait quoi ? | [07A](07A-WATCHTOWER-TOUS-COMMITS.md) puis 07B–07I : **1 389 références SHA distinctes** dans les annexes des dépôts personnels |
| Qu'est-ce qui a changé dans God's Eye View ? | [10](10-UPSTREAM-GODS-EYE-VIEW-COMPARAISON.md) et [10B–10F](10B-UPSTREAM-BRANCHES-01-10.md) : 49 pointes upstream et différences de fichiers |
| Quelles versions doivent être rapprochées ? | [11 — matrice T vs 2D](11-MATRICE-CONVERGENCE-TERRITOIRE-2D.md) : neuf chemins divergents, sept en code/config/tests |
| Quel code Carré d'As pointe réellement vers Watchtower ? | [Master §4](08-WATCHTOWER-AUDIT-MAITRE-2026-11-22.md#4-carré-das--deux-dépôts-apparents-deux-implémentations) : `carredas/modules/watchtower` sur branche Arena, **viewer 3D pas encore raccordé** |
| Quelle part d'OLYMPUS/X-Ray/CRONOS est réellement reliée ? | [Master §6](08-WATCHTOWER-AUDIT-MAITRE-2026-11-22.md#6-olympus-studio-xr-laplace-hermes-et-cronos-fleet) : inspecter `integration-registry.js` ; « not-integrated » ≠ fonction active |
| Quelle erreur CI est prouvée ? | [04](04-VALIDATION-CI-REPRISE.md), logs GitHub 22/11 : `ign-ortho` deux mappings absents |
| Comment intégrer dans Obsidian ? | Importer **tout `docs/agent-memory/*.md` ensemble**, puis ouvrir la [[00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP]] et le master |

> [!warning] Conditions d'arrêt
> Audit des **références GitHub** clos au snapshot du 22/11. **Non clos :** disque externe, worktrees non committés, API live, exécution Windows/Android, performance GPU et tests d'appareils. Aucune fusion ni changement de code n'a été effectué par cet audit documentaire.

## Inventaire multi-branches et vérifications — 22/11/2026

**Documentation ajoutée par passes successives, à lire sans recopier les catalogues :**

| Référence | Quand l'utiliser |
|---|---|
| [Inventaire complet des 1 131 chemins GitHub](02-INVENTAIRE-GITHUB-COMPLET.md) | Rechercher un fichier, voir ses branches et si son contenu diverge de `main` |
| [Index JSON des versions (SHA + taille)](WATCHTOWER-FILE-INDEX.json) | Traitement programmatique, déduplication et recherche exacte par agent |
| [Carte des capacités et de l'architecture](03-CAPACITES-ARCHITECTURE-DIVERGENCES.md) | Comprendre les modules, les variantes territoriales, la 2D, le moteur IA, la convergence |
| [Tests CI, PR, validation et reprise](04-VALIDATION-CI-REPRISE.md) | Voir les résultats GitHub **réels**, les dépendances de fusion et la prochaine vérification |
| [Handoff historique sur branche PR #4](https://github.com/Sathancabrol/watchtower/blob/chore/agent-handoff-2026-10-11/AGENT_HANDOFF.md) | Conserver le protocole de journal de session historique, non fusionné à `main` |

**Constats non négociables pour l'agent :** 11 noms de branches ; les deux familles de développements `T` (INTEL/CSV) et `2D` (MapLibre/territoire) ne sont pas fusionnées ; **quatre PR ouvertes** (#3, #4, #5, #6) ; CI du 22/11 : Windows onboarding réussi, **3 144 tests dont 2 en échec** sur Node 24/26 ; copie Monorepo ayant 416 fichiers de build `dist`, non 416 nouveaux modules métier.

**Aucun changement de code ni de runtime n'a accompagné la constitution de cette mémoire.** Les résultats de tests viennent de GitHub Actions et sont attachés à leur workflow ; les données de CRONOS, du disque externe ou d'un agent sur smartphone doivent être vérifiées séparément.

## Lire selon la mission

| Mission | Ouvrir en priorité | Précaution |
|---|---|---|
| État des travaux Watchtower | [ROADMAP](../../ROADMAP.md) → [REPRISE](../REPRISE.md) → [AUDIT](../AUDIT.md) | Leur photographie historique peut différer de la tour et des branches |
| Vision transversale, architecture, mémoire | [Mindmap Watchtower / Cognitorium / Carré d'As](00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP.md) | Les objectifs proposés ne sont pas des fonctions exécutées |
| Bug interface, module disparu | [DIAGNOSTIC](../DIAGNOSTIC.md) → [KNOWN-ISSUES](../KNOWN-ISSUES.md) | Capturer F3, traces et tests avant de modifier |
| Intégration d'un outil | [Registre d'outils](../../audit/REFERENCE.md) → [AGENTS](../../AGENTS.md) | `AGENTS.md` et registre générés : modifier le générateur, jamais leurs sorties à la main |
| Travail au sein du Carré d'As | [Monorepo](https://github.com/Sathancabrol/monorepo) → [Cognitorium](https://github.com/Sathancabrol/COGNITORIUM) | Identifier le propriétaire canonique et éviter les copies divergentes |
| Ajout d'une preuve humaine/scientifique | [HCSM](https://github.com/Sathancabrol/HCSM) → [Research Engine](https://github.com/Sathancabrol/reaserch-engine) | Séparer mesure, observation, hypothèse et simulation |

## Dernier état **documentaire**, non runtime — 22/11/2026

- `watchtower/main` : `ROADMAP.md` décrit les **itérations 1–21**. `docs/REPRISE.md` sauvegarde une session issue de `arena/01a06ebe-watchtower`, avec ses tests **historiquement annoncés** et tâches ouvertes.
- `docs/AUDIT.md` : bilan historique des itérations 1–20.
- **Reste à vérifier avant modification** : INTEL expert, Bloomberg de la ville, analyse territoriale, commutation 2D/3D, régressions fenêtre WATCHTOWER/HQ, divergence entre `main`, branches et copie du disque externe.
- **Travail Hermes 13/11** : annonce d'un lot TERRITOIRE / DOSSIER / import POI `124/124`. Ne pas marquer `main` comme à jour sans preuves de commit, tests et version du runtime.
- `docs/CURRENT-STATE.md` traite principalement du **socle God's Eye View** (août 2026). Ne pas le substituer au suivi spécifique Watchtower.

## Contrat de mise à jour de mémoire

1. **Au début** : lire la demande, les fichiers de suivi ci-dessus et la branche réellement ouverte ; collecter `repo/ref/SHA`, état de travail, permissions et tests disponibles.
2. **Pendant** : distinguer `CODE-TROUVÉ`, `DOC`, `TEST-HISTORIQUE`, `TEST-AUJOURD'HUI`, `ACTIF-MAINTENANT`, `PRÉVU` et `BLOQUÉ`. L'absence de test est `inconnu`, jamais `OK`.
3. **Après** : mettre à jour d'abord le suivi canonique `ROADMAP.md` **seulement en cas de vraie itération**, puis `REPRISE.md` si une nouvelle session a effectivement été testée/sauvegardée, puis la mindmap si l'architecture ou les états changent.
4. **Contradictions** : conserver les deux versions et leurs refs ; résoudre par preuve, pas par écrasement.
5. **Vie privée** : ne jamais committer clés, jetons, adresses exactes, conversations personnelles brutes, captures de capteurs, données individuelles, patients ou fichiers de diagnostic privé.
6. **Hors portée** : ce hub ne change aucun runtime, ne déploie pas de service et ne valide aucune capacité à lui seul.

## Gabarit d'un événement vérifiable

```yaml
id: "à renseigner"
timestamp: null
repository: "Sathancabrol/watchtower"
branch: null
commit_before: null
commit_after: null
module: null
request: null
status: "unknown"
evidence:
  - source: null
    test_command: null
    test_result: null
modified_files: []
decisions: []
open_questions: []
next_action: null
```

## Liens de contrôle

- [Inventaire](02-INVENTAIRE-GITHUB-COMPLET.md) · [Index JSON](WATCHTOWER-FILE-INDEX.json) · [Capacités](03-CAPACITES-ARCHITECTURE-DIVERGENCES.md) · [CI et reprise](04-VALIDATION-CI-REPRISE.md)
- [Dépôt Watchtower](https://github.com/Sathancabrol/watchtower) · [Branches](https://github.com/Sathancabrol/watchtower/branches)
- [Roadmap](../../ROADMAP.md) · [Reprise](../REPRISE.md) · [Audit](../AUDIT.md) · [Mindmap](00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP.md)

_Initialisé le 22/11/2026 à partir de la documentation GitHub ; **aucun test du runtime Windows ni opération d'installation**._

- [[20-CARREDAS-INVENTAIRE-ROUTES-COLLISIONS-2026-11-24]] — inventaire statique de 79 décorateurs HTTP et 1 chevauchement(s) de segments, périmètre cœur + quatre plugins (24/11/2026).

## Index consolidé des audits techniques — 24/11/2026

Inventaire vérifié par lecture GitHub de `main` ; les empreintes ci-dessous identifient les notes (blobs), non les commits des sources applicatives. Les tests proposés ou retrouvés ne sont pas réputés exécutés. Le numéro 21 est absent du répertoire inspecté ; aucune conclusion sur son historique.

| Domaine | Note Obsidian | SHA blob de la note |
|---|---|---|
| OSINT / convergence | [[13-OSINT-WORKBENCH-AUDIT-CODE-2026-11-23]] | `1b4d241034cc477354d3b11e99e8c6900e53aaca` |
| OSINT / convergence | [[14-CONVERGENCE-OSINT-CANONICAL-INTEL-2026-11-23]] | `10f4f5e51e35881ade2bf08884526ce6155345ac` |
| OSINT / convergence | [[15-OSINT-STORE-HTTP-REGISTRES-AUDIT-2026-11-23]] | `5279ac6fd143dd1137e6a5aa418862cfbd640a22` |
| Carré d’As / HTTP | [[16-CARREDAS-CABLAGE-ACCES-FICHIERS-2026-11-23]] | `e97ba53652c791a3379a7e9820850b42ba47b8e1` |
| Carré d’As / HTTP | [[17-CARREDAS-CONFIG-MODULES-UPDATER-2026-11-23]] | `6b0699fe71b9707b2a030068d03bd9b167cebe7e` |
| Carré d’As / HTTP | [[18-CARREDAS-MANIFESTES-ROUTES-CHARGEMENT-2026-11-24]] | `b7bc36d816341ead4b59a56344575cf099abea88` |
| Carré d’As / HTTP | [[19-CARREDAS-ROUTER-DISPATCH-SECURITE-2026-11-24]] | `b6a038b8cf14a49964ef0d3f98633a5c31a8b040` |
| Carré d’As / HTTP | [[20-CARREDAS-INVENTAIRE-ROUTES-COLLISIONS-2026-11-24]] | `4f66c4f1aeb765ec9ff3ac92be735ef8ea6f7794` |
| OLYMPUS | [[22-OLYMPUS-CONTRATS-API-DIVERGENCES-2026-11-24]] | `99f19ca041dad443d595baf47984fc6818518265` |
| OLYMPUS | [[23-OLYMPUS-CLIENT-CAMERA-CONVERGENCE-2026-11-24]] | `dbe889b285637b14aa9707742a4044591823ccbe` |
| OLYMPUS | [[24-OLYMPUS-RELAIS-CAMERA-TESTS-2026-11-24]] | `e176677de6e358931cc65878dee5c94e5540171e` |

Reprise : [[24-OLYMPUS-RELAIS-CAMERA-TESTS-2026-11-24]] → déploiement Fleet, concurrence et intégration X-Ray/CRONOS ; [[20-CARREDAS-INVENTAIRE-ROUTES-COLLISIONS-2026-11-24]] → plugins restants et lanceurs. Ne pas confondre ces audits statiques avec une recette locale.

## Extension scientifique et continuité — 2026-11-24

| Domaine | Note Obsidian | SHA blob vérifié |
|---|---|---|
| Hermes | [[25-HERMES-CONTINUITE-DIAGNOSTIC-2026-11-24]] | `d5efb810103d70650ff1d9eddfdff95a1c831bce` |
| Research Engine | [[26-RESEARCH-ENGINE-HERMES-CONTRATS-2026-11-24]] | `dfe501a3dfa67f2d2b1b5550db831118f0031380` |
| Research Engine | [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] | `74db83d6732bd7da4cd0319660b0bd0c2fa27f5a` |
| Research Engine | [[28-RESEARCH-ENGINE-EVIDENCE-GRAPH-DOSSIER-2026-11-24]] | `b655283ddb94157bca4d0052af2f8726b611b6ee` |
| Research Engine | [[29-RESEARCH-ENGINE-AGENTS-DECISIONS-2026-11-24]] | `bc4abb970e1a4c2fd6b5549a6f923b22656a0907` |

Reprise prioritaire : machine à états et suffisance (27), provenance et projection (28), rétroaction des agents (29), puis recherche du routeur CRONOS. Les constats sont statiques ; aucun test Python ou PowerShell exécuté dans ces audits. Voir [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]] et [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]].

## Validation expérimentale et index complémentaire — 2026-11-25

- [[30-RESEARCH-ENGINE-PLANIFICATION-QUALITE-2026-11-24]] — blob `6ba90d5c6c783f671710fb9027051e9102fea9b2`, reproduction pytest documentée dans la note.
- [[31-RESEARCH-ENGINE-CONTRATS-TRANSITIONS-2026-11-24]] — blob `3598c93ce6d9218ffbe12f6b2a04767e63e8fd58`, contrôle structurel des contrats.

### Machine à états : exécution Python isolée
Source : [reaserch-engine/main/engine/state_machine.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/state_machine.py), blob `0c3975a4eabd1c138f3c7667e01ab9ceea6625da`. Fichier reproduit localement et identité vérifiée par git hash-object avant exécution. Dépendance : enum standard. Interface transition(current: ResearchState, target: ResearchState) -> ResearchState ou ValueError. Aucune donnée externe.

Contrôle exécuté : double boucle Python sur les neuf valeurs de ResearchState, appel transition(a,b), assertion du retour b, capture ValueError. 81 couples exercés : 19 acceptés, 62 rejetés ; aucune auto-transition ; seules created et blocked permettent planning. blocked -> completed accepté. researching -> researching lève ValueError: Illegal research transition: researching -> researching. Code de sortie du script : 0. Il s'agit d'un inventaire comportemental, pas de 81 assertions métier indépendantes.

Statut TEST_LOCAL_SANDBOX : fonction pure exécutée, pas le pipeline ni la tour. Le passage blocked -> completed exige une distinction explicite entre clôture opérationnelle et suffisance scientifique dans le consommateur. Prochain lot : orchestrateur avec agents injectés, validation JSON Schema des huit décisions et reprise persistante. Aucun code applicatif modifié.
