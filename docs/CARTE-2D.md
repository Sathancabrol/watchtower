# Chantier A2 — bascule 2D ↔ 3D

## Pourquoi ce chantier existe

Lacune **#9 de `docs/AUDIT.md`** : « 3D saturée ». C'est la seule lacune qui
**casse activement l'application** — l'incident `maximumTextureSize` rencontré
en session en est la manifestation directe.

Le correctif précédent (`src/data/reprisRendu.js`) traite le symptôme : il
relance la boucle de rendu après une perte de contexte WebGL. Ce chantier-ci
traite la cause : **ne pas demander de la 3D quand la 2D suffit**.

Mesure de l'étude FOSS4G 2025 (arXiv 2602.23660), sur un même nuage de points :

| Moteur | Total blocking time |
|---|---|
| CesiumJS | **21 357 ms** |
| MapLibre GL JS + deck.gl | **3 ms** |

Cesium reste supérieur au chargement de 3D Tiles : il n'est pas question de le
remplacer, mais de lui laisser ce qu'il fait bien.

## Décision : bascule franche, pas affichage simultané

Un seul moteur actif à la fois. Faire tourner Cesium et MapLibre ensemble
doublerait la charge GPU — exactement l'inverse du but — et obligerait à
synchroniser deux caméras en continu, à chaque image.

On transfère donc un **état neutre** de l'un à l'autre, puis on éteint le
précédent. C'est le rôle de `src/data/carte2d/etatCamera.js`.

## Le piège : hauteur en mètres contre niveau de zoom

Cesium raisonne en **hauteur de caméra (mètres)**, MapLibre en **niveau de zoom
(0-24)**. La conversion dépend de la latitude : à zoom égal, un pixel couvre
moins de terrain vers les pôles, d'un facteur **cos φ**.

À Sète (43,4° N), cos φ ≈ **0,73** — une conversion naïve décalerait la vue de
près de 30 %. Le test `la latitude change la resolution` vérifie que le rapport
mesuré vaut exactement cos(43,4°).

Le test qui compte est `ALLER-RETOUR 3D -> 2D -> 3D sans derive` : basculer puis
revenir doit rendre la vue de départ, à 10⁻⁹ près, sur position, altitude, cap et
tangage. Il est rejoué sur les **9 latitudes du bassin de Thau**.

Autres conversions traitées :

- **Tangage** : Cesium mesure depuis l'horizontale vers le bas (−90° = nadir) ;
  MapLibre part de la verticale et **plafonne à 60°**. Le nadir Cesium donne donc
  une carte parfaitement à plat.
- **Longitude** : repliée dans [−180, 180]. Le cas déjà dans la plage sort tel
  quel, sinon le double modulo introduit une dérive flottante (3,7493 devenait
  3,74929999…) — défaut trouvé par les tests.

## Quand basculer

`conseillerBascule2D()` propose la 2D dans trois cas, et dit toujours pourquoi :

| Condition | Raison rendue à l'utilisateur |
|---|---|
| FPS moyen < 25 | « Rendu à N i/s : la 2D soulagera le GPU. » |
| Tangage > 80° (nadir) | « Vue au nadir : le relief n'apporte rien ici. » |
| Altitude > 2 000 km | « Altitude orbitale : la 2D est plus lisible et bien plus légère. » |

La fonction ne bascule jamais d'autorité : elle conseille, l'utilisateur décide.

## Les fonds ne changent pas

`src/data/carte2d/styleIgn.js` construit des styles MapLibre à partir des
**mêmes couches WMTS IGN** que la 3D, avec les **mêmes identifiants** que
`src/displayOptions.js` (`ign-plan`, `ign-ortho`, `ign-1950`, `ign-topo`,
`ign-cadastre`).

Basculer ne change donc pas l'image, seulement la façon de la dessiner — c'est
ce qui rend la transition acceptable à l'œil. Aucune clé d'API : Licence Ouverte,
attribution portée par chaque source.

Piège évité et testé : `URLSearchParams` encoderait les gabarits `{z}/{x}/{y}` en
`%7Bz%7D`, que MapLibre ne substituerait jamais. Ils sont ajoutés après encodage.

## Dépendance ajoutée

**`maplibre-gl` 6.8.0** — licence **BSD-3-Clause**, compatible avec la licence
MIT de watchtower. (Rappel : libhunt annonce à tort MapLibre en GPL-3 ; la
vérification a été faite dans le fichier LICENSE du dépôt.)

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/data/carte2d/etatCamera.js` | Conversions et décision de bascule. 19 tests. |
| `src/data/carte2d/styleIgn.js` | Styles MapLibre sur fonds IGN. 10 tests. |

Modules purs : ni réseau, ni DOM, ni dépendance à Cesium ou MapLibre. Ils sont
donc testables intégralement hors navigateur — 29 tests, tous hors ligne.

## Montage dans l'interface

`src/carte2dControleur.js` branche le socle au DOM et aux deux moteurs. Il est
monté depuis `src/main.js` **après le voile de chargement** : le bouton
n'apparaît pas avant que la scène soit prête. L'appel est protégé par un
`try/catch` — si la bascule échoue à s'installer, l'application démarre quand même.

### Ce qui se passe au passage en 2D

1. L'état de caméra Cesium est lu et converti (`lireEtatCesium`).
2. MapLibre est **importé dynamiquement** — première fois seulement.
3. La carte est créée ou repositionnée (`jumpTo`) sur la vue équivalente.
4. `viewer.useDefaultRenderLoop = false` et le canevas Cesium est masqué.

Le point 4 est celui qui compte : **c'est là que le GPU est réellement libéré**.
Masquer sans arrêter la boucle n'aurait rien résolu.

### Ce qui se passe au retour en 3D

L'état MapLibre est relu, reconverti et appliqué à Cesium (`appliquerEtatCesium`),
la boucle repart, un rendu est demandé. Cesium **n'est jamais détruit**, seulement
suspendu : le retour est instantané, sans rechargement de tuiles ni de terrain.

### Chargement à la demande — vérifié

Le build sort MapLibre dans un **chunk séparé** :

```
dist/assets/maplibre-gl-CJG3b3mk.js   1 045 kB │ gzip: 280 kB
```

Un utilisateur qui reste en 3D ne le télécharge jamais. C'est la raison de
l'`import()` dynamique plutôt que d'un import statique en tête de fichier.

### Interface

- Bouton `🗺 Vue 3D / 2D` en bas à gauche, aux couleurs du HUD existant.
- Sélecteur de fond en 2D, alimenté par `listerFonds()` — donc les **mêmes
  couches IGN** qu'en 3D, y compris « Remonter le temps ».
- Contrôle de navigation MapLibre avec visualisation du pitch.

### Tests

7 tests supplémentaires avec des **doublures de Cesium** (pas de navigateur
requis) : conversion radians/degrés dans les deux sens, aller-retour sans dérive,
viewer incomplet ou absent, état aberrant assaini avant d'atteindre Cesium,
et dégradation propre quand il n'y a pas de DOM.

**Total du chantier : 36 tests, tous hors ligne.**

## Reste à faire

- Brancher `conseiller()` sur le compteur d'images pour proposer la bascule
  spontanément quand le GPU souffre (la fonction existe et est testée, elle n'est
  pas encore appelée automatiquement).
- Reporter en 2D les couches de données applicatives (actuellement seuls les
  fonds IGN sont rendus côté MapLibre).
