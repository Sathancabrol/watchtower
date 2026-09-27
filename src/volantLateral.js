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
 * Fonctions qui n'existaient QUE sous forme de bouton flottant sur l'écran.
 * Elles doivent entrer dans le volant AVANT qu'on retire leur bouton, sinon
 * on les perdrait. Chacune agit par `action`, pas en ouvrant un panneau.
 */
export const ENTREES_SUPPLEMENTAIRES = Object.freeze([
  {
    id: 'carte-2d3d',
    categorie: 'vues',
    nom: 'Vue 2D / 3D',
    icone: '🗺',
    aide: 'Basculer entre la vue 3D avec relief et la vue 2D, plus légère',
    cheminAction: 'carte2d.basculer',
  },
  {
    id: 'plein-ecran',
    categorie: 'modes',
    nom: 'Plein écran',
    icone: '⛶',
    aide: 'Passer l’application en plein écran',
    cheminAction: 'pleinEcran',
  },
  {
    id: 'dock-bas',
    categorie: 'outils',
    nom: 'Barre voix & lieux',
    icone: '🎙',
    aide: 'Rappeler la barre du bas : micro, recherche de lieux, préréglages visuels',
    cheminAction: 'drapeau:wt-dock-bas-visible',
  },
  {
    id: 'couches-off',
    categorie: 'donnees',
    nom: 'Éteindre les calques',
    icone: '🧹',
    aide: 'Couper d’un coup toutes les couches de données affichées',
    cheminAction: 'clic:#clear-selected-layers',
  },
  {
    id: 'partager',
    categorie: 'outils',
    nom: 'Copier le lien de partage',
    icone: '🔗',
    aide: 'Copier un lien qui rouvre exactement cette vue',
    cheminAction: 'clic:#share-btn',
  },
  {
    id: 'globe-entier',
    categorie: 'nav',
    nom: 'Revenir au globe',
    icone: '🌍',
    aide: 'Replacer la caméra sur la Terre entière',
    cheminAction: 'clic:#reset-globe-view',
  },
  {
    id: 'rail-contexte',
    categorie: 'donnees',
    nom: 'Rail CONTEXT',
    icone: '📰',
    aide: 'Rappeler la colonne CONTEXT à droite (radio, dépêches, missions)',
    cheminAction: 'drapeau:wt-rail-visible',
  },
  {
    id: 'hud-coins',
    categorie: 'affichage',
    nom: 'HUD des coins',
    icone: '📐',
    aide: 'Coordonnées, MGRS, altitude et cap dans les quatre coins de l’écran',
    cheminAction: 'drapeau:wt-hud-coins-visible',
  },
  {
    id: 'cles-api',
    categorie: 'outils',
    nom: 'Clés d’API',
    icone: '🔑',
    aide: 'Panneau des clés facultatives — l’application marche sans',
    cheminAction: 'drapeau:wt-cles-visible',
  },
]);

/**
 * Boutons flottants retirés de l'écran une fois le volant monté.
 *
 * `couvertPar` liste les clés du catalogue qui reprennent leurs fonctions :
 * un test vérifie que chacune existe réellement. Tant qu'une fonction n'est
 * pas couverte, son bouton NE DOIT PAS être masqué.
 */
export const ELEMENTS_MASQUES = Object.freeze([
  {
    selecteur: '#wt-barre',
    raison: 'Barre de fonctions — intégralement reprise par le volant',
    couvertPar: ['cible:wt-intel', 'dock:cadastre', 'dock:soleil', 'cible:control-panel'],
  },
  {
    selecteur: '#wt-bascule2d',
    raison: 'Bouton Vue 2D/3D — repris dans la catégorie Vues',
    couvertPar: ['action:carte-2d3d'],
  },
  {
    selecteur: '#wt-bascule-minicarte',
    raison: 'Interrupteur minicarte — repris comme bascule d’affichage',
    couvertPar: ['bascule:minicarte'],
  },
  {
    selecteur: '#wt-volant',
    raison: 'Œil radial — doublon de l’œil du logo, ses bascules sont dans Affichage',
    couvertPar: ['bascule:minicarte'],
  },
  {
    selecteur: '#command-dock',
    raison: 'Barre du bas (lieux · voix · chat · préréglages) — rappelable depuis Outils',
    couvertPar: ['action:dock-bas', 'dock:lieux', 'dock:chat', 'cible:control-panel'],
  },
  {
    selecteur: '#top-center-actions',
    raison: 'Actions du haut — ses trois fonctions sont entrées une par une',
    couvertPar: ['action:couches-off', 'action:partager', 'action:globe-entier'],
  },
  {
    selecteur: '#right-context-rail',
    raison: 'Colonne CONTEXT à droite — rappelable depuis Données',
    couvertPar: ['action:rail-contexte'],
  },
  {
    selecteur: '#intel-hud',
    raison: 'HUD des quatre coins — rappelable depuis Affichage',
    couvertPar: ['action:hud-coins'],
  },
  {
    selecteur: '#key-setup-chip',
    raison: 'Pastille des clés d’API — le panneau reste ouvrable depuis Outils',
    couvertPar: ['action:cles-api'],
  },
  {
    // Bandeaux d'information pure : ils n'ouvrent rien et ne commandent rien.
    // Le style actif est deja lisible dans les prereglages visuels.
    selecteur: '#style-indicator, #traffic-sync-chip, #cctv-sync-chip',
    raison: 'Bandeaux d’état — aucune commande, rien à reprendre',
    // Seul cas ou `couvertPar` a le droit d'etre vide : l'element n'offre
    // AUCUNE action. Il faut le declarer explicitement, le garde-fou refuse
    // un masquage silencieux.
    sansFonction: true,
    couvertPar: [],
  },
]);

