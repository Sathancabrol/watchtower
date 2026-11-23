---
title: "Carré d'As — audit chemins, configuration, plugins et mises à jour"
created: 2026-11-23
document_type: code-audit
status: static-inspection-no-runtime
tags: [watchtower, carredas, configuration, modules, update, security, agent-memory]
---

# Carré d'As — chemins, configuration, plugins et mises à jour

> [!warning] Périmètre
> Lecture statique de la branche `Sathancabrol/monorepo@arena/0034230e-monorepo` le 23/11/2026. Aucun test sur le PC Windows, aucune exécution réseau ni simulation d'attaque. Les chemins absents ne prouvent pas l'absence de fonctionnalités équivalentes ailleurs.

## 1. Sources et empreintes Git blob

| Fichier | Blob SHA | Rôle |
|---|---|---|
| [paths.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/paths.py) | `45e4155e7e3b56c181c6a0a3bc66f997ef42e973` | Dossiers, valeurs par défaut, lecture/écriture config |
| [modules/__init__.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/modules/__init__.py) | `3c6745e465010bcb3bda482eb0d312d94a30dff5` | Découverte, chargement et branchement des modules |
| [updater.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/updater.py) | `89f1aa9bef39d7da1a3d2c3297f17ab40bc6646d` | Contrôle et application de mises à jour |
| [server.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/server.py) | `b58ea90add373fdb04e595229054e920fe3ada88` | Routes configuration, modules et mises à jour |
| [httpsrv.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/httpsrv.py) | `5dcf5444084d12a102c6af506444ed3db8a2cd20` | Garde HTTP et traitement requêtes |
| [__init__.py](https://github.com/Sathancabrol/monorepo/blob/arena/0034230e-monorepo/carredas/__init__.py) | `4fe348413b16aefdb338eea4d51fd845add1d20c` | Contrat de fonctionnement standard library / JSON |

`carredas/cli.py`, `carredas/config.py`, `carredas/tests/test_paths.py`, `carredas/tests/test_modules.py` : 404 aux chemins exacts recherchés dans cette branche. Ce n'est pas une recherche exhaustive de tests.

## 2. Arborescence des fonctions, contrats et états

- **paths.py**
  - `is_frozen() -> bool` : vérifie `sys.frozen`.
  - `code_dir() -> Path` : dossier de l'exécutable gelé ou parent du paquet.
  - `ui_dir() -> Path` : chemin UI sous le paquet.
  - `is_portable() -> bool` : marqueur `PORTABLE`.
  - `data_dir() -> Path` : priorité `CARREDAS_DATA`, puis portable, `LOCALAPPDATA` Windows ou `XDG_DATA_HOME`; crée le répertoire.
  - `update_dir()`, `backups_dir()` : sous-dossiers de données.
  - `_deep_merge(base, over)` : fusion récursive des objets, remplacement des autres valeurs.
  - `config_path()`, `read_config()`, `write_config(cfg)`, `patch_config(fragment)` : JSON `config.json`, fusion, écriture directe.
  - `runtime_info()` : chemins et informations de plateforme.
- **modules/__init__.py**
  - `Module(dossier)` : lit `module.json`; conserve erreur si illisible.
  - Propriétés `id`, `titre`, `actif`, `priorite`; `to_dict()` expose les métadonnées.
  - `load()` : charge `router.py` par `importlib.util.spec_from_file_location` sous `carredas.modules.<dossier>.router`; conserve une instance en cache.
  - `register(router, ctx)` : appelle la fonction `register` du plugin.
  - `discover(root)` : ignore dossiers cachés et sans manifeste; trie par priorité.
  - `load_all(router, ctx)` : branche les modules actifs et enregistre l'adaptateur facultatif `canonique(store,cfg)`.
- **updater.py**
  - `_git()` : sous-processus Git avec timeout 45 s.
  - `_est_un_depot()`, `_http_json()`, `_vplus()` : détection, accès GitHub, comparaison de versions.
  - `verifier(cfg)` : canal Git ou release, annonce état et tags.
  - `appliquer(cfg, version, canal)` : tentative de sauvegarde, puis application Git/release.
  - `_appliquer_git()` : refuse le checkout si worktree sale, puis checkout de tag.
  - `_appliquer_release()` : télécharge l'asset, calcule SHA-256, compare au fichier de sommes *s'il existe*, puis extrait l'archive ZIP ou prépare l'exécutable.

## 3. Constats nouveaux et limites de sécurité

| ID | Niveau | Constat statique | Impact et validation nécessaire |
|---|---|---|---|
| CA17-01 | P0 | `DEFAULT_CONFIG.acces.token` est vide et `_garde_acces` laisse passer si le token est vide. | **Absence de protection applicative par défaut**, y compris si le service est rendu accessible sur un réseau. Contrôler host, pare-feu, proxy, Tailscale avant exposition. |
| CA17-02 | P0 | `PUT /api/config` appelle `patch_config` sans validation des clés ni des types. | En cas d'accès HTTP, modification de la configuration et de paramètres sensibles; tester autorisation par rôle et schéma. |
| CA17-03 | P1 | `read_config()` ignore silencieusement toute erreur de lecture/parsing et revient aux défauts. | Une config corrompue peut réinitialiser silencieusement la politique de token; préférer un échec explicite pour les paramètres de sécurité. |
| CA17-04 | P1 | `write_config()` écrit directement le fichier JSON, sans remplacement atomique ni verrou. | Corruption possible en cas d'interruption/concurrence; écrire fichier temporaire + fsync + rename. |
| CA17-05 | P1 | `Module.load()` exécute `router.py` de chaque module actif sans signature ni isolation. | Les modules doivent être considérés comme du code local de confiance; vérifier provenance et permissions des dossiers. |
| CA17-06 | P1 | `Module.priorite` convertit directement en `int`; un manifeste malformé peut interrompre le tri de `discover()`. | Valider schéma du manifeste et isoler les erreurs par module. |
| CA17-07 | P1 | `appliquer()` journalise l'échec de sauvegarde mais poursuit la mise à jour. | Contradiction avec la promesse de sauvegarde obligatoire; imposer un arrêt si copie non vérifiée. |
| CA17-08 | P1 | Le canal release accepte un asset sans `sha256sums.txt` et appelle `ZipFile.extractall` sans contrôle explicite de politique de contenu. | Vérifier signature/provenance, limites taille/entrées et destinations; ne pas conclure à une exploitation sans tests. |
| CA17-09 | P1 | `_appliquer_git` fait `checkout` du tag demandé, mais l'extrait inspecté ne vérifie pas une liste autorisée de tags ni signature. | Restreindre les références installables et auditer l'autorisation de l'endpoint. |
| CA17-10 | P2 | Le fichier `DEFAULT_CONFIG` définit deux fois la clé `profil` : une chaîne `agglo-thau` puis un dictionnaire d'identité émetteur. | En Python, la seconde écrase la première. Clarifier `profil_territorial` vs `profil_emetteur` et rechercher les consommateurs. |

> [!important] Nuance sur les données
> La population et la superficie du territoire sont des valeurs par défaut du code, **pas** des statistiques actualisées. Les paramètres `llm` mentionnent des fournisseurs et modèles, mais n'attestent ni leur installation ni leur fonctionnement. Le dossier de données peut être redirigé par variable d'environnement.

## 4. Contrats et risques transverses

`HTTP → Router.garde → server.py:/api/config → paths.patch_config → config.json → cfg.clear/update → modules` : une modification de configuration se propage aux routeurs utilisant la référence `cfg`; la garde d'accès lit ce même dictionnaire. Le contrôle de permissions est donc prioritaire avant toute mise à disposition distante.

`module.json → discover → Module.load → register(router,ctx) → ctx.canonique[id]` : le système est extensible, mais n'est ni un sandbox ni un système de plugins signés. Une entrée du registre signifie `déclaré`, tandis que `charge=true` signifie seulement que le branchement Python n'a pas levé d'exception; cela ne prouve pas les fonctions métier ni leurs tests.

`HTTP /api/mise-a-jour/appliquer → updater.appliquer → sauvegarde → checkout/extraction` : endpoint à protéger et à soumettre à consentement local explicite. L'archive n'est pas automatiquement installée après extraction dans le code inspecté.

## 5. Tests à ajouter et conditions de recette

1. Config corrompue, valeurs de types invalides, clé `acces.token` manquante : refuser le démarrage réseau distant.
2. Deux écritures concurrentes et interruption d'écriture : conserver un JSON valide et un backup.
3. `PUT /api/config` sans token, avec token invalide, depuis localhost et depuis proxy.
4. Manifeste module avec `priorite: "non-nombre"`, JSON invalide, routeur manquant : échec isolé, autres modules chargés.
5. Plugin non fiable : documenter explicitement le modèle de confiance et vérifier le répertoire.
6. Échec de `copytree` : la mise à jour doit s'arrêter sans changement.
7. Tag inexistant/non autorisé et worktree sale : aucun checkout.
8. ZIP très volumineux, entrées anormales et empreinte absente : refus ou validation explicite.
9. Mode `CARREDAS_DATA` vs `PORTABLE` vs `LOCALAPPDATA` : chemin canonique et permissions.
10. Contrôle de compatibilité du champ `profil` avec les modules consommant la config.

## 6. Décisions et prochain lot

- Ne pas annoncer la disponibilité du Carré d'As sur Windows ou Android sans healthcheck local.
- Prioriser **fail-closed**, validation de config et sauvegarde vérifiée avant exposition réseau ou mise à jour.
- Auditer les consommateurs de `profil`, les manifests de modules, les points d'entrée de lancement et les tests présents ailleurs dans la branche.
- Rapprocher avec [[15-OSINT-STORE-HTTP-REGISTRES-AUDIT-2026-11-23]] et [[16-CARREDAS-CABLAGE-ACCES-FICHIERS-2026-11-23]].

**Conclusion :** lecture de code avec empreintes, sans test de sécurité ni recette runtime.