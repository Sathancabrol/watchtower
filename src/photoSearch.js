/**
 * WATCHTOWER — IDENTIFIER UN LIEU PAR PHOTO (PHOTO SEARCH).
 *
 * Deux voies, toutes locales :
 *  1. EXIF : la plupart des photos de smartphone portent leurs coordonnées GPS
 *     dans l'en-tête (JPEG APP1 / PNG eXIf). On les lit DANS LE NAVIGATEUR —
 *     aucune image n'est envoyée nulle part, ni à nous ni à un serveur.
 *  2. Sinon : la photo est affichée dans la fenêtre et l'utilisateur POSE
 *     LUI-MÊME le point (épingle) — ce qui sert aussi à définir le point
 *     d'ancrage T0 de la fonction « ME LOCALISER ».
 *
 * Accessible de deux façons : bouton 🖼 dans l'interface de base (à côté de
 * MOI) et glisser-déposer une photo n'importe où sur l'application.
 */

import * as Cesium from 'cesium';
import { amenagerFenetre } from './fenetres.js';

const CSS = `
#wt-photo {
  position: fixed; z-index: 1220; left: 50%; top: 22vh; transform: translateX(-50%);
  width: 320px; padding: 14px; display: none;
  font-family: var(--font-mono, monospace); font-size: 10px; color: #e8eaed;
  background: linear-gradient(180deg, rgba(12,16,26,0.97), rgba(8,11,18,0.97));
  border: 1px solid rgba(0,212,255,0.4); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}
#wt-photo .p-titre { font-size: 12px; font-weight: 800; letter-spacing: 2px; color: #00d4ff; margin-bottom: 8px; display: flex; gap: 8px; align-items: center; }
#wt-photo .p-titre .fermer { margin-left: auto; cursor: pointer; background: none; border: none; color: inherit; font-size: 14px; }
#wt-photo .p-zone {
  border: 1px dashed rgba(0,212,255,0.45); border-radius: 10px; padding: 18px 10px; text-align: center;
  cursor: pointer; color: rgba(232,234,237,0.7); line-height: 1.7; transition: background .15s;
}
#wt-photo .p-zone:hover { background: rgba(0,212,255,0.08); }
#wt-photo .p-zone.survol { background: rgba(0,212,255,0.18); }
#wt-photo img.p-apercu { width: 100%; max-height: 190px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
#wt-photo .p-result { line-height: 1.7; color: rgba(232,234,237,0.8); }
#wt-photo .p-result b { color: #43d17a; }
#wt-photo .p-actions { display: flex; gap: 6px; margin-top: 9px; flex-wrap: wrap; }
#wt-photo .p-btn {
  flex: 1; min-width: 96px; cursor: pointer; padding: 8px 6px; border-radius: 8px; font-family: inherit;
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-photo .p-btn:hover { background: rgba(0,212,255,0.25); }
#wt-photo .p-btn.vert { background: rgba(67,209,122,0.12); border-color: rgba(67,209,122,0.45); color: #43d17a; }
#wt-photo .p-view { max-height: 30vh; overflow-y: auto; margin-top: 8px; }
#wt-photo-veil {
  position: fixed; inset: 0; z-index: 3000; display: none; align-items: center; justify-content: center;
  background: rgba(0,10,20,0.72); backdrop-filter: blur(3px);
  font-family: var(--font-mono, monospace); font-size: 18px; font-weight: 800; letter-spacing: 3px;
  color: #00d4ff; border: 3px dashed rgba(0,212,255,0.7); box-sizing: border-box;
}
#wt-photo-veil.actif { display: flex; }
#wt-photo-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; width: 100%; font-family: inherit;
  font-size: 9.5px; font-weight: 700; letter-spacing: 1px; text-align: left;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-photo-btn:hover { background: rgba(0,212,255,0.22); }
`;

// ————————————————————————————————————————————————————————————————
// LECTURE EXIF — fonctions pures, testables sans navigateur
// ————————————————————————————————————————————————————————————————

/**
 * Lit un RATIONAL EXIF (2 entiers 32 bits : numérateur / dénominateur).
 * `debut` est l'offset du bloc TIFF dans le fichier, `offset` la position du
 * rationnel RELATIVE à ce bloc (convention EXIF).
 */
function rationnelVersNombre(data, debut, offset, littleEndian) {
  const num = data.getUint32(debut + offset, littleEndian);
  const den = data.getUint32(debut + offset + 4, littleEndian);
  return den === 0 ? 0 : num / den;
}

