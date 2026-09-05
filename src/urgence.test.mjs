// src/urgence.test.mjs — procédures d'urgence, secours proches, itinéraire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAUT, NUMEROS, PROCEDURES, blocNumeros, choisirProcedure, distanceM,
  etapesGuidees, formaterDistance, formaterDuree, lieuxDepuisReponse,
  resumerRoute, sousCommande, trierParDistance, urlRoute, urlSecoursProche,
} from './urgence.js';

test('le catalogue couvre les grandes urgences', () => {
  const cles = PROCEDURES.map((p) => p.cle);
  for (const attendu of ['generale', 'malaise', 'incendie', 'inondation', 'seisme', 'route', 'gaz', 'noyade', 'disparition', 'risque_majeur', 'brulure']) {
    assert.ok(cles.includes(attendu), `procédure ${attendu} présente`);
  }
  for (const p of PROCEDURES) {
    assert.ok(p.nom && p.mots.length, `${p.cle} complète`);
    assert.ok(p.etapes.length >= 4, `${p.cle} a au moins 4 étapes`);
    assert.ok(p.source, `${p.cle} cite sa source`);
  }
});

test('les numéros d’urgence sont complets', () => {
  const nums = NUMEROS.map((n) => n.numero);
  for (const n of ['112', '15', '17', '18', '114', '196']) assert.ok(nums.includes(n), `${n} présent`);
  const bloc = blocNumeros();
  for (const n of NUMEROS) assert.match(bloc, new RegExp(n.numero.replace(/ /g, ' ')));
});

test('le choix de procédure cible la bonne urgence', () => {
  assert.equal(choisirProcedure('il y a le feu dans la cuisine').cle, 'incendie');
  assert.equal(choisirProcedure('mon père fait un malaise').cle, 'malaise');
  assert.equal(choisirProcedure('l’eau monte dans la rue').cle, 'inondation');
  assert.equal(choisirProcedure('ça tremble').cle, 'seisme');
  assert.equal(choisirProcedure('odeur de gaz dans l’immeuble').cle, 'gaz');
  assert.equal(choisirProcedure('une voiture a percuté un arbre').cle, 'route');
  assert.equal(choisirProcedure('mon fils est tombé dans la piscine').cle, 'noyade');
  assert.equal(choisirProcedure('ma voisine a disparu').cle, 'disparition');
  assert.equal(choisirProcedure('je me suis brûlé la main').cle, 'brulure');
});

test('sans indice, on retombe sur la procédure générale', () => {
  assert.equal(choisirProcedure('').cle, DEFAUT);
  assert.equal(choisirProcedure('je ne sais pas quoi faire').cle, DEFAUT);
  assert.equal(choisirProcedure('urgence').cle, DEFAUT);
});

test('« au secours » ne reste pas bloqué sur la procédure générale', () => {
  assert.equal(choisirProcedure('au secours il y a un incendie').cle, 'incendie');
});

test('une procédure ciblée gagne toujours sur le tronc commun', () => {
  const p = choisirProcedure('urgence incendie');
  assert.equal(p.cle, 'incendie');
});

test('les étapes guidées sont numérotées et illustrées', () => {
  const etapes = etapesGuidees(choisirProcedure('incendie'));
  assert.ok(etapes.length >= 4);
  etapes.forEach((e, i) => {
    assert.equal(e.n, i + 1);
    assert.ok(e.texte.length > 5);
    assert.ok(e.ic && e.ic.length > 0, `étape ${e.n} a une icône`);
  });
  assert.ok(etapes.some((e) => e.ic === '📞'), 'une étape dit d’appeler');
});

test('une destination ajoute une étape « rejoindre »', () => {
  const sans = etapesGuidees(choisirProcedure('malaise'));
  const avec = etapesGuidees(choisirProcedure('malaise'), { destination: 'CHU de Montpellier', distance: '12 km' });
  assert.equal(avec.length, sans.length + 1);
  assert.match(avec.at(-1).texte, /CHU de Montpellier/);
  assert.match(avec.at(-1).texte, /12 km/);
  assert.equal(avec.at(-1).ic, '🧭');
});

