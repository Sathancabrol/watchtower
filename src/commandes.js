/**
 * WATCHTOWER — REGISTRE DE COMMANDES & RÉPONSES RAPIDES DU CHAT.
 *
 * Le chat ne doit pas obliger à deviner : il **propose** des réponses rapides
 * selon ce qu'il sait faire *ici et maintenant* (on vole ? une commune est
 * analysée ? la nuit ?). Une pastille = une phrase envoyée au chat.
 *
 * Les commandes sont décrites une seule fois (cette table) : l'aide, les
 * réponses rapides et l'exécution s'en déduisent — impossible d'annoncer une
 * commande qui n'existe pas.
 *
 * Module pur : aucune dépendance au DOM ni à Cesium.
 */

/** Catégories d'affichage des pastilles. */
export const GROUPES = Object.freeze({
  urgence: { nom: 'URGENCE', ic: '🚨' },
  regard: { nom: 'REGARD', ic: '👁' },
  lieu: { nom: 'LIEU', ic: '📍' },
  donnees: { nom: 'DONNÉES', ic: '📊' },
  calques: { nom: 'CALQUES', ic: '🎛' },
  systeme: { nom: 'SYSTÈME', ic: '⚙' },
});

/**
 * Table des commandes. `motifs` sont testés sur le texte normalisé (sans
 * accents, minuscules, slash de tête accepté).
 */
export const COMMANDES = Object.freeze([
  {
    id: 'aide', titre: 'Aide', ic: '❓', groupe: 'systeme',
    motifs: ['aide', 'help', '?', 'commandes'],
    aide: 'liste toutes les commandes disponibles',
  },
  {
    id: 'urgence', titre: 'Urgence', ic: '🚨', groupe: 'urgence',
    motifs: ['urgence', '/urgence', 'secours', 'sos', 'au secours', 'aidez-moi', 'aide moi'],
    aide: 'MODE URGENCE : temps gelé, mascotte, procédure pas à pas, itinéraire le plus rapide',
    argument: true, // « /urgence incendie », « /urgence malaise »…
  },
  {
    id: 'meteo', titre: 'Météo', ic: '🌦', groupe: 'donnees',
    motifs: ['meteo', 'météo', 'temps', 'vent', 'prevision', 'prévision'],
    aide: 'conditions réelles au point visé (Open-Meteo)',
  },
  {
    id: 'risques', titre: 'Risques', ic: '⚠', groupe: 'donnees',
    motifs: ['risques', 'risque', 'georisques', 'inondation', 'seisme', 'séisme', 'icpe', 'pollution'],
    aide: 'risques et environnement du point (Géorisques)',
  },
  {
    id: 'entreprises', titre: 'Entreprises', ic: '🏢', groupe: 'donnees',
    motifs: ['entreprises', 'societes', 'sociétés', 'siren', 'emploi', 'economie', 'économie'],
    aide: 'établissements autour du point (registre officiel, sans clé)',
  },
  {
    id: 'entites', titre: 'Entités de la carte', ic: '🏷', groupe: 'donnees',
    motifs: ['entites', 'entités', 'qui est la', 'que voit-on', 'batiments', 'bâtiments'],
    aide: 'affiche la fonction réelle de chaque lieu (OpenStreetMap)',
  },
  {
    id: 'cadrans', titre: 'Cadrans', ic: '🔲', groupe: 'regard',
    motifs: ['cadrans', 'cadran', 'quartiers', 'secteurs', 'decouper'],
    aide: 'découpe la commune en cadrans nommés et lisible',
  },
  {
    id: 'cadastre', titre: 'Cadastre', ic: '🗺', groupe: 'calques',
    motifs: ['cadastre', 'parcelle', 'parcelles'],
    aide: 'contours de parcelles (IGN, sans clé)',
  },
  {
    id: 'pluie', titre: 'Pluie', ic: '🌧', groupe: 'calques',
    motifs: ['pluie', 'averses'],
    aide: 'bascule le calque pluie',
  },
  {
    id: 'nuages', titre: 'Nuages', ic: '☁', groupe: 'calques',
    motifs: ['nuages', 'couverture'],
    aide: 'bascule le calque nuages',
  },
  {
    id: 'relief', titre: 'Relief', ic: '⛰', groupe: 'calques',
    motifs: ['relief', 'altitude', 'terrains'],
    aide: 'bascule le calque relief',
  },
  {
    id: 'noms', titre: 'Noms', ic: '🔤', groupe: 'calques',
    motifs: ['noms', 'labels', 'etiquettes', 'étiquettes'],
    aide: 'bascule les étiquettes de lieux',
  },
  {
    id: 'nord', titre: 'Nord', ic: '🧭', groupe: 'regard',
    motifs: ['nord', 'recadrer', 'orienter'],
    aide: 'recadre la vue vers le nord',
  },
  {
    id: 'espace', titre: 'Orbite', ic: '🌍', groupe: 'regard',
    motifs: ['espace', 'orbite', 'globe', 'terre entiere'],
    aide: 'vue orbitale (20 000 km)',
  },
  {
    id: 'domicile', titre: 'Domicile', ic: '🏠', groupe: 'lieu',
    motifs: ['domicile', 'maison', 'chez moi', 'home'],
    aide: 'retourne au domicile mémorisé',
  },
  {
    id: 'autour', titre: 'Autour de moi', ic: '📍', groupe: 'lieu',
    motifs: ['autour', 'a cote', 'à côté', 'proche', 'a proximite', 'à proximité'],
    aide: "ce qu'il y a autour du point visé",
  },
]);

