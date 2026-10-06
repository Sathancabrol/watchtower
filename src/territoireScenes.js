/**
 * WATCHTOWER — TERRITOIRE : PARTIE PURE (scènes, projection, modèles).
 *
 * Ce fichier ne touche NI au DOM NI à Cesium : il calcule ce que la carte
 * stratégique doit dessiner et ce que l'inspecteur doit dire. `territoire.js`
 * ne fait ensuite que traduire en SVG et brancher la caméra, si bien que toute
 * la logique est testable sous `node:test` (`territoireScenes.test.mjs`).
 *
 * Deux principes tenus ici :
 *  1. le maillage hexagonal est une REPRÉSENTATION aux échelles larges ; à
 *     partir de l'agglomération, ce sont les positions réelles des communes ;
 *  2. tout chiffre vient du bloc de données qui porte sa source ; un aléa
 *     déduit est marqué `déduit` et renvoie vers la source opposable.
 */

import {
  AGGLO, COMMUNES, LENTILLES, PALETTE, QUARTIERS_FRONTIGNAN, REPERES,
  SERIE_FRONTIGNAN, bornes, commune, couleurChoroplethe, densite, filAriane,
  liensCommune, projeter, quartier, risquesCommune,
} from './data/thauTerritoire.js';
import { BASE_LOCALE } from './data/frontignan.js';
import { CONTEXTES, imprevusPourTerrain, top } from './data/imprevusTp.js';
import {
  CHAMPS_RESEAU, TYPES_ENTITE, diagnosticCollection, nomNiveau, niveauAtteint, versCsv,
} from './data/attributsTerritoire.js';

/** Couleurs de base de la carte. */
export const FOND = '#0a1118';
export const FORME = Object.freeze({ fill: '#16222e', hover: '#20303f', selection: '#e3b24a', trait: '#334252' });

/** Chemin SVG d'un hexagone « pointe en haut » centré sur (cx, cy). */
export function hexPath(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
}

/** Grille hexagonale de couverture (nid d'abeille), pour les échelles larges. */
export function grilleHex({ largeur = 740, hauteur = 470, r = 17, marge = 6, decalage = true } = {}) {
  const pasX = r * Math.sqrt(3);
  const pasY = r * 1.5;
  const out = [];
  let rangee = 0;
  for (let cy = r + marge; cy <= hauteur - r - marge; cy += pasY) {
    const shift = decalage && rangee % 2 ? pasX / 2 : 0;
    for (let cx = r + marge + shift; cx <= largeur - r - marge; cx += pasX) {
      out.push({ cx, cy, r, rangee });
    }
    rangee += 1;
  }
  return out;
}

/** Normalise un nuage de points dans un cadre, en conservant les proportions. */
function cadrer(pts, { largeur, hauteur, marge }) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const dispoX = Math.max(1, largeur - 2 * marge);
  const dispoY = Math.max(1, hauteur - 2 * marge);
  const k = Math.min(dispoX / Math.max(1, maxX - minX), dispoY / Math.max(1, maxY - minY));
  return pts.map((p) => ({
    ...p,
    cx: marge + (p.x - minX) * k + (dispoX - (maxX - minX) * k) / 2,
    cy: marge + (p.y - minY) * k + (dispoY - (maxY - minY) * k) / 2,
  }));
}

/**
 * Position des 14 communes : VRAIES coordonnées projetées. C'est ce qui fait
 * ressembler la carte d'agglomération au territoire (Thau au sud-ouest, la
 * Gardiole au nord).
 */
export function positionsCommunes({ largeur = 740, hauteur = 470, marge = 58, echelle = 240 } = {}) {
  const pts = COMMUNES.map((c) => {
    const p = projeter(c.centre.lat, c.centre.lon, { latRef: 43.45, lonRef: 3.70, echelle });
    return { commune: c, x: p.x, y: p.y };
  });
  return cadrer(pts, { largeur, hauteur, marge });
}

/** Position des quartiers de Frontignan (toponymes, positions indicatives). */
export function positionsQuartiers({ largeur = 740, hauteur = 470, marge = 62, echelle = 900 } = {}) {
  const pts = QUARTIERS_FRONTIGNAN.map((q) => {
    const p = projeter(q.centre.lat, q.centre.lon, { latRef: 43.4468, lonRef: 3.7564, echelle });
    return { quartier: q, x: p.x, y: p.y };
  });
  return cadrer(pts, { largeur, hauteur, marge });
}

/**
 * Fiches locales rattachées à une commune, par catégorie de lentille.
 * La base d'amorçage ne couvre QUE Frontignan : les autres communes renvoient
 * 0 — et le module écrit « à importer » plutôt que d'afficher un faux vide.
 */
