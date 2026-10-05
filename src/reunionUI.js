/**
 * WATCHTOWER — MODE RÉUNION : couche d'interface.
 *
 * S'branche comme une vue de l'INTEL (voir `vuesIntel.js`). Toute la logique
 * métier est dans `reunion.js` ; ici on ne fait que du DOM, des médias et de
 * la mise en page.
 *
 * Captation : 100 % navigateur, aucune clé ni service externe.
 *   - audio / caméra → `getUserMedia` + `MediaRecorder`
 *   - vidéo (écran)  → `getDisplayMedia` + `MediaRecorder`
 *   - « IA »         → `SpeechRecognition` du navigateur (transcription locale)
 * Quand une capacité manque, on le DIT au lieu de proposer un bouton mort.
 */

import {
  TYPES_ENREGISTREMENT, creerReunion, modifierEntete,
  ajouterParticipant, supprimerParticipant,
  ajouterPoint, supprimerPoint, deplacerPoint, modifierPoint, dureePrevue,
  ajouterNote, modifierNote, supprimerNote,
  ajouterEnregistrement, supprimerEnregistrement,
  ajouterVariable, supprimerVariable, controlerVariables,
  diapos, pointsSuggeres, versMarkdown,
  listerReunions, sauvegarderReunion, chargerReunion, supprimerReunion,
} from './reunion.js';
import { NOEUDS, fiabilite, CORRECTIONS } from './data/territoire/grapheThau.js';
import { ouvrirGraphe } from './grapheVue.js';

const ech = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/** Capacités réellement disponibles dans ce navigateur. */
export function capacites() {
  const nav = typeof navigator === 'undefined' ? null : navigator;
  const win = typeof window === 'undefined' ? null : window;
  return {
    micro: Boolean(nav?.mediaDevices?.getUserMedia),
    ecran: Boolean(nav?.mediaDevices?.getDisplayMedia),
    enregistreur: typeof MediaRecorder !== 'undefined',
    dictee: Boolean(win && (win.SpeechRecognition || win.webkitSpeechRecognition)),
  };
}

const CSS = `
#wt-reu { display: flex; flex-direction: column; gap: 10px; }
#wt-reu .reu-barre { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
#wt-reu .reu-carte {
  border: 1px solid rgba(0,212,255,0.22); border-radius: 8px;
  background: rgba(6,14,22,0.55); padding: 10px 12px;
}
#wt-reu .reu-carte > h4 {
  margin: 0 0 8px; font-size: 9px; letter-spacing: 2px; color: #00d4ff;
  font-family: var(--font-mono, monospace); font-weight: 800;
}
#wt-reu input[type=text], #wt-reu input[type=datetime-local], #wt-reu textarea, #wt-reu select {
  width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.42);
  border: 1px solid rgba(0,212,255,0.28); border-radius: 6px; color: #e8eaed;
  font: inherit; font-size: 12px; padding: 7px 9px;
}
#wt-reu textarea { min-height: 62px; resize: vertical; line-height: 1.45; }
#wt-reu input:focus, #wt-reu textarea:focus, #wt-reu select:focus { outline: none; border-color: #00d4ff; }
#wt-reu .reu-champ { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
#wt-reu .reu-champ > label { font-size: 8.5px; letter-spacing: 1.4px; color: rgba(232,234,237,0.62); }
#wt-reu .reu-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
#wt-reu button {
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.34);
  color: #e8eaed; border-radius: 6px; padding: 7px 11px; font-size: 11px;
  cursor: pointer; min-height: 30px; font-family: inherit;
}
#wt-reu button:hover { background: rgba(0,212,255,0.22); border-color: #00d4ff; }
#wt-reu button.reu-danger { border-color: rgba(255,96,96,0.5); color: #ff9c9c; }
#wt-reu button.reu-danger:hover { background: rgba(255,80,80,0.2); border-color: #ff6060; }
#wt-reu button.reu-actif { background: rgba(255,72,72,0.25); border-color: #ff4848; color: #ffd7d7; }
#wt-reu ul.reu-liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
#wt-reu ul.reu-liste > li {
  display: flex; gap: 7px; align-items: flex-start; font-size: 12px; line-height: 1.4;
  background: rgba(0,0,0,0.26); border-radius: 6px; padding: 6px 8px;
}
#wt-reu ul.reu-liste .reu-corps { flex: 1; min-width: 0; word-break: break-word; }
#wt-reu ul.reu-liste button { padding: 2px 7px; min-height: 24px; font-size: 11px; flex: none; }
#wt-reu .reu-eti {
  font-size: 8px; letter-spacing: 1px; padding: 1px 5px; border-radius: 4px;
  border: 1px solid rgba(0,212,255,0.3); color: #9fe9ff; flex: none; text-transform: uppercase;
}
#wt-reu .reu-eti.t-décision { border-color: #6dffa8; color: #6dffa8; }
#wt-reu .reu-eti.t-action { border-color: #ffd36d; color: #ffd36d; }
#wt-reu .reu-eti.t-question { border-color: #ff9c9c; color: #ff9c9c; }
#wt-reu .reu-vide { font-size: 11px; color: rgba(232,234,237,0.45); font-style: italic; }
#wt-reu .reu-aide { font-size: 10.5px; color: rgba(232,234,237,0.6); line-height: 1.5; margin-top: 6px; }
#wt-reu .reu-horo { font-size: 9px; color: rgba(232,234,237,0.42); font-family: var(--font-mono, monospace); flex: none; }
#wt-reu .reu-alerte {
  font-size: 10.5px; color: #ffd36d; border: 1px solid rgba(255,211,109,0.35);
  background: rgba(255,211,109,0.08); border-radius: 6px; padding: 6px 8px; line-height: 1.45;
}
`;

