// src/data/thauTerritoire.test.mjs — socle territorial du module TERRITOIRE.
//
// Le module promet des chiffres SOURCÉS : ces tests vérifient la cohérence
// interne (hiérarchie, unicité, bornes géographiques, recalculs) et les
// fonctions pures utilisées par la carte stratégique.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGGLO, COMMUNES, LENTILLES, NIVEAUX, PALETTE, QUARTIERS_FRONTIGNAN, REPERES,
  RISQUES_PAR_COMMUNE, SERIE_FRONTIGNAN, bornes, chemin, classerCommunes,
  commune, couleurChoroplethe, densite, distanceM, filAriane, liensCommune,
  populationTotale, projeter, quartier, repere, risquesCommune,
} from './thauTerritoire.js';

test('les sept niveaux de lecture vont du pays à la parcelle', () => {
  assert.deepEqual(
    NIVEAUX.map((n) => n.id),
    ['pays', 'region', 'departement', 'epci', 'commune', 'quartier', 'parcelle'],
  );
  for (const n of NIVEAUX) {
    assert.ok(n.nom && n.icone && n.aide, `niveau ${n.id} incomplet`);
    assert.ok(n.echelle > 0);
  }
  // L'échelle est de plus en plus fine : on ne « dé-zoome » jamais en descendant.
  for (let i = 1; i < NIVEAUX.length; i += 1) {
    assert.ok(NIVEAUX[i].echelle > NIVEAUX[i - 1].echelle, `${NIVEAUX[i].id} doit être plus fin`);
  }
});

test('l’agglomération porte son identité BANATIC et ses 14 communes', () => {
  assert.equal(AGGLO.siren, '200066355');
  assert.equal(AGGLO.nbCommunes, COMMUNES.length);
  assert.equal(COMMUNES.length, 14);
  assert.equal(AGGLO.siege, 'Frontignan');
  assert.match(AGGLO.verif, /banatic\.interieur\.gouv\.fr/);
  assert.equal(AGGLO.confiance, 'documenté');
});

test('chaque commune est identifiée, bornée à l’Hérault et complète', () => {
  const insee = new Set();
  const noms = new Set();
  for (const c of COMMUNES) {
    assert.match(c.insee, /^\d{5}$/, `${c.nom} : code INSEE`);
    assert.match(c.codePostal, /^34\d{3}$/, `${c.nom} : code postal de l’Hérault`);
    assert.ok(!insee.has(c.insee), `INSEE en double : ${c.insee}`);
    assert.ok(!noms.has(c.nom), `nom en double : ${c.nom}`);
    insee.add(c.insee);
    noms.add(c.nom);
    assert.ok(c.population > 0 && Number.isFinite(c.population), `${c.nom} : population`);
    assert.ok(c.superficieKm2 > 0, `${c.nom} : superficie`);
    assert.ok(Number.isInteger(c.sieges) && c.sieges >= 1, `${c.nom} : sièges`);
    // Bornes larges de l'Hérault : une coordonnée hors de là est une saisie
    // douteuse, donc on la refuse plutôt que de la cartographier.
    assert.ok(c.centre.lat > 42.9 && c.centre.lat < 43.75, `${c.nom} : latitude ${c.centre.lat}`);
    assert.ok(c.centre.lon > 3.0 && c.centre.lon < 4.2, `${c.nom} : longitude ${c.centre.lon}`);
    assert.ok(c.role && c.gentile, `${c.nom} : rôle et gentilé`);
  }
});

test('la population de l’agglomération est le total de ses communes', () => {
  assert.equal(populationTotale(), AGGLO.population);
  assert.equal(populationTotale(), 131_216);
  const frontignan = commune('34108');
  assert.equal(frontignan.nom, 'Frontignan');
  assert.equal(frontignan.population, 24_136);
});

test('la densité est calculée, jamais inventée', () => {
  const frontignan = commune('34108');
  assert.equal(densite(frontignan), Math.round(24_136 / 31.72));
  assert.equal(densite({}), null);
  assert.equal(densite(null), null);
  assert.equal(commune('99999'), null);
});

test('classerCommunes trie vraiment selon la lentille', () => {
  const parPopulation = classerCommunes('population');
  assert.equal(parPopulation[0].nom, 'Sète');
  assert.equal(parPopulation[parPopulation.length - 1].nom, 'Bouzigues');
  const asc = classerCommunes('population', 'asc');
  assert.equal(asc[0].nom, 'Bouzigues');
  const parDensite = classerCommunes('densite');
  for (let i = 1; i < parDensite.length; i += 1) {
    assert.ok(densite(parDensite[i - 1]) >= densite(parDensite[i]), 'densités non décroissantes');
  }
});

test('les quartiers et les repères de Frontignan sont identifiables', () => {
  assert.equal(QUARTIERS_FRONTIGNAN.length, 11);
  const ids = new Set();
  for (const q of QUARTIERS_FRONTIGNAN) {
    assert.match(q.id, /^q-/, `${q.nom} : identifiant`);
    assert.ok(!ids.has(q.id), `quartier en double : ${q.id}`);
    ids.add(q.id);
    assert.ok(q.centre.lat > 43.42 && q.centre.lat < 43.47, `${q.nom} : latitude`);
    assert.ok(q.centre.lon > 3.72 && q.centre.lon < 3.81, `${q.nom} : longitude`);
    assert.ok(Array.isArray(q.traits) && q.traits.length > 0, `${q.nom} : traits`);
  }
  assert.equal(quartier('q-coeur-ville').nom, 'Cœur de ville / Anatole-France');
  assert.equal(quartier('q-inconnu'), null);

  const insee = new Set(COMMUNES.map((c) => c.insee));
  assert.equal(REPERES.length, 7);
  for (const r of REPERES) {
    assert.ok(r.nom && r.type && r.note, `repère ${r.id} incomplet`);
    for (const i of r.communes) assert.ok(insee.has(i), `repère ${r.id} : commune inconnue ${i}`);
  }
  assert.equal(repere('rep-thau').type, 'lagune');
  assert.equal(repere('rep-inconnu'), null);
});