/**
 * Clé d'unicité d'une entrée : deux entrées qui ouvrent la même chose sont
 * la même fonction, quel que soit le registre d'origine.
 * @param {object} e
 * @returns {string}
 */
export function cleEntree(e) {
  if (!e) return '';
  if (e.type === 'bascule') return `bascule:${e.id}`;
  if (e.type === 'action') return `action:${e.id}`;
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

  // 4. Fonctions qui n'existaient que comme bouton flottant.
  for (const e of ENTREES_SUPPLEMENTAIRES) {
    poser(e.categorie, {
      type: 'action',
      id: e.id,
      nom: e.nom,
      icone: e.icone,
      aide: e.aide,
      cheminAction: e.cheminAction,
      source: 'supplement',
    });
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
  width: var(--wt-vl-largeur, 268px); display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(5,11,18,0.97), rgba(4,9,15,0.97));
  border-right: 1px solid rgba(0,212,255,0.28);
  font-family: var(--font-sans, system-ui, sans-serif); color: #e8eaed;
  transform: translateX(0); transition: transform .22s ease;
  box-shadow: 4px 0 24px rgba(0,0,0,0.45);
}
#wt-volant-lat.wt-vl-replie { transform: translateX(calc(-1 * var(--wt-vl-largeur, 268px))); }
/* MODE COMPACT : icônes seules, le volant se réduit à une colonne étroite. */
#wt-volant-lat.wt-vl-compact { --wt-vl-largeur: 62px; }
#wt-volant-lat.wt-vl-compact .vl-nom,
#wt-volant-lat.wt-vl-compact .vl-compte,
#wt-volant-lat.wt-vl-compact .vl-rech,
#wt-volant-lat.wt-vl-compact .vl-pied,
#wt-volant-lat.wt-vl-compact .vl-cat > summary span:nth-child(2),
#wt-volant-lat.wt-vl-compact .vl-cat > summary .vl-n { display: none; }
#wt-volant-lat.wt-vl-compact .vl-tete h2 { font-size: 0; }
#wt-volant-lat.wt-vl-compact .vl-tete h2::after { content: '▤'; font-size: 14px; }
#wt-volant-lat.wt-vl-compact .vl-tete { justify-content: center; padding: 10px 4px; }
#wt-volant-lat.wt-vl-compact .vl-cat > summary { justify-content: center; padding: 8px 2px; }
#wt-volant-lat.wt-vl-compact .vl-item { justify-content: center; padding: 6px 2px; }
#wt-volant-lat.wt-vl-compact .vl-corps { padding: 0 4px 12px; }
#wt-volant-lat.wt-vl-compact .vl-led { display: none; }
#wt-volant-lat.wt-vl-compact .vl-item[aria-pressed="true"] {
  background: rgba(0,212,255,0.28); border-color: #00d4ff;
}
/* POIGNÉE DE REDIMENSIONNEMENT — bord droit du volant. */
#wt-volant-lat .vl-poignee {
  position: absolute; top: 0; right: -3px; bottom: 0; width: 7px;
  cursor: col-resize; z-index: 2;
}
#wt-volant-lat .vl-poignee:hover { background: rgba(0,212,255,0.3); }
#wt-volant-lat .vl-reduire {
  flex: none; width: 24px; height: 24px; cursor: pointer; border-radius: 5px;
  color: #9fe9ff; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(0,212,255,0.28); font-size: 11px; line-height: 1;
}
#wt-volant-lat .vl-reduire:hover { background: rgba(0,212,255,0.22); }
/* Boutons flottants repris par le volant : masqués, pas supprimés. */
.wt-repris-par-volant { display: none !important; }
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
  left: calc(var(--wt-vl-largeur, 268px) + 24px) !important;
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
  position: fixed; left: var(--wt-vl-largeur, 268px); top: 50%; transform: translateY(-50%);
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
/** Clé de mémorisation de la largeur choisie. */
export const CLE_LARGEUR = 'wt-volant-lateral-largeur';
/** Clé de mémorisation du mode compact. */
export const CLE_COMPACT = 'wt-volant-lateral-compact';

