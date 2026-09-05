# 🗺 WATCHTOWER — FEUILLE DE ROUTE

Document vivant : **mis à jour à chaque itération**. Chaque entrée indique
l'état (`✅ fait` · `🟡 en cours` · `⬜ prévu`), le module concerné et la
source de données utilisée (toutes ouvertes et sans clé, sauf mention).

Dernière mise à jour : **itération 6** (entités de la carte, sources
cliquables & traçabilité, mode mobiGlas + VTOL + 3ᵉ personne, INTEL élargi à
6 vues avec bandeaux « fil », cadrans de commune, fenêtres réductibles,
SUIVI direct du chantier, analyse comparée de 25 sites gratuits).

---

## 1. Ce qui est en place

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| Vues | Vue communale 2D → contour animé → couche AR (icônes 3D) | ✅ | `vueCommunale.js` | geo.api.gouv.fr, Overpass |
| Vues | Bâti 3D rapide (2 draw-calls, worker, hauteurs estimées) | ✅ | `batiRapide.js` | Overpass |
| Vues | Noms de lieux (pays → villes → hameaux) + fenêtre du lieu central | ✅ | `nomsLieux.js` | Overpass, geo.api.gouv.fr, Nominatim |
| Vues | Cadastre léger (contours de parcelles, < 2 500 m) | ✅ | `cadastre.js` | apicarto (IGN · Etalab) |
| Vues | Street view libre (Panoramax) + repli vue POV 3D | ✅ | `streetView.js` | Panoramax (IGN / OSM-FR) |
| Vues | Système solaire (positions réelles, repère inertiel) | ✅ | `systemeSolaire.js` | éléments JPL, ELP2000 |
| Vues | Épingles, trajets (vol d'oiseau / route / pied / vélo) | ✅ | `pins.js`, `trajets.js` | OSRM |
| Navigation | « ME LOCALISER » : orbite → station → scan → zoom → bâtiment → périmètre → présence | ✅ | `localisation.js` | Nominatim, apicarto |
| Navigation | Approche cinématique HQ (travelling, letterbox, grain) | ✅ | `cinematique.js` | — |
| Navigation | Photo → GPS (lecture EXIF locale) + glisser-déposer | ✅ | `photoSearch.js` | EXIF (local, sans réseau) |
| Vol | Cockpit (horizon, bandes, gaz, télémétrie) + HUD épuré (touche H) | ✅ | `cockpit.js` | — |
| Vol | Hangar : 12 engins (performances réelles) + filtres de caméra | ✅ | `engins.js`, `flightMode.js` | — |
| Écoute | Radio en direct (stations géolocalisées, favoris) | ✅ | `radio.js` | Radio-Browser |
| Fiche | Illustration garantie : photo libre ou capture drone | ✅ | `illustration.js` | Wikimedia Commons, moteur 3D |
| Fiche | Empreinte économique : exploitant, SIREN, effectif, risques, tags, liens | ✅ | `empreinte.js` | recherche-entreprises, Wikidata, Géorisques, OSM |
| Interface | Fenêtres déplaçables / redimensionnables / transformables | ✅ | `fenetres.js` | — |
| Interface | Minicarte 2D à l'échelle (fond, filtre, emprise) | ✅ | `minimap.js` | tuiles ouvertes, Esri |
| **Carte** | **Entités : pastille de la FONCTION RÉELLE de chaque lieu (🥐📚🏠🛢…)** | ✅ | `entites.js` | Overpass / OSM (ODbL) |
| **Carte** | **Regroupement « cadastre » : entités voisines de même fonction = 1 pastille ×N, sélecteur au clic** | ✅ | `entites.js` | Overpass |
| **Carte** | **Cadrans de commune : tracé animé + noms de quartiers OSM, sinon alphabet OTAN** | ✅ | `cadrans.js` | Overpass, bbox Cesium |
| **Fiche** | **Bloc 🧾 SOURCES CONSULTÉES : chaque donnée cliquable jusqu'au site/document d'origine** | ✅ | `tracabilite.js`, `empreinte.js`, `ficheLieu.js` | registre local |
| **Fiche** | **Journal de traçabilité local + export CSV** | ✅ | `tracabilite.js` | localStorage |
| **Vol** | **Mode mobiGlas : HUD compact au-dessus du micro, fenêtres de bureau estompées (🕶 / M)** | ✅ | `mobiglas.js` | — |
| **Vol** | **VTOL (sur-place + nacelle 360°) et vue 3ᵉ personne (appareil visible)** | ✅ | `flightMode.js`, `data/volVues.js` | — |
| **INTEL** | **6 vues expertes : jumeau AR · communal · individuel · politique · économique · production** | ✅ | `vuesIntel.js` | Overpass, Géorisques, entreprises, Wikidata |
| **INTEL** | **Bandeau « fil » façon Bloomberg + mini-bandeau par catégorie** | ✅ | `vuesIntel.js`, `filInfo.js` | GDELT, USGS, Open-Meteo, entreprises |
| **Chantier** | **📶 SUIVI en direct : multi-vues POV + icônes carte + liens « travaillent ensemble »** | ✅ | `chantier.js` | interne |
| **Chantier** | **📡 TRACKING (ancien « SUIVI ») : GPS outils + journal des positions** | ✅ | `chantier.js` | géolocalisation navigateur |
| **Interface** | **Fenêtres réductibles en icône (–) en plus du déplacement / redimensionnement / formes** | ✅ | `fenetres.js` | — |

## 2. Ce que cette itération a corrigé / ajouté

* **« fenetres non modifiables »** — toutes les fenêtres flottantes passent par
  `amenagerToutes()` (`fenetres.js`) : déplaçables, redimensionnables,
  transformables (⚙) **et réductibles en icône** (–, double-clic sur la barre de
  titre). État mémorisé par fenêtre.
* **« le HUD de vol est trop gros »** — mode **mobiGlas** : une seule ligne
  d'instruments collée **au-dessus de la capture vocale**, fenêtres de bureau à
  14 % d'opacité (ou masquées), minicarte / altimètre / boussole / cockpit
  intouchés. Touche **M**, bouton 🕶 dans le bandeau.
* **« mode VTOL + vue 3ᵉ personne »** — **VTOL** = l'engin fait du sur-place et
  la caméra devient une **nacelle d'observation 360°** (lacet continu, site
  borné, souris ou flèches) ; **3ᵉ personne** = caméra en retrait, appareil
  visible (dessin vectoriel), distance réglable `[` `]`. Touche **V** pour
  permuter. Les maths sont isolées et testées dans `data/volVues.js`.
