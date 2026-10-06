/**
 * WATCHTOWER — LE FIL DE CONTEXTE SE REGLE.
 *
 * Deux reproches precis ont ete faits au fil :
 *   1. il n'etait pas modifiable — on subissait les flux, leur ordre et leur
 *      volume ;
 *   2. il prenait tout l'ecran, alors qu'il ne doit s'etendre QUE sur un clic
 *      du bouton prevu pour ca.
 *
 * Ce module porte le reglage, et rien d'autre. Il est pur : aucun DOM, aucun
 * reseau, aucune cle. Le stockage lui est passe de l'exterieur, ce qui le
 * rend testable sans navigateur et evite qu'il echoue en mode prive.
 *
 * Principe de robustesse : des preferences enregistrees par une version
 * ANTERIEURE ne doivent jamais casser l'application ni faire disparaitre un
 * flux ajoute depuis. `normaliser` part donc toujours des valeurs par defaut
 * et n'accepte du stockage que ce qu'il reconnait.
 */

/** Cle de stockage. Versionnee : une refonte du format n'ecrase pas l'ancien. */
export const CLE_PREFERENCES_FIL = 'watchtower.fil.preferences.v1';

/**
 * Les flux que le fil peut diffuser.
 *
 *  · `reseau`   : faux si la reponse vient de la base embarquee. On le DIT.
 *  · `defaut`   : allume au premier lancement. On commence sobre : un fil qui
 *                 deverse tout des la premiere seconde est un fil qu'on coupe.
 *  · `gravite`  : importance de base, qui sert au tri « par importance ».
 */
export const FLUX_FIL = Object.freeze([
  {
    id: 'alertes', nom: 'Alertes et risques', ic: '⚠', source: 'Géorisques · Météo-France',
    reseau: true, defaut: true, gravite: 3,
    note: 'Vigilance et risques recenses autour du point regarde. Ce qu’on veut voir en premier.',
  },
  {
    id: 'seismes', nom: 'Séismes', ic: '🌋', source: 'USGS',
    reseau: true, defaut: true, gravite: 3,
    note: 'Secousses des 24 dernieres heures. Domaine public, sans cle.',
  },
  {
    id: 'meteo', nom: 'Conditions du moment', ic: '🌤', source: 'Open-Meteo',
    reseau: true, defaut: true, gravite: 1,
    note: 'Temperature, vent, qualite de l’air au point regarde. Sans cle.',
  },
  {
    id: 'presse', nom: 'Presse', ic: '📰', source: 'GDELT',
    reseau: true, defaut: true, gravite: 2,
    note: 'Articles des dernieres heures citant le lieu. Agrege automatiquement : a recouper.',
  },
  {
    id: 'communal', nom: 'Vie communale', ic: '🏛', source: 'Base locale · INSEE',
    reseau: false, defaut: true, gravite: 2,
    note: 'Population, gouvernance, equipements. Repond SANS reseau autour de Thau.',
  },
  {
    id: 'entreprises', nom: 'Entreprises', ic: '🏢', source: 'recherche-entreprises (DINUM)',
    reseau: true, defaut: false, gravite: 1,
    note: 'Etablissements autour du point. Bavard : eteint par defaut.',
  },
  {
    id: 'marches', nom: 'Marchés publics', ic: '📑', source: 'BOAMP',
    reseau: true, defaut: false, gravite: 1,
    note: 'Qui depense quoi sur le territoire, et pour quel projet.',
  },
  {
    id: 'associations', nom: 'Associations et clubs', ic: '🤝', source: 'RNA · base locale',
    reseau: false, defaut: false, gravite: 1,
    note: 'La vie locale au sens propre. Demande par l’utilisateur.',
  },
  {
    id: 'radio', nom: 'Radios locales', ic: '📻', source: 'Radio-Browser',
    reseau: true, defaut: false, gravite: 0,
    note: 'Stations emettant autour du point. Sans cle.',
  },
  {
    id: 'documents', nom: 'Documents et études', ic: '📄', source: 'HAL · Europe PMC · OpenAlex',
    reseau: true, defaut: false, gravite: 1,
    note: 'Travaux publies sur le lieu regarde, en texte integral quand il est libre.',
  },
]);

