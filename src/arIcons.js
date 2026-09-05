/**
 * WATCHTOWER — ICÔNES AR FLOTTANTES (couche « réalité augmentée »).
 *
 * Dans la VUE COMMUNALE, après le tracé animé du contour, une couche AR
 * fait flotter des icônes au-dessus de la ville : une icône par équipement
 * réel, habillée par CATÉGORIE (santé = croix suisse + barre de vie,
 * bonheur = cœur + barre, éducation, économie, services publics…).
 * Cliquer une icône active TOUS les bâtiments 3D de sa catégorie et affiche
 * leur icône flottante au-dessus du toit.
 *
 * Style : aplats saturés, contour noir épais, ombre portée, barre segmentée
 * — le rendu « jeu » (GTA San Andreas) demandé, lisible à toute distance.
 *
 * Le dessin est du canvas pur : en l'absence de `document` (tests node) les
 * fabriques de sprites renvoient `null` sans lever d'erreur.
 */

/** @returns {HTMLCanvasElement|null} */
function nouveauCanvas(taille) {
  if (typeof document === 'undefined' || !document.createElement) return null;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  return c;
}

/**
 * Catégories AR. `liste` = clé des listes du jumeau INTEL, `indice` = clé de
 * l'indicateur (0-100) affiché par la barre, `filtre` = requête Overpass de
 * repli quand l'analyse INTEL n'a pas encore tourné.
 */
export const CATEGORIES_AR = Object.freeze([
  {
    id: 'sante',
    nom: 'SANTÉ',
    glyphe: 'croix-suisse',
    couleur: '#ff2d55',
    liste: 'sante',
    indice: 'sante',
    filtre: 'amenity~"hospital|clinic|doctors|pharmacy|dentist"',
    legende: 'hôpitaux, cliniques, pharmacies',
  },
  {
    id: 'education',
    nom: 'ÉCOLES',
    glyphe: 'livre',
    couleur: '#2ecc71',
    liste: 'ecoles',
    indice: 'edu',
    filtre: 'amenity~"school|college|kindergarten|university"',
    legende: 'écoles, collèges, universités',
  },
  {
    id: 'economie',
    nom: 'ÉCONOMIE',
    glyphe: 'sac',
    couleur: '#ffe14d',
    liste: 'commerces',
    indice: 'eco',
    filtre: 'shop',
    legende: 'commerces et activités',
  },
  {
    id: 'services',
    nom: 'SERVICES',
    glyphe: 'mairie',
    couleur: '#ffb020',
    liste: 'services',
    indice: 'res',
    filtre: 'amenity~"townhall|police|fire_station|post_office|library|community_centre"',
    legende: 'mairie, secours, poste, bibliothèque',
  },
  {
    id: 'bonheur',
    nom: 'BONHEUR',
    glyphe: 'coeur',
    couleur: '#ff5ec4',
    liste: 'vert',
    indice: 'bonheur',
    filtre: 'leisure~"park|garden|playground|sports_centre"',
    legende: 'parcs, jardins, loisirs',
  },
]);

/** Catégorie AR par identifiant. */
export function categorieAR(id) {
  return CATEGORIES_AR.find((c) => c.id === id) || null;
}

/** Couleur de la barre de vie selon la valeur (0-100) : vert → jaune → rouge. */
export function couleurBarre(valeur) {
  const v = Math.max(0, Math.min(100, Number(valeur) || 0));
  if (v >= 60) return ['#43d17a', '#1f8f4d'];
  if (v >= 40) return ['#e8c04a', '#a37f10'];
  return ['#f05252', '#8f1f1f'];
}

// ── glyphes (dessinés dans un carré de côté `s`, coin haut-gauche x,y) ──

function glypheCroixSuisse(ctx, x, y, s, couleur = '#ffffff') {
  const bras = s * 0.66;
  const ep = s * 0.21;
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.rect(cx - ep / 2, cy - bras / 2, ep, bras);
  ctx.rect(cx - bras / 2, cy - ep / 2, bras, ep);
  ctx.fill();
}

