/**
 * 🎛 BARRE DES FONCTIONS — une seule ligne, toutes les fonctions.
 *
 * Répond à trois défauts signalés :
 *   1. les fonctions historiques (CONTEXTE, CCTV…) n'étaient plus atteignables ;
 *   2. il fallait un point d'accès unique, sur **une seule ligne** ;
 *   3. les cases devaient être **translucides** pour laisser voir les icônes.
 *
 * Placée **sous les boutons voix** (`#command-dock`), elle regroupe les fonctions
 * par catégorie, chaque catégorie dans un cadre nommé, tout sur la même ligne.
 *
 * ## Elle référence, elle ne remplace pas
 *
 * Chaque bouton délègue au module existant (dock, panneau DOM, ou fonction).
 * Aucune logique métier ici : si la barre disparaît, l'application reste entière.
 *
 * @module barreFonctions
 */

const STYLE_ID = 'wt-barre-fonctions-css';

const CSS = `
#wt-barre {
  position: fixed; left: 50%; transform: translateX(-50%);
  /* Hauteur reelle du dock, mesuree au runtime : une valeur en dur passait
     PAR-DESSUS les boutons voix et les masquait. */
  bottom: var(--wt-barre-bas, calc(2vh + 9rem)); z-index: 144;
  display: flex; gap: 6px; align-items: stretch;
  max-width: calc(100vw - 2rem); padding: 4px 6px;
  overflow-x: auto; overflow-y: visible;
  background: rgba(6, 14, 22, 0.55);
  border: 1px solid rgba(0, 212, 255, 0.22); border-radius: 8px;
  backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
  scrollbar-width: thin; scrollbar-color: rgba(0,212,255,.4) transparent;
}
#wt-barre::-webkit-scrollbar { height: 5px; }
#wt-barre::-webkit-scrollbar-thumb { background: rgba(0,212,255,.4); border-radius: 3px; }
#wt-barre.wt-cache { display: none; }

/* ── Fin de la redondance visuelle ──────────────────────────────────────
   Le rail du bas (prereglages TOUT / EXPLORER / VOL, puis les categories)
   proposait EXACTEMENT les memes fonctions que cette barre, en deux clics
   de plus. On masque le rail : ses boutons restent dans le DOM, donc
   dock.ouvrir() continue de fonctionner en les cliquant par programme.
   Rien n est supprime, seul l empilement visuel disparait.                */
#wt-dock .wt-dock-presets,
#wt-dock .wt-dock-categories,
#wt-dock .wt-dock-groupe { display: none !important; }
#wt-dock { background: none !important; padding: 0 !important; max-height: 0 !important; }

#wt-barre .wt-bf-cat {
  position: relative; display: flex; gap: 3px; align-items: center;
  padding: 12px 6px 4px; border-radius: 6px;
  border: 1px solid rgba(0, 212, 255, 0.20);
  background: rgba(0, 30, 46, 0.30);
  flex: 0 0 auto;
}
#wt-barre .wt-bf-cat > .wt-bf-nom {
  position: absolute; top: 1px; left: 7px;
  font: 700 8px/1 system-ui, sans-serif; letter-spacing: .1em;
  text-transform: uppercase; color: #6fc6e8; white-space: nowrap;
  pointer-events: none;
}
#wt-barre button.wt-bf-btn {
  position: relative; width: 30px; height: 30px; flex: 0 0 auto;
  display: grid; place-items: center; cursor: pointer;
  border-radius: 5px; font-size: 15px; line-height: 1;
  color: #d8f2ff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: background .14s ease, border-color .14s ease, transform .14s ease;
}
#wt-barre button.wt-bf-btn:hover {
  background: rgba(0, 212, 255, 0.22); border-color: rgba(0, 212, 255, 0.65);
  transform: translateY(-1px);
}
#wt-barre button.wt-bf-btn:focus-visible { outline: 2px solid #00d4ff; outline-offset: 1px; }
#wt-barre button.wt-bf-btn[aria-disabled="true"] { opacity: .35; cursor: not-allowed; }
#wt-barre button.wt-bf-btn .wt-bf-bulle {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  white-space: nowrap; pointer-events: none; opacity: 0;
  background: rgba(2, 10, 18, 0.96); color: #bfe9ff;
  border: 1px solid rgba(0, 212, 255, 0.35); border-radius: 4px;
  padding: 3px 7px; font: 600 10px/1 system-ui, sans-serif;
  transition: opacity .13s ease; z-index: 5;
}
#wt-barre button.wt-bf-btn:hover .wt-bf-bulle,
#wt-barre button.wt-bf-btn:focus-visible .wt-bf-bulle { opacity: 1; }

#wt-barre-poignee {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: var(--wt-barre-bas, calc(2vh + 9rem)); z-index: 145;
  padding: 2px 12px; border-radius: 0 0 6px 6px; cursor: pointer;
  background: rgba(6, 14, 22, 0.8); color: #7fe7ff;
  border: 1px solid rgba(0, 212, 255, 0.3); border-top: none;
  font: 700 9px/1.5 system-ui, sans-serif; letter-spacing: .1em;
}

`;

