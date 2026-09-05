/**
 * WATCHTOWER — chat textuel (console de commandes).
 *
 * Alternative gratuite et silencieuse à la voix : on TAPE ce qu'on veut, en
 * français. Sans clé, sans IA payante — géocodage BAN/Photon, météo
 * Open-Meteo, risques Géorisques, entreprises (API d'État), calques
 * d'affichage. Exemples :
 *   « frontignan » · « météo » · « risques » · « entreprises » · « cadastre »
 *   « nord » · « espace » · « /aide » · « /urgence »
 *
 * Le chat **propose lui-même des réponses rapides** : une barre de pastilles
 * calculée selon ce qu'il sait faire et le contexte (vol, commune analysée,
 * urgence en cours…). Les commandes viennent du registre `commandes.js` (une
 * seule source de vérité : le chat ne peut pas proposer une commande qu'il ne
 * sait pas exécuter).
 */

import * as Cesium from 'cesium';
import { reconnaitre, reponsesRapides, texteAide } from './commandes.js';

const CSS = `
#wt-chat { display: flex; flex-direction: column; height: 46vh; }
#wt-chat .journal {
  flex: 1; overflow-y: auto; padding: 10px 12px; display: flex;
  flex-direction: column; gap: 8px; font-size: 10px; line-height: 1.6;
}
#wt-chat .msg { max-width: 92%; padding: 6px 9px; border-radius: 9px; white-space: pre-wrap; }
#wt-chat .msg.moi { align-self: flex-end; background: rgba(0,212,255,0.13); border: 1px solid rgba(0,212,255,0.3); }
#wt-chat .msg.sys { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); color: rgba(232,234,237,0.85); }
#wt-chat .msg.urgence { align-self: flex-start; background: rgba(180,30,30,0.18); border: 1px solid rgba(255,90,90,0.5); color: #ffe3e3; }
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
/* ── RÉPONSES RAPIDES : le chat propose, on clique ─────────────────────── */
#wt-chat .rapides {
  display: flex; flex-wrap: wrap; gap: 5px; padding: 7px 8px 0;
}
#wt-chat .rapides:empty { display: none; }
#wt-chat .pastille {
  cursor: pointer; padding: 5px 9px; border-radius: 999px; white-space: nowrap;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px;
  background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.32);
  color: rgba(226,240,246,0.92); transition: background .15s, border-color .15s, transform .1s;
}
#wt-chat .pastille:hover { background: rgba(0,212,255,0.2); border-color: #00d4ff; transform: translateY(-1px); }
#wt-chat .pastille.urgente { background: rgba(255,60,60,0.14); border-color: rgba(255,90,90,0.55); color: #ffdada; }
#wt-chat .pastille.urgente:hover { background: rgba(255,60,60,0.28); border-color: #ff6b6b; }
#wt-chat .pastille .ic { margin-right: 4px; }
`;

const CODES_METEO = {
  0: 'ciel clair', 1: 'plutôt clair', 2: 'partiellement nuageux', 3: 'couvert',
  45: 'brouillard', 48: 'brouillard givrant', 51: 'bruine', 61: 'pluie faible',
  63: 'pluie', 65: 'pluie forte', 71: 'neige faible', 73: 'neige', 75: 'neige forte',
  80: 'averses', 81: 'averses', 82: 'averses fortes', 95: 'orage', 96: 'orage grêle', 99: 'orage grêle',
};

/**
 * Géocode un texte libre : BAN (France, précis) puis Photon (monde).
 * @param {string} texte
 * @returns {Promise<{lon:number,lat:number,nom:string,ville?:boolean}|null>}
 */