export function compterFichesLocales(insee, filtre) {
  if (String(insee) !== '34108') return 0;
  const pois = BASE_LOCALE.pois;
  switch (filtre) {
    case 'commerce': return pois.filter((p) => p.categorie === 'commerce').length;
    case 'association': return BASE_LOCALE.associations.length;
    case 'evenement': return BASE_LOCALE.evenements.length;
    case 'reseau': return BASE_LOCALE.reseaux.length;
    case 'nature': return pois.filter((p) => p.categorie === 'nature').length;
    case 'education': return pois.filter((p) => p.categorie === 'education').length;
    case 'urbanisme': case 'chantier': return BASE_LOCALE.transformations.length;
    default: return pois.length;
  }
}

/** Valeur d'une commune pour la lentille active (la métrique qui colore). */
export function valeurLentille(c, lentilleId) {
  const l = LENTILLES.find((x) => x.id === lentilleId);
  if (!l || !c) return null;
  if (l.metrique === 'population') return c.population || null;
  if (l.metrique === 'densite') return densite(c);
  if (l.metrique === 'risques') return (risquesCommune(c.insee) || []).length;
  if (l.metrique === 'fiches') return compterFichesLocales(c.insee, l.filtre);
  return null;
}

/** Couleurs des 14 communes pour la lentille active (choroplèthe). */
export function couleursCommunes(lentilleId) {
  if (lentilleId === 'territoire') return null;
  const valeurs = COMMUNES.map((c) => valeurLentille(c, lentilleId)).filter((v) => Number.isFinite(v));
  if (!valeurs.length) return null;
  const { min, max } = bornes(valeurs);
  return Object.fromEntries(COMMUNES.map((c) => [c.insee, couleurChoroplethe(valeurLentille(c, lentilleId), min, max)]));
}

/**
 * LA SCÈNE — descripteur de ce que la carte dessine.
 * Le rendu DOM ne fait que traduire `formes` en éléments SVG.
 */
