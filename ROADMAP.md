# 🗺 WATCHTOWER — FEUILLE DE ROUTE

Document vivant : **mis à jour à chaque itération**. Chaque entrée indique
l'état (`✅ fait` · `🟡 en cours` · `⬜ prévu`), le module concerné et la
source de données utilisée (toutes ouvertes et sans clé, sauf mention).

Dernière mise à jour : **itération 5** (cinématique HQ, cockpit, illustration
de fiche, cadastre, hangar, radio, empreinte économique, correction « ME
LOCALISER »).

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

## 2. Corrections faites cette itération

* **« ME LOCALISER tourne en rond »** — trois causes, toutes corrigées :
  1. `attendre()` ne résolvait pas son promesse quand la séquence était
     annulée : `demarrer()` restait suspendu et le drapeau
     `__wtLocEnCours` ne redescendait jamais → plus aucun clic ne
     fonctionnait ensuite ;
  2. les requêtes Nominatim / apicarto n'avaient **aucun délai d'abandon** :
     une source muette laissait la caméra tourner en orbite indéfiniment
     (d'où le « ça tourne en rond ») → `fetchAvecDelai()` plafonné à 7–8 s ;
  3. aucune sortie de secours : ajout d'un bouton **⏹ ARRÊTER LA SÉQUENCE**,
     d'un garde-fou (drapeau périmé après 3 min) et d'un `Promise.race` sur
     chaque palier de zoom.
* **Animation jouée dans la minicarte** : la vue principale reste en orbite
  (station + filtre + anneau), c'est la minicarte qui dégringole palier par
  palier (interpolation logarithmique de l'altitude).
* **Arrêt à hauteur d'oiseau** (`ALTITUDE_OISEAU = 220 m`) : la séquence ne
  descend plus jusqu'au trottoir ; le survol drone reste à cette hauteur.
* **Vitesse d'animation** réglable (🐢 / ▶ / ⏩), mémorisée, avec durée
  plancher par palier pour éviter les saccades.

## 3. Prochaines étapes (ordre proposé)

| # | Fonction | Pourquoi | Source / outil | Effort |
|---|---|---|---|---|
| 1 | **Plans de vol / waypoints** : poser N points, l'appareil les suit, la cinématique s'enchaîne | transforme la visite en mission | moteur interne | 🟢 |
| 2 | **Curseur temporel** (heure → ombres + lumière réelles) | indispensable pour juger une vue drone | Cesium (clock) | 🟢 |
| 3 | **Mode photo** : HUD masqué, capture haute rés, filigrane coordonnées | livrable « terrain » | `preserveDrawingBuffer` déjà actif | 🟢 |
| 4 | **Journal de vol + export GPX/KML** | traçabilité, partage | moteur interne | 🟡 |
| 5 | **Préréglages de calques** (urbanisme / risques / nature / nocturne) | un bouton au lieu de dix | interne | 🟢 |
| 6 | **Manette de jeu** (Gamepad API) | confort de pilotage | navigateur | 🟡 |
| 7 | **Noms de rues** au fort zoom | orientation fine | Overpass `highway[name]` | 🟢 |
| 8 | **Alertes / veille** : nouveaux ICPE, arrêtés, séismes autour d'un point | « prévoir et actionner » | Géorisques, USGS | 🟡 |
| 9 | **Comparateur temporel** (imagerie avant/après) | juger l'évolution d'un site | IGN remonter le temps (clé) | 🟠 |
| 10 | **Modèles 3D d'aéronefs** (glTF) | remplacer les silhouettes | Khronos / Flightradar24 (licences à vérifier) | 🟠 |

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
