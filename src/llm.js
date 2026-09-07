/**
 * WATCHTOWER — LE CHAT BRANCHÉ SUR UNE IA.
 *
 * Trois étages, du plus ouvert au plus fermé (et l'utilisateur choisit) :
 *
 *  1. **TON IA LOCALE** — Ollama sur la machine (`http://localhost:11434`).
 *     Gratuit, hors ligne, rien ne sort de chez toi. On détecte le service, on
 *     liste les modèles installés, on cause avec `/api/chat`.
 *  2. **UNE IA GRATUITE EN LIGNE** — n'importe quel service « compatible
 *     OpenAI » (LM Studio, Ollama distant, Mistral « Free », Groq, OpenRouter…)
 *     ou Gemini via une clé : mêmes messages, une URL et une clé.
 *  3. **LE MODE HORS-LIGNE** — aucune IA branchée : le chat continue de
 *     répondre, en s'appuyant sur le registre de commandes (`commandes.js`) et
 *     les modules locaux. Ce n'est pas une IA, et on le DIT (traçabilité).
 *
 * Rien n'est inventé : sans réponse de l'IA, on le dit et on propose la
 * commande locale qui va bien. Le prompt système décrit les capacités réelles
 * de l'application pour éviter les hallucinations.
 *
 * Les fonctions de construction d'URL/messages sont pures et testées.
 */

/** Adresse Ollama par défaut (celle de l'utilisateur, sur sa machine). */
export const OLLAMA_DEFAUT = 'http://localhost:11434';

/** Modèles connus (aide au choix, sans jamais bloquer). */
export const MODELES_CONNUS = Object.freeze([
  'llama3.2', 'llama3.1', 'mistral', 'mistral-nemo', 'qwen2.5', 'gemma2',
  'phi3', 'deepseek-r1', 'llava',
]);

/**
 * Le prompt système : ce que l'assistant a le droit de dire.
 * Il liste les capacités RÉELLES — c'est la meilleure garantie
 * anti-hallucination.
 */
export const SYSTEME = `Tu es l'assistant de WATCHTOWER, une application de cartographie
et d'analyse de terrain (Cesium + OpenStreetMap).

Capacités réelles de l'application :
- voler vers un lieu (géocodage BAN/Photon), vue orbitale, recadrage au nord ;
- météo (Open-Meteo), risques (Géorisques), entreprises (recherche-entreprises) ;
- entités de la carte (OpenStreetMap/Overpass), cadrans d'une commune, cadastre ;
- chantier : planning, phasage, budget, matériel, documents (CERFA…) ;
- mode urgence (« /urgence »), itinéraires (OSRM), sources et traçabilité ;
- calques : pluie, nuages, relief, noms.

Règles :
1. Réponds en français, court (5 lignes maximum), concret, sans bavardage.
2. Si l'utilisateur veut une ACTION, donne la commande exacte entre slashes
   (ex : « /urgence incendie », « /meteo », « /cadastre »).
3. Ne invente JAMAIS une donnée : si tu ne sais pas, dis-le et indique la
   source gratuite qui peut répondre (OpenStreetMap, Géorisques, Open-Meteo).
4. Cite toujours d'où vient l'information quand tu en donnes une.`;

/** URL de liste des modèles (Ollama). */
export function urlModeles(base = OLLAMA_DEFAUT) {
  return `${String(base || OLLAMA_DEFAUT).replace(/\/+$/, '')}/api/tags`;
}

/** URL de discussion (Ollama). */
export function urlChatOllama(base = OLLAMA_DEFAUT) {
  return `${String(base || OLLAMA_DEFAUT).replace(/\/+$/, '')}/api/chat`;
}

/** URL de discussion (compatible OpenAI). */
export function urlChatOpenAi(base = '') {
  const b = String(base || '').replace(/\/+$/, '');
  return `${b}${b.endsWith('/v1') ? '' : '/v1'}/chat/completions`;
}

/**
 * Construit les messages pour l'IA.
 * @param {string} question
 * @param {{lieu?:string, commune?:string, vol?:boolean, urgence?:boolean, historique?:Array}} [contexte]
 */
export function messagesPour(question, contexte = {}) {
  const c = contexte || {};
  const infos = [];
  if (c.commune) infos.push(`commune à l'écran : ${c.commune}`);
  if (c.lieu) infos.push(`point visé : ${c.lieu}`);
  if (c.vol) infos.push('mode vol actif');
  if (c.urgence) infos.push('MODE URGENCE ACTIF : répondre par des gestes, très court');
  const user = infos.length
    ? `[contexte] ${infos.join(' · ')}\n\n${String(question || '')}`
    : String(question || '');
  const hist = Array.isArray(c.historique) ? c.historique.slice(-8) : [];
  return [
    { role: 'system', content: SYSTEME },
    ...hist,
    { role: 'user', content: user },
  ];
}

