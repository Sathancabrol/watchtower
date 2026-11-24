---
title: OLYMPUS — relais caméra et tests
date: 2026-11-24
status: code-observe
tags: [olympus, camera, audit, watchtower]
---
# OLYMPUS — relais caméra et tests

Suite de [[23-OLYMPUS-CLIENT-CAMERA-CONVERGENCE-2026-11-24]], [[22-OLYMPUS-CONTRATS-API-DIVERGENCES-2026-11-24]], [[01-HUB-SUIVI-AGENTS]].

## Provenance
Sathancabrol/monorepo, préfixe projects/olympus-studio/, refs [Mobile](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-mobile-preview-20261113/projects/olympus-studio) et [Fleet](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-fleet-247-20261113/projects/olympus-studio). SHA de blobs (pas de commits), identiques entre les deux refs pour les cinq fichiers suivants, lus par API GitHub.
| Chemin | SHA |
|---|---|
| src/shared-camera.js | 488265b218664d4dc47f62ea29db53b095585c0f |
| scripts/mobile-preview.mjs | df57c08db3bd30b9892a9cfa267e80f799ddac3d |
| scripts/shared-camera-relay.mjs | 075ff20447626cce46952390c0787aead77d946b |
| tests/camera-pool.test.mjs | fc83fd2d1f111e3ed46cbbecff73073c248e8da7 |
| tests/mobile-preview.test.mjs | ff885ae9a76f430b3be7392347545f4f4bfd0d0e |

Autres sources Mobile : server.mjs 1c61df148cae609c63b54a244dc4973bf8eb7e9d ; index.html d3a0db52c27b6dac73e61d71d06e899ac9161608 ; src/camera-pool.js 3c81482cbb5a52ac908f61de1f8be9eb9db1663e ; package.json 2c6dc0b2e7f226dbf5a134a2d3a1bd4c904e5182. Les chemins shared-camera.js et tests/camera-pool.test.mjs retournent 404 sur Studio. Aucun inventaire exhaustif d'arbre dans cette passe.

## Arbre fonctionnel
- index.html charge shared-camera.js comme module et fournit sharedCameras.
  - startLocal(): consentement explicite via bouton, acquireCamera('shared-preview',{preferRear:true}), vidéo muette, lecture, UUID flux et clé, publication.
  - publishFrame(): Canvas 640x360, JPEG qualité .58, POST, verrou busy, nouvelle tentative après 230 ms une fois requête terminée. Pas de débit garanti ni audio.
  - stopLocal(): annule timer, libère bail caméra, efface aperçu, DELETE best effort avec clé, pagehide.
  - refreshPeers(): GET liste toutes les 1700 ms, exclut flux propre, ajoute/supprime cartes.
  - addRemote(): image GET toutes les 280 ms si onglet visible et requête précédente terminée; bouton transmet HTMLImageElement au hook de scène LIVE.
  - removeRemote(): arrête intervalle, retire DOM, appelle hook de retrait.
