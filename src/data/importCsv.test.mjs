// src/data/importCsv.test.mjs — la porte d'entrée des fichiers.
//
// Ce qui est protégé ici : un import ne perd rien, ne devine pas à la place de
// l'utilisateur, et dit toujours POURQUOI une ligne est refusée.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_IMPORT, SYNONYMES, TYPES_IMPORT, champsDeTable, convertir, detecterDelimiteur,
  devinerType, fabriquerId, fusionnerParId, importerCsv, importerImprevus, mapperLigne,
  normaliserEntete, parseCsv, resumeImport, synonymesDe,
} from './importCsv.js';
import { COLONNES as COLONNES_IMPREVUS } from './imprevusTp.js';

test('le délimiteur est deviné hors guillemets', () => {
  assert.equal(detecterDelimiteur('nom;ville;lat'), ';');
  assert.equal(detecterDelimiteur('nom,ville,lat'), ',');
  assert.equal(detecterDelimiteur('nom\tville\tlat'), '\t');
  // Un point-virgule DANS une cellule ne doit pas compter.
  assert.equal(detecterDelimiteur('"a;b;c";d;e'), ';');
  assert.equal(detecterDelimiteur('\ufeffnom;ville'), ';');
  assert.equal(detecterDelimiteur(''), ';');
});

test('l’analyseur lit guillemets, retours à la ligne et BOM', () => {
  const csv = '\ufeffnom;description;note\r\n"Halles";"Marché couvert ; halle\r\nmarchande";4\r\n';
  const r = parseCsv(csv);
  assert.equal(r.delimiteur, ';');
  assert.deepEqual(r.entetesBrutes, ['nom', 'description', 'note']);
  assert.equal(r.lignes.length, 1);
  assert.equal(r.lignes[0].description, 'Marché couvert ; halle\r\nmarchande');
  assert.equal(r.lignes[0].note, '4');

  const guillemets = parseCsv('nom;dit\n"Halles";"il a dit ""oui"""');
  assert.equal(guillemets.lignes[0].dit, 'il a dit "oui"');

  const vide = parseCsv('');
  assert.deepEqual(vide.lignes, []);
  assert.ok(vide.avertissements.includes('fichier vide'));

  const nonFerme = parseCsv('nom;ville\n"Halles;Sète', { delimiteur: ';' });
  assert.ok(nonFerme.avertissements.some((a) => /guillemet non refermé/.test(a)));
});

test('les en-têtes sont normalisés et les doublons renommés', () => {
  assert.equal(normaliserEntete('Nom de l’École'), 'nom_de_l_ecole');
  assert.equal(normaliserEntete('  Latitude (°) '), 'latitude');
  assert.equal(normaliserEntete('montant €'), 'montant');
  const r = parseCsv('nom;nom;NOM\n1;2;3');
  assert.deepEqual(r.entetes, ['nom', 'nom_2', 'nom_3']);
  assert.equal(r.avertissements.length, 2, 'les deux renommages sont signalés');
  assert.equal(r.lignes[0].nom_2, '2');
});

test('le type de table est deviné sur les colonnes réelles', () => {
  const cas = [
    [['nom', 'type', 'adresse', 'latitude', 'longitude', 'horaires'], 'poi'],
    [['nom', 'date_debut', 'date_fin', 'montant', 'maitre_ouvrage', 'phase'], 'transformation'],
    [['chantier', 'annee_debut', 'annee_fin', 'budget', 'entreprise', 'type_travaux'], 'transformation'],
    [['phase', 'probleme', 'cause', 'consequence', 'gravite', 'frequence', 'prevention'], 'imprevus'],
    [['commune', 'phase', 'probleme', 'gravite', 'contexte', 'action_immediate'], 'imprevus'],
    [['famille', 'gestionnaire', 'diametre', 'profondeur', 'classe_precision'], 'reseau'],
    [['nom', 'domaines', 'publics', 'statut', 'lieu_activite'], 'association'],
    [['nom', 'date_debut', 'date_fin', 'type', 'lieu', 'jauge'], 'evenement'],
  ];
  for (const [colonnes, attendu] of cas) {
    assert.equal(devinerType(colonnes).type, attendu, `colonnes : ${colonnes.join(',')}`);
  }
  assert.equal(devinerType(['a', 'b', 'c']).type, null, 'des colonnes inconnues ne devinent rien');
  assert.deepEqual(devinerType([]).candidats, []);
});

