/**
 * WATCHTOWER — VOLANT LATÉRAL : TOUT, DANS UN SEUL TIROIR À GAUCHE.
 *
 * Demande : « mets tous les boutons / icônes / features / options dans un
 * volant déroulant sur la gauche de l'écran, avec les bonnes catégories,
 * ne perds pas de features ».
 *
 * MÉTHODE POUR NE RIEN PERDRE — on n'écrit pas la liste à la main. Le
 * catalogue est **agrégé automatiquement** depuis les registres qui font déjà
 * autorité dans l'application :
 *
 *   · `barreFonctions.CATEGORIES`      — les fonctions de la barre unique
 *   · `ergonomieDock.SOMMAIRE_OPTION`  — le sommaire du tiroir OPTION
 *   · `registreBascules.BASCULES_AFFICHAGE` — les interrupteurs d'affichage
 *
 * Conséquence : toute entrée ajoutée demain à l'un de ces registres apparaît
 * ici sans modification, et le test d'exhaustivité échoue si une entrée
 * existante venait à disparaître du volant.
 *
 * On OUVRE les panneaux là où ils sont ; on ne déplace aucun nœud du DOM.
 * Déplacer un panneau dans un tiroir fermé rendrait muets les boutons du dock
 * qui le visent — c'est précisément la perte de fonction à éviter.
 *
 * @module volantLateral
 */

import { CATEGORIES } from './barreFonctions.js';
import { SOMMAIRE_OPTION } from './ergonomieDock.js';
import { BASCULES_AFFICHAGE, basculer as inverser, normaliserEtat } from './data/volant/registreBascules.js';
import { appliquerBascule, lireEtat, ecrireEtat } from './volant.js';

/** Catégories du volant, dans l'ordre d'affichage. */
export const CATEGORIES_VOLANT = Object.freeze([
  { id: 'affichage', nom: 'Affichage', icone: '👁', aide: 'Allumer ou éteindre les couches de l’interface' },
  { id: 'vues', nom: 'Vues', icone: '🗺', aide: 'Ce que montre l’écran' },
  { id: 'donnees', nom: 'Données', icone: '📊', aide: 'Couches d’information et sources' },
  { id: 'nav', nom: 'Navigation', icone: '🧭', aide: 'Se déplacer et retrouver des lieux' },
  { id: 'modes', nom: 'Modes', icone: '🎛', aide: 'Changer de posture de travail' },
  { id: 'outils', nom: 'Outils', icone: '🛠', aide: 'Réglages, partage, utilitaires' },
]);

/** Rattachement des groupes du sommaire OPTION aux catégories du volant. */
const DEPUIS_OPTION = Object.freeze({
  'Réglages': 'outils',
  'Calques': 'donnees',
  'Vues': 'vues',
  'Données': 'donnees',
  'Navigation': 'nav',
});

/** Rattachement des catégories de la barre aux catégories du volant. */
const DEPUIS_BARRE = Object.freeze({
  Vues: 'vues',
  Données: 'donnees',
  Navigation: 'nav',
  Modes: 'modes',
  Outils: 'outils',
});

/** Rattachement des familles de bascules (elles vont toutes dans Affichage). */
const CATEGORIE_BASCULE = 'affichage';

/**
 * Clé d'unicité d'une entrée : deux entrées qui ouvrent la même chose sont
 * la même fonction, quel que soit le registre d'origine.
 * @param {object} e
 * @returns {string}
 */
export function cleEntree(e) {
  if (!e) return '';
  if (e.type === 'bascule') return `bascule:${e.id}`;
  if (e.dock) return `dock:${e.dock}`;
  if (e.cible) return `cible:${e.cible}`;
  return `nom:${String(e.nom || '').toLowerCase()}`;
}

/**
 * Agrège les trois registres en un catalogue unique, dédoublonné et classé.
 *
 * Règle de fusion : la première occurrence gagne, mais on **enrichit** son
 * libellé et son aide si une source ultérieure est plus explicite. On garde
 * la trace des registres d'origine dans `sources`, ce qui rend l'audit
 * possible (« d'où vient ce bouton ? »).
 *
 * @returns {Array<{id:string, nom:string, icone:string, entrees:object[]}>}
 */