const CSS_DIAPO = `
#wt-diapo {
  position: fixed; inset: 0; z-index: var(--wt-z-cadre, 2000); background: #05090e;
  display: flex; flex-direction: column; color: #e8eaed;
  font-family: var(--font-sans, system-ui, sans-serif);
}
#wt-diapo .dp-scene { flex: 1; overflow-y: auto; padding: 6vh 8vw; }
#wt-diapo h1 { font-size: clamp(28px, 5vw, 58px); margin: 0 0 18px; color: #fff; line-height: 1.1; }
#wt-diapo h2 { font-size: clamp(22px, 3.4vw, 40px); margin: 0 0 16px; color: #00d4ff; line-height: 1.15; }
#wt-diapo p.dp-obj { font-size: clamp(15px, 1.8vw, 22px); color: rgba(232,234,237,0.82); line-height: 1.5; max-width: 60ch; }
#wt-diapo ul { font-size: clamp(14px, 1.6vw, 20px); line-height: 1.75; max-width: 70ch; }
#wt-diapo .dp-meta { font-size: 13px; color: rgba(232,234,237,0.55); margin-bottom: 26px; letter-spacing: 1px; }
#wt-diapo .dp-flou { color: #ffd36d; }
#wt-diapo .dp-pied {
  display: flex; align-items: center; gap: 12px; padding: 12px 20px;
  border-top: 1px solid rgba(0,212,255,0.22); background: rgba(0,0,0,0.5);
}
#wt-diapo .dp-pied button {
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4);
  color: #e8eaed; border-radius: 6px; padding: 9px 16px; font-size: 14px; cursor: pointer; min-height: 40px;
}
#wt-diapo .dp-pied button:hover { background: rgba(0,212,255,0.26); }
#wt-diapo .dp-rang { margin-left: auto; font-size: 13px; color: rgba(232,234,237,0.6); font-family: var(--font-mono, monospace); }
`;

/** Injecte une feuille de style une seule fois. */
function styleUnique(id, texte) {
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = texte;
  document.head.appendChild(s);
}