export function sceneDe({ niveau = 'epci', lentille = 'territoire', selection = null, largeur = 740, hauteur = 470 } = {}) {
  const formes = [];
  const legende = [];
  const lentilleNom = (LENTILLES.find((l) => l.id === lentille) || {}).nom || '';
  const titre = `${String(niveau).toUpperCase()} — ${lentilleNom}`;

  if (niveau === 'pays' || niveau === 'region') {
    const r = niveau === 'pays' ? 18 : 15;
    const centre = { x: largeur * 0.46, y: hauteur * 0.66 };
    for (const h of grilleHex({ largeur, hauteur, r })) {
      if (h.cx < largeur * 0.12 || h.cx > largeur * 0.88) continue;
      const d = Math.hypot(h.cx - centre.x, h.cy - centre.y);
      const dansOccitanie = d < (niveau === 'pays' ? 82 : 155);
      formes.push({
        forme: 'hex', cx: h.cx, cy: h.cy, r: r - 1,
        fill: dansOccitanie ? '#3f8f92' : '#16222e',
        id: dansOccitanie ? 'occitanie' : null,
        etiquette: dansOccitanie ? 'OCCITANIE' : '',
      });
    }
    legende.push({ couleur: '#3f8f92', texte: 'Occitanie (maillage = représentation)' });
    formes.push({ forme: 'texte', x: largeur - 26, y: 30, text: niveau === 'pays' ? 'FRANCE' : 'OCCITANIE', classe: 'titre-carte', ancre: 'end' });
  }

  if (niveau === 'departement') {
    for (const h of grilleHex({ largeur, hauteur, r: 15 })) {
      const d = Math.hypot(h.cx - largeur * 0.5, h.cy - hauteur * 0.62);
      if (d > 175) continue;
      formes.push({ forme: 'hex', cx: h.cx, cy: h.cy, r: 13, fill: '#2a5d6e', id: 'herault' });
    }
    legende.push({ couleur: '#2a5d6e', texte: 'Hérault' });
    formes.push({ forme: 'texte', x: largeur - 26, y: 30, text: 'HÉRAULT', classe: 'titre-carte', ancre: 'end' });
  }

  if (niveau === 'epci') {
    const couleurs = couleursCommunes(lentille);
    for (const p of positionsCommunes({ largeur, hauteur })) {
      const c = p.commune;
      const choisie = selection === c.insee;
      const valeur = valeurLentille(c, lentille);
      formes.push({
        forme: 'hex', cx: p.cx, cy: p.cy, r: 26,
        fill: choisie ? FORME.selection : (couleurs?.[c.insee] || FORME.fill),
        stroke: choisie ? '#ffffff' : FORME.trait,
        id: c.insee,
        etiquette: c.nom,
        sousEtiquette: lentille === 'population' ? `${Number(c.population).toLocaleString('fr-FR')} hab.`
          : lentille === 'densite' ? `${densite(c)}/km²`
            : lentille === 'risques' ? `${(risquesCommune(c.insee) || []).length} aléas`
              : Number.isFinite(valeur) && valeur ? String(valeur) : '',
      });
    }
    legende.push({ couleur: '#3f8f92', texte: 'commune — vraies positions (couleur = lentille)' });
    formes.push({ forme: 'texte', x: 14, y: 22, text: 'SÈTE AGGLOPÔLE MÉDITERRANÉE — 14 COMMUNES', classe: 'titre-carte', ancre: 'start' });
  }

  if (niveau === 'commune') {
    // Les quartiers ne sont documentés QUE pour Frontignan : sur une autre
    // commune, le panneau l'écrit au lieu de dessiner ceux de la ville voisine.
    if (String(selection) === '34108') {
      const teintes = [PALETTE[2], PALETTE[3], PALETTE[4], PALETTE[3], PALETTE[2]];
      positionsQuartiers({ largeur, hauteur }).forEach((p, i) => {
        const q = p.quartier;
        const choisie = selection === q.id;
        formes.push({
          forme: 'hex', cx: p.cx, cy: p.cy, r: 30,
          fill: choisie ? FORME.selection : teintes[i % teintes.length],
          stroke: choisie ? '#ffffff' : FORME.trait,
          id: q.id,
          etiquette: q.nom,
        });
      });
      for (const r of REPERES) {
        if (!(r.communes || []).includes('34108')) continue;
        const p = projeter(r.centre.lat, r.centre.lon, { latRef: 43.4468, lonRef: 3.7564, echelle: 900 });
        const x = largeur / 2 + p.x * 0.55;
        const y = hauteur / 2 + p.y * 0.55;
        if (x < 12 || x > largeur - 12 || y < 12 || y > hauteur - 12) continue;
        formes.push({ forme: 'repere', x, y, text: r.nom });
      }
      formes.push({ forme: 'texte', x: 14, y: 22, text: 'FRONTIGNAN — QUARTIERS (positions indicatives)', classe: 'titre-carte', ancre: 'start' });
      legende.push({ couleur: '#2a5d6e', texte: 'quartier (toponyme)' });
      legende.push({ couleur: '#7dd3c8', texte: 'repère géographique' });
    } else {
      const c = commune(selection) || {};
      const nom = c.nom || 'Cette commune';
      for (const [i, texte] of [
        `${nom.toUpperCase()} — QUARTIERS IRIS À IMPORTER`,
        'La base d’amorçage ne documente que les quartiers de Frontignan.',
        'Le contour officiel d’un quartier est un IRIS (INSEE) ou un quartier de la ville.',
        'Descendre ici = cadastre (parcelles) + bâti 3D + entités réelles.',
      ].entries()) {
        formes.push({
          forme: 'texte', x: largeur / 2, y: hauteur / 2 - 30 + i * 24,
          taille: i === 0 ? 13 : 10, text: texte, texteAncre: 'middle',
          classe: i === 0 ? 'grand' : 'texte-carte',
        });
      }
      legende.push({ couleur: '#e3b24a', texte: 'quartiers à importer pour cette commune' });
    }
  }

  if (niveau === 'quartier') {
    const q = quartier(selection);
    const lignes = q ? [
      { text: q.nom, taille: 15, y: hauteur / 2 - 44, classe: 'grand' },
      { text: `Traits : ${(q.traits || []).join(' · ')}`, taille: 10, y: hauteur / 2 - 16 },
      { text: 'Descendre ici = cadastre (parcelles) + bâti 3D + entités réelles.', taille: 10, y: hauteur / 2 + 8 },
      { text: 'C’est le seuil où le maillage disparaît : la géométrie devient vraie.', taille: 10, y: hauteur / 2 + 28 },
    ] : [
      { text: 'QUARTIER À IMPORTER', taille: 15, y: hauteur / 2 - 44, classe: 'grand' },
      { text: 'Aucun quartier documenté pour cette sélection dans la base d’amorçage.', taille: 10, y: hauteur / 2 - 16 },
      { text: 'Descendre ici = cadastre (parcelles) + bâti 3D + entités réelles.', taille: 10, y: hauteur / 2 + 8 },
      { text: 'Le module préfère un trou visible à un contour inventé.', taille: 10, y: hauteur / 2 + 28 },
    ];
    for (const l of lignes) {
      formes.push({ forme: 'texte', x: largeur / 2, y: l.y, taille: l.taille, text: l.text, texteAncre: 'middle', classe: l.classe || 'texte-carte' });
    }
    formes.push({ forme: 'texte', x: largeur - 20, y: 26, text: 'PARCELLE / OBJET', classe: 'titre-carte', ancre: 'end' });
  }

  return { titre, formes, legende };
}

