---
title: OLYMPUS — convergence client et caméra
date: 2026-11-24
status: code-lu
tags: [olympus, camera, watchtower, obsidian]
---
# OLYMPUS — convergence client et caméra

Suite de [[22-OLYMPUS-CONTRATS-API-DIVERGENCES-2026-11-24]], [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]] et [[01-HUB-SUIVI-AGENTS]]. Lecture statique, pas de runtime.

## Provenance
Dépôt Sathancabrol/monorepo, préfixe projects/olympus-studio/. SHA de blobs, pas de commits.
| Ref | Fichier | SHA |
|---|---|---|
| [Studio](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-studio-20261112/projects/olympus-studio) | src/app.js | e476a7ec4394bf752563e1b040936569f5472fac |
| [Fleet](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-fleet-247-20261113/projects/olympus-studio) | src/app.js | 54688452bd9955d23896580858c7db9d7dbb2839 |
| [Mobile](https://github.com/Sathancabrol/monorepo/tree/feat/olympus-mobile-preview-20261113/projects/olympus-studio) | src/app.js | 54688452bd9955d23896580858c7db9d7dbb2839 |
| Fleet et Mobile | src/camera-pool.js | 3c81482cbb5a52ac908f61de1f8be9eb9db1663e |
| Trois refs | LANCER_OLYMPUS.bat | 2d3c7984da4e67bca3281d5ec42922d4365c7299 |
| Trois refs | package.json | 2c6dc0b2e7f226dbf5a134a2d3a1bd4c904e5182 |
| Mobile | README.md | 51f095fdfabc3c129c8d20c804b8afc4fd4f46b0 |

## Comparaison
Studio app.js 70 262 caractères, 885 lignes (split LF, ligne finale comprise), Fleet/Mobile 53 406 caractères, 663 lignes, blobs identiques. Studio n'est pas un surensemble : Fleet/Mobile ont une gestion caméra partagée et des calques distants absents du client Studio inspecté.
| Capacité | Studio | Fleet/Mobile |
|---|---|---|
| POST /api/frame, GET /api/health, queue/job Comfy | oui | oui |
| GET /api/comfy/output, GET /api/integrations | oui (814,845) | non dans fetch extraits |
| Historique EDIT, interchange, bus événements, rendu PNG | imports présents | imports absents |
| Caméra locale | getUserMedia direct 1280x720 (484–486) | acquireCamera/releaseCamera (359–370) |
| Calque remote-webcam | absent du dispatch draw inspecté | draw 253, hooks 651–652 |
| Lanceur Windows | identique | identique |

## Arborescence de contrats
- src/app.js
  - loop(t): Canvas, cadence dessin 32 ms, JPEG OBS 150 ms, envoi asynchrone avec verrou sendingObs; POST /api/frame. Ne constitue pas une garantie de débit.
  - Studio exportEditorWebM({videoOnly=false}) ligne 270, exportEditorPngSequence() 331, downloadEditorAudioSource() 352; imports editor-export, edit-frame-renderer, png-directory-sink. Existence des fonctions, pas validation des médias.
  - Fleet/Mobile camera(): acquisition propriétaire local-webcam, attachement vidéo, play(), calque; release en cas d'échec et avant déchargement.
  - window.olympusAddRemoteCamera(id,name,image): recherche calque remote-webcam par remoteCameraId, remplace référence runtime ou crée calque. Ne prouve pas le transport réseau.
  - window.olympusRemoveRemoteCamera(id): supprime la référence runtime des calques correspondants de la scène courante; ne supprime pas les calques eux-mêmes.
- src/camera-pool.js (Fleet/Mobile)
  - createCameraPool(getUserMedia injectable): source, connecting, owners Set.
  - start(preferRear): contraintes idéales 640x360, arrière puis avant puis génériques si arrière préféré; retry limité aux erreurs NotReadableError, NotFoundError, OverconstrainedError, AbortError. Refus permission non réessayé.
  - acquire(owner,{preferRear=false}={}): propriétaire chaîne non vide; mutualise promesse en cours; ajoute owner après résolution; retourne MediaStream.
  - release(owner): retire owner; arrête toutes pistes si ensemble vide et source présente.
  - isActive(): au moins une piste vidéo live.
  - singleton export acquireCamera/releaseCamera/isCameraActive; partage dans un même contexte JS, pas entre appareils.
- LANCER_OLYMPUS.bat: vérifie présence node (pas sa version), ouvre navigateur avant node server.mjs, annonce loopback 8787; pas d'installation ni de vérification de disponibilité avant ouverture.

## Risques et décisions proposées
- P1: préserver les deux familles de fonctionnalités lors d'une convergence; fusionner les contrats caméra et média plutôt que remplacer app.js.
- P1: release pendant acquisition pendante ne retire pas une réservation future: owners.add intervient après await. Tester annulation avant résolution et arrêt des pistes.
- P1: Set déduplique deux acquisitions du même owner; définir explicitement sémantique idempotente ou compteur de baux.
- P1: preferRear ne change pas une source déjà live; documenter arbitrage et tester concurrence.
- P1: hook de retrait caméra distante laisse un calque sans média; définir état déconnecté et politique de nettoyage multi-scènes.
- P2: lanceur ne valide pas Node >=20 malgré message; attendre health avant ouverture navigateur.
- P2: README Mobile conserve un état historique v0.2.3/0.2.5; ne pas prendre ses résultats Chromium/34 tests pour une exécution actuelle.

## Tests et reprise
Le chemin tests/camera-pool.test.js retourne 404 sur les trois refs; cela ne démontre pas l'absence de tests ailleurs. src/camera-pool.js retourne 404 sur Studio. Prochain lot: localiser les tests par inventaire d'arbre, transport caméra distante, scripts de preview/fleet, puis tester avec getUserMedia simulé (acquisitions concurrentes, refus, retry, annulation, dernière libération, piste terminée), sans capteurs réels. Vérifier import Comfy, EDIT, et calques distants dans une fixture de convergence. Aucun test runtime, aucune fusion.