/**
 * Catégories et fonctions de la barre.
 *
 * `dock` → ouvre une ancre du dock ; `cible` → révèle un élément par son id ;
 * `action` → appelle une fonction. Le premier renseigné gagne.
 */
export const CATEGORIES = Object.freeze([
  Object.freeze({
    nom: 'Vues', entrees: Object.freeze([
      { icone: '🗺', info: 'Minicarte', cible: 'wt-minimap' },
      { icone: '🎨', info: 'Filtres de vue', dock: 'filtres' },
      { icone: '🏙', info: 'Bâti 3D', dock: 'bati' },
      { icone: '🔲', info: 'Cadrans', dock: 'cadrans' },
      { icone: '🕰', info: 'Époques', dock: 'temps' },
      { icone: '🎚', info: 'Visuel +', cible: 'pp-toggles' },
    ]),
  }),
  Object.freeze({
    nom: 'Données', entrees: Object.freeze([
      { icone: '🧠', info: 'Intel / Contexte', cible: 'wt-intel' },
      { icone: '📷', info: 'Caméras (CCTV)', dock: 'cam' },
      { icone: '🏛', info: 'Histoire locale', dock: 'histo' },
      { icone: '🏗', info: 'Chantier', dock: 'chantier' },
      { icone: '📻', info: 'Radio', dock: 'radio' },
      { icone: '🛣', info: 'Trajets', dock: 'trajets' },
      { icone: '🗺', info: 'Cadastre', dock: 'cadastre' },
      { icone: '✈', info: 'Entités mobiles', dock: 'entites' },
      { icone: '📡', info: 'Dispositifs', dock: 'dispositifs' },
    ]),
  }),
  Object.freeze({
    nom: 'Navigation', entrees: Object.freeze([
      { icone: '📍', info: 'Me localiser', dock: 'moi' },
      { icone: '🧭', info: 'Lieux', dock: 'lieux' },
      { icone: '⭐', info: 'Favoris', dock: 'favoris' },
      { icone: '📌', info: 'Épingles', cible: 'wt-pins' },
      { icone: '🏰', info: 'HQ', dock: 'hq' },
    ]),
  }),
  Object.freeze({
    nom: 'Modes', entrees: Object.freeze([
      { icone: '✈', info: 'Mode vol', dock: 'vol' },
      { icone: '🪐', info: 'Système solaire', dock: 'systeme' },
      { icone: '💬', info: 'Chat / commandes', dock: 'chat' },
      { icone: '🎛', info: 'Paramètres', cible: 'param-slider-panel' },
    ]),
  }),
]);

/**
 * Révèle un panneau déjà présent dans le DOM.
 * Retire les classes de masquage connues et le remonte au premier plan.
 * @param {string} id - Identifiant de l'élément.
 * @param {Document} doc - Document hôte.
 * @returns {boolean} Vrai si l'élément a été trouvé.
 */
export function revelerPanneau(id, doc) {
  const n = doc?.getElementById(id);
  if (!n) return false;
  n.classList.remove('wt-dock-cache', 'hidden', 'collapsed');
  n.removeAttribute('hidden');
  n.style.display = '';
  n.style.visibility = '';
  return true;
}

/**
 * Installe la barre des fonctions.
 * @param {{dock?:object, document?:Document, surMessage?:function}} [options]
 * @returns {{afficher:function, masquer:function, basculer:function, detruire:function}}
 */
