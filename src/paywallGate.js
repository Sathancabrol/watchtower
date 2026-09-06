/**
 * WATCHTOWER — garde-fou des options payantes en MODE GRATUIT.
 *
 * Quand l'utilisateur est en mode gratuit et clique une option qui exige une
 * clé/un compte (Google 3D photoréaliste, fonds Bing via Cesium ion), on
 * n'échoue pas en silence : une boîte de dialogue explique ce qu'il faut,
 * propose « OBTENIR MA CLÉ ↗ » (connexion avec son compte Google / Cesium sur
 * le site du fournisseur) et un champ pour coller la clé. À l'activation, la
 * clé est mémorisée et l'app redémarre directement en mode payant.
 */

import { isPlausibleKey } from './startGate.js';

const KEYS_STORE = 'watchtower.apiKeys.v1';
const AUTO_PAID = 'watchtower.autopaid';

/** Options payantes connues : stackId → besoin. */
const BESOINS = {
  photoreal: {
    titre: 'Globe 3D photoréaliste (Google)',
    texte: 'Ce fond utilise les Google Photorealistic 3D Tiles — un service payant de Google (crédit mensuel gratuit, carte bancaire requise). Il faut une clé de projet Google : connecte-toi avec ton compte Google via « OBTENIR MA CLÉ », copie la clé, colle-la ici.',
    cle: 'GOOGLE_MAPS_API_KEY',
    url: 'https://console.cloud.google.com/google/maps-apis/credentials',
    placeholder: 'AIza…',
  },
  'bing-aerial': {
    titre: 'Imagerie Bing (Cesium ion)',
    texte: 'Les fonds Bing passent par un compte Cesium ion (gratuit à créer). Connecte-toi sur ion.cesium.com via « OBTENIR MA CLÉ », copie ton Access Token, colle-le ici.',
    cle: 'CESIUM_ION_TOKEN',
    url: 'https://ion.cesium.com/tokens',
    placeholder: 'eyJ…',
  },
};
BESOINS['bing-labels'] = BESOINS['bing-aerial'];

const CSS = `
#wt-paywall {
  position: fixed; inset: 0; z-index: 3200; display: flex;
  align-items: center; justify-content: center; background: rgba(5,5,10,0.72);
  font-family: var(--font-mono, monospace); color: var(--text-primary, #e8eaed);
}
.wt-pw-boite {
  width: min(440px, 92vw); padding: 22px;
  background: var(--glass-bg, rgba(12,12,20,0.92));
  border: 1px solid var(--accent, #00d4ff); border-radius: 14px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.15);
}
.wt-pw-kicker { font-size: 9px; letter-spacing: 3px; color: #f0a63c; margin-bottom: 6px; }
.wt-pw-titre { font-size: 14px; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; }
.wt-pw-texte { font-size: 10px; line-height: 1.7; color: var(--text-secondary, rgba(232,234,237,0.6)); margin-bottom: 14px; }
.wt-pw-rang { display: flex; gap: 8px; margin-bottom: 12px; }
.wt-pw-entree {
  flex: 1; padding: 9px 11px; background: rgba(0,0,0,0.45); color: inherit;
  border: 1px solid var(--glass-border, rgba(255,255,255,0.12)); border-radius: 8px;
  font-family: inherit; font-size: 11px; outline: none;
}
.wt-pw-entree:focus { border-color: var(--accent, #00d4ff); }
.wt-pw-entree.ok { border-color: rgba(67,209,122,0.7); }
.wt-pw-boutons { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.wt-pw-btn {
  cursor: pointer; font-family: inherit; font-size: 10px; font-weight: 700;
  letter-spacing: 2px; padding: 9px 14px; border-radius: 8px;
}
.wt-pw-activer { background: rgba(67,209,122,0.15); border: 1px solid #43d17a; color: #43d17a; }
.wt-pw-activer[disabled] { opacity: 0.35; cursor: not-allowed; }
.wt-pw-obtenir { background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: var(--accent, #00d4ff); text-decoration: none; }
.wt-pw-annuler { background: none; border: 1px solid rgba(255,255,255,0.15); color: var(--text-secondary, rgba(232,234,237,0.5)); }
`;

function lireCles() {
  try { return JSON.parse(window.localStorage.getItem(KEYS_STORE)) || {}; } catch { return {}; }
}

/** Ouvre la boîte de dialogue pour un besoin donné. */
export function ouvrirDialoguePayant(besoin) {
  document.getElementById('wt-paywall')?.remove();
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'wt-paywall';
  overlay.innerHTML = `
    <div class="wt-pw-boite" role="dialog" aria-modal="true">
      <div class="wt-pw-kicker">OPTION PAYANTE / COMPTE REQUIS</div>
      <div class="wt-pw-titre">${besoin.titre}</div>
      <div class="wt-pw-texte">${besoin.texte}<br><br>Le reste de WATCHTOWER fonctionne
      entièrement sans ça — cette option est un bonus.</div>
      <div class="wt-pw-rang">
        <input class="wt-pw-entree" type="text" placeholder="${besoin.placeholder}  (coller la clé ici)"
          autocomplete="off" spellcheck="false" />
      </div>
      <div class="wt-pw-boutons">
        <button class="wt-pw-btn wt-pw-activer" disabled>ACTIVER</button>
        <a class="wt-pw-btn wt-pw-obtenir" href="${besoin.url}" target="_blank" rel="noopener noreferrer">OBTENIR MA CLÉ ↗</a>
        <button class="wt-pw-btn wt-pw-annuler">PLUS TARD</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const entree = overlay.querySelector('.wt-pw-entree');
  const activer = overlay.querySelector('.wt-pw-activer');
  const fermer = () => { overlay.remove(); style.remove(); };

  entree.addEventListener('input', () => {
    const ok = isPlausibleKey(entree.value);
    entree.classList.toggle('ok', ok);
    activer.disabled = !ok;
  });
  entree.focus();

  activer.addEventListener('click', () => {
    const cles = lireCles();
    cles[besoin.cle] = entree.value.trim();
    try {
      window.localStorage.setItem(KEYS_STORE, JSON.stringify(cles));
      window.localStorage.setItem(AUTO_PAID, '1');
    } catch { /* stockage plein */ }
    // Redémarrage : le start gate détecte autopaid + clé et relance direct en payant.
    window.location.reload();
  });
  overlay.querySelector('.wt-pw-annuler').addEventListener('click', fermer);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fermer(); });
}

/**
 * Installe l'interception des clics payants (MODE GRATUIT uniquement).
 * Capture les clics sur les chips de fond de carte payants avant l'app.
 */
export function initPaywallGate({ mode }) {
  if (mode === 'paid') return;
  document.addEventListener('click', (event) => {
    const chip = event.target?.closest?.('.map-stack-chip');
    if (!chip) return;
    const besoin = BESOINS[chip.dataset.stackId];
    if (!besoin) return; // fond gratuit — laisser passer
    const cles = lireCles();
    if (isPlausibleKey(cles[besoin.cle] || '')) return; // clé déjà là
    event.preventDefault();
    event.stopPropagation();
    ouvrirDialoguePayant(besoin);
  }, true);
}
