# 🗺 WATCHTOWER — FEUILLE DE ROUTE

Document vivant : **mis à jour à chaque itération**. Chaque entrée indique
l'état (`✅ fait` · `🟡 en cours` · `⬜ prévu`), le module concerné et la
source de données utilisée (toutes ouvertes et sans clé, sauf mention).

Dernière mise à jour : **itération 14** (🎛 lanceur par catégories +
préréglages : TOUTES les fonctions atteignables ; 🧭 boussole dans la
minicarte ; 🗺 minicarte en globe).
Itérations précédentes : **13** = 🧭 boussole « casque » sur la hauteur, ▚
MATRIX sur la minicarte, 🎨 peau néon, 👁 œil dans le logo · **12** = 🖥 HUD central (un œil toujours visible +
la liste de tout ce qui s'affiche) · **11** = 🕰 mode historique (la ville se construit à
partir des dates OpenStreetMap) · **10** = parcours de vol traçés & rejoués, 3ᵉ personne
réparée, routes + cadastre visibles en satellite, bouton « ME LOCALISER »
explicité · **9** = 🧠 palais mental, 😴 veille du HUD, 🔑 comptes & IA locale,
🎥 dispositifs en direct, 🔲 cadrans au tracé communal, 🌀 rotation 360° des
icônes AR · **8** = chat à réponses rapides, `/aide`, mode urgence guidé ·
**7** = … · **6** = entités de la carte, sources cliquables & traçabilité,
mobiGlas + VTOL + 3ᵉ personne, INTEL élargi à 6 vues, cadrans, fenêtres
réductibles, SUIVI direct, analyse de 25 sites gratuits.

---

## 0. Itération 14 — en cours

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **Dock** | 🎛 **Lanceur par catégories** : NAVIGATION · VUES · DONNÉES · OUTILS · MODES — une ligne nommée par famille | ✅ | `mobiDock.js` | — |
| **Dock** | 🧩 **Préréglages visuels** : TOUT · EXPLORER · VOL · CHANTIER · EXPERT · ÉPURÉ (mémorisés) + repli ▾ | ✅ | `mobiDock.js` | localStorage |
| **Dock** | **Règle : MODES dans TOUS les préréglages** → ✈ VOL et 🖥 AFFICHAGE ne peuvent plus disparaître | ✅ | `mobiDock.js` | — |
| **Dock** | **+10 fonctions enfin atteignables** : CADRANS · CADASTRE · RADIO · ENTITÉS · DISPOSITIFS · ÉPINGLES · RUE · PHOTO · GLOBE · ACTIONS | ✅ | `main.js` | modules existants |
| **Dock** | Hauteur publiée dans `--wt-hauteur-dock` : la barre micro se cale AU-DESSUS — plus aucun bouton recouvert (cause du ✈ VOL invisible) | ✅ | `mobiDock.js` | — |
| **Minicarte** | 🗺 **Forme globe** : dessin circulaire (178 px), graticule, ombre de limbe, reflet, anneau | ✅ | `minimap.js` | tuiles raster |
| **Boussole** | 🧭 **Posée dans la fenêtre de la minicarte**, au-dessus du globe ; ⚙ la remet en ruban sur la hauteur (détachable) | ✅ | `compassTape.js`, `minimap.js` | — |

