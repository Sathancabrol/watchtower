/**
 * WATCHTOWER — MODE RÉUNION (logique pure, sans DOM).
 *
 * Objet : tenir une réunion de mairie depuis l'INTEL. Un dossier de réunion
 * porte un titre, un objectif, des participants, un ordre du jour (alimenté
 * par le graphe de connaissances du territoire), des notes horodatées et des
 * pièces jointes d'enregistrement (texte, audio, vidéo, caméra, transcription).
 *
 * Ce module ne touche NI au DOM NI au réseau : il est testable en Node et
 * réutilisable. La couche d'interface vit dans `reunionUI.js`.
 *
 * Persistance : injectable (`stockage`), par défaut `localStorage` quand il
 * existe, sinon une mémoire volatile — pour que les tests et le rendu
 * serveur ne plantent jamais.
 */

import { noeud, QUESTIONS_OUVERTES } from './data/territoire/grapheThau.js';

/** Clé de rangement des réunions. */
export const CLE_STOCKAGE = 'wt-reunions-v1';

/** Types de captation proposés par l'interface. */
export const TYPES_ENREGISTREMENT = Object.freeze([
  { cle: 'texte', ic: '📝', nom: 'Texte', detail: 'Compte rendu saisi au clavier' },
  { cle: 'audio', ic: '🎙', nom: 'Audio', detail: 'Micro — export .webm/.mp3 selon le navigateur' },
  { cle: 'video', ic: '🎬', nom: 'Vidéo', detail: 'Écran ou fenêtre partagée — export .webm/.mp4' },
  { cle: 'camera', ic: '📷', nom: 'Caméra', detail: 'Webcam + micro' },
  { cle: 'ia', ic: '🧠', nom: 'IA', detail: 'Transcription automatique locale (navigateur, sans clé ni API)' },
]);

/** Statuts possibles d'une réunion. */
export const STATUTS = Object.freeze(['préparation', 'en cours', 'close']);

let compteur = 0;
/** Identifiant court, stable et lisible. */
function id(prefixe) {
  compteur += 1;
  return `${prefixe}-${Date.now().toString(36)}-${compteur.toString(36)}`;
}

/** Mémoire de repli quand `localStorage` n'existe pas (Node, tests). */
function memoireVolatile() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

/** Choisit le stockage disponible. */
export function stockageParDefaut() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch { /* accès refusé (mode privé) → repli */ }
  return memoireVolatile();
}

/**
 * Crée un dossier de réunion vide.
 * @param {{titre?:string, objectif?:string, date?:string, lieu?:string}} [champs]
 * @returns {object}
 */
export function creerReunion(champs = {}) {
  const maintenant = new Date().toISOString();
  return {
    id: id('reu'),
    titre: String(champs.titre || 'Réunion sans titre').trim() || 'Réunion sans titre',
    objectif: String(champs.objectif || '').trim(),
    lieu: String(champs.lieu || '').trim(),
    date: champs.date || maintenant.slice(0, 16).replace('T', ' '),
    visio: String(champs.visio || '').trim(),
    statut: 'préparation',
    participants: [],
    ordreDuJour: [],
    notes: [],
    enregistrements: [],
    creee: maintenant,
    modifiee: maintenant,
  };
}

/** Marque la réunion comme modifiée et la renvoie (mutation assumée). */
function touche(r) {
  if (r) r.modifiee = new Date().toISOString();
  return r;
}

/**
 * Met à jour les champs d'en-tête (titre, objectif, date, lieu, visio, statut).
 * Ignore silencieusement les champs inconnus.
 */
export function modifierEntete(reunion, champs = {}) {
  if (!reunion) return null;
  for (const c of ['titre', 'objectif', 'date', 'lieu', 'visio']) {
    if (champs[c] !== undefined) reunion[c] = String(champs[c]).trim();
  }
  if (champs.statut !== undefined && STATUTS.includes(champs.statut)) reunion.statut = champs.statut;
  if (!reunion.titre) reunion.titre = 'Réunion sans titre';
  return touche(reunion);
}

// ── 👥 PARTICIPANTS ──────────────────────────────────────────────────────

/**
 * Ajoute un participant. Refuse les doublons de nom (insensible à la casse).
 * @returns {object|null} le participant créé, ou null si refusé
 */
