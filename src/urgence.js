/**
 * WATCHTOWER — MODE URGENCE DU CHAT.
 *
 * « /urgence » (ou « au secours », « sos ») bascule le chat en **mode
 * urgence** :
 *
 *  1. **le temps est gelé** : horloge Cesium arrêtée, animations de l'écran
 *     mises en pause, calques qui bougent suspendus — on ne distrait pas
 *     quelqu'un qui panique ;
 *  2. la **mascotte** apparaît en grand : l'œil de WATCHTOWER regarde
 *     l'utilisateur, cligne, se tourne vers la vue de la carte (il « va voir »),
 *     revient se poser dans l'angle opposé à la souris (effet de répulsion) ;
 *  3. le **chat s'ouvre en grand au centre** ;
 *  4. l'utilisateur est **pris par la main** : procédure officielle (numéros,
 *     gestes), **secours les plus proches** (OpenStreetMap/Overpass),
 *     **itinéraire le plus rapide** (OSRM) et **guidage pas à pas** qui déplace
 *     la vue et montre l'animation — un tuto personnalisé.
 *
 * ⚠️ Les procédures reprennent les **messages officiels** (service-public.fr,
 * ministères). Elles ne remplacent ni un appel aux secours, ni une formation
 * aux premiers secours ; chaque procédure cite sa source, et l'app affiche
 * d'abord les NUMÉROS D'URGENCE.
 *
 * Rien n'est inventé : sans données (réseau, OSM), on le dit et on renvoie vers
 * les numéros officiels.
 */

import { sourceConnue } from './tracabilite.js';

/** Numéros d'urgence (France) — source : service-public.fr. */
export const NUMEROS = Object.freeze([
  { numero: '112', nom: 'Urgences européennes', detail: 'joignable partout en Europe, même sans crédit' },
  { numero: '15', nom: 'SAMU', detail: 'urgence médicale (maladie, accident, malaise)' },
  { numero: '17', nom: 'Police / gendarmerie', detail: 'infraction, violence, vol, disparition' },
  { numero: '18', nom: 'Pompiers', detail: 'incendie, secours à personne, accident, fuite de gaz' },
  { numero: '114', nom: 'Urgences par SMS', detail: 'personnes sourdes, malentendantes, aphasiques' },
  { numero: '196', nom: 'Urgences en mer', detail: 'CROSS — détresse maritime' },
  { numero: '0 800 47 33 33', nom: 'Urgence gaz / électricité', detail: 'odeur de gaz, fil électrique à terre (GRDF/Enedis)' },
]);

/** Sources officielles citées par les procédures. */
export const SOURCES = Object.freeze({
  service_public: { nom: 'service-public.fr — numéros d’urgence', url: 'https://www.service-public.fr/particuliers/vosdroits/F1011' },
  georisques: { nom: 'Géorisques', url: 'https://www.georisques.gouv.fr/' },
  vigilance: { nom: 'Météo-France — vigilance', url: 'https://vigilance.meteofrance.fr/' },
  sante: { nom: 'Ministère de la Santé', url: 'https://www.sante.gouv.fr/' },
});

/**
 * Catalogue des procédures. `mots` sert au choix automatique depuis la phrase
 * de l'utilisateur. Chaque étape = une action concrète.
 */
