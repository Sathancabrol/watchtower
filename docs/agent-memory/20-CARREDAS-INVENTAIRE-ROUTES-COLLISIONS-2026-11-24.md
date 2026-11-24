---
title: "Carré d'As — inventaire statique des routes et collisions"
created: 2026-11-24
status: code-read-static-analysis
tags: [carredas, watchtower, http, audit]
---

# Carré d'As — inventaire des routes HTTP

Suite de [[19-CARREDAS-ROUTER-DISPATCH-SECURITE-2026-11-24]] et [[18-CARREDAS-MANIFESTES-ROUTES-CHARGEMENT-2026-11-24]]. Analyse des décorateurs littéraux sur `Sathancabrol/monorepo@arena/0034230e-monorepo`, sans démarrer le serveur. Les autres plugins et routes dynamiques restent hors couverture.

## Sources

- [carredas/server.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/server.py) — blob `b58ea90add373fdb04e595229054e920fe3ada88`
- [carredas/modules/meeting/router.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/meeting/router.py) — blob `e017142aca01f644ea7ac88f5ac1c503e238f38c`
- [carredas/modules/watchtower/router.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/watchtower/router.py) — blob `a04a4c0bb02a2113b1f82e5cffb7abf4b6570df4`
- [carredas/modules/osint/router.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/osint/router.py) — blob `83cf39e8a373671de9ea10137f0f74bf314d2c14`
- [carredas/modules/laplace/router.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/laplace/router.py) — blob `0af1268d402bfaa8e0ebcf98b138bd80bad55512`

## Registre extrait automatiquement

79 décorateurs reconnus. Les paramètres ci-dessous sont ceux de la signature Python, pas un schéma de corps HTTP. Ordre local conservé.

