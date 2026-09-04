/**
 * WATCHTOWER — chat textuel (console de commandes).
 *
 * Alternative gratuite et silencieuse à la voix : on TAPE ce qu'on veut, en
 * français. Sans clé, sans IA payante — géocodage BAN/Photon, météo
 * Open-Meteo, calques d'affichage. Exemples :
 *   « va à Marseille » · « tour eiffel » · « météo » · « domicile »
 *   « pluie » · « cadastre » · « nord » · « espace » · « aide »
 */

import * as Cesium from 'cesium';

const CSS = `
#wt-chat { display: flex; flex-direction: column; height: 46vh; }
#wt-chat .journal {
  flex: 1; overflow-y: auto; padding: 10px 12px; display: flex;
  flex-direction: column; gap: 8px; font-size: 10px; line-height: 1.6;
}
#wt-chat .msg { max-width: 92%; padding: 6px 9px; border-radius: 9px; white-space: pre-wrap; }
#wt-chat .msg.moi { align-self: flex-end; background: rgba(0,212,255,0.13); border: 1px solid rgba(0,212,255,0.3); }
#wt-chat .msg.sys { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); color: rgba(232,234,237,0.85); }
#wt-chat .saisie { display: flex; gap: 6px; padding: 8px; border-top: 1px solid rgba(0,212,255,0.2); }
#wt-chat input {
  flex: 1; padding: 8px 10px; background: rgba(0,0,0,0.45); color: inherit;
  border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
  font-family: inherit; font-size: 11px; outline: none;
}
#wt-chat input:focus { border-color: #00d4ff; }
#wt-chat .envoyer {
  cursor: pointer; padding: 8px 12px; font-family: inherit; font-size: 10px;
  font-weight: 700; letter-spacing: 1px; border-radius: 8px;
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.45); color: #00d4ff;
}
`;

const AIDE = `Commandes :
• un lieu → j'y vole (ex : « frontignan », « va à tokyo », « tour eiffel »)
• météo — météo au point visé
• domicile — retour à la maison
• autour — ce qu'il y a autour du centre de la vue
• pluie / nuages / relief / noms / cadastre — bascule le calque
• nord — recadre au nord · espace — vue orbitale
Tout est gratuit et sans clé.`;

const CODES_METEO = {
  0: 'ciel clair', 1: 'plutôt clair', 2: 'partiellement nuageux', 3: 'couvert',
  45: 'brouillard', 48: 'brouillard givrant', 51: 'bruine', 61: 'pluie faible',
  63: 'pluie', 65: 'pluie forte', 71: 'neige faible', 73: 'neige', 75: 'neige forte',
  80: 'averses', 81: 'averses', 82: 'averses fortes', 95: 'orage', 96: 'orage grêle', 99: 'orage grêle',
};

async function geocoder(texte) {
  // 1) BAN (France, précis, sans clé)
  try {
    const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(texte)}&limit=1`);
    const d = await r.json();
    const f = d?.features?.[0];
    if (f?.geometry?.coordinates && (f.properties?.score ?? 0) > 0.4) {
      return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], nom: f.properties.label, ville: f.properties.type === 'municipality' };
    }
  } catch { /* on tente Photon */ }
  // 2) Photon (monde entier, sans clé)
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(texte)}&lang=fr&limit=1`);
    const d = await r.json();
    const f = d?.features?.[0];
    if (f?.geometry?.coordinates) {
      const p = f.properties || {};
      const nom = [p.name, p.city, p.country].filter(Boolean).join(', ');
      return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], nom, ville: ['city', 'town', 'village'].includes(p.osm_value) };
    }
  } catch { /* réseau HS */ }
  return null;
}

