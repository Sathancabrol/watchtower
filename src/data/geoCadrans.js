/**
 * WATCHTOWER — DÉCOUPAGE GÉOMÉTRIQUE D'UNE COMMUNE EN CADRANS.
 *
 * Besoin : les cadrans doivent épouser le **tracé communal** et non une simple
 * boîte englobante — sinon on quadrille la mer, les communes voisines et le
 * vide, et les périmètres de la commune ne sont pas tous couverts.
 *
 * Méthode retenue (simple et robuste, sans dépendance) :
 *  1. on **triangule** le contour communal par « coupe d'oreilles »
 *     (ear clipping) — marche sur n'importe quel polygone simple, même concave ;
 *  2. on découpe une **grille** régulière sur l'emprise du contour ;
 *  3. pour chaque case (un rectangle = polygone CONVEXE), on calcule son
 *     intersection exacte avec chaque triangle (convexe) par
 *     **Sutherland–Hodgman** — algorithme exact pour deux polygones convexes ;
 *  4. la réunion des morceaux d'une case = l'intersection exacte
 *     « case ∩ commune ». On garde les cases assez remplies, on jette les
 *     confettis (seuil `aireMin`).
 *
 * C'est plus robuste qu'un clipping polygone concave (Greiner–Hormann casse sur
 * les cas dégénérés) et ça ne coûte rien : quelques milliers de points.
 *
 * Tout est pur (aucun Cesium, aucun DOM) → testé dans `geoCadrans.test.mjs`.
 */

/** Aire signée d'un anneau/polygone (formule du lacet). > 0 = sens trigo. */
export function aireSignee(poly = []) {
  let s = 0;
  for (let i = 0, n = poly.length; i < n; i += 1) {
    const a = poly[i]; const b = poly[(i + 1) % n];
    s += (Number(a?.[0]) || 0) * (Number(b?.[1]) || 0) - (Number(b?.[0]) || 0) * (Number(a?.[1]) || 0);
  }
  return s / 2;
}

/** Aire positive. */
export function aire(poly = []) { return Math.abs(aireSignee(poly)); }

/** Remet un anneau dans le sens demandé (antihoraire par défaut). */
export function orienter(anneau = [], trigo = true) {
  const s = aireSignee(anneau);
  if (!Number.isFinite(s) || s === 0) return anneau.slice();
  if ((s > 0) === Boolean(trigo)) return anneau.slice();
  return anneau.slice().reverse();
}

/** Vrai si le point [lon,lat] est dans l'anneau (lancer de rayon). */
export function pointDansPolygone(point, anneau = []) {
  const x = Number(point?.[0]); const y = Number(point?.[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || anneau.length < 3) return false;
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i, i += 1) {
    const xi = Number(anneau[i]?.[0]); const yi = Number(anneau[i]?.[1]);
    const xj = Number(anneau[j]?.[0]); const yj = Number(anneau[j]?.[1]);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi)) dedans = !dedans;
  }
  return dedans;
}

/** Vrai si le polygone est convexe (utile pour garantir le clipping exact). */
export function estConvexe(poly = []) {
  if (poly.length < 4) return true;
  let signe = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]; const b = poly[(i + 1) % poly.length]; const c = poly[(i + 2) % poly.length];
    const d = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(d) < 1e-15) continue;
    const s = d > 0 ? 1 : -1;
    if (signe === 0) signe = s;
    else if (s !== signe) return false;
  }
  return true;
}

/**
 * Triangulation par coupe d'oreilles (ear clipping).
 * @param {number[][]} anneau [lon,lat] (fermé ou non, les doublons sont ôtés)
 * @returns {number[][][]} triangles, chacun = 3 points
 */
