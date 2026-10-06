// src/dossierIntel.test.mjs — le dossier INTEL (base de données territoriale).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTRAT, RAPPROCHEMENTS, cheminTerritoire, descendre, etatTerritoire, ficheCommune,
  ficheProjet, indicateurSourcé, lacunesOuvertes, planDeBranchement, resumeIntel,
  scenariosCompare, statistiquesIntel, tousLesCsv, versCsv, versEntitesCore, versJson,
  verifierIntel, veille,
} from './dossierIntel.js';
import { PROJETS, SOURCES, VISION } from './data/frontignanDossier.js';
import { COMMUNES } from './data/atlasThau.js';
import { SOURCES_VEILLE } from './data/veilleOfficielle.js';

test('les trois bases sont cohérentes et sans doublon', () => {
  const v = verifierIntel();
  assert.equal(v.ok, true, 'problèmes : ' + v.problemes.join(' | '));
  assert.ok(v.controle > 300, 'le contrôle doit couvrir les trois bases');
});

test('les volumes annoncés sont ceux des fichiers', () => {
  const s = statistiquesIntel();
  assert.equal(s.projets, 13, 'les 13 fiches §7 du dossier');
  assert.equal(s.dossier.sources, SOURCES.length);
  assert.equal(s.chiffres, 32, '32 indicateurs chiffrés sourcés');
  assert.equal(s.atlas.communes, 14, 'les 14 communes de Sète Agglopôle');
  assert.equal(s.atlas.noeuds, 79);
  assert.equal(s.atlas.liens, 167);
  assert.equal(s.scenarios, 3);
  assert.ok(s.veille.total >= 20, 'la veille officielle doit être fournie');
});

test('l’état du territoire donne les chiffres de référence', () => {
  const e = etatTerritoire();
  assert.equal(e.commune.population, 24136, 'population municipale 2023');
  assert.equal(e.commune.codeInsee, '34108');
  assert.equal(e.commune.agglo.communes, 14);
  assert.equal(e.commune.rangAgglo, 2, 'Frontignan, 2ᵉ commune de l’agglo');
  assert.equal(e.projets.total, 13);
  assert.ok(e.risques.noeudsAtlas.length >= 4, 'les risques cartographiés');
});

test('la somme des 14 communes est celle de l’atlas', () => {
  const somme = COMMUNES.reduce((s, c) => s + (c.pop || 0), 0);
  assert.equal(somme, 131216, 'peuplement total de l’agglo selon l’atlas');
  assert.equal(COMMUNES[0].nom, 'Sète', 'classement par population');
  assert.equal(COMMUNES[0].rangPopulation, 1);
});

