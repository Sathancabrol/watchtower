<div align="center">

# 🗼 WATCHTOWER

### Fork de [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) — chaque fonction payante a sa version gratuite.

</div>

**Écran de démarrage** avec deux boutons :

- **MODE GRATUIT** — démarre immédiatement, **zéro clé API**, aucun blocage possible.
- **MODE PAYANT** — saisie des clés (`GOOGLE_MAPS_API_KEY`, `CESIUM_ION_TOKEN`) :
  coller + **Entrée** → **✓ vert** à droite du champ ; bouton **ENTER** en bas,
  **vert** si au moins une clé est active, **rouge** sinon. Clés mémorisées en
  localStorage et pré-validées au prochain démarrage.

**Équivalents gratuits (ce fork) :**

| Fonction | Payant (clé) | Gratuit (sans clé) |
|---|---|---|
| Globe 3D photoréaliste | Google Maps | Globe satellite Esri |
| Carte routière | — | Tuiles **CARTO Voyager** (OSM) — remplace `tile.openstreetmap.org`, qui **bloque désormais cette app** (osm.wiki/Blocked) |
| Recherche de lieux | Google Geocoding | **Photon → Nominatim** (OSM, sans clé) |
| Commandes vocales | OpenAI Realtime | **Voix navigateur** (Web Speech, FR/EN) : « va à Paris », « montre les avions », « carte satellite », « zoom arrière », « vue globe »… |
| Résumé HUD | OpenAI | Fallback keyless (déjà upstream) |
| Feux actifs | NASA FIRMS (clé gratuite) | **NASA EONET** — incendies ouverts, sans clé |
| Avions, satellites, séismes, CCTV, radio, vélos, lancements, câbles | — | déjà sans clé (upstream) |
| Navires en direct | AISStream (clé **gratuite** sur aisstream.io) | pas de flux AIS mondial sans clé — couche désactivée proprement |
| Trafic routier | TomTom (palier gratuit) | pas de flux trafic sans clé — couche dégradée proprement |

Notes : `ALLOW_FRAMING=1` désactive les en-têtes anti-iframe du serveur de dev
(uniquement pour les previews intégrées). `docs/media` (68 Mo de GIFs de démo)
est exclu de ce fork.

---

## 🆕 Vues du territoire · épingles · minicarte · bâti 3D rapide

### 🧭 Vues du territoire (dock **🧠 INTEL** → fenêtre **CONTEXTE**)

Une rangée de boutons **nommés** change la façon de regarder le territoire :

| Bouton | Effet |
|---|---|
| 🗺 **VUE COMMUNALE** | dézoom à la verticale (plan 2D du dessus) → le contour de la commune (geo.api.gouv.fr) **se trace en animation**, façon plan cadastral → puis la **couche AR** s'active : des icônes flottent en 3D au-dessus de la ville (✚ santé avec barre de vie, ❤️ bonheur, 🎓 écoles, 🛍 commerces, 🏛 services). **Clic sur une icône** → tous les bâtiments 3D de sa catégorie se modélisent et reçoivent leur icône flottante. |
| 🏘 **VUE QUARTIER** | 3D rasante à 900 m + chargement du bâti |
| 👁 **IMMERSION** | caméra au sol, regard horizontal |
| 🌍 **ORBITE** | retour à la vue globe |
| 🔥 **HEATZONES** | zones d'équipements (rayons) |
| 🏙 **BÂTI 3D** | volumes rapides (cache mémoire) |

Rendu « jeu » (GTA San Andreas) : aplats saturés, contour noir épais, ombre
portée, barres segmentées — aucune texture ni modèle à télécharger.

### 📌 Épingles

Bouton **📌** en bas à gauche → *POSER UNE ÉPINGLE* → clic sur la carte : une
grosse épingle numérotée et nommée apparaît, **cliquable** (ouvre la fiche
lieu) et mémorisée sur l'appareil. Le repère **🏠 MA MAISON** (panneau 📍 MOI)
répond à nouveau au clic.

### 🗺 Minicarte

Réécrite en **canvas** (fini le second viewer Cesium, lourd et qui restait
vide) : elle suit la vue, se déplace au clic/glisser, zoome à la molette, 🛰
change le fond de carte, et s'efface quand un panneau du dock s'ouvre.

### ⚡ Bâti 3D rapide

Le chargement « très long » venait de la construction, pas du réseau. Désormais :

* **2 draw-calls** pour toute la ville (une primitive pour les corps, une pour
  les dalles de toit) au lieu d'un objet Cesium par bâtiment ;
* **hauteurs estimées** sans requête supplémentaire : tag OSM → étages × 3,2 m
  → table par type (église 18 m, hangar 11 m…) → à défaut, déduites de
  **l'emprise cadastrale** (variation déterministe : la ville ne « clignote »
  pas d'un chargement à l'autre) ;
* géométrie construite **par lots sur un worker**, avec progression : la
  fenêtre reste fluide ;
* **zones gardées en mémoire** : revenir sur une vue déjà chargée est instantané
  (c'est là que le gain se voit).

### 🏠 Mode vol : hangar, engins et filtres de caméra

Le panneau **✈ VOL** propose un **hangar** de 12 engins (drone, mini-drone,
hélicoptère, avion de tourisme, ULM, planeur, avion de ligne, jet d'affaires,
chasse, dirigeable, véhicule au sol, vedette) classés par catégorie et
filtrables par nom. Chacun a ses **performances réelles** — vitesse de
croisière et maximale, vitesse de décrochage, taux de montée, plafond, rayon
de virage, inertie, consommation — et le modèle de vol en découle : le chasseur
monte à 55 m/s, l'A320 met des kilomètres à virer, le planeur perd de
l'altitude en permanence, la vedette s'arrête sur la terre ferme. Sept
**filtres de caméra** (nuit, infrarouge, thermique, archive, noir & blanc,
brume) s'appliquent au rendu 3D pendant le vol.

### 📻 Radio en direct (dock **📻 RADIO**)

L'équivalent libre de Radio Garden : recherche les **stations autour du point
visé** (ou par nom, pays, genre) dans **Radio-Browser**, annuaire communautaire
mondial ouvert et sans clé. Lecteur intégré, favoris, pastilles sur le globe
(clic = écouter), et lien vers la radio.

### 💼 Empreinte du lieu (fiche lieu)

Cliquer un site industriel ne doit pas dire « point GPS ». La fiche ajoute une
section **EMPREINTE ÉCONOMIQUE · RISQUES · SOURCES** : exploitant et
propriétaire (tags OSM + Wikidata), **SIREN/SIRET**, code NAF, tranche
d'effectif, dirigeants, date de création, chiffre d'affaires quand il est
publié, **risques Géorisques** (ICPE/SEVESO, sols pollués, catastrophes
naturelles, radon, argiles, sismicité), les **tags OpenStreetMap** bruts et
une série de liens pour vérifier et agir (annuaire des entreprises, Pappers,
BODACC, Géorisques, INSEE, data.gouv.fr).

### 🎛 Mode vol : poste de pilotage (dock **✈ VOL** → 🛫 DÉCOLLER)

En vol, l'écran n'est plus un bureau : **une seule instrumentation, centrée**,
façon simulateur.

* **horizon artificiel** (sky/ground, échelle de tangage, arc de roulis, cap) ;
* **bandes** défilantes de vitesse et d'altitude de part et d'autre ;
* **bandeau** vario / facteur G / distance / chrono / masse / hauteur sol, plus
  une **manette des gaz** verticale ;
* **tiroir « SYSTÈMES DU BORD »** : rouvre n'importe quelle fenêtre (MOI, INTEL,
  BÂTI 3D, épingles, minicarte, trajets…) **sans quitter le vol** — aucune
  fonction n'est perdue, elles sont simplement rangées ;
