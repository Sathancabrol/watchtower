// src/llm.test.mjs — le chat branché sur une IA (Ollama d'abord) + repli local.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODELES_CONNUS, OLLAMA_DEFAUT, SYSTEME, creerAssistant, demander, estOllama,
  messagesPour, modelesDepuisTags, modelesOllama, reponseLocale, texteOllama,
  texteOpenAi, urlChatOllama, urlChatOpenAi, urlModeles,
} from './llm.js';

test('Ollama est la brique locale par défaut', () => {
  assert.equal(OLLAMA_DEFAUT, 'http://localhost:11434');
  assert.ok(MODELES_CONNUS.includes('llama3.2'));
});

test('URL : modèle, chat Ollama, chat compatible OpenAI', () => {
  assert.equal(urlModeles(), 'http://localhost:11434/api/tags');
  assert.equal(urlModeles('http://192.168.1.9:11434/'), 'http://192.168.1.9:11434/api/tags');
  assert.equal(urlChatOllama(), 'http://localhost:11434/api/chat');
  assert.equal(urlChatOllama('http://localhost:11434/'), 'http://localhost:11434/api/chat');
  assert.equal(urlChatOpenAi('http://localhost:1234/v1'), 'http://localhost:1234/v1/chat/completions');
  assert.equal(urlChatOpenAi('https://api.mistral.ai/v1'), 'https://api.mistral.ai/v1/chat/completions');
  assert.equal(urlChatOpenAi('https://api.mistral.ai/v1/'), 'https://api.mistral.ai/v1/chat/completions');
});

test('Ollama reconnu à son identifiant ou à son URL', () => {
  assert.equal(estOllama({ id: 'ollama' }), true);
  assert.equal(estOllama({ url: 'http://localhost:11434' }), true);
  assert.equal(estOllama({ id: 'mistral', url: 'https://api.mistral.ai/v1' }), false);
  assert.equal(estOllama(null), false);
});

test('le prompt système décrit les capacités RÉELLES', () => {
  assert.match(SYSTEME, /Géorisques/);
  assert.match(SYSTEME, /Open-Meteo/);
  assert.match(SYSTEME, /urgence/);
  assert.match(SYSTEME, /JAMAIS/, 'interdit d’inventer');
});

test('les messages portent le contexte et l’historique', () => {
  const m = messagesPour('que voit-on ici ?', { commune: 'Frontignan', vol: true, historique: [{ role: 'user', content: 'salut' }] });
  assert.equal(m[0].role, 'system');
  assert.equal(m.at(-1).role, 'user');
  assert.match(m.at(-1).content, /Frontignan/);
  assert.match(m.at(-1).content, /mode vol actif/);
  assert.equal(m.length, 3, 'system + historique + question');
  // sans contexte : pas de balise [contexte]
  const simple = messagesPour('bonjour');
  assert.equal(simple.length, 2);
  assert.doesNotMatch(simple[1].content, /\[contexte\]/);
  assert.equal(messagesPour('', { urgence: true })[1].content.length > 0, true);
});

test('lecture d’une réponse Ollama et d’une réponse OpenAI', () => {
  assert.equal(texteOllama({ message: { content: 'salut' } }), 'salut');
  assert.equal(texteOllama({ response: 'direct' }), 'direct');
  assert.equal(texteOllama({}), '');
  assert.equal(texteOpenAi({ choices: [{ message: { content: 'yo' } }] }), 'yo');
  assert.equal(texteOpenAi({ choices: [{ text: 'vieux format' }] }), 'vieux format');
  assert.equal(texteOpenAi({}), '');
});

test('liste des modèles depuis /api/tags', () => {
  const l = modelesDepuisTags({ models: [{ name: 'mistral' }, { name: 'llama3.2' }, { model: 'gemma2' }, null] });
  assert.deepEqual(l, ['gemma2', 'llama3.2', 'mistral'], 'triée et nettoyée');
  assert.deepEqual(modelesDepuisTags({}), []);
  assert.deepEqual(modelesDepuisTags(null), []);
});

test('modelesOllama : muet si la machine ne répond pas', async () => {
  const liste = await modelesOllama('http://localhost:11434', { aller: async () => { throw new Error('off'); } });
  assert.deepEqual(liste, []);
  const ok = await modelesOllama('http://x', { aller: async () => ({ ok: true, json: async () => ({ models: [{ name: 'phi3' }] }) }) });
  assert.deepEqual(ok, ['phi3']);
  const ko = await modelesOllama('http://x', { aller: async () => ({ ok: false }) });
  assert.deepEqual(ko, []);
});