export function initBarreFonctions({ dock, document: doc = globalThis.document, surMessage } = {}) {
  if (!doc?.body) {
    return { afficher() {}, masquer() {}, basculer() {}, detruire() {} };
  }
  if (!doc.getElementById(STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    doc.head.appendChild(st);
  }

  const barre = doc.createElement('div');
  barre.id = 'wt-barre';
  barre.setAttribute('role', 'toolbar');
  barre.setAttribute('aria-label', 'Toutes les fonctions de l’application');

  for (const cat of CATEGORIES) {
    const bloc = doc.createElement('div');
    bloc.className = 'wt-bf-cat';
    const nom = doc.createElement('span');
    nom.className = 'wt-bf-nom';
    nom.textContent = cat.nom;
    bloc.appendChild(nom);

    for (const e of cat.entrees) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'wt-bf-btn';
      b.setAttribute('aria-label', e.info);
      b.innerHTML = `${e.icone}<span class="wt-bf-bulle">${e.info}</span>`;
      b.addEventListener('click', () => {
        // Ordre volontaire : le dock sait rouvrir proprement, on l'essaie d'abord.
        if (e.dock && dock?.ouvrir) { dock.ouvrir(e.dock); return; }
        if (e.cible) {
          if (dock?.ouvrirExistant?.(e.cible)) return;
          if (revelerPanneau(e.cible, doc)) return;
        }
        if (typeof e.action === 'function') { e.action(); return; }
        surMessage?.(`« ${e.info} » n’est pas disponible pour le moment.`);
      });
      bloc.appendChild(b);
    }
    barre.appendChild(bloc);
  }
  doc.body.appendChild(barre);

  const poignee = doc.createElement('button');
  poignee.id = 'wt-barre-poignee';
  poignee.type = 'button';
  poignee.textContent = '▼ FONCTIONS';
  poignee.title = 'Afficher ou masquer la barre des fonctions';
  doc.body.appendChild(poignee);

  /**
   * Mesure le dock et pose la barre JUSTE AU-DESSUS de lui.
   *
   * Une marge en dur ne peut pas marcher : le dock change de hauteur selon le
   * prereglage et le repli du panneau. On lit donc sa position reelle.
   */
  const MARGE = 8;
  const mesurerDock = () => {
    const d = doc.getElementById('command-dock');
    if (!d) return null;
    const r = d.getBoundingClientRect?.();
    if (!r || !r.height) return null;
    const vh = globalThis.innerHeight || 0;
    if (!vh) return null;
    // distance entre le bas de l ecran et le HAUT du dock
    return Math.max(0, Math.round(vh - r.top));
  };

  /** Place la barre au-dessus du dock, puis la poignee au-dessus de la barre. */
  const placerPoignee = () => {
    const cache = barre.classList.contains('wt-cache');
    poignee.textContent = cache ? '▲ FONCTIONS' : '▼ FONCTIONS';

    const bas = mesurerDock();
    const socle = bas === null ? null : `${bas + MARGE}px`;
    if (socle) doc.documentElement?.style?.setProperty('--wt-barre-bas', socle);

    const h = cache ? 0 : barre.offsetHeight;
    poignee.style.bottom = socle
      ? `calc(${socle} + ${h}px)`
      : `calc(2vh + 9rem + ${h}px)`;
  };

  const afficher = () => { barre.classList.remove('wt-cache'); placerPoignee(); };
  const masquer = () => { barre.classList.add('wt-cache'); placerPoignee(); };
  const basculer = () => (barre.classList.contains('wt-cache') ? afficher() : masquer());

  poignee.addEventListener('click', basculer);
  placerPoignee();
  globalThis.addEventListener?.('resize', placerPoignee);

  // Le dock change de hauteur (prereglage, repli) sans evenement dedie :
  // on observe sa taille pour que la barre ne le recouvre jamais.
  let obs = null;
  const cible = doc.getElementById('command-dock');
  if (cible && typeof globalThis.ResizeObserver === 'function') {
    obs = new globalThis.ResizeObserver(() => placerPoignee());
    obs.observe(cible);
  }
  // Filet : quelques repositionnements apres le demarrage, le temps que les
  // modules injectent leurs boutons (la voix arrive tard).
  for (const t of [300, 900, 2000]) setTimeout(placerPoignee, t);

  return {
    afficher,
    masquer,
    basculer,
    replacer: placerPoignee,
    detruire() { obs?.disconnect?.(); barre.remove(); poignee.remove(); },
  };
}
