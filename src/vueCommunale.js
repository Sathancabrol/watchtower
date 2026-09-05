/**
 * WATCHTOWER — VUES DU TERRITOIRE (fenêtre CONTEXTE du mode INTEL).
 *
 * Une rangée de boutons NOMMÉS propose plusieurs façons de regarder le même
 * territoire. La vedette est la VUE COMMUNALE :
 *
 *   1. la caméra dézoome et se met à la verticale (vue « plan 2D » du dessus) ;
 *   2. le contour de la commune se TRACE en animation, façon plan cadastral
 *      qui se dessine (trait cyan + remplissage translucide) ;
 *   3. la couche AR s'active par-dessus : des icônes flottent en 3D au-dessus
 *      de la ville, une par équipement réel, habillées par catégorie
 *      (santé = croix suisse + barre de vie, bonheur = cœur, écoles,
 *      commerces, services) ;
 *   4. clic sur une icône → TOUS les bâtiments 3D de sa catégorie se
 *      modélisent et reçoivent leur icône flottante au-dessus du toit.
 *
 * Tout est gratuit et sans clé : contour = geo.api.gouv.fr, équipements et
 * emprises = OpenStreetMap (Overpass).
 */

import * as Cesium from 'cesium';
import {
  CATEGORIES_AR,
  categorieAR,
  spriteAR,
  spriteARTournant,
  espacer,
} from './arIcons.js';
import {
  altitudePourBBox,
  anneauxDepuisGeoJson,
  bboxAnneaux,
  centreBBox,
  decimer,
  portionAnneau,
} from './contours.js';
import { pointDansEmprise } from './batiMath.js';
import {
  governorRequestRender,
  holdContinuousRender,
  releaseContinuousRender,
} from './renderGovernor.js';

/** Boutons proposés dans la fenêtre CONTEXTE (ordre d'affichage). */
export const VUES = Object.freeze([
  { id: 'communale', ic: '🗺', nom: 'VUE COMMUNALE', sous: 'plan 2D · contour animé · AR' },
  { id: 'quartier', ic: '🏘', nom: 'VUE QUARTIER', sous: '3D rasante · 900 m' },
  { id: 'immersion', ic: '👁', nom: 'IMMERSION', sous: 'caméra au sol · regard' },
  { id: 'orbite', ic: '🌍', nom: 'ORBITE', sous: 'retour vue globe' },
  { id: 'heatzones', ic: '🔥', nom: 'HEATZONES', sous: 'équipements · rayons' },
  { id: 'bati3d', ic: '🏙', nom: 'BÂTI 3D', sous: 'volumes rapides' },
]);

const CSS = `
#wt-vues-chip {
  position: fixed; top: 112px; left: 50%; transform: translateX(-50%); z-index: 2660;
  padding: 7px 14px; border-radius: 10px; font-family: var(--font-mono, monospace);
  font-size: 9.5px; letter-spacing: 1px; color: #e8eaed; background: rgba(8,12,18,0.94);
  border: 1px solid #7dd3c8; max-width: 74vw; text-align: center; line-height: 1.6;
}
`;