/** Propose le téléchargement d'un contenu produit localement. */
function telecharger(nom, contenu, type = 'text/plain;charset=utf-8') {
  const blob = contenu instanceof Blob ? contenu : new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ── 📽 PRÉSENTATION PLEIN ÉCRAN ──────────────────────────────────────────

/**
 * Ouvre le mode présentation. Flèches ← → et Échap pour sortir.
 * @param {object} reunion
 */
export function ouvrirPresentation(reunion) {
  styleUnique('wt-diapo-css', CSS_DIAPO);
  document.getElementById('wt-diapo')?.remove();
  const jeu = diapos(reunion);
  if (!jeu.length) return null;

  let i = 0;
  const hote = document.createElement('div');
  hote.id = 'wt-diapo';
  hote.innerHTML = `
    <div class="dp-scene"></div>
    <div class="dp-pied">
      <button type="button" data-a="prec">← Précédent</button>
      <button type="button" data-a="suiv">Suivant →</button>
      <button type="button" data-a="fermer">✕ Quitter la présentation</button>
      <span class="dp-rang"></span>
    </div>`;
  document.body.appendChild(hote);
  const scene = hote.querySelector('.dp-scene');
  const rang = hote.querySelector('.dp-rang');

  function peindre() {
    const d = jeu[i];
    if (d.type === 'titre') {
      scene.innerHTML = `
        <h1>${ech(d.titre)}</h1>
        <div class="dp-meta">${ech(d.date)}${d.lieu ? ` · ${ech(d.lieu)}` : ''}</div>
        ${d.objectif ? `<p class="dp-obj">${ech(d.objectif)}</p>` : ''}
        ${d.participants.length ? `<h2 style="margin-top:32px">Participants</h2><ul>${d.participants.map((p) => `<li>${ech(p)}</li>`).join('')}</ul>` : ''}
        ${d.points.length ? `<h2 style="margin-top:32px">Ordre du jour</h2><ol>${d.points.map((p) => `<li>${ech(p)}</li>`).join('')}</ol>` : ''}`;
    } else if (d.type === 'cadrage') {
      const col = (titre, sous, liste, role) => `
        <h2>${titre}</h2>
        <p class="dp-obj" style="font-size:16px;opacity:.75">${sous}</p>
        <ul>${liste.map((x) => `<li><b>${ech(x.nom)}</b>${x.unite ? ` (${ech(x.unite)})` : ''}
          ${x.mesure ? `<br><span style="opacity:.7;font-size:.85em">${role} : ${ech(x.mesure)}</span>` : ''}
          ${x.cible ? `<br><span style="opacity:.7;font-size:.85em">cible : ${ech(x.cible)}</span>` : ''}</li>`).join('')
          || '<li style="opacity:.5">Aucune</li>'}</ul>`;
      scene.innerHTML = `
        <h1>${ech(d.titre)}</h1>
        ${col('Variables indépendantes', 'Ce que nous faisons varier', d.independantes, 'levier')}
        <div style="height:26px"></div>
        ${col('Variables dépendantes', 'Ce que nous mesurerons pour juger', d.dependantes, 'mesure')}
        ${d.avis.length ? `<p class="dp-obj dp-flou" style="margin-top:26px;font-size:16px">⚠️ ${d.avis.map(ech).join(' · ')}</p>` : ''}`;
    } else {
      const attrs = d.attributs.map((at) => {
        const marque = at.fiable ? '' : '<span class="dp-flou">~ </span>';
        const suffixe = at.fiable ? '' : ' <span class="dp-flou">(à vérifier)</span>';
        return `<li><b>${ech(at.libelle)}</b> : ${marque}${ech(at.valeur)}${suffixe}</li>`;
      }).join('');
      scene.innerHTML = `
        <div class="dp-meta">POINT ${d.rang} · ${d.minutes} MIN</div>
        <h1>${ech(d.titre)}</h1>
        ${d.resume ? `<p class="dp-obj">${ech(d.resume)}</p>` : ''}
        ${attrs ? `<ul style="margin-top:26px">${attrs}</ul>` : ''}
        ${d.notes.length ? `<h2 style="margin-top:30px">Notes</h2><ul>${d.notes.map((n) => `<li>${ech(n.texte)}</li>`).join('')}</ul>` : ''}`;
    }
    rang.textContent = `${i + 1} / ${jeu.length}`;
  }

  const aller = (pas) => { i = Math.min(jeu.length - 1, Math.max(0, i + pas)); peindre(); };
  const fermer = () => {
    document.removeEventListener('keydown', clavier);
    hote.remove();
  };
  function clavier(e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); aller(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); aller(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); fermer(); }
  }
  hote.addEventListener('click', (e) => {
    const a = e.target?.dataset?.a;
    if (a === 'prec') aller(-1);
    else if (a === 'suiv') aller(1);
    else if (a === 'fermer') fermer();
  });
  document.addEventListener('keydown', clavier);
  peindre();
  return { fermer, aller };
}

// ── 🎙 CAPTATION ─────────────────────────────────────────────────────────

/**
 * Démarre une captation média et renvoie un objet pilotable.
 * @param {'audio'|'video'|'camera'} type
 * @returns {Promise<{arreter:Function}>}
 */
async function capter(type, surFin) {
  const cap = capacites();
  if (!cap.enregistreur) throw new Error("Ce navigateur ne sait pas enregistrer (MediaRecorder absent).");
  let flux;
  if (type === 'video') {
    if (!cap.ecran) throw new Error("Le partage d'écran n'est pas disponible ici.");
    flux = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  } else if (type === 'camera') {
    if (!cap.micro) throw new Error("Aucun accès caméra/micro.");
    flux = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } else {
    if (!cap.micro) throw new Error("Aucun accès micro.");
    flux = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  const morceaux = [];
  const rec = new MediaRecorder(flux);
  const debut = Date.now();
  rec.ondataavailable = (e) => { if (e.data?.size) morceaux.push(e.data); };
  rec.onstop = () => {
    for (const p of flux.getTracks()) p.stop();
    const blob = new Blob(morceaux, { type: rec.mimeType || (type === 'audio' ? 'audio/webm' : 'video/webm') });
    surFin?.(blob, (Date.now() - debut) / 1000);
  };
  rec.start();
  return { arreter: () => { if (rec.state !== 'inactive') rec.stop(); } };
}

/**
 * Démarre la transcription locale du navigateur (aucune API, aucune clé).
 * @returns {{arreter:Function}}
 */
function dicter(surTexte) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) throw new Error("La dictée n'est pas supportée par ce navigateur (essayez Chrome ou Edge).");
  const r = new Rec();
  r.lang = 'fr-FR';
  r.continue = true;
  r.continuous = true;
  r.interimResults = false;
  let vivant = true;
  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      if (e.results[i].isFinal) surTexte(String(e.results[i][0].transcript).trim());
    }
  };
  // le moteur se coupe tout seul après un silence : on le relance tant qu'on veut écouter
  r.onend = () => { if (vivant) { try { r.start(); } catch { /* déjà relancé */ } } };
  r.start();
  return { arreter: () => { vivant = false; try { r.stop(); } catch { /* déjà arrêté */ } } };
}

