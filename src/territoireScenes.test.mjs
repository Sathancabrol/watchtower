// src/territoireScenes.test.mjs — la partie pure de la carte stratégique.
//
// On teste ce que la carte DESSINE (la scène) et ce que l'inspecteur DIT
// (la fiche), sans DOM : c'est le contrat que `territoire.js` traduit en SVG.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOND, FORME, compterFichesLocales, completudeBase, contexteDeCommune,
  anneeDe, compteImports, couleursCommunes, csvTable, diagnosticReseau, ficheTerritoire,
  filDuNiveau, friseTemporelle, grilleHex, hexPath, importerDans, importsDeCommune,
  meilleursImprevus, niveauLisible, nomContexte, positionsCommunes, positionsQuartiers,
  sceneDe, transformationsMarquees, valeurLentille, versCsvReseau,
} from './territoireScenes.js';
import { BASE_LOCALE } from './data/frontignan.js';
import { CHAMPS_RESEAU } from './data/attributsTerritoire.js';
import { COMMUNES, QUARTIERS_FRONTIGNAN, SERIE_FRONTIGNAN, densite } from './data/thauTerritoire.js';

const NIVEAUX = ['pays', 'region', 'departement', 'epci', 'commune', 'quartier'];

test('un hexagone est fermé, à six côtés, et respecte son rayon', () => {
  const d = hexPath(100, 100, 20);
  assert.match(d, /^M[\d.-]+ [\d.-]+(L[\d.-]+ [\d.-]+){5}Z$/);
  const points = d.slice(1, -1).split('L').map((p) => p.split(' ').map(Number));
  assert.equal(points.length, 6);
  for (const [x, y] of points) {
    const r = Math.hypot(x - 100, y - 100);
    assert.ok(Math.abs(r - 20) < 0.1, `sommet à ${r.toFixed(2)} du centre`);
  }
});

test('la grille hexagonale tient dans son cadre et alterne les rangées', () => {
  const cases = grilleHex({ largeur: 200, hauteur: 120, r: 10, marge: 4 });
  assert.ok(cases.length > 20, `${cases.length} cases`);
  for (const c of cases) {
    assert.ok(c.cx >= 4 && c.cx <= 196, 'x dans le cadre');
    assert.ok(c.cy >= 4 && c.cy <= 116, 'y dans le cadre');
    assert.equal(c.r, 10);
  }
  const rangées = new Map();
  for (const c of cases) rangées.set(c.rangee, (rangées.get(c.rangee) || []).concat(c.cx));
  const [r0, r1] = [rangées.get(0), rangées.get(1)];
  assert.ok(r0[0] !== r1[0], 'une rangée sur deux est décalée');
});

test('les positions des communes restent les vraies positions relatives', () => {
  const points = positionsCommunes({ largeur: 740, hauteur: 470, marge: 58 });
  assert.equal(points.length, COMMUNES.length);
  for (const p of points) {
    assert.ok(p.cx >= 57 && p.cx <= 683, `${p.commune.nom} : x ${p.cx.toFixed(1)}`);
    assert.ok(p.cy >= 57 && p.cy <= 413, `${p.commune.nom} : y ${p.cy.toFixed(1)}`);
  }
  // Une projection et un cadrage linéaires conservent l'ordre : Mèze est à
  // l'ouest de Sète et le restera à l'écran.
  /** @type {Map<string, {cx: number, cy: number}>} */
  const parInsee = new Map(points.map((p) => [p.commune.insee, p]));
  for (let i = 0; i < COMMUNES.length; i += 1) {
    for (let j = i + 1; j < COMMUNES.length; j += 1) {
      const a = COMMUNES[i];
      const b = COMMUNES[j];
      const pa = parInsee.get(a.insee);
      const pb = parInsee.get(b.insee);
      if (a.centre.lon !== b.centre.lon) {
        assert.equal(
          Math.sign(a.centre.lon - b.centre.lon),
          Math.sign(pa.cx - pb.cx),
          `${a.nom}/${b.nom} : l’ordre est-ouest est conservé`,
        );
      }
      if (a.centre.lat !== b.centre.lat) {
        assert.equal(
          Math.sign(a.centre.lat - b.centre.lat),
          -Math.sign(pa.cy - pb.cy),
          `${a.nom}/${b.nom} : le nord reste en haut`,
        );
      }
    }
  }
});

