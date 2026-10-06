/**
 * WATCHTOWER — PANNEAU « DOCUMENTS » de la couche OSINT.
 *
 * On colle un titre, une reference ou un DOI ; le panneau construit le plan
 * de recherche et ouvre chaque source legale susceptible d'heberger le texte
 * integral gratuitement.
 *
 * Deux partis pris :
 *  · le panneau ne telecharge rien lui-meme — il OUVRE la source dans un
 *    onglet. Pas de proxy, pas de cache d'articles, donc rien a heberger et
 *    aucune ambiguite sur ce qui transite ;
 *  · les sources francaises passent devant quand il n'y a pas de DOI, parce
 *    que l'application sert un territoire francais.
 */

import {
  SOURCES_DOCUMENTS, normaliserDoi, extraireDoi, planDeRecherche, urlPour,
} from './data/osint/sourcesDocuments.js';

const CSS = `
#wt-docs { display: flex; flex-direction: column; gap: 9px; min-width: 320px; max-width: 460px; font-family: var(--font-mono, monospace); color: #e8eaed; }
#wt-docs .rd-aide { font-size: 10px; line-height: 1.5; color: rgba(232,234,237,0.6); }
#wt-docs textarea {
  width: 100%; box-sizing: border-box; min-height: 62px; resize: vertical;
  padding: 8px 9px; font-family: inherit; font-size: 11px; color: inherit;
  background: rgba(0,0,0,0.42); border: 1px solid rgba(0,212,255,0.28); border-radius: 8px;
}
#wt-docs textarea:focus { outline: none; border-color: #00d4ff; }
#wt-docs .rd-etat { font-size: 10px; letter-spacing: 0.4px; min-height: 1.2em; color: #7dd3c8; }
#wt-docs .rd-etat.rd-doi { color: #7dff9c; }
#wt-docs .rd-liste { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
#wt-docs .rd-src {
  display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;
  padding: 7px 9px; cursor: pointer; text-align: left; font-family: inherit; font-size: 11px;
  color: #dfe7ee; background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 7px;
}
#wt-docs .rd-src:hover { background: rgba(0,212,255,0.16); border-color: rgba(0,212,255,0.5); }
#wt-docs .rd-src[disabled] { opacity: 0.32; cursor: not-allowed; }
#wt-docs .rd-src .rd-nom { font-weight: 700; }
#wt-docs .rd-src .rd-genre { margin-left: auto; font-size: 8.5px; color: rgba(232,234,237,0.45); }
#wt-docs .rd-src .rd-fr { font-size: 8px; color: #7dff9c; letter-spacing: 1px; }
#wt-docs .rd-note { font-size: 9px; line-height: 1.45; color: rgba(232,234,237,0.5); padding: 0 2px 4px; }
#wt-docs .rd-legal {
  font-size: 9px; line-height: 1.5; color: rgba(232,234,237,0.55);
  border-top: 1px solid rgba(255,255,255,0.1); padding-top: 7px;
}
`;

/** Injecte la feuille une seule fois. */
function poserStyle(doc) {
  if (doc.getElementById('wt-docs-css')) return;
  const st = doc.createElement('style');
  st.id = 'wt-docs-css';
  st.textContent = CSS;
  doc.head?.appendChild(st);
}

/**
 * Construit le panneau.
 * @param {Document} [doc]
 * @param {{ouvrirUrl?:Function, surMessage?:Function}} [options]
 * @returns {{element:HTMLElement, chercher:Function, plan:Function}}
 */
export function initRechercheDocs(doc = globalThis.document, options = {}) {
  if (!doc?.createElement) return { element: null, chercher: () => [], plan: () => [] };
  poserStyle(doc);

  const ouvrirUrl = options.ouvrirUrl
    || ((u) => globalThis.open?.(u, '_blank', 'noopener,noreferrer'));

  const el = doc.createElement('div');
  el.id = 'wt-docs';
  el.innerHTML = `
    <div class="rd-aide">Colle un titre, une référence complète ou un DOI. Les sources
      ci-dessous hébergent <b>légalement et gratuitement</b> le texte intégral quand il
      existe — version déposée par l’auteur, dépôt universitaire ou publication officielle.</div>
    <textarea data-rd="q" placeholder="ex. : malaïgue étang de Thau 2018 — ou 10.1016/j.marpolbul.2019.01.023"></textarea>
    <div class="rd-etat" data-rd="etat"></div>
    <div class="rd-liste" data-rd="liste"></div>
    <div class="rd-legal">Aucun miroir pirate : une version déposée par l’auteur se cite,
      s’archive et reste joignable. Pour de l’OSINT, c’est aussi la seule chaîne de
      provenance défendable. Si rien ne sort, la bibliothèque universitaire de Montpellier
      et le prêt entre bibliothèques obtiennent l’article gratuitement.</div>`;

  const champ = el.querySelector('[data-rd="q"]');
  const etat = el.querySelector('[data-rd="etat"]');
  const liste = el.querySelector('[data-rd="liste"]');

  /** Recalcule le plan et repeint la liste. */
  const peindre = () => {
    const texte = String(champ.value || '').trim();
    const doi = normaliserDoi(texte) || extraireDoi(texte);
    const plan = texte ? planDeRecherche({ texte, doi }) : SOURCES_DOCUMENTS;

    etat.className = `rd-etat${doi ? ' rd-doi' : ''}`;
    if (!texte) etat.textContent = `${SOURCES_DOCUMENTS.length} sources légales disponibles.`;
    else if (doi) etat.textContent = `DOI reconnu : ${doi} — résolution directe possible.`;
    else etat.textContent = 'Recherche par mots — sources françaises en premier.';

    liste.textContent = '';
    for (const s of plan) {
      const url = texte ? urlPour(s.id, { texte, doi }) : '';
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'rd-src';
      b.title = s.note;
      if (!url) b.disabled = true;
      b.innerHTML = `<span class="rd-nom">${s.nom}</span>`
        + `${s.portee === 'france' ? '<span class="rd-fr">FR</span>' : ''}`
        + `<span class="rd-genre">${s.genre}</span>`;
      b.addEventListener('click', () => {
        if (!url) return;
        ouvrirUrl(url);
        options.surMessage?.(`📄 ${s.nom} ouvert — ${s.genre}`);
      });
      liste.appendChild(b);
    }
    return plan;
  };

  champ.addEventListener('input', peindre);
  peindre();

  return {
    element: el,
    chercher: (texte) => { champ.value = texte; return peindre(); },
    plan: peindre,
  };
}
