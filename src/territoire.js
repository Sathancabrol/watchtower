/**
 * WATCHTOWER — TERRITOIRE : LA CARTE STRATÉGIQUE (STRATEGIC VIEW), partie DOM.
 *
 * Le panneau regarde le MÊME territoire à sept échelles :
 *
 *   FRANCE → OCCITANIE → HÉRAULT → SÈTE AGGLOPÔLE (14 communes)
 *     → COMMUNE (Frontignan) → QUARTIER → PARCELLE / OBJET (cadastre, bâti 3D)
 *
 * Aux échelles larges, la carte dessine un maillage hexagonal : c'est une
 * REPRÉSENTATION, et le panneau le dit. À partir de l'agglomération, ce sont
 * les VRAIES positions des communes ; dans la commune, les quartiers et les
 * repères. Le bouton CADASTRE + BÂTI + ENTITÉS branche les couches réelles de
 * WATCHTOWER (parcelles IGN, volumes OSM, entités de la carte).
 *
 * Les onze lentilles recolorent le territoire et changent l'inspecteur :
 * population, densité, urbanisme, économie, associations, culture, RÉSEAUX
 * (familles + check-list DT-DICT), risques (renvoi Géorisques), environnement,
 * chantiers et IMPRÉVUS (base TP filtrée par le contexte de terrain).
 *
 * Toute la logique pure vit dans `territoireScenes.js` et se teste sans
 * navigateur ; ce fichier ne fait que du SVG, du DOM et de la caméra.
 */

import * as Cesium from 'cesium';
import {
  AGGLO, LENTILLES, REPERES, commune, densite, quartier,
} from './data/thauTerritoire.js';
import { BASE_LOCALE, detteVerification, inventaireBase, source } from './data/frontignan.js';
import {
  CASCADES, CONTEXTES, GRAVITES, PHASES, SIGNAUX_FAIBLES,
  filtrerImprevus, statistiquesImprevus, top,
} from './data/imprevusTp.js';
import {
  CHECKLIST_RESEAUX, FAMILLES_EVENEMENT, RESEAUX_TECHNIQUES, TYPES_ENTITE,
  nomNiveau, niveauAtteint, valider,
} from './data/attributsTerritoire.js';
import {
  FOND, FORME, completudeBase, compteImports, contexteDeCommune, csvTable, ficheTerritoire,
  filDuNiveau, friseTemporelle, hexPath, importerDans, nomContexte, sceneDe,
} from './territoireScenes.js';
import {
  TYPES_IMPORT, importerCsv, importerImprevus, resumeImport,
} from './data/importCsv.js';

const ech = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const nombre = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('fr-FR') : '—');