* les instruments « classiques » restent disponibles d'un clic
  (🧰 INSTRUMENTS CLASSIQUES) pour ceux qui préfèrent les fenêtres déplaçables ;
* touche **H** (ou le bouton 🧹 du panneau VOL) : **HUD épuré** — comme dans un
  jeu, on ne garde que la boussole et la minicarte.

### 🎬 Approche cinématique (bouton **👁 HQ**, recherche de lieu)

L'arrivée sur un lieu n'est plus un simple vol : c'est un **travelling de
cinéma** (façon écran de chargement de jeu) — bandes letterbox, vignette, grain,
étalonnage du rendu 3D, bandeau « lower-third » avec le nom du lieu qui
s'écrit lettre par lettre, et indicateur de séquence (ORBITE → DESCENTE →
APPROCHE → VERROUILLAGE). La caméra **descend en tournant** autour du point,
comme une prise de vue hélicoptère.

### 🖼 Fiche lieu : illustration garantie

Une fiche sans image est une fiche morte. À l'ouverture, WATCHTOWER cherche une
**photo libre géolocalisée** autour du point (Wikimedia Commons, rayon 2,5 km
puis 10 km), avec auteur, licence et lien vers la source. **Si aucune photo
n'existe** (un sommet, un champ…), il **fabrique une vue drone** : une caméra
virtuelle se place au-dessus du point, le moteur rend l'image et la capture —
quatre cadrages (large, approche, ras, piqué) via 🛩 VUE DRONE. Les onglets
🏛 POLITIQUE · 💶 ÉCONOMIE · 👥 CITOYEN ont été supprimés : ils n'apportaient
rien à la fiche d'un lieu.

### 🗺 Cadastre léger (dock **🗺 CADASTRE**)

Contours de parcelles (API apicarto de l'IGN, données ouvertes) en trait fin
avec remplissage discret : juste assez pour lire l'environnement, jamais assez
pour noyer l'écran. Se charge **sous 2 500 m d'altitude** seulement, emprise
plafonnée, secteurs mis en cache. Case **👁 visible en vue satellite** pour
garder le cadastre jusqu'à 22 000 m, et case **🛣 voir les ROUTES** pour tracer
la voirie OpenStreetMap (colorée par classe, noms optionnels, longueur en km).

### 🎬 « ME LOCALISER » — la cinématique (panneau **📍 MOI**)

Le bouton **📡 ME LOCALISER** ne se contente plus de voler : il joue une
séquence complète.

1. **Mise en orbite** : dézoom jusqu'à 20 000 km, vue satellite de la Terre ;
2. **Station WATCHTOWER** : illustration vectorielle (aucune image externe) +
   **filtre d'écran** appliqué par-dessus la carte (grade satellite, balayage,
   coins de visée) et anneau de **scan** animé autour du bâtiment de l'adresse ;
3. **Position** : ancrage T0 mémorisé → domicile → géolocalisation du
   navigateur → sinon une fenêtre demande une **adresse d'encrage** (point T0) ;
4. **Zoom séquentiel** : une fenêtre s'ouvre et se ferme en clignotant
   (« LOCALISATION ») et affiche le facteur **×1 → ×10 → ×100 → ×1000 …** ;
   le numéro de **cadastre** (section · n° · commune, apicarto IGN) s'affiche ;
5. **Création du bâtiment** : il pousse depuis le sol, puis **vue drone** en 3D,
   **entourage du périmètre** cadastral tracé en animation, et une
   **boule lumineuse** à l'intérieur = la présence de l'utilisateur.

### 🖼 Identifier un lieu par photo (bouton à côté de **MOI**)

Le bouton **🖼 IDENTIFIER** est collé au bouton **MOI** dans la barre du dock,
et l'app accepte une photo **glissée-déposée n'importe où**. Les coordonnées
GPS sont lues **dans le navigateur** depuis l'en-tête EXIF (JPEG/PNG) — aucune
image ne quitte l'appareil. Sans GPS, la photo s'affiche et tu poses le point
toi-même (il devient l'ancrage **T0**).

### 🛣 Trajets — vol d'oiseau ou suivi de la voirie

Dock **🛣 TRAJETS** : « TRACER » puis un clic par étape. Mode **VOL
D'OISEAU** (calcul local) ou **ROUTE / À PIED / À VÉLO** : l'itinéraire réel
est calculé par **OSRM** (serveur de démonstration ouvert). Distance et durée
s'affichent, les trajets sont mémorisés.

### 🗺 Noms de lieux & fenêtre du lieu central

Une fenêtre sous la **boussole** donne en permanence le lieu central de la vue
(commune + population via geo.api.gouv.fr en France, Nominatim ailleurs). Les
noms de **pays → régions → villes → quartiers → hameaux** sont étiquetés sur le
globe avec une distance d'affichage propre à chaque rang, pour rester lisible
quel que soit le zoom.

### 🪟 Fenêtres déplaçables, redimensionnables, transformables

Toutes les fenêtres flottantes se déplacent par leur barre de titre, se
redimensionnent par la poignée en bas à droite, se **réduisent en icône** avec
le bouton – (ou un double-clic sur la barre de titre) et changent de **forme**
avec le bouton ⚙ (normale → compacte → large → bandeau → pilule). Position,
taille, forme et état réduit sont **mémorisés** ; un double-clic sur ⚙ remet
tout à zéro.

### 🛣 Street view (photos de rue libres)

Bouton **🛣 STREET VIEW** dans **MOI** et dans la fiche lieu : interroge
**Panoramax** (IGN / OpenStreetMap France, API STAC ouverte, sans clé), avec
défilement de la photo et repère sur le globe. À défaut, la vue de synthèse 3D
(« VUE POV ») reste disponible.

### 🪐 Système solaire autour de la Terre

Dock **🪐 SYSTÈME** : Soleil, Lune et 7 planètes placés à leurs **positions
réelles** (éléments képleriens JPL, domaine public ; Lune par ELP2000). Les
directions et rotations sont vraies — la Terre tourne sous le ciel — et les
orbites dessinées montrent les boucles de rétrogradation. Seules les distances
sont comprimées (échelle logarithmique) ; la Lune garde ses 384 400 km.

### 🏷 Entités de la carte : la fonction réelle de chaque lieu

Dock **🏷 ENTITÉS** : chaque bâtiment ou équipement reçoit une pastille 2D avec
le pictogramme de sa **fonction réelle** — 🥐 boulangerie, 📚 bibliothèque,
🏠 maison, 🛢 cuve de stockage, 🏭 usine, 🏛 mairie… Les entités voisines de
**même fonction** partagent une pastille marquée ×N (logique cadastrale) : un
clic ouvre un sélecteur qui les liste **séparément**, avec leur adresse et le
lien vers leur fiche OpenStreetMap. Données : Overpass / OSM (ODbL), filtres
par famille, rayon réglable.

### 🔲 Cadrans de la commune (vue quartier)

Dock **INTEL → 🏛 COMMUNAL → 🔲 TRACER LES CADRANS** (ou panneau flottant) :
un tracé animé divise la commune en cadrans (2×2, 3×3, sous-cadrans ×4). Les
**quartiers officiels OpenStreetMap** (`place=quarter|neighbourhood`) baptisent
chaque cadran quand ils existent ; sinon l'**alphabet OTAN** prend le relais
(ALPHA, BRAVO, CHARLIE, DELTA…). Un clic y vole et affiche ses dimensions.

### 🧾 Sources cliquables & traçabilité

Registre unique des sources (`tracabilite.js`) : **une donnée dont la source
n'est pas connue n'est pas affichée**. La fiche lieu montre un bloc
🧾 **SOURCES CONSULTÉES** (pastilles cliquables vers chaque site), une liste de
**documents à télécharger** (rapport Géorisques, parcelle cadastrale IGN,
annuaire des entreprises, dossier INSEE, data.gouv.fr) et un **journal de
traçabilité local** (horodaté, exportable CSV) : ce que tu as consulté, quand,
et sur quelle source.

### 🕶 Mode mobiGlas (vol) · VTOL · 3ᵉ personne

* **mobiGlas** (touche **M**, bouton 🕶) : le HUD se réduit à une seule ligne
  posée **au-dessus de la capture vocale** ; les fenêtres de bureau passent à
  14 % d'opacité puis se masquent ; minicarte, altimètre, boussole et cockpit
  restent intacts.
* **VTOL** (touche **V**) : l'engin fait du sur-place et la caméra devient une
  **nacelle d'observation 360°** (lacet continu, site borné, à la souris ou aux
  flèches ←/→ et PAGE↑/↓).
