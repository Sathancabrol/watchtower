/**
 * WATCHTOWER — Start Gate
 *
 * A full-screen gate shown BEFORE the Cesium viewer boots. It lets the user
 * choose, at every startup, between:
 *
 *   MODE GRATUIT  — boots the keyless globe immediately (Esri/CARTO imagery),
 *                   no API key, no network credential, no blocking error.
 *   MODE PAYANT   — shows a key-entry panel (paste + Enter). Each key that
 *                   validates gets a green ✓ on the right of its field. The
 *                   ENTER button at the bottom is GREEN when at least one key
 *                   is active, RED when none is.
 *
 * Keys entered here are kept in localStorage so they are pre-filled (and
 * pre-validated) on the next startup. Keys coming from .env (import.meta.env)
 * pre-fill the fields too, but the gate always lets the user pick FREE mode,
 * which forcibly ignores every key.
 *
 * The module is self-contained: it injects its own stylesheet and DOM, and
 * removes both when the gate resolves.
 */

const STORAGE_KEY = 'watchtower.apiKeys.v1';

/** Key registry — client-exposed credentials the browser can actually use.
 *  Each entry carries a direct "get my key" URL: the user signs in with his
 *  Google / Cesium account THERE, copies the key, and pastes it here once. */
export const GATE_KEYS = Object.freeze([
  Object.freeze({
    id: 'GOOGLE_MAPS_API_KEY',
    label: 'GOOGLE MAPS API KEY',
    hint: 'Globe 3D photoréaliste (Google Photorealistic 3D Tiles)',
    placeholder: 'AIza…  (coller puis Entrée)',
    getUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    getSteps: '1. Connexion avec ton compte Google · 2. Créer un projet si demandé · 3. « Create credentials » → « API key » · 4. Activer « Map Tiles API » · 5. Copier la clé et la coller ici.',
  }),
  Object.freeze({
    id: 'CESIUM_ION_TOKEN',
    label: 'CESIUM ION TOKEN',
    hint: 'Imagerie Bing + route de secours vers Google 3D (optionnel)',
    placeholder: 'eyJ…  (coller puis Entrée)',
    getUrl: 'https://ion.cesium.com/tokens',
    getSteps: '1. Compte Cesium ion gratuit · 2. Onglet « Access Tokens » · 3. Copier le token par défaut et le coller ici.',
  }),
]);

/**
 * Minimal plausibility check — pure, exported for tests.
 * A key is "active" when it is a pasted credential, not a placeholder.
 * @param {string} value
 * @returns {boolean}
 */
export function isPlausibleKey(value) {
  const v = String(value || '').trim();
  if (v.length < 12) return false;
  if (/\s/.test(v)) return false;
  if (/your_.*_here/i.test(v)) return false;
  return true;
}

/** Read persisted keys from localStorage. */
function readStoredKeys() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist keys to localStorage (best-effort). */
function writeStoredKeys(keys) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Storage unavailable (private mode, quota) — the session still works.
  }
}