function glypheCoeur(ctx, x, y, s, couleur = '#ffffff') {
  const cx = x + s / 2;
  const cy = y + s * 0.38;
  const w = s * 0.62;
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.moveTo(cx, y + s * 0.86);
  ctx.bezierCurveTo(x + s * 0.02, y + s * 0.52, cx - w / 2, y + s * 0.34, cx - w / 2, cy);
  ctx.bezierCurveTo(cx - w / 2, y + s * 0.16, cx - w * 0.12, y + s * 0.12, cx, y + s * 0.34);
  ctx.bezierCurveTo(cx + w * 0.12, y + s * 0.12, cx + w / 2, y + s * 0.16, cx + w / 2, cy);
  ctx.bezierCurveTo(cx + w / 2, y + s * 0.34, x + s * 0.98, y + s * 0.52, cx, y + s * 0.86);
  ctx.closePath();
  ctx.fill();
}

function glypheLivre(ctx, x, y, s, couleur = '#ffffff') {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.26);
  ctx.lineTo(x + s * 0.16, y + s * 0.20);
  ctx.lineTo(x + s * 0.16, y + s * 0.80);
  ctx.lineTo(x + s * 0.5, y + s * 0.86);
  ctx.lineTo(x + s * 0.84, y + s * 0.80);
  ctx.lineTo(x + s * 0.84, y + s * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0b0e14';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.26);
  ctx.lineTo(x + s * 0.5, y + s * 0.86);
  ctx.stroke();
}

function glypheSac(ctx, x, y, s, couleur = '#ffffff') {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.rect(x + s * 0.18, y + s * 0.38, s * 0.64, s * 0.48);
  ctx.fill();
  ctx.strokeStyle = couleur;
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.arc(x + s * 0.5, y + s * 0.40, s * 0.19, Math.PI, 0);
  ctx.stroke();
}

function glypheMairie(ctx, x, y, s, couleur = '#ffffff') {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.14);
  ctx.lineTo(x + s * 0.9, y + s * 0.40);
  ctx.lineTo(x + s * 0.9, y + s * 0.86);
  ctx.lineTo(x + s * 0.1, y + s * 0.86);
  ctx.lineTo(x + s * 0.1, y + s * 0.40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0b0e14';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(x + s * (0.22 + i * 0.18), y + s * 0.50, s * 0.09, s * 0.36);
  }
}

function glypheBouclier(ctx, x, y, s, couleur = '#ffffff') {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.12);
  ctx.lineTo(x + s * 0.86, y + s * 0.28);
  ctx.quadraticCurveTo(x + s * 0.86, y + s * 0.72, x + s * 0.5, y + s * 0.90);
  ctx.quadraticCurveTo(x + s * 0.14, y + s * 0.72, x + s * 0.14, y + s * 0.28);
  ctx.closePath();
  ctx.fill();
}

const GLYPHES = {
  'croix-suisse': glypheCroixSuisse,
  coeur: glypheCoeur,
  livre: glypheLivre,
  sac: glypheSac,
  mairie: glypheMairie,
  bouclier: glypheBouclier,
};

/** Mélange une couleur hex vers le noir (`f` < 1) ou le blanc (`f` > 1). */
export function nuancerCouleur(hex, f) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex || '#00d4ff';
  const r = parseInt(h.slice(0, 2), 16);
  const v = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mel = (c) => Math.max(0, Math.min(255, Math.round(f <= 1 ? c * f : c + (255 - c) * (f - 1))));
  const hex2 = (c) => c.toString(16).padStart(2, '0');
  return `#${hex2(mel(r))}${hex2(mel(v))}${hex2(mel(b))}`;
}

/** Plaque arrondie (chemin seulement). */
function cheminPlaque(ctx, dx, dy, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(dx + rr, dy);
  ctx.arcTo(dx + w, dy, dx + w, dy + h, rr);
  ctx.arcTo(dx + w, dy + h, dx, dy + h, rr);
  ctx.arcTo(dx, dy + h, dx, dy, rr);
  ctx.arcTo(dx, dy, dx + w, dy, rr);
  ctx.closePath();
}

/**
 * Pastille de texte bien lisible : fond opaque sombre, contours nets.
 * `largeurMax` tronque proprement avec une ellipse.
 */
