# La base INTEL — connaissance territoriale consolidée

> Ce document décrit **ce que Watchtower sait du territoire**, d'où vient chaque
> donnée, comment la régénérer, et comment un **autre dépôt** (monorepo,
> COGNITORIUM, proto-cognitorium) peut la consommer sans connaître le code 3D.

---

## 1. Pourquoi une base, et pas seulement des appels d'API

Les vues de l'INTEL interrogent des services en direct : cadastre IGN, Géorisques,
recherche-entreprises, GDELT. C'est indispensable et fragile : une API qui ne
répond pas laisse l'écran vide, et un chiffre lu à l'écran ne dit ni **qui** le
publie, ni **quand**, ni **quel chiffre contradictoire** existe ailleurs.

La base INTEL répond à l'autre question : **qu'est-ce qu'on sait déjà, qui le dit,
et qu'est-ce qu'on ne sait pas ?** Elle est :

- **datée** — chaque source porte sa date de consultation ou de publication ;
- **sourcée** — chaque chiffre renvoie à sa source, pas à « une étude » ;
- **honnête sur ses trous** — 13 lacunes publiées, dont un angle mort nº1 ;
- **arbitrée** — 10 contradictions connues sont conservées avec le choix retenu ;
- **hors ligne** — elle s'affiche et s'exporte sans réseau.

## 2. Ce que contient la base (comptes réels, vérifiés par test)

| Bloc | Volume | Ce que c'est |
|---|---|---|
| Fiches projets | **13** | §7 du dossier : statut, budget, financeurs, calendrier, maîtrise d'œuvre, contenu, enjeux, liens |
| Chiffres sourcés | **32** | chaque valeur suivie de sa ligne « Source » (INSEE, agglo, Ville, presse datée) |
| Sources du dossier | **110** | annexe A du dossier : 46 officielles, 50 de presse, 14 juridiques et financières |
| Lacunes | **13** | annexe B : ce que la Ville et l'agglo n'ont pas publié (angle mort nº1 : fréquentation de la gare / programmation du PEM) |
| Contradictions | **10** | chiffres divergents entre sources et arbitrage retenu (population d'agglo, dette, budget, superficie du vignoble…) |
| Vigilances | **5** | pièges méthodologiques (commune ≠ agglo ≠ SMBT, population municipale ≠ totale…) |
| Nœuds d'atlas | **79** | graphe du territoire : territoires, quartiers, acteurs, projets, risques, futurs |
| Liens d'atlas | **167** | qui touche à quoi (gouverne, finance, tension, dessert, hérite…) |
| Communes de l'agglo | **14** | Sète Agglopôle Méditerranée : 23 indicateurs INSEE par commune (population, revenus, pauvreté, chômage, vacance, résidences secondaires…) |
| Scénarios 2040 | **3** | « Thau tranquille », « Couronne métropolitaine », « Pôle de la transition ★ » |
| Veille officielle | **24** | sources publiques à brancher, familles, licences, cadences, dates de vérification |

Peuplement total de l'agglo dans la base : **131 216 habitants** (somme des
14 communes). Frontignan : **24 136 hab.** (populations légales 2023), 2ᵉ commune
de l'agglo, 7ᵉ de l'Hérault.

## 3. Où sont les fichiers

| Fichier | Rôle | Maintenu à la main ? |
|---|---|---|
| `src/data/frontignanDossier.js` | la base du dossier territorial + vision | ❌ **généré** |
| `src/data/atlasThau.js` | l'atlas de Thau + les 14 communes | ❌ **généré** |
| `src/data/veilleOfficielle.js` | le registre des sources publiques | ✅ à la main |
| `src/dossierIntel.js` | lecture, rapprochements, exports, contrat | ✅ à la main |
| `src/intelDossierVue.js` | la vue 📚 DOSSIER (DOM) | ✅ à la main |
| `tools/extraire-dossier-frontignan.mjs` | extracteur du dossier | ✅ à la main |
| `tools/extraire-atlas-thau.mjs` | extracteur de l'atlas | ✅ à la main |
| `tools/exporter-intel.mjs` | export JSON + CSV | ✅ à la main |
| `public/data/intel/` | **les artefacts exportés** (JSON + 6 CSV) | ❌ **généré** |

## 4. Régénérer la base

