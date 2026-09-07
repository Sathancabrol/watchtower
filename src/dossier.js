/**
 * WATCHTOWER — DOSSIER D'INVESTIGATION (le tableau du palais mental).
 *
 * Demandé : « le tableau doit guider les utilisateurs à créer un dossier
 * d'investigation complet, infère les étapes et objets et fonctions à
 * implanter » + « proposer de créer des notes, de les modifier, les épingler
 * ou les mettre dans un dossier ».
 *
 * Le module tient :
 *  · **les étapes** d'une enquête (définir la zone → rassembler les sources →
 *    vérifier → cartographier → conclure), chacune associée aux FONCTIONS DE
 *    L'APPLICATION qui la servent (déduites du catalogue WATCHTOWER) ;
 *  · **les notes** : créer, modifier, épingler, ranger dans un dossier ;
 *  · **les dossiers** : un ou plusieurs par enquête, avec progression.
 *
 * Tout est local (localStorage) : aucune clé, aucun service. Les fonctions
 * pures sont testées dans `src/dossier.test.mjs`.
 */

const CLE = 'watchtower.dossier.v1';

/** Étapes d'une enquête + les fonctions WATCHTOWER qui les servent. */
export const ETAPES = Object.freeze([
  { id: 'zone', nom: 'Définir la zone', icone: '🎯', outils: ['MOI', 'LIEUX', 'CADRANS', 'ÉPINGLES'] },
  { id: 'sources', nom: 'Rassembler les sources', icone: '📚', outils: ['CADASTRE', 'ENTITÉS', 'INTEL', 'RADIO'] },
  { id: 'verifier', nom: 'Vérifier les faits', icone: '🔎', outils: ['FICHE', 'HISTO', 'ÉPOQUES', 'TRAJETS'] },
  { id: 'carter', nom: 'Cartographier', icone: '🗺', outils: ['BÂTI 3D', 'DISPOSITIFS', 'CALQUES'] },
  { id: 'observer', nom: 'Observer sur place', icone: '🎥', outils: ['VOL', 'CAM', 'MÉDAILLONS'] },
  { id: 'conclure', nom: 'Conclure et transmettre', icone: '🧾', outils: ['CHAT', 'CHEMISE', 'PARAMS'] },
]);

/** Dossier vide (fonction pure). */
export function dossierVide(nom = 'Enquête en cours') {
  return {
    nom,
    creeLe: new Date().toISOString(),
    etapes: Object.fromEntries(ETAPES.map((e) => [e.id, false])),
    notes: [],
    dossiers: ['Général'],
    compteur: 0,
  };
}

/** Identifiant lisible et stable pour une note. */
export function idNote(dossier, n) {
  return `n${String(n).padStart(3, '0')}`;
}

/** Crée une note (fonction pure : renvoie un nouveau dossier). */
export function creerNote(dossier, texte, dossierCible = 'Général') {
  const d = dossier || dossierVide();
  const t = String(texte || '').trim();
  if (!t) return d;
  const n = (d.compteur || 0) + 1;
  return {
    ...d,
    compteur: n,
    notes: [...(d.notes || []), {
      id: idNote(d, n), texte: t, dossier: dossierCible || 'Général',
      epinglee: false, creeLe: new Date().toISOString(),
    }],
  };
}

/** Modifie le texte d'une note. */
export function modifierNote(dossier, id, texte) {
  const d = dossier || dossierVide();
  return { ...d, notes: (d.notes || []).map((n) => (n.id === id ? { ...n, texte: String(texte ?? n.texte), modifieLe: new Date().toISOString() } : n)) };
}

/** Épingle / désépingle. */
export function epingler(dossier, id, on) {
  const d = dossier || dossierVide();
  return { ...d, notes: (d.notes || []).map((n) => (n.id === id ? { ...n, epinglee: on === undefined ? !n.epinglee : Boolean(on) } : n)) };
}

/** Range une note dans un dossier (le crée au besoin). */
export function ranger(dossier, id, nomDossier) {
  const d = dossier || dossierVide();
  const nom = String(nomDossier || 'Général').trim() || 'Général';
  const dossiers = (d.dossiers || []).includes(nom) ? d.dossiers : [...(d.dossiers || []), nom];
  return { ...d, dossiers, notes: (d.notes || []).map((n) => (n.id === id ? { ...n, dossier: nom } : n)) };
}

/** Supprime une note. */
export function supprimerNote(dossier, id) {
  const d = dossier || dossierVide();
  return { ...d, notes: (d.notes || []).filter((n) => n.id !== id) };
}

/** Coche une étape. */
export function cocherEtape(dossier, id, on) {
  const d = dossier || dossierVide();
  return { ...d, etapes: { ...(d.etapes || {}), [id]: on === undefined ? !(d.etapes?.[id]) : Boolean(on) } };
}

