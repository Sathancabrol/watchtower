/**
 * WATCHTOWER — POSTE DE COMMANDEMENT : les vues de démarrage.
 *
 * Choisi à l'écran « POSTE DE COMMANDEMENT — QUE VEUX-TU VOIR ? » :
 *  🌍 explorer   — vue orbitale libre
 *  👤 individu   — profil utilisateur + INTEL (fiche d'identité si vide)
 *  🧭 lieux      — recherche de lieux + mes lieux
 *  🏛 historique — frise des événements de la commune (GDELT + Wikipédia)
 *  ⭐ favoris    — vues enregistrées + domicile + dernière vue
 *
 * Les 3 fenêtres (LIEUX · HISTO · FAVORIS) sont aussi des panneaux du dock,
 * accessibles à tout moment. Tout est gratuit et sans clé.
 */

import * as Cesium from 'cesium';

const LIEUX_KEY = 'watchtower.lieux.v1';
const VUES_KEY = 'watchtower.vues.v1';
const DOM_KEY = 'watchtower.domicile.v1';
const DERNIERE_KEY = 'watchtower.derniereVue.v1';

const lireJson = (k, d) => { try { return JSON.parse(window.localStorage.getItem(k)) ?? d; } catch { return d; } };
const ecrireJson = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* plein */ } };

const CSS = `
.wt-pc { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; font-size: 10px; }
.wt-pc .pc-rang { display: flex; gap: 5px; }
.wt-pc .pc-rang > * { flex: 1; min-width: 0; }
.wt-pc input { padding: 8px 10px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 10px; outline: none; }
.wt-pc input:focus { border-color: #00d4ff; }
.wt-pc .pc-btn { cursor: pointer; padding: 8px 10px; border-radius: 8px; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; }
.wt-pc .pc-btn:hover { background: rgba(0,212,255,0.2); }
.wt-pc .pc-btn.vert { border-color: rgba(67,209,122,0.5); color: #43d17a; background: rgba(67,209,122,0.08); }
.wt-pc .pc-statut { color: rgba(232,234,237,0.55); line-height: 1.6; font-size: 9px; }
.wt-pc .pc-ligne { cursor: pointer; width: 100%; text-align: left; display: flex; gap: 7px; align-items: center; padding: 6px 9px; border-radius: 7px; font-family: inherit; font-size: 9.5px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: inherit; line-height: 1.4; }
.wt-pc .pc-ligne:hover { border-color: #00d4ff; }
.wt-pc .pc-ligne .d { margin-left: auto; color: #00d4ff; white-space: nowrap; font-size: 8.5px; }
.wt-pc .pc-ligne .x { cursor: pointer; background: none; border: none; color: #f08a8a; font-family: inherit; }
.wt-pc .pc-evt { width: 100%; text-align: left; padding: 7px 9px; border-radius: 7px; font-family: inherit; font-size: 9.5px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: inherit; line-height: 1.5; }
.wt-pc .pc-evt:hover { border-color: #7dd3c8; }
.wt-pc .pc-evt .dt { color: #7dd3c8; font-size: 8.5px; letter-spacing: 1px; }
.wt-pc .pc-evt a { color: #00d4ff; text-decoration: none; }
.wt-pc .pc-sect { font-size: 8px; letter-spacing: 2px; color: rgba(232,234,237,0.4); margin-top: 4px; }
`;

function geocoder(q) {
  // BAN d'abord (France, précis, sans clé), sinon Photon (monde, sans clé)
  return fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6`)
    .then((r) => r.json())
    .then((d) => (Array.isArray(d?.features) && d.features.length ? d.features : null))
    .catch(() => null)
    .then((fr) => (fr ? fr : fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`)
      .then((r) => r.json())
      .then((d2) => d2?.features || [])
      .catch(() => [])));
}

