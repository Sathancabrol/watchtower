/**
 * WATCHTOWER — POSTE DE PILOTAGE (MODE VOL).
 *
 * En mode vol, l'écran doit ressembler à un simulateur, pas à un bureau :
 * au lieu de huit fenêtres éparpillées, un **poste de pilotage** unique,
 * centré, avec l'instrumentation attendue dans un jeu :
 *
 *   · **horizon artificiel** au centre (sky/ground, échelle de tangage,
 *     arc de roulis, repère d'avion fixe) ;
 *   · **bandes** de vitesse et d'altitude qui défilent à droite et à gauche ;
 *   · **bandeau bas** : gaz (poussée), vario, facteur de charge, distance,
 *     chrono, masse ;
 *   · **tiroir SYSTÈMES** à gauche : rouvre n'importe quelle fenêtre de
 *     l'application sans quitter le vol — aucune fonction n'est perdue,
 *     elles sont juste rangées.
 *
 * Le reste de l'interface (panneau HQ, INTEL, fiche, épingles…) est masqué
 * par la classe `wt-mode-vol` posée sur <body> et redevient visible à
 * l'atterrissage.
 */

import { governorRequestRender } from './renderGovernor.js';

const CSS = `
#wt-cockpit {
  position: fixed; inset: 0; z-index: 1560; pointer-events: none; display: none;
  font-family: var(--font-mono, monospace); color: #b8ffc9;
}
#wt-cockpit.actif { display: block; }
#wt-cockpit .instruments {
  position: absolute; left: 50%; bottom: 3vh; transform: translateX(-50%);
  display: flex; align-items: flex-end; gap: 12px;
}
#wt-cockpit canvas {
  display: block; border-radius: 12px;
  filter: drop-shadow(0 6px 22px rgba(0,0,0,0.55));
}
#wt-cockpit .bandeau {
  position: absolute; left: 50%; bottom: calc(3vh + 292px); transform: translateX(-50%);
  display: flex; gap: 10px; align-items: stretch; pointer-events: auto; flex-wrap: wrap;
  justify-content: center; max-width: 92vw;
}
#wt-cockpit .boite {
  background: rgba(6,14,10,0.72); border: 1px solid rgba(120,230,150,0.32);
  border-radius: 9px; padding: 5px 10px; text-align: center; min-width: 74px;
  backdrop-filter: blur(6px);
}
#wt-cockpit .boite .k { font-size: 7px; letter-spacing: 2px; color: rgba(159,232,176,0.6); }
#wt-cockpit .boite .v { font-size: 15px; font-weight: 800; color: #d6ffe2; font-variant-numeric: tabular-nums; }
#wt-cockpit .gaz {
  position: absolute; right: 3vw; bottom: 3vh; width: 58px; height: 230px;
  border: 1px solid rgba(120,230,150,0.35); border-radius: 10px;
  background: linear-gradient(0deg, rgba(10,22,14,0.8), rgba(6,14,10,0.55));
  overflow: hidden; display: flex; align-items: flex-end;
}
#wt-cockpit .gaz > i {
  display: block; width: 100%;
  background: linear-gradient(0deg, #2f8f4f, #78e696);
  transition: height .12s linear;
}
#wt-cockpit .gaz .etiq {
  position: absolute; left: 0; right: 0; bottom: -18px; text-align: center;
  font-size: 7px; letter-spacing: 2px; color: rgba(159,232,176,0.65);
}
#wt-cockpit .tiroir {
  position: absolute; left: 12px; top: 96px; pointer-events: auto;
  background: rgba(6,14,10,0.82); border: 1px solid rgba(120,230,150,0.3);
  border-radius: 10px; padding: 8px; width: 148px; backdrop-filter: blur(6px);
}
#wt-cockpit .tiroir .t { font-size: 8px; letter-spacing: 2px; color: rgba(159,232,176,0.7); margin-bottom: 6px; }
#wt-cockpit .tiroir button {
  display: block; width: 100%; text-align: left; cursor: pointer; margin-bottom: 3px;
  padding: 5px 7px; border-radius: 7px; font-family: inherit; font-size: 9px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cfe9d6;
}
#wt-cockpit .tiroir button:hover { background: rgba(120,230,150,0.16); border-color: rgba(120,230,150,0.45); }
#wt-cockpit .tiroir button.actif { background: rgba(120,230,150,0.24); border-color: #78e696; color: #d6ffe2; }

/* ——— MODE VOL : on range tout ce qui n'est pas le cockpit ——— */
body.wt-mode-vol #wt-boussole,
body.wt-mode-vol #wt-panel,
body.wt-mode-vol #wt-intel,
body.wt-mode-vol #wt-ville,
body.wt-mode-vol #wt-pins,
body.wt-mode-vol #wt-pin-btn,
body.wt-mode-vol #wt-fiche,
body.wt-mode-vol #wt-photo,
body.wt-mode-vol #wt-sv,
body.wt-mode-vol .wti-glass { display: none !important; }
/* une fenêtre rouverte depuis le tiroir reste visible */
body.wt-mode-vol .wt-vol-force { display: block !important; }
/* les instruments « classiques » du mode vol sont repliés dans le cockpit */
body.wt-mode-vol #wt-vol-hud .wt-vol-w { display: none; }
body.wt-mode-vol #wt-vol-hud.classique .wt-vol-w { display: block; }
body.wt-mode-vol #wt-minimap { right: 12px !important; bottom: 12px !important; left: auto !important; top: auto !important; }
body.wt-mode-vol #wt-dock { transform: scale(0.86); transform-origin: bottom center; opacity: 0.86; }
body.wt-mode-vol #wt-dock:hover { opacity: 1; transform: none; }

/* ——— HUD ÉPURÉ (touche H) : comme dans un jeu, on ne garde que l'utile ——— */
body.wt-hud-epure #wt-panel,
body.wt-hud-epure #wt-intel,
body.wt-hud-epure .wti-glass,
body.wt-hud-epure #wt-ville,
body.wt-hud-epure #wt-pins,
body.wt-hud-epure #wt-pin-btn,
body.wt-hud-epure #wt-fiche,
body.wt-hud-epure #wt-photo,
body.wt-hud-epure #wt-sv { display: none !important; }
body.wt-hud-epure .wt-vol-force { display: block !important; }
`;

