/**
 * WATCHTOWER — COMPTES & NIVEAUX D'INFORMATION.
 *
 * L'application doit rester **gratuite et ouverte**, mais certaines briques
 * (une IA plus costaude, des flux de caméras premium, des données financières
 * certifiées) demandent un compte ou une clé payante. Règle maison : on ne
 * bloque jamais l'utilisateur — on lui montre la porte, on explique ce que ça
 * apporte, et il branche ce qu'il veut, quand il veut.
 *
 * D'où une **fenêtre de connexion de compte** comme sur n'importe quel site :
 * on choisit un fournisseur, on renseigne l'URL / la clé, on TESTE, on
 * enregistre. Les secrets restent dans le navigateur de l'utilisateur
 * (`localStorage`) : ils ne traversent que vers le fournisseur choisi.
 *
 * Trois niveaux, affichés partout dans l'interface :
 *   🟢 GRATUIT  — sans rien, tout de suite (OSM, Géorisques, Open-Meteo, Ollama…)
 *   🔵 COMPTE   — il faut se connecter (Google, fournisseur d'IA, portail…)
 *   🟣 PAYANT   — offre payante (clé facturée), jamais obligatoire
 *
 * La partie métier est pure et testée (`compte.test.mjs`).
 */

/** Niveaux d'information, du plus ouvert au plus fermé. */
export const NIVEAUX = Object.freeze(['gratuit', 'compte', 'payant']);

/** Icône et libellé d'un niveau. */
export const LIBELLES_NIVEAU = Object.freeze({
  gratuit: { ic: '🟢', nom: 'GRATUIT', aide: 'sans compte, sans clé, tout de suite' },
  compte: { ic: '🔵', nom: 'COMPTE', aide: 'connexion à un compte (gratuite mais nominative)' },
  payant: { ic: '🟣', nom: 'PAYANT', aide: 'offre payante — jamais obligatoire' },
});

/**
 * Fournisseurs branchables. `type` : `local` (sur la machine), `cle` (clé
 * d'API), `oauth` (compte tiers), `aucun` (déjà gratuit, rien à brancher).
 */
export const FOURNISSEURS = Object.freeze([
  {
    id: 'ollama', nom: 'Ollama (local)', ic: '🦙', niveau: 'gratuit', type: 'local',
    urlDefaut: 'http://localhost:11434', modeleDefaut: 'llama3.2',
    apporte: ['le chat parle avec TON modèle, sur ta machine, hors ligne'],
    doc: 'https://ollama.com/',
    test: { url: '/api/tags', cleJson: 'models' },
  },
  {
    id: 'openai_compatible', nom: 'IA compatible OpenAI', ic: '🧠', niveau: 'compte', type: 'cle',
    urlDefaut: 'http://localhost:1234/v1', modeleDefaut: 'local-model',
    apporte: ['LM Studio, Ollama distant, Groq, Mistral, OpenRouter…'],
    doc: 'https://platform.openai.com/docs/api-reference',
  },
  {
    id: 'google', nom: 'Compte Google', ic: '🔎', niveau: 'compte', type: 'cle',
    urlDefaut: 'https://generativelanguage.googleapis.com/v1beta', modeleDefaut: 'gemini-2.0-flash',
    apporte: ['recherches associées', 'Gemini (IA)', 'clé Google Maps optionnelle'],
    doc: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'mistral', nom: 'Mistral AI', ic: '🌬', niveau: 'compte', type: 'cle',
    urlDefaut: 'https://api.mistral.ai/v1', modeleDefaut: 'mistral-small-latest',
    apporte: ['IA hébergée en Europe, offre gratuite « Free »'],
    doc: 'https://console.mistral.ai/api-keys',
  },
  {
    id: 'openrouteservice', nom: 'OpenRouteService', ic: '🧭', niveau: 'compte', type: 'cle',
    urlDefaut: 'https://api.openrouteservice.org', modeleDefaut: '',
    apporte: ['itinéraires illustrés (marche, vélo, camion) — 2 000/j gratuits'],
    doc: 'https://openrouteservice.org/dev/#/signup',
  },
  {
    id: 'pappers', nom: 'Pappers (entreprises)', ic: '💼', niveau: 'payant', type: 'cle',
    urlDefaut: 'https://api.pappers.fr', modeleDefaut: '',
    apporte: ['comptes annuels, dirigeants, bénéficiaires — offre payante'],
    doc: 'https://www.pappers.fr/api',
  },
  {
    id: 'windy_webcams', nom: 'Caméras Windy', ic: '🎥', niveau: 'payant', type: 'cle',
    urlDefaut: 'https://api.windy.com/api/webcams/v2', modeleDefaut: '',
    apporte: ['des milliers de caméras publiques en direct — clé payante'],
    doc: 'https://api.windy.com/keys',
  },
  {
    id: 'aucun', nom: 'Tout en gratuit', ic: '🟢', niveau: 'gratuit', type: 'aucun',
    urlDefaut: '', modeleDefaut: '',
    apporte: ['OpenStreetMap', 'Géorisques', 'Open-Meteo', 'GDELT', 'USGS', 'Radio-Browser'],
    doc: 'https://www.openstreetmap.org/',
  },
]);

