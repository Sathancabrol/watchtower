/**
 * WATCHTOWER — LE HQ : LA TOUR DE GUET DANS LE CIEL.
 *
 * « HQ c'est la watchtower dans le ciel » / « apparaît selon distance comme
 * maps » : comme les repères 3D de Google Maps, la tour n'est pas dessinée en
 * permanence — elle **apparaît par paliers** quand on se rapproche :
 *
 *  · très loin (> 120 km)   : rien ;
 *  · 120 → 40 km            : **la balise** — un point de lumière dans le ciel ;
 *  ·  40 → 12 km            : la **silhouette** (mât + plateforme), translucide ;
 *  · < 12 km                : le **détail** (cabine vitrée, haubans, base).
 *
 * La tour est **procédurale** : aucun fichier 3D à charger, tout est fait avec
 * des primitives Cesium. Elle se pose à TA position (GPS), sinon sur ton
 * domicile, sinon sur Sète.
 *
 * La fonction `apparence()` est pure et testée (`src/hq.test.mjs`).
 */

import * as Cesium from 'cesium';

/** Paliers d'apparition, en mètres (réglables). */
export const SEUILS = Object.freeze({
  balise: 120_000,      // la lumière porte loin
  silhouette: 40_000,   // on devine la tour
  detail: 12_000,       // on la voit vraiment
});

/** Hauteur de la tour (m). */
export const HAUTEUR = 180;

/**
 * Ce qui est visible à une distance donnée. Fonction pure, testée.
 * @param {number} metres distance caméra → tour
 * @returns {{balise:boolean, silhouette:boolean, detail:boolean, etage:string}}
 */
export function apparence(metres) {
  const d = Number(metres);
  if (!Number.isFinite(d) || d < 0) return { balise: false, silhouette: false, detail: false, etage: 'inconnu' };
  const balise = d <= SEUILS.balise;
  const silhouette = d <= SEUILS.silhouette;
  const detail = d <= SEUILS.detail;
  const etage = detail ? 'detail' : silhouette ? 'silhouette' : balise ? 'balise' : 'aucun';
  return { balise, silhouette, detail, etage };
}

