# Importer un fichier dans TERRITOIRE (CSV)

Le panneau **TERRITOIRE** a un bouton **📥 IMPORTER UN CSV** et accepte aussi
le **glisser-déposer** de plusieurs fichiers d'un coup. Rien à installer,
rien à convertir : le fichier entre tel quel, et le panneau **dit ce qu'il a
compris**.

## Ce que l'import cherche

| Fichier typique | Table visée | Colonnes reconnues (les autres noms sont des synonymes) |
|---|---|---|
| `frontignan_ecoles_*.csv` | `poi` | `nom`, `type`, `adresse`, `latitude`, `longitude`, `quartier`, `horaires`, `statut` |
| `frontignan_commerces_*.csv` | `poi` | `nom`, `type`, `latitude`, `longitude`, `jours_marche`, `statut` |
| `frontignan_marches_*.csv` | `poi` | idem, avec `jours_marche` |
| `projets_frontignan_timeline.csv` | `transformation` | `nom`, `date_debut`, `date_fin`, `montant`, `budget`, `maitre_ouvrage`, `entreprise`, `phase`, `type_transformation`, `usage_avant`, `usage_apres` |
| `frontignan_tous_chantiers_*.csv` | `transformation` | idem (`annee_debut`, `annee_fin`, `budget`, `etat`, `nature` sont reconnus) |
| `problemes_chantier_TP_*.csv` | `imprevus` | `phase`, `categorie`, `probleme`, `cause`, `consequence`, `gravite`, `frequence`, `action_immediate`, `prevention`, `contexte`, `commune`, `code_insee` |

Les synonymes couvrent le vocabulaire réel : `latitude`/`lat`/`y`,
`longitude`/`lng`/`lon`/`x`, `intitule`/`libelle`/`designation` → `nom`,
`date_debut`/`annee_debut`/`demarrage` → `debut`, `montant`/`cout` →
`montant_eur`, `mo`/`maitre_d_ouvrage` → `maitre_ouvrage`,
`attributaire`/`titulaire`/`societe` → `entreprise`, `diametre` →
`diametre_mm`, `contexte` → `contextes`, etc. La liste complète est dans
`src/data/importCsv.js` (`SYNONYMES` et `SYNONYMES_PAR_TYPE`).

## Ce que le panneau affiche après l'import

Un rapport par fichier, dans l'inspecteur :

```
projets_frontignan_timeline.csv → transformation
2 fiche(s) · 0 au niveau 1 · séparateur « ; » · 2 identifiant(s) fabriqué(s)
il manque : Type (2)
sans colonne propre, conservées en json_details : tranche, phase_aps
```

- **fiches** — ce qui est entré ; **niveau 1** — ce qui est déjà
  cartographiable ;
- **il manque** — la liste de courses exacte pour monter en complétude ;
- **sans colonne propre** — ces colonnes ne sont PAS perdues : elles sont
  conservées dans `json_details` de la fiche, avec le nom du fichier et le
  numéro de ligne ;
- **refus** — une ligne refusée vient toujours avec son motif (identifiant
  déjà pris, phase ou gravité hors barème, contexte inconnu).

## Les trois règles

1. **Rien n'est jeté.** Une colonne qui n'a pas encore de colonne propre au
   schéma part dans `json_details`, et elle est nommée dans le rapport.
2. **Rien n'est inventé.** Une fiche importée entre en `confiance: 'à
   vérifier'` avec la source `src_import_utilisateur` (fiabilité 2) : un
   fichier transmis n'est pas une preuve. Un identifiant absent est
   **fabriqué** (stable, dérivé du nom) et signalé — c'est ce qui permet de
   re-importer le même fichier pour **mettre à jour** au lieu de dupliquer.
3. **Rien n'est caché.** Deux dérivations seulement, et elles sont tracées
   dans `json_details` : le type précis donne sa catégorie racine, et un
   point (lat/lon) donne sa géométrie GeoJSON. Aucune autre n'est faite.

## Où ça se voit

- les compteurs des lentilles (économie, urbanisme, environnement, réseaux,
  associations, culture, imprévus) additionnent **base + imports** ;
- la **choroplèthe** de la carte d'agglomération en tient compte — un import
  sur Sète ou Mèze déplace la couleur de cette commune ;
- la **frise TEMPS** place chaque opération datée à son année ; les
  opérations sans date sont **comptées** (« 4 projet(s) sans date ») et ne
  sont pas posées au hasard ;
- la lentille **IMPRÉVUS** remonte les imprévus importés de la commune, et un
  imprévu **sans** commune vaut pour tout le territoire ;
- **⌫ EFFACER LES IMPORTS** retire la couche d'un geste : la base d'amorçage
  n'est jamais modifiée.

## Ce qu'il reste à qualifier

Un import ne dit pas d'où il vient. Pour passer une fiche de « à vérifier » à
« documenté », il faut la source réelle : le producteur du fichier, sa date,
et le lien. C'est le seul travail que le module ne peut pas faire à ta place —
et il préfère l'afficher que l'inventer.