/** Retire accents, casse, ponctuation et slash de tête. */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^\s*\/?/, '')
    .replace(/[!?,.:;'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reconnaît une commande dans une phrase.
 * @returns {{id:string, commande:object, argument:string}|null}
 */
export function reconnaitre(texte) {
  // « ? » seul est un raccourci d'aide : la ponctuation est retirée par
  // `normaliser`, on le traite donc avant.
  const brut = String(texte ?? '').trim();
  if (brut === '?' || brut === '/?') return { id: 'aide', commande: commandeDe('aide'), argument: '' };
  const t = normaliser(texte);
  if (!t) return null;
  // la commande la plus longue d'abord (évite « aide » mangé par « à l'aide »)
  const triees = [...COMMANDES].sort((a, b) => b.motifs[0].length - a.motifs[0].length);
  for (const c of triees) {
    for (const m of c.motifs) {
      const mm = normaliser(m);
      if (t === mm) return { id: c.id, commande: c, argument: '' };
      if (c.argument && t.startsWith(`${mm} `)) return { id: c.id, commande: c, argument: t.slice(mm.length + 1).trim() };
      if (c.argument && t.includes(` ${mm}`) && t.length - mm.length < 40) {
        return { id: c.id, commande: c, argument: t.replace(mm, '').trim() };
      }
    }
  }
  return null;
}

/** Commande par identifiant. */
export function commandeDe(id) {
  return COMMANDES.find((c) => c.id === id) || null;
}

/** Texte d'aide généré depuis la table (jamais désynchronisé). */
export function texteAide() {
  const parGroupe = new Map();
  for (const c of COMMANDES) {
    if (!parGroupe.has(c.groupe)) parGroupe.set(c.groupe, []);
    parGroupe.get(c.groupe).push(c);
  }
  const lignes = ['Commandes du chat (tape le mot ou clique une pastille) :'];
  for (const [g, liste] of parGroupe) {
    const meta = GROUPES[g];
    lignes.push(`\n${meta?.ic || '•'} ${meta?.nom || g.toUpperCase()}`);
    for (const c of liste) lignes.push(`  /${c.id} — ${c.aide}`);
  }
  lignes.push('\nTout autre texte est traité comme un LIEU : j’y vole.');
  lignes.push('🚨 En difficulté : /urgence (ou « au secours ») — temps gelé, procédure guidée, itinéraire.');
  return lignes.join('\n');
}

/**
 * Pastilles de réponses rapides selon le CONTEXTE courant.
 * @param {{vol?:boolean, commune?:string, nuit?:boolean, urgence?:boolean, chantier?:boolean}} [ctx]
 * @returns {Array<{titre:string, envoi:string, ic:string, groupe:string}>}
 */
export function reponsesRapides(ctx = {}) {
  const out = [];
  const ajouter = (ic, titre, envoi, groupe) => out.push({ ic, titre, envoi, groupe });

  if (ctx.urgence) {
    ajouter('✅', 'Étape suivante', '/urgence suite', 'urgence');
    ajouter('🚑', 'Urgences proches', '/urgence secours', 'urgence');
    ajouter('🧭', 'Itinéraire le plus rapide', '/urgence itineraire', 'urgence');
    ajouter('⏹', 'Quitter l’urgence', '/urgence fin', 'urgence');
    return out;
  }

  ajouter('❓', 'Aide', '/aide', 'systeme');
  ajouter('🚨', 'Urgence', '/urgence', 'urgence');
  if (ctx.vol) {
    ajouter('🌦', 'Météo du vol', '/meteo', 'donnees');
    ajouter('🧭', 'Nord', '/nord', 'regard');
  } else {
    ajouter('🌦', 'Météo ici', '/meteo', 'donnees');
    ajouter('🏷', 'Entités de la carte', '/entites', 'donnees');
  }
  if (ctx.commune) {
    ajouter('⚠', `Risques ${ctx.commune}`, '/risques', 'donnees');
    ajouter('🔲', 'Cadrans', '/cadrans', 'regard');
    ajouter('🗺', 'Cadastre', '/cadastre', 'calques');
  }
  ajouter('🏢', 'Entreprises', '/entreprises', 'donnees');
  ajouter('🌍', 'Orbite', '/espace', 'regard');
  ajouter('🏠', 'Domicile', '/domicile', 'lieu');
  return out.slice(0, 8);
}
