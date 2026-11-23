---
title: "Carré d'As — audit stockage, HTTP et registres OSINT"
created: 2026-11-23
document_type: code-security-and-integration-audit
status: code-inspected-runtime-not-tested
tags: [watchtower, carredas, osint, storage, http, security, provenance, agent-memory]
---
# Carré d'As — persistance, serveur HTTP et registre OSINT

> [!warning] Périmètre
> Lecture directe de quatre fichiers Python de `Sathancabrol/monorepo`, branche `arena/0034230e-monorepo`, le 23 novembre 2026. Constats **statiques** sur ces blobs ; aucun serveur, test d'intégration, contrôle de droits global ou disque Windows n'a été exécuté. La configuration applicative qui installe `router.garde` n'a pas été auditée : les risques d'accès non autorisé ci-dessous sont **conditionnels**, pas des vulnérabilités confirmées d'une instance exposée.

## 1. Preuves exactes

| Fichier | SHA blob | Lien |
|---|---|---|
| `carredas/store.py` | `dd370e7414328e018a45b64deb4ff746aa98a367` | [source](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/store.py) |
| `carredas/httpsrv.py` | `5dcf5444084d12a102c6af506444ed3db8a2cd20` | [source](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/httpsrv.py) |
| `carredas/modules/osint/registries.py` | `5ea15bcec70a726e61d624369b55b119de43ffd8` | [source](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/registries.py) |
| `carredas/modules/osint/router.py` | `83cf39e8a373671de9ea10137f0f74bf314d2c14` | [source](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) |

Voir [[14-CONVERGENCE-OSINT-CANONICAL-INTEL-2026-11-23]] et [[13-OSINT-WORKBENCH-AUDIT-CODE-2026-11-23]].

## 2. Arborescence des composants et fonctions

- **Carré d'As → persistance → `store.py`**
  - `slug(text,fallback)` → normalisation NFKD/ASCII, caractères non alphanumériques vers `-`.
    - Conséquence : `"école"` et `"ecole"` donnent la même clé ; collisions de fichiers possibles entre IDs distincts.
  - `new_id(prefix)` → préfixe + dix caractères hexadécimaux de UUID4.
    - Conséquence : ID probabiliste, non déterministe, sans détection de collision au moment du `put`.
  - `Store(root)` → création du dossier racine, `threading.RLock` local au processus.
    - `dir(collection)` → crée le dossier slugifié.
    - `path(collection,record_id)` → construit `<root>/<collection>/<slug(id)>.json`.
    - `_write(path,data)` → JSON UTF-8, fichier temporaire `.<pid>.tmp`, `os.replace`.
      - Atomique pour remplacement sur le même système de fichiers, mais **pas** une transaction entre fichiers, ni une garantie de durabilité disque après coupure sans `fsync`.
      - Deux instances/processus peuvent utiliser le même nom temporaire et le verrou Python ne les synchronise pas.
    - `put` → force `id`, définit `cree_le` si absent et `modifie_le`, écrase l'enregistrement existant.
    - `create` → reprend `data.id` s'il existe, sinon génère un ID ; peut écraser un ID déjà existant.
    - `get` → `None` si absent **ou** si JSON corrompu/illisible ; erreurs non différenciées.
    - `delete` → suppression définitive, pas de corbeille/versionnement.
    - `all` → charge tous les JSON, trie par `cree_le` ; un fichier corrompu est silencieusement ignoré.
    - `find` → filtre sur `all` en mémoire.
    - `update` → `rec.update(patch)`, puis `put`; validation de schéma et champs autorisés laissée à l'appelant.
    - `blob_dir` et `write_blob(name,data,collection)` → écrit dans `root/_/<collection>/<name>`.
      - **P0 conditionnel** : `name` n'est ni slugifié ni contraint au répertoire ; si une route accessible transmet un nom non fiable, traversée de chemin possible. Les appels observés dans `osint/router.py` fabriquent eux-mêmes le nom, mais celui-ci inclut `cas.id` issu d'une requête.
  - `iter_records(root)` → export itératif des JSON, sans signature ni traitement explicite de corruption.

- **Carré d'As → transport → `httpsrv.py`**
  - `_compile(pattern)` → paramètres `:id` et joker `*`, expression régulière.
  - `Request` → `q`, `json`, `text` ; `json` retourne `{}` en cas de JSON invalide, sans erreur 400.
  - `Response` → `json/text/html/file/redirect/error/not_found`.
  - `Router` → `add/get/post/put/delete/resolve/static`, garde optionnelle `router.garde`.
    - `static` utilise `Path.resolve` et `relative_to` pour bloquer la traversée hors répertoire : contrôle positif observé.
  - `Handler._read_body` → accepte Content-Length et chunked sans plafond explicite de taille.
    - **P1** : requête volumineuse peut épuiser mémoire ou threads si accessible au réseau.
  - `Handler._request` → URL décodée ; `_send` ajoute `X-Content-Type-Options: nosniff` et no-store.
  - `Handler._dispatch` → garde optionnelle, routage, réponse, erreurs 500.
    - **P0 conditionnel** : une exception dans `router.garde` est convertie en `refus=None` : le serveur continue le traitement (**fail-open**) au lieu de refuser.
    - **P1** : l'erreur 500 expose `type(exc).__name__` et `str(exc)` au client ; fuite possible de chemins/détails.
  - `Handler._sse` → flux d'événements ; vérifier auth et fin de connexion.
  - `Handler.do_OPTIONS` → réponse permissive `Access-Control-Allow-Origin: *` pour OPTIONS ; ne suffit pas à établir la politique CORS des réponses normales.
  - `make_server` / `serve` → écoute par défaut sur `127.0.0.1`, port libre par défaut, serveur multithread ; l'exposition réseau réelle dépend de l'appelant.

