import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUDGETS, INDICATEURS_FINANCIERS, VIE_ASSOCIATIVE, CONTRADICTIONS,
  DONNEES_MANQUANTES, budgetCoherent, contradictionsOuvertes,
} from './frontignanDetail.js';

test('les budgets sont arithmetiquement coherents', () => {
  for (const b of BUDGETS) {
    assert.ok(budgetCoherent(b), `${b.exercice} : fonctionnement + investissement ≈ total`);
  }
});

test('le BP 2025 est repris au centime pres', () => {
  const b = BUDGETS.find((x) => x.exercice === 'BP 2025');
  assert.equal(b.fonctionnement, 39_553_032);
  assert.equal(b.investissement, 17_179_220);
  // Le rapport source annonce 56 232 252 € ; la somme reelle des deux sections
  // (chacune sourcee au centime) vaut 56 732 252 €. Coquille de 500 k€ corrigee.
  assert.equal(b.total, 56_732_252);
  assert.equal(b.fonctionnement + b.investissement, b.total, 'somme exacte');
  assert.ok(b.note.includes('CORRECTION'), 'la correction est tracee dans la donnee');
  assert.equal(b.fiable, true);
});

test('les deux perimetres 2026 coexistent sans se contredire', () => {
  const bp = BUDGETS.find((x) => x.exercice === 'BP 2026');
  const cons = BUDGETS.find((x) => x.total === 64_900_000);
  assert.equal(bp.total, 52_360_000, 'chiffre officiel de la Ville, pas l arrondi de presse');
  assert.equal(bp.fonctionnement + bp.investissement, bp.total, 'somme exacte');
  assert.equal(cons.total, 64_900_000);
  assert.ok(cons.total > bp.total, 'le consolide englobe le primitif');
  assert.ok(cons.note.includes('Ne pas comparer'), 'la mise en garde est portee par la donnee');
});

test('une estimation est signalee comme telle', () => {
  const bp24 = BUDGETS.find((x) => x.exercice === 'BP 2024');
  assert.equal(bp24.fiable, false);
  assert.ok(bp24.note.includes('estimée'));
});

test('chaque budget cite sa source', () => {
  for (const b of BUDGETS) assert.match(b.source, /^https:\/\//, `${b.exercice} source`);
});

test('les indicateurs se comparent a la strate et signalent les alertes', () => {
  assert.ok(INDICATEURS_FINANCIERS.length >= 5);
  for (const i of INDICATEURS_FINANCIERS) {
    assert.ok(typeof i.valeur === 'number' && typeof i.strate === 'number', `${i.libelle} chiffre`);
    assert.equal(typeof i.alerte, 'boolean');
  }
  const dette = INDICATEURS_FINANCIERS.find((i) => i.libelle === 'Dette par habitant');
  assert.equal(dette.valeur, 995);
  assert.equal(dette.alerte, false, 'dette dans la moyenne de strate');
  const desend = INDICATEURS_FINANCIERS.find((i) => i.libelle.includes('désendettement'));
  assert.equal(desend.alerte, true, '7,5 ans contre 5,5 : alerte');
});

test('la vie associative est chiffree et sourcee', () => {
  assert.equal(VIE_ASSOCIATIVE.subventionsAnnuelles, 508_150);
  assert.ok(VIE_ASSOCIATIVE.nombreAssociationsSubventionnees >= 100);
  assert.equal(VIE_ASSOCIATIVE.budgetParticipatif.montantAnnuel, 50_000);
  assert.equal(VIE_ASSOCIATIVE.concertation.comitesHabitants, 6);
  assert.match(VIE_ASSOCIATIVE.source, /^https:\/\//);
});

test('le FIRN porte sa reserve de fiabilite', () => {
  const firn = VIE_ASSOCIATIVE.evenements.find((e) => e.nom.includes('FIRN'));
  assert.equal(firn.depuis, 1998);
  assert.equal(firn.edition, 29);
  assert.ok(firn.fiabiliteFrequentation.includes('ordre de grandeur'),
    'la frequentation ne doit pas passer pour une mesure');
});

test('les contradictions sont documentees, pas masquees', () => {
  assert.ok(CONTRADICTIONS.length >= 7);
  for (const c of CONTRADICTIONS) {
    assert.ok(c.sujet && c.retenu && c.justification, `${c.sujet} arbitre et justifie`);
    assert.ok(Array.isArray(c.versions) && c.versions.length >= 2, `${c.sujet} : au moins 2 versions`);
    assert.equal(typeof c.resolu, 'boolean');
  }
});

test('le PEM retient 25 M€ et documente la revision', () => {
  const pem = CONTRADICTIONS.find((c) => c.sujet.includes('multimodal'));
  assert.equal(pem.retenu, '25 M€');
  assert.equal(pem.resolu, true);
  assert.ok(pem.versions.some((v) => v.includes('41 M€')), 'l ancienne estimation reste visible');
});

test('les contradictions ouvertes restent identifiables', () => {
  const o = contradictionsOuvertes();
  assert.ok(o.length >= 3, `des questions restent ouvertes, vu ${o.length}`);
  for (const c of o) assert.equal(c.resolu, false);
});

test('les angles morts sont assumes', () => {
  assert.ok(DONNEES_MANQUANTES.length >= 5);
  assert.ok(DONNEES_MANQUANTES.some((d) => d.includes('PEM')), 'angle mort n°1 liste');
});

// --- Programme d'equipement 2026 : le piege des perimetres ---------------

test('le programme d equipement est distinct de la section d investissement', async () => {
  const { PROGRAMME_EQUIPEMENT_2026, BUDGETS } = await import('./frontignanDetail.js');
  const bp = BUDGETS.find((x) => x.exercice === 'BP 2026');
  assert.equal(PROGRAMME_EQUIPEMENT_2026.total, 9_100_000);
  assert.ok(
    PROGRAMME_EQUIPEMENT_2026.total < bp.investissement,
    'les travaux (9,1 M) sont inferieurs a la section investissement (13,13 M) : '
    + 'celle-ci porte aussi le capital de la dette',
  );
});

test('le PEM n impute que son etude a l exercice 2026', async () => {
  const { PROGRAMME_EQUIPEMENT_2026 } = await import('./frontignanDetail.js');
  const pem = PROGRAMME_EQUIPEMENT_2026.postes.find((x) => x.libelle.includes('PEM'));
  assert.equal(pem.montant, 350_000, 'credit 2026, surtout pas les 25 M du cout total');
  assert.ok(pem.note.includes('25 M'), 'le cout total reste rappele pour eviter la confusion');
});

test('tout poste sans montant publie est marque non fiable', async () => {
  const { PROGRAMME_EQUIPEMENT_2026 } = await import('./frontignanDetail.js');
  for (const p of PROGRAMME_EQUIPEMENT_2026.postes) {
    if (p.montant === null) assert.equal(p.fiable, false, `${p.libelle} : pas de montant => pas fiable`);
  }
});

test('les erreurs du dossier IA restent tracees et arbitrees', async () => {
  const { CONTRADICTIONS } = await import('./frontignanDetail.js');
  for (const sujet of ['Epargne nette 2025', 'Encours de dette 2026']) {
    const c = CONTRADICTIONS.find((x) => x.sujet.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === sujet);
    assert.ok(c, `contradiction manquante : ${sujet}`);
    assert.equal(c.resolu, true);
    assert.ok(c.versions.length >= 2 && c.justification.length > 40);
  }
});

test('les neuf axes du ROB sont complets', async () => {
  const { AXES_ROB_2026 } = await import('./frontignanDetail.js');
  assert.equal(AXES_ROB_2026.length, 9);
});
