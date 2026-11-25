# Audit 33 — Orchestration, checkpoints et retrieval

Date : 2026-11-25. Statut : CODE_OBSERVE + contrôle textuel automatisé JavaScript ; Python intégré et tour NON TESTÉS.

Navigation : [[01-HUB-SUIVI-AGENTS]] · [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[31-RESEARCH-ENGINE-CONTRATS-TRANSITIONS-2026-11-24]] · [[32-RESEARCH-ENGINE-VALIDATION-SUFFISANCE-2026-11-25]].

## Provenance

- [engine/orchestrator.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/orchestrator.py) — Sathancabrol/reaserch-engine, main, blob `a8f5c32675cc34d4ff4aa3919d26180507a8ec57`
- [engine/state_machine.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/state_machine.py) — Sathancabrol/reaserch-engine, main, blob `0c3975a4eabd1c138f3c7667e01ab9ceea6625da`
- [engine/persistence.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/persistence.py) — Sathancabrol/reaserch-engine, main, blob `9484f2bc01b0c21a842d4cbcf8d42aee0e2cad29`
- [engine/retrieval.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/retrieval.py) — Sathancabrol/reaserch-engine, main, blob `82af2f4ee6b1aef5748745864debc52cfe483b44`

## Arborescence fonctionnelle

- Orchestrator.run(ResearchRun) -> ResearchRun : agents injectés dict -> dict, contexte partagé, EvidenceGraph, historique, store facultatif. Dépendances state_machine, sufficiency, evidence_graph, dossier. Deux appels de transition vers RESEARCHING : début de boucle et après décision continue. Le deuxième tour tente donc une auto-transition ; défaut statique, à reproduire avec agents injectés. Le plafond while existe, mais ne suffit pas à éviter cette exception. Le passage BLOCKED est une affectation directe, hors transition(). Une reprise appelle PLANNING sans tenir compte du checkpoint intermédiaire. _run_agent fusionne le résultat dans context, ajoute historique puis sauvegarde ; une exception agent n'est pas interceptée ici.
- JsonRunStore.save(run) -> Path : révision incrémentée avant sérialisation, fichier temporaire puis replace. load(run_id) -> ResearchRun : JSON local, restauration EvidenceGraph et enum. Pas de comparaison de révision avant écriture ; risque de perte de mise à jour concurrente, non reproduit. Échec de sérialisation : révision mémoire potentiellement avancée ; tester objet non JSON et nettoyage temporaire.
- SearchRequest : query, subquestion_id, source_types, max_results, recency_days. InMemoryRetriever.search -> liste SearchResult : score par présence de termes dans titre/snippet. LocalFirstRetriever.search : externe seulement si résultat local vide, pas si exception locale. CrossrefRetriever.search : HTTP injecté ou urllib timeout 15 s, query/rows/mailto, DOI obligatoire, auteurs et date en metadata ; journal-article classé primary_study sans examen du contenu. source_types et recency_days déclarés mais non consommés dans ce fichier. Sources : corpus injecté et Crossref ; aucun réseau interrogé.

## Preuve du contrôle exécuté

Extraction textuelle sur les quatre fichiers GitHub (JavaScript, pas Python) :

```json
{
  "loopResearch": 2,
  "loopGuard": true,
  "blockedDirect": true,
  "resumePlanning": true,
  "checkpointAfterAgent": true,
  "revisionBeforeWrite": true,
  "fallbackNoCatch": true,
  "recencyUses": 1,
  "sourceTypesUses": 1
}
```

## Tests prioritaires (non exécutés)

1. Agents synthétiques : sufficiency continue puis stop, max_iterations=2 ; relever état, historique et exception.
2. Store temporaire : reprise depuis chaque état, deux écrivains sur même run_id, échec JSON, révision et checkpoint.
3. Retriever local levant une exception, externe injecté ; vérifier appel de secours. Tester filtres de date/type et classification Crossref avec fixture.
4. Distinguer arrêt opérationnel et suffisance ; ne pas déclarer intégration CRONOS/Hermes validée.

Aucun code applicatif modifié.