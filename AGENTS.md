# AGENTS.md — mode d'emploi du repo

> ⚙️ **Généré** par `audit/reference/generate-reference.py` (le 2026-09-06).
> Ne pas éditer : modifier le générateur puis `python3 audit/reference/generate-reference.py`.

Ce repo = une tour de veille **CesiumJS** (`watchtower-mods`, 57 modules) + un plan de contrôle de
recherche (`reaserch-engine`) + l'**audit d'outillage** qui dit quoi installer, à quel prix, sous quelle licence.

## Où chercher

| Question | Où la réponse vit |
|---|---|
| Quel outil pour tel besoin ? | `audit/REFERENCE.md` §0 **bis** (tableau « par besoin ») |
| Fiche d'un outil (rôle, prix, licence, étapes A→B→C, vérif) | `audit/REFERENCE.md`, ancre = l'`id` (ex. `#hloc`) |
| Est-ce déjà installé / fonctionnel ici ? | `python3 audit/reference/doctor.py` |
| Faisable à 0 € ? | `AUDIT-OUTILS-2026.md` §3 (verdict par outil) et §6 (remplacements des tiers payants) |
| Droit, licences, CGU | `audit/COUTS-LICENCES-LEGAL.md` |
| Ce que l'agent fait à ta place | `audit/CAPACITES-AGENT.md` (25 tâches cotées) |
| Par quoi commencer | `audit/REFERENCE.md` §1 puis `AUDIT-OUTILS-2026.md` §8 (P0 → P10) |
| Installer le socle | `audit/stack/install-stack.sh` / `.ps1` (courts, relisibles, `-DryRun`) |

## Les commandes

```bash
python3 audit/reference/cherche.py "pdf" --sans-cle   # recherche plein texte + filtres
python3 audit/reference/cherche.py --besoin vps       # partir du besoin, pas du nom
python3 audit/reference/cherche.py --fiche marker     # une fiche en texte court
python3 audit/reference/doctor.py --json               # état réel de la machine (exit 1 si socle incomplet)
python3 audit/reference/generate-reference.py          # régénère REFERENCE.md, REGISTRE-*.json/tsv, AGENTS.md
```

Registre : **86 outils** (68 🟢 sans clé, 12 🟡 avec compte gratuit, 4 🔴/🟠 payants ou semi-payants) en
12 catégories. Machine : `audit/reference/REGISTRE-OUTILS.json` ; plat : `audit/reference/REGISTRE.tsv`.

## Interdits et obligations (le détail est dans `REFERENCE.md` §0)

1. Ne **jamais** éditer `REFERENCE.md`, `REGISTRE-OUTILS.json`, `REGISTRE.tsv`, `AGENTS.md` : la source de vérité est la liste `OUTILS` de `audit/reference/generate-reference.py`.
2. **Aucune fonctionnalité visant une personne physique** : pas de pistage, pas de visage, pas d'ancrage de personnes dans le VPS, pas de calque « yachts / jets d'oligarques ».
3. Licence **refusée** si `NOASSERTION`, absente, « Other » ou fair-code → réécrire le motif. Vérifier le **fichier** LICENSE, pas l'auto-détection GitHub.
4. **Zéro clé par défaut** ; `.env` en 600 et jamais commité ; aucun binding `0.0.0.0` ; un repli cloud s'affiche à l'écran.
5. Ajouter un outil = **une entrée du générateur** avec `role`, `tier`, `prix`, `licence`, `urls`, `install` (A→B→C), `verifier` (exécuté par `doctor.py`), puis régénérer, puis committer.
6. **Journal d'abord, calque ensuite** : tout flux public consommé est aussi écrit dans `recorder-4d`.
7. **Un événement = un alignement temporel, jamais une assertion** : la tour cite, elle n'accuse pas.
8. `doctor.py` avant **et** après chaque installation ; une commande de vérification se termine par un **exit code** (jamais un `| head` qui masque l'absence).
9. Prix et quotas **re-vérifiés à la date d'écriture** (les tiers gratuits sont le premier poste de régression).

## Déjà en place

- `esri-carto-tuiles` — Tuiles Esri World Imagery + CARTO (déjà en place)
- `photon-nominatim` — Photon → Nominatim (géocodage sans clé, déjà en place)
- `cesium-ion` — Cesium ion (tuiles 3D photoréalistes)
- `opensky` — OpenSky Network
- `gods-eye-view` — God's Eye View (amont de ta tour)
- `aisstream` — aisstream.io (flux AIS temps réel)
