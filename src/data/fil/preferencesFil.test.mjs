import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLUX_FIL, TRIS, CLE_PREFERENCES_FIL, preferencesParDefaut, normaliserPreferences,
  lirePreferences, ecrirePreferences, basculerFlux, deplacerFlux, fluxActifs,
  demandeLeReseau, appliquerPreferences, resumePreferences,
} from './preferencesFil.js';

/** Un faux stockage, pour tester sans navigateur. */
function stockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    _contenu: m,
  };
}
/** Un stockage qui refuse tout, comme en navigation privee. */
const stockageMuet = {
  getItem() { throw new Error('refus'); },
  setItem() { throw new Error('refus'); },
};

test('chaque flux est decrit assez pour qu on puisse choisir', () => {
  for (const f of FLUX_FIL) {
    assert.ok(f.id && f.nom && f.ic, `flux incomplet : ${f.id}`);
    assert.ok(f.source, `${f.id} n annonce pas sa source`);
    assert.equal(typeof f.reseau, 'boolean', `${f.id} ne dit pas s il va sur le reseau`);
    assert.ok(f.note && f.note.length > 30, `${f.id} : note trop courte`);
  }
  assert.equal(new Set(FLUX_FIL.map((f) => f.id)).size, FLUX_FIL.length, 'identifiants dupliques');
});

test('le fil demarre REPLIE — il ne doit pas prendre l ecran sans qu on le demande', () => {
  assert.equal(preferencesParDefaut().deplie, false);
});

test('le fil demarre sobre : une partie des flux, pas tous', () => {
  const d = preferencesParDefaut();
  assert.ok(d.actifs.length >= 3, 'un fil vide au demarrage ne sert a rien');
  assert.ok(d.actifs.length < FLUX_FIL.length, 'tout allumer d emblee, c est un fil qu on coupe');
});

test('des preferences abimees ne cassent jamais rien', () => {
  for (const mauvais of [null, undefined, 0, 'texte', [], { actifs: 'non' }, { ordre: 42 }]) {
    const p = normaliserPreferences(mauvais);
    assert.ok(Array.isArray(p.actifs) && p.actifs.length, String(mauvais));
    assert.ok(Array.isArray(p.ordre) && p.ordre.length === FLUX_FIL.length, String(mauvais));
    assert.ok(TRIS.includes(p.tri));
  }
});

test('un flux AJOUTE depuis le dernier enregistrement reste visible', () => {
  // Le piege : des preferences anciennes ne connaissent pas les flux recents.
  // Si on faisait confiance a l ordre enregistre, le flux neuf disparaitrait.
  const vieil = { actifs: ['presse'], ordre: ['presse', 'meteo'] };
  const p = normaliserPreferences(vieil);
  for (const f of FLUX_FIL) assert.ok(p.ordre.includes(f.id), `${f.id} a disparu de l ordre`);
});

test('un identifiant inconnu est ignore, pas conserve', () => {
  const p = normaliserPreferences({ actifs: ['presse', 'licorne'], ordre: ['licorne', 'presse'] });
  assert.ok(!p.actifs.includes('licorne'));
  assert.ok(!p.ordre.includes('licorne'));
});

test('les bornes absurdes sont ramenees dans le raisonnable', () => {
  assert.equal(normaliserPreferences({ limite: 9999 }).limite, 60);
  assert.equal(normaliserPreferences({ limite: -5 }).limite, 3);
  assert.equal(normaliserPreferences({ limite: 'beaucoup' }).limite, 12);
  assert.equal(normaliserPreferences({ graviteMin: 99 }).graviteMin, 3);
});

test('le reglage survit a un aller-retour par le stockage', () => {
  const s = stockage();
  let p = preferencesParDefaut();
  p = basculerFlux(p, 'radio');
  p = deplacerFlux(p, 'presse', -1);
  p = { ...p, tri: 'recent', limite: 20, deplie: true };
  assert.equal(ecrirePreferences(s, p), true);
  const relu = lirePreferences(s);
  assert.deepEqual(relu.actifs.sort(), p.actifs.sort());
  assert.equal(relu.tri, 'recent');
  assert.equal(relu.limite, 20);
  assert.equal(relu.deplie, true);
  assert.equal(relu.ordre[0], 'alertes');
});

test('un stockage qui refuse ne fait pas tomber l application', () => {
  assert.deepEqual(lirePreferences(stockageMuet), preferencesParDefaut());
  assert.equal(ecrirePreferences(stockageMuet, preferencesParDefaut()), false);
  assert.deepEqual(lirePreferences(null), preferencesParDefaut());
});

test('du contenu illisible dans le stockage retombe sur les defauts', () => {
  const s = stockage({ [CLE_PREFERENCES_FIL]: '{ ceci n est pas du json' });
  assert.deepEqual(lirePreferences(s), preferencesParDefaut());
});

test('basculer un flux l allume puis l eteint, sans toucher au reste', () => {
  const d = preferencesParDefaut();
  const avec = basculerFlux(d, 'radio');
  assert.ok(avec.actifs.includes('radio'));
  const sans = basculerFlux(avec, 'radio');
  assert.ok(!sans.actifs.includes('radio'));
  // .sort() trie EN PLACE : trier le temoin le detruirait, et le test
  // suivant mesurerait alors sa propre mutation.
  assert.deepEqual([...sans.actifs].sort(), [...d.actifs].sort());
  assert.deepEqual(d.actifs, preferencesParDefaut().actifs, 'les preferences d origine sont intactes');
});

