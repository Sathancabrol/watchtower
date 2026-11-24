---
title: "Carré d'As — Router HTTP, dispatch, collisions et limites"
created: 2026-11-24
document_type: static-code-audit
status: code-read-no-runtime
tags: [watchtower, carredas, http, router, security, provenance, obsidian]
---

# Carré d'As — audit profond du routeur et du dispatch HTTP

> [!warning] Niveau de preuve
> **CODE-LU**, sans lancement du serveur ni requête réseau. Référence : `Sathancabrol/monorepo@arena/0034230e-monorepo`. L'analyse est limitée aux fichiers ci-dessous et n'établit pas l'exposition actuelle du système. Les risques P0/P1 sont des priorités de vérification et non des exploitations démontrées.

## 1. Sources et empreintes blob

| Fichier | Blob SHA | Objet |
|---|---|---|
| [`carredas/httpsrv.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/httpsrv.py) | `5dcf5444084d12a102c6af506444ed3db8a2cd20` | Router, Request, Response, Handler, serveur |
| [`carredas/server.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/server.py) | `b58ea90add373fdb04e595229054e920fe3ada88` | Routes cœur, garde, modules, statique |
| [`carredas/modules/__init__.py`](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/__init__.py) | `3c6745e465010bcb3bda482eb0d312d94a30dff5` | Chargement dynamique des routes |

## 2. Graphe d'exécution vérifié

- `server.build(config=None, store=None, verbose=False) -> Router`
  - Initialise `cfg`, `Store`, `LLM`, `Router`, puis affecte `router.garde = _garde_acces`.
  - Déclare les routes cœur avec les décorateurs `router.get/post/put/delete`.
  - `load_all(router,ctx)` importe les routeurs des plugins et exécute `register(router,ctx)`.
  - `router.static("/", ICI/"ui", index="index.html", spa=False)` est ajouté en dernier.
- `Router.add(method, pattern, handler, stream=False)`
  - Convertit le pattern en regex via `_compile`.
  - Ajoute le quadruplet `(method.upper(), regex, handler, stream)` dans une liste ordonnée.
  - **Aucune détection de doublon ou collision** dans cette fonction.
- `Router.resolve(method,path)`
  - Itère dans l'ordre d'enregistrement et renvoie la **première** regex correspondant à la méthode.
  - Une route ultérieure identique, ou chevauchant une route paramétrée précédente, peut être masquée.
- `Handler._dispatch(head_only=False)`
  - Lit d'abord le corps via `_request() -> _read_body()`.
  - Appelle ensuite `router.garde(req)`; en cas d'exception de garde, pose `refus=None` et poursuit (**fail-open**).
  - Résout méthode + chemin ; stream → `_sse`, sinon exécute le handler.
  - Convertit les retours : `Response`, `dict/list` JSON, `tuple(data,status)` JSON, `None` en `{"ok":true}`, autres en texte.
- `Handler.do_HEAD` appelle `_dispatch(head_only=True)` mais `req.method` reste `HEAD`.
  - **Conséquence :** les routes uniquement enregistrées en `GET` ne sont pas résolues pour HEAD ; la réponse attendue est 404 (sauf route HEAD explicite).
- `Handler.do_OPTIONS` répond directement 204 avec CORS `*`, sans `_dispatch` ni garde.
  - OPTIONS ne lance pas les handlers applicatifs, mais contourne toute politique de garde ou d'origine sur la pré-vérification.
- `_sse(handler,params)` envoie immédiatement les en-têtes de streaming, puis appelle `handler(self._request_without_body(), emit, **params)`.

## 3. Matrice de risques et correctifs proposés

