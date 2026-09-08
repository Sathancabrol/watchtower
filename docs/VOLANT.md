# 🎛 Le volant (chantier B) + corrections d'affichage

## Le problème posé

Trois demandes liées :

1. **La 3D ne marchait plus** — vue satellite plate, sans rues ni bâtiments.
2. **Les cercles volants France/ville encombrent** — il faut pouvoir tout éteindre.
3. **Pas d'accès direct aux fonctions** — le test était pénible.

## 1. Pourquoi la 3D était cassée

Ce n'était **pas** la bascule 2D. C'est un défaut de configuration de repli
présent depuis l'origine, que la bascule a simplement rendu visible.

`src/main.js` tente de charger les **3D Tiles photoréalistes de Google**. Sans
clé d'API (`googleApiKey`) ni jeton Cesium Ion, le chargement échoue et
l'application retombait sur `esri-imagery` : **de l'imagerie satellite nue**, sans
rues nommées, sans limites, sans bâti. Impossible de se repérer.

**Correctif** : le repli est désormais **`ign-plan`** — le Plan IGN, gratuit et
sans clé, qui affiche rues nommées, bâtiments et limites administratives. Il
était déjà déclaré dans `MAP_STACKS`, il n'était simplement pas utilisé comme
défaut.

```js
const REPLI_SANS_CLE = 'ign-plan';   // au lieu de 'esri-imagery'
```

Pour les **bâtiments en volume**, le module `🏙 BÂTI 3D` (OSM, gratuit) reste
disponible dans le dock et le volant : il extrude le bâti réel sans clé d'API.

Un second point a été corrigé dans la bascule 2D : on masquait le canevas Cesium
par `visibility: hidden`. Au retour en 3D, le contexte WebGL ne se réveillait pas
toujours et la scène restait figée. Le conteneur 2D étant déjà opaque et
au-dessus, **on ne touche plus au canevas Cesium** — on se contente d'arrêter sa
boucle de rendu, et un `resize()` est forcé au retour.

## 2. Tout peut être éteint

`src/data/volant/registreBascules.js` déclare **8 bascules d'affichage** :

| Bascule | Ce qu'elle masque |
|---|---|
| ☀ Anneau céleste | Le cercle soleil/lune autour du globe |
| 🔵 Médaillons flottants | Les pastilles de lieux qui flottent |
| 🏷 Titre WATCHTOWER | Le bandeau de titre |
| 🔲 Cadrans de la commune | Le quadrillage de quartiers |
| 📰 Fil d'actualité | Le bandeau de dépêches |
| 🗺 Minicarte | La carte ronde |
| ✈ Entités mobiles | Avions, bateaux, véhicules |
| 📡 Dispositifs au sol | Capteurs, caméras, bornes |

Un bouton **« ✕ Vue nue »** éteint tout d'un geste ; **« ✓ Tout »** restaure.
L'état est **mémorisé** entre les sessions.

Le masquage se fait par `visibility` et non `display` : les mises en page qui
dépendent de la taille des éléments ne sont pas cassées, et Cesium n'est pas
décalé.

## 3. Le volant

Un **moyeu unique 👁**, placé **sous le logo WATCHTOWER** en haut à gauche —
l'emplacement demandé pour le bouton œil. Au clic, huit rayons se déploient :

🎛 Affichage · 💬 Chat · 🧭 Lieux · 🗺 Minicarte · 🧠 Intel · 📷 Caméras ·
🏙 Bâti 3D · ✈ Vol

Une **pastille de décompte** (`6/8`) indique en permanence combien d'éléments
d'affichage sont allumés.

### Le volant référence, il n'absorbe pas

C'est le point tenu : chaque rayon **pointe** vers un module existant, via l'API
du dock (`ouvrir`, `ouvrirExistant`) ou un sélecteur CSS. Rien n'est
réimplémenté. **Si le volant disparaissait, l'application resterait entière** —
le dock du bas, les panneaux et les raccourcis clavier fonctionnent toujours.

Le montage dans `main.js` est protégé par `proteger()` : si le volant échoue à
s'installer, le reste démarre normalement.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/data/volant/registreBascules.js` | Registre pur : familles, bascules, géométrie de l'éventail. **15 tests.** |
| `src/volant.js` | Rendu, persistance, câblage au dock. |
| `src/main.js` | Montage après le dock (l. ~731) + repli `ign-plan` (l. ~285). |
| `src/carte2dControleur.js` | Correctif du réveil WebGL au retour en 3D. |

## Reste à faire

- Les rayons couvrent 8 fonctions ; le dock en expose ~23. Les suivantes seront
  ajoutées au volant après retour d'usage sur celles-ci.
- Les sélecteurs de quelques bascules (médaillons, fil, entités, dispositifs)
  sont larges à dessein : à resserrer si un masquage déborde.