/** Initialise la console. Retourne {element, executer}. */
export function initChatConsole(viewer, { affichage } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-chat';
  el.innerHTML = `
    <div class="journal"></div>
    <div class="saisie">
      <input type="text" placeholder="Tape un lieu ou une commande… (aide)" autocomplete="off" spellcheck="false" />
      <button class="envoyer" type="button">➤</button>
    </div>`;
  const journal = el.querySelector('.journal');
  const entree = el.querySelector('input');

  function dire(texte, moi = false) {
    const m = document.createElement('div');
    m.className = `msg ${moi ? 'moi' : 'sys'}`;
    m.textContent = texte;
    journal.appendChild(m);
    journal.scrollTop = journal.scrollHeight;
  }

  function centreVue() {
    const c = viewer.camera.positionCartographic;
    return { lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) };
  }

  function voler(lon, lat, alt, duree = 3) {
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), duration: duree });
  }

  async function executer(brut) {
    const texte = brut.trim();
    if (!texte) return;
    dire(texte, true);
    const t = texte.toLowerCase().replace(/^(va à|va a|vas à|montre(-| )moi|montre|emmène(-| )moi à|allons à|go)\s+/i, '').trim();

    if (/^(aide|help|\?)$/.test(t)) { dire(AIDE); return; }
    if (/^nord$/.test(t)) {
      viewer.camera.flyTo({ destination: viewer.camera.position.clone(),
        orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 }, duration: 0.8 });
      dire('🧭 Recadré au nord.');
      return;
    }
    if (/^(espace|orbite)$/.test(t)) {
      const { lon, lat } = centreVue();
      voler(lon, lat, 21_000_000, 2.5);
      dire('🌍 Vue orbitale.');
      return;
    }
    if (/^(domicile|maison|chez moi|home)$/.test(t)) {
      try {
        const h = JSON.parse(window.localStorage.getItem('watchtower.domicile.v1') || 'null');
        if (Number.isFinite(h?.lon)) { voler(h.lon, h.lat, 1600); dire(`🏠 Direction ${h.label || 'le domicile'}.`); return; }
      } catch { /* absent */ }
      dire('Pas de domicile défini — panneau FRANCE → DOMICILE → « Définir ici ».');
      return;
    }
    if (/^(météo|meteo)$/.test(t)) {
      const { lon, lat } = centreVue();
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,wind_speed_10m,weather_code`);
        const d = await r.json();
        const c = d?.current;
        dire(c ? `🌦 Au point visé : ${Math.round(c.temperature_2m)}°C, vent ${Math.round(c.wind_speed_10m)} km/h, ${CODES_METEO[c.weather_code] || '—'}.` : 'Météo indisponible.');
      } catch { dire('Météo indisponible (réseau).'); }
      return;
    }
    const calques = { pluie: 'pluie', nuages: 'nuages', relief: 'relief', noms: 'labels', labels: 'labels', cadastre: 'cadastre' };
    if (calques[t]) {
      if (affichage?.basculer?.(calques[t])) dire(`🎛 Calque « ${t} » basculé (visible sur les fonds 2D).`);
      else dire('Calques indisponibles.');
      return;
    }
    if (/^autour$/.test(t)) { dire('📍 Ouvre la catégorie AUTOUR dans le dock, en bas.'); return; }

    // ── par défaut : c'est un lieu ──
    dire('🔍 Recherche…');
    const lieu = await geocoder(t);
    if (!lieu) { dire(`Aucun résultat pour « ${t} ». Essaie avec la ville (ex : « plage frontignan »).`); return; }
    voler(lieu.lon, lieu.lat, lieu.ville ? 4500 : 1100);
    dire(`✈ En route : ${lieu.nom}`);
  }

  const envoyer = () => { const v = entree.value; entree.value = ''; executer(v); };
  el.querySelector('.envoyer').addEventListener('click', envoyer);
  entree.addEventListener('keydown', (e) => { if (e.key === 'Enter') envoyer(); });

  dire('💬 Console WATCHTOWER — tape « aide » pour la liste des commandes, ou directement un lieu.');

  return { element: el, executer, focus: () => entree.focus() };
}
