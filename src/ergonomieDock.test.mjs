import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  TITRE_OUTILS, A_RAPATRIER, renommerEnOutils, rapatrierBoutons, initErgonomieDock,
} from './ergonomieDock.js';

// --- Faux DOM minimal, suffisant pour les deplacements -------------------
function faireDoc() {
  const mk = (id, tag = 'div') => {
    const el = {
      id, tagName: tag.toUpperCase(), children: [], parent: null, style: {},
      attrs: {}, _text: '',
      appendChild(c) {
        if (c.parent) c.parent.children = c.parent.children.filter((x) => x !== c);
        c.parent = el; el.children.push(c); return c;
      },
      setAttribute(k, v) { el.attrs[k] = v; },
      querySelector() { return null; },
      closest(sel) {
        let n = el;
        while (n) { if (`#${n.id}` === sel) return n; n = n.parent; }
        return null;
      },
      get textContent() { return el._text; },
      set textContent(v) { el._text = v; el.children = []; },
    };
    return el;
  };
  const reg = new Map();
  const add = (id, tag) => { const e = mk(id, tag); reg.set(id, e); return e; };
  const popover = add('control-panel-popover');
  const titre = add('panel-title-el');
  const top = add('top-center-actions');
  for (const id of A_RAPATRIER) top.appendChild(add(id, 'button'));
  const doc = {
    head: add('head'),
    getElementById: (id) => reg.get(id) || null,
    createElement: (t) => { const e = mk('', t); return e; },
    createTextNode: (t) => ({ nodeText: t, parent: null }),
    querySelector: (sel) => {
      if (sel === '#control-panel .panel-title') return titre;
      if (sel === '#control-panel-popover') return popover;
      if (sel === '#command-dock') return add('command-dock');
      if (sel === '#wt-outils-repris') return reg.get('wt-outils-repris') || null;
      return null;
    },
  };
  // enregistre la zone creee pour les appels suivants
  const vraiAppend = popover.appendChild;
  popover.appendChild = (c) => { if (c.id) reg.set(c.id, c); return vraiAppend(c); };
  return { doc, reg, top, titre, popover };
}

test('le tiroir est renomme en OUTILS', () => {
  const { doc, titre } = faireDoc();
  assert.equal(renommerEnOutils(doc), true);
  assert.equal(titre.children.at(-1).nodeText, TITRE_OUTILS);
});

test('le conteneur entier migre dans le tiroir', () => {
  const { doc, reg, top } = faireDoc();
  assert.ok(rapatrierBoutons(doc) > 0);
  assert.equal(top.parent.id, 'wt-outils-repris', 'la nav elle-meme est deplacee');
  for (const id of A_RAPATRIER) {
    assert.equal(reg.get(id).parent.id, 'top-center-actions',
      `${id} RESTE dans la nav : son habillage CSS en depend`);
  }
});

test('AUCUNE FONCTION PERDUE : rien n est supprime', () => {
  const { doc, reg } = faireDoc();
  rapatrierBoutons(doc);
  for (const id of A_RAPATRIER) {
    assert.ok(reg.get(id), `${id} existe toujours`);
    assert.ok(reg.get(id).parent, `${id} est rattache`);
  }
});

test('REGRESSION : les boutons ne quittent jamais leur conteneur', () => {
  // Les sortir de #top-center-actions leur retire tout leur CSS
  // (style.css l.1884-1919) et les icones paraissent cassees.
  const src = fs.readFileSync(new URL('./ergonomieDock.js', import.meta.url), 'utf8');
  assert.ok(src.includes('zone.appendChild(source)'), 'on deplace la nav, pas les boutons');
});

test('l operation est idempotente', () => {
  const { doc } = faireDoc();
  assert.ok(rapatrierBoutons(doc) > 0);
  assert.equal(rapatrierBoutons(doc), 0, 'un second passage ne redeplace rien');
});

test('un document incomplet ne fait rien planter', () => {
  const vide = { querySelector: () => null, getElementById: () => null };
  assert.equal(rapatrierBoutons(vide), 0);
  assert.equal(renommerEnOutils(vide), false);
  assert.deepEqual(initErgonomieDock(null), { renomme: false, deplaces: 0, chat: false });
});

// --- Garde-fous sur le code source ---------------------------------------
test('les trois boutons cibles existent bien dans index.html', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of A_RAPATRIER) {
    assert.ok(html.includes(`id="${id}"`), `${id} doit exister pour etre deplace`);
  }
});

test('le bouton chat ouvre le dock chat', () => {
  const src = fs.readFileSync(new URL('./ergonomieDock.js', import.meta.url), 'utf8');
  assert.ok(src.includes("dock.ouvrir('chat')"), 'le chat reste branche sur le dock existant');
  assert.ok(src.includes('wt-chat-dock'));
});

test('ergonomieDock est bien branche dans main.js', () => {
  const src = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  assert.ok(src.includes('initErgonomieDock'), 'sinon le regroupement ne s applique jamais');
});
