// src/empreinte.test.mjs — empreinte économique & risques (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  THEMES_RISQUES,
  entrepriseDeReponse,
  faitsDeWikidata,
  formaterEuros,
  resumeGeorisques,
  trancheEffectif,
  urlGeorisques,
  urlRechercheEntreprise,
  urlWikidata,
} from './empreinte.js';

test('URL de recherche d’entreprise (API de l’État, sans clé)', () => {
  const u = new URL(urlRechercheEntreprise('Total Frontignan', 5));
  assert.equal(u.hostname, 'recherche-entreprises.api.gouv.fr');
  assert.equal(u.searchParams.get('q'), 'Total Frontignan');
  assert.equal(u.searchParams.get('per_page'), '5');
  // garde-fou : une recherche trop longue est coupée
  assert.ok(urlRechercheEntreprise('x'.repeat(500)).length < 300);
});

test('URL Géorisques : lon,lat puis rayon', () => {
  const u = new URL(urlGeorisques('installations_classees', 3.6904, 43.4004, 1_000));
  assert.equal(u.pathname, '/api/v1/installations_classees');
  assert.equal(u.searchParams.get('latlon'), '3.69040,43.40040');
  assert.equal(u.searchParams.get('rayon'), '1000');
  const petit = new URL(urlGeorisques('radon', 0, 0, -9));
  assert.equal(petit.searchParams.get('rayon'), '100', 'rayon plancher');
});

test('URL Wikidata : accepte un Q-id ou une URL complète', () => {
  assert.equal(urlWikidata('Q123'), 'https://www.wikidata.org/wiki/Special:EntityData/Q123.json');
  assert.equal(urlWikidata('https://www.wikidata.org/wiki/Q123'),
    'https://www.wikidata.org/wiki/Special:EntityData/Q123.json');
  assert.equal(urlWikidata(''), '');
  assert.equal(urlWikidata(null), '');
});

test('tranches d’effectif INSEE', () => {
  assert.equal(trancheEffectif(11), '10 à 19 salariés');
  assert.equal(trancheEffectif('12'), '20 à 49 salariés');
  assert.equal(trancheEffectif(53), '10 000 salariés et plus');
  assert.equal(trancheEffectif('NN'), 'non renseigné');
  assert.equal(trancheEffectif(null), 'non renseigné');
  assert.equal(trancheEffectif(99), 'tranche 99');
});

test('montants en euros lisibles', () => {
  assert.equal(formaterEuros(1_250_000_000), '1,25 Md €');
  assert.equal(formaterEuros(3_400_000), '3,4 M €');
  assert.equal(formaterEuros(12_500), '13 k€');
  assert.equal(formaterEuros(480), '480 €');
  assert.equal(formaterEuros(null), '—');
  assert.equal(formaterEuros('abc'), '—');
});

test('entreprise : SIREN, NAF, effectif, dirigeants, lien annuaire', () => {
  const e = entrepriseDeReponse({
    results: [{
      siren: '552100554',
      nom_complet: 'SOCIÉTÉ DES CITERNES DE FRONTIGNAN',
      activite_principale: '5210B',
      libelle_activite_principale: 'Entreposage et stockage non frigorifique',
      tranche_effectif_salarie: 21,
      date_creation: '1998-04-12',
      etat_administratif: 'A',
      categorie_entreprise: 'PME',
      nombre_etablissements: 3,
      dirigeants: [{ nom: 'DUPONT', prenom: 'Jean' }, { nom: 'MARTIN', prenom: 'Claire' }],
      siege: { siret: '55210055400022', adresse: '12 chemin des Citernes', code_postal: '34110', libelle_commune: 'Frontignan', latitude: 43.44, longitude: 3.75 },
    }],
  });
  assert.equal(e.siren, '552100554');
  assert.equal(e.siret, '55210055400022');
  assert.equal(e.effectif, '50 à 99 salariés');
  assert.equal(e.etat, 'en activité');
  assert.equal(e.libelleActivite, 'Entreposage et stockage non frigorifique');
  assert.deepEqual(e.dirigeants, ['Jean DUPONT', 'Claire MARTIN']);
  assert.equal(e.lien, 'https://annuaire-entreprises.data.gouv.fr/entreprise/552100554');
  assert.equal(e.ville, 'Frontignan');
  assert.equal(entrepriseDeReponse({}), null);
  assert.equal(entrepriseDeReponse(null), null);
  assert.equal(entrepriseDeReponse({ results: [] }), null);
});

