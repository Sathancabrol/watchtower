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
async function init() {
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

    window.__godsEyeView = {
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
    };
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
    } catch (e) { console.error('[watchtower] boussole:', e); }
    // Dock MobiGlas : TOUTES les options en bas, par catégories de fonctions.
    try {
      const chat = initChatConsole(viewer, {
        affichage: window.__godsEyeView.watchtower?.displayOptions,
      });
      const autour = initNearbyPlaces(viewer);
      const filtres = initVisualFilters();
      const bati = initOsmBuildings3D(viewer);
      const chantier = initChantier(viewer);
      // HQ : recentre sur ta position (GPS → domicile → orbite terrestre)
      const recentrerHQ = () => {
        const voler = (lo, la, alt) => viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lo, la, alt), duration: 2.2 });
        const replis = () => {
          try {
            const h = JSON.parse(window.localStorage.getItem('watchtower.domicile.v1') || 'null');
            if (Number.isFinite(h?.lon)) { voler(h.lon, h.lat, 1800); return; }
          } catch { /* pas de domicile */ }
          voler(3.75, 43.44, 21_000_000); // position inconnue → orbite de la Terre
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => voler(pos.coords.longitude, pos.coords.latitude, 1800),
            replis, { timeout: 4000, maximumAge: 120000 },
          );
        } else replis();
      };
      // INTEL nouvelle génération : tableau de bord « jumeau numérique »
      // (remplace le HUD intel d'origine — créé AVANT le dock qui le bascule).
      window.__godsEyeView.intel = initIntelTwin(viewer);
      // POSTE DE COMMANDEMENT : LIEUX · HISTO · FAVORIS + caméras gratuites
      const cctv = initCctvCam(viewer);
      const poste = initPosteCommandement(viewer);
      window.__godsEyeView.poste = poste;
      window.__godsEyeView.dock = initMobiDock({
        panneauxAncres: [
          { id: 'chat', icone: '💬', libelle: 'CHAT', titre: 'CHAT — CONSOLE DE COMMANDES', element: chat.element, cote: 'gauche', surOuverture: chat.focus },
          { id: 'moi', icone: '📍', libelle: 'MOI', titre: '📍 MA LOCALISATION — ME LOCALISER', element: autour.element, cote: 'droite', surOuverture: autour.focus },
          { id: 'filtres', icone: '🎨', libelle: 'FILTRES', titre: 'FILTRES DE VUE', element: filtres.element, cote: 'droite' },
          { id: 'bati', icone: '🏙', libelle: 'BÂTI 3D', titre: 'BÂTIMENTS 3D (OSM, GRATUIT, RAPIDE)', element: bati.element, cote: 'gauche' },
          { id: 'chantier', icone: '🏗', libelle: 'CHANTIER', titre: 'HUB CHANTIER — CONDUITE DE TRAVAUX', element: chantier.element, cote: 'gauche' },
          { id: 'vol', icone: '✈', libelle: 'VOL', titre: 'MODE PILOTAGE — DRONE / AVION (ZQSD + JOYSTICK)', element: initFlightMode(viewer).element, cote: 'droite' },
          { id: 'lieux', icone: '🧭', libelle: 'LIEUX', titre: '🧭 LIEUX — RECHERCHE + MES LIEUX', element: poste.panneaux.lieux.element, cote: 'gauche' },
          { id: 'histo', icone: '🏛', libelle: 'HISTO', titre: '🏛 ÉVÉNEMENTS HISTORIQUES DE LA COMMUNE', element: poste.panneaux.histo.element, cote: 'droite' },
          { id: 'favoris', icone: '⭐', libelle: 'FAVORIS', titre: '⭐ FAVORIS — MES VUES + DOMICILE', element: poste.panneaux.favoris.element, cote: 'gauche' },
          { id: 'cam', icone: '📷', libelle: 'CAM', titre: '📷 CAMÉRAS GRATUITES — TRAFFIC / VILLE', element: cctv.element, cote: 'droite' },
        ],
        panneauxExistants: [
          { iconeHtml: '<span class="wt-oeil">👁</span>', icone: '👁', libelle: 'HQ', cibleId: 'wt-panel', surClic: recentrerHQ },
          { icone: '🧠', libelle: 'INTEL', cibleId: 'wt-intel' },
          { icone: '🎚', libelle: 'VISUEL+', cibleId: 'pp-toggles' },
          { icone: '🎛', libelle: 'PARAMS', cibleId: 'param-slider-panel' },
          { icone: '⚙', libelle: 'ACTIONS', cibleId: 'top-center-actions' },
        ],
      });
      poste.setDock(window.__godsEyeView.dock);
      // 🏙 BÂTI 3D : clic sur un nom de repère → FICHE LIEU du bâtiment
      bati.setSurFiche((lon, lat) => window.__godsEyeView.fiche?.ouvrir(lon, lat));
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
      initMinimap(viewer);
    } catch (e) { console.error('[watchtower] minimap:', e); }

  } catch (error) {
    console.error("God's Eye View initialization failed:", error);
    loaderStatus.textContent = `Error: ${describeError(error)}`;
    loaderStatus.style.color = '#ff4444';
  }
}

init();
