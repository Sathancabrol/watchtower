// src/entites.test.mjs — couche « entités de la carte » (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMILLES, ICONE_DEFAUT, TABLE_ENTITES, adresseDe, categorieDe, distanceM,
  entitesDepuisReponse, liensSources, regrouper, requeteOverpass, spriteEntite, titreEntite,
} from './entites.js';

test('une boulangerie est reconnue comme telle (icône 🥐)', () => {
  const c = categorieDe({ shop: 'bakery', name: 'La Frontignanaise' });
  assert.equal(c.ic, '🥐');
  assert.equal(c.nom, 'Boulangerie');
  assert.equal(c.source, 'shop=bakery');
  assert.equal(c.couleur, FAMILLES.alimentation.couleur);
});

test('une bibliothèque est reconnue (amenity=library → 📚)', () => {
  const c = categorieDe({ amenity: 'library', name: 'Bibliothèque municipale de Frontignan' });
  assert.equal(c.ic, '📚');
  assert.equal(c.cle, 'enseignement');
});

test('une maison est reconnue (building=house → 🏠)', () => {
  const c = categorieDe({ building: 'house' });
  assert.equal(c.ic, '🏠');
  assert.equal(c.nom, 'Maison');
  assert.equal(c.cle, 'habitat');
});

test('une cuve de stockage est reconnue (man_made=storage_tank → 🛢)', () => {
  const c = categorieDe({ man_made: 'storage_tank', operator: 'Dépôt pétrolier' });
  assert.equal(c.ic, '🛢');
  assert.equal(c.cle, 'industrie');
});

test('les tags de service public passent avant le bâtiment', () => {
  const c = categorieDe({ building: 'yes', amenity: 'townhall' });
  assert.equal(c.ic, '🏛');
  assert.equal(c.source, 'amenity=townhall');
});

test('un tag sans intérêt (amenity=no) est ignoré', () => {
  const c = categorieDe({ amenity: 'no', building: 'house' });
  assert.equal(c.ic, '🏠');
});

test('inconnu = pastille par défaut, jamais de plantage', () => {
  const c = categorieDe();
  assert.equal(c.ic, ICONE_DEFAUT.ic);
  assert.equal(c.cle, 'autre');
  assert.equal(c.source, '');
});

test('chaque entrée de la table pointe vers une famille connue', () => {
  for (const [cle, def] of Object.entries(TABLE_ENTITES)) {
    assert.ok(/^[a-z_]+=(\*|[a-z_]+)$/.test(cle), `clé malformée : ${cle}`);
    assert.ok(FAMILLES[def.cle], `famille inconnue pour ${cle} : ${def.cle}`);
    assert.ok(def.ic && def.nom, `entrée incomplète : ${cle}`);
  }
});

test('adresse reconstituée depuis les tags addr:*', () => {
  assert.equal(adresseDe({ 'addr:housenumber': '14', 'addr:street': 'Rue des Bleuets' }), '14 Rue des Bleuets');
  assert.equal(adresseDe({ 'addr:street': 'Avenue du Port' }), 'Avenue du Port');
  assert.equal(adresseDe({}), '');
});

test('distance orthodromique plausible', () => {
  const d = distanceM({ lat: 43.44, lon: 3.69 }, { lat: 43.45, lon: 3.69 });
  assert.ok(d > 1000 && d < 1200, `distance attendue ~1112 m, obtenue ${d}`);
});

test('titre d’une entité : le nom, sinon la fonction', () => {
  assert.equal(titreEntite({ nom: 'La Frontignanaise' }), 'La Frontignanaise');
  assert.equal(titreEntite({ nom: '', fonction: 'Maison', adresse: '14 Rue des Bleuets' }), 'Maison — 14 Rue des Bleuets');
  assert.equal(titreEntite({ nom: '', fonction: 'Maison' }), 'Maison (sans nom)');
});

test('REGROUPEMENT CADASTRE : 4 cuves voisines = 1 pastille ×4', () => {
  const cuves = [0, 1, 2, 3].map((i) => ({
    lat: 43.44 + i * 0.0002, lon: 3.69, cle: 'industrie', ic: '🛢',
    fonction: 'Cuve de stockage', couleur: '#ffa04d', source: 'man_made=storage_tank',
    nom: `Cuve ${i + 1}`,
  }));
  const g = regrouper(cuves, 45);
  assert.equal(g.length, 1);
  assert.equal(g[0].nombre, 4);
  assert.equal(g[0].membres.length, 4);
  assert.equal(g[0].nom, 'Cuve de stockage ×4');
  assert.equal(g[0].membres[2].nom, 'Cuve 3'); // aucune entité perdue
});

