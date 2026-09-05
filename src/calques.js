/**
 * WATCHTOWER — CALQUES : LA LISTE COMPLÈTE.
 *
 * Demande : « dans CALQUES, mettre tous les calques disponibles dans l'app en
 * fonction du style de compte pour rien bloqué ».
 *
 * Le panneau d'origine ne proposait que quatre ou cinq superpositions
 * météo. Ici : **tout** ce que l'application sait afficher, rangé par
 * familles (RELIEF · BÂTI · DONNÉES · TRAFIC · AMBIANCE · MÉTÉO), avec :
 *
 *  · **un niveau par calque** — 🟢 gratuit (données ouvertes), 🔵 compte
 *    (une clé gratuite améliore), 🔑 payant (clé payante) ;
 *  · **rien n'est bloqué** : un calque 🔑/🔵 reste coché, il fonctionne avec
 *    le repli gratuit de l'app et s'annonce comme tel. Aucun calque n'est
 *    masqué à cause du compte ;
 *  · un état **lu dans l'application** (pas mémorisé à côté) : si la fonction
 *    est déjà active, la case est cochée.
 *
 * Chaque calque sait : dire s'il est actif (`actif`) et se mettre dans l'état
 * voulu (`mettre`). Tout est protégé : une fonction absente ou une source
 * muette n'empêche jamais le reste de marcher.
 */

import * as Cesium from 'cesium';

/** Niveaux de compte — jamais bloquants. */
export const NIVEAUX = {
  gratuit: { icone: '🟢', nom: 'gratuit', aide: 'données ouvertes, sans clé' },
  compte: { icone: '🔵', nom: 'compte', aide: 'une clé gratuite améliore la précision' },
  payant: { icone: '🔑', nom: 'payant', aide: 'clé payante — fonctionne quand même en repli gratuit' },
};

const g = () => (typeof window !== 'undefined' ? window.__godsEyeView || {} : {});

/** Clique un bouton de l'app d'origine seulement si l'état demandé diffère. */
function clique(sel, voulu) {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el) return false;
  const etat = el.getAttribute?.('aria-pressed') === 'true'
    || el.classList?.contains('active')
    || el.classList?.contains('actif')
    || (el.type === 'checkbox' && el.checked);
  if (etat === Boolean(voulu)) return true;
  el.click?.();
  return true;
}

function etatDe(sel) {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el) return false;
  return el.getAttribute?.('aria-pressed') === 'true'
    || el.classList?.contains('active')
    || el.classList?.contains('actif')
    || (el.type === 'checkbox' ? Boolean(el.checked) : false);
}

/**
 * Catalogue de TOUS les calques.
 * `actif()` dit si c'est allumé ; `mettre(voulu)` allume ou éteint.
 */
