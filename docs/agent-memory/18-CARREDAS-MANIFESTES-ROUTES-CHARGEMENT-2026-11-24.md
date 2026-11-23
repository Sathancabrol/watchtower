---
title: "Carré d'As — contrat de chargement et dérive des manifestes"
created: 2026-11-24
document_type: static-code-audit
status: code-read-no-runtime
tags: [watchtower, carredas, obsidian, module-manifest, routes, audit, provenance]
---

# Carré d'As — chargeur, manifestes et routes réellement déclarées

> [!warning] Périmètre et épistémologie
> Lecture statique des fichiers de `Sathancabrol/monorepo@arena/0034230e-monorepo` le 24/11/2026. **Aucune exécution, aucun test réseau, aucune validation de disponibilité.** Le contenu des manifestes est déclaratif ; le code des routeurs fait foi sur les décorateurs observés, sous réserve du chargement réel.

## 1. Sources et empreintes Git blob

| Chemin GitHub sur la branche Arena | SHA du blob |
|---|---|
| [`carredas/modules/__init__.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/__init__.py) | `3c6745e465010bcb3bda482eb0d312d94a30dff5` |
| [`carredas/server.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/server.py) | `b58ea90add373fdb04e595229054e920fe3ada88` |
| [`carredas/paths.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/paths.py) | `45e4155e7e3b56c181c6a0a3bc66f997ef42e973` |
| [`carredas/modules/meeting/module.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/meeting/module.json) | `056e163ae1f9653be16014d8ec9faac8e96e407d` |
| [`carredas/modules/meeting/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/meeting/router.py) | `e017142aca01f644ea7ac88f5ac1c503e238f38c` |
| [`carredas/modules/watchtower/module.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/watchtower/module.json) | `ac79394fed3236d3cdaea7e7ba734968fa5287cb` |
| [`carredas/modules/watchtower/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/watchtower/router.py) | `a04a4c0bb02a2113b1f82e5cffb7abf4b6570df4` |
| [`carredas/modules/osint/module.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/module.json) | `09f8a6ea70a631cda9f1c65f84bcac7eb0bd71c1` |
| [`carredas/modules/osint/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) | `83cf39e8a373671de9ea10137f0f74bf314d2c14` |
| [`carredas/modules/laplace/module.json`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/laplace/module.json) | `0931b6cd056872b5f45ac7b07375902c39bda499` |
| [`carredas/modules/laplace/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/laplace/router.py) | `0af1268d402bfaa8e0ebcf98b138bd80bad55512` |

## 2. Arborescence du contrat de module

- `carredas/modules/__init__.py` — `discover(root=MODULES_DIR)`
  - Parcourt les sous-dossiers hors préfixes `_` et `.`.
    - Ne retient que ceux contenant `module.json`.
      - `Module.__init__` lit le JSON ; l'erreur de lecture est mémorisée dans `error`.
      - `id` = champ `id` ou nom du dossier.
      - `actif` = booléen de `manifest.actif`, défaut `True`.
      - `priorite` = conversion `int` du champ, défaut 50.
        - Un `priorite` invalide peut faire échouer le tri de `discover` : exception non capturée dans la propriété.
  - `load_all(router,ctx)` trie par priorité puis ID.
    - Ignore les modules `actif=false`.
    - `Module.load()` importe `carredas.modules.<dossier>.router` via `spec_from_file_location`.
      - Le code du plugin est exécuté dans le processus principal, sans isolation.
      - `Module.register()` appelle `register(router,ctx)`.
      - Si `canonique(store,cfg)` existe et est callable, la fonction est inscrite dans `ctx['canonique'][id]`.
        - Le serveur `_recs_canoniques` agrège ces fonctions et ajoute `source=mid` seulement si absent.
        - Les erreurs de fournisseurs sont journalisées et le reste continue.
    - `to_dict()` publie les métadonnées du manifeste et un indicateur `charge` pour les modules actifs.
- `carredas/server.py` — `build(config=None,store=None,verbose=False)`
  - Construit le routeur HTTP, la configuration, le stockage et le contexte.
  - Affecte `router.garde` à une fonction d'accès.
  - Enregistre les routes cœur, puis appelle `load_all(router,ctx)` à la fin de `build` (ligne 356).
  - `GET /api/modules` renvoie les états déclarés et de chargement.
  - `GET /api/canonique` agrège les objets exposés par les plugins.
