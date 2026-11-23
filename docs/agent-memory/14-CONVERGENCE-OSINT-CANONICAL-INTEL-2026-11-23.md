---
title: "WATCHTOWER — convergence OSINT, Carré d'As et INTEL"
created: 2026-11-23
document_type: code-contract-comparison
status: source-inspected-runtime-not-tested
tags: [watchtower, osint, carredas, cognitorium, intel, provenance, schema, agent-memory]
---
# Convergence des trois contrats : OSINT Workbench ↔ Carré d'As ↔ WATCHTOWER INTEL

> [!important] Périmètre de vérification
> Lecture directe du code GitHub le 23/11/2026. Ce document compare des **blobs Git**, pas des fonctionnalités exécutées. Les branches citées ne sont pas présumées fusionnées à `main`. Ne pas remplacer les données originales par un export réduit sans mécanisme de conservation. Voir [[13-OSINT-WORKBENCH-AUDIT-CODE-2026-11-23]], [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]] et [[11-MATRICE-CONVERGENCE-TERRITOIRE-2D]].

## 1. Sources primaires lues, branches et SHA de blobs

| Dépôt / branche | Fichier | Blob SHA | Objet |
|---|---|---|---|
| `COGNITORIUM/watchtower/osint-workbench-v0.1` | [osintCase.js](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintCase.js) | `a834bfd353b4e1da548e4607a2ff933de3a6822d` | Investigation, entités, relations |
| même branche | [osintEvidence.js](https://github.com/Sathancabrol/COGNITORIUM/blob/watchtower/osint-workbench-v0.1/watchtower-mods/src/osint/osintEvidence.js) | `1551336cf4c04c11dd15e9a455cef7dc3adcb1ac` | Observation et typage épistémique |
| `monorepo/arena/0034230e-monorepo` | [canonical-record.schema.json](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/core/canonical-record.schema.json) | `682ee353ddfdb6f33a30335fc3e7f8300667151e` | JSON Schema draft 2020-12 |
| même branche | [canonical.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/core/canonical.py) | `d4d8817233a57d6508760580fcee9bc9d04e7020` | Constructeur, validateur minimal, adaptateurs |
| même branche | [osint/router.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) | `83cf39e8a373671de9ea10137f0f74bf314d2c14` | Cas, preuves, export, endpoints |
| `watchtower/arena/dec9cd88-watchtower` | [watchtower-intel.json](https://github.com/Sathancabrol/watchtower/blob/arena/dec9cd88-watchtower/public/data/intel/watchtower-intel.json) | `0b6b98289b8db818ff696c445f198ca1f500fd55` | Export territorial `watchtower.intel@1.0.0` |

Ces SHA sont des **empreintes de contenu**, non des commits de pointe. Ils permettent de retrouver exactement la variante examinée.

## 2. Trois niveaux de granularité différents

- **OSINT Workbench (JavaScript)** : `Investigation` contenant `entities[]`, `observations[]`, `relations[]`, `notes[]`. `createObservation` fabrique une assertion relative à `entityId` ; `addEntity` et `addRelation` modifient le cas en mémoire.
- **Carré d'As (Python)** : `Canonical Record` unitaire avec `id,type,source,status` obligatoires et `label,source_url,retrieved_at,observed_at,valid_from,valid_to,geometry,provenance,confidence,license,relations` optionnels. Le module OSINT stocke des `osintcas` avec `preuves[]` et les projette vers des enregistrements canoniques.
- **WATCHTOWER INTEL (JSON)** : export territorial hiérarchique `contrat=watchtower.intel`, `version=1.0.0`, `genere_le`, `provenance`, `territoires`, `entites`, `vision`, `statistiques`. Dans le blob inspecté, `entites` contient 93 lieux, 13 projets, 32 indicateurs, 149 sources, 13 lacunes et 10 contradictions. Ce sont des **comptages du fichier**, pas des garanties de validité ou de fraîcheur.

## 3. Correspondance champ par champ (projection proposée, non implémentée)

| Sens | Workbench JS | Carré d'As canonical | WATCHTOWER INTEL | Arbitrage |
|---|---|---|---|---|
| ID | `case.id`, `entity.id`, `observation.id` | `id` obligatoire | `entites.lieux[].id`, `projets[].id`; pas d'ID sur chaque indicateur | Namespace stable `osint:case:…`, `intel:indicateur:<clé>` ; conserver ID natif dans `provenance.original_id` |
| Type | `entity.type`, `observation.type` | `type` (nature métier), `status` (vérité) | `lieux[].type`, `projets[].nature` | Ne pas confondre type d'entité et statut de preuve |
| Nom/texte | `title`, `claim` | `label` | `nom`, `indicateur`, `texte` | Conserver assertion complète dans `extra.claim` et libellé court dans `label` |
| Source | `sourceId`, `sourceUrl` optionnels | `source` obligatoire, `source_url` optionnel | `sources[]`, `source_url`, `sources[].url`, provenance globale | `source` = module d'origine ; `source_url` = URL primaire, lien natif conservé |
| Statut épistémique | `FACT/INFERENCE/HYPOTHESIS/UNKNOWN` | `fact/inference/hypothesis/unknown` | `fiabilite` pour indicateurs, `statut` des projets = **avancement métier** | Conversion explicite en minuscules pour observations ; ne jamais transformer statut de projet en statut de preuve |
| Confiance | `confidence` libre | `confidence` 0..1 | `fiabilite` textuelle ou absente | Ne pas inventer score ; `null` si échelle non comparable |
| Temps de fait | `observedAt` | `observed_at` | `periode`, `calendrier`, dates des sources | `periode` n'est pas nécessairement un timestamp ISO ; préserver dans `extra` |
| Temps de collecte | `createdAt`, `updatedAt` (cas) | `retrieved_at` | `genere_le`, `sources[].verifie_le` | Génération de l'export ≠ collecte de la source ≠ observation du fait |
| Géographie | `entityId` sans géométrie contractuelle | `geometry` libre (commentaire GeoJSON) | `lieu_id`, `territoires`, lieux hiérarchiques | Résoudre les références, ne pas inventer des coordonnées |
| Relations | `from,to,predicate` | `relations[]` objets non contraints | `parent`, `lieu_id` | Adapter vers `{type,target_id}` avec provenance du prédicat natif |
| Validation | `humanValidated` booléen | pas de valideur requis dans schéma | dates et source, pas de signature commune | Ajouter validation datée et identité autorisée dans `extra` ou journal séparé |
| Licence | absente | `license` | dépend de la source externe | `null` tant que non vérifiée ; ne pas inférer licence de données depuis licence du code |
| Contradiction | relation libre | `relations[]` générique | `contradictions[]` explicites | Objet canonique distinct `contradiction` avec les deux assertions référencées |
| Données non mappées | `notes[]`, `details` | constructeur ignore les champs inconnus | `vision`, `statistiques`, budgets, financeurs, lacunes | Enveloppe `original`/référence au blob source + `extra` versionné pour conversion sans perte |

## 4. Audit ciblé du code d'adaptation

### 4.1 `canonical.py` : fonctions et effets

- `enregistrement(identifiant,type_,source,statut='unknown',label='',**reste)` crée un dictionnaire canonique, en ignorant les champs inconnus.
- `valider(rec)` vérifie les quatre champs obligatoires, l'enum `status`, la confiance et le préfixe de date. **Ce n'est pas un validateur JSON Schema complet** ; le schéma n'impose lui-même ni `additionalProperties:false` ni structure stricte pour `geometry`/`relations`.
- `geometrie_point(lon,lat)` convertit en nombres mais ne vérifie pas les bornes géographiques (-180..180/-90..90).
- `depuis_preuve(p,cas_id)` convertit `fiabilite A/B→fact, C→inference, D→hypothesis, X→unknown`, et `confiance haute/moyenne/faible→0.9/0.6/0.3`.
- `depuis_point`, `depuis_indicateur`, `depuis_profil`, `depuis_decision`, `depuis_action`, `depuis_outil` sont des adaptateurs de lecture, pas des preuves que les données sont vérifiées.

### 4.2 Défauts épistémiques à traiter avant toute fusion

1. **P0 : fiabilité de la source ≠ vérité de l'assertion.** `A/B→fact` dans `FIABILITE_OSINT` peut déclarer `fact` une preuve simplement parce qu'une source est de classe A/B. Il faut dissocier `source_reliability`, `claim_status`, `verification_status`.
2. **P0 : `depuis_indicateur` déclare `fact` dès que `valeur != None`.** La présence d'un nombre ne constitue pas une validation de sa source, de sa période ou de son calcul.
3. **P0 : `depuis_decision` et `depuis_action` déclarent `fact` pour tout objet transmis.** Cela peut signifier « décision enregistrée » mais non « contenu vrai » ou « action exécutée » ; typer explicitement le fait de consignation.
4. **P1 : `depuis_preuve` affecte `observed_at = collecte_le`**, alors que l'horodatage de collecte peut être distinct de l'événement observé. Le `retrieved_at` peut reprendre `collecte_le`, mais `observed_at` doit rester inconnu sans date du fait.
5. **P1 : `valider` accepte une chaîne numérique pour `confidence` et une date seulement préfixée `YYYY-MM-DD`** ; la conformité JSON Schema et la normalisation ISO doivent être testées séparément.
6. **P1 : `depuis_point` crée un statut `fact` par défaut hors `etat='à vérifier'`**, même si la source, les coordonnées et l'état de vérification ne sont pas renseignés.
7. **P1 : `enregistrement` ignore les champs non reconnus** ; l'export canonique seul n'est donc pas une sauvegarde réversible des dossiers et des données territoriales.

### 4.3 `osint/router.py` : endpoints et validation

- GET `/api/osint/categories`, `/registres`, `/besoins`, `/outils`, `/outils/:oid`, `/cadre` : catalogue descriptif.
- GET/POST `/api/osint/cas`, GET/PUT/DELETE `/api/osint/cas/:cid` : CRUD sur `store` ; `creer_cas` définit `titre,question,objet,perimetre,cadre,statut,responsable,preuves,notes,cree_le`.
- POST `/api/osint/cas/:cid/preuve`, DELETE `/api/osint/cas/:cid/preuve/:pid` : vérification minimale de `source` non vide, mais pas de validation de l'URL, de `fiabilite`, du schéma de preuve ou du niveau de confiance.
- POST `/api/osint/cas/:cid/generer` : note de synthèse via `docsgen.render`, écriture de document ; aucune vérification d'autorisation/contrôle d'accès visible dans **ce module seul** (contrôles transversaux non audités).
- GET `/api/osint/tableau` : compte cas, outils et preuves.
- `canonique(store,cfg=None)` projette les preuves stockées vers `canonical.depuis_preuve`. Le paramètre `cfg` n'est pas exploité dans le corps lu.
- Le `PUT` accepte tout champ sauf `id` via `store.update` ; vérifier les protections au niveau du store et du routeur HTTP avant toute exposition réseau.

## 5. Contrat de convergence proposé (non codé)

```text
Source brute immuable (Git blob / document / API, horodatée)
  -> Ingestion avec source, licence, hash, temps de collecte
    -> Entité métier conservée dans son format natif
      -> Projection CanonicalRecord avec id stable et provenance
        -> Assertion/observation distincte de la fiabilité de sa source
          -> Contradictions et validations liées par identifiants
            -> Vue Watchtower / Carré d'As / OSINT sans perte de référence
              -> Export réversible (source brute + mapping + version + journal)
```

### Invariants à tester

- Un `FACT` de démonstration ne doit jamais devenir un fait territorial.
- Un indicateur `valeur=0` doit rester présent ; une valeur non nulle sans source ne doit pas être promue en fait.
- Le `statut` d'un chantier (`prévu`, `en cours`, `livré`) ne doit jamais alimenter `status` épistémique.
- `source_reliability=A` ne suffit pas à établir `claim_status=fact`.
- `retrieved_at` et `observed_at` doivent rester distincts.
- `commune:34108` doit conserver son identité à travers les vues et ne jamais être confondu avec `atlas:frontignan` sans relation explicite.
- Deux relations identiques doivent être dédupliquées selon une clé déterministe.
- Export → import → export conserve source originale, références, contradiction, licence, dates et inconnus.
- Tester entrées hostiles HTML, CSV, JSON, IDs dupliqués, dates invalides et géométries hors bornes.

## 6. Décisions, limites et prochain lot

- **Décision documentaire** : préférer `CanonicalRecord` comme **vue de transport**, pas comme remplacement des objets métier. Préserver les formats originaux et versionner les adaptateurs.
- **Non décidé** : modèle canonique d'assertion, schéma de contradiction, vérification humaine, permissions et politique d'export.
- **Non testé** : runtime Python/JS, API HTTP, intégration Cesium, CI, matériel Windows/Android, droits effectifs et qualité des sources externes.
- **Prochain lot** : lire `carredas/store.py`, `carredas/httpsrv.py`, `carredas/modules/osint/registries.py` et les tests associés ; contrôler les validations et droits réels, puis proposer tests automatisés de conversion sans perte. Examiner séparément les nouvelles branches BTP/Watchtower postérieures au snapshot du 22 novembre.
