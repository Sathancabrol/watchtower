import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CLE_MINICARTE, ID_BOUTON, etatMemorise, memoriser, appliquer, initBasculeMinicarte,
} from './basculeMinicarte.js';

/** Faux stockage isolé. */
function stock(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

/** Document minimal : pas de jsdom dans ce dépôt. */
function faussDocument({ avecMinimap = true } = {}) {
  const parClasse = (el) => {
    const set = new Set();
    return {
      add: (...c) => c.forEach((x) => set.add(x)),
      remove: (...c) => c.forEach((x) => set.delete(x)),
      contains: (c) => set.has(c),
      _set: set,
    };
  };
  const creer = (tag) => {
    const el = {
      tagName: tag, id: '', type: '', title: '', innerHTML: '', textContent: '',
      style: {}, enfants: [], attributs: {}, ecouteurs: {},
      appendChild(c) { this.enfants.push(c); return c; },
      setAttribute(k, v) { this.attributs[k] = String(v); },
      getAttribute(k) { return this.attributs[k] ?? null; },
      addEventListener(t, f) { (this.ecouteurs[t] ||= []).push(f); },
      cliquer() { for (const f of this.ecouteurs.click || []) f(); },
    };
    el.classList = parClasse(el);
    return el;
  };
  const par_id = new Map();
  const head = creer('head');
  const body = creer('body');
  if (avecMinimap) par_id.set('wt-minimap', creer('div'));
  return {
    head,
    body,
    createElement: creer,
    getElementById: (id) => par_id.get(id) || null,
    _poser: (id, el) => par_id.set(id, el),
    _pose: par_id,
  };
}

test('par defaut la minicarte est visible', () => {
  assert.equal(etatMemorise(stock()), true);
  assert.equal(etatMemorise(stock({ [CLE_MINICARTE]: '0' })), false);
  assert.equal(etatMemorise(stock({ [CLE_MINICARTE]: '1' })), true);
});

test('memoriser ecrit 1 ou 0 et ne jette jamais', () => {
  const s = stock();
  memoriser(false, s);
  assert.equal(s.getItem(CLE_MINICARTE), '0');
  memoriser(true, s);
  assert.equal(s.getItem(CLE_MINICARTE), '1');
  assert.doesNotThrow(() => memoriser(true, { setItem() { throw new Error('quota'); } }));
});

test('appliquer pose et retire la classe de masquage', () => {
  const doc = faussDocument();
  assert.equal(appliquer(false, doc), true);
  assert.equal(doc.getElementById('wt-minimap').classList.contains('wt-minicarte-off'), true);
  appliquer(true, doc);
  assert.equal(doc.getElementById('wt-minimap').classList.contains('wt-minicarte-off'), false);
});

test('appliquer sans minicarte ne casse rien', () => {
  assert.equal(appliquer(false, faussDocument({ avecMinimap: false })), false);
  assert.equal(appliquer(false, null), false);
});

test('le bouton se cree, bascule et memorise', () => {
  const doc = faussDocument();
  const s = stock();
  const messages = [];
  const api = initBasculeMinicarte(doc, { stockage: s, surMessage: (m) => messages.push(m) });
  assert.ok(api.bouton);
  assert.equal(api.bouton.id, ID_BOUTON);
  assert.equal(api.estVisible(), true);
  assert.match(api.bouton.innerHTML, /ON/);

  api.bouton.cliquer();
  assert.equal(api.estVisible(), false);
  assert.match(api.bouton.innerHTML, /OFF/);
  assert.equal(api.bouton.getAttribute('aria-pressed'), 'false');
  assert.equal(doc.getElementById('wt-minimap').classList.contains('wt-minicarte-off'), true);
  assert.equal(s.getItem(CLE_MINICARTE), '0');
  assert.equal(messages.length, 1);

  api.bouton.cliquer();
  assert.equal(api.estVisible(), true);
  assert.equal(doc.getElementById('wt-minimap').classList.contains('wt-minicarte-off'), false);
});

test("l'etat memorise est reapplique au demarrage", () => {
  const doc = faussDocument();
  const api = initBasculeMinicarte(doc, { stockage: stock({ [CLE_MINICARTE]: '0' }) });
  assert.equal(api.estVisible(), false);
  assert.equal(doc.getElementById('wt-minimap').classList.contains('wt-minicarte-off'), true);
});

test('basculer accepte une valeur forcee', () => {
  const doc = faussDocument();
  const api = initBasculeMinicarte(doc, { stockage: stock() });
  assert.equal(api.basculer(false), false);
  assert.equal(api.basculer(false), false, 'idempotent');
  assert.equal(api.basculer(true), true);
});

test('la minicarte reste accessible : on masque, on ne supprime pas', () => {
  const doc = faussDocument();
  const api = initBasculeMinicarte(doc, { stockage: stock() });
  api.basculer(false);
  assert.ok(doc.getElementById('wt-minimap'), 'le noeud doit survivre au masquage');
});

test('sans document le module ne plante pas', () => {
  const api = initBasculeMinicarte(null);
  assert.equal(api.bouton, null);
  assert.doesNotThrow(() => api.basculer());
});
