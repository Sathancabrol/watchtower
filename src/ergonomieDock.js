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
export const TITRE_OUTILS = 'OPTION';

/**
 * SOMMAIRE DU TIROIR « OPTION » — chantier A3 de la feuille de route :
 * « tous les boutons → un seul bouton ouvrant les autres en pop-up ».
 *
 * Chaque entrée OUVRE un panneau qui existe déjà ailleurs : on ne déplace ni
 * ne recrée rien, sinon les boutons du dock qui pointent vers ces mêmes
 * panneaux ouvriraient un tiroir fermé — donc du vide. C'est un SOMMAIRE,
 * pas un déménagement.
 *
 * `cible` = identifiant du panneau existant (`ouvrirExistant`),
 * `ancre`  = identifiant d'un panneau du dock (`ouvrir`).
 */
export const SOMMAIRE_OPTION = Object.freeze([
  { groupe: 'Réglages', entrees: [
    { ic: '🎛', nom: 'Paramètres', cible: 'param-slider-panel', info: 'Curseurs de paramètres' },
    { ic: '🎚', nom: 'Visuel +', cible: 'pp-toggles', info: 'Réglages visuels détaillés' },
    { ic: '🎨', nom: 'Filtres', ancre: 'filtres', info: 'Filtres de vue' },
  ] },
  { groupe: 'Calques', entrees: [
    { ic: '🗺', nom: 'Cadastre', ancre: 'cadastre', info: 'Parcelles et bâti cadastral' },
    { ic: '🏙', nom: 'Bâti 3D', ancre: 'bati', info: 'Bâtiments 3D OpenStreetMap' },
    { ic: '☀', nom: 'Soleil', ancre: 'soleil', info: 'Position du soleil et ombres portées' },
    { ic: '🕰', nom: 'Époques', ancre: 'temps', info: 'La ville à travers le temps' },
    { ic: '📷', nom: 'Caméras', ancre: 'cam', info: 'Caméras publiques gratuites' },
    { ic: '📻', nom: 'Radio', ancre: 'radio', info: 'Radios du monde' },
  ] },
  { groupe: 'Vues', entrees: [
    { ic: '🗺', nom: 'Minicarte', cible: 'wt-minimap', info: 'Minicarte globe et boussole' },
    { ic: '📌', nom: 'Épingles', cible: 'wt-pins', info: 'Mes épingles' },
    { ic: '🛣', nom: 'Rue', cible: 'wt-sv', info: 'Photos de rue libres' },
    { ic: '🖼', nom: 'Photo', cible: 'wt-photo', info: 'Identifier un lieu par photo' },
  ] },
  { groupe: 'Données', entrees: [
    { ic: '🧠', nom: 'Intel', cible: 'wt-intel', info: 'Tableau de bord expert et mode réunion' },
    { ic: '🏛', nom: 'Historique', ancre: 'histo', info: 'Événements historiques de la commune' },
    { ic: '🏗', nom: 'Chantier', ancre: 'chantier', info: 'Conduite de travaux' },
  ] },
  { groupe: 'Navigation', entrees: [
    { ic: '🧭', nom: 'Lieux', ancre: 'lieux', info: 'Recherche et mes lieux' },
    { ic: '⭐', nom: 'Favoris', ancre: 'favoris', info: 'Mes vues et domicile' },
    { ic: '📍', nom: 'Me localiser', ancre: 'moi', info: 'Ma position' },
    { ic: '✈', nom: 'Vol', ancre: 'vol', info: 'Mode pilotage drone / avion' },
  ] },
]);

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
  const source = doc?.getElementById?.('top-center-actions');
  if (!hote || !source) return 0;
  // Deja rapatrie.
  if (source.closest?.('#control-panel-popover')) return 0;
  // ON DEPLACE LE CONTENEUR ENTIER, PAS LES BOUTONS.
  // Tout l'habillage de ces icones est porte par des selecteurs
  // « #top-center-actions button » (style.css l.1884-1919). Sortir les boutons
  // du conteneur leur retire police, taille et couleur : ils paraissent casses.
  // En deplacant la nav elle-meme, les selecteurs continuent de s'appliquer.
  let zone = doc.getElementById('wt-outils-repris');
  if (!zone) {
    zone = doc.createElement('div');
    zone.id = 'wt-outils-repris';
    hote.appendChild(zone);
  }
  zone.appendChild(source);
  source.classList?.add?.('wt-dans-outils');
  return source.querySelectorAll ? source.querySelectorAll('button').length : 1;
}