// ── 🧭 VUE PRINCIPALE ────────────────────────────────────────────────────

/** Réunion couramment ouverte (une seule à la fois dans l'INTEL). */
let courante = null;
/** Captation en cours, s'il y en a une. */
let captation = null;

/** Enregistre et redessine. */
function persister(redessiner) {
  if (courante) sauvegarderReunion(courante);
  redessiner?.();
}

/**
 * Rendu de la vue RÉUNION. Signature compatible avec `RENDUS` de `vuesIntel.js`.
 * @param {HTMLElement} c conteneur `.wti-vue`
 */
export async function rendreReunion(c) {
  if (!c) return;
  styleUnique('wt-reu-css', CSS);
  const zone = c.querySelector('.v-contenu') || c;
  const barre = c.querySelector('.v-actions');

  const dessiner = () => peindre(zone, barre, dessiner);
  dessiner();
}

/** Construit la barre d'actions du haut. */
function peindreBarre(barre, redessiner) {
  if (!barre) return;
  barre.innerHTML = '';
  const bouton = (nom, surClic, classe = '') => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = nom;
    if (classe) b.className = classe;
    b.addEventListener('click', surClic);
    barre.appendChild(b);
    return b;
  };

  bouton('🕸 GRAPHE DE CONNAISSANCES', () => ouvrirGraphe());

  bouton('➕ NOUVELLE RÉUNION', () => {
    courante = creerReunion({ titre: `Réunion du ${new Date().toLocaleDateString('fr-FR')}` });
    persister(redessiner);
  });

  const liste = listerReunions();
  if (liste.length) {
    const sel = document.createElement('select');
    sel.style.maxWidth = '210px';
    sel.innerHTML = `<option value="">— ouvrir une réunion (${liste.length}) —</option>`
      + liste.map((r) => `<option value="${ech(r.id)}"${r.id === courante?.id ? ' selected' : ''}>${ech(r.titre)}</option>`).join('');
    sel.addEventListener('change', () => {
      courante = sel.value ? chargerReunion(sel.value) : null;
      redessiner();
    });
    barre.appendChild(sel);
  }

  if (courante) {
    bouton('📽 PRÉSENTER', () => ouvrirPresentation(courante));
    bouton('📤 COMPTE RENDU', () => {
      const nom = `${courante.titre.replace(/[^\w\-àâäéèêëîïôöùûüç ]+/gi, '').trim() || 'reunion'}.md`;
      telecharger(nom, versMarkdown(courante), 'text/markdown;charset=utf-8');
    });
    bouton('🗑 SUPPRIMER', () => {
      if (!confirm(`Supprimer définitivement « ${courante.titre} » ?`)) return;
      supprimerReunion(courante.id);
      courante = null;
      redessiner();
    }, 'reu-danger');
  }
}