export function oreilles(anneau = []) {
  const pts = anneau.filter((p) => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]));
  // on retire le point de fermeture s'il répète le premier
  if (pts.length > 2) {
    const a = pts[0]; const z = pts[pts.length - 1];
    if (Math.abs(a[0] - z[0]) < 1e-12 && Math.abs(a[1] - z[1]) < 1e-12) pts.pop();
  }
  if (pts.length < 3) return [];
  const poly = orienter(pts, true);
  const triangles = [];
  let liste = poly.map((p, i) => ({ p, i }));
  let garde = liste.length * liste.length + 16; // garde-fou anti-boucle
  while (liste.length > 3 && garde > 0) {
    garde -= 1;
    let coupe = false;
    for (let k = 0; k < liste.length; k += 1) {
      const a = liste[(k + liste.length - 1) % liste.length];
      const b = liste[k];
      const c = liste[(k + 1) % liste.length];
      const ab = [b.p[0] - a.p[0], b.p[1] - a.p[1]];
      const ac = [c.p[0] - a.p[0], c.p[1] - a.p[1]];
      const croix = ab[0] * ac[1] - ab[1] * ac[0];
      if (croix <= 0) continue; // oreille non convexe (ou polygone dans l'autre sens)
      // l'oreille ne doit contenir aucun autre sommet
      let propre = true;
      for (const s of liste) {
        if (s.i === a.i || s.i === b.i || s.i === c.i) continue;
        if (pointDansTriangle(s.p, a.p, b.p, c.p)) { propre = false; break; }
      }
      if (!propre) continue;
      triangles.push([a.p, b.p, c.p]);
      liste = liste.filter((_, idx) => idx !== k);
      coupe = true;
      break;
    }
    if (!coupe) break; // polygone dégénéré : on s'arrête (les tests le couvrent)
  }
  if (liste.length === 3) triangles.push([liste[0].p, liste[1].p, liste[2].p]);
  return triangles.filter((t) => aire(t) > 1e-14);
}

/** Vrai si p est dans le triangle abc (test par les trois demi-plans). */
export function pointDansTriangle(p, a, b, c) {
  const s = (u, v, w) => (v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]);
  const d1 = s(a, b, p); const d2 = s(b, c, p); const d3 = s(c, a, p);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Clipping de Sutherland–Hodgman : `sujet` découpé par le polygone `clip`
 * (qui doit être CONVEXE et orienté antihoraire).
 */
