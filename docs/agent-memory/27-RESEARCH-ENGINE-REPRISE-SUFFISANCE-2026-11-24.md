# 27 — Research Engine : reprise, suffisance et retrieval

Date : 2026-11-24. Audit statique, sans exécution Python ni accès aux services locaux.
Liens : [[26-RESEARCH-ENGINE-HERMES-CONTRATS-2026-11-24]] · [[25-HERMES-CONTINUITE-DIAGNOSTIC-2026-11-24]] · [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]] · [[01-HUB-SUIVI-AGENTS]].

## Provenance
Dépôt Sathancabrol/monorepo, ref main, sous-arbre projects/reaserch-engine/. SHA ci-dessous = blobs, pas commits.
- [engine/state_machine.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/state_machine.py) — `0c3975a4eabd1c138f3c7667e01ab9ceea6625da`
- [engine/orchestrator.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/orchestrator.py) — `a8f5c32675cc34d4ff4aa3919d26180507a8ec57`
- [engine/sufficiency.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/sufficiency.py) — `d5a771e9eae81640a56a75cb4783dc7ca6d4f667`
- [engine/persistence.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/persistence.py) — `9484f2bc01b0c21a842d4cbcf8d42aee0e2cad29`
- [engine/retrieval.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/retrieval.py) — `82af2f4ee6b1aef5748745864debc52cfe483b44`
- [schemas/sufficiency-decision.schema.json](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/schemas/sufficiency-decision.schema.json) — `28d1f9f9d11de331fca29cb4bd221d8bfc956094`
- [tests/test_engine.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_engine.py) — `b9af10f875feff8c1b12b1d88e968c7ab13d694a`
- [tests/test_persistence.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_persistence.py) — `324a130e3a49c71b456205af3783297071e6c768`
- [tests/test_retrieval.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_retrieval.py) — `4871137b3bcadd601956d3d2191caaf6a7f072b8`
- [tests/test_academic_retrieval.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_academic_retrieval.py) — `1f7030edf2c07bdf500d300b47d64671122562d8`

## Arborescence fonctionnelle et contrats
- state_machine.py → ResearchState (9 états), transition(current,target) → état ou ValueError. CREATED et BLOCKED seuls autorisent PLANNING ; COMPLETED/FAILED terminaux.
- orchestrator.py → ResearchRun (id, question, état, itération, révision, contexte, historique) ; run → dossier et checkpoint. _run_agent injecte les résultats dans le contexte puis sauvegarde.
- persistence.py → JsonRunStore(directory), _path(run_id), save(run) → Path, load(run_id) → ResearchRun ; _json_value/_restore_value sérialisent EvidenceGraph, enums, dataclasses, collections. JSON local, tempfile puis replace, dépendances standard + graphe.
- sufficiency.py → SufficiencyInput (12 champs), assess(x) → décision, raison, focus. Priorité vérification, lacunes, contradictions, couverture, budget itérations, saturation, gain marginal.
- retrieval.py → SearchRequest(query, subquestion_id, source_types, max_results, recency_days), SearchResult(id,title,url,snippet,source_type,metadata), Retriever.search → liste. InMemoryRetriever score lexical ; LocalFirstRetriever délègue seulement si liste vide ; CrossrefRetriever interroge https://api.crossref.org/works avec timeout 15 s, DOI normalisé, métadonnées auteurs/date, http_get injectable.

## Constats et tests de non-régression proposés
1. P1 — reprise : run force PLANNING après checkpoint. Un checkpoint PLANNING/RESEARCHING/SYNTHESIZING/VERIFYING ne peut pas reprendre par cette entrée. De plus, après next_action, état RESEARCHING puis transition RESEARCHING→RESEARCHING interdite au tour suivant. Tester deux itérations, reprise à chaque état, idempotence.
2. P1 — suffisance : une entrée vide produit stop/low_marginal_information_gain ; aucune preuve minimale obligatoire. max_iterations_reached peut produire stop alors que couverture incomplète ; distinguer arrêt budgétaire et conclusion scientifique.
3. P1 — contrat JSON : contrôle structurel JS exécuté sur les 8 retours littéraux de assess : 8/8 omettent les champs requis reasons, critical_gaps, next_actions. Le schéma et le runtime divergent ; aucune validation JSON Schema complète exécutée.
4. P1 — persistance : révision incrémentée avant validation/écriture ; pas de verrou ni contrôle de révision concurrente ; tempfile potentiellement résiduel si sérialisation échoue ; load ne vérifie pas la correspondance id demandé/id payload. Tester échec disque, JSON corrompu, concurrence et reprise.
5. P1 — retrieval : source_types et recency_days ignorés dans les implémentations inspectées ; LocalFirst ne complète pas un résultat local insuffisant et ne récupère pas les exceptions locales. Tester filtres, couverture et panne.
6. P1 — Crossref : journal-article classé primary_study sans distinguer revue, éditorial ou étude empirique ; métadonnées ne constituent pas une preuve du contenu. Tester typage documentaire et corroboration.
7. P2 — Crossref : pas de retry/backoff, pas de pagination ni déduplication explicite ; max_results non validé ; tester 429, payload invalide, DOI dupliqués et limites.

## Tests existants
7 fonctions test_ recensées dans quatre fichiers : deux tests orchestration (succès et budget 1), deux persistance (round-trip graphe et checkpoint final), un lexical, deux Crossref simulé/local-first. Aucun ne démontre la reprise intermédiaire ou deux cycles successifs. Tests non exécutés.

## Décision cible
Conserver Research Engine comme propriétaire de la suffisance scientifique, Hermes comme exécuteur, CRONOS comme routeur. Checkpoints versionnés avec état et étape, résultat d'exécution idempotent, séparation arrêt budget/suffisance, contrat JSON unique. Aucun raccordement runtime démontré. Prochain lot : EvidenceGraph, dossier, pipeline et provenance des assertions ; recherche branches CRONOS.
