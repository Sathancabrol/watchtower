// src/sourcesOfficielles.test.mjs — connecteurs officiels (URL + lecture, sans réseau).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCES_OFFICIELLES, decouperCsv, entitesGeoJson, geomPoint, lireCommune, lireDvf,
  lireMarchesBoamp, lireMarchesDecp, lireNature, lireParcelles, lirePrescriptions,
  lireZonage, mediane, resumeDvf, resumeSourcesOfficielles, sourceOfficielle,
  nombreOuNull, sourcesNonVerifiees, totalMarches, urlBoamp, urlCadastre, urlCommunePoint, urlDecp,
  urlDvfCommune, urlNature, urlPrescriptions, urlZonage, verifierSourcesOfficielles,
} from './sourcesOfficielles.js';

// ───────────────────────── registre ─────────────────────────

test('le registre des sources officielles est complet et honnête', () => {
  const v = verifierSourcesOfficielles();
  assert.equal(v.ok, true, v.problemes.join(' | '));
  assert.equal(v.controle, 7, 'sept sources prêtes à l’emploi');
  for (const s of SOURCES_OFFICIELLES) {
    assert.match(s.doc, /^https:\/\//, s.cle + ' : documentation');
    assert.ok(s.licence && s.donnees && s.producteur, s.cle + ' : fiche incomplète');
  }
});

test('les sources non vérifiées en ligne sont déclarées, pas cachées', () => {
  const n = sourcesNonVerifiees();
  assert.equal(n.length, 7, 'aucune n’a pu être appelée depuis l’atelier');
  assert.ok(n.every((s) => s.nom && s.doc));
  assert.match(resumeSourcesOfficielles(), /à confirmer en ligne/);
});

test('sourceOfficielle ne fabrique rien', () => {
  assert.equal(sourceOfficielle('dvf').cle, 'dvf');
  assert.equal(sourceOfficielle('inexistante'), null);
  assert.equal(sourceOfficielle(null), null);
});

// ───────────────────────── URL ─────────────────────────

test('le point GeoJSON est encodé dans l’ordre longitude, latitude', () => {
  assert.equal(nombreOuNull(null), null, 'null ne devient jamais 0');
  assert.equal(nombreOuNull(''), null, 'chaîne vide : rien');
  assert.equal(nombreOuNull('  '), null);
  assert.equal(nombreOuNull('0'), 0, 'un vrai zéro reste un zéro');
  assert.equal(nombreOuNull('4 560'), 4560, 'espaces de milliers tolérés');
  assert.equal(nombreOuNull('12,5'), 12.5, 'virgule décimale française');
  const g = geomPoint(3.7567, 43.447);
  assert.equal(decodeURIComponent(g), '{"type":"Point","coordinates":[3.7567,43.447]}');
  assert.equal(geomPoint('x', 43), null, 'coordonnée non numérique : rien');
  assert.equal(geomPoint(null, null), null);
});

test('les URL de l’API Carto portent le point encodé', () => {
  const z = urlZonage(3.7567, 43.447);
  assert.match(z, /^https:\/\/apicarto\.ign\.fr\/api\/gpu\/zone-urba\?geom=/);
  assert.match(z, /coordinates%22%3A%5B3\.7567%2C43\.447%5D/);
  assert.match(urlPrescriptions(3.7567, 43.447), /prescription-surf/);
  assert.match(urlCadastre(3.7567, 43.447), /api\/cadastre\/parcelle\?geom=/);
  assert.match(urlNature(3.7567, 43.447), /^https:\/\/apicarto\.ign\.fr\/api\/nature\?geom=/);
  assert.equal(urlZonage('x', 0), null);
});

test('l’URL DVF déduit le département du code INSEE', () => {
  assert.equal(urlDvfCommune('34108'), 'https://files.data.gouv.fr/geo-dvf/latest/csv/34/communes/34108.csv');
  assert.match(urlDvfCommune('2A004'), /csv\/2A\/communes\/2A004\.csv/, 'Corse : code départemental à deux caractères');
  assert.match(urlDvfCommune('97123'), /csv\/971\/communes\/97123\.csv/, 'outre-mer : trois chiffres');
  assert.equal(urlDvfCommune('341'), null, 'code incomplet : rien');
  assert.equal(urlDvfCommune(''), null);
});

test('l’URL commune d’un point demande les champs utiles', () => {
  const u = urlCommunePoint(3.7567, 43.447);
  const q = new URLSearchParams(u.split('?')[1]);
  assert.equal(q.get('lat'), '43.447');
  assert.equal(q.get('lon'), '3.7567');
  assert.match(q.get('fields'), /code/);
  assert.equal(urlCommunePoint('x', 1), null);
});

test('les URL de marchés filtrent, limitent et trient', () => {
  const b = new URLSearchParams(urlBoamp('Frontignan', { limite: 5, departement: 34 }).split('?')[1]);
  assert.match(b.get('where'), /search\("Frontignan"\)/);
  assert.match(b.get('where'), /code_departement="34"/);
  assert.equal(b.get('limit'), '5');
  assert.equal(b.get('order_by'), 'dateparution desc');
  assert.match(urlBoamp('Frontignan'), /boamp-datadila\.opendatasoft\.com/, 'sans département, la recherche reste');
  assert.equal(urlBoamp('ab'), null, 'moins de trois lettres : rien');
  assert.equal(urlBoamp(''), null);
  const d = urlDecp('Frontignan');
  assert.match(d, /data\.economie\.gouv\.fr/);
  assert.match(d, /decp-2022-marches-valides/);
  assert.match(urlDecp('Frontignan', { jeu: 'decp-2024-marches-valides' }), /decp-2024/);
  assert.equal(urlDecp('ab'), null);
});

test('les guillemets sont neutralisés dans la recherche', () => {
  const q = new URLSearchParams(urlBoamp('Frontignan "raffinerie"').split('?')[1]);
  assert.equal((q.get('where').match(/"/g) || []).length, 2, 'seules les guillemets de search() restent');
});

// ───────────────────────── lecture GeoJSON ─────────────────────────

test('lecteur GeoJSON : tolérant, jamais bloquant', () => {
  assert.deepEqual(entitesGeoJson(null), []);
  assert.deepEqual(entitesGeoJson({}), []);
  assert.deepEqual(entitesGeoJson('texte'), []);
  assert.equal(entitesGeoJson({ features: [{}, {}] }).length, 2);
});

test('une zone d’urbanisme se lit avec son règlement', () => {
  const brut = { type: 'FeatureCollection', features: [
    { properties: { libelle: 'UB', typezone: 'U', partition: 'UBa', destdomi: 'habitat', urlfic: 'https://x/reglement.pdf', nomfic: 'PLU 2026' } },
    { properties: { libelong: 'AUs', typezone: 'AU' } },
    { properties: {} },
    { properties: { libelle: 'UB', partition: 'UBa' } }, // doublon exact : écarté
  ] };
  const z = lireZonage(brut);
  assert.equal(z.nombre, 3, 'trois zones distinctes, doublon écarté');
  assert.equal(z.zones[0].libelle, 'UB');
  assert.match(z.zones[0].reglement, /reglement\.pdf$/);
  assert.equal(z.zones[1].libelle, 'AUs', 'repli sur libelong');
  assert.equal(z.zones[2].libelle, 'zone sans libellé', 'jamais vide en silence');
  assert.equal(lireZonage(null).vide, true);
});

test('une prescription et une parcelle se lisent en unités françaises', () => {
  const p = lirePrescriptions({ features: [{ properties: { libelle: 'ER n°3', catpsc: 'emplacement réservé' } }] });
  assert.equal(p[0].libelle, 'ER n°3');
  assert.equal(p[0].categorie, 'emplacement réservé');
  const parcelles = lireParcelles({ features: [
    { properties: { section: 'AB', numero: '0123', contenance: '4560', nom_com: 'Frontignan', idu: '34108000AB0123' } },
    { properties: { section: 'AB' } },
  ] });
  assert.equal(parcelles[0].contenance, 4560);
  assert.equal(parcelles[0].contenanceHa, 0.456, 'contenance convertie en hectares');
  assert.equal(parcelles[1].contenance, null, 'contenance absente : null, pas zéro');
});

test('les zonages naturels sont nommés, même sans libellé propre', () => {
  const n = lireNature({ features: [
    { properties: { nom: 'Étang de Thau', type: 'ZSC', id: 'FR9101419' } },
    { properties: {} },
  ] });
  assert.equal(n[0].nom, 'Étang de Thau');
  assert.equal(n[0].type, 'ZSC');
  assert.equal(n[1].nom, 'site sans nom');
  assert.equal(n[1].type, 'zonage naturel');
});

test('la commune d’un point se lit même si la liste est vide', () => {
  assert.equal(lireCommune([]), null);
  assert.equal(lireCommune(null), null);
  const c = lireCommune([{ nom: 'Frontignan', code: '34108', codesPostaux: ['34110'], population: 24136 }]);
  assert.deepEqual(c, { nom: 'Frontignan', codeInsee: '34108', codesPostaux: ['34110'], population: 24136 });
});

// ───────────────────────── DVF ─────────────────────────

const CSV_DVF = [
  'id_mutation,date_mutation,num_dispo,nature_mutation,valeur_fonciere,adresse_nom_voie,code_postal,type_local,surface_reelle_bati,nombre_pieces_principales,longitude,latitude',
  '2024-1,2024-03-12,1,Vente,185000.00,"AVENUE DE LA GARE",34110,Appartement,62,3,3.7567,43.4470',
  '2024-2,2024-01-05,1,Vente,320000.00,"RUE VOLTAIRE, BAT A",34110,Maison,95,4,3.7600,43.4460',
  '2024-3,2024-02-02,1,Vente,120000.00,"CANAL",34110,Maison,120,5,,',
  '2023-9,2023-11-01,1,Vente,190000.00,"QUAI",34110,Appartement,64,3,,',
  '2022-9,2022-09-01,1,Vente,150000.00,"PLACE",34110,Maison,100,4,,',
].join('\n');

test('le CSV DVF se découpe même avec des virgules entre guillemets', () => {
  const c = decouperCsv('a,"RUE VOLTAIRE, BAT A",3');
  assert.deepEqual(c, ['a', 'RUE VOLTAIRE, BAT A', '3']);
  assert.deepEqual(decouperCsv('x,"guillemet ""interne""",y'), ['x', 'guillemet "interne"', 'y']);
});

test('les transactions DVF sont lues avec leur prix au m²', () => {
  const d = lireDvf(CSV_DVF);
  assert.equal(d.nombre, 5);
  const prem = d.transactions[0];
  assert.equal(prem.prix, 185000);
  assert.equal(prem.surface, 62);
  assert.equal(prem.prixM2, 2984);
  assert.equal(prem.annee, 2024);
  assert.equal(prem.type, 'Appartement');
  assert.equal(d.transactions[2].prixM2, 1000, '120 000 / 120 m²');
  assert.equal(lireDvf('').vide, true);
  assert.equal(lireDvf('a,b\n').vide, true, 'en-tête sans données');
  assert.equal(lireDvf('inconnu,totalement\n1,2').vide, true, 'colonnes absentes : rien, pas une erreur');
});

test('la médiane résiste aux valeurs extrêmes et aux trous', () => {
  assert.equal(mediane([1000, 3000, 2000]), 2000);
  assert.equal(mediane([1000, 3000, 2000, 4000]), 2500);
  assert.equal(mediane([null, undefined, NaN]), null);
  assert.equal(mediane([]), null);
  assert.equal(mediane([5000]), 5000);
});

test('le résumé DVF donne le prix médian par type depuis une année', () => {
  const r = resumeDvf(lireDvf(CSV_DVF), { depuis: 2022 });
  assert.equal(r.nombre, 5);
  assert.equal(r.anneeRecente, 2024);
  const appt = r.parType.find((p) => p.type === 'Appartement');
  const maison = r.parType.find((p) => p.type === 'Maison');
  assert.equal(appt.nombre, 2);
  assert.equal(appt.medianeM2, 2977, 'médiane des deux appartements 2024 (2984 et 2969)');
  assert.equal(maison.nombre, 3, 'les trois maisons depuis 2022 (2024 ×2 + 2022)');
  assert.equal(r.dernieres[0].date, '2024-03-12', 'ventes triées, la plus récente d’abord');
  const r2024 = resumeDvf(lireDvf(CSV_DVF), { depuis: 2024 });
  assert.equal(r2024.nombre, 3, 'le filtre par année fonctionne');
});

// ───────────────────────── marchés publics ─────────────────────────

test('les avis BOAMP se lisent avec leur lien de consultation', () => {
  const brut = { results: [
    { idweb: '26-12345', objet: 'Réfection de la voirie', nomacheteur: 'Ville de Frontignan', dateparution: '2026-09-01', datelimitereponse: '2026-10-01', code_departement: '34', procedure_libelle: 'MAPA' },
    { objet: 'Sans identifiant' },
  ] };
  const m = lireMarchesBoamp(brut);
  assert.equal(m.length, 2);
  assert.equal(m[0].acheteur, 'Ville de Frontignan');
  assert.match(m[0].url, /boamp\.fr\/pages\/avis/);
  assert.equal(m[0].limite, '2026-10-01');
  assert.equal(m[1].url, null, 'pas d’identifiant : pas de lien inventé');
  assert.equal(lireMarchesBoamp(null).length, 0);
});

test('les marchés DECP se lisent avec montant et titulaire', () => {
  const m = lireMarchesDecp({ results: [
    { id: 'M1', objet: 'Aménagement du cœur de ville', acheteur_nom: 'Ville de Frontignan', titulaire_nom: 'COLAS', montant: 1250000, dureemois: 14, datepublication: '2026-06-01' },
    { objet: 'Sans montant' },
  ] });
  assert.equal(m[0].titulaire, 'COLAS');
  assert.equal(m[0].montant, 1250000);
  assert.equal(m[0].dureeMois, 14);
  assert.equal(m[1].montant, null);
  const total = totalMarches(m);
  assert.deepEqual(total, { nombre: 1, total: 1250000 }, 'seuls les montants publiés comptent');
  assert.equal(totalMarches([]), null);
});