/** Retrouve un fournisseur par identifiant. */
export function fournisseur(id) {
  return FOURNISSEURS.find((f) => f.id === String(id || '')) || null;
}

/** Niveau d'un fournisseur (repli : payant, par prudence). */
export function niveauDe(id) {
  const f = fournisseur(id);
  return f ? f.niveau : 'payant';
}

/** Vrai si le niveau `a` est au moins aussi ouvert que `b`. */
export function auMoinsAussiOuvert(a, b) {
  const ia = NIVEAUX.indexOf(String(a));
  const ib = NIVEAUX.indexOf(String(b));
  if (ia < 0 || ib < 0) return false;
  return ia <= ib;
}

/** Compte « vierge » d'un fournisseur. */
export function compteVierge(id) {
  const f = fournisseur(id) || {};
  return { id: String(id), url: f.urlDefaut || '', cle: '', modele: f.modeleDefaut || '', actif: false, maj: 0 };
}

/** Vrai si le compte est utilisable (branché et cohérent). */
export function estConnecte(compte) {
  if (!compte || !compte.actif) return false;
  const f = fournisseur(compte.id);
  if (!f) return false;
  if (f.type === 'aucun') return true;
  if (f.type === 'local') return Boolean(String(compte.url || '').trim());
  return Boolean(String(compte.cle || '').trim());
}

/** Résumé affichable : combien de comptes branchés, par niveau. */
export function etatResume(liste = []) {
  const comptes = Array.isArray(liste) ? liste : [];
  const out = { total: comptes.length, connectes: 0, gratuit: 0, compte: 0, payant: 0, ids: [] };
  for (const c of comptes) {
    if (!estConnecte(c)) continue;
    out.connectes += 1;
    out.ids.push(c.id);
    const n = niveauDe(c.id);
    if (n in out) out[n] += 1;
  }
  return out;
}

/** Le meilleur fournisseur d'IA disponible (local d'abord : c'est gratuit). */
export function choisirIA(liste = []) {
  const ordre = ['ollama', 'mistral', 'google', 'openai_compatible'];
  for (const id of ordre) {
    const c = (Array.isArray(liste) ? liste : []).find((x) => x.id === id);
    if (estConnecte(c)) return c;
  }
  return null;
}

