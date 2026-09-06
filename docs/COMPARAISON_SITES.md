# 🔎 ANALYSE COMPARÉE — 25 sites gratuits (vidéo « 25 Websites You Won’t Believe Exist », Luma, 04/09/2026)

> Vidéo : <https://www.youtube.com/watch?v=nisNW4yGxYE> — « 25 websites you won’t
> believe exist », chaîne **Luma**, 10 min 33, catégorie Science & Technology.
> La vidéo liste 25 sites « utiles, cachés ou étranges » + un bonus. Ce
> document les passe en revue **du point de vue de WATCHTOWER** : que garde-t-on,
> que remplace-t-on par un équivalent libre, qu’est-ce qui nous inspire,
> qu’est-ce qu’on écarte — et pourquoi.

**Méthode** : on ne recopie jamais un site propriétaire. Chaque idée est soit
réimplémentée localement, soit branchée sur une source **ouverte** (licence
vérifiable), soit écartée. Une fonctionnalité qui dépend d’un service fermé,
d’une clé payante ou d’un téléchargement illégal n’entre pas dans l’app.

---

## 1. Tableau de décision

| # | Site | Ce que c’est | Libre / ouvert ? | Verdict | Ce que fait WATCHTOWER |
|---|---|---|---|---|---|
| 1 | **Stellarium Web** | planétarium en ligne | ✅ open source (GPL) | **DÉJÀ ÉQUIVALENT** | `systemeSolaire.js` : éphémérides JPL + ELP2000, repère inertiel, intégré au globe — pas besoin d’un onglet séparé |
| 2 | **Neal.fun** | expériences interactives (cartes, échelles, « deep sea »…) | ❌ fermé | **INSPIRATION** | Cadrans de commune (`cadrans.js`), bandeaux défilants de l’INTEL (`vuesIntel.js`), curseur temporel : même grammaire « une idée = un écran » |
| 3 | **GeoFS** | simulateur de vol dans le navigateur | ⚠️ fermé (modèles 3D propriétaires) | **NOTRE VERSION** | `flightMode.js` + `engins.js` : 12 engins aux performances réelles, **VTOL**, **3ᵉ personne**, nacelle 360°. Modèles glTF en option (licence à vérifier) |
| 4 | **StartMyCar** | guides d’entretien auto | ❌ fermé | **ÉCARTÉ** | inspire les *fiches d’entretien matériel* du mode chantier (prévu, voir ROADMAP) |
| 5 | **Spidey Tracker** | carte d’observations géolocalisées | ❌ fermé | **ÉQUIVALENT LOCAL** | 📶 SUIVI + journal de traçabilité (`tracabilite.js`) : positions, faits horodatés, export CSV — mais **local et privé**, pas un service tiers |
| 6 | **A Little Box of Goodies** | bricoles créatives | ❌ | ÉCARTÉ | hors mission |
| 7 | **HammyHome** | mini-jeu | ❌ | ÉCARTÉ | hors mission |
| 8 | **3dSewer** | égouts 3D | ❌ fermé | **INSPIRATION** | on a mieux et réel : 🕳 SOUS-SOL scanne les réseaux enterrés **OpenStreetMap** (conduites, câbles, drains, tunnels) + rappel DT-DICT obligatoire |
| 9 | **DoodleLab** | dessin | ❌ | ÉCARTÉ | (les annotations chantier existent déjà) |
| 10 | **Electude Simulator** | simulateur automobile | ❌ | ÉCARTÉ | niche mécanique, sans donnée ouverte associée |
| 11 | **CalcSolver** | calculateur en ligne | ❌ | ÉCARTÉ | les calculs de chantier (rendement, coûts) se font **localement** |
| 12 | **PNGImg** | banque d’images PNG détourées | ⚠️ usage libre à vérifier | **ÉCARTÉ** | nos icônes sont **dessinées en canvas** (`marqueurs.js`, `entites.js`, `arIcons.js`) : aucune dépendance externe |
| 13 | **Silk** | dessin symétrique | ❌ | ÉCARTÉ | hors mission |
| 14 | **Gamma** | présentations générées par IA | ❌ SaaS | ÉCARTÉ | l’app ne dépend d’aucune IA payante |
| 15 | **iFixit** | guides de réparation | ⚠️ contenu libre, API publique | **À ÉTUDIER** | utile en mode CHANTIER : fiches d’entretien du matériel (prévu ROADMAP) |
| 16 | **What’s This Cloud** | identifier les nuages | ❌ | **ÉQUIVALENT MESURÉ** | Open-Meteo déjà branché (température, vent, humidité, précipitations) : on donne les **chiffres**, pas un quiz visuel |
| 17 | **Pl@ntNet** | identifier une plante par photo | ⚠️ API sur inscription | **À BRANCHER (équivalent)** | cible : **GBIF / iNaturalist** (ouverts, pas de clé) pour la biodiversité d’un site — voir ROADMAP |
| 18 | **Cleanup.pictures** | retouche photo (supprimer un objet) | ❌ SaaS | ÉCARTÉ | pas d’API ouverte ; et nos illustrations sont **sourcées** (Commons) ou générées (`illustration.js`) |
| 19 | **Zoomquilt** | zoom infini | ❌ | ÉCARTÉ | notre zoom est géographique et réel (`localisation.js`) |
| 20 | **Pixel Thoughts** | méditation | ❌ | ÉCARTÉ | hors mission |
| 21 | **I Miss My Cafe** | ambiance café | ❌ | ÉCARTÉ | (idée notée : ambiance sonore du cockpit — option future) |
| 22 | **Thisissand** | sable qui tombe | ❌ | ÉCARTÉ | hors mission |
| 23 | **Cat Bounce** | gadget | ❌ | ÉCARTÉ | hors mission |
| 24 | **A Soft Murmur** | ambiances sonores | ❌ | ÉCARTÉ | idem 21 |
| 25 | **Garden Letters** | lettres animées | ❌ | ÉCARTÉ | hors mission |
| 🎁 | **Blob Opera** | expérience musicale Google | ❌ | ÉCARTÉ | hors mission |

