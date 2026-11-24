---
title: OLYMPUS — contrats API et divergence Studio Fleet Mobile
date: 2026-11-24
status: code-lu
tags: [olympus, watchtower, integration, api, obsidian]
---
# OLYMPUS — contrats API et divergence Studio Fleet Mobile

Suite de [[08-WATCHTOWER-AUDIT-MAITRE-2026-11-22]] et [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]]. Inspection statique le 24 novembre, sans lancement de serveur. Les SHA ci-dessous sont des blobs, non des commits.

## Provenance
Dépôt Sathancabrol/monorepo, préfixe projects/olympus-studio/.
| Ref | Fichier | SHA blob |
|---|---|---|
| feat/olympus-studio-20261112 | [server.mjs](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/server.mjs) | 574a583ed37b65016722b0d1e86c8461eeb3099e |
| feat/olympus-fleet-247-20261113 | [server.mjs](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-fleet-247-20261113/projects/olympus-studio/server.mjs) | 1c61df148cae609c63b54a244dc4973bf8eb7e9d |
| feat/olympus-mobile-preview-20261113 | [server.mjs](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-mobile-preview-20261113/projects/olympus-studio/server.mjs) | 1c61df148cae609c63b54a244dc4973bf8eb7e9d |
| trois refs précédentes | package.json | 2c6dc0b2e7f226dbf5a134a2d3a1bd4c904e5182 |
| feat/olympus-studio-20261112 | [src/integration-registry.js](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/src/integration-registry.js) | 7366ebcfda525405db3e1ca2931768675615ef08 |
| idem | [src/comfy-output.js](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/src/comfy-output.js) | 11e8b0151122227fc3c27ee85c49119bc7040114 |
| idem | [docs/ARCHITECTURE.md](https://github.com/Sathancabrol/monorepo/blob/feat/olympus-studio-20261112/projects/olympus-studio/docs/ARCHITECTURE.md) | b02df62e4b34996bd081a2db904baf37affbb091 |

Le registre retourne 404 aux mêmes chemins sur Fleet et Mobile. package.json et registre retournent 404 sur main. Cela ne démontre pas une absence ailleurs. Les trois packages annoncent 0.2.5, Node >=20, start/dev=node server.mjs, test=node --test. Même version ne signifie donc pas même capacité.

## Arborescence fonctionnelle
- Studio HTTP
  - handle(req,res)
    - GET /obs : flux multipart JPEG, viewers et dernier JPEG en mémoire.
    - POST /api/frame : JPEG, plafond 2 MiB, contrôle préfixe, diffusion.
    - GET /api/health : tcpCheck(4455), comfyCheck() sur /system_stats ; présence réseau uniquement.
    - GET /api/integrations : integrationSnapshot({obs,comfyui}), absent du dispatch Fleet/Mobile inspecté.
    - POST /api/comfy/queue : bodyJson, objet prompt non vide, POST local /prompt, timeout 5 s.
    - GET /api/comfy/job : prompt_id, /history, état et maximum 250 sorties.
    - GET /api/comfy/output : prompt_id et index, historique puis /view, absent du dispatch Fleet/Mobile inspecté.
      - selectComfyOutput(history,id,index) : UUID strict, index 0–249, job terminé sans erreur, nom/sous-dossier/type/extension contrôlés.
      - validComfyBytes(bytes,mime) : signature de format et plafond 25 MiB ; pas de décodage intégral.
    - Fichiers statiques : liste autorisée et contrôle de chemin ; GET/HEAD.
  - integrationSnapshot(probes={})
    - 12 espaces : LIVE, EDIT, GENERATE, XR, AUDIO, MEETING, CAPTURE, CINEMA, AUTOMATE, GRAPHICS, LIBRARY, CONTROL.
    - reachable : booléen seulement LIVE et GENERATE, null ailleurs.
    - operationallyVerified : toujours false.
    - Statuts déclarés : mock-tested, intermittent-av, http-mock-tested, not-integrated, partial, chromium-tested, http-tested. Aucun test rejoué ici.
    - SPATIAL/Watchtower est dans l'architecture cible mais pas une entrée du registre inspecté.
- Contrat cible (DOC)
  - capacités available/configured/tested
  - commandes request_id/dry_run/ack
  - événements time_us/source_id, ressources media_id/scene_id/asset_uri
  - échange Cesium/Canvas par texture ou vidéo, caméra et métadonnées
  - Hermes hors processus ; XR événements pose/gestes ; consentement et provenance.

## Constats et décisions proposées
1. P1 — Fleet et Mobile ont un serveur identique entre eux, mais divergent de Studio : deux routes API supplémentaires dans Studio. Ne pas déduire une progression linéaire des noms de branches.
2. P1 — le numéro de package identique masque les écarts ; introduire build SHA et version de contrat dans health.
3. P1 — SPATIAL manque dans le registre alors que la documentation le prévoit ; ajouter une capacité explicite non intégrée avant tout adaptateur.
4. P1 — le registre ne fournit pas les trois champs de capacité du contrat cible ; définir leur sémantique et une migration.
5. P1 — la route job accepte un motif UUID moins strict que selectComfyOutput ; harmoniser les validateurs.
6. P1 — les flux JPEG sont conservés en mémoire ; sendFrame ignore le retour de res.write. Tester la pression mémoire avec clients lents, plafonner les files et le nombre de clients.
7. P1 — le plafond JSON mesure la longueur de chaîne et non les octets ; tester Unicode et requêtes fragmentées.
8. P1 — Studio lie le serveur à loopback et filtre Host/Origin POST ; la compatibilité et les droits d'un proxy mobile restent à tester, sans supprimer les protections.
9. P2 — les signatures média ne garantissent pas un média décodable ; prévoir validation de décodage isolée.
10. P2 — health ok:true ne signifie pas que les moteurs sont disponibles ; conserver états séparés.

## Tests proposés (non exécutés)
- Comparaison automatisée des routes et du SHA de build des trois branches.
- Registre : 12 entrées, probes absentes/fausses/vraies, aucun faux operationallyVerified.
- Comfy : historique absent, job incomplet, index hors borne, format non reconnu, sortie >25 MiB, média tronqué.
- Flux JPEG : limites, déconnexion, client lent, concurrence et consentement.
- Proxy mobile : Host, Origin, authentification, séparation lecture/écriture, accès aux médias.
- Adaptateur spatial : fixture caméra et texture, horloge projet, provenance, déconnexion.
- Vérifier les tests node --test présents dans chaque arbre avant fusion.

## Reprise
Priorité : comparer les clients app.js et les scripts mobile/fleet, inventorier leurs tests, puis vérifier quels endpoints sont réellement consommés. Aucun merge applicatif ni test local effectué.
