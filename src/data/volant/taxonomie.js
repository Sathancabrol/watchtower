/**
 * WATCHTOWER — TAXONOMIE DU VOLANT : ou va chaque fonction, et comment elle
 * s'appelle.
 *
 * Le volant heritait des categories des trois registres qu'il agrege, et
 * elles se recouvraient : « Affichage » et « Vues » voulaient dire la meme
 * chose, « Modes » melangeait le mode vol et le systeme solaire, et la meme
 * fonction apparaissait deux fois sous deux noms. D'ou une interface ou l'on
 * cherche au lieu de trouver.
 *
 * Les categories ci-dessous se lisent comme des INTENTIONS, pas comme des
 * origines techniques : « je veux changer la carte », « je veux poser une
 * couche de donnees », « je veux aller quelque part », « je veux comprendre »,
 * « je veux regler ce qui s'affiche », « je veux parametrer ».
 *
 * Deux garde-fous, verifies par les tests :
 *  · CHAQUE entree du catalogue doit etre rangee ici — rien ne tombe dans un
 *    fourre-tout ;
 *  · une entree absorbee comme doublon doit designer celle qui la remplace.
 *
 * PUR : aucune dependance, testable sous node.
 */

/** Les six intentions, dans l'ordre d'affichage du volant. */
export const CATEGORIES = Object.freeze([
  {
    id: 'carte', nom: 'Carte', icone: '🗺',
    aide: 'Comment le sol est dessine : fond, relief, batiments, epoques, lumiere.',
  },
  {
    id: 'couches', nom: 'Couches', icone: '📡',
    aide: 'Ce que l’on pose SUR la carte : cameras, mobiles, reseaux, chantiers.',
  },
  {
    id: 'aller', nom: 'Aller', icone: '🧭',
    aide: 'Se deplacer et retrouver un lieu.',
  },
  {
    id: 'analyser', nom: 'Analyser', icone: '🔎',
    aide: 'Lire et comprendre le territoire affiche.',
  },
  {
    id: 'ecran', nom: 'Écran', icone: '🖥',
    aide: 'Ce qui s’affiche PAR-DESSUS la vue, et que l’on peut eteindre.',
  },
  {
    id: 'reglages', nom: 'Réglages', icone: '⚙',
    aide: 'Parametres, partage, utilitaires.',
  },
]);

/**
 * Rangement explicite de chaque cle du catalogue.
 *
 * REGLE DE PARTAGE entre Carte et Couches, parce que c'est la ou l'on hesite :
 * va dans CARTE ce qui redessine LE SOL lui-meme (fond, relief, bati,
 * cadastre, epoques, lumiere) ; va dans COUCHES ce qui se POSE dessus et que
 * l'on pourrait retirer sans changer le terrain (cameras, mobiles, radio,
 * trajets, chantiers).
 */
export const RANGEMENT = Object.freeze({
  // ── CARTE : le sol lui-meme ────────────────────────────────────────────
  'action:carte-2d3d': 'carte',
  'dock:filtres': 'carte',
  'dock:bati': 'carte',
  'dock:cadastre': 'carte',
  'dock:temps': 'carte',
  'dock:soleil': 'carte',
  'cible:pp-toggles': 'carte',
  // ── COUCHES : ce qui se pose dessus ────────────────────────────────────
  'dock:cam': 'couches',
  'dock:radio': 'couches',
  'dock:trajets': 'couches',
  'dock:entites': 'couches',
  'dock:dispositifs': 'couches',
  'dock:chantier': 'couches',
  'action:couches-off': 'couches',
  // ── ALLER : se deplacer ────────────────────────────────────────────────
  'dock:lieux': 'aller',
  'dock:favoris': 'aller',
  'dock:moi': 'aller',
  'cible:wt-panel': 'aller',
  'cible:wt-pins': 'aller',
  'dock:hq': 'aller',
  'action:globe-entier': 'aller',
  'dock:vol': 'aller',
  'dock:systeme': 'aller',
  // ── ANALYSER : comprendre ──────────────────────────────────────────────
  'dock:docs': 'analyser',
  'cible:wt-intel': 'analyser',
  'action:rail-contexte': 'analyser',
  'dock:cadrans': 'analyser',
  'dock:histo': 'analyser',
  'bascule:fil-info': 'analyser',
  'cible:wt-sv': 'analyser',
  'cible:wt-photo': 'analyser',
  'dock:chat': 'analyser',
  // ── ÉCRAN : le chrome, que l'on eteint ─────────────────────────────────
  'bascule:minicarte': 'ecran',
  'bascule:titre': 'ecran',
  'bascule:medaillons': 'ecran',
  'bascule:anneau-celeste': 'ecran',
  'action:hud-coins': 'ecran',
  'action:dock-bas': 'ecran',
  'action:plein-ecran': 'ecran',
  // ── RÉGLAGES ───────────────────────────────────────────────────────────
  'cible:control-panel': 'reglages',
  'cible:param-slider-panel': 'reglages',
  'action:partager': 'reglages',
  'action:cles-api': 'reglages',
});