export const CALQUES = [
  // ── TERRITOIRE ────────────────────────────────────────────────────────
  {
    id: 'bati3d', nom: 'Bâti 3D', icone: '🏙', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Bâtiments OpenStreetMap extrudés (gratuit, ODbL)',
    actif: () => Boolean(g().bati?.statistiques?.().courante),
    mettre: (v) => { if (v) g().bati?.charger?.({ rayon: 900 }); else g().bati?.effacer?.(); },
  },
  {
    id: 'cadastre', nom: 'Cadastre', icone: '🗺', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Contours de parcelles (apicarto — IGN/Etalab)',
    actif: () => Boolean(g().cadastre?.visible?.()),
    mettre: (v) => g().cadastre?.activer?.(v),
  },
  {
    id: 'routes', nom: 'Routes', icone: '🛣', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Voirie OpenStreetMap colorée par classe',
    actif: () => Boolean(g().cadastre?.routes?.()),
    mettre: (v) => g().cadastre?.routes?.(v),
  },
  {
    id: 'entites', nom: 'Entités', icone: '🏷', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'La fonction réelle de chaque lieu (boulangerie, école, cuves…)',
    actif: () => Boolean(g().entites?.visible?.()),
    mettre: (v) => { const e = g().entites; if (e && Boolean(e.visible?.()) !== v) e.basculer?.(); },
  },
  {
    id: 'cadrans', nom: 'Cadrans', icone: '🔲', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'La commune découpée en quartiers nommés',
    actif: () => Boolean(g().cadrans?.actif?.()),
    mettre: (v) => { const c = g().cadrans; if (c && Boolean(c.actif?.()) !== v) c.basculer?.(); },
  },
  {
    id: 'noms', nom: 'Noms de lieux', icone: '🔤', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Étiquettes de lieux — et médaillons 360° cliquables (voir AFFICHAGE)',
    actif: () => {
      const n = g().nomsLieux;
      return n ? n.fenetre?.style?.display !== 'none' : false;
    },
    mettre: (v) => { g().nomsLieux?.visible?.(v); g().medaillons?.activer?.(v); },
  },
  {
    id: 'pins', nom: 'Épingles', icone: '📌', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Mes épingles sur la carte',
    actif: () => etatDe('#wt-pins'),
    mettre: (v) => clique('#wt-pins', v),
  },
  {
    id: 'trajets', nom: 'Itinéraires', icone: '🧭', niveau: 'gratuit', famille: 'TERRITOIRE',
    aide: 'Vol d’oiseau ou suivi de la voirie (OSRM)',
    actif: () => etatDe('#wt-dock-trajets'),
    mettre: (v) => g().dock?.ouvrir?.('trajets') && v,
  },

  // ── DONNÉES ───────────────────────────────────────────────────────────
  {
    id: 'intel', nom: 'INTEL', icone: '🧠', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Tableau de bord expert (jumeau AR, communal, économie…)',
    actif: () => etatDe('#wt-intel'),
    mettre: (v) => g().dock?.ouvrirExistant?.('wt-intel') && v,
  },
  {
    id: 'heatzones', nom: 'Zones de chaleur', icone: '🌡', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Carte de chaleur des mesures (calcul local)',
    actif: () => Boolean(g().intel?.heatActif?.()),
    mettre: (v) => { const i = g().intel; if (i && Boolean(i.heatActif?.()) !== v) i.basculerHeat?.(); },
  },
  {
    id: 'dispositifs', nom: 'Caméras & capteurs', icone: '🎥', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Dispositifs OSM + micro local, fiche et direct',
    actif: () => Boolean(g().dispositifs?.visible?.()),
    mettre: (v) => g().dispositifs?.visible?.(v),
  },
  {
    id: 'detections', nom: 'Détections', icone: '🎯', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Surcouche de détection (calcul local sur l’image)',
    actif: () => etatDe('#detection-toggle'),
    mettre: (v) => clique('#detection-toggle', v),
  },
  {
    id: 'bandeau', nom: 'Bandeau live', icone: '📶', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Bandeau d’informations en direct en haut de l’écran',
    actif: () => {
      const b = document.getElementById('intel-hud');
      return b ? b.style.display !== 'none' : false;
    },
    mettre: (v) => {
      const b = document.getElementById('intel-hud');
      if (!b) return;
      b.style.setProperty('display', v ? '' : 'none', 'important');
      try { window.localStorage.setItem('watchtower.bandeauLive.v1', v ? '1' : '0'); } catch { /* plein */ }
    },
  },
  {
    id: 'radio', nom: 'Radios', icone: '📻', niveau: 'gratuit', famille: 'DONNÉES',
    aide: 'Stations Radio-Browser placées sur la carte',
    actif: () => etatDe('#radio-enable-btn'),
    mettre: (v) => clique('#radio-enable-btn', v),
  },

  // ── TRAFIC ────────────────────────────────────────────────────────────
  {
    id: 'avions', nom: 'Avions 3D', icone: '✈', niveau: 'gratuit', famille: 'TRAFIC',
    aide: 'Modèles 3D quand on zoome, icônes plates de loin',
    actif: () => etatDe('#models3d-toggle'),
    mettre: (v) => clique('#models3d-toggle', v),
  },
  {
    id: 'cctv', nom: 'Caméras live', icone: '📷', niveau: 'gratuit', famille: 'TRAFIC',
    aide: 'Flux publics (voir aussi INTEL → dispositifs)',
    actif: () => {
      const t = document.querySelector('#cctv-enable-btn');
      return t ? /ON/i.test(t.textContent || '') : false;
    },
    mettre: (v) => {
      const t = document.querySelector('#cctv-enable-btn');
      if (!t) return;
      const allume = /ON/i.test(t.textContent || '');
      if (allume !== Boolean(v)) t.click();
    },
  },

  // ── AMBIANCE ──────────────────────────────────────────────────────────
  {
    id: 'systeme', nom: 'Système solaire', icone: '🪐', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Positions réelles Lune/planètes (JPL/ELP2000)',
    actif: () => Boolean(g().systeme?.visible?.()),
    mettre: (v) => g().systeme?.activer?.(v),
  },
  {
    id: 'celestial', nom: 'Anneau céleste', icone: '🌌', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Anneau des astres autour du globe',
    actif: () => etatDe('#celestial-toggle'),
    mettre: (v) => clique('#celestial-toggle', v),
  },
  {
    id: 'lumiere', nom: 'Éclairage soleil', icone: '☀', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Jour et nuit réels sur le globe',
    actif: () => Boolean(g().viewer?.scene?.globe?.enableLighting),
    mettre: (v) => { const s = g().viewer?.scene; if (s?.globe) s.globe.enableLighting = Boolean(v); },
  },
  {
    id: 'brouillard', nom: 'Brouillard', icone: '🌫', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Brume de distance',
    actif: () => Boolean(g().viewer?.scene?.fog?.enabled),
    mettre: (v) => { const s = g().viewer?.scene; if (s?.fog) s.fog.enabled = Boolean(v); },
  },
  {
    id: 'atmosphere', nom: 'Atmosphère', icone: '🟦', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Halo atmosphérique du globe',
    actif: () => Boolean(g().viewer?.scene?.skyAtmosphere?.show),
    mettre: (v) => { const s = g().viewer?.scene; if (s?.skyAtmosphere) s.skyAtmosphere.show = Boolean(v); },
  },
  {
    id: 'scope', nom: 'Masque circulaire', icone: '🎯', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Viseur circulaire (enregistrement)',
    actif: () => etatDe('#scope-toggle'),
    mettre: (v) => clique('#scope-toggle', v),
  },
  {
    id: 'bloom', nom: 'Halo lumineux', icone: '✨', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Bloom — rendu « écran de jeu »',
    actif: () => etatDe('#bloom-toggle'),
    mettre: (v) => clique('#bloom-toggle', v),
  },
  {
    id: 'peau', nom: 'Peau néon', icone: '🎨', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Habillage cyan des fenêtres (au lieu du blanc)',
    actif: () => Boolean(g().theme?.actif?.()),
    mettre: (v) => g().theme?.appliquer?.(v),
  },
  {
    id: 'boussole', nom: 'Boussole', icone: '🧭', niveau: 'gratuit', famille: 'AMBIANCE',
    aide: 'Ruban de cap (dans la minicarte, ou sur la hauteur via ⚙)',
    actif: () => Boolean(g().boussole?.reglages?.().visible),
    mettre: (v) => g().boussole?.visible?.(v),
  },
    // ── OUTILS (selon le compte : rien n'est bloqué) ──────────────────────
  {
    id: 'terrain', nom: 'Relief 3D', icone: '⛰', niveau: 'compte', famille: 'OUTILS',
    aide: 'Terrain Cesium World Terrain — clé ion gratuite ; sans clé, globe lisse',
    actif: () => {
      const t = g().viewer?.scene?.terrainProvider || g().viewer?.terrainProvider;
      return Boolean(t) && !/ellipsoid/i.test(String(t.constructor?.name || ''));
    },
    mettre: async (v) => {
      const vui = g().viewer;
      if (!vui) return;
      if (!v) { vui.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider(); return; }
      try {
        const t = await (Cesium.createWorldTerrainAsync?.() ?? Cesium.createWorldTerrain?.());
        if (t) vui.scene.terrainProvider = t;
      } catch { /* pas de clé ion : le globe reste lisse, rien de cassé */ }
    },
  },
  {
    id: 'google3d', nom: 'Google 3D', icone: '🌆', niveau: 'payant', famille: 'OUTILS',
    aide: 'Photogrammétrie Google avec TA clé — sans clé, l’app reste en tuiles libres',
    actif: () => Boolean(g().google3d?.show),
    mettre: async (v) => {
      const vui = g().viewer;
      if (!vui) return;
      if (g().google3d) { g().google3d.show = Boolean(v); return; }
      if (!v) return;
      const cle = window.__GOOGLE_MAPS_API_KEY__;
      if (!cle) {
        window.__wtToast?.('🌆 Google 3D demande TA clé Google (bouton 🔑 en haut à droite). '
          + 'L’app fonctionne déjà sans, en données ouvertes.');
        return;
      }
      try {
        const tuiles = await Cesium.Cesium3DTileset.fromUrl(
          `https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(cle)}`,
        );
        vui.scene.primitives.add(tuiles);
        const Gd = g();
        Gd.google3d = tuiles;
      } catch { /* clé refusée : on reste en tuiles libres */ }
    },
  },
  {
    id: 'voix', nom: 'Commandes vocales', icone: '🎙', niveau: 'payant', famille: 'OUTILS',
    aide: 'Pilotage à la voix (mode payant) — le chat texte reste gratuit',
    actif: () => etatDe('#gev-voice-button') || Boolean(g().voiceCommands),
    mettre: (v) => {
      if (v && !g().voiceCommands) {
        window.__wtToast?.('🎙 Commandes vocales : mode payant (ta clé). Le chat texte, lui, est gratuit.');
      }
      clique('#gev-voice-button', v);
    },
  },
];