/** Dessine un horizon artificiel dans un canvas 2D. */
export function dessinerHorizon(ctx, { largeur, hauteur, roulis = 0, tangage = 0, cap = 0 }) {
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const rayon = Math.min(cx, cy) - 4;
  const pxParDeg = rayon / 32; // ~32° de tangage visibles de haut en bas
  ctx.save();
  ctx.clearRect(0, 0, largeur, hauteur);
  // disque
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-roulis);
  const y0 = tangage * pxParDeg; // le tangage fait monter/baisser la ligne d'horizon
  // ciel
  const gCiel = ctx.createLinearGradient(0, -rayon * 3, 0, y0);
  gCiel.addColorStop(0, '#1a4d6b');
  gCiel.addColorStop(1, '#5fa8c9');
  ctx.fillStyle = gCiel;
  ctx.fillRect(-rayon * 3, -rayon * 3, rayon * 6, rayon * 3 + y0);
  // sol
  const gSol = ctx.createLinearGradient(0, y0, 0, rayon * 3);
  gSol.addColorStop(0, '#6b5a34');
  gSol.addColorStop(1, '#3a3018');
  ctx.fillStyle = gSol;
  ctx.fillRect(-rayon * 3, y0, rayon * 6, rayon * 3);
  // ligne d'horizon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-rayon, y0);
  ctx.lineTo(rayon, y0);
  ctx.stroke();
  // échelle de tangage (tous les 10°)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  for (let d = -60; d <= 60; d += 10) {
    if (d === 0) continue;
    const y = y0 + d * pxParDeg;
    if (y < -rayon || y > rayon) continue;
    const demi = d % 20 === 0 ? rayon * 0.30 : rayon * 0.16;
    ctx.beginPath();
    ctx.moveTo(-demi, y);
    ctx.lineTo(demi, y);
    ctx.stroke();
    if (d % 20 === 0) {
      ctx.fillText(String(Math.abs(d)), -demi - 12, y + 3);
      ctx.fillText(String(Math.abs(d)), demi + 12, y + 3);
    }
  }
  ctx.restore();

  // arc de roulis + index
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, rayon - 8, Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();
  for (const a of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
    const rad = (-90 + a) * (Math.PI / 180);
    const long = a % 30 === 0 ? 9 : 5;
    const r1 = rayon - 8;
    const r2 = r1 - long;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
    ctx.stroke();
  }
  ctx.restore();

  // repère d'appareil fixe
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffe66d';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-rayon * 0.52, 0);
  ctx.lineTo(-rayon * 0.18, 0);
  ctx.moveTo(rayon * 0.18, 0);
  ctx.lineTo(rayon * 0.52, 0);
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // cap sous l'horizon
  ctx.save();
  ctx.fillStyle = 'rgba(216,255,226,0.9)';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  const capDeg = ((cap * 180) / Math.PI + 360) % 360;
  ctx.fillText(`${Math.round(capDeg).toString().padStart(3, '0')}°`, cx, hauteur - 6);
  ctx.restore();
  ctx.restore();
}