```bash
# 1) récupérer les sources (hors dépôt : monorepo + branche atlas)
git clone --depth 1 --filter=blob:none https://github.com/Sathancabrol/monorepo.git /tmp/monorepo-inspect
gh api repos/Sathancabrol/monorepo/contents/projects/frontignan/atlas/data/atlas.json?ref=arena/01a08203-monorepo --jq .content | base64 -d > /tmp/autres-repos/atlas.json
gh api repos/Sathancabrol/monorepo/contents/projects/frontignan/atlas/data/communes-thau.csv?ref=arena/01a08203-monorepo --jq .content | base64 -d > /tmp/autres-repos/communes-thau.csv

# 2) régénérer les deux bases (empreinte SHA-256 affichée pour tracer la source)
node tools/extraire-dossier-frontignan.mjs \
  --rapport /tmp/monorepo-inspect/projects/frontignan/rapport-frontignan-analyse-territoriale.md \
  --vision  /tmp/monorepo-inspect/projects/frontignan/vision-frontignan-2026-2040.md
node tools/extraire-atlas-thau.mjs --atlas /tmp/autres-repos/atlas.json --communes /tmp/autres-repos/communes-thau.csv

# 3) vérifier (aucune donnée n'est inventée : les contrôles portent sur la structure)
node --test src/dossierIntel.test.mjs

# 4) exporter pour les autres branches et dépôts
node tools/exporter-intel.mjs
```

Les extracteurs **ne résument pas, n'interprètent pas, n'ajoutent pas** une seule
donnée : ils rangent. Quand le dossier écrit « montants non publiés ❓ », la base
écrit la même chose. Les marqueurs du dossier sont conservés :
**✅** fait constaté · **📅** annoncé · **🔮** tendance · **⚠️** incertain ·
**❓** non publié.

## 5. Consommer la base depuis un autre dépôt

### 5.1 Le document JSON (aucune dépendance)

`public/data/intel/watchtower-intel.json` — écrit par `tools/exporter-intel.mjs`,
récupérable aussi depuis l'application servie (`/data/intel/watchtower-intel.json`).

```python
import json, urllib.request
base = json.load(open('public/data/intel/watchtower-intel.json'))
print(base['contrat'], base['version'])            # watchtower.intel 1.0.0
for p in base['entites']['projets']:
    print(p['nom'], '—', p['statut'][:60])
frontignan = next(c for c in base['entites']['lieux'] if c['id'] == 'commune:34108')
print(frontignan['population'])                    # 24136
```

Structure : `contrat`, `version`, `genere_le`, `provenance`, `territoires`
(commune, agglo, chemin d'échelle), `entites` (lieux, projets, indicateurs,
sources, lacunes, contradictions), `vision`, `statistiques`.

### 5.2 Les CSV

Six fichiers, séparateur `;`, UTF-8, en-tête en français :
`projets.csv`, `communes-thau.csv`, `indicateurs.csv`, `sources.csv`,
`veille.csv`, `lacunes.csv`. Ils s'ouvrent dans LibreOffice, se lisent en
`pandas.read_csv(..., sep=';')` et se recollent dans un tableur sans retouche.

### 5.3 Les modules JS (si le dépôt lit du JavaScript)

```js
import { etatTerritoire, ficheProjet, ficheCommune, lacunesOuvertes, versCsv, versJson } from './src/dossierIntel.js';
```

Points d'entrée les plus utiles :

| Fonction | Réponse |
|---|---|
| `etatTerritoire()` | population, rang, agglo, projets avec montant, risques, connaissance |
| `ficheProjet('7.3')` | la fiche §7 + le nœud d'atlas + les voisins du graphe + la fiabilité |
| `ficheCommune('Sète')` | les 23 indicateurs INSEE + ce que l'atlas en dit |
| `lacunesOuvertes()` | angle mort, lacunes, contradictions, vigilances |
| `cheminTerritoire()` | FRANCE → OCCITANIE → HÉRAULT → THAU → FRONTIGNAN |
| `scenariosCompare()` | les trois 2040, moteur, population, économie, risque |
| `planDeBranchement()` | quelles sources brancher, par famille, avec leur API |
| `versJson()` / `versCsv(type)` | export complet ou ciblé |

## 6. Le contrat d'échange `watchtower.intel@1.0.0`

Le plan de convergence du monorepo prévoit deux câblages qui concernent
directement cette base :

- **lien 6 — watchtower → Core** : brancher `Place`/`Project` sur PostGIS ;
- **lien 7 — proto ↔ watchtower** : `intelTwin`, la « carte cognitive T0 ».

La base répond aux deux avec des entités normalisées :