export function construireCatalogue() {
  const parCategorie = new Map(CATEGORIES_VOLANT.map((c) => [c.id, []]));
  const vues = new Map();

  /** Insère une entrée si elle est nouvelle, sinon complète l'existante. */
  const poser = (categorie, entree) => {
    const cle = cleEntree(entree);
    if (!cle) return;
    const deja = vues.get(cle);
    if (deja) {
      if (!deja.aide && entree.aide) deja.aide = entree.aide;
      // un libellé lisible l'emporte sur un libellé technique
      if (entree.nom && entree.nom.length > (deja.nom || '').length) deja.nom = entree.nom;
      if (!deja.sources.includes(entree.source)) deja.sources.push(entree.source);
      return;
    }
    const complet = { ...entree, cle, sources: [entree.source] };
    vues.set(cle, complet);
    (parCategorie.get(categorie) || parCategorie.get('outils')).push(complet);
  };

  // 1. Interrupteurs d'affichage — ils PILOTENT, ils n'ouvrent pas.
  for (const b of BASCULES_AFFICHAGE) {
    poser(CATEGORIE_BASCULE, {
      type: 'bascule',
      id: b.id,
      nom: b.libelle,
      icone: b.icone,
      aide: b.aide || '',
      parDefaut: b.parDefaut !== false,
      source: 'bascules',
    });
  }

  // 2. Fonctions de la barre unique.
  for (const cat of CATEGORIES) {
    const dest = DEPUIS_BARRE[cat.nom] || 'outils';
    for (const e of cat.entrees) {
      poser(dest, {
        type: 'ouvrir',
        nom: e.info || e.nom || '',
        icone: e.icone || '•',
        aide: e.info || '',
        dock: e.dock || null,
        cible: e.cible || null,
        source: 'barre',
      });
    }
  }

  // 3. Sommaire du tiroir OPTION.
  for (const groupe of SOMMAIRE_OPTION) {
    const dest = DEPUIS_OPTION[groupe.groupe] || 'outils';
    for (const e of groupe.entrees) {
      poser(dest, {
        type: 'ouvrir',
        nom: e.nom,
        icone: e.ic || '•',
        aide: e.info || '',
        dock: e.ancre || null,
        cible: e.cible || null,
        source: 'option',
      });
    }
  }

  return CATEGORIES_VOLANT.map((c) => ({
    id: c.id,
    nom: c.nom,
    icone: c.icone,
    aide: c.aide,
    entrees: parCategorie.get(c.id) || [],
  }));
}

/** Toutes les entrées du catalogue, à plat. */
export function toutesLesEntrees(catalogue = construireCatalogue()) {
  return catalogue.flatMap((c) => c.entrees);
}

/**
 * Filtre le catalogue par texte libre (nom, aide, cible).
 * @param {string} texte
 * @param {Array} [catalogue]
 */
export function filtrer(texte, catalogue = construireCatalogue()) {
  const q = String(texte || '').trim().toLowerCase();
  if (!q) return catalogue;
  return catalogue
    .map((c) => ({
      ...c,
      entrees: c.entrees.filter((e) => `${e.nom} ${e.aide} ${e.dock || ''} ${e.cible || ''}`.toLowerCase().includes(q)),
    }))
    .filter((c) => c.entrees.length > 0);
}