/**
 * Doublons : deux cles differentes qui, pour l'utilisateur, font la MEME
 * chose. On n'en garde qu'une — celle de droite — et la ligne dit laquelle,
 * pour qu'aucune fonction ne disparaisse par inadvertance.
 *
 * Les bascules sont preferees aux ouvertures : elles portent un temoin
 * allume/eteint, donc elles informent en plus d'agir.
 */
export const ABSORBES = Object.freeze({
  'cible:wt-minimap': 'bascule:minicarte',
  'bascule:cadrans': 'dock:cadrans',
  'bascule:entites': 'dock:entites',
  'bascule:dispositifs': 'dock:dispositifs',
});

/**
 * Renommages : des intitules qui disent ce que la fonction FAIT, dans la
 * meme langue et sur le meme registre que les autres.
 *
 * « OPTION — toutes les fonctions (paramètres, calques, vues) » etait un
 * resume de menu, pas un nom de commande.
 */
export const RENOMMAGES = Object.freeze({
  'cible:control-panel': 'Panneau de réglages complet',
  'cible:param-slider-panel': 'Réglages détaillés',
  'cible:pp-toggles': 'Effets visuels',
  'dock:filtres': 'Filtres de rendu',
  'dock:bati': 'Bâtiments 3D',
  'dock:soleil': 'Soleil, ombres et horaires',
  'dock:cam': 'Caméras de rue',
  'dock:cadrans': 'Cadrans de la commune',
  'dock:histo': 'Histoire locale',
  'dock:docs': 'Documents — texte intégral',
  'dock:hq': 'Quartier général',
  'dock:chat': 'Chat et commandes',
  'dock:entites': 'Entités mobiles',
  'dock:dispositifs': 'Dispositifs au sol',
  'cible:wt-intel': 'INTEL — contexte du territoire',
  'cible:wt-panel': 'Autour de moi',
  'cible:wt-photo': 'Recherche par photo',
  'bascule:medaillons': 'Pastilles pays et commune',
  'bascule:anneau-celeste': 'Anneau du ciel',
  'bascule:titre': 'Titre WATCHTOWER',
  'action:carte-2d3d': 'Basculer 2D / 3D',
  'action:couches-off': 'Éteindre toutes les couches',
  'action:hud-coins': 'Repères dans les coins',
  'action:rail-contexte': 'Colonne CONTEXT',
  'action:dock-bas': 'Barre du bas — micro et lieux',
  'action:partager': 'Copier le lien de la vue',
  'action:cles-api': 'Clés d’API (facultatif)',
  'action:globe-entier': 'Revenir au globe',
});

/**
 * Categorie d'une cle.
 * @param {string} cle
 * @returns {string} l'identifiant de categorie, ou '' si la cle n'est pas rangee
 */
export function categorieDe(cle) {
  return RANGEMENT[cle] || '';
}

/**
 * Nom d'affichage d'une entree : le renommage s'il existe, sinon le nom
 * d'origine.
 * @param {string} cle
 * @param {string} nomOrigine
 * @returns {string}
 */
export function nomDe(cle, nomOrigine) {
  return RENOMMAGES[cle] || nomOrigine;
}

/**
 * Vrai si la cle est un doublon absorbe par une autre.
 * @param {string} cle
 * @returns {boolean}
 */
export function estAbsorbe(cle) {
  return Object.hasOwn(ABSORBES, cle);
}
