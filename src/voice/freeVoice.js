/**
 * WATCHTOWER — FREE voice commands.
 *
 * The upstream voice agent needs a paid OPENAI_API_KEY (WebRTC realtime
 * session). This module is the FREE-mode equivalent: it listens with the
 * browser's own Web Speech API (no key, no account) and parses commands
 * locally (French + English) into the exact same tool calls the paid agent
 * uses — createGevActionRunner's runGevAction(name, args). Feedback is spoken
 * with the browser's speechSynthesis, also free.
 *
 * Supported commands (FR / EN):
 *   « va à Paris » / "fly to Tokyo"            → fly_to_location
 *   « montre les avions » / "show flights"     → set_layer_visibility on
 *   « cache les séismes » / "hide earthquakes" → set_layer_visibility off
 *   « carte satellite | routière | 3D »        → set_map_stack
 *   « zoom avant / arrière » / "zoom in/out"   → adjust_camera_zoom
 *   « vue globe » / "globe view"               → zoom_to_globe
 *   « arrête le suivi » / "stop tracking"      → stop_tracking
 */

import { createGevActionRunner } from './gevActions.js';

/** Layer aliases → canonical layer ids (LAYER_STATE_REGISTRY). */
const LAYER_ALIASES = Object.freeze([
  { id: 'flights', words: ['avion', 'avions', 'vol', 'vols', 'aviation', 'plane', 'planes', 'flight', 'flights', 'aircraft'] },
  { id: 'military', words: ['militaire', 'militaires', 'military'] },
  { id: 'earthquakes', words: ['seisme', 'seismes', 'séisme', 'séismes', 'tremblement', 'tremblements', 'earthquake', 'earthquakes'] },
  { id: 'satellites', words: ['satellite', 'satellites'] },
  { id: 'ais-live-vessels', words: ['navire', 'navires', 'bateau', 'bateaux', 'ship', 'ships', 'vessel', 'vessels'] },
  { id: 'traffic', words: ['trafic', 'traffic', 'circulation'] },
  { id: 'cctv', words: ['camera', 'cameras', 'caméra', 'caméras', 'cctv'] },
  { id: 'radio', words: ['radio', 'radios'] },
  { id: 'bikeshare', words: ['velo', 'velos', 'vélo', 'vélos', 'bike', 'bikes', 'bikeshare'] },
  { id: 'local-firms', words: ['feu', 'feux', 'incendie', 'incendies', 'fire', 'fires'] },
  { id: 'rocket-launches', words: ['fusee', 'fusees', 'fusée', 'fusées', 'lancement', 'lancements', 'rocket', 'rockets', 'launch', 'launches'] },
  { id: 'telegeography-submarine-cables', words: ['cable', 'cables', 'câble', 'câbles'] },
  { id: 'local-datacenters', words: ['datacenter', 'datacenters', 'data'] },
  { id: 'local-dams', words: ['barrage', 'barrages', 'dam', 'dams'] },
  { id: 'military-installations', words: ['base', 'bases', 'installation', 'installations'] },
]);

const SHOW_WORDS = ['montre', 'montrer', 'affiche', 'afficher', 'active', 'activer', 'ajoute', 'ajouter', 'show', 'display', 'enable', 'add'];
const HIDE_WORDS = ['cache', 'cacher', 'masque', 'masquer', 'desactive', 'désactive', 'desactiver', 'enleve', 'enlève', 'retire', 'hide', 'disable', 'remove'];

const STACK_ALIASES = Object.freeze([
  { id: 'photoreal', words: ['photorealiste', 'photoréaliste', 'photoreal', '3d', 'google'] },
  { id: 'esri-imagery', words: ['satellite', 'imagerie', 'imagery', 'aerial'] },
  { id: 'osm', words: ['osm', 'routiere', 'routière', 'route', 'routes', 'road', 'roads', 'street', 'plan'] },
]);

/** Normalize a transcript: lowercase, strip accents-insensitive punctuation. */
function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAlias(aliases, text) {
  const words = new Set(text.split(' '));
  for (const entry of aliases) {
    if (entry.words.some((w) => words.has(w))) return entry.id;
  }
  return null;
}

