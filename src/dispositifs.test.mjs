// src/dispositifs.test.mjs — caméras, micros, capteurs : partie pure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TYPES, descriptionScene, dispositifsDepuisReponse, estimerPresence, iconePour,
  lireFlux, natureFlux, niveauRequis, resumer, sourcePour, urlDispositifs,
} from './dispositifs.js';

test('les types couvrent caméras, micros et capteurs', () => {
  const ids = TYPES.map((t) => t.id);
  for (const attendu of ['camera_publique', 'webcam_locale', 'flux_ajoute', 'micro_public', 'micro_local', 'capteur', 'reseau_premium']) {
    assert.ok(ids.includes(attendu), `${attendu} existe`);
  }
  for (const t of TYPES) {
    assert.ok(['gratuit', 'compte', 'payant'].includes(t.niveau), `${t.id} a un niveau`);
    assert.ok(t.source, `${t.id} documente sa source`);
  }
});

test('niveau, icône et source par type', () => {
  assert.equal(niveauRequis('camera_publique'), 'gratuit');
  assert.equal(niveauRequis('reseau_premium'), 'payant');
  assert.equal(niveauRequis('inconnu'), 'payant', 'inconnu = payant (prudence)');
  assert.equal(iconePour('micro_local'), '🎤');
  assert.equal(iconePour('inconnu'), '📷');
  assert.match(sourcePour('camera_publique'), /OpenStreetMap/);
  assert.equal(sourcePour('inconnu'), 'source inconnue');
});

test('requête Overpass des caméras autour d’un point', () => {
  const u = urlDispositifs(43.44, 3.75, 1500);
  assert.match(u, /\[out:json\]/);
  assert.match(u, /around:1500/);
  assert.match(u, /43\.44000,3\.75000/);
  assert.match(u, /man_made=surveillance/);
  assert.match(urlDispositifs(43.44, 3.75, 10), /around:100/, 'rayon plancher');
});

test('réponse Overpass → dispositifs exploités', () => {
  const d = dispositifsDepuisReponse({
    elements: [
      { type: 'node', id: 1, lat: 43.44, lon: 3.75, tags: { man_made: 'surveillance', 'camera:mount': 'pole', 'camera:direction': '210', 'camera:distance': '30', operator: 'Ville de Frontignan' } },
      { type: 'way', id: 2, center: { lat: 43.45, lon: 3.76 }, tags: { man_made: 'surveillance', 'camera:stream': 'http://cam.example/snap.jpg' } },
      { type: 'node', id: 3, tags: { man_made: 'surveillance' } }, // sans géométrie
    ],
  });
  assert.equal(d.length, 2);
  assert.equal(d[0].nom, 'pole', 'le support sert de nom quand le lieu n’en a pas');
  assert.equal(d[0].orientation, 210);
  assert.equal(d[0].portee, 30);
  assert.equal(d[0].operateur, 'Ville de Frontignan');
  assert.equal(d[1].url, 'http://cam.example/snap.jpg');
  assert.equal(d[1].sourceUrl, 'https://www.openstreetmap.org/way/2');
  assert.deepEqual(dispositifsDepuisReponse(null), []);
});

test('nature d’un flux devinée depuis l’URL', () => {
  assert.equal(natureFlux('http://cam/snapshot.jpg'), 'image');
  assert.equal(natureFlux('http://cam/mjpg/video.mjpg'), 'image');
  assert.equal(natureFlux('http://cam/live/stream.m3u8'), 'hls');
  assert.equal(natureFlux('https://www.youtube.com/watch?v=x'), 'page');
  assert.equal(natureFlux('http://cam/v.mp4'), 'video');
  assert.equal(natureFlux(''), 'aucun');
  assert.equal(natureFlux('http://inconnu/flux'), 'inconnu');
});

test('description de scène : on mesure, on n’invente pas', () => {
  const calme = descriptionScene({ mouvement: 0.2, son: 0.01, luminosite: 0.1 });
  assert.match(calme.texte, /immobile/);
  assert.match(calme.texte, /silence/);
  assert.match(calme.texte, /sombre/);
  assert.match(calme.methode, /localement/);
  const anime = descriptionScene({ mouvement: 40, son: 0.6, luminosite: 0.9 });
  assert.match(anime.texte, /très animée/);
  assert.match(anime.texte, /sonore élevé/);
  assert.match(anime.texte, /fortement éclairé/);
  assert.equal(descriptionScene({}).texte, 'aucune mesure disponible', 'sans mesure : on le dit');
});

test('présence estimée : 4 paliers, jamais un comptage', () => {
  assert.equal(estimerPresence({ mouvement: 0, son: 0 }).niveau, 'aucune activité');
  assert.equal(estimerPresence({ mouvement: 4, son: 0.05 }).niveau, 'présence possible');
  assert.equal(estimerPresence({ mouvement: 15, son: 0.2 }).niveau, 'activité détectée');
  assert.equal(estimerPresence({ mouvement: 60 }).niveau, 'forte activité');
  for (const e of [estimerPresence({}), estimerPresence()]) assert.ok(e.ic, 'une icône même à vide');
});

test('résumé de fiche : toutes les infos utiles, avec la source', () => {
  const d = {
    type: 'camera_publique', nom: 'Caméra du port', lat: 43.4405, lon: 3.7512,
    operateur: 'Ville', support: 'mât', orientation: 210, portee: 30,
    url: 'http://cam/snap.jpg', sourceUrl: 'https://www.openstreetmap.org/node/1',
  };
  const t = resumer(d);
  assert.match(t, /Caméra du port/);
  assert.match(t, /Caméra publique/);
  assert.match(t, /exploitant : Ville/);
  assert.match(t, /orientation : 210°/);
  assert.match(t, /portée : 30 m/);
  assert.match(t, /43\.44050, 3\.75120/, 'la position est arrondie');
  assert.match(t, /source : OpenStreetMap/);
  assert.match(t, /openstreetmap\.org\/node\/1/, 'le lien vers la donnée brute');
  assert.match(resumer({ type: 'inconnu' }), /inconnu/, 'pas d’erreur');
});

test('flux enregistrés : tolérants à un stockage absent', () => {
  const mem = { items: new Map(), getItem(k) { return this.items.has(k) ? this.items.get(k) : null; }, setItem(k, v) { this.items.set(k, String(v)); } };
  assert.deepEqual(lireFlux(mem), []);
  assert.deepEqual(lireFlux(null), [], 'sans stockage : pas d’erreur');
  mem.setItem('watchtower.dispositifs.v1', '{ pas du json');
  assert.deepEqual(lireFlux(mem), [], 'stockage corrompu ignoré');
  mem.setItem('watchtower.dispositifs.v1', '"chaine"');
  assert.deepEqual(lireFlux(mem), [], 'un non-tableau → vide');
});