* **« la carte ne dit pas ce qu'il y a »** — couche **ENTITÉS** : chaque bâtiment
  ou équipement reçoit la pastille de sa **fonction réelle OpenStreetMap**
  (🥐 boulangerie, 📚 bibliothèque, 🏠 maison, 🛢 cuves…). Entités voisines de
  même fonction **partagent une pastille ×N** (logique cadastrale) et un clic
  ouvre un sélecteur qui les liste séparément — aucune entité perdue.
* **« les données doivent être vraies, avec les sources cliquables »** —
  registre unique des sources (`tracabilite.js`) : **une donnée sans source
  connue n'est pas affichée**. La fiche montre 🧾 SOURCES CONSULTÉES (pastilles
  cliquables), des liens « documents à télécharger » (rapport Géorisques,
  cadastre IGN, annuaire, INSEE, data.gouv) et un **journal de traçabilité
  local** exportable en CSV.
* **« vue quartier incompréhensible »** — **cadrans** : tracé animé qui divise la
  commune (2×2 ou 3×3, + sous-cadrans ×4), nommés par les quartiers officiels
  OSM quand ils existent, sinon ALPHA / BRAVO / CHARLIE / DELTA.
* **« l'INTEL doit devenir le cœur expert »** — six nouvelles vues
  (🛰 JUMEAU AR, 🏛 COMMUNAL, 🏠 INDIVIDUEL, 🗳 POLITIQUE, 💼 ÉCONOMIQUE,
  🏭 PRODUCTION), chacune avec ses données, ses outils et son **mini-bandeau
  défilant** (GDELT, USGS, Open-Meteo, Géorisques, entreprises).
