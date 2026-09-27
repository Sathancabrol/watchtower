/**
 * WATCHTOWER — VUE GRAPHE DE CONNAISSANCES (façon Obsidian).
 *
 * Rend le graphe territorial en plein écran : un nœud par fiche, une arête
 * par relation, disposés par une petite simulation de forces écrite à la
 * main (ressorts sur les arêtes, répulsion entre nœuds, rappel au centre).
 * Aucune dépendance : ni D3, ni bibliothèque de graphe.
 *
 * Interactions : survol pour mettre en évidence le voisinage, clic pour
 * ouvrir la fiche, glisser pour déplacer un nœud, molette pour zoomer,
 * glisser le fond pour se déplacer, recherche et filtre par catégorie.
 */

import { NOEUDS, voisins } from './data/territoire/grapheThau.js';

const ech = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/** Couleur par catégorie — la légende s'en sert aussi. */
export const COULEURS = Object.freeze({
  gouvernance: '#00d4ff',
  commune: '#6dffa8',
  milieu: '#4dd2ff',
  economie: '#ffd36d',
  socio: '#c79cff',
  projet: '#ff9c6d',
  enjeu: '#ff6d8f',
  histoire: '#9aa7b4',
});

/** Libellé lisible de chaque catégorie. */
export const LIBELLES = Object.freeze({
  gouvernance: 'Gouvernance',
  commune: 'Communes',
  milieu: 'Milieux naturels',
  economie: 'Économie',
  socio: 'Socio-démographie',
  projet: 'Projets',
  enjeu: 'Enjeux',
  histoire: 'Histoire',
});

/**
 * Construit la liste des arêtes uniques (paires non orientées).
 * @returns {Array<{a:string, b:string}>}
 */
export function aretes() {
  const vues = new Set();
  const out = [];
  const cles = new Set(NOEUDS.map((n) => n.cle));
  for (const n of NOEUDS) {
    for (const l of n.liens || []) {
      if (!cles.has(l)) continue;
      const paire = [n.cle, l].sort().join('|');
      if (vues.has(paire)) continue;
      vues.add(paire);
      out.push({ a: n.cle, b: l });
    }
  }
  return out;
}

/**
 * Prépare les nœuds de la simulation : position initiale en cercle (stable
 * et reproductible, contrairement à un tirage aléatoire) et degré.
 * @param {number} largeur
 * @param {number} hauteur
 */
export function disposerInitial(largeur = 1000, hauteur = 700) {
  const liens = aretes();
  const degre = new Map();
  for (const e of liens) {
    degre.set(e.a, (degre.get(e.a) || 0) + 1);
    degre.set(e.b, (degre.get(e.b) || 0) + 1);
  }
  const R = Math.min(largeur, hauteur) * 0.36;
  return NOEUDS.map((n, i) => {
    const t = (i / NOEUDS.length) * Math.PI * 2;
    return {
      cle: n.cle,
      nom: n.nom,
      categorie: n.categorie,
      degre: degre.get(n.cle) || 0,
      x: largeur / 2 + Math.cos(t) * R,
      y: hauteur / 2 + Math.sin(t) * R,
      vx: 0,
      vy: 0,
      fixe: false,
    };
  });
}

/**
 * Un pas de simulation de forces. Exporté pour être testable sans navigateur.
 * @param {object[]} noeuds mutés sur place
 * @param {Array<{a:string,b:string}>} liens
 * @param {{largeur:number, hauteur:number, ressort?:number, repulsion?:number, frein?:number}} opts
 */
export function pasSimulation(noeuds, liens, opts = {}) {
  const {
    largeur = 1000, hauteur = 700,
    ressort = 0.006, longueur = 150, repulsion = 9000, frein = 0.86, gravite = 0.0025,
  } = opts;
  const index = new Map(noeuds.map((n) => [n.cle, n]));

  // répulsion : tout le monde se repousse (O(n²), acceptable à ~30 nœuds)
  for (let i = 0; i < noeuds.length; i += 1) {
    for (let j = i + 1; j < noeuds.length; j += 1) {
      const a = noeuds[i];
      const b = noeuds[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = (i - j) || 1; dy = 1; d2 = 2; }
      const f = repulsion / d2;
      const d = Math.sqrt(d2);
      const ux = dx / d;
      const uy = dy / d;
      a.vx -= ux * f; a.vy -= uy * f;
      b.vx += ux * f; b.vy += uy * f;
    }
  }

  // ressorts sur les arêtes
  for (const e of liens) {
    const a = index.get(e.a);
    const b = index.get(e.b);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const f = (d - longueur) * ressort;
    const ux = dx / d;
    const uy = dy / d;
    a.vx += ux * f; a.vy += uy * f;
    b.vx -= ux * f; b.vy -= uy * f;
  }

  // rappel au centre + intégration
  for (const n of noeuds) {
    if (n.fixe) { n.vx = 0; n.vy = 0; continue; }
    n.vx += (largeur / 2 - n.x) * gravite;
    n.vy += (hauteur / 2 - n.y) * gravite;
    n.vx *= frein;
    n.vy *= frein;
    n.x += Math.max(-30, Math.min(30, n.vx));
    n.y += Math.max(-30, Math.min(30, n.vy));
  }
  return noeuds;
}

