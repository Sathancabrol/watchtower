# Hub INTEL — socle territorial

## Pourquoi

`docs/AUDIT.md` liste trois lacunes voisines qui n'en font qu'une :

| # | Lacune | Traitée par |
|---|---|---|
| #3 | Pas de drill-down dans l'arborescence INTEL | `creerNoeud` / `trouverNoeud` / `cheminVers` |
| #4 | « Le Bloomberg de la ville » : pas de croisement | l'entonnoir à 5 échelles |
| #5 | Vue « analyse territoriale » non câblée | `dossierFrontignan()` |

`src/intelTwin.js` (73 Ko) n'exporte que `lireProfil` et `initIntelTwin` : aucune
structure de données territoriale n'existait. Ce socle la fournit, **sans rien
retirer** à l'existant.

## D'où viennent les données

Du **rapport d'analyse territoriale de Frontignan la Peyrade** présent dans
`Sathancabrol/monorepo` (`projects/frontignan/`) : 826 lignes, **249 sources
datées**, 13 fiches projets, méthode par entonnoir France → région →
intercommunalité → ville → projet, septembre 2026.

C'est ce rapport qui a fourni **le modèle** : les cinq échelles et surtout la
grille de certitude ✅ engagé / 📅 annoncé / 🔮 tendance / ⚠️ incertain.

## La règle de traçabilité

Aucun fait n'est affiché sans dire ce qu'il vaut.

- Chaque fait porte une `certitude`, des `sources` et, s'il est inféré, la
  `regle` utilisée.
- **Garde-fou codé** : un fait sans source ne *peut pas* être marqué « engagé » —
  `creerFait` le rétrograde automatiquement en « tendance ». Impossible de faire
  passer une supposition pour une mesure, même par erreur.
- Les faits inférés sont rendus préfixés d'un `~`, suivis du niveau et de la
  règle : `🔮 ~Aménagements : à partir de ~2028 — tendance (calendrier annoncé
  par les élus, non contractualisé)`.
- `bilanCertitude()` donne la part d'inféré d'un sous-arbre : le hub peut
  afficher honnêtement « 25 % de ces données sont des projections ».

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/data/territoire/dossierTerritorial.js` | Structure et règles. Fonctions pures, ni réseau ni DOM. |
| `src/data/territoire/frontignan.js` | Dossier réel pré-instruit + les 9 communes de l'étang de Thau. |
| `*.test.mjs` | 20 tests, hors-ligne. |

## Jeu d'essai du chantier E

`COMMUNES_THAU` couvre les 9 communes demandées (Frontignan, Sète, Balaruc-les-Bains,
Balaruc-le-Vieux, Bouzigues, Loupian, Mèze, Marseillan, Agde) avec code INSEE réel
et repère. Les tests vérifient l'unicité des codes et la plausibilité géographique.

## Suite

- Brancher l'arbre sur l'UI INTEL (drill-down cliquable, fil d'Ariane).
- Alimenter les autres communes depuis les API ouvertes déjà branchées
  (SIRENE est déjà appelé dans `src/chatConsole.js:210` et renvoie NAF/effectifs).
- Le WFS IGN (`https://data.geopf.fr/wfs/ows`) reste non branché : c'est lui qui
  fournira le tracé cadastral animé du chantier E.

---

# Vérification et robustesse hors ligne

## Ce que la vérification a corrigé

Les données du rapport ont été confrontées aux sources officielles de l'État.
Trois corrections ont été nécessaires — elles sont conservées ici parce qu'un
hub de renseignement doit garder trace de ses propres erreurs.

| Erreur | Origine | Correction |
|---|---|---|
| **3 codes INSEE faux** (Balaruc-les-Bains 34022→**34023**, Balaruc-le-Vieux 34023→**34024**, Loupian 34152→**34143**) | ma première version | Vérifiés sur `geo.api.gouv.fr` |
| **Agde classée dans Sète Agglopôle** | déduction abusive | Agde est en **CA Hérault Méditerranée** (EPCI 243400819) — champ `sam: false` |
| **BP 2025 : total 56 232 252 €** | coquille **du rapport source** | 39 553 032 + 17 179 220 = **56 732 252 €**. Les deux sections étant sourcées au centime, c'est le total qui a été recalculé. Écart de 500 k€. |