test('les positions des quartiers de Frontignan gardent le même contrat', () => {
  const points = positionsQuartiers({ largeur: 740, hauteur: 470, marge: 62 });
  assert.equal(points.length, QUARTIERS_FRONTIGNAN.length);
  const parId = new Map(points.map((p) => [p.quartier.id, p]));
  const plage = parId.get('q-frontignan-plage');
  const coeur = parId.get('q-coeur-ville');
  assert.ok(plage.cx > coeur.cx, 'Frontignan-Plage est à l’est du centre');
  assert.ok(plage.cy > coeur.cy, 'Frontignan-Plage est au sud du centre');
  for (const p of points) {
    assert.ok(p.cx >= 61 && p.cx <= 679 && p.cy >= 61 && p.cy <= 409);
  }
});

test('chaque niveau produit une scène dessinable et étiquetée', () => {
  for (const niveau of NIVEAUX) {
    const scene = sceneDe({ niveau, lentille: 'territoire', selection: '34108' });
    assert.ok(scene.titre.startsWith(niveau.toUpperCase()), `${niveau} : titre`);
    assert.ok(scene.formes.length > 0, `${niveau} : formes`);
    for (const f of scene.formes) {
      assert.ok(['hex', 'texte', 'repere'].includes(f.forme), `${niveau} : forme ${f.forme}`);
    }
    assert.ok(Array.isArray(scene.legende));
  }
});

test('la France et la région sont un maillage, et l’Occitanie y est repérable', () => {
  const pays = sceneDe({ niveau: 'pays', lentille: 'territoire' });
  const marquees = pays.formes.filter((f) => f.id === 'occitanie');
  assert.ok(marquees.length > 0, 'des hexagones marqués Occitanie');
  const titres = pays.formes.filter((f) => f.forme === 'texte').map((f) => f.text);
  assert.ok(titres.includes('FRANCE'));
  for (const f of marquees) assert.equal(f.etiquette, 'OCCITANIE');

  const departement = sceneDe({ niveau: 'departement', lentille: 'territoire' });
  assert.ok(departement.formes.some((f) => f.id === 'herault'));
  assert.ok(departement.formes.some((f) => f.forme === 'texte' && f.text === 'HÉRAULT'));
});

test('l’agglomération montre les 14 communes et colore selon la lentille', () => {
  const scene = sceneDe({ niveau: 'epci', lentille: 'population', selection: '34108' });
  const hexes = scene.formes.filter((f) => f.forme === 'hex');
  assert.equal(hexes.length, COMMUNES.length);
  assert.deepEqual(
    new Set(hexes.map((h) => h.id)),
    new Set(COMMUNES.map((c) => c.insee)),
  );
  for (const h of hexes) assert.ok(h.etiquette.length > 0, 'chaque commune porte son nom');
  const sceau = hexes.find((h) => h.id === '34108');
  assert.equal(sceau.fill, FORME.selection, 'la sélection est visible');
  assert.match(sceau.sousEtiquette, /hab\./, 'la lentille population écrit la population');
  assert.ok(scene.legende.length > 0);
});

test('la vue communale ajoute les quartiers et les repères, la vue quartier explique la descente', () => {
  const commune = sceneDe({ niveau: 'commune', lentille: 'territoire', selection: '34108' });
  const quartiers = commune.formes.filter((f) => f.forme === 'hex');
  assert.equal(quartiers.length, QUARTIERS_FRONTIGNAN.length);
  assert.ok(commune.formes.some((f) => f.forme === 'repere'), 'les repères du territoire sont posés');
  assert.ok(commune.legende.length >= 2, 'quartier et repère sont légendés');

  // Une commune sans quartiers documentés ne doit PAS afficher ceux de
  // Frontignan : le module écrit le trou plutôt que d’emprunter un contour.
  const sete = sceneDe({ niveau: 'commune', lentille: 'territoire', selection: '34301' });
  assert.equal(sete.formes.filter((f) => f.forme === 'hex').length, 0, 'aucun quartier emprunté');
  const texteSete = sete.formes.map((f) => f.text).join(' ');
  assert.match(texteSete, /SÈTE/);
  assert.match(texteSete, /À IMPORTER/);
  assert.ok(sete.legende.some((l) => /importer/.test(l.texte)));

  const quartier = sceneDe({ niveau: 'quartier', lentille: 'territoire', selection: 'q-crozes-pielles' });
  assert.equal(quartier.formes.filter((f) => f.forme === 'hex').length, 0);
  const texte = quartier.formes.map((f) => f.text).join(' ');
  assert.match(texte, /CROZES|Crozes/);
  assert.match(texte, /cadastre/i);
  assert.match(texte, /parcelles/i);
});

