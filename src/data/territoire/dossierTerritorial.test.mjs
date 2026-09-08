import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CERTITUDES, ECHELLES, normaliserCertitude, creerFait, rendreFait,
  creerNoeud, trouverNoeud, cheminVers, bilanCertitude,
} from './dossierTerritorial.js';

test('normaliserCertitude accepte cle, marque et objet', () => {
  assert.equal(normaliserCertitude('engage').cle, 'engage');
  assert.equal(normaliserCertitude('ENGAGE').cle, 'engage');
  assert.equal(normaliserCertitude('📅').cle, 'annonce');
  assert.equal(normaliserCertitude({ cle: 'tendance' }).cle, 'tendance');
});

test('une valeur inconnue retombe sur le plus prudent', () => {
  for (const x of [null, undefined, 'nimporte', 42, {}]) {
    assert.equal(normaliserCertitude(x).cle, 'incertain', `${JSON.stringify(x)} => incertain`);
  }
});

test('un fait sans source ne peut pas etre engage', () => {
  const f = creerFait({ libelle: 'PEM livre', certitude: 'engage' });
  assert.equal(f.certitude.cle, 'tendance', 'retrograde faute de source');
  assert.equal(f.infere, true);
});

test('un fait source garde sa certitude', () => {
  const f = creerFait({
    libelle: 'Friche Mobil restituee', valeur: '27 mai 2026',
    certitude: 'engage', sources: ['https://www.midilibre.fr/2026/05/27/...'],
  });
  assert.equal(f.certitude.cle, 'engage');
  assert.equal(f.infere, false);
  assert.equal(f.sources.length, 1);
});

test('creerFait rejette un libelle vide', () => {
  for (const x of [{}, { libelle: '   ' }, null]) assert.equal(creerFait(x), null);
});

test('rendreFait marque visiblement l inference', () => {
  const sur = creerFait({ libelle: 'Budget PEM', valeur: '25 M€', certitude: 'engage', sources: ['https://x.fr'] });
  assert.equal(rendreFait(sur), '✅ Budget PEM : 25 M€');

  const infere = creerFait({ libelle: 'Emplois crees', valeur: '300-600', certitude: 'tendance', regle: 'ratio surface/emploi' });
  const rendu = rendreFait(infere);
  assert.ok(rendu.startsWith('🔮 ~'), 'prefixe ~ obligatoire sur un infere');
  assert.match(rendu, /ratio surface\/emploi/, 'la regle utilisee est montree');
});

test('creerNoeud normalise l echelle et filtre le bruit', () => {
  const n = creerNoeud({
    id: 'ville', echelle: 'communal', titre: 'Frontignan',
    faits: [{ libelle: 'ok', certitude: 'engage', sources: ['https://x'] }, null, { libelle: '' }],
    enfants: [{ id: 'p1', echelle: 'projet', titre: 'PEM' }, null],
  });
  assert.equal(n.faits.length, 1, 'faits invalides ecartes');
  assert.equal(n.enfants.length, 1);
  assert.equal(n.ouvrable, true);
  assert.equal(creerNoeud({ id: 'x', echelle: 'galactique', titre: 'T' }).echelle, 'projet', 'echelle inconnue => projet');
  assert.equal(creerNoeud({ titre: 'sans id' }), null);
});

test('ECHELLES suit l entonnoir du rapport Frontignan', () => {
  assert.deepEqual(ECHELLES, ['national', 'regional', 'intercommunal', 'communal', 'projet']);
});

const arbre = creerNoeud({
  id: 'fr', echelle: 'national', titre: 'France',
  faits: [{ libelle: 'ZAN', certitude: 'engage', sources: ['https://legifrance'] }],
  enfants: [{
    id: 'occitanie', echelle: 'regional', titre: 'Occitanie',
    enfants: [{
      id: 'sam', echelle: 'intercommunal', titre: 'Sete Agglopole',
      enfants: [{
        id: 'frontignan', echelle: 'communal', titre: 'Frontignan la Peyrade',
        faits: [{ libelle: 'Population', valeur: '23 000', certitude: 'annonce', sources: ['https://insee.fr'] }],
        enfants: [{
          id: 'friche-mobil', echelle: 'projet', titre: 'Friche ExxonMobil',
          faits: [
            { libelle: 'Restituee', valeur: '27/05/2026', certitude: 'engage', sources: ['https://midilibre.fr'] },
            { libelle: 'Amenagement', valeur: 'des 2028', certitude: 'tendance' },
          ],
        }],
      }],
    }],
  }],
});

test('trouverNoeud descend a toute profondeur', () => {
  assert.equal(trouverNoeud(arbre, 'friche-mobil').titre, 'Friche ExxonMobil');
  assert.equal(trouverNoeud(arbre, 'fr').echelle, 'national');
  assert.equal(trouverNoeud(arbre, 'inexistant'), null);
});

test('cheminVers rend le fil d Ariane complet', () => {
  const chemin = cheminVers(arbre, 'friche-mobil').map((n) => n.id);
  assert.deepEqual(chemin, ['fr', 'occitanie', 'sam', 'frontignan', 'friche-mobil']);
  assert.deepEqual(cheminVers(arbre, 'inconnu'), []);
});

test('bilanCertitude expose honnetement la part inferee', () => {
  const b = bilanCertitude(arbre);
  assert.equal(b.total, 4);
  assert.equal(b.parCertitude.engage, 2);
  assert.equal(b.parCertitude.annonce, 1);
  assert.equal(b.parCertitude.tendance, 1);
  assert.ok(Math.abs(b.partInferee - 0.25) < 1e-9, '1 infere sur 4');
  assert.equal(bilanCertitude(null).total, 0);
});