/** Dessine tout le corps de la vue. */
function peindre(zone, barre, redessiner) {
  peindreBarre(barre, redessiner);

  if (!courante) {
    const f = fiabilite();
    zone.innerHTML = `
      <div id="wt-reu">
        <div class="reu-carte">
          <h4>🏛 MODE RÉUNION</h4>
          <div class="reu-aide">
            Prépare et tiens une réunion de mairie sans quitter l'application :
            <b>titre, objectif, participants, ordre du jour, notes, captation et présentation</b>.
            L'ordre du jour puise dans le <b>graphe de territoire de Sète Agglopôle</b>
            (${NOEUDS.length} fiches : communes, lagune, port, PPA, ZAN, SCOT, histoire…),
            entièrement <b>hors ligne</b>.
          </div>
          <div class="reu-aide">
            Tout est enregistré <b>dans ce navigateur uniquement</b> — rien n'est envoyé nulle part.
          </div>
          <div class="reu-carte" style="margin-top:10px;border-color:rgba(255,211,109,0.35)">
            <h4 style="color:#ffd36d">⚠️ ${CORRECTIONS.length} CHIFFRES CORRIGÉS APRÈS VÉRIFICATION</h4>
            ${CORRECTIONS.map((c) => `
              <div style="margin-bottom:9px;font-size:11.5px;line-height:1.5">
                <b>${c.sujet}</b><br>
                <span style="color:#ff9c9c">document fourni : ${c.fourni}</span><br>
                <span style="color:#6dffa8">vérifié : ${c.corrige}</span><br>
                <span style="opacity:.65">${c.lecture}</span><br>
                <span style="opacity:.5;font-size:10px">source : ${c.source}</span>
              </div>`).join('')}
          </div>
          <div class="reu-alerte" style="margin-top:8px">
            ${f.aVerifier} des ${f.total} valeurs du graphe proviennent du document fourni et
            <b>n'ont pas été recoupées</b> sur source officielle. Elles s'affichent avec « ~ »
            et la mention « à vérifier », en réunion comme dans le compte rendu.
          </div>
        </div>
      </div>`;
    return;
  }

  const r = courante;
  const cap = capacites();
  const manques = [];
  if (!cap.enregistreur) manques.push('enregistrement audio/vidéo');
  if (!cap.ecran) manques.push("partage d'écran");
  if (!cap.dictee) manques.push('transcription automatique');

  zone.innerHTML = `
    <div id="wt-reu">
      <div class="reu-carte">
        <h4>📋 EN-TÊTE</h4>
        <div class="reu-champ"><label>TITRE</label><input type="text" data-e="titre" value="${ech(r.titre)}"></div>
        <div class="reu-champ"><label>OBJECTIF</label><textarea data-e="objectif" placeholder="Ce que la réunion doit produire…">${ech(r.objectif)}</textarea></div>
        <div class="reu-duo">
          <div class="reu-champ"><label>DATE</label><input type="text" data-e="date" value="${ech(r.date)}"></div>
          <div class="reu-champ"><label>LIEU</label><input type="text" data-e="lieu" value="${ech(r.lieu)}" placeholder="Salle du conseil…"></div>
        </div>
        <div class="reu-duo">
          <div class="reu-champ"><label>LIEN VISIOCONFÉRENCE</label><input type="text" data-e="visio" value="${ech(r.visio)}" placeholder="https://…"></div>
          <div class="reu-champ"><label>STATUT</label><select data-e="statut">
            ${['préparation', 'en cours', 'close'].map((s) => `<option${s === r.statut ? ' selected' : ''}>${s}</option>`).join('')}
          </select></div>
        </div>
        ${r.visio ? `<button type="button" data-a="visio">📹 REJOINDRE LA VISIO</button>` : ''}
      </div>

      <div class="reu-carte">
        <h4>👥 PARTICIPANTS (${r.participants.length})</h4>
        <ul class="reu-liste">
          ${r.participants.map((p) => `
            <li><span class="reu-corps"><b>${ech(p.nom)}</b>${p.role ? ` — ${ech(p.role)}` : ''}</span>
            <span class="reu-eti">${ech(p.presence)}</span>
            <button type="button" class="reu-danger" data-sup-par="${p.id}" title="Retirer">✕</button></li>`).join('')
          || '<li class="reu-vide">Aucun participant.</li>'}
        </ul>
        <div class="reu-duo" style="margin-top:8px">
          <input type="text" data-n="par-nom" placeholder="Nom">
          <input type="text" data-n="par-role" placeholder="Fonction">
        </div>
        <button type="button" data-a="add-par" style="margin-top:6px">➕ AJOUTER</button>
      </div>
    </div>`;

  const hote = zone.querySelector('#wt-reu');
  hote.appendChild(carteVariables(r));
  hote.appendChild(carteOrdreDuJour(r));
  hote.appendChild(carteNotes(r));
  hote.appendChild(carteCaptation(r, cap, manques));
  brancher(hote, r, redessiner);
}

/**
 * Carte « variables » : ce que la réunion fait varier (VI) et ce qu'elle
 * mesurera pour juger (VD). Sans ce cadrage, une décision n'est pas évaluable.
 */