test('la valeur d’une lentille vient de la commune ou de la base locale', () => {
  const frontignan = COMMUNES.find((c) => c.insee === '34108');
  assert.equal(valeurLentille(frontignan, 'population'), 24_136);
  assert.equal(valeurLentille(frontignan, 'densite'), densite(frontignan));
  assert.equal(valeurLentille(frontignan, 'risques'), 4);
  assert.equal(
    valeurLentille(frontignan, 'economie'),
    BASE_LOCALE.pois.filter((p) => p.categorie === 'commerce').length,
  );
  assert.equal(valeurLentille(frontignan, 'territoire'), null, 'la lentille territoire n’a pas de métrique');
  assert.equal(valeurLentille(frontignan, 'inconnue'), null);
  assert.equal(valeurLentille(null, 'population'), null);
});

test('la base locale ne parle que de Frontignan — et le dit', () => {
  const frontignan = COMMUNES.find((c) => c.insee === '34108');
  const sete = COMMUNES.find((c) => c.insee === '34301');
  assert.equal(compterFichesLocales('34108', 'association'), BASE_LOCALE.associations.length);
  assert.equal(compterFichesLocales('34108', 'reseau'), BASE_LOCALE.reseaux.length);
  assert.equal(compterFichesLocales('34108', 'nature'), BASE_LOCALE.pois.filter((p) => p.categorie === 'nature').length);
  assert.equal(compterFichesLocales('34301', 'association'), 0, 'aucune fiche inventée pour Sète');
  assert.equal(compterFichesLocales(sete.insee, 'commerce'), 0);
  assert.ok(compterFichesLocales(frontignan.insee, 'commerce') > 0);
});

