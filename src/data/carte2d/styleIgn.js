/**
 * Construction de styles MapLibre à partir des fonds IGN Géoplateforme.
 *
 * Les quatre couches IGN déjà branchées dans `src/displayOptions.js` (plan,
 * orthophotos, ortho 1950-1965, cartes topographiques) sont servies en **WMTS**.
 * MapLibre sait consommer du WMTS via une source `raster` dont l'URL porte les
 * paramètres KVP — inutile de passer par un serveur de tuiles vectorielles.
 *
 * Le même fond alimente donc les deux moteurs : basculer en 2D ne change pas
 * l'image affichée, seulement la façon de la dessiner. C'est ce qui rend la
 * bascule acceptable pour l'œil.
 *
 * Aucune clé d'API : la Géoplateforme est en Licence Ouverte.
 *
 * @module data/carte2d/styleIgn
 */

/** Point d'entrée WMTS de la Géoplateforme IGN. */
export const WMTS_IGN = 'https://data.geopf.fr/wmts';

/** Attribution obligatoire au titre de la Licence Ouverte. */
export const ATTRIBUTION_IGN = '© IGN — Géoplateforme (Licence Ouverte)';

/** Matrice de tuilage Web Mercator utilisée par la Géoplateforme. */
export const TILE_MATRIX_SET = 'PM';

/**
 * Fonds disponibles. Les identifiants sont alignés sur ceux de
 * `src/displayOptions.js` pour qu'un même choix vaille dans les deux moteurs.
 */
export const FONDS_IGN = Object.freeze({
  'ign-plan': Object.freeze({
    couche: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', format: 'image/png',
    libelle: 'Plan IGN', zoomMax: 19,
  }),
  'ign-ortho': Object.freeze({
    couche: 'ORTHOIMAGERY.ORTHOPHOTOS', format: 'image/jpeg',
    libelle: 'Photographies aériennes', zoomMax: 19,
  }),
  'ign-1950': Object.freeze({
    couche: 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965', format: 'image/png',
    libelle: 'Remonter le temps (1950-1965)', zoomMax: 18,
  }),
  'ign-topo': Object.freeze({
    couche: 'GEOGRAPHICALGRIDSYSTEMS.MAPS', format: 'image/jpeg',
    libelle: 'Cartes topographiques', zoomMax: 18,
  }),
  'ign-cadastre': Object.freeze({
    couche: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS', format: 'image/png',
    libelle: 'Parcelles cadastrales', zoomMax: 19,
  }),
});

/**
 * Compose l'URL de tuile WMTS pour MapLibre.
 * Les gabarits `{z}/{x}/{y}` sont substitués par MapLibre à l'exécution.
 * @param {string} couche - Identifiant de la couche WMTS.
 * @param {string} format - Type MIME de l'image.
 * @returns {string} Gabarit d'URL.
 */
export function urlTuileWmts(couche, format) {
  const p = new URLSearchParams({
    SERVICE: 'WMTS', REQUEST: 'GetTile', VERSION: '1.0.0',
    LAYER: couche, STYLE: 'normal', TILEMATRIXSET: TILE_MATRIX_SET, FORMAT: format,
  });
  // Les gabarits doivent rester littéraux : on les ajoute après l'encodage.
  return `${WMTS_IGN}?${p.toString()}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
}

/**
 * Construit un style MapLibre complet pour un fond donné.
 * @param {string} [idFond='ign-plan'] - Clé de `FONDS_IGN`.
 * @param {{cadastre?:boolean}} [options] - Superposer le cadastre.
 * @returns {object} Objet style MapLibre (version 8).
 */
export function styleMapLibre(idFond = 'ign-plan', options = {}) {
  const fond = FONDS_IGN[idFond] || FONDS_IGN['ign-plan'];
  const cle = FONDS_IGN[idFond] ? idFond : 'ign-plan';

  const sources = {
    [cle]: {
      type: 'raster',
      tiles: [urlTuileWmts(fond.couche, fond.format)],
      tileSize: 256,
      maxzoom: fond.zoomMax,
      attribution: ATTRIBUTION_IGN,
    },
  };
  const layers = [{ id: `${cle}-couche`, type: 'raster', source: cle }];

  // Le cadastre se superpose : fond opaque + parcelles semi-transparentes.
  if (options.cadastre && cle !== 'ign-cadastre') {
    const cad = FONDS_IGN['ign-cadastre'];
    sources['ign-cadastre'] = {
      type: 'raster',
      tiles: [urlTuileWmts(cad.couche, cad.format)],
      tileSize: 256,
      maxzoom: cad.zoomMax,
      attribution: ATTRIBUTION_IGN,
    };
    layers.push({
      id: 'ign-cadastre-couche', type: 'raster', source: 'ign-cadastre',
      paint: { 'raster-opacity': 0.7 },
    });
  }

  return { version: 8, sources, layers };
}

/**
 * Liste les fonds proposables à l'utilisateur.
 * @returns {Array<{id:string, libelle:string}>} Fonds disponibles.
 */
export function listerFonds() {
  return Object.entries(FONDS_IGN).map(([id, f]) => ({ id, libelle: f.libelle }));
}