- **Carré d'As → OSINT → `registries.py`**
  - `chemin_registre` → chemin configuré ou `projects/watchtower/audit/reference/REGISTRE-OUTILS.json`, relatif à la racine du dépôt.
  - `charger_watchtower` → charge un objet JSON avec `outils` liste, sinon `None` ; ajoute `_chemin` au dictionnaire en mémoire.
  - `numero_categorie`, `_slug` → clés de catégorie.
  - `normaliser_outil_watchtower` → transforme catégorie, URL, installation, GPU, licence, risque, provenance et état.
    - `RISQUE_PAR_CATEGORIE` est une classification **statique par catégorie**, pas une analyse réelle de chaque outil.
    - `install[0]` et `urls[0]` supposent des listes ; types invalides peuvent changer la sémantique.
  - `_deviner_type` → heuristique par mots-clés Docker/winget/pip/npm/etc.
  - `categories_watchtower`, `besoins_watchtower` → projections catégories et liens besoin→outils.
  - `fusionner` → concatène registres local et Watchtower, sans déduplication explicite des outils, et conserve `meta` local.

- **Carré d'As → OSINT → `router.py`**
  - `register` charge une photographie du registre à l'initialisation ; changement du fichier source **non rechargé automatiquement**.
  - `creer_cas` prend `p.id` fourni par le client, puis `store.put` ; risque d'écrasement d'un cas existant.
  - `maj_cas` permet de modifier tout champ sauf `id` : notamment `preuves`, `responsable`, `statut`, `cree_le` ; pas de schéma local.
  - `ajouter_preuve` exige `source` non vide mais n'impose ni enum `fiabilite`, ni URL/date valides, ni provenance contrôlée.
  - `supprimer_preuve` et `supprimer_cas` effacent sans historique immuable dans le code inspecté.
  - `generer` → `docsgen.render` puis `store.write_blob`; nom contient `c.id` ; vérifier validation de l'ID et chemin d'export.
  - `canonique` → projection via `canonical.depuis_preuve`, avec les risques épistémiques de la note 14.

## 3. Priorisation : hypothèses de risque et portée

| Niveau | Point à vérifier/corriger | État |
|---|---|---|
| P0 | `router.garde` échoue en mode ouvert si la fonction de contrôle lève une exception | **CODE-LU** ; exposition dépend de l'installation de la garde |
| P0 | `write_blob` reçoit un nom sans validation de chemin ; cas OSINT fournit un ID client | **CODE-LU** ; chaîne exploitable à confirmer avec tests contrôlés |
| P1 | `create` et `put` écrasent les IDs existants, pas de création exclusive | **CODE-LU** |
| P1 | `slug` peut faire converger plusieurs identifiants distincts sur un même fichier | **CODE-LU** |
| P1 | corps HTTP sans plafond et JSON malformé transformé en objet vide | **CODE-LU** |
| P1 | détails d'exception renvoyés en 500, sans masquage des chemins | **CODE-LU** |
| P1 | preuve et dossier modifiables/supprimables sans historique au niveau du store | **CODE-LU** |
| P1 | registre Watchtower figé au démarrage, absence de déduplication explicite | **CODE-LU** |
| À vérifier | installation réelle de l'auth, ACL, limites réseau, reverse proxy, sauvegardes | **INCONNU** |

## 4. Contrats de tests proposés — non exécutés

1. `garde` levant `RuntimeError` doit retourner une erreur contrôlée 403/503, jamais appeler le handler.
2. Deux `create` avec le même ID doivent produire 409 ou une politique explicite de mise à jour, jamais un écrasement silencieux.
3. Tester IDs `"école"` / `"ecole"` : aucune collision silencieuse sur stockage.
4. `write_blob("../outside.json", ...)` doit être rejeté avant toute écriture ; tester aussi séparateurs Windows et absolus.
5. Vérifier que les exports OSINT refusent un ID hors grammaire et ne contournent pas `blob_dir`.
6. Content-Length et chunked dépassant une limite configurée doivent retourner 413.
7. JSON invalide doit retourner 400, sans créer de dossier.
8. `PUT /cas/:cid` ne doit pas remplacer `preuves` ou `cree_le` sans contrôle de rôle et journal d'audit.
9. Export→import doit préserver dates, licence, source, IDs, contradictions et version.
10. Un registre absent doit être signalé explicitement dans la santé du module, et un rechargement doit être testable.
11. Tester la concurrence multi-processus, crash pendant `os.replace`, récupération après corruption et sauvegarde.
12. Tester `make_server` sur localhost, puis la configuration réelle d'écoute et le contrôle d'accès, avant toute exposition réseau.

## 5. Décisions documentaires et prochain lot

- **Ne pas modifier l'application depuis cette branche d'audit** sans confirmer le propriétaire canonique et les tests.
- Préconiser un garde **fail-closed**, une validation stricte des IDs/chemins, une limite de corps HTTP, des permissions par opération et un journal append-only pour preuves et décisions.
- Distinguer disponibilité locale et exposition réseau : `127.0.0.1` par défaut est un contrôle positif, mais un proxy peut changer la surface d'accès.
- Prochain lot : rechercher le point de composition `router.garde` et les routes `/api/fichiers/:name`, inspecter les tests existants et comparer le code de la branche à `monorepo/main` ; vérifier si les protections existent ailleurs avant d'affirmer une faille exploitable.
