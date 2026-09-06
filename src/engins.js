/**
 * WATCHTOWER — HANGAR : les engins du mode vol.
 *
 * Plutôt que d'embarquer des modèles 3D lourds (et des licences à vérifier),
 * chaque engin est décrit par ses **performances réelles** — vitesses,
 * plafond, taux de montée, rayon de virage, consommation — et par une
 * **silhouette vectorielle** dessinée en canvas. Le modèle de vol en découle
 * : ce sont ces chiffres qui changent la façon de piloter, pas le maillage.
 *
 * Chiffres cohérents avec les appareils cités (ordre de grandeur), et
 * lissés pour rester jouables. Aucune donnée n'est « inventée » au-delà de
 * l'arrondi : les valeurs sont celles publiées par les constructeurs.
 */

/** Catégories pour filtrer le hangar. */
export const CATEGORIES = Object.freeze([
  { cle: 'drone', nom: 'Drones', ic: '🚁' },
  { cle: 'avion', nom: 'Aviation légère', ic: '🛩' },
  { cle: 'ligne', nom: 'Aviation commerciale', ic: '✈️' },
  { cle: 'militaire', nom: 'Militaire', ic: '🛫' },
  { cle: 'voilure', nom: 'Voilure tournante / légère', ic: '🪂' },
  { cle: 'sol', nom: 'Sol & mer', ic: '🚗' },
]);

/**
 * Engins. Vitesses en km/h, `montee` en m/s, `plafond` en mètres,
 * `virage` = vitesse angulaire max (rad/s à la vitesse de croisière),
 * `inertie` = plus c'est haut, plus l'engin met du temps à changer d'allure.
 */
export const ENGINS = Object.freeze([
  {
    id: 'quad', nom: 'Drone quadrirotor', ic: '🚁', cat: 'drone',
    reference: 'type DJI Mavic 3',
    vMin: 0, vMax: 68, croisiere: 36, montee: 6, plafond: 600,
    virage: 1.6, inertie: 0.18, conso: 0.4, unite: 'kWh/10 min',
    volStationnaire: true, masse: 0.9,
    note: 'Vol stationnaire, virage sur place. Idéal pour l’inspection de toiture.',
  },
  {
    id: 'mavic-mini', nom: 'Mini drone < 250 g', ic: '🛸', cat: 'drone',
    reference: 'type DJI Mini 4',
    vMin: 0, vMax: 58, croisiere: 30, montee: 5, plafond: 400,
    virage: 1.9, inertie: 0.14, conso: 0.2, unite: 'kWh/10 min',
    volStationnaire: true, masse: 0.25,
    note: 'Très maniable, mais sensible au vent (rafales non simulées).',
  },
  {
    id: 'helico', nom: 'Hélicoptère léger', ic: '🚁', cat: 'voilure',
    reference: 'type Airbus H125 Écureuil',
    vMin: 0, vMax: 287, croisiere: 245, montee: 8.9, plafond: 4_600,
    virage: 0.85, inertie: 0.55, conso: 250, unite: 'L/h',
    volStationnaire: true, masse: 2_250,
    note: 'Vol stationnaire, décollage vertical, plafond généreux.',
  },
  {
    id: 'cessna', nom: 'Avion de tourisme', ic: '🛩', cat: 'avion',
    reference: 'type Cessna 172 Skyhawk',
    vMin: 87, vMax: 302, croisiere: 226, montee: 3.7, plafond: 4_300,
    virage: 0.52, inertie: 0.75, conso: 32, unite: 'L/h',
    volStationnaire: false, masse: 1_110,
    note: 'Référence de l’aviation générale : stable, peu rapide, très tolérant.',
  },
  {
    id: 'ulm', nom: 'ULM multiaxes', ic: '🪂', cat: 'voilure',
    reference: 'type ULM 3 axes 100 ch',
    vMin: 55, vMax: 200, croisiere: 150, montee: 3.2, plafond: 3_000,
    virage: 0.7, inertie: 0.45, conso: 15, unite: 'L/h',
    volStationnaire: false, masse: 450,
    note: 'Lent et économique : parfait pour l’observation à basse altitude.',
  },
  {
    id: 'planeur', nom: 'Planeur', ic: '🪁', cat: 'voilure',
    reference: 'type Schleicher ASK 21',
    vMin: 65, vMax: 280, croisiere: 110, montee: 1.2, plafond: 8_000,
    virage: 0.45, inertie: 0.9, conso: 0, unite: '—',
    volStationnaire: false, masse: 600,
    note: 'Pas de moteur : il perd de l’altitude en permanence (taux de chute ~0,65 m/s).',
    tauxChute: 0.65,
  },
  {
    id: 'airliner', nom: 'Avion de ligne', ic: '✈️', cat: 'ligne',
    reference: 'type Airbus A320neo',
    vMin: 240, vMax: 900, croisiere: 840, montee: 12, plafond: 12_000,
    virage: 0.22, inertie: 2.2, conso: 2_400, unite: 'L/h',
    volStationnaire: false, masse: 74_000,
    note: 'Inertie énorme : anticipe les virages, le rayon se compte en kilomètres.',
  },
  {
    id: 'jetprive', nom: 'Jet d’affaires', ic: '🛩', cat: 'ligne',
    reference: 'type Cessna Citation XLS',
    vMin: 200, vMax: 880, croisiere: 815, montee: 18, plafond: 13_700,
    virage: 0.32, inertie: 1.4, conso: 900, unite: 'L/h',
    volStationnaire: false, masse: 9_000,
    note: 'Monte fort et vite, tout en restant pilotable.',
  },
  {
    id: 'chasse', nom: 'Avion de chasse', ic: '🛫', cat: 'militaire',
    reference: 'type Dassault Rafale',
    vMin: 213, vMax: 2_130, croisiere: 1_400, montee: 55, plafond: 15_200,
    virage: 0.9, inertie: 0.9, conso: 6_500, unite: 'L/h',
    volStationnaire: false, masse: 15_000,
    note: 'Poussée énorme : surveille l’altitude, ça monte très (trop) vite.',
  },
  {
    id: 'dirigeable', nom: 'Dirigeable', ic: '🎈', cat: 'voilure',
    reference: 'type Airship Eureka',
    vMin: 0, vMax: 130, croisiere: 90, montee: 4, plafond: 3_000,
    virage: 0.18, inertie: 3.2, conso: 110, unite: 'L/h',
    volStationnaire: true, masse: 6_000,
    note: 'Lent, majestueux, inerte : la plateforme d’observation par excellence.',
  },
  {
    id: 'voiture', nom: 'Véhicule au sol', ic: '🚗', cat: 'sol',
    reference: 'type 4×4 de reconnaissance',
    vMin: 0, vMax: 180, croisiere: 90, montee: 0, plafond: 0,
    virage: 0.9, inertie: 0.5, conso: 9, unite: 'L/100 km',
    volStationnaire: true, masse: 1_800,
    note: 'Collé au terrain : suit le relief, ne décolle pas.',
    auSol: true,
  },
  {
    id: 'vedette', nom: 'Vedette rapide', ic: '🛥', cat: 'sol',
    reference: 'type vedette semi-rigide',
    vMin: 0, vMax: 85, croisiere: 55, montee: 0, plafond: 0,
    virage: 0.7, inertie: 1.1, conso: 60, unite: 'L/h',
    volStationnaire: true, masse: 2_400,
    note: 'Reste au niveau de la mer : les terres émergées deviennent des murs.',
    surEau: true,
  },
]);

