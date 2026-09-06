import * as Cesium from 'cesium';
import { StyleManager } from './ui.js';
// flyToAustin retiré — WATCHTOWER démarre en vue orbitale (espace).
import { DataLayerManager } from './data/manager.js';
import flightsLayer from './data/flights.js';
import militaryFlightsLayer from './data/militaryFlights.js';
import earthquakesLayer from './data/earthquakes.js';
import satellitesLayer from './data/satellites.js';
import rocketLaunchesLayer from './data/rocketLaunches.js';
import trafficLayer from './data/traffic.js';
import cctvLayer from './data/cctv.js';
import radioLayer from './data/radio.js';
import bikeshareLayer from './data/bikeshare.js';
import aisLiveVesselsLayer from './data/aisLiveVessels.js';
import militaryInstallationsLayer from './data/militaryInstallations.js';
import militaryAwarenessLayer from './data/militaryAwareness.js';
import localDataLayers from './data/localLayers.js';
import { LAYER_STATE_REGISTRY } from './data/layerState.js';
import { registerDataCredits } from './data/dataCredits.js';
import { SceneDirector } from './scenes/director.js';
import { initGevVoiceCommands } from './voice/gevRealtime.js';
import { initFreeVoiceCommands } from './voice/freeVoice.js';
import { initWatchtowerExtras } from './watchtowerExtras.js';
import { initCompassTape } from './compassTape.js';
import { initMobiDock } from './mobiDock.js';
import { initChatConsole } from './chatConsole.js';
import { initNearbyPlaces } from './nearbyPlaces.js';
import { initFicheLieu } from './ficheLieu.js';
import { initVisualFilters } from './visualFilters.js';
import { initOsmBuildings3D } from './osmBuildings3D.js';
import { initChantier } from './chantier.js';
import { initFlightMode } from './flightMode.js';
import { initIntelTwin } from './intelTwin.js';
import { initFrenchHud } from './frenchHud.js';
import { initPaywallGate } from './paywallGate.js';
import { initPosteCommandement } from './posteCommandement.js';
import { initMinimap } from './minimap.js';
import { creerBatiRapide } from './batiRapide.js';
import { initHistorique } from './historique.js';
import { initHudCentral } from './hudCentral.js';
import { capturerErreurs, initDiagnostic, toutReafficher } from './diagnostic.js';
import { initMedaillons } from './medaillons.js';
import { initDossier } from './dossier.js';
import { initHQ } from './hq.js';
import { initTheme } from './theme.js';
import { initVuesTerritoire } from './vueCommunale.js';
import { initPins } from './pins.js';
import { initNomsLieux } from './nomsLieux.js';
import { initTrajets } from './trajets.js';
import { initPhotoSearch } from './photoSearch.js';
import { initStreetView } from './streetView.js';
import { initLocalisation } from './localisation.js';
import { initSystemeSolaire } from './systemeSolaire.js';
import { initCadastre } from './cadastre.js';
import { initEntites } from './entites.js';
import { initMobiglas } from './mobiglas.js';
import { initCadrans } from './cadrans.js';
import { initIntelVues } from './vuesIntel.js';
import { initUrgenceMode } from './urgenceMode.js';
import { initPalais } from './palais.js';
import { initVeille } from './veille.js';
import { initComptes } from './compte.js';
import { creerAssistant as creerAssistantIA } from './llm.js';
import { initDispositifs } from './dispositifs.js';
import { COMMANDES } from './commandes.js';
import { depuisObjet } from './data/dossiers.js';
import { modelesOllama } from './llm.js';
import { initRadio } from './radio.js';
import { amenagerFenetres, amenagerToutes } from './fenetres.js';
import { creerCockpit } from './cockpit.js';
import { initCinematique } from './cinematique.js';
import { initCctvCam } from './cctvCam.js';
import { MapStackController } from './mapStackController.js';
import { initAnnotations } from './annotations/index.js';
import { initLogoGaze } from './logoGaze.js';
import { initCockpitCloudEffects } from './cockpitCloudEffects.js';
import {
  installRenderGovernor,
  getRenderGovernorDiagnostics,
  governorRequestRender,
  holdContinuousRender,
  releaseContinuousRender,
} from './renderGovernor.js';
import { installScopeMask } from './scopeMask.js';
import { initFirstRunExperience } from './firstRunExperience.js';
import { initKeySetup } from './keySetup.js';
import { loadPhotorealisticTileset } from './mapStartup.js';
import { openStartGate } from './startGate.js';

initLogoGaze();

/**
 * Bandeau d'information éphémère partagé par les modules WATCHTOWER
 * (bâti 3D rapide, vues du territoire, épingles). Un seul canal de message,
 * pas une fenêtre de plus à l'écran.
 * @param {string} html Message (mise en forme légère autorisée : <b>, <br>).
 */
window.__wtToast = (html) => {
  try {
    const bandeau = document.getElementById('toast');
    if (!bandeau) return;
    bandeau.innerHTML = html;
    bandeau.classList.add('visible');
    window.clearTimeout(window.__wtToastTimer);
    window.__wtToastTimer = window.setTimeout(() => bandeau.classList.remove('visible'), 3400);
  } catch { /* bandeau absent : le message est simplement perdu */ }
};

/**
 * Extract a human-readable error message from any thrown value.
 * Handles Error objects, strings, and plain objects with message/error fields.
 * @param {*} error — caught exception value
 * @returns {string} best-effort error description
 */
function describeError(error) {
  if (!error) return 'Unknown initialization error';
  if (error instanceof Error) {
    if (error.message && error.message.trim()) return error.message.trim();
    return error.name || 'Initialization error';
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (typeof error === 'object') {
    const maybeMessage = String(error.message || error.error || '').trim();
    if (maybeMessage) return maybeMessage;
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // ignore serialization error
    }
  }
  return String(error);
}

/**
 * GOD'S EYE VIEW — Main Entry Point
 * Initializes CesiumJS with Google Photorealistic 3D Tiles,
 * style system, intelligence HUD, location presets, and share links.
 */
/* ⚠ Garde-fous posés après le bug de l'itération 10 : deux fonctions
   `rendreListe` dans le même scope — la seconde écrasait la première et
   touchait une `const` encore en zone morte temporelle. Une seule exception
   privait alors l'application du lanceur, du poste, d'INTEL et de dix autres
   modules d'un coup. `proteger` isole désormais chaque module ; `elDe`
   récupère un élément sans jamais jeter si le module parent est absent. */
function proteger(nom, fn) {
  try { return fn(); } catch (e) {
    console.error(`[watchtower] ${nom}:`, e);
    try { window.__wtToast?.(`⚠ ${nom} indisponible — ouvre F3 → diagnostic`); } catch { /* trop tôt au démarrage */ }
    return null;
  }
}
function elDe(obj, ...chemin) {
  try {
    let v = obj;
    for (const k of chemin) v = v?.[k];
    return v && v.element ? v.element : null;
  } catch { return null; }
}