test('chaque table d’import a un contrat de colonnes lisible', () => {
  assert.ok(TYPES_IMPORT.includes('poi') && TYPES_IMPORT.includes('reseau') && TYPES_IMPORT.includes('imprevus'));
  assert.equal(champsDeTable('reseau').length, champsDeTable('reseau').length);
  assert.ok(champsDeTable('reseau').some((c) => c.cle === 'classe_precision'));
  const imprevus = champsDeTable('imprevus');
  assert.deepEqual(imprevus.map((c) => c.cle), COLONNES_IMPREVUS);
  assert.equal(imprevus.find((c) => c.cle === 'probleme').niveau, 1);
  assert.equal(imprevus.find((c) => c.cle === 'date').niveau, 3, 'une date de source n’est pas vitale');
  assert.deepEqual(champsDeTable('type-inconnu'), []);
});

test('les valeurs sont converties selon le type de champ', () => {
  assert.equal(convertir('43,4557', { type: 'nombre' }), 43.4557);
  assert.equal(convertir(' 1 234,5 ', { type: 'nombre' }), 1234.5);
  assert.equal(convertir('abc', { type: 'nombre' }), 'abc', 'une valeur illisible reste visible');
  assert.equal(convertir('oui', { type: 'booleen' }), true);
  assert.equal(convertir('non', { type: 'booleen' }), false);
  assert.deepEqual(convertir('sport|nautisme', { type: 'liste' }), ['sport', 'nautisme']);
  assert.deepEqual(convertir('sport;nautisme', { type: 'liste' }), ['sport', 'nautisme']);
  assert.deepEqual(convertir('{"a":1}', { type: 'json' }), { a: 1 });
  assert.equal(convertir('texte libre', { type: 'json' }), 'texte libre');
  assert.equal(convertir('', { type: 'texte' }), '');
});

test('les synonymes ramènent le vocabulaire réel au vocabulaire du schéma', () => {
  const { entite, reste } = mapperLigne({
    nom: 'École des Terres Blanches', type: 'ecole_elementaire', latitude: '43,4557',
    longitude: '3,7685', horaires: 'Lu-Ve', truc_maison: 'x',
  }, 'poi');
  assert.equal(entite.nom, 'École des Terres Blanches');
  assert.equal(entite.type_objet, 'ecole_elementaire');
  assert.equal(entite.lat, 43.4557);
  assert.equal(entite.lon, 3.7685);
  assert.equal(entite.ouverture, 'Lu-Ve');
  assert.deepEqual(Object.keys(reste), ['truc_maison'], 'rien n’est perdu');

  const projet = mapperLigne({ type_travaux: 'requalification', date_debut: '2024', montant: '1 200 000' }, 'transformation');
  assert.equal(projet.entite.type_transformation, 'requalification');
  assert.equal(projet.entite.debut, '2024');
  assert.equal(projet.entite.montant_eur, 1200000);
  assert.ok(SYNONYMES.latitude === 'lat');
  assert.equal(synonymesDe('poi').type, 'type_objet');
  assert.equal(synonymesDe('poi').latitude, 'lat', 'la table générale reste disponible');
});

test('un identifiant absent est fabriqué, stable, et signalé', () => {
  assert.equal(fabriquerId('poi', { nom: 'École des Terres Blanches' }, 'f.csv', 2), 'poi_ecole_des_terres_blanches');
  assert.equal(fabriquerId('imprevus', {}, 'fiche.csv', 7), 'IMP_fiche_csv_7', 'le préfixe IMP ne percute pas les IMP-0xx de la base');
  assert.equal(fabriquerId('transformation', { nom: 'Quais du canal' }, 'f.csv', 2), 'trf_quais_du_canal');

  const csv = 'nom;type;latitude;longitude\nÉcole des Terres Blanches;ecole_elementaire;43,4557;3,7685';
  const un = importerCsv(csv, { nom: 'ecoles.csv' });
  const deux = importerCsv(csv, { nom: 'ecoles.csv' });
  assert.equal(un.entites[0].id, deux.entites[0].id, 're-importer le même fichier met à jour, il ne duplique pas');
  assert.equal(un.identifiantsFabriques, 1);
  assert.equal(un.entites[0].json_details.id_fabrique, true, 'l’identifiant fabriqué est tracé');
});