test('deux fonctions différentes côte à côte restent deux pastilles', () => {
  const liste = [
    { lat: 43.44, lon: 3.69, cle: 'alimentation', ic: '🥐', fonction: 'Boulangerie', couleur: '#ffb454', source: 'shop=bakery', nom: 'A' },
    { lat: 43.4401, lon: 3.69, cle: 'restauration', ic: '🍽', fonction: 'Restaurant', couleur: '#ff8b6b', source: 'amenity=restaurant', nom: 'B' },
  ];
  const g = regrouper(liste, 45);
  assert.equal(g.length, 2);
  assert.deepEqual(g.map((x) => x.nom), ['A', 'B']);
});

test('deux boulangeries éloignées ne fusionnent pas', () => {
  const liste = [
    { lat: 43.44, lon: 3.69, cle: 'alimentation', ic: '🥐', fonction: 'Boulangerie', couleur: '#ffb454', source: 'shop=bakery', nom: 'A' },
    { lat: 43.48, lon: 3.69, cle: 'alimentation', ic: '🥐', fonction: 'Boulangerie', couleur: '#ffb454', source: 'shop=bakery', nom: 'B' },
  ];
  assert.equal(regrouper(liste, 45).length, 2);
});

test('les entités sans coordonnées sont écartées', () => {
  const g = regrouper([{ lat: NaN, lon: 3 }, { lat: 43, lon: 3, cle: 'autre', ic: '📌', fonction: 'Lieu', couleur: '#8ea0b5' }]);
  assert.equal(g.length, 1);
  assert.equal(g[0].nombre, 1);
});

test('le barycentre d’un groupe est dans son emprise', () => {
  const g = regrouper([
    { lat: 43.44, lon: 3.69, cle: 'a', ic: 'x', fonction: 'F', couleur: '#fff' },
    { lat: 43.45, lon: 3.70, cle: 'a', ic: 'x', fonction: 'F', couleur: '#fff' },
  ], 5000);
  assert.equal(g.length, 1);
  assert.ok(g[0].lat > 43.44 && g[0].lat < 43.45);
  assert.ok(g[0].lon > 3.69 && g[0].lon < 3.70);
});

test('requête Overpass : rayon borné et centres demandés', () => {
  const q = requeteOverpass(43.4432, 3.6901, 800);
  assert.match(q, /around:800,43\.44320,3\.69010/);
  assert.match(q, /out center tags 800;/);
  assert.match(q, /\[shop\]/);
  assert.match(q, /\[man_made\]/);
  assert.match(requeteOverpass(0, 0, -5), /around:100,/);
});

test('réponse Overpass → entités normalisées (nœud et surface)', () => {
  const d = {
    elements: [
      { type: 'node', id: 1, lat: 43.44, lon: 3.69, tags: { amenity: 'library', name: 'Bibliothèque de Frontignan', 'addr:housenumber': '2', 'addr:street': 'Rue Victor Hugo' } },
      { type: 'way', id: 2, center: { lat: 43.45, lon: 3.70 }, tags: { building: 'house' } },
      { type: 'way', id: 3, tags: { building: 'house' } }, // sans centre : écarté
    ],
  };
  const e = entitesDepuisReponse(d);
  assert.equal(e.length, 2);
  assert.equal(e[0].nom, 'Bibliothèque de Frontignan');
  assert.equal(e[0].adresse, '2 Rue Victor Hugo');
  assert.equal(e[0].ic, '📚');
  assert.equal(e[0].osmId, 'node/1');
  assert.equal(e[1].ic, '🏠');
  assert.equal(e[1].nom, '');
});

test('filtre par famille sur la réponse', () => {
  const d = {
    elements: [
      { type: 'node', id: 1, lat: 0, lon: 0, tags: { shop: 'bakery' } },
      { type: 'node', id: 2, lat: 0, lon: 0, tags: { amenity: 'bar' } },
    ],
  };
  const e = entitesDepuisReponse(d, new Set(['alimentation']));
  assert.equal(e.length, 1);
  assert.equal(e[0].ic, '🥐');
});

test('réponse vide ou invalide : aucune entité, aucune erreur', () => {
  assert.deepEqual(entitesDepuisReponse(null), []);
  assert.deepEqual(entitesDepuisReponse({}), []);
});

test('le sprite n’est dessiné que côté navigateur', () => {
  assert.equal(spriteEntite({ ic: '🥐', couleur: '#fff', nombre: 3 }), null);
});

test('les sources sont des hyperliens vérifiables', () => {
  const s = liensSources();
  assert.ok(s.length >= 2);
  for (const x of s) {
    assert.match(x.url, /^https:\/\//);
    assert.ok(x.nom && x.detail);
  }
  assert.ok(s.some((x) => /overpass/i.test(x.nom)));
});
