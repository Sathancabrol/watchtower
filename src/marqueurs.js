/**
 * WATCHTOWER — MARQUEURS CARTE (dessin canvas, sans Cesium).
 *
 * Fabrique les sprites « épingle » posés sur la carte (pins, repère domicile,
 * point de la fiche lieu). Le style est volontairement épais — contour noir
 * large, couleur pleine, ombre portée — pour rester lisible par-dessus un
 * satellite ou un fond de carte clair, dans l'esprit des marqueurs de jeu
 * (GTA San Andreas).
 *
 * Aucune dépendance : en l'absence de `document` (tests node) les fonctions
 * de rendu renvoient `null` au lieu d'échouer.
 */

/** @returns {HTMLCanvasElement|null} */
function canvas(taille) {
  if (typeof document === 'undefined' || !document.createElement) return null;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  return c;
}

/** Rectangle à coins arrondis (chemin courant, non rempli). */
export function cheminArrondi(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Assombrit / éclaircit une couleur hex (#rrggbb). */
export function nuancer(hex, facteur) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(facteur > 0 ? v + (255 - v) * facteur : v * (1 + facteur))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Dessine une épingle (goutte inversée) centrée dans un carré de `taille`.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{couleur?:string, texte?:string, taille?:number, pastille?:boolean}} o
 */
export function dessinerEpingle(ctx, { couleur = '#00d4ff', texte = '', taille = 128, pastille = false } = {}) {
  const S = taille;
  ctx.clearRect(0, 0, S, S);
  if (pastille) {
    // variante « pastille » : disque épais, pour les repères secondaires
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(S / 2, S * 0.56, S * 0.30, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = S * 0.07;
    ctx.strokeStyle = '#0b0e14';
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.30, 0, Math.PI * 2);
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.stroke();
  } else {
    const pointe = S * 0.92;
    const haut = S * 0.10;
    const rayon = S * 0.26;
    const cx = S / 2;
    const cy = S * 0.36;
    const tracer = (dx = 0, dy = 0) => {
      ctx.beginPath();
      ctx.moveTo(cx - rayon + dx, cy + dy);
      ctx.quadraticCurveTo(cx - rayon + dx, haut + dy, cx + dx, haut + dy);
      ctx.quadraticCurveTo(cx + rayon + dx, haut + dy, cx + rayon + dx, cy + dy);
      ctx.quadraticCurveTo(cx + rayon + dx, cy + rayon * 0.75 + dy, cx + dx, pointe + dy);
      ctx.quadraticCurveTo(cx - rayon + dx, cy + rayon * 0.75 + dy, cx - rayon + dx, cy + dy);
      ctx.closePath();
    };
    // ombre
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    tracer(S * 0.03, S * 0.04);
    ctx.fill();
    // contour noir épais puis corps
    tracer();
    ctx.lineWidth = S * 0.075;
    ctx.strokeStyle = '#0b0e14';
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.stroke();
    // reflet haut
    ctx.save();
    tracer();
    ctx.clip();
    const grad = ctx.createLinearGradient(0, haut, 0, cy + rayon);
    grad.addColorStop(0, 'rgba(255,255,255,0.42)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
    // œillet blanc au centre
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.135, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = S * 0.03;
    ctx.strokeStyle = '#0b0e14';
    ctx.stroke();
  }
  if (texte) {
    const t = String(texte).slice(0, 3);
    ctx.font = `bold ${Math.round(S * (t.length > 1 ? 0.15 : 0.2))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = S * 0.035;
    ctx.strokeStyle = '#0b0e14';
    ctx.strokeText(t, S / 2, pastille ? S / 2 : S * 0.36);
    ctx.fillStyle = '#0b0e14';
    ctx.fillText(t, S / 2, pastille ? S / 2 : S * 0.36);
  }
}

/**
 * Fabrique le sprite d'une épingle.
 * @param {{couleur?:string, texte?:string, taille?:number, pastille?:boolean}} [options]
 * @returns {string|null} Data URL PNG (ou `null` hors navigateur).
 */
export function spriteEpingle(options = {}) {
  const taille = Math.max(32, Math.min(256, Number(options.taille) || 128));
  const c = canvas(taille);
  if (!c) return null;
  dessinerEpingle(c.getContext('2d'), { ...options, taille });
  try { return c.toDataURL('image/png'); } catch { return null; }
}
