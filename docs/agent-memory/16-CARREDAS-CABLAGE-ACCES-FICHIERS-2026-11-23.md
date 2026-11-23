---
title: "Carré d'As — câblage des contrôles d'accès et routes de fichiers"
created: 2026-11-23
document_type: code-audit
status: static-inspection-no-runtime
tags: [watchtower, carredas, osint, security, http, provenance, agent-memory]
---
# Carré d'As — câblage HTTP et frontières de sécurité

> [!warning] Preuves et limites
> Audit statique de `Sathancabrol/monorepo`, branche `arena/0034230e-monorepo` ; aucune exécution de serveur ni attaque réalisée. `monorepo/main` ne possède pas les chemins `carredas/server.py`, `carredas/httpsrv.py`, `carredas/store.py` ou `carredas/modules/osint/router.py` aux chemins recherchés (404), donc **absence de comparaison de code homologue**, et non preuve que le module n'existe sous aucune autre forme.

## 1. Fichiers inspectés et empreintes

| Source | Blob SHA Git | Rôle |
|---|---|---|
| [`carredas/server.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/server.py) | `b58ea90add373fdb04e595229054e920fe3ada88` | Composition, garde d'accès, routes globales, fichiers, SSE, modules |
| [`carredas/httpsrv.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/httpsrv.py) | `5dcf5444084d12a102c6af506444ed3db8a2cd20` | Request, Response, Router, Handler |
| [`carredas/store.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/store.py) | `dd370e7414328e018a45b64deb4ff746aa98a367` | Store et blob |
| [`carredas/modules/osint/router.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) | `83cf39e8a373671de9ea10137f0f74bf314d2c14` | Routes et exports OSINT |

## 2. Arborescence fonctionnelle : configuration → garde → transport → modules

- `server.build(config=None,store=None,verbose=False)` : crée `Store`, `LLM`, `Router` et journal JSONL.
  - `cfg = config or paths.read_config()` : une configuration vide explicite est remplacée par le défaut.
  - `_garde_acces(req)` : **garde réellement installée** par `router.garde = _garde_acces` avant le chargement des modules.
    - `acces.token` vide → laisse passer toute requête, y compris distante, si le serveur est exposé.
    - `exiger_token_si_distant = false` → désactive cette vérification même avec token.
    - `req.client` dans `127.0.0.1`, `::1`, `localhost`, chaîne vide → exempté ; tout processus local peut donc appeler les routes.
    - Sinon : `Authorization: Bearer <token>` ou `?token=` ; comparaison `!=` simple, sans temporisation constante garantie.
    - La présence de token en query string expose potentiellement ce secret aux historiques, logs ou URL copiées ; privilégier l'en-tête Authorization.
    - Une exception de garde dans `httpsrv.Handler._dispatch` est absorbée et transforme le refus en `None` selon l'audit précédent : **fail-open statique confirmé au niveau du code**, mais déclenchement et exposition réelle non testés.
  - `ctx` : `store`, `config`, `llm`, `broadcast`, `engines`, `url`, `modules`.
  - `load_all(router,ctx)` : installe les routes métier, dont OSINT.
  - `router.static("/", ICI/"ui", index="index.html")` est ajouté **en dernier**, pour ne pas masquer les routes API.

## 3. Fichiers : frontière du téléchargement et de la suppression

- `GET /api/fichiers` : liste les éléments de `store.blob_dir("documents")` ; trie par date de modification ; renvoie au plus 200 fichiers. Le code ne montre ni filtrage par propriétaire ni rôle.
- `GET /api/fichiers/:nom` : `store.blob_dir("documents") / Path(nom).name` ; `Path(nom).name` réduit le risque de traversée simple **sur ce lecteur précis**. Le fichier est chargé entièrement par `Response.file`.
- `DELETE /api/fichiers/:nom` : même réduction à basename, suppression directe via `unlink()` ; aucune autorisation métier ni journal de suppression dans cette route.
- Le traitement du nom dépend de l'OS : les séparateurs Windows/Unix et les fichiers symboliques doivent être testés dans l'environnement cible. Aucun `resolve + relative_to` n'est appliqué à ces deux routes ; un lien symbolique dans le répertoire pourrait modifier la cible effective.
- La route de fichiers est limitée à la collection `documents`, tandis que `store.write_blob` accepte un paramètre `collection` ; **ne pas confondre** la protection basename de la route GET/DELETE avec celle de l'écriture de blob.
- `router.static` dans `httpsrv.py` utilise `resolve()` et `relative_to()` : contrôle de confinement positif à conserver.

