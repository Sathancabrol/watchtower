# Audit 29 — Agents scientifiques et boucle de décision (2026-11-24)

[[28-RESEARCH-ENGINE-EVIDENCE-GRAPH-DOSSIER-2026-11-24]] · [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[26-RESEARCH-ENGINE-HERMES-CONTRATS-2026-11-24]] · [[01-HUB-SUIVI-AGENTS]] · [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]]

## Provenance
Dépôt Sathancabrol/monorepo, ref main, racine projects/reaserch-engine/. SHA de blobs lus (non commits).
- [engine/agents.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/agents.py) — `9535d506b55f89646d3ffcdc7bc13b3b894a44b2`
- [engine/default_pipeline.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/default_pipeline.py) — `50ab3ea8bb8b0db91d44d5d635de1452d5c89c93`
- [engine/evidence_extractor.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/evidence_extractor.py) — `0090427def27fd3753c37e7dad14c4b557ebdbba`
- [engine/graph_assessment.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/graph_assessment.py) — `5236887bcc71e9818985c700debc931dbcce92e8`
- [engine/run_builder.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/run_builder.py) — `76bfcfbca519717761e9a6c21ac4b33a9d507573`
- [engine/actions.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/actions.py) — `4cb41760e7a6bffa2a5225dc6785137335381520`
- [engine/orchestrator.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/orchestrator.py) — `a8f5c32675cc34d4ff4aa3919d26180507a8ec57`
- [tests/test_agents.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_agents.py) — `a92b95992c36348326aa4bba48dc1eace0f01f2a`
- [tests/test_default_pipeline.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_default_pipeline.py) — `c215577210e6584ef7ba4c2a03e057bfb7e592ab`
- [tests/test_graph_assessment.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_graph_assessment.py) — `b2904462eb9703abdc8765e8e14980635aa187f7`

## Arborescence fonctionnelle
- agents.py → AgentContext(run_id,question,state), Agent.execute → dict ; PlannerAgent → research_plan avec subquestions vide ; ResearcherAgent(retriever) → SearchRequest par query → search_results ; aucun LLM ici.
- EvidenceAnalystAgent → RunBuilder → add_source_result, add_claim depuis claim_drafts optionnels → evidence, evidence_analysis, snapshot. ContradictionAnalystAgent consomme contradictions déjà fournies, ne les découvre pas. SynthesizerAgent consomme conclusion_draft et claims ; VerifierAgent → assess_evidence_graph → verification et sufficiency ; NextActionAgent → next_best_action.
- default_pipeline.py → build_agents(retriever) : sept agents, adaptation state→AgentContext.
- evidence_extractor.py → EvidenceRecord ; extract(result,evidence_id) : snippet ou titre, direction neutre, confiance inconnue ; pas de lecture du texte intégral.
- run_builder.py → RunBuilder(graph), add_source_result : source identifiée par result.id, qualité via classify_source, preuve evidence:<id> ; add_claim : attache preuves, recalcule statut ; add_contradiction/add_conclusion : réutilise ID existant ; snapshot délègue au graphe.
- graph_assessment.py → _is_critical (critical ou entier >=3), assess_evidence_graph : compte claims critiques non soutenus, contradictions non résolues, sources à pertinence faible.
- actions.py → next_best_action(context) : verify_claims 100, search_missing_evidence 90, investigate_contradiction 85, search_new_source_class 70, counter_evidence_search 50. Sortie type/priority/reason.
- orchestrator.py → _run_agent fusionne les sorties dans contexte ; run appelle next_action après décision de poursuite.

## Lacunes statiques et tests proposés
1. P1 : VerifierAgent fixe critical_issues à zéro ; aucune vérification de vérité ni de citation. Tester preuve absente, faible et contradictoire.
2. P1 : unresolved_major_contradictions est écrit sous sufficiency par verifier, mais next_best_action lit la racine du contexte. Tester contradiction seule et priorité attendue 85.
3. P1 : next_action est enregistré mais ni ResearcherAgent ni orchestrateur ne le traduisent en nouvelles queries ; la recherche peut répéter la même requête. Tester deux cycles avec requêtes distinctes après correction de la machine à états (audit 27).
4. P1 : PlannerAgent ne décompose pas la question ; aucune production de claim_drafts ou conclusion_draft dans les sept agents de référence. Ne pas confondre pipeline de référence et agent scientifique autonome.
5. P1 : add_source_result ne rafraîchit pas une source ou preuve existante ; même ID avec contenu différent donne un EvidenceRecord neuf mais graphe ancien. Tester conflit de version et provenance.
6. P2 : graph_assessment compte toutes contradictions non résolues comme majeures, sans filtre de gravité ; faible pertinence est signalée mais non intégrée à sufficiency par verifier. Tester gravité et qualité.
7. P2 : add_claim peut réattacher les mêmes preuves lors d'une reprise ; tester idempotence et collision de type d'ID.

## Contrôles exécutés
Analyse textuelle JS des dix blobs : 7 classes d'agents concrets ; 4 fonctions test_ dans les trois fichiers ciblés ; divergence champ imbriqué/racine=true ; absence de consommation explicite next_action dans les deux fichiers contrôlés=true ; critical_issues fixé à zéro=true. Tests existants : plan structuré, retriever injecté, projection source/preuve sur un cycle, comptage critique/contradiction. Aucun test Python exécuté.

## Cible et suite
Hermes/CRONOS : déléguer planification, extraction structurée, recherche de contre-preuves à des capacités vérifiées ; valider sorties et provenance avant mutation du graphe. Research Engine conserve décisions scientifiques et budget. Aucun adaptateur runtime démontré ici. Prochain lot : planner.py, question_analyzer.py, research_strategy.py, quality.py, source_quality.py et leurs tests ; vérifier leur raccordement au pipeline.