const attendre = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** Requête Overpass générique (équipements de repli si l'INTEL n'a pas tourné). */
async function overpass(req, delai = 25000) {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), delai);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(`[out:json][timeout:25];${req}`)}`,
      signal: controle.signal,
    });
    return (await r.json())?.elements || [];
  } catch {
    return [];
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * @param {object} viewer Viewer Cesium.
 * @param {object} [deps]
 * @param {object} [deps.bati] Pipeline `creerBatiRapide`.
 * @param {Function} [deps.analyse] Dernière analyse INTEL ({commune, lat, lon, listes, indices}).
 * @param {Function} [deps.fiche] Ouverture de la fiche lieu (lon, lat, nom).
 * @param {Function} [deps.heatzones] Bascule des zones de chaleur.
 * @param {Function} [deps.surMessage] Remontée d'un message utilisateur.
 */
export function initVuesTerritoire(viewer, deps = {}) {
  const {
    bati = null,
    analyse = () => null,
    fiche = null,
    heatzones = null,
    surMessage = null,
  } = deps;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const dsContour = new Cesium.CustomDataSource('wt-contour-communal');
  viewer.dataSources.add(dsContour);
  const dsAR = new Cesium.CustomDataSource('wt-ar-icones');
  viewer.dataSources.add(dsAR);
  const dsBatCat = new Cesium.CustomDataSource('wt-ar-batiments');
  viewer.dataSources.add(dsBatCat);

  let chip = null;
  let primCategorie = null; // primitives de la catégorie AR activée
  let animationEnCours = null;
  // 🐛 BUG CORRIGÉ : les couches AR / contour restaient vivantes quand on
  // changeait de vue — les icônes continuaient de flotter (CallbackProperty) et
  // le rendu CONTINU n'était jamais relâché : l'application ne redevenait
  // jamais idle (« animation de scan en continu », ventilateur qui tourne).
  // `generationContour` invalide un tracé devenu obsolète, et `AR_FLOTTEMENT_MS`
  // borne la durée du flottement : ensuite les icônes se posent et on relâche.
  let generationContour = 0;
  const AR_FLOTTEMENT_MS = 18_000;

  function dire(texte, duree = 4200) {
    surMessage?.(texte);
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'wt-vues-chip';
      document.body.appendChild(chip);
    }
    chip.innerHTML = texte;
    chip.style.display = '';
    if (duree) {
      window.clearTimeout(dire._t);
      dire._t = window.setTimeout(() => { if (chip) chip.style.display = 'none'; }, duree);
    }
  }

  /** Centre courant : analyse INTEL si dispo, sinon centre de la caméra. */
  function centreCourant() {
    const a = analyse?.();
    if (a && Number.isFinite(a.lat) && Number.isFinite(a.lon)) return { lat: a.lat, lon: a.lon, analyse: a };
    const c = viewer.camera.positionCartographic;
    return { lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude), analyse: null };
  }

  function voler(lat, lon, altitude, pitch, duree = 2) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      duration: duree,
    });
  }

  // ═══════════ 1 · contour de commune (geo.api.gouv.fr, gratuit) ═══════════
  async function contourCommune(lat, lon) {
    const a = analyse?.();
    const code = a?.commune?.code;
    const url = code
      ? `https://geo.api.gouv.fr/communes?code=${code}&fields=nom,code,population,surface,contour`
      : `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,code,population,surface,contour`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      const c = Array.isArray(d) ? d[0] : d;
      if (!c) return null;
      const anneaux = anneauxDepuisGeoJson(c.contour).map((an) => decimer(an, 220));
      if (!anneaux.length) return null;
      return { nom: c.nom, code: c.code, population: c.population, anneaux };
    } catch {
      return null;
    }
  }

  // ═══════════ 2 · tracé animé « plan cadastral » ═══════════
  function tracerContour(anneaux, dureeMs = 2600) {
    dsContour.entities.removeAll();
    const generation = ++generationContour;
    // L'app tourne en `requestRenderMode` (gouverneur de rendu) : sans cette
    // demande de rendu CONTINU, une animation en CallbackProperty ne produit
    // aucune image — c'est la cause des « icônes AR invisibles ».
    holdContinuousRender('wt-vues-contour');
    const principal = anneaux[0];
    const plat = [];
    for (const p of principal) plat.push(p[0], p[1]);
    const debut = Date.now();

    // le trait : sa portion révélée est recalculée à chaque image
    const ligne = dsContour.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (Date.now() - debut) / dureeMs);
          const portion = portionAnneau(principal, t);
          const aplati = [];
          for (const p of portion) aplati.push(p[0], p[1]);
          return aplati.length >= 4 ? Cesium.Cartesian3.fromDegreesArray(aplati) : [];
        }, false),
        width: 5,
        material: Cesium.Color.fromCssColorString('#7dd3c8'),
        clampToGround: true,
      },
    });

    // la tête du trait (point lumineux qui avance)
    const tete = dsContour.entities.add({
      position: new Cesium.CallbackProperty(() => {
        const t = Math.min(1, (Date.now() - debut) / dureeMs);
        const portion = portionAnneau(principal, t);
        const p = portion[portion.length - 1] || principal[0];
        return Cesium.Cartesian3.fromDegrees(p[0], p[1], 40);
      }, false),
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#ffffff'),
        outlineColor: Cesium.Color.fromCssColorString('#7dd3c8'),
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    animationEnCours = new Promise((resoudre) => {
      const fin = () => {
        resoudre();
        releaseContinuousRender('wt-vues-contour');
        governorRequestRender('wt-contour-fin');
        // tracé devenu obsolète (changement de vue) : on ne repeint pas
        if (generation !== generationContour) return;
        // remplissage « plan » translucide, une fois le contour fermé
        dsContour.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(plat),
            material: Cesium.Color.fromCssColorString('#7dd3c8').withAlpha(0.10),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#7dd3c8').withAlpha(0.85),
            outlineWidth: 2,
          },
        });
      };
      window.setTimeout(fin, dureeMs + 60);
    });
    return { ligne, tete };
  }

  // ═══════════ 3 · couche AR : icônes flottantes ═══════════
  function iconesDeCategorie(cat, centre, indice) {
    const a = centre.analyse;
    const brut = a?.listes?.[cat.liste] || [];
    return brut
      .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon))
      .slice(0, 22)
      .map((p) => ({ lon: p.lon, lat: p.lat, nom: p.nom || cat.nom, indice }));
  }

  /**
   * Dispose des icônes en couronne autour du centre quand la catégorie n'a
   * aucun équipement connu : la couche AR reste visible et cliquable même
   * sur une zone peu renseignée (mieux vaut une icône « à vérifier » qu'un
   * écran vide).
   */
  function iconesDeRepli(cat, centre, combien = 3) {
    const out = [];
    for (let i = 0; i < combien; i += 1) {
      const angle = (i / combien) * Math.PI * 2 + 0.6;
      const rayon = 900 + i * 260; // m
      const dLat = (rayon * Math.cos(angle)) / 111000;
      const dLon = (rayon * Math.sin(angle)) / (111000 * Math.cos((centre.lat * Math.PI) / 180));
      out.push({ lon: centre.lon + dLon, lat: centre.lat + dLat, nom: cat.nom, indice: 50, repli: true });
    }
    return out;
  }

  async function activerAR(centre) {
    dsAR.entities.removeAll();
    dsBatCat.entities.removeAll();
    effacerCategorie();
    const t0 = Date.now();
    let total = 0;
    for (const cat of CATEGORIES_AR) {
      const indice = centre.analyse?.indices?.[cat.indice] ?? 60;
      let pois = iconesDeCategorie(cat, centre, indice);
      if (!pois.length) {
        // repli : on interroge directement OpenStreetMap
        const els = await overpass(
          `(node(around:2200,${centre.lat},${centre.lon})[${cat.filtre}];`
          + `way(around:2200,${centre.lat},${centre.lon})[${cat.filtre}];);out center tags 24;`,
        );
        pois = els
          .map((e) => ({ lon: e.lon ?? e.center?.lon, lat: e.lat ?? e.center?.lat, nom: e.tags?.name || cat.nom, indice }))
          .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
          .slice(0, 14);
      }
      if (!pois.length) pois = iconesDeRepli(cat, centre, 3);
      // les icônes trop proches se chevauchaient : on les écarte (~20 m)
      const gardes = espacer(pois.slice(0, 14), 0.0002);
      const nommes = gardes.filter((p) => p.nom && p.nom !== cat.nom).length;
      gardes.forEach((p, i) => {
        // ℹ️ l'icône porte le NOM RÉEL de l'équipement (et non plus seulement
        // la catégorie) + le nombre d'équipements de la zone : c'est lisible et
        // ça veut dire quelque chose.
        // 🌀 ROTATION 360° : le jeton tourne sur lui-même pendant qu'il se
        // pose (24 images, un tour ~4 s). Le nom reste fixe : lui seul doit
        // rester lisible.
        const images = spriteARTournant(cat, {
          taille: 320,
          valeur: indice,
          nom: p.nom || cat.nom,
          detail: `${nommes || gardes.length} équipement(s) · indice ${Math.round(indice)}%`,
          compte: nommes || gardes.length,
          images: 24,
        });
        if (!images.length) return;
        const image = images[0];
        const tourne = (t) => images[Math.floor(((t / 4000) % 1) * images.length) % images.length];
        const sol = bati?.solDe?.(p.lon, p.lat) || 0;
        const flottant = sol + 95 + (i % 6) * 16; // étagé → lisibilité
        dsAR.entities.add({
          position: new Cesium.CallbackProperty(() => Cesium.Cartesian3.fromDegrees(
            p.lon, p.lat,
            // le flottement s'arrête : au-delà de AR_FLOTTEMENT_MS l'icône se
            // pose, l'écran redevient tranquille et le rendu continu se relâche
            flottant + (Date.now() - t0 < AR_FLOTTEMENT_MS ? Math.sin((Date.now() - t0) / 700 + i) * 4.5 : 0),
          ), false),
          properties: {
            wtAR: cat.id,
            wtNom: p.nom,
            wtLon: p.lon,
            wtLat: p.lat,
          },
          billboard: {
            // l'image change à chaque tour : rotation 360° continue
            image: new Cesium.CallbackProperty(() => tourne(Date.now() - t0), false),
            width: 104,
            height: 104,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            // plus gros et plus lisible de loin (avant : 78 px)
            scaleByDistance: new Cesium.NearFarScalar(300, 1.35, 16000, 0.62),
          },
          label: {
            text: p.nom || cat.nom,
            font: '600 12px "JetBrains Mono", monospace',
            fillColor: Cesium.Color.WHITE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#070c12').withAlpha(0.82),
            pixelOffset: new Cesium.Cartesian2(0, 44),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2600),
          },
        });
        total += 1;
      });
    }
    // Les icônes FLOTTENT (CallbackProperty) : en `requestRenderMode` il faut
    // demander un rendu continu, sinon rien ne s'affiche.
    if (total) {
      holdContinuousRender('wt-ar');
      // les icônes se posent au bout de AR_FLOTTEMENT_MS → on rend la main
      window.clearTimeout(activerAR._t);
      activerAR._t = window.setTimeout(() => {
        releaseContinuousRender('wt-ar');
        governorRequestRender('wt-ar-pose');
      }, AR_FLOTTEMENT_MS + 400);
    } else releaseContinuousRender('wt-ar');
    governorRequestRender('wt-ar-icones');
    dire(total
      ? `🛰 <b>COUCHE AR ACTIVE</b> — ${total} icônes flottantes. Clique une icône (✚ santé, ❤️ bonheur…) : les bâtiments de sa catégorie se modélisent en 3D.`
      : '⚠ Couche AR indisponible (aucune donnée et aucune source joignable).');
    return total;
  }

  // ═══════════ 4 · clic sur une icône AR → bâtiments de la catégorie ═══════════
  async function activerCategorie(catId, centre) {
    const cat = categorieAR(catId);
    if (!cat) return;
    dire(`🏗 <b>${cat.nom}</b> — modélisation des bâtiments associés…`, 8000);
    // les emprises : le cache les rend instantanées si la zone est déjà chargée
    await bati?.charger?.({ lat: centre.lat, lon: centre.lon, rayon: 1200 });
    const lots = bati?.lots?.() || [];
    if (!lots.length) {
      dire('⚠ Aucune emprise de bâtiment chargée (source OSM indisponible).');
      return;
    }
    const pois = await poisDeCategorie(cat, centre);
    // appariement : le POI est DANS l'emprise, ou à défaut l'emprise la plus proche
    const retenus = new Map();
    for (const p of pois) {
      let lot = lots.find((l) => pointDansEmprise(p.lon, p.lat, l.anneau));
      if (!lot) {
        let meilleur = null;
        let dmin = 45; // m : au-delà, on considère que ce n'est pas le bon bâtiment
        for (const l of lots) {
          const d = Math.hypot((l.lon - p.lon) * 85000, (l.lat - p.lat) * 111000);
          if (d < dmin) { dmin = d; meilleur = l; }
        }
        lot = meilleur;
      }
      if (lot) retenus.set(lot.id, { lot, poi: p });
    }
    effacerCategorie();
    if (!retenus.size) {
      dire(`⚠ Aucun bâtiment ${cat.nom.toLowerCase()} rattaché à un équipement connu ici.`);
      return;
    }
    const couleur = cat.couleur;
    const toit = couleur; // toit ton-sur-ton, plus sombre via la 2ᵉ couche
    primCategorie = bati.extruder([...retenus.values()].map((r) => r.lot), {
      couleur,
      toit,
      surhausse: 1.2,
    });
    bati.ajouter(primCategorie.corps);
    bati.ajouter(primCategorie.toits);

    const indice = centre.analyse?.indices?.[cat.indice] ?? 60;
    for (const { lot, poi } of retenus.values()) {
      const image = spriteAR(cat, { taille: 128, valeur: indice, sansNom: true });
      if (!image) break;
      dsBatCat.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lot.lon, lot.lat, lot.sol + lot.h + 16),
        properties: { wtBatCat: cat.id, wtNom: poi.nom, wtLon: lot.lon, wtLat: lot.lat },
        billboard: {
          image,
          width: 42,
          height: 42,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(250, 1.1, 9000, 0.3),
        },
      });
    }
    dire(`✅ <b>${cat.nom}</b> — ${retenus.size} bâtiment(s) modélisé(s) en 3D · indice ${indice}% · ${cat.legende}.`, 7000);
    governorRequestRender('wt-bati-categorie');
  }

  async function poisDeCategorie(cat, centre) {
    const a = centre.analyse;
    const connus = (a?.listes?.[cat.liste] || [])
      .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon));
    if (connus.length) return connus;
    const els = await overpass(
      `(node(around:2500,${centre.lat},${centre.lon})[${cat.filtre}];`
      + `way(around:2500,${centre.lat},${centre.lon})[${cat.filtre}];);out center tags 40;`,
    );
    return els
      .map((e) => ({ lon: e.lon ?? e.center?.lon, lat: e.lat ?? e.center?.lat, nom: e.tags?.name || cat.nom }))
      .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
  }

  function effacerCategorie() {
    if (primCategorie) {
      bati?.retirer?.(primCategorie.corps);
      bati?.retirer?.(primCategorie.toits);
      try { primCategorie.corps?.destroy?.(); primCategorie.toits?.destroy?.(); } catch { /* ok */ }
      primCategorie = null;
    }
    dsBatCat.entities.removeAll();
  }

  // ═══════════ les vues ═══════════
  const vues = {
    /** 🗺 Plan 2D du dessus → contour animé → couche AR. */
    async communale() {
      const c0 = centreCourant();
      dire('🗺 <b>VUE COMMUNALE</b> — recherche du contour administratif…', 9000);
      const commune = await contourCommune(c0.lat, c0.lon);
      const centre = commune
        ? { ...centreBBox(bboxAnneaux(commune.anneaux)), analyse: c0.analyse }
        : c0;
      if (commune) {
        const bbox = bboxAnneaux(commune.anneaux);
        voler(centre.lat, centre.lon, altitudePourBBox(bbox, 1.2), -89.9, 2.2);
        dire(`🗺 <b>${commune.nom.toUpperCase()}</b> — tracé du plan cadastral…`, 9000);
        await attendre(2400);
        tracerContour(commune.anneaux, 2600);
        await animationEnCours;
        // légère mise en 3D pour que les icônes AR « flottent » vraiment
        voler(centre.lat, centre.lon, Math.min(altitudePourBBox(bboxAnneaux(commune.anneaux), 1.2), 3200), -62, 1.8);
        await attendre(1900);
      } else {
        voler(centre.lat, centre.lon, 4200, -89.9, 2);
        await attendre(2200);
      }
      await activerAR({ ...centre, analyse: centre.analyse || c0.analyse });
    },

    /** 🏘 3D rasante sur le quartier. */
    async quartier() {
      const c = centreCourant();
      const sol = bati?.solDe?.(c.lon, c.lat) || 0;
      voler(c.lat, c.lon, sol + 900, -38, 1.8);
      dire('🏘 <b>VUE QUARTIER</b> — 3D rasante à 900 m.', 4000);
      await bati?.charger?.({ lat: c.lat, lon: c.lon, rayon: 700 });
    },

    /** 👁 Caméra au sol, regard horizontal. */
    immersion() {
      const c = centreCourant();
      const sol = bati?.solDe?.(c.lon, c.lat) || 0;
      voler(c.lat, c.lon - 0.012, sol + 260, -8, 2);
      dire('👁 <b>IMMERSION</b> — caméra au sol, regard horizontal.', 4000);
    },

    /** 🌍 Retour à la vue globe. */
    orbite() {
      voler(20, 0, 22_000_000, -90, 2.4);
      dire('🌍 <b>ORBITE</b> — vue globe.', 3500);
    },

    /** 🔥 Zones d'équipements (délégué au jumeau INTEL). */
    heatzones() {
      heatzones?.();
      dire('🔥 <b>HEATZONES</b> — zones d’équipements basculées.', 3500);
    },

    /** 🏙 Volumes rapides (cache mémoire). */
    async bati3d() {
      const c = centreCourant();
      await bati?.charger?.({ lat: c.lat, lon: c.lon, rayon: 700, surProgres: (f, n) => {
        if (n) dire(`🏙 <b>BÂTI 3D</b> — ${n} volumes construits (${Math.round(f * 100)} %)…`, 9000);
      } });
    },
  };

  /**
   * Range les couches que la vue demandée n'utilise pas. Sans ça, les icônes
   * AR et le contour communal restaient affichés (et animés) sur les autres
   * vues — le bug « animation de scan en continu ».
   */
  function nettoyerPour(id) {
    const gardeAR = id === 'communale';
    if (!gardeAR) {
      window.clearTimeout(activerAR._t);
      dsAR.entities.removeAll();
      releaseContinuousRender('wt-ar');
      dsContour.entities.removeAll();
      generationContour += 1; // annule un tracé en cours
      releaseContinuousRender('wt-vues-contour');
    }
    if (id === 'bati3d' || id === 'communale') effacerCategorie();
  }

  async function appliquer(id) {
    nettoyerPour(id);
    const fn = vues[id];
    if (!fn) return;
    try {
      await fn();
    } catch (e) {
      dire(`⚠ Vue « ${id} » interrompue (${String(e?.message || e).slice(0, 60)}).`);
    }
  }

  // clic carte : icône AR → catégorie · icône bâtiment → fiche lieu
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((clic) => {
    if (window.__wtDessin || window.__wtPinArme) return;
    let picked = null;
    try { picked = viewer.scene.pick(clic.position); } catch { return; }
    const props = picked?.id?.properties;
    if (!props) return;
    const lire = (k) => { try { return props[k]?.getValue?.(); } catch { return undefined; } };
    const catAR = lire('wtAR');
    if (catAR) { activerCategorie(catAR, centreCourant()); return; }
    if (lire('wtBatCat') || lire('wtBatiIcone')) {
      const lon = lire('wtLon');
      const lat = lire('wtLat');
      if (Number.isFinite(lon) && Number.isFinite(lat)) fiche?.(lon, lat, lire('wtNom'));
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return {
    appliquer,
    vues: VUES,
    activerCategorie,
    effacerCategorie,
    effacer: () => {
      dsContour.entities.removeAll();
      dsAR.entities.removeAll();
      effacerCategorie();
      releaseContinuousRender('wt-ar');
      releaseContinuousRender('wt-vues-contour');
      governorRequestRender('wt-vues-effacer');
    },
    chip: () => chip,
  };
}