test('Wikidata : propriétaire, maison mère, effectif, CA, site web', () => {
  const f = faitsDeWikidata({
    entities: {
      Q123: {
        id: 'Q123',
        labels: { fr: { value: 'Citernes du Midi' } },
        claims: {
          P127: [{ mainsnak: { datavalue: { value: { id: 'Q999' } } } }],
          P749: [{ mainsnak: { datavalue: { value: { id: 'Q888' } } } }],
          P1128: [{ mainsnak: { datavalue: { value: { amount: '+1420', unit: '1' } } } }],
          P2139: [{ mainsnak: { datavalue: { value: { amount: '+320000000' } } } }],
          P571: [{ mainsnak: { datavalue: { value: { time: '+1974-05-02T00:00:00Z' } } } }],
          P856: [{ mainsnak: { datavalue: { value: 'https://exemple.fr' } } }],
          P169: [{ mainsnak: { datavalue: { value: { id: 'Q777' } } } }],
          P355: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }, { mainsnak: { datavalue: { value: { id: 'Q2' } } } }],
        },
      },
    },
  });
  assert.equal(f.titre, 'Citernes du Midi');
  assert.equal(f.proprietaire, 'Q999');
  assert.equal(f.maisonMere, 'Q888');
  assert.equal(f.effectif, 1420);
  assert.equal(f.chiffreAffaires, 320_000_000);
  assert.equal(formaterEuros(f.chiffreAffaires), '320,0 M €');
  assert.equal(f.creation, '1974-05-02');
  assert.equal(f.siteWeb, 'https://exemple.fr');
  assert.deepEqual(f.filiales, ['Q1', 'Q2']);
  assert.equal(faitsDeWikidata(null), null);
  assert.equal(faitsDeWikidata({}), null);
});

test('Géorisques : résumé des installations classées', () => {
  const r = resumeGeorisques({
    data: [
      {
        nomEtablissement: 'DÉPÔT DE LIQUIDES INFLAMMABLES',
        commune: 'Frontignan',
        codePostal: '34110',
        regime: 'A',
        classe: 'SEVESO seuil bas',
      },
      { nom: 'ATELIER', commune: 'Sète' },
    ],
  }, 'installations_classees');
  assert.equal(r.length, 2);
  assert.equal(r[0].nom, 'DÉPÔT DE LIQUIDES INFLAMMABLES');
  assert.match(r[0].detail, /Frontignan/);
  assert.match(r[0].detail, /34110/);
  assert.match(r[0].detail, /SEVESO/);
  assert.equal(r[0].theme, 'installations_classees');
  assert.deepEqual(resumeGeorisques(null, 'radon'), []);
  assert.deepEqual(resumeGeorisques({}, 'radon'), []);
  assert.equal(resumeGeorisques({ data: Array.from({ length: 9 }, (_, i) => ({ nom: `S${i}` })) }, 'cavites', 3).length, 3);
});

test('les thèmes de risques exploitables sont décrits', () => {
  assert.ok(THEMES_RISQUES.length >= 6);
  for (const t of THEMES_RISQUES) {
    assert.ok(t.cle && t.nom && t.ic, `${t.cle} complet`);
  }
  assert.ok(THEMES_RISQUES.some((t) => t.cle === 'installations_classees'));
});