export async function geocoder(texte) {
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

/**
 * Vrai si la phrase est une QUESTION (et non un lieu). Les questions partent à
 * l'assistant (IA locale ou repli hors-ligne) ; un lieu part au géocodeur.
 * @param {string} texte
 */
export function ressembleAQuestion(texte = '') {
  const t = String(texte || '').trim().toLowerCase();
  if (!t) return false;
  if (/\?$/.test(t)) return true;
  return /^(comment|pourquoi|pourquoi|qui|quoi|que|quand|ou|où|peux|puis|explique|raconte|resume|résume|calcule|combien|donne|decris|décris|c'est quoi|qu'est-ce|c quoi|quel|quelle|quels|quelles|est-ce|ai-je|dois)\b/.test(t);
}

/** Initialise la console. Retourne {element, executer, dire, setUrgence, majRapides, focus}. */
export function initChatConsole(viewer, { affichage } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-chat';
  el.innerHTML = `
    <div class="journal"></div>
    <div class="rapides"></div>
    <div class="saisie">
      <input type="text" placeholder="Tape un lieu ou une commande… (/aide)" autocomplete="off" spellcheck="false" />
      <button class="envoyer" type="button">➤</button>
    </div>`;
  const journal = el.querySelector('.journal');
  const rapides = el.querySelector('.rapides');
  const entree = el.querySelector('input');

  let urgence = null;    // piloté par `setUrgence` (mode urgence, voir urgenceMode.js)
  let assistant = null;  // piloté par `setAssistant` (IA : Ollama local, service, ou repli)

  function dire(texte, moi = false) {
    const m = document.createElement('div');
    m.className = `msg ${moi ? 'moi' : (urgence?.estActive?.() ? 'urgence' : 'sys')}`;
    m.textContent = texte;
    journal.appendChild(m);
    journal.scrollTop = journal.scrollHeight;
    return m; // on peut retirer le message (ex : « je réfléchis… »)
  }

  /** Reconstruit la barre de pastilles selon le contexte courant. */
  function majRapides() {
    const ctx = contexte();
    const liste = reponsesRapides(ctx);
    rapides.innerHTML = '';
    for (const p of liste) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `pastille${p.groupe === 'urgence' ? ' urgente' : ''}`;
      b.innerHTML = `<span class="ic">${p.ic}</span>${p.titre}`;
      b.title = p.envoi;
      b.addEventListener('click', () => { entree.value = ''; executer(p.envoi); entree.focus(); });
      rapides.appendChild(b);
    }
  }

  /** Ce que le chat sait de l'instant (pour choisir les pastilles). */
  function contexte() {
    const g = window.__godsEyeView || {};
    return {
      vol: Boolean(g.vol?.actif?.() ?? document.body.classList.contains('wt-vol')),
      commune: g.intel?.derniere?.()?.commune?.nom || g.vues?.commune?.() || '',
      nuit: Boolean(document.body.classList.contains('nuit')),
      urgence: Boolean(urgence?.estActive?.()),
      chantier: Boolean(g.chantier?.actif?.()),
    };
  }

  function centreVue() {
    const c = viewer.camera.positionCartographic;
    return { lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) };
  }

  function voler(lon, lat, alt, duree = 3) {
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), duration: duree });
  }

  // ── actions des commandes (une fonction = une commande du registre) ────
  const ACTIONS = {
    aide: async () => { dire(texteAide()); },

    urgence: async (argument) => { if (!urgence?.traiter?.(`/urgence ${argument}`.trim())) dire('Mode urgence indisponible.'); },

    meteo: async () => {
      const { lon, lat } = centreVue();
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,wind_speed_10m,weather_code`);
        const d = await r.json();
        const c = d?.current;
        dire(c
          ? `🌦 Au point visé : ${Math.round(c.temperature_2m)}°C, vent ${Math.round(c.wind_speed_10m)} km/h, ${CODES_METEO[c.weather_code] || '—'}.`
          : 'Météo indisponible.');
      } catch { dire('Météo indisponible (réseau).'); }
    },

    risques: async () => {
      const { lon, lat } = centreVue();
      dire('⛑ Risques de la commune (Géorisques)…');
      try {
        const r = await fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?latlon=${lon.toFixed(5)},${lat.toFixed(5)}`);
        const d = await r.json();
        const liste = Array.isArray(d?.data) ? d.data : [];
        if (!liste.length) { dire('Aucun risque recensé à cet endroit (Géorisques).'); return; }
        dire(`⛑ ${liste.length} risque(s) recensé(s) :\n${liste.slice(0, 8).map((x) => `• ${x.risque_detail || x.risque || '—'}`).join('\n')}\n\nSource : georisques.gouv.fr`);
      } catch { dire('Géorisques injoignable (réseau).'); }
    },

    entreprises: async () => {
      const { lon, lat } = centreVue();
      dire('🏢 Entreprises autour du point visé…');
      try {
        const r = await fetch(`https://recherche-entreprises.api.gouv.fr/near_point?lat=${lat.toFixed(5)}&long=${lon.toFixed(5)}&radius=2&per_page=10`);
        const d = await r.json();
        const liste = Array.isArray(d?.results) ? d.results : [];
        if (!liste.length) { dire('Aucune entreprise à moins de 2 km (API recherche-entreprises).'); return; }
        dire(`🏢 ${liste.length} entreprise(s) :\n${liste.slice(0, 8).map((e) => `• ${e.nom_complet || e.nom_raison_sociale || '—'}${e.activite_principale ? ` — ${e.activite_principale}` : ''}`).join('\n')}\n\nSource : recherche-entreprises.api.gouv.fr`);
      } catch { dire('API entreprises injoignable (réseau).'); }
    },

    entites: async () => {
      const g = window.__godsEyeView?.entites;
      if (!g) { dire('Module ENTITÉS absent.'); return; }
      g.basculer?.(true);
      window.__godsEyeView.dock?.ouvrir?.('entites');
      window.setTimeout(() => g.rafraichir?.(), 300);
      dire('🏷 ENTITÉS : pastille de la fonction réelle de chaque lieu (OSM) — panneau ouvert à gauche.');
    },

    cadrans: async () => {
      const c = window.__godsEyeView?.cadrans;
      if (!c) { dire('Module CADRANS absent.'); return; }
      c.basculer?.(true);
      dire('🔲 CADRANS : la commune découpée en quartiers nommés (OSM, sinon alphabet OTAN).');
    },

    cadastre: async () => {
      const c = window.__godsEyeView?.cadastre;
      if (c) { c.basculer?.(true); window.__godsEyeView.dock?.ouvrir?.('cadastre'); dire('🗺 Cadastre : contour des parcelles (IGN, sans clé).'); return; }
      if (affichage?.basculer?.('cadastre')) dire('🎛 Calque « cadastre » basculé.');
      else dire('Cadastre indisponible.');
    },

    nord: async () => {
      viewer.camera.flyTo({
        destination: viewer.camera.position.clone(),
        orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 }, duration: 0.8,
      });
      dire('🧭 Recadré au nord.');
    },

    espace: async () => {
      const { lon, lat } = centreVue();
      voler(lon, lat, 21_000_000, 2.5);
      dire('🌍 Vue orbitale.');
    },

    domicile: async () => {
      try {
        const h = JSON.parse(window.localStorage.getItem('watchtower.domicile.v1') || 'null');
        if (Number.isFinite(h?.lon)) { voler(h.lon, h.lat, 1600); dire(`🏠 Direction ${h.label || 'le domicile'}.`); return; }
      } catch { /* absent */ }
      dire('Pas de domicile défini — panneau FAVORIS → DOMICILE → « Définir ici ».');
    },

    autour: async () => {
      window.__godsEyeView.dock?.ouvrir?.('moi');
      dire('📍 « MOI » ouvert à droite : ce qu’il y a autour de toi (et « ME LOCALISER »).');
    },

    pluie: async () => basculerCalque('pluie'),
    nuages: async () => basculerCalque('nuages'),
    relief: async () => basculerCalque('relief'),
    noms: async () => basculerCalque('labels', 'noms'),
  };

  function basculerCalque(id, libelle) {
    const ok = affichage?.basculer?.(id);
    dire(ok ? `🎛 Calque « ${libelle || id} » basculé (visible sur les fonds 2D).` : 'Calques indisponibles.');
  }

  /** Point d'entrée : une phrase tapée (ou cliquée). */
  async function executer(brut) {
    const texte = String(brut || '').trim();
    if (!texte) return;
    dire(texte, true);

    // 1) urgence : elle prend la main AVANT tout le reste
    if (urgence?.traiter?.(texte)) { majRapides(); return; }

    // 2) commande du registre (/aide, /meteo, /risques…)
    const r = reconnaitre(texte);
    if (r) {
      const action = ACTIONS[r.id] || ACTIONS.aide;
      await action(r.argument);
      majRapides();
      return;
    }

    // 3) une question → l'assistant (IA locale, ou repli hors-ligne honnête)
    if (assistant && ressembleAQuestion(texte)) {
      const attente = dire('🤔 Je réfléchis…');
      const r = await assistant.demander(texte, contexte());
      attente.remove();
      dire(`🤖 ${r.texte}\n\n— ${r.source}`);
      majRapides();
      return;
    }

    // 4) sinon : c'est un lieu (on tolère les préfixes du langage courant)
    const t = texte.replace(/^(va à|va a|vas à|montre(-| )moi|montre|emmène(-| )moi à|allons à|go)\s+/i, '').trim();
    dire('🔍 Recherche…');
    const lieu = await geocoder(t);
    if (!lieu) {
      dire(`Aucun résultat pour « ${t} ». Essaie avec la ville (ex : « plage frontignan ») ou tape « /aide ».`);
      majRapides();
      return;
    }
    voler(lieu.lon, lieu.lat, lieu.ville ? 4500 : 1100);
    dire(`✈ En route : ${lieu.nom}`);
    majRapides();
  }

  const envoyer = () => { const v = entree.value; entree.value = ''; executer(v); };
  el.querySelector('.envoyer').addEventListener('click', envoyer);
  entree.addEventListener('keydown', (e) => { if (e.key === 'Enter') envoyer(); });
  // « / » au clavier = raccourci vers l'aide, comme sur Discord
  entree.addEventListener('input', () => { if (entree.value === '/') { entree.value = '/'; } });

  dire('💬 Console WATCHTOWER — tape un lieu, ou « /aide » pour toutes les commandes. Les pastilles ci-dessous te proposent la suite.');
  majRapides();
  // le contexte change (vol, commune, urgence) : on rafraîchit les pastilles
  window.setInterval(majRapides, 4000);

  return {
    element: el,
    executer,
    dire,
    majRapides,
    geocoder,
    /** Branche le mode urgence (voir `urgenceMode.js`). */
    setUrgence(u) { urgence = u || null; majRapides(); },
    /** Branche l'assistant (voir `llm.js`) : Ollama local, service, ou repli. */
    setAssistant(a) { assistant = a || null; return assistant; },
    assistant: () => assistant,
    focus: () => entree.focus(),
  };
}
