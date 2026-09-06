/**
 * WATCHTOWER — MODE MOBIGLAS (vue vol : on ne garde que l'utile).
 *
 * En vol, l'écran est un cockpit, pas un bureau : huit fenêtres éparpillées
 * empêchent de piloter. Le mode MOBIGLAS (clin d'œil au « mobiGlas » de Star
 * Citizen : un HUD minimal, posé au ras du regard) applique trois règles :
 *
 *  · **le bandeau d'instruments devient une seule ligne** compacte, collée
 *    juste AU-DESSUS DU MICRO (la capture vocale) — là où l'œil tombe déjà ;
 *  · **les fenêtres non essentielles au vol disparaissent** ou deviennent
 *    quasi transparentes (14 % d'opacité) : elles restent là, on les devine,
 *    mais elles ne volent plus l'attention ; au survol elles reviennent ;
 *  · **ce qui sert à voler ne bouge pas** : la minicarte, l'altimètre, la
 *    boussole, le poste de pilotage.
 *
 * Deux niveaux, un seul bouton :
 *   🕶 « transparent » (par défaut) → les fenêtres s'effacent à 14 % ;
 *   👁 « masquer »                 → elles disparaissent complètement.
 *
 * Aucune dépendance à Cesium : ce module ne manipule que le DOM.
 */

/** Fenêtres INDISPENSABLES en vol (jamais estompées). */
export const ESSENTIELS = Object.freeze([
  '#wt-minimap',      // situation
  '#wt-boussole',     // cap
  '#wt-cockpit',      // horizon + bandes
  '#wt-mg-hud',       // bandeau compact (ce module)
  '#wt-vol-barre',    // barre « mode pilotage / atterrir »
  '#wt-vol-stick',    // joystick souris
  '#command-dock',    // micro (capture vocale)
]);

/** Fenêtres de « bureau » : estompées en mode mobiglas. */
export const FENETRES_BUREAU = Object.freeze([
  '#wt-panel', '#wt-intel', '#wt-fiche', '#wt-pins', '#wt-pin-btn',
  '#wt-ville', '#wt-photo', '#wt-sv', '#wt-entites', '#wt-ent-choix',
  '#wt-moi', '#wt-radio', '.wti-glass', '#pp-toggles', '#param-slider-panel',
]);

/** Niveaux d'effacement. */
export const NIVEAUX = Object.freeze(['transparent', 'masquer']);

/**
 * Sélecteur CSS du micro (capture vocale) — ordre de préférence.
 * Le HUD compact se cale juste au-dessus du premier trouvé.
 */
export const CIBLES_MICRO = Object.freeze(['#gev-voice-control', '#gev-voice-button', '#command-dock']);

/**
 * Résume l'état de vol pour le bandeau compact.
 * @param {object} e
 * @returns {{vitesse:string, altitude:string, cap:string, vario:string, etat:string}}
 */
export function resumeVol(e = {}) {
  const v = Number(e.vitesse) || 0;
  const alt = Number(e.alt) || 0;
  const sol = Number(e.sol);
  const vario = Number(e.vario) || 0;
  const cap = ((Number(e.cap) || 0) * 180) / Math.PI;
  const capDeg = Math.round(((cap % 360) + 360) % 360);
  const etat = e.bloque
    || (e.decroche ? '⚠ DÉCROCHAGE' : e.plafond ? '⛅ PLAFOND' : '✔ NOMINAL');
  return {
    vitesse: `${Math.round(v * 3.6)}`,
    altitude: `${Math.round(alt)}${Number.isFinite(sol) ? ` (${Math.round(alt - sol)})` : ''}`,
    cap: String(capDeg).padStart(3, '0'),
    vario: `${vario > 0 ? '+' : ''}${vario.toFixed(1)}`,
    etat,
    nomEngin: e.engin || '',
    alerte: Boolean(e.bloque || e.decroche || e.plafond),
  };
}

