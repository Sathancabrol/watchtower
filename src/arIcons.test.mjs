// src/arIcons.test.mjs — catégories et dessin des icônes AR (sans navigateur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES_AR,
  categorieAR,
  couleurBarre,
  dessinerIconeAR,
  spriteAR,
  IMAGES_TOUR, echelleRotation, espacer, spriteARTournant,
} from './arIcons.js';

/** Faux contexte 2D : enregistre les appels et les propriétés écrites. */
function ctxFactice() {
  const appels = [];
  const cible = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    save: () => {}, restore: () => {}, clip: () => {},
    setLineDash: () => {}, measureText: () => ({ width: 10 }),
  };
  return new Proxy(cible, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      if (prop === '__appels') return appels;
      return (...args) => { appels.push([String(prop), args.length]); };
    },
    set() { return true; },
  });
}

test('CATEGORIES_AR : intégrité du catalogue', () => {
  const ids = new Set();
  for (const c of CATEGORIES_AR) {
    assert.match(c.id, /^[a-z]+$/, 'identifiant simple');
    assert.ok(!ids.has(c.id), `pas de doublon (${c.id})`);
    ids.add(c.id);
    assert.match(c.couleur, /^#[0-9a-f]{6}$/i, 'couleur hex');
    assert.ok(c.nom && c.liste && c.indice && c.filtre && c.legende, `${c.id} complet`);
  }
  // les clés pointent vers des données que le jumeau INTEL produit vraiment
  const listes = new Set(['ecoles', 'sante', 'commerces', 'services', 'vert']);
  const indices = new Set(['edu', 'sante', 'eco', 'res', 'bonheur']);
  for (const c of CATEGORIES_AR) {
    assert.ok(listes.has(c.liste), `liste ${c.liste} connue du jumeau`);
    assert.ok(indices.has(c.indice), `indice ${c.indice} connu du jumeau`);
  }
});

test('categorieAR : recherche par identifiant, null si inconnu', () => {
  assert.equal(categorieAR('sante').nom, 'SANTÉ');
  assert.equal(categorieAR('sante').glyphe, 'croix-suisse');
  assert.equal(categorieAR('bonheur').glyphe, 'coeur');
  assert.equal(categorieAR('inexistant'), null);
});

test('couleurBarre : vert / jaune / rouge selon le seuil', () => {
  assert.equal(couleurBarre(100)[0], '#43d17a');
  assert.equal(couleurBarre(60)[0], '#43d17a');
  assert.equal(couleurBarre(59)[0], '#e8c04a');
  assert.equal(couleurBarre(40)[0], '#e8c04a');
  assert.equal(couleurBarre(39)[0], '#f05252');
  assert.equal(couleurBarre(0)[0], '#f05252');
  assert.equal(couleurBarre(-5)[0], '#f05252', 'borné bas');
  assert.equal(couleurBarre(500)[0], '#43d17a', 'borné haut');
  assert.equal(couleurBarre(undefined)[0], '#f05252', 'valeur manquante → 0');
});

test('dessinerIconeAR : toutes les catégories se dessinent sans erreur', () => {
  for (const c of CATEGORIES_AR) {
    const ctx = ctxFactice();
    dessinerIconeAR(ctx, 160, c, { valeur: 72 });
    assert.ok(ctx.__appels.length > 20, `${c.id} produit un vrai dessin`);
    const noms = new Set(ctx.__appels.map(([n]) => n));
    assert.ok(noms.has('fill'), `${c.id} remplit des formes`);
    assert.ok(noms.has('fillText') || noms.has('fillRect'), `${c.id} dessine barre ou nom`);
  }
});

test('dessinerIconeAR : sans nom, valeur extrême, catégorie inconnue', () => {
  const ctx = ctxFactice();
  dessinerIconeAR(ctx, 96, CATEGORIES_AR[0], { sansNom: true, valeur: 0 });
  assert.ok(ctx.__appels.length > 10);
  const ctx2 = ctxFactice();
  dessinerIconeAR(ctx2, 96, null, { valeur: 100 });
  assert.ok(ctx2.__appels.length > 10, 'catégorie inconnue → glyphe bouclier, pas de crash');
  const ctx3 = ctxFactice();
  dessinerIconeAR(ctx3, 96, CATEGORIES_AR[1], {});
  assert.ok(ctx3.__appels.length > 10);
});

test('spriteAR : null hors navigateur (tests) au lieu d’une exception', () => {
  assert.equal(spriteAR(CATEGORIES_AR[0], { valeur: 50 }), null);
  assert.equal(spriteAR(null), null);
});

test('rotation 360° : une série d’images cohérente', () => {
  assert.equal(IMAGES_TOUR, 24);
  assert.equal(echelleRotation(0), 1, 'de face');
  assert.ok(Math.abs(echelleRotation(Math.PI / 2)) < 0.4, 'de profil : très fin');
  assert.ok(Math.abs(echelleRotation(Math.PI) - 1) < 1e-9, 'dos = face');
  assert.ok(echelleRotation(Math.PI / 2) >= 0.36, 'jamais totalement invisible');
  assert.equal(echelleRotation('x'), 1, 'entrée invalide → de face');
  // hors navigateur, la fabrique rend une liste vide (jamais d’erreur)
  const images = spriteARTournant({ id: 'sante', couleur: '#f00', glyphe: 'croix-suisse' }, { images: 8 });
  assert.ok(Array.isArray(images));
  assert.ok(images.length === 0 || images.length === 8);
});

test('espacer : deux points confondus sont écartés', () => {
  const pts = [{ lon: 3.75, lat: 43.44 }, { lon: 3.75, lat: 43.44 }, { lon: 3.76, lat: 43.45 }];
  const e = espacer(pts, 0.001);
  assert.equal(e.length, 3);
  const d = Math.hypot(e[0].lon - e[1].lon, e[0].lat - e[1].lat);
  assert.ok(d >= 0.0009, `écart obtenu : ${d}`);
  assert.equal(e[2].lon, 3.76, 'un point déjà éloigné ne bouge pas');
  assert.deepEqual(espacer([]), []);
  assert.deepEqual(espacer(null), []);
  assert.equal(espacer([{ lon: null, lat: 2 }])[0].lat, 2, 'point invalide conservé tel quel');
});
