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

- [Dépôt Watchtower](https://github.com/Sathancabrol/watchtower) · [Branches](https://github.com/Sathancabrol/watchtower/branches)
- [Roadmap](../../ROADMAP.md) · [Reprise](../REPRISE.md) · [Audit](../AUDIT.md) · [Mindmap](00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP.md)

_Initialisé le 22/11/2026 à partir de la documentation GitHub ; **aucun test du runtime Windows ni opération d'installation**._
