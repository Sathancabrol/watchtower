// src/data/attributsTerritoire.test.mjs — le schéma d'attributs du territoire.
//
// Ce que ces tests protègent : un schéma complet (chaque table a ses colonnes,
// chaque champ son niveau de complétude, chaque enum sa liste) et des
// fonctions de validation qui ne mentent pas — un champ vide est signalé, une
// fiche sans source reste hors contrat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_LOCALISEE, CHAMPS_RECURRENCE, CHECKLIST_RESEAUX, CLASSES_PRECISION,
  CYCLE_EVENEMENT, DOMAINES_ASSOCIATION, FAMILLES_EVENEMENT, GUIDE_ASSOCIATIONS,
  NIVEAUX_COMPLETUDE, RESEAUX_TECHNIQUES, SOUS_DOMAINES_ASSOCIATION, TYPES_CHAMP,
  TYPES_ENTITE, champsDe, champsRequis, colonnesCsv, diagnosticCollection, enumDe,
  niveauAtteint, nomNiveau, repartitionNiveaux, typeEntite, valider, versCsv,
} from './attributsTerritoire.js';

/** Remplit une fiche au niveau demandé, uniquement avec des valeurs du schéma. */
function remplir(type, niveau) {
  const fiche = {};
  for (const champ of champsDe(type)) {
    if (Number(champ.niveau) > niveau) continue;
    if (champ.exemple !== undefined) {
      fiche[champ.cle] = champ.exemple;
      continue;
    }
    if (champ.type === 'enum' && Array.isArray(champ.enum)) fiche[champ.cle] = champ.enum[0];
    else if (champ.type === 'liste') fiche[champ.cle] = ['x'];
    else if (champ.type === 'nombre') fiche[champ.cle] = 1;
    else if (champ.type === 'booleen') fiche[champ.cle] = true;
    else if (champ.type === 'geojson') fiche[champ.cle] = { type: 'Point', coordinates: [3.75, 43.44] };
    else if (champ.type === 'json') fiche[champ.cle] = { note: 'x' };
    else fiche[champ.cle] = 'x';
  }
  return fiche;
}

test('les cinq niveaux de complétude sont ordonnés et nommés', () => {
  assert.deepEqual(NIVEAUX_COMPLETUDE.map((n) => n.niveau), [1, 2, 3, 4, 5]);
  assert.equal(NIVEAUX_COMPLETUDE[0].nom, 'CARTOGRAPHIABLE');
  assert.equal(NIVEAUX_COMPLETUDE[4].nom, 'JUMEAU LOCAL');
  for (const n of NIVEAUX_COMPLETUDE) assert.ok(n.aide, `niveau ${n.niveau} sans aide`);
});

test('chaque type d’entité déclare une table et des colonnes saines', () => {
  const types = Object.keys(TYPES_ENTITE);
  assert.equal(types.length, 13);
  for (const type of types) {
    const def = TYPES_ENTITE[type];
    assert.ok(def.nom && def.icone, `${type} : nom et icône`);
    assert.match(def.table, /^[a-z_]+\.csv$/, `${type} : table CSV`);
    assert.ok(def.cle, `${type} : préfixe d’identifiant`);
    assert.ok(def.champs.length > 0, `${type} : champs`);
    const cles = def.champs.map((c) => c.cle);
    assert.equal(new Set(cles).size, cles.length, `${type} : clés de champ uniques`);
    assert.ok(cles.includes('id'), `${type} : une clé « id »`);
    for (const champ of def.champs) {
      const nom = `${type}.${champ.cle}`;
      assert.ok(champ.libelle, `${nom} : libellé`);
      assert.ok(TYPES_CHAMP.includes(champ.type), `${nom} : type ${champ.type}`);
      assert.ok(Number(champ.niveau) >= 1 && Number(champ.niveau) <= 5, `${nom} : niveau`);
      if (champ.type === 'enum') {
        const porteSaListe = Array.isArray(champ.enum) && champ.enum.length > 0;
        const renvoieAUneTaxonomie = typeof champ.taxonomie === 'string' && champ.taxonomie.length > 0;
        assert.ok(porteSaListe || renvoieAUneTaxonomie, `${nom} : enum sans liste ni taxonomie`);
      }
    }
  }
});

test('le socle localisé porte ses champs de niveau 1 et la traçabilité', () => {
  const cles = BASE_LOCALISEE.map((c) => c.cle);
  for (const cle of ['id', 'nom', 'categorie', 'lat', 'lon', 'statut', 'confiance', 'source_id']) {
    assert.ok(cles.includes(cle), `socle sans ${cle}`);
  }
  const poi = champsDe('poi');
  for (const cle of cles) assert.ok(poi.some((c) => c.cle === cle), `poi sans ${cle}`);
  // Le contrat de traçabilité doit valoir aussi pour les tables de terrain.
  for (const type of ['association', 'education', 'commerce', 'activite', 'evenement', 'transport', 'nature', 'transformation']) {
    const c = champsDe(type);
    assert.ok(c.some((x) => x.cle === 'source_id'), `${type} sans source_id`);
    assert.ok(c.some((x) => x.cle === 'confiance'), `${type} sans confiance`);
  }
});

