# Research Engine / Hermes — audit 26 (2026-11-24)

Liens : [[25-HERMES-CONTINUITE-DIAGNOSTIC-2026-11-24]] · [[01-HUB-SUIVI-AGENTS]] · [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]] · [[00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP]].

## Provenance
Sathancabrol/monorepo, main, arbre Git a18938d4f309c3de753c3cbe587ad06a111ecbea (non tronqué). Racine exacte : projects/reaserch-engine (orthographe du dépôt). [Arbre](https://github.com/Sathancabrol/monorepo/tree/main/projects/reaserch-engine). Empreintes ci-dessous = blobs, pas commits.

| Fichier | Blob SHA | Statut |
|---|---|---|
| docs/ARCHITECTURE_HERMES_INTEGRATION.md | db7bd46fe7619eb193bce2c8cb8ebb9bb2a36cdd | cible documentaire |
| engine/providers.py | c61f643009ea02074cb1b33301379e28a2b64653 | code lu |
| engine/default_pipeline.py | 50ab3ea8bb8b0db91d44d5d635de1452d5c89c93 | code lu |
| engine/orchestrator.py | a8f5c32675cc34d4ff4aa3919d26180507a8ec57 | code lu |
| tests/test_engine.py | b9af10f875feff8c1b12b1d88e968c7ab13d694a | tests lus, non exécutés |

## Arborescence fonctionnelle
- Research Engine → engine/providers.py → RetrievalProvider(name,retriever) → search(SearchRequest) -> list[SearchResult] : délégation directe à Retriever. ProviderRegistry.register écrase par nom ; get(name) renvoie provider ou KeyError. Ce registre concerne la recherche documentaire, pas le routage LLM.
- engine/default_pipeline.py → build_agents(retriever) → dictionnaire de sept callables : planner, researcher, evidence_analyst, contradiction_analyst, synthesizer, verifier, next_action. invoke enveloppe execute avec AgentContext(run_id,question,state). Valeurs de repli unknown et chaîne vide.
- engine/orchestrator.py → ResearchRun : run_id, question, state, iteration, revision, context, history. Orchestrator(agents,max_iterations=5,store=None). _checkpoint appelle store.save ; _run_agent appelle le callable avec context, fusionne le résultat, journalise les clés, sauvegarde ; agent absent => RuntimeError. _build_dossier délègue à dossier.build_dossier.
- run : initialise EvidenceGraph, identifiants, planification, boucle recherche/analyse/contradictions/synthèse/vérification, assess(SufficiencyInput), COMPLETED si stop ; sinon next_action et reprise ; BLOCKED au budget maximal. Dépendances : state_machine, sufficiency, evidence_graph, dossier, store injectable.
- Sources : retriever injectable ; aucun fournisseur externe ni appel Hermes dans ces trois fichiers. La documentation vise un runtime interchangeable Hermes/LangGraph/etc., un graphe de preuves et une boucle de recherche mesurable.
- Tests : test_engine_reaches_completed_when_sufficient et test_engine_stops_after_iteration_budget utilisent des callables factices ; ne prouvent pas une intégration Hermes.

## Lacunes et tests proposés
1. P1 : exceptions agent/store non interceptées dans run ; tester panne simulée et reprise sans duplication.
2. P1 : context.update accepte toute clé, y compris identifiants et graphe ; tester contrat de sortie et champs réservés.
3. P1 : aucun timeout ni fallback dans les appels synchrones de ces fichiers ; tester agent bloquant et indisponibilité.
4. P1 : run commence toujours par transition vers PLANNING ; vérifier reprise depuis checkpoint intermédiaire contre state_machine avant de conclure à sa validité.
5. P2 : register écrase silencieusement un fournisseur homonyme ; tester collision.
6. P2 : history conserve clés et non provenance d'exécution ; proposer identifiant de tentative, modèle, runtime, horodatage et référence de preuve, sans secrets.

## Contrat cible (proposition, non implémenté)
CRONOS sélectionne une capacité d'exécution ; Hermes exécute une tâche bornée ; Research Engine garde la maîtrise du protocole scientifique, du graphe et des critères d'arrêt. Entrée proposée : run_id, task_id, question, budget, outils autorisés, contraintes réseau. Sortie : statut, résultat structuré, sources, erreurs typées, référence de tentative. Ne pas confondre provider documentaire et provider LLM. Projection Watchtower via contrat de preuve avec provenance et contradictions conservées.

## Couverture et suite
Arbre main interrogé : 12 fichiers de tests Research Engine recensés ; aucun chemin contenant cronos dans cet arbre (ne prouve pas absence sur autres branches ou dans le contenu). Aucun adaptateur Hermes nommé comme tel retrouvé dans le sous-arbre, hors document d'architecture. Prochain lot : state_machine, persistence, retrieval, sufficiency et recherche des branches CRONOS. Aucun test Python ni runtime exécuté ; aucun code applicatif modifié.