/** Contexte de terrain d'une commune — sert à filtrer la base d'imprévus TP. */
export function contexteDeCommune(insee) {
  const c = commune(insee) || { littoral: false, lagune: false, gardiole: false };
  if (c.littoral) return 'littoral';
  if (c.lagune) return 'lagune';
  if (c.gardiole) return 'massif';
  return 'viticole';
}

/** Nom lisible d'un contexte de terrain. */
export function nomContexte(id) {
  return (CONTEXTES.find((c) => c.id === id) || {}).nom || String(id || '');
}

/** Le modèle de l'inspecteur : ce que le panneau de droite affiche. */
export function ficheTerritoire(insee, lentille = 'territoire') {
  const c = commune(insee);
  if (!c) {
    return {
      titre: AGGLO.nom,
      type: 'Intercommunalité',
      lignes: [
        ['Siège', AGGLO.siege],
        ['Communes', String(AGGLO.nbCommunes)],
        ['Population', `${Number(AGGLO.population).toLocaleString('fr-FR')} hab. (${AGGLO.millesimePopulation})`],
        ['Superficie', `${AGGLO.superficieKm2} km²`],
        ['SIREN', AGGLO.siren],
        ['Création', AGGLO.creation],
      ],
      note: 'Population publiée (BANATIC/INSEE), pas un recalcul. Aucune donnée politique : les élus vivent dans le RNE et le BANATIC.',
      liens: [{ nom: 'BANATIC — composition et compétences', url: AGGLO.verif }],
      sources: ['BANATIC', 'INSEE'],
    };
  }
  const fiche = {
    titre: c.nom,
    type: `Commune — ${c.gentile}`,
    lignes: [
      ['INSEE', c.insee],
      ['Code postal', c.codePostal],
      ['Population', `${Number(c.population).toLocaleString('fr-FR')} hab. (${c.millesimePopulation})`],
      ['Superficie', `${c.superficieKm2} km²`],
      ['Densité', `${densite(c)} hab./km²`],
      ['Conseil agglo', `${c.sieges} siège(s)`],
      ['Rôle', c.role],
      ['Quartiers', c.insee === '34108' ? String(QUARTIERS_FRONTIGNAN.length) : '—'],
    ],
    note: 'Population de référence INSEE, superficie BANATIC/Wikipédia. Le détail quartier par quartier passe par les IRIS.',
    liens: liensCommune(c.insee),
    sources: ['INSEE', 'BANATIC', 'Géorisques'],
  };
  if (lentille === 'risques') {
    fiche.risques = risquesCommune(c.insee);
    fiche.note = 'Aléas DÉDUITS des traits du territoire (littoral, lagune, massif) — à confirmer commune par commune sur Géorisques, seule source opposable.';
  }
  if (lentille === 'imprevus') {
    const contexte = contexteDeCommune(c.insee);
    const r = imprevusPourTerrain({ contexte });
    fiche.contexteImprevu = contexte;
    fiche.nomContexte = nomContexte(contexte);
    fiche.imprevus = r.problemes.slice(0, 6);
    fiche.cascades = r.cascades.slice(0, 3);
    fiche.note = `Contexte « ${nomContexte(contexte)} » : ${r.total} fiches d’imprévus correspondantes dans la base d’amorçage.`;
  }
  return fiche;
}

/** Fil d'Ariane textuel pour un niveau et une sélection. */
export function filDuNiveau(niveau, selection) {
  const tronçons = filAriane({ insee: selection }).split(' › ');
  if (niveau === 'pays') return tronçons[0];
  if (niveau === 'region') return tronçons.slice(0, 2).join(' › ');
  if (niveau === 'departement') return tronçons.slice(0, 3).join(' › ');
  if (niveau === 'epci') return filAriane().split(' › ').slice(0, 4).join(' › ');
  if (niveau === 'commune') return tronçons.slice(0, 5).join(' › ');
  const q = quartier(selection);
  return `FRANCE › OCCITANIE › HÉRAULT › ${AGGLO.nom.toUpperCase()} › FRONTIGNAN › ${String(q?.nom || '').toUpperCase()}`;
}

