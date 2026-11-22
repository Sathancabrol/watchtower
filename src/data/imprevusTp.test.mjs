// src/data/imprevusTp.test.mjs — la base d'imprévus de chantier TP.
//
// Ce que ces tests protègent : la granularité (« approvisionnement » n'existe
// pas, chaque ligne est un problème précis), la cohérence des énumérations
// (gravité, fréquence, preuve), et le fait qu'une fréquence ou un coût
// jamais mesurés ne soient pas présentés comme un chiffre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CASCADES, CHAMPS_RESTANTS, COLONNES, CONTEXTES, FREQUENCES, GRAVITES, IMPREVUS,
  PHASES, PREVISIBILITE, SIGNAUX_FAIBLES, SOURCES_IMPREVUS, cascadesPour,
  filtrerImprevus, imprevusPourTerrain, poidsFrequence, poidsGravite,
  poidsPrevisibilite, previsibilite, signauxPour, sourceImprevu, statistiquesImprevus,
  top, versCsvImprevus,
} from './imprevusTp.js';

const PHASE_IDS = new Set(PHASES.map((p) => p.id));
const CONTEXTE_IDS = new Set(CONTEXTES.map((c) => c.id));
const SOURCE_IDS = new Set(SOURCES_IMPREVUS.map((s) => s.id));
const GRAVITE_SET = new Set(GRAVITES);
const FREQUENCE_SET = new Set(FREQUENCES);
const CONFIANCE_SET = new Set(['documenté', 'rapporté', 'déduit']);
const DETECTIONS = new Set(['oui', 'non', 'partiel']);

test('le contrat de colonnes est figé et lisible', () => {
  assert.equal(new Set(COLONNES).size, COLONNES.length, 'colonnes uniques');
  assert.equal(COLONNES[0], 'id');
  assert.ok(COLONNES.includes('probleme') && COLONNES.includes('gravite'));
  assert.ok(COLONNES.includes('prevention') && COLONNES.includes('action_immediate'));
  assert.ok(COLONNES.includes('source') && COLONNES.includes('confiance'));
});

test('les phases couvrent le chantier de la préparation au rare-grave', () => {
  assert.equal(PHASES.length, 18);
  assert.equal(new Set(PHASES.map((p) => p.id)).size, 18, 'phases uniques');
  const lettres = PHASES.map((p) => p.nom.slice(0, 1));
  assert.deepEqual(lettres, 'ABCDEFGHIJKLMNOPQR'.split(''), 'phases lettrées A → R dans l’ordre');
  assert.equal(GRAVITES[0], 'Faible');
  assert.equal(GRAVITES[GRAVITES.length - 1], 'Catastrophique');
  assert.equal(FREQUENCES[0], 'Très fréquente');
  assert.equal(PREVISIBILITE.length, 4);
  assert.equal(CONTEXTES.length, 10);
});

