/**
 * WATCHTOWER — CATALOGUE DU HUD (données pures, testables sans navigateur).
 *
 * Pourquoi : l'interface est faite de dizaines de blocs (barres, panneaux,
 * fenêtres) éparpillés dans le DOM, et plusieurs mécanismes peuvent les
 * masquer (vue propre « clean view », HUD tactique, veille, réduction auto,
 * mode vol…). Quand un bloc disparaît, l'utilisateur n'a aucun moyen de
 * savoir qu'il existe encore moins de le faire revenir.
 *
 * Ce module donne un NOM FRANÇAIS et une CATÉGORIE à chaque identifiant
 * d'interface, et range le tout dans un ordre stable. Le module DOM
 * (`hudCentral.js`) se contente ensuite de cocher / décocher.
 */

/** Catégories, dans l'ordre d'affichage. */
export const CATEGORIES = [
  { id: 'barres', nom: 'BARRES & BOUTONS' },
  { id: 'vues', nom: 'VUES & CARTES' },
  { id: 'donnees', nom: 'DONNÉES & DOSSIERS' },
  { id: 'outils', nom: 'OUTILS' },
  { id: 'modes', nom: 'MODES D’ÉCRAN' },
  { id: 'divers', nom: 'AUTRES' },
];

/**
 * Noms connus : identifiant → [nom français, catégorie, icône].
 * Ce qui n'est pas listé ici est quand même proposé, avec un nom fabriqué
 * (« wt-machin » → « Wt machin ») : mieux vaut un libellé brut qu'un
 * bouton introuvable.
 */
export const NOMS = {
  'title-bar': ['Titre WATCHTOWER — l’œil en haut à gauche', 'barres', '👁'],
  'wt-dock': ['Barre du bas — TOUS les boutons', 'barres', '🎛'],
  'command-dock': ['Barre micro & commandes vocales', 'barres', '🎙'],
  'top-center-actions': ['Boutons du haut (calques, partage, globe)', 'barres', '🧭'],
  'view-switcher': ['Sélecteur de vue (sol / drone / cockpit)', 'barres', '🎥'],
  'style-indicator': ['Indicateur de style visuel', 'barres', '🎨'],
  'location-bar': ['Barre de localisation', 'barres', '📍'],
  'wt-panel': ['Panneau HQ / CONTEXTE', 'vues', '🏛'],
  'wt-intel': ['INTEL — tableau de bord expert', 'donnees', '🧠'],
  'intel-hud': ['HUD Intel (bandeau)', 'donnees', '🧠'],
  'wt-fiche': ['Fiche lieu', 'donnees', '📄'],
  'wt-minimap': ['Minicarte', 'vues', '🗺'],
  'wt-cadrans': ['Cadrans de la commune', 'vues', '🔲'],
  'wt-entites': ['Entités de la carte', 'donnees', '🏷'],
  'wt-ville': ['Fenêtre du lieu central', 'vues', '🏙'],
  'wt-sv': ['Street view (photos de rue)', 'vues', '🛣'],
  'wt-pins': ['Épingles', 'outils', '📌'],
  'wt-photo': ['Identifier un lieu par photo', 'outils', '🖼'],
  'pp-toggles': ['Réglages visuels +', 'outils', '🎚'],
  'param-slider-panel': ['Curseurs de paramètres', 'outils', '🎛'],
  'control-panel': ['Panneau de contrôle (caméra, styles)', 'outils', '🎮'],
  'data-panel': ['Couches de données', 'donnees', '🗂'],
  'cctv-panel': ['Caméras / CCTV', 'donnees', '📷'],
  'scene-panel': ['Scènes & enregistrement', 'outils', '🎬'],
  'radio-panel': ['Radio', 'outils', '📻'],
  'left-panel-stack': ['Colonne de gauche', 'vues', '📋'],
  'right-context-rail': ['Colonne de droite (contexte)', 'vues', '📋'],
  'hud': ['HUD tactique (touche H)', 'modes', '🎯'],
  'cockpit-hud': ['HUD cockpit (visière)', 'modes', '🪖'],
  'safe-frame-overlay': ['Cadre de cadrage (enregistrement)', 'outils', '🖼'],
  'first-run-launcher': ['Écran de bienvenue', 'divers', '👋'],
  'key-setup-chip': ['Configuration des clés', 'divers', '🔑'],
  'toast': ['Messages (toasts)', 'divers', '💬'],
  'traffic-sync-chip': ['Indicateur trafic', 'divers', '🚗'],
  'cctv-sync-chip': ['Indicateur caméras', 'divers', '📷'],
  'global-loading-status': ['Indicateur de chargement', 'divers', '⏳'],
  'wt-mg-hud': ['HUD compact mobiGlas (vol)', 'modes', '🕶'],
  'wt-cockpit': ['Cockpit de vol (horizon, instruments)', 'modes', '🎛'],
  'wt-boussole': ['Boussole', 'vues', '🧭'],
  'wt-vol-barre': ['Barre de pilotage (décoller / atterrir)', 'modes', '✈'],
  'wt-vol-stick': ['Joystick souris', 'modes', '🕹'],
  'wt-pin-btn': ['Bouton épingle', 'outils', '📌'],
  'wt-moi': ['Panneau MA LOCALISATION', 'vues', '📍'],
  'wt-radio': ['Radio', 'outils', '📻'],
  'wt-mascotte': ['Mascotte', 'divers', '🐦'],
  'wt-urgence-bandeau': ['Bandeau d’urgence', 'divers', '🚨'],
  'wt-loc-station': ['Station de localisation', 'barres', '📡'],
  'wt-boussole': ['Boussole (ruban de cap sur la hauteur)', 'modes', '🧭'],
};

