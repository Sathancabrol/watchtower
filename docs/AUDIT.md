# 🔍 WATCHTOWER — AUDIT GÉNÉRAL (itérations 1 → 20)

**Objet** : reprendre depuis le début — nos discussions, ce qui a été implanté,
ce qui manque, ce qui est cassé, les sources utilisées — et remettre la
feuille de route à plat.

**Méthode** : lecture de l'historique git (27 commits), relecture des modules
`src/` (100 modules, ~47 000 lignes, 85 fichiers de tests), vérification de la
suite de tests, et recoupement avec le journal de nos échanges.

> ✅ fait · 🟡 en cours · ⬜ prévu · 🔥 cassé · ⚠️ à surveiller

---

## 1. D'où l'on vient (nos discussions)

| Étape | Ce que tu as demandé | Résultat |
|---|---|---|
| **Départ** | « dans cognitorium ? » — tu m'as redirigé vers **COGNITORIUM** : `watchtower` était un dépôt vide, la dernière version vivait là | ✅ Reprise sur COGNITORIUM (`9e21dab` : gods-eye-view v0.1.1 + watchtower-mods) |
| **It. 1-6** | Entités de la carte, **sources cliquables**, **traçabilité**, mobiGlas/VTOL/3ᵉ personne, INTEL à 6 vues, cadrans, fenêtres réductibles, analyse de 25 sites gratuits | ✅ `docs/COMPARAISON_SITES.md` (6/26 retenus) |
| **It. 7-8** | Chat à réponses rapides, `/aide`, mode urgence guidé, palais mental, veille du HUD, IA locale, dispositifs | ✅ |
| **It. 9-10** | Parcours de vol traçés et rejoués, routes + cadastre en satellite, « ME LOCALISER » explicité | ✅ |
| **It. 11** | 🕰 **Mode historique** : la ville se construit à partir des dates OSM — « gratuit, open source, sans perdre de features, au plus simple fonctionnel » | ✅ |
| **It. 12** | 🖥 **HUD central** : un œil toujours visible + la liste de tout ce qui s'affiche — « ne jamais laisser l'utilisateur sans moyen de rappeler l'UI » | ✅ |
| **It. 13** | Boussole « casque », ▚ MATRIX, peau néon, **œil dans le logo, à côté de WATCHTOWER, qui ne bouge jamais** | ✅ |
| **It. 14** | Lanceur par catégories + préréglages, boussole dans la minicarte, minicarte en globe | ✅ |
| **It. 15** | 🗂 **27 calques, aucun bloqué**, médaillons de lieu 360°, pastilles de catégories | ✅ |
| **It. 16** | « un truc a disparu » → diagnostic **F3** + « tout réafficher », bandeau live rendu | ✅ `docs/DIAGNOSTIC.md` |
| **It. 17** | 🔥 Le bug qui coupait 19 modules : **doublon de `function rendreListe()`** dans `flightMode.js` (TDZ) → garde-fous automatisés | ✅ `src/gardeFous.test.mjs` |
| **It. 18** | Lanceur **2 lignes** (une catégorie = un bouton), minicarte/boussole **qui épousent le globe**, pastilles **sur un lieu réel** | ✅ + 🔥 2 blocs que **mon propre script** avait tronqués, réparés |
| **It. 19** | Boussole **relisible** (fond opaque + cap en clair), veille **60 s/90 s**, écran épuré (DATA LAYERS/CCTV/SCENES/CONTEXT rangés), pastilles **dispersées**, système solaire en **échelle VRAIE (Kepler)** | ✅ |
| **It. 20** | Palais : 🗂 **dossier d'investigation** (6 étapes + notes), 📺 **télé cathodique**, 🪟 **fenêtre → rideaux + vue stellaire**, 🚁 décollage confirmé, minicarte **sans cadre**, médaillons **emboîtés** | ✅ |

---

## 2. Ce qui est en place (état réel)

| Domaine | État | Modules clés |
|---|---|---|
| Globe 3D + vues | ✅ Cesium, VOL / VTOL / 3ᵉ personne / mobiGlas | `flightMode.js`, `cinematique.js`, `cockpit.js` |
| Lanceur (dock) | ✅ 2 lignes, catégories → boutons, préréglages | `mobiDock.js` |
| HUD central | ✅ œil toujours visible + inventaire de l'affichage | `hudCentral.js` |
| Calques | ✅ 27 couches en 5 familles, **aucune bloquée** | `calques.js` |
| Fiche lieu | ✅ illustration obligatoire + **sources en liens cliquables** | `dispositifs.js`, `medaillons.js` |
| Entités / pastilles | ✅ ancrage sur lieu réel + **dispersion anti-superposition** | `entites.js` |
| Médaillons de lieu | ✅ 360°, hiérarchie pays→région→département→commune→quartier, **emboîtement organique** | `medaillons.js` |
| Minicarte | ✅ globe, sans cadre, boussole intégrée | `minimap.js`, `compassTape.js` |
| INTEL | 🟡 6 vues, mais **pas encore le hub attendu** (voir §4) | `intel.js` |
| Chantier | ✅ PHASAGE, sources (CERFA, budgets, normes, DU, DICT, plans) | `chantier.js` |
| Palais mental | ✅ 1970s, 10 objets (carte, drone, téléphone, calendrier, radio, moniteur, chemise, **tableau**, **télé**, **fenêtre**) | `palais.js` |
| Dossier d'investigation | ✅ 6 étapes + notes (créer/modifier/épingler/ranger) | `dossier.js` |
| Système solaire | ✅ **éléments képleriens JPL** + échelle VRAIE | `systemeSolaire.js` |
| IA locale | ✅ **Ollama** `127.0.0.1:11434` (tu as Ollama, sans modèles) | `iaLocal.js` |
| Diagnostic | ✅ **F3** : 33 clés attendues + erreurs runtime | `diagnostic.js` |
| Traçabilité | ✅ chaque donnée est sourcée et cliquable | `tracabilite.js` |