test('un import ne perd aucune colonne et le dit', () => {
  const csv = [
    'nom;type;latitude;longitude;statut;frequentation_estimee',
    'École des Terres Blanches;ecole_elementaire;43,4557;3,7685;active;320',
  ].join('\n');
  const r = importerCsv(csv, { nom: 'ecoles.csv' });
  assert.equal(r.type, 'poi');
  assert.deepEqual(r.entetes.reconnues, ['nom', 'type', 'latitude', 'longitude', 'statut']);
  assert.deepEqual(r.entetes.horsContrat, ['frequentation_estimee']);
  const fiche = r.entites[0];
  assert.deepEqual(
    fiche.json_details.colonnes_sans_colonne_propre,
    { frequentation_estimee: '320' },
    'la colonne sans colonne propre est conservée telle quelle',
  );
  assert.equal(fiche.json_details.fichier_source, 'ecoles.csv');
  assert.equal(fiche.json_details.ligne_source, 2);
  assert.equal(r.valides, 1, 'la fiche atteint le niveau 1');
});

test('deux dérivations seulement, et elles sont annoncées', () => {
  const r = importerCsv('nom;type;latitude;longitude;statut\nÉcole;ecole_elementaire;43,4557;3,7685;active', { nom: 'f.csv' });
  const fiche = r.entites[0];
  assert.equal(fiche.categorie, 'education', 'catégorie racine déduite du type précis');
  assert.deepEqual(fiche.geometrie, { type: 'Point', coordinates: [3.7685, 43.4557] });
  assert.equal(fiche.json_details.categorie_derivee_du_type, true);
  assert.equal(fiche.json_details.geometrie_derivee_du_point, true);

  const explicite = importerCsv('nom;type;categorie;geometrie;statut\nX;marche;commerce;"{\\"type\\":\\"Point\\",\\"coordinates\\":[3.75,43.44]}";active', { nom: 'f.csv' });
  assert.equal(explicite.entites[0].json_details.categorie_derivee_du_type, undefined, 'on ne re-dérive pas ce qui est fourni');
});

test('le rapport dit ce qui bloque la complétude et pourquoi une ligne est refusée', () => {
  const csv = [
    'nom;type;latitude;longitude',
    'École;ecole_elementaire;43,4557;3,7685',
    'École;marche;43,4476;3,7571',
  ].join('\n');
  const r = importerCsv(csv, { nom: 'f.csv' });
  assert.equal(r.total, 2);
  assert.equal(r.entites.length, 1, 'le second identifiant est déjà pris dans ce fichier');
  assert.equal(r.rejets.length, 1);
  assert.equal(r.rejets[0].ligne, 3);
  assert.match(r.rejets[0].motif, /déjà pris/);
  assert.ok(r.manquants.length > 0, 'les champs manquants sont listés');
  assert.ok(r.manquants.every((m) => m.cle && m.n > 0));
  assert.ok(r.manquants.some((m) => m.cle === 'statut'), 'la liste de courses nomme « statut »');
  assert.equal(r.niveaux[0] + r.niveaux[1] + r.niveaux[2] + r.niveaux[3] + r.niveaux[4] + r.niveaux[5], r.entites.length);
  assert.match(resumeImport(r), /1 fiche\(s\)/);
  assert.match(resumeImport(r), /1 refusée\(s\)/);
});

test('une table non reconnue n’importe rien et le dit', () => {
  const r = importerCsv('alpha;beta\n1;2', { nom: 'mystere.csv' });
  assert.equal(r.type, null);
  assert.deepEqual(r.entites, []);
  assert.equal(r.rejets.length, 1);
  assert.match(r.rejets[0].motif, /type de table non reconnu/);
  assert.match(resumeImport(r), /non reconnue/);
  assert.equal(resumeImport(null), '');
});