/** Bornes de redimensionnement du volant, en pixels. */
export const LARGEUR_MIN = 150;
export const LARGEUR_MAX = 460;
export const LARGEUR_DEFAUT = 268;

/**
 * Contraint une largeur dans les bornes admises.
 * @param {number} px
 * @returns {number}
 */
export function largeurValide(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return LARGEUR_DEFAUT;
  return Math.round(Math.min(LARGEUR_MAX, Math.max(LARGEUR_MIN, n)));
}

/**
 * Ouvre une entrée « ouvrir » en réutilisant le dock existant.
 * @returns {boolean} vrai si quelque chose a répondu
 */
/**
 * Zones de l'ecran masquees par la feuille de styles, et le drapeau qui les
 * rend visibles. Ouvrir un panneau loge DANS l'une d'elles ne servirait a
 * rien tant que le parent est masque : le volant leve le drapeau en meme
 * temps. C'est le cas de CONTROL PANEL et de LOCATION, qui vivent dans la
 * barre du bas.
 */
export const ZONES_MASQUEES = Object.freeze([
  { hote: '#command-dock', drapeau: 'wt-dock-bas-visible' },
  { hote: '#right-context-rail', drapeau: 'wt-rail-visible' },
]);

/**
 * Leve le drapeau de la zone qui contient cet element, s'il y en a une.
 * @param {string} cibleId
 * @returns {string} le drapeau leve, ou '' si aucun n'etait necessaire
 */
export function decouvrirZone(cibleId, doc = globalThis.document) {
  const el = doc?.getElementById?.(cibleId);
  if (!el?.closest) return '';
  for (const z of ZONES_MASQUEES) {
    if (el.closest(z.hote)) {
      doc.body?.classList?.add?.(z.drapeau);
      return z.drapeau;
    }
  }
  return '';
}