/** Message honnête quand une option demande mieux que le gratuit. */
export function explicationNiveau(id) {
  const f = fournisseur(id);
  if (!f) return 'Fournisseur inconnu.';
  const l = LIBELLES_NIVEAU[f.niveau] || LIBELLES_NIVEAU.payant;
  return `${l.ic} ${l.nom} — ${l.aide}. Apporte : ${(f.apporte || []).join(', ')}.`;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Partie « fenêtre de connexion » (DOM). Les clés restent LOCALES.
 * ────────────────────────────────────────────────────────────────────────── */

export const CLE_STOCKAGE = 'watchtower.comptes.v1';

const CSS = `
#wt-comptes {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 9960;
  width: min(560px, 94vw); max-height: 86vh; overflow: hidden; display: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; color: #e8eaed;
  background: rgba(8,12,18,.97); border: 1px solid rgba(0,212,255,.5); border-radius: 12px;
  box-shadow: 0 24px 70px rgba(0,0,0,.7);
}
#wt-comptes.ouvert { display: block; }
#wt-comptes .t {
  display: flex; align-items: center; gap: 8px; padding: 9px 11px; cursor: move;
  font-size: 9px; letter-spacing: 2px; font-weight: 700; color: #00d4ff;
  background: rgba(0,212,255,.08); border-bottom: 1px solid rgba(0,212,255,.25);
}
#wt-comptes .t button { margin-left: auto; background: none; border: none; color: inherit; font-size: 14px; cursor: pointer; }
#wt-comptes .c { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; max-height: 70vh; overflow-y: auto; }
#wt-comptes .grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 7px; }
#wt-comptes .prov {
  cursor: pointer; text-align: left; padding: 8px; border-radius: 9px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); color: inherit;
  font-family: inherit; font-size: 9.5px; line-height: 1.5;
}
#wt-comptes .prov:hover { border-color: #00d4ff; background: rgba(0,212,255,.08); }
#wt-comptes .prov.actif { border-color: #7ef0c0; background: rgba(126,240,192,.1); }
#wt-comptes .prov .n { font-weight: 700; font-size: 10.5px; }
#wt-comptes .prov .a { opacity: .6; font-size: 8px; display: block; margin-top: 2px; }
#wt-comptes .badge { float: right; font-size: 8px; padding: 1px 5px; border-radius: 999px; border: 1px solid currentColor; }
#wt-comptes form { display: flex; flex-direction: column; gap: 6px; padding: 8px;
  border: 1px dashed rgba(255,255,255,.15); border-radius: 9px; }
#wt-comptes label { display: flex; flex-direction: column; gap: 3px; font-size: 8.5px; opacity: .8; }
#wt-comptes input {
  padding: 6px 8px; font-family: inherit; font-size: 10px; border-radius: 7px;
  background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.15); color: inherit; outline: none;
}
#wt-comptes input:focus { border-color: #00d4ff; }
#wt-comptes .actions { display: flex; gap: 6px; flex-wrap: wrap; }
#wt-comptes .actions button {
  cursor: pointer; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 1px;
  padding: 7px 11px; border-radius: 8px; background: rgba(0,212,255,.12);
  border: 1px solid rgba(0,212,255,.45); color: #00d4ff;
}
#wt-comptes .actions button:hover { background: rgba(0,212,255,.24); }
#wt-comptes .actions button.gris { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.18); color: rgba(232,234,237,.8); }
#wt-comptes .note { font-size: 8px; line-height: 1.7; opacity: .6; }
#wt-comptes .note a { color: #00d4ff; }
#wt-comptes .etat { font-size: 8.5px; padding: 5px 7px; border-radius: 6px; background: rgba(255,255,255,.05); }
`;

/** Stockage tolérant (absent en node, bloqué en navigation privée). */
function stockageParDefaut() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch { /* bloqué */ }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

/** Lit les comptes enregistrés. */
export function lireComptes(stockage = stockageParDefaut()) {
  try {
    const brut = stockage.getItem(CLE_STOCKAGE);
    const liste = brut ? JSON.parse(brut) : [];
    if (!Array.isArray(liste)) return [];
    return liste.map((c) => ({ ...compteVierge(c?.id), ...c }));
  } catch {
    return [];
  }
}

/** Écrit les comptes. */
export function ecrireComptes(liste, stockage = stockageParDefaut()) {
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(Array.isArray(liste) ? liste : []));
    return true;
  } catch {
    return false;
  }
}