function carteVariables(r) {
  const d = document.createElement('div');
  d.className = 'reu-carte';
  const v = r.variables || { independantes: [], dependantes: [] };
  const avis = controlerVariables(r);
  const bloc = (titre, role, liste, aide) => `
    <div style="margin-top:8px">
      <label style="font-size:8.5px;letter-spacing:1.4px;color:rgba(232,234,237,0.62)">${titre}</label>
      <div class="reu-aide" style="margin:2px 0 6px">${aide}</div>
      <ul class="reu-liste">
        ${liste.map((x) => `
          <li>
            <span class="reu-eti">${role === 'independante' ? 'VI' : 'VD'}</span>
            <span class="reu-corps"><b>${ech(x.nom)}</b>${x.unite ? ` <i style="opacity:.7">(${ech(x.unite)})</i>` : ''}
            ${x.mesure ? `<br><span style="opacity:.75">${role === 'independante' ? 'levier' : 'mesure'} : ${ech(x.mesure)}</span>` : ''}
            ${x.cible ? `<br><span style="opacity:.75">cible : ${ech(x.cible)}</span>` : ''}</span>
            <button type="button" class="reu-danger" data-sup-var="${x.id}" title="Supprimer">✕</button>
          </li>`).join('') || `<li class="reu-vide">Aucune.</li>`}
      </ul>
      <div class="reu-duo" style="margin-top:6px">
        <input type="text" data-n="${role}-nom" placeholder="Nom de la variable">
        <input type="text" data-n="${role}-unite" placeholder="Unité (ha, €, hab.…)">
      </div>
      <div class="reu-duo" style="margin-top:6px">
        <input type="text" data-n="${role}-mesure" placeholder="${role === 'independante' ? 'Comment on l\'actionne' : 'Indicateur et source'}">
        <input type="text" data-n="${role}-cible" placeholder="Cible visée">
      </div>
      <button type="button" data-a="add-${role}" style="margin-top:6px">➕ AJOUTER</button>
    </div>`;
  d.innerHTML = `
    <h4>🔬 CADRAGE — VARIABLES</h4>
    ${avis.length ? `<div class="reu-alerte">${avis.map((m) => `• ${ech(m)}`).join('<br>')}</div>` : ''}
    ${bloc('VARIABLES INDÉPENDANTES', 'independante', v.independantes, 'Ce que la réunion <b>fait varier</b> : le levier sur lequel elle décide d\'agir.')}
    ${bloc('VARIABLES DÉPENDANTES', 'dependante', v.dependantes, 'Ce qu\'on <b>mesurera</b> ensuite pour savoir si la décision a produit un effet.')}`;
  return d;
}

/** Carte « ordre du jour » : points, réordonnancement, suggestions, fiches du graphe. */
function carteOrdreDuJour(r) {
  const d = document.createElement('div');
  d.className = 'reu-carte';
  const suggestions = pointsSuggeres();
  d.innerHTML = `
    <h4>🗂 ORDRE DU JOUR (${r.ordreDuJour.length} points · ${dureePrevue(r)} min)</h4>
    <ul class="reu-liste">
      ${r.ordreDuJour.map((p, i) => `
        <li>
          <span class="reu-horo">${String(i + 1).padStart(2, '0')}</span>
          <span class="reu-corps" style="${p.traite ? 'opacity:.55;text-decoration:line-through' : ''}">${ech(p.intitule)}</span>
          <span class="reu-eti">${p.minutes} min</span>
          <button type="button" data-pt-traite="${p.id}" title="Marquer traité">${p.traite ? '↺' : '✓'}</button>
          <button type="button" data-pt-haut="${p.id}" title="Monter">▲</button>
          <button type="button" data-pt-bas="${p.id}" title="Descendre">▼</button>
          <button type="button" class="reu-danger" data-sup-pt="${p.id}" title="Supprimer">✕</button>
        </li>`).join('') || '<li class="reu-vide">Ordre du jour vide.</li>'}
    </ul>
    <div class="reu-duo" style="margin-top:8px">
      <input type="text" data-n="pt-nom" placeholder="Intitulé du point">
      <input type="text" data-n="pt-min" placeholder="Durée (min)" value="10">
    </div>
    <button type="button" data-a="add-pt" style="margin-top:6px">➕ AJOUTER UN POINT</button>
    <div class="reu-champ" style="margin-top:10px">
      <label>AJOUTER UNE FICHE DU TERRITOIRE (elle devient une diapositive)</label>
      <select data-n="pt-noeud">
        <option value="">— choisir une fiche —</option>
        ${NOEUDS.map((n) => `<option value="${ech(n.cle)}">${ech(n.nom)}</option>`).join('')}
      </select>
    </div>
    <div class="reu-champ">
      <label>OU UNE QUESTION OUVERTE DU DOSSIER</label>
      <select data-n="pt-question">
        <option value="">— choisir une question —</option>
        ${suggestions.map((s, i) => `<option value="${i}">${ech(s.intitule)}</option>`).join('')}
      </select>
    </div>`;
  return d;
}

/** Carte « notes » : saisie, typage, modification, suppression. */
function carteNotes(r) {
  const d = document.createElement('div');
  d.className = 'reu-carte';
  const h = (n) => String(n.horodatage || '').slice(11, 16);
  d.innerHTML = `
    <h4>📝 NOTES (${r.notes.length})</h4>
    <div class="reu-champ">
      <textarea data-n="note-texte" placeholder="Note, décision, action… (Ctrl+Entrée pour valider)"></textarea>
    </div>
    <div class="reu-barre">
      <select data-n="note-type" style="max-width:150px">
        ${['note', 'décision', 'action', 'question'].map((t) => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <select data-n="note-point" style="max-width:220px">
        <option value="">— sans rattachement —</option>
        ${r.ordreDuJour.map((p) => `<option value="${p.id}">${ech(p.intitule)}</option>`).join('')}
      </select>
      <button type="button" data-a="add-note">➕ AJOUTER</button>
    </div>
    <ul class="reu-liste" style="margin-top:9px">
      ${[...r.notes].reverse().map((n) => `
        <li>
          <span class="reu-horo">${h(n)}</span>
          <span class="reu-eti t-${n.type}">${n.type}</span>
          <span class="reu-corps">${ech(n.texte)}</span>
          <button type="button" data-mod-note="${n.id}" title="Modifier">✎</button>
          <button type="button" class="reu-danger" data-sup-note="${n.id}" title="Supprimer">✕</button>
        </li>`).join('') || '<li class="reu-vide">Aucune note.</li>'}
    </ul>`;
  return d;
}