test('colonnesCsv suit le schéma et enumDe retrouve les listes', () => {
  const colonnes = colonnesCsv('poi');
  assert.equal(colonnes.length, champsDe('poi').length);
  assert.equal(colonnes[0], 'id');
  assert.deepEqual(enumDe('poi', 'statut').includes('active'), true);
  assert.equal(enumDe('poi', 'inconnu'), null);
  assert.equal(enumDe('type-qui-nexiste-pas', 'statut'), null);
  assert.deepEqual(colonnesCsv('type-qui-nexiste-pas'), []);
  assert.deepEqual(champsDe('type-qui-nexiste-pas'), []);
  assert.equal(typeEntite('poi').table, 'poi.csv');
  assert.equal(typeEntite('nope'), null);
});

test('champsRequis ouvre le niveau 1 et le valider signale les manques', () => {
  const requis = champsRequis('poi', 1).map((c) => c.cle);
  assert.equal(requis.length, champsDe('poi').filter((c) => c.niveau === 1).length);
  assert.ok(requis.includes('id') && requis.includes('source_id'));

  const vide = valider({}, 'poi');
  assert.equal(vide.ok, false);
  assert.equal(vide.manquants.length, requis.length);

  const minimal = remplir('poi', 1);
  const valide = valider(minimal, 'poi');
  assert.equal(valide.ok, true, `manquants : ${valide.manquants.join(', ')}`);
  assert.deepEqual(valide.manquants, []);

  const horsContrat = valider({ ...minimal, champ_inconnu: 'x' }, 'poi');
  assert.deepEqual(horsContrat.horsContrat, ['champ_inconnu']);
  assert.equal(horsContrat.ok, true, 'un champ en trop n’invalide pas la fiche');
});

test('niveauAtteint monte exactement jusqu’au niveau rempli', () => {
  for (const type of ['poi', 'association', 'evenement', 'transformation']) {
    assert.equal(niveauAtteint({}, type), 0, `${type} : une fiche vide est au niveau 0`);
    for (let n = 1; n <= 3; n += 1) {
      assert.equal(niveauAtteint(remplir(type, n), type), n, `${type} : niveau ${n}`);
    }
  }
  assert.equal(niveauAtteint({}, 'type-qui-nexiste-pas'), 0);
  assert.equal(nomNiveau(1), '1 — CARTOGRAPHIABLE');
  assert.equal(nomNiveau(5), '5 — JUMEAU LOCAL');
  assert.equal(nomNiveau(0), '0 — HORS CONTRAT');
  assert.equal(nomNiveau(42), '0 — HORS CONTRAT');
});

test('répartition et diagnostic d’une collection restent cohérents', () => {
  const plein = remplir('association', 1);
  const trois = [{}, plein, remplir('association', 2)];
  const rep = repartitionNiveaux(trois, 'association');
  assert.equal(rep[0], 1, 'une fiche vide est au niveau 0');
  assert.equal(rep[1], 1);
  assert.equal(rep[2], 1);
  assert.equal(rep[1] + rep[2] + rep[3] + rep[4] + rep[5], 2);
  assert.equal(rep[0] + rep[1] + rep[2] + rep[3] + rep[4] + rep[5], trois.length);

  const diag = diagnosticCollection(trois, 'association');
  assert.equal(diag.type, 'association');
  assert.equal(diag.total, 3);
  assert.deepEqual(diag.niveaux, rep);
  assert.ok(diag.manquants.length > 0, 'la fiche vide doit produire des manquants');
  assert.equal(diag.manquants[0].n, 1, 'un seul exemplaire manque chaque champ');
  for (let i = 1; i < diag.manquants.length; i += 1) {
    assert.ok(diag.manquants[i - 1].n >= diag.manquants[i].n, 'manquants triés par fréquence');
  }
  const vide = diagnosticCollection([], 'association');
  assert.equal(vide.total, 0);
  assert.deepEqual(vide.manquants, []);
});