const CSS = `
#wt-territoire { display: flex; flex-direction: column; font-size: 10px; max-height: 68vh; min-width: 520px; }
#wt-territoire .t-haut { display: flex; align-items: center; gap: 6px; padding: 8px 10px 4px; flex-wrap: wrap; }
#wt-territoire .t-crumb { flex: 1; font-size: 8.5px; letter-spacing: 1.5px; color: #e3b24a; min-width: 180px; }
#wt-territoire .t-btn { cursor: pointer; font-family: inherit; padding: 5px 8px; border-radius: 7px; font-size: 8px; font-weight: 700;
  letter-spacing: 1px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; }
#wt-territoire .t-btn:hover { background: rgba(0,212,255,0.22); color: #fff; }
#wt-territoire .t-btn.actif { background: rgba(227,178,74,0.22); border-color: #e3b24a; color: #ffd98a; }
#wt-territoire .t-lentilles { display: flex; gap: 3px; padding: 0 10px 6px; flex-wrap: wrap; }
#wt-territoire .t-corps { display: grid; grid-template-columns: minmax(300px, 1fr) 236px; gap: 8px; padding: 0 10px 8px; overflow: hidden; }
#wt-territoire .t-carte { background: ${FOND}; border: 1px solid #22303c; border-radius: 9px; overflow: hidden; position: relative; }
#wt-territoire .t-carte svg { display: block; width: 100%; height: auto; }
#wt-territoire .t-inspecteur { background: rgba(255,255,255,0.025); border: 1px solid #22303c; border-radius: 9px; padding: 8px 9px; overflow-y: auto; max-height: 46vh; }
#wt-territoire .t-titre { font-size: 8px; letter-spacing: 2px; color: #00d4ff; margin: 0 0 6px; }
#wt-territoire .t-sous { font-size: 7.5px; letter-spacing: 1.5px; color: rgba(232,234,237,0.45); margin: 8px 0 3px; }
#wt-territoire .t-grille { display: grid; grid-template-columns: 78px 1fr; gap: 2px 6px; font-size: 9px; line-height: 1.55; }
#wt-territoire .t-grille .k { color: rgba(232,234,237,0.45); letter-spacing: .5px; }
#wt-territoire .t-grille .v { color: rgba(232,234,237,0.93); }
#wt-territoire .t-liste { display: flex; flex-direction: column; gap: 3px; font-size: 9px; line-height: 1.5; }
#wt-territoire .t-liste a { color: #7dd3c8; text-decoration: none; }
#wt-territoire .t-liste a:hover { text-decoration: underline; }
#wt-territoire .t-li { border-bottom: 1px dashed rgba(255,255,255,0.07); padding: 2px 0; }
#wt-territoire .t-note { margin-top: 7px; font-size: 8px; line-height: 1.6; color: rgba(232,234,237,0.45); }
#wt-territoire .t-liens { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
#wt-territoire .t-liens a { font-size: 8px; text-decoration: none; color: #00d4ff; background: rgba(0,212,255,0.07);
  border: 1px solid rgba(0,212,255,0.3); border-radius: 999px; padding: 2px 6px; }
#wt-territoire .t-bas { border-top: 1px solid rgba(0,212,255,0.22); padding: 6px 10px 9px; }
#wt-territoire .t-frise { width: 100%; height: 74px; display: block; }
#wt-territoire .t-frise-titre { display: flex; justify-content: space-between; font-size: 7.5px; letter-spacing: 1.5px; color: rgba(232,234,237,0.5); }
#wt-territoire .t-etat { font-size: 8px; color: rgba(232,234,237,0.6); margin-top: 3px; line-height: 1.5; }
#wt-territoire .hex { cursor: pointer; }
#wt-territoire .hex:hover { stroke: #fff; stroke-width: 1.6; }
#wt-territoire .etiq { font-size: 7.5px; fill: #e8eaed; paint-order: stroke; stroke: #060a0f; stroke-width: 2.6px; stroke-linejoin: round; pointer-events: none; }
#wt-territoire .sous-etiq { font-size: 6.8px; fill: rgba(232,234,237,0.72); paint-order: stroke; stroke: #060a0f; stroke-width: 2.2px; pointer-events: none; }
#wt-territoire .titre-carte { font-size: 10px; font-weight: 800; fill: #7dd3c8; letter-spacing: 2px; }
#wt-territoire .repere { font-size: 7.5px; fill: #9ad1ff; font-style: italic; paint-order: stroke; stroke: #060a0f; stroke-width: 2px; pointer-events: none; }
#wt-territoire .texte-carte { fill: rgba(232,234,237,0.75); }
#wt-territoire .texte-carte.grand { fill: #fff; font-weight: 700; }
#wt-territoire .legende { position: absolute; left: 8px; bottom: 6px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 7.5px; color: rgba(232,234,237,0.6); }
#wt-territoire .legende i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 3px; }
#wt-territoire .t-actions { display: flex; gap: 4px; flex-wrap: wrap; padding: 0 10px 8px; }
#wt-territoire.t-depot { outline: 2px dashed #00d4ff; outline-offset: -4px; }
`;

const h = () => (typeof window === 'undefined' ? {} : (window.__godsEyeView || {}));

/** Crée un élément SVG avec ses attributs (les valeurs vides sont ignorées). */
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === '') continue;
    e.setAttribute(k, String(v));
  }
  return e;
}