/** Ajoute / remplace un compte. */
export function enregistrerCompte(compte, stockage = stockageParDefaut()) {
  const liste = lireComptes(stockage).filter((c) => c.id !== compte?.id);
  const propre = { ...compteVierge(compte?.id), ...compte, maj: Date.now() };
  liste.push(propre);
  ecrireComptes(liste, stockage);
  return liste;
}

/** Supprime un compte. */
export function oublierCompte(id, stockage = stockageParDefaut()) {
  const liste = lireComptes(stockage).filter((c) => c.id !== id);
  ecrireComptes(liste, stockage);
  return liste;
}

/**
 * Fenêtre de connexion de comptes.
 * @param {{stockage?:object, surMessage?:Function, surChangement?:Function, tester?:Function}} [options]
 */
export function initComptes(options = {}) {
  const stockage = options.stockage || stockageParDefaut();
  const surMessage = typeof options.surMessage === 'function' ? options.surMessage : () => {};
  const surChangement = typeof options.surChangement === 'function' ? options.surChangement : () => {};
  const tester = typeof options.tester === 'function' ? options.tester : null;

  let style = document.getElementById('wt-comptes-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-comptes-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const el = document.createElement('div');
  el.id = 'wt-comptes';
  el.innerHTML = `
    <div class="t">🔑 SE CONNECTER — COMPTES & NIVEAUX<button type="button" class="fermer">✕</button></div>
    <div class="c">
      <div class="etat"></div>
      <div class="grille"></div>
      <form>
        <div class="qui" style="font-size:10px;font-weight:700"></div>
        <label>Adresse du service (URL)
          <input class="url" type="text" placeholder="http://localhost:11434" spellcheck="false" autocomplete="off" />
        </label>
        <label>Clé d'API / jeton (optionnel selon le service)
          <input class="cle" type="password" placeholder="sk-… (reste dans ton navigateur)" autocomplete="off" />
        </label>
        <label>Modèle (pour une IA)
          <input class="modele" type="text" placeholder="llama3.2" autocomplete="off" />
        </label>
        <div class="actions">
          <button class="test" type="button">🔌 TESTER</button>
          <button class="ok" type="button">💾 ENREGISTRER</button>
          <button class="gris del" type="button">🗑 OUBLIER</button>
          <button class="gris doc" type="button">📄 DOC DU SERVICE</button>
        </div>
        <div class="note">Les clés sont stockées <b>uniquement dans ce navigateur</b>
        (localStorage) et ne sont envoyées qu'au service choisi. Rien ne part
        chez nous : l'application n'a pas de serveur. 🟢 gratuit · 🔵 compte · 🟣 payant.</div>
      </form>
    </div>`;
  document.body.appendChild(el);

  const grille = el.querySelector('.grille');
  const formEl = el.querySelector('form');
  const chUrl = el.querySelector('.url');
  const chCle = el.querySelector('.cle');
  const chModele = el.querySelector('.modele');
  const quiEl = el.querySelector('.qui');
  const etatEl = el.querySelector('.etat');
  let courantId = 'ollama';

  function rendreEtat() {
    const liste = lireComptes(stockage);
    const r = etatResume(liste);
    const ia = choisirIA(liste);
    let html = '';
    if (r.connectes) {
      html += '🔌 ' + r.connectes + ' service(s) branché(s) — 🟢 ' + r.gratuit
        + ' · 🔵 ' + r.compte + ' · 🟣 ' + r.payant;
      if (ia) {
        const nom = fournisseur(ia.id)?.nom || ia.id;
        html += '<br>🧠 IA du chat : <b>' + nom + '</b> (' + (ia.modele || 'modèle par défaut') + ')';
      } else {
        html += '<br>🧠 IA du chat : <b>mode hors-ligne</b> (aucune IA branchée — le chat répond quand même avec ses commandes locales)';
      }
    } else {
      html = '🔌 Aucun compte branché — tout fonctionne déjà en 🟢 gratuit. Branche un service pour aller plus loin.';
    }
    etatEl.innerHTML = html;
    surChangement(liste);
  }

  function rendreGrille() {
    const liste = lireComptes(stockage);
    grille.innerHTML = '';
    for (const f of FOURNISSEURS) {
      const c = liste.find((x) => x.id === f.id);
      const ok = estConnecte(c);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `prov${ok ? ' actif' : ''}`;
      const l = LIBELLES_NIVEAU[f.niveau] || LIBELLES_NIVEAU.payant;
      b.innerHTML = `<span class="badge" style="color:${f.niveau === 'gratuit' ? '#7ef0c0' : f.niveau === 'compte' ? '#7fb8ff' : '#d7a7ff'}">${l.ic} ${l.nom}</span>`
        + `<span class="n">${f.ic} ${f.nom}</span>`
        + `<span class="a">${(f.apporte || []).slice(0, 2).join(' · ')}</span>`
        + `<span class="a">${ok ? '✅ branché' : '— cliquer pour configurer'}</span>`;
      b.addEventListener('click', () => choisir(f.id));
      grille.appendChild(b);
    }
  }

  function choisir(id) {
    courantId = id;
    const f = fournisseur(id) || FOURNISSEURS[0];
    const c = lireComptes(stockage).find((x) => x.id === id) || compteVierge(id);
    quiEl.textContent = `${f.ic} ${f.nom}`;
    chUrl.value = c.url || f.urlDefaut || '';
    chCle.value = c.cle || '';
    chModele.value = c.modele || f.modeleDefaut || '';
    chUrl.disabled = f.type === 'aucun';
    chCle.disabled = f.type === 'aucun';
    chModele.disabled = f.type === 'aucun';
    surMessage?.(explicationNiveau(id));
    rendreGrille();
  }

  el.querySelector('.fermer').addEventListener('click', () => el.classList.remove('ouvert'));
  el.querySelector('.ok').addEventListener('click', () => {
    const f = fournisseur(courantId);
    const compte = {
      id: courantId,
      url: chUrl.value.trim(),
      cle: chCle.value.trim(),
      modele: chModele.value.trim(),
      actif: true,
      type: f?.type || 'cle',
    };
    const liste = enregistrerCompte(compte, stockage);
    rendreEtat(); rendreGrille();
    surMessage?.(`💾 ${f?.nom || courantId} enregistré dans ce navigateur.`);
    surChangement(liste);
  });
  el.querySelector('.del').addEventListener('click', () => {
    const liste = oublierCompte(courantId, stockage);
    chCle.value = '';
    rendreEtat(); rendreGrille();
    surMessage?.('🗑 Compte oublié.');
    surChangement(liste);
  });
  el.querySelector('.doc').addEventListener('click', () => {
    const f = fournisseur(courantId);
    if (f?.doc) window.open(f.doc, '_blank', 'noopener');
  });
  el.querySelector('.test').addEventListener('click', async () => {
    const f = fournisseur(courantId);
    if (!tester) { surMessage?.('Test indisponible.'); return; }
    surMessage?.(`🔌 Test de ${f?.nom || courantId}…`);
    const ok = await tester({
      id: courantId, url: chUrl.value.trim(), cle: chCle.value.trim(), modele: chModele.value.trim(),
    });
    surMessage?.(ok ? `✅ ${f?.nom || courantId} répond : ${ok}` : `❌ ${f?.nom || courantId} ne répond pas (URL, clé, ou service éteint).`);
  });

  choisir('ollama');
  rendreEtat();

  return {
    element: el,
    ouvrir: () => { el.classList.add('ouvert'); rendreEtat(); rendreGrille(); },
    fermer: () => el.classList.remove('ouvert'),
    basculer: () => (el.classList.contains('ouvert') ? (el.classList.remove('ouvert'), false) : (el.classList.add('ouvert'), rendreEtat(), rendreGrille(), true)),
    comptes: () => lireComptes(stockage),
    /** Compte IA utilisable, sinon null (= mode hors-ligne). */
    ia: () => choisirIA(lireComptes(stockage)),
    etat: () => etatResume(lireComptes(stockage)),
  };
}
