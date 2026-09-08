/**
 * Extraction de trame pour le mode ▚ MATRIX de la minicarte.
 *
 * MATRIX n'est PAS un filtre de vision nocturne : il ne doit pas repeindre
 * l'image entière en vert. Seuls les TRAITS de la couche OSM — bâti,
 * parcellaire, voirie — sont conservés ; les aplats clairs deviennent
 * transparents pour laisser voir la photo satellite en dessous.
 *
 * Fonction pure, testable sans navigateur.
 * @module data/matrixTrame
 */

/** Au-dessus de cette luminance, le pixel est un aplat de fond : on l'efface. */
export const SEUIL_FOND = 205;

/**
 * Luminance perçue d'un pixel (Rec. 601).
 * @param {number} r - Rouge 0-255.
 * @param {number} v - Vert 0-255.
 * @param {number} b - Bleu 0-255.
 * @returns {number} Luminance 0-255.
 */
export function luminance(r, v, b) {
  return r * 0.299 + v * 0.587 + b * 0.114;
}

/**
 * Rend transparents les aplats clairs et conserve les traits sombres.
 * Modifie le tableau en place (comme ImageData.data) et le renvoie.
 * @param {Uint8ClampedArray|number[]} d - Pixels RGBA.
 * @returns {Uint8ClampedArray|number[]} Le même tableau, alpha recalculé.
 */
export function extraireTrame(d) {
  if (!d || typeof d.length !== 'number') return d;
  for (let i = 0; i + 3 < d.length; i += 4) {
    const lum = luminance(d[i], d[i + 1], d[i + 2]);
    d[i + 3] = lum > SEUIL_FOND ? 0 : Math.round(d[i + 3] * (1 - lum / 255));
  }
  return d;
}

/**
 * Part de pixels conservés — sert à vérifier que MATRIX reste une trame
 * et ne redevient pas un écran plein.
 * @param {Uint8ClampedArray|number[]} d - Pixels RGBA après extraction.
 * @returns {number} Ratio 0..1 de pixels non totalement transparents.
 */
export function ratioTrame(d) {
  if (!d || d.length < 4) return 0;
  let gardes = 0;
  let total = 0;
  for (let i = 3; i < d.length; i += 4) {
    total += 1;
    if (d[i] > 0) gardes += 1;
  }
  return total ? gardes / total : 0;
}
