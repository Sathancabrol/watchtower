# 🩺 DIAGNOSTIC — quand l'écran perd des fonctions

Ce document existe pour une raison précise : **quand une fonction disparaît,
on perd du temps à deviner**. Il décrit comment l'application est montée,
toutes les façons dont l'écran peut se vider, les pannes déjà rencontrées, et
la marche à suivre en cinq minutes.

---

## 1. Comment l'application est montée

`src/main.js` → `async function init()` initialise **une trentaine de modules
à la suite**, dans cet ordre :

```
capturerErreurs()          ← doit rester la toute première instruction
  ↓
openStartGate()            ← GRATUIT (sans clé) ou PAYANT (avec clés)
  ↓
new Cesium.Viewer(...)     ← la carte 3D
  ↓
installRenderGovernor(viewer)
  ↓
window.__godsEyeView = {}  ← l'inventaire public des modules
  ↓
initWatchtowerExtras · initCompassTape · initMobiDock · les modules métier…
  ↓
initMinimap · initFiche · … · initHudCentral (AFFICHAGE)
```

**Conséquence n°1 — une erreur de démarrage coupe tout le reste.**
Si un module jette une exception **hors** d'un `try/catch`, tout ce qui suit
n'est jamais créé : les boutons du lanceur existent (ils sont créés avant),
mais leur panneau est vide, les médaillons n'apparaissent pas, le bandeau
live reste muet. C'est la cause la plus fréquente de « le bouton ne fait plus
rien ».

**Règle :** tout appel à un module ajouté récemment est enveloppé dans
`try { … } catch (e) { console.error(…) }`. Ne jamais retirer ces garde-fous.

**Conséquence n°2 — chaque module s'enregistre dans `window.__godsEyeView`.**
C'est l'inventaire qu'utilise le diagnostic (F3) pour dire ce qui manque.

---

## 2. Les cinq mécanismes qui vident l'écran

Cinq systèmes indépendants peuvent masquer l'interface. Un bouton
« réafficher » doit **les neutraliser tous**, sinon il ne sert à rien.

| # | Mécanisme | Marqueur | Annulation |
|---|---|---|---|
| 1 | **Vue propre** | `body.ui-clean-view` | retirer la classe |
| 2 | **Mode tactique** | `#hud.active` | retirer `active` |
| 3 | **Veille** | `body.wt-veille-active` + `html.wt-veille-masque` + `--wt-veille` | retirer les classes **et** remettre `--wt-veille: 1` |
| 4 | **HUD réduit** | `body.wt-hud-cache` + `watchtower.hudAuto.v1` | retirer la classe **et** remettre la clé à `0` |
| 5 | **Affichage vol** (mobiGlas) | `mobiglas.actif()` | quitter le mode |

Plus, au niveau des fenêtres :

| Marqueur | Posé par | Effet |
|---|---|---|
| `.wt-hud-off` | fenêtre AFFICHAGE (`hudCentral`) | l'élément disparaît (persisté dans `watchtower.hudCentral.v1`) |
| `.wt-dock-cache` | le lanceur (`mobiDock`) | la fenêtre du bouton est masquée (persisté dans `watchtower.dock.v1`) |
| `.panel-collapsible.collapsed` | l'app d'origine | panneau replié |
| `display: none !important` **en ligne** | certains modules (ex. `intelTwin` sur `#intel-hud`) | écrase tout le reste |

⚠ **Piège classique** : un style **inline `!important`** gagne contre toutes
les feuilles de style. C'est exactement ce qui cachait le bandeau live :
`intelTwin` posait `display: none !important` au démarrage, et la fenêtre
AFFICHAGE ne pouvait pas le rendre. Voir §4.

---

## 3. L'outil de diagnostic (`src/diagnostic.js`)

- **Touche F3** ou le bouton **🐞 DIAG** du lanceur (catégorie MODES,
  toujours visible).
- Il affiche :
  - **MODULES** — chaque module attendu dans `window.__godsEyeView`, ✓ présent
    ou ✗ manquant ;
  - **ÉCRAN** — les éléments DOM qui doivent exister (`#intel-hud`,
    `#wt-panel`, `#wt-dock`…) ;
  - **MÉCANISMES DE MASQUAGE** — lequel des cinq est en train de vider
    l'écran ;
  - **ERREURS CAPTURÉES** — `window.onerror`, promesses rejetées,
    `console.error`, avec la pile ;
  - **RAPPORT JSON** — à coller tel quel dans un ticket.
