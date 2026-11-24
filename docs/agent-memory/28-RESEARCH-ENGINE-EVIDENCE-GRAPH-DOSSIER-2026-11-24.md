# Audit 28 — EvidenceGraph, claims et dossier (2026-11-24)

[[27-RESEARCH-ENGINE-REPRISE-SUFFISANCE-2026-11-24]] · [[26-RESEARCH-ENGINE-HERMES-CONTRATS-2026-11-24]] · [[01-HUB-SUIVI-AGENTS]] · [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]]

## Provenance
Sathancabrol/monorepo, ref main, racine projects/reaserch-engine. SHA de blobs (pas commits) lus directement :
- [engine/evidence_graph.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/evidence_graph.py) — `d421ffe1e0527a10705e0565f7443a8b0c3f6640`
- [engine/dossier.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/dossier.py) — `507e8bc05900062280d98b9872a868ded95c5d39`
- [engine/claims.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/engine/claims.py) — `650849ee1cf5d57ea68b0fd939a813776b9ced48`
- [tests/test_evidence_graph.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_evidence_graph.py) — `b7b61659559831e96d526b57e2abe0391206a806`
- [tests/test_dossier.py](https://github.com/Sathancabrol/monorepo/blob/main/projects/reaserch-engine/tests/test_dossier.py) — `59b158ce7ebb73281057e34e70d9272a4c18b361`

## Arborescence et contrats
- evidence_graph.py → GraphNode(id,kind,data), GraphEdge(source,relation,target,data), EvidenceGraph : stockage dict/list en mémoire, sans dépendance externe.
  - add_node refuse doublon ID ; add_edge exige endpoints existants, sans contrôle de type/relation.
  - add_source(title,metadata), add_evidence(source_id,content,direction,metadata) → source provides evidence ; contenu non vide et source typée.
  - add_claim(text,metadata) → proposed ; link_evidence(evidence_id,claim_id,direction) → supports/contradicts/neutral/contextual.
  - add_contradiction(claim_ids,classification) → conflicts_in ; add_conclusion(text,claim_ids,contradiction_ids) → informs/qualifies.
  - neighbors, supporting_evidence, contradicting_evidence, provenance → listes d'IDs ; snapshot/from_snapshot → dict nodes/edges, restauration générique.
- claims.py → build_claim retourne ID ; attach_evidence délègue au graphe ; claim_status → mixed/supported/contradicted/unknown selon présence d'arêtes, sans pondération.
- dossier.py → build_dossier(run) → run_id, question, status, revision, conclusions, claims, evidence_matrix, contradictions, bibliography, stopping_decision, research_log. Dépend de claim_status et du graphe en contexte. Sources : métadonnées des nœuds, aucune collecte externe ici.

## Lacunes statiques et tests proposés
1. P1 : graphe accepte orientation historique claim→evidence et canonique evidence→claim dans supporting_evidence/contradicting_evidence ; dossier ne projette que canonique. Un claim peut être supported avec liste de preuves vide. Normaliser les orientations ou migrer explicitement ; tester les deux sens.
2. P1 : add_conclusion crée le nœud avant validation des références ; une exception peut laisser un nœud et des liens partiels. Prévalider toutes les références, tester atomicité.
3. P1 : from_snapshot utilise add_node/add_edge génériques ; accepte types arbitraires et preuves sans source. Tester restauration d'un graphe invalide et validation sémantique.
4. P1 : claim_status ne vérifie ni qualité, ni indépendance, ni poids, ni type des endpoints retournés par les requêtes génériques. supported ne signifie pas fait établi. Tester sources faibles et arêtes mal typées.
5. P2 : add_contradiction accepte deux occurrences du même claim ; add_edge accepte doublons ; tester unicité et idempotence.
6. P2 : dossier conserve seulement la première provenance d'une preuve, omet métadonnées bibliographiques détaillées et relations dérivées ; préserver toutes les références et dates distinctes.
7. P2 : snapshot expose les dictionnaires data sans copie ; mutation du snapshot peut affecter le graphe. Tester isolation.

## Contrôle exécuté
Contrôle textuel JS sur les blobs : compatibilité historique dans graphe=true, filtre canonique dossier=true, fixture historique existante=true. 5 fonctions test_ comptées dans les deux fichiers de tests. Quatre tests graphe (orientation historique, endpoints, chaîne canonique, provenance invalide) et un test dossier canonique. Aucun test Python exécuté ; anomalies déduites statiquement, non reproduites au runtime.

## Décision cible
Préserver le graphe natif, normaliser relations, valider restauration, séparer soutien et vérité, conserver provenance complète dans la projection Watchtower/OSINT. Aucun code applicatif modifié. Suite : agents concrets, construction des assertions et critères de vérification, puis CRONOS branches.