/** Télécharge un contenu texte (CSV, JSON) sans dépendance externe. */
function telecharger(nom, contenu, type = 'text/csv;charset=utf-8') {
  try {
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

/**
 * Branche la carte stratégique.
 * @param {object} viewer Viewer Cesium (peut être absent : le panneau reste utile).
 * @param {object} [deps]
 * @param {Function} [deps.fiche] Ouvre la fiche lieu (lon, lat).
 * @param {Function} [deps.surMessage] Bandeau de message partagé de l'app.
 */
export function initTerritoire(viewer, deps = {}) {
  const { fiche = null, surMessage = null } = deps || {};
  if (typeof document === 'undefined') return null;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-territoire';

  // La base d'amorçage est figée ; ce que l'utilisateur importe vit dans une
  // COUCHE séparée, qu'on peut retirer d'un geste et qui dit d'où elle vient.
  const etat = { niveau: 'epci', lentille: 'territoire', selection: '34108', imports: {}, rapports: [] };
  const msg = (m) => { try { surMessage?.(m); } catch { /* bandeau absent */ } };

  el.innerHTML = `
    <div class="t-haut">
      <span class="t-crumb" id="t-crumb"></span>
      <button class="t-btn" data-nav="pays">🇫🇷 FRANCE</button>
      <button class="t-btn" data-nav="region">🌍 OCCITANIE</button>
      <button class="t-btn" data-nav="departement">🗺 HÉRAULT</button>
      <button class="t-btn" data-nav="epci">🏛 AGGLOPÔLE</button>
      <button class="t-btn" data-nav="commune">🏘 FRONTIGNAN</button>
      <button class="t-btn" data-nav="quartier">🧱 QUARTIER</button>
    </div>
    <div class="t-lentilles" id="t-lentilles"></div>
    <div class="t-actions" id="t-actions"></div>
    <div class="t-corps">
      <div class="t-carte">
        <svg id="t-svg" viewBox="0 0 740 470" role="img" aria-label="Carte stratégique du territoire"></svg>
        <div class="legende" id="t-legende"></div>
      </div>
      <div class="t-inspecteur" id="t-inspecteur"></div>
    </div>
    <div class="t-bas">
      <div class="t-frise-titre"><span id="t-frise-gauche">TEMPS</span><span id="t-frise-droite"></span></div>
      <svg class="t-frise" id="t-frise" viewBox="0 0 740 74" aria-label="Frise chronologique de la population"></svg>
      <div class="t-etat" id="t-etat"></div>
    </div>`;

  const svg = el.querySelector('#t-svg');
  const legende = el.querySelector('#t-legende');
  const inspecteur = el.querySelector('#t-inspecteur');
  const crumb = el.querySelector('#t-crumb');
  const zoneLentilles = el.querySelector('#t-lentilles');
  const zoneActions = el.querySelector('#t-actions');
  const etatLigne = el.querySelector('#t-etat');
  const frise = el.querySelector('#t-frise');

  for (const l of LENTILLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 't-btn';
    b.dataset.lentille = l.id;
    b.textContent = `${l.icone} ${l.nom}`;
    b.title = l.aide;
    b.addEventListener('click', () => { etat.lentille = l.id; rendre(); });
    zoneLentilles.appendChild(b);
  }

  const ACTIONS = [
    { id: 'voler', nom: '🎥 VOLER ICI' },
    { id: 'calques', nom: '🗺 CADASTRE + BÂTI + ENTITÉS' },
    { id: 'fiche', nom: '📄 FICHE DU LIEU' },
    { id: 'imprevus', nom: '🎲 IMPRÉVUS DU TERRAIN' },
    { id: 'csv', nom: '⬇ EXPORTER LA TABLE' },
    { id: 'importer', nom: '📥 IMPORTER UN CSV' },
    { id: 'vider', nom: '⌫ EFFACER LES IMPORTS' },
  ];
  for (const a of ACTIONS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 't-btn';
    b.textContent = a.nom;
    b.dataset.action = a.id;
    b.addEventListener('click', () => agir(a.id));
    zoneActions.appendChild(b);
  }

  // Le champ de fichier reste caché : le bouton du bandeau l'ouvre. Le même
  // chemin sert au glisser-déposer, pour ne pas avoir deux imports différents.
  const champFichier = document.createElement('input');
  champFichier.type = 'file';
  champFichier.accept = '.csv,text/csv,text/plain';
  champFichier.multiple = true;
  champFichier.style.display = 'none';
  champFichier.addEventListener('change', () => {
    lireFichiers([...champFichier.files]);
    champFichier.value = '';
  });
  el.appendChild(champFichier);

  for (const b of el.querySelectorAll('[data-nav]')) {
    b.addEventListener('click', () => {
      const cible = b.dataset.nav;
      // Revenir à une commune quand la sélection courante est un quartier.
      if ((cible === 'commune' || cible === 'epci') && !commune(etat.selection)) etat.selection = '34108';
      if (cible === 'quartier') {
        // Les quartiers de la base d'amorçage sont ceux de Frontignan : on ne
        // fait pas glisser un visiteur de Sète sur un quartier frontignanais.
        if (!quartier(etat.selection) && String(etat.selection) !== '34108') {
          msg('🧱 Quartiers documentés pour Frontignan seulement (base d’amorçage).');
          return;
        }
        if (!quartier(etat.selection)) etat.selection = 'q-coeur-ville';
      }
      etat.niveau = cible;
      rendre();
    });
  }

  /** Centre à viser pour la caméra, selon le niveau courant. */
  function centreSelection() {
    if (etat.niveau === 'quartier') {
      const q = quartier(etat.selection);
      if (q) return { lat: q.centre.lat, lon: q.centre.lon, hauteur: 2600 };
    }
    if (etat.niveau === 'commune' || etat.niveau === 'epci') {
      const c = commune(etat.selection) || commune('34108');
      return { lat: c.centre.lat, lon: c.centre.lon, hauteur: etat.niveau === 'epci' ? 42_000 : 5200 };
    }
    if (etat.niveau === 'departement') return { lat: 43.6, lon: 3.4, hauteur: 190_000 };
    if (etat.niveau === 'region') return { lat: 43.7, lon: 1.9, hauteur: 720_000 };
    return { lat: 46.6, lon: 2.4, hauteur: 2_400_000 };
  }

  /** Vol de caméra Cesium vers la sélection. */
  function voler() {
    const c = centreSelection();
    try {
      viewer?.camera?.flyTo?.({
        destination: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, c.hauteur),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-72), roll: 0 },
        duration: 1.8,
      });
      msg(`🗺 Territoire — vol vers ${etat.niveau === 'quartier' ? (quartier(etat.selection)?.nom || '') : (commune(etat.selection)?.nom || AGGLO.nom)}`);
    } catch { msg('🗺 Caméra indisponible.'); }
  }

  /** Active les couches RÉELLES de l'app (cadastre, bâti 3D, entités). */
  function activerCalques() {
    const g = h();
    let n = 0;
    try { g.cadastre?.activer?.(true); n += 1; } catch { /* absente */ }
    try { g.bati?.charger?.({ rayon: 900 }); n += 1; } catch { /* absent */ }
    try { g.entites?.basculer?.(true); n += 1; } catch { /* absent */ }
    msg(n ? `🗺 ${n} couche(s) réelle(s) demandée(s) : cadastre, bâti 3D, entités.` : '🗺 Couches non disponibles dans cette session.');
    return n;
  }

  /** Range un texte de CSV dans la bonne table, et retient le rapport. */
  function importerTexte(nom, texte) {
    const contenu = String(texte ?? '');
    const devine = importerCsv(contenu, { nom, maxLignes: 5000 }).type;
    const rapport = devine === 'imprevus'
      ? importerImprevus(contenu, { nom })
      : importerCsv(contenu, { nom });
    if (rapport.entites.length) {
      const table = rapport.type === 'imprevus' ? 'imprevus' : rapport.type;
      etat.imports = importerDans(etat.imports, table, rapport.entites);
    }
    etat.rapports = [...etat.rapports, rapport];
    msg(`📥 ${resumeImport(rapport)}`);
    return rapport;
  }

  /** Lit une liste de fichiers (bouton ou glisser-déposer), un rapport par fichier. */
  function lireFichiers(fichiers) {
    const liste = (fichiers || []).filter((f) => f && /csv|text|txt/i.test(`${f.type || ''} ${f.name || ''}`));
    if (!liste.length) { msg('📥 Aucun fichier CSV reconnu.'); return Promise.resolve([]); }
    return Promise.all(liste.map((f) => (typeof f.text === 'function'
      ? f.text()
      : new Promise((resoudre, rejeter) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resoudre(String(lecteur.result || ''));
        lecteur.onerror = () => rejeter(lecteur.error);
        lecteur.readAsText(f, 'utf-8');
      }))
      .then((texte) => importerTexte(f.name, texte))
      .catch((e) => {
        const rapport = { nom: f.name, type: null, entites: [], rejets: [{ ligne: 0, motif: `lecture impossible : ${e?.message || e}` }], entetes: { reconnues: [], horsContrat: [], vides: [] }, manquants: [] };
        etat.rapports = [...etat.rapports, rapport];
        msg(`📥 ${f.name} : lecture impossible.`);
        return rapport;
      })))
      .then((rapports) => { rendre(); return rapports; });
  }

  /** Le panneau accepte aussi un dépôt de fichiers : même chemin, même rapport. */
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('t-depot'); });
  el.addEventListener('dragleave', () => el.classList.remove('t-depot'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('t-depot');
    const fichiers = e.dataTransfer?.files;
    if (fichiers?.length) lireFichiers([...fichiers]);
  });

  function agir(id) {
    if (id === 'voler') { voler(); return null; }
    if (id === 'calques') { activerCalques(); voler(); return null; }
    if (id === 'fiche') {
      const c = centreSelection();
      try { fiche?.(c.lon, c.lat); } catch { /* fiche absente */ }
      voler();
      return null;
    }
    if (id === 'imprevus') {
      etat.lentille = 'imprevus';
      if (etat.niveau !== 'commune' && etat.niveau !== 'quartier') etat.niveau = 'commune';
      rendre();
      msg('🎲 Imprévus : base TP filtrée par le contexte de terrain.');
      return null;
    }
    if (id === 'importer') { champFichier.click(); return null; }
    if (id === 'vider') {
      const n = Object.values(etat.imports).reduce((s2, l) => s2 + l.length, 0);
      etat.imports = {};
      etat.rapports = [];
      rendre();
      msg(n ? `⌫ ${n} fiche(s) importée(s) retirée(s) — la base d’amorçage est intacte.` : '⌫ Aucun import à retirer.');
      return null;
    }
    if (id === 'csv') {
      const table = etat.lentille === 'reseaux' ? 'reseau' : etat.lentille === 'culture' ? 'evenement' : 'poi';
      const ok = telecharger(`watchtower_${table}.csv`, csvTable(table));
      msg(ok ? `⬇ ${table}.csv exporté (en-tête = schéma des attributs).` : '⬇ Export impossible.');
      return ok;
    }
    return null;
  }

  function rendre() {
    for (const b of zoneLentilles.querySelectorAll('.t-btn')) b.classList.toggle('actif', b.dataset.lentille === etat.lentille);
    for (const b of el.querySelectorAll('[data-nav]')) b.classList.toggle('actif', b.dataset.nav === etat.niveau);
    crumb.textContent = filDuNiveau(etat.niveau, etat.selection);

    const scene = sceneDe({ niveau: etat.niveau, lentille: etat.lentille, selection: etat.selection, couche: etat.imports });
    svg.innerHTML = '';
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 740, height: 470, fill: FOND }));
    for (const f of scene.formes) {
      if (f.forme === 'hex') {
        const p = svgEl('path', {
          d: hexPath(f.cx, f.cy, f.r), fill: f.fill, stroke: f.stroke || FORME.trait,
          'stroke-width': 0.8, class: 'hex', 'data-id': f.id || '',
        });
        if (f.id) {
          p.addEventListener('click', () => {
            if (etat.niveau === 'epci') { etat.selection = f.id; etat.niveau = 'commune'; }
            else if (etat.niveau === 'commune') { etat.selection = f.id; etat.niveau = 'quartier'; }
            else if (etat.niveau === 'pays' || etat.niveau === 'region') etat.niveau = 'departement';
            else if (etat.niveau === 'departement') { etat.niveau = 'epci'; etat.selection = '34108'; }
            rendre();
          });
        }
        svg.appendChild(p);
        if (f.etiquette) {
          const t = svgEl('text', { x: f.cx, y: f.sousEtiquette ? f.cy - 1 : f.cy + 3, class: 'etiq', 'text-anchor': 'middle' });
          t.textContent = f.etiquette;
          svg.appendChild(t);
        }
        if (f.sousEtiquette) {
          const t2 = svgEl('text', { x: f.cx, y: f.cy + 10, class: 'sous-etiq', 'text-anchor': 'middle' });
          t2.textContent = f.sousEtiquette;
          svg.appendChild(t2);
        }
      } else if (f.forme === 'repere') {
        svg.appendChild(svgEl('circle', { cx: f.x, cy: f.y, r: 3.2, fill: '#7dd3c8', stroke: '#0a1118', 'stroke-width': 1 }));
        const t = svgEl('text', { x: f.x + 6, y: f.y + 3, class: 'repere' });
        t.textContent = f.text;
        svg.appendChild(t);
      } else if (f.forme === 'texte') {
        const t = svgEl('text', {
          x: f.x, y: f.y, class: f.classe || 'texte-carte',
          'text-anchor': f.ancre || f.texteAncre || 'start', 'font-size': f.taille || null,
        });
        t.textContent = f.text;
        svg.appendChild(t);
      }
    }
    legende.innerHTML = (scene.legende || [])
      .map((l) => `<span><i style="background:${l.couleur}"></i>${ech(l.texte)}</span>`).join('');

    rendreInspecteur();
    rendreFrise();
    const nbImports = Object.values(etat.imports).reduce((n, l) => n + l.length, 0);
    etatLigne.textContent = `Niveau ${etat.niveau} · lentille ${etat.lentille} · sélection ${etat.selection}`
      + (nbImports ? ` · ${nbImports} fiche(s) importée(s)` : '')
      + ' — le maillage hexagonal est une représentation aux échelles larges ; à partir de l’agglomération, ce sont les positions réelles.';
  }

  /** Le rapport du dernier import : fichier, table, ce qui est entré, ce qui bloque. */
  function blocRapports() {
    if (!etat.rapports.length) return '';
    const lignes = etat.rapports.slice(-4).reverse().map((r) => {
      if (!r.type) {
        return `<div class="t-li"><b>${ech(r.nom)}</b> — table non reconnue, rien n’a été importé.<br>`
          + `<span style="opacity:.65">${ech((r.rejets[0] || {}).motif || '')}</span></div>`;
      }
      const manquants = (r.manquants || []).slice(0, 3)
        .map((m) => `${ech(m.libelle || m.cle)} (${m.n})`).join(' · ');
      const hors = (r.entetes.horsContrat || []).slice(0, 5).map((c) => ech(c)).join(', ');
      return `<div class="t-li"><b>${ech(r.nom)}</b> → ${ech(r.type)}<br>`
        + `<span style="opacity:.75">${r.entites.length} fiche(s) · ${r.valides} au niveau 1 · séparateur « ${ech(r.delimiteur)} »`
        + (r.identifiantsFabriques ? ` · ${r.identifiantsFabriques} identifiant(s) fabriqué(s)` : '')
        + (r.rejetees ? ` · ${r.rejetees} refusée(s)` : '')
        + `</span><br>`
        + (manquants ? `<span style="opacity:.65">il manque : ${manquants}</span><br>` : '')
        + (hors ? `<span style="opacity:.65">sans colonne propre, conservées en json_details : ${hors}</span>` : '')
        + (r.rejets.length ? `<span style="opacity:.65">refus : ${ech(r.rejets[0].motif)}</span>` : '')
        + '</div>';
    }).join('');
    return `<div class="t-sous">IMPORTS — CE QUI EST ENTRÉ, CE QUI BLOQUE</div><div class="t-liste">${lignes}</div>`;
  }

  function rendreInspecteur() {
    const blocs = [];
    const rapport = blocRapports();
    if (rapport) blocs.push(rapport);
    if (etat.niveau === 'quartier') {
      const q = quartier(etat.selection);
      blocs.push(`<div class="t-titre">🧱 ${ech(q?.nom || 'Quartier')}</div>`);
      blocs.push(`<div class="t-grille">
        <span class="k">COMMUNE</span><span class="v">Frontignan</span>
        <span class="k">POSITION</span><span class="v">toponyme indicatif (± 500 m)</span>
        <span class="k">TRAITS</span><span class="v">${ech((q?.traits || []).join(' · '))}</span>
      </div>`);
      blocs.push('<div class="t-sous">DESCENDRE EN 3D</div>');
      blocs.push('<div class="t-note">Le contour officiel d’un quartier est un IRIS (INSEE) ou un quartier de la ville. La descente se fait donc par les couches réelles : cadastre (parcelles IGN), bâti 3D (OSM), entités de la carte.</div>');
    } else {
      const f = ficheTerritoire(etat.selection, etat.lentille, etat.imports);
      blocs.push(`<div class="t-titre">${ech(f.titre)}</div>`);
      blocs.push(`<div class="t-grille">${f.lignes.map(([k, v]) => `<span class="k">${ech(k)}</span><span class="v">${ech(v)}</span>`).join('')}</div>`);
      if (f.risques?.length) {
        blocs.push('<div class="t-sous">ALÉAS DÉDUITS (à confirmer)</div>');
        blocs.push(`<div class="t-liste">${f.risques.map((r) => `<div class="t-li">⚠️ ${ech(r.nom)} — <a href="${r.verif}" target="_blank" rel="noopener">vérifier sur Géorisques</a></div>`).join('')}</div>`);
      }
      if (f.imprevus?.length) {
        blocs.push(`<div class="t-sous">IMPRÉVUS — CONTEXTE ${ech(f.nomContexte || '')}</div>`);
        blocs.push(`<div class="t-liste">${f.imprevus.map((i) => `<div class="t-li"><b>${ech(i.probleme)}</b><br><span style="opacity:.65">${ech(i.gravite)} · ${ech(i.confiance)} — ${ech(i.prevention)}</span></div>`).join('')}</div>`);
      }
      if (f.cascades?.length) {
        blocs.push('<div class="t-sous">CASCADES</div>');
        blocs.push(`<div class="t-liste">${f.cascades.map((c) => `<div class="t-li">${ech(c.declencheur)} → ${ech((c.etapes || []).slice(0, 3).join(' → '))} → <b>${ech(c.final)}</b></div>`).join('')}</div>`);
      }
      blocs.push(`<div class="t-note">${ech(f.note)}</div>`);
      blocs.push('<div class="t-sous">VÉRIFIER (liens directs)</div>');
      blocs.push(`<div class="t-liens">${(f.liens || []).map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${ech(l.nom)}</a>`).join('')}</div>`);
    }

    if (etat.lentille === 'reseaux') {
      blocs.push('<div class="t-sous">RÉSEAUX TECHNIQUES (familles)</div>');
      blocs.push(`<div class="t-liste">${RESEAUX_TECHNIQUES.map((r) => `<div class="t-li">${r.icone} <b>${ech(r.nom)}</b>${r.sensibles ? ' ⚠ sensible' : ''}<br><span style="opacity:.65">${ech((r.ouvrages || []).slice(0, 4).join(' · '))}</span></div>`).join('')}</div>`);
      blocs.push('<div class="t-sous">AVANT DE CREUSER (check-list)</div>');
      blocs.push(`<div class="t-liste">${CHECKLIST_RESEAUX.map((c) => `<div class="t-li"><b>${ech(c.etape)}</b> — ${ech(c.detail)}</div>`).join('')}</div>`);
      blocs.push('<div class="t-note">Les tronçons locaux sont à importer (plans d’exploitants + DT-DICT). Tant qu’ils ne le sont pas, la table reste marquée « à importer » : on n’invente ni diamètre ni profondeur.</div>');
    }
    if (etat.lentille === 'culture') {
      blocs.push('<div class="t-sous">FAMILLES D’ÉVÉNEMENTS</div>');
      blocs.push(`<div class="t-liste">${FAMILLES_EVENEMENT.map((f) => `<div class="t-li"><b>${ech(f.nom)}</b> (${ech(f.duree)})<br><span style="opacity:.65">${ech((f.points_cles || []).join(' · '))}</span></div>`).join('')}</div>`);
    }
    if (etat.lentille === 'associations') {
      blocs.push('<div class="t-sous">GUIDE ASSOCIATIF (amorçage)</div>');
      blocs.push(`<div class="t-liste">${BASE_LOCALE.associations.map((a) => `<div class="t-li"><b>${ech(a.nom)}</b><br><span style="opacity:.65">${ech((a.domaines || []).join(' · '))} — ${ech(a.confiance || '')}</span></div>`).join('')}</div>`);
      blocs.push('<div class="t-note">Le guide municipal est un MILLÉSIME : il se réimporte. Les fiches sans coordonnées restent valides si elles portent leur lieu de pratique.</div>');
    }
    if (etat.lentille === 'imprevus') {
      const st = statistiquesImprevus();
      blocs.push(`<div class="t-sous">BASE IMPRÉVUS — ${st.total} FICHES · ${st.cascades} CASCADES · ${st.signaux} SIGNAUX</div>`);
      blocs.push(`<div class="t-liste">${top(8, 'gravite').map((i) => `<div class="t-li"><b>${ech(i.probleme)}</b><br><span style="opacity:.65">${ech(i.gravite)} · ${ech(i.frequence)} · ${ech(i.confiance)}</span></div>`).join('')}</div>`);
      blocs.push('<div class="t-sous">SIGNAUX FAIBLES À SURVEILLER</div>');
      blocs.push(`<div class="t-liste">${SIGNAUX_FAIBLES.slice(0, 6).map((s) => `<div class="t-li">${ech(s.signal)} → <b>${ech(s.probleme)}</b></div>`).join('')}</div>`);
      blocs.push('<div class="t-note">Chaque fiche porte son niveau de preuve : documenté (source institutionnelle), rapporté (profession), déduit (mécanisme connu). Aucune fréquence chiffrée n’est inventée.</div>');
    }
    if (etat.lentille === 'logement' || etat.lentille === 'economie' || etat.lentille === 'travaux') {
      const c = completudeBase(etat.imports);
      blocs.push('<div class="t-sous">CE QUI EST REMPLI / CE QUI RESTE À IMPORTER</div>');
      blocs.push(`<div class="t-liste">${c.map((t) => `<div class="t-li"><b>${ech(t.nom)}</b> — ${t.total} fiche(s)${t.importees ? ` (dont ${t.importees} importée(s))` : ''} · niveaux ${Object.entries(t.niveaux).filter(([, n]) => n).map(([k, n]) => `${k}:${n}`).join(' ')}</div>`).join('')}</div>`);
      const importees = c.reduce((n, t) => n + (t.importees || 0), 0);
      const noteImport = importees
        ? ` Dont ${importees} fiche(s) venue(s) d’un import — elles restent « à vérifier » tant que leur origine n’est pas qualifiée.`
        : '';
      blocs.push(`<div class="t-note">Dette de vérification : ${detteVerification()} fiche(s) marquée(s) « à vérifier ». Sources du registre : ${BASE_LOCALE.sources.length}.${noteImport} Aucune fiche inventée : le vide s’affiche comme vide.</div>`);
    }
    inspecteur.innerHTML = blocs.join('');
  }

  function rendreFrise() {
    const fr = friseTemporelle(etat.imports);
    const L = 740; const Ht = 74;
    const maxP = Math.max(...fr.points.map((p) => p.population)) * 1.06;
    const minP = Math.min(...fr.points.map((p) => p.population)) * 0.9;
    const x = (a) => ((a - fr.debut) / (fr.horizon - fr.debut)) * (L - 44) + 32;
    const y = (v) => Ht - 14 - ((v - minP) / Math.max(1, maxP - minP)) * (Ht - 30);
    const pts = fr.points.map((p) => `${x(p.annee).toFixed(1)},${y(p.population).toFixed(1)}`);
    const dernier = fr.points[fr.points.length - 1];
    const proj = `${x(dernier.annee).toFixed(1)},${y(dernier.population).toFixed(1)} ${x(fr.horizon).toFixed(1)},${y(fr.projection(fr.horizon)).toFixed(1)}`;
    // Les projets ne sont posés QUE là où leur date les met : aucune case
    // n'est inventée pour « faire joli », et les sans-date le restent.
    const marqueurs = (fr.marqueurs || [])
      .filter((m) => Number.isFinite(m.annee))
      .slice(0, 10)
      .map((m) => {
        const etiquette = String(m.nom || m.type_transformation || m.id || '').slice(0, 22);
        return `<line x1="${x(m.annee).toFixed(1)}" y1="${Ht - 14}" x2="${x(m.annee).toFixed(1)}" y2="${Ht - 19}" stroke="rgba(227,178,74,.75)" stroke-width="1" />`
          + `<text x="${x(m.annee).toFixed(1)}" y="${Ht - 2}" font-size="6.5" fill="rgba(227,178,74,.85)" text-anchor="middle">${ech(etiquette)}</text>`;
      }).join('');
    const sansDate = (fr.marqueurs || []).filter((m) => !Number.isFinite(m.annee)).length;
    frise.innerHTML = `
      <line x1="32" y1="${Ht - 14}" x2="${L - 12}" y2="${Ht - 14}" stroke="rgba(255,255,255,0.14)" stroke-width="1" />
      <polyline points="${pts.join(' ')}" fill="none" stroke="#7dd3c8" stroke-width="1.8" />
      <polyline points="${proj}" fill="none" stroke="#e3b24a" stroke-width="1.4" stroke-dasharray="4 3" />
      ${marqueurs}
      <circle cx="${x(dernier.annee).toFixed(1)}" cy="${y(dernier.population).toFixed(1)}" r="3" fill="#7dd3c8" />
      <text x="32" y="10" font-size="7.5" fill="rgba(232,234,237,.55)">POPULATION FRONTIGNAN — INSEE (1968 → 2023), puis prolongation de tendance</text>
      <text x="${L - 12}" y="10" font-size="7.5" fill="rgba(227,178,74,.85)" text-anchor="end">≈ ${nombre(fr.projection(2040))} hab. en 2040 (tendance, pas une prévision)</text>`;
    el.querySelector('#t-frise-gauche').textContent = `TEMPS — ${fr.debut}`;
    el.querySelector('#t-frise-droite').textContent = `${fr.fin} → ${fr.horizon}`
      + (sansDate ? ` · ${sansDate} projet(s) sans date` : '');
  }

  rendre();

  return {
    element: el,
    rendre,
    voler,
    activerCalques,
    agir,
    etat: () => ({ ...etat }),
    allerA: (niveau, selection) => {
      if (niveau) etat.niveau = niveau;
      if (selection) etat.selection = selection;
      rendre();
      return { ...etat };
    },
    inventaire: inventaireBase,
    detteVerification,
    statistiquesImprevus,
    contextes: () => CONTEXTES.map((c) => c.id),
    phases: () => PHASES.map((p) => p.id),
    gravites: () => [...GRAVITES],
    imprevus: (filtre) => filtrerImprevus(filtre),
    cascades: () => [...CASCADES],
    completude: () => completudeBase(),
    valider: (fiche, type) => valider(fiche, type),
    niveauDe: (fiche, type) => nomNiveau(niveauAtteint(fiche, type)),
    sources: () => [...BASE_LOCALE.sources],
    source,
    typesEntite: () => Object.keys(TYPES_ENTITE),
    contexteDe: (insee) => contexteDeCommune(insee),
    importerTexte,
    lireFichiers,
    importer: () => champFichier.click(),
    imports: () => ({ ...etat.imports }),
    rapports: () => [...etat.rapports],
    compteImports: (table) => compteImports(etat.imports, table),
    effacerImports: () => agir('vider'),
    typesImport: () => [...TYPES_IMPORT],
    repere: (id) => REPERES.find((r) => r.id === id) || null,
    densiteDe: (insee) => densite(commune(insee) || {}),
  };
}