test('on a le droit de TOUT eteindre — la normalisation ne doit pas rallumer dans le dos', () => {
  let p = preferencesParDefaut();
  for (const id of [...p.actifs]) p = basculerFlux(p, id);
  assert.deepEqual(p.actifs, []);
  assert.deepEqual(fluxActifs(p), []);
  assert.equal(demandeLeReseau(p), false);
  assert.match(resumePreferences(p), /éteint/i);
});

test('deplacer un flux ne boucle pas aux extremites', () => {
  const d = preferencesParDefaut();
  const premier = d.ordre[0];
  assert.deepEqual(deplacerFlux(d, premier, -1).ordre, d.ordre, 'le premier ne remonte pas');
  const dernier = d.ordre[d.ordre.length - 1];
  assert.deepEqual(deplacerFlux(d, dernier, 1).ordre, d.ordre, 'le dernier ne descend pas');
  const bouge = deplacerFlux(d, d.ordre[1], -1);
  assert.equal(bouge.ordre[0], d.ordre[1]);
  assert.equal(bouge.ordre[1], d.ordre[0]);
});

const DEPECHES = [
  { flux: 'presse', titre: 'article', gravite: 2, quand: 300 },
  { flux: 'seismes', titre: 'secousse', gravite: 3, quand: 100 },
  { flux: 'meteo', titre: 'vent', gravite: 1, quand: 500 },
  { flux: 'communal', titre: 'conseil municipal', gravite: 2, quand: 200 },
  { flux: 'radio', titre: 'station', gravite: 0, quand: 400 },
];

test('un flux eteint ne diffuse plus', () => {
  const p = basculerFlux(preferencesParDefaut(), 'presse');
  const r = appliquerPreferences(DEPECHES, p);
  assert.ok(!r.some((d) => d.flux === 'presse'));
  assert.ok(r.some((d) => d.flux === 'seismes'));
});

test('les trois tris trient vraiment, et differemment', () => {
  const base = { ...preferencesParDefaut(), actifs: FLUX_FIL.map((f) => f.id) };
  assert.equal(appliquerPreferences(DEPECHES, { ...base, tri: 'importance' })[0].titre, 'secousse');
  assert.equal(appliquerPreferences(DEPECHES, { ...base, tri: 'recent' })[0].titre, 'vent');
  const manuel = appliquerPreferences(DEPECHES, {
    ...base, tri: 'manuel', ordre: ['radio', ...base.ordre],
  });
  assert.equal(manuel[0].flux, 'radio', 'l ordre manuel doit primer sur l importance');
});

test('le seuil de gravite ecarte le bruit', () => {
  const base = { ...preferencesParDefaut(), actifs: FLUX_FIL.map((f) => f.id), graviteMin: 2 };
  const r = appliquerPreferences(DEPECHES, base);
  assert.ok(r.every((d) => d.gravite >= 2));
  assert.ok(!r.some((d) => d.titre === 'vent'));
});

test('le mode hors ligne ne garde que ce qui repond sans reseau', () => {
  const base = {
    ...preferencesParDefaut(), actifs: FLUX_FIL.map((f) => f.id), horsLigneSeulement: true,
  };
  const r = appliquerPreferences(DEPECHES, base);
  assert.ok(r.length, 'la base locale doit pouvoir repondre seule');
  assert.ok(r.every((d) => d.flux === 'communal' || d.flux === 'associations'));
});

test('la limite est respectee, et une depeche sans titre est jetee', () => {
  const beaucoup = Array.from({ length: 50 }, (_, i) => ({ flux: 'presse', titre: `d${i}`, gravite: 2, quand: i }));
  const base = { ...preferencesParDefaut(), limite: 5 };
  assert.equal(appliquerPreferences(beaucoup, base).length, 5);
  assert.equal(appliquerPreferences([{ flux: 'presse' }, null, 0], base).length, 0);
});

test('une depeche dont le flux est inconnu est GARDEE plutot que perdue', () => {
  // Perdre une information parce qu elle n est pas etiquetee serait pire que
  // d en afficher une de trop.
  const r = appliquerPreferences([{ flux: 'venu-d-ailleurs', titre: 'info', gravite: 2, quand: 1 }],
    preferencesParDefaut());
  assert.equal(r.length, 1);
});

test('on sait DIRE si le reglage courant exige le reseau', () => {
  assert.equal(demandeLeReseau(preferencesParDefaut()), true);
  const local = { ...preferencesParDefaut(), actifs: ['communal'] };
  assert.equal(demandeLeReseau(local), false);
  assert.match(resumePreferences(local), /hors ligne/i);
});

test('le resume dit ce que le fil diffuse, sans avoir a ouvrir le panneau', () => {
  const r = resumePreferences(preferencesParDefaut());
  assert.match(r, /5 flux sur 10/);
  assert.match(r, /12 dépêches max/);
});

test('appliquerPreferences ne modifie pas la liste qu on lui donne', () => {
  const copie = DEPECHES.map((d) => ({ ...d }));
  appliquerPreferences(DEPECHES, preferencesParDefaut());
  assert.deepEqual(DEPECHES, copie);
});