const CSS = `
#wt-volant-lat {
  position: fixed; left: 0; top: 0; bottom: 0; z-index: 960;
  width: 268px; display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(5,11,18,0.97), rgba(4,9,15,0.97));
  border-right: 1px solid rgba(0,212,255,0.28);
  font-family: var(--font-sans, system-ui, sans-serif); color: #e8eaed;
  transform: translateX(0); transition: transform .22s ease;
  box-shadow: 4px 0 24px rgba(0,0,0,0.45);
}
#wt-volant-lat.wt-vl-replie { transform: translateX(-268px); }
#wt-volant-lat .vl-tete {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-bottom: 1px solid rgba(0,212,255,0.22); flex: none;
}
#wt-volant-lat .vl-tete h2 {
  margin: 0; font-size: 10px; letter-spacing: 2.4px; color: #00d4ff; font-weight: 800;
  font-family: var(--font-mono, monospace);
}
#wt-volant-lat .vl-compte { margin-left: auto; font-size: 9px; color: rgba(232,234,237,0.45); }
#wt-volant-lat .vl-rech { padding: 8px 12px; flex: none; }
#wt-volant-lat input[type=search] {
  width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.45);
  border: 1px solid rgba(0,212,255,0.28); border-radius: 6px; color: #e8eaed;
  font: inherit; font-size: 12px; padding: 7px 9px; min-height: 32px;
}
#wt-volant-lat input[type=search]:focus { outline: none; border-color: #00d4ff; }
#wt-volant-lat .vl-corps { flex: 1; overflow-y: auto; padding: 0 8px 14px; }
#wt-volant-lat .vl-cat { margin-bottom: 4px; }
#wt-volant-lat .vl-cat > summary {
  display: flex; align-items: center; gap: 7px; cursor: pointer; list-style: none;
  padding: 8px 8px; border-radius: 7px; font-size: 10px; font-weight: 800;
  letter-spacing: 1.8px; color: #9fe9ff; text-transform: uppercase;
  background: rgba(0,212,255,0.07); border: 1px solid rgba(0,212,255,0.16);
}
#wt-volant-lat .vl-cat > summary::-webkit-details-marker { display: none; }
#wt-volant-lat .vl-cat > summary:hover { background: rgba(0,212,255,0.16); }
#wt-volant-lat .vl-cat > summary .vl-n { margin-left: auto; font-size: 9px; opacity: 0.55; letter-spacing: 0; }
#wt-volant-lat .vl-liste { display: flex; flex-direction: column; gap: 3px; padding: 5px 0 9px; }
#wt-volant-lat .vl-item {
  display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;
  min-height: 34px; padding: 6px 9px; cursor: pointer; text-align: left;
  font-family: inherit; font-size: 12px; color: #dfe7ee; border-radius: 6px;
  background: rgba(255,255,255,0.03); border: 1px solid transparent;
}
#wt-volant-lat .vl-item:hover, #wt-volant-lat .vl-item:focus-visible {
  background: rgba(0,212,255,0.16); border-color: rgba(0,212,255,0.45); outline: none;
}
#wt-volant-lat .vl-item .vl-ic { flex: none; width: 18px; text-align: center; font-size: 13px; }
#wt-volant-lat .vl-item .vl-nom { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-volant-lat .vl-item[disabled] { opacity: 0.32; cursor: not-allowed; }
#wt-volant-lat .vl-led {
  flex: none; width: 26px; height: 15px; border-radius: 8px; position: relative;
  background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.2);
}
#wt-volant-lat .vl-led::after {
  content: ''; position: absolute; top: 1.5px; left: 2px; width: 10px; height: 10px;
  border-radius: 50%; background: rgba(255,255,255,0.5); transition: transform .15s ease;
}
#wt-volant-lat .vl-item[aria-pressed="true"] .vl-led { background: rgba(0,212,255,0.4); border-color: #00d4ff; }
#wt-volant-lat .vl-item[aria-pressed="true"] .vl-led::after { transform: translateX(11px); background: #fff; }
#wt-volant-lat .vl-vide { font-size: 11px; color: rgba(232,234,237,0.4); padding: 10px 8px; font-style: italic; }
#wt-volant-lat .vl-pied {
  flex: none; display: flex; gap: 6px; padding: 8px 12px;
  border-top: 1px solid rgba(0,212,255,0.18);
}
#wt-volant-lat .vl-pied button {
  flex: 1; min-height: 30px; font-size: 10px; cursor: pointer; border-radius: 6px;
  color: #cfe9f5; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(0,212,255,0.26); font-family: inherit;
}
#wt-volant-lat .vl-pied button:hover { background: rgba(0,212,255,0.2); }
/* DÉCALAGE DU CONTENU — le volant occupe 268 px à gauche. Sans ce décalage il
   recouvrirait la minicarte, le HUD et les boutons du bas (tous ancrés à
   left:12px) : les fonctions seraient invisibles, donc perdues. On pousse
   plutôt que de superposer, et on revient à zéro quand le volant est replié. */
body.wt-volant-ouvert #wt-minimap,
body.wt-volant-ouvert #wt-minimap-menu,
body.wt-volant-ouvert #wt-bascule2d,
body.wt-volant-ouvert #wt-bascule-minicarte,
body.wt-volant-ouvert #hud,
body.wt-volant-ouvert #wt-panel {
  left: 292px !important;
  transition: left .22s ease;
}
/* Écran étroit : le volant se superpose au lieu de tout comprimer. */
@media (max-width: 900px) {
  body.wt-volant-ouvert #wt-minimap,
  body.wt-volant-ouvert #wt-minimap-menu,
  body.wt-volant-ouvert #wt-bascule2d,
  body.wt-volant-ouvert #wt-bascule-minicarte,
  body.wt-volant-ouvert #hud,
  body.wt-volant-ouvert #wt-panel { left: 12px !important; }
}
/* Languette : elle reste visible même volant replié, sinon plus d'accès. */
#wt-vl-languette {
  position: fixed; left: 268px; top: 50%; transform: translateY(-50%);
  z-index: 961; width: 26px; min-height: 92px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgba(5,11,18,0.95); color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.32); border-left: none;
  border-radius: 0 9px 9px 0; font-size: 13px;
  transition: left .22s ease;
}
#wt-vl-languette:hover { background: rgba(0,212,255,0.22); }
#wt-vl-languette.wt-vl-replie { left: 0; }
#wt-vl-languette .vl-fleche { writing-mode: vertical-rl; letter-spacing: 2px; font-size: 8.5px; font-weight: 800; }
`;

