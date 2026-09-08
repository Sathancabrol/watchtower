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
