/**
 * WATCHTOWER — MODE HISTORIQUE.
 *
 * Objectif : voir la ville SE CONSTRUIRE. Un curseur d'année, et seuls les
 * bâtiments déjà debout à cette date restent à l'écran ; les autres
 * apparaissent au fil de la lecture.
 *
 * Sources : OpenStreetMap (`start_date`, `building:start_date`, `end_date`…)
 * — ouvertes, gratuites, sans clé, licence ODbL. Aucun service payant, aucun
 * modèle propriétaire : le mode reste utilisable hors ligne une fois les
 * emprises en cache.
 *
 * Traçabilité (règle du module) :
 *   · les vraies dates OSM et les dates « estimées » (hypothèse statistique,
 *     désactivée par défaut) ne sont JAMAIS mélangées — les secondes sont
 *     marquées `estimee` et leur couleur reste celle de leur période, mais
 *     elles ne s'affichent que si l'utilisateur assume l'hypothèse ;
 *   · les bâtiments non datés sont masqués par défaut, et le panneau
 *     affiche en permanence « X datés par OSM / Y estimés / Z non datés ».
 *
 * Technique : une primitive Cesium par décennie (2 draw-calls par décennie).
 * Changer d'année = afficher/masquer des primitives, jamais reconstruire.
 */

import * as Cesium from 'cesium';
import { construirePrimitives } from './batiRapide.js';
import {
  PERIODES,
  analyser,
  courbeCroissance,
  estimerNonDates,
  groupesParDecennie,
  nomQualite,
  resumer,
} from './data/historique.js';

const CSS = `
#wt-historique { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-historique .h-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit; font-size: 9.5px;
  font-weight: 700; letter-spacing: 1px; background: rgba(255,176,64,0.12);
  border: 1px solid rgba(255,176,64,0.45); color: #ffb040;
}
#wt-historique .h-btn:hover { background: rgba(255,176,64,0.24); }
#wt-historique .h-btn.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); color: rgba(232,234,237,0.75); }
#wt-historique .h-an { font-family: var(--font-mono, monospace); font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #ffb040; text-align: center; line-height: 1; }
#wt-historique input[type=range] { width: 100%; accent-color: #ffb040; }
#wt-historique .h-ligne { display: flex; align-items: center; gap: 6px; font-size: 9px; color: rgba(232,234,237,0.62); }
#wt-historique .h-ligne label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
#wt-historique .h-info { font-size: 9px; line-height: 1.55; color: rgba(232,234,237,0.6); }
#wt-historique .h-info b { color: #ffb040; }
#wt-historique .h-legende { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 8.5px; color: rgba(232,234,237,0.55); }
#wt-historique .h-legende span { display: inline-flex; align-items: center; gap: 4px; }
#wt-historique .h-puce { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
#wt-historique .h-courbe { width: 100%; height: 40px; display: block; background: rgba(0,0,0,0.25); border-radius: 6px; }
#wt-historique .h-liste { max-height: 108px; overflow-y: auto; font-size: 8.5px; line-height: 1.5; }
#wt-historique .h-liste div { cursor: pointer; padding: 1px 0; color: rgba(232,234,237,0.7); }
#wt-historique .h-liste div:hover { color: #ffb040; }
#wt-historique a { color: #00d4ff; }
canvas.wt-sepia { filter: sepia(0.5) saturate(0.85) contrast(1.06); }
`;

/** Pas de lecture (années franchies par tick) et cadence (ms). */
export const PAS_LECTURE = 5;
export const CADENCE = 420;

/**
 * @param {object} viewer
 * @param {{surMessage?:Function, bati?:object, surEtat?:Function}} [options]
 *   `bati` = instance `batiRapide` (fournit les lots déjà chargés, avec leurs
 *   tags OSM — donc les dates — sans nouvelle requête réseau).
 */