/** Éléments qu'on ne propose jamais de masquer (la carte, le panneau lui-même). */
export const PROTEGES = ['cesiumContainer', 'wt-hud-central', 'wt-hud-oeil', 'world-overlay-root'];

/** Préréglages : ce qui reste affiché. */
export const PRESETS = {
  complet: { nom: 'TOUT AFFICHER', garder: null },
  epure: {
    nom: 'MODE ÉPURÉ',
    garder: ['title-bar', 'wt-dock', 'command-dock', 'wt-minimap', 'toast'],
  },
  vol: {
    nom: 'MODE VOL',
    garder: ['wt-dock', 'command-dock', 'wt-minimap', 'wt-panel', 'toast', 'title-bar'],
  },
  lecture: {
    nom: 'MODE LECTURE',
    garder: ['title-bar', 'wt-dock', 'toast', 'wt-fiche'],
  },
};

const sansAccent = (t) => String(t ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '');

/** Libellé fabriqué quand l'identifiant est inconnu : « wt-machin » → « Wt machin ». */
export function fabriquerNom(id) {
  const propre = String(id || '').replace(/^#/, '').replace(/[-_]+/g, ' ').trim();
  if (!propre) return 'élément sans nom';
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}

/** Description complète d'un identifiant d'interface. */
export function decrire(id) {
  const cle = String(id || '').replace(/^#/, '');
  const connu = Object.prototype.hasOwnProperty.call(NOMS, cle);
  const [nom, categorie, icone] = connu ? NOMS[cle] : [fabriquerNom(cle), 'divers', '▫'];
  return { id: cle, nom, categorie, icone, connu };
}

/**
 * Construit la liste à afficher.
 * @param {Array<string>} ids identifiants découverts dans le DOM.
 * @param {{visibles?:Set<string>|string[]}} [options]
 * @returns {Array<{id,nom,categorie,icone,connu,visible:boolean}>}
 */
export function cataloguer(ids, options = {}) {
  const cache = options.visibles ? new Set(options.visibles) : new Set();
  return (ids || [])
    .map((i) => decrire(i))
    .filter((i) => i.id && !PROTEGES.includes(i.id))
    .map((i) => ({ ...i, visible: cache.has(i.id) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Regroupe par catégorie, dans l'ordre de `CATEGORIES` (vides ignorées). */
export function grouper(items) {
  return CATEGORIES
    .map((c) => ({ ...c, items: (items || []).filter((i) => i.categorie === c.id) }))
    .filter((g) => g.items.length);
}

/** Recherche insensible à la casse et aux accents (nom + identifiant). */
export function filtrer(items, texte) {
  const q = sansAccent(texte).trim();
  if (!q) return items || [];
  return (items || []).filter((i) => sansAccent(i.nom).includes(q) || sansAccent(i.id).includes(q));
}

/** « 12 affichés / 30 éléments ». */
export function resumer(items) {
  const total = (items || []).length;
  const visibles = (items || []).filter((i) => i.visible).length;
  return `${visibles} affiché${visibles > 1 ? 's' : ''} / ${total} élément${total > 1 ? 's' : ''}`;
}

/**
 * Applique un préréglage : renvoie une nouvelle liste avec `visible` à jour.
 * @param {Array<object>} items
 * @param {'complet'|'epure'|'vol'|'lecture'} nom
 */
export function appliquerPreset(items, nom) {
  const preset = PRESETS[nom] || PRESETS.complet;
  const garder = preset.garder ? new Set(preset.garder) : null;
  return (items || []).map((i) => ({ ...i, visible: garder ? garder.has(i.id) : true }));
}
