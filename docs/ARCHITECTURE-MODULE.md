# 🧩 WATCHTOWER COMME MODULE — architecture et ordre d'implémentation

> ⏸ **DIFFÉRÉ — décision de l'utilisateur, 06/10/2026.** *« ici on se
> concentre sur watchtower, on cherche pas à le connecter à proto cog ».*
> Le rattachement n'est **pas** à l'ordre du jour. Ce document reste comme
> analyse de fond : les obstacles mesurés au §2 sont de vraies dettes, qui
> gênent **aussi** l'application autonome. On les traitera pour elle-même, et
> si la fusion revient un jour, le terrain sera prêt. **Ne pas lancer les
> étapes 1 à 5 au nom de la fusion.**

**06/10/2026.** Ce document répond à une seule question : *comment
WATCHTOWER devient un morceau de l'application complète, sans cesser de
fonctionner seul en attendant ?*

C'est le document de cap. `AGENTS.md` dit comment reprendre le travail ;
celui-ci dit **dans quel ordre** et **pourquoi dans cet ordre**.

---

## 1. La cible réelle

L'écosystème de l'utilisateur, relevé sur GitHub le 06/10/2026 :

| Dépôt | Rôle | Pile |
|---|---|---|
| **`proto-cognitorium`** | **le prototype de l'app complète** | React 19, TypeScript, Vite 6, Tailwind 4, three.js, express |
| `COGNITORIUM` | outils de visualisation cognitive | JavaScript |
| `animation-chronos` | animation | TypeScript |
| `HCSM` | modèle d'état cognitif humain | Python |
| `reaserch-engine` | moteur de recherche | Python |
| `Language-decoder` | décodeur multimodal | — |
| `ETAT-DE-LART-PSYCHOLOGIE` | état de l'art | HTML |
| `monorepo` | fonds documentaire (PDF, marchés, CCTP) | documents |
| **`watchtower`** | **le volet géospatial** | JavaScript, Cesium, Vite 6 |

Conclusion qui commande tout le reste : **l'hôte est React + TypeScript +
Tailwind, et WATCHTOWER est du JavaScript natif qui possède sa page.** Ce
n'est pas un détail de style, c'est le problème d'architecture à résoudre.

## 2. Ce qui bloque aujourd'hui, mesuré

| Obstacle | Mesure | Pourquoi ça bloque |
|---|---|---|
| La page appartient à WATCHTOWER | `index.html` = 925 lignes, 30 enfants de `<body>` | Les modules cherchent des `id` qui n'existeront pas chez l'hôte |
| DOM adressé en dur | **366** `getElementById`, **866** `querySelector` | Aucun moyen de monter deux instances, ni de monter dans un sous-arbre |
| CSS global | **9 623** lignes, **733** règles ouvrant sur un `#id`, **51** `!important` | Déborde sur Tailwind, et Tailwind déborde sur nous |
| État dans une globale | **162** usages de `window.__godsEyeView` | Invisible pour React, impossible à tester en isolation |
| Poids | bundle **2,38 Mo** + `egm96` **2,77 Mo** + data centers **2,5 Mo** | Un hôte n'acceptera pas ça au premier rendu |
| Identité du paquet | `package.json` dit encore `gods-eye-view` | Ambigu au moment d'empaqueter |

Rien là-dedans n'est un défaut de code : c'est ce qu'on obtient quand on
part d'une application autonome. Mais c'est exactement la dette à payer.

## 3. La règle qui décide de l'ordre

> **Chaque étape doit payer deux fois : une fois tout de suite pour
> l'application autonome, une fois le jour de la fusion.**

Un refactor qui ne sert qu'à la fusion est refusé. Raison : la fusion n'a pas
de date, l'application est utilisée **maintenant** par Näthan et ses amis, et
le bac à sable se réinitialise trop souvent pour qu'on se permette un grand
chantier invisible. On avance par couches qui tiennent debout seules.

Corollaire : **aucun big bang.** On enveloppe l'existant, on ne le réécrit
pas. Les 3 480 tests sont le filet.

## 4. L'ordre retenu

### Étape 1 — Le noyau de données, publiable tel quel 🔥

**Quoi.** `src/data/**` est déjà pur : aucun DOM, aucun réseau, aucune clé.
`territoire/` (Thau, Frontignan, gouvernance), `geo/echelleVue.js`,
`osint/sourcesDocuments.js`, `soleil/`, `ui/calques.js`,
`volant/taxonomie.js`. On lui donne un `index.js` unique, un `README`, et on
gèle sa surface publique par un test.

**Paye tout de suite** : une frontière nette entre données et affichage,
donc des tests plus rapides et une base plus facile à enrichir — ce qui est
la consigne de fond.
**Paye à la fusion** : `proto-cognitorium` peut importer ce noyau **dès
demain**, sans Cesium, sans CSS, sans DOM. C'est le premier rattachement
réel entre les deux dépôts, et il coûte presque rien.

> C'est pour ça qu'il passe en premier : c'est le seul point du plan qui
> produit de l'intégration immédiate.

### Étape 2 — Le CSS dans une couche en cascade

**Quoi.** Envelopper `style.css` dans `@layer watchtower { … }`. Une
règle de l'hôte hors couche l'emporte alors automatiquement sur les nôtres,
**sans toucher un seul des 733 sélecteurs**. Dans la foulée, inventorier les
51 `!important` (qui, eux, traversent les couches) et en supprimer ce qui
peut l'être.

