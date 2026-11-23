---
title: "WATCHTOWER — audit de code OSINT Workbench v0.1"
created: 2026-11-23
document_type: code-level-audit
status: source-inspected-runtime-not-tested
tags: [watchtower, osint, cognitorium, evidence, audit, agent-memory]
---
# OSINT Workbench v0.1 — audit de code et contrats réels

> [!important] Périmètre de preuve
> Lecture du code GitHub le **23/11/2026**, dépôt `Sathancabrol/COGNITORIUM`, branche `watchtower/osint-workbench-v0.1`. Les SHA ci-dessous sont des **SHA de blobs Git**, pas les SHA de commits de la branche. Aucun test navigateur, API externe, ou runtime Windows n'a été exécuté. Cette note approfondit [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]] et [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]].

## 1. Arborescence de responsabilités

- **Investigation / Case**
  - [`osintCase.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintCase.js) — blob `a834bfd353b4e1da548e4607a2ff933de3a6822d`
    - `createInvestigation(seed={})` → objet mutable `{schemaVersion:1,id,title,createdAt,updatedAt,entities,observations,relations,notes}`.
      - Identifiant par défaut `case_${Date.now()}` : risque de collision pour deux créations dans la même milliseconde.
      - Les tableaux du seed sont **réutilisés par référence**, sans copie : une mutation externe peut modifier l'enquête.
      - `updatedAt` est recalculé à la création, même si un `seed.updatedAt` existait.
    - `addEntity(investigation,entity)` → exige `id` et `type`, pousse une copie superficielle, modifie `updatedAt`, retourne **l'argument** `entity`.
      - Pas de vérification d'unicité des IDs, de schéma, de relations ou de droits.
    - `addRelation(investigation,relation)` → exige `from`, `to`, `predicate`, pousse une copie superficielle, modifie `updatedAt`, retourne l'argument.
      - Ne vérifie pas que les entités référencées existent.
- **Observation / Evidence**
  - [`osintEvidence.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintEvidence.js) — blob `1551336cf4c04c11dd15e9a455cef7dc3adcb1ac`
    - `EVIDENCE_TYPES` = `FACT | INFERENCE | HYPOTHESIS | UNKNOWN`.
    - `createObservation({entityId,claim,type,sourceId,sourceUrl,observedAt,confidence,method,humanValidated,details})` → observation `Object.freeze` **superficiel**.
      - Rejette `entityId` ou `claim` absent et `type` inconnu.
      - ID `obs_${Date.now()}_${Math.random()...}` : non déterministe, non garanti unique ; pas de crypto-UUID ni de provenance vérifiée.
      - `confidence` non bornée à [0,1], `sourceId` et `sourceUrl` optionnels, `observedAt` par défaut = instant de **construction**, non instant de mesure réelle.
      - `humanValidated` booléen déclaratif, sans identité du valideur ni trace d'audit.
    - `canPromoteToFact(observation)` → vrai seulement si `type === 'INFERENCE'` et `humanValidated` vrai.
      - Ne modifie pas l'observation et ne vérifie ni source, ni indépendance, ni qualité de preuve.