function lireChaine(dv, debut, longueur) {
  let s = '';
  for (let i = 0; i < longueur; i += 1) {
    const c = dv.getUint8(debut + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/** Cherche le premier bloc « Exif\0\0 » dans un buffer (JPEG APP1 ou PNG eXIf). */
export function trouverBlocExif(buffer) {
  const dv = new DataView(buffer);
  const n = dv.byteLength;
  for (let i = 0; i + 4 <= n; i += 1) {
    if (dv.getUint8(i) === 0x45 && dv.getUint8(i + 1) === 0x78
      && dv.getUint8(i + 2) === 0x69 && dv.getUint8(i + 3) === 0x66) {
      // « Exif » suivi de \0\0 puis de l'en-tête TIFF
      for (let p = i + 4; p + 4 <= n; p += 1) {
        if (dv.getUint8(p) === 0x49 && dv.getUint32(p, false) === 0x49492A00) return p; // II*\0
        if (dv.getUint32(p, false) === 0x4D4D002A) return p; // MM\0*
      }
    }
  }
  return -1;
}

/**
 * Lit l'IFD0 d'un bloc TIFF et rend une map {tag: {type, count, offset}}.
 * @param {DataView} dv
 * @param {number} debutTiff offset du début du TIFF ( « II*\0 » )
 */
export function lireIFD(dv, debutTiff) {
  const little = dv.getUint16(debutTiff, false) === 0x4949;
  const debutIFD = dv.getUint32(debutTiff + 4, little);
  return { little, debutIFD, entrees: lireEntrees(dv, debutTiff, debutIFD, little) };
}

function lireEntrees(dv, debutTiff, debutIFD, little) {
  const nb = dv.getUint16(debutTiff + debutIFD, little);
  const out = new Map();
  for (let i = 0; i < nb; i += 1) {
    const e = debutTiff + debutIFD + 2 + i * 12;
    if (e + 12 > dv.byteLength) break;
    const tag = dv.getUint16(e, little);
    const type = dv.getUint16(e + 2, little);
    const count = dv.getUint32(e + 4, little);
    // valeur sur 4 octets si elle tient, sinon offset
    const valeur = dv.getUint32(e + 8, little);
    out.set(tag, { type, count, valeur, offset: e + 8, debutTiff, little });
  }
  return out;
}

/** Convertit 3 rationnels deg/min/sec (+ref N/S/E/W) en degrés décimaux. */
export function dmsVersDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 3) return null;
  const [d, m, s] = dms;
  if (![d, m, s].every((x) => Number.isFinite(x))) return null;
  const val = Math.abs(d) + Math.abs(m) / 60 + Math.abs(s) / 3600;
  const signe = (ref === 'S' || ref === 'W') ? -1 : 1;
  return val * signe;
}

/**
 * Extrait les coordonnées GPS d'un fichier image (ArrayBuffer).
 * @param {ArrayBuffer} buffer
 * @returns {{lat:number, lon:number, alt:number|null, date:string|null}|null}
 */
export function extraireGpsExif(buffer) {
  if (!buffer || buffer.byteLength < 12) return null;
  const dv = new DataView(buffer);
  const debut = trouverBlocExif(buffer);
  if (debut < 0) return null;
  let ifd0;
  try { ifd0 = lireIFD(dv, debut); } catch { return null; }
  const { little, debutIFD, entrees } = ifd0;
  const gpsTag = entrees.get(0x8825); // GPSInfoIFDPointer
  if (!gpsTag) return null;
  let gps;
  try { gps = lireEntrees(dv, debut, gpsTag.valeur, little); } catch { return null; }
  if (!gps || !gps.size) return null;

  const trois = (e) => (e && e.count >= 3 && e.type === 5
    ? [0, 1, 2].map((i) => rationnelVersNombre(dv, debut, dv.getUint32(e.offset, little) + i * 8, little))
    : null);

  const latE = gps.get(2);
  const lonE = gps.get(4);
  const lat = dmsVersDecimal(trois(latE), lireTexte(gps, dv, debut, little, 1));
  const lon = dmsVersDecimal(trois(lonE), lireTexte(gps, dv, debut, little, 3));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const altE = gps.get(6);
  const alt = altE && altE.type === 5
    ? rationnelVersNombre(dv, debut, dv.getUint32(altE.offset, little), little)
    : null;

  // date de prise de vue : 0x9003 (ExifIFD) ou 0x0132 (IFD0)
  let date = null;
  try {
    const exifTag = entrees.get(0x8769);
    if (exifTag) {
      const exif = lireEntrees(dv, debut, exifTag.valeur, little);
      date = lireTexte(exif, dv, debut, little, 0x9003) || lireTexte(exif, dv, debut, little, 0x9004);
    }
  } catch { /* optionnel */ }
  if (!date) date = lireTexte(entrees, dv, debut, little, 0x0132);

  return { lat, lon, alt: Number.isFinite(alt) ? alt : null, date: date || null, debutIFD: undefined };
}

function lireTexte(map, dv, debutTiff, little, tag) {
  const e = map.get(tag);
  if (!e) return null;
  try {
    if (e.count <= 4 && e.type === 2) {
      // chaîne inline dans les 4 octets de valeur
      let s = '';
      for (let i = 0; i < e.count; i += 1) {
        const c = dv.getUint8(e.offset + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s || null;
    }
    return lireChaine(dv, debutTiff + e.valeur, Math.min(e.count, 64)) || null;
  } catch { return null; }
}

// ————————————————————————————————————————————————————————————————
// INTERFACE
// ————————————————————————————————————————————————————————————————

/**
 * @param {object} viewer
 * @param {{fiche?:Function, surMessage?:Function, poserEpingle?:Function}} [options]
 */
export function initPhotoSearch(viewer, options = {}) {
  const { fiche = null, surMessage = null, poserEpingle = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const fen = document.createElement('div');
  fen.id = 'wt-photo';
  fen.innerHTML = `
    <div class="p-titre">🖼 IDENTIFIER UN LIEU<button class="fermer" type="button" title="Fermer">×</button></div>
    <div class="p-zone">DÉPOSE UNE PHOTO ICI<br>ou clique pour parcourir<br>
      <span style="font-size:8px;opacity:.6">coordonnées GPS lues dans la photo (EXIF) — rien n'est envoyé sur internet</span>
    </div>
    <input type="file" accept="image/*" style="display:none">
    <div class="p-vignette"></div>
    <div class="p-result"></div>
    <div class="p-actions" style="display:none"></div>
    <div class="p-view"></div>`;
  document.body.appendChild(fen);
  amenagerFenetre(fen, { cle: 'wt-photo', poignee: fen.querySelector('.p-titre'), redimensionnable: true, minW: 220, minH: 120 });

  const voile = document.createElement('div');
  voile.id = 'wt-photo-veil';
  voile.textContent = 'DÉPOSE LA PHOTO POUR L’IDENTIFIER';
  document.body.appendChild(voile);

  const zone = fen.querySelector('.p-zone');
  const input = fen.querySelector('input[type=file]');
  const vignette = fen.querySelector('.p-vignette');
  const result = fen.querySelector('.p-result');
  const actions = fen.querySelector('.p-actions');
  const historique = fen.querySelector('.p-view');

  const historiqueItems = [];
  let trouve = null; // dernier point trouvé {lat, lon}
  let urlApercu = null;

  fen.querySelector('.fermer').addEventListener('click', () => { fen.style.display = 'none'; });

  function rendreHistorique() {
    historique.innerHTML = historiqueItems.slice(-8).reverse().map((h, i) => `
      <div style="display:flex;gap:6px;align-items:center;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.04);margin-bottom:3px">
        <span>${h.date || '📷'}</span>
        <button data-i="${historiqueItems.length - 1 - i}" class="aller" style="flex:1;text-align:left;background:none;border:none;color:inherit;font-family:inherit;font-size:9px;cursor:pointer">${h.nom}</button>
        <span style="color:#43d17a">${h.lat.toFixed(5)}, ${h.lon.toFixed(5)}</span>
      </div>`).join('');
    historique.querySelectorAll('.aller').forEach((b) => b.addEventListener('click', () => {
      const h = historiqueItems[Number(b.dataset.i)];
      if (h) yAller(h.lat, h.lon, h.nom);
    }));
  }

  function yAller(lat, lon, nom) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 320),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
      duration: 3,
    });
    surMessage?.(`🖼 Lieu identifié : ${nom}`);
  }

  function afficherResultat(info, nomFichier) {
    result.innerHTML = info.gps
      ? `📍 <b>${info.gps.lat.toFixed(6)}</b>, <b>${info.gps.lon.toFixed(6)}</b>${info.gps.date ? `<br>🕐 ${info.gps.date}` : ''}`
      : `⚠️ Aucune coordonnée GPS dans « ${nomFichier} ».<br>
         <span style="font-size:9px;opacity:.7">Pose le point toi-même : le lieu deviendra ton point d'ancrage T0 pour « ME LOCALISER ».</span>`;
    actions.style.display = '';
    actions.innerHTML = info.gps
      ? `<button class="p-btn vert" data-a="aller">✈ Y ALLER</button>
         <button class="p-btn" data-a="epingle">📍 ÉPINGLE</button>
         <button class="p-btn" data-a="fiche">📋 FICHE</button>
         <button class="p-btn" data-a="ancrer">⚓ T0</button>`
      : `<button class="p-btn vert" data-a="epingle">📍 POSER LE POINT</button>
         <button class="p-btn" data-a="ancrer">⚓ T0</button>`;
    const cible = info.gps || info.manuel;
    actions.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (!info.gps && !info.manuel) {
        surMessage?.('📍 Clique sur la carte pour poser le point de la photo.');
        poserEpingle?.({ nom: nomFichier, surPoint: (p) => {
          info.manuel = p;
          trouve = { lat: p.lat, lon: p.lon };
          afficherResultat(info, nomFichier);
        } });
        return;
      }
      const a = b.dataset.a;
      if (a === 'aller') yAller(cible.lat, cible.lon, nomFichier);
      if (a === 'epingle') { poserEpingle?.({ nom: nomFichier, lon: cible.lon, lat: cible.lat }); surMessage?.('📍 Épingle posée.'); }
      if (a === 'fiche') fiche?.(cible.lat, cible.lon, nomFichier);
      if (a === 'ancrer') {
        try {
          window.localStorage.setItem('watchtower.ancrage.v1', JSON.stringify({ lat: cible.lat, lon: cible.lon, t: Date.now(), origine: 'photo' }));
          surMessage?.('⚓ Point d’ancrage T0 enregistré (utilisé par « ME LOCALISER »).');
        } catch { /* ok */ }
      }
    }));
  }

  async function traiterFichier(fichier) {
    if (!fichier || !/^image\//.test(fichier.type)) {
      surMessage?.('⚠️ Ce fichier n’est pas une image.');
      return;
    }
    if (urlApercu) URL.revokeObjectURL(urlApercu);
    urlApercu = URL.createObjectURL(fichier);
    vignette.innerHTML = `<img class="p-apercu" src="${urlApercu}" alt="aperçu">`;
    result.textContent = '⏳ Lecture des métadonnées…';
    actions.style.display = 'none';
    let gps = null;
    try {
      const buf = await fichier.arrayBuffer();
      gps = extraireGpsExif(buf);
    } catch { gps = null; }
    trouve = gps ? { lat: gps.lat, lon: gps.lon } : null;
    afficherResultat({ gps }, fichier.name.slice(0, 42));
    if (gps) {
      historiqueItems.push({ nom: fichier.name.slice(0, 28), lat: gps.lat, lon: gps.lon, date: (gps.date || '').slice(0, 10) });
      rendreHistorique();
    }
    fen.style.display = '';
  }

  const ouvrir = () => { fen.style.display = ''; input.click(); };
  zone.addEventListener('click', ouvrir);
  input.addEventListener('change', () => { if (input.files?.[0]) traiterFichier(input.files[0]); });

  // ——— glisser-déposer global ———
  let compteur = 0;
  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    compteur += 1; voile.classList.add('actif');
  });
  window.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
  window.addEventListener('dragleave', () => {
    compteur = Math.max(0, compteur - 1);
    if (!compteur) voile.classList.remove('actif');
  });
  window.addEventListener('drop', (e) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    compteur = 0; voile.classList.remove('actif');
    traiterFichier(e.dataTransfer.files[0]);
  });

  /**
   * Bouton cliquable prêt à être inséré n'importe où dans l'interface de base
   * (notamment juste à côté du bouton MOI).
   */
  function bouton() {
    const b = document.createElement('button');
    b.id = 'wt-photo-btn';
    b.type = 'button';
    b.innerHTML = '🖼 IDENTIFIER UN LIEU <span style="opacity:.6">(photo → GPS)</span>';
    b.addEventListener('click', ouvrir);
    return b;
  }

  /**
   * Variante compacte, taillée pour la barre du dock (à côté du bouton MOI).
   */
  function boutonDock() {
    const b = bouton();
    b.className = 'wt-dock-btn';
    b.innerHTML = '<span class="ic">🖼</span><span class="lb">IDENTIFIER</span>';
    b.title = 'Identifier un lieu : dépose une photo, ses coordonnées GPS (EXIF) donnent la position';
    return b;
  }

  return {
    element: fen,
    bouton,
    boutonDock,
    ouvrir,
    traiterFichier,
    extraireGpsExif,
    dernier: () => trouve,
    /** Retrouve les coordonnées d'une photo sans ouvrir l'interface. */
    async coordonnees(fichier) {
      try { return extraireGpsExif(await fichier.arrayBuffer()); } catch { return null; }
    },
  };
}