**Tests** : 3 136 tests, **2 échecs préexistants** (à ne pas confondre avec une
régression) :
* « cable ground lines classify against exactly the active surface on every stack »
* « every live basemap is reachable by its own id — no enum value without a voice alias »

---

## 3. Sources de données (liens)

Tout est **ouvert et sans clé**, sauf mention. ⚠️ = **injoignable depuis le
bac à sable** où je code (seuls GitHub et npm sortent) : le module doit donc
**dégrader proprement** côté navigateur, où toi tu y as accès.

| Source | Usage | Lien |
|---|---|---|
| OpenStreetMap (ODbL) | fonds de carte, entités, historique | https://www.openstreetmap.org/copyright |
| Overpass API | requêtes entités / bâti ⚠️ | https://overpass-api.de/ |
| Nominatim | noms de lieux, médaillons ⚠️ | https://nominatim.openstreetmap.org/ |
| Cadastre Etalab · apicarto | parcelles ⚠️ | https://cadastre.data.gouv.fr · https://apicarto.ign.fr |
| Géorisques | risques, sols pollués ⚠️ | https://www.georisques.gouv.fr/ |
| recherche-entreprises (SIRENE) | entreprises autour d'un point ⚠️ | https://recherche-entreprises.api.gouv.fr/ |
| Radio-Browser | radios du monde ⚠️ | https://www.radio-browser.info/ |
| Open-Meteo | météo ⚠️ | https://open-meteo.com/ |
| USGS | séismes en direct ⚠️ | https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson |
| NASA FIRMS | feux actifs ⚠️ | https://firms.modaps.eosdis.nasa.gov/ |
| GDELT | actualités mondiales ⚠️ | https://gdeltproject.org/ |
| OSRM | itinéraires ⚠️ | https://router.project-osrm.org/ |
| Wikidata | données liées ⚠️ | https://query.wikidata.org/ |
| OpenSky | vols (auth à prévoir) | `docs/opensky-auth.md` |
| CARTO · Esri | fonds minicarte | https://carto.com/ · https://www.esri.com/ |
| Ollama | IA locale | https://ollama.com/ |

**Webcams / direct** : décision prise — exposer les **métadonnées OSM**
(`man_made=surveillance`, `contact:webcam`) et laisser l'utilisateur coller
**sa propre URL** (RTSP / HLS / MJPEG / OBS). Pas de scraping, pas d'offre
payante.

---

## 4. 🔥 Ce qui manque / ce qui est cassé (ta dernière liste)