const CSS = `
#wt-mg-hud {
  position: fixed; z-index: 1570; display: none;
  font-family: var(--font-mono, monospace); color: #b8ffc9;
  background: linear-gradient(180deg, rgba(6,14,10,0.82), rgba(6,14,10,0.62));
  border: 1px solid rgba(120,230,150,0.4); border-radius: 9px;
  padding: 3px 8px; align-items: center; gap: 8px; white-space: nowrap;
  backdrop-filter: blur(4px); box-shadow: 0 4px 16px rgba(0,0,0,0.45);
}
#wt-mg-hud.actif { display: flex; }
#wt-mg-hud .b { display: flex; align-items: baseline; gap: 3px; }
#wt-mg-hud .k { font-size: 6.5px; letter-spacing: 1.4px; color: rgba(159,232,176,0.6); }
#wt-mg-hud .v { font-size: 12px; font-weight: 800; color: #d6ffe2; font-variant-numeric: tabular-nums; }
#wt-mg-hud .u { font-size: 7px; color: rgba(159,232,176,0.55); }
#wt-mg-hud .sep { width: 1px; height: 16px; background: rgba(120,230,150,0.25); }
#wt-mg-hud .etat { font-size: 8px; letter-spacing: 1px; }
#wt-mg-hud .etat.alerte { color: #ffd166; }
#wt-mg-hud button {
  cursor: pointer; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14);
  color: rgba(214,255,226,0.85); border-radius: 6px; font-family: inherit; font-size: 8px;
  padding: 2px 5px; line-height: 1.3;
}
#wt-mg-hud button:hover { border-color: #78e696; color: #fff; }
#wt-mg-hud button.actif { background: rgba(120,230,150,0.26); border-color: #78e696; color: #fff; }
#wt-mg-hud .engin { font-size: 8px; color: rgba(214,255,226,0.7); }

/* ——— fenêtres de bureau : quasi transparentes, puis masquées ——— */
body.wt-mobiglas ${FENETRES_BUREAU.join(',\nbody.wt-mobiglas ')} {
  opacity: 0.14; filter: blur(1.5px); transition: opacity .22s ease, filter .22s ease;
}
body.wt-mobiglas ${FENETRES_BUREAU.join(':hover,\nbody.wt-mobiglas ')}:hover {
  opacity: 1; filter: none; pointer-events: auto;
}
body.wt-mobiglas-strict ${FENETRES_BUREAU.join(',\nbody.wt-mobiglas-strict ')} {
  display: none !important;
}
/* en mobiglas, on range aussi les instruments « classiques » en doublon */
body.wt-mobiglas #wt-vol-hud .wt-vol-w { opacity: 0.35; }
body.wt-mobiglas #wt-vol-hud .wt-vol-w:hover { opacity: 1; }
body.wt-mobiglas #wt-cockpit .tiroir { opacity: 0.35; }
body.wt-mobiglas #wt-cockpit .tiroir:hover { opacity: 1; }
`;

/**
 * @param {object} [options]
 * @param {Function} [options.surMessage]
 * @param {Function} [options.surNiveau] appelé quand on change de niveau
 */