test('sous-commandes : fin, suite, secours, itinéraire', () => {
  assert.deepEqual(sousCommande(''), { type: 'procedure', valeur: '' });
  assert.equal(sousCommande('fin').type, 'fin');
  assert.equal(sousCommande('quitter').type, 'fin');
  assert.equal(sousCommande('suite').type, 'suite');
  assert.equal(sousCommande('etape suivante').type, 'suite');
  assert.equal(sousCommande('secours').valeur, 'secours');
  assert.equal(sousCommande('secours hopital').valeur, 'hopital');
  assert.equal(sousCommande('secours pharmacie').valeur, 'pharmacie');
  const it = sousCommande('itineraire hôpital de Sète');
  assert.equal(it.type, 'itineraire');
  assert.equal(it.valeur, 'hopital de sete');
  assert.equal(sousCommande('incendie').type, 'procedure');
  assert.equal(sousCommande('incendie').valeur, 'incendie');
});

test('la requête Overpass cible le bon équipement', () => {
  const u = urlSecoursProche(43.44, 3.75, 'pharmacie', 3000);
  assert.match(u, /overpass|\[out:json\]/i);
  assert.match(u, /around:3000/);
  assert.match(u, /amenity="pharmacy"/);
  assert.match(u, /43\.44000,3\.75000/);
  assert.match(urlSecoursProche(43.44, 3.75, 'inconnu'), /hospital/, 'repli « secours »');
  assert.match(urlSecoursProche(43.44, 3.75, 'secours', 10), /around:200/, 'rayon plancher');
});

test('les lieux sont extraits et triés du plus proche au plus loin', () => {
  const lieux = lieuxDepuisReponse({
    elements: [
      { type: 'node', id: 1, lat: 43.5, lon: 3.8, tags: { amenity: 'hospital', name: 'CHU' } },
      { type: 'node', id: 2, lat: 43.441, lon: 3.751, tags: { amenity: 'pharmacy', name: 'Pharmacie du port', phone: '+33 4 67 00 00 00' } },
      { type: 'way', id: 3, center: { lat: 44.1, lon: 4.0 }, tags: { amenity: 'fire_station' } },
      { type: 'node', id: 4, tags: { amenity: 'doctors' } }, // sans géométrie : ignoré
    ],
  });
  assert.equal(lieux.length, 3);
  assert.equal(lieux[0].nom, 'CHU');
  assert.equal(lieux[1].telephone, '+33 4 67 00 00 00');
  assert.equal(lieux[2].nom, 'Point de secours', 'un nom par défaut est donné');

  const tries = trierParDistance(lieux, 43.44, 3.75);
  assert.equal(tries[0].nom, 'Pharmacie du port');
  assert.ok(tries[0].distance < tries[1].distance);
});

test('distances et durées sont lisibles', () => {
  assert.equal(formaterDistance(340), '340 m');
  assert.equal(formaterDistance(1234), '1.2 km');
  assert.equal(formaterDuree(45), '45 s');
  assert.equal(formaterDuree(600), '10 min');
  assert.equal(formaterDuree(7800), '2 h 10');
  assert.equal(formaterDistance(null), '0 m', 'jamais NaN');
});

test('distance orthodromique : Sète → Montpellier ≈ 26 km', () => {
  const d = distanceM({ lat: 43.4, lon: 3.69 }, { lat: 43.61, lon: 3.877 });
  assert.ok(d > 24_000 && d < 30_000, `mesuré ${Math.round(d)} m`);
});

test('l’itinéraire OSRM est résumé en étapes françaises', () => {
  const r = resumerRoute({
    routes: [{
      distance: 4200, duration: 480,
      geometry: { coordinates: [[3.75, 43.44], [3.76, 43.45], [3.77, 43.46]] },
      legs: [{ steps: [
        { name: 'Avenue de la Mer', maneuver: { type: 'depart' }, distance: 200 },
        { name: 'Rue du Port', maneuver: { type: 'turn', modifier: 'left' }, distance: 800 },
        { maneuver: { type: 'arrive' } },
      ] }],
    }],
  });
  assert.equal(r.distance, 4200);
  assert.equal(r.geometrie.length, 3);
  assert.ok(r.etapes.length >= 2);
  assert.match(r.etapes.join(' | '), /gauche|droite|tout droit/);
  assert.match(r.etapes.at(-1), /Arrivée/);
  assert.equal(resumerRoute({}), null, 'pas de route → null');
});

test('l’URL OSRM est correcte et bornée à un profil connu', () => {
  const u = urlRoute({ lon: 3.75, lat: 43.44 }, { lon: 3.88, lat: 43.61 }, 'walking');
  assert.match(u, /route\/v1\/walking\/3\.750000,43\.440000;3\.880000,43\.610000/);
  assert.match(u, /overview=full/);
  assert.match(urlRoute({ lon: 1, lat: 2 }, { lon: 3, lat: 4 }, 'teleport'), /driving/, 'profil inconnu → voiture');
});
