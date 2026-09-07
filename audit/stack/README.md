# Watchtower · stack de service « yeux + cerveau » — 0 €/mois

Quatre conteneurs, tous open source, aucun ne demande de clé d'un fournisseur d'IA : ils parlent à
**Ollama local** (ou à rien). Lancés par `install-stack.ps1` / `install-stack.sh`, ou à la main :

```bash
cd audit/stack
cp .env.example .env && ./gen-secrets.sh     # secrets locaux, jamais dans le repo
docker compose up -d
```

| Service | URL (localhost uniquement) | Ce que ça débloque sur la tour | Licence |
|---|---|---|---|
| **SearXNG** | http://localhost:8080/search?q=… | recherche web privée pour `reaserch-engine` (futur `SearxngRetriever`) et pour le `chatConsole` de la tour | AGPL-3.0 |
| **Vane** (ex-Perplexica) | http://localhost:3000 | réponse sourcée + citations, l'anti-Perplexity-20 $/mois. Brancher `http://host.docker.internal:11434/v1` comme modèle → **0 API externe** | MIT |
| **SpiderFoot** | http://localhost:5001 | collecte OSINT d'infrastructures (domaine, IP, e-mail, empreinte) — alimente `intelTwin.js` | MIT |
| **Activepieces** | http://localhost:4200 | les patterns « boring automations » de la vidéo n°3 : triage mail, veille de flux, briefing du matin, alertes Telegram | MIT |

Option lourde (≥ 16 Go RAM) : **Langfuse** pour tracer tes runs → utiliser le
[docker-compose officiel](https://github.com/langfuse/langfuse/blob/main/docker-compose.yml).

## Notes d'ingénierie (honnêtes)

- Les variables `AP_*` d'Activepieces et la conf SearXNG suivent la doc **au moment de l'écriture** ;
  si un `docker compose up` râle, la source de vérité est
  [docs.activepieces.com/self-hosting/configuration](https://www.activepieces.com/docs) et
  [docs.searxng.org/admin/installation-server](https://docs.searxng.org/admin/installation-server.html).
  C'est un point d'usure normal du self-hosting (« quelques heures de upkeep par mois », comme dit la vidéo n°2).
- Rien n'est publié sur `0.0.0.0`. Le README de l'amont de ta tour met en garde : un serveur visible
  du LAN **broker tes clés API** à quiconque peut l'atteindre.
- Vane et SearXNG se passent l'un l'autre : Vane contient déjà un SearXNG ; celui d'ici sert tes propres
  retrievers. Supprime le service `searxng` si tu veux 400 Mo de RAM en moins.
- **Aucune clé payante** n'est lue par ces conteneurs. La tour, elle, garde son `keySetup.js` : si tu
  colles un jour une clé Cesium ion / Groq, elle reste dans ton `.env` local (chmod 600) et jamais dans le repo.

## Boucle d'auto-vérification (à utiliser après chaque install)

```bash
python3 ../reference/doctor.py           # humain : ce qui répond, ce qui manque, les étapes à lire
python3 ../reference/doctor.py --json    # agent : décision automatique (exit 1 = socle incomplet)
```
`doctor` ne devine rien : il exécute le champ `verifier` de chaque entrée du registre. Si tu ajoutes
un service, ajoute l'entrée dans `../reference/generate-reference.py`, régénère, et `doctor` le teste.

## Arrêt / purge

```bash
docker compose down          # stoppe
docker compose down -v       # stoppe + efface les volumes (historique de chat, runs SpiderFoot)
```