test('les couleurs de communes suivent la lentille et restent absentes pour le territoire', () => {
  assert.equal(couleursCommunes('territoire'), null);
  const couleurs = couleursCommunes('population');
  assert.equal(Object.keys(couleurs).length, COMMUNES.length);
  assert.ok(new Set(Object.values(couleurs)).size > 1, 'la choroplèthe distingue les communes');
  for (const c of Object.values(couleurs)) assert.match(c, /^#[0-9a-f]{6}$/i);
});

test('l’inspecteur d’une commune inconnue décrit l’agglomération', () => {
  const agglo = ficheTerritoire('99999');
  assert.equal(agglo.titre, 'Sète Agglopôle Méditerranée');
  assert.equal(agglo.type, 'Intercommunalité');
  assert.ok(agglo.lignes.some(([k]) => k === 'SIREN'));
  assert.ok(agglo.liens[0].url.includes('banatic'));
});

test('l’inspecteur d’une commune donne ses chiffres et ses liens de vérification', () => {
  const fiche = ficheTerritoire('34108');
  assert.equal(fiche.titre, 'Frontignan');
  const valeurs = new Map(fiche.lignes);
  assert.equal(valeurs.get('INSEE'), '34108');
  assert.match(valeurs.get('Population'), /24\s?136/);
  assert.ok(valeurs.get('Densité').includes(String(densite(COMMUNES[0]))));
  assert.ok(fiche.liens.some((l) => l.url.includes('COM-34108')));
  assert.ok(fiche.sources.includes('INSEE'));

  const risques = ficheTerritoire('34108', 'risques');
  assert.ok(risques.risques.length >= 3);
  assert.match(risques.note, /Géorisques/, 'un aléa déduit renvoie à la source opposable');

  const imprevus = ficheTerritoire('34108', 'imprevus');
  assert.equal(imprevus.contexteImprevu, 'littoral');
  assert.ok(imprevus.imprevus.length > 0, 'la lentille imprévus remplit l’inspecteur');
  assert.ok(imprevus.cascades.length > 0);
  assert.match(imprevus.note, /littoral/i);
});

test('le contexte de terrain classe chaque commune sans invention', () => {
  assert.equal(contexteDeCommune('34108'), 'littoral');
  assert.equal(contexteDeCommune('34157'), 'lagune');
  assert.equal(contexteDeCommune('34165'), 'massif');
  assert.equal(contexteDeCommune('99999'), 'viticole', 'une commune inconnue retombe sur le contexte viticole');
  assert.equal(nomContexte('littoral'), 'Littoral et lido');
  assert.equal(nomContexte('inconnu'), 'inconnu');
});

test('le fil d’Ariane s’arrête au niveau affiché', () => {
  assert.equal(filDuNiveau('pays', '34108'), 'France');
  assert.equal(filDuNiveau('region', '34108'), 'France › Occitanie');
  assert.equal(filDuNiveau('departement', '34108'), 'France › Occitanie › Hérault');
  assert.equal(filDuNiveau('epci', '34108'), 'France › Occitanie › Hérault › Sète Agglopôle Méditerranée');
  assert.match(filDuNiveau('commune', '34108'), /Frontignan$/);
  assert.match(filDuNiveau('quartier', 'q-coeur-ville'), /CŒUR DE VILLE/);
});

test('la frise sépare la série réelle de la prolongation', () => {
  const frise = friseTemporelle();
  assert.equal(frise.debut, 1968);
  assert.equal(frise.fin, 2023);
  assert.equal(frise.horizon, 2040);
  assert.equal(frise.points.length, SERIE_FRONTIGNAN.length);
  const dernier = frise.points[frise.points.length - 1];
  assert.equal(dernier.population, 24_136);
  assert.ok(frise.projection(2040) > dernier.population);
  assert.equal(frise.projection(2023), 24_136, 'l’année de référence donne la valeur réelle');
  assert.match(frise.avertissement, /PAS une prévision/i);
  assert.match(frise.source, /INSEE/);
});

test('la complétude dit ce qui est rempli et ce qui reste à importer', () => {
  const tables = completudeBase();
  assert.equal(tables.length, 6);
  const totals = new Map(tables.map((t) => [t.type, t.total]));
  assert.equal(totals.get('poi'), BASE_LOCALE.pois.length);
  assert.equal(totals.get('reseau'), BASE_LOCALE.reseaux.length);
  for (const t of tables) {
    const somme = Object.values(t.niveaux).reduce((s, n) => s + n, 0);
    assert.equal(somme, t.total, `${t.type} : la répartition couvre toutes les fiches`);
    assert.ok(t.nom.length > 0);
  }
});

test('une table de réseaux a son propre diagnostic et son propre CSV', () => {
  const diag = diagnosticReseau(BASE_LOCALE.reseaux);
  assert.equal(diag.type, 'reseau');
  assert.equal(diag.total, BASE_LOCALE.reseaux.length);
  assert.equal(diag.niveaux[0] + diag.niveaux[1], BASE_LOCALE.reseaux.length);
  assert.ok(diag.manquants.some((m) => m.cle === 'geometrie'), 'un réseau sans tracé n’est pas cartographiable');

  const csv = csvTable('reseau');
  assert.deepEqual(csv.split('\n')[0].split(';'), CHAMPS_RESEAU.map((c) => c.cle));
  assert.equal(csv.split('\n').length, BASE_LOCALE.reseaux.length + 1);
  const isole = versCsvReseau([{ id: 'r1', famille: 'eau;potable' }]).split('\n')[1];
  assert.match(isole, /"eau;potable"/);
  assert.equal(versCsvReseau([]).split('\n').length, 1, 'vide : l’en-tête seul');
});

test('l’export CSV d’une table suit le schéma du type', () => {
  const poi = csvTable('poi').split('\n');
  assert.match(poi[0], /^id;nom;/);
  assert.equal(poi.length, BASE_LOCALE.pois.length + 1);
  const asso = csvTable('association').split('\n');
  assert.ok(asso[0].includes('source_id') && asso[0].includes('confiance'));
});

test('la carte annonce la couleur de son fond et ses formes', () => {
  assert.match(FOND, /^#[0-9a-f]{6}$/i);
  assert.match(FORME.selection, /^#[0-9a-f]{6}$/i);
});

test('le module propose de quoi remplir la frise et la lentille imprévus', () => {
  assert.equal(transformationsMarquees().length, BASE_LOCALE.transformations.length);
  assert.ok(transformationsMarquees()[0].type_transformation);
  assert.ok(meilleursImprevus('littoral').length > 0);
  assert.ok(meilleursImprevus('littoral').every((i) => i.contextes.includes('littoral')));
  assert.equal(niveauLisible({}, 'poi'), '0 — HORS CONTRAT');
});

test('un quartier inconnu s’annonce au lieu de s’inventer', () => {
  const scene = sceneDe({ niveau: 'quartier', lentille: 'territoire', selection: 'q-inconnu-du-tout' });
  const texte = scene.formes.map((f) => f.text).join(' ');
  assert.match(texte, /QUARTIER À IMPORTER/);
  assert.match(texte, /trou visible/);
  assert.equal(scene.formes.filter((f) => f.forme === 'hex').length, 0);
});

test('la couche d’imports s’ajoute sans toucher à la base d’amorçage', () => {
  const base = BASE_LOCALE.pois.length;
  let couche = importerDans({}, 'poi', [
    { id: 'poi_ecole_test', categorie: 'education', code_insee: '34108' },
    { id: 'poi_marche_test', categorie: 'commerce', code_insee: '34108' },
  ]);
  assert.equal(BASE_LOCALE.pois.length, base, 'la base figée n’a pas bougé');
  assert.equal(compteImports(couche, 'poi'), 2);
  assert.equal(compteImports(couche, 'association'), 0);
  assert.equal(compterFichesLocales('34108', 'education', couche), 3, 'base 2 + 1 importée');
  assert.equal(compterFichesLocales('34108', 'commerce', couche), 3, 'base 2 + 1 importée');
  assert.equal(compterFichesLocales('34108', 'association', couche), BASE_LOCALE.associations.length);

  couche = importerDans(couche, 'poi', [{ id: 'poi_ecole_test', categorie: 'education', code_insee: '34108' }]);
  assert.equal(compteImports(couche, 'poi'), 3, 'importerDans empile : la déduplication est le rôle de fusionnerParId');
});

test('un import profite à sa commune, et à elle seule', () => {
  const couche = importerDans({}, 'poi', [
    { id: 'poi_test_sete', categorie: 'commerce', code_insee: '34301' },
  ]);
  assert.equal(valeurLentille({ insee: '34301' }, 'economie', couche), 1);
  assert.equal(valeurLentille({ insee: '34108' }, 'economie', couche), 2, 'Frontignan garde ses 2 commerces de base');
  assert.equal(valeurLentille({ insee: '34157' }, 'economie', couche), 0);

  const parNom = importerDans({}, 'poi', [{ id: 'poi_test_meze', categorie: 'commerce', commune: 'Mèze' }]);
  assert.equal(valeurLentille({ insee: '34157' }, 'economie', parNom), 1, 'le nom de commune suffit');

  assert.equal(importsDeCommune(couche, '34301', 'poi').length, 1);
  assert.equal(importsDeCommune(couche, '34108', 'poi').length, 0);
});

test('un imprévu importé sans commune vaut pour tout le territoire', () => {
  const couche = importerDans({}, 'imprevus', [
    { id: 'IMP-A', probleme: 'DICT tardive', gravite: 'Forte', contexts: [] },
    { id: 'IMP-B', probleme: 'Nappe haute', gravite: 'Forte', code_insee: '34108' },
  ]);
  assert.equal(importsDeCommune(couche, '34157', 'imprevus').length, 1, 'le général vaut aussi pour Mèze');
  assert.equal(importsDeCommune(couche, '34108', 'imprevus').length, 2, 'Frontignan a le général ET le sien');
  const liste = meilleursImprevus('lagune', 20, couche);
  assert.ok(liste.some((i) => i.id === 'IMP-A'));
});

test('la frise ne place que les projets datés, et à leur année', () => {
  const couche = importerDans({}, 'transformation', [
    { id: 'trf_quais', nom: 'Quais du canal', debut: '2019', fin: '2021', maitre_ouvrage: 'Agglopôle' },
    { id: 'trf_sans_date', nom: 'Projet sans date' },
    { id: 'trf_ecoles', nom: 'Confort d’été', debut: 'été 2024' },
  ]);
  const fr = friseTemporelle(couche);
  assert.equal(anneeDe({ debut: '2019' }), 2019);
  assert.equal(anneeDe({ fin: 'décembre 2021' }), 2021);
  assert.equal(anneeDe({ debut: 'bientôt' }), null);
  assert.equal(anneeDe({}), null);
  const datees = fr.marqueurs.filter((m) => Number.isFinite(m.annee));
  assert.deepEqual(datees.map((m) => m.annee), [2024, 2019], 'du plus récent au plus ancien');
  assert.equal(fr.marqueurs.filter((m) => !Number.isFinite(m.annee)).length, 1 + BASE_LOCALE.transformations.length, 'les sans-date ne sont pas posés au hasard');
  assert.ok(fr.noteProjets.includes('date'));
});

test('la complétude et l’export suivent la couche importée', () => {
  const couche = importerDans({}, 'poi', [{ id: 'poi_x', nom: 'X', categorie: 'commerce', code_insee: '34108' }]);
  const poi = completudeBase(couche).find((t) => t.type === 'poi');
  assert.equal(poi.total, BASE_LOCALE.pois.length + 1);
  assert.equal(poi.importees, 1);
  const autres = completudeBase(couche).filter((t) => t.type !== 'poi');
  assert.ok(autres.every((t) => t.importees === 0));

  const csv = csvTable('poi', couche);
  assert.equal(csv.split('\n').length, BASE_LOCALE.pois.length + 2);
  assert.ok(csv.includes('poi_x'));
  assert.equal(csvTable('poi').split('\n').length, BASE_LOCALE.pois.length + 1, 'sans couche, rien de plus');
});