/** Dessine une bande verticale défilante (vitesse ou altitude). */
export function dessinerBande(ctx, { largeur, hauteur, valeur = 0, pas = 10, unite = '', libelle = '' }) {
  ctx.save();
  ctx.clearRect(0, 0, largeur, hauteur);
  ctx.fillStyle = 'rgba(6,14,10,0.72)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(0, 0, largeur, hauteur, 9) : ctx.rect(0, 0, largeur, hauteur);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,230,150,0.32)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const cy = hauteur / 2;
  const pxParUnite = 26 / pas; // 26 px pour un cran
  const premier = Math.ceil((valeur - hauteur / 2 / pxParUnite) / pas) * pas;
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  for (let v = premier; v < valeur + hauteur / 2 / pxParUnite; v += pas) {
    const y = cy + (valeur - v) * pxParUnite;
    if (y < 12 || y > hauteur - 12) continue;
    const majeur = Math.round(v / pas) % 5 === 0;
    ctx.strokeStyle = majeur ? 'rgba(200,255,215,0.85)' : 'rgba(200,255,215,0.35)';
    ctx.lineWidth = majeur ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(largeur - (majeur ? 20 : 12), y);
    ctx.lineTo(largeur - 6, y);
    ctx.stroke();
    if (majeur) {
      ctx.fillStyle = 'rgba(214,255,226,0.92)';
      ctx.fillText(String(Math.round(v)), largeur - 24, y + 3);
    }
  }
  // boîtier de la valeur courante
  ctx.fillStyle = 'rgba(10,26,16,0.95)';
  ctx.strokeStyle = '#78e696';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.rect(4, cy - 13, largeur - 8, 26);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d6ffe2';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(valeur)}`, largeur / 2 - 4, cy + 4);
  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(159,232,176,0.8)';
  ctx.fillText(unite, largeur / 2 + 22, cy + 3);
  if (libelle) {
    ctx.fillStyle = 'rgba(159,232,176,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(libelle, largeur / 2, 12);
  }
  ctx.restore();
}

/**
 * @param {object} viewer
 * @param {{surOuvrirPanneau?:Function, panneaux?:Array}} [options]
 */