| Entité | Champs |
|---|---|
| `territoire` | id, nom, code_insee, population, parents, indicateurs, sources |
| `lieu` | id, type, nom, niveau, parent, population, texte, faits, sources |
| `projet` | id, nom, nature, statut, budget, financeurs, calendrier, maîtrise d'œuvre, lieu_id, sources, lacunes |
| `indicateur` | zone, indicateur, valeur, unité, évolution, période, source_url, fiabilité |
| `source` | id, libellé, url, date, type, famille, vérifié_le |
| `lacune` | rang, texte, gravité, demandeur |

Règles inscrites dans le contrat :

1. une donnée sans source n'est **pas** exportée comme un fait : elle sort en lacune ;
2. les estimations restent marquées (🔮 / ❓ / ⚠️) ;
3. un rapprochement éditorial (fiche §7 ↔ nœud d'atlas) est **déclaré** dans
   `RAPPROCHEMENTS`, jamais fondu dans la donnée ;
4. les contradictions connues sont **publiées avec leur arbitrage**, pas supprimées.

## 7. Honnêteté : ce que la base ne fait pas

- Elle **ne vérifie pas** les chiffres du dossier : elle les recopie avec leur
  source et leur date. Les jugements stratégiques (SWOT, recommandations) sont
  ceux de l'auteur du dossier ; la base les cite sans les valider.
- Elle **ne comble pas** les trous : les 13 lacunes sont publiées telles quelles.
- Elle **ne devine pas** les coordonnées : l'atlas ne porte pas de géométrie, donc
  aucun point n'est fabriqué. Le rattachement géographique reste l'affaire du
  cadastre IGN et de la BAN, en direct.
- Elle **ne masque pas** les divergences : quand deux sources se contredisent
  (population d'agglo 129 982 / 131 033 / 131 216 / 132 851), les valeurs et
  l'arbitrage sont tous visibles.

## 8. Les deux ajouts du 07/10/2026

| Ajout | Fichier | Ce que ça donne |
|---|---|---|
| **Onglet 🏗 CHANTIER** | `src/data/dossierChantier.js` (généré par `tools/extraire-dossier-chantier.mjs`) | Le **gabarit des 27 pièces** d'un dossier de marché réel, en 6 phases (consultation, préparation, plans, exécution, réception, normes), extrait d'un inventaire de **220 fichiers / 225 Mo**. « Présente » veut dire qu'un fichier correspond — c'est un inventaire, pas un contrôle de conformité |
| **Onglet ⚖️ PREUVES** | `registreClaims()` dans `src/dossierIntel.js` | **68 affirmations classées** : 30 établies ou annoncées, 10 contredites (chacune avec son arbitrage), 15 non publiées, 13 inconnues. Méthode de la synthèse Talbot : rien n'est présenté comme établi sans vérification |
| **Vue 🔎 TERRAIN** | `src/sourcesOfficielles.js` + `src/intelTerrainVue.js` | **Sept connecteurs officiels** (PLU, cadastre, DVF, BOAMP, DECP, nature, commune) purs et testés, avec dégradation honnête : source injoignable ⇒ URL exacte affichée, jamais de réponse inventée |

### Le garde-fou `nombreOuNull`

La leçon la plus utile de cette session de code : en JavaScript, `Number(null)`,
`Number('')` et `Number(' ')` valent tous **`0`**. Une contenance de parcelle ou un
montant de marché non publié aurait donc pu s'afficher « 0 m² » ou « 0 € » — un
mensonge silencieux. `nombreOuNull()` renvoie `null` (donc « non publié ») et laisse
`0` n'être que ce qu'il est : un vrai zéro. Cinq tests couvrent ce cas.

## 9. Vérifications automatiques

`src/dossierIntel.test.mjs` (22 tests) et `src/sourcesOfficielles.test.mjs` (20 tests)
contrôlent, à chaque exécution de `npm test` :

- l'intégrité des trois bases (identifiants, liens de graphe, familles de sources,
  dates de vérification, URL en HTTPS, rapprochements valides) ;
- les volumes et les chiffres de référence (24 136 hab., 14 communes, 13 projets,
  32 chiffres, 79 nœuds, 167 liens, 3 scénarios) ;
- la forme des exports (contrat versionné, entités non vides, CSV à 15 et 14
  lignes, séparateur `;`) ;
- l'honnêteté du dispositif : les lacunes, contradictions et marqueurs de
  fiabilité sont bien présents dans les exports.
