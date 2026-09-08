import test from 'node:test';
import assert from 'node:assert/strict';
import { installationFeedback } from './installationFeedback.js';

test('le chargement est annonce, et la reprise distinguee', () => {
  assert.match(installationFeedback({ loading: true }), /Recherche des sites/);
  assert.match(installationFeedback({ loading: true, retrying: true }), /Nouvelle tentative/);
});

test('le compte a rebours de reprise est exact', () => {
  const m = installationFeedback({ retryAt: 10_000 }, 4_000);
  assert.match(m, /6 s/, 'six secondes restantes');
  assert.match(installationFeedback({ retryAt: 1, failureReason: 'timeout' }, 10_000), /tentative en attente/);
});

test('chaque cause d echec a son message propre', () => {
  assert.match(installationFeedback({ status: 'unavailable', failureReason: 'rate_limited' }), /limité le débit/);
  assert.match(installationFeedback({ status: 'unavailable', failureReason: 'timeout' }), /pas répondu à temps/);
  assert.match(installationFeedback({ status: 'unavailable', failureReason: 'query_failed' }), /pas pu exécuter/);
  assert.match(installationFeedback({ status: 'unavailable' }), /momentanément indisponible/,
    'cause inconnue : on n invente pas');
});

test('les etats nominaux sont distincts', () => {
  assert.match(installationFeedback({ status: 'zoom-in' }), /Rapproche-toi/);
  assert.match(installationFeedback({ stale: true }), /en cache/);
  assert.match(installationFeedback({ status: 'idle' }), /non chargés/);
  assert.match(installationFeedback({}), /chargés/);
});

test('un appel sans argument ne casse pas', () => {
  assert.equal(typeof installationFeedback(), 'string');
  assert.ok(installationFeedback().length > 0);
});
