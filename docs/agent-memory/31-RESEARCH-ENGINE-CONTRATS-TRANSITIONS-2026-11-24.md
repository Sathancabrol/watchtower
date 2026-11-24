# Audit 31 — Contrats de suffisance et transitions : contrôle exhaustif des branches littérales

Date : 2026-11-24. [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[30-RESEARCH-ENGINE-PLANIFICATION-QUALITE-2026-11-24]] · [[01-HUB-SUIVI-AGENTS]].

## Provenance
- [engine/sufficiency.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/sufficiency.py) — Sathancabrol/reaserch-engine@main, blob `d5a771e9eae81640a56a75cb4783dc7ca6d4f667`
- [schemas/sufficiency-decision.schema.json](https://github.com/Sathancabrol/reaserch-engine/blob/main/schemas/sufficiency-decision.schema.json) — Sathancabrol/reaserch-engine@main, blob `28d1f9f9d11de331fca29cb4bd221d8bfc956094`
- [engine/state_machine.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/state_machine.py) — Sathancabrol/reaserch-engine@main, blob `0c3975a4eabd1c138f3c7667e01ab9ceea6625da`
- [engine/orchestrator.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/orchestrator.py) — Sathancabrol/reaserch-engine@main, blob `a8f5c32675cc34d4ff4aa3919d26180507a8ec57`

## Contrôle exécuté
Extraction JS des dictionnaires littéraux retournés par assess, parsing JSON et comparaison de leurs clés avec required du schéma. Aucun appel fournisseur, aucune donnée privée. Contrôle de présence uniquement, pas validation JSON Schema complète ni exécution Python.

| Branche | Décision | Champs obligatoires absents |
|---|---|---|
| critical_verification_issue | continue | reasons, critical_gaps, next_actions |
| critical_evidence_gap | continue | reasons, critical_gaps, next_actions |
| major_contradiction_unresolved | continue | reasons, critical_gaps, next_actions |
| high_value_source_class_unsearched | continue | reasons, critical_gaps, next_actions |
| iteration_budget_exhausted | stop | reasons, critical_gaps, next_actions |
| depth_or_saturation_reached | stop | reasons, critical_gaps, next_actions |
| positive_expected_information_gain | continue | reasons, critical_gaps, next_actions |
| low_marginal_information_gain | stop | reasons, critical_gaps, next_actions |

8/8 sorties non conformes sur les champs requis. Contrat de sortie réel reason/next_focus, contrat déclaré reasons/critical_gaps/next_actions. Le budget d'itérations est évalué après les trois premières conditions critiques ; il ne constitue donc pas une limite absolue dans assess seul.

## Simulation structurelle de la machine à états
Extraction de _ALLOWED depuis le fichier source, puis contrôle de la séquence de transitions de l'orchestrateur pour une décision continue. Ce n'est pas une exécution de l'orchestrateur Python.

| Origine | Destination | Autorisée |
|---|---|---|
| CREATED | PLANNING | oui |
| PLANNING | RESEARCHING | oui |
| RESEARCHING | SYNTHESIZING | oui |
| SYNTHESIZING | VERIFYING | oui |
| VERIFYING | RESEARCHING | oui |
| RESEARCHING | RESEARCHING | non |

États autorisant une entrée vers PLANNING : CREATED, BLOCKED. La reprise intermédiaire nécessite un contrat d'étape distinct. Le chemin bloqué final construit également une décision sans les trois champs requis. La preuve est statique et le runtime complet reste non testé.

## Décisions et prochain lot
P1 : définir un contrat de décision unique, conserver raisons et actions structurées ; distinguer épuisement du budget et suffisance scientifique. P1 : reproduire en Python deux cycles avec agents injectés et reprise depuis checkpoint. P1 : valider les huit sorties avec jsonschema et tester la branche bloquée de l'orchestrateur. Aucun changement applicatif ni fusion.