/** Vrai si l'URL est celle d'Ollama (locale ou distante). */
export function estOllama(compte = {}) {
  return String(compte?.id || '') === 'ollama' || /ollama|11434/.test(String(compte?.url || ''));
}

/** Extrait la réponse d'une réponse Ollama. */
export function texteOllama(json) {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json.response === 'string') return json.response;
  const msg = json.message || json.messages?.[json.messages.length - 1];
  if (typeof msg?.content === 'string') return msg.content;
  if (Array.isArray(json.choices) && json.choices[0]?.message?.content) return json.choices[0].message.content;
  return '';
}

/** Extrait la réponse d'une réponse compatible OpenAI. */
export function texteOpenAi(json) {
  const c = json?.choices?.[0];
  if (typeof c?.message?.content === 'string') return c.message.content;
  if (typeof c?.text === 'string') return c.text;
  return '';
}

/** Liste des modèles d'une réponse Ollama `/api/tags`. */
export function modelesDepuisTags(json) {
  const liste = Array.isArray(json?.models) ? json.models : [];
  return liste
    .map((m) => String(m?.name || m?.model || '').trim())
    .filter(Boolean)
    .sort();
}

/**
 * Requête vers n'importe quel fournisseur.
 * @param {{id?:string, url?:string, cle?:string, modele?:string}} compte
 * @param {Array} messages
 * @param {{delai?:number, aller?:Function}} [options] `aller` = fetch injectable
 * @returns {Promise<{texte:string, modele:string, fournisseur:string, brut?:any}>}
 */
export async function demander(compte = {}, messages = [], options = {}) {
  const aller = typeof options.aller === 'function' ? options.aller : null;
  if (!aller) throw new Error('aucun transport (fetch) fourni');
  const c = compte || {};
  const modele = String(c.modele || '').trim();
  const ollama = estOllama(c);
  const url = ollama ? urlChatOllama(c.url) : urlChatOpenAi(c.url);
  const corps = ollama
    ? { model: modele || MODELES_CONNUS[0], messages, stream: false }
    : { model: modele, messages, stream: false, temperature: 0.3 };
  const entetes = { 'Content-Type': 'application/json' };
  if (!ollama && c.cle) entetes.Authorization = `Bearer ${c.cle}`;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => ctrl?.abort?.(), Math.max(3000, Number(options.delai) || 30_000));
  try {
    const r = await aller(url, {
      method: 'POST', headers: entetes, body: JSON.stringify(corps), signal: ctrl.signal,
    });
    if (!r?.ok) throw new Error(`HTTP ${r?.status || '?'}`);
    const json = await r.json();
    const texte = (ollama ? texteOllama(json) : texteOpenAi(json) || texteOllama(json)).trim();
    return { texte, modele: modele || (ollama ? MODELES_CONNUS[0] : ''), fournisseur: String(c.id || (ollama ? 'ollama' : 'compatible-openai')), brut: json };
  } finally {
    clearTimeout(t);
  }
}

/** Liste les modèles Ollama installés (ou [] si la machine ne répond pas). */
export async function modelesOllama(base = OLLAMA_DEFAUT, { aller = null } = {}) {
  const f = aller || (typeof fetch === 'function' ? fetch : null);
  if (!f) return [];
  try {
    const r = await f(urlModeles(base));
    if (!r?.ok) return [];
    return modelesDepuisTags(await r.json());
  } catch {
    return [];
  }
}

/**
 * Le REPLI HORS-LIGNE : pas d'IA, mais une réponse honnête et utile.
 * @param {string} question
 * @param {{commandes?:Array, contexte?:object}} [options]
 */