export const PROCEDURES = Object.freeze([
  {
    cle: 'generale',
    nom: 'URGENCE — QUE FAIRE',
    mots: ['urgence', 'sos', 'secours', 'aide', 'aidez', 'panique', 'que faire'],
    etapes: [
      'PROTÉGER : mets-toi à l’abri, supprime le danger (couper le gaz, l’électricité, baliser).',
      'ALERTER : appelle le bon numéro (112 · 15 · 17 · 18 · 114) — donne ta position exacte.',
      'SECOURIR : ne bouge pas un blessé sauf danger immédiat ; parle-lui, rassure-le.',
      'RESTER AU TÉLÉPHONE jusqu’à ce que l’opérateur dise de raccrocher.',
    ],
    source: 'service_public',
  },
  {
    cle: 'malaise',
    nom: 'MALAISE / ARRÊT CARDIAQUE',
    mots: ['malaise', 'cardiaque', 'coeur', 'cœur', 'inconscient', 'respire', 'crise', 'arret', 'arrêt'],
    numero: '15',
    etapes: [
      'Appelle le 15 (ou le 112). Décris : la personne ne répond pas / ne respire pas.',
      'Allonge la personne sur le dos, sol dur. Dégage les voies (tête en arrière, menton levé).',
      'Si elle ne respire pas : massage cardiaque — 100 à 120 compressions par minute, au centre de la poitrine.',
      'Un défibrillateur (DAE) est à moins de 5 min ? Allume-le et suis les instructions vocales.',
      'Si elle respire mais reste inconsciente : position latérale de sécurité (PLS).',
      'Ne donne rien à boire ni à manger. Reste jusqu’à l’arrivée des secours.',
    ],
    source: 'sante',
  },
  {
    cle: 'incendie',
    nom: 'INCENDIE',
    mots: ['incendie', 'feu', 'flamme', 'fume', 'fumée', 'explosion', 'ca brule', 'ça brûle'],
    numero: '18',
    etapes: [
      'Appelle le 18. Donne l’adresse exacte et le point de repère (bâtiment, étage, issue).',
      'Sors immédiatement : porte la main sur la poignée, si elle est chaude, ne l’ouvre pas.',
      'Reste près du sol (les fumées montent), bouche-toi le nez avec un tissu humide.',
      'Ne prends pas l’ascenseur. Ferme les portes derrière toi pour limiter la propagation.',
      'Rejoins le point de rassemblement. Ne retourne jamais dans un bâtiment qui brûle.',
      'Si tes vêtements brûlent : roule-toi par terre (ne cours pas).',
    ],
    source: 'service_public',
  },
  {
    cle: 'inondation',
    nom: 'INONDATION / CRUE',
    mots: ['inondation', 'crue', 'eau', 'debordement', 'débordement', 'submersion', 'orage', 'pluie forte'],
    numero: '18',
    etapes: [
      'Vérifie la vigilance Météo-France (jaune / orange / rouge) avant tout déplacement.',
      ' Monte les objets et produits dangereux en hauteur. Coupe le gaz et l’électricité.',
      'Ne descends pas en cave, ne t’engage pas à pied ou en voiture dans l’eau (30 cm suffisent à emporter un véhicule).',
      'Réfugie-toi en étage, emporte eau, lampe, radio, papiers et médicaments.',
      'Suis les consignes de la mairie (évacuation, point de rassemblement).',
    ],
    source: 'vigilance',
  },
  {
    cle: 'seisme',
    nom: 'SÉISME',
    mots: ['seisme', 'séisme', 'tremblement', 'tremble', 'secousse'],
    numero: '18',
    etapes: [
      'Pendant : abrite-toi sous un meuble solide, protège ta tête et ta nuque, éloigne-toi des vitres.',
      'Ne sors pas pendant les secousses — le danger est à l’extérieur (facades, fils).',
      'Après : coupe gaz, eau, électricité. N’utilise pas d’allumette ni de briquet (fuite possible).',
      'Sors prudemment, dégage-toi vers un espace dégagé, écoute la radio (consignes).',
      'Si tu es bloqué : signale-toi (siffle, tape), ne crie pas inutilement.',
    ],
    source: 'service_public',
  },
  {
    cle: 'route',
    nom: 'ACCIDENT DE LA ROUTE',
    mots: ['accident', 'route', 'voiture', 'moto', 'collision', 'vehicule', 'véhicule', 'percute', 'choc'],
    numero: '18',
    etapes: [
      'PROTÉGER : gilet, triangle à 30 m (150 m sur autoroute), feux de détresse, coupe le contact.',
      'Ne déplace pas les blessés, sauf danger immédiat (incendie, circulation).',
      'ALERTER : 18 (blessés), 17 (constat simple sans blessé), 112 depuis un portable.',
      'Donne : lieu précis (borne, point kilométrique), nombre de blessés, risques (carburant, produits).',
      'SECOURIR : ne retire pas le casque, ne donne pas à boire, parle, couvre, surveille.',
    ],
    source: 'service_public',
  },
  {
    cle: 'gaz',
    nom: 'FUITE DE GAZ / ÉLECTRICITÉ',
    mots: ['gaz', 'odeur de gaz', 'fuite', 'electricite', 'électricité', 'coupure de courant', 'fil electrique', 'electrocution', 'electrise'],
    numero: '0 800 47 33 33',
    etapes: [
      'N’allume et n’éteins RIEN (aucun interrupteur, aucun téléphone sur place) — une étincelle suffit.',
      'Ouvre portes et fenêtres, coupe l’arrivée de gaz si c’est accessible et sans risque.',
      'Sors, éloigne-toi, puis appelle le 0 800 47 33 33 (urgence gaz/électricité) ou le 18.',
      'Ne touche jamais une personne ni un objet en contact avec un fil électrique : coupe le courant d’abord.',
      'Ne rentre pas avant l’accord des secours.',
    ],
    source: 'service_public',
  },
  {
    cle: 'noyade',
    nom: 'NOYADE',
    mots: ['noyade', 'naufrage', 'couler', 'mer', 'piscine', 'sous l’eau', "sous l'eau"],
    numero: '196',
    etapes: [
      'Ne te jette pas à l’eau sans moyen de flottaison : tends une perche, une corde, un gilet.',
      'Alerte : 196 en mer, 18 ailleurs, 112 depuis un portable.',
      'Une personne sortie de l’eau : allonge-la, couvre-la, vérifie la respiration.',
      'Si elle ne respire pas : bouche-à-bouche puis massage cardiaque, défibrillateur dès qu’il arrive.',
      'Même si tout va bien : avis médical obligatoire (risque d’œdème secondaire).',
    ],
    source: 'service_public',
  },
  {
    cle: 'disparition',
    nom: 'PERSONNE DISPARUE',
    mots: ['disparu', 'disparition', 'perdu', 'perdue', 'retrouve', 'introuvable', 'enfant'],
    numero: '17',
    etapes: [
      'Appelle le 17 (ou le 112). Une disparition inquiétante se signale SANS attendre 24 h.',
      'Donne : identité, âge, description, vêtements, dernier lieu et heure connus, photo récente.',
      'Ne déplace rien sur le dernier lieu connu. Rassemble les objets personnels (brochure, téléphone).',
      'Préviens l’entourage et note l’heure exacte de chaque information.',
    ],
    source: 'service_public',
  },
  {
    cle: 'risque_majeur',
    nom: 'RISQUE INDUSTRIEL / CONFINEMENT',
    mots: ['industriel', 'usine', 'seveso', 'chimique', 'toxique', 'nuage', 'confinement', 'evacuation', 'évacuation', 'alerte'],
    numero: '18',
    etapes: [
      'Confinement : rentre immédiatement, ferme portes, fenêtres et aérations, coupe la ventilation.',
      'Écoute la radio / les consignes officielles. Ne téléphone pas (lignes saturées).',
      'Rejoins une pièce sans fenêtre, reste à l’écart des vitres.',
      'Évacuation : suis l’itinéraire indiqué, emporte papiers et médicaments, ne prends pas l’ascenseur.',
      'Consulte la fiche des risques de ta commune sur Géorisques.',
    ],
    source: 'georisques',
  },
  {
    cle: 'brulure',
    nom: 'BRÛLURE',
    mots: ['brulure', 'brûlure', 'brule', 'brûle', 'ebouillante', 'ébouillante', 'electrisation'],
    numero: '15',
    etapes: [
      'Refroidis à l’eau courante tiède (15-20 °C) pendant 10 à 20 minutes, sans glace.',
      'Retire les vêtements autour de la brûlure s’ils n’adhèrent pas (sinon, laisse).',
      'N’applique ni corps gras, ni dentifrice, ni pansement adhésif. Couvre d’un linge propre.',
      'Brûlure étendue, profonde, ou chez l’enfant : appelle le 15.',
    ],
    source: 'sante',
  },
]);

