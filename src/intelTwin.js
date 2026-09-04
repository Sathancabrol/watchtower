/**
 * WATCHTOWER — MODE INTEL « JUMEAU NUMÉRIQUE » v2.
 *
 * v1 : bandeau KPI + CIVILISATION TERRITORIALE + CONTEXT PANEL (données
 * réelles gratuites : geo.gouv.fr + OpenStreetMap).
 * v2 :
 *  — chaque KPI / catégorie est CLIQUABLE → arborescence de l'indicateur
 *    (sous-indicateurs → éléments réels trouvés) + fiche descriptive, et
 *    l'icône du bandeau passe en 🔎 pendant l'inspection ;
 *  — panneau droit : onglet PROFIL = carte d'identité cognitive T0 de
 *    l'utilisateur (identité, budget, trajet quotidien, projets, CV,
 *    métriques cognitives situé/incarné/énaction) éditable et mémorisée ;
 *  — MODE ANALYSE : rapport d'analyste territorial (situation, besoins,
 *    contraintes, problèmes, solutions en cours via BOAMP marchés publics,
 *    solutions hypothétiques) + vues ALLO / EGO / HEATZONES sur la carte.
 * Tout gratuit, sans clé. Les indices sont des heuristiques sur données
 * ouvertes, pas une IA.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';

const PROFIL_KEY = 'watchtower.profil.v1';

const CSS = `
#wt-intel { position: fixed; inset: 0; z-index: 920; pointer-events: none; font-family: var(--font-mono, monospace); color: #e8eaed; }
#wt-intel > * { pointer-events: auto; }
.wti-glass { background: linear-gradient(180deg, rgba(14,20,28,0.92), rgba(10,14,22,0.88)); border: 1px solid rgba(120,200,190,0.22); border-radius: 14px; backdrop-filter: blur(10px); box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
#wti-haut { position: absolute; top: 0; left: 0; right: 0; height: 56px; display: flex; align-items: stretch; padding: 6px 12px; background: linear-gradient(180deg, rgba(8,12,18,0.95), rgba(8,12,18,0.82)); border-bottom: 1px solid rgba(120,200,190,0.2); }
#wti-haut .marque { display: flex; align-items: center; gap: 9px; padding-right: 16px; min-width: 210px; }
#wti-haut .marque .cerveau { width: 34px; height: 34px; border-radius: 50%; background: rgba(120,200,190,0.12); border: 1px solid rgba(120,200,190,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px; }
#wti-haut .marque .t1 { font-size: 12px; font-weight: 800; letter-spacing: 1px; }
#wti-haut .marque .t2 { font-size: 8px; color: rgba(232,234,237,0.5); letter-spacing: 1px; }
#wti-haut .kpis { flex: 1; display: flex; align-items: stretch; justify-content: space-evenly; gap: 4px; }
.wti-kpi { cursor: pointer; display: flex; flex-direction: column; justify-content: center; padding: 2px 12px; border-left: 1px solid rgba(255,255,255,0.07); min-width: 92px; background: none; border-top: none; border-right: none; border-bottom: none; color: inherit; font-family: inherit; text-align: left; }
.wti-kpi:hover { background: rgba(120,200,190,0.07); }
.wti-kpi.sel { background: rgba(120,200,190,0.14); box-shadow: inset 0 -2px 0 #7dd3c8; }
.wti-kpi .k { font-size: 8px; letter-spacing: 1px; color: rgba(232,234,237,0.6); display: flex; gap: 5px; }
.wti-kpi .v { font-size: 14px; font-weight: 800; display: flex; gap: 6px; align-items: baseline; }
.wti-kpi .barre { height: 3px; border-radius: 2px; background: rgba(255,255,255,0.09); margin-top: 3px; overflow: hidden; }
.wti-kpi .barre i { display: block; height: 100%; border-radius: 2px; }
.haut { color: #43d17a; } .plat { color: #e8c04a; } .bas { color: #f07a6a; }
#wti-gauche { position: absolute; top: 66px; left: 12px; width: 240px; padding: 12px; }
#wti-gauche .titre { font-size: 10px; letter-spacing: 2px; color: #7dd3c8; margin-bottom: 10px; display: flex; flex-direction: column; gap: 2px; }
#wti-gauche .titre .commune { font-size: 11px; font-weight: 800; }
#wti-gauche .titre .sous2 { font-size: 7.5px; letter-spacing: 3px; color: rgba(232,234,237,0.45); }
.wti-cat { cursor: pointer; width: 100%; text-align: left; color: inherit; font-family: inherit; border: 1px solid rgba(120,200,190,0.2); border-radius: 11px; padding: 8px 10px; margin-bottom: 8px; background: rgba(255,255,255,0.025); }
.wti-cat:hover { border-color: #7dd3c8; }
.wti-cat .lg { display: flex; gap: 7px; align-items: center; font-size: 10.5px; font-weight: 700; }
.wti-cat .niv { display: flex; gap: 7px; align-items: center; margin-top: 6px; font-size: 8px; color: rgba(232,234,237,0.55); }
.wti-cat .niv .barre { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.09); overflow: hidden; }
.wti-cat .niv .barre i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #37b7ab, #7de8b0); }
#wti-droit { position: absolute; top: 66px; right: 12px; width: 272px; padding: 12px; max-height: calc(100vh - 200px); overflow-y: auto; }
#wti-droit .ongles { display: flex; gap: 5px; margin-bottom: 8px; }
#wti-droit .ong { flex: 1; cursor: pointer; padding: 6px; font-family: inherit; font-size: 8px; font-weight: 700; letter-spacing: 2px; border-radius: 7px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(232,234,237,0.7); }
#wti-droit .ong.actif { background: rgba(120,200,190,0.14); border-color: #7dd3c8; color: #7dd3c8; }
#wti-droit .titre { font-size: 9px; letter-spacing: 3px; color: #7dd3c8; margin-bottom: 8px; display: flex; justify-content: space-between; }
#wti-droit .pop { font-size: 20px; font-weight: 800; }
#wti-droit .sous { font-size: 8px; letter-spacing: 1.5px; color: rgba(232,234,237,0.55); margin: 10px 0 4px; }
#wti-droit .jauge { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.09); overflow: hidden; margin: 3px 0 2px; }
#wti-droit .jauge i { display: block; height: 100%; border-radius: 3px; }
#wti-droit canvas { width: 100%; border-radius: 8px; background: rgba(255,255,255,0.03); margin-top: 4px; }
#wti-droit .skill { display: flex; align-items: center; gap: 7px; font-size: 9px; margin: 3px 0; }
#wti-droit .skill .barre { flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.09); overflow: hidden; }
#wti-droit .skill .barre i { display: block; height: 100%; }
#wti-droit input, #wti-droit textarea { width: 100%; box-sizing: border-box; padding: 6px 8px; background: rgba(0,0,0,0.4); color: inherit; border: 1px solid rgba(255,255,255,0.12); border-radius: 7px; font-family: inherit; font-size: 9.5px; outline: none; margin-bottom: 4px; }
#wti-droit input:focus, #wti-droit textarea:focus { border-color: #7dd3c8; }
#wti-droit .btn { cursor: pointer; width: 100%; padding: 8px; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 2px; border-radius: 8px; background: rgba(120,200,190,0.12); border: 1px solid #7dd3c8; color: #7dd3c8; margin-top: 4px; }
#wti-analyser { position: absolute; top: 66px; left: 50%; transform: translateX(-50%); cursor: pointer; padding: 8px 16px; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #7dd3c8; border-radius: 9px; background: rgba(14,20,28,0.9); border: 1px solid rgba(120,200,190,0.4); }
#wti-analyser:hover { background: rgba(120,200,190,0.12); }
#wt-intel .note { font-size: 7.5px; color: rgba(232,234,237,0.35); line-height: 1.5; margin-top: 8px; }
@keyframes wti-blink { 50% { opacity: 0.3; } }
#wt-intel .live-item { padding: 4px 7px; margin: 3px 0; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); }
#wt-intel .live-item.rouge { border-color: rgba(240,82,82,0.5); background: rgba(240,82,82,0.07); }
#wt-intel .live-item.orange { border-color: rgba(240,166,60,0.5); background: rgba(240,166,60,0.07); }
#wt-intel .live-item.vert { border-color: rgba(67,209,122,0.4); background: rgba(67,209,122,0.05); }
#wt-intel .live-item .hh { color: rgba(232,234,237,0.45); font-size: 8px; letter-spacing: 1px; }
/* drill-down + rapport : fenêtres focus au-dessus de la carte */
.wti-modal { position: fixed; inset: 0; z-index: 2600; display: flex; align-items: center; justify-content: center; background: rgba(4,7,12,0.6); pointer-events: auto; }
.wti-modal .boite { width: min(560px, 94vw); max-height: 80vh; display: flex; flex-direction: column; padding: 16px 18px; }
.wti-modal .tete { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.wti-modal .tete .ic { font-size: 20px; }
.wti-modal .tete .nm { font-size: 13px; font-weight: 800; letter-spacing: 1px; flex: 1; }
.wti-modal .tete .x { cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 14px; font-family: inherit; }
.wti-modal .defile { overflow-y: auto; font-size: 10px; line-height: 1.7; }
.wti-modal details { border: 1px solid rgba(120,200,190,0.18); border-radius: 9px; padding: 6px 10px; margin-bottom: 6px; background: rgba(255,255,255,0.02); }
.wti-modal summary { cursor: pointer; font-weight: 700; font-size: 10px; letter-spacing: 1px; color: #7dd3c8; }
.wti-modal .item { cursor: pointer; display: flex; gap: 7px; width: 100%; text-align: left; color: inherit; font-family: inherit; font-size: 9.5px; padding: 4px 7px; margin: 2px 0; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
.wti-modal .item:hover { border-color: #7dd3c8; }
.wti-modal .fiche { margin-top: 8px; padding: 9px 11px; border-radius: 9px; border: 1px solid rgba(120,200,190,0.35); background: rgba(120,200,190,0.06); font-size: 9.5px; line-height: 1.7; }
.wti-modal .sect { margin: 10px 0 4px; font-size: 9px; letter-spacing: 2px; color: #7dd3c8; font-weight: 700; }
.wti-modal .vues { display: flex; gap: 6px; margin-top: 10px; }
.wti-modal .vues button { flex: 1; cursor: pointer; padding: 8px; font-family: inherit; font-size: 8.5px; font-weight: 700; letter-spacing: 1px; border-radius: 8px; background: rgba(120,200,190,0.1); border: 1px solid rgba(120,200,190,0.4); color: #7dd3c8; }
`;

async function overpass(req) {
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(`[out:json][timeout:25];${req}`)}`,
  });
  return (await r.json())?.elements || [];
}

const fleche = (v) => (v >= 60 ? ['↑', 'haut'] : v >= 40 ? ['→', 'plat'] : ['↓', 'bas']);
const cbar = (v) => (v >= 60 ? '#43d17a' : v >= 40 ? '#e8c04a' : '#f07a6a');

export function lireProfil() {
  try { return JSON.parse(window.localStorage.getItem(PROFIL_KEY)) || {}; } catch { return {}; }
}

export function initIntelTwin(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  document.getElementById('intel-hud')?.style.setProperty('display', 'none', 'important');

  const heatDs = new Cesium.CustomDataSource('wt-intel-heat');
  viewer.dataSources.add(heatDs);
  const elemsDs = new Cesium.CustomDataSource('wt-intel-elems');
  viewer.dataSources.add(elemsDs);
  const dangersDs = new Cesium.CustomDataSource('wt-intel-dangers');
  viewer.dataSources.add(dangersDs);

  // identifiants de session façon carte cognitive
  let traceId;
  try {
    traceId = window.localStorage.getItem('watchtower.traceId') || `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}`;
    window.localStorage.setItem('watchtower.traceId', traceId);
  } catch { traceId = 'local'; }
  const visitId = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`;

  const root = document.createElement('div');
  root.id = 'wt-intel';
  root.classList.add('wt-dock-cache');
  root.innerHTML = `
    <div id="wti-haut">
      <div class="marque">
        <div class="cerveau"><img src="/logo.svg" alt="WATCHTOWER" style="width:24px;height:24px" /></div>
        <div><div class="t1">WATCH<span style="color:#00d4ff">TOWER</span></div><div class="t2">POSTE DE COMMANDEMENT · JUMEAU NUMÉRIQUE</div></div>
      </div>
      <div class="kpis"></div>
    </div>
    <button id="wti-analyser" type="button">⟳ ANALYSER LA VUE</button>
    <div id="wti-resume" class="wti-glass" style="display:none;position:absolute;top:104px;left:50%;transform:translateX(-50%);padding:7px 14px;font-size:9px;letter-spacing:1px;max-width:70vw;text-align:center"></div>
    <div id="wti-gauche" class="wti-glass">
      <div class="titre"><span class="commune">— DIGITAL TWIN</span><span class="sous2">CIVILISATION TERRITORIALE</span></div>
      <div class="cats"></div>
      <button class="btn heat-gauche" style="cursor:pointer;width:100%;margin-top:5px;padding:7px;font-family:inherit;font-size:9px;font-weight:700;letter-spacing:2px;border-radius:8px;background:rgba(240,122,106,0.08);border:1px solid rgba(240,122,106,0.5);color:#f07a6a">🔥 HEATMAP CATÉGORIES</button>
      <button class="btn analyse-terr" style="cursor:pointer;width:100%;padding:8px;font-family:inherit;font-size:9px;font-weight:700;letter-spacing:2px;border-radius:8px;background:rgba(120,200,190,0.12);border:1px solid #7dd3c8;color:#7dd3c8">🛰 MODE ANALYSE TERRITORIALE</button>
      <button class="btn dangers" style="cursor:pointer;width:100%;margin-top:5px;padding:8px;font-family:inherit;font-size:9px;font-weight:700;letter-spacing:2px;border-radius:8px;background:rgba(240,122,106,0.1);border:1px solid #f07a6a;color:#f07a6a">⚠ DANGERS · EAU · AIR · RÉSEAUX</button>
      <div class="note">Indices calculés depuis les données ouvertes (INSEE via geo.gouv.fr ·
      OpenStreetMap, rayon 1,2 km). Heuristiques transparentes, pas une IA. Gratuit, sans clé.</div>
    </div>
    <div id="wti-droit" class="wti-glass">
      <div class="ongles">
        <button class="ong actif" data-v="contexte" type="button">CONTEXTE</button>
        <button class="ong" data-v="profil" type="button">PROFIL</button>
      </div>
      <div class="vue-contexte">
        <div class="titre"><span>CONTEXT PANEL</span><span style="color:#43d17a">TRENDS ↗</span></div>
        <div class="sous">POPULATION</div><div class="pop">—</div>
        <div class="sous">ACTIVITÉ ÉCONOMIQUE</div>
        <div class="jauge eco"><i style="background:linear-gradient(90deg,#37b7ab,#7de8b0)"></i></div>
        <div class="sous">COMPÉTENCES CLÉS</div><div class="skills"></div>
        <div class="sous">ÉQUIPEMENTS PAR CATÉGORIE</div><canvas class="histo" width="240" height="90"></canvas>
        <div class="sous">CAUSAL MATRIX</div><canvas class="matrice" width="240" height="110"></canvas>
        <div class="sous">📰 FLUX VILLE (GDELT · temps réel)</div>
        <div class="news" style="font-size:9px;line-height:1.6">—</div>
        <div class="sous" style="display:flex;justify-content:space-between;align-items:center">
          <span>⚠ FEED DANGERS LIVE</span>
          <span class="live-badge" style="color:#f05252;font-weight:800;font-size:8px;letter-spacing:2px;animation:wti-blink 1.4s infinite">● LIVE</span>
        </div>
        <div class="live-liste" style="font-size:9px;line-height:1.65">En attente de l'analyse…</div>
      </div>
      <div class="vue-profil" style="display:none"></div>
    </div>`;
  document.body.appendChild(root);
  // fenêtres déplaçables (poignée = titre / rangée d'onglets)
  rendreDeplacable(root.querySelector('#wti-gauche'), root.querySelector('#wti-gauche .titre'));
  rendreDeplacable(root.querySelector('#wti-droit'), root.querySelector('#wti-droit .ongles'));

  const zoneKpis = root.querySelector('.kpis');
  const zoneCats = root.querySelector('.cats');
  let derniere = null; // dernière analyse {commune, lat, lon, comptes, listes, indices}

  // ═══════════ PROFIL — carte d'identité cognitive T0 ═══════════
  const vueProfil = root.querySelector('.vue-profil');
  function rendreProfil() {
    const p = lireProfil();
    const rempli = ['nom', 'role', 'budget', 'capacite', 'trajetDom', 'trajetTrav', 'projets', 'cv']
      .map((k) => (p[k] ? 1 : 0)).reduce((a, b) => a + b, 0);
    const situe = p.trajetDom ? 90 : 25;
    const incarne = Math.min(100, 20 + rempli * 10);
    const enaction = Math.min(100, (String(p.projets || '').split('\n').filter(Boolean).length) * 30 + 10);
    const simulation = p.budget ? 80 : 20;
    const aRepresent = !!(p.nom || p.prenom);
    vueProfil.innerHTML = `
      <div class="titre"><span>CARTE D'IDENTITÉ COGNITIVE · T0</span></div>
      ${aRepresent ? `
      <div style="display:flex;gap:9px;align-items:center;border:1px solid rgba(125,211,200,0.35);border-radius:11px;padding:9px;margin-bottom:8px;background:rgba(125,211,200,0.06)">
        <div style="width:38px;height:38px;border-radius:50%;background:rgba(125,211,200,0.18);display:flex;align-items:center;justify-content:center;font-size:19px">${/chef|conduct|ingénieur|ingénieure/i.test(p.role || '') ? '👷' : '👤'}</div>
        <div style="min-width:0">
          <div style="font-size:12px;font-weight:800">${p.prenom || ''} ${p.nom || ''}</div>
          <div style="font-size:8px;color:rgba(232,234,237,0.55);letter-spacing:0.5px">${p.role || 'rôle non renseigné'}${p.ville ? ` · ${p.ville}` : ''}${p.naissance ? ` · né(e) ${p.naissance}` : ''}</div>
        </div>
      </div>` : `
      <div style="border:1px solid rgba(240,166,60,0.55);border-radius:11px;padding:9px 10px;margin-bottom:8px;background:rgba(240,166,60,0.08);font-size:9px;line-height:1.6">
        📝 <b>AUCUNE FICHE D'IDENTITÉ</b> — remplis ta fiche ci-dessous (1 min) :
        elle te représente (avatar, métriques) et alimente le mode CHANTIER
        (capacité vs marchés). Stockée UNIQUEMENT en local sur cet appareil.</div>`}
      <div style="font-size:7.5px;color:rgba(232,234,237,0.4);margin-bottom:6px">Trace ID: ${traceId} · Visit ID: ${visitId}</div>
      <div class="sous">IDENTITÉ (ta représentation)</div>
      <div style="display:flex;gap:5px">
        <input class="p-prenom" placeholder="Prénom" value="${p.prenom || ''}" style="flex:1" />
        <input class="p-nom" placeholder="Nom / pseudo" value="${p.nom || ''}" style="flex:1" />
      </div>
      <div style="display:flex;gap:5px">
        <input class="p-nais" placeholder="Né(e) en (ex : 1985)" value="${p.naissance || ''}" style="flex:1" />
        <input class="p-ville" placeholder="Ville" value="${p.ville || ''}" style="flex:1" />
      </div>
      <input class="p-role" placeholder="Métier / rôle (ex : conducteur de travaux)" value="${p.role || ''}" />
      <div class="sous">BUDGET & CAPACITÉ</div>
      <input class="p-budget" type="number" placeholder="Budget mensuel (€)" value="${p.budget || ''}" />
      <input class="p-capacite" type="number" placeholder="Capacité chantiers simultanés (ex : 3)" value="${p.capacite || ''}" />
      <div class="sous">TRAJET QUOTIDIEN</div>
      <input class="p-dom" placeholder="Départ (ex : Frontignan)" value="${p.trajetDom || ''}" />
      <input class="p-trav" placeholder="Arrivée (ex : Sète, zone portuaire)" value="${p.trajetTrav || ''}" />
      <div class="sous">PROJETS EN COURS (1 par ligne)</div>
      <textarea class="p-projets" rows="3">${p.projets || ''}</textarea>
      <div class="sous">CV / COMPÉTENCES</div>
      <textarea class="p-cv" rows="3">${p.cv || ''}</textarea>
      <div class="sous">HUD COGNITIF — SITUÉ · INCARNÉ · ÉNACTION</div>
      ${[['Cognition située (ancrage GPS/territoire)', situe, '#37b7ab'],
        ['Cognition incarnée (profil complété)', incarne, '#c084fc'],
        ['Énaction (projets actifs)', enaction, '#e8c04a'],
        ['Simulation (budget & finance)', simulation, '#43d17a']]
        .map(([n, v, c]) => `<div class="skill"><span style="min-width:150px">${n}</span>
          <div class="barre"><i style="width:${v}%;background:${c}"></i></div><b>${v}%</b></div>`).join('')}
      <button class="btn p-sauver" type="button">💾 ENREGISTRER · RAFRAÎCHIR T0</button>
      <div class="note">Profil stocké UNIQUEMENT en local sur ton appareil. Il alimente le mode
      CHANTIER (capacité vs marchés) et les métriques cognitives (processus situé/incarné/énactif :
      plus le jumeau te connaît, plus les simulations sont ancrées dans ton réel).</div>`;
    vueProfil.querySelector('.p-sauver').addEventListener('click', () => {
      const np = {
        prenom: vueProfil.querySelector('.p-prenom').value.trim(),
        nom: vueProfil.querySelector('.p-nom').value.trim(),
        naissance: vueProfil.querySelector('.p-nais').value.trim(),
        ville: vueProfil.querySelector('.p-ville').value.trim(),
        role: vueProfil.querySelector('.p-role').value.trim(),
        budget: vueProfil.querySelector('.p-budget').value,
        capacite: vueProfil.querySelector('.p-capacite').value,
        trajetDom: vueProfil.querySelector('.p-dom').value.trim(),
        trajetTrav: vueProfil.querySelector('.p-trav').value.trim(),
        projets: vueProfil.querySelector('.p-projets').value,
        cv: vueProfil.querySelector('.p-cv').value,
      };
      try { window.localStorage.setItem(PROFIL_KEY, JSON.stringify(np)); } catch { /* plein */ }
      rendreProfil();
    });
  }
  rendreProfil();
  for (const o of root.querySelectorAll('.ong')) {
    o.addEventListener('click', () => {
      root.querySelectorAll('.ong').forEach((b) => b.classList.remove('actif'));
      o.classList.add('actif');
      root.querySelector('.vue-contexte').style.display = o.dataset.v === 'contexte' ? '' : 'none';
      vueProfil.style.display = o.dataset.v === 'profil' ? '' : 'none';
      if (o.dataset.v === 'profil') rendreProfil();
    });
  }

  // ═══════════ rendu bandeau + catégories (cliquables) ═══════════
  function rendreKpis(kpis) {
    zoneKpis.innerHTML = '';
    for (const k of kpis) {
      const [f, cl] = k.etoiles ? ['→', 'plat'] : fleche(k.val);
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'wti-kpi';
      d.dataset.cat = k.cat || '';
      d.innerHTML = `<div class="k"><span class="ic">${k.ic}</span> ${k.nom}</div>
        <div class="v">${k.etoiles ? '★'.repeat(k.etoiles) + '☆'.repeat(5 - k.etoiles) : k.texte || `${k.val}%`}
        <span class="fleche ${cl}">${f}</span></div>
        <div class="barre"><i style="width:${k.etoiles ? k.etoiles * 20 : Math.min(100, k.val)}%;background:${cbar(k.etoiles ? k.etoiles * 20 : k.val)}"></i></div>`;
      if (k.cat) d.addEventListener('click', () => ouvrirDrill(k.cat));
      zoneKpis.appendChild(d);
    }
  }
  function rendreCats(cats) {
    zoneCats.innerHTML = '';
    for (const c of cats) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'wti-cat';
      d.innerHTML = `<div class="lg"><span class="ic">${c.ic}</span>${c.nom}</div>
        <div class="niv">NIVEAU ${Math.max(1, Math.ceil(c.val / 25))}
        <div class="barre"><i style="width:${Math.min(100, c.val)}%"></i></div></div>`;
      d.addEventListener('click', () => ouvrirDrill(c.cat));
      zoneCats.appendChild(d);
    }
  }
  function rendreHisto(canvas, series) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const max = Math.max(1, ...series.map((s) => s.n));
    const lb = canvas.width / series.length;
    series.forEach((s, i) => {
      const h = Math.max(3, (s.n / max) * 58);
      ctx.fillStyle = s.c; ctx.fillRect(i * lb + 8, 68 - h, lb - 16, h);
      ctx.fillStyle = 'rgba(232,234,237,0.7)'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(String(s.n), i * lb + lb / 2, 66 - h);
      ctx.fillText(s.l, i * lb + lb / 2, 82);
    });
  }
  function rendreMatrice(canvas, scores) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const noms = ['Écologie', 'Économie', 'Éducation', 'Santé', 'Services'];
    const cols = ['#43d17a', '#e8c04a', '#37b7ab', '#c084fc', '#f0a63c'];
    const g = noms.map((_, i) => ({ x: 78, y: 16 + i * 20 }));
    const dr = noms.map((_, i) => ({ x: 190, y: 16 + i * 20 }));
    for (let i = 0; i < noms.length; i += 1) {
      for (let j = 0; j < noms.length; j += 1) {
        if ((i + j + (scores[i] || 0)) % 3 !== 0) continue;
        ctx.strokeStyle = `${cols[i]}55`;
        ctx.beginPath(); ctx.moveTo(g[i].x + 5, g[i].y); ctx.lineTo(dr[j].x - 5, dr[j].y); ctx.stroke();
      }
    }
    noms.forEach((n, i) => {
      ctx.fillStyle = cols[i];
      ctx.beginPath(); ctx.arc(g[i].x, g[i].y, 4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(dr[i].x, dr[i].y, 4, 0, 7); ctx.fill();
      ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(232,234,237,0.75)';
      ctx.fillText(n, g[i].x - 9, g[i].y + 3);
    });
  }

  // ═══════════ DRILL-DOWN : arborescence + fiche ═══════════
  const DESCRIPTIONS = {
    population: ['👥', 'Population', 'Nombre officiel d\u2019habitants de la commune (INSEE via geo.gouv.fr). Le niveau territorial est calculé sur une échelle logarithmique : un village de 500 hab. et une métropole n\u2019ont pas le même poids.'],
    education: ['🎓', 'Éducation', 'Indice = densité d\u2019établissements d\u2019enseignement (écoles, collèges, lycées, universités) référencés dans OpenStreetMap à moins de 1,2 km du point analysé. Chaque établissement compte pour 12 points (plafond 100).'],
    economie: ['💼', 'Économie & emplois', 'Indice = densité de commerces et activités (tag shop OSM) dans le rayon d\u2019analyse. 3 points par commerce, plafond 100. Les étoiles du bandeau = indice / 20.'],
    sante: ['🏥', 'Santé', 'Indice = densité d\u2019équipements de santé (hôpitaux, pharmacies, médecins, cliniques) OSM. 8 points par équipement, plafond 100. Contribue au capital humain et au bonheur.'],
    services: ['🏛', 'Services publics / Résilience', 'Indice = densité de services publics (mairie, police, pompiers, poste, bibliothèque, centre communautaire). 12 points par service, plafond 100.'],
    bonheur: ['😊', 'Bonheur', 'Indice composite : base 38 + 5 points par espace vert/équipement de loisir + santé/5. Approximation heuristique du bien-être territorial (espaces verts + accès aux soins).'],
    capital: ['🧠', 'Capital humain', 'Moyenne des indices Éducation et Santé : capacité du territoire à former et maintenir sa population en bonne santé.'],
    innovation: ['🚀', 'Innovation', 'Dérivé : (Éducation + Économie) / 2,4 — un territoire éduqué et actif économiquement a plus de chances d\u2019innover. Indicateur prospectif.'],
    resilience: ['🛡', 'Résilience', 'Capacité de réponse du territoire = indice Services publics (secours, administration, lien social).'],
  };
  const CAT_LISTE = { education: 'ecoles', sante: 'sante', economie: 'commerces', services: 'services', bonheur: 'vert' };

  let drill = null;
  const CAT_ICONE = { education: '🎓', sante: '🏥', economie: '🛍', services: '🏛', bonheur: '🌳' };
  const CAT_FILTRE_3D = {
    education: 'amenity~"school|college|kindergarten|university"',
    sante: 'amenity~"hospital|clinic"',
    services: 'amenity~"townhall|police|fire_station|library"',
  };
  /** Icônes-fiches volantes (gyroscope) au-dessus des lieux + bâtiments en 3D. */
  async function montrerElements3D(cat, liste) {
    elemsDs.entities.removeAll();
    const ic = CAT_ICONE[cat];
    if (!ic || !liste.length) return;
    const t0 = Date.now();
    for (const e of liste.slice(0, 40)) {
      if (!Number.isFinite(e.lat)) continue;
      const { lon, lat } = e;
      elemsDs.entities.add({
        position: new Cesium.CallbackProperty(() => Cesium.Cartesian3.fromDegrees(
          lon, lat, 26 + Math.sin((Date.now() - t0) / 650 + lon * 90) * 5,
        ), false),
        label: {
          text: ic, font: '24px sans-serif', disableDepthTestDistance: Infinity,
          scaleByDistance: new Cesium.NearFarScalar(300, 1.3, 20000, 0.4),
        },
      });
      elemsDs.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: { pixelSize: 5, color: Cesium.Color.CYAN, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
      });
    }
    // les bâtiments correspondants se modélisent en 3D (extrusion OSM)
    if (CAT_FILTRE_3D[cat] && derniere) {
      try {
        const ways = await overpass(`way(around:1300,${derniere.lat},${derniere.lon})[building][${CAT_FILTRE_3D[cat]}];out geom 60;`);
        for (const w of ways) {
          if (!Array.isArray(w.geometry) || w.geometry.length < 3) continue;
          const plat = [];
          let cx = 0; let cy = 0;
          for (const g of w.geometry) { plat.push(g.lon, g.lat); cx += g.lon; cy += g.lat; }
          cx /= w.geometry.length; cy /= w.geometry.length;
          const tags = w.tags || {};
          const h = parseFloat(tags.height) || (parseFloat(tags['building:levels']) || 0) * 3.2 || 9;
          const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cx, cy)) || 0;
          elemsDs.entities.add({
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(plat),
              material: Cesium.Color.fromCssColorString('#37b7ab').withAlpha(0.6),
              height: sol, extrudedHeight: sol + h,
              outline: true, outlineColor: Cesium.Color.CYAN.withAlpha(0.8),
            },
          });
        }
      } catch { /* extrusion facultative */ }
    }
  }

  /** 🏙 BÂTIMENTS 3D PAR CATÉGORIE DE CIVILISATION — analyse territoriale.
   *  Chaque bâtiment de la zone est coloré selon sa fonction (éducation,
   *  santé, services publics, culte, industrie, commerce, logement) et les
   *  bâtiments nomrés reçoivent une icône 🔎 CLIQUABLE → fiche. */
  let cats3DPrimitive = null;
  let legende3D = null;
  const CATS3D = [
    { nom: 'Éducation', test: (t) => /school|college|university|kindergarten/.test(t.amenity || ''), col: '#37b7ab' },
    { nom: 'Santé', test: (t) => /hospital|clinic|doctors|pharmacy/.test(t.amenity || ''), col: '#c084fc' },
    { nom: 'Services publics', test: (t) => /townhall|police|fire_station|library|post_office|courthouse/.test(t.amenity || '') || t.office === 'government', col: '#f0a63c' },
    { nom: 'Culte / mémoire', test: (t) => /place_of_worship|chapel|monastery/.test(t.amenity || ''), col: '#9a86ff' },
    { nom: 'Industrie / artisanat', test: (t) => t.industrial || /factory|workshop/.test(t.man_made || ''), col: '#f07a6a' },
    { nom: 'Commerce / vie', test: (t) => t.shop || /restaurant|cafe|marketplace|theatre|museum/.test(t.amenity || '') || t.tourism, col: '#e8c04a' },
    { nom: 'Logement / autre', test: () => true, col: '#5f7d95' },
  ];
  let pickCatsHandler = null;
  function effacerCategories3D() {
    if (cats3DPrimitive) { viewer.scene.primitives.remove(cats3DPrimitive); cats3DPrimitive = null; }
    legende3D?.remove(); legende3D = null;
    try { pickCatsHandler?.destroy(); } catch { /* ok */ }
    pickCatsHandler = null;
    elemsDs.entities.removeAll();
  }
  async function montrerCategories3D() {
    effacerCategories3D();
    if (!derniere) return;
    const { lat, lon } = derniere;
    const zone = document.createElement('div');
    zone.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:2650;background:rgba(8,12,18,0.92);border:1px solid #7dd3c8;border-radius:10px;padding:8px 16px;font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:1px;color:#e8eaed;';
    zone.textContent = '🏙 Modélisation 3D des bâtiments par catégorie de civilisation…';
    document.body.appendChild(zone);
    try {
      const ways = await overpass(`way(around:1400,${lat},${lon})[building];out geom tags 500;`);
      const geos = [];
      const compteurs = {};
      let nIcones = 0;
      for (const w of ways) {
        if (!Array.isArray(w.geometry) || w.geometry.length < 3) continue;
        const t = w.tags || {};
        const cat = CATS3D.find((c) => c.test(t)) || CATS3D[CATS3D.length - 1];
        const plat = [];
        let cx = 0; let cy = 0;
        for (const g of w.geometry) { plat.push(g.lon, g.lat); cx += g.lon; cy += g.lat; }
        cx /= w.geometry.length; cy /= w.geometry.length;
        const h = parseFloat(t.height) || (parseFloat(t['building:levels']) || 0) * 3.2 || 8;
        const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cx, cy)) || 0;
        geos.push({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(plat)),
            height: sol, extrudedHeight: sol + h,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(cat.col).withAlpha(0.8)) },
        });
        compteurs[cat.nom] = (compteurs[cat.nom] || 0) + 1;
        // icône-fiche 🔎 cliquable au-dessus des bâtiments nommés
        if (t.name && nIcones < 60) {
          elemsDs.entities.add({
            position: Cesium.Cartesian3.fromDegrees(cx, cy, sol + h + 8),
            properties: { c3dLon: cx, c3dLat: cy, c3dNom: t.name, c3dCat: cat.nom, c3dCol: cat.col },
            label: {
              text: '🔎', font: '20px sans-serif',
              disableDepthTestDistance: Infinity,
              scaleByDistance: new Cesium.NearFarScalar(400, 1.1, 15000, 0.3),
            },
          });
          nIcones += 1;
        }
      }
      if (geos.length) {
        cats3DPrimitive = new Cesium.Primitive({
          geometries: geos,
          appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
          releaseGeometryInstances: false,
          asynchronous: false,
        });
        viewer.scene.primitives.add(cats3DPrimitive);
      }
      // légende flottante
      legende3D = document.createElement('div');
      legende3D.style.cssText = 'position:fixed;top:120px;right:12px;z-index:2650;width:230px;background:rgba(8,12,18,0.94);border:1px solid rgba(125,211,200,0.4);border-radius:12px;padding:10px 12px;font-family:var(--font-mono,monospace);font-size:9px;color:#e8eaed;';
      legende3D.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
          <b style="letter-spacing:2px;color:#7dd3c8">🏙 CIVILISATION 3D</b>
          <button style="cursor:pointer;background:none;border:none;color:rgba(232,234,237,0.6);font-size:12px">✕</button></div>
        ${CATS3D.filter((c) => compteurs[c.nom]).map((c) => `<div style="display:flex;align-items:center;gap:7px;margin:3px 0"><i style="width:11px;height:11px;border-radius:3px;background:${c.col};display:inline-block"></i>${c.nom}<b style="margin-left:auto">${compteurs[c.nom]}</b></div>`).join('')}
        <div style="margin-top:7px;color:rgba(232,234,237,0.5);line-height:1.5">🔎 clic sur une icône = fiche du bâtiment.</div>`;
      document.body.appendChild(legende3D);
      legende3D.querySelector('button').addEventListener('click', effacerCategories3D);
      zone.remove();
      // clic sur une icône 🔎 → fiche
      const pickCats = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      pickCats.setInputAction((click) => {
        let picked = null;
        try { picked = viewer.scene.pick(click.position); } catch { return; }
        const ent = picked?.id;
        if (ent?.properties?.c3dNom?.getValue) {
          const lon = ent.properties.c3dLon.getValue();
          const la = ent.properties.c3dLat.getValue();
          const nomB = ent.properties.c3dNom.getValue();
          const catB = ent.properties.c3dCat.getValue();
          const colB = ent.properties.c3dCol.getValue();
          const fiche = document.createElement('div');
          fiche.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2700;width:min(340px,90vw);background:rgba(8,12,18,0.97);border:1px solid ' + colB + ';border-radius:14px;padding:14px 16px;font-family:var(--font-mono,monospace);font-size:10px;color:#e8eaed;';
          fiche.innerHTML = `
            <div style="font-size:11px;font-weight:800;letter-spacing:1px;margin-bottom:6px">🔎 ${nomB}</div>
            <div style="color:${colB};letter-spacing:2px;font-size:9px;margin-bottom:8px">CATÉGORIE : ${catB.toUpperCase()}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="f-vol" style="cursor:pointer;flex:1;padding:8px;font-family:inherit;font-size:9px;font-weight:700;border-radius:8px;background:rgba(125,211,200,0.1);border:1px solid #7dd3c8;color:#7dd3c8">📍 VOYAGER</button>
              <button class="f-lieu" style="cursor:pointer;flex:1;padding:8px;font-family:inherit;font-size:9px;font-weight:700;border-radius:8px;background:rgba(0,212,255,0.1);border:1px solid #00d4ff;color:#00d4ff">ℹ️ FICHE LIEU</button>
              <button class="f-x" style="cursor:pointer;padding:8px;font-family:inherit;font-size:10px;border-radius:8px;background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(232,234,237,0.6)">✕</button>
            </div>`;
          document.body.appendChild(fiche);
          fiche.querySelector('.f-vol').addEventListener('click', () => {
            viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, la, 250), duration: 2 });
            fiche.remove();
          });
          fiche.querySelector('.f-lieu').addEventListener('click', () => {
            fiche.remove();
            window.__godsEyeView?.fiche?.ouvrir(lon, la);
          });
          fiche.querySelector('.f-x').addEventListener('click', () => fiche.remove());
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      pickCatsHandler = pickCats;
    } catch {
      zone.textContent = '⚠ Source OSM saturée — réessaie dans quelques secondes.';
      window.setTimeout(() => zone.remove(), 3500);
    }
  }

  function fermerDrill() {
    drill?.remove(); drill = null;
    root.querySelectorAll('.wti-kpi').forEach((k) => {
      k.classList.remove('sel');
      const ic = k.querySelector('.ic');
      if (ic && ic.dataset.orig) { ic.textContent = ic.dataset.orig; delete ic.dataset.orig; }
    });
  }
  function ouvrirDrill(cat) {
    fermerDrill();
    if (!derniere) return;
    const [ic, nom, desc] = DESCRIPTIONS[cat] || ['📌', cat, ''];
    // bandeau : icône → 🔎 + surbrillance
    root.querySelectorAll('.wti-kpi').forEach((k) => {
      if (k.dataset.cat === cat) {
        k.classList.add('sel');
        const kic = k.querySelector('.ic');
        if (kic) { kic.dataset.orig = kic.textContent; kic.textContent = '🔎'; }
      }
    });
    const liste = derniere.listes[CAT_LISTE[cat]] || [];
    const ind = derniere.indices;
    const sousIndics = {
      population: (() => {
        const c = derniere.commune || {};
        const km2 = c.surface ? c.surface / 100 : 0; // geo.gouv = hectares
        return [
          ['Habitants (INSEE)', (c.population || 0).toLocaleString('fr-FR')],
          ['Superficie', km2 ? `${km2.toFixed(1)} km²` : '—'],
          ['Densité', km2 && c.population ? `${Math.round(c.population / km2).toLocaleString('fr-FR')} hab/km²` : '—'],
          ['Code INSEE', c.code || '—'],
          ['Code postal', c.codesPostaux?.[0] || '—'],
          ['Département', c.codeDepartement || '—'],
          ['Niveau territorial', Math.max(1, Math.ceil((ind.pop || 0) / 25))],
        ];
      })(),
      education: [['Établissements détectés', liste.length], ['Points/établissement', 12], ['Indice', `${ind.edu}%`]],
      economie: [['Commerces détectés', liste.length], ['Points/commerce', 3], ['Indice', `${ind.eco}%`], ['Étoiles', Math.max(1, Math.min(5, Math.ceil(ind.eco / 20)))]],
      sante: [['Équipements détectés', liste.length], ['Points/équipement', 8], ['Indice', `${ind.sante}%`]],
      services: [['Services détectés', liste.length], ['Points/service', 12], ['Indice', `${ind.res}%`]],
      bonheur: [['Espaces verts/loisirs', liste.length], ['Base', 38], ['Bonus santé', Math.round(ind.sante / 5)], ['Indice', `${ind.bonheur}%`]],
      capital: [['Éducation', `${ind.edu}%`], ['Santé', `${ind.sante}%`], ['Capital humain', `${ind.capital}%`]],
      innovation: [['Éducation', `${ind.edu}%`], ['Économie', `${ind.eco}%`], ['Innovation', `${ind.inno}%`]],
      resilience: [['Services publics', `${ind.res}%`]],
    }[cat] || [];

    drill = document.createElement('div');
    drill.className = 'wti-modal';
    drill.innerHTML = `
      <div class="boite wti-glass">
        <div class="tete"><span class="ic">${ic}</span><span class="nm">${nom.toUpperCase()} — ARBORESCENCE</span>
          <button class="x" type="button">✕</button></div>
        <div class="defile">
          <details open><summary>📐 SOUS-INDICATEURS & CALCUL</summary>
            ${sousIndics.map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:3px 6px"><span style="color:rgba(232,234,237,0.6)">${k}</span><b>${v}</b></div>`).join('')}
          </details>
          ${liste.length ? `<details open><summary>📍 ÉLÉMENTS RÉELS DÉTECTÉS (${liste.length}) — clic = voir sur la carte</summary>
            <div class="elems">${liste.map((e, i) => `<button class="item" data-i="${i}" type="button">📌 ${e.nom}</button>`).join('')}</details>` : ''}
          <div class="fiche"><b>FICHE DESCRIPTIVE</b><br>${desc}<br>
          <span style="color:rgba(232,234,237,0.5)">Zone analysée : ${derniere.commune?.nom || '—'} · rayon 1,2 km · ${new Date().toLocaleTimeString('fr-FR')}</span></div>
        </div>
      </div>`;
    document.body.appendChild(drill);
    rendreDeplacable(drill.querySelector('.boite'), drill.querySelector('.tete'));
    // POPULATION → comparatif départemental réel (classement des communes)
    if (cat === 'population' && derniere.commune?.codeDepartement) {
      const bloc = document.createElement('details');
      bloc.open = true;
      bloc.innerHTML = '<summary>🏆 CLASSEMENT DU DÉPARTEMENT</summary><div class="cls" style="padding:4px 6px;color:rgba(232,234,237,0.6)">chargement…</div>';
      drill.querySelector('.defile .fiche').before(bloc);
      fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${derniere.commune.codeDepartement}&fields=nom,population`)
        .then((r) => r.json())
        .then((all) => {
          if (!Array.isArray(all) || !all.length) throw new Error('vide');
          const tri = all.filter((c) => c.population).sort((a, b) => b.population - a.population);
          const rang = tri.findIndex((c) => c.nom === derniere.commune.nom) + 1;
          const top = tri.slice(0, 8);
          const ici = derniere.commune.nom;
          if (rang > 8) top.push(tri[rang - 1]);
          const max = top[0]?.population || 1;
          bloc.querySelector('.cls').innerHTML = `
            <div style="margin-bottom:5px">${ici} : <b>${rang ? `${rang}ᵉ` : '—'}</b> / ${tri.length} communes du ${derniere.commune.codeDepartement}</div>
            ${top.map((c) => {
              const pct = Math.max(2, Math.round((c.population / max) * 100));
              const moi = c.nom === ici;
              return `<div style="margin:3px 0"><div style="display:flex;justify-content:space-between;font-size:9px${moi ? ';color:#00d4ff;font-weight:700' : ''}"><span>${moi ? '📍 ' : ''}${c.nom}</span><span>${c.population.toLocaleString('fr-FR')}</span></div>
                <div style="height:4px;border-radius:3px;background:rgba(255,255,255,0.08)"><div style="height:100%;width:${pct}%;border-radius:3px;background:${moi ? '#00d4ff' : 'rgba(0,212,255,0.35)'}"></div></div></div>`;
            }).join('')}`;
        })
        .catch(() => { bloc.querySelector('.cls').textContent = '⚠ classement indisponible (réseau).'; });
    }
    montrerElements3D(cat, liste); // icônes volantes + bâtiments 3D — clic sur un bâtiment = FICHE LIEU
    drill.querySelector('.x').addEventListener('click', fermerDrill);
    drill.addEventListener('click', (e) => { if (e.target === drill) fermerDrill(); });
    drill.querySelectorAll('.item').forEach((b) => {
      b.addEventListener('click', () => {
        const e = liste[Number(b.dataset.i)];
        if (e?.lat) {
          viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 500), duration: 2 });
          fermerDrill();
        }
      });
    });
  }

  // ═══════════ MODE ANALYSE TERRITORIALE ═══════════
  let heatActif = false;
  function basculerHeat() {
    heatActif = !heatActif;
    heatDs.entities.removeAll();
    if (!heatActif || !derniere) return;
    const COLS = { ecoles: '#37b7ab', sante: '#c084fc', commerces: '#e8c04a', services: '#f0a63c', vert: '#43d17a' };
    // v14 FIX : les « point » d'entité n'ont PAS de heightReference (la valeur
    // était ignorée → points posés au niveau de la mer, SOUS le terrain =
    // heatmap invisible). On passe à des ellipses clampées au sol, visibles.
    for (const [k, col] of Object.entries(COLS)) {
      for (const e of derniere.listes[k] || []) {
        if (!e.lat) continue;
        heatDs.entities.add({
          position: Cesium.Cartesian3.fromDegrees(e.lon, e.lat),
          ellipse: {
            semiMajorAxis: 260, semiMinorAxis: 260,
            material: Cesium.Color.fromCssColorString(col).withAlpha(0.28),
            outline: true, outlineColor: Cesium.Color.fromCssColorString(col).withAlpha(0.55),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: e.nom, font: '10px JetBrains Mono, monospace',
            fillColor: Cesium.Color.fromCssColorString(col),
            showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#0a0a0f').withAlpha(0.6),
            pixelOffset: new Cesium.Cartesian2(0, -12),
            disableDepthTestDistance: Infinity,
            scaleByDistance: new Cesium.NearFarScalar(800, 1, 12000, 0),
          },
        });
      }
    }
  }
  async function ouvrirRapport() {
    if (!derniere) { await analyser(); if (!derniere) return; }
    const { commune, indices: ind, lat, lon } = derniere;
    const paires = [['Éducation', ind.edu], ['Santé', ind.sante], ['Économie', ind.eco], ['Services publics', ind.res], ['Bonheur', ind.bonheur]];
    const faibles = paires.filter(([, v]) => v < 45).map(([n]) => n);
    const forts = paires.filter(([, v]) => v >= 60).map(([n]) => n);
    // le résumé s'affiche AUSSI dans le HUD intel de la vue principale
    const resume = root.querySelector('#wti-resume');
    resume.style.display = 'block';
    resume.innerHTML = `⚠ BESOINS : <b style="color:#f07a6a">${faibles.join(', ') || 'aucun'}</b>
      · ✅ APPUIS : <b style="color:#43d17a">${forts.join(', ') || '—'}</b>
      · <span style="color:#7dd3c8">rapport complet via 🛰 MODE ANALYSE</span>`;
    const HYPO = {
      'Éducation': 'ouvrir une médiathèque/annexe scolaire ou renforcer le périscolaire',
      'Santé': 'maison de santé pluridisciplinaire, permanences de spécialistes',
      'Économie': 'pépinière de commerces, marché hebdomadaire, zone artisanale',
      'Services publics': 'maison France Services, point poste, police municipale',
      'Bonheur': 'parc urbain, végétalisation, équipements sportifs de proximité',
    };
    // solutions en cours : marchés publics BOAMP de la commune (gratuit, sans clé)
    let boamp = '<i>Interrogation BOAMP…</i>';
    const modal = document.createElement('div');
    modal.className = 'wti-modal';
    modal.innerHTML = `
      <div class="boite wti-glass">
        <div class="tete"><span class="ic">🛰</span><span class="nm">ANALYSE TERRITORIALE — ${(commune?.nom || 'ZONE').toUpperCase()}</span>
          <button class="x" type="button">✕</button></div>
        <div class="defile">
          <div class="sect">1 · SITUATION</div>
          ${paires.map(([n, v]) => `<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="min-width:110px">${n}</span>
            <div style="flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,0.09)"><i style="display:block;height:100%;border-radius:3px;width:${v}%;background:${cbar(v)}"></i></div><b>${v}%</b></div>`).join('')}
          <div class="sect">2 · BESOINS PRIORITAIRES</div>
          ${faibles.length ? faibles.map((f) => `⚠ <b>${f}</b> sous le seuil de 45 % — déficit d'équipements dans le rayon analysé.<br>`).join('') : '✅ Aucun indice sous le seuil critique.'}
          <div class="sect">3 · CONTRAINTES & PROBLÈMES PERTINENTS</div>
          ${commune ? `Commune de ${(commune.population || 0).toLocaleString('fr-FR')} hab. — les indices reflètent le rayon de 1,2 km, pas toute la commune : recentre la vue et relance l'analyse pour comparer les quartiers.` : ''}
          ${forts.length ? `<br>Points d'appui : <b>${forts.join(', ')}</b>.` : ''}
          <div class="sect">4 · SOLUTIONS EN COURS / À VENIR (MARCHÉS PUBLICS BOAMP)</div>
          <div class="zone-boamp">${boamp}</div>
          <div class="sect">5 · SOLUTIONS HYPOTHÉTIQUES (PROPOSITIONS)</div>
          ${(faibles.length ? faibles : ['Bonheur']).map((f) => `💡 <b>${f}</b> : ${HYPO[f]}.<br>`).join('')}
          <div class="vues" style="flex-wrap:wrap">
            <button class="v-allo" type="button">🗺 VUE ALLO (dessus)</button>
            <button class="v-ego" type="button">👁 VUE EGO (immersion)</button>
            <button class="v-heat" type="button">🔥 HEATZONES</button>
            <button class="v-cats3d" type="button" style="border-color:#e8c04a;color:#e8c04a;background:rgba(232,192,74,0.08)">🏙 BÂTIMENTS 3D PAR CATÉGORIE</button>
          </div>
          <div class="note">Rapport heuristique généré à partir de données ouvertes (OSM, INSEE, BOAMP). Gratuit, sans clé, pas d'IA.</div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    rendreDeplacable(modal.querySelector('.boite'), modal.querySelector('.tete'));
    modal.querySelector('.x').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector('.v-allo').addEventListener('click', () => {
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, 6000), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-89), roll: 0 }, duration: 1.8 });
    });
    modal.querySelector('.v-ego').addEventListener('click', () => {
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.012, 350), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-12), roll: 0 }, duration: 1.8 });
    });
    modal.querySelector('.v-heat').addEventListener('click', basculerHeat);
    modal.querySelector('.v-cats3d').addEventListener('click', () => {
      modal.remove();
      montrerCategories3D();
    });
    // BOAMP asynchrone
    try {
      const r = await fetch(`https://boamp-datadila.opendatasoft.com/api/records/1.0/search/?dataset=boamp&q=${encodeURIComponent(commune?.nom || '')}&rows=5&sort=dateparution`);
      const d = await r.json();
      const recs = d?.records || [];
      const zb = modal.querySelector('.zone-boamp');
      if (zb) {
        zb.innerHTML = recs.length ? recs.map((rec) => {
          const f = rec.fields || {};
          const objet = f.objet || f.objet_complet || f.titulaire || 'Avis de marché';
          return `📋 <b>${String(objet).slice(0, 110)}</b><br><span style="color:rgba(232,234,237,0.5)">${f.nomacheteur || f.acheteur || ''} · paru ${f.dateparution || '—'}</span><br>`;
        }).join('') : 'Aucun marché public récent trouvé pour cette commune sur BOAMP.';
      }
    } catch {
      const zb = modal.querySelector('.zone-boamp');
      if (zb) zb.innerHTML = 'Source BOAMP injoignable pour le moment (réessaie).';
    }
  }
  root.querySelector('.analyse-terr').addEventListener('click', ouvrirRapport);
  root.querySelector('.heat-gauche').addEventListener('click', async () => {
    if (!derniere) { await analyser(); if (!derniere) return; }
    basculerHeat();
  });

  // ═══════════ DANGERS · EAU · AIR · RÉSEAUX (gratuit, sans clé) ═══════════
  const CARDINAUX16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  async function ouvrirDangers() {
    if (!derniere) { await analyser(); if (!derniere) return; }
    const { commune, lat, lon } = derniere;
    const modal = document.createElement('div');
    modal.className = 'wti-modal';
    modal.innerHTML = `
      <div class="boite wti-glass">
        <div class="tete"><span class="ic">⚠</span><span class="nm">DANGERS & RÉSEAUX — ${(commune?.nom || 'ZONE').toUpperCase()}</span>
          <button class="x" type="button">✕</button></div>
        <div class="defile">
          <div class="sect">🌬 AIR / VENT — impact réel</div><div class="z-air">Mesure en cours…</div>
          <div class="sect">🌊 MER / LITTORAL</div><div class="z-mer">Analyse…</div>
          <div class="sect">⛽ SITES À RISQUE (rayon 3 km) — heat map sur la carte</div><div class="z-sites">Scan OSM…</div>
          <div class="sect">💧 QUALITÉ DE L'EAU POTABLE (Hub'Eau officiel)</div><div class="z-eau">Interrogation…</div>
          <div class="sect">⚡ ÉLECTRICITÉ</div><div class="z-elec">Postes électriques localisés sur la carte (⚡).
          L'état ON/OFF par quartier en temps réel n'est pas public en gratuit — Enedis publie
          les coupures sur son site et des statistiques en open data.</div>
          <div class="vues"><button class="d-eff" type="button">🗑 EFFACER LA COUCHE DANGERS</button></div>
          <div class="note">Sources : OSM (sites), Open-Meteo (vent), Hub'Eau (eau potable, ministère). Heuristiques indicatives — en cas de risque réel : vigilance Météo-France & consignes préfecture.</div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    rendreDeplacable(modal.querySelector('.boite'), modal.querySelector('.tete'));
    modal.querySelector('.x').addEventListener('click', () => modal.remove());
    modal.querySelector('.d-eff').addEventListener('click', () => dangersDs.entities.removeAll());

    // vent (Open-Meteo)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m`)
      .then((r) => r.json()).then((d) => {
        const c = d?.current; if (!c) throw new Error();
        const dir = CARDINAUX16[Math.round((c.wind_direction_10m || 0) / 22.5) % 16];
        const impact = c.wind_gusts_10m > 90 ? '🔴 TEMPÊTE : danger généralisé, chantiers à l\u2019arrêt'
          : c.wind_gusts_10m > 72 ? '🟠 grutage INTERDIT (>72 km/h), vigilance toitures/échafaudages'
            : c.wind_gusts_10m > 50 ? '🟡 prudence levage & filets, poussières' : '🟢 impact faible sur activités et habitants';
        modal.querySelector('.z-air').innerHTML = `Vent <b>${Math.round(c.wind_speed_10m)} km/h</b> venant du <b>${dir}</b>,
          rafales <b>${Math.round(c.wind_gusts_10m)} km/h</b> · ${Math.round(c.temperature_2m)}°C<br>${impact}`;
      }).catch(() => { modal.querySelector('.z-air').textContent = 'Mesure vent indisponible.'; });

    // sites à risque + littoral + postes élec (OSM, une requête) → heat map
    overpass(`(
      node(around:3000,${lat},${lon})[amenity=fuel];
      node(around:3000,${lat},${lon})[man_made=storage_tank];way(around:3000,${lat},${lon})[man_made=storage_tank];
      way(around:3000,${lat},${lon})[landuse=industrial];
      node(around:3000,${lat},${lon})[power=substation];way(around:3000,${lat},${lon})[power=substation];
      way(around:2500,${lat},${lon})[natural=coastline];
    );out center 120;`).then((els) => {
      dangersDs.entities.removeAll();
      let nFuel = 0; let nTank = 0; let nInd = 0; let nElec = 0; let mer = false;
      const lignes = [];
      for (const e of els) {
        const t = e.tags || {};
        const la = e.lat ?? e.center?.lat; const lo = e.lon ?? e.center?.lon;
        if (t.natural === 'coastline') { mer = true; continue; }
        if (!Number.isFinite(la)) continue;
        let coul = '#f07a6a'; let rayon = 120; let ic = '⛽';
        if (t.amenity === 'fuel') { nFuel += 1; }
        else if (t.man_made === 'storage_tank') { nTank += 1; rayon = 300; ic = '🛢'; }
        else if (t.landuse === 'industrial') { nInd += 1; rayon = 250; coul = '#f0a63c'; ic = '🏭'; }
        else if (t.power === 'substation') { nElec += 1; rayon = 60; coul = '#e8c04a'; ic = '⚡'; }
        dangersDs.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lo, la),
          ellipse: { semiMajorAxis: rayon, semiMinorAxis: rayon, material: Cesium.Color.fromCssColorString(coul).withAlpha(0.16), outline: true, outlineColor: Cesium.Color.fromCssColorString(coul).withAlpha(0.5), heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
          label: { text: ic, font: '16px sans-serif', disableDepthTestDistance: Infinity, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
        });
        if (lignes.length < 10 && t.name) lignes.push(`${ic} ${t.name}`);
      }
      modal.querySelector('.z-sites').innerHTML = `${nFuel} station(s)-service · ${nTank} citerne(s)/réservoir(s) ·
        ${nInd} zone(s) industrielle(s) · ${nElec} poste(s) électrique(s) — cercles = périmètre indicatif de risque
        (explosion/incendie).${lignes.length ? `<br>${lignes.join(' · ')}` : ''}`;
      modal.querySelector('.z-mer').innerHTML = mer
        ? '🌊 Littoral à moins de 2,5 km : risque tempête/submersion marine par vent fort d\u2019onshore, surveiller vigilance vagues-submersion.'
        : 'Pas de littoral détecté à proximité immédiate.';
    }).catch(() => { modal.querySelector('.z-sites').textContent = 'Scan OSM indisponible (réessaie).'; });

    // eau potable (Hub'Eau — ministère, sans clé)
    if (commune?.code) {
      fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${commune.code}&size=6`)
        .then((r) => r.json()).then((d) => {
          const res = d?.data || [];
          modal.querySelector('.z-eau').innerHTML = res.length ? res.slice(0, 5).map((m) =>
            `· ${m.libelle_parametre || m.code_parametre} : <b>${m.resultat_alphanumerique || m.resultat_numerique || '—'} ${m.libelle_unite || ''}</b>
             ${m.conclusion_conformite_prelevement ? `<small style="color:${/conforme/i.test(m.conclusion_conformite_prelevement) && !/non/i.test(m.conclusion_conformite_prelevement) ? '#43d17a' : '#f07a6a'}">(${m.conclusion_conformite_prelevement.slice(0, 60)})</small>` : ''}`).join('<br>')
            : 'Pas de prélèvement récent publié pour cette commune.';
        }).catch(() => { modal.querySelector('.z-eau').textContent = 'Hub\u2019Eau indisponible.'; });
    } else modal.querySelector('.z-eau').textContent = 'Commune non identifiée — relance ⟳ ANALYSER.';
  }
  root.querySelector('.dangers').addEventListener('click', ouvrirDangers);

  // ═══════════ FEED DANGERS LIVE — fenêtre droite (CONTEXTE) ═══════════
  // Rafraîchi automatiquement toutes les 5 min tant que l'INTEL est ouvert :
  // vent/orage (Open-Meteo) + feux de forêt proches (EONET/NOAA) + actu
  // fraîche de la commune (GDELT 1 h). Gratuit, sans clé.
  let liveTimer = null;
  function majLive() {
    const zone = root.querySelector('.live-liste');
    if (!zone) return;
    if (!derniere) { zone.innerHTML = 'En attente de l\u2019analyse (⟳ ANALYSER LA VUE)…'; return; }
    const { commune, lat, lon } = derniere;
    const items = [];
    const hh = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let rendus = 0;
    const refaire = () => {
      rendus += 1;
      if (rendus < 3) return;
      if (!zone.isConnected) return;
      zone.innerHTML = items.length
        ? items.map(([sev, txt]) => `<div class="live-item ${sev}"><span class="hh">${hh()}</span> ${txt}</div>`).join('')
        : `<div class="live-item vert"><span class="hh">${hh()}</span> 🟢 Aucune alerte en cours sur la zone (vent, orage, feu, actu).</div>`;
    };
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=wind_speed_10m,wind_gusts_10m,weather_code`)
      .then((r) => r.json()).then((d) => {
        const c = d?.current;
        if (!c) return refaire();
        if (c.wind_gusts_10m > 90) items.push(['rouge', `🌬 TEMPÊTE — rafales ${Math.round(c.wind_gusts_10m)} km/h (grutage interdit, danger généralisé)`]);
        else if (c.wind_gusts_10m > 72) items.push(['orange', `🌬 Rafales ${Math.round(c.wind_gusts_10m)} km/h — grutage interdit (>72), vigilance toitures/échafaudages`]);
        else if (c.wind_gusts_10m > 50) items.push(['orange', `🌬 Vent fort — rafales ${Math.round(c.wind_gusts_10m)} km/h, prudence levage`]);
        if (c.weather_code >= 95) items.push(['orange', `⛈ Orage en cours — coupures possibles, évitez les pleins airs`]);
        refaire();
      }).catch(() => refaire());
    fetch('https://eonet.nl.noaa.gov/api/v3/events?status=open&days=3&limit=60')
      .then((r) => r.json()).then((d) => {
        for (const ev of d?.events || []) {
          const g = ev.geometry?.[0];
          if (!g) continue;
          const [elo, elat] = g;
          if (Math.abs(elat - lat) < 0.4 && Math.abs(elo - lon) < 0.6 && /wildfire|fire/i.test(ev.title || '')) {
            const km = Math.round(Math.hypot((elat - lat) * 111, (elo - lon) * 111 * Math.cos((lat * Math.PI) / 180)));
            items.push(['rouge', `🔥 Feu détecté à ~${km} km (EONET/NOAA, ${String(ev.date || '').slice(0, 10)})`]);
          }
        }
        refaire();
      }).catch(() => refaire());
    fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${commune?.nom || ''}" sourcelang:fra`)}&mode=artlist&maxrecords=3&timespan=1h&format=json`)
      .then((r) => r.json()).then((g) => {
        for (const a of (g?.articles || []).slice(0, 3)) {
          items.push(['vert', `📰 ${(a.title || '').slice(0, 70)} <span class="hh">${a.domain || ''}</span>`]);
        }
        refaire();
      }).catch(() => refaire());
  }
  function demarrerLive() { if (!liveTimer) liveTimer = window.setInterval(majLive, 5 * 60000); }
  function arreterLive() { if (liveTimer) { window.clearInterval(liveTimer); liveTimer = null; } }

  // ═══════════ ANALYSE PRINCIPALE ═══════════
  let analyseEnCours = false;
  async function analyser() {
    if (analyseEnCours) return;
    analyseEnCours = true;
    const btn = root.querySelector('#wti-analyser');
    btn.textContent = '⟳ ANALYSE…';
    try {
      const c = viewer.camera.positionCartographic;
      const lat = Cesium.Math.toDegrees(c.latitude);
      const lon = Cesium.Math.toDegrees(c.longitude);
      const [commune, elements] = await Promise.all([
        fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,population,codesPostaux,code,surface,codeDepartement`).then((r) => r.json()).then((d) => d?.[0]).catch(() => null),
        overpass(`(
          node(around:1200,${lat},${lon})[amenity~"school|college|kindergarten|university"];
          node(around:1200,${lat},${lon})[amenity~"hospital|pharmacy|doctors|clinic"];
          node(around:1200,${lat},${lon})[shop];
          node(around:1200,${lat},${lon})[amenity~"townhall|police|fire_station|post_office|library|community_centre"];
          node(around:1200,${lat},${lon})[leisure~"park|garden|playground|sports_centre"];
        );out 500;`).catch(() => []),
      ]);
      const listes = { ecoles: [], sante: [], commerces: [], services: [], vert: [] };
      for (const e of elements) {
        const t = e.tags || {};
        const item = { nom: t.name || t.amenity || t.shop || t.leisure || 'sans nom', lat: e.lat, lon: e.lon };
        if (/school|college|kindergarten|university/.test(t.amenity || '')) listes.ecoles.push(item);
        else if (/hospital|pharmacy|doctors|clinic/.test(t.amenity || '')) listes.sante.push(item);
        else if (t.shop) listes.commerces.push(item);
        else if (t.amenity) listes.services.push(item);
        else if (t.leisure) listes.vert.push(item);
      }
      const iEdu = Math.min(100, listes.ecoles.length * 12);
      const iSante = Math.min(100, listes.sante.length * 8);
      const iEco = Math.min(100, listes.commerces.length * 3);
      const iRes = Math.min(100, listes.services.length * 12);
      const iInno = Math.min(100, Math.round((iEdu + iEco) / 2.4));
      const iBonheur = Math.min(100, 38 + listes.vert.length * 5 + Math.round(iSante / 5));
      const iCapital = Math.round((iEdu + iSante) / 2);
      const iPop = Math.min(100, Math.round(Math.log10(Math.max(10, commune?.population || 10)) * 20));
      derniere = { commune, lat, lon, listes, indices: { edu: iEdu, sante: iSante, eco: iEco, res: iRes, inno: iInno, bonheur: iBonheur, capital: iCapital, pop: iPop } };

      // le jumeau de la commune vit DANS la fenêtre CIVILISATION ;
      // le bandeau porte le logo WATCHTOWER (visible en permanence)
      const titreComm = root.querySelector('#wti-gauche .titre .commune');
      if (titreComm) titreComm.innerHTML = commune
        ? `${commune.nom.toUpperCase()} <span style="color:#7dd3c8">DIGITAL TWIN</span> · ${commune.codesPostaux?.[0] || ''}`
        : 'ZONE ANALYSÉE';
      root.querySelector('.pop').innerHTML = commune ? `${(commune.population || 0).toLocaleString('fr-FR')} <span class="haut" style="font-size:12px">↑</span>` : '—';
      rendreKpis([
        { ic: '👥', nom: 'Population', texte: commune ? (commune.population || 0).toLocaleString('fr-FR') : '—', val: iPop, cat: 'population' },
        { ic: '🧠', nom: 'Capital humain', val: iCapital, cat: 'capital' },
        { ic: '😊', nom: 'Bonheur', val: iBonheur, cat: 'bonheur' },
        { ic: '💰', nom: 'Économie', etoiles: Math.max(1, Math.min(5, Math.ceil(iEco / 20))), cat: 'economie' },
        { ic: '🛡', nom: 'Résilience', val: iRes, cat: 'resilience' },
        { ic: '🎓', nom: 'Éducation', val: iEdu, cat: 'education' },
        { ic: '🚀', nom: 'Innovation', val: iInno, cat: 'innovation' },
      ]);
      rendreCats([
        { ic: '👥', nom: 'Population', val: iPop, cat: 'population' },
        { ic: '🎓', nom: 'Éducation', val: iEdu, cat: 'education' },
        { ic: '💼', nom: 'Emplois & commerces', val: iEco, cat: 'economie' },
        { ic: '🏥', nom: 'Santé', val: iSante, cat: 'sante' },
        { ic: '🏛', nom: 'Services publics', val: iRes, cat: 'services' },
      ]);
      root.querySelector('.skills').innerHTML = [
        ['Développement', iEco, '#37b7ab'], ['Compétences', iCapital, '#c084fc'], ['Innovation', iInno, '#e8c04a'],
      ].map(([n, v, col], i) => `<div class="skill"><span>${i + 1}. ${n}</span><div class="barre"><i style="width:${v}%;background:${col}"></i></div></div>`).join('');
      root.querySelector('.jauge.eco i').style.width = `${iEco}%`;
      rendreHisto(root.querySelector('.histo'), [
        { l: 'Écoles', n: listes.ecoles.length, c: '#37b7ab' }, { l: 'Santé', n: listes.sante.length, c: '#c084fc' },
        { l: 'Commerce', n: listes.commerces.length, c: '#e8c04a' }, { l: 'Services', n: listes.services.length, c: '#f0a63c' },
        { l: 'Vert', n: listes.vert.length, c: '#43d17a' },
      ]);
      rendreMatrice(root.querySelector('.matrice'), [listes.vert.length, listes.commerces.length, listes.ecoles.length, listes.sante.length, listes.services.length]);
      if (heatActif) { heatActif = false; basculerHeat(); }
      // ⚠ feed dangers live dans la fenêtre droite (CONTEXTE)
      majLive();
      demarrerLive();
      // 📰 flux ville façon Bloomberg (GDELT, gratuit) + étiquette d'impact heuristique
      fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${commune?.nom || ''}" sourcelang:fra`)}&mode=artlist&maxrecords=6&timespan=3m&format=json`)
        .then((r) => r.json()).then((g) => {
          const arts = g?.articles || [];
          const etiq = (t) => (/ouvertur|inaugur|créat|nouveau|nouvelle/i.test(t) ? ' <b style="color:#43d17a">▲ activité+</b>'
            : /ferme|liquidat|incend|accident|inond/i.test(t) ? ' <b style="color:#f07a6a">▼ risque</b>'
              : /budget|subvention|investis/i.test(t) ? ' <b style="color:#e8c04a">€ budget</b>' : '');
          root.querySelector('.news').innerHTML = arts.length ? arts.map((a) =>
            `<div style="margin:3px 0">▸ <a href="${a.url}" target="_blank" rel="noopener" style="color:#7dd3c8;text-decoration:none">${(a.title || '').slice(0, 78)}</a>
             <small style="color:rgba(232,234,237,0.4)">${(a.seendate || '').slice(6, 8)}/${(a.seendate || '').slice(4, 6)}</small>${etiq(a.title || '')}</div>`).join('')
            : 'Aucune actu récente indexée pour cette commune (GDELT).';
        }).catch(() => { root.querySelector('.news').textContent = 'Flux actus indisponible.'; });
      btn.textContent = '⟳ ANALYSER LA VUE';
    } catch { btn.textContent = '⚠ SOURCE SATURÉE — RÉESSAYER'; }
    analyseEnCours = false;
  }
  root.querySelector('#wti-analyser').addEventListener('click', analyser);

  let dejaAnalyse = false;
  new MutationObserver(() => {
    const ouvert = !root.classList.contains('wt-dock-cache');
    const boussole = document.getElementById('wt-boussole');
    if (boussole) boussole.style.top = ouvert ? '62px' : '10px';
    if (ouvert && !dejaAnalyse) { dejaAnalyse = true; analyser(); }
    if (!ouvert) { fermerDrill(); effacerCategories3D(); arreterLive(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  return { analyser, ouvrirRapport };
}
