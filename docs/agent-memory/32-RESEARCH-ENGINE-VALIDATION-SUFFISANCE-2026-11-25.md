# Audit 32 — Validation expérimentale de la suffisance

Date : 2026-11-25. Statut : TEST_LOCAL_SANDBOX, fonction pure ; intégration et tour non testées.

Navigation : [[01-HUB-SUIVI-AGENTS]] · [[31-RESEARCH-ENGINE-CONTRATS-TRANSITIONS-2026-11-24]] · [[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]].

## Provenance

Dépôt Sathancabrol/reaserch-engine, ref main :
- [engine/sufficiency.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/sufficiency.py) — blob d5a771e9eae81640a56a75cb4783dc7ca6d4f667.
- [schemas/sufficiency-decision.schema.json](https://github.com/Sathancabrol/reaserch-engine/blob/main/schemas/sufficiency-decision.schema.json) — blob 28d1f9f9d11de331fca29cb4bd221d8bfc956094.

Les deux fichiers reproduits localement ont été authentifiés par git hash-object avant exécution. assess(SufficiencyInput) -> dict ; dépendances applicatives : dataclasses standard ; aucune source externe. Validation : jsonschema.Draft202012Validator ; check_schema réussi. Données synthétiques uniquement.

## Résultats Python

| Entrée non défaut | Décision | reason |
|---|---|---|
| verifier_critical_issues=1 | continue | critical_verification_issue |
| critical_gaps=1 | continue | critical_evidence_gap |
| unresolved_major_contradictions=1 | continue | major_contradiction_unresolved |
| unsearched_high_value_categories=1 | continue | high_value_source_class_unsearched |
| max_iterations_reached=True | stop | iteration_budget_exhausted |
| user_depth_reached=True | stop | depth_or_saturation_reached |
| expected_information_gain=1 | continue | positive_expected_information_gain |
| aucune | stop | low_marginal_information_gain |
| critical_gaps=1, max_iterations_reached=True, budget_remaining=0 | continue | critical_evidence_gap |
| unsearched_high_value_categories=1, max_iterations_reached=True | continue | high_value_source_class_unsearched |

10/10 sorties invalides, dont les huit branches distinctes ; trois erreurs required par sortie : reasons, critical_gaps, next_actions. 30 erreurs de validation au total. Le script d'inventaire termine avec code 0, ce qui ne signifie pas conformité. Les deux derniers cas démontrent que assess seul ne garantit pas l'arrêt budgétaire.

## Reproduction

Après récupération et vérification des deux blobs, placer sufficiency.py et schema.json dans un dossier isolé, puis exécuter Python avec jsonschema installé :

```python
import json
from sufficiency import assess, SufficiencyInput
from jsonschema import Draft202012Validator
s = json.load(open("schema.json"))
Draft202012Validator.check_schema(s)
v = Draft202012Validator(s)
cases = [
 dict(verifier_critical_issues=1), dict(critical_gaps=1),
 dict(unresolved_major_contradictions=1),
 dict(unsearched_high_value_categories=1),
 dict(max_iterations_reached=True), dict(user_depth_reached=True),
 dict(expected_information_gain=1), {},
 dict(critical_gaps=1,max_iterations_reached=True,budget_remaining=0),
 dict(unsearched_high_value_categories=1,max_iterations_reached=True)
]
for kw in cases:
 r = assess(SufficiencyInput(**kw))
 print(kw, r, [e.message for e in v.iter_errors(r)])
```

## Décisions cibles (non implémentées)

P1 : distinguer limite opérationnelle et suffisance épistémique ; contrat unique avec raisons, lacunes et actions structurées. Ne pas conclure que le pipeline dépasse effectivement son budget sans tester le garde-fou externe. Prochain lot : deux cycles orchestrateur avec agents injectés, reprise persistante et branche blocked. Aucun code applicatif modifié.