- scripts/mobile-preview.mjs
  - createMobilePreviewServer({upstreamPort=8787}): valide port entier, retourne serveur HTTP Node; routes /api/live/* déléguées au relais avant restriction GET/HEAD.
  - Proxy: allowlist statique + /api/health, réécriture Host loopback, timeout 10 s, pas de transfert des POST privilégiés; /obs et ComfyUI non autorisés.
  - Entrée CLI: OLYMPUS_PORT et OLYMPUS_MOBILE_PORT, écoute 127.0.0.1:8788 par défaut; exposition privée Tailscale Serve à configurer séparément. Aucun accès public prévu.
- scripts/shared-camera-relay.mjs
  - createSharedCameraRelay({now=Date.now}): Map mémoire, horloge injectable, retourne handleCamera(req,res,url).
  - clean(): suppression des entrées âgées de plus de 12 s lors d'une requête (pas de timer autonome).
  - sameOriginWrite(): vérifie Sec-Fetch-Site si présent et Origin HTTP loopback ou HTTPS *.ts.net. Ce contrôle ne constitue pas une authentification utilisateur.
  - readFrame(req): flux Buffer, plafond 350000 octets, vérification marqueurs JPEG début/fin; pas de décodage.
  - send/deny: JSON ou JPEG, no-store, nosniff, CORP same-origin, X-Frame-Options DENY.
  - GET /api/live/streams -> {streams:[{id,name,ageMs}]} sans clé.
  - GET /api/live/frame?id=UUID -> JPEG ou 404.
  - POST /api/live/frame -> JPEG, UUID flux/clé en headers, nom filtré 40 caractères; 200 {ok,id}; 400 identifiants, 403 origine/clé, 415 type, 429 capacité/cadence, 413 lecture.
  - DELETE /api/live/frame?id=UUID -> clé propriétaire si entrée existante, 200 {ok:true}.
  - Limites nominales: 4 flux, 150 ms entre écritures, 1,4 Mo de JPEG retenus si plafond respecté; pas une borne mémoire globale.

## Constats et décisions proposées (analyse statique)
| Priorité | Constat | Action |
|---|---|---|
| P1 | GET liste et images sans contrôle d'identité dans le relais | Vérifier ACL Tailnet et autorisations par destinataire; ne jamais exposer publiquement |
| P1 | Vérification capacité/clé/cadence avant await readFrame, écriture après | Sérialiser ou réserver les écritures, revérifier après lecture; tester concurrence et arrêt |
| P1 | Expiration paresseuse, dernière image conservée sans requête | Nettoyage périodique et politique explicite de rétention |
| P1 | POST client sans timeout explicite, busy partagé | AbortController, état par session, reprise après arrêt/redémarrage |
| P1 | Échec refreshPeers ne retire pas les cartes existantes | Marquer flux indisponible, arrêter polling et effacer image périmée |
| P2 | Origin autorise une famille de noms plutôt que l'origine exacte | Configurer origine attendue et vérifier la frontière proxy |
| P2 | Commentaire gateway read-only mais exception caméra volontaire | Documenter plan de contrôle distinct et consentement |
| P2 | Nom appareil en header HTTP, caractères Unicode potentiellement incompatibles | Encodage explicite et test multilingue |

Le serveur Studio 8787 ne possède pas les routes live; le relais 8788 est nécessaire. Les données sont des images de capteurs, pas des faits OSINT ni des éléments à stocker dans Git. Ne pas intégrer les images au graphe mémoire sans consentement et politique de conservation.

## Tests existants réellement retrouvés (non exécutés)
- tests/camera-pool.test.mjs : quatre tests Node, partage séquentiel, acquisition concurrente, fallback arrière/avant, refus permission sans retry. Fake MediaStream; pas de caméra réelle.
- tests/mobile-preview.test.mjs : un test HTTP avec upstream simulé, quatre GET autorisés, chemins privés refusés, POST ComfyUI refusé. Ne couvre pas les routes live.
- tests/shared-camera-relay.test.mjs : 404 sur Mobile, absence globale non démontrée.
- package.json : node --test, Node >=20, aucune dépendance npm déclarée.
- Tests à ajouter : expiration avec horloge injectée, limite de flux en concurrence, arrêt pendant publication, autorisations lecture/écriture, taille et type JPEG, panne proxy, récupération après timeout, arrêt acquisition pendante, caractères non ASCII, déconnexion multi-scènes.
- Recette cible : deux appareils autorisés, caméra fictive d'abord, vérification consentement/arrêt/latence, puis caméra réelle avec accord. Aucun test local, réseau Tailnet ou CI exécuté pendant cette passe.

## Reprise
Préserver le relais séparé du serveur privilégié et les fonctionnalités EDIT de Studio. Comparer les allowlists de fichiers après convergence, retrouver les autres scripts de déploiement et vérifier les tests relay dans les arbres complets. Ne pas fusionner les branches sur la seule base de cet audit.