async function init() {
  // 🐞 Capture d'erreurs AVANT tout : si un module jette au démarrage, tout
  // ce qui suit dans cette fonction n'existe pas — le diagnostic (touche F3)
  // pourra le dire au lieu de laisser l'écran vide sans explication.
  capturerErreurs();
  const loadingScreen = document.getElementById('loading-screen');
  const loaderStatus = loadingScreen.querySelector('.loader-status');

  // WATCHTOWER start gate — the user picks FREE (keyless, boots instantly on
  // the Esri/CARTO globe) or PAID (paste API keys, green ✓ per key, ENTER)
  // before anything credential-dependent initializes. FREE mode forcibly
  // ignores every key so startup can never block on a credential problem.
  const gate = await openStartGate();

  try {
    loaderStatus.textContent = 'Configuring viewer...';

    // A direct Google key provides Google 3D plus GEV place search. Cesium ion
    // can host the same 3D tiles and also powers Bing/world-terrain stacks.
    const cesiumToken = gate.mode === 'paid' ? (gate.keys.CESIUM_ION_TOKEN || '') : '';
    const googleApiKey = gate.mode === 'paid' ? (gate.keys.GOOGLE_MAPS_API_KEY || '') : '';
    if (googleApiKey) window.__GOOGLE_MAPS_API_KEY__ = googleApiKey;

    // Create the Cesium viewer with minimal chrome
    const viewer = new Cesium.Viewer('cesiumContainer', {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
      baseLayer: false,
      // Visible attribution container — Google Maps / 3D Tiles credits are
      // required by Google's Terms of Service, so they must be shown (styled
      // subtly via #cesium-credits). The credit line stays visible in
      // clean-view AND recording modes too (ToS requires attribution while the
      // content is displayed — those are the exact modes used to record
      // demos), including the "Data attribution" link that opens the per-layer
      // license popover.
      creditContainer: (() => {
        const el = document.createElement('div');
        el.id = 'cesium-credits';
        document.body.appendChild(el);
        return el;
      })(),
      msaaSamples: 4,
      contextOptions: {
        webgl: {
          preserveDrawingBuffer: true,
        },
      },
    });

    // Cap the default render loop at 60 fps. Cesium's loop otherwise runs at
    // the display's refresh rate — 120 Hz on ProMotion panels — doubling GPU
    // and CPU burn for zero visual benefit in a map app whose animation
    // cadences (poll interpolation, trail fades, style crossfades) are all
    // designed against wall-clock time, not frame count. Measured on the
    // 2026-08-05 perf investigation as a strict halving of idle burn on
    // 120 Hz hardware; a no-op on 60 Hz displays. (perf item 2)
    viewer.targetFrameRate = 60;

    // Register per-layer data attribution into the "Data attribution" popover.
    // Required by each source's license (ODbL, CC BY-NC-SA, NASA FIRMS, etc.);
    // strings are verbatim from DATA_SOURCES.md. Static + always-present in the
    // expandable bottom-left credit lightbox (showOnScreen=false), so they never
    // clutter the on-globe line. See docs/pre-ship-audit-2026-07-01.md H11.
    registerDataCredits(viewer);

    // Hide Cesium's default globe — Google Photorealistic 3D Tiles provide their own
    // globe at all LODs (street level → orbital). The default globe's 2D imagery
    // clips through 3D tile buildings at close range.
    viewer.scene.globe.show = false;

    // Keep a sky behind Google 3D Tiles, but soften Cesium's high-intensity
    // default atmosphere. With the globe hidden its bright limb otherwise
    // reads as a hard cyan seam where distant photoreal tiles meet the sky.
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 18;
    viewer.scene.skyAtmosphere.saturationShift = -0.12;
    viewer.scene.skyAtmosphere.brightnessShift = -0.08;

    loaderStatus.textContent = googleApiKey || cesiumToken
      ? 'Loading Google 3D Tiles...'
      : 'Loading the keyless globe...';
    const photoreal = await loadPhotorealisticTileset(Cesium, {
      googleApiKey,
      cesiumToken,
    });
    const tileset = photoreal.tileset;
    if (tileset) {
      viewer.scene.primitives.add(tileset);
      // NOTE: Cesium World Terrain intentionally disabled — conflicts with Google 3D Tiles at high zoom.
      // Google Photorealistic 3D Tiles provide their own terrain/elevation.
      viewer.scene.globe.show = false;
      console.info(`[Init] Google 3D Tiles loaded via ${photoreal.route}.`);
    } else {
      if (photoreal.errors.length) {
        const tileError = photoreal.errors.at(-1);
        console.warn('[Init] Google 3D Tiles unavailable, using the keyless globe:', tileError);
        const tileErrorDetail = describeError(tileError);
        loaderStatus.textContent = `Google 3D Tiles unavailable (${tileErrorDetail}). Loading the keyless globe...`;
      }
      viewer.scene.globe.show = true;
    }

    loaderStatus.textContent = 'Initializing systems...';

    const mapStackController = new MapStackController(viewer, {
      googleTileset: tileset,
      cesiumToken,
      initialStack: tileset ? 'photoreal' : 'esri-imagery',
      // Task 5 (height-datum fix): rebroadcast stack changes as a window
      // CustomEvent so data layers (CCTV per-regime ground resolution) can
      // react without coupling MapStackController to layer modules. Fires on
      // 'switching'/'ready'/'error'; listeners derive the surface regime from
      // live scene state, so intermediate emissions are harmless.
      onChange: (state) => {
        window.dispatchEvent(new CustomEvent('gev:map-stack-changed', { detail: state }));
      },
      onError: (message) => console.warn('[MapStack]', message),
    });
    await mapStackController.setStack(tileset ? 'photoreal' : 'esri-imagery', { silent: true });

    // Initialize the style manager (post-processing, HUD, locations, share links)
    const styleManager = new StyleManager(viewer, { mapStackController });
    // The previous multi-canvas weather compositor remains disabled. Cockpit
    // clouds use a separate, capped low-resolution GPU pass that never attaches
    // Cesium fog or post-process stages and is fully stopped in map mode.
    const weatherEffects = null;
    const cockpitCloudEffects = initCockpitCloudEffects(viewer);

    // If no share link state, start on the ORBITAL view — WATCHTOWER opens in
    // space (whole Earth), centred on the saved home (or France by default).
    if (!styleManager.hasShareState) {
      loaderStatus.textContent = 'Vue orbitale…';
      let lon = 3.75; let lat = 43.44; // Frontignan / sud de la France par défaut
      try {
        const home = JSON.parse(window.localStorage.getItem('watchtower.domicile.v1') || 'null');
        if (Number.isFinite(home?.lon) && Number.isFinite(home?.lat)) { lon = home.lon; lat = home.lat; }
      } catch { /* défaut France */ }
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 21_000_000),
      });
    } else {
      loaderStatus.textContent = 'Restoring shared view...';
    }

    // Initialize data layer manager
    const dataManager = new DataLayerManager(viewer, {
      allowQaRegistration: import.meta.env.DEV,
    });
    dataManager.register(flightsLayer);
    dataManager.register(militaryFlightsLayer);
    dataManager.register(earthquakesLayer);
    dataManager.register(satellitesLayer);
    dataManager.register(rocketLaunchesLayer);
    rocketLaunchesLayer.attachDataManager(dataManager);
    dataManager.register(trafficLayer);
    dataManager.register(cctvLayer);
    dataManager.register(radioLayer);
    dataManager.register(bikeshareLayer);
    dataManager.register(aisLiveVesselsLayer);
    dataManager.register(militaryInstallationsLayer);
    dataManager.register(militaryAwarenessLayer);
    militaryAwarenessLayer.attachDataManager(dataManager);
    for (const layer of localDataLayers) {
      dataManager.register(layer);
    }
    // Restoration starts only after the complete production registry is sealed.
    dataManager.finalizeRegistrations(LAYER_STATE_REGISTRY);
    if (import.meta.env.DEV) {
      window.__gevQaRegisterLayer = (targetManager, layerModule) => {
        if (targetManager !== dataManager) throw new Error('QA layer manager mismatch');
        return dataManager.registerForQa(layerModule);
      };
      window.__gevQaUnregisterLayer = (targetManager, layerId) => {
        if (targetManager !== dataManager) throw new Error('QA layer manager mismatch');
        return dataManager.unregisterForQa(layerId);
      };
    }
    dataManager.buildTogglePanel(document.getElementById('data-toggles'));
    styleManager.attachDataManager(dataManager);

    // Initialize deterministic scene playback for social clip capture
    const sceneDirector = new SceneDirector(viewer, styleManager, dataManager);

    // Initialize the voice "whiteboard" annotation engine (world-space renderer)
    const annotations = initAnnotations({ viewer, tileset });

    // Keep startup chrome truthful: a share is not restored until camera,
    // visual/map/panel lanes, and every requested layer have terminated.
    void Promise.all([
      styleManager.initialRestorePromise,
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]).finally(() => {
      loadingScreen.classList.add('hidden');
      // Reveal only after the loading cover has yielded. transitionend can be
      // absent under reduced motion, so a bounded fallback makes this reliable.
      let firstRunRevealed = false;
      const revealFirstRun = () => {
        if (firstRunRevealed) return;
        firstRunRevealed = true;
        // dataManager is passed explicitly: the globe missions enable bundled
        // keyless layers through it, and reaching for styleManager._dataManager
        // would make a private field part of this feature's contract.
        initFirstRunExperience({ styleManager, dataManager });
        // POSTE DE COMMANDEMENT : lance la mission choisie au démarrage
        window.__wtLancerMission?.();
      };
      loadingScreen.addEventListener('transitionend', revealFirstRun, { once: true });
      setTimeout(revealFirstRun, 900);
    });

    // Provider Settings (the POWER UP chip + dialog). Fire-and-forget: the
    // module removes its own surface when the dev-server endpoint is absent
    // (prod builds, non-local visitors), so this costs prod exactly nothing.
    void initKeySetup();

    // Expose for debugging
    // Idle render governor: flips the scene into requestRenderMode whenever
    // nothing animates per frame. Installed AFTER every module above has had
    // its chance to register pre-install holds. (perf wave 2)
    installRenderGovernor(viewer);

    // The explicit scope mask replaces the emergent six-pass artifact —
    // see src/scopeMask.js. Installed before the UI so the DISPLAY-rail
    // toggle finds it live.
    installScopeMask(viewer);

    // The follow camera recomputes the tracked target's dead-reckon position
    // every frame — tracking anything is a per-frame animation. (perf wave 2)
    viewer.trackedEntityChanged.addEventListener(() => {
      if (viewer.trackedEntity) holdContinuousRender('tracked-entity');
      else releaseContinuousRender('tracked-entity');
    });

    // Hidden-state suspension (perf wave 2): when the window/tab is hidden,
    // stop the default render loop outright — a hidden canvas repaints for
    // nobody, and browser rAF throttling still lets throttled frames burn
    // GPU. Holder/data state is untouched, so return is seamless: restore
    // the loop, refresh the one DOM surface we gated, render a frame.
    const syncVisibilitySuspension = () => {
      const hidden = document.hidden;
      viewer.useDefaultRenderLoop = !hidden;
      cockpitCloudEffects?.setSuspended?.(hidden);
      if (!hidden) {
        if (dataManager._panelRefreshPendingOnVisible) {
          dataManager._panelRefreshPendingOnVisible = false;
          dataManager._refreshTogglePanel();
        }
        governorRequestRender('visibility-restore');
      }
    };
    document.addEventListener('visibilitychange', syncVisibilitySuspension);
    // Apply the CURRENT state too — bootstrap can complete while the tab is
    // already hidden, and waiting for the next transition would leave the
    // loop burning behind a hidden tab. (perf wave 2 fix)
    syncVisibilitySuspension();

    window.__godsEyeView = {};
    // 🐞 Diagnostic + raccourci universel « tout réafficher » (F3).
    try {
      window.__godsEyeView.diagnostic = initDiagnostic({
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__wtToutReafficher = () => {
        const fait = toutReafficher();
        window.__wtToast?.(`👁 Tout réaffiché : ${fait.length} action(s).`);
        return fait;
      };
    } catch (e) { console.error('[watchtower] diagnostic:', e); }
    Object.assign(window.__godsEyeView, {
      viewer,
      styleManager,
      tileset,
      dataManager,
      sceneDirector,
      mapStackController,
      annotations,
      weatherEffects,
      cockpitCloudEffects,
      getRenderGovernorDiagnostics,
      requestRender: governorRequestRender,
    });
    // Voice: PAID mode runs the OpenAI realtime agent (needs OPENAI_API_KEY on
    // the dev server); FREE mode runs the keyless browser voice — Web Speech
    // recognition + a local FR/EN grammar driving the same action runner.
    window.__godsEyeView.voiceCommands = gate.mode === 'paid'
      ? initGevVoiceCommands({ viewer, styleManager, dataManager, sceneDirector, annotations })
      : initFreeVoiceCommands({ viewer, styleManager, dataManager, sceneDirector, annotations });

    // WATCHTOWER — panneau français : INFO VUE exacte, météo Open-Meteo,
    // domicile, marque-pages, import KML/GeoJSON/GPX. Tout sans clé.
    try {
      window.__godsEyeView.watchtower = initWatchtowerExtras({ viewer });
    } catch (e) { console.error('[watchtower] panneau FR:', e); }
    // Boussole FPS (ruban de cap : glisser = tourner, double-clic = nord).
    try {
      window.__godsEyeView.boussole = initCompassTape(viewer);
      // 🎨 PEAU NÉON : les contours et ascenseurs blancs de l'app d'origine
      // passent au cyan WATCHTOWER (désactivable dans AFFICHAGE → F2).
      window.__godsEyeView.theme = initTheme();
    } catch (e) { console.error('[watchtower] boussole:', e); }
    // Dock MobiGlas : TOUTES les options en bas, par catégories de fonctions.
    try {
      const chat = proteger('chat / console', () => initChatConsole(viewer, {
        affichage: window.__godsEyeView.watchtower?.displayOptions,
      }));
      // 🚨 MODE URGENCE : « /urgence » — temps gelé, mascotte qui veille, chat
      // en grand au centre, procédure officielle + secours proches + itinéraire
      // le plus rapide + guidage pas à pas. Le panneau du chat est résolu à la
      // volée (#wt-dock-chat) : le dock n'existe pas encore ici.
      const urgence = initUrgenceMode(viewer, {
        dire: (t) => chat?.dire?.(t),
        surMessage: (m) => window.__wtToast?.(m),
        geocoder: chat?.geocoder,
      });
      window.__godsEyeView.urgence = urgence;
      chat?.setUrgence?.(urgence);
      // 🔑 COMPTES & NIVEAUX : fenêtre de connexion (Ollama local, services à
      // clé, offres payantes optionnelles). Les clés restent dans le navigateur.
      const testerService = async (c) => {
        if (c.id === 'ollama') {
          const l = await modelesOllama(c.url || 'http://localhost:11434');
          return l.length ? `${l.length} modèle(s) : ${l.slice(0, 3).join(', ')}` : '';
        }
        if (!c.url) return '';
        try {
          const r = await fetch(`${String(c.url).replace(/\/+$/, '')}/models`, {
            headers: c.cle ? { Authorization: `Bearer ${c.cle}` } : {},
          });
          return r.ok ? `service joignable (HTTP ${r.status})` : '';
        } catch { return ''; }
      };
      const comptes = initComptes({
        surMessage: (m) => window.__wtToast?.(m),
        tester: testerService,
      });
      window.__godsEyeView.comptes = comptes;
      // 🧠 ASSISTANT DU CHAT : Ollama local d'abord (gratuit, hors ligne),
      // service à clé ensuite, repli honnête sinon.
      const assistant = creerAssistantIA({
        comptes,
        commandes: COMMANDES,
        surMessage: (m) => window.__wtToast?.(m),
      });
      chat?.setAssistant?.(assistant);
      window.__godsEyeView.assistant = assistant;
      // bouton « se connecter » directement dans la barre de saisie du chat
      try {
        const saisie = chat?.element?.querySelector?.('.saisie');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'envoyer';
        b.title = 'Brancher un compte / une IA (Ollama local, clé…)';
        b.textContent = '🔑';
        b.style.padding = '8px 9px';
        b.addEventListener('click', () => comptes.ouvrir());
        saisie.appendChild(b);
      } catch { /* barre absente */ }
      const autour = proteger('autour de moi', () => initNearbyPlaces(viewer));
      const filtres = proteger('filtres de vue', () => initVisualFilters());
      // ⚡ Bâti 3D : pipeline rapide (cache mémoire, géométrie par lots sur un
      // worker, hauteurs estimées) partagé par le panneau BÂTI 3D et les vues.
      const batiRapide = creerBatiRapide(viewer, { surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.bati = batiRapide;
      const bati = proteger('bâti 3D', () => initOsmBuildings3D(viewer, { bati: batiRapide }));
      // 🕰 MODE HISTORIQUE : les mêmes bâtiments 3D, mais datés — le curseur
      // d'année ne laisse debout que ceux qui existaient déjà. Gratuit :
      // les dates viennent d'OpenStreetMap (start_date), déjà dans les tags.
      const historique = proteger('mode historique', () => initHistorique(viewer, {
        bati: batiRapide,
        surMessage: (m) => window.__wtToast?.(m),
      }));
      window.__godsEyeView.historique = historique;
      const chantier = proteger('hub chantier', () => initChantier(viewer));
      window.__godsEyeView.chantier = chantier;
      // HQ : recentre sur ta position (GPS → domicile → orbite terrestre)
      const recentrerHQ = () => {
        // 🎬 « ME LOCALISER » : on part de l'espace et on descend en cinématique
        // jusqu'à TA position (GPS → domicile → Méditerranée). On explique à
        // chaque fois : le bouton seul ne disait pas ce qu'il faisait.
        window.__wtToast?.('🎬 <b>ME LOCALISER</b> — la caméra redescend de l\u2019espace '
          + 'jusqu\u2019à <b>ta position</b> (GPS), ou ton domicile, ou la Méditerranée '
          + 'si la position est inconnue : c\u2019est la cinématique d\u2019arrivée de '
          + 'WATCHTOWER, pas un simple zoom.');
        const jouer = (lo, la, nom) => {
          window.__godsEyeView.hq?.placer(la, lo, nom);
          window.__godsEyeView.cinematique?.rechercheHQ(la, lo, nom);
        };
        const replis = () => {
          try {
            const h = JSON.parse(window.localStorage.getItem('watchtower.domicile.v1') || 'null');
            if (Number.isFinite(h?.lon)) { jouer(h.lon, h.lat, h.label || 'MON DOMICILE'); return; }
          } catch { /* pas de domicile */ }
          jouer(3.75, 43.44, 'MÉDITERRANÉE'); // position inconnue
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => jouer(pos.coords.longitude, pos.coords.latitude, 'MA POSITION'),
            replis, { timeout: 4000, maximumAge: 120000 },
          );
        } else replis();
      };
      // 🎬 CINÉMATIQUE : approche « écran de jeu » (travelling + bandes +
      // grain) utilisée par le bouton HQ et la recherche de lieu.
      const cinematique = initCinematique(viewer, {
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.cinematique = cinematique;
      // 🏰 HQ = LA TOUR DE GUET DANS LE CIEL. Elle n'est pas dessinée en
      // permanence : comme les repères 3D de Maps, elle apparaît par paliers
      // (balise → silhouette → détail) à mesure qu'on se rapproche.
      const hq = proteger('hq', () => initHQ(viewer, {
        surMessage: (m) => window.__wtToast?.(m),
      }));
      window.__godsEyeView.hq = hq;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'hq', icone: '🏰', libelle: 'HQ', groupe: 'vues',
        titre: '🏰 HQ — LA TOUR DE GUET DANS LE CIEL', element: null, cote: 'droite',
        surClic: () => hq.centrer(),
      });

      // 🎛 COCKPIT : en mode vol, une seule instrumentation, centrée, façon
      // simulateur. Le tiroir « SYSTÈMES » rouvre chaque fenêtre rangée.
      const PANNEAUX_BORD = [
        { libelle: '📍 MOI', dock: 'moi' },
        { libelle: '🧠 INTEL', cible: 'wt-intel' },
        { libelle: '🏙 BÂTI 3D', dock: 'bati' },
        { libelle: '📌 ÉPINGLES', cible: 'wt-pins' },
        { libelle: '🗺 MINICARTE', cible: 'wt-minimap' },
        { libelle: '🛣 TRAJETS', dock: 'trajets' },
        { libelle: '🪐 SYSTÈME', dock: 'systeme' },
        { libelle: '💬 CHAT', dock: 'chat' },
        { libelle: '🎨 FILTRES', dock: 'filtres' },
        { libelle: '🎚 VISUEL+', cible: 'pp-toggles' },
        { libelle: '🎛 PARAMS', cible: 'param-slider-panel' },
        { libelle: '🏗 CHANTIER', dock: 'chantier' },
        { libelle: '🕰 ÉPOQUES', dock: 'temps' },
      ];
      const cockpit = creerCockpit(viewer, {
        panneaux: PANNEAUX_BORD,
        surMessageHud: (m) => window.__wtToast?.(m),
        surOuvrirPanneau: (p, on) => {
          const dock = window.__godsEyeView.dock;
          for (const n of document.querySelectorAll('.wt-vol-force')) n.classList.remove('wt-vol-force');
          if (!on) return;
          if (p.dock) {
            dock?.ouvrir?.(p.dock);
            window.requestAnimationFrame(() => {
              cockpit.forcer(document.querySelector('.wt-dock-panel:not(.wt-dock-cache)'));
            });
          } else if (p.cible) {
            const n = document.getElementById(p.cible);
            if (!n) return;
            n.classList.remove('wt-dock-cache');
            cockpit.forcer(n);
          }
        },
      });
      window.__godsEyeView.cockpit = cockpit;
      // 🕶 MOBIGLAS : en vol, HUD compact au-dessus du micro + fenêtres de
      // bureau estompées (M pour basculer).
      const mobiglas = initMobiglas({ surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.mobiglas = mobiglas;
      const vol = proteger('mode pilotage', () => initFlightMode(viewer, { cockpit, mobiglas }));
      window.__godsEyeView.vol = vol;

      // INTEL nouvelle génération : tableau de bord « jumeau numérique »
      // (remplace le HUD intel d'origine — créé AVANT le dock qui le bascule).
      window.__godsEyeView.intel = proteger('INTEL', () => initIntelTwin(viewer));
      // POSTE DE COMMANDEMENT : LIEUX · HISTO · FAVORIS + caméras gratuites
      const cctv = proteger('caméras', () => initCctvCam(viewer));
      const poste = proteger('poste de commandement', () => initPosteCommandement(viewer));
      window.__godsEyeView.poste = poste;
      window.__godsEyeView.dock = initMobiDock({
        panneauxAncres: [
          { id: 'chat', icone: '💬', libelle: 'CHAT', titre: 'CHAT — CONSOLE DE COMMANDES', element: elDe(chat), cote: 'gauche', groupe: 'outils', surOuverture: chat?.focus },
          { id: 'moi', icone: '📍', libelle: 'MOI', titre: '📍 MA LOCALISATION — ME LOCALISER', element: elDe(autour), cote: 'droite', groupe: 'nav', surOuverture: autour?.focus },
          { id: 'filtres', icone: '🎨', libelle: 'FILTRES', titre: 'FILTRES DE VUE', element: elDe(filtres), cote: 'droite', groupe: 'vues' },
          { id: 'bati', icone: '🏙', libelle: 'BÂTI 3D', titre: 'BÂTIMENTS 3D (OSM, GRATUIT, RAPIDE)', element: elDe(bati), cote: 'gauche', groupe: 'vues' },
          { id: 'chantier', icone: '🏗', libelle: 'CHANTIER', titre: 'HUB CHANTIER — CONDUITE DE TRAVAUX', element: elDe(chantier), cote: 'gauche', groupe: 'donnees' },
          { id: 'vol', icone: '✈', libelle: 'VOL', titre: 'MODE PILOTAGE — DRONE / AVION (ZQSD + JOYSTICK)', element: elDe(vol), cote: 'droite', groupe: 'modes' },
          { id: 'lieux', icone: '🧭', libelle: 'LIEUX', titre: '🧭 LIEUX — RECHERCHE + MES LIEUX', element: elDe(poste, 'panneaux', 'lieux'), cote: 'gauche', groupe: 'nav' },
          { id: 'histo', icone: '🏛', libelle: 'HISTO', titre: '🏛 ÉVÉNEMENTS HISTORIQUES DE LA COMMUNE', element: elDe(poste, 'panneaux', 'histo'), cote: 'droite', groupe: 'donnees' },
          { id: 'favoris', icone: '⭐', libelle: 'FAVORIS', titre: '⭐ FAVORIS — MES VUES + DOMICILE', element: elDe(poste, 'panneaux', 'favoris'), cote: 'gauche', groupe: 'nav' },
          { id: 'temps', icone: '🕰', libelle: 'ÉPOQUES', titre: '🕰 MODE HISTORIQUE — LA VILLE À TRAVERS LE TEMPS (OSM)', element: elDe(historique), cote: 'gauche', groupe: 'vues' },
          { id: 'cam', icone: '📷', libelle: 'CAM', titre: '📷 CAMÉRAS GRATUITES — TRAFFIC / VILLE', element: elDe(cctv), cote: 'droite', groupe: 'donnees' },
        ],
        panneauxExistants: [
          {
            iconeHtml: '<span class="wt-oeil">👁</span>', icone: '👁', libelle: 'ME LOCALISER',
            cibleId: 'wt-panel', groupe: 'nav', titre: '👁 ME LOCALISER — cinématique depuis l’espace jusqu’à ta position',
            surClic: recentrerHQ,
          },
          { icone: '🧠', libelle: 'INTEL', cibleId: 'wt-intel', groupe: 'donnees', titre: '🧠 INTEL — tableau de bord expert' },
          { icone: '🎚', libelle: 'VISUEL+', cibleId: 'pp-toggles', groupe: 'vues', titre: '🎚 Réglages visuels' },
          { icone: '🎛', libelle: 'PARAMS', cibleId: 'param-slider-panel', groupe: 'outils', titre: '🎛 Curseurs de paramètres' },
          { icone: '⚙', libelle: 'ACTIONS', cibleId: 'top-center-actions', groupe: 'outils', titre: '⚙ Actions (calques, partage, globe)' },
          { icone: '📌', libelle: 'ÉPINGLES', cibleId: 'wt-pins', groupe: 'vues', titre: '📌 Mes épingles' },
          { icone: '🗺', libelle: 'GLOBE', cibleId: 'wt-minimap', groupe: 'vues', titre: '🗺 Minicarte globe (boussole + matrice)' },
          { icone: '🛣', libelle: 'RUE', cibleId: 'wt-sv', groupe: 'vues', titre: '🛣 Street view — photos de rue libres' },
          { icone: '🖼', libelle: 'PHOTO', cibleId: 'wt-photo', groupe: 'vues', titre: '🖼 Identifier un lieu par photo' },
        ],
      });
      poste.setDock(window.__godsEyeView.dock);
      // 🏙 BÂTI 3D : clic sur un nom de repère → FICHE LIEU du bâtiment
      bati?.setSurFiche?.((lon, lat) => window.__godsEyeView.fiche?.ouvrir(lon, lat));
      // 🗼 VUES DU TERRITOIRE : boutons nommés dans la fenêtre CONTEXTE de
      // l'INTEL (vue communale = plan 2D + contour animé + couche AR).
      const vues = initVuesTerritoire(viewer, {
        bati: batiRapide,
        analyse: () => window.__godsEyeView.intel?.derniere?.() || null,
        fiche: (lon, lat) => window.__godsEyeView.fiche?.ouvrir(lon, lat),
        heatzones: () => window.__godsEyeView.intel?.basculerHeat?.(),
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.vues = vues;
      window.__godsEyeView.intel?.setVues?.(vues);
      // 🔲 CADRANS : la commune découpée en cadrans nommés (quartiers OSM, sinon
      // alphabet OTAN) avec tracé animé — donne un repère commun pour en parler.
      const cadrans = initCadrans(viewer, {
        fiche: (lon, lat, nom) => window.__godsEyeView.fiche?.ouvrir(lon, lat, nom),
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.cadrans = cadrans;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'cadrans', icone: '🔲', libelle: 'CADRANS', groupe: 'vues',
        titre: '🔲 CADRANS — LA COMMUNE DÉCOUPÉE EN QUARTIERS NOMMÉS',
        element: elDe(cadrans), cote: 'gauche',
      });
      // 🧠 INTEL ÉLARGI : 6 nouvelles vues (jumeau AR, communal, individuel,
      // politique, économique, production) + bandeau « fil » façon Bloomberg.
      const intelVues = initIntelVues(document.getElementById('wt-intel'), {
        intel: window.__godsEyeView.intel,
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.intelVues = intelVues;
      // 📌 ÉPINGLES : bouton visible en bas à gauche → clic carte = épingle.
      const pins = initPins(viewer, {
        fiche: (lon, lat) => window.__godsEyeView.fiche?.ouvrir(lon, lat),
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.pins = pins;

      // 🎬 ME LOCALISER : cinématique orbite → station WATCHTOWER → zoom
      // séquentiel → création du bâtiment → périmètre cadastral → présence.
      const localisation = initLocalisation(viewer, {
        bati: batiRapide,
        fiche: (lat, lon) => window.__godsEyeView.fiche?.ouvrir(lon, lat),
        pins,
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.localisation = localisation;

      // 🛣 VUE DE RUE (Panoramax/IGN, open source) — bouton dans MOI + fiche.
      const streetView = initStreetView(viewer, { surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.streetView = streetView;

      // 🖼 IDENTIFIER UN LIEU : photo → coordonnées GPS EXIF (+ bouton dock
      // juste à côté de MOI, et glisser-déposer n'importe où sur l'app).
      const photoSearch = initPhotoSearch(viewer, {
        fiche: (lat, lon, nom) => window.__godsEyeView.fiche?.ouvrir(lon, lat, nom),
        poserEpingle: (o) => {
          if (Number.isFinite(o?.lon)) pins.poser(o.lon, o.lat, o.nom);
          else pins.armer(true);
        },
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.photoSearch = photoSearch;
      // bouton permanent collé au bouton MOI dans la barre du dock
      try {
        const boutonMoi = Array.from(window.__godsEyeView.dock?.dock?.querySelectorAll?.('.wt-dock-btn') || [])
          .find((b) => /MOI/.test(b.textContent || ''));
        if (boutonMoi) boutonMoi.insertAdjacentElement('afterend', photoSearch.boutonDock());
        else window.__godsEyeView.dock?.dock?.appendChild?.(photoSearch.boutonDock());
      } catch { /* dock absent */ }

      // 🛣 TRAJETS : vol d'oiseau ou suivi des routes/chemins (OSRM).
      const trajets = initTrajets(viewer, {
        fiche: (lat, lon) => window.__godsEyeView.fiche?.ouvrir(lon, lat),
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.trajets = trajets;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'trajets', icone: '🛣', libelle: 'TRAJETS', groupe: 'nav',
        titre: '🛣 TRAJETS — VOL D’OISEAU OU SUIVRE LA ROUTE', element: elDe(trajets), cote: 'gauche',
      });

      // 🪐 SYSTÈME SOLAIRE : entités réelles autour de la Terre (JPL/ELP2000).
      const systeme = initSystemeSolaire(viewer, { surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.systeme = systeme;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'systeme', icone: '🪐', libelle: 'SYSTÈME', groupe: 'vues',
        titre: '🪐 SYSTÈME SOLAIRE — POSITIONS RÉELLES AUTOUR DE LA TERRE', element: elDe(systeme), cote: 'droite',
      });

      // 📻 RADIO : annuaire Radio-Browser (équivalent libre de Radio Garden).
      const radio = initRadio(viewer, { surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.radio = radio;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'radio', icone: '📻', libelle: 'RADIO', groupe: 'donnees',
        titre: '📻 RADIO — FLUX EN DIRECT (RADIO-BROWSER, LIBRE)', element: elDe(radio), cote: 'droite',
      });

      // 🗺 CADASTRE LÉGER : contours de parcelles (apicarto/IGN) sous 2 500 m,
      // pour que la carte « raconte » l'environnement sans le surcharger.
      const cadastre = initCadastre(viewer, { surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.cadastre = cadastre;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'cadastre', icone: '🗺', libelle: 'CADASTRE', groupe: 'nav',
        titre: '🗺 CADASTRE — CONTOURS DE PARCELLES (IGN, SANS CLÉ)', element: elDe(cadastre), cote: 'gauche',
      });

      // 🏷 ENTITÉS DE LA CARTE : chaque bâtiment/équipement porte la pastille
      // de sa FONCTION RÉELLE (OSM) — boulangerie, bibliothèque, maison, cuves…
      const entites = initEntites(viewer, {
        fiche: (lon, lat, nom, contexte) => window.__godsEyeView.fiche?.ouvrir(lon, lat, nom, contexte),
        surMessage: (m) => window.__wtToast?.(m),
      });
      window.__godsEyeView.entites = entites;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'entites', icone: '🏷', libelle: 'ENTITÉS', groupe: 'vues',
        titre: '🏷 ENTITÉS DE LA CARTE — FONCTION RÉELLE DE CHAQUE LIEU (OSM)',
        element: elDe(entites), cote: 'gauche',
      });

      // 🗺 NOMS DE LIEUX : étiquettes toujours lisibles (pays → villes →
      // hameaux) + fenêtre du lieu central sous la boussole.
      const nomsLieux = initNomsLieux(viewer, { fenetres: true });
      window.__godsEyeView.nomsLieux = nomsLieux;
      // 🧭 MÉDAILLONS : quand les noms de lieux sont actifs, chaque niveau
      // (pays → région → département → commune → quartier) devient une
      // grande icône qui FLOTTE et tourne lentement en 360°. Au clic :
      // fiche + monter / descendre dans la hiérarchie.
      try {
        const medaillons = initMedaillons(viewer, {
          fiche: (lon, lat, nom) => window.__godsEyeView.fiche?.ouvrir(lon, lat, nom),
          surMessage: (m) => window.__wtToast?.(m),
          actif: true,
        });
        window.__godsEyeView.medaillons = medaillons;
      } catch (e) { console.error('[watchtower] medaillons:', e); }

      // 🎥 DISPOSITIFS : caméras, micros, capteurs — visibles sur la carte en
      // vue INTEL. Un clic sur l'icône ouvre la FICHE avec sa MINI-FENÊTRE DE
      // DIRECT ; un clic sur la mini-fenêtre ouvre la fiche détaillée
      // (site, type d'objet, outils, activité estimée, description de scène).
      const dispositifs = initDispositifs(viewer, {
        fiche: (lon, lat, nom, contexte) => window.__godsEyeView.fiche?.ouvrir(lon, lat, nom, contexte),
        surMessage: (m) => window.__wtToast?.(m),
        comptes: window.__godsEyeView.comptes,
      });
      window.__godsEyeView.dispositifs = dispositifs;
      window.__godsEyeView.dock?.ajouter?.({
        id: 'dispositifs', icone: '🎥', libelle: 'DISPOSITIFS', groupe: 'donnees',
        titre: '🎥 DISPOSITIFS — CAMÉRAS, MICROS ET CAPTEURS (DIRECT)',
        element: elDe(dispositifs), cote: 'droite',
      });

      // 🧠 PALAIS MENTAL : à la place de la carte, une chambre de motel des
      // années 70. Les outils de l'app sont des objets posés sur le bureau et
      // les dossiers sont épinglés au mur — on descend jusqu'au plus petit
      // élément, avec une recherche qui affine en direct.
      const palais = initPalais({
        surMessage: (m) => window.__wtToast?.(m),
        surObjet: (id) => {
          const toast = (t) => window.__wtToast?.(t);
          if (id === 'carte') { palais.fermer(); toast('🗺 Retour à la vue principale.'); return; }
          // 🗂 DOSSIER D'INVESTIGATION : le tableau du palais guide l'enquête
          // (étapes déduites + fonctions WATCHTOWER qui les servent) et tient
          // les notes (créer / modifier / épingler / ranger).
          let dossier = window.__godsEyeView.dossier;
          if (!dossier) {
            dossier = proteger('dossier', () => initDossier({
              surMessage: (m) => window.__wtToast?.(m),
            }));
            window.__godsEyeView.dossier = dossier;
          }
          if (id === 'tableau') { palais.ouvrirObjet('tableau', dossier.element, { titre: '🗂 DOSSIER D’INVESTIGATION', largeur: 420 }); return; }
          if (id === 'tele') { palais.ouvrirObjet('tele', dossier.elementTele(), { titre: '📺 DOSSIER EN COURS', largeur: 380 }); return; }
          if (id === 'drone') {
            // 🚁 On ne décolle pas sans le dire : le vol démarre AU-DESSUS de
            // ta position, il faut donc la renseigner (ou confirmer).
            const pos = window.__godsEyeView.moi?.position?.() || null;
            const ok = window.confirm(
              '🚁 Le drone va décoller AU-DESSUS DE TA POSITION'
              + (pos ? ` (${pos.lat?.toFixed?.(4) ?? '?'}, ${pos.lon?.toFixed?.(4) ?? '?'})` : ' (position encore inconnue)')
              + '.\n\nContinuer le lancement du vol ?',
            );
            if (!ok) { window.__wtToast?.('🚁 Lancement annulé.'); return; }
            palais.ouvrirObjet('drone', elDe(vol), { titre: '🚁 PILOTAGE', largeur: 360 });
            window.__godsEyeView.vol?.demarrer?.();
            return;
          }
          if (id === 'telephone') { palais.ouvrirObjet('telephone', elDe(chat), { titre: '📞 CHAT (+ IA)', largeur: 360 }); return; }
          if (id === 'calendrier') { palais.ouvrirObjet('calendrier', elDe(chantier), { titre: '🗓 PLANNING · PHASAGE · BUDGET', largeur: 420 }); return; }
          if (id === 'radio') { palais.ouvrirObjet('radio', radio.element, { titre: '📻 RADIO', largeur: 360 }); return; }
          if (id === 'moniteur') { dispositifs.basculer(true); palais.ouvrirObjet('moniteur', dispositifs.live, { titre: '🎥 DIRECT — CAMÉRAS', largeur: 380 }); return; }
          if (id === 'chemise') { palais.ouvrirObjet('chemise', elDe(chantier), { titre: '🗄 DOSSIERS SOURCES', largeur: 420 }); return; }
          if (id === 'fenetre') {
            // 🪟 Les rideaux s'ouvrent ET la caméra part vers les étoiles.
            document.body.classList.add('wt-rideaux-ouverts');
            try { window.localStorage.setItem('watchtower.rideaux.v1', '1'); } catch { /* plein */ }
            const systeme = window.__godsEyeView.systeme;
            systeme?.activer?.(true);
            window.__godsEyeView.dock?.ouvrir?.('systeme');
            window.__godsEyeView.cinematique?.espace?.();
            window.__wtToast?.('🪟 Rideaux ouverts — cap sur la vue stellaire (positions réelles, lois de Kepler).');
            return;
          }
          toast('Objet du bureau à brancher.');
        },
        surCarte: (n) => {
          // feuille atteinte : on ouvre la fiche si elle porte une position
          const v = n?.valeur;
          const lat = Number(v?.lat ?? v?.latitude);
          const lon = Number(v?.lon ?? v?.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            window.__godsEyeView.fiche?.ouvrir(lon, lat, n.nom, { detail: n.detail });
          }
        },
        surSortie: () => window.__wtToast?.('🚪 Retour à la carte.'),
      });
      window.__godsEyeView.palais = palais;

      /** Alimente le mur du palais avec les données VIVANTES de l'app. */
      function nourrirPalais() {
        const dossiers = [];
        try {
          const e = window.__godsEyeView.entites?.entites?.() || [];
          if (e.length) dossiers.push(depuisObjet(e.slice(0, 200), { nom: `🏷 Entités (${e.length})`, type: 'aerien' }));
          const c = window.__godsEyeView.cadrans?.cadrans?.() || [];
          if (c.length) dossiers.push(depuisObjet(c.map((x) => ({ nom: x.nom, centre: x.centre, couverture: Math.round((x.couverture ?? 1) * 100) / 100 })), { nom: `🔲 Cadrans (${c.length})`, type: 'plan' }));
          const a = window.__godsEyeView.intel?.derniere?.();
          if (a) dossiers.push(depuisObjet(a, { nom: '🧠 Analyse de la vue', type: 'polaroid' }));
          const d = window.__godsEyeView.dispositifs?.liste?.() || [];
          if (d.length) dossiers.push(depuisObjet(d, { nom: `🎥 Dispositifs (${d.length})`, type: 'video' }));
        } catch { /* données pas prêtes */ }
        if (!dossiers.length) {
          dossiers.push({
            id: 'demarrage', nom: 'DÉMARRER', type: 'plan', ic: '🧭',
            detail: 'ouvre un module pour alimenter le mur',
            enfants: [
              { id: 'd1', nom: 'Chercher les entités de la carte', type: 'aerien', ic: '🏷' },
              { id: 'd2', nom: 'Tracer les cadrans de la commune', type: 'plan', ic: '🔲' },
              { id: 'd3', nom: 'Scanner les caméras autour', type: 'video', ic: '🎥' },
            ],
          });
        }
        palais.setDossiers(dossiers, 'PALAIS MENTAL');
      }
      window.__wtNourrirPalais = nourrirPalais;
      palais.element.addEventListener('wt-palais-ouvert', nourrirPalais);
      // bouton d'accès au palais, dans la barre du dock
      try {
        const dockEl = window.__godsEyeView.dock?.dock;
        if (dockEl) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'wt-dock-btn';
          b.title = 'PALAIS MENTAL — chambre 7 (touche P) : les dossiers au mur, les outils sur le bureau';
          b.innerHTML = '<span class="ic">🛏</span><span class="lb">PALAIS</span>';
        b.dataset.groupe = 'outils';
          b.addEventListener('click', () => {
            if (palais.estOuvert()) palais.fermer();
            else { nourrirPalais(); palais.ouvrir(); }
          });
          window.__godsEyeView.dock?.ranger?.(b, b.dataset.groupe || 'outils');
        }
      } catch { /* dock absent */ }
      // touche P : bascule du palais (Échap pour en sortir)
      window.addEventListener('keydown', (e) => {
        if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
        if (e.key === 'p' || e.key === 'P') {
          if (palais.estOuvert()) palais.fermer();
          else { nourrirPalais(); palais.ouvrir(); }
        }
      });

      // 😴 VEILLE : plus aucun HUD à l'écran après 15 s sans contact
      // (fondu de 10 s à 15 s, réapparition au moindre mouvement).
      // Veille : 60 s avant de s'estomper, 90 s avant de disparaître (au lieu
      // de 10/15 s, jugé beaucoup trop rapide) — et réglable depuis AFFICHAGE.
      const veille = initVeille({ debut: 60_000, fin: 90_000 });
      window.__godsEyeView.veille = veille;
      const styleOrigine = document.createElement('style');
      styleOrigine.textContent = '.wt-origine-cache { display: none !important; }';
      document.head.appendChild(styleOrigine);
      // 🧹 AFFICHAGE PRINCIPAL ÉPURÉ : les panneaux d'origine (DATA LAYERS,
      // CCTV, SCENES, CONTEXT) encombrent l'écran alors que leurs fonctions
      // sont dans CALQUES. On les MASQUE sans les détruire : le bouton
      // « PANNEAUX D'ORIGINE » des CALQUES les remet (aucune fonction perdue).
      window.__wtPanneauxOrigine = (on) => {
        const cibles = ['data-panel', 'cctv-panel', 'scene-panel', 'global-context-panel'];
        for (const id of cibles) {
          const n = document.getElementById(id);
          if (n) n.classList.toggle('wt-origine-cache', on !== false);
        }
        try { window.localStorage.setItem('watchtower.panneauxOrigine.v1', on !== false ? '0' : '1'); } catch { /* plein */ }
        return on !== false;
      };
      try {
        if (window.localStorage.getItem('watchtower.panneauxOrigine.v1') !== '1') window.__wtPanneauxOrigine(true);
      } catch { window.__wtPanneauxOrigine(true); }
      // pendant une urgence (ou dans le palais), on ne laisse pas l'écran s'effacer
      window.setInterval(() => {
        const enUrgence = Boolean(window.__godsEyeView.urgence?.estActive?.());
        const enPalais = palais.estOuvert();
        if ((enUrgence || enPalais) && veille.estActif()) veille.activer(false);
        else if (!enUrgence && !enPalais && !veille.estActif()) veille.activer(true);
      }, 1000);

      // 🪟 Toutes les fenêtres flottantes : déplaçables, redimensionnables,
      // réductibles en icône (–), transformables (⚙) et mémorisées d'une
      // session à l'autre. Deux passages : tout de suite, puis après la
      // création des fenêtres tardives (fiche, street view, photo…).
      amenagerToutes();
      window.setTimeout(() => amenagerToutes(), 2500);
      // « chaque bouton envoie vers sa fenêtre / fiche » — navigation globale
      window.wtAller = {
        pageChantier: (p) => {
          window.__godsEyeView.dock?.ouvrir?.('chantier');
          window.dispatchEvent(new CustomEvent('wt:chantier-page', { detail: p }));
        },
        chantier: (p) => { window.__godsEyeView.dock?.ouvrir?.('chantier'); window.dispatchEvent(new CustomEvent('wt:chantier-page', { detail: p })); },
        intel: () => window.__godsEyeView.dock?.ouvrirExistant?.('wt-intel'),
        bati: () => window.__godsEyeView.dock?.ouvrir?.('bati'),
        fiche: (lon, lat) => window.__godsEyeView.fiche?.ouvrir(lon, lat),
      };
      // mission de démarrage (choisie à l'écran POSTE DE COMMANDEMENT)
      const mission = gate.mission || 'explorer';
      const lancerMission = () => {
        try { poste.lancerMission(mission); } catch (e) { console.error('[watchtower] mission:', e); }
      };
      window.__wtLancerMission = lancerMission;
      // dernière vue : sauvegarde auto → « ⏩ MA DERNIÈRE VUE » au démarrage suivant
      window.setInterval(() => {
        try {
          const p = viewer.camera.position;
          window.localStorage.setItem('watchtower.derniereVue.v1', JSON.stringify({
            x: p.x, y: p.y, z: p.z,
            heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll,
            t: Date.now(),
          }));
        } catch { /* stockage plein */ }
      }, 20000);
    } catch (e) { console.error('[watchtower] dock:', e); }
    // FICHE LIEU : clic gauche sur la carte → dossier du point (Wikipédia,
    // photo, adresse, onglets politique/économie/citoyen, visite drone 3D).
    try {
      window.__godsEyeView.fiche = initFicheLieu(viewer);
    } catch (e) { console.error('[watchtower] fiche lieu:', e); }
    // toutes les fenêtres flottantes sont déplaçables
    try {
      const { rendreDeplacable } = await import('./draggable.js');
      const panneauHq = document.getElementById('wt-panel');
      if (panneauHq?.firstElementChild) rendreDeplacable(panneauHq, panneauHq.firstElementChild);
    } catch (e) { console.error('[watchtower] draggable:', e); }
    // HUD en français (traduction au vol des libellés d'origine, gratuit).
    try {
      window.__godsEyeView.hudFr = initFrenchHud();
    } catch (e) { console.error('[watchtower] hud fr:', e); }
    // Mode gratuit : un clic sur une option payante ouvre le dialogue
    // d'activation (explication + OBTENIR MA CLÉ + collage de la clé).
    try {
      initPaywallGate({ mode: gate.mode });
    } catch (e) { console.error('[watchtower] paywall:', e); }
    // MINICARTE en bas à gauche (suit la vue, anti-collision, repliable)
    try {
      const minimap = initMinimap(viewer);
      window.__godsEyeView.minimap = minimap;
      // 🧭 La boussole quitte le bord de l'écran : elle se pose DANS la
      // fenêtre de la minicarte, juste au-dessus du globe (⚙ pour la
      // remettre en ruban sur la hauteur).
      try { minimap.accueillirBoussole?.(window.__godsEyeView.boussole); } catch (e) { console.error('[watchtower] boussole:', e); }
    } catch (e) { console.error('[watchtower] minimap:', e); }

    // 🖥 HUD CENTRAL : « je ne trouve plus mes boutons ».
    // Créé EN DERNIER (il recense tout ce qui existe déjà à l'écran) :
    //  · un 👁 TOUJOURS VISIBLE en haut à gauche : un clic et TOUT le HUD
    //    revient, quel que soit ce qui l'a masqué (vue propre, veille,
    //    réduction auto, mode vol) ;
    //  · la fenêtre « AFFICHAGE » (touche F2) : la liste de tous les blocs
    //    d'interface avec une case chacun, une recherche, des préréglages ;
    //  · option « HUD progressif » : écran nu au démarrage, l'œil révèle
    //    l'interface bloc par bloc.
    try {
      const hudCentral = initHudCentral({ surMessage: (m) => window.__wtToast?.(m) });
      window.__godsEyeView.hudCentral = hudCentral;
      const dockEl = window.__godsEyeView.dock?.dock;
      if (dockEl) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wt-dock-btn';
        b.title = 'AFFICHAGE — voir et régler TOUT le HUD (touche F2, ou l’œil en haut à gauche)';
        b.innerHTML = '<span class="ic">🖥</span><span class="lb">AFFICHAGE</span>';
        b.dataset.groupe = 'modes';
        b.addEventListener('click', () => hudCentral.basculer());
        window.__godsEyeView.dock?.ranger?.(b, 'modes');
      }
      // 🐞 DIAG : état des modules, erreurs capturées, « tout réafficher ».
      const diag = window.__godsEyeView.diagnostic;
      if (diag) {
        const b2 = document.createElement('button');
        b2.type = 'button';
        b2.className = 'wt-dock-btn';
        b2.innerHTML = '<span class="ic">🐞</span><span class="lb">DIAG</span>';
        b2.title = 'Diagnostic : modules présents, erreurs capturées, tout réafficher (touche F3)';
        b2.addEventListener('click', () => diag.basculer());
        window.__godsEyeView.dock?.ranger?.(b2, 'modes');
      }
    } catch (e) { console.error('[watchtower] hud central:', e); }

  } catch (error) {
    console.error("God's Eye View initialization failed:", error);
    loaderStatus.textContent = `Error: ${describeError(error)}`;
    loaderStatus.style.color = '#ff4444';
  }
}

init();