## 4. Autres routes sensibles et hypothèses de menace

- `GET /api/config` renvoie la configuration `cfg` complète ; **si** elle contient `acces.token`, celui-ci est exposé aux clients autorisés ou exemptés localement. Vérifier la configuration réelle et prévoir une réponse publique expurgée.
- `PUT /api/config` applique `paths.patch_config(frag)`, recharge la configuration et réinitialise le LLM : modification sans rôle supplémentaire dans ce fichier.
- `GET /api/journal` renvoie `log.recent(int(req.q("limite",120)))` ; tester entrées non entières, limites extrêmes, données personnelles dans les logs.
- `GET /api/events` utilise un abonné `queue.Queue(maxsize=200)` par connexion ; examiner authentification, nettoyage des abonnés, déconnexions et saturation.
- `POST /api/sauvegarde` copie les données, avec `ignore_patterns("_*", "update", "backups")` : les pièces jointes sous `root/_/documents` sont **exclues** de cette sauvegarde. Une sauvegarde annoncée comme complète ne doit donc pas être présumée complète.
- `GET /api/canonique` peut rendre `enregistrements` complet avec `?complet=1` ; vérifier confidentialité et autorisation par objet, pas seulement par token global.
- `GET /api/health` renvoie `str(store.root)` ; fuite de chemin local possible si accès distant ouvert.

## 5. Matrice de constats (preuve statique ≠ exploitation)

| ID | Observation | Niveau / statut |
|---|---|---|
| SEC-16-01 | Garde effectivement affectée à `router.garde` | CODE-LU, correction du périmètre inconnu dans [[15-OSINT-STORE-HTTP-REGISTRES-AUDIT-2026-11-23]] |
| SEC-16-02 | Token vide ou contrôle distant désactivé autorise la requête | CODE-LU, exposition conditionnelle |
| SEC-16-03 | Garde peut être fail-open sur exception | CODE-LU, non reproduit |
| SEC-16-04 | `GET /api/config` renvoie `cfg` brut | CODE-LU, contenu réel inconnu |
| SEC-16-05 | Routes documents utilisent `Path(nom).name` | CODE-LU, atténuation partielle |
| SEC-16-06 | `DELETE /api/fichiers/:nom` sans rôle métier explicite | CODE-LU, garde globale seule |
| SEC-16-07 | Sauvegarde exclut `_*`, dont blobs sous `_/documents` | CODE-LU, risque de sauvegarde incomplète |
| SEC-16-08 | `main` n'a pas les chemins homologues inspectés | FETCH-404, pas une absence globale prouvée |

## 6. Tests à développer — non exécutés

1. `build(config)` doit installer une garde ; inspecter `router.garde`.
2. Garde avec token absent, token présent, client local, client distant, option désactivée : tableau de décisions attendu et documenté.
3. Injecter une garde qui lève une exception et vérifier que la route métier n'est **jamais** exécutée.
4. `GET /api/config` ne doit jamais renvoyer `acces.token` ou secrets d'autres fournisseurs.
5. Les opérations `PUT /api/config`, `DELETE /api/fichiers` et export complet exigent un droit explicite.
6. Nom de fichier `../`, séparateur Windows, symlink, dossier et fichier volumineux : vérifier confinement et erreurs contrôlées.
7. Sauvegarde puis restauration d'un cas OSINT **avec ses documents** : vérifier complétude, checksums et confidentialité.
8. Test SSE d'abonnés multiples et déconnexions ; pas de fuite de ressources.
9. Tester la limite du journal et les valeurs invalides sans 500 révélant des détails.
10. Contrôler le reverse proxy / Tailscale : `req.client` peut être loopback pour un client distant relayé, donc le seul critère d'IP n'est pas une preuve d'origine locale humaine.

## 7. Priorité de reprise

- P0 : garder l'authentification **fail-closed**, retirer les secrets de `/api/config`, établir les droits par route, contrôler les proxys.
- P1 : sauvegarde/restauration des blobs, limites des corps/réponses, symlinks et validation des chemins, journal d'audit des suppressions.
- P2 : tests de concurrence et de résilience SSE.
- Prochain lot : lire `carredas/paths.py`, `carredas/modules/__init__.py`, `carredas/cli.py` (si présent), les tests, et l'assemblage réseau effectif ; vérifier les valeurs par défaut et la surface accessible depuis Tailscale. Voir [[14-CONVERGENCE-OSINT-CANONICAL-INTEL-2026-11-23]].

**Règle :** cette note documente du code et des risques conditionnels ; elle ne prouve pas qu'un service distant est exposé ni qu'une exploitation a eu lieu.
