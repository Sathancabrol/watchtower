# watchtower

🗼 Tour de veille : globe CesiumJS + couches ouvertes temps réel, **sans clé API** (MODE GRATUIT).
Les 57 modules de la tour vivent aujourd'hui dans `COGNITORIUM/watchtower-mods/src` + la procédure
`COGNITORIUM/watchtower-mods/APPLIQUER.md` (ce repo ne contient pour l'instant que des docs — voir § audit).

## 🔎 Trouver vite (humain comme agent)

```bash
python3 audit/reference/cherche.py "pdf scanné"        # recherche plein texte, pondérée
python3 audit/reference/cherche.py --besoin 4d         # partir du besoin, pas du nom
python3 audit/reference/cherche.py --sans-cle --palier A   # gratuit, local, sans GPU
python3 audit/reference/cherche.py --fiche marker      # une fiche complète
python3 audit/reference/doctor.py --json               # ce qui tourne vraiment sur la machine
grep -i ais audit/reference/REGISTRE.tsv          # version plate ; `cut -f1,5,6` pour ne garder que des colonnes
```

Les 4 fichiers `REFERENCE.md`, `REGISTRE-OUTILS.json`, `REGISTRE.tsv`, `AGENTS.md` sont **générés** :
on édite `audit/reference/generate-reference.py`, puis `python3 audit/reference/generate-reference.py`.
Le détail des règles de consommation est dans [`AGENTS.md`](AGENTS.md) (racine) et `audit/REFERENCE.md` §0.

## Audit outils — OSINT / IA locale / open source (2026-09-05, complété 2026-09-06)

| Fichier | Contenu |
|---|---|
| [`AUDIT-OUTILS-2026.md`](AUDIT-OUTILS-2026.md) | l'audit narratif : les **14 liens** (vidéos + `manycoretech/aholo-viewer` + l'étude d'Ormuz), outil par outil et sourcés ; comparaison avec tes 8 repos ; faisabilité à 0 € ; ce que l'agent fait à ta place ; feuille de route **P0→P10** |
| **[`audit/REFERENCE.md`](audit/REFERENCE.md)** | ⭐ **la référence canonique pour les agents** : 86 outils, rôle · faisabilité par palier · prix · licence · URLs · **étapes d’installation A → B → C** · point d’intégration dans la tour · commande de vérification. Générée depuis `audit/reference/generate-reference.py` (ne pas éditer à la main) |
| [`audit/COUTS-LICENCES-LEGAL.md`](audit/COUTS-LICENCES-LEGAL.md) | ardoise réelle (0 €/mois), coûts one-shot, pièges de licence (n8n fair-code, GobboNet/Mark-LII sans licence, AGPL, clause Open WebUI), cadre légal FR |
| [`audit/CAPACITES-AGENT.md`](audit/CAPACITES-AGENT.md) | 25 tâches classées : 100 % agent / cliques restants / hors de portée (matériel, compte, CB) |
| [`AGENTS.md`](AGENTS.md) (racine) | **routeur pour les agents** (généré) : où vit chaque réponse, les 6 commandes, les 9 interdits/obligations, ce qui est déjà en place |
| [`audit/reference/cherche.py`](audit/reference/cherche.py) | recherche dans le registre : mots-clés pondérés, `--besoin`, `--sans-cle`, `--palier`, `--licence`, `--fiche`, `--ids`, `--json` (0 = trouvé, 1 = rien) |
| [`audit/reference/REGISTRE.tsv`](audit/reference/REGISTRE.tsv) | 1 ligne = 1 outil (12 colonnes tabulées) : `grep`, `awk`, `sort`, `cut -f` — la forme la moins chère en tokens pour un agent |
| [`audit/stack/`](audit/stack/) | stack gratuite prête à poser : `install-stack.ps1` · `install-stack.sh` · `docker-compose.yml` (SearXNG, Vane, SpiderFoot, Activepieces) · `gen-secrets.sh` · `README.md` |

### Démarrage rapide (0 €, 0 compte)

```powershell
# Windows
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\audit\stack\install-stack.ps1        # -DryRun pour voir sans rien installer
```

```bash
# Linux / WSL2 / tour-serveur
bash audit/stack/install-stack.sh      # --dry-run, --skip-docker, --big
```

Le script lit ta VRAM, choisit le modèle Ollama en conséquence, pose un venv Python
(crawl4ai, faster-whisper, piper-tts FR, marker-pdf, chonkie, outlines, instructor, spiderfoot),
démarre la stack de recherche/OSINT si Docker est là, puis lance la tour sur `http://localhost:4173`.