**Bilan :** 6 idées retenues sur 26 (23 %). C’est normal : la vidéo vise le
grand public « curiosité ». Seules les briques qui **mesurent le monde réel**
nous intéressent — et celles-là, on les branche sur des sources ouvertes.

---

## 2. Les trois qui comptent vraiment

### 🥇 GeoFS → nous le remplaçons (déjà fait, amélioré cette itération)
GeoFS fait voler un avion dans un navigateur. WATCHTOWER fait **mieux pour notre
usage** : le vol se déroule **sur le globe réel**, au-dessus du bâti 3D, du
cadastre et des entités OSM du point observé.
* 12 engins aux performances réelles (`engins.js` : vitesses, montée, plafond,
  virage, inertie) ;
* **VTOL** : sur-place + **nacelle d’observation 360°** (`volVues.js`), pour
  regarder un site sans le survoler ;
* **3ᵉ personne** : l’appareil est visible (dessin vectoriel `dessinerEngin`) ;
* mode **mobiGlas** (`mobiglas.js`) : HUD réduit à une ligne au-dessus du micro.
* *Suivant possible* : importer des modèles glTF libres (licence à vérifier une
  par une — c’est le seul vrai apport de GeoFS, et il est purement esthétique).

### 🥈 Stellarium Web → déjà couvert
Notre système solaire calcule les positions réelles (JPL + ELP2000) et reste
dans la scène 3D : on ne quitte pas le territoire pour regarder le ciel.

### 🥉 Spidey Tracker → l’idée est bonne, on la fait **en local**
Une carte d’observations géolocalisées, c’est exactement le besoin
« traçabilité » : qui a vu quoi, quand, où.
WATCHTOWER implémente sa version **privée** : registre de sources
(`tracabilite.js`), journal horodaté, export CSV, icônes cliquables sur la
carte, liens « travaille ensemble ». Aucune donnée ne part chez un tiers.

---

## 3. Et les « meilleurs sites gratuits utiles » qu’on utilise, nous

Au-delà de la vidéo, voici les sources réellement branchées (détail dans
`ROADMAP.md` et `DATA_SOURCES.md`) :

| Besoin | Source | Clé ? | Remarque |
|---|---|---|---|
| Entités, bâti, réseaux | **Overpass / OpenStreetMap** (ODbL) | non | la colonne vertébrale |
| Parcelles | **apicarto** (IGN · Etalab) | non | < 2 500 m |
| Commune, population | **geo.api.gouv.fr** | non | |
| Entreprises **autour d’un point** | **recherche-entreprises.api.gouv.fr** `/near_point` | non | jusqu’à 50 km, SIREN/NAF/effectif |
| Risques & environnement | **Géorisques** (MTE) | non | ICPE, SIS, cavités, radon, argiles, sismicité, CatNat |
| Météo du point | **Open-Meteo** (CC BY 4.0) | non | vent, humidité, précipitations |
| Séismes | **USGS** (domaine public) | non | flux GeoJSON 24 h |
| Presse | **GDELT** | non | articles indexés |
| Radio locale | **Radio-Browser** | non | équivalent libre de Radio Garden |
| Vue de rue | **Panoramax** | non | photos libres |
| Itinéraires | **OSRM** | non | |
| Wikidata / Wikipédia / Commons | Wikimedia | non | CC0 / CC BY-SA |
| Élus, marchés publics | data.gouv.fr (RNE), **BODACC** | non | liens de vérification |

**Manque encore** (et pourquoi) : les **comptes annuels certifiés** (Pappers ou
API Entreprise — jeton gratuit mais personnel), les **données fiscales
individuelles** (inexistantes en open data en France : DVF et impots.gouv.fr
restent la référence), l’**imagerie temporelle** (IGN « remonter le temps » —
clé) et la **biodiversité** (GBIF/iNaturalist, à brancher).

---

## 4. Règle maison

1. Une donnée affichée **doit** pouvoir être cliquée jusqu’à sa source.
2. Une source absente du registre (`tracabilite.js`) n’est pas affichée.
3. Pas de service fermé, pas de clé obligatoire, pas de scraping.
4. Quand une source ne répond pas, on l’écrit (« indisponible ») au lieu de
   combler le trou.
5. Ce qui est personnel reste **local** (journal, projets, épingles).