test('versCsv écrit l’en-tête du schéma et échappe les séparateurs', () => {
  const entetes = colonnesCsv('association');
  const csv = versCsv([{ id: 'a1', nom: 'Jouteurs; du canal' }, { id: 'a2' }], 'association');
  const lignes = csv.split('\n');
  assert.equal(lignes.length, 3);
  assert.deepEqual(lignes[0].split(';'), entetes);
  assert.match(lignes[1], /"Jouteurs; du canal"/, 'un « ; » force les guillemets');
  assert.ok(lignes[1].startsWith('a1;'), 'les colonnes restent alignées');
  assert.ok(lignes[2].startsWith('a2;'));
  assert.equal(versCsv([], 'type-qui-nexiste-pas'), '');
  const guillemets = versCsv([{ id: 'a3', nom: 'Il a dit "oui"' }], 'association').split('\n')[1];
  assert.match(guillemets, /"Il a dit ""oui"""/, 'les guillemets internes sont doublés');
});

test('les dix familles de réseaux techniques portent leurs attributs et conséquences', () => {
  assert.ok(RESEAUX_TECHNIQUES.length >= 10, 'au moins dix familles');
  const ids = new Set();
  for (const r of RESEAUX_TECHNIQUES) {
    assert.ok(!ids.has(r.id), `famille en double : ${r.id}`);
    ids.add(r.id);
    for (const cle of ['nom', 'icone', 'exploitants', 'ouvrages', 'attributs', 'verification', 'consequence']) {
      assert.ok(Array.isArray(r[cle]) || typeof r[cle] === 'string', `${r.id} : ${cle}`);
    }
    assert.ok(r.ouvrages.length > 0 && r.consequence.length > 0, `${r.id} : contenu vide`);
  }
  assert.ok(ids.has('eau_potable') && ids.has('gaz') && ids.has('electricite_bt'));
  assert.equal(RESEAUX_TECHNIQUES.find((r) => r.id === 'eau_potable').sensibles, true);
});

test('la classe de précision DT-DICT est complète et documentée', () => {
  const classes = CLASSES_PRECISION.map((c) => c.classe || c.id);
  for (const attendue of ['A', 'B', 'C']) assert.ok(classes.includes(attendue), `classe ${attendue}`);
  assert.equal(CLASSES_PRECISION.length, 4, 'A, B, C et l’inconnue');
  const texte = JSON.stringify(CLASSES_PRECISION);
  assert.match(texte, /40 cm/, 'la classe A porte sa précision');
  assert.match(texte, /1,50 m/, 'la classe C porte sa précision');
});

test('la check-list réseaux se lit dans l’ordre du chantier', () => {
  assert.equal(CHECKLIST_RESEAUX.length, 7);
  const etapes = CHECKLIST_RESEAUX.map((c) => c.etape);
  assert.equal(etapes[0], 'Déclarer');
  assert.equal(etapes[etapes.length - 1], 'Déclarer l’anomalie');
  for (const c of CHECKLIST_RESEAUX) {
    assert.ok(c.detail && c.ref, `étape ${c.etape} incomplète`);
  }
  assert.match(JSON.stringify(CHECKLIST_RESEAUX), /DICT/);
});

test('les sept familles d’événements culturels et leur cycle sont décrits', () => {
  assert.equal(FAMILLES_EVENEMENT.length, 7);
  const ids = new Set(FAMILLES_EVENEMENT.map((f) => f.id));
  assert.equal(ids.size, 7);
  for (const f of FAMILLES_EVENEMENT) {
    assert.ok(f.nom && f.duree && f.structure, `famille ${f.id} incomplète`);
    assert.ok(Array.isArray(f.points_cles) && f.points_cles.length > 0);
  }
  assert.equal(CYCLE_EVENEMENT.length, 6);
  assert.equal(CYCLE_EVENEMENT[0].etape, 'programmation');
  assert.equal(CYCLE_EVENEMENT[CYCLE_EVENEMENT.length - 1].etape, 'bilan');
  assert.ok(CHAMPS_RECURRENCE.some((c) => /RFC 5545/.test(c.libelle)));
});

test('le guide associatif dit ce qu’un millésime laisse toujours à vérifier', () => {
  assert.ok(DOMAINES_ASSOCIATION.length >= 15);
  assert.equal(new Set(DOMAINES_ASSOCIATION).size, DOMAINES_ASSOCIATION.length, 'domaines uniques');
  assert.ok(SOUS_DOMAINES_ASSOCIATION.length >= 20);
  assert.equal(
    new Set(SOUS_DOMAINES_ASSOCIATION).size,
    SOUS_DOMAINES_ASSOCIATION.length,
    'sous-domaines uniques',
  );
  assert.equal(GUIDE_ASSOCIATIONS.niveau_confiance, 'rapporté');
  assert.ok(GUIDE_ASSOCIATIONS.champs_souvent_absents.length > 0);
  assert.ok(GUIDE_ASSOCIATIONS.a_verifier_toujours.length > 0);
  assert.match(GUIDE_ASSOCIATIONS.conseil, /millésime/i);
});
