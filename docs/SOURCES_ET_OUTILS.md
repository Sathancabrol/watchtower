# 🧾 WATCHTOWER — MÉMOIRE DES SOURCES & OUTILS (traçabilité)

> **Pourquoi ce document** : l'application accumule les sources, les idées
> d'outils et les essais. Sans mémoire, on refait deux fois la même chose (ou
> on rebranche un service qu'on avait écarté pour une bonne raison). Ce fichier
> est la mémoire vivante : **ce qui est utilisé, ce qui a été vu, ce qui a été
> écarté, et pourquoi.** À compléter dès qu'un outil est croisé.

Règle maison, valable partout dans l'app :
**une donnée dont la source n'est pas connue n'est pas affichée**
(`tracabilite.js#sourceConnue`). Ce qui est *estimé* est annoté comme tel, avec
sa méthode. Ce qui est *payant* est proposé, jamais imposé.

---

## 1. Sources et services UTILISÉS aujourd'hui

| Service | Ce qu'on en tire | Endpoint | Clé | Niveau |
|---|---|---|---|---|
| OpenStreetMap / Overpass | bâti, POI, entités, quartiers, caméras, noms de lieux | `overpass-api.de/api/interpreter` | non | 🟢 |
| geo.api.gouv.fr | communes FR, contour communal, population | `/communes?lat=&lon=` | non | 🟢 |
| api-adresse.data.gouv.fr (BAN) | géocodage précis FR | `/search/?q=` | non | 🟢 |
| Photon (Komoot) | géocodage mondial | `photon.komoot.io/api/?q=` | non | 🟢 |
| Nominatim | recherche mondiale, reverse | `/search`, `/reverse` | non | 🟢 |
| apicarto (IGN · Etalab) | parcelles cadastrales | `/api/cadastre/parcelle?geom=` | non | 🟢 |
| Géorisques | risques, ICPE, arrêtés, cavités | `georisques.gouv.fr/api/v1` | non | 🟢 |
| Open-Meteo | météo, prévision, vent | `api.open-meteo.com/v1/forecast` | non | 🟢 |
| recherche-entreprises (État) | entreprises autour d'un point | `recherche-entreprises.api.gouv.fr/near_point` | non | 🟢 |
| Wikidata / Wikimedia | identité d'un lieu, illustration libre | `Special:EntityData`, Commons | non | 🟢 |
| OSRM | itinéraire le plus rapide (voiture / vélo / pied) | `router.project-osrm.org/route/v1` | non | 🟢 |
| Radio-Browser | radios géolocalisées en direct | `de1.api.radio-browser.info` | non | 🟢 |
| GDELT | fil d'actualités mondial | `api.gdeltproject.org/api/v2/doc/doc` | non | 🟢 |
| USGS | séismes récents | `earthquake.usgs.gov/earthquakes/feed` | non | 🟢 |
| Panoramax | street view libre (réutilisé par `streetView.js`) | `api.panoramax.xyz` | non | 🟢 |
| Cesium ion / tuiles ouvertes | fond 3D | selon la config du projet | selon | 🟢/🔵 |
| **Ollama (local)** | IA du chat, sur la machine | `http://localhost:11434/api/chat` | non | 🟢 |

## 2. VUS et ÉCARTÉS (ne pas refaire sans raison)

| Outil / idée | Verdict | Pourquoi |
|---|---|---|
| Windy Webcams (`api.windy.com/api/webcams/v2`) | ⬜ proposé (🔵/🟣) | milliers de caméras en direct **mais clé payante** → laissé en option dans `compte.js` |
| webcams.travel | ❌ écarté | clé obligatoire, données pauvres, licence floue |
| EarthCam / SkylineWebcams | ❌ écarté | pas d'API ouverte, uniquement des iframes |
| Pappers / API Entreprise | 🟡 en attente | comptes annuels certifiés — **jeton à fournir par l'utilisateur** (question ouverte) |
| OpenRouteService | 🟡 proposé | itinéraires illustrés ; OSRM suffit pour l'instant, quota 2 000/j |
| IGN « remonter le temps » | ❌ écarté pour l'instant | clé + quota ; le mode historique se fait en local (bâti OSM + dates) |
| GeoFS (vol en ligne) | ➡️ inspiré | a motivé notre mode vol ; pas de dépendance (on garde notre moteur) |
| Stellarium Web | ➡️ déjà couvert | notre `systemeSolaire.js` fait l'essentiel |
| Spidey Tracker | ➡️ inspiré | a motivé notre journal de **traçabilité local** |
| Pl@ntNet | 🟡 à brancher | biodiversité d'un site → **GBIF / iNaturalist** sans clé, à faire |
| What's This Cloud | ➡️ déjà couvert | Open-Meteo + nos codes météo |
| iFixit | 🟡 en réflexion | fiches d'entretien du matériel de chantier |
| A Soft Murmur / Cat Bounce / Zoomquilt… | ❌ écartés | gadgets sans rapport avec la mission |
| Modèles glTF d'aéronefs | ❌ écarté | licences à vérifier, poids ; on garde les silhouettes vectorielles |
| Google OAuth complet | 🟡 simplifié | sans client-id dédié, on propose la **clé d'API** (Gemini / Places) — l'OAuth natif viendra si un projet le demande |

## 3. Outils MAISON (à ne pas réécrire)

| Module | Rôle | Testé |
|---|---|---|
| `tracabilite.js` | registre des sources + journal local + export CSV | ✅ |
| `commandes.js` | registre unique des commandes du chat (16) | ✅ |
| `urgence.js` / `urgenceMode.js` | procédures officielles, secours proches, itinéraire, guidage | ✅ |
| `mascotte.js` | l'œil qui regarde, cligne, se perche (SVG + CSS) | — |
| `palais.js` + `data/dossiers.js` + `data/vignettes.js` | palais mental : arbre fouillable, vignettes SVG | ✅ (pur) |
| `dispositifs.js` | caméras / micros / capteurs + direct | ✅ (pur) |
| `llm.js` | Ollama local, compatible OpenAI, repli hors-ligne | ✅ |
| `compte.js` | fenêtre de connexion + niveaux 🟢🔵🟣 | ✅ (pur) |
| `veille.js` | effacement progressif du HUD | ✅ |
| `data/geoCadrans.js` | ear clipping + Sutherland–Hodgman (découpage au tracé) | ✅ |
| `data/volVues.js` | maths de caméra (VTOL, 3ᵉ personne, nacelle) | ✅ |
| `batiRapide.js` + `batiMath.js` | extrusion 3D rapide + estimation de hauteur | ✅ |

## 4. Idées en attente (à rebrancher plus tard)

1. **GBIF / iNaturalist** — biodiversité d'un site (sans clé, `api.gbif.org/v1/occurrence/search?geometry=`).
2. **OpenRouteService** — itinéraires illustrés (marche / vélo / camion).
3. **Pappers** — finances certifiées dans la fiche entreprise (jeton requis).
4. **Windy Webcams** — réseau de caméras premium (option payante).
5. **Modèles 3D** — glTF libres pour les engins du hangar (licences à vérifier).
6. **OAuth natif** (Google / autres) si un client-id est fourni.
7. **Alertes / veille** : nouveaux arrêtés, ICPE, séismes → Géorisques + USGS.
8. **Mode historique** : `start_date` OSM + extrusion datée, timelapse (bâti).

---

_Mis à jour à chaque itération. Toute nouvelle source passe par ce fichier
AVANT d'être branchée (et par `tracabilite.js` pour être affichable)._