**Paye tout de suite** : la classe de bugs « un `!important` sur une classe
bat un `display` sur un id » disparaît par construction.
**Paye à la fusion** : Tailwind et WATCHTOWER cohabitent sans guerre de
spécificité. Coût très faible, protection très grande.

### Étape 3 — Un point de montage, `monter(hôte, options)`

**Quoi.** Aujourd'hui `main.js` s'exécute au chargement contre une page
figée. On extrait le balisage de `index.html` en **fragment**, et on expose
`monter(élémentHôte, options) → { arrêter() }`. `index.html` devient une
coquille de dix lignes qui appelle `monter(document.body)`.

**Paye tout de suite** : un ordre de démarrage déterministe, et la fin du
piège n°4 (« monter un panneau après le volant le laisse grisé »), qui n'est
qu'un symptôme de l'absence d'ordre explicite.
**Paye à la fusion** : c'est **le contrat d'intégration**. Un composant React
devient trois lignes dans un `useEffect`.

### Étape 4 — Un manifeste de modules

**Quoi.** Le patron existe déjà, en trois exemplaires (`calques.js`,
`taxonomie.js`, `registreBascules.js`). On le généralise : chaque
fonctionnalité déclare `{ id, catégorie, calque, racineDOM, dépend, démarrer,
arrêter, coûtRéseau }`. Le volant, les bascules et les tests d'intégrité
lisent ce manifeste au lieu de le déduire.

**Paye tout de suite** : « tout doit être togglable » devient vrai par
construction au lieu d'être vérifié après coup, et `arrêter()` règle
« masquer du DOM n'éteint pas une entité Cesium ».
**Paye à la fusion** : l'hôte choisit **un sous-ensemble** de WATCHTOWER —
juste la carte, ou juste le fil de contexte. C'est ça, la modularité réelle.

### Étape 5 — Le budget de démarrage

**Quoi.** Sortir du chemin critique ce qui n'est pas vu au premier écran :
les 2,5 Mo de data centers, les 730 ko de câbles et de barrages, les 2,77 Mo
d'`egm96` — en import dynamique, déclenché par la bascule correspondante.
Puis `PMTiles` pour servir l'Hérault en statique (catalogue `MOT-11`).

**Note.** Découper le bundle **Cesium** reste écarté, c'est une impasse déjà
explorée. Ici il s'agit des **données**, pas du moteur : rien à voir.

**Paye tout de suite** : l'app démarre vite chez les amis, et le mode hors
ligne devient atteignable.
**Paye à la fusion** : un hôte refuse un module de 8 Mo au premier rendu.

### Étape 6 — Les chantiers de fonctionnalité, par-dessus

Dans l'ordre déjà arrêté avec l'utilisateur, et **en s'appuyant sur les
étapes 1 à 5** plutôt qu'en les contournant :

| Rang | Chantier | Ce que les étapes précédentes apportent |
|---|---|---|
| 1 | **G** — fil de contexte modifiable | manifeste (ordre, filtres, mémorisation) |
| 2 | **A4 / A1 / A3** — minicarte | `cobe` au lieu d'un 2ᵉ contexte Cesium |
| 3 | **E** — vue communale animée | noyau `territoire/`, BD TOPO, `maplibre-gl-draw` |
| 4 | **F** — INTEL mondial / national / régional | GDELT GEO, Eurostat, Banque mondiale |
| 5 | **D** — multicam | `hls.js`, catalogue osiris, lecteurs officiels |
| 6 | **C** — connexions externes | limité par les conditions d'usage, pas par nous |

### Étape 7 — Hygiène avant fusion

Les 4 tests rouges réparés, `package.json` renommé en `watchtower` **en
conservant la mention de Bilawal Sidhu** (la licence MIT l'exige, et c'est
simplement correct), `POTES.md` écrit, `CHANGELOG` à jour.

## 5. Ce qu'on ne fera pas, et pourquoi

- **Réécrire en TypeScript.** Coût énorme, bénéfice surtout cosmétique :
  Vite consomme du JavaScript natif sans broncher, et on peut décrire la
  surface publique en `.d.ts` si l'hôte en a besoin. À revoir seulement si
  la fusion l'impose.
- **Passer en React.** WATCHTOWER manipule un contexte WebGL ; le faire
  piloter par un rendu React serait un recul. L'enveloppe `monter()` suffit.
- **Introduire un serveur.** C'est la ligne rouge : elle est ce qui permet à
  chaque ami de lancer l'app depuis son propre agent sans rien payer.
- **Un shadow DOM.** Séduisant pour l'isolation, mais Cesium et les
  mesures de mise en page s'y comportent mal. `@layer` donne 90 % du
  bénéfice pour 1 % du risque.

## 6. Comment savoir si une étape est réussie

| Étape | Preuve attendue |
|---|---|
| 1 | Un fichier Node importe le noyau et lit des données de Thau, sans DOM |
| 2 | Une feuille de style injectée après la nôtre gagne sans `!important` |
| 3 | Deux instances montées dans deux conteneurs, puis arrêtées proprement |
| 4 | Un test refuse qu'une fonctionnalité existe hors du manifeste |
| 5 | Premier rendu sous 1,5 Mo, mesuré sur `dist/` |
