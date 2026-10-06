# AUDIT — sources, coûts et dépôts à reprendre
**6 octobre 2026 · avant toute intégration**

Rapport demandé avant de coder quoi que ce soit : ce qu'on a, ce qu'on veut,
ce qui existe, et à quel prix.

Les tableaux complets sont dans `docs/audit/` (CSV, séparateur `;`,
ouvrables tels quels dans un tableur) :

| Fichier | Contenu |
|---|---|
| `01-ce-quon-a.csv` | Les 38 couches réellement branchées aujourd'hui |
| `02-ce-quon-veut.csv` | Les chantiers ouverts, faisabilité et blocages |
| `03-publication-scientifique-eu.csv` | La piste européenne (ORE) et ses alternatives |
| `04-repos-github.csv` | Dépôts audités, ce qui est récupérable |
| `05-ce-qui-existe-cout.csv` | Catalogue des sources par coût |

---

## 1. La plateforme européenne : oui, et c'est Open Research Europe

Vous avez raison, elle existe. **Open Research Europe (ORE)**, lancée par la
Commission européenne en 2021. Trois choses à en retenir :

- **Gratuite des deux côtés** — gratuite à lire, et gratuite à publier, les
  frais étant pris en charge. C'est exactement l'anti-péage.
- **Elle change d'échelle en ce moment.** Depuis décembre 2025 le Conseil du
  CERN a validé que le CERN héberge et exploite la plateforme ; à l'automne
  2026 elle passe sur Open Journal Systems, portée par 16 à 17 financeurs
  nationaux, et s'ouvre aux chercheurs de 11 pays au lieu des seuls projets
  Horizon. C'est probablement ce que vous avez vu passer.
- **Évaluation par les pairs ouverte** : l'article est publié d'abord, les
  relectures signées sont publiées à côté. Pour de l'OSINT, c'est précieux —
  on voit qui conteste quoi.

**Peut-on la prendre ? Oui, mais pas en direct.** ORE n'expose pas d'API
publique documentée. En revanche son contenu est poussé vers les archives
ouvertes et les bases de citations — donc **nous le lisons déjà** via
OpenAIRE et par DOI, qui sont branchés depuis la couche DOCS d'hier. Le vrai
gain n'est donc pas ORE lui-même, mais trois sources européennes voisines que
nous n'avons pas :

| À ajouter | Pourquoi | Coût |
|---|---|---|
| **Europe PMC** | 40 M de notices, texte intégral, **aucune clé**, 10 req/s. Meilleur que PubMed Central pour nous, et européen. Couvre la conchyliculture, les malaïgues, la qualité des eaux. | Gratuit |
| **CORDIS** | Résultats des projets financés par l'UE : relie un sujet local à un projet européen et à son budget. | Gratuit |
| **data.europa.eu** | Le pendant européen de data.gouv.fr. | Gratuit |
| **Crossref** | Transforme un DOI en référence propre et citable. | Gratuit |

---

## 2. Audit des dépôts GitHub

J'ai regardé ce qui bouge vraiment dans ce domaine. Trois prises nettes :

**`simplifaisoul/osiris`** (~9 900 ★, **MIT**, Next.js + MapLibre) — la
meilleure prise immédiate. Pas pour son code, qui est une autre pile, mais
pour ses **catalogues** : 17 000 caméras publiques rattachées à leur
opérateur, 23 flux d'information en direct. MIT, donc reprenables avec
attribution. C'est du travail de curation que nous n'aurons pas à refaire.

**`AndrewCTF/velocity`** (94 ★, React + Python + **Cesium**) — le plus proche
de nous techniquement, c'est le seul qui utilise le même moteur. Son idée
intéressante : **l'historique de positions qu'on garde et qu'on rejoue**,
sans aucune clé. Transposable chez nous en pur front.

**`ni5arga/sightline`** (566 ★, Overpass) et **`cipher387/osintmap`** (233 ★)
— deux jeux de gabarits de requêtes OSM et un répertoire de 614 services par
pays, cadastres et registres compris. Directement utile pour enrichir la base
Thau hors ligne.

**Ce que j'écarte, et pourquoi.** SpiderFoot, IntelOwl, Sherlock, et le
toolkit Recon de Shadowbroker ou d'Osiris : **ils exigent tous un serveur**.
Un navigateur ne peut pas faire de requête DNS, de WHOIS ni de scan de port —
ce n'est pas une limite de notre code, c'est le bac à sable du navigateur.
Les reprendre voudrait dire héberger un serveur, et donc casser ce qui fait
que vos amis peuvent lancer l'app depuis leur propre agent sans rien payer.
IntelOwl est en plus sous AGPL, une licence contaminante.

Sherlock, je l'écarte aussi pour une autre raison : chercher un pseudo sur
400 sites, c'est enquêter sur des personnes. Ce n'est pas ce que fait cette
application.

---

## 3. Ce que ça coûterait de dévier

| Source | Coût | Verdict |
|---|---|---|
| Google Maps Platform | Payant au-delà du crédit mensuel | Écarté |
| Mapbox | Gratuit jusqu'à 50 000 chargements/mois | Écarté — MapLibre suffit |
| Shodan | Payant, gratuit quasi nul | Écarté |
| Windy | Payant au-delà | Écarté — Open-Meteo suffit |
| Scopus / Web of Science | Licence établissement | Écarté |
| **Cesium ion** | Gratuit puis payant | **Point de vigilance** — nous utilisons le jeton par défaut, dont le quota est partagé |

Le seul vrai risque financier latent est **Cesium ion**. Tout le reste de la
pile est gratuit et sans clé, ou gratuit avec une clé gratuite.

---

## 4. Trois points de vigilance

1. **Cesium ion** — jeton par défaut, quota partagé. Si l'app est utilisée par
   plusieurs amis, prévoir que chacun mette son propre jeton gratuit.
2. **OpenSky** — fortement bridé en anonyme. La couche avions sera décevante
   tant qu'un compte gratuit n'est pas configuré.
3. **Overpass** — serveur public et saturable. Plus on embarque de données
   Thau en local, moins on en dépend. C'est un argument de plus pour la
   consigne « enrichir la base ».

---

## 5. Ordre proposé

1. Les quatre sources européennes gratuites et sans clé (Europe PMC, CORDIS,
   data.europa.eu, Crossref) — complètent la couche DOCS livrée hier.
2. Les catalogues d'Osiris (caméras, flux), filtrés sur la France.
3. Les gabarits Overpass de sightline + la ligne France d'osintmap, versés
   dans la base Thau hors ligne.
4. Ensuite seulement, les chantiers d'interface restants (fil contexte,
   minicarte, vue communale).

Rien n'est intégré à ce stade : ce rapport est le préalable que vous avez
demandé.