| ID | Priorité | Constat dans le code | Test reproductible à créer | Correction cible |
|---|---|---|---|---|
| HTTP-01 | P0 | Exception de `router.garde` → `refus=None` → traitement poursuivi | Garde levant `RuntimeError`, handler sensible compteur | Répondre 500/503 ou 403 ; journaliser sans exposer le détail |
| HTTP-02 | P1 | `_read_body` accepte `Content-Length` et chunked sans limite explicite | Requête dépassant plafond, chunked et en-tête invalide | Limite totale et par chunk, délais et erreurs 400/413 |
| HTTP-03 | P1 | `Router.add` empile sans collision ; `resolve` premier match | Deux GET identiques, route `/:id` avant `/special` | Diagnostic de doublons et ambiguïtés au build ; refuser ou arbitrer explicitement |
| HTTP-04 | P1 | `do_OPTIONS` émet `Access-Control-Allow-Origin: *` indépendamment de la config | Préflight d'origine externe avec et sans token | Politique CORS explicite, origines autorisées, même stratégie d'accès |
| HTTP-05 | P1 | `_dispatch` lit le corps avant garde | Handler gardé, gros corps non autorisé | Vérification des métadonnées et quotas avant lecture du corps |
| HTTP-06 | P1 | Exceptions de handler renvoyées au client dans `Response.error(f"{type}: {exc}",500)` | Exception contenant un chemin ou fragment de configuration | Message public générique, détail réservé au journal protégé |
| HTTP-07 | P2 | HEAD ne réutilise pas GET ; `_send(head_only)` calcule Content-Length sur corps vide | GET /api/health vs HEAD /api/health | Résoudre HEAD sur GET sans exécuter les effets de bord ; conserver longueur cohérente |
| HTTP-08 | P2 | `Request.json` absorbe les erreurs de décodage/JSON et renvoie `{}` | Corps JSON invalide vers PUT /api/config | Distinguer 400 JSON invalide et objet vide intentionnel |
| HTTP-09 | P2 | `_compile` ne protège pas les métacaractères regex littéraux du pattern | Pattern contenant `.`, `(`, `[` | Parser les segments et échapper les portions littérales |
| HTTP-10 | P2 | `_sse` écrit `event: {event}` sans assainir les sauts de ligne du nom | Événement dont le nom contient CR/LF | Valider le nom de canal avant émission |
| HTTP-11 | P1 | `_garde_acces` accepte le token en query string et exempte `127.0.0.1`, `::1`, `localhost`, chaîne vide | Vérifier logs/proxy local et URLs tokenisées | Préférer Authorization, définir frontières de confiance et token obligatoire sur interfaces réseau |
| HTTP-12 | P1 | `GET /api/config` renvoie `cfg` brut | Config contenant une valeur sensible fictive | Filtrer secrets et limiter l'accès aux paramètres sensibles |

**Important :** la réponse 204 OPTIONS et le défaut HEAD sont des comportements du code lu, pas des résultats de tests réseau. Les chevauchements entre routes restent à inventorier par inspection complète de tous les plugins. Les risques dépendent du déploiement (liaison loopback par défaut, reverse proxy, authentification).

## 4. Points positifs constatés

- Le service est lié par défaut à `127.0.0.1` dans `make_server` et `serve` lorsque l'appelant ne spécifie pas d'hôte.
- Les routes statiques sont enregistrées après les routes API ; `Router.resolve` priorise donc normalement l'API.
- Le service statique vérifie `target.relative_to(base.resolve())` pour refuser les sorties de répertoire.
- `Response.file` détermine un type MIME et `_send` ajoute `X-Content-Type-Options: nosniff`.
- `_sse` arrête l'écriture après déconnexion et `server.events` retire son abonné dans `finally`.

## 5. Arbre de tests de contrat

- **Démarrage :** construire un Router minimal sans accès disque ; inspecter la table de routes, les méthodes et la résolution.
  - Doublons exacts : observer la priorité premier-enregistré.
  - Paramètres et statique : tester `/api/meeting/:id`, `/api/meeting/gabarits`, `/api/health` et `/*`.
  - HEAD / GET / OPTIONS : comparer status, headers, CORS et garde.
- **Authentification :** garde qui retourne `Response.error`, garde qui lève, token absent, origine loopback, origine distante.
  - Vérifier que les handlers sensibles ne sont jamais exécutés en cas de refus/exception.
- **Entrées :** JSON malformé, corps vide, en-tête Content-Length invalide, taille excessive, chunked tronqué.
  - Établir les bornes de temps/mémoire avec serveur isolé et données factices.
- **Streaming :** SSE normal, déconnexion, canal invalide, flux sans émission.
- **Exposition :** config factice avec secret sentinelle, journaux, fichiers et préflight.

## 6. Décisions et prochaines recherches

1. **Sécurité d'abord :** écrire les tests HTTP-01, HTTP-02, HTTP-03 et HTTP-12 avant de corriger la logique applicative.
2. **Registre :** obtenir une table machine-readable `(module, méthode, pattern, ordre, handler)` à partir de `Router.add`, puis détecter collisions exactes et chevauchements.
3. **Points d'entrée :** rechercher le lanceur qui appelle `serve` ou `make_server`, et la configuration effective du `host`.
4. **Branches :** comparer la version `arena/0034230e-monorepo` à `monorepo/main` et aux branches plus récentes ; ne pas transférer ces conclusions sans vérification.
5. **Runtime :** aucun test Windows, Android, Tailscale, réseau ou charge réalisé lors de cette passe.

## 7. Continuité Obsidian

- [[18-CARREDAS-MANIFESTES-ROUTES-CHARGEMENT-2026-11-24]] — contrat du chargeur et dérive des manifestes.
- [[17-CARREDAS-CONFIG-MODULES-UPDATER-2026-11-23]] — configuration, plugins et mise à jour.
- [[16-CARREDAS-CABLAGE-ACCES-FICHIERS-2026-11-23]] — garde et fichiers.
- [[15-OSINT-STORE-HTTP-REGISTRES-AUDIT-2026-11-23]] — stockage et routes OSINT.
- [[01-HUB-SUIVI-AGENTS]] — entrée canonique pour reprise.

**Ce document ne modifie aucun code applicatif.**