test('demander() construit la bonne requête pour Ollama', async () => {
  let vu = null;
  const aller = async (url, init) => {
    vu = { url, init };
    return { ok: true, json: async () => ({ message: { content: 'bonjour !' } }) };
  };
  const r = await demander({ id: 'ollama', url: OLLAMA_DEFAUT, modele: 'llama3.2' }, [{ role: 'user', content: 'salut' }], { aller });
  assert.equal(vu.url, 'http://localhost:11434/api/chat');
  const corps = JSON.parse(vu.init.body);
  assert.equal(corps.model, 'llama3.2');
  assert.equal(corps.stream, false);
  assert.equal(vu.init.headers.Authorization, undefined, 'Ollama : pas de clé');
  assert.equal(r.texte, 'bonjour !');
});

test('demander() construit la bonne requête pour un service à clé', async () => {
  let vu = null;
  const aller = async (url, init) => {
    vu = { url, init };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
  };
  const r = await demander({ id: 'mistral', url: 'https://api.mistral.ai/v1', cle: 'sk-test', modele: 'mistral-small' }, [], { aller });
  assert.equal(vu.url, 'https://api.mistral.ai/v1/chat/completions');
  assert.equal(vu.init.headers.Authorization, 'Bearer sk-test');
  assert.equal(r.texte, 'ok');
});

test('demander() : une erreur HTTP remonte', async () => {
  await assert.rejects(
    () => demander({ id: 'ollama', url: OLLAMA_DEFAUT }, [], { aller: async () => ({ ok: false, status: 500 }) }),
    /HTTP 500/,
  );
  await assert.rejects(() => demander({}, [], { aller: null }), /transport/);
});

test('repli hors-ligne : une urgence prime sur tout', () => {
  const r = reponseLocale('je suis blessé, au secours');
  assert.match(r, /\/urgence/);
  assert.match(r, /112/);
});

test('repli hors-ligne : chaque sujet renvoie vers la bonne commande', () => {
  const cmds = [
    { id: 'meteo', ic: '🌦', titre: 'Météo' },
    { id: 'risques', ic: '⛑', titre: 'Risques' },
    { id: 'entreprises', ic: '🏢', titre: 'Entreprises' },
  ];
  assert.match(reponseLocale('quel temps fait-il ?', { commandes: cmds }), /\/meteo/);
  assert.match(reponseLocale('risques de la commune', { commandes: cmds }), /\/risques/);
  assert.match(reponseLocale('entreprises autour', { commandes: cmds }), /\/entreprises/);
  assert.match(reponseLocale('risques', { commandes: cmds }), /Géorisques/, 'la source est citée');
});

test('repli hors-ligne : une question sur l’IA explique comment la brancher', () => {
  const r = reponseLocale('tu es connecté à quelle ia ?');
  assert.match(r, /hors-ligne/);
  assert.match(r, /Ollama/);
});

test('repli hors-ligne : un lieu reste un lieu', () => {
  const r = reponseLocale('frontignan la pinede', { contexte: { commune: 'Frontignan' } });
  assert.match(r, /Frontignan/);
  assert.match(r, /lieu/, 'on explique ce qu’on va faire');
  assert.equal(typeof reponseLocale(''), 'string', 'jamais d’erreur');
});

test('l’assistant choisit l’IA, ou le repli local', async () => {
  // 1) aucune IA branchée
  const CMDS = [{ id: 'meteo', ic: '🌦', titre: 'Météo' }];
  const sans = creerAssistant({ comptes: { ia: () => null }, commandes: CMDS });
  const r1 = await sans.demander('météo ?');
  assert.equal(r1.source, 'hors-ligne');
  assert.match(r1.texte, /\/meteo/);

  // 2) Ollama branché : on interroge le bon service
  const avec = creerAssistant({
    comptes: { ia: () => ({ id: 'ollama', url: OLLAMA_DEFAUT, modele: 'llama3.2', cle: '' }) },
  });
  const r2 = await avec.demander('salut', {}, async () => ({ ok: true, json: async () => ({ message: { content: 'yo' } }) }));
  assert.equal(r2.texte, 'yo');
  assert.match(r2.source, /ollama/);

  // 3) service éteint → message clair + repli
  const r3 = await avec.demander('salut', {}, async () => { throw new Error('Failed to fetch'); });
  assert.match(r3.texte, /Ollama/);
  assert.equal(r3.source, 'erreur-ia');

  assert.match(avec.mode(), /ollama/);
  assert.equal(sans.mode(), 'hors-ligne');
  assert.equal(avec.historique().length > 0, true, 'l’historique est tenu');
  avec.effacer();
  assert.equal(avec.historique().length, 0);
});