const GATE_CSS = `
#start-gate {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(0, 212, 255, 0.07), transparent 60%),
    var(--bg-dark, #0a0a0f);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  color: var(--text-primary, #e8eaed);
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
#start-gate.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
.gate-panel { width: min(520px, 92vw); text-align: center; }
.gate-logo {
  display: block; width: 96px; height: auto; margin: 0 auto 20px;
  filter: drop-shadow(0 0 24px rgba(0, 246, 255, 0.42));
}
.gate-title { font-size: 20px; font-weight: 600; letter-spacing: 7px; margin-bottom: 6px; }
.gate-title .title-accent { color: var(--accent, #00d4ff); }
.gate-subtitle {
  font-size: 10px; letter-spacing: 3px; color: var(--text-dim, rgba(232,234,237,0.3));
  margin-bottom: 36px; text-transform: uppercase;
}
.gate-modes { display: flex; flex-direction: column; gap: 14px; }
.gate-mode-btn {
  display: block; width: 100%; padding: 18px 20px; cursor: pointer;
  background: var(--glass-bg, rgba(12,12,20,0.72));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
  border-radius: var(--btn-radius, 10px);
  color: var(--text-primary, #e8eaed);
  font-family: inherit; text-align: left;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
}
.gate-mode-btn:hover {
  border-color: var(--accent, #00d4ff);
  background: var(--accent-dim, rgba(0,212,255,0.15));
  transform: translateY(-1px);
}
.gate-mode-name { font-size: 14px; letter-spacing: 3px; font-weight: 600; display: block; }
.gate-mode-btn[data-mode="free"] .gate-mode-name { color: #43d17a; }
.gate-mode-btn[data-mode="paid"] .gate-mode-name { color: var(--accent, #00d4ff); }
.gate-mode-desc {
  font-size: 10px; letter-spacing: 1px; margin-top: 6px; display: block;
  color: var(--text-secondary, rgba(232,234,237,0.5)); line-height: 1.5;
}
.gate-keys { text-align: left; }
.gate-keys-title { font-size: 13px; letter-spacing: 4px; margin-bottom: 4px; }
.gate-keys-sub {
  font-size: 9px; letter-spacing: 1px; color: var(--text-dim, rgba(232,234,237,0.3));
  margin-bottom: 22px; line-height: 1.6;
}
.gate-key-row { margin-bottom: 18px; }
.gate-key-labelrow {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; gap: 10px;
}
.gate-key-label { font-size: 10px; letter-spacing: 2px; display: block; }
.gate-key-get {
  font-size: 9px; letter-spacing: 1px; white-space: nowrap;
  color: var(--accent, #00d4ff); text-decoration: none;
  border: 1px solid rgba(0, 212, 255, 0.35); border-radius: 6px; padding: 4px 9px;
  transition: background 150ms ease;
}
.gate-key-get:hover { background: var(--accent-dim, rgba(0,212,255,0.15)); }
.gate-key-steps {
  display: block; margin-top: 4px; font-size: 8.5px; line-height: 1.6;
  color: var(--text-secondary, rgba(232,234,237,0.5)); letter-spacing: 0.4px;
}
.gate-badge {
  display: inline-block; margin-left: 8px; padding: 2px 7px; border-radius: 5px;
  font-size: 8px; letter-spacing: 1.5px; vertical-align: 2px;
  background: rgba(67, 209, 122, 0.15); border: 1px solid rgba(67, 209, 122, 0.5);
  color: #43d17a;
}
.gate-key-hint {
  font-size: 9px; color: var(--text-dim, rgba(232,234,237,0.3));
  letter-spacing: 0.5px; display: block; margin-top: 5px;
}
.gate-key-field { position: relative; display: flex; align-items: center; }
.gate-key-input {
  flex: 1; padding: 11px 40px 11px 12px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
  border-radius: 8px; color: var(--text-primary, #e8eaed);
  font-family: inherit; font-size: 11px; letter-spacing: 0.5px; outline: none;
  transition: border-color 150ms ease;
}
.gate-key-input:focus { border-color: var(--accent, #00d4ff); }
.gate-key-input.valid { border-color: rgba(67, 209, 122, 0.6); }
.gate-key-check {
  position: absolute; right: 12px; width: 18px; height: 18px;
  display: none; align-items: center; justify-content: center;
  color: #43d17a; font-size: 15px; font-weight: 700;
}
.gate-key-check.on { display: flex; animation: gate-pop 200ms ease; }
@keyframes gate-pop { 0% { transform: scale(0.4); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
.gate-enter-btn {
  width: 100%; margin-top: 10px; padding: 15px; cursor: pointer;
  font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: 6px;
  border-radius: var(--btn-radius, 10px);
  transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}
.gate-enter-btn.armed {
  background: rgba(67, 209, 122, 0.16); border: 1px solid #43d17a; color: #43d17a;
  box-shadow: 0 0 18px rgba(67, 209, 122, 0.25);
}
.gate-enter-btn.armed:hover { background: rgba(67, 209, 122, 0.3); }
.gate-enter-btn.disarmed {
  background: rgba(255, 82, 82, 0.12); border: 1px solid #ff5252; color: #ff5252;
}
.gate-enter-btn.shake { animation: gate-shake 300ms ease; }
@keyframes gate-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); } 75% { transform: translateX(6px); }
}
.gate-enter-status {
  font-size: 9px; letter-spacing: 1px; text-align: center; margin-top: 10px;
  min-height: 14px; color: var(--text-dim, rgba(232,234,237,0.3));
}
.gate-enter-status.warn { color: #ff5252; }
.gate-back {
  display: inline-block; margin-top: 18px; background: none; border: none; cursor: pointer;
  font-family: inherit; font-size: 10px; letter-spacing: 2px;
  color: var(--text-secondary, rgba(232,234,237,0.5));
}
.gate-back:hover { color: var(--accent, #00d4ff); }
.gate-missions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 560px) { .gate-missions { grid-template-columns: 1fr; } }
.gate-mission-btn { text-align: left; }
.gate-mission-btn .g-ic { font-size: 20px; display: block; margin-bottom: 6px; }
.gate-mission-btn .g-tit { font-size: 11px; letter-spacing: 2px; font-weight: 700; display: block; }
.gate-mission-btn .g-desc { font-size: 8.5px; line-height: 1.5; color: var(--text-secondary, rgba(232,234,237,0.5)); display: block; margin-top: 4px; letter-spacing: 0.4px; }
.gate-missions-title { font-size: 14px; letter-spacing: 4px; margin-bottom: 4px; }
.gate-missions-sub { font-size: 9px; letter-spacing: 2px; color: var(--text-dim, rgba(232,234,237,0.35)); margin-bottom: 18px; }
`;