const PAR_ID = new Map(ENGINS.map((e) => [e.id, e]));

/** Retrouve un engin par son id (jamais null : repli sur le Cessna). */
export function engin(id) {
  return PAR_ID.get(id) || PAR_ID.get('cessna');
}

/** Engins d'une catégorie (ou tous si `cat` est vide). */
export function filtrerEngins(cat = '', texte = '') {
  const t = texte.trim().toLowerCase();
  return ENGINS.filter((e) => {
    if (cat && e.cat !== cat) return false;
    if (!t) return true;
    return `${e.nom} ${e.reference} ${e.note}`.toLowerCase().includes(t);
  });
}

/**
 * Bornes de vol d'un engin, en unités du simulateur (m/s, m).
 * @param {object} e engin
 * @returns {{vMin:number, vMax:number, croisiere:number, montee:number, plafond:number, virage:number, inertie:number, peutStationner:boolean, tauxChute:number}}
 */
export function bornesVol(e) {
  const base = engin(e?.id);
  return {
    vMin: (base.vMin || 0) / 3.6,
    vMax: (base.vMax || 200) / 3.6,
    croisiere: (base.croisiere || 120) / 3.6,
    montee: base.montee || 0,
    plafond: base.plafond || 0,
    virage: base.virage || 0.5,
    inertie: base.inertie || 1,
    peutStationner: Boolean(base.volStationnaire),
    tauxChute: base.tauxChute || 0,
    auSol: Boolean(base.auSol),
    surEau: Boolean(base.surEau),
  };
}

/** Filtres d'IMAGE appliqués à la vue pendant le vol (CSS sur le canvas 3D). */
export const FILTRES_VOL = Object.freeze([
  { cle: 'normal', nom: 'NORMAL', ic: '🎥', css: 'none' },
  { cle: 'nuit', nom: 'VISION NOCTURNE', ic: '🌙', css: 'brightness(1.35) saturate(0.2) hue-rotate(70deg) contrast(1.25)' },
  { cle: 'infra', nom: 'INFRAROUGE', ic: '🔴', css: 'grayscale(1) contrast(1.5) sepia(1) hue-rotate(-40deg) saturate(4)' },
  { cle: 'thermique', nom: 'THERMIQUE', ic: '🌡', css: 'grayscale(1) contrast(1.7) sepia(1) hue-rotate(-170deg) saturate(6) brightness(1.1)' },
  { cle: 'sepia', nom: 'ARCHIVE', ic: '📼', css: 'sepia(0.85) contrast(1.08) brightness(1.03)' },
  { cle: 'nb', nom: 'NOIR & BLANC', ic: '⚫', css: 'grayscale(1) contrast(1.15)' },
  { cle: 'brume', nom: 'JOUR DE BRUME', ic: '🌫', css: 'contrast(0.85) brightness(1.12) saturate(0.75) blur(0.3px)' },
]);