/** Procédure par défaut (aucun motif reconnu). */
export const DEFAUT = 'generale';

/**
 * Choisit la procédure depuis une phrase.
 * @param {string} texte
 * @returns {object} la procédure (jamais null : repli sur « générale »)
 */
export function choisirProcedure(texte = '') {
  const t = String(texte).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let meilleure = null;
  let score = 0;
  for (const p of PROCEDURES) {
    let s = 0;
    for (const m of p.mots) {
      // NB : pas de `\b` dans un gabarit (le moteur le lit comme un
      // retour arrière) — on borne le mot « à la main ».
      if (new RegExp(`(^|[^a-z])${m}`, 'i').test(t)) s += 1;
    }
    // à score égal, une procédure ciblée gagne toujours sur le tronc commun
    if (s > score || (s === score && s > 0 && meilleure?.cle === DEFAUT && p.cle !== DEFAUT)) {
      score = s; meilleure = p;
    }
  }
  return meilleure || PROCEDURES.find((p) => p.cle === DEFAUT);
}

/** Bloc « numéros d'urgence » affiché en tête de chaque réponse. */
export function blocNumeros() {
  return NUMEROS.map((n) => `${n.numero} → ${n.nom} (${n.detail})`).join('\n');
}

/**
 * Construit la liste des ÉTAPES GUIDÉES d'une urgence.
 * @param {object} procedure
 * @param {{destination?:string, distance?:string, duree?:string}} [contexte]
 * @returns {Array<{n:number, texte:string, ic:string}>}
 */