export function ajouterParticipant(reunion, { nom, role = '', presence = 'présent' } = {}) {
  if (!reunion) return null;
  const propre = String(nom || '').trim();
  if (!propre) return null;
  const existe = reunion.participants.some((p) => p.nom.toLowerCase() === propre.toLowerCase());
  if (existe) return null;
  const p = { id: id('par'), nom: propre, role: String(role || '').trim(), presence };
  reunion.participants.push(p);
  touche(reunion);
  return p;
}

/** Modifie un participant existant. */
export function modifierParticipant(reunion, idParticipant, champs = {}) {
  const p = reunion?.participants.find((x) => x.id === idParticipant);
  if (!p) return null;
  if (champs.nom !== undefined && String(champs.nom).trim()) p.nom = String(champs.nom).trim();
  if (champs.role !== undefined) p.role = String(champs.role).trim();
  if (champs.presence !== undefined) p.presence = String(champs.presence);
  touche(reunion);
  return p;
}

/** Retire un participant. @returns {boolean} vrai si quelque chose a été retiré */
export function supprimerParticipant(reunion, idParticipant) {
  if (!reunion) return false;
  const avant = reunion.participants.length;
  reunion.participants = reunion.participants.filter((p) => p.id !== idParticipant);
  if (reunion.participants.length === avant) return false;
  touche(reunion);
  return true;
}

// ── 🗂 ORDRE DU JOUR ─────────────────────────────────────────────────────

/**
 * Ajoute un point à l'ordre du jour. Si `cleNoeud` désigne un nœud du graphe
 * territorial, le point hérite de son intitulé et sert de diapositive.
 */
export function ajouterPoint(reunion, { intitule = '', cleNoeud = null, minutes = 10 } = {}) {
  if (!reunion) return null;
  const n = cleNoeud ? noeud(cleNoeud) : null;
  const texte = String(intitule || n?.nom || '').trim();
  if (!texte) return null;
  const p = {
    id: id('pt'),
    intitule: texte,
    cleNoeud: n ? n.cle : null,
    minutes: Number.isFinite(Number(minutes)) ? Math.max(0, Number(minutes)) : 10,
    traite: false,
  };
  reunion.ordreDuJour.push(p);
  touche(reunion);
  return p;
}

/** Modifie un point de l'ordre du jour. */
export function modifierPoint(reunion, idPoint, champs = {}) {
  const p = reunion?.ordreDuJour.find((x) => x.id === idPoint);
  if (!p) return null;
  if (champs.intitule !== undefined && String(champs.intitule).trim()) p.intitule = String(champs.intitule).trim();
  if (champs.minutes !== undefined) p.minutes = Math.max(0, Number(champs.minutes) || 0);
  if (champs.traite !== undefined) p.traite = champs.traite === true;
  touche(reunion);
  return p;
}

/** Supprime un point de l'ordre du jour. */
export function supprimerPoint(reunion, idPoint) {
  if (!reunion) return false;
  const avant = reunion.ordreDuJour.length;
  reunion.ordreDuJour = reunion.ordreDuJour.filter((p) => p.id !== idPoint);
  if (reunion.ordreDuJour.length === avant) return false;
  touche(reunion);
  return true;
}

/** Déplace un point de `delta` rangs (-1 = monter). */
export function deplacerPoint(reunion, idPoint, delta) {
  if (!reunion) return false;
  const i = reunion.ordreDuJour.findIndex((p) => p.id === idPoint);
  if (i < 0) return false;
  const j = Math.min(reunion.ordreDuJour.length - 1, Math.max(0, i + Number(delta || 0)));
  if (i === j) return false;
  const [p] = reunion.ordreDuJour.splice(i, 1);
  reunion.ordreDuJour.splice(j, 0, p);
  touche(reunion);
  return true;
}

/** Durée totale prévue, en minutes. */
export function dureePrevue(reunion) {
  return (reunion?.ordreDuJour || []).reduce((s, p) => s + (Number(p.minutes) || 0), 0);
}

// ── 📝 NOTES ─────────────────────────────────────────────────────────────

/**
 * Ajoute une note horodatée, éventuellement rattachée à un point de l'ordre
 * du jour. `type` distingue les relevés de décision des simples remarques.
 */
export function ajouterNote(reunion, { texte = '', type = 'note', idPoint = null, auteur = '' } = {}) {
  if (!reunion) return null;
  const t = String(texte || '').trim();
  if (!t) return null;
  const n = {
    id: id('note'),
    texte: t,
    type: ['note', 'décision', 'action', 'question'].includes(type) ? type : 'note',
    idPoint: idPoint || null,
    auteur: String(auteur || '').trim(),
    horodatage: new Date().toISOString(),
  };
  reunion.notes.push(n);
  touche(reunion);
  return n;
}