/** Énergie cinétique du système — sert à savoir quand la mise en page est stable. */
export function energie(noeuds) {
  return noeuds.reduce((s, n) => s + n.vx * n.vx + n.vy * n.vy, 0);
}

const CSS = `
#wt-graphe {
  position: fixed; inset: 0; z-index: 4100; background: #05090e;
  display: flex; flex-direction: column; color: #e8eaed;
  font-family: var(--font-sans, system-ui, sans-serif);
}
#wt-graphe .gr-tete {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 16px; border-bottom: 1px solid rgba(0,212,255,0.22); background: rgba(0,0,0,0.45);
}
#wt-graphe .gr-tete h3 {
  margin: 0; font-size: 11px; letter-spacing: 2.5px; color: #00d4ff; font-weight: 800;
  font-family: var(--font-mono, monospace);
}
#wt-graphe input[type=search], #wt-graphe select {
  background: rgba(0,0,0,0.5); border: 1px solid rgba(0,212,255,0.3); color: #e8eaed;
  border-radius: 6px; padding: 7px 10px; font: inherit; font-size: 12px; min-height: 34px;
}
#wt-graphe input[type=search] { min-width: 190px; }
#wt-graphe .gr-tete button {
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4); color: #e8eaed;
  border-radius: 6px; padding: 8px 14px; font-size: 12px; cursor: pointer; min-height: 34px;
}
#wt-graphe .gr-tete button:hover { background: rgba(0,212,255,0.26); }
#wt-graphe .gr-corps { flex: 1; position: relative; overflow: hidden; }
#wt-graphe canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; display: block; }
#wt-graphe canvas.gr-tire { cursor: grabbing; }
#wt-graphe .gr-legende {
  position: absolute; left: 14px; bottom: 14px; display: flex; flex-direction: column; gap: 4px;
  background: rgba(4,10,16,0.82); border: 1px solid rgba(0,212,255,0.22);
  border-radius: 8px; padding: 9px 11px; font-size: 11px; pointer-events: none;
}
#wt-graphe .gr-legende i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 7px; }
#wt-graphe .gr-fiche {
  position: absolute; right: 14px; top: 14px; width: 330px; max-height: calc(100% - 28px);
  overflow-y: auto; background: rgba(4,10,16,0.94); border: 1px solid rgba(0,212,255,0.3);
  border-radius: 8px; padding: 14px 16px; font-size: 12.5px; line-height: 1.55;
}
#wt-graphe .gr-fiche h4 { margin: 0 0 4px; font-size: 16px; color: #fff; }
#wt-graphe .gr-fiche .gr-type { font-size: 10px; letter-spacing: 1.4px; color: #00d4ff; margin-bottom: 10px; }
#wt-graphe .gr-fiche ul { margin: 6px 0 0; padding-left: 17px; }
#wt-graphe .gr-fiche li { margin-bottom: 4px; }
#wt-graphe .gr-flou { color: #ffd36d; }
#wt-graphe .gr-fiche .gr-fermer {
  float: right; background: none; border: 1px solid rgba(255,96,96,0.45); color: #ff9c9c;
  border-radius: 5px; width: 28px; height: 28px; cursor: pointer; font-size: 14px; line-height: 1;
}
#wt-graphe .gr-astuce {
  position: absolute; left: 14px; top: 14px; font-size: 11px; color: rgba(232,234,237,0.5);
  background: rgba(4,10,16,0.7); border-radius: 6px; padding: 6px 10px; pointer-events: none;
}
`;

/**
 * Ouvre la vue graphe plein écran.
 * @param {{surFiche?:Function}} [options] `surFiche(cle)` est appelé au clic
 * @returns {{fermer:Function}|null}
 */