export function etapesGuidees(procedure, contexte = {}) {
  const p = procedure || choisirProcedure('');
  const out = p.etapes.map((texte, i) => ({ n: i + 1, texte, ic: iconeEtape(texte) }));
  if (contexte.destination) {
    out.push({
      n: out.length + 1,
      texte: `Rejoindre ${contexte.destination}${contexte.distance ? ` (${contexte.distance})` : ''} — itinéraire affiché sur la carte.`,
      ic: '🧭',
    });
  }
  return out;
}

function iconeEtape(texte) {
  const t = String(texte || '').toLowerCase();
  if (/appelle|15|17|18|112|alerter/.test(t)) return '📞';
  if (/coupe|ferme|eteins|éteins|n’allume/.test(t)) return '⚡';
  if (/massage|respire|allonge|pls|defibrillateur|défibrillateur/.test(t)) return '🫀';
  if (/sors|sortir|evacu|évacu|refugie|réfugie|monte/.test(t)) return '🚪';
  if (/eau|couvre|refroidis|secourir/.test(t)) return '🩹';
  if (/reste|surveille|parle|attend/.test(t)) return '👁';
  if (/rejoindre|itineraire|itinéraire/.test(t)) return '🧭';
  return '▸';
}

/** Requête Overpass : les secours / lieux utiles autour d'un point. */
export function urlSecoursProche(lat, lon, besoin = 'secours', rayon = 5000) {
  const R = Math.max(200, Math.round(rayon));
  const filtres = {
    hopital: '[amenity~"hospital|clinic"]',
    pharmacie: '[amenity="pharmacy"]',
    pompiers: '[amenity="fire_station"]',
    police: '[amenity~"police|gendarmerie"]',
    secours: '[amenity~"hospital|doctors|pharmacy|fire_station|police"]',
    defibrillateur: '[emergency="defibrillator"]',
    abri: '[amenity="shelter"]',
    mairie: '[amenity="townhall"]',
  };
  const f = filtres[besoin] || filtres.secours;
  const p = `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;
  return `[out:json][timeout:20];(nwr(around:${R},${p})${f};);out center tags 60;`;
}

/** Extrait les lieux utiles d'une réponse Overpass. */
export function lieuxDepuisReponse(json) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const out = [];
  for (const e of els) {
    const lat = Number.isFinite(e.lat) ? e.lat : e.center?.lat;
    const lon = Number.isFinite(e.lon) ? e.lon : e.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const t = e.tags || {};
    out.push({
      id: `${e.type}/${e.id}`,
      nom: String(t.name || '').trim() || (t.amenity === 'hospital' ? 'Hôpital' : t.amenity === 'pharmacy' ? 'Pharmacie' : 'Point de secours'),
      type: t.amenity || t.emergency || '',
      lat, lon,
      telephone: String(t.phone || t['contact:phone'] || '').trim(),
      adresse: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
      urgences: String(t.emergency || '') === 'yes',
    });
  }
  return out;
}

/** Distance orthodromique (m). */
export function distanceM(a, b) {
  const R = 6371000; const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Trie les lieux du plus proche au plus loin. */
export function trierParDistance(lieux = [], lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return lieux.slice();
  return lieux
    .map((l) => ({ ...l, distance: distanceM({ lat, lon }, { lat: l.lat, lon: l.lon }) }))
    .sort((a, b) => a.distance - b.distance);
}

/** Format court d'une distance. */
export function formaterDistance(m) {
  const d = Number(m) || 0;
  return d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1)} km`;
}