/** Progression 0 → 1 (fonction pure, testée). */
export function progression(dossier) {
  const etapes = (dossier && dossier.etapes) || {};
  const total = ETAPES.length;
  const faites = ETAPES.filter((e) => etapes[e.id]).length;
  return total ? Math.round((faites / total) * 100) / 100 : 0;
}

/** Les étapes restantes, dans l'ordre (pour guider l'utilisateur). */
export function prochainesEtapes(dossier, limite = 2) {
  const etapes = (dossier && dossier.etapes) || {};
  return ETAPES.filter((e) => !etapes[e.id]).slice(0, Math.max(1, limite));
}

/** Résumé affichable (télé cathodique). */
export function resumer(dossier) {
  const d = dossier || dossierVide();
  const notes = d.notes || [];
  return {
    nom: d.nom,
    progression: progression(d),
    etapesFaites: ETAPES.filter((e) => d.etapes?.[e.id]).map((e) => e.nom),
    prochaines: prochainesEtapes(d).map((e) => `${e.icone} ${e.nom} — ${e.outils.join(' · ')}`),
    notes: notes.length,
    epinglees: notes.filter((n) => n.epinglee).length,
    parDossier: Object.fromEntries((d.dossiers || []).map((nom) => [nom, notes.filter((n) => n.dossier === nom).length])),
  };
}

function lire() {
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE) || 'null');
    return brut && typeof brut === 'object' ? { ...dossierVide(), ...brut } : dossierVide();
  } catch { return dossierVide(); }
}
function ecrire(d) {
  try { window.localStorage.setItem(CLE, JSON.stringify(d)); } catch { /* plein */ }
}

const CSS = `
#wt-dossier { display: flex; flex-direction: column; gap: 7px; padding: 9px 10px; font-size: 10px; color: #e8eaed; }
#wt-dossier .do-k { font-size: 7.5px; letter-spacing: 2px; opacity: .5; font-weight: 700; }
#wt-dossier .do-titre { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #00d4ff; font-weight: 700; }
#wt-dossier .do-barre { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.1); overflow: hidden; }
#wt-dossier .do-barre i { display: block; height: 100%; background: linear-gradient(90deg, #00d4ff, #7dff4a); }
#wt-dossier .do-etape { display: flex; align-items: center; gap: 6px; padding: 3px 5px; border-radius: 6px; background: rgba(255,255,255,0.04); cursor: pointer; }
#wt-dossier .do-etape.faite { background: rgba(125,255,74,0.10); }
#wt-dossier .do-etape.faite .do-nom { text-decoration: line-through; opacity: .6; }
#wt-dossier .do-etape .do-nom { flex: 1; }
#wt-dossier .do-outils { font-size: 7px; opacity: .45; }
#wt-dossier .do-note { display: flex; gap: 5px; align-items: flex-start; padding: 5px 6px; border-radius: 6px; background: rgba(255,255,255,0.05); }
#wt-dossier .do-note .do-texte { flex: 1; line-height: 1.45; word-break: break-word; white-space: pre-wrap; }
#wt-dossier .do-note .do-meta { font-size: 7px; opacity: .45; }
#wt-dossier .do-note.epinglee { border-left: 2px solid #00d4ff; background: rgba(0,212,255,0.09); }
#wt-dossier button {
  cursor: pointer; padding: 3px 6px; border-radius: 5px; font-family: inherit; font-size: 8px;
  font-weight: 700; background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.3); color: #00d4ff;
}
#wt-dossier button.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.14); color: rgba(232,234,237,0.7); }
#wt-dossier input, #wt-dossier select {
  font-family: inherit; font-size: 9px; padding: 4px 6px; border-radius: 5px; width: 100%;
  background: rgba(0,0,0,0.35); border: 1px solid rgba(0,212,255,0.25); color: #e8eaed;
}
#wt-dossier .do-liste { display: flex; flex-direction: column; gap: 3px; max-height: 34vh; overflow-y: auto; }
`;

/**
 * @param {{conteneur?:HTMLElement, surMessage?:Function, titre?:string}} [options]
 */