/** La frise temporelle : série réelle puis prolongation explicitement marquée. */
export function friseTemporelle() {
  const debut = SERIE_FRONTIGNAN[0];
  const fin = SERIE_FRONTIGNAN[SERIE_FRONTIGNAN.length - 1];
  const pente = (fin.population - debut.population) / Math.max(1, fin.annee - debut.annee);
  return {
    debut: debut.annee,
    fin: fin.annee,
    horizon: 2040,
    points: [...SERIE_FRONTIGNAN],
    projection: (annee) => Math.round(fin.population + pente * (Number(annee) - fin.annee)),
    source: 'INSEE — populations légales (1968 → 2023)',
    avertissement: 'Au-delà de 2023 : simple prolongation de la tendance, PAS une prévision.',
  };
}

const videChamp = (v) => v === null || v === undefined || v === ''
  || (Array.isArray(v) && v.length === 0);

/**
 * Diagnostic d'une table de réseaux. Le schéma des réseaux vit dans
 * `CHAMPS_RESEAU` (il est trop technique pour les briques communes) : on
 * applique donc ici la même règle de complétude, niveau par niveau.
 */
export function diagnosticReseau(liste = []) {
  const niveaux = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const compteur = new Map();
  for (const fiche of liste) {
    let atteint = 0;
    for (let n = 1; n <= 5; n += 1) {
      const duNiveau = CHAMPS_RESEAU.filter((c) => Number(c.niveau) === n);
      if (!duNiveau.length) continue;
      if (duNiveau.every((c) => !videChamp(fiche?.[c.cle]))) atteint = n;
      else break;
    }
    niveaux[atteint] += 1;
    for (const c of CHAMPS_RESEAU) {
      if (Number(c.niveau) === 1 && videChamp(fiche?.[c.cle])) {
        compteur.set(c.cle, (compteur.get(c.cle) || 0) + 1);
      }
    }
  }
  return {
    type: 'reseau',
    total: liste.length,
    niveaux,
    manquants: [...compteur.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([cle, n]) => ({ cle, n })),
  };
}

/** CSV d'une table de réseaux (en-tête = colonnes de `CHAMPS_RESEAU`). */
export function versCsvReseau(liste = []) {
  const colonnes = CHAMPS_RESEAU.map((c) => c.cle);
  const cellule = (v) => {
    if (v === null || v === undefined) return '';
    const t = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lignes = [colonnes.join(';')];
  for (const fiche of liste) lignes.push(colonnes.map((c) => cellule(fiche?.[c])).join(';'));
  return lignes.join('\n');
}

/** Complétude des tables de la base locale (niveaux 1 → 5). */
export function completudeBase() {
  const tables = [
    ['poi', BASE_LOCALE.pois], ['association', BASE_LOCALE.associations],
    ['evenement', BASE_LOCALE.evenements], ['reseau', BASE_LOCALE.reseaux],
    ['transformation', BASE_LOCALE.transformations], ['media', BASE_LOCALE.medias],
  ];
  return tables.map(([type, liste]) => {
    const d = type === 'reseau' ? diagnosticReseau(liste) : diagnosticCollection(liste, type);
    return {
      type,
      nom: type === 'reseau' ? 'Réseau technique' : (TYPES_ENTITE[type]?.nom || type),
      total: liste.length,
      niveaux: d.niveaux,
      manquants: d.manquants.slice(0, 4),
    };
  });
}

/** CSV d'une table de la base locale (en-tête = schéma). */
export function csvTable(type) {
  const map = {
    poi: BASE_LOCALE.pois,
    association: BASE_LOCALE.associations,
    evenement: BASE_LOCALE.evenements,
    reseau: BASE_LOCALE.reseaux,
    transformation: BASE_LOCALE.transformations,
    media: BASE_LOCALE.medias,
  };
  if (type === 'reseau') return versCsvReseau(map.reseau || []);
  return versCsv(map[type] || [], type);
}

/** Les 12 chantiers/transformations les plus « lourds » à montrer dans la frise. */
export function transformationsMarquees() {
  return BASE_LOCALE.transformations.slice(0, 6);
}

/** Niveau de complétude lisible d'une fiche (utilisé par l'inspecteur). */
export function niveauLisible(fiche, type) {
  return nomNiveau(niveauAtteint(fiche, type));
}

/** Top des imprévus pour un contexte (raccourci utilisé par le panneau). */
export function meilleursImprevus(contexte, n = 8) {
  const liste = imprevusPourTerrain({ contexte }).problemes;
  return liste.length ? liste : top(n, 'gravite');
}