- **Registre de sources**
  - [`osintRegistry.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintRegistry.js) — blob `42e31d136937f544bef7ea181a3692e47ca8a2e9`
    - `OSINT_SOURCES` : **10 descriptions statiques** : BAN, cadastre, DVF, SIRENE, BODACC, RNE, OSM, Wayback, métadonnées, recherche de pseudonymes.
    - `getOsintSource(id)` → première entrée d'ID égal ou `null`.
    - `listOsintSources(filter={})` → filtre par égalité stricte de champs, pas de moteur d'exécution.
    - `Object.freeze` sur le tableau **uniquement** : objets de sources internes non gelés ; registre descriptif ≠ permissions ou adaptateurs connectés.
- **Interface / démonstration**
  - [`osintWorkbench.js`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintWorkbench.js) — blob `f8be8d3c9b75ae26ce69515f3eb9fb067b22bc96`
    - `initOsintWorkbench()` injecte CSS, panneau `aside`, bouton flottant et événements DOM ; appelle `render(createInvestigation(...))`.
    - `runDemo()` crée une entité `building_demo_frontignan`, ajoute cinq observations **fabriquées dans le code**, deux relations et affiche la démo.
    - Trois observations fictives sont étiquetées `FACT` avec `confidence:1` et méthodes `adapter:ban`, `adapter:cadastre`, `adapter:dvf` **sans requête réseau** : risque de confusion majeur. Elles ne sont **pas** des résultats BAN/Cadastre/DVF.
    - `render()` utilise `innerHTML` avec les champs `investigation.entities[0]?.type`, `o.type`, `o.claim`, `o.sourceId` sans échappement HTML : **risque XSS si des données non fiables atteignent le rendu**. La démo actuelle est codée en dur, ce qui limite le scénario actuel ; ce n'est pas une preuve d'exploitation.
    - Export `Blob(JSON.stringify(investigation,null,2))` sous `<id>.json`, sans schéma `.wtcase.json`, profil de confidentialité ni import.
    - L'appel répété à `initOsintWorkbench()` ajoute un nouveau bouton `wt-osint-trigger` sans test d'existence : doublons DOM possibles.
    - Aucun `fetch`, WebSocket, API BAN/DVF/SIRENE, intégration Cesium ou stockage durable n'est implémenté dans ce fichier.

## 2. Matrice de vérité : implémentation vs spécification

| Capacité | État prouvé dans les fichiers inspectés | Écart |
|---|---|---|
| Création d'enquête | Code simple, état en mémoire | Pas de persistance ni migration |
| Entités / relations | Ajout mutable avec validation minimale | IDs, intégrité référentielle, doublons |
| Observation | Création et types, freeze superficiel | Provenance complète, validation réelle |
| Sources | Registre statique de 10 fiches | Connecteurs, quotas, licences effectives non vérifiés |
| Export | JSON client depuis la démo | Import, schéma canonique, privacy |
| Workbench | Panneau DOM et démo | Intégration carte/fiche lieu non démontrée |
| BAN / DVF / cadastre | Libellés et observations de démonstration | Aucune collecte réelle dans ce module |
| `FACT` | Type librement sélectionnable | Human gate non contraignant |
| Temporalité | `createdAt`, `updatedAt`, `observedAt` | Pas de `publishedAt/retrievedAt/validFrom/validTo` |
| Contradictions, snapshots, audit immuable | Concept documenté | Non présent dans ces quatre modules |

## 3. Contrats cibles, sans les confondre avec du code actif

- [`OSINT-MASTER-SPEC.md`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/docs/OSINT-MASTER-SPEC.md), blob `50450942a250de84113c02f5c12a3fbe0c4d4f8b` : sept primitives `ENTITY, OBSERVATION, SOURCE, RELATION, EVENT, QUESTION, VALIDATION`, et des extensions `CLAIM, CASE, HYPOTHESIS, SNAPSHOT, CONTRADICTION`. Modèle conceptuel 0.2-draft.
- [`OSINT-ROADMAP.md`](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/docs/OSINT-ROADMAP.md), blob `44be5615f178b36ab8eff9eccad8f3fb69d095d1` : phase 0 cochée ; phases 1 à 9 non cochées. Les cases cochées sont des **déclarations du document**, pas des tests récents.
- Ne pas fusionner directement avec `watchtower.intel@1.0.0` ni `carredas/core/canonical-record.schema.json` sans une matrice de champs et d'invariants.

## 4. Plan d'amélioration priorisé, testable

1. **P0 — Fiabilité des preuves** : interdire `FACT` sans preuve et validation contextualisées ; marquer explicitement les cinq observations démo `SIMULATED/DEMO` et les exclure des exports factuels.
2. **P0 — Sécurité de rendu** : remplacer l'interpolation `innerHTML` des champs non fiables par `textContent` ou échappement contrôlé ; tests avec chaînes HTML hostiles.
3. **P1 — Schéma canonique** : IDs UUID, validation `sourceId`, `confidence` bornée, dates distinctes, états d'inconnu, provenance et licence.
4. **P1 — Intégrité** : déduplication, vérification de relations, immutabilité ou copies profondes contrôlées, audit append-only.
5. **P1 — Tests unitaires** : validation des entrées, collisions d'ID simulées, immutabilité, absence de promotion implicite, XSS, idempotence de l'initialisation.
6. **P2 — Contrats d'adaptateurs** : un connecteur par source avec licences, quotas, cache, timeouts, statut de collecte et contrôle humain ; ne pas déduire le droit d'automatisation du registre descriptif.
7. **P2 — Intégration** : sélection Cesium → entité canonique → observation sourcée → dossier INTEL → export portable ; tests de non-régression globe/HUD.

## 5. Limites et prochaine passe

- Audit **statique** de quatre fichiers JS et deux documents de la branche ; aucune preuve de chargement dans `watchtower/main`, ni tests CI exécutés pour cette branche.
- Prochaine passe : rechercher les tests et les imports de `initOsintWorkbench`, examiner le contrat `carredas/core/canonical-record.schema.json` et `watchtower.intel@1.0.0`, puis produire une matrice de conversion champ par champ.
- La présence d'un nom de source ne prouve ni sa disponibilité, ni ses droits de réutilisation.