- `carredas/paths.py`
  - `DEFAULT_CONFIG.modules.desactives=[]` existe.
  - **Écart potentiel** : le chargeur inspecté ne consulte pas cette liste. Il se base sur `module.json.actif`. L'interface de désactivation annoncée dans la configuration ne suffit donc pas à prouver la désactivation effective.
  - `DEFAULT_CONFIG.profil` apparaît deux fois : le premier profil territorial texte est remplacé par le dictionnaire de profil émetteur dans l'objet Python final. Tout consommateur attendant `agglo-thau` doit être contrôlé.

## 3. Matrice manifeste / routeur (contrat réellement constaté)

| Module | Routes annoncées dans `module.json` | Routes supplémentaires dans `router.py` | Écart concret |
|---|---|---|---|
| Meeting | `POST /api/meeting`, `GET /api/meeting`, `GET /api/meeting/:id`, segment, note, suggestion, item, generate, stream | `GET /gabarits`, `PUT /:id`, `DELETE /:id`, statut, suggestions, accepter/refuser, budget, planning, `POST /:id/generer`, documents, export, resume, analyser | Le manifeste annonce `/generate` alors que le routeur consulté expose `/generer`; la route `/suggestion/:sid` annoncée n'est pas la même que `/suggestion/:sid/accepter` ou `/refuser` |
| Watchtower | couches, groupes, vue, points, annotations | sources, source détaillée, couche, vues, suppression vue/points/annotations, territoire | Le manifeste sous-documente plusieurs routes effectives ; le routeur ne monte pas le moteur Cesium complet, il est une tête de pont API |
| OSINT | outils, catégories, cas, création de cas, preuve, générer | registres, besoins, outil détaillé, cadre, lecture/édition cas et autres routes dans le routeur | Le manifeste ne constitue pas un inventaire exhaustif des API |
| Laplace | parler, mémoire, état | Aucun écart identifié dans les trois décorateurs inspectés | Correspondance observée pour les trois routes |

**Prudence :** « route présente dans le code » n'est pas « route testée », et le manifeste peut être une présentation volontairement abrégée. Les écarts `generate/generer` et `suggestion` sont cependant des incompatibilités potentielles pour un client généré depuis le manifeste.

## 4. Risques et décisions d'architecture

1. **P1 — Schéma de manifeste absent dans le chargeur inspecté** : valider `id`, `priorite`, `actif`, `routes`, collisions et conformité des méthodes/chemins avant de charger.
2. **P1 — Contrat routes divergent** : générer la documentation des routes à partir des décorateurs/registre du Router et comparer automatiquement à `module.json` en CI ; ne pas corriger les noms à l'aveugle sans compatibilité clients.
3. **P1 — Désactivation incohérente** : clarifier l'autorité de `modules.desactives` vs `module.json.actif`, et ajouter test de non-chargement.
4. **P1 — Plugins de confiance uniquement** : ne pas charger de dossiers téléchargés/non approuvés ; vérifier source et provenance avant exécution.
5. **P2 — Profil polymorphe** : séparer `territoire.profil_id` et `emetteur.profil`, prévoir migration de config et tests consommateurs.
6. **P2 — Exposition API** : `GET /api/modules` est un état déclaratif/chargement, pas un test fonctionnel de chaque route.

## 5. Scénarios de tests à écrire (non exécutés)

- `discover` avec manifeste vide, JSON invalide, priorité non entière, doublons d'ID et dossiers masqués.
- `load_all` avec plugin actif, inactif, exception à l'import, exception dans `register`, et `canonique` qui échoue.
- `DEFAULT_CONFIG.modules.desactives=['osint']` : vérifier si OSINT est encore chargé, puis définir la règle voulue.
- Extraire les routes effectivement enregistrées et comparer au manifeste : méthodes, chemins, alias, paramètres.
- Tester `POST /api/meeting/:id/generer` et le chemin `/generate` annoncé : résultats attendus documentés.
- Tester le chargement des modules dans une installation portable, installée et dans une archive gelée.
- Tester le contrat `profil` avec un ancien fichier `config.json` et une configuration vierge.

## 6. Prochaine itération

Auditer l'implémentation de `Router` (détection des collisions, garde, parsing et dispatch), les manifestes des autres modules, puis les véritables points d'entrée (scripts de lancement, packaging, CI). Examiner ensuite les consommateurs de `profil` et les tests existants sur les branches divergentes.

Liens de contexte : [[17-CARREDAS-CONFIG-MODULES-UPDATER-2026-11-23]], [[16-CARREDAS-CABLAGE-ACCES-FICHIERS-2026-11-23]], [[14-CONVERGENCE-OSINT-CANONICAL-INTEL-2026-11-23]], [[01-HUB-SUIVI-AGENTS]].