| Module | Ligne | Méthode | Chemin | Handler | Signature |
|---|---:|---|---|---|---|
| server.py | 57 | GET | `/api/health` | `sante` | `req` |
| server.py | 63 | GET | `/api/infos` | `infos` | `req` |
| server.py | 72 | GET | `/api/config` | `lire_config` | `req` |
| server.py | 76 | GET | `/api/themes` | `themes` | `req` |
| server.py | 107 | PUT | `/api/config` | `ecrire_config` | `req` |
| server.py | 149 | GET | `/api/modules` | `modules` | `req` |
| server.py | 166 | GET | `/api/canonique/schema` | `canon_schema` | `req` |
| server.py | 174 | POST | `/api/canonique/valider` | `canon_valider` | `req` |
| server.py | 185 | GET | `/api/canonique/admissibilite` | `canon_admissibilite` | `req` |
| server.py | 207 | GET | `/api/canonique` | `canonique` | `req` |
| server.py | 231 | GET | `/api/tableau` | `tableau` | `req` |
| server.py | 269 | GET | `/api/fichiers` | `liste_fichiers` | `req` |
| server.py | 281 | GET | `/api/fichiers/:nom` | `telecharger` | `req, nom` |
| server.py | 289 | DELETE | `/api/fichiers/:nom` | `supprimer_fichier` | `req, nom` |
| server.py | 298 | GET | `/api/journal` | `journal` | `req` |
| server.py | 302 | GET | `/api/events` | `events` | `req, emit` |
| server.py | 322 | GET | `/api/mise-a-jour` | `maj` | `req` |
| server.py | 327 | POST | `/api/mise-a-jour/appliquer` | `appliquer` | `req` |
| server.py | 334 | POST | `/api/mise-a-jour/annuler` | `annuler` | `req` |
| server.py | 340 | POST | `/api/sauvegarde` | `sauvegarde` | `req` |
| server.py | 348 | GET | `/api/sauvegardes` | `sauvegardes` | `req` |
| modules/meeting/router.py | 44 | POST | `/api/meeting` | `creer` | `req` |
| modules/meeting/router.py | 51 | GET | `/api/meeting` | `lister` | `req` |
| modules/meeting/router.py | 55 | GET | `/api/meeting/gabarits` | `gabarits` | `req` |
| modules/meeting/router.py | 60 | GET | `/api/meeting/:id` | `lire` | `req, id` |
| modules/meeting/router.py | 65 | PUT | `/api/meeting/:id` | `maj` | `req, id` |
| modules/meeting/router.py | 72 | DELETE | `/api/meeting/:id` | `supprimer` | `req, id` |
| modules/meeting/router.py | 76 | POST | `/api/meeting/:id/statut` | `statut` | `req, id` |
| modules/meeting/router.py | 85 | POST | `/api/meeting/:id/segment` | `segment` | `req, id` |
| modules/meeting/router.py | 95 | POST | `/api/meeting/:id/note` | `note` | `req, id` |
| modules/meeting/router.py | 102 | GET | `/api/meeting/:id/suggestions` | `suggestions` | `req, id` |
| modules/meeting/router.py | 106 | POST | `/api/meeting/:id/suggestion/:sid/accepter` | `accepter` | `req, id, sid` |
| modules/meeting/router.py | 113 | POST | `/api/meeting/:id/suggestion/:sid/refuser` | `refuser` | `req, id, sid` |
| modules/meeting/router.py | 117 | POST | `/api/meeting/:id/item` | `ajouter_item` | `req, id` |
| modules/meeting/router.py | 125 | PUT | `/api/meeting/:id/item/:kind/:iid` | `modifier_item` | `req, id, kind, iid` |
| modules/meeting/router.py | 130 | DELETE | `/api/meeting/:id/item/:kind/:iid` | `supprimer_item` | `req, id, kind, iid` |
| modules/meeting/router.py | 135 | POST | `/api/meeting/:id/budget` | `ajouter_budget` | `req, id` |
| modules/meeting/router.py | 140 | DELETE | `/api/meeting/:id/budget/:bid` | `supprimer_budget` | `req, id, bid` |
| modules/meeting/router.py | 144 | POST | `/api/meeting/:id/planning` | `ajouter_tache` | `req, id` |
| modules/meeting/router.py | 149 | DELETE | `/api/meeting/:id/planning/:tid` | `supprimer_tache` | `req, id, tid` |
| modules/meeting/router.py | 154 | POST | `/api/meeting/:id/generer` | `generer` | `req, id` |
| modules/meeting/router.py | 196 | GET | `/api/meeting/:id/documents` | `documents` | `req, id` |
| modules/meeting/router.py | 201 | GET | `/api/meeting/:id/export` | `exporter` | `req, id` |
| modules/meeting/router.py | 210 | GET | `/api/meeting/:id/stream` | `stream` | `req, emit, id` |
| modules/meeting/router.py | 224 | GET | `/api/meeting/:id/resume` | `resume` | `req, id` |
| modules/meeting/router.py | 244 | POST | `/api/meeting/:id/analyser` | `analyser` | `req, id` |
| modules/watchtower/router.py | 73 | GET | `/api/carto/couches` | `lister_couches` | `req` |
| modules/watchtower/router.py | 89 | GET | `/api/carto/groupes` | `groupes` | `req` |
| modules/watchtower/router.py | 94 | GET | `/api/carto/sources` | `sources` | `req` |
| modules/watchtower/router.py | 124 | GET | `/api/carto/sources/:sid` | `source` | `req, sid` |
| modules/watchtower/router.py | 134 | GET | `/api/carto/couches/:cid` | `couche` | `req, cid` |
| modules/watchtower/router.py | 142 | GET | `/api/carto/vues` | `vues` | `req` |
| modules/watchtower/router.py | 146 | POST | `/api/carto/vue` | `sauver_vue` | `req` |
| modules/watchtower/router.py | 164 | DELETE | `/api/carto/vue/:vid` | `supprimer_vue` | `req, vid` |
| modules/watchtower/router.py | 169 | GET | `/api/carto/points` | `points` | `req` |
| modules/watchtower/router.py | 173 | POST | `/api/carto/points` | `ajouter_point` | `req` |
| modules/watchtower/router.py | 195 | DELETE | `/api/carto/points/:pid` | `supprimer_point` | `req, pid` |
| modules/watchtower/router.py | 200 | GET | `/api/carto/annotations` | `annotations` | `req` |
| modules/watchtower/router.py | 204 | POST | `/api/carto/annotations` | `ajouter_annotation` | `req` |
| modules/watchtower/router.py | 215 | DELETE | `/api/carto/annotations/:aid` | `supprimer_annotation` | `req, aid` |
| modules/watchtower/router.py | 220 | GET | `/api/carto/territoire` | `territoire` | `req` |
| modules/osint/router.py | 64 | GET | `/api/osint/categories` | `categories` | `req` |
| modules/osint/router.py | 73 | GET | `/api/osint/registres` | `registres` | `req` |
| modules/osint/router.py | 80 | GET | `/api/osint/besoins` | `besoins` | `req` |
| modules/osint/router.py | 95 | GET | `/api/osint/outils` | `outils` | `req` |
| modules/osint/router.py | 116 | GET | `/api/osint/outils/:oid` | `outil` | `req, oid` |
| modules/osint/router.py | 123 | GET | `/api/osint/cadre` | `cadre` | `req` |
| modules/osint/router.py | 129 | GET | `/api/osint/cas` | `lister_cas` | `req` |
| modules/osint/router.py | 133 | POST | `/api/osint/cas` | `creer_cas` | `req` |
| modules/osint/router.py | 154 | GET | `/api/osint/cas/:cid` | `lire_cas` | `req, cid` |
| modules/osint/router.py | 159 | PUT | `/api/osint/cas/:cid` | `maj_cas` | `req, cid` |
| modules/osint/router.py | 166 | DELETE | `/api/osint/cas/:cid` | `supprimer_cas` | `req, cid` |
| modules/osint/router.py | 171 | POST | `/api/osint/cas/:cid/preuve` | `ajouter_preuve` | `req, cid` |
| modules/osint/router.py | 197 | DELETE | `/api/osint/cas/:cid/preuve/:pid` | `supprimer_preuve` | `req, cid, pid` |
| modules/osint/router.py | 208 | POST | `/api/osint/cas/:cid/generer` | `generer` | `req, cid` |
| modules/osint/router.py | 274 | GET | `/api/osint/tableau` | `tableau` | `req` |
| modules/laplace/router.py | 63 | GET | `/api/laplace/etat` | `etat` | `req` |
| modules/laplace/router.py | 74 | GET | `/api/laplace/memoire` | `memoire` | `req` |
| modules/laplace/router.py | 83 | POST | `/api/laplace/parler` | `parler` | `req` |