/** Carte « captation » : audio, vidéo, caméra, dictée, et ce qui manque. */
function carteCaptation(r, cap, manques) {
  const d = document.createElement('div');
  d.className = 'reu-carte';
  const dispo = {
    texte: true,
    audio: cap.micro && cap.enregistreur,
    video: cap.ecran && cap.enregistreur,
    camera: cap.micro && cap.enregistreur,
    ia: cap.dictee,
  };
  d.innerHTML = `
    <h4>🎙 ENREGISTRER (${r.enregistrements.length})</h4>
    <div class="reu-barre">
      ${TYPES_ENREGISTREMENT.map((t) => `
        <button type="button" data-cap="${t.cle}" title="${ech(t.detail)}"${dispo[t.cle] ? '' : ' disabled style="opacity:.4;cursor:not-allowed"'}>
          ${t.ic} ${t.nom}
        </button>`).join('')}
      <span data-r="etat" class="reu-horo"></span>
    </div>
    ${manques.length ? `<div class="reu-alerte" style="margin-top:8px">
      Ce navigateur ne propose pas : <b>${manques.map(ech).join(', ')}</b>.
      Les boutons correspondants sont désactivés plutôt que de faire semblant.
    </div>` : ''}
    <div class="reu-aide">
      Les médias sont capturés <b>localement</b> puis <b>téléchargés sur votre poste</b> :
      seule leur fiche reste dans l'application, pour ne pas saturer le stockage du navigateur.
      La transcription « IA » utilise le moteur de dictée intégré au navigateur — <b>aucune clé, aucun service tiers</b>.
    </div>
    <ul class="reu-liste" style="margin-top:9px">
      ${r.enregistrements.map((e) => {
        const t = TYPES_ENREGISTREMENT.find((x) => x.cle === e.type);
        return `<li>
          <span class="reu-eti">${t?.ic || '•'} ${ech(t?.nom || e.type)}</span>
          <span class="reu-corps">${ech(e.nomFichier || '(sans fichier)')}${e.duree ? ` · ${Math.round(e.duree)} s` : ''}${e.transcription ? `<br><i style="opacity:.75">${ech(e.transcription.slice(0, 400))}</i>` : ''}</span>
          <button type="button" class="reu-danger" data-sup-enr="${e.id}" title="Supprimer">✕</button>
        </li>`;
      }).join('') || '<li class="reu-vide">Aucune captation.</li>'}
    </ul>`;
  return d;
}