export function ouvrirGraphe(options = {}) {
  if (typeof document === 'undefined') return null;
  if (!document.getElementById('wt-graphe-css')) {
    const st = document.createElement('style');
    st.id = 'wt-graphe-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.getElementById('wt-graphe')?.remove();

  const hote = document.createElement('div');
  hote.id = 'wt-graphe';
  hote.innerHTML = `
    <div class="gr-tete">
      <h3>🕸 GRAPHE DE CONNAISSANCES — BASSIN DE THAU</h3>
      <input type="search" placeholder="Rechercher une fiche…" data-g="q">
      <select data-g="cat">
        <option value="">Toutes les catégories</option>
        ${Object.keys(LIBELLES).map((c) => `<option value="${c}">${ech(LIBELLES[c])}</option>`).join('')}
      </select>
      <button type="button" data-g="relancer">↻ Réorganiser</button>
      <button type="button" data-g="fermer">✕ Fermer</button>
    </div>
    <div class="gr-corps">
      <canvas></canvas>
      <div class="gr-astuce">Survolez un nœud pour voir ses liens · cliquez pour la fiche · glissez pour déplacer · molette pour zoomer</div>
      <div class="gr-legende">
        ${Object.keys(LIBELLES).map((c) => `<span><i style="background:${COULEURS[c]}"></i>${ech(LIBELLES[c])}</span>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(hote);

  const corps = hote.querySelector('.gr-corps');
  const toile = hote.querySelector('canvas');
  const ctx = toile.getContext('2d');
  const liens = aretes();
  let noeuds = disposerInitial(corps.clientWidth || 1000, corps.clientHeight || 700);
  const parCle = () => new Map(noeuds.map((n) => [n.cle, n]));

  let echelle = 1;
  let decX = 0;
  let decY = 0;
  let survol = null;
  let choisi = null;
  let filtreTexte = '';
  let filtreCat = '';
  let tire = null;
  let glisseFond = null;
  let anim = 0;

  function dimensionner() {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.max(1, corps.clientWidth * r);
    toile.height = Math.max(1, corps.clientHeight * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }

  /** Un nœud passe-t-il les filtres courants ? */
  const visible = (n) => (!filtreCat || n.categorie === filtreCat)
    && (!filtreTexte || n.nom.toLowerCase().includes(filtreTexte));

  /** Voisinage du nœud mis en évidence (survol ou sélection). */
  function ensembleActif() {
    const c = survol || choisi;
    if (!c) return null;
    const s = new Set([c]);
    for (const v of voisins(c)) s.add(v.cle);
    return s;
  }

  const versEcran = (n) => ({ x: n.x * echelle + decX, y: n.y * echelle + decY });
  const rayon = (n) => 5 + Math.min(11, n.degre * 1.15);

  function peindre() {
    const L = corps.clientWidth;
    const H = corps.clientHeight;
    ctx.clearRect(0, 0, L, H);
    const actif = ensembleActif();
    const idx = parCle();

    // arêtes
    for (const e of liens) {
      const a = idx.get(e.a);
      const b = idx.get(e.b);
      if (!a || !b || !visible(a) || !visible(b)) continue;
      const pa = versEcran(a);
      const pb = versEcran(b);
      const enVue = actif && (actif.has(e.a) && actif.has(e.b));
      ctx.strokeStyle = enVue ? 'rgba(0,212,255,0.75)' : (actif ? 'rgba(120,140,160,0.1)' : 'rgba(120,140,160,0.26)');
      ctx.lineWidth = enVue ? 1.9 : 1;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // nœuds
    for (const n of noeuds) {
      if (!visible(n)) continue;
      const p = versEcran(n);
      const r = rayon(n) * Math.min(1.6, echelle);
      const dedans = !actif || actif.has(n.cle);
      ctx.globalAlpha = dedans ? 1 : 0.16;
      ctx.fillStyle = COULEURS[n.categorie] || '#8fa0b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (n.cle === choisi || n.cle === survol) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // libellé : toujours pour le voisinage actif, sinon au-delà d'un zoom
      if (dedans && (actif || echelle > 0.75 || n.degre >= 6)) {
        ctx.fillStyle = dedans ? 'rgba(232,234,237,0.95)' : 'rgba(232,234,237,0.4)';
        ctx.font = `${Math.max(10, 11 * Math.min(1.4, echelle))}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.nom.length > 30 ? `${n.nom.slice(0, 29)}…` : n.nom, p.x, p.y + r + 13);
      }
      ctx.globalAlpha = 1;
    }
  }

  function boucle() {
    pasSimulation(noeuds, liens, { largeur: corps.clientWidth, hauteur: corps.clientHeight });
    peindre();
    // on continue tant que ça bouge, puis on s'arrête pour ne pas chauffer le CPU
    anim = energie(noeuds) > 0.4 ? requestAnimationFrame(boucle) : 0;
  }
  const reveiller = () => { if (!anim) anim = requestAnimationFrame(boucle); };

  /** Nœud sous le curseur, le cas échéant. */
  function noeudSous(ex, ey) {
    for (let i = noeuds.length - 1; i >= 0; i -= 1) {
      const n = noeuds[i];
      if (!visible(n)) continue;
      const p = versEcran(n);
      if (Math.hypot(p.x - ex, p.y - ey) <= rayon(n) * Math.min(1.6, echelle) + 5) return n;
    }
    return null;
  }

  /** Panneau latéral de la fiche sélectionnée. */
  function montrerFiche(cle) {
    hote.querySelector('.gr-fiche')?.remove();
    const n = NOEUDS.find((x) => x.cle === cle);
    if (!n) return;
    const d = document.createElement('div');
    d.className = 'gr-fiche';
    d.innerHTML = `
      <button type="button" class="gr-fermer" data-g="fiche-fermer" title="Fermer">✕</button>
      <h4>${ech(n.nom)}</h4>
      <div class="gr-type">${ech(n.type)}</div>
      <div>${ech(n.resume)}</div>
      <ul>${(n.attributs || []).map((at) => {
        const m = at.fiable ? '' : '<span class="gr-flou">~ </span>';
        const s = at.fiable ? '' : ' <span class="gr-flou">(à vérifier)</span>';
        return `<li><b>${ech(at.libelle)}</b> : ${m}${ech(at.valeur)}${s}</li>`;
      }).join('')}</ul>
      <div style="margin-top:10px;font-size:11px;color:rgba(232,234,237,0.6)">
        <b>Relié à</b> : ${voisins(n.cle).map((v) => ech(v.nom)).join(' · ') || '—'}
      </div>`;
    corps.appendChild(d);
  }

  // ── interactions ──
  const pos = (e) => {
    const r = toile.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  toile.addEventListener('mousedown', (e) => {
    const p = pos(e);
    const n = noeudSous(p.x, p.y);
    if (n) {
      tire = { n, dx: p.x - versEcran(n).x, dy: p.y - versEcran(n).y, bouge: false };
      n.fixe = true;
    } else {
      glisseFond = { x: e.clientX - decX, y: e.clientY - decY };
      toile.classList.add('gr-tire');
    }
  });

  toile.addEventListener('mousemove', (e) => {
    const p = pos(e);
    if (tire) {
      tire.bouge = true;
      tire.n.x = (p.x - tire.dx - decX) / echelle;
      tire.n.y = (p.y - tire.dy - decY) / echelle;
      reveiller();
      return;
    }
    if (glisseFond) {
      decX = e.clientX - glisseFond.x;
      decY = e.clientY - glisseFond.y;
      peindre();
      return;
    }
    const n = noeudSous(p.x, p.y);
    const cle = n ? n.cle : null;
    if (cle !== survol) {
      survol = cle;
      toile.style.cursor = cle ? 'pointer' : 'grab';
      peindre();
    }
  });

  const relacher = () => {
    if (tire) {
      tire.n.fixe = false;
      if (!tire.bouge) {
        choisi = tire.n.cle;
        montrerFiche(choisi);
        options.surFiche?.(choisi);
      }
      tire = null;
      reveiller();
    }
    glisseFond = null;
    toile.classList.remove('gr-tire');
  };
  toile.addEventListener('mouseup', relacher);
  toile.addEventListener('mouseleave', () => { relacher(); survol = null; peindre(); });

  toile.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = pos(e);
    const avant = echelle;
    echelle = Math.max(0.3, Math.min(3.5, echelle * (e.deltaY < 0 ? 1.12 : 0.89)));
    // zoom centré sur le curseur
    decX = p.x - ((p.x - decX) / avant) * echelle;
    decY = p.y - ((p.y - decY) / avant) * echelle;
    peindre();
  }, { passive: false });

  hote.addEventListener('click', (e) => {
    const g = e.target?.dataset?.g;
    if (g === 'fermer') fermer();
    else if (g === 'fiche-fermer') { hote.querySelector('.gr-fiche')?.remove(); choisi = null; peindre(); }
    else if (g === 'relancer') {
      noeuds = disposerInitial(corps.clientWidth, corps.clientHeight);
      reveiller();
    }
  });
  hote.querySelector('[data-g="q"]').addEventListener('input', (e) => {
    filtreTexte = String(e.target.value || '').trim().toLowerCase();
    peindre();
  });
  hote.querySelector('[data-g="cat"]').addEventListener('change', (e) => {
    filtreCat = e.target.value;
    peindre();
  });

  function clavier(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
  document.addEventListener('keydown', clavier);

  const surRedim = () => { dimensionner(); peindre(); };
  window.addEventListener('resize', surRedim);

  function fermer() {
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
    document.removeEventListener('keydown', clavier);
    window.removeEventListener('resize', surRedim);
    hote.remove();
  }

  dimensionner();
  reveiller();
  return { fermer, hote };
}