export function initPosteCommandement(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let dockRef = null;
  const setDock = (d) => { dockRef = d; };

  const voler = (lon, lat, alt = 1200) => viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), duration: 2.4 });

  /* ═══════════ 🧭 LIEUX — recherche + mes lieux ═══════════ */
  const elLieux = document.createElement('div');
  elLieux.className = 'wt-pc';
  elLieux.innerHTML = `
    <div class="pc-rang">
      <input class="pc-q" type="text" placeholder="Adresse, ville, lieu… (BAN + Photon, sans clé)" />
      <button class="pc-btn pc-go" type="button">🔍</button>
    </div>
    <div class="pc-rang">
      <button class="pc-btn pc-moi" type="button">📡 MA POSITION</button>
      <button class="pc-btn pc-dom" type="button">🏠 DOMICILE</button>
    </div>
    <div class="pc-rang">
      <button class="pc-btn vert pc-ajout" type="button">➕ AJOUTER CE LIEU (centre de la vue)</button>
    </div>
    <div class="pc-statut pc-res">Saisis une adresse ou une ville — clic sur un résultat = y voler.</div>
    <div class="pc-sect">MES LIEUX (partagés en local — ta famille, tes repères)</div>
    <div class="pc-lieufs"></div>`;
  const resLieux = elLieux.querySelector('.pc-res');

  function rendreMesLieux() {
    const liste = elLieux.querySelector('.pc-lieufs');
    const lieux = lireJson(LIEUX_KEY, []);
    liste.innerHTML = lieux.length ? '' : '<div class="pc-statut">Aucun lieu enregistré.</div>';
    lieux.forEach((l, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pc-ligne';
      b.innerHTML = `<span>${l.icone || '📌'}</span><span>${l.nom}<br><small style="color:rgba(232,234,237,0.45)">${l.ville || ''}</small></span>
        <span class="d">▶</span><span class="x" title="Retirer">✕</span>`;
      b.addEventListener('click', (e) => {
        if (e.target.classList.contains('x')) {
          lieux.splice(i, 1); ecrireJson(LIEUX_KEY, lieux); rendreMesLieux(); return;
        }
        voler(l.lon, l.lat, 1200);
      });
      liste.appendChild(b);
    });
  }
  rendreMesLieux();

  elLieux.querySelector('.pc-go').addEventListener('click', chercher);
  elLieux.querySelector('.pc-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') chercher(); });
  async function chercher() {
    const q = elLieux.querySelector('.pc-q').value.trim();
    if (!q) return;
    resLieux.textContent = '🔍 Recherche (BAN France, sinon Photon monde)…';
    try {
      const feats = await geocoder(q);
      if (!feats.length) { resLieux.textContent = `« ${q} » introuvable. Essaie une adresse plus précise (code postal + rue).`; return; }
      resLieux.innerHTML = `${feats.length} résultat(s) — clic = y voler :`;
      for (const f of feats) {
        const [lon, lat] = f.geometry.coordinates;
        const props = f.properties || {};
        const nom = props.name || props.label || props.housenumber || q;
        const ville = props.city || props.name || '';
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pc-ligne';
        b.innerHTML = `<span>📍</span><span>${nom}<br><small style="color:rgba(232,234,237,0.45)">${ville} · ${lat.toFixed(5)}, ${lon.toFixed(5)}</small></span><span class="d">▶</span>`;
        b.addEventListener('click', () => voler(lon, lat, 1500));
        resLieux.appendChild(b);
      }
    } catch { resLieux.textContent = '⚠ Géocodage indisponible (réseau) — réessaie.'; }
  }
  elLieux.querySelector('.pc-moi').addEventListener('click', () => {
    if (!navigator.geolocation) { resLieux.textContent = 'Géolocalisation non disponible ici.'; return; }
    resLieux.textContent = '📡 Position en cours…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { resLieux.textContent = '📡 Position trouvée :'; voler(pos.coords.longitude, pos.coords.latitude, 1500); },
      () => { resLieux.textContent = '🚫 Permission refusée — utilise « DOMICILE » ou la saisie.'; },
      { timeout: 10000 },
    );
  });
  elLieux.querySelector('.pc-dom').addEventListener('click', () => {
    const dom = lireJson(DOM_KEY, null);
    if (!dom) { resLieux.textContent = 'Domicile non définie — défins-la dans le panneau WATCHTOWER·FR ou MOI.'; return; }
    voler(dom.lon, dom.lat, 1500);
  });
  elLieux.querySelector('.pc-ajout').addEventListener('click', () => {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const nom = window.prompt('Nom de ce lieu (ex : Chez Tante Martine) :', '');
    if (!nom) return;
    const lieux = lireJson(LIEUX_KEY, []);
    lieux.push({ nom, lat, lon, icone: '📌', t: Date.now() });
    ecrireJson(LIEUX_KEY, lieux);
    rendreMesLieux();
  });

  /* ═══════════ 🏛 HISTORIQUE — frise des événements ═══════════ */
  const elHisto = document.createElement('div');
  elHisto.className = 'wt-pc';
  elHisto.innerHTML = `
    <button class="pc-btn pc-analyser" type="button">🏛 ANALYSER LA COMMUNE SOUS LA VUE</button>
    <div class="pc-statut pc-stat">Les événements de ta commune : résumé Wikipédia + frise presse (GDELT, 10 ans, gratuit).
    Un clic sur un événement géolocalisé = y voler.</div>
    <div class="pc-frise"></div>`;

  elHisto.querySelector('.pc-analyser').addEventListener('click', async () => {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const stat = elHisto.querySelector('.pc-stat');
    const frise = elHisto.querySelector('.pc-frise');
    stat.textContent = '🔍 Commune en cours d\'identification…';
    frise.innerHTML = '';
    let commune = null;
    try {
      commune = (await (await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,population,codesPostaux`)).json())?.[0] || null;
    } catch { /* hors France */ }
    if (!commune) { stat.textContent = '⚠ Commune française non identifiée sous la vue — recentre-toi sur la France.'; return; }
    stat.textContent = `🏛 ${commune.nom} (${commune.codesPostaux?.[0] || ''}) — ${commune.population?.toLocaleString('fr-FR') || '?'} hab.`;

    // résumé Wikipédia (section histoire incluse dans l'extrait)
    const zoneWiki = document.createElement('div');
    zoneWiki.className = 'pc-evt';
    zoneWiki.innerHTML = '📖 Résumé Wikipédia en cours de chargement…';
    frise.appendChild(zoneWiki);
    fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(commune.nom)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        zoneWiki.innerHTML = d?.extract
          ? `<div class="dt">📖 WIKIPÉDIA — ${d.title}</div>${d.extract.slice(0, 520)}${d.extract.length > 520 ? '…' : ''}${d.content_urls?.desktop?.page ? `<br><a href="${d.content_urls.desktop.page}" target="_blank" rel="noopener">article complet ↗</a>` : ''}`
          : '📖 Article Wikipédia introuvable.';
      })
      .catch(() => { zoneWiki.innerHTML = '📖 Wikipédia indisponible (réseau).'; });

    // frise GDELT : les 6 plus récents + les plus anciens indexés (ancres historiques)
    const zoneFrise = document.createElement('div');
    zoneFrise.className = 'pc-evt';
    zoneFrise.innerHTML = '📰 Frise presse (GDELT, 10 ans)…';
    frise.appendChild(zoneFrise);
    try {
      const g = await (await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${commune.nom}" sourcelang:fra`)}&mode=artlist&maxrecords=40&timespan=10y&format=json`)).json();
      const arts = (g?.articles || []).filter((a) => a.seendate);
      if (!arts.length) { zoneFrise.innerHTML = '📰 Aucun événement indexé par GDELT pour cette commune (source mondiale, pas exhaustive).'; return; }
      const tries = arts.slice(0, 6);
      const anciens = arts.slice(-6).reverse();
      const render = (titre, liste) => `<div class="dt" style="margin-top:6px">${titre}</div>` + liste.map((a) => {
        const d = a.seendate;
        const dt = `${String(d).slice(6, 8)}/${String(d).slice(4, 6)}/${String(d).slice(0, 4)}`;
        const geo = Number.isFinite(a.geo?.lat) ? `data-lat="${a.geo.lat}" data-lon="${a.geo.long}"` : '';
        return `<button class="pc-ligne" ${geo} style="margin:2px 0"><span>📰</span><span>${dt} — ${(a.title || '').slice(0, 90)}<br><small style="color:rgba(232,234,237,0.45)">${a.domain || ''} ${a.geo?.lat ? '· 📍 géolocalisé (clic = y voler)' : ''}</small></span><span class="d">${a.geo?.lat ? '▶' : '↗'}</span></button>`;
      }).join('');
      zoneFrise.innerHTML = render(`🕘 6 PLUS RÉCENTS (${arts.length} indexés au total)`, tries) + render('🏛 ANCRAGES LES PLUS ANCIENS', anciens);
      zoneFrise.querySelectorAll('button[data-lat]').forEach((b) => {
        b.addEventListener('click', () => voler(Number(b.dataset.lon), Number(b.dataset.lat), 4000));
      });
      zoneFrise.querySelectorAll('button:not([data-lat])').forEach((b, i) => {
        const src = [tries, ...anciens][0];
        b.style.cursor = 'default';
      });
    } catch { zoneFrise.innerHTML = '📰 GDELT indisponible (réseau) — réessaie.'; }
  });

  /* ═══════════ ⭐ FAVORIS — vues enregistrées ═══════════ */
  const elFav = document.createElement('div');
  elFav.className = 'wt-pc';
  elFav.innerHTML = `
    <div class="pc-rang">
      <input class="pc-nomvue" type="text" placeholder="Nom de la vue…" />
      <button class="pc-btn vert pc-save" type="button">⭐</button>
    </div>
    <div class="pc-statut">Tes vues caméra : retour d'un clic (▶). Domicile et dernière vue en tête.</div>
    <div class="pc-favs"></div>`;

  function rendreFavs() {
    const zone = elFav.querySelector('.pc-favs');
    const vues = lireJson(VUES_KEY, []);
    const dom = lireJson(DOM_KEY, null);
    const derniere = lireJson(DERNIERE_KEY, null);
    zone.innerHTML = '';
    if (derniere) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pc-ligne';
      b.innerHTML = `<span>🕘</span><span>MA DERNIÈRE VUE<br><small style="color:rgba(232,234,237,0.45)">${new Date(derniere.t || Date.now()).toLocaleString('fr-FR')}</small></span><span class="d">▶</span>`;
      b.addEventListener('click', () => {
        viewer.camera.flyTo({ destination: new Cesium.Cartesian3(derniere.x, derniere.y, derniere.z), orientation: { heading: derniere.heading, pitch: derniere.pitch, roll: derniere.roll }, duration: 2.5 });
      });
      zone.appendChild(b);
    }
    if (dom) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pc-ligne';
      b.innerHTML = `<span>🏠</span><span>DOMICILE — ${dom.label || 'ma maison'}<br><small style="color:rgba(232,234,237,0.45)">${dom.lat?.toFixed(5)}, ${dom.lon?.toFixed(5)}</small></span><span class="d">▶</span>`;
      b.addEventListener('click', () => voler(dom.lon, dom.lat, 1500));
      zone.appendChild(b);
    }
    if (!vues.length && !dom && !derniere) zone.innerHTML = '<div class="pc-statut">Rien encore — enregistre ta première vue (⭐).</div>';
    vues.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pc-ligne';
      b.innerHTML = `<span>⭐</span><span>${v.nom}<br><small style="color:rgba(232,234,237,0.45)">${new Date(v.t || Date.now()).toLocaleDateString('fr-FR')}</small></span><span class="d">▶</span><span class="x" title="Supprimer">✕</span>`;
      b.addEventListener('click', (e) => {
        if (e.target.classList.contains('x')) {
          vues.splice(i, 1); ecrireJson(VUES_KEY, vues); rendreFavs(); return;
        }
        viewer.camera.flyTo({ destination: new Cesium.Cartesian3(v.x, v.y, v.z), orientation: { heading: v.heading, pitch: v.pitch, roll: v.roll }, duration: 2.5 });
      });
      zone.appendChild(b);
    });
  }
  rendreFavs();

  elFav.querySelector('.pc-save').addEventListener('click', () => {
    const p = viewer.camera.position;
    const vues = lireJson(VUES_KEY, []);
    vues.push({
      nom: elFav.querySelector('.pc-nomvue').value.trim() || `Vue ${new Date().toLocaleDateString('fr-FR')}`,
      x: p.x, y: p.y, z: p.z,
      heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll,
      t: Date.now(),
    });
    ecrireJson(VUES_KEY, vues);
    elFav.querySelector('.pc-nomvue').value = '';
    rendreFavs();
  });

  /* ═══════════ missions de démarrage ═══════════ */
  function orbiteDefaut() {
    const dom = lireJson(DOM_KEY, null);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(dom?.lon ?? 3.75, dom?.lat ?? 43.44, 21_000_000),
      duration: 3,
    });
  }

  function lancerMission(mission) {
    const ouvrirPan = (id) => dockRef?.ouvrir?.(id);
    switch (mission) {
      case 'individu': {
        dockRef?.ouvrirExistant?.('wt-intel');
        window.setTimeout(() => {
          const onglet = document.querySelector('#wt-intel .ong[data-v="profil"]');
          onglet?.click();
          const p = lireJson('watchtower.profil.v1', {});
          if (!p.nom) {
            const nomInput = document.querySelector('#wt-intel .p-nom');
            if (nomInput) { nomInput.focus(); nomInput.scrollIntoView?.({ block: 'center' }); }
          }
        }, 500);
        break;
      }
      case 'lieux':
        ouvrirPan('lieux');
        break;
      case 'historique': {
        const dom = lireJson(DOM_KEY, null);
        if (dom) voler(dom.lon, dom.lat, 16000);
        ouvrirPan('histo');
        window.setTimeout(() => elHisto.querySelector('.pc-analyser').click(), 700);
        break;
      }
      case 'favoris':
        ouvrirPan('favoris');
        break;
      case 'continuer': {
        const derniere = lireJson(DERNIERE_KEY, null);
        if (derniere) {
          viewer.camera.flyTo({ destination: new Cesium.Cartesian3(derniere.x, derniere.y, derniere.z), orientation: { heading: derniere.heading, pitch: derniere.pitch, roll: derniere.roll }, duration: 2.5 });
        } else orbiteDefaut();
        break;
      }
      default:
        orbiteDefaut();
    }
  }

  return {
    setDock,
    lancerMission,
    panneaux: {
      lieux: { element: elLieux },
      histo: { element: elHisto },
      favoris: { element: elFav },
    },
  };
}