/** Format court d'une durée (secondes). */
export function formaterDuree(s) {
  const sec = Math.max(0, Math.round(Number(s) || 0));
  if (sec < 60) return `${sec} s`;
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

/** URL OSRM d'un itinéraire routier (serveur public, sans clé). */
export function urlRoute(depart, arrivee, profil = 'driving') {
  const p = ['walking', 'cycling', 'driving'].includes(profil) ? profil : 'driving';
  const co = (x) => `${Number(x.lon).toFixed(6)},${Number(x.lat).toFixed(6)}`;
  return `https://router.project-osrm.org/route/v1/${p}/${co(depart)};${co(arrivee)}?overview=full&geometries=geojson&steps=true`;
}

/** Résumé lisible d'une réponse OSRM. */
export function resumerRoute(json) {
  const r = json?.routes?.[0];
  if (!r) return null;
  const etapes = [];
  for (const legs of r.legs || []) {
    for (const s of legs.steps || []) {
      const nom = s.name || '';
      // OSRM : la direction est dans `maneuver.modifier`, le geste dans `type`
      const type = String(s.maneuver?.type || '').trim();
      const man = `${String(s.maneuver?.modifier || '')} ${type}`.trim();
      if (type === 'arrive') { etapes.push('Arrivée'); break; }
      if (!nom) continue;
      const verbe = /left/.test(man) ? 'à gauche' : /right/.test(man) ? 'à droite'
        : /straight|continue|new name/.test(man) ? 'tout droit' : 'suivre';
      etapes.push(`${verbe} sur ${nom} (${formaterDistance(s.distance)})`);
    }
  }
  return {
    distance: r.distance || 0,
    duree: r.duration || 0,
    geometrie: r.geometry?.coordinates || [],
    etapes: etapes.slice(0, 12),
  };
}

/** Sous-commandes reconnues après « /urgence ». */
export const SOUS_COMMANDES = Object.freeze({
  fin: ['fin', 'stop', 'quitter', 'sortir', 'termine', 'terminé', 'annule', 'annuler', 'annulation', 'fini'],
  suite: ['suite', 'etape suivante', 'etape', 'suivant', 'apres', 'après', 'continue', 'next', ' suivant'],
  secours: ['secours', 'hopital', 'hôpital', 'pharmacie', 'pompiers', 'police', 'gendarmerie',
    'medecin', 'médecin', 'defibrillateur', 'défibrillateur', 'abri', 'mairie', 'proche', 'proches'],
  itineraire: ['itineraire', 'itinéraire', 'route', 'trajet', 'chemin', 'aller', 'conduis', 'conduire',
    'emmene', 'emmène', 'guide', 'plus rapide', 'y aller'],
});

/** Traduction d'un mot vers le filtre Overpass correspondant. */
const FILTRES_MOTS = Object.freeze({
  hopital: 'hopital', hôpital: 'hopital', pharmacie: 'pharmacie', pompiers: 'pompiers',
  gendarmerie: 'police', police: 'police', medecin: 'secours', médecin: 'secours',
  defibrillateur: 'defibrillateur', défibrillateur: 'defibrillateur', abri: 'abri', mairie: 'mairie',
});

/**
 * Décompose l'argument d'une commande « /urgence … ».
 * @param {string} argument ce qui suit « /urgence » (déjà nettoyé)
 * @returns {{type:'fin'|'suite'|'secours'|'itineraire'|'procedure', valeur:string}}
 */
export function sousCommande(argument = '') {
  const t = String(argument || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (!t) return { type: 'procedure', valeur: '' };
  const mots = t.split(/\s+/).filter(Boolean);

  // mot-clé trouvé (mot simple ou locution comme « etape suivante »)
  const trouve = (liste) => {
    for (const m of liste) {
      if (mots.includes(m)) return m;
      const suite = String(m).split(/\s+/);
      for (let i = 0; i + suite.length <= mots.length; i += 1) {
        if (suite.every((w, k) => mots[i + k] === w)) return m;
      }
    }
    return null;
  };
  // la phrase privée du mot-clé
  const resteDe = (mot) => {
    const suite = String(mot).split(/\s+/);
    for (let i = 0; i + suite.length <= mots.length; i += 1) {
      if (suite.every((w, k) => mots[i + k] === w)) {
        return mots.filter((_, k) => k < i || k >= i + suite.length).join(' ');
      }
    }
    return mots.join(' ');
  };

  for (const cle of ['fin', 'suite', 'itineraire', 'secours']) {
    const mot = trouve(SOUS_COMMANDES[cle]);
    if (!mot) continue;
    const reste = resteDe(mot);
    if (cle === 'secours') {
      const premier = reste.split(/\s+/)[0] || '';
      return { type: 'secours', valeur: FILTRES_MOTS[premier] || FILTRES_MOTS[mot] || 'secours' };
    }
    return { type: cle, valeur: reste };
  }
  return { type: 'procedure', valeur: t };
}

/** Vrai si la clé de source est connue du registre (garde-fou d'affichage). */
export function sourceValide(cle) {
  return sourceConnue(cle) || Boolean(SOURCES[cle]);
}
