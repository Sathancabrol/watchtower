// src/data/frontignan.test.mjs — la base locale d'amorçage et son registre.
//
// La règle du fichier est simple et c'est elle qu'on teste : AUCUNE fiche
// n'entre dans la base sans une source résoluble dans le registre, et rien
// n'est présenté comme certain quand ce ne l'est pas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSOCIATIONS, BASE_LOCALE, CATEGORIES_POI, EVENEMENTS, MEDIAS, POIS, RESEAUX,
  SOURCES, TRANSFORMATIONS, detteVerification, inventaireBase, source,
} from './frontignan.js';
import { DOMAINES_ASSOCIATION, RESEAUX_TECHNIQUES, enumDe } from './attributsTerritoire.js';
import { QUARTIERS_FRONTIGNAN } from './thauTerritoire.js';

const TABLES = {
  poi: POIS,
  association: ASSOCIATIONS,
  evenement: EVENEMENTS,
  reseau: RESEAUX,
  transformation: TRANSFORMATIONS,
  media: MEDIAS,
};

test('le registre des sources est complet, unique et datable', () => {
  assert.ok(SOURCES.length >= 20, `${SOURCES.length} sources`);
  const ids = new Set();
  const typesAutorises = new Set(enumDe('source', 'type_source'));
  for (const s of SOURCES) {
    assert.ok(!ids.has(s.id), `source en double : ${s.id}`);
    ids.add(s.id);
    assert.ok(s.titre && s.editeur, `source ${s.id} incomplète`);
    assert.match(s.url, /^https:\/\//, `source ${s.id} : URL`);
    assert.ok(typesAutorises.has(s.type_source), `source ${s.id} : type ${s.type_source}`);
    assert.ok(Number.isInteger(s.fiabilite) && s.fiabilite >= 1 && s.fiabilite <= 5, `source ${s.id} : fiabilité`);
    assert.ok(s.notes, `source ${s.id} : notes d’usage`);
  }
  assert.equal(source('src_frontignan_officiel').editeur, 'Ville de Frontignan');
  assert.equal(source('src-inconnue'), null);
});

test('la taxonomie des lieux couvre dix catégories non vides', () => {
  const categories = Object.keys(CATEGORIES_POI);
  assert.equal(categories.length, 10);
  for (const c of categories) {
    assert.ok(Array.isArray(CATEGORIES_POI[c]) && CATEGORIES_POI[c].length > 0, `catégorie ${c} vide`);
    assert.equal(new Set(CATEGORIES_POI[c]).size, CATEGORIES_POI[c].length, `catégorie ${c} : doublons`);
  }
});

test('chaque fiche cite une source du registre — sans exception', () => {
  const connues = new Set(SOURCES.map((s) => s.id));
  for (const [table, liste] of Object.entries(TABLES)) {
    for (const fiche of liste) {
      assert.ok(fiche.source_id, `${table}/${fiche.id} : source_id manquant`);
      assert.ok(connues.has(fiche.source_id), `${table}/${fiche.id} : source inconnue ${fiche.source_id}`);
      assert.ok(fiche.confiance, `${table}/${fiche.id} : confiance manquante`);
      assert.ok(fiche.id, `${table} : une fiche sans identifiant`);
    }
  }
});

test('les lieux sont cartographiables et rangés par quartier de Frontignan', () => {
  assert.equal(POIS.length, 18);
  const quartiers = new Set(QUARTIERS_FRONTIGNAN.map((q) => q.nom));
  const statuts = new Set(enumDe('poi', 'statut'));
  const confiances = new Set(enumDe('poi', 'confiance'));
  const ids = new Set();
  for (const p of POIS) {
    assert.match(p.id, /^poi_/, `${p.id} : préfixe`);
    assert.ok(!ids.has(p.id), `lieu en double : ${p.id}`);
    ids.add(p.id);
    assert.ok(CATEGORIES_POI[p.categorie]?.includes(p.type_objet), `${p.id} : type hors catégorie`);
    assert.ok(p.lat > 43.4 && p.lat < 43.49, `${p.id} : latitude`);
    assert.ok(p.lon > 3.7 && p.lon < 3.83, `${p.id} : longitude`);
    assert.ok(p.precision_m > 0, `${p.id} : précision géométrique`);
    assert.ok(statuts.has(p.statut), `${p.id} : statut ${p.statut}`);
    assert.ok(confiances.has(p.confiance), `${p.id} : confiance ${p.confiance}`);
    assert.ok(quartiers.has(p.quartier), `${p.id} : quartier inconnu « ${p.quartier} »`);
  }
});

test('les associations utilisent les domaines du guide et un lieu réel', () => {
  const lieux = new Set(POIS.map((p) => p.id));
  const statuts = new Set(enumDe('association', 'statut'));
  for (const a of ASSOCIATIONS) {
    assert.ok(a.domaines.length > 0, `${a.id} : domaines`);
    for (const d of a.domaines) {
      assert.ok(DOMAINES_ASSOCIATION.includes(d), `${a.id} : domaine hors guide ${d}`);
    }
    assert.ok(statuts.has(a.statut), `${a.id} : statut ${a.statut}`);
    if (a.lieu_activite) assert.ok(lieux.has(a.lieu_activite), `${a.id} : lieu de pratique inconnu`);
    assert.equal(a.confiance, 'à vérifier', `${a.id} : un modèle de guide reste à vérifier`);
  }
});

test('les événements pointent des lieux réels et ne datent rien en dur', () => {
  const lieux = new Set(POIS.map((p) => p.id));
  for (const e of EVENEMENTS) {
    assert.ok(e.lieux.length > 0, `${e.id} : lieux`);
    for (const l of e.lieux) assert.ok(lieux.has(l), `${e.id} : lieu inconnu ${l}`);
    assert.equal(e.statut, 'a_confirmer', `${e.id} : une date non importée reste à confirmer`);
    if (e.recurrence) assert.match(e.recurrence, /^FREQ=/, `${e.id} : règle de récurrence RFC 5545`);
  }
});

test('les réseaux sont marqués « à importer » et classés par famille du schéma', () => {
  const familles = new Set(RESEAUX_TECHNIQUES.map((r) => r.id));
  for (const r of RESEAUX) {
    assert.ok(familles.has(r.famille), `${r.id} : famille inconnue ${r.famille}`);
    assert.equal(r.statut_donnee, 'a_importer', `${r.id} : un réseau sans levé reste à importer`);
    assert.equal(r.classe_precision, 'inconnue', `${r.id} : on n’invente pas une classe de précision`);
    assert.ok(r.gestionnaire, `${r.id} : gestionnaire`);
  }
});

test('les transformations et les médias restent des dossiers à documenter', () => {
  for (const t of TRANSFORMATIONS) {
    assert.ok(t.type_transformation && t.usage_avant && t.usage_apres, `${t.id} incomplète`);
    assert.ok(t.statut, `${t.id} : statut`);
    assert.equal(t.confiance, 'à vérifier', `${t.id} : pas de budget ni de date inventés`);
    assert.equal(t.budget_eur, undefined, `${t.id} : aucun montant inventé`);
  }
  const lieux = new Set(POIS.map((p) => p.id));
  for (const m of MEDIAS) {
    assert.ok(lieux.has(m.entite_id), `${m.id} : entité inconnue ${m.entite_id}`);
    assert.ok(m.statut_donnee, `${m.id} : statut de la donnée`);
    assert.ok(m.legende, `${m.id} : légende`);
    assert.ok(m.confiance, `${m.id} : confiance`);
  }
});

test('l’inventaire et la dette de vérification disent la vérité du fichier', () => {
  assert.deepEqual(Object.keys(BASE_LOCALE).sort(), [
    'associations', 'evenements', 'medias', 'pois', 'reseaux', 'sources', 'transformations',
  ]);
  const inv = inventaireBase();
  assert.equal(inv.poi, POIS.length);
  assert.equal(inv.associations, ASSOCIATIONS.length);
  assert.equal(inv.evenements, EVENEMENTS.length);
  assert.equal(inv.reseaux, RESEAUX.length);
  assert.equal(inv.transformations, TRANSFORMATIONS.length);
  assert.equal(inv.medias, MEDIAS.length);
  assert.equal(inv.sources, SOURCES.length);

  const attendue = Object.values(TABLES)
    .flat()
    .filter((f) => f.confiance === 'à vérifier').length;
  assert.equal(detteVerification(), attendue);
  assert.ok(detteVerification() > 0, 'la base d’amorçage assume sa dette');
});
