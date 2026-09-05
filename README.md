# watchtower

🗼 Tour de veille : globe CesiumJS + couches ouvertes temps réel, **sans clé API** (MODE GRATUIT).
Les 57 modules de la tour vivent aujourd'hui dans `COGNITORIUM/watchtower-mods/src` + la procédure
`COGNITORIUM/watchtower-mods/APPLIQUER.md` (ce repo ne contient pour l'instant que des docs — voir § audit).

## Audit outils — OSINT / IA locale / open source (2026-09-05)

| Fichier | Contenu |
|---|---|
| [`AUDIT-OUTILS-2026.md`](AUDIT-OUTILS-2026.md) | audit des 11 liens fournis (vidéos + `manycoretech/aholo-viewer`), outil par outil, avec sources ; comparaison avec les 8 repos ; faisabilité gratuite sur la tour ; ce que l'agent fait à ta place ; feuille de route P0→P8 |
| **[`audit/REFERENCE.md`](audit/REFERENCE.md)** | ⭐ **la référence canonique pour les agents** : 86 outils, rôle · faisabilité par palier · prix · licence · URLs · **étapes d’installation A → B → C** · point d’intégration dans la tour · commande de vérification. Générée depuis `audit/reference/generate-reference.py` (ne pas éditer à la main) |
| [`audit/COUTS-LICENCES-LEGAL.md`](audit/COUTS-LICENCES-LEGAL.md) | ardoise réelle (0 €/mois), coûts one-shot, pièges de licence (n8n fair-code, GobboNet/Mark-LII sans licence, AGPL, clause Open WebUI), cadre légal FR |
| [`audit/CAPACITES-AGENT.md`](audit/CAPACITES-AGENT.md) | 22 tâches classées : 100 % agent / cliques restants / hors de portée (matériel, compte, CB) |
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