const PAR_ID = new Map(FLUX_FIL.map((f) => [f.id, f]));

/** Les tris proposes. L'ordre manuel est un quatrieme cas, traite a part. */
export const TRIS = Object.freeze(['importance', 'recent', 'source', 'manuel']);

/**
 * L'etat de depart. Volontairement sobre : cinq flux, douze depeches, et le
 * fil REPLIE — il ne s'etend que si on le lui demande.
 */
export function preferencesParDefaut() {
  return {
    actifs: FLUX_FIL.filter((f) => f.defaut).map((f) => f.id),
    ordre: FLUX_FIL.map((f) => f.id),
    tri: 'importance',
    limite: 12,
    graviteMin: 0,
    horsLigneSeulement: false,
    deplie: false,
  };
}

/** Borne un nombre, en retombant sur la valeur par defaut si l'entree est absurde. */
function nombre(valeur, min, max, defaut) {
  const n = Number(valeur);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Ramene n'importe quelle entree a des preferences utilisables.
 *
 * On part TOUJOURS des valeurs par defaut, et on ne retient du stockage que
 * ce qu'on reconnait. Un flux supprime d'une version a l'autre est ignore ;
 * un flux AJOUTE depuis apparait a sa place, au lieu de rester invisible
 * parce qu'un vieil enregistrement ne le mentionnait pas.
 *
 * @param {unknown} brut
 * @returns {object} des preferences toujours coherentes
 */
export function normaliserPreferences(brut) {
  const d = preferencesParDefaut();
  if (!brut || typeof brut !== 'object') return d;

  // Un tableau VIDE est une intention, pas une absence : l'utilisateur a le
  // droit de tout eteindre, et le rallumer dans son dos serait un bug — pas
  // une amabilite. Seule une valeur ABSENTE ou non tabulaire retombe sur les
  // defauts.
  const actifs = Array.isArray(brut.actifs)
    ? brut.actifs.filter((id) => PAR_ID.has(id))
    : d.actifs;

  // L'ordre enregistre d'abord, puis TOUT flux inconnu de l'enregistrement,
  // ajoute a la fin : c'est ce qui fait qu'un flux neuf n'est pas perdu.
  const ordreSauve = Array.isArray(brut.ordre) ? brut.ordre.filter((id) => PAR_ID.has(id)) : [];
  const ordre = [...new Set([...ordreSauve, ...d.ordre])];

  return {
    actifs: [...new Set(actifs)],
    ordre,
    tri: TRIS.includes(brut.tri) ? brut.tri : d.tri,
    limite: nombre(brut.limite, 3, 60, d.limite),
    graviteMin: nombre(brut.graviteMin, 0, 3, d.graviteMin),
    horsLigneSeulement: brut.horsLigneSeulement === true,
    deplie: brut.deplie === true,
  };
}

/**
 * Lit les preferences depuis un stockage fourni. Jamais d'exception : un
 * navigateur en navigation privee refuse l'acces, et ce n'est pas une raison
 * pour priver l'utilisateur de son fil.
 * @param {{getItem:Function}|null} stockage
 */
export function lirePreferences(stockage) {
  try {
    return normaliserPreferences(JSON.parse(stockage.getItem(CLE_PREFERENCES_FIL)));
  } catch {
    return preferencesParDefaut();
  }
}

/** Enregistre, et dit si ca a marche plutot que d'echouer en silence. */
export function ecrirePreferences(stockage, prefs) {
  try {
    stockage.setItem(CLE_PREFERENCES_FIL, JSON.stringify(normaliserPreferences(prefs)));
    return true;
  } catch {
    return false;
  }
}

/** Allume ou eteint un flux. Rend de NOUVELLES preferences, n'altere rien. */
export function basculerFlux(prefs, id) {
  const p = normaliserPreferences(prefs);
  if (!PAR_ID.has(id)) return p;
  const actifs = p.actifs.includes(id) ? p.actifs.filter((x) => x !== id) : [...p.actifs, id];
  // On autorise a tout eteindre : c'est un choix legitime, et la normalisation
  // ne doit pas le contredire en rallumant les defauts dans son dos.
  return { ...p, actifs };
}

/**
 * Deplace un flux dans l'ordre d'affichage. `delta` vaut -1 (vers le haut) ou
 * +1 (vers le bas). Aux extremites, ne fait rien — plutot que de boucler, ce
 * qui surprend toujours celui qui clique.
 */
export function deplacerFlux(prefs, id, delta) {
  const p = normaliserPreferences(prefs);
  const i = p.ordre.indexOf(id);
  const j = i + (delta < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= p.ordre.length) return p;
  const ordre = [...p.ordre];
  [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  return { ...p, ordre };
}

/** Les flux allumes, dans l'ordre choisi, avec leur description complete. */
export function fluxActifs(prefs) {
  const p = normaliserPreferences(prefs);
  return p.ordre.filter((id) => p.actifs.includes(id)).map((id) => PAR_ID.get(id));
}

/**
 * Vrai si le reglage courant oblige a aller sur le reseau. Sert a prevenir
 * AVANT de faire attendre — consigne : toujours dire quand une source externe
 * est necessaire.
 */
export function demandeLeReseau(prefs) {
  return fluxActifs(prefs).some((f) => f.reseau);
}

/**
 * Applique le reglage a une liste de depeches.
 *
 * Chaque depeche porte un `flux` (son identifiant d'origine). Une depeche
 * sans flux reconnu est GARDEE : perdre une information parce qu'elle n'est
 * pas etiquetee serait pire que d'en afficher une de trop.
 *
 * @param {object[]} depeches
 * @param {object} prefs
 * @returns {object[]}
 */
export function appliquerPreferences(depeches, prefs) {
  const p = normaliserPreferences(prefs);
  const actifs = new Set(p.actifs);
  const rang = new Map(p.ordre.map((id, i) => [id, i]));

  const retenues = (Array.isArray(depeches) ? depeches : []).filter((d) => {
    if (!d || !d.titre) return false;
    const f = PAR_ID.get(d.flux);
    if (f && !actifs.has(d.flux)) return false;
    if (p.horsLigneSeulement && f && f.reseau) return false;
    return Number(d.gravite || 0) >= p.graviteMin;
  });

  const par = {
    importance: (a, b) => (b.gravite || 0) - (a.gravite || 0) || (b.quand || 0) - (a.quand || 0),
    recent: (a, b) => (b.quand || 0) - (a.quand || 0),
    source: (a, b) => String(a.flux || '').localeCompare(String(b.flux || ''))
      || (b.gravite || 0) - (a.gravite || 0),
    // « manuel » suit l'ordre des flux fixe par l'utilisateur ; a flux egal,
    // c'est l'importance qui departage.
    manuel: (a, b) => (rang.get(a.flux) ?? 999) - (rang.get(b.flux) ?? 999)
      || (b.gravite || 0) - (a.gravite || 0),
  };

  return retenues.slice().sort(par[p.tri] || par.importance).slice(0, p.limite);
}

/**
 * Resume lisible du reglage, pour l'afficher a cote du bouton. Dire ce que le
 * fil diffuse evite d'avoir a ouvrir le panneau pour le savoir.
 */
export function resumePreferences(prefs) {
  const p = normaliserPreferences(prefs);
  const actifs = fluxActifs(p);
  if (!actifs.length) return 'Fil éteint — aucun flux sélectionné.';
  const reseau = demandeLeReseau(p) ? ' · réseau requis' : ' · hors ligne';
  return `${actifs.length} flux sur ${FLUX_FIL.length} · ${p.limite} dépêches max${reseau}`;
}