## 0 bis. Itération 13 — terminée

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **Boussole** | 🧭 **Ruban sur la hauteur** (défaut) : pleine hauteur, collé au bord gauche/droite — ne recouvre plus les boutons du haut | ✅ | `compassTape.js` | — |
| **Boussole** | ⚙ **Réglable** : hauteur/largeur, côté, épaisseur, opacité, degrés visibles, masquage — mémorisés | ✅ | `compassTape.js`, `reglagesValides()` | localStorage |
| **Boussole** | Présentation « casque » : index central, degrés, N/E/S/O, coins de visière | ✅ | `compassTape.js` | — |
| **Minicarte** | ▚ **MATRIX** : la couche OpenStreetMap posée SUR le satellite, teintée vert néon + grille et balayage | ✅ | `minimap.js` | tuiles OSM + Esri |
| **Apparence** | 🎨 **Peau néon** : bordures, séparateurs et ascenseurs blancs → cyan (désactivable, AFFICHAGE → F2) | ✅ | `theme.js` | — |
| **HUD** | 👁 **Œil dans le logo** du titre : intégré à la marque, à côté de WATCHTOWER, il ne bouge plus jamais | ✅ | `hudCentral.js` | — |
| **HUD** | Filets : impossible de tout masquer (la barre du bas revient) + bouton « REMETTRE LA BARRE DU BAS » | ✅ | `hudCentral.js` | — |

## 0 ter. Itération 12 — terminée

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **HUD** | 👁 **Œil toujours visible** (haut gauche + logo du titre) : un clic et TOUT le HUD revient — vue propre, veille, réduction auto ou mode vol compris | ✅ | `hudCentral.js` | — |
| **HUD** | 🖥 **Fenêtre « AFFICHAGE »** (dock + **F2**) : la liste EXHAUSTIVE des ~30 blocs d'interface, une case chacun, recherche insensible aux accents | ✅ | `hudCentral.js`, `data/hudCatalogue.js` | — |
| **HUD** | Préréglages **TOUT AFFICHER · ÉPURÉ · VOL · LECTURE** + dépliage des panneaux repliés de l'app d'origine | ✅ | `data/hudCatalogue.js` | — |
| **HUD** | Les **5 modes qui vident l'écran** (vue propre V · HUD tactique H · veille · réduction auto du dock · mode vol M) sont listés et pilotables | ✅ | `hudCentral.js` | — |
| **HUD** | 🕰 **HUD progressif** (option) : écran nu au démarrage, un clic sur l'œil fait apparaître l'interface bloc par bloc (cascade 45 ms) | ✅ | `hudCentral.js` | — |
| **HUD** | Réglages mémorisés (`watchtower.hudCentral.v1`) + message d'accueil qui dit où est l'œil à la première visite | ✅ | `hudCentral.js` | localStorage |

## 0 quater. Itération 11 — terminée

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **Temps** | 🕰 **MODE HISTORIQUE** : curseur d'année, seuls les bâtiments déjà debout restent à l'écran | ✅ | `historique.js`, `data/historique.js` | Overpass · OSM `start_date` |
| **Temps** | Lecture des dates OSM : `1850`, `1850s`, `C19`, `XIXe siècle`, `~1850`, `avant/après 1900`, `1850..1870`, dates ISO, époques en mots | ✅ | `data/historique.js` | — |
| **Temps** | ▶ LIRE : la ville pousse décennie par décennie (une primitive par décennie, aucun recalcul) | ✅ | `historique.js` | — |
| **Temps** | Courbe de croissance + liste des bâtiments « apparus dans les années N » (clic = la caméra y vole) | ✅ | `historique.js` | — |
| **Temps** | Rendu « vieille photo » (sépia) + bâti actuel masqué pendant le mode ; sortie = bâti rendu (cache) | ✅ | `historique.js` | — |
| **Traçabilité** | 3 provenances jamais mélangées : **daté OSM** · **estimé (hypothèse, option)** · **non daté (masqué)** | ✅ | `data/historique.js` | — |

## 0 quinquies. Itération 10 — terminée

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **Vol** | 🛩 **PARCOURS** : 5 préréglages (orbite, balayage, spirale, approche, navette) + réglages | ✅ | `flightMode.js`, `data/volParcours.js` | géométrie pure |
| **Vol** | 📐 TRACER · ▶ JOUER · ⏹ STOP · 💾 SAUVER (liste locale) · 🔴 ENREGISTRER LE VOL réel | ✅ | `flightMode.js` | mesure locale |
| **Vol** | 🐛 **3ᵉ personne réparée** : toute vue passe par `appliquerVue()` (boutons compris, plus seulement la touche V) | ✅ | `flightMode.js` | — |
| **Cadastre** | 👁 « visible en vue satellite » : plafond porté à 22 000 m | ✅ | `cadastre.js` | apicarto (IGN · Etalab) |
| **Cadastre** | 🛣 **ROUTES** : tracé Overpass coloré par classe, noms optionnels, résumé en km | ✅ | `cadastre.js` | Overpass (ODbL) |
| **Interface** | 👁 bouton HQ renommé **« ME LOCALISER »** + message à chaque clic | ✅ | `main.js` | — |

