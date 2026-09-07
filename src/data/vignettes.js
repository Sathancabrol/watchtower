/**
 * WATCHTOWER — VIGNETTES « ANALOGIQUES » DU PALAIS MENTAL.
 *
 * Le tableau du palais mental affiche les dossiers comme sur un mur
 * d'enquêteur : photos aériennes, mugshots, polaroïds, plans, planches
 * contact. Tout est **généré en SVG** (aucune image, aucun réseau, aucune
 * dépendance) et **déterministe** : le même identifiant donne toujours la même
 * vignette (graine), pour qu'on reconnaisse un dossier au premier coup d'œil.
 *
 * Pur : pas de DOM, pas de Cesium → testé dans `vignettes.test.mjs`.
 */

/** Petit générateur pseudo-aléatoire déterministe (mulberry32). */
export function graineDe(texte = '') {
  let h = 2166136261;
  const s = String(texte);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Échappe le texte pour un attribut / contenu SVG. */
export function echapper(texte = '') {
  return String(texte)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Coupe proprement (pour les légendes manuscrites). */
export function tronquer(texte = '', n = 22) {
  const t = String(texte || '').trim();
  return t.length <= n ? t : `${t.slice(0, Math.max(1, n - 1))}…`;
}

const PALETTES = [
  { fond: '#1b2430', trait: '#7f8c9b', accent: '#d8c9a3', sol: '#243040' }, // nuit urbaine
  { fond: '#2a2118', trait: '#8a7658', accent: '#e8d9b0', sol: '#33291d' }, // sépia
  { fond: '#16222a', trait: '#5f7f8f', accent: '#9fe3ff', sol: '#1c2b34' }, // bleu nuit
  { fond: '#231a24', trait: '#8a6a8f', accent: '#ffc7e8', sol: '#2c2130' }, // néon rose
];

/**
 * Vignette « photo aérienne » : îlots, routes, un point d'intérêt.
 * @param {{titre?:string, graine?:string, taille?:number}} [options]
 * @returns {string} SVG autonome
 */
export function vignetteAerienne({ titre = '', graine = 'aerien', taille = 240 } = {}) {
  const rnd = graineDe(graine);
  const p = PALETTES[Math.floor(rnd() * PALETTES.length)];
  const T = Math.max(80, Number(taille) || 240);
  const morceaux = [];
  morceaux.push(`<rect width="${T}" height="${T}" fill="${p.fond}"/>`);
  // îlots (quadrillage irrégulier)
  const cols = 4 + Math.floor(rnd() * 3);
  const pas = T / cols;
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      if (rnd() < 0.18) continue;
      const m = pas * (0.08 + rnd() * 0.12);
      const x = i * pas + m; const y = j * pas + m;
      const w = pas - m * 2 * (0.7 + rnd() * 0.6); const h = pas - m * 2 * (0.7 + rnd() * 0.6);
      if (w <= 1 || h <= 1) continue;
      const ton = 0.25 + rnd() * 0.5;
      morceaux.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${p.sol}" fill-opacity="${ton.toFixed(2)}" stroke="${p.trait}" stroke-opacity=".35" stroke-width=".6"/>`);
    }
  }
  // routes
  for (let k = 0; k < 3; k += 1) {
    const horizontal = rnd() > 0.5;
    const pos = (0.2 + rnd() * 0.6) * T;
    morceaux.push(horizontal
      ? `<rect x="0" y="${pos.toFixed(1)}" width="${T}" height="${(1.5 + rnd() * 2).toFixed(1)}" fill="${p.trait}" fill-opacity=".45"/>`
      : `<rect x="${pos.toFixed(1)}" y="0" width="${(1.5 + rnd() * 2).toFixed(1)}" height="${T}" fill="${p.trait}" fill-opacity=".45"/>`);
  }
  // cible
  const cx = (0.25 + rnd() * 0.5) * T; const cy = (0.25 + rnd() * 0.5) * T;
  morceaux.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(T * 0.09).toFixed(1)}" fill="none" stroke="${p.accent}" stroke-width="1.6" stroke-opacity=".95"/>`);
  morceaux.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2" fill="${p.accent}"/>`);
  morceaux.push(`<line x1="${(cx - T * 0.14).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx - T * 0.05).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${p.accent}" stroke-width="1"/>`);
  morceaux.push(`<line x1="${(cx + T * 0.05).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + T * 0.14).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${p.accent}" stroke-width="1"/>`);
  if (titre) {
    morceaux.push(`<text x="8" y="${T - 8}" font-family="monospace" font-size="${Math.max(8, T * 0.05)}" fill="${p.accent}" fill-opacity=".8">${echapper(tronquer(titre, 26))}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${morceaux.join('')}</svg>`;
}

/**
 * Vignette « mugshot » : silhouette + échelle de hauteur, façon fiche.
 */
export function vignetteMugshot({ titre = '', graine = 'mugshot', taille = 240 } = {}) {
  const rnd = graineDe(graine);
  const T = Math.max(80, Number(taille) || 240);
  const p = PALETTES[Math.floor(rnd() * PALETTES.length)];
  const m = [];
  m.push(`<rect width="${T}" height="${T}" fill="#0e1418"/>`);
  // échelle
  for (let i = 1; i < 8; i += 1) {
    const y = (i / 8) * T;
    m.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${T}" y2="${y.toFixed(1)}" stroke="#2b3a44" stroke-width=".6"/>`);
  }
  // silhouette (tête + buste)
  const cx = T * 0.5; const r = T * 0.11;
  m.push(`<circle cx="${cx}" cy="${T * 0.3}" r="${r}" fill="${p.trait}" fill-opacity=".75"/>`);
  m.push(`<path d="M ${cx - T * 0.2} ${T} L ${cx - T * 0.18} ${T * 0.52} Q ${cx} ${T * 0.42} ${cx + T * 0.18} ${T * 0.52} L ${cx + T * 0.2} ${T} Z" fill="${p.trait}" fill-opacity=".6"/>`);
  // bandeau de titre
  m.push(`<rect x="0" y="${T * 0.78}" width="${T}" height="${T * 0.22}" fill="#000" fill-opacity=".55"/>`);
  if (titre) m.push(`<text x="${T / 2}" y="${T * 0.9}" text-anchor="middle" font-family="monospace" font-size="${Math.max(8, T * 0.055)}" fill="${p.accent}">${echapper(tronquer(titre, 24))}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${m.join('')}</svg>`;
}

/**
 * Vignette « polaroïd » : photo, marge blanche, légende manuscrite, scotch.
 */
export function vignettePolaroid({ titre = '', graine = 'polaroid', taille = 240, teinte = null } = {}) {
  const rnd = graineDe(graine);
  const T = Math.max(80, Number(taille) || 240);
  const marg = T * 0.09;
  const ph = T - marg * 2.4;
  const couleurs = ['#3a4a5a', '#5a4a3a', '#2f4a3f', '#4a3a4a'];
  const fond = teinte || couleurs[Math.floor(rnd() * couleurs.length)];
  const m = [];
  m.push(`<rect width="${T}" height="${T}" fill="#efe9dc"/>`);
  m.push(`<rect x="${marg}" y="${marg}" width="${T - marg * 2}" height="${ph}" fill="${fond}"/>`);
  // contenu abstrait : silhouettes + horizon
  m.push(`<rect x="${marg}" y="${marg + ph * 0.62}" width="${T - marg * 2}" height="${ph * 0.38}" fill="#000" fill-opacity=".28"/>`);
  for (let i = 0; i < 4; i += 1) {
    const x = marg + (rnd() * (T - marg * 2 - T * 0.08));
    const h = ph * (0.2 + rnd() * 0.45);
    m.push(`<rect x="${x.toFixed(1)}" y="${(marg + ph * 0.62 - h).toFixed(1)}" width="${(T * 0.05).toFixed(1)}" height="${h.toFixed(1)}" fill="#000" fill-opacity="${(0.2 + rnd() * 0.3).toFixed(2)}"/>`);
  }
  m.push(`<circle cx="${(T * 0.7).toFixed(1)}" cy="${(marg + ph * 0.25).toFixed(1)}" r="${(T * 0.05).toFixed(1)}" fill="#fff" fill-opacity=".25"/>`);
  // légende
  if (titre) {
    m.push(`<text x="${T / 2}" y="${T - marg * 0.55}" text-anchor="middle" font-family="'Bradley Hand', cursive, monospace" font-size="${Math.max(9, T * 0.075)}" fill="#2b2b2b">${echapper(tronquer(titre, 20))}</text>`);
  }
  // scotch
  m.push(`<rect x="${T * 0.36}" y="2" width="${T * 0.28}" height="${T * 0.06}" fill="#d8cfae" fill-opacity=".75" transform="rotate(-3 ${T * 0.5} ${T * 0.03})"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${m.join('')}</svg>`;
}

/**
 * Vignette « plan / blueprint » : fond bleu, traits blancs, cotation.
 */
export function vignettePlan({ titre = '', graine = 'plan', taille = 240 } = {}) {
  const rnd = graineDe(graine);
  const T = Math.max(80, Number(taille) || 240);
  const m = [];
  m.push(`<rect width="${T}" height="${T}" fill="#0d2438"/>`);
  for (let i = 0; i <= 10; i += 1) {
    const v = (i / 10) * T;
    m.push(`<line x1="${v}" y1="0" x2="${v}" y2="${T}" stroke="#9fd8ff" stroke-opacity=".07" stroke-width=".6"/>`);
    m.push(`<line x1="0" y1="${v}" x2="${T}" y2="${v}" stroke="#9fd8ff" stroke-opacity=".07" stroke-width=".6"/>`);
  }
  // pièces
  const pieces = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < pieces; i += 1) {
    const x = rnd() * T * 0.6; const y = rnd() * T * 0.6;
    const w = T * (0.18 + rnd() * 0.3); const h = T * (0.15 + rnd() * 0.3);
    m.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="#9fd8ff" stroke-opacity=".55" stroke-width="1.1"/>`);
  }
  // cotation
  m.push(`<line x1="${T * 0.1}" y1="${T * 0.9}" x2="${T * 0.9}" y2="${T * 0.9}" stroke="#9fd8ff" stroke-opacity=".7" stroke-width="1"/>`);
  m.push(`<line x1="${T * 0.1}" y1="${T * 0.87}" x2="${T * 0.1}" y2="${T * 0.93}" stroke="#9fd8ff" stroke-opacity=".7"/>`);
  m.push(`<line x1="${T * 0.9}" y1="${T * 0.87}" x2="${T * 0.9}" y2="${T * 0.93}" stroke="#9fd8ff" stroke-opacity=".7"/>`);
  if (titre) m.push(`<text x="8" y="16" font-family="monospace" font-size="${Math.max(8, T * 0.055)}" fill="#9fd8ff">${echapper(tronquer(titre, 26))}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${m.join('')}</svg>`;
}

/**
 * Vignette « planche contact / vidéo » : bande de film, plusieurs images.
 */
export function vignetteVideo({ titre = '', graine = 'video', taille = 240, images = 4 } = {}) {
  const rnd = graineDe(graine);
  const T = Math.max(80, Number(taille) || 240);
  const n = Math.max(2, Math.min(6, Math.round(images) || 4));
  const h = T / n;
  const m = [];
  m.push(`<rect width="${T}" height="${T}" fill="#141013"/>`);
  for (let i = 0; i < n; i += 1) {
    const y = i * h + 3;
    const hh = h - 6;
    const teinte = 0.15 + rnd() * 0.35;
    m.push(`<rect x="8" y="${y}" width="${T - 16}" height="${hh}" fill="#8fa3b0" fill-opacity="${teinte.toFixed(2)}" stroke="#3a4650" stroke-width=".8"/>`);
    // une silhouette qui « avance » d'une image à l'autre
    const px = 8 + ((T - 16) * ((i + 0.5) / n));
    m.push(`<circle cx="${px.toFixed(1)}" cy="${(y + hh * 0.42).toFixed(1)}" r="${(hh * 0.14).toFixed(1)}" fill="#e8eaed" fill-opacity=".5"/>`);
    m.push(`<rect x="${(px - hh * 0.12).toFixed(1)}" y="${(y + hh * 0.58).toFixed(1)}" width="${(hh * 0.24).toFixed(1)}" height="${(hh * 0.34).toFixed(1)}" fill="#e8eaed" fill-opacity=".35"/>`);
    // perforations
    m.push(`<rect x="1" y="${(y + hh * 0.3).toFixed(1)}" width="5" height="${(hh * 0.4).toFixed(1)}" fill="#2a3038"/>`);
    m.push(`<rect x="${T - 6}" y="${(y + hh * 0.3).toFixed(1)}" width="5" height="${(hh * 0.4).toFixed(1)}" fill="#2a3038"/>`);
  }
  if (titre) {
    m.push(`<rect x="0" y="${T - 20}" width="${T}" height="20" fill="#000" fill-opacity=".6"/>`);
    m.push(`<text x="8" y="${T - 6}" font-family="monospace" font-size="${Math.max(8, T * 0.05)}" fill="#ffd27a">▶ ${echapper(tronquer(titre, 24))}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${m.join('')}</svg>`;
}

/** Types de vignettes disponibles (pour le tableau du palais). */
export const TYPES_VIGNETTE = Object.freeze({
  aerien: vignetteAerienne,
  mugshot: vignetteMugshot,
  polaroid: vignettePolaroid,
  plan: vignettePlan,
  video: vignetteVideo,
});

/**
 * Fabrique une vignette depuis un type (repli : polaroïd).
 * @param {string} type
 * @param {object} options
 */
export function vignette(type, options = {}) {
  const f = TYPES_VIGNETTE[String(type || '').toLowerCase()] || vignettePolaroid;
  return f(options);
}

/** Emballe du SVG en URL de données (pour un `<img>`). */
export function svgEnUrl(svg = '') {
  const s = String(svg || '').trim();
  if (!s) return '';
  try {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.replace(/\n\s*/g, ' '))}`;
  } catch {
    return '';
  }
}