/** Distance (m) entre la caméra et un point, à partir des longitudes/latitudes. */
export function distanceM(a, b) {
  const R = 6_371_008.8;
  const toRad = Math.PI / 180;
  const dLat = (Number(b.lat) - Number(a.lat)) * toRad;
  const dLon = (Number(b.lon) - Number(a.lon)) * toRad;
  const la1 = Number(a.lat) * toRad;
  const la2 = Number(b.lat) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * @param {*} viewer
 * @param {{lat?:number, lon?:number, nom?:string, surMessage?:Function}} [options]
 */
export function initHQ(viewer, options = {}) {
  const {
    lat: lat0 = 43.4000, lon: lon0 = 3.6900, // Sète par défaut
    nom = 'WATCHTOWER HQ', surMessage = null,
  } = options || {};

  let lat = Number(lat0);
  let lon = Number(lon0);
  let actif = true;

  const source = new Cesium.CustomDataSource('wt-hq');
  viewer.dataSources.add(source);

  const couleur = (css, alpha) => Cesium.Color.fromCssColorString(css).withAlpha(alpha);
  const DDC = (min, max) => new Cesium.DistanceDisplayCondition(min, max);

  let pieces = [];

  function construire() {
    source.entities.removeAll();
    pieces = [];
    const ajouter = (e) => { pieces.push(source.entities.add(e)); return e; };

    const socle = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const sommet = Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR);
    const milieu = Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR * 0.5);
    const haut = Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR + 26);

    // 🔦 BALISE : la lumière qu'on repère de très loin, de nuit comme de jour
    ajouter({
      name: `${nom} — balise`,
      position: haut,
      point: {
        pixelSize: 14, color: couleur('#00d4ff', 0.95),
        outlineColor: couleur('#ffffff', 0.6), outlineWidth: 2,
        distanceDisplayCondition: DDC(0, SEUILS.balise),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        translucencyByDistance: new Cesium.NearFarScalar(SEUILS.balise * 0.5, 0.35, SEUILS.balise, 0.95),
      },
      description: '<b>WATCHTOWER HQ</b><br>La tour de guet. Rapproche-toi pour la voir se dessiner.',
    });

    // 🗼 SILHOUETTE : mât + plateforme, translucides, visibles de loin
    ajouter({
      name: `${nom} — mât`,
      position: milieu,
      cylinder: {
        length: HAUTEUR, topRadius: 6, bottomRadius: 14,
        material: couleur('#20262e', 0.75),
        distanceDisplayCondition: DDC(0, SEUILS.silhouette),
        outline: true, outlineColor: couleur('#00d4ff', 0.35),
      },
    });
    ajouter({
      name: `${nom} — plateforme`,
      position: sommet,
      cylinder: {
        length: 8, topRadius: 34, bottomRadius: 30,
        material: couleur('#2b323b', 0.8),
        distanceDisplayCondition: DDC(0, SEUILS.silhouette),
        outline: true, outlineColor: couleur('#00d4ff', 0.45),
      },
    });

    // 🏠 DÉTAIL : cabine vitrée, haubans, base — seulement de près
    ajouter({
      name: `${nom} — cabine`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR + 16),
      box: {
        dimensions: new Cesium.Cartesian3(46, 46, 26),
        material: couleur('#7fd4ff', 0.28),
        outline: true, outlineColor: couleur('#00d4ff', 0.8),
        distanceDisplayCondition: DDC(0, SEUILS.detail),
      },
    });
    ajouter({
      name: `${nom} — base`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
      cylinder: {
        length: 10, topRadius: 26, bottomRadius: 34,
        material: couleur('#1a1f26', 0.9),
        distanceDisplayCondition: DDC(0, SEUILS.detail),
      },
    });
    // haubans : 4 câbles qui donnent la silhouette d'une tour
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ancrage = Cesium.Cartesian3.fromDegrees(lon + dx * 0.00035, lat + dy * 0.00035, 2);
      ajouter({
        name: `${nom} — hauban`,
        polyline: {
          positions: [ancrage, Cesium.Cartesian3.fromDegrees(lon + dx * 0.00006, lat + dy * 0.00006, HAUTEUR - 8)],
          width: 1.4,
          material: couleur('#8ea0b0', 0.55),
          distanceDisplayCondition: DDC(0, SEUILS.detail),
        },
      });
    }

    // étiquette : n'apparaît que de près, comme Maps
    ajouter({
      name: nom,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR + 52),
      label: {
        text: '🏰 ' + nom,
        font: '600 12px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: couleur('#0a0a0f', 0.8),
        pixelOffset: new Cesium.Cartesian2(0, -10),
        distanceDisplayCondition: DDC(0, SEUILS.detail),
        translucencyByDistance: new Cesium.NearFarScalar(6000, 1, SEUILS.detail, 0.2),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    source.show = actif;
    viewer.scene.requestRender?.();
  }

  construire();

  // 🎯 Le HQ suit la caméra : on annonce l'apparition, comme Maps
  let dernierEtage = null;
  const ecoute = () => {
    if (!actif) return;
    try {
      const c = viewer.camera?.positionCartographic;
      if (!c) return;
      const d = distanceM({ lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude) }, { lat, lon });
      const a = apparence(d);
      if (a.etage !== dernierEtage) {
        dernierEtage = a.etage;
        if (a.etage === 'balise') surMessage?.('🔦 HQ — ta tour de guet apparaît à l’horizon (balise).');
        if (a.etage === 'silhouette') surMessage?.('🗼 HQ — la tour se dessine.');
        if (a.etage === 'detail') surMessage?.('🏰 HQ — tour de guet, détails visibles.');
      }
    } catch { /* caméra indisponible */ }
  };
  viewer.camera?.changed?.addEventListener?.(ecoute);
  viewer.scene?.postRender?.addEventListener?.(ecoute);

  return {
    element: null,
    source,
    nom,
    /** Pose la tour (et reconstruit). */
    placer(nlleLat, nlleLon, label = null) {
      if (!Number.isFinite(Number(nlleLat)) || !Number.isFinite(Number(nlleLon))) return false;
      lat = Number(nlleLat);
      lon = Number(nlleLon);
      if (label) this.nom = label;
      construire();
      return true;
    },
    position: () => ({ lat, lon, hauteur: HAUTEUR }),
    activer(on = true) { actif = Boolean(on); source.show = actif; viewer.scene.requestRender?.(); return actif; },
    visible: () => actif,
    /** La caméra va jusqu'à la tour (cinématique douce). */
    centrer() {
      viewer.camera?.flyTo?.({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, HAUTEUR * 4 + 220),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25), roll: 0 },
        duration: 3.2,
      });
      surMessage?.(`🏰 HQ — cap sur la tour de guet.`);
      return true;
    },
    /** Distance actuelle caméra → tour (m). */
    distance() {
      const c = viewer.camera?.positionCartographic;
      if (!c) return null;
      return distanceM({ lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude) }, { lat, lon });
    },
    etage: () => apparence(this.distance()).etage,
    detruire() {
      try { viewer.dataSources.remove(source, true); } catch { /* déjà retirée */ }
    },
  };
}