export function initHistorique(viewer, options = {}) {
  const { surMessage = null, bati = null, surEtat = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-historique';
  el.innerHTML = `
    <button class="h-btn" data-a="charger">🕰 CHARGER LES DATES DE MA VILLE</button>
    <div class="h-an" data-a="annee">—</div>
    <input type="range" data-a="curseur" min="1800" max="2026" step="1" value="2026" disabled>
    <div class="h-ligne">
      <button class="h-btn gris" data-a="lecture" style="flex:0 0 auto;padding:6px 10px">▶ LIRE</button>
      <label><input type="checkbox" data-a="nondates"> non datés</label>
      <label><input type="checkbox" data-a="estimes"> estimer (hypothèse)</label>
    </div>
    <canvas class="h-courbe" data-a="courbe" width="300" height="40"></canvas>
    <div class="h-info" data-a="info">Les dates viennent d'OpenStreetMap : seuls les bâtiments
      qui portent une date (<code>start_date</code>) sont datés aujourd'hui.</div>
    <div class="h-liste" data-a="liste"></div>
    <div class="h-legende" data-a="legende"></div>
    <div class="h-info" style="opacity:.72">Source : <a href="https://wiki.openstreetmap.org/wiki/Key:start_date"
      target="_blank" rel="noopener">OpenStreetMap · start_date</a> — données ouvertes ODbL, sans clé.
      Le mode historique n'invente rien : « estimer » calcule une répartition
      d'après les bâtiments déjà datés et l'annonce comme hypothèse.</div>`;

  const btnCharger = el.querySelector('[data-a="charger"]');
  const elAnnee = el.querySelector('[data-a="annee"]');
  const curseur = el.querySelector('[data-a="curseur"]');
  const btnLecture = el.querySelector('[data-a="lecture"]');
  const cbNonDates = el.querySelector('[data-a="nondates"]');
  const cbEstimes = el.querySelector('[data-a="estimes"]');
  const elInfo = el.querySelector('[data-a="info"]');
  const elListe = el.querySelector('[data-a="liste"]');
  const elLegende = el.querySelector('[data-a="legende"]');
  const canvas = el.querySelector('[data-a="courbe"]');

  let analyse = null;
  let lotsBruts = [];       // lots tels que livrés par le bâti (jamais ré-estimés)
  let groupes = [];          // [{ groupe, prim, ajoute }]
  let actif = false;
  let lecture = null;
  let annee = new Date().getFullYear();
  let hypothese = false;
  let courbe = [];

  const dire = (m) => { try { surMessage?.(m); } catch { /* ok */ } };
  const ajouter = (p) => { if (p) { viewer.scene.primitives.add(p); p.show = false; } };

  function detruire() {
    for (const g of groupes) {
      for (const p of [g.prim?.corps, g.prim?.toits]) {
        try { if (p) { viewer.scene.primitives.remove(p); p.destroy?.(); } } catch { /* déjà */ }
      }
    }
    groupes = [];
  }

  /** Reconstruit les primitives (après chargement ou changement d'hypothèse). */
  async function batir() {
    detruire();
    if (!analyse) return;
    const gs = groupesParDecennie(analyse, { pas: 10 });
    for (const g of gs) {
      const lots = g.lots.map((l) => ({ ...l, couleur: g.couleur, toit: g.toit }));
      const prim = await construirePrimitives(lots, { opacite: g.estime ? 0.55 : 0.95, tailleLot: 400 });
      ajouter(prim.corps);
      ajouter(prim.toits);
      groupes.push({ groupe: g, prim });
    }
    viewer.scene.requestRender?.();
  }

  function legende() {
    const p = analyse?.parPeriode || {};
    elLegende.innerHTML = PERIODES
      .filter((x) => (p[x.id] || 0) > 0)
      .map((x) => `<span><i class="h-puce" style="background:${x.couleur}"></i>${x.nom} · ${p[x.id] || 0}</span>`)
      .join('');
  }

  function dessinerCourbe() {
    const ctx = canvas.getContext?.('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!courbe.length) return;
    const max = Math.max(1, ...courbe.map((p) => p.presents));
    const t = (a) => ((a - courbe[0].annee) / Math.max(1, courbe[courbe.length - 1].annee - courbe[0].annee)) * (w - 6) + 3;
    ctx.strokeStyle = 'rgba(255,176,64,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    courbe.forEach((p, i) => {
      const y = h - 4 - (p.presents / max) * (h - 12);
      if (i === 0) ctx.moveTo(t(p.annee), y); else ctx.lineTo(t(p.annee), y);
    });
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(t(annee), 2);
    ctx.lineTo(t(annee), h - 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,234,237,0.5)';
    ctx.font = '8px monospace';
    ctx.fillText(String(courbe[0].annee), 3, h - 3);
    ctx.fillText(String(courbe[courbe.length - 1].annee), w - 24, h - 3);
  }

  function rendreListe() {
    const decennie = Math.floor(annee / 10) * 10;
    const frais = (analyse?.lots || []).filter((l) => Number.isFinite(l.debut)
      && l.debut >= decennie && l.debut < decennie + 10 && l.fin == null);
    const nomDe = (l) => l.nom || `bâtiment ${l.id}`;
    elListe.innerHTML = frais.length
      ? `<div style="opacity:.6;cursor:default">Apparus dans les années ${decennie} :</div>`
        + frais.slice(0, 30).map((l, i) => `<div data-i="${i}">+ ${nomDe(l)}`
          + (l.estimee
            ? ' <i>(hypothèse)</i>'
            : ` <i style="opacity:.5">${nomQualite(l.qualite)}</i>`)
          + '</div>').join('')
      : '';
    const noeuds = [...elListe.querySelectorAll('div[data-i]')];
    noeuds.forEach((n) => {
      n.onclick = () => {
        const l = frais[Number(n.dataset.i)];
        if (!l) return;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(l.lon, l.lat, 260),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-38), roll: 0 },
        });
      };
    });
  }

  /** Applique une année : affiche/masque les primitives de décennies. */
  function appliquer(a) {
    annee = Math.round(Number(a) || annee);
    if (!analyse) return;
    for (const g of groupes) {
      const dec = g.groupe.decennie;
      const montre = dec == null
        ? cbNonDates.checked
        : ((!g.groupe.estime || cbEstimes.checked) && annee >= dec);
      if (g.prim?.corps) g.prim.corps.show = montre;
      if (g.prim?.toits) g.prim.toits.show = montre;
    }
    elAnnee.textContent = String(annee);
    curseur.value = String(annee);
    const visibles = groupes.filter((g) => g.prim?.corps?.show).reduce((n, g) => n + g.groupe.lots.length, 0);
    elInfo.innerHTML = resumer(analyse, annee, new Array(visibles), {
      inclureNonDates: cbNonDates.checked,
    });
    rendreListe();
    dessinerCourbe();
    viewer.scene.requestRender?.();
    surEtat?.({ actif, annee, visibles });
  }

  function arreter() {
    if (lecture) { clearInterval(lecture); lecture = null; }
    btnLecture.textContent = '▶ LIRE';
    btnLecture.classList.add('gris');
  }

  function jouer() {
    if (!analyse) return;
    if (lecture) { arreter(); return; }
    appliquer(analyse.min);
    btnLecture.textContent = '⏸ PAUSE';
    btnLecture.classList.remove('gris');
    lecture = setInterval(() => {
      const suivant = annee + PAS_LECTURE;
      if (suivant >= analyse.max) { appliquer(analyse.max); arreter(); return; }
      appliquer(suivant);
    }, CADENCE);
  }

  /** Bascule le rendu « vieille photo » + masque le bâti actuel. */
  function habiller(ok) {
    try { viewer.canvas?.classList.toggle('wt-sepia', ok); } catch { /* ok */ }
    if (ok) { try { bati?.effacer?.(); } catch { /* ok */ } }
    else { try { bati?.charger?.({ rayon: 900 }); } catch { /* ok */ } }
  }

  async function charger(rayon = 900) {
    if (!actif) { actif = true; btnCharger.textContent = '⏹ QUITTER LE MODE HISTORIQUE'; btnCharger.classList.add('gris'); }
    dire('🕰 Lecture des dates de construction (OpenStreetMap)…');
    let lots = [];
    try { lots = bati?.lots?.() || []; } catch { lots = []; }
    if (!lots.length && bati?.charger) {
      const r = await bati.charger({ rayon });
      lots = r?.lots || bati.lots?.() || [];
    }
    if (!lots.length) {
      elInfo.textContent = '⚠ Aucun bâtiment 3D chargé ici : active le bâti 3D (🏙) ou rapproche-toi d’une ville, puis réessaie.';
      dire('⚠ Aucun bâtiment à dater — charge le bâti 3D d’abord.');
      return { n: 0, dates: 0 };
    }
    lotsBruts = lots;
    analyse = analyser(lots, { maintenant: new Date().getFullYear() });
    if (hypothese) analyse = estimerNonDates(analyse, { graine: 7 });
    groupes = [];
    await batir();
    courbe = courbeCroissance(analyse, { pas: Math.max(5, Math.round((analyse.max - analyse.min) / 40 / 5) * 5) });
    curseur.min = String(analyse.min);
    curseur.max = String(analyse.max);
    curseur.disabled = false;
    legende();
    habiller(true);
    appliquer(analyse.max);
    dire(`🕰 ${analyse.total} bâtiments — ${analyse.dates.length} datés par OSM, `
      + `${analyse.nonDates.length} sans date. Le curseur d’année fait apparaître la ville.`);
    return { n: analyse.total, dates: analyse.dates.length, nonDates: analyse.nonDates.length };
  }

  function quitter() {
    arreter();
    actif = false;
    btnCharger.textContent = '🕰 CHARGER LES DATES DE MA VILLE';
    btnCharger.classList.remove('gris');
    curseur.disabled = true;
    detruire();
    habiller(false);
    analyse = null;
    lotsBruts = [];
    courbe = [];
    elListe.innerHTML = '';
    elLegende.innerHTML = '';
    elAnnee.textContent = '—';
    elInfo.textContent = 'Mode historique quitté — le bâti actuel est revenu.';
    surEtat?.({ actif, annee, visibles: 0 });
  }

  btnCharger.onclick = () => { if (actif) quitter(); else charger(); };
  btnLecture.onclick = jouer;
  curseur.oninput = () => { arreter(); appliquer(Number(curseur.value)); };
  cbNonDates.onchange = () => appliquer(annee);
  cbEstimes.onchange = async () => {
    hypothese = cbEstimes.checked;
    if (!analyse) return;
    const a = annee;
    analyse = hypothese
      ? estimerNonDates(analyser(lotsBruts, { maintenant: new Date().getFullYear() }), { graine: 7 })
      : analyser(lotsBruts, { maintenant: new Date().getFullYear() });
    await batir();
    legende();
    appliquer(a);
  };

  return {
    element: el,
    charger,
    quitter,
    jouer,
    arreter,
    appliquer,
    /** Progression : avance/recul d'une décennie (utile aux raccourcis). */
    pas: (n) => appliquer(annee + (Number(n) || 0) * 10),
    visible: () => actif,
    annee: () => annee,
    statistiques: () => (analyse
      ? {
        total: analyse.total,
        dates: analyse.dates.length,
        nonDates: analyse.nonDates.length,
        estimes: analyse.lots.filter((l) => l.estimee).length,
        groupes: groupes.length,
        parPeriode: { ...analyse.parPeriode },
      }
      : { total: 0, dates: 0, nonDates: 0, estimes: 0, groupes: 0 }),
  };
}