/**
 * Parse a transcript into a tool call — pure, exported for tests.
 * @param {string} transcript
 * @returns {{name: string, args: object, say: string}|null}
 */
export function parseFreeVoiceCommand(transcript) {
  const text = norm(transcript);
  if (!text) return null;

  // Globe view
  if (/\b(vue globe|globe view|zoom out to globe|terre entiere|terre entière|whole earth|globe)\b/.test(text)) {
    return { name: 'zoom_to_globe', args: {}, say: 'Vue globe.' };
  }

  // Stop tracking
  if (/\b(arrete le suivi|arrête le suivi|stop le suivi|stop tracking|stop following)\b/.test(text)) {
    return { name: 'stop_tracking', args: {}, say: 'Suivi arrêté.' };
  }

  // Zoom
  if (/\bzoom\b|\bzoome\b|\brapproche\b|\brecule\b/.test(text)) {
    const out = /\b(arriere|arrière|out|recule|eloigne|éloigne)\b/.test(text);
    return {
      name: 'adjust_camera_zoom',
      args: { direction: out ? 'out' : 'in', amount: 'medium' },
      say: out ? 'Zoom arrière.' : 'Zoom avant.',
    };
  }

  // Map stack: « carte satellite », "switch map to osm", « passe en photoréaliste »
  if (/\b(carte|map|basemap|passe en|switch)\b/.test(text)) {
    const stackId = findAlias(STACK_ALIASES, text);
    if (stackId) {
      return { name: 'set_map_stack', args: { stackId }, say: `Carte ${stackId}.` };
    }
  }

  // Layer visibility — verb + layer alias anywhere in the sentence.
  const layerId = findAlias(LAYER_ALIASES, text);
  if (layerId) {
    const words = text.split(' ');
    const show = SHOW_WORDS.some((w) => words.includes(w));
    const hide = HIDE_WORDS.some((w) => words.includes(w));
    if (show || hide) {
      return {
        name: 'set_layer_visibility',
        args: { layerId, visible: !hide },
        say: hide ? 'Couche masquée.' : 'Couche affichée.',
      };
    }
  }

  // Fly to — « va à X », « emmène-moi à X », "fly to X", "go to X", « montre-moi X »
  const flyMatch = text.match(
    /^(?:ok\s+)?(?:va|vas|aller|allons|direction|emmene[- ]moi|emmène[- ]moi|montre[- ]moi|fly|go|take me|navigate)\s*(?:to|a|à|au|aux|vers|en|sur)?\s+(.+)$/,
  );
  if (flyMatch && flyMatch[1] && flyMatch[1].length >= 2) {
    const query = flyMatch[1].trim();
    return { name: 'fly_to_location', args: { query }, say: `Direction ${query}.` };
  }

  return null;
}

/** Speak a short confirmation with the browser's free TTS. */
function speak(text, lang) {
  try {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    // TTS is best-effort feedback only.
  }
}

/** Build the dock widget — same ids/classes as the paid control, so the
 *  existing stylesheet dresses it, minus the tier/cost chrome. */
function createFreeVoiceUi() {
  let root = document.getElementById('gev-voice-control');
  if (root) root.remove();
  root = document.createElement('div');
  root.id = 'gev-voice-control';
  root.dataset.status = 'idle';
  root.innerHTML = `
    <div class="gev-voice-heading">
      <div class="gev-voice-kicker">VOICE · GRATUIT</div>
      <div id="gev-voice-status">OFF</div>
    </div>
    <button id="gev-voice-button" type="button" aria-label="Commandes vocales gratuites — clic pour activer">
      <span class="gev-mic-orbit"><img src="/mic.svg" alt="" /></span>
      <span class="gev-mic-label">ON/OFF</span>
    </button>
    <div class="gev-voice-readout">
      <div id="gev-voice-detail">VOIX GRATUITE — « va à Paris », « montre les avions »…</div>
    </div>
    <div class="gev-voice-error-tray" role="alert" aria-live="assertive">
      <div class="gev-voice-error-header">
        <span>VOICE SYSTEM</span>
        <button class="gev-voice-error-dismiss" type="button">DISMISS</button>
      </div>
      <div id="gev-voice-error-detail"></div>
      <div class="gev-voice-error-hint">Autorise le micro, puis réessaie. (Chrome/Edge requis)</div>
    </div>
  `;
  const commandDock = document.getElementById('command-dock');
  if (commandDock) {
    const locationBar = document.getElementById('location-bar');
    const controlPanel = document.getElementById('control-panel');
    commandDock.appendChild(root);
    if (locationBar) commandDock.insertBefore(locationBar, root);
    if (controlPanel) commandDock.appendChild(controlPanel);
  } else {
    document.body.appendChild(root);
  }
  root.querySelector('.gev-voice-error-dismiss')?.addEventListener('click', () => {
    root.classList.add('error-dismissed');
  });
  return {
    root,
    button: root.querySelector('#gev-voice-button'),
    status: root.querySelector('#gev-voice-status'),
    detail: root.querySelector('#gev-voice-detail'),
    errorDetail: root.querySelector('#gev-voice-error-detail'),
  };
}