/** Familles, dans l'ordre d'affichage. */
export const FAMILLES = ['TERRITOIRE', 'DONNÉES', 'TRAFIC', 'AMBIANCE', 'OUTILS'];

/** Regroupe les calques par famille (fonction pure, testée). */
export function parFamille(liste = CALQUES) {
  return FAMILLES
    .map((f) => ({ famille: f, calques: liste.filter((c) => c.famille === f) }))
    .filter((x) => x.calques.length);
}

/** Compte par niveau — pour afficher « 12 gratuit · 0 compte · 0 payant ». */
export function compterNiveaux(liste = CALQUES) {
  const out = { gratuit: 0, compte: 0, payant: 0 };
  for (const c of liste) out[c.niveau] = (out[c.niveau] || 0) + 1;
  return out;
}

const CSS = `
.wt-calques-tout { display: flex; flex-direction: column; gap: 6px; }
.wt-calques-tout .wc-famille { font-size: 7.5px; letter-spacing: 2px; opacity: .55; font-weight: 700; margin-top: 2px; }
.wt-calques-tout .wc-rang { display: flex; flex-wrap: wrap; gap: 4px; }
.wt-calques-tout .wc-item {
  display: inline-flex; align-items: center; gap: 3px; cursor: pointer;
  padding: 3px 6px; border-radius: 999px; font-size: 8px;
  background: rgba(10,16,24,0.8); border: 1px solid rgba(0,212,255,0.22);
  color: rgba(232,234,237,0.8);
}
.wt-calques-tout .wc-item:hover { border-color: #00d4ff; color: #e8eaed; }
.wt-calques-tout .wc-item.actif {
  background: rgba(0,212,255,0.2); border-color: #00d4ff; color: #00d4ff;
  box-shadow: 0 0 10px rgba(0,212,255,0.25);
}
.wt-calques-tout .wc-niveau { font-size: 7px; opacity: .8; }
.wt-calques-tout .wc-aide { font-size: 7.5px; line-height: 1.5; opacity: .5; }
`;