## Analyse de chevauchement

Comparaison exécutée sur les 79 entrées : même méthode, même nombre de segments, segments égaux ou paramétrés. 1 paire(s) compatible(s). Ce contrôle ne couvre pas les métacaractères regex, les routes dynamiques ni le wildcard statique.

- GET `/api/meeting/gabarits` (ligne 55) / `/api/meeting/:id` (ligne 60). Le premier décorateur est enregistré avant le second dans ce fichier.

Le routeur choisit le premier match (voir audit 19). Le cas Meeting gabarits est donc correctement priorisé dans le code lu ; réserver ce segment pour les identifiants métier. Les méthodes différentes ne constituent pas des collisions. Watchtower utilise le préfixe réel /api/carto, et non /api/watchtower. Le wildcard statique est ajouté après les modules dans server.py : il ne masque pas les routes API GET précédentes, mais peut traiter les chemins GET inconnus. Aucun doublon exact ne peut être affirmé au-delà du périmètre extrait.

## Lacunes et tests

- Rechercher les autres plugins et lanceurs dans les arbres de branches ; les chemins carredas/__main__.py et carredas/README.md ont retourné 404 sur cette branche, sans preuve d'absence d'un lanceur ailleurs.
- Générer le registre réel à partir de Router.add dans un environnement isolé, comparer à cet inventaire et aux manifestes.
- Tester la résolution Meeting gabarits et ID, les slashs finaux, les méthodes distinctes et les routes GET inconnues.
- Vérifier les signatures SSE et les enregistrements non littéraux : extraction limitée aux quatre décorateurs simples.
- Aucun test HTTP, Windows, Android ou réseau exécuté. Aucun changement applicatif.

[[01-HUB-SUIVI-AGENTS]]