/**
 * Initialize FREE voice commands (browser speech recognition, local grammar).
 * Same call shape as initGevVoiceCommands; returns a controller with stop().
 */
export function initFreeVoiceCommands({ viewer, styleManager, dataManager, sceneDirector = null, annotations = null }) {
  const runner = createGevActionRunner({ viewer, styleManager, dataManager, sceneDirector, annotations });
  const ui = createFreeVoiceUi();
  const lang = (navigator.language || 'fr-FR').toLowerCase().startsWith('fr') ? 'fr-FR' : 'en-US';

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let recognition = null;
  let active = false;

  const setStatus = (status, detail) => {
    ui.root.dataset.status = status;
    ui.status.textContent = status === 'idle' ? 'OFF' : status.toUpperCase();
    if (detail) ui.detail.textContent = detail;
  };

  const showError = (message) => {
    ui.root.classList.remove('error-dismissed');
    ui.root.dataset.status = 'error';
    ui.status.textContent = 'ERROR';
    if (ui.errorDetail) ui.errorDetail.textContent = message;
  };

  const execute = async (transcript) => {
    const command = parseFreeVoiceCommand(transcript);
    if (!command) {
      setStatus('listening', `« ${transcript} » — non reconnu. Essaie « va à <lieu> », « montre les avions »…`);
      return;
    }
    setStatus('executing', `→ ${command.name}`);
    try {
      await runner(command.name, command.args);
      speak(command.say, lang);
      setStatus(active ? 'listening' : 'idle', `OK — ${command.say}`);
    } catch (error) {
      const message = error?.message || String(error);
      setStatus(active ? 'listening' : 'idle', `Échec: ${message}`);
    }
  };

  const start = () => {
    if (!Recognition) {
      showError('Reconnaissance vocale non supportée par ce navigateur — utilise Chrome ou Edge.');
      return;
    }
    recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0]?.transcript?.trim() || '';
      if (!transcript) return;
      if (result.isFinal) execute(transcript);
      else ui.detail.textContent = `… ${transcript}`;
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        active = false;
        showError('Micro refusé — autorise le microphone pour ce site puis réessaie.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        ui.detail.textContent = `Erreur voix: ${event.error}`;
      }
    };
    recognition.onend = () => {
      // Chrome stops after silence — restart while the session is active.
      if (active) {
        try { recognition.start(); } catch { /* already starting */ }
      } else {
        setStatus('idle', 'VOIX GRATUITE — « va à Paris », « montre les avions »…');
      }
    };
    try {
      recognition.start();
      active = true;
      setStatus('listening', 'Je t\u2019écoute — « va à Paris », « montre les satellites », « carte satellite »…');
    } catch {
      showError('Impossible de démarrer la reconnaissance vocale.');
    }
  };

  const stop = ({ removeUi = false } = {}) => {
    active = false;
    try { recognition?.stop(); } catch { /* ignore */ }
    recognition = null;
    setStatus('idle');
    if (removeUi) ui.root.remove();
  };

  ui.button.addEventListener('click', () => {
    if (active) stop();
    else start();
  });

  const controller = { start, stop, isActive: () => active, free: true };
  window.__gevVoiceCommands = controller;
  return controller;
}
