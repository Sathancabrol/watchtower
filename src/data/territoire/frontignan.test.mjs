import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dossierFrontignan, COMMUNES_THAU, CODE_INSEE, REPERE,
  toutesCommunes, communeParInsee, EPCI_SAM,
} from './frontignan.js';
import { trouverNoeud, cheminVers, bilanCertitude, rendreFait } from './dossierTerritorial.js';

test('le dossier suit l entonnoir national -> projet', () => {
  const d = dossierFrontignan();
  assert.equal(d.echelle, 'national');
  const chemin = cheminVers(d, 'friche-mobil').map((n) => n.echelle);
  assert.deepEqual(chemin, ['national', 'regional', 'intercommunal', 'communal', 'projet']);
});

test('les 6 projets frontignanais sont presents', () => {
  const ville = trouverNoeud(dossierFrontignan(), 'frontignan');
  assert.equal(ville.enfants.length, 6);
  for (const id of ['friche-mobil', 'pem', 'coeur-de-ville', 'port', 'lido', 'chais-botta']) {
    assert.ok(trouverNoeud(ville, id), `projet ${id} present`);
  }
});

test('les faits date-cles portent leurs sources reelles', () => {
  const friche = trouverNoeud(dossierFrontignan(), 'friche-mobil');
  const restitution = friche.faits.find((f) => f.libelle.includes('restitué'));
  assert.equal(restitution.valeur, '27 mai 2026');
  assert.equal(restitution.certitude.cle, 'engage');
  assert.match(restitution.sources[0], /midilibre\.fr/);
  assert.equal(restitution.infere, false);
});

test('le calendrier 2028 est marque comme infere, pas comme acquis', () => {
  const friche = trouverNoeud(dossierFrontignan(), 'friche-mobil');
  const amenagement = friche.faits.find((f) => f.libelle === 'Aménagements');
  assert.equal(amenagement.infere, true);
  assert.ok(rendreFait(amenagement).includes('~'), 'affiche le ~ des inferes');
  assert.ok(amenagement.regle, 'la regle utilisee est explicite');
});

test('le financement du PEM est chiffre et source', () => {
  const pem = trouverNoeud(dossierFrontignan(), 'pem');
  assert.match(pem.faits.find((f) => f.libelle === 'Budget').valeur, /25 M€/);
  assert.equal(pem.faits.find((f) => f.libelle === 'Région Occitanie').certitude.cle, 'engage');
});

test('aucun fait engage ne circule sans source', () => {
  const verifier = (n) => {
    for (const f of n.faits) {
      if (f.certitude.cle === 'engage' || f.certitude.cle === 'annonce') {
        assert.ok(f.sources.length > 0, `${f.libelle} doit citer une source`);
      }
    }
    n.enfants.forEach(verifier);
  };
  verifier(dossierFrontignan());
});

test('le bilan reste majoritairement source', () => {
  const b = bilanCertitude(dossierFrontignan());
  assert.ok(b.total >= 15, `au moins 15 faits, vu ${b.total}`);
  assert.ok(b.partInferee < 0.3, `part inferee maitrisee, vu ${b.partInferee}`);
});

test('le referentiel communal est complet', () => {
  assert.equal(COMMUNES_THAU.length, 9, '9 communes du jeu d essai etang de Thau');
  assert.equal(toutesCommunes().length, 15, '15 communes au total avec le complement SAM');
  for (const nom of ['Sète', 'Frontignan', 'Bouzigues', 'Loupian', 'Mèze', 'Marseillan', 'Agde',
                     'Balaruc-les-Bains', 'Balaruc-le-Vieux']) {
    assert.ok(COMMUNES_THAU.some((c) => c.nom === nom), `${nom} present`);
  }
});

test('les codes INSEE sont ceux verifies sur geo.api.gouv.fr', () => {
  // Ce test existe parce qu une premiere version portait 3 codes faux.
  const attendus = {
    Frontignan: '34108', 'Sète': '34301', 'Balaruc-les-Bains': '34023',
    'Balaruc-le-Vieux': '34024', Bouzigues: '34039', Loupian: '34143',
    'Mèze': '34157', Marseillan: '34150', Agde: '34003',
  };
  for (const [nom, insee] of Object.entries(attendus)) {
    assert.equal(COMMUNES_THAU.find((c) => c.nom === nom).insee, insee, `${nom} => ${insee}`);
  }
});

test('aucun code INSEE en double et tous dans l Herault', () => {
  const vus = new Set();
  for (const c of toutesCommunes()) {
    assert.match(c.insee, /^34\d{3}$/, `${c.nom} : code INSEE de l Herault`);
    assert.ok(!vus.has(c.insee), `${c.insee} unique`);
    vus.add(c.insee);
  }
});

test('les reperes geographiques tombent dans le bassin de Thau', () => {
  for (const c of toutesCommunes()) {
    assert.ok(c.lat > 43.2 && c.lat < 43.6, `${c.nom} latitude plausible`);
    assert.ok(c.lon > 3.4 && c.lon < 3.9, `${c.nom} longitude plausible`);
    assert.ok(c.pop > 0 && c.pop < 100000, `${c.nom} population plausible`);
    assert.match(c.cp, /^34\d{3}$/, `${c.nom} code postal`);
  }
});

test('Agde n appartient pas a Sete Agglopole', () => {
  assert.equal(COMMUNES_THAU.find((c) => c.nom === 'Agde').sam, false,
    'Agde est en CA Hérault Méditerranée, pas en SAM');
  assert.equal(COMMUNES_THAU.find((c) => c.nom === 'Sète').sam, true);
  assert.equal(toutesCommunes().filter((c) => c.sam).length, 14, 'SAM compte 14 communes');
});

test('communeParInsee retrouve et rejette proprement', () => {
  assert.equal(communeParInsee('34108').nom, 'Frontignan');
  assert.equal(communeParInsee('34301').pop, 45337);
  assert.equal(communeParInsee('99999'), null);
});

test('les codes INSEE et reperes de reference sont exacts', () => {
  assert.equal(CODE_INSEE, '34108');
  assert.equal(REPERE.nom, 'Frontignan la Peyrade');
  assert.ok(Math.abs(REPERE.lat - 43.4486) < 0.01);
});