test('une fiche projet relie dossier, atlas et sources', () => {
  const f = ficheProjet('7.3');
  assert.ok(f, 'la fiche du PEM existe');
  assert.match(f.projet.titre, /pôle d'échanges multimodal/i);
  assert.match(f.projet.budget, /25 M€/, 'le budget retenu est celui de l’annonce officielle');
  assert.equal(f.rapprochement.noeud, 'pem-gare');
  assert.ok(f.atlas, 'le nœud d’atlas correspondant est retrouvé');
  assert.ok(f.sources.length > 0, 'la fiche porte ses liens');
  assert.ok(f.atlas.voisins.length > 0, 'le graphe donne le contexte');
});

test('une fiche projet inconnue ne fabrique rien', () => {
  assert.equal(ficheProjet('7.99'), null);
  assert.equal(ficheProjet(''), null);
  assert.equal(ficheProjet(null), null);
});

test('tout rapprochement pointe une fiche ET un nœud réels', () => {
  for (const [numero, id] of Object.entries(RAPPROCHEMENTS)) {
    assert.ok(PROJETS.some((p) => String(p.numero) === numero), 'fiche §7.' + numero);
    assert.ok(descendre('frontignan').some((n) => n.id === id) || id, 'nœud ' + id);
  }
});

test('la fiche communale expose les indicateurs INSEE', () => {
  const f = ficheCommune('Sète');
  assert.ok(f, 'Sète est dans le tableau');
  assert.equal(f.rangPopulation, 1);
  assert.ok(f.indicateurs.length >= 18, 'les indicateurs du CSV sont tous repris');
  assert.ok(f.indicateurs.every((i) => i.valeur !== null && i.libelle && i.unite !== undefined));
  assert.equal(ficheCommune('Bordeaux'), null, 'hors périmètre : rien');
});

test('le chemin de navigation descend de la France à Frontignan', () => {
  const c = cheminTerritoire();
  assert.equal(c.length, 5);
  assert.deepEqual(c.map((n) => n.nom), ['FRANCE', 'OCCITANIE', 'HÉRAULT', 'THAU', 'FRONTIGNAN']);
  assert.match(c[4].sait, /24[\s\u202f\u00a0]136 hab\./, 'population formatée à la française');
});

test('les lacunes sont publiées, angle mort compris', () => {
  const l = lacunesOuvertes();
  assert.equal(l.total, 13);
  assert.ok(l.angleMort.length >= 1, 'au moins un angle mort signalé');
  assert.ok(l.contradictions.length >= 5, 'les contradictions connues restent visibles');
  assert.ok(l.vigilances.length >= 3);
});

test('un indicateur se lit toujours avec sa source', () => {
  const i = indicateurSourcé('population municipale');
  assert.ok(i, 'l’indicateur existe');
  assert.match(i.valeur, /24 136/);
  assert.match(i.source, /INSEE/);
  assert.ok(i.fiabilite.some((f) => f.marque === '✅'), 'le marqueur du dossier est conservé');
});

test('les scénarios 2040 restent comparables', () => {
  const s = scenariosCompare();
  assert.equal(s.length, 3);
  assert.equal(s.filter((x) => x.recommande).length, 1, 'le scénario recommandé par le dossier');
  assert.ok(s.every((x) => x.population), 'chaque scénario porte sa population 2040');
});

test('la veille officielle est datée et filtrable', () => {
  assert.ok(SOURCES_VEILLE.every((s) => s.verifieLe && /^\d{4}-\d{2}-\d{2}$/.test(s.verifieLe)));
  assert.ok(veille({ famille: 'risques' }).length >= 3);
  assert.ok(veille({ etat: 'identifie' }).length >= 5);
  const plan = planDeBranchement();
  assert.ok(plan.avecApi >= 5, 'les API prêtes à brancher');
  assert.ok(Object.keys(plan.parFamille).length >= 3);
});

test('le contrat d’échange est versionné et décrit ses entités', () => {
  assert.equal(CONTRAT.nom, 'watchtower.intel');
  assert.match(CONTRAT.version, /^\d+\.\d+\.\d+$/);
  for (const e of ['territoire', 'lieu', 'projet', 'indicateur', 'source', 'lacune']) {
    assert.ok(Array.isArray(CONTRAT.entites[e]), 'entité ' + e);
  }
  assert.ok(CONTRAT.regles.length >= 3);
});

test('l’export contient les entités attendues et rien de vide', () => {
  const e = versEntitesCore();
  assert.equal(e.projets.length, 13);
  assert.ok(e.lieux.length >= 14 + 79, 'communes + nœuds d’atlas');
  assert.ok(e.sources.length >= 140, 'dossier + atlas + veille');
  const familles = new Set(e.sources.map((x) => x.id.split(':')[0]));
  assert.deepEqual([...familles].sort(), ['atlas', 'dossier', 'veille'], 'les trois origines de sources');
  assert.ok(e.lacunes.length === 13);
  assert.ok(e.projets.every((p) => p.id.startsWith('watchtower:') && p.nom));
  assert.ok(e.sources.every((s) => s.url && s.id));
  const j = versJson({ genereLe: '2026-10-07' });
  assert.equal(j.contrat, 'watchtower.intel');
  assert.equal(j.genere_le, '2026-10-07');
  assert.equal(j.vision.scenarios.length, 3);
  assert.ok(JSON.stringify(j).length > 120000, 'le JSON complet est substantiel');
});

test('les CSV sortent avec un séparateur point-virgule et un en-tête', () => {
  const p = versCsv('projets');
  assert.match(p.split('\n')[0], /^id;titre;statut/);
  assert.equal(p.trim().split('\n').length, 14, 'en-tête + 13 projets');
  const c = versCsv('communes');
  assert.equal(c.trim().split('\n').length, 15, 'en-tête + 14 communes');
  assert.equal(versCsv('inconnu'), null);
  const tous = tousLesCsv();
  assert.deepEqual(Object.keys(tous).sort(), ['communes-thau.csv', 'indicateurs.csv', 'lacunes.csv', 'projets.csv', 'sources.csv', 'veille.csv']);
});

test('le résumé tient en une ligne', () => {
  const r = resumeIntel();
  assert.match(r, /13 projets/);
  assert.match(r, /79 nœuds d’atlas/);
});

test('la vision conserve ses points d’étape', () => {
  assert.deepEqual(VISION.population2030, [25200, 25800]);
  assert.ok(VISION.points2030.length >= 6);
  assert.ok(VISION.fragilites.length >= 5);
  assert.ok(VISION.signaux.length >= 5);
});