* **3ᵉ personne** : caméra en retrait, appareil **visible** (silhouette
  vectorielle), distance réglable `[` `]`.

### 🧠 INTEL élargi : 6 vues expertes + bandeaux « fil »

Dock **🧠 INTEL** : 🛰 **JUMEAU AR**, 🏛 **COMMUNAL**, 🏠 **INDIVIDUEL**,
🗳 **POLITIQUE**, 💼 **ÉCONOMIQUE**, 🏭 **PRODUCTION** — en plus de CONTEXTE et
PROFIL. Chaque vue a ses données (entreprises autour du point via
`recherche-entreprises /near_point`, installations classées et sols pollués
Géorisques, identité INSEE, presse GDELT), ses outils et son **mini-bandeau
défilant** façon Bloomberg, où chaque dépêche est datée et cliquable.

### 📶 Chantier : SUIVI en direct, TRACKING

* **📶 SUIVI** : le direct — multi-vues POV (nombre de cellules réglable),
  icônes de chaque élément du chantier sur la carte principale, traits
  « travaillent ensemble » entre éléments proches et actifs, horodatage au
  journal.
* **📡 TRACKING** (ancien « SUIVI ») : GPS de ta position et de l'inventaire,
  placement sur carte et journal des positions.

### 🔎 Analyse comparée de 25 sites gratuits

« 25 Websites You Won't Believe Exist » passé au crible de WATCHTOWER : ce
qu'on reprend, ce qu'on remplace par un équivalent libre, ce qu'on écarte —
dans **[docs/COMPARAISON_SITES.md](./docs/COMPARAISON_SITES.md)**.

### 🕰 Mode historique (dock **🕰 ÉPOQUES**)

Un curseur d'année, et la ville se construit sous vos yeux : seuls les
bâtiments **déjà debout** à l'année choisie restent à l'écran ; **▶ LIRE** fait
pousser la commune décennie par décennie (rendu sépia, bâti actuel masqué).
Courbe de croissance, liste des bâtiments « apparus dans les années N » (un clic
y emmène la caméra), légende des époques.

Les dates viennent d'**OpenStreetMap** (`start_date` / `end_date`) : ouvertes,
gratuites, sans clé. Le mode **n'invente rien** — trois provenances sont
toujours distinguées : **daté par OSM**, **estimé** (option « hypothèse »,
répartition calculée d'après les bâtiments datés), **non daté** (masqué par
défaut). Formats reconnus : `1850`, `1850s`, `C19`, `XIXe siècle`, `~1850`,
`avant/après 1900`, `1850..1870`, dates ISO et époques en mots clés.

### 🖥 AFFICHAGE — ne plus jamais perdre un bouton (dock **🖥 AFFICHAGE**, touche **F2**, ou l'œil 👁 en haut à gauche)

L'interface est faite d'une trentaine de blocs indépendants, et cinq
mécanismes peuvent les masquer : la vue propre (**V**), le HUD tactique (**H**),
la veille (HUD qui s'efface), la réduction automatique du dock et le mode vol
compact (**M**). Trois réponses :

* **l'œil 👁**, toujours visible en haut à gauche (le logo du titre fait la
  même chose) : un clic et **tout le HUD revient**, quoi qu'il l'ait caché ;
* **la fenêtre AFFICHAGE** : la liste exhaustive de tous les blocs (barre du
  bas, minicarte, INTEL, fiche lieu, panneaux repliés de l'app d'origine…),
  une case à cocher chacun, une recherche, les préréglages **TOUT AFFICHER ·
  ÉPURÉ · VOL · LECTURE**, et l'état des cinq modes qui vident l'écran.
  Réglages mémorisés d'une session à l'autre ;
* **le HUD progressif** (option) : au démarrage l'écran est nu — la carte et
  l'œil seulement ; un clic sur l'œil fait apparaître l'interface bloc par
  bloc, en cascade.

### 🧭 Boussole « casque » · ▚ MATRIX sur la minicarte · 🎨 peau néon

* **Boussole** : le ruban de cap se déploie désormais **sur toute la hauteur
  de l'écran**, collé au bord gauche (ou droite) — plus rien n'est caché au
  centre. L'engrenage ⚙ en bas du ruban règle tout : **hauteur ↔ largeur**,
  côté, épaisseur, opacité, nombre de degrés visibles, masquage. Glisser fait
  toujours tourner la caméra, double-clic = plein nord. Réglages mémorisés.
* **Minicarte ▚ MATRIX** : un clic superpose la couche **OpenStreetMap** sur
  le fond satellite, teintée **vert néon**, avec grille et balayage — on lit
  la voirie et les noms par-dessus la photo. Les autres filtres (nuit, infra,
  sépia) restent au bouton 🎨.
* **Peau néon** : les contours, séparateurs et ascenseurs blancs hérités de
  l'app d'origine passent au cyan WATCHTOWER (désactivable : AFFICHAGE →
  🎨 Peau néon).
* **👁 L'œil est dans le logo** : inséré juste après le logo animé, avant le
  texte WATCHTOWER. Il ne bouge plus jamais et reste cliquable même en vue
  propre ou après la veille.

### 🗺 Feuille de route

La feuille de route vivante (fonctions, état, sources ouvertes branchées et à
brancher, prochaines étapes) est dans **[ROADMAP.md](./ROADMAP.md)** — elle est
mise à jour à chaque itération.

**Démarrage rapide (Windows PowerShell) :**

```powershell
npm install
npm run dev -- --host localhost --port 4173
# puis ouvrir http://localhost:4173
```

Aucun `.env` n'est nécessaire : le choix gratuit/payant se fait dans le navigateur.

---

<div align="center">

