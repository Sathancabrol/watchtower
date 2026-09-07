# 🧪 R&D — audit de structure, modifications générales, exemples
### Document de préparation, **sans aucune modification de code**
Rédigé le 2026-09-06 · périmètre : `COGNITORIUM/watchtower-mods` (les 57 modules), `reaserch-engine`, `audit/reference/` · **état : proposition** — rien n'est appliqué, rien n'est urgent, tout est chiffré.

> **Ce document ne change rien au repo.** Il répond à une seule question : *quand on reprendra le code, dans quel ordre et avec quels gabarits, pour que la tour devienne une plateforme plutôt qu'une collection de modules ?*
> Les chiffres de ce document sont **reproductibles** (§7) : ils sont extraits du registre généré, pas de ma mémoire.

---

## 0. Comment lire ce document

| Tu veux… | Va à |
|---|---|
| savoir **ce qui casse** structurellement | §1 (12 constats, chacun avec sa preuve à vérifier) |
| savoir **dans quel ordre** toucher au code | §2 (6 chantiers additifs) |
| un **gabarit de code** à copier | §3 (12 extraits, volontairement courts) |
| des **tâches prêtes à confier** (à un dev ou à un agent) | §4 (14 tâches avec critère d'acceptation mesurable) |
| savoir **si ça a marché** | §5 (6 indicateurs, comment les mesurer) |
| éviter les **fausses bonnes idées** | §6 (10 anti-patterns) |
| **demander** le travail à un agent | §8 (formulations qui marchent + ce qu'il faut exiger en retour) |

⚠️ **Honnêteté d'abord** : le clone `COGNITORIUM/watchtower-mods` n'est pas dans le sandbox de cette session. Chaque constat porte donc une ligne **« preuve à vérifier »** : la commande ou le fichier à ouvrir avant de coder. Un constat non vérifié doit être traité comme une *hypothèse de travail*, pas comme un acquis.

---

## 1. Diagnostic de structure (12 constats)

**C1 — Le registre des modules n'existe pas, il est implicite.**
Chaque module de la tour s'auto-déclare (pattern `window.WT.*`), et la règle d'ingénierie n°5 de `REFERENCE.md` demande déjà « un module = un fichier, `try/catch` à l'enregistrement ». Sans *vrai* registre, on ne peut pas savoir au démarrage : quels modules sont chargés, lesquels ont échoué, lesquels sont désactivés par flag.
*Conséquence* : un module cassé est invisible jusqu'au clic ; les options `displayOptions.js` deviennent la seule source de vérité de l'état de la tour, et elles ne savent pas qu'un module a levé.
*Modification générale* : un fichier `src/core/registry.js` (25 lignes) + un banner « 3 modules sur 24 ne se sont pas enregistrés ».
*Preuve à vérifier* : `grep -rn "window.WT\|window.Watchtower" src/ | wc -l` et `grep -rn "try {" src/*.js | wc -l`.

**C2 — L'état est diffus et non versionné.**
`intelTwin.js` porte un `watchtower.profil.v1` (le `v1` est une bonne école), mais les clés de `localStorage` sont éparpillées par module, sans schéma ni migration.
*Conséquence* : au premier changement de format, la tour de l'utilisateur explose silencieusement — et il n'existe aucun moyen de rejouer son état.
*Modification générale* : `src/core/store.js`, clé unique `watchtower.state.v2`, migrations explicites, et **aucune clé tierce dans le store** (voir C4).
*Preuve* : `grep -rn "localStorage" src/ | wc -l` · compter les clés distinctes.

**C3 — Pas de bus : les modules s'appellent entre eux.**
`ficheLieu` → `intelTwin` → `mapStackController` forment un graphe d'appels directs. L'arrivée des couches 4D (`satPasses`, `notams`, `outages`, `darkVessels` — cf. §2 de ce doc : **24 fichiers à créer**) multiplierait ce graphe par cinq.
*Modification générale* : `src/core/bus.js` (EventTarget + tampon des 200 derniers événements pour le debug), et l'interdiction écrite : *un module ne parle qu'au bus et au store*.
*Coût* : 1 session, additif — les appels directs existants continuent de marcher.

**C4 — Les clés API vivent dans le navigateur.**
`keySetup.js` (coller → ✓ vert → `localStorage`) est un choix assumé pour du mono-utilisateur local, mais la stack prévue dans `audit/stack/` (SearXNG, Vane, Ollama) tourne déjà à côté : toute clé devrait passer par **le serveur local**, jamais par le client.
*Risque* : si la tour est un jour exposée sur le LAN (ou partagée par `sharelink.js`), les clés partent avec la page.
*Modification générale* : endpoint local `POST /proxy` + allow-list de hosts + `.env` 600 ; `keySetup.js` devient un écran qui **teste** la clé via le proxy et ne la stocke plus côté client. C'est la règle n°3 du §0 de `REFERENCE.md`, jamais appliquée dans le code.
*Preuve* : `grep -rn "apiKey\|API_KEY" src/ | head`.

**C5 — Zéro test, y compris de non-régression.**
`reaserch-engine` a ~20 tests ; la tour n'en a aucun. `doctor.py` vérifie l'infrastructure (ce qui tourne), pas le client (ce qui s'affiche).
*Modification générale* : un smoke test `node --test` (ou vitest) qui (1) importe chaque module, (2) vérifie qu'il s'enregistre sans clé, (3) compare le nombre de modules attendus. 30 lignes, et il attrape 80 % des régressions de ce type de projet.

**C6 — Les couches Cesium n'ont pas de budget.**
`mapStackController.js` empile des providers (Esri, CARTO, OSM buildings…). Rien ne dit *combien* de couches, avec quelle priorité de purge, à quel seuil de FPS on désactive.
*Modification générale* : un `layerBudget` (nb max de couches actives, RAM indicative, désactivation automatique sous 20 FPS avec mention à l'écran). C'est le prérequis pour que P6 (splats 3DGS) et P9 (4D) ne rendent pas la tour inutilisable.
*Mesure avant/après* : §5.

**C7 — Aucune donnée n'est conservée : la tour est amnésique.**
C'est le constat le plus rentable de l'audit des liens (voir `AUDIT-OUTILS-2026.md` §5 bis) : OpenSky/aisstream/Copernicus répondent « maintenant », et le cache du fournisseur expire. **10 entrées du registre visent P9 et n'ont toujours aucun endroit où écrire.**
*Modification générale* : `data/4d/` (NDJSON gzippé → Parquet/DuckDB) + `GET /api/4d?from&to&layer` + `viewer.clock`. Ce n'est pas un calque de plus, c'est le **support** des calques.

**C8 — Le contrat de sortie n'existe qu'à moitié.**
`reaserch-engine/schemas/*.schema.json` valide les *claims*, mais rien ne valide ce qui entre dans la tour depuis le LLM (résumé, entités, KPI d'`intelTwin`). Un JSON malformé se voit à l'affichage, pas au bord.
*Modification générale* : publier les schémas **au client** (`src/core/schemas/`) + une `valider(objet, nom)` de 15 lignes ; toute réponse invalide s'affiche *comme* invalide (honnête) au lieu d'être corrigée en silence.

**C9 — L'amont est non licencié, donc la reconstruction est obligatoire.**
`gods-eye-view` : GitHub renvoie `NOASSERTION` (`audit/COUTS-LICENCES-LEGAL.md` l.46). Toute la tour vit donc sur une recette maison, `APPLIQUER.md`, qui rejoue des patches sur un commit amont.
*Conséquence R&D* : la recette est le point unique de défaillance. Elle doit devenir un **build reproductible** (lockfile, patchs numérotés, CI qui l'exécute) — sinon « reconstruire la tour » restera un métier d'archéologie.

**C10 — Le vocabulaire de recherche est figé dans le code.**
Les modules portent des libellés FR, et la recherche (celle de l'audit comme celle de la tour) dépend des mots exacts. Le `cherche.py` de l'audit a dû ajouter un pliage d'accents et un repli « un mot suffit » pour être utilisable.
*Modification générale* : `src/core/lexique.js` (termes ↔ synonymes, 1 fichier JSON) partagé par les filtres de la tour **et** par l'index `mots_cles` du registre.

**C11 — 24 fichiers à créer, 3 seulement à modifier : la R&D n'est pas l'installation, c'est le câblage.**
Extrait du registre (voir §7 pour le recalcul) : sur 86 outils, **24 chemins de la tour sont cités en cible d'intégration mais n'existent pas** — `src/ocr.js`, `src/voice/sttLocal.js`, `src/timeline/replayer.js`, `src/splats.js`, `src/darkVessels.js`, etc. Installer Ollama, Marker ou hloc ne produit aucune valeur sans ces 24 points de branchement.
*Conséquence d'agenda* : chaque phase de la roadmap (§8 d'`AUDIT-OUTILS-2026.md`) doit se terminer par **le module cible**, sinon elle ne sert à rien.

**C12 — Les garde-fous éthiques sont documentés, pas écrits.**
La règle n°2 (« aucune personne physique ») est dans `AGENTS.md`, `REFERENCE.md` §0 et 3 sections de l'audit — mais aucun mécanisme ne la vérifie. C'est le seul point du projet où une régression est *irréversible* (publication, partage).
*Modification générale* : une liste `data/interdits.json` (calques, champs, URL de tiers) + un test qui échoue si un module la contient + un contrôle dans le CI. Coût : 1 après-midi. Efficacité : totale, et **relisible par un humain**.

---

## 2. Les 6 chantiers généraux (tous additifs, aucun « rewrites »)

| # | Chantier | Contenu | Débloque | Effort | Réversibilité |
|---|---|---|---|---|---|
| **G1** | *Contrats* — `core/registry.js`, `core/bus.js`, `core/store.js` + feature flags | 80 lignes au total, 0 dépendance | C1, C2, C3, C11 | 1 session | totale (les modules actuels tournent à côté) |
| **G2** | *Secrets & proxy* — clés côté serveur local, `keySetup` en mode test, CSP, pas de `0.0.0.0` | C4 | tout ce qui touche un tiers | 1 session | totale |
| **G3** | *Temps* — `data/4d/`, `GET /api/4d`, `viewer.clock`, calque trajectoires | C7, et les 10 entrées de P9 | la rejouabilité | 2-4 sessions | additif (un calque de plus, désactivable) |
| **G4** | *Paroles & yeux* — `llmClient`, `ocr.js`, `voice/sttLocal.js`, `voice/ttsLocal.js` | C11 (7 fichiers) | P1, P2, P3 | 2-3 sessions | feature flags, `freeVoice.js` conservé |
| **G5** | *Vérité de sortie* — schémas publiés au client, `valider()`, provenance affichée partout | C8 | la confiance dans ce que dit la tour | 1-2 sessions | totale |
| **G6** | *Fabrique* — smoke tests, `APPLIQUER.md` transformé en build CI, release + installeur, garde-fou C12 | C5, C9, C12 | P0 et toutes les livraisons futures | 1-2 sessions | totale |

**Ordre recommandé** : G1 → G6 → G2 → G5 → G3 → G4. (G1 d'abord : sans registres et bus, chaque module ajouté ensuite aggrave C3. G6 tout de suite après : les tests protègent les 4 chantiers suivants. G3 avant G4 parce que le temps est ce qui **manque** — chaque jour sans journal est un jour de données perdues, cf. C7.)

---

## 3. Gabarits (à copier, pas à coller tels quels)

Trois règles de style imposées par l'existant : ESM sans build, pas de dépendance nouvelle, un fichier = une responsabilité.

**`src/core/registry.js` — la vérité sur ce qui tourne**
```js
// Registre des modules : enregistrement tolérant à l'échec + état lisible par l'UI et par les tests.
export const modules = new Map();
export function register(nom, init, { requis = false } = {}) {
  try {
    const api = init();
    modules.set(nom, { statut: 'ok', api });
  } catch (e) {
    modules.set(nom, { statut: 'erreur', erreur: String(e && e.message || e) });
    if (requis) document.getElementById('hud').dataset.alerte = `module requis cassé : ${nom}`;
    console.warn(`[watchtower] ${nom} non chargé :`, e);
  }
  return modules.get(nom);
}
export const etat = () => ({ total: modules.size,
  ko: [...modules].filter(([, m]) => m.statut !== 'ok').map(([n, m]) => [n, m.erreur]) });
```
*Critère de fin* : `etat().ko` est vide au démarrage **sans aucune clé**, et affiché dans `displayOptions.js`.

**`src/core/bus.js` — découpler sans framework**
```js
const tampon = [];                                   // pour le debug et les tests
export const bus = new EventTarget();
export function emit(nom, detail) {
  tampon.push({ t: Date.now(), nom, detail });
  if (tampon.length > 200) tampon.shift();
  bus.dispatchEvent(new CustomEvent(nom, { detail }));
}
export const sur = (nom, fn) => { const h = (e) => fn(e.detail); bus.addEventListener(nom, h); return () => bus.removeEventListener(nom, h); };
export const historique = () => tampon.slice();
```
Convention de noms : `couche.active`, `lieu.selectionne`, `llm.reponse`, `journal.ecrit`, `pose.recue`.

**`src/core/store.js` — un seul état, versionné, migrable**
```js
const CLE = 'watchtower.state.v2';
const v1 = (o) => ({ ...o, couches: o.couches || {}, $version: 2 });   // ex. de migration
const MIGRATIONS = { 1: v1 };
export function load() {
  let brut = {}; try { brut = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch { brut = {}; }
  let v = brut.$version || 1;
  while (v < 2) { brut = (MIGRATIONS[v] || ((o) => o))(brut); v = brut.$version = v + 1; }
  return brut;
}
export function save(patch) { const s = { ...load(), ...patch }; localStorage.setItem(CLE, JSON.stringify(s)); return s; }
```
*Interdits écrits en commentaire dans le fichier* : aucune clé API, aucun contenu de personne, aucun texte long (ça va dans `data/`, pas dans `localStorage`).

**`src/ai/llmClient.js` — local d'abord, repli conscient**
```js
const OLLAMA = (import.meta.env?.VITE_OLLAMA_URL) || 'http://127.0.0.1:11434/v1';
export async function ask(messages, { model = 'qwen3:4b', timeout = 60_000 } = {}) {
  const ctrl = new AbortController(); const chrono = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(`${OLLAMA}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ model, messages, temperature: 0.2, response_format: { type: 'json_object' } }),
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return { source: 'local', json: JSON.parse((await r.json()).choices[0].message.content) };
  } catch (e) {
    return { source: 'aucune', erreur: String(e.message), json: null };  // jamais de cloud implicite
  } finally { clearTimeout(chrono); }
}
```
*Critère* : sans Ollama, la tour répond « hors-ligne, rien d'envoyé » — pas un spinner éternel, pas un appel distant.

**`src/core/valider.js` — le schéma comme frontière, pas comme décoration**
```js
// mini-validateur : suffisant pour nos 9 schemas/*.schema.json (objets plats, types, requis, enums)
export function valider(objet, schema) {
  const manquants = (schema.required || []).filter((k) => !(k in objet));
  if (manquants.length) return { ok: false, pourquoi: `champs requis absents : ${manquants.join(', ')}` };
  const foux = Object.entries(schema.properties || {}).filter(([k, p]) =>
    objet[k] !== undefined && p.type && typeof objet[k] !== ({ string: 'string', number: 'number', boolean: 'boolean' }[p.type] ?? typeof objet[k]));
  if (foux.length) return { ok: false, pourquoi: `types non conformes : ${foux.map(([k]) => k).join(', ')}` };
  return { ok: true };
}
```
Affichage d'une réponse invalide : cadre orange + texte brut, **jamais** de réécriture silencieuse.

**`scripts/recorder/collecteur.mjs` — le geste qui rend la tour 4D**
```js
// Un collecteur = idempotent, borné, silencieux, et il ne juge jamais.  node scripts/recorder/collecteur.mjs --layer opensky
import { mkdirSync, appendFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const [,, , layer = 'opensky'] = process.argv;
const jour = new Date().toISOString().slice(0, 10);
const dossier = `data/4d/${jour}`; mkdirSync(dossier, { recursive: true });
const url = { opensky: 'https://opensky-network.org/api/states/all',
              eonet: 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=50',
              usgs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson' }[layer];
const t0 = Date.now();
const brut = await fetch(url, { headers: { 'user-agent': 'watchtower-local/0.1' } }).then((r) => r.text());
const lignes = (layer === 'opensky' ? JSON.parse(brut).states || [] : [JSON.parse(brut)])
  .map((s) => JSON.stringify({ t: t0, layer, c: s }));
const f = `${dossier}/${layer}.ndjson`;
appendFileSync(f, lignes.join('\n') + (lignes.length ? '\n' : ''));
if (process.env.GZIP) writeFileSync(`${f}.gz`, gzipSync(Buffer.from(lignes.join('\n'))));
console.log(`${layer}: ${lignes.length} lignes → ${f}`);
```
*Critères* : tourner 1 000 fois ne casse rien ; 0 écriture si le flux ne répond pas ; un seul fichier par jour et par flux ; jamais de contenu de personne.

**`api/4d.mjs` — relire le passé avec la même API que le présent**
```js
// express (déjà dans la stack) + duckdb ; aucune clé, aucun compte
import express from 'express'; import duckdb from 'duckdb';
const db = new duckdb.Database(':memory:');
const app = express();
app.get('/api/4d', (req, res) => {
  const { from, to, layer = 'opensky' } = req.query;
  if (!from || !to) return res.status(400).json({ erreur: 'from et to sont requis' });
  db.all(`SELECT * FROM read_ndjson_auto('data/4d/*/*.ndjson')
          WHERE layer = ? AND t BETWEEN ? AND ? LIMIT 50000`, [layer, +new Date(from), +new Date(to)],
    (e, rows) => e ? res.status(500).json({ erreur: String(e) }) : res.json({ layer, from, to, n: rows.length, etat: rows }));
});
app.listen(8787, '127.0.0.1');   // jamais 0.0.0.0 : c'est la règle n°3
```

**`src/timeline/replayer.js` — le curseur, pas un calque de plus**
```js
export function brancheHorloge(viewer, { vitesse = 3600 } = {}) {
  const c = viewer.clock;
  c.clockRange = Cesium.ClockRange.CLAMPED;
  c.multiplier = vitesse; c.shouldAnimate = false;
  c.startTime = Cesium.JulianDate.fromIso8601(localStorage.getItem('watchtower.4d.debut') || new Date().toISOString());
  viewer.timeline.show = true;
  return { aller: (iso) => (c.currentTime = Cesium.JulianDate.fromIso8601(iso)),
           play: (v) => { c.multiplier = v || vitesse; c.shouldAnimate = true; },
           pause: () => (c.shouldAnimate = false) };
}
// Chaque couche 4D s'abreuve au même endroit : sur « horloge.change », on redemande /api/4d?from=t-6min&to=t.
```

**`src/dark/darkVessels.js` — le motif « trou de signal », une seule fois pour tous les flux**
```js
// Un navire « sombre » = un silence de > X minutes dans une zone où le signal est continu.
// Aucun nom, aucune personne : un MMSI technique, une bbox, une durée. C'est tout.
export function trous(positionsParMmsi, { seuilMin = 15 } = {}) {
  const out = [];
  for (const [mmsi, pts] of positionsParMmsi) {
    for (let i = 1; i < pts.length; i++) {
      const dt = (pts[i].t - pts[i - 1].t) / 60000;
      if (dt >= seuilMin) out.push({ mmsi, depuis: pts[i - 1].t, jusqu: pts[i].t, minutes: Math.round(dt),
        derniere: pts[i - 1], reprise: pts[i] });
    }
  }
  return out.sort((a, b) => b.minutes - a.minutes);
}
// Le même code sert pour ADS-B (brouillage), AIS (dark transit), et un capteur terrain hors-ligne :
// documenter le motif, pas le contexte — c'est ce qui garde la tour légale et utile.
```

**`src/anchors/cameraPose.js` — l'ancrage multi-appareils, version tour**
```js
// Un client (téléphone, drone, caméra) envoie sa pose ; la tour la dessine. Aucune identité humaine.
const ws = new WebSocket(`ws://${location.host}/poses`);
ws.onmessage = (e) => {
  const p = JSON.parse(e.data);                 // { appareil, xyz:[..], q:[x,y,z,w], t }
  if (!p.appareil || !p.xyz) return;             // protocole fermé : pas de nom, pas de visage
  emit('pose.recue', p);
};
```
*Et le garde-fou* : `data/interdits.json` interdit ce champ s'il devient une identité (`persona`, `user`, `operateur`…).

**`tests/smoke.test.js` — la non-régression qui vaut le plus**
```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { etat } from '../src/core/registry.js';
test('tous les modules s\'enregistrent sans clé', () => {
  const { total, ko } = etat();
  assert.ok(total >= 20, `seulement ${total} modules chargés`);
  assert.deepEqual(ko, [], `modules cassés : ${ko.map(([n]) => n).join(', ')}`);
});
test('aucun module ne cite une cible interdite', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const interdits = JSON.parse(readFileSync('data/interdits.json')).mots_cles;
  for (const f of readdirSync('src').filter((x) => x.endsWith('.js'))) {
    const src = readFileSync(`src/${f}`, 'utf8').toLowerCase();
    for (const m of interdits) assert.ok(!src.includes(m.toLowerCase()), `${f} contient « ${m} »`);
  }
});
```

**`.github/workflows/ci.yml` — l'atelier, pas la vitrine**
```yaml
name: ci
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  tour:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm test
      - run: python3 -m py_compile audit/reference/*.py
      - run: python3 audit/reference/generate-reference.py && git diff --exit-code   # le généré ne doit pas diverger
      - run: python3 audit/reference/doctor.py --json > doctor.json; test -s doctor.json
      - uses: actions/upload-artifact@v4
        with: { name: etat-tour, path: doctor.json }
```
*Le `git diff --exit-code` est le plus utile des quatre* : il interdit à quiconque (humain ou agent) d'éditer `REFERENCE.md` à la main.

---

## 4. Quatorze tâches calibrées (une session chacune, critère mesurable)

| ID | Tâche | Fichiers touchés | Critère d'acceptation (sinon ce n'est pas fini) | Dépend de |
|---|---|---|---|---|
| R1 | Écrire `core/registry.js` + faire enregistrer les 57 modules existants sans changer leur comportement | `src/core/registry.js`, 57 × 3 lignes | `etat().total === 57`, `ko === []`, zéro clé requise, la tour s'affiche identique | — |
| R2 | `core/store.js` + migration `v1 → v2` + test de migration | `src/core/store.js`, `tests/migration.test.js` | un profil `v1` écrit par l'ancienne version se charge sans perte ; un JSON cassé ne fait plus planter la tour | R1 |
| R3 | `core/bus.js` +迁移 (migration) des 3 couples les plus couplés (`ficheLieu`/`intelTwin`/`mapStack`) | 4 fichiers | graphe d'appels directs réduit d'au moins 3 ; `historique()` montre les 20 derniers événements dans la console | R1 |
| R4 | Proxy local des clés (SearXNG/Ollama/AIS) + `keySetup` en mode « tester » | `api/proxy.mjs`, `src/keySetup.js` | `grep -r "localStorage.*key" src/` = 0 ; un `curl` depuis le LAN sur le proxy sans jeton renvoie 401 | R1 |
| R5 | Smoke test + CI (`node --test`, `generate-reference.py` idempotent, `doctor --json` en artefact) | 3 fichiers | le CI est rouge si un module lève ; `git diff --exit-code` après régénération passe | R1 |
| R6 | Garde-fou C12 : `data/interdits.json` + test + contrôle dans le proxy (allow-list de hosts) | 3 fichiers | ajouter « visage » dans un module rend le CI rouge ; le proxy refuse tout host hors liste | R4, R5 |
| R7 | `data/4d/` + 3 collecteurs (OpenSky, USGS, EONET) + rétention 30 j | `scripts/recorder/*` | après 24 h : 3 fichiers du jour, > 0 ligne, **taille < 100 Mo**, aucun échec non journalisé | R1 |
| R8 | `api/4d.mjs` (Parquet/DuckDB) + endpoint temporiel | 2 fichiers | `GET /api/4d?from&to&layer=opensky` renvoie N > 0 sur une heure écoulée, en < 300 ms | R7 |
| R9 | `viewer.clock` + `src/timeline/replayer.js` + trajectoires datées | 2 fichiers | aller à t-6 h, revenir, et le calque suit ; 30 FPS maintenus à ±6 h (métrique §5) | R8 |
| R10 | `src/voice/sttLocal.js` + `ttsLocal.js` derrière un flag, `freeVoice.js` conservé | 3 fichiers | question vocale → transcription affichée → réponse parlée, **sans réseau** ; flag `!localVoice` restaure l'ancien | R1 |
| R11 | `src/ocr.js` (Tesseract worker) branché sur `ficheLieu` (glisser une image) | 2 fichiers | une capture PNG de 200 mots donne ≥ 80 % de reconnaissance sur du texte FR net, en < 8 s, hors-ligne | R1 |
| R12 | `src/splats.js` : charger un `.spz` dans le globe, budget mémoire, LOD | 2 fichiers | un scan de 20 M de splats tient sous 1,5 Go GPU et 30 FPS ; désactivation propre | R1, R6 |
| R13 | Exposer le registre à la console de la tour (`cherche.py --json` via un endpoint local) | 2 fichiers | « tour : quel outil pour lire un PDF » → 3 réponses avec prix, licence, état `doctor` | R5 |
| R14 | `APPLIQUER.md` transformé en build reproductible (lockfile, patchs numérotés, CI qui rejoue) | 3 fichiers | depuis `git clone` + une commande : tour à jour sur commit amont épinglé, et le diff des 57 mods est relisible | R5 |

---

## 5. Six indicateurs (ils valident plus sûrement qu'une revue de code)

| Indicateur | Comment le mesurer | Aujourd'hui (à relever) | Cible raisonnable |
|---|---|---|---|
| **Démarrage à froid sans clé** | `curl -o /dev/null -w '%{time_total}' http://127.0.0.1:4173/` + chronomètre jusqu'au globe interactif | ? | < 3 s |
| **Modules en erreur au boot** | `etat().ko` dans la console | ? (inconnu, cf. C1) | 0 |
| **Mémoire de la page** | `performance.memory.usedJSHeapSize` avec 5 calques + splats, ou `chrome://memory` | ? | < 1,2 Go |
| **Images/seconde sous 5 calques** | compteur maison sur `scene.postRender` | ? | ≥ 30 FPS |
| **Couverture du socle** | `python3 audit/reference/doctor.py --json` → ratio `ok/(ok+absent)` | `0/86` dans ce sandbox | 100 % sur le poste réel en P9 fini |
| **Données conservées** | `du -sh data/4d/` et nombre de jours contigus sans trou | 0 (n'existe pas) | ≥ 27 jours sur 30 glissants |

Un indicateur qui n'a pas de commande pour le produire n'est pas un indicateur : la colonne « comment » est obligatoire.

---

## 6. Anti-patterns (les dix pièges où ce genre de projet meurt)

1. **Réécrire en React/Vue.** 57 modules qui marchent, zéro test : la réécriture consomme six mois et ne crée aucune capacité. `proto-cognitorium` est l'exemple du problème, pas de la solution.
2. **Ajouter Postgres/Kafka/Redis** avant que `data/4d/` existe. Parquet + DuckDB sur un SSD local tient des dizaines de millions de lignes à 0 € et sans daemon ; la base-serveur n'a de sens que pour plusieurs opérateurs.
3. **Microservices / docker-compose de 12 conteneurs.** Chaque service est une surface d'attaque, un souci de boot et un non-dit de licence. Un process Node + un Python + SearXNG suffit.
4. **Authentification maison.** Si la tour doit s'exposer : reverse-proxy avec basic-auth/Tailscale, jamais un login écrit à la main.
5. **Prendre `gods-eye-view` ou un repo `NOASSERTION` en dépendance de build** (règle n°3/4 de `REFERENCE.md`) — la recette de patchs est la seule voie propre.
6. **Brancher un LLM cloud « pour tester »** sans bannière ni journal : c'est la sortie de données la plus silencieuse qui soit, et elle contredit le `startGate` existant.
7. **Cacher une réponse invalide** en corrigeant le JSON à la volée : la tour doit afficher *pourquoi* elle n'est pas sûre, sinon elle devient une machine à convictions (règle n°13).
8. **Ajouter un calque avant le journal** : chaque jour sans `data/4d/` est irréversible (C7), alors qu'un calque de plus ne coûte qu'un après-midi.
9. **Faire un test qui dépend d'un service externe** (OpenSky, Copernicus) sans repli : il sera rouge demain et quelqu'un le supprimera. Les tests sont hors-ligne ; les collecteurs ont un fixture.
10. **Traiter une personne comme une entité.** Le calque qui « marche dans une démo » (visage, trajectoire individuelle, yacht d'un dirigeant) est celui qui ferme le projet. Le garde-fou R6 existe pour que ce soit le CI qui le dise, pas la mémoire.

---

## 7. Recalculer les chiffres de ce document

Les 3 chiffres qui comptent ici (24 fichiers à créer · 3 visés existants · 10 entrées de P9 · 25 besoins) viennent du **registre généré**, pas d'une appréciation :

```bash
python3 audit/reference/generate-reference.py            # régénère (idempotent)
python3 - <<'PY'
import json, re
d = json.load(open('audit/reference/REGISTRE-OUTILS.json'))
cibles = {}
for t in d['outils']:
    for m in re.findall(r'`?(src/[A-Za-z0-9/._-]+\.(?:js|mjs)|scripts/[A-Za-z0-9/._-]+\.(?:mjs|js|sh)|api/[A-Za-z0-9/._-]+\.(?:js|mjs))`?',
                        t.get('integree','') + ' ' + ' '.join(t.get('install', []))):
        cibles.setdefault(m, []).append(t['id'])
print(len(cibles), 'fichiers visés —', cibles.keys())
PY
python3 audit/reference/cherche.py --liste --ids                 # tout le registre, 1 ligne par outil
python3 audit/reference/doctor.py --json                         # l'état réel, pas l'état voulu
```

Idée à valider plus tard (non appliquée, ce tour-ci on ne modifie rien) : ajouter au générateur une assertion « chaque `integree` cible soit un fichier existant du repo de la tour, soit un id présent dans `data/a-creer.json` » — le désynchronisation module ↔ fiche deviendrait impossible.

---

## 8. Comment demander la suite (à un agent ou à un dev)

Ce qui a produit du travail *recevable* dans cette session, et ce qui en produit moins :

| Formulation | Effet |
|---|--- |
| « **R1** : écris `core/registry.js`, fais enregistrer les 57 modules, et passe le critère `ko === []` sans clé ; pousse avec le test. » | ✅ bornée, critère explicite, aucune liberté créative sur le périmètre |
| « Rends la tour 4D. » | ❌ quatre semaines et un patch de 3 000 lignes |
| « Ajoute un LLM. » | ❌ va installer un cloud ; préciser « local via `src/ai/llmClient.js`, repli affiché, aucun appel sortant sans drapeau » |
| « Installe Marker. » | ❌ hors périmètre : exiger « et le module `src/docs/markerClient.js` qui le branche sur `ficheLieu`, sinon l'installation ne sert à rien » (cf. C11) |

**À exiger en retour de toute tâche** (la checklist est déjà dans `REFERENCE.md` §4) : le diff, la commande de vérification **avec exit code**, la régénération du registre si un outil a été ajouté, `doctor.py` après, et une ligne de décision committée. Une tâche sans preuve d'exécution n'est pas finie — c'est la règle qui a évité, dans cette session, d'écrire « testé » pour des scripts que ce sandbox ne peut pas exécuter.
