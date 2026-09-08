# Parité avec God's Eye View + base de données Thau

## 1. Comparaison objective avec le projet source

Le dépôt `bilawalsidhu/gods-eye-view` a été cloné et comparé module par module.

| | Source | Ce fork |
|---|---|---|
| Modules `src/` (hors tests) | **147** | **224** |
| Couches `src/data/` | **88** | **99** |
| Modules du source absents ici | **1** | — |

**Un seul module manquait** : `src/data/installationFeedback.js` (19 lignes,
messages d'état du chargement des installations cartographiées via Overpass).
Il est désormais porté et traduit, avec 5 tests.

Les 12 fonctions annoncées par le README du source — vue cockpit, contacts
250 km, click-to-track, tableau blanc vocal, hangar 3D, filtres GLSL
(CRT/NVG/FLIR/Noir/Snow), overlay de détection, HUD militaire, contexte global,
scene director, liens de partage, reset globe — **sont toutes présentes**.

Le fork a par ailleurs **77 modules de plus** que le source (vues du territoire,
cadastre, cadrans, fiche lieu, radio, Vigicrues, archives temporelles, bascule
2D, volant, socle territorial…).

## 2. Ce qui manque réellement : deux couches sous clé

La parité de **code** est atteinte. Les seuls trous fonctionnels sont deux flux
de données que le projet source ne fournit pas non plus sans clé :

| Couche | Situation | Voie gratuite |
|---|---|---|
| **Navires (AIS)** | Désactivée proprement | Clé **gratuite** sur `aisstream.io` (inscription) |
| **Trafic routier** | Dégradée proprement | Clé **gratuite** sur TomTom (palier gratuit) |

### Point de vérité sur l'AIS

**Il n'existe pas de flux AIS mondial libre et sans clé.** Les réseaux
réellement ouverts sont **régionaux** :

- **Kystverket** (Norvège) — NLOD 2.0, sans inscription, zone économique norvégienne ;
- **BarentsWatch** — NLOD 2.0, mer de Barents et Svalbard ;
- **Fintraffic Digitraffic** — CC BY 4.0, eaux finlandaises ;
- **aiscast / Open Waters** — agrège les précédents, code MIT, WebSocket sans
  jeton en anonyme (2 connexions/IP, zone ~10°×10°) — mais **couverture
  Europe du Nord**.

Aucun ne couvre la Méditerranée. Pour voir les navires de Sète, la clé gratuite
`aisstream.io` reste la seule voie. C'est écrit dans le code
(`couvreMediterranee: false`) et **vérifié par un test** qui échouerait si
quelqu'un prétendait le contraire.

## 3. La base de données du bassin de Thau

`src/data/territoire/sourcesThau.js` — toutes les sources sont **publiques,
gratuites et sans clé**.

### Transports (Point d'Accès National)

| Réseau | Autorité | Formats | Communes |
|---|---|---|---|
| **SAMobilité** (Keolis) | Sète Agglopôle | GTFS | 8 du bassin |
| **Cap'Bus** (Carpostal) | CA Hérault Méditerranée | GTFS + **GTFS-RT** | Agde |
| **TaM** | Montpellier Métropole | GTFS + **GTFS-RT** | bassin d'emploi |
| **TER liO** | Région Occitanie | GTFS | ligne Montpellier–Sète–Agde |

Le TaM figure ici bien qu'hors bassin : **67 % des actifs de Frontignan
travaillent hors commune**, sur le double bassin Montpellier/Sète.

### Jeux nationaux embarquables (fonctionnement hors ligne)

Base Adresse Nationale · **Cadastre par commune** (GeoJSON) · **RNA**
(associations) · **SIRENE** établissements · covoiturage · stationnement · ZFE.

Tous téléchargeables en masse : c'est la réponse à « parer au coup d'IA ou
question utilisateur » sans dépendre de la disponibilité des API.

### Sources vivantes sans clé

**Géorisques** (PPRI, PPRT, Seveso, submersion) · **Hub'Eau** (qualité des eaux
de baignade — enjeu conchylicole du bassin) · **Panoramax** (photos de rue
libres, déjà branché).

## 4. Extension prévue

La structure ne dépend pas du bassin de Thau : `transportsDe(insee)` accepte
n'importe quel code INSEE, et les jeux nationaux couvrent toute la France. Passer
de 15 communes à 35 000 ne demande **aucun changement de structure** — seulement
d'alimenter le référentiel.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/data/installationFeedback.js` | Module porté du source. **5 tests.** |
| `src/data/territoire/sourcesThau.js` | Transports, jeux nationaux, maritime. **11 tests.** |

**Total : 3277 tests au vert.**