/** Clé de mémorisation de l'état replié / déployé. */
export const CLE_REPLI = 'wt-volant-lateral-replie';

/**
 * Ouvre une entrée « ouvrir » en réutilisant le dock existant.
 * @returns {boolean} vrai si quelque chose a répondu
 */
export function ouvrirEntree(entree, hub = globalThis.__godsEyeView) {
  if (!entree) return false;
  const dock = hub?.dock;
  if (entree.dock && dock?.ouvrir) return dock.ouvrir(entree.dock) !== false;
  if (entree.cible && dock?.ouvrirExistant) return dock.ouvrirExistant(entree.cible) !== false;
  const el = entree.cible ? globalThis.document?.getElementById?.(entree.cible) : null;
  if (el) {
    el.classList?.remove?.('wt-dock-cache', 'hidden');
    el.style.display = '';
    return true;
  }
  return false;
}

/**
 * Monte le volant latéral.
 * @param {Document} [doc]
 * @param {{surMessage?:Function, stockage?:object}} [options]
 */
export function initVolantLateral(doc = globalThis.document, options = {}) {
  const vide = { hote: null, basculer() {}, rafraichir() {}, catalogue: () => [] };
  if (!doc?.createElement) return vide;

  if (!doc.getElementById('wt-volant-lat-css')) {
    const st = doc.createElement('style');
    st.id = 'wt-volant-lat-css';
    st.textContent = CSS;
    doc.head?.appendChild(st);
  }
  doc.getElementById('wt-volant-lat')?.remove?.();
  doc.getElementById('wt-vl-languette')?.remove?.();

  const catalogue = construireCatalogue();
  const total = toutesLesEntrees(catalogue).length;

  const hote = doc.createElement('aside');
  hote.id = 'wt-volant-lat';
  hote.setAttribute('aria-label', 'Volant — toutes les fonctions');
  hote.innerHTML = `
    <div class="vl-tete">
      <h2>VOLANT</h2>
      <span class="vl-compte">${total} fonctions</span>
    </div>
    <div class="vl-rech"><input type="search" placeholder="Rechercher une fonction…" data-vl="q"></div>
    <div class="vl-corps"></div>
    <div class="vl-pied">
      <button type="button" data-vl="tout-ouvrir">Tout déplier</button>
      <button type="button" data-vl="tout-fermer">Tout replier</button>
    </div>`;
  doc.body?.appendChild(hote);

  const languette = doc.createElement('button');
  languette.id = 'wt-vl-languette';
  languette.type = 'button';
  languette.title = 'Afficher ou masquer le volant (toutes les fonctions)';
  languette.innerHTML = '<span class="vl-fleche">VOLANT</span>';
  doc.body?.appendChild(languette);

  const corps = hote.querySelector('.vl-corps');
  let etatBascules = normaliserEtat(lireEtat(options.stockage));

  /** Peint le catalogue, éventuellement filtré. */
  function peindre(filtreTexte = '') {
    const liste = filtrer(filtreTexte, catalogue);
    corps.innerHTML = '';
    if (!liste.length) {
      corps.innerHTML = '<div class="vl-vide">Aucune fonction ne correspond.</div>';
      return;
    }
    for (const cat of liste) {
      const d = doc.createElement('details');
      d.className = 'vl-cat';
      // à la recherche, on déplie pour montrer ce qui a été trouvé
      d.open = Boolean(filtreTexte) || cat.id === 'affichage';
      const s = doc.createElement('summary');
      s.innerHTML = `<span>${cat.icone}</span><span>${cat.nom}</span><span class="vl-n">${cat.entrees.length}</span>`;
      s.title = cat.aide;
      d.appendChild(s);

      const ul = doc.createElement('div');
      ul.className = 'vl-liste';
      for (const e of cat.entrees) ul.appendChild(construireItem(e));
      d.appendChild(ul);
      corps.appendChild(d);
    }
  }

  /** Construit une ligne : interrupteur pour une bascule, bouton sinon. */
  function construireItem(e) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'vl-item';
    b.title = e.aide || e.nom;
    b.dataset.cle = e.cle;

    if (e.type === 'bascule') {
      const actif = etatBascules[e.id] !== false;
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
      b.innerHTML = `<span class="vl-ic">${e.icone}</span><span class="vl-nom">${e.nom}</span><span class="vl-led"></span>`;
      b.addEventListener('click', () => {
        etatBascules = inverser(etatBascules, e.id);
        const on = etatBascules[e.id] !== false;
        const bascule = BASCULES_AFFICHAGE.find((x) => x.id === e.id);
        if (bascule) appliquerBascule(bascule, on, doc);
        ecrireEtat(etatBascules, options.stockage);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        options.surMessage?.(`${e.icone} ${e.nom} ${on ? 'affiché' : 'masqué'}`);
      });
      return b;
    }

    // Une cible « existante » absente du DOM : on grise plutôt que de mentir.
    const absente = e.cible && !doc.getElementById(e.cible);
    if (absente) {
      b.disabled = true;
      b.title = `${e.aide || e.nom} — non disponible dans cette session`;
    } else {
      b.addEventListener('click', () => {
        if (!ouvrirEntree(e)) options.surMessage?.(`${e.nom} : panneau introuvable`);
      });
    }
    b.innerHTML = `<span class="vl-ic">${e.icone}</span><span class="vl-nom">${e.nom}</span>`;
    return b;
  }

  // ── repli / déploiement ──
  let replie = false;
  try {
    const s = options.stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
    replie = s?.getItem(CLE_REPLI) === '1';
  } catch { /* mode privé */ }

  const poserRepli = () => {
    hote.classList[replie ? 'add' : 'remove']('wt-vl-replie');
    languette.classList[replie ? 'add' : 'remove']('wt-vl-replie');
    languette.setAttribute('aria-expanded', replie ? 'false' : 'true');
    // pousse les éléments ancrés à gauche au lieu de les recouvrir
    doc.body?.classList?.[replie ? 'remove' : 'add']?.('wt-volant-ouvert');
  };

  const basculer = (force) => {
    replie = typeof force === 'boolean' ? force : !replie;
    try {
      const s = options.stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
      s?.setItem(CLE_REPLI, replie ? '1' : '0');
    } catch { /* mode privé */ }
    poserRepli();
    return !replie;
  };

  languette.addEventListener('click', () => basculer());

  hote.querySelector('[data-vl="q"]')?.addEventListener('input', (e) => peindre(e.target.value));
  hote.addEventListener('click', (e) => {
    const a = e.target?.dataset?.vl;
    if (a !== 'tout-ouvrir' && a !== 'tout-fermer') return;
    for (const d of corps.querySelectorAll('details')) d.open = a === 'tout-ouvrir';
  });

  peindre('');
  poserRepli();

  // Les panneaux sont montés à des instants différents : on repeint quelques
  // fois pour que les entrées grisées redeviennent actives dès qu'elles
  // existent, au lieu de rester mortes jusqu'au rechargement.
  for (const delai of [800, 2000, 4000]) {
    setTimeout(() => peindre(hote.querySelector('[data-vl="q"]')?.value || ''), delai);
  }

  return {
    hote,
    languette,
    basculer,
    estReplie: () => replie,
    rafraichir: () => peindre(hote.querySelector('[data-vl="q"]')?.value || ''),
    catalogue: () => catalogue,
  };
}