function pastilleTexte(ctx, texte, cx, cy, { police, hauteur, couleurTexte = '#ffffff', largeurMax, opacite = 0.92 } = {}) {
  if (!texte) return;
  ctx.font = `bold ${Math.round(police)}px "JetBrains Mono", "DejaVu Sans Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let t = String(texte);
  const limite = largeurMax || 1e6;
  if (ctx.measureText) {
    let l = ctx.measureText(t).width;
    while (l > limite && t.length > 2) {
      t = t.slice(0, -2);
      l = ctx.measureText(`${t}…`).width;
    }
    if (l > limite) t = `${t}…`;
  }
  const m = ctx.measureText ? ctx.measureText(t).width : t.length * police * 0.6;
  const pad = police * 0.42;
  cheminPlaque(ctx, cx - m / 2 - pad, cy - hauteur / 2, m + pad * 2, hauteur, hauteur * 0.34);
  ctx.fillStyle = `rgba(6,10,16,${opacite})`;
  ctx.fill();
  ctx.lineWidth = Math.max(1, police * 0.10);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.stroke();
  ctx.fillStyle = couleurTexte;
  ctx.fillText(t, cx, cy + police * 0.04);
}

/**
 * Dessine une icône AR : un **jeton 3D** posé sur le territoire.
 *
 * Le badge n'est plus une barre de vie plate (qu'on prenait pour un kit de
 * soin) : c'est une plaque épaisse — ombre au sol, pied, tranche sombre,
 * reflet spéculaire, biseau — avec :
 *   · le **glyphe** de la fonction (santé, écoles, économie, services, loisirs) ;
 *   · un **anneau de niveau** coloré (l'indice de la commune, arc + chiffre) ;
 *   · le **nom réel de l'équipement** sur une pastille opaque (lisible de loin) ;
 *   · une **seconde ligne** de détail (nombre d'équipements, précision…).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} taille Côté du sprite (px).
 * @param {object} categorie Entrée de `CATEGORIES_AR`.
 * @param {{valeur?:number, nom?:string, detail?:string, sansNom?:boolean, compte?:number}} [options]
 */
export function dessinerIconeAR(ctx, taille, categorie, options = {}) {
  const S = taille;
  const coul = categorie?.couleur || '#00d4ff';
  const valeur = Math.max(0, Math.min(100, Number(options.valeur ?? 60)));
  const sansNom = Boolean(options.sansNom);
  ctx.clearRect(0, 0, S, S);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ── géométrie ──
  const marge = S * 0.13;
  const bw = S - marge * 2;
  const bh = (sansNom ? S * 0.62 : S * 0.50);
  const bx = marge;
  const by = S * 0.05;
  const r = S * 0.15;
  const epaisseur = S * 0.055;              // épaisseur de la tranche (effet 3D)
  const fonce = nuancerCouleur(coul, 0.42);
  const tresFonce = nuancerCouleur(coul, 0.28);

  // 1 · ombre portée au sol
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(S / 2, by + bh + epaisseur + S * 0.075, bw * 0.40, S * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2 · pied (le jeton est posé, il ne flotte pas dans le vide)
  ctx.fillStyle = tresFonce;
  ctx.beginPath();
  ctx.moveTo(S / 2 - S * 0.055, by + bh * 0.62);
  ctx.lineTo(S / 2 + S * 0.055, by + bh * 0.62);
  ctx.lineTo(S / 2 + S * 0.085, by + bh + epaisseur + S * 0.05);
  ctx.lineTo(S / 2 - S * 0.085, by + bh + epaisseur + S * 0.05);
  ctx.closePath();
  ctx.fill();

  // 3 · tranche (extrusion) : la plaque décalée vers le bas, en plus sombre
  cheminPlaque(ctx, bx, by + epaisseur, bw, bh, r);
  ctx.fillStyle = tresFonce;
  ctx.fill();

  // 4 · face avant : dégradé clair → couleur, liseré noir épais
  cheminPlaque(ctx, bx, by, bw, bh, r);
  const grad = ctx.createLinearGradient(0, by, 0, by + bh);
  grad.addColorStop(0, nuancerCouleur(coul, 1.28));
  grad.addColorStop(0.52, coul);
  grad.addColorStop(1, nuancerCouleur(coul, 0.72));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // reflet spéculaire (haut gauche) + biseau bas
  const reflet = ctx.createLinearGradient(0, by, 0, by + bh);
  reflet.addColorStop(0, 'rgba(255,255,255,0.42)');
  reflet.addColorStop(0.42, 'rgba(255,255,255,0.05)');
  reflet.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = reflet;
  ctx.fillRect(bx, by, bw, bh * 0.62);
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(bx, by + bh * 0.80, bw, bh * 0.20);
  ctx.restore();
  ctx.lineWidth = S * 0.045;
  ctx.strokeStyle = '#0b0e14';
  cheminPlaque(ctx, bx, by, bw, bh, r);
  ctx.stroke();
  // liseré interne clair (biseau haut)
  ctx.lineWidth = S * 0.016;
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  cheminPlaque(ctx, bx + S * 0.035, by + S * 0.028, bw - S * 0.07, bh - S * 0.06, r * 0.8);
  ctx.stroke();

  // 5 · glyphe (contour noir épais puis blanc)
  const gs = Math.min(bw, bh) * 0.54;
  const gx = S / 2 - gs / 2;
  const gy = by + bh * 0.46 - gs / 2;
  const dessiner = GLYPHES[categorie?.glyphe] || glypheBouclier;
  ctx.lineWidth = S * 0.055;
  ctx.strokeStyle = '#0b0e14';
  ctx.save();
  ctx.translate(S * 0.008, S * 0.010);
  dessiner(ctx, gx, gy, gs, '#0b0e14');
  ctx.restore();
  dessiner(ctx, gx, gy, gs, '#ffffff');

  // 6 · anneau de niveau + chiffre (plus de « barre de vie » ambiguë)
  const [clair] = couleurBarre(valeur);
  const aY = by + bh * 0.80;
  const aR = S * 0.10;
  const aX = S / 2;
  ctx.lineWidth = S * 0.045;
  ctx.strokeStyle = 'rgba(6,10,16,0.92)';
  ctx.beginPath();
  ctx.arc(aX, aY, aR, Math.PI * 0.82, Math.PI * 2.18);
  ctx.stroke();
  ctx.strokeStyle = clair;
  ctx.lineWidth = S * 0.036;
  ctx.beginPath();
  ctx.arc(aX, aY, aR, Math.PI * 0.82, Math.PI * 0.82 + (Math.PI * 1.36 * (valeur / 100)));
  ctx.stroke();
  pastilleTexte(ctx, `${Math.round(valeur)}`, aX, aY + S * 0.005, {
    police: S * 0.115, hauteur: S * 0.155, couleurTexte: '#ffffff', largeurMax: S * 0.20, opacite: 0.95,
  });

  // 7 · nom réel + détail : pastilles opaques, texte contrasté
  if (!sansNom) {
    const nom = (options.nom || categorie?.nom || '').toUpperCase();
    pastilleTexte(ctx, nom, S / 2, by + bh + epaisseur + S * 0.135, {
      police: S * 0.135, hauteur: S * 0.20, largeurMax: S * 0.96,
    });
    const detail = options.detail || (Number.isFinite(options.compte) ? `${options.compte} équipement(s)` : '');
    if (detail) {
      pastilleTexte(ctx, detail, S / 2, by + bh + epaisseur + S * 0.255, {
        police: S * 0.105, hauteur: S * 0.165, couleurTexte: nuancerCouleur(coul, 1.45), largeurMax: S * 0.96,
      });
    }
  }
}

/**
 * Fabrique le sprite d'une icône AR.
 * @param {object} categorie
 * @param {{taille?:number, valeur?:number, nom?:string, sansNom?:boolean}} [options]
 * @returns {string|null} Data URL PNG (ou `null` hors navigateur).
 */
export function spriteAR(categorie, options = {}) {
  const taille = Math.max(48, Math.min(320, Number(options.taille) || 160));
  const c = nouveauCanvas(taille);
  if (!c) return null;
  dessinerIconeAR(c.getContext('2d'), taille, categorie, options);
  try { return c.toDataURL('image/png'); } catch { return null; }
}