/** Modifie le texte ou le type d'une note. */
export function modifierNote(reunion, idNote, champs = {}) {
  const n = reunion?.notes.find((x) => x.id === idNote);
  if (!n) return null;
  if (champs.texte !== undefined) {
    const t = String(champs.texte).trim();
    if (!t) return null;
    n.texte = t;
  }
  if (champs.type !== undefined && ['note', 'décision', 'action', 'question'].includes(champs.type)) {
    n.type = champs.type;
  }
  if (champs.idPoint !== undefined) n.idPoint = champs.idPoint || null;
  n.modifiee = new Date().toISOString();
  touche(reunion);
  return n;
}

/** Supprime une note. */
export function supprimerNote(reunion, idNote) {
  if (!reunion) return false;
  const avant = reunion.notes.length;
  reunion.notes = reunion.notes.filter((n) => n.id !== idNote);
  if (reunion.notes.length === avant) return false;
  touche(reunion);
  return true;
}

// ── 🎙 ENREGISTREMENTS ───────────────────────────────────────────────────

/**
 * Référence une captation. On ne stocke JAMAIS le média lui-même dans le
 * stockage local (il saturerait le quota) : seule la fiche descriptive est
 * conservée, le fichier étant téléchargé par l'utilisateur.
 */
export function ajouterEnregistrement(reunion, { type = 'audio', nomFichier = '', duree = 0, transcription = '' } = {}) {
  if (!reunion) return null;
  if (!TYPES_ENREGISTREMENT.some((t) => t.cle === type)) return null;
  const e = {
    id: id('enr'),
    type,
    nomFichier: String(nomFichier || '').trim(),
    duree: Math.max(0, Number(duree) || 0),
    transcription: String(transcription || '').trim(),
    horodatage: new Date().toISOString(),
  };
  reunion.enregistrements.push(e);
  touche(reunion);
  return e;
}

/** Supprime une fiche d'enregistrement. */
export function supprimerEnregistrement(reunion, idEnr) {
  if (!reunion) return false;
  const avant = reunion.enregistrements.length;
  reunion.enregistrements = reunion.enregistrements.filter((e) => e.id !== idEnr);
  if (reunion.enregistrements.length === avant) return false;
  touche(reunion);
  return true;
}

// ── 📽 PRÉSENTATION ──────────────────────────────────────────────────────

/**
 * Construit les diapositives de la réunion : une de titre, puis une par point
 * de l'ordre du jour. Les points adossés au graphe territorial sont enrichis
 * de leurs attributs et de leurs nœuds voisins.
 * @returns {Array<object>}
 */
export function diapos(reunion) {
  if (!reunion) return [];
  const sommaire = {
    type: 'titre',
    titre: reunion.titre,
    objectif: reunion.objectif,
    date: reunion.date,
    lieu: reunion.lieu,
    participants: reunion.participants.map((p) => p.nom),
    points: reunion.ordreDuJour.map((p) => p.intitule),
  };
  const suite = reunion.ordreDuJour.map((p, i) => {
    const n = p.cleNoeud ? noeud(p.cleNoeud) : null;
    return {
      type: 'point',
      rang: i + 1,
      idPoint: p.id,
      titre: p.intitule,
      minutes: p.minutes,
      resume: n?.resume || '',
      attributs: n?.attributs || [],
      tags: n?.tags || [],
      notes: reunion.notes.filter((x) => x.idPoint === p.id),
    };
  });
  return [sommaire, ...suite];
}

/** Questions ouvertes proposées comme points d'ordre du jour. */
export function pointsSuggeres() {
  return QUESTIONS_OUVERTES.map((q) => ({ cle: q.cle, intitule: q.question, noeuds: q.noeuds }));
}

// ── 💾 PERSISTANCE ───────────────────────────────────────────────────────

/**
 * Lit toutes les réunions rangées. Tolère un stockage corrompu (renvoie []).
 * @param {{getItem:Function}} [stockage]
 */
