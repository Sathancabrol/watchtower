# Audit 30 — Planification scientifique et divergence de test

Date : 2026-11-24. Navigation : [[29-RESEARCH-ENGINE-AGENTS-DECISIONS-2026-11-24]] · [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[01-HUB-SUIVI-AGENTS]] · [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]].

## Provenance et comparaison
Dépôt Sathancabrol/reaserch-engine, main, arbre racine ed4640d177f138ad4c752e02bcd98ce75e520166, non tronqué. Comparaison directe avec Sathancabrol/monorepo main, projects/reaserch-engine : les six entrées racine ont les mêmes SHA (dont engine b061367f433612620e11232fdd4319b15b16b79f, tests e12934421f43c49899909480b70dcb0efef476dc, docs ce7ed58ba7ba291118f43c0b34b375473b818b86, schemas db6fb5f4017789bd9005ebcd766a7d601f7e5907). Identité du contenu Git à cet instant, pas preuve de synchronisation future. Les recherches textuelles négatives antérieures sont infirmées par l'arbre.

| Source (main) | SHA blob |
|---|---|
| [engine/planner.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/planner.py) | `eeb1234eb82ca5d2d469a33421cbf02fd39f7554` |
| [engine/question_analyzer.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/question_analyzer.py) | `2133350025a9a0348f1e1e56e33e75938e1aa4b9` |
| [engine/research_strategy.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/research_strategy.py) | `ea6819cbf9678b23b74f9e1dbfb6496a2cd059f6` |
| [engine/quality.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/quality.py) | `a4ced7198772395487cc3ccb56a93f0511fceb16` |
| [engine/source_quality.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/source_quality.py) | `4331dc4b0772f25e8430ff465fbe27005802b477` |
| [engine/default_pipeline.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/default_pipeline.py) | `50ab3ea8bb8b0db91d44d5d635de1452d5c89c93` |
| [engine/agents.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/agents.py) | `9535d506b55f89646d3ffcdc7bc13b3b894a44b2` |
| [tests/test_planner.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/tests/test_planner.py) | `ebf9ab3f691dac9b5b833499486a4b65b74359fc` |
| [tests/test_question_analyzer.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/tests/test_question_analyzer.py) | `fe328c19e3b6ab522e289c040eefbc6470c95a69` |
| [tests/test_research_strategy.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/tests/test_research_strategy.py) | `bc675d750c83a99ab995212afc644ea09a1bd0e7` |

## Contrats constatés
- planner.py : AdaptivePlanner.plan(question, domain=None) -> ResearchPlan ; quatre SubQuestion fixes (scope, evidence, counter-evidence, uncertainty), six quality gates. domain inutilisé, question vide acceptée, source_types vides. Dépendance dataclasses uniquement.
- question_analyzer.py : QuestionAnalyzer.analyze(question) -> QuestionAnalysis ; normalisation des espaces, classification multitype par sous-chaînes FR/EN ; original et normalized identiques, ambiguities et constraints toujours vides. Pas de modèle ni appel externe.
- research_strategy.py : ResearchStrategyEngine.next_actions(StrategyState) -> list[ResearchAction] ; quatre règles, priorités fixes, tri décroissant priorité puis gain. question_type et confidence inutilisés ; cibles génériques sans identifiant ni requête. Pas de fournisseur externe.
- quality.py : assess_claims(claims) -> compteurs et ratio ; identify_gaps(subquestions, claims) -> sous-questions non couvertes et non bloquées. Un statut supported suffit sans contrôle de preuve ; entrées dictionnaires, pas directement les dataclasses du planner.
- source_quality.py : classify_source(...) -> métadonnées ; type inconnu devient unverified_web. quality_flags(metadata) -> flags ; valeurs inconnues None et absence de preuve directe ne déclenchent pas de flag. Pas de validation indépendante des métadonnées.
- default_pipeline.py / agents.py : build_agents(retriever) -> wrappers AgentContext ; PlannerAgent renvoie subquestions vide, ResearcherAgent lit queries ou question, NextActionAgent utilise actions.next_best_action. Aucun appel direct aux cinq composants spécialisés dans ces deux fichiers. Ne pas conclure à une absence globale d'appel sans scan complet.

## Contrôle structurel exécuté
Extraction JS des priorités littérales et tri : [["search",100],["investigate_contradiction",98],["verify_claims",95],["expand_source_classes",75]]. Le test test_contradictions_are_prioritized construit un état avec sous-question ouverte, contradiction, assertion non résolue et couverture .5, puis attend investigate_contradiction en premier. Le code donne search (100) avant investigate_contradiction (98), même si son gain est inférieur. Incompatibilité statique test/code ; pytest non exécuté. Les deux autres tests ciblés vérifient les quatre sous-questions et gates, puis la classification comparative/causale. Aucun test runtime revendiqué.

## Décisions et lacunes
P1 : clarifier la politique de priorité (contradiction ou objectif ouvert), puis reproduire le test avant correction. P1 : connecter AdaptivePlanner au PlannerAgent avec sérialisation explicite et identifiants stables ; transformer ResearchAction en requêtes et enregistrer provenance. P1 : distinguer qualité déclarée, inconnue et vérifiée ; ne pas assimiler statut supported à vérité. P2 : exploiter domain, confidence et question_type ou retirer les paramètres trompeurs. Tester question vide, ambiguïtés, sous-chaînes trompeuses, métadonnées absentes et passage dataclass/dict. Cible uniquement : CRONOS/Hermes fournit des capacités d'enrichissement, le moteur garde les gates et le budget. Prochain lot : reproduire les tests Python et rechercher les appels des composants dans le reste de l'écosystème.