/**
 * Open the start gate and wait for the user's choice.
 * @returns {Promise<{mode: 'free'|'paid', keys: Record<string, string>}>}
 *   In FREE mode `keys` is empty (all credentials ignored on purpose).
 *   In PAID mode `keys` holds every validated credential.
 */
export function openStartGate() {
  return new Promise((resolve) => {
    // Redémarrage automatique en MODE PAYANT : posé par le dialogue « option
    // payante » (paywallGate) après la saisie d'une clé. ?gate=1 dans l'URL
    // force le retour à l'écran de choix.
    try {
      const forceGate = /(?:\?|&|#)gate=1/.test(window.location.search + window.location.hash);
      if (!forceGate && window.localStorage.getItem('watchtower.autopaid') === '1') {
        const stored = readStoredKeys();
        const keys = {};
        for (const [k, v] of Object.entries(stored)) {
          if (isPlausibleKey(v)) keys[k] = String(v).trim();
        }
        if (Object.keys(keys).length > 0) {
          resolve({ mode: 'paid', keys });
          return;
        }
      }
    } catch { /* stockage indisponible — gate normal */ }

    const style = document.createElement('style');
    style.id = 'start-gate-style';
    style.textContent = GATE_CSS;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'start-gate';
    document.body.appendChild(gate);

    const stored = readStoredKeys();
    const envDefaults = {
      GOOGLE_MAPS_API_KEY: String(import.meta.env.GOOGLE_MAPS_API_KEY || ''),
      CESIUM_ION_TOKEN: String(import.meta.env.CESIUM_ION_TOKEN || ''),
    };

    const finish = (mode, keys, mission) => {
      gate.classList.add('hidden');
      window.setTimeout(() => {
        gate.remove();
        style.remove();
      }, 600);
      resolve({ mode, keys, mission: mission || 'explorer' });
    };

    const header = `
      <span class="gate-logo brand-logo" aria-hidden="true"><img class="gate-logo" src="/logo.svg" alt="" /></span>
      <h1 class="gate-title">WATCH<span class="title-accent">TOWER</span></h1>
      <p class="gate-subtitle">God's Eye View — poste d'observation</p>
    `;

    /** Screen 1 — mode choice. */
    const renderModeChoice = () => {
      gate.innerHTML = `
        <div class="gate-panel">
          ${header}
          <div class="gate-modes">
            <button type="button" class="gate-mode-btn" data-mode="free">
              <span class="gate-mode-name">MODE GRATUIT<span class="gate-badge">RECOMMANDÉ · ZÉRO CONFIG</span></span>
              <span class="gate-mode-desc">Aucune clé API, aucun compte. Démarrage immédiat sur le globe
              satellite (Esri) avec carte routière Esri/OSM. Recherche de lieux, voix (via le
              navigateur), avions, séismes, satellites, feux : tout a une version gratuite.</span>
            </button>
            <button type="button" class="gate-mode-btn" data-mode="paid">
              <span class="gate-mode-name">MODE PAYANT</span>
              <span class="gate-mode-desc">Connecter tes services (Google, Cesium ion) pour le globe 3D
              photoréaliste. Une clé à coller une seule fois — guidé pas à pas, mémorisé ensuite.</span>
            </button>
          </div>
        </div>
      `;
      gate.querySelector('[data-mode="free"]').addEventListener('click', () => {
        try { window.localStorage.removeItem('watchtower.autopaid'); } catch { /* ok */ }
        choisirMission('free', {});
      });
      gate.querySelector('[data-mode="paid"]').addEventListener('click', renderKeyEntry);
    };

    /** Screen 3 — POSTE DE COMMANDEMENT : quelle vue lancer en premier ? */
    const choisirMission = (mode, keys) => {
      let derniereVue = null;
      try { derniereVue = JSON.parse(window.localStorage.getItem('watchtower.derniereVue.v1') || 'null'); } catch { /* pas de vue sauvegardée */ }
      gate.innerHTML = `
        <div class="gate-panel">
          ${header}
          <h2 class="gate-missions-title">POSTE DE COMMANDEMENT</h2>
          <p class="gate-missions-sub">QUE VEUX-TU VOIR ?</p>
          <div class="gate-missions">
            <button type="button" class="gate-mode-btn gate-mission-btn" data-mission="explorer">
              <span class="g-ic">🌍</span><span class="g-tit">EXPLORER MANUELLEMENT</span>
              <span class="g-desc">Vue orbitale de la Terre, navigation libre, toutes les fenêtres à ta demande.</span>
            </button>
            <button type="button" class="gate-mode-btn gate-mission-btn" data-mission="individu">
              <span class="g-ic">👤</span><span class="g-tit">RENSEIGNEMENT INDIVIDU</span>
              <span class="g-desc">Ta fiche d'identité + le jumeau numérique (INTEL) : tes métriques, ton profil.</span>
            </button>
            <button type="button" class="gate-mode-btn gate-mission-btn" data-mission="lieux">
              <span class="g-ic">🧭</span><span class="g-tit">LIEUX</span>
              <span class="g-desc">Recherche de lieux (adresse, ville, POI) + tes lieux enregistrés.</span>
            </button>
            <button type="button" class="gate-mode-btn gate-mission-btn" data-mission="historique">
              <span class="g-ic">🏛</span><span class="g-tit">ÉVÉNEMENTS HISTORIQUES</span>
              <span class="g-desc">Frise des événements de ta commune — presse (GDELT) + résumé Wikipédia.</span>
            </button>
            <button type="button" class="gate-mode-btn gate-mission-btn" data-mission="favoris">
              <span class="g-ic">⭐</span><span class="g-tit">FAVORIS</span>
              <span class="g-desc">Tes vues caméra enregistrées + domicile : retour d'un clic.</span>
            </button>
            ${derniereVue ? `<button type="button" class="gate-mode-btn gate-mission-btn" data-mission="continuer">
              <span class="g-ic">⏩</span><span class="g-tit">MA DERNIÈRE VUE</span>
              <span class="g-desc">Reprendre exactement là où tu t'étais arrêté.</span>
            </button>` : ''}
          </div>
          <div style="text-align:center">
            <button type="button" class="gate-back" data-mission-back>← CHANGER LE MODE</button>
          </div>
        </div>
      `;
      for (const btn of gate.querySelectorAll('[data-mission]')) {
        btn.addEventListener('click', () => finish(mode, keys, btn.dataset.mission));
      }
      gate.querySelector('[data-mission-back]').addEventListener('click', renderModeChoice);
    };

    /** Screen 2 — key entry (paid mode). */
    const renderKeyEntry = () => {
      const rows = GATE_KEYS.map((key) => `
        <div class="gate-key-row" data-key-row="${key.id}">
          <div class="gate-key-labelrow">
            <label class="gate-key-label" for="gate-input-${key.id}">${key.label}</label>
            <a class="gate-key-get" href="${key.getUrl}" target="_blank" rel="noopener noreferrer">OBTENIR MA CLÉ ↗</a>
          </div>
          <div class="gate-key-field">
            <input class="gate-key-input" id="gate-input-${key.id}" type="text"
              autocomplete="off" spellcheck="false" placeholder="${key.placeholder}" />
            <span class="gate-key-check" aria-hidden="true">✓</span>
          </div>
          <span class="gate-key-hint">${key.hint}
            <span class="gate-key-steps">${key.getSteps}</span>
          </span>
        </div>
      `).join('');

      gate.innerHTML = `
        <div class="gate-panel gate-keys">
          <div style="text-align:center">${header}</div>
          <h2 class="gate-keys-title">CONNECTER TES SERVICES</h2>
          <p class="gate-keys-sub">Google et Cesium ne délivrent pas les cartes via un simple login :
          il faut une clé de projet (gratuite à créer). Clique « OBTENIR MA CLÉ » — tu te connectes
          là-bas avec ton compte Google ou Cesium — puis colle la clé ici et appuie sur Entrée :
          un ✓ vert confirme. À faire UNE SEULE FOIS : les clés restent mémorisées sur cette machine.</p>
          ${rows}
          <button type="button" class="gate-enter-btn disarmed" data-gate-enter>ENTER</button>
          <p class="gate-enter-status" data-gate-status>AUCUNE CLÉ ACTIVE</p>
          <div style="text-align:center">
            <button type="button" class="gate-back" data-gate-back>← RETOUR</button>
          </div>
        </div>
      `;

      const enterBtn = gate.querySelector('[data-gate-enter]');
      const statusEl = gate.querySelector('[data-gate-status]');
      const inputs = new Map();

      const activeKeys = () => {
        const keys = {};
        for (const [id, input] of inputs) {
          const value = input.value.trim();
          if (isPlausibleKey(value)) keys[id] = value;
        }
        return keys;
      };

      const refresh = () => {
        const count = Object.keys(activeKeys()).length;
        enterBtn.classList.toggle('armed', count > 0);
        enterBtn.classList.toggle('disarmed', count === 0);
        statusEl.classList.remove('warn');
        statusEl.textContent = count > 0
          ? `${count} CLÉ${count > 1 ? 'S' : ''} ACTIVE${count > 1 ? 'S' : ''} — PRÊT`
          : 'AUCUNE CLÉ ACTIVE';
      };

      for (const key of GATE_KEYS) {
        const row = gate.querySelector(`[data-key-row="${key.id}"]`);
        const input = row.querySelector('.gate-key-input');
        const check = row.querySelector('.gate-key-check');
        inputs.set(key.id, input);

        const validate = () => {
          const ok = isPlausibleKey(input.value);
          check.classList.toggle('on', ok);
          input.classList.toggle('valid', ok);
          refresh();
        };

        // Pre-fill from a previous session or from .env, already validated.
        const prefill = String(stored[key.id] || envDefaults[key.id] || '').trim();
        if (prefill && !/your_.*_here/i.test(prefill)) {
          input.value = prefill;
          validate();
        }

        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            validate();
            if (isPlausibleKey(input.value)) {
              // Move focus to the next empty field, if any.
              for (const [, next] of inputs) {
                if (!isPlausibleKey(next.value)) { next.focus(); break; }
              }
            }
          }
        });
        input.addEventListener('paste', () => window.setTimeout(validate, 0));
        input.addEventListener('input', validate);
        input.addEventListener('blur', validate);
      }

      enterBtn.addEventListener('click', () => {
        const keys = activeKeys();
        if (Object.keys(keys).length === 0) {
          enterBtn.classList.remove('shake');
          // Force a reflow so the shake animation can replay.
          void enterBtn.offsetWidth;
          enterBtn.classList.add('shake');
          statusEl.classList.add('warn');
          statusEl.textContent = 'AUCUNE CLÉ ACTIVE — COLLER UNE CLÉ OU REVENIR AU MODE GRATUIT';
          return;
        }
        writeStoredKeys(keys);
        choisirMission('paid', keys);
      });

      gate.querySelector('[data-gate-back]').addEventListener('click', renderModeChoice);
      refresh();
    };

    renderModeChoice();
  });
}
