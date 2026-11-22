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

> [!important] Point d'entrée, **pas une seconde roadmap**
> Ce document est le **routeur documentaire** d'Obsidian et des agents IA. Le suivi produit reste dans [`ROADMAP.md`](../../ROADMAP.md) ; la sauvegarde historique de session dans [`docs/REPRISE.md`](../REPRISE.md). Ne jamais copier ici un statut sans le dater, lui associer une source et préciser s'il s'agit d'un test réellement rejoué.

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