La dernière a été trouvée par un test (`budgetCoherent`), pas à l'œil nu.
Tout chiffre budgétaire est désormais soumis à une somme de contrôle.

## Contradictions : arbitrées, pas masquées

Le rapport avait déjà tranché dix conflits de sources. Ces arbitrages sont
repris dans `CONTRADICTIONS` **avec les versions concurrentes visibles** :

- **PEM** : 41 M€ (ébauches) vs **25 M€** (annonce Région, juin 2023) → 25 M€, la
  révision étant documentée (suppression du déplacement d'aiguillage).
- **Budget 2026** : 52 M€ (BP) et 64,9 M€ (consolidé) → **les deux**, périmètres
  différents. La donnée porte elle-même l'avertissement « ne pas comparer ».
- **Vignoble AOP**, **population de l'agglo**, **fréquentation du FIRN** →
  restent **ouvertes** (`contradictionsOuvertes()`), affichées avec réserve.

`DONNEES_MANQUANTES` liste ce qu'on sait ne pas savoir (angle mort n°1 : la
programmation détaillée du PEM).

## Associations, clubs et vie locale

`VIE_ASSOCIATIVE` : **508 150 €** de subventions à **100+ associations** (2025),
budget participatif de **50 000 €/an**, **6 comités habitants**, Maison des
projets. Événements : FIRN (29ᵉ édition), joutes languedociennes, muscat AOP.

La fréquentation du FIRN porte explicitement `fiabiliteFrequentation:
'ordre de grandeur'` — chiffres d'organisateurs contestés par l'opposition.

## Fonctionner sans réseau et sans clé

`sourcesOfficielles.js` catalogue **12 sources publiques**. Deux critères
d'entrée, tous deux vérifiés par les tests :

1. **`cle: false`** — aucune ne demande d'authentification ni de compte payant.
2. **`horsLigne`** — indique si le jeu est téléchargeable en masse, donc
   embarquable.

`sourcesEmbarquables()` retourne les sources qui permettent à watchtower de
tourner **sans réseau** : référentiel communal (API Géo), cadastre par commune
(Etalab, GeoJSON), **RNA** (associations, export mensuel), comptes des
collectivités (DGFiP), Base Adresse Nationale, annuaire du service public.

C'est la règle générale retenue : **toute donnée critique doit avoir un chemin
hors ligne**, l'API n'étant qu'un raccourci quand le réseau est là.

## Sources officielles retenues

| Source | Éditeur | Apporte |
|---|---|---|
| `geo.api.gouv.fr` | DINUM | Référentiel communal — **source de vérité** |
| INSEE comparateur / dossier complet | INSEE | Population, CSP, logement, pauvreté |
| `recherche-entreprises.api.gouv.fr` | DINUM | SIRENE — nature juridique 92xx = associations |
| **RNA** | Min. Intérieur | Toutes les associations loi 1901 |
| **Comptes des collectivités** | DGFiP | Budgets — prime sur la presse |
| IGN WMTS / **WFS** | IGN | Fonds, cadastre, BD TOPO |
| Cadastre Etalab | DGFiP | Parcelles par commune, hors ligne |
| Géorisques | BRGM | PPRI, PPRT, Seveso, submersion |

## Note sur le réseau du bac à sable

`curl` n'a pas d'accès sortant ici : seuls les outils passant par le proxy
fonctionnent. Les données ci-dessus ont donc été récupérées par ce canal puis
**figées dans le code**. C'est exactement le mode de fonctionnement visé —
l'application ne dépend pas de la disponibilité des API au moment de l'affichage.