| # | Point remonté | État | Diagnostic |
|---|---|---|---|
| 1 | **« la fenêtre WATCHTOWER n'est plus là »** | 🔥 à confirmer | Aucun crash trouvé au build ni aux tests. La piste la plus probable : **j'ai retiré le cadre de la minicarte** (it. 20) or `#wt-minimap` fait partie des 12 fenêtres encadrées de `FENETRES_APP`. Si c'est elle, je la remets. |
| 2 | **« la vue HQ n'est plus là »** | 🔥 à confirmer | Aucun bouton libellé « HQ » : il n'existe que `rechercheHQ` (cinématique « recentrer sur ma position », `main.js:544`). Deux hypothèses : (a) le bouton s'appelle autrement pour toi — (b) **il a disparu du lanceur depuis l'it. 18** (les familles inactives sont masquées par préréglage, donc une vue peut devenir invisible). Violation de ta règle « ne perd pas de fonctionnalité ». |
| 3 | **INTEL : les boutons de gauche doivent proposer la suite de l'arborescence** | ⬜ à faire | Le hub n'a pas encore de **drill-down** : chaque clic doit ouvrir le niveau suivant (ex. Entreprises → secteur → effectif → établissement). |
| 4 | **« le Bloomberg de la ville »** | ⬜ à faire | Croiser entreprises (SIRENE), infrastructures, environnement, landmarks spatio-temporels, spécialités — avec **croisement visuel** des données. |
| 5 | **« analyse territoriale » en INTEL** | ⬜ à faire | Vue non câblée. |
| 6 | **Pastilles « pays/région » à l'emplacement des capitales** | ⬜ à faire | En attente de ton choix : **liste en dur** (instantané, hors-ligne) vs **Nominatim** (complet mais réseau). |
| 7 | **Icônes qui se superposent + AR qui déconne** | 🟡 partiel | Dispersion faite pour les pastilles d'entités (it. 19). L'AR (couche caméra / jumeau numérique) reste à reprendre. |
| 8 | **« fil CONTEXT en INTEL bloque le fil du bandeau principal »** | ⬜ à faire | Deux éléments se disputent la même zone : il faut masquer l'un quand l'autre est ouvert. |
| 9 | **3D saturée H24** | ⬜ à faire | Proposition : bascule **2D ↔ 3D** avec **MapLibre GL** (https://maplibre.org/) en parallèle de Cesium — tu gardes tout, sans subir la carte graphique. |
| 10 | **Caméra direct** | ❓ bloqué | Jamais reproduit. Question ouverte : **webcam** du navigateur (il faut cliquer « Autoriser ») ou **mini-fenêtre #wt-live** des DISPOSITIFS ? |
| 11 | **Palais : pages qui ne se ferment pas** | ⬜ à faire | Le handler existe (`api.fermer()`) — à reproduire pour comprendre. |
| 12 | **Palais : « plus d'options, plus d'objets »** | 🟡 partiel | 3 objets ajoutés (tableau, télé, fenêtre) ; la liste d'options reste à définir avec toi. |

---

## 5. ⚠️ Dettes techniques révélées par l'audit

1. **Roadmap incohérente** — les tables s'arrêtaient à l'itération **15** alors
   que l'en-tête annonçait l'itération **20**, avec une numérotation
   désordonnée (`0.` · `0 bis.` · `0 octies.` …). **Corrigé dans cette
   itération** : toutes les itérations 9 → 21 sont maintenant dans des tables,
   avec une numérotation latine continue.
2. **Mes scripts peuvent tronquer** — en it. 17, mon propre script a coupé deux
   blocs de `main.js` ; c'était du JS **valide**, donc ni le build ni les tests
   n'ont rien vu : seul le F3 l'a détecté. Règle : après chaque édition
   scriptée multiligne, **diff contre l'ancien commit**.
3. **Panneaux masqués = fonctions perdues d'apparence** — retirer un bouton de
   l'écran sans prévoir **le chemin de retour** (calque, préréglage) viole ta
   règle. Le bouton 📦 « Panneaux d'origine » est le modèle à suivre partout.
4. **Reset git entre les tours** — l'historique local est régulièrement
   remis à zéro : il faut `git fetch` + restaurer fichier par fichier depuis le
   commit orphelin (déjà fait 2 fois, sans perte).
5. **3 ✗ sur 4 du F3 étaient de faux positifs** (`chantier`, `vol` non
   enregistrés ; `film` n'existe pas, c'est `cinematique`) — le diagnostic lui
   -même doit être tenu à jour, sinon il ment.

---

## 6. Ordre proposé pour la suite

1. **Réparer** (1) fenêtre WATCHTOWER et (2) vue HQ — je veux ton **F3** pour
   travailler sur pièce et non à l'aveugle.
2. **INTEL = hub d'investigation AR** (3, 4, 5) : arborescence par
   drill-down + croisement visuel des données — le « Bloomberg de la ville ».
3. **Confort** (7, 8) : superposition d'icônes, CONTEXT en double.
4. **Performance** (9) : bascule 2D/3D.
5. **Palais** (11, 12) : fermeture des pages, options.
6. **Capitales** (6) et **caméra** (10) dès que tu m'auras répondu.

---

## 7. Ce que tu peux télécharger pour accélérer (tu l'as proposé)

| Besoin | Ressource gratuite | Lien |
|---|---|---|
| Adresses (offline) | BAN — Base Adresse Nationale | https://adresse.data.gouv.fr/ |
| Entreprises (Bloomberg de la ville) | SIRENE en diffusion | https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/ |
| Bâti + infrastructures | BD Topo IGN (licence ouverte) | https://geoservices.ign.fr/bdtopo |
| Parcelles | Cadastre Etalab | https://cadastre.data.gouv.fr/ |
| Tuiles locales (plus de réseau, plus de latence) | `tileserver-gl` + extraits `.mbtiles` | https://github.com/maptiler/tileserver-gl |
| Tes flux caméra | OBS (RTSP/HLS) | https://obsproject.com/ |
| IA locale | Ollama (déjà installé chez toi) | https://ollama.com/ |

**Recommandation** : un dossier `data/` hors git (déjà ignoré) avec la BAN
départementale + l'extrait SIRENE de l'Hérault suffirait à rendre le «
Bloomberg de la ville » **instantané et hors-ligne**.

---

*Audit rédigé à l'itération 21 — il sera tenu à jour à chaque itération, comme
la feuille de route.*
