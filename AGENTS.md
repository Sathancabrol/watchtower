# AGENTS.md — à lire en premier, toujours

> Point d'entrée unique pour un agent qui reprend ce dépôt. Si tu ne lis
> qu'un fichier, lis celui-ci. Il est court exprès.
> Dernière mise à jour : **2026-10-06**.

## En une phrase

WATCHTOWER est une console de renseignement géospatial qui tourne
**entièrement dans le navigateur** — globe Cesium, couches ouvertes, zéro
serveur. Copie open-source de « God's Eye View » (MIT, Bilawal Sidhu),
recentrée sur le **bassin de Thau** et destinée à devenir **un module de
l'application `proto-cognitorium`**.

## Les 4 réflexes avant de toucher à quoi que ce soit

```bash
ls node_modules | wc -l     # < 100 → le bac à sable a été réinitialisé
git log --oneline -1        # sur 353d37c → idem
git status --short          # travail non commité ?
npm test 2>&1 | grep "^not ok"   # 4 échecs sont NORMAUX (voir plus bas)
```

**Le bac à sable se réinitialise très souvent** (18 fois à ce jour) :
`node_modules` vidé, dépôt remis sur `353d37c`, processus perdus. Les
symptômes ressemblent à des régressions — ce n'en sont pas. Procédure de
récupération en bas de ce fichier.

## Lancer

```bash
pkill -f vite; sleep 3
HOST=0.0.0.0 PORT=4173 ALLOW_FRAMING=1 npm run dev
```

Pas de vérification visuelle possible : **Puppeteer est inutilisable**
(Chrome effacé à chaque réinitialisation) et **il n'y a aucun réseau
sortant** depuis le bac à sable. S'appuyer sur les tests statiques et sur
l'utilisateur.

## Où lire quoi

| Besoin | Fichier |
|---|---|
| Où on va, et dans quel ordre | **`docs/ARCHITECTURE-MODULE.md`** ← le plan |
| Ce qu'on peut intégrer, et à quel prix | `docs/audit/` + `docs/AUDIT-SOURCES-2026-10-06.md` |
| Les chantiers A à G et l'historique | `ROADMAP.md` |
| L'empilement des calques | `src/data/ui/calques.js` |
| Le classement des fonctions | `src/data/volant/taxonomie.js` |
| Pannes déjà rencontrées | `docs/DIAGNOSTIC.md` |

`docs/CURRENT-STATE.md` (2 588 lignes) vient du dépôt amont : c'est une
référence, pas un état courant. `docs/REPRISE.md` est périmé.

## Les sources de vérité uniques (ne jamais contourner)

- **`src/data/ui/calques.js`** — tout `z-index`. Le bloc `:root` en fin de
  `style.css` en est **généré** : ne pas l'éditer à la main. Un `z-index`
  posé à la main crée des recouvrements qu'aucun test ne voit.
- **`src/data/volant/taxonomie.js`** — catégories et noms des 43 fonctions.
- **`src/data/volant/registreBascules.js`** — les bascules persistées.
- **`src/data/geo/echelleVue.js`** — correspondance altitude → échelle.

## Les pièges qui ont déjà coûté cher

1. **`write_file` tronque vers 1 400 caractères, sans erreur.** Utiliser des
   heredocs bash, ou `python3` avec `assert old in s`.
2. **`cat > src/<fichier>.js` a déjà écrasé un module de 300 lignes.**
   Toujours `ls src/<nom>.js` avant de créer un « nouveau » module.
3. **Un masquage posé en JS au montage ne suffit pas** : si le module ne
   démarre pas, l'élément reste visible. Écrire la règle en CSS statique ; le
   JS ne sert qu'aux bascules.
4. **Monter un panneau après le volant le laisse grisé** : monter **avant**
   `proteger('volant latéral', …)` dans `main.js`.
5. **Ajouter une entrée à `taxonomie.RANGEMENT` ne suffit pas** : le
   catalogue vient aussi de `barreFonctions.CATEGORIES`.
6. **Ne jamais masquer les sorties de secours** `#view-switcher`,
   `#clean-view-exit`.
7. **Masquer du DOM n'éteint pas une entité Cesium.**
8. **Ne jamais inventer une URL de service.**
9. **`node --test <répertoire>` échoue** — passer les fichiers.
10. **Arrêter le serveur avant de modifier `src/`** quand l'utilisateur
    regarde l'aperçu (sinon erreur Cesium `maximumTextureSize`).

## État connu

- **3 480 tests passent, 4 échouent** — préexistants, pas une régression :
  câbles sous-marins, `firstRunExperience`, `radioMarkup`, basemaps/voix.
- Build ✓ en ~9 s. Bundle principal **2,38 Mo** + `egm96` 2,77 Mo.
- `src/` : 113 modules, 95 fichiers de test.
- `index.html` 925 lignes · `style.css` 9 623 lignes · `main.js` 1 272 lignes
  et 92 imports.

## Contraintes de l'utilisateur, permanentes

- **Tout doit être togglable**, point d'entrée = **l'œil sous le logo**.
- **Ne perdre aucune fonction** : déplacer les nœuds DOM, jamais les
  recréer ni les supprimer. `src/integriteUI.test.mjs` le vérifie.
- **Gratuit et sans serveur.** Chaque ami lance l'app depuis son propre
  agent Arena. Une clé par ami = un ami qui abandonne.
- **Enrichir la base locale** pour répondre hors ligne ; **toujours dire**
  quand une source externe est nécessaire.
- **Marquer ce qui est inféré** (`~` + « inféré » + la règle), et donner un
  niveau de confiance.
- **Vérifier les chiffres**, surtout budgets et calendriers.
- **Aucune intégration sans passer par le catalogue** `docs/audit/`.

## Récupération après réinitialisation (validée 7 fois)

```bash
cp src/*.js /home/user/sauv-osint/            # SAUVEGARDER D'ABORD
git fetch origin arena/01a072e1-watchtower:refs/remotes/origin/ar -f
git reset --hard origin/ar
PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --no-fund
# recopier, puis node --check, puis npm test
```

Jamais de `reset --hard` sans sauvegarde. Ni `git pull`, ni `rebase -X ours`.
Un `cp /sauv/*.js src/` emporte aussi `style.css` → le remettre à la racine.

## Branche

Session liée à **`arena/01a072e1-watchtower`**. Ne jamais en changer.
Pousser dès qu'un lot est cohérent — c'est la seule protection contre la
réinitialisation.