/** Branche tous les écouteurs de la vue sur le conteneur fraîchement peint. */
function brancher(hote, r, redessiner) {
  const val = (sel) => hote.querySelector(`[data-n="${sel}"]`);
  const etat = hote.querySelector('[data-r="etat"]');

  // en-tête : on enregistre à la volée, sans redessiner (on perdrait le curseur)
  for (const champ of hote.querySelectorAll('[data-e]')) {
    champ.addEventListener('change', () => {
      modifierEntete(r, { [champ.dataset.e]: champ.value });
      sauvegarderReunion(r);
      if (champ.dataset.e === 'visio' || champ.dataset.e === 'titre') redessiner();
    });
  }

  hote.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const a = t.dataset.a;

    if (a === 'visio' && r.visio) { window.open(r.visio, '_blank', 'noopener'); return; }

    if (a === 'add-par') {
      ajouterParticipant(r, { nom: val('par-nom')?.value, role: val('par-role')?.value });
      persister(redessiner); return;
    }
    if (t.dataset.supPar) { supprimerParticipant(r, t.dataset.supPar); persister(redessiner); return; }

    if (a === 'add-independante' || a === 'add-dependante') {
      const role = a === 'add-independante' ? 'independante' : 'dependante';
      ajouterVariable(r, role, {
        nom: val(`${role}-nom`)?.value,
        unite: val(`${role}-unite`)?.value,
        mesure: val(`${role}-mesure`)?.value,
        cible: val(`${role}-cible`)?.value,
      });
      persister(redessiner); return;
    }
    if (t.dataset.supVar) { supprimerVariable(r, t.dataset.supVar); persister(redessiner); return; }

    if (a === 'add-pt') {
      ajouterPoint(r, { intitule: val('pt-nom')?.value, minutes: val('pt-min')?.value });
      persister(redessiner); return;
    }
    if (t.dataset.supPt) { supprimerPoint(r, t.dataset.supPt); persister(redessiner); return; }
    if (t.dataset.ptHaut) { deplacerPoint(r, t.dataset.ptHaut, -1); persister(redessiner); return; }
    if (t.dataset.ptBas) { deplacerPoint(r, t.dataset.ptBas, 1); persister(redessiner); return; }
    if (t.dataset.ptTraite) {
      const p = r.ordreDuJour.find((x) => x.id === t.dataset.ptTraite);
      modifierPoint(r, t.dataset.ptTraite, { traite: !p?.traite });
      persister(redessiner); return;
    }

    if (a === 'add-note') {
      ajouterNote(r, {
        texte: val('note-texte')?.value,
        type: val('note-type')?.value,
        idPoint: val('note-point')?.value || null,
      });
      persister(redessiner); return;
    }
    if (t.dataset.supNote) { supprimerNote(r, t.dataset.supNote); persister(redessiner); return; }
    if (t.dataset.modNote) {
      const n = r.notes.find((x) => x.id === t.dataset.modNote);
      const neuf = prompt('Modifier la note :', n?.texte || '');
      if (neuf !== null) { modifierNote(r, t.dataset.modNote, { texte: neuf }); persister(redessiner); }
      return;
    }
    if (t.dataset.supEnr) { supprimerEnregistrement(r, t.dataset.supEnr); persister(redessiner); return; }

    if (t.dataset.cap) { await lancerCaptation(t, t.dataset.cap, r, redessiner, etat); }
  });

  // listes déroulantes qui ajoutent un point
  val('pt-noeud')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    ajouterPoint(r, { cleNoeud: e.target.value });
    persister(redessiner);
  });
  val('pt-question')?.addEventListener('change', (e) => {
    if (e.target.value === '') return;
    const s = pointsSuggeres()[Number(e.target.value)];
    if (s) ajouterPoint(r, { intitule: s.intitule, cleNoeud: s.noeuds?.[0] || null });
    persister(redessiner);
  });

  // Ctrl+Entrée dans la zone de note
  val('note-texte')?.addEventListener('keydown', (e) => {
    if (!(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) return;
    e.preventDefault();
    ajouterNote(r, { texte: e.target.value, type: val('note-type')?.value, idPoint: val('note-point')?.value || null });
    persister(redessiner);
  });
}

/** Démarre ou arrête une captation selon l'état courant du bouton. */
async function lancerCaptation(bouton, type, r, redessiner, etat) {
  // deuxième clic sur le bouton actif → on arrête
  if (captation && captation.type === type) {
    captation.arreter();
    captation = null;
    bouton.classList.remove('reu-actif');
    if (etat) etat.textContent = '';
    return;
  }
  if (captation) { captation.arreter(); captation = null; }

  if (type === 'texte') {
    const texte = prompt('Compte rendu ou verbatim à joindre :', '');
    if (texte?.trim()) { ajouterEnregistrement(r, { type: 'texte', transcription: texte }); persister(redessiner); }
    return;
  }

  try {
    if (type === 'ia') {
      let tampon = '';
      const d = dicter((phrase) => {
        tampon += (tampon ? ' ' : '') + phrase;
        if (etat) etat.textContent = `🔴 dictée — ${tampon.length} caractères`;
      });
      captation = {
        type,
        arreter: () => {
          d.arreter();
          if (tampon.trim()) {
            ajouterEnregistrement(r, { type: 'ia', transcription: tampon });
            // la dictée alimente aussi les notes : c'est là qu'elle sert vraiment
            ajouterNote(r, { texte: tampon, type: 'note' });
          }
          persister(redessiner);
        },
      };
    } else {
      const c = await capter(type, (blob, duree) => {
        const ext = (blob.type.split('/')[1] || 'webm').split(';')[0];
        const nom = `${r.titre.replace(/[^\w\-]+/g, '_')}-${type}-${Date.now()}.${ext}`;
        telecharger(nom, blob);
        ajouterEnregistrement(r, { type, nomFichier: nom, duree });
        persister(redessiner);
      });
      captation = { type, arreter: c.arreter };
    }
    bouton.classList.add('reu-actif');
    if (etat) etat.textContent = '🔴 en cours — recliquez pour arrêter';
  } catch (err) {
    captation = null;
    if (etat) etat.textContent = '';
    alert(`Captation impossible : ${err?.message || err}`);
  }
}

/** Réinitialise l'état interne (utile aux tests). */
export function _reinitialiser() {
  courante = null;
  if (captation) { try { captation.arreter(); } catch { /* ignoré */ } }
  captation = null;
}
