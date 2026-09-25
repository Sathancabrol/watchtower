/**
 * Dock — regroupement des boutons épars et accès au chat.
 *
 * Deux corrections d'ergonomie demandées :
 *
 *  1. **Tout sauf la voix et les préréglages doit rentrer dans les
 *     préréglages**, renommés « OUTILS ». Les boutons flottants du haut de
 *     l'écran (`#top-center-actions`) migrent donc dans le tiroir.
 *  2. **Une icône chat sous le bouton voix**, pour que la conversation écrite
 *     soit atteignable sans passer par la barre.
 *
 * RÈGLE : on **déplace** les nœuds, on n'en recrée aucun et on n'en supprime
 * aucun. Les écouteurs d'événements posés ailleurs (`share-btn`,
 * `reset-globe-view`, `clear-selected-layers`) restent donc attachés et
 * continuent de fonctionner — c'est la seule façon de ne perdre aucune
 * fonction. Si une cible manque, on s'abstient sans rien casser.
 *
 * @module ergonomieDock
 */

/** Libellé de remplacement du tiroir des préréglages. */
export const TITRE_OUTILS = 'OUTILS';

/** Boutons flottants à rapatrier dans le tiroir OUTILS. */
export const A_RAPATRIER = Object.freeze([
  'clear-selected-layers',
  'share-btn',
  'reset-globe-view',
]);

/**
 * Renomme le tiroir des préréglages visuels en « OUTILS ».
 * @param {Document} doc - Document hôte.
 * @returns {boolean} Vrai si le libellé a été posé.
 */
export function renommerEnOutils(doc) {
  const titre = doc?.querySelector?.('#control-panel .panel-title');
  if (!titre) return false;
  const icone = titre.querySelector('.dock-label-icon');
  titre.textContent = '';
  if (icone) titre.appendChild(icone);
  titre.appendChild(doc.createTextNode(TITRE_OUTILS));
  const bouton = doc.querySelector('#control-panel-toggle');
  if (bouton) bouton.setAttribute('aria-label', 'Ouvrir les outils');
  return true;
}

/**
 * Déplace les boutons flottants dans le tiroir OUTILS.
 * @param {Document} doc - Document hôte.
 * @returns {number} Nombre de boutons effectivement déplacés.
 */
export function rapatrierBoutons(doc) {
  const hote = doc?.querySelector?.('#control-panel-popover');
  if (!hote) return 0;
  let zone = doc.querySelector('#wt-outils-repris');
  if (!zone) {
    zone = doc.createElement('div');
    zone.id = 'wt-outils-repris';
    hote.appendChild(zone);
  }
  let n = 0;
  for (const id of A_RAPATRIER) {
    const b = doc.getElementById(id);
    // Deja deplace : on ne le compte pas deux fois.
    if (!b || b.closest?.('#wt-outils-repris')) continue;
    zone.appendChild(b);
    n += 1;
  }
  const source = doc.getElementById('top-center-actions');
  // La barre videe ne doit plus capter le pointeur au milieu de l'ecran.
  if (source && !source.querySelector('button')) source.style.display = 'none';
  return n;
}

/** Styles du bouton chat et de la zone des outils rapatriés. */
const CSS = `
#wt-outils-repris {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.12);
}
#wt-outils-repris > button {
  min-width: 38px; min-height: 38px; display: inline-flex;
  align-items: center; justify-content: center;
}
#wt-chat-dock {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; min-height: 34px; margin-top: 6px; padding: 6px 10px;
  cursor: pointer; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 2px; color: #7dd3c8; border-radius: 9px;
  background: rgba(120,200,190,0.12); border: 1px solid rgba(125,211,200,0.55);
}
#wt-chat-dock:hover, #wt-chat-dock:focus-visible {
  background: rgba(120,200,190,0.26); outline: none;
}`;

/**
 * Ajoute une icône chat **sous** le bloc voix.
 * Le clic réutilise le dock existant : aucune duplication de logique.
 * @param {Document} doc - Document hôte.
 * @param {Function} [surClic] - Action de repli si le dock est absent.
 * @returns {HTMLElement|null} Le bouton, ou null si le point d'ancrage manque.
 */
export function ajouterBoutonChat(doc, surClic) {
  if (!doc?.getElementById) return null;
  if (doc.getElementById('wt-chat-dock')) return doc.getElementById('wt-chat-dock');
  // Le bloc voix est injecte a l'execution : on tente plusieurs ancrages connus
  // avant d'abandonner, sinon le bouton disparaitrait selon l'ordre de montage.
  const ancre = doc.querySelector('#voice-console')
    || doc.querySelector('[data-dock-toggle-target="voice-console"]')?.closest('div')
    || doc.querySelector('#command-dock');
  if (!ancre) return null;
  const b = doc.createElement('button');
  b.id = 'wt-chat-dock';
  b.type = 'button';
  b.title = 'Ouvrir le chat écrit';
  b.setAttribute('aria-label', 'Ouvrir le chat');
  b.textContent = '💬 CHAT';
  b.addEventListener('click', () => {
    const hub = globalThis.__godsEyeView;
    if (hub?.dock?.ouvrir) hub.dock.ouvrir('chat');
    else if (typeof surClic === 'function') surClic();
  });
  if (ancre.id === 'voice-console') ancre.insertAdjacentElement('afterend', b);
  else ancre.appendChild(b);
  return b;
}

/**
 * Applique les deux corrections d'ergonomie.
 * @param {Document} [doc] - Document hôte.
 * @returns {{renomme:boolean, deplaces:number, chat:boolean}} Bilan.
 */
export function initErgonomieDock(doc = globalThis.document) {
  if (!doc?.querySelector) return { renomme: false, deplaces: 0, chat: false };
  if (!doc.getElementById('wt-ergonomie-css')) {
    const st = doc.createElement('style');
    st.id = 'wt-ergonomie-css';
    st.textContent = CSS;
    doc.head?.appendChild(st);
  }
  return {
    renomme: renommerEnOutils(doc),
    deplaces: rapatrierBoutons(doc),
    chat: Boolean(ajouterBoutonChat(doc)),
  };
}