export function listerReunions(stockage = stockageParDefaut()) {
  try {
    const brut = stockage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    const data = JSON.parse(brut);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Enregistre (crée ou remplace) une réunion. @returns {object[]} la liste à jour
 */
export function sauvegarderReunion(reunion, stockage = stockageParDefaut()) {
  if (!reunion?.id) return listerReunions(stockage);
  const liste = listerReunions(stockage);
  const i = liste.findIndex((r) => r.id === reunion.id);
  if (i >= 0) liste[i] = reunion;
  else liste.push(reunion);
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
  } catch { /* quota dépassé : on garde la réunion en mémoire, l'UI avertit */ }
  return liste;
}

/** Recharge une réunion par son identifiant. */
export function chargerReunion(idReunion, stockage = stockageParDefaut()) {
  return listerReunions(stockage).find((r) => r.id === idReunion) || null;
}

/** Supprime définitivement une réunion. */
export function supprimerReunion(idReunion, stockage = stockageParDefaut()) {
  const liste = listerReunions(stockage).filter((r) => r.id !== idReunion);
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
  } catch { /* ignoré */ }
  return liste;
}

// ── 📤 EXPORT DU COMPTE RENDU ────────────────────────────────────────────

/** Rend un attribut en marquant honnêtement ce qui n'est pas recoupé. */
function ligneAttribut(at) {
  const marque = at.fiable ? '' : '~ ';
  const note = at.fiable ? `_(source : ${at.source})_` : '_(à vérifier)_';
  return `- **${at.libelle}** : ${marque}${at.valeur} ${note}`;
}

/**
 * Compte rendu complet en Markdown : en-tête, participants, ordre du jour,
 * décisions, actions, questions, notes et captations.
 * @returns {string}
 */
export function versMarkdown(reunion) {
  if (!reunion) return '';
  const L = [];
  L.push(`# ${reunion.titre}`, '');
  if (reunion.objectif) L.push(`**Objectif** — ${reunion.objectif}`, '');
  L.push(`- **Date** : ${reunion.date}`);
  if (reunion.lieu) L.push(`- **Lieu** : ${reunion.lieu}`);
  if (reunion.visio) L.push(`- **Visioconférence** : ${reunion.visio}`);
  L.push(`- **Statut** : ${reunion.statut}`);
  L.push(`- **Durée prévue** : ${dureePrevue(reunion)} min`, '');

  L.push('## Participants', '');
  if (!reunion.participants.length) L.push('_Aucun participant enregistré._', '');
  for (const p of reunion.participants) {
    L.push(`- ${p.nom}${p.role ? ` — ${p.role}` : ''} (${p.presence})`);
  }
  L.push('');

  L.push('## Ordre du jour', '');
  if (!reunion.ordreDuJour.length) L.push('_Ordre du jour vide._', '');
  reunion.ordreDuJour.forEach((p, i) => {
    L.push(`${i + 1}. ${p.traite ? '✅ ' : ''}${p.intitule} _(${p.minutes} min)_`);
  });
  L.push('');

  for (const [cle, titre] of [['décision', 'Décisions'], ['action', 'Actions'], ['question', 'Questions']]) {
    const lot = reunion.notes.filter((n) => n.type === cle);
    if (!lot.length) continue;
    L.push(`## ${titre}`, '');
    for (const n of lot) L.push(`- ${n.texte}${n.auteur ? ` — _${n.auteur}_` : ''}`);
    L.push('');
  }

  L.push('## Notes', '');
  const simples = reunion.notes.filter((n) => n.type === 'note');
  if (!simples.length) L.push('_Aucune note._', '');
  for (const n of simples) {
    const h = String(n.horodatage || '').slice(11, 16);
    L.push(`- \`${h}\` ${n.texte}${n.auteur ? ` — _${n.auteur}_` : ''}`);
  }
  L.push('');

  if (reunion.enregistrements.length) {
    L.push('## Captations', '');
    for (const e of reunion.enregistrements) {
      const t = TYPES_ENREGISTREMENT.find((x) => x.cle === e.type);
      L.push(`- ${t?.ic || '•'} **${t?.nom || e.type}**${e.nomFichier ? ` — \`${e.nomFichier}\`` : ''}${e.duree ? ` (${Math.round(e.duree)} s)` : ''}`);
      if (e.transcription) L.push(`  > ${e.transcription.replace(/\n/g, '\n  > ')}`);
    }
    L.push('');
  }

  const fiches = reunion.ordreDuJour.filter((p) => p.cleNoeud).map((p) => noeud(p.cleNoeud)).filter(Boolean);
  if (fiches.length) {
    L.push('## Fiches territoriales citées', '');
    for (const n of fiches) {
      L.push(`### ${n.nom}`, '', n.resume, '');
      for (const at of n.attributs || []) L.push(ligneAttribut(at));
      L.push('');
    }
    L.push('> Les valeurs précédées de `~` proviennent du graphe de territoire fourni et **n\'ont pas été recoupées** sur source officielle.', '');
  }

  return L.join('\n');
}