export function clipperConvexe(sujet = [], clip = []) {
  if (sujet.length < 3 || clip.length < 3) return [];
  let sortie = sujet.slice();
  for (let i = 0; i < clip.length && sortie.length; i += 1) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const entree = sortie;
    sortie = [];
    for (let j = 0; j < entree.length; j += 1) {
      const p = entree[j];
      const q = entree[(j + 1) % entree.length];
      const dp = interieurDemiPlan(p, a, b);
      const dq = interieurDemiPlan(q, a, b);
      if (dp >= 0) sortie.push(p);
      if ((dp >= 0 && dq < 0) || (dp < 0 && dq >= 0)) {
        const t = dp / (dp - dq || 1e-12);
        sortie.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return sortie;
}

/** ≥ 0 si p est à gauche de la droite ab (donc dedans pour un clip antihoraire). */
export function interieurDemiPlan(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

/** Boîte englobante d'anneaux (ou d'un anneau). */
export function bbox(anneaux = []) {
  const liste = Array.isArray(anneaux?.[0]?.[0]) ? anneaux : [anneaux];
  let ouest = Infinity; let sud = Infinity; let est = -Infinity; let nord = -Infinity; let n = 0;
  for (const anneau of liste) {
    for (const p of anneau || []) {
      if (!Number.isFinite(p?.[0]) || !Number.isFinite(p?.[1])) continue;
      ouest = Math.min(ouest, p[0]); est = Math.max(est, p[0]);
      sud = Math.min(sud, p[1]); nord = Math.max(nord, p[1]);
      n += 1;
    }
  }
  return n ? { ouest, sud, est, nord } : null;
}

/** Rectangle (antihoraire) d'une boîte. */
export function polygoneBBox(b) {
  const { ouest, sud, est, nord } = b || {};
  if (![ouest, sud, est, nord].every(Number.isFinite)) return [];
  return [[ouest, sud], [est, sud], [est, nord], [ouest, nord]];
}

/** Grille régulière de cases sur une boîte. */
export function grille(bboxE, colonnes = 2, lignes = 2) {
  const b = bboxE || {};
  if (![b.ouest, b.sud, b.est, b.nord].every(Number.isFinite)) return [];
  const cols = Math.max(1, Math.round(colonnes));
  const rangs = Math.max(1, Math.round(lignes));
  const pasX = (b.est - b.ouest) / cols;
  const pasY = (b.nord - b.sud) / rangs;
  const out = [];
  for (let r = 0; r < rangs; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const boite = {
        ouest: b.ouest + c * pasX,
        est: b.ouest + (c + 1) * pasX,
        sud: b.sud + (rangs - 1 - r) * pasY, // rang 0 = bande NORD
        nord: b.sud + (rangs - r) * pasY,
      };
      out.push({ colonne: c, rang: r, index: r * cols + c, bbox: boite, polygone: polygoneBBox(boite) });
    }
  }
  return out;
}

/** Centroïde (pondéré par l'aire) d'une liste de polygones. */
export function centroide(polys = []) {
  let cx = 0; let cy = 0; let total = 0;
  for (const poly of polys) {
    const a = aire(poly);
    if (!a) continue;
    let x = 0; let y = 0;
    for (const p of poly) { x += p[0]; y += p[1]; }
    cx += (x / poly.length) * a; cy += (y / poly.length) * a; total += a;
  }
  if (!total) return null;
  return { lon: cx / total, lat: cy / total };
}

/**
 * Découpe une commune (1 ou plusieurs anneaux) en cadrans qui ÉPOUSENT son
 * tracé : chaque cadran porte la liste exacte de ses morceaux (`pieces`).
 *
 * @param {number[][][]} anneaux contour(s) de la commune
 * @param {{colonnes?:number, lignes?:number, niveau?:number, aireMin?:number}} [options]
 *   `aireMin` : fraction minimale de la case couverte par la commune (0.08 par
 *   défaut) — en dessous, le confetti est jeté.
 * @returns {Array<{colonne,rang,index,bbox,pieces,aire,couverture,centre,polygone}>}
 */
export function decouperCommune(anneaux = [], options = {}) {
  const liste = (Array.isArray(anneaux?.[0]?.[0]) ? anneaux : [anneaux]).filter((a) => (a?.length || 0) >= 3);
  const boite = bbox(liste);
  if (!boite) return [];
  const colonnes = Math.max(1, Math.round(options.colonnes ?? 2));
  const lignes = Math.max(1, Math.round(options.lignes ?? colonnes));
  const aireMin = Number.isFinite(options.aireMin) ? options.aireMin : 0.08;

  // 1) triangulation du contour communal (les triangles sont convexes : le
  //    clipping exact est garanti)
  const triangles = [];
  for (const anneau of liste) {
    for (const t of oreilles(anneau)) triangles.push(orienter(t, true));
  }

  const out = [];
  for (const case0 of grille(boite, colonnes, lignes)) {
    const pieces = [];
    for (const t of triangles) {
      // la case ne peut croiser le triangle que si leurs boîtes se croisent
      if (!bboxCroisent(case0.bbox, bbox([t]))) continue;
      const morceau = clipperConvexe(case0.polygone, t);
      if (morceau.length >= 3 && aire(morceau) > 1e-13) pieces.push(morceau);
    }
    const a = pieces.reduce((n, p) => n + aire(p), 0);
    const aireCase = aire(case0.polygone);
    const couverture = aireCase > 0 ? a / aireCase : 0;
    if (!pieces.length || couverture < aireMin) continue;
    const centre = centroide(pieces) || { lon: (case0.bbox.ouest + case0.bbox.est) / 2, lat: (case0.bbox.sud + case0.bbox.nord) / 2 };
    out.push({
      colonne: case0.colonne, rang: case0.rang, index: case0.index,
      bbox: case0.bbox,
      pieces,
      polygone: pieces[pieces.slice(1).reduce((best, p, i) => (aire(p) > aire(pieces[best]) ? i + 1 : best), 0)] || case0.polygone,
      aire: a,
      couverture,
      centre: { lon: centre.lon, lat: centre.lat },
    });
  }
  return out;
}

/** Vrai si deux boîtes se croisent (test rapide avant clipping). */
export function bboxCroisent(a = {}, b = {}) {
  return Number(a.ouest) <= Number(b.est) && Number(b.ouest) <= Number(a.est)
    && Number(a.sud) <= Number(b.nord) && Number(b.sud) <= Number(a.nord);
}

/** Anneau extérieur (le plus grand) d'une liste d'anneaux. */
export function anneauPrincipal(anneaux = []) {
  const liste = (Array.isArray(anneaux?.[0]?.[0]) ? anneaux : [anneaux]).filter((a) => (a?.length || 0) >= 3);
  if (!liste.length) return [];
  return liste.reduce((best, a) => (aire(a) > aire(best) ? a : best), liste[0]);
}
