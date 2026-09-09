# Audit UI — remise en état installable

Six défauts signalés. État réel de chacun, sans arrondi.

## 1. Pastilles / cercles pays-commune — CORRIGÉ

Deux problèmes distincts, deux correctifs.

- **Ça gonfle, ça gâche la vue** → `src/data/volant/registreBascules.js` : `medaillons`
  et `anneau-celeste` passent à `parDefaut: false`. Ils ne s'affichent plus qu'à la
  demande, depuis le volant œil ou la barre des fonctions.
- **Pas au bon endroit** → `src/medaillons.js` : le bloc était centré en haut
  (`left:50%; top:76px`), pile dans l'axe du regard. Il est déplacé contre le bord
  droit (`right:14px; top:104px`) et rétréci (320 → 272 px).

Le sélecteur de la bascule visait `#wt-medaillons`, un id qui n'existe pas ; le vrai
est `#wt-medaillon-carte`. La bascule était donc sans effet. Corrigé.

## 2. Fonctions de la v0 devenues inaccessibles — CORRIGÉ

CONTEXTE, CCTV et les autres existent toujours dans le code : c'est leur point
d'entrée qui avait disparu de l'écran. Plutôt que de rouvrir les anciens boutons un
par un, tout passe désormais par la barre unique (défaut 3), qui garantit par test
la présence d'Intel, Caméras, Époques, Bâti 3D, Cadastre et Radio.

Résolution d'un clic, dans cet ordre : `dock.ouvrir(id)` → `dock.ouvrirExistant(cible)`
→ `revelerPanneau(cible)` (retire `hidden`, `collapsed`, `display:none`) → action
directe → à défaut, message d'indisponibilité. Aucune fonction ne peut plus être
« perdue » silencieusement : si elle est injoignable, elle le dit.

## 3. Bandeau unique — FAIT

`src/barreFonctions.js`. **24 fonctions, 4 catégories sur une seule ligne**, chacune
dans un cadre portant son nom, cases translucides (`rgba(255,255,255,.06)`) pour
laisser voir les icônes. Placé sous les boutons voice : `bottom: calc(2vh + 4.6rem)`,
juste au-dessus de `#command-dock` qui est à `2vh`. Poignée « ▼ FONCTIONS » pour
replier.

| Catégorie | Fonctions |
|---|---|
| Vues | Minicarte, Filtres, Bâti 3D, Cadrans, Époques, Visuel+ |
| Données | Intel, Caméras, Histoire, Chantier, Radio, Trajets, Cadastre, Entités, Dispositifs |
| Navigation | Moi, Lieux, Favoris, Épingles, HQ |
| Modes | Vol, Système solaire, Chat, Paramètres |

## 4. Fiches trop petites, boutons quitter/modifier invisibles — CORRIGÉ

`src/lisibilite.js`, feuille transversale injectée **en dernier** dans `<head>` pour
primer à spécificité égale. Principe : **des planchers, pas des tailles fixes** — un
panneau déjà confortable n'est pas touché.

- Panneaux (`.wt-dock-panel, .wt-fiche, .wt-panneau, #wt-intel, #wt-pins`) :
  `min-width:300px`, `max-width:min(96vw,560px)`, `max-height:80vh`.
- Boutons `.fermer / .modifier / .reduire / .wt-x / .wt-close` : **28×28 px**,
  `font-size:16px`, survol rouge pour fermer, cyan pour modifier.
- Barres de titre : `min-height:34px`. Media query sous 640 px.

S'applique partout, pas seulement aux fiches de gauche.

## 5. Époques — NON REPRODUIT, NON CORRIGÉ

À dire franchement : **je n'ai pas pu vérifier**. Ce chantier interroge Overpass, et
le bac à sable où je travaille n'a aucun accès réseau sortant (`curl` renvoie 000 sur
`overpass-api.de` comme sur `data.geopf.fr`). Impossible de rejouer la panne.

Ce que j'ai pu contrôler par lecture : le proxy Overpass est bien en place
(`vite.config.js` l.188-227, 5 miroirs + cache disque `.gev-cache/overpass`) et le
gestionnaire est bien branché (`src/historique.js:308`, `btnCharger.onclick`).
**Aucun défaut de câblage.** L'hypothèse la plus probable est donc un miroir Overpass
saturé côté réseau, pas un bug de l'app — mais c'est une hypothèse, pas un
diagnostic. À rejouer sur ton poste, console ouverte.

## 6. Charger bâti — NON REPRODUIT, NON CORRIGÉ

Même cause, même limite : `src/batiRapide.js` passe par Overpass. Même conclusion
provisoire, à confirmer chez toi.

## Vérifications

- `npx vite build` : succès.
- `npm test` : **3291 pass / 4 fail**, soit exactement les 4 échecs préexistants
  (`telegeographySubmarineCables`, `firstRunExperience`, `radioMarkup`,
  `voice/gevActions`). Aucune régression introduite.
- 14 tests neufs (10 barre, 4 lisibilité) + 1 test de non-régression sur les
  bascules éteintes par défaut.