export function ouvrirEntree(entree, hub = globalThis.__godsEyeView) {
  if (!entree) return false;
  if (entree.type === 'action') return lancerAction(entree, hub);
  // Un panneau loge dans une zone masquee doit d'abord redevenir visible,
  // sinon le volant l'ouvrirait dans le vide.
  if (entree.cible) decouvrirZone(entree.cible);
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
 * Exécute une entrée « action » en résolvant son chemin dans le hub.
 * `carte2d.basculer` → `hub.carte2d.basculer()`.
 * @returns {boolean} vrai si la fonction a été trouvée et appelée
 */
export function lancerAction(entree, hub = globalThis.__godsEyeView) {
  const chemin = String(entree?.cheminAction || '');
  if (!chemin) return false;
  // « drapeau:<classe> » — rend sa visibilite a un pan de l'interface masque
  // par la feuille de styles. L'element n'est jamais touche : on pose la
  // classe sur <body>, donc aucun noeud n'est recree et aucun ecouteur perdu.
  if (chemin.startsWith('drapeau:')) {
    const corps = globalThis.document?.body;
    if (!corps?.classList) return false;
    corps.classList.toggle(chemin.slice('drapeau:'.length));
    return true;
  }
  // « clic:<selecteur> » — rejoue le clic du bouton d'origine, masque mais
  // toujours dans la page. C'est SON gestionnaire qui s'execute : la fonction
  // est donc exactement celle d'avant, pas une reimplementation.
  if (chemin.startsWith('clic:')) {
    const el = globalThis.document?.querySelector?.(chemin.slice('clic:'.length));
    if (!el?.click) return false;
    el.click();
    return true;
  }
  if (chemin === 'pleinEcran') {
    const doc = globalThis.document;
    if (!doc?.documentElement?.requestFullscreen) return false;
    if (doc.fullscreenElement) doc.exitFullscreen?.();
    else doc.documentElement.requestFullscreen();
    return true;
  }
  let courant = hub;
  const morceaux = chemin.split('.');
  for (const m of morceaux.slice(0, -1)) {
    courant = courant?.[m];
    if (!courant) return false;
  }
  const fn = courant?.[morceaux.at(-1)];
  if (typeof fn !== 'function') return false;
  try {
    fn.call(courant);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retire de l'écran les boutons flottants désormais repris par le volant.
 * On MASQUE (display:none) : les nœuds survivent, donc les écouteurs posés
 * ailleurs restent valides et rien ne devient inatteignable par code.
 * @param {Document} doc
 * @returns {number} nombre d'éléments effectivement masqués
 */
export function masquerBoutonsFlottants(doc = globalThis.document) {
  if (!doc?.querySelectorAll) return 0;
  let n = 0;
  for (const m of ELEMENTS_MASQUES) {
    for (const el of doc.querySelectorAll(m.selecteur)) {
      el.classList?.add?.('wt-repris-par-volant');
      el.setAttribute?.('data-wt-repris', m.raison);
      n += 1;
    }
  }
  return n;
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
    <div class="vl-poignee" data-vl="poignee" title="Glisser pour redimensionner"></div>
    <div class="vl-tete">
      <h2>VOLANT</h2>
      <span class="vl-compte">${total} fonctions</span>
      <button type="button" class="vl-reduire" data-vl="compact" title="Réduire aux icônes seules">⇤</button>
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

  // ── largeur : mémorisée, ajustable à la souris ──
  const lire = (cle, repli) => {
    try {
      const st = options.stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
      const v = st?.getItem(cle);
      return v === null || v === undefined ? repli : v;
    } catch { return repli; }
  };
  const ecrire = (cle, v) => {
    try {
      const st = options.stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
      st?.setItem(cle, String(v));
    } catch { /* mode privé */ }
  };

  let largeur = largeurValide(lire(CLE_LARGEUR, LARGEUR_DEFAUT));
  let compact = lire(CLE_COMPACT, '0') === '1';

  const poserLargeur = () => {
    // En compact la largeur est imposée par la feuille de style.
    hote.style.setProperty('--wt-vl-largeur', compact ? '62px' : `${largeur}px`);
    doc.documentElement?.style?.setProperty?.('--wt-vl-largeur', compact ? '62px' : `${largeur}px`);
    hote.classList[compact ? 'add' : 'remove']('wt-vl-compact');
    const bouton = hote.querySelector('[data-vl="compact"]');
    if (bouton) {
      bouton.textContent = compact ? '⇥' : '⇤';
      bouton.title = compact ? 'Revenir au volant complet' : 'Réduire aux icônes seules';
    }
  };

  const definirLargeur = (px) => {
    largeur = largeurValide(px);
    ecrire(CLE_LARGEUR, largeur);
    poserLargeur();
    return largeur;
  };

  const basculerCompact = (force) => {
    compact = typeof force === 'boolean' ? force : !compact;
    ecrire(CLE_COMPACT, compact ? '1' : '0');
    poserLargeur();
    return compact;
  };

  hote.querySelector('[data-vl="compact"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    basculerCompact();
  });

  // glisser la poignée du bord droit
  const poignee = hote.querySelector('[data-vl="poignee"]');
  let glisse = null;
  poignee?.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    glisse = { x: ev.clientX, depart: compact ? 62 : largeur };
    doc.body.style.userSelect = 'none';
  });
  doc.addEventListener('mousemove', (ev) => {
    if (!glisse) return;
    const vise = glisse.depart + (ev.clientX - glisse.x);
    // tirer vers la gauche sous le seuil bascule en mode compact
    if (vise < LARGEUR_MIN - 20) { if (!compact) basculerCompact(true); return; }
    if (compact) basculerCompact(false);
    definirLargeur(vise);
  });
  doc.addEventListener('mouseup', () => {
    if (!glisse) return;
    glisse = null;
    doc.body.style.userSelect = '';
  });

  poserLargeur();

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

  // Les boutons flottants ne sont retirés qu'UNE FOIS le volant réellement
  // monté : si le montage échoue, ils restent en place et rien n'est perdu.
  const reprises = masquerBoutonsFlottants(doc);
  for (const delai of [900, 2500]) setTimeout(() => masquerBoutonsFlottants(doc), delai);

  return {
    hote,
    languette,
    basculer,
    definirLargeur,
    basculerCompact,
    largeur: () => (compact ? 62 : largeur),
    estCompact: () => compact,
    reprises,
    estReplie: () => replie,
    rafraichir: () => peindre(hote.querySelector('[data-vl="q"]')?.value || ''),
    catalogue: () => catalogue,
  };
}