/** Styles du bouton chat et de la zone des outils rapatriés. */
const CSS = `
#wt-outils-repris {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.12);
}
/* La nav est en position:fixed au milieu de l'ecran ; une fois dans le tiroir
   elle doit redevenir un simple bloc, sinon elle flotte encore par-dessus. */
#top-center-actions.wt-dans-outils {
  position: static; transform: none; top: auto; left: auto;
  z-index: auto; flex-wrap: wrap; gap: 8px;
}
#wt-option-sommaire { margin-top: 10px; }
#wt-option-sommaire .wt-og { margin-bottom: 9px; }
#wt-option-sommaire .wt-og > h5 {
  margin: 0 0 5px; font-size: 8px; letter-spacing: 2px; font-weight: 800;
  color: rgba(0,212,255,0.85); text-transform: uppercase;
}
#wt-option-sommaire .wt-og-liste { display: flex; flex-wrap: wrap; gap: 5px; }
#wt-option-sommaire button {
  display: inline-flex; align-items: center; gap: 5px;
  min-height: 30px; padding: 5px 9px; cursor: pointer;
  font-family: inherit; font-size: 10px; font-weight: 600; letter-spacing: 0.4px;
  color: #cfe9f5; border-radius: 7px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(0,212,255,0.28);
}
#wt-option-sommaire button:hover, #wt-option-sommaire button:focus-visible {
  background: rgba(0,212,255,0.2); border-color: #00d4ff; outline: none;
}
#wt-option-sommaire button[disabled] { opacity: 0.3; cursor: not-allowed; }
/* Le chat vit DANS la fenetre voice : plus de bouton flottant sous le dock. */
#voice-console #wt-chat-dock { margin-top: 8px; }
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
  // DEMANDE EXPLICITE : le chat doit etre INTEGRE a la fenetre voice, pas
  // pose en dessous. On l'insere donc comme dernier enfant de #voice-console.
  ancre.appendChild(b);
  return b;
}

/**
 * Ouvre l'entrée de sommaire demandée, en réutilisant le dock existant.
 * @param {object} entree
 * @returns {boolean} vrai si quelque chose a pu être ouvert
 */
export function ouvrirEntree(entree, hub = globalThis.__godsEyeView) {
  if (!entree) return false;
  const dock = hub?.dock;
  if (entree.ancre && dock?.ouvrir) return dock.ouvrir(entree.ancre) !== false;
  if (entree.cible && dock?.ouvrirExistant) return dock.ouvrirExistant(entree.cible) !== false;
  // Repli sans dock : on démasque le panneau à la main plutôt que de ne rien faire.
  const el = entree.cible ? globalThis.document?.getElementById?.(entree.cible) : null;
  if (el) {
    el.classList?.remove?.('wt-dock-cache', 'hidden');
    el.style.display = '';
    return true;
  }
  return false;
}

/**
 * Construit le sommaire « OPTION » dans le tiroir.
 *
 * Une entrée dont la cible n'existe pas dans cette session est affichée
 * DÉSACTIVÉE, avec la raison en infobulle : mieux vaut un bouton grisé et
 * explicite qu'un bouton qui ne fait rien.
 *
 * @param {Document} doc
 * @returns {number} nombre d'entrées actives
 */
export function construireSommaire(doc = globalThis.document) {
  const hote = doc?.querySelector?.('#control-panel-popover');
  if (!hote) return 0;
  let zone = doc.getElementById('wt-option-sommaire');
  if (zone) zone.innerHTML = '';
  else {
    zone = doc.createElement('div');
    zone.id = 'wt-option-sommaire';
    hote.appendChild(zone);
  }

  const hub = globalThis.__godsEyeView;
  let actives = 0;
  for (const groupe of SOMMAIRE_OPTION) {
    const g = doc.createElement('div');
    g.className = 'wt-og';
    const h = doc.createElement('h5');
    h.textContent = groupe.groupe;
    g.appendChild(h);
    const liste = doc.createElement('div');
    liste.className = 'wt-og-liste';

    for (const e of groupe.entrees) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.textContent = `${e.ic} ${e.nom}`;
      // Une ancre du dock n'a pas d'élément dans le DOM tant qu'elle n'est pas
      // ouverte : on ne peut vérifier l'existence que des cibles « existantes ».
      const absente = e.cible && !doc.getElementById(e.cible);
      if (absente) {
        b.disabled = true;
        b.title = `${e.info} — indisponible dans cette session (panneau « ${e.cible} » non monté)`;
      } else {
        b.title = e.info;
        actives += 1;
        b.addEventListener('click', () => {
          if (!ouvrirEntree(e, hub || globalThis.__godsEyeView)) {
            globalThis.__wtToast?.(`${e.nom} : panneau introuvable`);
          }
        });
      }
      liste.appendChild(b);
    }
    g.appendChild(liste);
    zone.appendChild(g);
  }
  return actives;
}

/**
 * Applique les corrections d'ergonomie.
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
    sommaire: construireSommaire(doc),
  };
}
