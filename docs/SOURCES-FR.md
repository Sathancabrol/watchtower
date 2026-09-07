# Sources de données pour WATCHTOWER — France & monde (gratuit vs payant)

Recherche septembre 2026. « 🟢 gratuit » = sans clé. « 🟡 gratuit + compte » =
clé/token gratuit à créer (à connecter dans l'app). « 🔴 payant ».

## Imagerie / fonds de carte

| Source | Contenu | Statut | Notes |
|---|---|---|---|
| **IGN Géoplateforme** (data.geopf.fr) | Orthophotos France **20 cm**, Plan IGN (màj mensuelle), SCAN, parcellaire cadastral (PCI) | 🟢 gratuit | Licence Ouverte depuis 2021, WMTS sans clé. **Intégré dans WATCHTOWER** (fonds « IGN Ortho » et « Plan IGN ») |
| Esri World Imagery / Street Map | Satellite + routes monde | 🟢 gratuit | intégré (fond par défaut) |
| Google Photorealistic 3D | Globe 3D photoréaliste | 🔴 payant | clé Google + facturation (crédit mensuel offert) |
| Sentinel-2 (Copernicus Data Space) | Satellite 10 m, **revisite ~5 jours** (le plus proche du « temps réel » gratuit) | 🟡 gratuit + compte | token gratuit, quotas larges |
| IGN « Remonter le temps » | Photos aériennes 1940→aujourd'hui | 🟢 gratuit | comparaison historique |

⚠️ **Satellite « temps réel » haute résolution : n'existe pas en gratuit.**
Les images fraîches à la demande (Pléiades, Maxar…) sont payantes. Le gratuit
c'est : Sentinel-2 (~5 j de délai, 10 m) ou les satellites météo (temps quasi
réel mais basse résolution, voir nuages).

## Météo / nuages / pluie

| Source | Contenu | Statut |
|---|---|---|
| **Open-Meteo** | Conditions actuelles + prévisions monde | 🟢 gratuit — **intégré (panneau MÉTÉO)** |
| **RainViewer** | Radar pluie mondial en tuiles, rafraîchi 5 min, nuages IR satellite | 🟢 gratuit (usage perso) — candidat couche « pluie » |
| Météo-France API | AROME/ARPEGE, vigilance, observations | 🟡 gratuit + compte (portail api.meteofrance.fr) |
| EUMETSAT / Meteosat | Nuages Europe quasi temps réel | 🟡 gratuit + compte |

## Trafic / transports

| Source | Contenu | Statut |
|---|---|---|
| Bison Futé / tipi.bison-fute.gouv.fr | Événements routiers France (DATEX II), prévisions | 🟢 gratuit |
| transport.data.gouv.fr | GTFS-RT temps réel bus/trains, comptages | 🟢 gratuit |
| TomTom Traffic | Flux de trafic fluide/bouché mondial | 🟡 gratuit + compte (palier généreux) — déjà géré par l'app |
| Autoroutes (ASFA) | Événements autoroutiers | 🟢 gratuit |

## 3D / bâtiments / altitude

| Source | Contenu | Statut |
|---|---|---|
| **IGN LiDAR HD** | Nuage de points France entière, MNT/MNS | 🟢 gratuit — base d'une vraie 3D France |
| BD TOPO bâtiments 3D | Emprises + hauteurs de bâtiments France | 🟢 gratuit (WFS) — candidat « bâtiments 3D gratuits » |
| OSM Buildings | Bâtiments extrudés monde | 🟢 gratuit |
| Cesium OSM Buildings | idem, hébergé Cesium ion | 🟡 gratuit + compte ion |
| Google 3D Tiles | Photoréaliste | 🔴 payant |

## Divers France

| Source | Contenu | Statut |
|---|---|---|
| **BAN api-adresse.data.gouv.fr** | Géocodage adresses France | 🟢 gratuit — **intégré (DOMICILE, INFO VUE)** |
| annuaire Service-Public | Fiches mairies/administrations | 🟢 gratuit — lié depuis INFO VUE |
| data.gouv.fr | 50 000+ jeux de données | 🟢 gratuit |
| Géorisques | Risques naturels/industriels par commune | 🟢 gratuit |
| cadastre.data.gouv.fr | Parcelles GeoJSON par commune | 🟢 gratuit — importable direct (drag & drop) |

## Feuille de route mode chantier (4D)

1. **Base** : zone chantier dessinée (polygone) + import GeoJSON/KML des emprises ✅ (import fait)
2. Position engins : GPS trackers → flux (Traccar open source auto-hébergeable, gratuit)
3. Phasage : phases datées (JSON simple) → coloration des zones par phase à une date donnée
4. Planning 4D : curseur temporel qui joue l'avancement (extrusion progressive des bâtiments BD TOPO / IFC converti en 3D Tiles)
5. BIM : conversion IFC → glTF/3D Tiles via IfcOpenShell (open source, gratuit)