export function initMobiglas(options = {}) {
  const { surMessage = null, surNiveau = null } = options || {};
  if (typeof document === 'undefined') return null;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = 'wt-mg-hud';
  hud.innerHTML = `
    <span class="engin" data-m="engin">—</span>
    <span class="sep"></span>
    <span class="b"><span class="k">VITESSE</span><span class="v" data-m="vitesse">0</span><span class="u">km/h</span></span>
    <span class="sep"></span>
    <span class="b"><span class="k">ALTITUDE</span><span class="v" data-m="altitude">0</span><span class="u">m</span></span>
    <span class="sep"></span>
    <span class="b"><span class="k">CAP</span><span class="v" data-m="cap">000</span><span class="u">°</span></span>
    <span class="sep"></span>
    <span class="b"><span class="k">VARIO</span><span class="v" data-m="vario">0.0</span><span class="u">m/s</span></span>
    <span class="sep"></span>
    <span class="etat" data-m="etat">—</span>
    <span class="sep"></span>
    <button type="button" data-a="niveau" title="Transparent / masquer les fenêtres">🕶</button>
    <button type="button" data-a="quitter" title="Quitter le mode mobiGlas (M)">✕</button>`;
  document.body.appendChild(hud);

  const vals = {};
  for (const n of hud.querySelectorAll('[data-m]')) vals[n.dataset.m] = n;
  const btnNiveau = hud.querySelector('[data-a="niveau"]');

  let actif = false;
  let niveau = 'transparent';
  let minuteurPlacement = null;

  /** Cale le bandeau juste au-dessus de la capture vocale. */
  function positionner() {
    let cible = null;
    for (const sel of CIBLES_MICRO) {
      const n = document.querySelector(sel);
      if (n && n.getBoundingClientRect().width > 4) { cible = n; break; }
    }
    const r = cible?.getBoundingClientRect();
    if (r && r.width > 4) {
      hud.style.left = `${Math.max(6, Math.round(r.left + r.width / 2 - hud.offsetWidth / 2))}px`;
      hud.style.top = `${Math.max(6, Math.round(r.top - hud.offsetHeight - 6))}px`;
    } else {
      hud.style.left = '12px';
      hud.style.top = `${Math.max(6, window.innerHeight - 120)}px`;
    }
    hud.style.bottom = 'auto';
    hud.style.right = 'auto';
  }

  function appliquerNiveau(n) {
    niveau = NIVEAUX.includes(n) ? n : 'transparent';
    document.body.classList.toggle('wt-mobiglas', actif && niveau === 'transparent');
    document.body.classList.toggle('wt-mobiglas-strict', actif && niveau === 'masquer');
    btnNiveau.textContent = niveau === 'masquer' ? '👁' : '🕶';
    btnNiveau.title = niveau === 'masquer' ? 'Rendre les fenêtres transparentes' : 'Masquer les fenêtres';
    surNiveau?.(niveau);
  }

  function activer(opt = {}) {
    actif = true;
    hud.classList.add('actif');
    appliquerNiveau(opt.niveau || niveau);
    positionner();
    // le micro et le dock peuvent apparaître/disparaître : on recale souvent
    if (minuteurPlacement == null) minuteurPlacement = window.setInterval(positionner, 1200);
    window.addEventListener('resize', positionner);
    surMessage?.('🕶 Mode mobiGlas : HUD compact au-dessus du micro (M pour quitter).');
  }

  function desactiver() {
    actif = false;
    hud.classList.remove('actif');
    document.body.classList.remove('wt-mobiglas', 'wt-mobiglas-strict');
    if (minuteurPlacement != null) { window.clearInterval(minuteurPlacement); minuteurPlacement = null; }
    window.removeEventListener('resize', positionner);
  }

  function basculer(opt = {}) {
    if (actif) desactiver(); else activer(opt);
    return actif;
  }

  btnNiveau.addEventListener('click', () => {
    appliquerNiveau(niveau === 'masquer' ? 'transparent' : 'masquer');
    surMessage?.(niveau === 'masquer' ? '👁 Fenêtres masquées.' : '🕶 Fenêtres en transparence.');
  });
  hud.querySelector('[data-a="quitter"]').addEventListener('click', () => {
    desactiver();
    surMessage?.('🖥 HUD complet restauré.');
  });

  // touche M (hors champ de saisie)
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'm' && e.key !== 'M') return;
    const c = e.target;
    if (c && /^(INPUT|TEXTAREA|SELECT)$/.test(c.tagName)) return;
    if (c?.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const on = basculer();
    surMessage?.(on ? '🕶 Mode mobiGlas activé.' : '🖥 HUD complet.');
  });

  function maj(e = {}) {
    if (!actif) return;
    const r = resumeVol(e);
    if (vals.vitesse) vals.vitesse.textContent = r.vitesse;
    if (vals.altitude) vals.altitude.textContent = r.altitude;
    if (vals.cap) vals.cap.textContent = r.cap;
    if (vals.vario) vals.vario.textContent = r.vario;
    if (vals.etat) {
      vals.etat.textContent = r.etat;
      vals.etat.classList.toggle('alerte', r.alerte);
    }
    if (vals.engin && r.nomEngin) vals.engin.textContent = r.nomEngin;
  }

  return {
    element: hud,
    activer,
    desactiver,
    basculer,
    maj,
    positionner,
    niveau: () => niveau,
    appliquerNiveau,
    actif: () => actif,
  };
}