export function reponseLocale(question = '', options = {}) {
  const q = String(question || '').toLowerCase();
  const contexte = options.contexte || {};
  const lignes = [];
  const propose = (c) => `- ${c.ic} ${c.titre} → « /${c.id} »`;
  const trouver = (mot) => (options.commandes || []).find((c) => c.id === mot);

  if (/urgence|secours|sos|danger|blessé|feu/.test(q)) {
    lignes.push('🚨 S’il y a un DANGER : tape « /urgence » — je gèle l’écran, je te guide étape par étape et je cherche les secours les plus proches.');
    lignes.push('📞 Numéros : 112 · 15 · 17 · 18 · 114 (SMS) · 196 (mer).');
    return lignes.join('\n');
  }
  if (/météo|meteo|temps|pluie|vent/.test(q)) {
    const c = trouver('meteo');
    if (c) lignes.push(propose(c));
    lignes.push('Données Open-Meteo (gratuites, sans clé) au point visé.');
    return lignes.join('\n');
  }
  if (/risque|inondation|séisme|seisme|industriel/.test(q)) {
    const c = trouver('risques');
    if (c) lignes.push(propose(c));
    lignes.push('Source : Géorisques (gouv.fr) — risques recensés de la commune.');
    return lignes.join('\n');
  }
  if (/entreprise|société|societe|siret|boutique/.test(q)) {
    const c = trouver('entreprises');
    if (c) lignes.push(propose(c));
    lignes.push('Source : recherche-entreprises.api.gouv.fr (gratuit, sans clé).');
    return lignes.join('\n');
  }
  if (/caméra|camera|webcam|micro|direct|flux/.test(q)) {
    lignes.push('🎥 Ouvre le moniteur du PALAIS MENTAL (🧠) ou le panneau CAM : caméras publiques OSM + ta webcam/micro (aucune clé).');
    return lignes.join('\n');
  }
  if (/ia|modèle|modele|ollama|llm|intelligence/.test(q)) {
    lignes.push('🦙 Aucune IA n’est branchée : je réponds en mode hors-ligne (commandes locales).');
    lignes.push('👉 Branche Ollama (déjà installé chez toi) : bouton 🔑 SE CONNECTER → « Ollama (local) » → TESTER.');
    return lignes.join('\n');
  }
  if (/qui es-tu|que peux-tu|capacité|capacite|aide|commande/.test(q)) {
    lignes.push('Je sais : voler vers un lieu, météo, risques, entreprises, entités OSM, cadrans, cadastre, chantier, urgence, itinéraires.');
    lignes.push('Tape « /aide » pour la liste complète des commandes.');
    return lignes.join('\n');
  }

  // défaut : c'est probablement un lieu
  lignes.push(`🔍 « ${String(question || '').trim().slice(0, 60) } » ressemble à un lieu : je le cherche (BAN/Photon, gratuit).`);
  if (contexte.commune) lignes.push(`📍 Commune à l’écran : ${contexte.commune}.`);
  lignes.push('💡 Pour une réponse rédigée, branche une IA (bouton 🔑 → Ollama local, c’est gratuit).');
  return lignes.join('\n');
}

/**
 * Assistant du chat : essaie l'IA, repli hors-ligne sinon.
 * @param {{comptes?:object, surMessage?:Function}} [options]
 */
export function creerAssistant(options = {}) {
  const comptes = options.comptes || null;
  const commandes = options.commandes || [];
  const surMessage = typeof options.surMessage === 'function' ? options.surMessage : () => {};
  const historique = [];

  return {
    /** Compte IA courant (ou null = hors-ligne). */
    compte: () => comptes?.ia?.() || null,
    /** Nom affiché du mode courant. */
    mode: () => {
      const c = comptes?.ia?.() || null;
      return c ? `${c.id} · ${c.modele || 'par défaut'}` : 'hors-ligne';
    },
    /** Modèles disponibles si Ollama répond. */
    async modeles() {
      const c = comptes?.ia?.() || null;
      const base = (c?.url || OLLAMA_DEFAUT);
      const liste = await modelesOllama(base);
      if (!liste.length && c && c.id === 'ollama') {
        surMessage(`🦙 Ollama ne répond pas sur ${base} — lance-le (et au besoin autorise l’origine du site : OLLAMA_ORIGINS=*).`);
      }
      return liste;
    },
    /**
     * Pose une question.
     * @param {string} question
     * @param {object} [contexte]
     * @param {Function} [aller] fetch (injectable pour les tests)
     */
    async demander(question, contexte = {}, aller = null) {
      const c = comptes?.ia?.() || null;
      historique.push({ role: 'user', content: String(question || '') });
      const repli = (prefixe = '') => ({
        texte: prefixe ? `${prefixe}\n\n${reponseLocale(question, { contexte, commandes })}` : reponseLocale(question, { contexte, commandes }),
        source: prefixe ? 'erreur-ia' : 'hors-ligne',
      });
      if (!c) return repli();
      const f = aller || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
      if (!f) return repli();
      try {
        const messages = messagesPour(question, { ...contexte, historique: historique.slice(-6, -1) });
        const r = await demander(c, messages, { aller: f });
        historique.push({ role: 'assistant', content: r.texte });
        return { texte: r.texte, source: `${r.fournisseur} · ${r.modele}` };
      } catch (e) {
        const msg = String(e?.message || e);
        const local = /Failed to fetch|NetworkError|abort/i.test(msg)
          ? `${msg}\n\n👉 Ollama doit tourner (et accepter l’origine du site : \`OLLAMA_ORIGINS=*\`).`
          : msg;
        return { texte: `${local}\n\n${reponseLocale(question, { contexte })}`, source: 'erreur-ia' };
      }
    },
    historique: () => historique.slice(),
    effacer: () => { historique.length = 0; },
  };
}