export function creerCockpit(viewer, options = {}) {
  const { surOuvrirPanneau = null, panneaux = [], surMessageHud = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-cockpit';
  el.innerHTML = `
    <div class="tiroir">
      <div class="t">SYSTÈMES DU BORD</div>
      <div class="bouts"></div>
    </div>
    <div class="instruments">
      <canvas class="c-vit" width="86" height="270"></canvas>
      <canvas class="c-hor" width="270" height="270"></canvas>
      <canvas class="c-alt" width="86" height="270"></canvas>
    </div>
    <div class="bandeau">
      <div class="boite"><div class="k">VARIO m/s</div><div class="v" data-c="vario">0.0</div></div>
      <div class="boite"><div class="k">FACTEUR G</div><div class="v" data-c="g">1.00</div></div>
      <div class="boite"><div class="k">DISTANCE km</div><div class="v" data-c="dist">0.0</div></div>
      <div class="boite"><div class="k">CHRONO</div><div class="v" data-c="chrono">00:00</div></div>
      <div class="boite"><div class="k">MASSE kg</div><div class="v" data-c="masse">—</div></div>
      <div class="boite"><div class="k">SOL m</div><div class="v" data-c="sol">—</div></div>
      <div class="boite" style="min-width:120px"><div class="k">ENGIN</div><div class="v" data-c="engin" style="font-size:10px">—</div></div>
      <div class="boite" style="min-width:150px"><div class="k">ÉTAT</div><div class="v" data-c="etat" style="font-size:10px;color:#ffe66d">—</div></div>
    </div>
    <div class="gaz"><i style="height:0%"></i><div class="etiq">GAZ</div></div>`;
  document.body.appendChild(el);

  const cHor = el.querySelector('.c-hor');
  const cVit = el.querySelector('.c-vit');
  const cAlt = el.querySelector('.c-alt');
  const gHor = cHor.getContext('2d');
  const gVit = cVit.getContext('2d');
  const gAlt = cAlt.getContext('2d');
  const gaz = el.querySelector('.gaz > i');
  const vals = {};
  for (const n of el.querySelectorAll('[data-c]')) vals[n.dataset.c] = n;

  // ——— tiroir SYSTÈMES : rouvre chaque fenêtre sans quitter le vol ———
  const bouts = el.querySelector('.tiroir .bouts');
  for (const p of panneaux) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.libelle;
    b.addEventListener('click', () => {
      b.classList.toggle('actif');
      surOuvrirPanneau?.(p, b.classList.contains('actif'));
    });
    bouts.appendChild(b);
  }
  const bClassique = document.createElement('button');
  bClassique.type = 'button';
  bClassique.textContent = '🧰 INSTRUMENTS CLASSIQUES';
  bClassique.addEventListener('click', () => {
    const hud = document.getElementById('wt-vol-hud');
    const on = !hud?.classList.contains('classique');
    hud?.classList.toggle('classique', on);
    bClassique.classList.toggle('actif', on);
  });
  bouts.appendChild(bClassique);

  let actif = false;

  /**
   * HUD épuré (touche H) : en dehors du vol aussi, l'écran peut être dégagé
   * comme dans un jeu — on ne garde que la boussole et la minicarte.
   */
  function basculerHud(etat) {
    const on = etat === undefined ? !document.body.classList.contains('wt-hud-epure') : Boolean(etat);
    document.body.classList.toggle('wt-hud-epure', on);
    return on;
  }

  // touche H (hors champ de saisie) — raccourci « cacher l'interface »
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'h' && e.key !== 'H') return;
    const cible = e.target;
    if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
    if (cible?.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const on = basculerHud();
    surMessageHud?.(on ? '🧹 HUD épuré (H pour restaurer)' : '🖥 HUD complet');
  });

  /** Met à jour toute l'instrumentation. */
  function maj(etat = {}) {
    if (!actif) return;
    const roulis = Number(etat.roulis) || 0;
    const tangage = (Number(etat.tangage) || 0);
    const cap = Number(etat.cap) || 0;
    dessinerHorizon(gHor, {
      largeur: cHor.width, hauteur: cHor.height,
      roulis, tangage: (tangage * 180) / Math.PI, cap,
    });
    const vitesseKmh = (Number(etat.vitesse) || 0) * 3.6;
    dessinerBande(gVit, {
      largeur: cVit.width, hauteur: cVit.height, valeur: vitesseKmh,
      pas: 10, unite: 'km/h', libelle: 'VITESSE',
    });
    dessinerBande(gAlt, {
      largeur: cAlt.width, hauteur: cAlt.height, valeur: Number(etat.alt) || 0,
      pas: 20, unite: 'm', libelle: 'ALTITUDE',
    });
    gaz.style.height = `${Math.max(0, Math.min(100, (Number(etat.gaz) || 0) * 100))}%`;
    if (vals.vario) vals.vario.textContent = (Number(etat.vario) || 0).toFixed(1);
    if (vals.g) vals.g.textContent = (Number(etat.g) || 1).toFixed(2);
    if (vals.dist) vals.dist.textContent = ((Number(etat.distance) || 0) / 1000).toFixed(2);
    if (vals.masse) vals.masse.textContent = Number.isFinite(etat.masse) ? String(Math.round(etat.masse)) : '—';
    if (vals.sol) vals.sol.textContent = Number.isFinite(etat.sol) ? String(Math.round(etat.sol)) : '—';
    if (vals.engin) vals.engin.textContent = etat.engin || '—';
    if (vals.etat) {
      vals.etat.textContent = etat.bloque || (etat.decroche ? '⚠ DÉCROCHAGE' : etat.plafond ? 'PLAFOND' : 'NOMINAL');
      vals.etat.style.color = (etat.bloque || etat.decroche) ? '#ffd166' : '#d6ffe2';
    }
    if (vals.chrono) {
      const s = Math.max(0, Math.floor((Number(etat.duree) || 0) / 1000));
      vals.chrono.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
  }

  function activer() {
    actif = true;
    el.classList.add('actif');
    document.body.classList.add('wt-mode-vol');
    governorRequestRender('wt-cockpit');
  }

  function desactiver() {
    actif = false;
    el.classList.remove('actif');
    document.body.classList.remove('wt-mode-vol');
    document.getElementById('wt-vol-hud')?.classList.remove('classique');
    // plus aucune fenêtre « forcée » : tout revient à l'état normal
    for (const n of document.querySelectorAll('.wt-vol-force')) n.classList.remove('wt-vol-force');
    for (const b of bouts.querySelectorAll('button')) b.classList.remove('actif');
    governorRequestRender('wt-cockpit');
  }

  return {
    element: el,
    activer,
    desactiver,
    maj,
    basculerHud,
    hudEpure: () => document.body.classList.contains('wt-hud-epure'),
    visible: () => actif,
    /** Rend visible une fenêtre masquée par le mode vol (tiroir SYSTÈMES). */
    forcer: (noeud) => {
      if (!noeud) return;
      for (const n of document.querySelectorAll('.wt-vol-force')) n.classList.remove('wt-vol-force');
      noeud.classList.add('wt-vol-force');
    },
  };
}