test('le type peut être forcé quand la devinette se trompe', () => {
  const r = importerCsv('alpha;beta\n1;2', { nom: 'mystere.csv', type: 'poi' });
  assert.equal(r.type, 'poi');
  assert.equal(r.entites.length, 1);
  assert.equal(r.entites[0].id, 'poi_mystere_csv_2', 'sans nom, l’identifiant porte le fichier et la ligne');
  assert.equal(r.entites[0].source_id, SOURCE_IMPORT);
  assert.equal(r.entites[0].confiance, 'à vérifier', 'un import n’est jamais « documenté » par défaut');
  assert.equal(r.entites[0].code_insee, '34108');
  assert.deepEqual(r.entetes.reconnues, [], 'aucune colonne reconnue : le rapport est sans ambiguïté');
});

test('les défauts d’import sont réglables sans toucher au fichier', () => {
  const r = importerCsv('nom;type\nMairie;mairie', {
    nom: 'f.csv', type: 'poi',
    defauts: { commune: 'Sète', code_insee: '34301', statut: 'active', source_id: 'src_import_utilisateur' },
  });
  const fiche = r.entites[0];
  assert.equal(fiche.commune, 'Sète');
  assert.equal(fiche.code_insee, '34301');
  assert.equal(fiche.statut, 'active');
});

test('un import d’imprévus refuse ce qui sort du barème, en disant lequel', () => {
  const entete = 'id;phase;probleme;gravite;frequence;contexte;prevention';
  const csv = [
    entete,
    'IMP-A;reseaux;DICT trop tardive;Forte;Fréquente;urbain_ancien;DT 3 mois avant',
    'IMP-B;phase_inconnue;Truc;Forte;Fréquente;urbain_ancien;rien',
    'IMP-C;meteo;Orage;Énorme;Fréquente;littoral;rien',
    'IMP-D;sol;Nappe haute;Forte;Fréquente;context_inexistant;rien',
  ].join('\n');
  const r = importerImprevus(csv, { nom: 'problemes_chantier_TP.csv' });
  assert.equal(r.entites.length, 1);
  assert.equal(r.entites[0].id, 'IMP-A');
  assert.equal(r.entites[0].confiance, 'à vérifier', 'un imprévu importé n’est pas « documenté » par défaut');
  assert.equal(r.rejetees, 3);
  assert.match(r.rejets[0].motif, /phase/);
  assert.match(r.rejets[1].motif, /gravité/);
  assert.match(r.rejets[2].motif, /contexte/);
  assert.ok(r.rejets.every((x) => typeof x.motif === 'string' && x.motif.length > 5));
});

test('la fusion met à jour par identifiant au lieu de dupliquer', () => {
  const base = [{ id: 'a', nom: 'A' }, { id: 'b', nom: 'B' }];
  const r = fusionnerParId(base, [{ id: 'b', nom: 'B2' }, { id: 'c', nom: 'C' }, { nom: 'sans id' }]);
  assert.equal(r.liste.length, 3);
  assert.equal(r.ajoutees, 1);
  assert.equal(r.misesAJour, 1);
  assert.equal(r.liste.find((e) => e.id === 'b').nom, 'B2');
  assert.equal(fusionnerParId([], []).liste.length, 0);
  assert.equal(fusionnerParId(null, null).ajoutees, 0);
});

test('un imprévu sans commune ne reçoit pas une commune qu’il n’a pas', () => {
  const sans = importerCsv('phase;probleme;gravite\nreseaux;DICT incomplète;Forte', { nom: 'f.csv' });
  assert.equal(sans.type, 'imprevus');
  assert.equal(sans.entites[0].commune, undefined, 'un imprévu général reste général');
  assert.equal(sans.entites[0].code_insee, undefined);

  const avec = importerCsv('commune;phase;probleme;gravite\nSète;reseaux;DICT incomplète;Forte', { nom: 'f.csv' });
  assert.equal(avec.entites[0].commune, 'Sète');
  assert.deepEqual(avec.entetes.reconnues, ['commune', 'phase', 'probleme', 'gravite'], 'la commune fait partie du contrat');
  assert.ok(!avec.entetes.horsContrat.includes('commune'));

  // …et une table locale garde, elle, sa commune par défaut : elle est située.
  const lieu = importerCsv('nom;type\nMairie;mairie', { nom: 'f.csv', type: 'poi' });
  assert.equal(lieu.entites[0].commune, 'Frontignan');
});