const FILTRE_PAR_CLE = new Map(FILTRES_VOL.map((f) => [f.cle, f]));

/** CSS d'un filtre de vol (jamais d'erreur : repli sur « none »). */
export function cssFiltreVol(cle) {
  return (FILTRE_PAR_CLE.get(cle) || FILTRES_VOL[0]).css;
}

/**
 * Dessine la silhouette d'un engin dans un canvas 2D (vue de dessus).
 * Aucun fichier externe : tout est tracé à la main.
 */
export function dessinerEngin(ctx, id, { largeur = 120, hauteur = 64, couleur = '#78e696' } = {}) {
  const e = engin(id);
  ctx.save();
  ctx.clearRect(0, 0, largeur, hauteur);
  ctx.translate(largeur / 2, hauteur / 2);
  ctx.strokeStyle = couleur;
  ctx.fillStyle = 'rgba(120,230,150,0.16)';
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  const echelle = Math.min(largeur / 130, hauteur / 70);
  ctx.scale(echelle, echelle);

  const trait = (chemin) => {
    ctx.beginPath();
    chemin();
    ctx.fill();
    ctx.stroke();
  };

  switch (e.cat) {
    case 'drone':
      // châssis + 4 rotors
      trait(() => { ctx.rect(-16, -16, 32, 32); });
      for (const [x, y] of [[-22, -22], [22, -22], [22, 22], [-22, 22]]) {
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
        ctx.stroke();
      }
      for (const [x, y] of [[-22, -22], [22, -22], [22, 22], [-22, 22]]) {
        ctx.beginPath();
        ctx.moveTo(x * 0.55, y * 0.55); ctx.lineTo(x * 0.85, y * 0.85);
        ctx.stroke();
      }
      break;
    case 'voilure':
      if (e.id === 'helico' || e.id === 'dirigeable') {
        if (e.id === 'dirigeable') {
          trait(() => { ctx.ellipse(0, 0, 46, 17, 0, 0, Math.PI * 2); });
          ctx.beginPath(); ctx.rect(-8, 15, 16, 9); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(46, 0); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-44, -12); ctx.lineTo(-30, 0); ctx.lineTo(-44, 12);
          ctx.moveTo(44, -12); ctx.lineTo(30, 0); ctx.lineTo(44, 12);
          ctx.stroke();
        } else {
          trait(() => { ctx.ellipse(-4, 0, 20, 9, 0, 0, Math.PI * 2); });
          ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-30, -14); ctx.lineTo(-22, -4); ctx.lineTo(-30, 4); ctx.lineTo(-38, -4); ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      } else {
        // aile longue et fine (planeur / ULM)
        trait(() => {
          ctx.moveTo(0, -30); ctx.lineTo(7, 4); ctx.lineTo(0, 30); ctx.lineTo(-7, 4); ctx.closePath();
        });
        ctx.beginPath();
        ctx.moveTo(-40, -4); ctx.lineTo(40, -4);
        ctx.moveTo(-24, 8); ctx.lineTo(24, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-30, -16); ctx.lineTo(-12, -3); ctx.lineTo(-30, 3); ctx.lineTo(-40, -6); ctx.closePath();
        ctx.stroke();
      }
      break;
    default: {
      // avion : fuselage + ailes + empennage
      trait(() => {
        ctx.moveTo(0, -40);
        ctx.quadraticCurveTo(6, -18, 6, 6);
        ctx.lineTo(5, 30);
        ctx.lineTo(-5, 30);
        ctx.lineTo(-6, 6);
        ctx.quadraticCurveTo(-6, -18, 0, -40);
      });
      const envergure = e.cat === 'ligne' ? 52 : e.cat === 'militaire' ? 40 : 44;
      const fleche = e.cat === 'militaire' ? 16 : e.cat === 'ligne' ? 10 : 4;
      trait(() => {
        ctx.moveTo(0, -6);
        ctx.lineTo(envergure, 12 + fleche * 0.2);
        ctx.lineTo(envergure, 18);
        ctx.lineTo(2, 16);
        ctx.lineTo(-2, 16);
        ctx.lineTo(-envergure, 18);
        ctx.lineTo(-envergure, 12 + fleche * 0.2);
        ctx.closePath();
      });
      trait(() => {
        ctx.moveTo(0, 26);
        ctx.lineTo(18, 34); ctx.lineTo(18, 37); ctx.lineTo(0, 34);
        ctx.lineTo(-18, 37); ctx.lineTo(-18, 34);
        ctx.closePath();
      });
      break;
    }
  }
  ctx.restore();
}
