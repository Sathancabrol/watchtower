/**
 * WATCHTOWER — LE PANNEAU DE REGLAGE DU FIL, en logique pure.
 *
 * Tout ce qui DECIDE est ici : le balisage produit et l'effet de chaque clic.
 * Le module DOM voisin (`src/reglagesFil.js`) ne fait que coller ce balisage
 * et router les clics. On peut donc tester le comportement du panneau sans
 * navigateur — il n'y en a pas dans le bac a sable, et puppeteer y est
 * inutilisable.
 *
 * Les actions sont des CHAINES (« basculer:presse »). C'est volontaire :
 * elles tiennent dans un `data-` attribut, survivent a un `innerHTML`, et se
 * testent sans simuler le moindre evenement.
 */

import {
  FLUX_FIL, TRIS, normaliserPreferences, basculerFlux, deplacerFlux,
  preferencesParDefaut, resumePreferences, demandeLeReseau,
} from './preferencesFil.js';

/** Protege le texte insere dans du HTML. Un nom de flux reste du texte. */
export function echapper(texte) {
  return String(texte ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Libelle lisible de chaque tri. */
export const NOMS_TRI = Object.freeze({
  importance: 'Importance',
  recent: 'Plus récent',
  source: 'Par source',
  manuel: 'Mon ordre',
});

/**
 * Effet d'une action sur les preferences. Rend TOUJOURS de nouvelles
 * preferences : une action inconnue renvoie l'etat inchange plutot que de
 * lever — un panneau ne doit pas pouvoir casser l'application.
 *
 * @param {object} prefs
 * @param {string} action  par exemple « basculer:presse » ou « tri:recent »
 * @returns {object}
 */
export function appliquerAction(prefs, action) {
  const p = normaliserPreferences(prefs);
  const brut = String(action || '');
  const sep = brut.indexOf(':');
  const verbe = sep < 0 ? brut : brut.slice(0, sep);
  const arg = sep < 0 ? '' : brut.slice(sep + 1);

  switch (verbe) {
    case 'basculer': return basculerFlux(p, arg);
    case 'monter': return deplacerFlux(p, arg, -1);
    case 'descendre': return deplacerFlux(p, arg, 1);
    case 'tri': return TRIS.includes(arg) ? { ...p, tri: arg } : p;
    case 'limite': return normaliserPreferences({ ...p, limite: arg });
    case 'gravite': return normaliserPreferences({ ...p, graviteMin: arg });
    case 'horsligne': return { ...p, horsLigneSeulement: !p.horsLigneSeulement };
    // Le depliage est le SEUL moyen pour le fil de prendre de la place :
    // c'est la consigne — il ne s'etend que sur le bouton prevu pour ca.
    case 'deplier': return { ...p, deplie: !p.deplie };
    case 'replier': return { ...p, deplie: false };
    // On garde le depliage en cours : remettre les flux a zero ne doit pas
    // refermer le panneau sous les doigts de celui qui clique.
    case 'defaut': return { ...preferencesParDefaut(), deplie: p.deplie };
    default: return p;
  }
}

/** Une ligne de flux : son etat, son rang, et de quoi le changer. */
function ligneFlux(id, prefs) {
  const f = FLUX_FIL.find((x) => x.id === id);
  if (!f) return '';
  const allume = prefs.actifs.includes(id);
  const i = prefs.ordre.indexOf(id);
  const premier = i <= 0;
  const dernier = i >= prefs.ordre.length - 1;
  const provenance = f.reseau
    ? '<span class="rf-net" title="Demande une connexion">réseau</span>'
    : '<span class="rf-loc" title="Répond sans connexion">hors ligne</span>';
  return `
    <li class="rf-flux${allume ? ' est-allume' : ''}">
      <button type="button" class="rf-bascule" data-rf-action="basculer:${echapper(id)}"
        aria-pressed="${allume}" title="${echapper(f.note)}">
        <span class="rf-ic">${echapper(f.ic)}</span>
        <span class="rf-nom">${echapper(f.nom)}</span>
        <span class="rf-src">${echapper(f.source)} · ${provenance}</span>
      </button>
      <span class="rf-rang">
        <button type="button" data-rf-action="monter:${echapper(id)}"
          ${premier ? 'disabled' : ''} aria-label="Monter ${echapper(f.nom)}">▲</button>
        <button type="button" data-rf-action="descendre:${echapper(id)}"
          ${dernier ? 'disabled' : ''} aria-label="Descendre ${echapper(f.nom)}">▼</button>
      </span>
    </li>`;
}

/**
 * Le panneau entier.
 *
 * @param {object} prefsBrutes
 * @returns {string} HTML
 */
export function htmlPanneauFil(prefsBrutes) {
  const p = normaliserPreferences(prefsBrutes);
  const tris = TRIS.map((t) => `
    <button type="button" class="rf-tri${p.tri === t ? ' est-actif' : ''}"
      data-rf-action="tri:${t}" aria-pressed="${p.tri === t}">${echapper(NOMS_TRI[t])}</button>`).join('');

  const flux = p.ordre.map((id) => ligneFlux(id, p)).join('');

  // On ANNONCE si le reglage courant oblige a aller sur le reseau, plutot que
  // de laisser l'utilisateur attendre sans savoir pourquoi.
  const avis = demandeLeReseau(p)
    ? '<p class="rf-avis rf-avis-net">Ce réglage interroge des sources externes. Sans connexion, seules les dépêches hors ligne s’afficheront.</p>'
    : '<p class="rf-avis rf-avis-loc">Ce réglage répond entièrement depuis la base embarquée, sans connexion.</p>';

  return `
    <div class="rf-tete">
      <strong>RÉGLER LE FIL</strong>
      <span class="rf-resume">${echapper(resumePreferences(p))}</span>
      <button type="button" class="rf-fermer" data-rf-action="fermer" aria-label="Fermer le réglage du fil">✕</button>
    </div>
    <ul class="rf-liste">${flux}</ul>
    <div class="rf-bloc">
      <span class="rf-etiquette">Ordre</span>
      <div class="rf-tris">${tris}</div>
    </div>
    <div class="rf-bloc">
      <label class="rf-etiquette" for="rf-limite">Dépêches affichées</label>
      <input id="rf-limite" type="range" min="3" max="60" step="1" value="${p.limite}"
        data-rf-champ="limite" aria-label="Nombre de dépêches affichées" />
      <output class="rf-valeur">${p.limite}</output>
    </div>
    <div class="rf-bloc">
      <label class="rf-etiquette" for="rf-gravite">Ne montrer qu’à partir de</label>
      <input id="rf-gravite" type="range" min="0" max="3" step="1" value="${p.graviteMin}"
        data-rf-champ="gravite" aria-label="Seuil d’importance" />
      <output class="rf-valeur">${['tout', 'notable', 'important', 'urgent'][p.graviteMin]}</output>
    </div>
    <div class="rf-bloc">
      <button type="button" class="rf-interrupteur${p.horsLigneSeulement ? ' est-actif' : ''}"
        data-rf-action="horsligne" aria-pressed="${p.horsLigneSeulement}">
        Hors ligne uniquement
      </button>
      <button type="button" class="rf-defaut" data-rf-action="defaut">Réinitialiser</button>
    </div>
    ${avis}`;
}

/** Libelle du bouton de depliage, qui doit dire ce qu'il VA faire. */
export function libelleDepliage(prefs) {
  return normaliserPreferences(prefs).deplie ? 'Replier le fil' : 'Déplier le fil';
}
