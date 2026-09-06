# 💾 WATCHTOWER — ÉTAT DE REPRISE (sauvegarde de session)

> Document de **sauvegarde** : il permet de reprendre le travail exactement là
> où il en est, même après une réinitialisation du bac à sable (les
> `node_modules` **et** l'historique git local sont régulièrement effacés
> entre les tours).

**Sauvegardé le** : itération 21 · **HEAD** `55e553b` · branche
`arena/01a06ebe-watchtower` · **synchronisé** avec le dépôt distant
(`git ls-remote` = même empreinte) · **arbre propre** (0 fichier en attente).
Serveur d'aperçu en ligne sur le port **4173**.

---

## 1. Où en est le projet

| Repère | Valeur |
|---|---|
| Modules | **101** fichiers `src/*.js`, ~47 000 lignes |
| Tests | **3 144**, dont **2 échecs préexistants** (à ne pas confondre avec une régression) |
| Itérations | **21** (voir `ROADMAP.md`, numérotation latine continue 0 → 0 terdecies) |
| Docs | `AUDIT.md` (bilan 1→20) · `DIAGNOSTIC.md` (F3) · `SOURCES_ET_OUTILS.md` · `COMPARAISON_SITES.md` |

Les **2 échecs préexistants** :
* « cable ground lines classify against exactly the active surface on every stack »
* « every live basemap is reachable by its own id — no enum value without a voice alias »

## 2. Ce qui a été fait (arc complet)

1-6 entités, sources cliquables, traçabilité, INTEL · 7-8 chat guidé, palais ·
9-10 parcours de vol, ME LOCALISER · 11 historique · 12 HUD central · 13 œil
dans le logo · 14 lanceur · 15 les 27 calques · 16 diagnostic F3 · 17 bug des
19 modules + garde-fous · 18 lanceur 2 lignes + globe · 19 boussole lisible,
veille 60/90 s, écran épuré, pastilles dispersées, Kepler · 20 dossier
d'investigation + télé cathodique + fenêtre → stellaire · **21 audit général +
🏰 HQ (la tour de guet dans le ciel, apparition par distance type Maps)**.

## 3. Modules clés

| Besoin | Module |
|---|---|
| Lanceur (dock 2 lignes) | `mobiDock.js` |
| HUD / ne rien perdre | `hudCentral.js` |
| Calques (27) | `calques.js` |
| Pastilles d'entités | `entites.js` |
| Médaillons de lieu 360° | `medaillons.js` |
| Minicarte + boussole | `minimap.js`, `compassTape.js` |
| 🏰 **Tour HQ (nouveau)** | `hq.js` |
| Palais mental (10 objets) | `palais.js` |
| Dossier d'investigation | `dossier.js` |
| Système solaire (Kepler) | `systemeSolaire.js` |
| Diagnostic **F3** | `diagnostic.js` |
| Garde-fous | `gardeFous.test.mjs` |

## 4. 🔥 Ouvert — la suite, dans l'ordre

| # | Point | État |
|---|---|---|
| 1 | **« la fenêtre WATCHTOWER n'est plus là »** (panneau d'interface ?) | ❓ En attente du **F3** de l'utilisateur |
| 2 | **INTEL = hub d'investigation AR** : drill-down de l'arborescence au clic | ⬜ |
| 3 | **« Bloomberg de la ville »** : entreprises, infrastructures, environnement, landmarks, croisement **visuel** | ⬜ |
| 4 | **Analyse territoriale** en INTEL | ⬜ |
| 5 | Pastilles pays/région **à l'emplacement des capitales** — choix à trancher : liste en dur (hors-ligne) vs Nominatim | ⬜ |
| 6 | Icônes qui se superposent + **AR** | 🟡 partiel |
| 7 | **CONTEXT** en double (INTEL + bandeau principal) | ⬜ |
| 8 | **3D saturée H24** → bascule 2D/3D avec **MapLibre GL** | ⬜ |
| 9 | **Caméra direct** (webcam ? `#wt-live` ?) | ❓ non reproduit |
| 10 | Palais : **fermeture des pages**, options supplémentaires | ⬜ |

## 5. Règles imposées par l'utilisateur (à ne jamais perdre)

* **Français** : réponses, libellés d'interface et noms de tests.
* **« ne perd pas de fonctionnalité ! »** — toute réécriture doit conserver
  rotation au drag, double-clic nord, tous les boutons de minicarte, tout le HUD.
* **Traçabilité** : chaque donnée affichée est sourcée, et les sources sont des
  **liens cliquables** dans la fiche.
* **Sources ouvertes et gratuites**, temps réel, dégradation propre hors réseau.
* **Roadmap mise à jour à chaque itération**.
* **Une illustration obligatoire** dans la fiche lieu (vue drone à défaut).
* **Ne jamais laisser l'utilisateur sans moyen de rappeler l'UI** (œil toujours
  visible / bouton réglages).
* **INTEL doit devenir le cœur de l'utilisateur expert** + bandeau supérieur où
  chaque catégorie a son mini-ticker.
* **SUIVI → TRACKING**, et un nouveau SUIVI = infos live + multi-vue caméras.
* **Veille** : rien de touché pendant 15 s → HUD invisible (fondu dès 10 s) —
  *assoupli à 60 s / 90 s sur demande*.
* **Palais mental** : chambre de mobile-home 1970, nuit, rideaux fermés,
  enseigne néon, porte fermée, tableau interactif, objets-analogies.
* **L'œil est dans le logo, à côté de WATCHTOWER, et ne bouge jamais**.
* Quand une fonction disparaît : **diff contre un ancien commit** plutôt que
  deviner, et **écrire le diagnostic dans le dépôt**.

## 6. Recette d'environnement (pièges connus)

```bash
cd /home/user/watchtower
PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --fund=false   # node_modules souvent effacé
HOST=0.0.0.0 PORT=4173 ALLOW_FRAMING=1 ./scripts/preview.sh     # aperçu (HOST sinon 403, ALLOW_FRAMING sinon iframe vide)
npm i --no-save jsdom                                          # pour les tests DOM
node --test src/<module>.test.mjs
```

* **Reset git entre les tours** : si `git push` est refusé (`fetch first`),
  l'historique local a été remis à zéro. Ne **pas** faire `reset --hard`
  aveuglément : `git diff <mon-commit> > /tmp/x.patch` d'abord, puis restaurer
  **fichier par fichier** (`git checkout <mon-commit> -- src/a.js src/b.js`).
  Déjà fait deux fois sans perte.
* **Mes scripts python peuvent tronquer** un bloc multiligne en produisant du
  JS valide : après chaque édition scriptée, faire un `diff` du bloc touché.
* **Bac à sable** : seuls GitHub et npm sont joignables. Overpass, Nominatim,
  Géorisques, Open-Meteo, USGS, Radio-Browser, GDELT sont **injoignables** —
  les modules correspondants doivent dégrader proprement.