- Boutons :
  - **👁 TOUT RÉAFFICHER** — neutralise les cinq mécanismes, lève les masques
    AFFICHAGE, déplie les panneaux, remet toutes les catégories du lanceur et
    libère le bandeau live. Renvoie la liste des actions effectuées.
  - **♻ RÉINITIALISER L'AFFICHAGE** — efface les réglages mémorisés
    (`hudCentral`, `dock`, `hudAuto`, `veille`) et recharge.
  - **📋 COPIER LE RAPPORT** — presse-papier.
- Depuis la console : `window.__wtToutReafficher()`.

La capture d'erreurs est installée par `capturerErreurs()`, **première
instruction de `init()`** : sans ça, une erreur de démarrage reste invisible.

---

## 4. Pannes déjà rencontrées (et leurs causes)

| Symptôme | Cause | Correctif |
|---|---|---|
| 🔥 **Plus aucun panneau : lanceur, INTEL, CHANTIER, VOL, poste… tous absents d'un coup** (rapport F3 : `#wt-dock` ✗, 19 modules ✗, une seule erreur `[console.error] [watchtower] dock: …`) | **Deux `function rendreListe()` dans le même scope** de `flightMode.js` (itération 10). Les déclarations de fonction sont remontées : la seconde **écrasait** la première pour tous les appels, et elle touchait `elListeParcours` — une `const` déclarée 58 lignes plus bas, donc **en zone morte temporelle (TDZ)** → `Cannot access 'elListeParcours' before initialization`. L'exception était absorbée par l'immense `try` qui enveloppe lanceur + poste + mission : **tout le bloc sautait**. | fonctions renommées `rendreListeEngins` / `rendreListeParcours` ; chaque `init…` isolé par `proteger()` ; éléments récupérés par `elDe()` ; le lanceur ignore un panneau sans élément ; test `src/gardeFous.test.mjs` |
| **✈ VOL inaccessible** | la barre du bas débordait sur deux rangs et le rang du haut passait **sous la barre micro** (`#command-dock`, calée en dur à 72 px) | le lanceur publie `--wt-hauteur-dock` ; la barre micro se cale au-dessus |
| **Des modules sans aucun bouton** (cadastre, radio, entités, cadrans…) | ils n'étaient pas dans le lanceur | 26 boutons rangés en 5 catégories |
| **« les outils / INTEL ont disparu »** | un préréglage masquait leur catégorie, sans moyen de la remettre | une **pastille par catégorie** dans la barre du haut |
| **Bandeau d'info live absent** | `intelTwin.js` posait `display: none !important` sur `#intel-hud` au démarrage | masquage conditionnel + calque « Bandeau live » + `watchtower.bandeauLive.v1` |
| **Médaillons invisibles** | (a) Nominatim muet → aucune hiérarchie ; (b) altités absolues → hors du champ de vue | repli **sans réseau** (lit pays/région/département/ville déjà affichés dans le panneau WATCHTOWER · FR) + empilement **en pixels** (`pixelOffset`) autour du point survolé |
| **Panneaux ancrés hors écran** | le lanceur peut atteindre 46 % de la hauteur ; les panneaux poussaient au-dessus du bord haut | `max-height: 46vh` sur le lanceur, `bottom: min(…, 44vh)` sur les panneaux |

---

## 5. Lire un rapport F3

Le rapport sépare **ce qui est présent** de **ce qui manque** — et c'est la
liste des manquants qui dit où le fil s'est rompu :

- **un seul module manquant** → le module lui-même (regarder les erreurs) ;
- **une longue liste de modules manquants d'un coup, tous créés après un
  certain point de `main.js`** → une exception a été absorbée par le grand
  `try` du bloc « lanceur + poste + mission ». La toute première erreur de la
  liste **ERREURS CAPTURÉES** est la coupable : les modules suivants
  n'ont simplement jamais été créés.
- **`#wt-dock` ✗ mais `#command-dock` ✓** → le lanceur WATCHTOWER n'existe
  pas ; ce qui reste à l'écran, c'est la barre d'origine de l'application.

Exemple réel (2026-09-06) : 19 modules ✗ et une seule erreur
`Cannot access 'elListeParcours' before initialization` → le coupable était
dans `flightMode.js`, pas dans le lanceur.

## 6. Marche à suivre en cinq minutes