# 🌐 God's Eye View

### A spy-satellite simulator in your browser — then you realize the sources are public and the data is real.

Photorealistic 3D globe. Live aircraft, ships, satellites, earthquakes, traffic, and public cameras. Hands-free voice control powered by a realtime AI agent.

*No place left behind.*

![Orbital HUD, a tracked live globe, FLIR terrain — then OPEN SOURCED](docs/media/hero-open-source-reveal.gif)

<a href="https://www.youtube.com/@bilawalsidhu">
  <img src="docs/media/youtube-popular-videos.png" alt="The God's Eye View video series on YouTube" width="100%">
</a>

▶️ **From the project behind the viral God's Eye View series** *(formerly WorldView)* — [5M+ on YouTube](https://youtube.com/playlist?list=PL6qSg2I-7_koPbDnSMo0QeeHX_RknA2uv&si=nBGYMoHWQw41v93Q) · [25M+ across socials](https://www.google.com/search?q=god%27s+eye+view)

[![#1 on GitHub Trending](https://img.shields.io/badge/%231_GitHub_Trending-thank_you!-F0A63C?style=flat-square&logo=github)](https://github.com/trending)

🏆 **#1 on GitHub Trending this past week — thank you.** You asked for a one-click install; it's here.

⚡ **No keys, no signup, no config file.** One click through [Pinokio](https://pinokio.computer/) — or `npm install && npm run dev` — and the globe comes to life. Keys are power-ups you paste into the app later. **[→ Quick Start](#-quick-start)**

</div>

---

<div align="center">

**[Quick Start](#-quick-start) · [First Five Minutes](#-the-first-five-minutes) · [Talk to It](#-talk-to-it) · [What's Live](#-whats-on-the-globe) · [Under the Hood](#-under-the-hood) · [Keys & Costs](#-api-keys)**

</div>

---

## 🌍 Why This Exists

**You asked, so it's happening.** God's Eye View is open source. Track the world live. Talk to it. Break it. Extend it.

Most open-source intelligence is a pile of browser tabs. The signals are abundant, but the *interface* is the bottleneck. God's Eye View turns those signals into a **place**: the world is already broadcasting — flight transponders, ship beacons, orbital elements, seismographs, public cameras — and this makes it visible on a photorealistic 3D Earth in real time. No classified clearance required; it's public signal all the way down, and the interface runs in your browser, under your control.

> Half the magic is that it looks like a forbidden cockpit. The other half is that every line of code is inspectable.

Most feeds are live or regularly refreshed. Traffic is simulated along real
roads using aggregate location data. CCTV camera poses and rocket launch
trajectories are coarse estimates.

You'll be surprised how accessible this is. Free and nearly-free APIs deliver
a surprisingly complete experience out of the box — then it's yours to extend
with bigger data sources whenever you're ready.

---

## 🎛️ What This Thing Does

- **🛩️ Cockpit view:** Ride inside a tracked flight — the camera holds the terrain under you all the way down.
- **📡 Contacts:** A 250 km roster of everything near your target — step through live aircraft and drop into any cockpit.
- **🎯 Click-to-track anything:** Camera locks on, draws a fading trail, surfaces full metadata — and a tracked fire or vessel hands you off to the nearest live camera in one click.
- **🖊️ Voice whiteboard:** Speak annotations onto the world — real boundary polygons, marks, and routes.
- **🛫 3D hangar:** Real per-class aircraft models — 787, ATR-72, Citation, Bell 206, MQ-9 — and a tracked contact swaps from glyph to 3D model as you close in.
- **🎨 Reskin reality:** GLSL sensor looks over the normal globe — CRT, NVG, FLIR/thermal, Noir, Snow.
- **🟩 Detection overlay:** Screen-space bounding boxes and IDs on everything in view.
- **🎖️ Military HUD:** Tactical heads-up display with intelligence-style telemetry.
- **🌐 Global Context:** Stage the full situational picture with one switch — and get your exact view back when you leave.
- **🎥 Scene director:** Capture cinematic camera tours for clips and demos.
- **🔗 Share Links:** Camera, style, layers, and even one tracked target serialize into a URL — a live target is a handoff, not a bookmark.
- **🏠 Reset Globe:** One control — or one sentence — back to the full Earth.

---

<div align="center">

[![YouTube video about the God's Eye View open source release](https://img.youtube.com/vi/GRJaKcXZS94/maxresdefault.jpg)](https://www.youtube.com/watch?v=GRJaKcXZS94)

▶️ **[The full walkthrough of everything below, on YouTube](https://www.youtube.com/watch?v=GRJaKcXZS94)**

</div>

## ⚡ Quick Start

**Nothing to sign up for to get started.** Both paths below land you in the
same place: a live satellite globe — keyless Esri World Imagery with keyless
terrain, and OSM stepping in automatically if Esri is ever unreachable — with
aircraft, military traffic, satellites, earthquakes, public cameras, radio and
launches already moving on it. No account, no key, no file to edit.

**Optional signups, optimal experience.** The keyless globe gets you running;
a couple of two-minute signups make it spectacular. Want the photorealistic-3D
cities? A **free Cesium ion token** covers them for eligible personal,
non-commercial use — no Google account needed; current ion terms and quotas
apply. Prefer them straight from Google, plus in-app place search? A
**Google Maps key** is the billing-enabled, metered route — with a surprisingly
generous free tier ([real numbers](#-api-keys)). Either one pastes straight
into **Then power it up** below.

### Path 1 — One click, no terminal

1. Install [Pinokio](https://pinokio.computer/).
2. In **Discover → Download from URL**, paste
   `https://github.com/bilawalsidhu/gods-eye-view`.
3. Click **Install**, then **Start**.

That is the whole thing. The launcher verifies Pinokio's runtime, installs the
locked dependencies, finds a free local port, and opens the app.

### Path 2 — Terminal / coding agent

Requires Node.js 24.14.x or 26.x. Node 25 is usable but EOL; the setup doctor
warns instead of blocking it.

```bash
npm install
npm run doctor
npm run dev
```

Open **`http://localhost:4173`**. Cold start settles in under two seconds on a
recent laptop (median 1.86 s in a point-in-time M5/Chrome capture —
[docs/PERFORMANCE.md](docs/PERFORMANCE.md); a comparison baseline, not a hardware
requirement). A first-run card offers to stage a mission for you — **Live
Contacts**, **Space Missions**, **Environmental** — or leaves you to explore
manually.

**macOS shortcut:** `./scripts/dev-fresh.sh` clears the Vite cache and pulls any
configured keys straight from the Keychain. It starts keyless too.

### Then power it up — in the app, not in a file

Keys are upgrades, not prerequisites. When you want one, click the **POWER UP**
chip in the bottom-right corner: Provider Settings lists every supported key,
what it switches on, and where to get it. Paste, hit **SAVE KEYS**, and the app
restarts itself with the new capability on. Once everything is configured the
chip reads **POWERED UP** — and if a compact layout hides it, `?setup=1`
reopens the same panel.

- **Where keys land:** Pinokio → the app's ignored `pinokio/ENVIRONMENT`; a
  terminal clone → the repo-root `.env`. Either file is made owner-only
  *before* a secret is written into it, and it never leaves your machine.
- **Keys you already have stay yours:** values from your shell or the macOS
  Keychain show as *configured externally* and are read-only to the panel.
- **What to get first:** the free [Cesium ion](https://cesium.com/ion) token
  (eligible personal, non-commercial use; current terms and quotas apply) for
  photorealistic 3D and world terrain; a Google Maps key only for the
  billing-enabled, metered route + place search; OpenAI when you want to talk
  to the world. Full map, costs included, in [Keys & Costs](#-api-keys).

> [!WARNING]
> Do not enter credentials in Pinokio 8.0.40's native **Configure** panel: that
> release does not save this nested app file correctly, and it logs submitted
> values. Use Provider Settings inside the app instead. Both file stores are
> local plaintext; on macOS the Keychain via `./scripts/dev-fresh.sh` remains
> the stronger option.

The server binds to **localhost** on both paths, and Provider Settings answers
requests only from your machine. Browser-side keys (Google Maps, Cesium ion)
must be restricted at their providers — [SECURITY.md](SECURITY.md) shows how,
and it carries the LAN-sharing rules alongside [Keys & Costs](#-api-keys).

---

## 🕐 The First Five Minutes

No account, no signup. The first-run card will offer to stage a mission for you — or run this gauntlet yourself. Somewhere in these five minutes it stops feeling like a demo:

1. **Light up the sky.** Take the **Live Contacts** mission (or turn on **Flights** yourself) — thousands of live aircraft, gliding on real telemetry, detection mesh already reading the scene. Click one: the camera locks on, a trail draws behind it, and its live telemetry card comes up.
2. **Take the controls.** Hit **COCKPIT** on your tracked plane and ride it down, switching sensors mid-flight: NVG into Ironbow FLIR.

![Riding with a live aircraft in cockpit view while switching sensor modes](docs/media/06-cockpit-ar.gif)

3. **Drop into a busy airport.** Search one and descend to the taxiways with **3D** aircraft on — grounded contacts, taxi trails, the whole apron working in real time.

![Moving from a full airport overhead down to close taxiway inspection with 3D flight models](docs/media/start-here/airport-ground-traffic-google-3d.gif)

4. **Look through a public camera.** Turn on **CCTV** over Austin, London, or California. The feeds aren't webcam embeds — they project *into* the 3D city. Cycle coverage to **VIEWSHED** and every camera draws its estimated coverage volume — where it reaches, and where it goes blind.

![Diving into an Austin intersection with a live public camera projected into the 3D scene](docs/media/03-austin-cctv.gif)

5. **Track something in orbit.** Turn on **Satellites** and click the ISS — you ride along at orbital distance, orbit ring and all.

![Tracking the ISS along its orbital path as it crosses over Ukraine](docs/media/14-iss-over-ukraine.gif)

6. **Switch the optics.** Tap `1`–`7` — CRT, NVG, FLIR — and the whole live planet re-renders through a different sensor.

![Cycling a dense live globe through CRT, FLIR, and NVG in one continuous view](docs/media/01-style-sweep.gif)

7. **Talk to it** *(needs an OpenAI key)*: *"Take me to LAX and select the nearest airborne aircraft."*
8. **Come home.** Hit **Reset Globe** — or just say *"zoom out to a globe view."*

**Keyboard:** `1`–`7` visual styles · `H` HUD · `D` detection · `C` cockpit · `Esc` out.

---

## 🛩️ The Cockpit

> Every plane should let you do this.

Real-time cockpit mode, built from live flight data: the camera rides your contact with real terrain holding underneath, all the way down — sensor styles come along for the ride, and **Contacts** keeps the 250 km roster one click away: jump plane to plane and fall straight into the next cockpit.

![Jumping between live aircraft and falling straight into a cockpit view](docs/media/12-switch-aircraft-cockpit.gif)

The cockpit even carries its own briefing strip: nearby live signals, regional headlines, and real local weather — with an opt-in **WX** mode that renders volumetric clouds from actual observations around your aircraft.

![A live military contact ridden through Normal, NVG, and Ironbow FLIR with dense detection](docs/media/start-here/military-cockpit-dense-google-3d.gif)

*Why cockpit mode exists: you're riding a real aircraft over real terrain — and you get to pick which sensor you see the world through.*

---

## 🎙️ Talk to It

> Voice needs an **OpenAI key**. Without one the entire app still runs — the mic button just reports voice is unavailable. The same key drives the **AI HUD summary**: a terse, five-word intelligence-style readout of the current view that regenerates as you move.

Click **GEV MIC**, grant the microphone, and just talk. This is more than a voice-controlled remote:

- **🧠 It knows what it's looking at.** The agent pulls live scene context before answering — including coordinates, street names, active layers, and view scale. Ask *"what city is this?"* mid-flight and it knows.
- **🎯 Entity Q&A.** Click any plane, ship, or datacenter and ask *"what's this?"* It answers using the object's live telemetry.
- **👁️ Visual grounding.** At street level, it reads a viewport screenshot to identify legible signage and building names, and is instructed never to hallucinate labels.
- **🎬 Cinematic framing.** *"Show me the planes overhead"* pulls the camera back, angles it, and frames the live traffic like a director.
- **🔒 Honest and secure.** The agent only confirms actions that succeeded. Your `OPENAI_API_KEY` never touches the browser; the client only gets a short-lived session token.

Twenty-eight tools, four jobs — the commands below come straight from the product's voice test suite and tool playbook:

**🎥 Direct it** — drone-operator camera verbs:
> 🗣️ *"Take me to Tokyo."* · *"Orbit around this area slowly."* · *"Draw the walking route from the Capitol to Zilker Park."* → *"Fly the route we just drew."* · *"Zoom out to a globe view."*

**🖊️ Annotate it** — a whiteboard over the real world:
> 🗣️ *"Outline the state of Texas."* · *"Annotate the Texas State Capitol and its grounds"* — it draws the **actual enclosing boundary**, not a circle. · *"How far is the Eiffel Tower from the Louvre?"* — a connector arrow appears and it speaks the distance. Everything persists until you say *"clear the map."*

![Zilker Park and Lady Bird Lake drawing onto the 3D city as persistent vector annotations, by voice](docs/media/01-voice-annotate-zilker.gif)

![A spoken distance measurement spanning an airport, inspected from orbit](docs/media/04-airport-distance.gif)

**🔎 Interrogate it** — analyst queries against the live layers:
> 🗣️ *"How many flights are over Texas right now?"* · *"Which ships are headed to Oakland?"* · *"What is the biggest fire near Los Angeles?"* · *"Is anything flying above forty thousand feet?"* · *"When does the ISS pass over next?"*

**🎛️ Operate it** — the whole console, hands-free:
> 🗣️ *"Switch to night vision and turn on the flights layer."* · *"Turn on the camera viewsheds."* · *"Play a news radio station near Austin."* · *"Track that plane."* → *"Enter Cockpit."*

**And the rapid-fire tier** — one sentence each:
> 🗣️ *"Show me global infrastructure."* (stages the layers and pulls back to the globe) · *"Play Orbital Watch."* (a full cinematic scene) · *"Set detection density to fifty percent."* · *"Next contact — helicopters only."* (mid-cockpit) · *"Show me space missions."* · *"Switch to OSM."* · *"Sharpen the image a touch."* · *"Switch to the tactical layout."* · *"What's turned on right now?"*

![The globe populating with the world's radio stations as another live layer](docs/media/15-global-radio-layer.gif)

*Ask for radio near anywhere and the globe starts broadcasting — every station is a real place you can fly to.*

---

## 🛰️ What's on the Globe

Thirteen live layers. **Eleven of them need nothing at all** — no key, no account, no signup, starting with the satellite basemap you land on. (🟢 nothing · 🟡 free key · 🔴 metered.)

| Layer | What you get | Source | Auth |
|-------|--------------|--------|------|
| 🗺️ **Map Stack** | Esri satellite imagery, Google Photorealistic 3D, OSM, plus additional ion-hosted stacks | Esri / Google / Ion / OSM | 🟢 Esri satellite + OSM · 🟡 ion-hosted Google 3D + world terrain · 🔴 direct Google + place search |
| ✈️ **Live Flights** | 11,000+ live aircraft + route history | OpenSky + adsb.lol | 🟢 (🟡 optional for more polling credits) |
| 🎖️ **Military Flights** | ADS-B military traffic in amber | adsb.lol | 🟢 |
| 🚢 **Live Vessels** | Thousands of ships worldwide | AISStream | 🟡 |
| 🛰️ **Satellites** | 838-object catalog, color-coded by class with a live legend — the **DENSE** chip drops in the whole Starlink shell | CelesTrak | 🟢 |
| 🌍 **Earthquakes** | Global seismic activity, last 24h | USGS | 🟢 |
| 🚗 **Traffic** | Live congestion driving per-vehicle flow at street level — dive below ~8 km and the dots color to real jams. Keyless it's an approximate simulation | TomTom + OSM | 🟢 (🟡 TomTom makes it real — get one) |
| 📹 **CCTV Mesh** | ~800 public cameras projected *into* the 3D space — Austin · California (Caltrans) · London (TfL). Positions are published; poses are estimated priors **you calibrate by dragging a gizmo on the camera itself** | City APIs | 🟢 |
| 📻 **Radio** | Geolocated world radio with an **analog tuner** — drag the needle across up to 750 stations and the globe flies to each broadcaster | Radio Browser / broadcasters | 🟢 |
| 🚲 **Bikeshare** | Live station availability | GBFS | 🟢 |
| 🔥 **Active Fires** | Live NASA FIRMS detections, trailing 24h | NASA FIRMS | 🟡 |
| 🚀 **Space Missions** | Rolling 30-day launches with payload, stage, and recovery detail | Launch Library 2 | 🟢 (🟡 optional token raises the allowance) |
| 🎖️ **Mapped Installations** | Viewport-bounded military-site context from community mapping — incomplete by nature, and labeled that way | OpenStreetMap | 🟢 |

**The basemap ladder — what each tier buys you:**

| You have | The globe you get |
|---|---|
| 🟢 Nothing | Esri World Imagery satellite basemap + keyless terrain, in 2D. OSM takes over automatically if Esri is unreachable; if terrain is unavailable the globe continues without it |
| 🟡 A free Cesium ion token | **Google Photorealistic 3D cities** and world terrain — eligible personal, non-commercial use; current ion terms and quotas apply |
| 🔴 A Google Maps key | The same 3D direct from Google, plus in-app place search — the billing-enabled, metered route |

![A reconstructed Falcon 9 ascent climbing and curving into its projected orbit](docs/media/08-falcon9-replay.gif)

*The Space Missions layer replaying a Falcon 9 ascent — labeled `RECONSTRUCTED ESTIMATE`, scrubbable 0.25×–4×.*

**Also on the globe:** neighborhood overlays · an optional cockpit WX cloud effect. **Bundled static infrastructure:** Datacenters (4,351), Dams (704), and Submarine Cables (712).

![Diving into the Bahamas and revealing labeled submarine cable routes beneath the globe](docs/media/09-undersea-cables.gif)

**Missing a layer you want?** Open an issue — or add it and send the PR.

---

## 🎖️ Field Missions

Once the basics click, run these:

| Mission | How |
|---|---|
| **🚁 Ask the planet** | *"Why are all these military helicopters flying in circles?"* Select a military track — it silently backfills ~24 h of real trace history — and see what it's been doing, resolved as stacked 3D loops. |
| **✈️ Final approach** | Click-track an airliner lining up for a runway, hop into the **cockpit**, and ride it down. |
| **🌃 Night watch** | Fly to your own city, switch to **NVG**, and let the detection mesh and HUD read the scene. |
| **🚢 Port call** | Vessels on over the Port of Long Beach. Click a tanker for its tactical card and wake trail — then hit **NEAREST** in the CCTV panel and look at the same water through a public camera. |
| **📻 Tokyo FM** | Orbit Shibuya with the **Radio** layer on — then drag the analog tuner needle: every position snaps to a real station and the globe flies to whoever's broadcasting. |
| **🔥 Fire line** | FIRMS over California. Click a detection — the camera dives to it — read the intensity, then hit **NEAREST** in the CCTV panel for a ground view. |
| **🚶 Ask for a walking route** *🎙️* | Tell the world where you want to go and watch a real street-following route trace itself through the 3D city — then *"fly it"*: banked turns, eased ends, a camera that leads the path like a drone shot. |
| **📏 Measure LAX to DFW** *🎙️* | *"How far is LAX from DFW?"* — an arrow spans the country, the distance lands in the caption, and the endpoints stay pinned to the real world as you orbit. |
| **🚀 Launch replay** | Open **Space Missions**, pick a launch from the last 30 days, and ride the T-minus countdown through ascent to orbit — scrub it at 0.25×–4×. Labeled `RECONSTRUCTED ESTIMATE`, because it is one. |
| **🪦 Walk the boneyard** | Fly from regional context down into dense, fully resolved rows of retired aircraft. |
| **🏗️ Orbit Three Gorges** | Sweep the dam and its terrain at a glance — then flip on the **Dams** layer and find 703 more. |

*🎙️ = voice missions — they need an OpenAI key.*

![Resolving a selected aircraft's recent flight path into stacked 3D loops above the terrain](docs/media/07-helicopter-loops.gif)

*Ask the planet: a military contact's last ~24 hours of real trace history, resolved as stacked 3D loops.*

![Asking for a walking route and flying the generated path through the 3D city](docs/media/10-walking-route-flythrough.gif)

*"Draw the walking route… now fly it" — banked turns, eased ends, the camera leading the path like a drone shot.*

![Descending from regional context into dense rows of retired aircraft at the boneyard](docs/media/08-boneyard.gif)

*Walk the boneyard: rows of retired airframes, fully resolved in 3D.*

---

## 🔧 Under the Hood

Some of the engineering that makes it feel real rather than like a tech demo:

- **World-stable icons.** Aircraft and ships point along their *true real-world heading* at every camera angle — tracked or not, looking straight down or across the horizon — via per-frame screen-space course projection. No spinning, no viewport-locking.
- **Smooth motion from choppy data.** Live feeds arrive every 15–30s; the globe renders one interval behind real time and interpolates between known fixes. Dead reckoning fills the gaps.
- **Honest satellites.** SGP4 propagation with orbit rings that stay locked to their satellites via GMST realignment — no drift, no per-second flicker.
- **Sits on the real ground.** Entity heights run through a real vertical datum — geoid-aware, sampled against the *rendered* terrain mesh — so aircraft park on aprons and cameras stand on street corners instead of floating.
- **Spends your quota like it's its own.** The paid feeds run behind cached, budget-governed proxies — an OpenSky credit governor, a TomTom daily tile budget, disk-cached TLEs — so an afternoon of exploring doesn't torch an API allowance.
- **Secure by design.** Every API that touches a private key (OpenAI, AISStream, OpenSky OAuth, camera frames) is brokered through a hardened server-side proxy with SSRF protection, response caps, and sanitized errors. The only keys the browser sees are Google Maps and Cesium ion (restrict both at the provider).
- **No framework.** Vanilla JavaScript, **CesiumJS**, and **Vite** — plus **Google Photorealistic 3D Tiles** for the planet and the **OpenAI Realtime API** for voice. Fast to read, fast to hack on.

```
src/
├── main.js                 # Bootstrap: Google 3D tiles, layer registration
├── ui.js                   # Runtime UI — panels, HUD, styles, control facade
├── hud.js                  # Intelligence HUD + AI scene summary
├── keySetup.js             # POWER UP panel — in-app provider keys (dev server only)
├── mapStackController.js   # Basemap switching — Google 3D / Esri / OSM / ion stacks
├── iconOrientation.js      # Screen-projected world-space headings + horizon cull
├── voice/                  # OpenAI Realtime session + 28 voice tools
├── data/                   # One module per layer + orchestration + context store
│   └── local_data/         # Bundled datasets (per-folder provenance)
└── scenes/                 # Cinematic scene director
```

See [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md) for the authoritative runtime reference.

---

## 🧠 WATCHTOWER — modes et outils maison (FR)

Ajouts WATCHTOWER au-dessus de God's Eye View. Tout est **gratuit et sans clé**
sauf mention (🟢 gratuit · 🔵 compte · 🟣 payant, jamais obligatoire).

| Raccourci | Fonction | Module |
|---|---|---|
| 🛏 / **P** | 🧠 **PALAIS MENTAL** — chambre de motel 70 : le mur = tes dossiers (cartes analogiques fouillables jusqu'au plus petit élément), le bureau = tes outils (carte épinglée, drone, téléphone/chat, calendrier, radio, moniteur, chemise) | `palais.js` |
| — | 😴 **Veille** : plus aucun HUD à l'écran après 15 s sans contact (fondu de 10 s à 15 s), retour au premier geste | `veille.js` |
| 🔑 | **Comptes & niveaux** : fenêtre de connexion (Ollama local, services à clé, offres payantes optionnelles). Les clés restent dans ton navigateur | `compte.js` |
| `/aide` | Chat : 16 commandes + réponses rapides proposées selon le contexte | `commandes.js` |
| `/urgence` | Mode urgence : écran gelé, mascotte qui veille, procédures officielles, secours proches, itinéraire le plus rapide, guidage pas à pas | `urgence.js`, `urgenceMode.js`, `mascotte.js` |
| 🎥 | **Dispositifs** : caméras / micros / capteurs sur la carte, fiche + mini-fenêtre de direct + fiche détaillée | `dispositifs.js` |
| 🔲 | **Cadrans** découpés au **tracé communal** (intersection exacte) | `data/geoCadrans.js` |

**🤖 Le chat parle à ton IA locale** : branche **Ollama** (déjà installé ?) dans
🔑 SE CONNECTER → « Ollama (local) » → TESTER. Sinon n'importe quel service
compatible OpenAI. Sinon le chat continue en **mode hors-ligne** : il répond
avec ses commandes et cite ses sources — il n'invente rien (`llm.js`).

**Traçabilité** : chaque donnée affichée porte sa source cliquable ; ce qui est
estimé est annoté avec sa méthode. Mémoire des outils vus / utilisés / écartés :
👉 [`docs/SOURCES_ET_OUTILS.md`](docs/SOURCES_ET_OUTILS.md) · feuille de route :
👉 [`ROADMAP.md`](ROADMAP.md) · comparaison de 25 sites gratuits :
👉 [`docs/COMPARAISON_SITES.md`](docs/COMPARAISON_SITES.md).

## 🔑 API Keys

**The legend, one more time:** 🟢 **no signup** — works out of the box · 🟡 **free key** — register, paste, done · 🔴 **metered** — a billing-enabled account; costs are small but real.

Most of the globe is 🟢: flights (anonymous), military traffic, satellites, earthquakes, CCTV, radio, bikeshare, space missions, mapped installations, and every bundled dataset run with **zero keys**.

**And you never have to edit a file to add one.** Click **POWER UP** in the
bottom-right corner of the running app, paste the key into Provider Settings,
hit **SAVE KEYS** — the app writes it to its own local store with owner-only
permissions and restarts itself. Everything below is the map of what each key
actually buys you.

### What you need for the good experience

Six keys. Four have a free tier, and the two 🔴 ones are metered:

| | Key | Why | Get it |
|---|-----|-----|--------|
| 🟡 | **Cesium ion** | 🗺️ Google Photorealistic 3D, world terrain, and additional ion-hosted imagery stacks. The free Community plan is for eligible individual, personal/non-commercial use and has quotas | [cesium.com/ion](https://cesium.com/ion) — use a public `assets:read` token and check current [pricing/eligibility](https://cesium.com/platform/cesium-ion/pricing/) |
| 🔴 | **Google Maps** | Direct Google Photorealistic 3D + Google place search ([Map Tiles API](https://developers.google.com/maps/documentation/tile)) | [Google Cloud Console](https://console.cloud.google.com/) — URL-restrict it |
| 🔴 | **OpenAI** | 🎙️ The voice experience + AI HUD summary. The mini model works; the standard model is noticeably smarter. Want Gemini or another provider behind the mic? PRs welcome | [platform.openai.com](https://platform.openai.com) — metered, see costs below |
| 🟡 | **AISStream** | 🚢 Live global ships | [aisstream.io](https://aisstream.io) — free, seriously, it's a two-minute signup |
| 🟡 | **NASA FIRMS** | 🔥 Live active fires | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/map_key/) — free |
| 🟡 | **TomTom** | 🚦 Real traffic instead of an approximate simulation | [developer.tomtom.com](https://developer.tomtom.com) — free tier is plenty, completely worth it |

![Diving from city-scale live congestion straight into an intersection's public camera](docs/media/05-traffic-to-cctv.gif)

*What the TomTom key buys you: rush-hour density painted on the city — then dive from the jam straight into the camera watching it.*

### Cherry on top

| | Key | Why | Get it |
|---|-----|-----|--------|
| 🟡 | **OpenSky** | ✈️ More flight-polling credits (🟢 anonymous works without) | [opensky-network.org](https://opensky-network.org) |
| 🟡 | **Launch Library 2** | 🚀 Higher space-missions request allowance (🟢 works without) | [thespacedevs.com](https://thespacedevs.com) |

All of them are worth getting. None of them are required to start.

`npm run doctor` reports Node/npm readiness, the primary provider routes, and
where each configured provider was found without printing credential values.
On macOS its Keychain-aware result previews `./scripts/dev-fresh.sh`; plain
`npm run dev` reads only explicit environment and Vite dotenv values. The
OpenSky summary reports only OAuth client-pair presence, not the resolved
runtime mode or credential validity; Basic and credentials-file modes remain
advanced `dev-fresh.sh` configuration.

**If you'd rather not use the panel** — headless boxes, coding agents, scripted setups:

```bash
# Put keys in .env (see .env.example), or pass them as env vars:
OPENAI_API_KEY="…" AISSTREAM_API_KEY="…" npm run dev -- --host localhost --port 4173

# On macOS, store any of them in the Keychain and dev-fresh.sh pulls them in:
security add-generic-password -U -s "google-maps-api" -a "api-key" -w
security add-generic-password -U -s "openai-api"      -a "api-key" -w
security add-generic-password -U -s "aisstream-api"   -a "api-key" -w
security add-generic-password -U -s "firms-map"       -a "map-key" -w
security add-generic-password -U -s "cesium-ion"      -a "token"   -w
```

OpenSky can run fully anonymous (`OPENSKY_AUTH_MODE=anon`), or import OAuth credentials with `./scripts/opensky-import-client.sh /path/to/credentials.json`.

### 💸 What it actually costs

Honest numbers, roughly, as of mid-2026 — always check the provider pricing pages:

| | Cost reality |
|---|---|
| **🟢 Most layers** | **$0, no signup.** OpenSky anon, USGS, CelesTrak, adsb.lol, city CCTV, Radio Browser, GBFS, Launch Library 2, bundled datasets. |
| **🟡 The free-key tier** | **$0 with a signup.** AISStream, FIRMS, TomTom, OpenSky, plus Cesium ion for eligible personal/non-commercial use. Provider quotas and eligibility still apply. |
| **🗺️ Google 3D tiles** | **Free through an eligible Cesium ion Community account within its quota; metered through a direct Google key.** Use the direct route for GEV place search or commercial deployment, verify current provider terms, and set budget alerts where billing is enabled. |
| **🔴 OpenAI voice** | **The one that costs real money — so the app meters it for you.** Realtime audio runs a few cents per active minute; an evening of heavy use is single-digit dollars. A live session-spend readout sits next to the mic, with an STD/MINI model toggle, a $2 warning, and a **$5 hard cap that ends the session**. The voice context window is kept deliberately short too. |

Google's direct 3D route is surprisingly generous: the first 1,000 Photorealistic
3D Tiles sessions each month are currently free, and one root request supports
roughly three hours of rendering. A solo user exploring sparingly can
realistically stay inside the free usage cap. Billing must still be enabled, so
restrict the key and set a quota or budget alert. Check Google's
[current pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
before relying on these figures.

### 🧗 The floor is low on purpose

Everything above is the deliberately cheap baseline — enough to get a real taste of geospatial intelligence, GEOINT, and OSINT without ever talking to a sales team. You'll also notice the ceiling: terrestrial AIS goes quiet mid-ocean and satellite AIS costs real money; premium imagery, SAR, and the deeper commercial feeds live behind enterprise contracts. That's not a limit of the architecture — every layer here is a pattern you can point at your own data sources. This repo hands you the foundation; what you fuse into it is up to you.

### 🔒 Sharing an instance

By default nobody else can reach your server — it binds to localhost. To share on your LAN, opt in explicitly (`npm run dev -- --host 0.0.0.0 --port 4173`, or `HOST=0.0.0.0 ./scripts/dev-fresh.sh` on macOS/Linux) — but know that ⚠️ **a LAN-visible server brokers your configured API keys to anyone who can reach it.** Set the per-IP throttles (`GEV_RATELIMIT_OPENAI_PER_MIN`, `GEV_RATELIMIT_GOOGLE_PER_MIN` — see `.env.example`) and, before anything else, **set provider-side budget caps** (Google Cloud budgets, OpenAI usage limits): the throttles are app-level guards, not billing caps. Full threat model in [SECURITY.md](SECURITY.md).

Provider Settings switches itself off whenever the server is shared. The panel
answers loopback requests only, and any sharing mode disables the surface
outright rather than trusting the socket — tunnelled traffic reaches the server
from loopback too, so socket identity can't carry that boundary. Nobody on your
LAN gets a key-entry form.

Pinokio LAN and Cloudflare sharing are currently unavailable for this launcher.
The supported Pinokio release can activate sharing again when the Open-action
URL is registered, and writes a successful tunnel-login passcode into its own
notification and terminal stream. Before preflight, the launcher rewrites both
sharing modes to disabled values, clears the child passcode, and pins Pinokio's
share trigger to a disabled sentinel. The app then starts loopback-only and
registers the standard Open URL. Use a separate reviewed authentication proxy
if remote access is required.

---

## 📋 Responsible & Open

God's Eye View runs on **public data, clear sources, and local-first execution.** No secrets, no private datasets, no mystery scraping — anything involving a private key is brokered server-side. It has the visual grammar of a classified ops room, built entirely from open signals and inspectable code.

**The line.** This project models **events, assets, infrastructure, and systems** — aircraft, vessels, satellites, fires, cameras, cities. It does not build features for named-person search, face recognition, or tracking individuals, and pull requests that cross that line won't be merged. People are not a query type here.

**Come build it.** This is the canonical live 3D client from the project that kicked off the recent wave of spatial-intelligence tools — and it's a canvas: the layers here are the signals one person could find and fuse. Add a city pack, a data source, a style, a voice tool. It's the window through which you see the world; bring that window to others.

**Status:** An evolving open-source client for exploration and learning — a fast, hackable foundation, not a hardened production service. Released under the **[MIT License](LICENSE)**. Bundled and live datasets carry their own terms — see **[DATA_SOURCES.md](DATA_SOURCES.md)**. Security model: **[SECURITY.md](SECURITY.md)**. Want to contribute? **[CONTRIBUTING.md](CONTRIBUTING.md)**.

<sub>Media note: the capture GIFs on this page show Google Photorealistic 3D Tiles and live data layers, used promotionally with in-frame attribution; they aren't licensed for standalone reuse. See [media provenance and permissions](docs/media/README.md); full source terms in [DATA_SOURCES.md](DATA_SOURCES.md).</sub>

> [!IMPORTANT]
> God's Eye View is an exploratory visualization of public and third-party data.
> Data may be delayed, incomplete, modeled, inferred, or wrong. Do not use it
> for flight or maritime navigation, emergency response, medical or health
> decisions, investment decisions, or other safety-critical or operational
> purposes. Verify important information with authoritative sources.

---

## 🧭 What's Next

First — thank you. To everyone who watched the God-view demos and went off to build their own, and to everyone who kept asking for the code: I'm grateful. And when I polled whether this should go open source, you weren't subtle about it:

<img src="docs/media/open-source-survey.png" alt="Community survey on open-sourcing God's Eye View" width="460">

So here it is. Step inside the spy-thriller cockpit — except the data is real — and let's turn this into our shared sandbox for making sense of the world, and have fun doing it. This repo is the baseline, it stays open, and the whole point is for you to break things and bolt on layers we haven't thought of yet.

One heads-up from the inside: build in this space for a week and you learn that **the present is the cheap part**. The moment you try to go back in time — tiling, serving, and scrubbing *what happened* and *what changed* at any real resolution — the data gets expensive and the compute gets brutal. For that, we're building something cool. More in the future — [halfpixel.ai](https://halfpixel.ai).

---

<div align="center">

▶️ [Watch the God's Eye View series](https://youtube.com/playlist?list=PL6qSg2I-7_koPbDnSMo0QeeHX_RknA2uv&si=nBGYMoHWQw41v93Q) · 📬 [Map the World](https://maptheworld.ai/) — the newsletter behind the project

**🌐 God's Eye View. No place left behind.**

</div>
