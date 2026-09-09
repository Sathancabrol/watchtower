import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, revelerPanneau, initBarreFonctions } from './barreFonctions.js';
import { readFileSync } from 'node:fs';
const CSS_SOURCE = readFileSync(new URL('./barreFonctions.js', import.meta.url), 'utf8');

test('les categories sont nommees et non vides', () => {
  assert.ok(CATEGORIES.length >= 4);
  for (const c of CATEGORIES) {
    assert.ok(c.nom && c.nom.length > 2, 'categorie nommee');
    assert.ok(c.entrees.length > 0, `${c.nom} non vide`);
  }
});

test('chaque fonction est identifiable et actionnable', () => {
  for (const c of CATEGORIES) {
    for (const e of c.entrees) {
      assert.ok(e.icone, `${c.nom} : icone presente`);
      assert.ok(e.info && e.info.length >= 2, `${c.nom} : libelle present (${e.info})`);
      assert.ok(e.dock || e.cible || e.action, `${e.info} sait quoi ouvrir`);
    }
  }
});

test('les fonctions signalees comme perdues sont revenues', () => {
  const toutes = CATEGORIES.flatMap((c) => c.entrees);
  const infos = toutes.map((e) => e.info.toLowerCase());
  for (const attendu of ['intel', 'caméras', 'époques', 'bâti 3d', 'cadastre', 'radio']) {
    assert.ok(infos.some((i) => i.includes(attendu)), `« ${attendu} » de nouveau accessible`);
  }
});

test('aucun doublon de fonction dans la barre', () => {
  const vus = new Set();
  for (const c of CATEGORIES) {
    for (const e of c.entrees) {
      const cle = e.dock || e.cible;
      assert.ok(!vus.has(cle), `${cle} apparait une seule fois`);
      vus.add(cle);
    }
  }
});

test('la barre couvre largement le dock', () => {
  const n = CATEGORIES.reduce((t, c) => t + c.entrees.length, 0);
  assert.ok(n >= 20, `au moins 20 fonctions accessibles, vu ${n}`);
});

/** Doublure de document minimale. */
function fauxDoc() {
  const creer = (tag) => {
    const n = {
      tagName: tag, children: [], style: {}, dataset: {}, _attrs: {}, _classes: new Set(),
      classList: {
        add: (...c) => c.forEach((x) => n._classes.add(x)),
        remove: (...c) => c.forEach((x) => n._classes.delete(x)),
        contains: (c) => n._classes.has(c),
      },
      appendChild(c) { this.children.push(c); return c; },
      setAttribute(k, v) { this._attrs[k] = v; },
      removeAttribute(k) { delete this._attrs[k]; },
      addEventListener() {}, remove() {}, offsetHeight: 40,
    };
    return n;
  };
  const parId = new Map();
  return {
    head: creer('head'), body: creer('body'),
    createElement: creer,
    getElementById: (id) => parId.get(id) || null,
    _ajouter: (id, n) => parId.set(id, n),
  };
}

test('revelerPanneau retire les classes de masquage connues', () => {
  const doc = fauxDoc();
  const n = doc.createElement('div');
  n.classList.add('wt-dock-cache', 'hidden');
  n.style.display = 'none';
  n.setAttribute('hidden', '');
  doc._ajouter('wt-intel', n);

  assert.equal(revelerPanneau('wt-intel', doc), true);
  assert.equal(n.classList.contains('wt-dock-cache'), false);
  assert.equal(n.classList.contains('hidden'), false);
  assert.equal(n.style.display, '');
  assert.equal(n._attrs.hidden, undefined);
});

test('revelerPanneau signale un panneau introuvable', () => {
  assert.equal(revelerPanneau('inexistant', fauxDoc()), false);
  assert.equal(revelerPanneau('x', null), false);
});

test('initBarreFonctions construit la barre sans DOM reel', () => {
  const doc = fauxDoc();
  const api = initBarreFonctions({ document: doc });
  assert.equal(typeof api.basculer, 'function');
  assert.ok(doc.body.children.length >= 2, 'barre + poignee ajoutees');
  assert.doesNotThrow(() => { api.masquer(); api.afficher(); api.detruire(); });
});

test('initBarreFonctions degrade proprement sans document', () => {
  const api = initBarreFonctions({ document: null });
  assert.doesNotThrow(() => { api.afficher(); api.masquer(); api.basculer(); api.detruire(); });
});

// ── Defauts signales apres essai en preview ────────────────────────────────

test('la barre masque le rail du dock : plus de redondance visuelle', () => {
  // Les prereglages TOUT / EXPLORER / VOL doublonnaient la barre.
  for (const sel of ['.wt-dock-presets', '.wt-dock-categories', '.wt-dock-groupe']) {
    assert.ok(CSS_SOURCE.includes(sel), `${sel} doit etre neutralise par la barre`);
  }
});

test('la barre se cale sur la hauteur mesuree du dock, pas sur une valeur en dur', () => {
  // Une marge fixe (4.6rem) passait PAR-DESSUS les boutons voix.
  assert.ok(CSS_SOURCE.includes('--wt-barre-bas'),
    'la position doit venir d une variable mesuree au runtime');
  assert.ok(!CSS_SOURCE.includes('bottom: calc(2vh + 4.6rem)'),
    'plus aucune marge en dur qui recouvre le dock');
});

test('initBarreFonctions expose replacer pour repositionner a la demande', () => {
  const doc = fauxDoc();
  const api = initBarreFonctions({ document: doc });
  assert.equal(typeof api.replacer, 'function');
  assert.doesNotThrow(() => api.replacer());
  api.detruire();
});

test('la barre reste sur une ligne et signale son debordement', () => {
  // Exigence : UNE SEULE LIGNE. Donc elle defile, et il faut le montrer.
  assert.ok(CSS_SOURCE.includes('wt-deborde'), 'indice de debordement present');
  assert.ok(!/#wt-barre\s*\{[^}]*flex-wrap:\s*wrap/.test(CSS_SOURCE),
    'la barre ne doit jamais passer a la ligne');
});

test('placerPoignee tolere un DOM minimal sans scrollWidth ni classList.toggle', () => {
  const doc = fauxDoc();
  const api = initBarreFonctions({ document: doc });
  assert.doesNotThrow(() => api.replacer(), 'aucune exception sur DOM partiel');
  api.detruire();
});