* **« bouton suivi → tracking »** — l'ancien SUIVI GPS devient 📡 **TRACKING** ;
  un nouvel onglet 📶 **SUIVI** affiche le **direct** : multi-vues POV (nombre de
  cellules réglable), icônes de chaque élément sur la carte, traits « travaillent
  ensemble » entre éléments proches et actifs, horodatage au journal.
* **Analyse comparée de 25 sites gratuits** (vidéo « 25 Websites You Won't
  Believe Exist ») → `docs/COMPARAISON_SITES.md` : 6 idées retenues sur 26
  (GeoFS → notre mode vol, Stellarium → déjà couvert, Spidey Tracker → notre
  traçabilité locale, Pl@ntNet → GBIF à brancher, What's This Cloud → Open-Meteo,
  iFixit → fiches d'entretien en réflexion).

## 3. Prochaines étapes (ordre proposé)

| # | Fonction | Pourquoi | Source / outil | Effort |
|---|---|---|---|---|
| 1 | **🏗 Dossier source chantier** : CERFA, DT-DICT, budgets, normes, plans, bordereaux — modèle de référence réutilisable, complété automatiquement | le chantier doit capitaliser | interne + data.gouv (modèles CERFA) | 🟠 |
| 2 | **🗓 Phasage → animation du périmètre sur la carte** + options de préparation (balisage, circulations, interdictions) | sécuriser avant d'ouvrir | interne + OSM | 🟡 |
| 3 | **Plans de vol / waypoints** | transforme la visite en mission | moteur interne | 🟢 |
| 4 | **Curseur temporel** (heure → ombres + lumière réelles) | juger une vue drone | Cesium (clock) | 🟢 |
| 5 | **Mode photo** (HUD masqué, capture haute rés, filigrane coordonnées) | livrable terrain | `preserveDrawingBuffer` | 🟢 |
| 6 | **Biodiversité d'un site** (GBIF / iNaturalist) | compléter l'empreinte environnementale | API ouvertes sans clé | 🟡 |
| 7 | **Noms de rues** au fort zoom | orientation fine | Overpass `highway[name]` | 🟢 |
| 8 | **Journal de vol + export GPX/KML** | traçabilité | moteur interne | 🟡 |
| 9 | **Préréglages de calques** (urbanisme / risques / nature / nocturne) | un bouton au lieu de dix | interne | 🟢 |
| 10 | **Alertes / veille** (nouveaux ICPE, arrêtés, séismes) | « prévoir et actionner » | Géorisques, USGS | 🟡 |
| 11 | **Manette de jeu** (Gamepad API) | confort de pilotage | navigateur | 🟡 |
| 12 | **Comparateur temporel** (imagerie avant/après) | juger l'évolution | IGN remonter le temps (clé) | 🟠 |
| 13 | **Modèles 3D d'aéronefs** (glTF) | remplacer les silhouettes | licences à vérifier | 🟠 |
| 14 | **Comptes annuels certifiés** (Pappers / API Entreprise) | CA et résultat officiels dans la fiche | jeton gratuit | 🟡 |

## 4. Sources ouvertes : ce que j'utilise, et ce qui reste à brancher

### Déjà branchées (sans clé)

| Source | Données | Endpoint |
|---|---|---|
| OpenStreetMap / Overpass | bâti, POI, tags, noms de lieux | `overpass-api.de/api/interpreter` |
| geo.api.gouv.fr | communes FR, population, codes postaux | `/communes?lat=&lon=` |
| api-adresse.data.gouv.fr (BAN) | géocodage / adresses | `/search/?q=`, `/reverse/?lon=&lat=` |
| Nominatim | géocodage et recherche mondiale | `/search`, `/reverse` |
| apicarto (IGN · Etalab) | parcelles cadastrales | `/api/cadastre/parcelle?geom=` |
| Panoramax (IGN / OSM-FR) | photos de rue libres | `api.panoramax.xyz/api/search` |
| OSRM | itinéraires route / pied / vélo | `router.project-osrm.org/route/v1` |
| Wikimedia Commons | photos libres géolocalisées | `commons.wikimedia.org/w/api.php` |
| Wikidata | propriétaire, effectif, CA, maison mère | `Special:EntityData`, `wbsearchentities` |
| recherche-entreprises.api.gouv.fr (DINUM/INSEE) | SIREN, SIRET, NAF, effectif, dirigeants | `/search?q=` |
| Géorisques (MTE) | ICPE/SEVESO, sols pollués, CATNAT, radon, argiles, sismicité | `georisques.gouv.fr/api/v1/{thème}?latlon=` |
| Radio-Browser | radios du monde entier | `de1.api.radio-browser.info/json/stations/search` |
| Open-Meteo | météo, vent, hygrométrie | `/v1/forecast` |
| recherche-entreprises **`/near_point`** | **entreprises autour d'un point** (SIREN, NAF, effectif) | `/near_point?lat=&long=&radius=` |
| GDELT | dépêches de presse indexées | `api.gdeltproject.org/api/v2/doc/doc` |
| USGS | séismes des dernières 24 h | `earthquake.usgs.gov/…/all_day.geojson` |
| Radio-Browser, Panoramax, Commons | voir ci-dessus | — |

### À brancher (selon les besoins)

| Source | Apporte | Condition |
|---|---|---|
| API Entreprise (api.gouv.fr) | liasses fiscales, CA/résultat **certifiés** DGFIP | jeton gratuit (identifiant SIRET appelant) |
| Pappers / societe.com | comptes annuels, dirigeants détaillés | jeton Pappers (offre gratuite) ou lien manuel |
| INSEE (BPE, dossiers communaux) | équipements, emploi, démographie locale | téléchargement + hébergement |
| data.gouv.fr | taxes locales, subventions, marchés publics | datasets à charger |
| IGN Géoportail (remonter le temps, ortho) | imagerie historique, comparaison | clé gratuite |
| USGS | séismes temps réel | sans clé |
| OpenSky / AIS | avions et navires en direct | sans clé (limites) |
| GLEIF | identifiants d'entreprise (LEI) monde entier | sans clé |
| **GBIF / iNaturalist** | biodiversité observée autour d'un site | sans clé |
| **iFixit (API publique)** | guides d'entretien du matériel (chantier) | sans clé |
| **INSEE BPE** | équipements et services par commune | téléchargement |

## 5. Règles du jeu

* **Open source d'abord** : aucune fonction ne doit dépendre d'un service
  payant ; une clé ne fait qu'*améliorer* (mode payant).
* **Toujours un repli** : si une source ne répond pas, la fonction continue
  (photo → capture drone, itinéraire → ligne droite, géocodage → coordonnées
  brutes) et le dit.
* **Jamais de donnée inventée** : ce qui n'est pas renseigné s'affiche
  « non renseigné », avec le lien pour vérifier.
* **Tout appel réseau a un délai d'abandon** (`fetchAvecDelai`) : une source
  muette ne doit jamais bloquer l'interface.
* **Une fonction = un test** : les fonctions pures (URL, parsing, conversions)
  sont testées ; la suite complète est la porte d'entrée (`npm test`).
* **Une donnée sans source n'existe pas** : toute information affichée est
  rattachée au registre `tracabilite.js` et renvoie vers un site ou un document
  vérifiable.
* **Traçabilité locale** : ce qui est personnel (journal, projets, épingles,
  placements chantier) reste dans le navigateur et se exporte en CSV.