1. **F3** (ou 🐞 DIAG).
2. Regarder **MÉCANISMES DE MASQUAGE** : si l'un est actif → **TOUT
   RÉAFFICHER**.
3. Regarder **MODULES** : un ✗ = le module n'a pas démarré. Ouvrir
   **ERREURS CAPTURÉES** : le message dit où.
4. Si rien n'y fait → **♻ RÉINITIALISER L'AFFICHAGE** (efface les réglages
   mémorisés et recharge).
5. **📋 COPIER LE RAPPORT** et le coller dans le ticket : il contient la
   liste des modules manquants, les erreurs et l'état du stockage.

---

## 7. Règles pour ne pas recommencer

1. **Tout nouvel `init…` est enveloppé dans un `try/catch`** et s'enregistre
   dans `window.__godsEyeView` (sinon le diagnostic ne peut pas le voir).
2. **Ne jamais poser `display: none !important` en ligne** sur un élément que
   l'utilisateur doit pouvoir réafficher. Passer par une classe et par
   `hudCentral`.
3. **Un bouton qui montre quelque chose doit annuler les cinq mécanismes**,
   sinon il « ne fait rien » du point de vue de l'utilisateur.
4. **Toute nouvelle fonction est ajoutée au lanceur** (catégorie existante ou
   nouvelle) : une fonction sans bouton est une fonction perdue.
5. **Toute source réseau a un repli sans réseau** : l'app doit rester
   utilisable quand l'API ne répond pas (le sandbox, par exemple, ne peut
   joindre Nominatim, Overpass, Open-Meteo…).
6. **Un test par fonction pure** (`node --test`) et, quand c'est possible, un
   passage au banc DOM (jsdom) pour vérifier que le module s'initialise sans
   erreur et que ses boutons ne jettent pas au clic.
7. **`src/gardeFous.test.mjs` fait respecter les règles ci-dessus** :
   aucune fonction déclarée deux fois au même niveau dans un fichier, aucun
   `display: none !important` en ligne hors du pilotage des CALQUES,
   `capturerErreurs()` avant tout `init…` dans `main.js`, raccourci F3 et
   fonction « tout réafficher » présents. Un test vérifie même que le
   détecteur de doublons n'est pas aveugle.
8. **Jamais deux fonctions du même nom dans un même scope.** C'est invisible à
   la relecture (les deux blocs sont éloignés dans le fichier) et pourtant
   fatal : le hoisting fait gagner la DERNIÈRE déclaration pour TOUS les
   appels, y compris ceux qui précèdent.

---

## 8. Vérifications automatiques

- `npm test` → suite complète (plus de 3 100 tests).
- Banc DOM (jsdom, `npm i --no-save jsdom`) : on peut initialiser
  `mobiDock`, `hudCentral`, `calques`, `theme` sans Cesium et vérifier que
  les boutons existent, que les catégories se pilotent et qu'aucun clic ne
  jette. Voir le §6.

---

## 9. Relancer l'aperçu (serveur de développement)

Le dossier `node_modules` est effacé entre les sessions : il faut réinstaller
avant de relancer.

```bash
cd /home/user/watchtower
PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --fund=false
HOST=0.0.0.0 PORT=4173 ALLOW_FRAMING=1 node_modules/.bin/vite --strictPort
```

Trois pièges, dans l'ordre où on les rencontre :

1. **`npm install` échoue sur `puppeteer`** — son script d'installation
   télécharge Chrome, ce que le réseau du bac à sable refuse. La variable
   `PUPPETEER_SKIP_DOWNLOAD=1` évite l'étape ; Vite n'a pas besoin de Chrome.
2. **`--host 0.0.0.0` ne suffit pas** — `vite.config.js` lit la variable
   d'environnement `HOST` (`env.HOST`) pour décider de `allowedHosts`. Sans
   `HOST=0.0.0.0`, Vite répond **403 « host not allowed »** à l'URL de l'aperçu
   et la page reste blanche.
3. **`ALLOW_FRAMING=1`** est nécessaire : sans lui le serveur pose
   `X-Frame-Options: DENY` + `frame-ancestors 'none'`, et l'aperçu (qui
   affiche l'app dans une iframe) refuse de charger.

Vérification : `curl -s -o /dev/null -w '%{http_code}' -H 'Host: <hôte de
l'aperçu>' http://localhost:4173/` doit renvoyer **200**.