### Mémoire des outils (ne rien refaire deux fois)
→ voir **`docs/SOURCES_ET_OUTILS.md`** : ce qui a été vu, utilisé, écarté, et
pourquoi. Document à compléter dès qu'un outil est croisé.

---

## 0 sexies. Itération 9 — terminée

| Domaine | Fonction | État | Module | Source |
|---|---|---|---|---|
| **Interface** | 🧠 **PALAIS MENTAL** : chambre de motel 70 (CSS/SVG, aucun asset) — mur, tableau, bureau, lit, néon, porte | ✅ | `palais.js`, `data/vignettes.js`, `data/dossiers.js` | — |
| **Interface** | Dossiers épinglés au mur : ouverture en cascade jusqu'au plus petit élément + recherche qui affine en direct | ✅ | `data/dossiers.js` | données vivantes de l'app |
| **Interface** | Objets du bureau = outils de l'app (carte, drone, téléphone/chat, calendrier, radio, moniteur, chemise) | ✅ | `palais.js#ouvrirObjet` | modules existants |
| **Interface** | 😴 **Veille** : plus aucun HUD après 15 s (fondu de 10 s à 15 s), retour au premier geste | ✅ | `veille.js` | — |
| **IA** | 🦙 Chat branché sur **Ollama local** (détection, modèles, `/api/chat`) + tout service compatible OpenAI | ✅ | `llm.js` | Ollama (machine de l'utilisateur) |
| **IA** | Repli **hors-ligne** honnête : commandes locales + sources, jamais d'invention | ✅ | `llm.js`, `commandes.js` | — |
| **Comptes** | 🔑 Fenêtre de connexion « comme un site » + niveaux 🟢 gratuit / 🔵 compte / 🟣 payant | ✅ | `compte.js` | localStorage (clés locales) |
| **Dispositifs** | 🎥 Caméras / micros / capteurs sur la carte, icône cliquable → fiche + **mini-fenêtre de direct** | ✅ | `dispositifs.js` | Overpass, `getUserMedia`, flux ajoutés |
| **Dispositifs** | Fiche détaillée : site, type d'objet, outils, **activité estimée**, description de scène (mesuré localement) | ✅ | `dispositifs.js` | mesure locale (aucun envoi) |
| **Cadrans** | Découpage **au tracé communal** : intersection exacte case × contour (ear clipping + Sutherland–Hodgman) | ✅ | `data/geoCadrans.js` | géométrie pure |
| **Vue communale** | 🌀 Icônes AR : rotation 360° (24 images), 104 px, écartées pour ne plus se chevaucher | ✅ | `arIcons.js`, `vueCommunale.js` | — |

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

Itération **14** :

* **« j'ai toujours pas accès à VOL »** — deux causes, deux corrections :
  * la barre du bas débordait sur plusieurs rangs et le rang du haut passait
    **sous la barre micro** (`#command-dock`, calée en dur à 72 px). Le dock
    publie maintenant sa hauteur (`--wt-hauteur-dock`) et la barre micro se
    cale au-dessus ;
  * des modules entiers n'avaient **aucun bouton** nulle part. Le dock passe
    de 19 boutons en vrac à **26 boutons rangés en 5 catégories**
    (NAVIGATION · VUES · DONNÉES · OUTILS · MODES) : CADRANS, CADASTRE,
    RADIO, ENTITÉS, DISPOSITIFS, ÉPINGLES, RUE, PHOTO, GLOBE et ACTIONS
    deviennent atteignables.
  * **Préréglages visuels** (TOUT · EXPLORER · VOL · CHANTIER · EXPERT ·
    ÉPURÉ) + repli ▾ pour ceux qui veulent un écran nu. **MODES fait partie
    de tous les préréglages** : ✈ VOL et 🖥 AFFICHAGE restent toujours là.
* **« la boussole est sur la gauche de l'écran, mets-la sur la minicarte »** —
  elle se pose DANS la fenêtre de la minicarte, juste au-dessus du globe.
  L'engrenage ⚙ la remet en ruban pleine hauteur (elle se détache au bord de
  l'écran).
* **« change la forme de la minicarte en globe »** — dessin circulaire :
  graticule (méridiens/parallèles), ombre de limbe, reflet et anneau. Nord
  et échelle recentrés, ▚ MATRIX et les filtres conservés.

Itération **13** :

* **« la boussole bloque la vue des fenêtres et des boutons »** — le ruban
  horizontal de 380 px trônait au centre du haut de l'écran, par-dessus les
  boutons d'actions. Il devient un **ruban pleine hauteur** collé au bord
  (gauche ou droite), façon affichage de casque, et il est **réglable**
  (⚙ : hauteur ↔ largeur, côté, épaisseur, opacité, degrés visibles).
* **« la minicarte doit proposer un filtre MATRIX »** — bouton ▚ : l'OSM est
  dessiné **par-dessus** le satellite, teinté vert néon, avec grille et
  balayage ; un clic revient à l'affichage normal.
* **« les side bars des fenêtres font blanc »** — peau néon : bordures,
  séparateurs et ascenseurs blancs passent au cyan, en-têtes en dégradé
  sombre (désactivable dans AFFICHAGE).
* **« l'œil doit être dans le logo »** — l'œil est inséré juste après le logo
  animé, avant le texte WATCHTOWER : il fait partie du titre, il ne bouge
  plus. Le titre est exempté de veille et survit à la vue propre pour que
  l'œil reste **toujours** cliquable.
* **« je n'ai plus accès à HQ / INTEL / VOL »** — impossible de tout masquer
  (la barre du bas est rendue d'office) et un bouton « REMETTRE LA BARRE DU
  BAS » apparaît dès qu'elle est masquée.

Itération **12** :

* **« il manque plein de boutons, je n'ai pas de quoi les afficher »** —
  l'interface est faite de ~30 blocs indépendants que CINQ mécanismes savent
  masquer (vue propre **V**, HUD tactique **H**, veille auto, réduction auto
  du dock, mode vol **M**). D'où trois réponses :
  * un **👁 œil toujours visible** en haut à gauche (et sur le logo du titre) :
    un clic et **tout** le HUD revient, quoi qu'il l'ait caché ;
  * la fenêtre **AFFICHAGE** (dock 🖥 ou **F2**) : tous les blocs listés, une
    case chacun, une recherche, les préréglages **TOUT AFFICHER · ÉPURÉ ·
    VOL · LECTURE**, et l'état des cinq modes qui vident l'écran ;
  * l'option **HUD progressif** : écran nu au démarrage, l'œil révèle
    l'interface en cascade.

Itérations **10** et **11** :

* **« le mode vol n'a pas de parcours »** — panneau 🛩 **PARCOURS** : 5
  préréglages (orbite, balayage, spirale, approche, navette), 📐 TRACER dessine
  la trajectoire sur la carte, ▶ JOUER fait voler la caméra le long du tracé
  (drone qui scanne la ville), 💾 SAUVER garde le parcours, 🔴 ENREGISTRER
  capture le vol **réellement piloté** (simplifié au posage) pour le rejouer.
* **« la 3ᵉ personne ne marche pas »** — les boutons de vue changeaient
  `modeVue` sans toucher à l'avatar : seule la touche **V** fonctionnait. Toute
  vue passe maintenant par `appliquerVue()`.
* **« le cadastre et les routes disparaissent en vue satellite »** — case
  👁 « visible en vue satellite » (plafond porté à 22 000 m) et couche 🛣
  **ROUTES** (OpenStreetMap, colorée par classe, noms optionnels, résumé en km).
* **« on ne comprend pas le bouton HQ »** — renommé **ME LOCALISER**, avec un
  message à chaque clic qui explique la cinématique (espace → ta position).
* **🕰 MODE HISTORIQUE** — curseur d'année : seuls les bâtiments déjà debout
  restent à l'écran, ▶ LIRE fait pousser la ville décennie par décennie,
  courbe de croissance, liste des bâtiments apparus (clic = la caméra y vole),
  rendu sépia. Dates lues dans **OSM `start_date`** : gratuit, ouvert, sans clé.
  Ce qui n'est pas daté n'est **pas inventé** : option « estimer » séparée,
  toujours annoncée comme hypothèse.

Plus ancien (itérations 6 → 9) :

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
| 3 | ~~**Plans de vol / waypoints**~~ → **FAIT** (itération 10 : `data/volParcours.js` + 🛩 PARCOURS) | transforme la visite en mission | moteur interne | ✅ |
| 4 | **Curseur temporel** (heure → ombres + lumière réelles) | juger une vue drone | Cesium (clock) | 🟢 |
| 5 | **Mode photo** (HUD masqué, capture haute rés, filigrane coordonnées) | livrable terrain | `preserveDrawingBuffer` | 🟢 |
| 6 | **Biodiversité d'un site** (GBIF / iNaturalist) | compléter l'empreinte environnementale | API ouvertes sans clé | 🟡 |
| 7 | ~~**Noms de rues** au fort zoom~~ → **FAIT** (itération 10 : couche 🛣 ROUTES + 🔤 noms) | orientation fine | Overpass `highway[name]` | ✅ |
| 8 | **Journal de vol + export GPX/KML** | traçabilité | moteur interne | 🟡 |
| 9 | **Préréglages de calques** (urbanisme / risques / nature / nocturne) | un bouton au lieu de dix | interne | 🟢 |
| 10 | **Alertes / veille** (nouveaux ICPE, arrêtés, séismes) | « prévoir et actionner » | Géorisques, USGS | 🟡 |
| 11 | **Manette de jeu** (Gamepad API) | confort de pilotage | navigateur | 🟡 |
| 12 | **Comparateur temporel** (imagerie avant/après) | juger l'évolution | IGN remonter le temps (clé) | 🟠 |
| 13 | **Modèles 3D d'aéronefs** (glTF) | remplacer les silhouettes | licences à vérifier | 🟠 |
| 14 | **Comptes annuels certifiés** (Pappers / API Entreprise) | CA et résultat officiels dans la fiche | jeton gratuit | 🟡 |
| 15 | **Étendre le mode historique** aux voies, POI et équipements datés (`start_date` sur tout OSM) | une ville complète, pas que le bâti | Overpass | 🟢 |
| 16 | **Recouper les dates manquantes** (BDNB, cadastre napoléonien, archives départementales) | moins de « non daté » | BDNB (ouverte), archives open data | 🟠 |
| 17 | **Imagerie ancienne** superposée au curseur d'année | juger l'évolution d'un coup d'œil | IGN remonter le temps (clé gratuite) | 🟠 |
| 18 | **Réglage du CONTENU de chaque panneau** (« ce que j'affiche dans INTEL, dans CHAT… ») | un seul bouton = une seule vue utile | interne (prolongement de `hudCentral`) | 🟡 |
| 19 | **Profils d'interface** exportables (bureau / terrain / vol / nuit) | changer de poste en un clic | localStorage | 🟢 |

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
| **Overpass `start_date` / `end_date`** | **dates de construction & de démolition des bâtiments (mode historique)** | `overpass-api.de/api/interpreter` |
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