test('les sources de la base imprévus sont ouvertes et vérifiables', () => {
  assert.equal(SOURCES_IMPREVUS.length, 13);
  const ids = new Set();
  for (const s of SOURCES_IMPREVUS) {
    assert.ok(!ids.has(s.id), `source en double : ${s.id}`);
    ids.add(s.id);
    assert.match(s.url, /^https:\/\//, `${s.id} : URL`);
    assert.ok(s.editeur && s.type_source, `${s.id} : éditeur et type`);
    assert.ok(s.fiabilite >= 1 && s.fiabilite <= 5, `${s.id} : fiabilité`);
  }
  assert.match(sourceImprevu('inrs_ts871').editeur, /INRS/);
  assert.equal(sourceImprevu('inconnue'), null);
});

test('chaque fiche est un problème précis, complet et bien énuméré', () => {
  assert.equal(IMPREVUS.length, 81);
  const ids = new Set();
  for (const i of IMPREVUS) {
    assert.ok(!ids.has(i.id), `fiche en double : ${i.id}`);
    ids.add(i.id);
    assert.ok(PHASE_IDS.has(i.phase), `${i.id} : phase ${i.phase}`);
    assert.ok(GRAVITE_SET.has(i.gravite), `${i.id} : gravité ${i.gravite}`);
    assert.ok(FREQUENCE_SET.has(i.frequence), `${i.id} : fréquence ${i.frequence}`);
    assert.ok(CONFIANCE_SET.has(i.confiance), `${i.id} : confiance ${i.confiance}`);
    assert.ok(SOURCE_IDS.has(i.source), `${i.id} : source ${i.source}`);
    assert.ok(DETECTIONS.has(i.detection_avant), `${i.id} : détection avant`);
    assert.ok(DETECTIONS.has(i.detection_pendant), `${i.id} : détection pendant`);
    for (const cle of ['probleme', 'cause', 'consequence', 'action_immediate', 'prevention']) {
      assert.ok(typeof i[cle] === 'string' && i[cle].length > 10, `${i.id} : ${cle} trop court`);
    }
    assert.ok(Array.isArray(i.contextes) && i.contextes.length > 0, `${i.id} : contextes`);
    for (const c of i.contextes) assert.ok(CONTEXTE_IDS.has(c), `${i.id} : contexte ${c}`);
    assert.match(i.date, /^\d{4}/, `${i.id} : date de la source`);
    assert.equal(i.pays, 'FR', `${i.id} : pays de la source`);
  }
});

test('la base assume ses trois niveaux de preuve', () => {
  const parConfiance = statistiquesImprevus().parConfiance;
  assert.ok(parConfiance.documenté > 0, 'des fiches documentées');
  assert.equal(
    Object.values(parConfiance).reduce((s, n) => s + n, 0),
    IMPREVUS.length,
    'chaque fiche a un niveau de preuve',
  );
  // Un problème « difficilement prévisible » ne peut pas être vendu comme certain.
  for (const i of IMPREVUS.filter((x) => x.confiance === 'déduit')) {
    assert.ok(i.prevention, `${i.id} : une fiche déduite dit quand même quoi faire`);
  }
  assert.ok(CHAMPS_RESTANTS.length >= 3, 'ce qui reste à documenter est écrit');
  for (const c of CHAMPS_RESTANTS) assert.ok(c.length > 20, 'un manque se décrit, il ne se résume pas');
});

test('les cascades racontent un enchaînement réel', () => {
  assert.equal(CASCADES.length, 12);
  const ids = new Set();
  for (const c of CASCADES) {
    assert.ok(!ids.has(c.id), `${c.id} : cascade en double`);
    ids.add(c.id);
    assert.ok(c.declencheur && c.final, `${c.id} : déclencheur et final`);
    assert.ok(Array.isArray(c.etapes) && c.etapes.length >= 3, `${c.id} : au moins trois étapes`);
    for (const e of c.etapes) assert.ok(typeof e === 'string' && e.length > 3, `${c.id} : étape vide`);
    for (const ctx of c.contextes) assert.ok(CONTEXTE_IDS.has(ctx), `${c.id} : contexte ${ctx}`);
  }
});

test('les signaux faibles sont observables, pas théoriques', () => {
  assert.equal(SIGNAUX_FAIBLES.length, 22);
  for (const s of SIGNAUX_FAIBLES) {
    assert.ok(s.signal && s.probleme && s.action, 'signal incomplet');
    assert.ok(SOURCE_IDS.has(s.source), `signal « ${s.signal} » : source ${s.source}`);
  }
  assert.ok(signauxPour('gaz').length > 0, 'on retrouve un signal par mot-clé');
  assert.ok(signauxPour('DICT').length > 0);
  assert.equal(signauxPour('').length, SIGNAUX_FAIBLES.length);
});

test('les notes de gravité, fréquence et prévisibilité sont ordonnées', () => {
  assert.ok(poidsGravite({ gravite: 'Catastrophique' }) > poidsGravite({ gravite: 'Faible' }));
  assert.equal(poidsGravite({ gravite: 'hors-barème' }), 0);
  assert.ok(poidsFrequence({ frequence: 'Très fréquente' }) > poidsFrequence({ frequence: 'Très rare' }));
  assert.equal(poidsFrequence({}), 0);

  assert.equal(previsibilite({ detection_avant: 'non' }), 'difficilement prévisible');
  assert.equal(previsibilite({ detection_avant: 'partiel' }), 'prévisible avec de bonnes données');
  assert.equal(previsibilite({ detection_avant: 'oui', frequence: 'Très rare' }), 'quasiment imprévisible');
  assert.equal(previsibilite({ detection_avant: 'oui', frequence: 'Fréquente' }), 'facilement prévisible');
  assert.ok(PREVISIBILITE.includes(previsibilite({ detection_avant: 'non' })));
  assert.ok(poidsPrevisibilite({ detection_avant: 'non' }) > poidsPrevisibilite({ detection_avant: 'oui', frequence: 'Fréquente' }));
});

test('top() classe sur la base entière et respecte la taille demandée', () => {
  const cinq = top(5, 'gravite');
  assert.equal(cinq.length, 5);
  for (let i = 1; i < cinq.length; i += 1) {
    assert.ok(poidsGravite(cinq[i - 1]) >= poidsGravite(cinq[i]), 'gravités décroissantes');
  }
  assert.equal(cinq[0].gravite, 'Catastrophique');
  assert.equal(top(0).length, 0);
  assert.equal(top(999).length, IMPREVUS.length);
  const parFrequence = top(10, 'frequence');
  for (let i = 1; i < parFrequence.length; i += 1) {
    assert.ok(poidsFrequence(parFrequence[i - 1]) >= poidsFrequence(parFrequence[i]));
  }
  const imprevisibles = top(10, 'imprevisibilite');
  for (let i = 1; i < imprevisibles.length; i += 1) {
    assert.ok(poidsPrevisibilite(imprevisibles[i - 1]) >= poidsPrevisibilite(imprevisibles[i]));
  }
});

test('filtrerImprevus croise phase, contexte, gravité et texte', () => {
  assert.equal(filtrerImprevus({}).length, IMPREVUS.length);
  const reseaux = filtrerImprevus({ phase: 'reseaux' });
  assert.ok(reseaux.length > 0);
  for (const i of reseaux) assert.equal(i.phase, 'reseaux');

  const littoral = filtrerImprevus({ contexte: 'littoral' });
  assert.ok(littoral.length > 0);
  for (const i of littoral) assert.ok(i.contextes.includes('littoral'));

  const critiques = filtrerImprevus({ gravite: 'Critique' });
  for (const i of critiques) assert.equal(i.gravite, 'Critique');

  const texte = filtrerImprevus({ texte: 'DICT' });
  assert.ok(texte.length > 0, 'la recherche par texte est insensible à la casse');
  assert.equal(filtrerImprevus({ texte: 'zzz-introuvable' }).length, 0);
  assert.deepEqual(
    filtrerImprevus({ phase: 'reseaux', contexte: 'littoral' }).map((i) => i.id),
    filtrerImprevus({ phase: 'reseaux' }).filter((i) => i.contextes.includes('littoral')).map((i) => i.id),
  );
});

test('imprevusPourTerrain répond à « qu’est-ce qui peut mal tourner ici ? »', () => {
  const terrain = imprevusPourTerrain({ contexte: 'littoral' });
  assert.equal(terrain.contexte, 'littoral');
  assert.ok(terrain.total > 0);
  assert.ok(terrain.problemes.length <= 12, 'on ne noie pas le conducteur de travaux');
  assert.equal(terrain.total, filtrerImprevus({ contexte: 'littoral' }).length);
  for (const c of terrain.cascades) assert.ok(c.contextes.includes('littoral'));
  assert.equal(terrain.signaux.length, 8);

  const phase = imprevusPourTerrain({ contexte: 'urbain_ancien', phase: 'reseaux' });
  for (const p of phase.problemes) {
    assert.equal(p.phase, 'reseaux');
    assert.ok(p.contextes.includes('urbain_ancien'));
  }
  const sansFiltre = imprevusPourTerrain();
  assert.equal(sansFiltre.total, IMPREVUS.length);
  assert.equal(cascadesPour().length, CASCADES.length);
});

test('statistiquesImprevus recoupe la base sans la maquiller', () => {
  const st = statistiquesImprevus();
  assert.equal(st.total, IMPREVUS.length);
  assert.equal(st.cascades, CASCADES.length);
  assert.equal(st.signaux, SIGNAUX_FAIBLES.length);
  assert.equal(Object.values(st.parGravite).reduce((s, n) => s + n, 0), IMPREVUS.length);
  assert.equal(Object.values(st.parPhase).reduce((s, n) => s + n, 0), IMPREVUS.length);
  const restreint = statistiquesImprevus(filtrerImprevus({ phase: 'meteo' }));
  assert.equal(restreint.total, filtrerImprevus({ phase: 'meteo' }).length);
});

test('versCsvImprevus exporte le contrat de colonnes', () => {
  const csv = versCsvImprevus(IMPREVUS.slice(0, 3));
  const lignes = csv.split('\n');
  assert.equal(lignes.length, 4);
  assert.deepEqual(lignes[0].split(';'), COLONNES);
  assert.ok(lignes[1].startsWith('IMP-'));
  assert.match(csv, /urbain_ancien\|grande_voirie/, 'les listes sont séparées par des barres verticales');
  const avecSeparateur = versCsvImprevus([{ ...IMPREVUS[0], probleme: 'a;b' }]).split('\n')[1];
  assert.match(avecSeparateur, /"a;b"/, 'un point-virgule dans le texte est protégé');
});