export function initDossier(options = {}) {
  const { conteneur = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let etat = lire();

  const el = document.createElement('div');
  el.id = 'wt-dossier';
  if (conteneur) conteneur.appendChild(el);

  function peindre() {
    const r = resumer(etat);
    el.innerHTML = `
      <div class="do-titre"><span>🗂 ${r.nom}</span>
        <span class="do-barre"><i style="width:${Math.round(r.progression * 100)}%"></i></span>
        <span style="font-size:8px">${Math.round(r.progression * 100)}%</span></div>
      <div class="do-k">ÉTAPES DE L'ENQUÊTE — CLIQUER POUR COCHER</div>
      <div class="do-liste">
        ${ETAPES.map((e) => `<div class="do-etape${etat.etapes?.[e.id] ? ' faite' : ''}" data-e="${e.id}">
          <span>${e.icone}</span><span class="do-nom">${e.nom}</span>
          <span class="do-outils">${e.outils.join(' · ')}</span></div>`).join('')}
      </div>
      <div class="do-k">PROCHAINE ÉTAPE CONSEILLÉE</div>
      <div class="do-outils" style="line-height:1.6">${r.prochaines.join('<br>') || '✅ enquête complète'}</div>
      <div class="do-k">NOTES — ${r.notes} (dont ${r.epinglees} épinglée(s))</div>
      <input id="wt-do-texte" placeholder="une observation, une hypothèse…" />
      <div style="display:flex;gap:4px">
        <select id="wt-do-dossier">${(etat.dossiers || []).map((d) => `<option>${d}</option>`).join('')}</select>
        <button id="wt-do-ajouter">＋ NOTE</button>
        <button class="gris" id="wt-do-nouveau-dossier">🗂 DOSSIER</button>
      </div>
      <div class="do-liste">
        ${(etat.notes || []).slice().sort((a, b) => Number(b.epinglee) - Number(a.epinglee)).map((n) => `
          <div class="do-note${n.epinglee ? ' epinglee' : ''}" data-n="${n.id}">
            <span class="do-texte">${n.texte.replace(/</g, '&lt;')}</span>
            <span class="do-meta">${n.dossier}</span>
            <button data-a="ep" title="Épingler / désépingler">${n.epinglee ? '📌' : '📍'}</button>
            <button class="gris" data-a="mod" title="Modifier">✏</button>
            <button class="gris" data-a="ran" title="Ranger dans un dossier">🗂</button>
            <button class="gris" data-a="sup" title="Supprimer">🗑</button>
          </div>`).join('') || '<div class="do-outils">Aucune note. Commence par une observation.</div>'}
      </div>`;

    for (const et of el.querySelectorAll('.do-etape')) {
      et.addEventListener('click', () => {
        etat = cocherEtape(etat, et.dataset.e);
        ecrire(etat);
        peindre();
      });
    }
    el.querySelector('#wt-do-ajouter').addEventListener('click', () => {
      const texte = el.querySelector('#wt-do-texte').value;
      const dossierCible = el.querySelector('#wt-do-dossier').value;
      if (!String(texte).trim()) { surMessage?.('⚠ Note vide.'); return; }
      etat = creerNote(etat, texte, dossierCible);
      ecrire(etat);
      peindre();
      surMessage?.('📝 Note ajoutée.');
    });
    el.querySelector('#wt-do-texte').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') el.querySelector('#wt-do-ajouter').click();
    });
    el.querySelector('#wt-do-nouveau-dossier').addEventListener('click', () => {
      const nom = window.prompt('Nom du dossier', `Dossier ${(etat.dossiers?.length || 1) + 1}`);
      if (!nom) return;
      if (!(etat.dossiers || []).includes(nom)) etat = { ...etat, dossiers: [...(etat.dossiers || []), nom] };
      ecrire(etat);
      peindre();
    });
    for (const n of el.querySelectorAll('.do-note')) {
      const id = n.dataset.n;
      n.querySelector('[data-a="ep"]').addEventListener('click', () => { etat = epingler(etat, id); ecrire(etat); peindre(); });
      n.querySelector('[data-a="mod"]').addEventListener('click', () => {
        const actuel = (etat.notes || []).find((x) => x.id === id);
        const t = window.prompt('Modifier la note', actuel?.texte || '');
        if (t === null) return;
        etat = modifierNote(etat, id, t);
        ecrire(etat);
        peindre();
      });
      n.querySelector('[data-a="ran"]').addEventListener('click', () => {
        const nom = window.prompt('Ranger dans quel dossier ?', (etat.dossiers || []).join(', '));
        if (!nom) return;
        etat = ranger(etat, id, nom);
        ecrire(etat);
        peindre();
      });
      n.querySelector('[data-a="sup"]').addEventListener('click', () => {
        etat = supprimerNote(etat, id);
        ecrire(etat);
        peindre();
      });
    }
  }

  peindre();

  return {
    element: el,
    etat: () => ({ ...etat }),
    resumer: () => resumer(etat),
    /** Une vue « télé » : le résumé du dossier en cours. */
    elementTele() {
      const t = document.createElement('div');
      t.id = 'wt-dossier-tele';
      const r = resumer(etat);
      t.innerHTML = `
        <div style="padding:9px 10px;font-size:10px;line-height:1.7;color:#e8eaed">
          <div style="color:#00d4ff;font-weight:700">📺 DOSSIER EN COURS — ${r.nom}</div>
          <div>Progression <b>${Math.round(r.progression * 100)}%</b> ·
            ${r.notes} note(s) · ${r.epinglees} épinglée(s)</div>
          <div style="opacity:.6">Fait : ${r.etapesFaites.join(', ') || '—'}</div>
          <div style="opacity:.6">Suivant :<br>${r.prochaines.join('<br>') || '—'}</div>
          <div style="opacity:.6">Dossiers : ${
            Object.entries(r.parDossier).map(([k, v]) => `${k} (${v})`).join(' · ') || '—'
          }</div>
        </div>`;
      return t;
    },
    rafraichir: peindre,
  };
}