test('les aléas sont déduits des traits et renvoient à Géorisques', () => {
  const frontignan = risquesCommune('34108'); // littoral + lagune + Gardiole
  const cles = frontignan.map((r) => r.cle);
  assert.ok(cles.includes('inondation'));
  assert.ok(cles.includes('submersion'));
  assert.ok(cles.includes('incendie'));
  assert.ok(cles.includes('secheresse'));
  const sete = risquesCommune('34301'); // littoral et lagune, pas la Gardiole
  assert.ok(!sete.some((r) => r.cle === 'incendie'));
  for (const r of frontignan) {
    assert.equal(r.confiance, 'déduit', 'un aléa déduit doit être marqué comme tel');
    assert.match(r.verif, /georisques\.gouv\.fr/);
  }
  assert.deepEqual(risquesCommune('99999'), []);
  assert.ok(Object.keys(RISQUES_PAR_COMMUNE).length >= 4);
});

test('le fil d’Ariane suit la hiérarchie France → commune → quartier', () => {
  assert.equal(
    filAriane({ insee: '34108' }),
    'France › Occitanie › Hérault › Sète Agglopôle Méditerranée › Frontignan',
  );
  assert.equal(filAriane(), 'France › Occitanie › Hérault › Sète Agglopôle Méditerranée');
  const profond = chemin({ insee: '34108', quartier: 'q-crozes-pielles' });
  assert.equal(profond[profond.length - 1].niveau, 'quartier');
  assert.equal(profond[0].niveau, 'pays');
  assert.equal(chemin({ insee: '99999' }).length, 4, 'une commune inconnue s’arrête à l’agglomération');
});

test('la choroplèthe est monotone et tolère les valeurs absentes', () => {
  const { min, max } = bornes([10, 20, 30]);
  assert.deepEqual({ min, max }, { min: 10, max: 30 });
  assert.equal(couleurChoroplethe(min, min, max), PALETTE[0]);
  assert.equal(couleurChoroplethe(max, min, max), PALETTE[PALETTE.length - 1]);
  assert.equal(couleurChoroplethe(Number.NaN, min, max), PALETTE[0]);
  assert.equal(couleurChoroplethe(5, 10, 10), PALETTE[PALETTE.length - 1]);
  assert.deepEqual(bornes([]), { min: 0, max: 0 });
});

test('la projection locale et la distance donnent des ordres de grandeur justes', () => {
  const origine = projeter(43.4468, 3.7564, { latRef: 43.4468, lonRef: 3.7564, echelle: 1000 });
  assert.ok(Math.abs(origine.x) < 1e-9 && Math.abs(origine.y) < 1e-9, 'le point de référence se projette sur l’origine');
  const est = projeter(43.4468, 3.7664, { latRef: 43.4468, lonRef: 3.7564, echelle: 1000 });
  assert.ok(est.x > 0, 'aller vers l’est augmente x');
  const nord = projeter(43.4568, 3.7564, { latRef: 43.4468, lonRef: 3.7564, echelle: 1000 });
  assert.ok(nord.y < 0, 'aller vers le nord diminue y (axe SVG)');
  // Frontignan → Sète : environ 6,8 km à vol d'oiseau.
  const d = distanceM(43.4468, 3.7564, 43.4042, 3.6968);
  assert.ok(d > 6000 && d < 7500, `distance Frontignan–Sète : ${Math.round(d)} m`);
});

test('les liens de vérification d’une commune pointent les sources officielles', () => {
  const liens = liensCommune('34108');
  assert.equal(liens.length, 6);
  for (const l of liens) {
    assert.ok(l.nom && /^https:\/\//.test(l.url), `lien invalide : ${l.nom}`);
  }
  assert.ok(liens.some((l) => l.url.includes('COM-34108')), 'dossier INSEE de la commune');
  assert.ok(liens.some((l) => l.url.includes('georisques')));
  assert.ok(liens.some((l) => l.url.includes('cadastre.data.gouv.fr')));
  assert.deepEqual(liensCommune('99999'), []);
});

test('la série démographique de Frontignan est réelle et croissante', () => {
  assert.equal(SERIE_FRONTIGNAN[0].annee, 1968);
  assert.equal(SERIE_FRONTIGNAN[0].population, 11_141);
  const derniere = SERIE_FRONTIGNAN[SERIE_FRONTIGNAN.length - 1];
  assert.equal(derniere.annee, 2023);
  assert.equal(derniere.population, 24_136);
  for (let i = 1; i < SERIE_FRONTIGNAN.length; i += 1) {
    assert.ok(
      SERIE_FRONTIGNAN[i].annee > SERIE_FRONTIGNAN[i - 1].annee,
      'années strictement croissantes',
    );
  }
});

test('les douze lentilles sont uniques, nommées et portent une métrique', () => {
  assert.equal(LENTILLES.length, 12);
  const ids = new Set();
  for (const l of LENTILLES) {
    assert.ok(!ids.has(l.id), `lentille en double : ${l.id}`);
    ids.add(l.id);
    assert.ok(l.nom && l.icone && l.aide, `lentille ${l.id} incomplète`);
    assert.ok(l.metrique, `lentille ${l.id} : métrique`);
  }
  for (const attendue of ['territoire', 'population', 'reseaux', 'imprevus', 'risques']) {
    assert.ok(ids.has(attendue), `lentille manquante : ${attendue}`);
  }
});
