/**
 * WATCHTOWER — LES CALQUES : qui passe devant qui, une fois pour toutes.
 *
 * Chaque module posait son `z-index` a la main : 920 pour INTEL, 960 pour le
 * volant, 2650 pour une legende, 9998 pour la mascotte. Resultat, l'ordre
 * d'empilement etait le fruit du hasard — la vue INTEL passait SOUS le volant
 * et perdait sa colonne de gauche, des legendes flottaient par-dessus des
 * fenetres modales, et l'oeil de secours pouvait se faire recouvrir.
 *
 * Ce module est la SEULE source de verite de l'empilement. On ne choisit plus
 * un nombre, on choisit un ROLE : « c'est un panneau », « c'est une vue plein
 * cadre », « c'est une alerte ». Le nombre en decoule.
 *
 * Les paliers sont espaces de 500 : un module peut decaler de quelques unites
 * a l'interieur de son palier (une legende au-dessus de sa carte) sans jamais
 * depasser le palier suivant.
 *
 * PUR : aucune dependance, testable sous node.
 */

/**
 * Les paliers, du fond vers la surface. L'ordre du tableau FAIT foi : il se
 * lit comme la coupe de l'interface.
 */
export const CALQUES = Object.freeze([
  {
    cle: 'globe', z: 0,
    quoi: 'La vue 3D elle-meme et ce qui est dessine dessus.',
  },
  {
    cle: 'decor', z: 400,
    quoi: 'Reperes passifs qui n’attendent aucun clic : bandeaux d’etat, HUD des coins, boussole.',
  },
  {
    cle: 'ancre', z: 800,
    quoi: 'Petits elements colles a un bord : minicarte, pastilles, interrupteurs flottants.',
  },
  {
    cle: 'panneau', z: 1200,
    quoi: 'Panneaux de travail ancres a un bord, que l’on ouvre et referme.',
  },
  {
    cle: 'cadre', z: 2000,
    quoi: 'Vues plein cadre qui encadrent l’ecran : INTEL, HQ, graphe, reunion, vue communale.',
  },
  {
    cle: 'fenetre', z: 2600,
    quoi: 'Fenetres flottantes deplacables, posees PAR-DESSUS une vue plein cadre.',
  },
  {
    cle: 'volant', z: 3200,
    quoi: 'Le volant. Toujours au-dessus du contenu : c’est la surface de commande, '
      + 'elle ne doit jamais etre recouverte par ce qu’elle commande.',
  },
  {
    cle: 'modale', z: 4000,
    quoi: 'Boites de dialogue et fiches qui exigent une reponse — elles bloquent le reste.',
  },
  {
    cle: 'survol', z: 5000,
    quoi: 'Infobulles et menus contextuels : ephemeres, toujours lisibles.',
  },
  {
    cle: 'alerte', z: 6000,
    quoi: 'Messages fugaces et diagnostics : ils doivent percer meme une modale.',
  },
  {
    cle: 'secours', z: 9000,
    quoi: 'Ce qui ne doit JAMAIS etre recouvert : l’oeil du logo, les sorties de secours. '
      + 'Sans ce palier, un mode plein ecran pouvait enfermer l’utilisateur.',
  },
]);

/** Index par cle, construit une fois. */
const PAR_CLE = new Map(CALQUES.map((c) => [c.cle, c]));

/** Marge de manoeuvre a l'interieur d'un palier avant d'empieter sur le suivant. */
export const AMPLITUDE_PALIER = 400;

/**
 * Valeur de `z-index` d'un role, avec un decalage interne facultatif.
 *
 * @param {string} cle Role du calque, par exemple 'panneau' ou 'cadre'.
 * @param {number} [decalage] Ajustement a l'interieur du palier (0 a 399) —
 *   pour poser une legende juste au-dessus de la carte qu'elle explique.
 * @returns {number}
 * @throws {Error} si le role n'existe pas, ou si le decalage deborde : mieux
 *   vaut une erreur au developpement qu'un empilement faux a l'ecran.
 */
export function calque(cle, decalage = 0) {
  const c = PAR_CLE.get(cle);
  if (!c) {
    throw new Error(`calque inconnu : « ${cle} ». Roles possibles : ${[...PAR_CLE.keys()].join(', ')}`);
  }
  const d = Number(decalage) || 0;
  if (d < 0 || d >= AMPLITUDE_PALIER) {
    throw new Error(`decalage ${d} hors du palier « ${cle} » (0 a ${AMPLITUDE_PALIER - 1})`);
  }
  return c.z + d;
}

/**
 * Le role auquel appartient une valeur brute — sert a verifier du code
 * existant et a ecrire des messages d'audit lisibles.
 * @param {number} z
 * @returns {string} la cle du palier, ou '' si la valeur est hors echelle
 */
export function calqueDe(z) {
  const n = Number(z);
  if (!Number.isFinite(n)) return '';
  let trouve = '';
  for (const c of CALQUES) if (n >= c.z) trouve = c.cle;
  return trouve;
}

/**
 * Bloc de variables CSS a injecter une fois, pour que les feuilles de style
 * puissent ecrire `z-index: var(--wt-z-panneau)` au lieu d'un nombre nu.
 * @returns {string}
 */
export function variablesCss() {
  const lignes = CALQUES.map((c) => `  --wt-z-${c.cle}: ${c.z};`);
  return `:root {\n${lignes.join('\n')}\n}\n`;
}
