# 35 — Checkpoints : contrat de reprise et concurrence
Date : 2026-11-25. Statut CODE_OBSERVE ; contrôles textuels automatisés exécutés, Python non exécuté.
Navigation : [[01-HUB-SUIVI-AGENTS]] · [[33-RESEARCH-ENGINE-ORCHESTRATION-CHECKPOINT-RETRIEVAL-2026-11-25]] · [[34-RESEARCH-ENGINE-RETRIEVAL-TESTS-2026-11-25]].

## Provenance
Sathancabrol/reaserch-engine, main, [engine/persistence.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/persistence.py), blob 9484f2bc01b0c21a842d4cbcf8d42aee0e2cad29. Hub relu : 00882d711d11371734bece892f1f1c52967d7c76 ; dernier commit Watchtower retrouvé : 877f661345cab3f9c2e4ce302b41a9ac32c785f4.

## Contrat de non-régression à transmettre aux agents
- JsonRunStore._path(run_id) : identifiant non vide et basename égal à l'entrée ; validation après incrément de revision dans save.
- save(run) -> Path : état, question, iteration, revision, context, history ; dépendances pathlib, tempfile, json, EvidenceGraph. Données locales uniquement.
- load(run_id) -> ResearchRun : reconstruction depuis JSON, revision par défaut 0 ; dépendances orchestrator et ResearchState.
- _json_value / _restore_value : conversion récursive, marqueur EvidenceGraph ; tuple devient liste.

| Fixture synthétique à exécuter | Oracle cible (non implémenté ici) |
|---|---|
| run_id invalide | revision inchangée, aucun fichier |
| context contenant object() | ancien checkpoint intact, revision inchangée, aucun temporaire résiduel |
| Path.replace levant OSError | ancien checkpoint intact, nettoyage du temporaire |
| Deux lecteurs de revision N, sauvegardes successives | deuxième écriture rejetée ou fusion explicite ; pas de perte silencieuse |
| context contenant {"__type__":"EvidenceGraph"} | donnée ordinaire préservée ou rejet explicite à la sauvegarde |
| tuple dans context | politique de normalisation documentée et testée |

## Contrôles réellement exécutés
Sur le contenu récupéré par connecteur GitHub, JavaScript : sept assertions textuelles vraies : incrément avant validation du chemin ; ouverture temporaire avant dump ; replace après dump ; absence de finally/unlink ; accès direct à snapshot pour marqueur ; conversion tuple/liste ; absence de json.load dans save. Ces contrôles ne prouvent pas le comportement Python ni la concurrence réelle.

## Décision cible
Révision durable et contrôle CAS sous verrou interprocessus ; nettoyage en finally ; version de schéma et marqueur réservé ; reprise idempotente. Un remplacement atomique seul ne garantit pas la prévention des pertes de mise à jour ni la durabilité après panne électrique. Ne pas fusionner sans tests. Prochain lot : exécuter les six fixtures sur sources authentifiées et vérifier l'orchestrateur sur deux cycles. Aucun code applicatif modifié.
