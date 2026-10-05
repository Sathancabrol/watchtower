import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CALQUES, AMPLITUDE_PALIER, calque, calqueDe, variablesCss } from './calques.js';

const lire = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

test('les paliers montent, et laissent la place au decalage interne', () => {
  for (let i = 1; i < CALQUES.length; i++) {
    const ecart = CALQUES[i].z - CALQUES[i - 1].z;
    assert.ok(ecart >= AMPLITUDE_PALIER,
      `${CALQUES[i - 1].cle} -> ${CALQUES[i].cle} : ${ecart}, il faut au moins ${AMPLITUDE_PALIER}`);
  }
});

test('chaque palier dit a quoi il sert', () => {
  for (const c of CALQUES) {
    assert.ok(c.quoi && c.quoi.length > 30, `${c.cle} sans explication utilisable`);
  }
});

test('un role inconnu leve plutot que de rendre un empilement faux', () => {
  assert.throws(() => calque('panneaux'), /calque inconnu/);
  assert.throws(() => calque('panneau', AMPLITUDE_PALIER), /hors du palier/);
  assert.throws(() => calque('panneau', -1), /hors du palier/);
});

test('REGRESSION : le volant passe devant les vues plein cadre', () => {
  // INTEL etait a 920 et le volant a 960 : la colonne gauche d INTEL
  // disparaissait sous le volant. La surface de commande doit rester devant,
  // et c est au contenu de se caler a cote.
  assert.ok(calque('volant') > calque('cadre'), 'le volant doit rester atteignable');
  assert.ok(calque('cadre') > calque('panneau'), 'une vue plein cadre couvre les panneaux');
  assert.ok(calque('modale') > calque('volant'), 'une modale bloque meme le volant');
  assert.ok(calque('secours') > calque('modale'), 'la sortie de secours perce tout');
  assert.ok(calque('alerte') > calque('modale'), 'une alerte doit percer une modale');
});

test('calqueDe nomme le palier d une valeur brute', () => {
  assert.equal(calqueDe(920), 'ancre');
  assert.equal(calqueDe(calque('cadre')), 'cadre');
  assert.equal(calqueDe(99999), 'secours');
  assert.equal(calqueDe('x'), '');
});

test('le bloc CSS de la feuille est bien celui que produit le module', () => {
  const css = lire('../../../style.css');
  assert.ok(css.includes(variablesCss()),
    'style.css a diverge de src/data/ui/calques.js — regenerer le bloc :root');
});

test('les modules recables n ecrivent plus de z-index nu', () => {
  for (const f of ['../../intelTwin.js', '../../volantLateral.js', '../../grapheVue.js',
    '../../hudCentral.js', '../../reunionUI.js', '../../vueCommunale.js']) {
    const src = lire(f);
    const nus = [...src.matchAll(/z-index:\s*(\d{3,})/g)].map((m) => m[1]);
    assert.deepEqual(nus, [], `${f} empile encore a la main : ${nus.join(', ')}`);
  }
});