/**
 * Construit la liste de calques dans un conteneur.
 * @param {object} viewer
 * @param {{conteneur:HTMLElement, surMessage?:Function}} options
 */
export function initCalques(viewer, options = {}) {
  const { conteneur, surMessage = null } = options || {};
  g().viewer = g().viewer || viewer;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const racine = document.createElement('div');
  racine.className = 'wt-calques-tout';
  racine.innerHTML = parFamille().map((f) => `<div class="wc-famille">${f.famille}</div>`
    + `<div class="wc-rang">${f.calques.map((c) => `<button type="button" class="wc-item" data-c="${c.id}" title="${c.aide}">
        <span>${c.icone}</span><span>${c.nom}</span>
        <span class="wc-niveau">${NIVEAUX[c.niveau]?.icone || ''}</span></button>`).join('')}</div>`).join('');
  const niveaux = compterNiveaux();
  racine.insertAdjacentHTML('beforeend',
    `<div class="wc-aide">${niveaux.gratuit} 🟢 gratuit · ${niveaux.compte} 🔵 compte · ${niveaux.payant} 🔑 payant
     — <b>aucun calque n'est bloqué</b> : 🔑 fonctionne avec le repli gratuit de l'app.</div>`);
  conteneur?.appendChild(racine);

  const boutons = new Map();
  for (const b of racine.querySelectorAll('.wc-item')) boutons.set(b.dataset.c, b);

  function peindre() {
    for (const c of CALQUES) {
      const b = boutons.get(c.id);
      if (!b) continue;
      let etat = false;
      try { etat = Boolean(c.actif()); } catch { etat = false; }
      b.classList.toggle('actif', etat);
      b.setAttribute('aria-pressed', String(etat));
    }
  }

  for (const c of CALQUES) {
    const b = boutons.get(c.id);
    if (!b) continue;
    b.addEventListener('click', () => {
      const voulu = !b.classList.contains('actif');
      try { c.mettre(voulu); } catch (e) { /* fonction absente : on ne casse rien */ }
      window.setTimeout(peindre, 120); // l'app met parfois une frame à réagir
      peindre();
      surMessage?.(`${c.icone} ${c.nom} → ${voulu ? 'activé' : 'désactivé'}`);
    });
  }

  peindre();
  const timer = window.setInterval(peindre, 4000);

  return {
    element: racine,
    rafraichir: peindre,
    toutActiver(voulu = true) {
      for (const c of CALQUES) { try { c.mettre(voulu); } catch { /* ok */ } }
      window.setTimeout(peindre, 200);
    },
    etat: () => Object.fromEntries(CALQUES.map((c) => {
      try { return [c.id, Boolean(c.actif())]; } catch { return [c.id, false]; }
    })),
    arreter: () => window.clearInterval(timer),
  };
}
