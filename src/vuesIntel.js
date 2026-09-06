/**
 * WATCHTOWER — VUES DE L'INTEL (le cœur « expert » de l'application).
 *
 * L'INTEL n'est plus un tableau de bord décoratif : c'est le poste de
 * l'utilisateur avancé. Chaque vue regarde le territoire par une LENTILLE
 * différente, avec ses propres données, ses propres outils et son propre
 * bandeau d'informations défilant (façon Bloomberg) :
 *
 *   🧭 CONTEXTE     — vue d'ensemble (l'existant)
 *   🛰 JUMEAU AR    — bâti 3D + cadastre + entités + couche AR : le jumeau
 *   🏛 COMMUNAL     — la commune : identité, chiffres, cadrans, équipements
 *   🏠 INDIVIDUEL   — la parcelle / le bâtiment : emprise, surface, fiche
 *   🗳 POLITIQUE    — gouvernance : élus, documents officiels, registres
 *   💼 ÉCONOMIQUE   — entreprises autour du point, effectifs, liens légaux
 *   🏭 PRODUCTION   — sites, réseaux, installations classées, risques
 *   🧠 PROFIL       — profil utilisateur (l'existant)
 *
 * Règle : chaque donnée affichée est sourcée (registre `tracabilite.js`) et
 * cliquable ; quand une source ne répond pas, on le DIT au lieu d'inventer.
 */

import { filComplet, filEconomie, filtrerParCategorie, tickerHtml } from './filInfo.js';
import { htmlSources, liensVerification } from './tracabilite.js';
import { resumeGeorisques, urlGeorisques } from './empreinte.js';

/** Vues de l'INTEL (les deux premières et la dernière existent déjà). */
export const VUES_INTEL = Object.freeze([
  { cle: 'jumeau', ic: '🛰', nom: 'JUMEAU AR', sous: 'bâti 3D · cadastre · AR', existante: false },
  { cle: 'communal', ic: '🏛', nom: 'COMMUNAL', sous: 'commune · cadrans · chiffres', existante: false },
  { cle: 'individuel', ic: '🏠', nom: 'INDIVIDUEL', sous: 'parcelle · bâtiment', existante: false },
  { cle: 'politique', ic: '🗳', nom: 'POLITIQUE', sous: 'élus · documents', existante: false },
  { cle: 'economique', ic: '💼', nom: 'ÉCONOMIQUE', sous: 'entreprises · emploi', existante: false },
  { cle: 'production', ic: '🏭', nom: 'PRODUCTION', sous: 'sites · réseaux · risques', existante: false },
]);

const CSS = `
#wti-fil {
  position: absolute; top: 46px; left: 0; right: 0; z-index: 6;
  display: flex; align-items: center; gap: 8px; padding: 3px 8px;
  background: linear-gradient(90deg, rgba(8,14,20,0.92), rgba(6,12,18,0.72));
  border-top: 1px solid rgba(0,212,255,0.22); border-bottom: 1px solid rgba(0,212,255,0.18);
  font-family: var(--font-mono, monospace); font-size: 9px; color: rgba(232,234,237,0.9);
}
#wti-fil .fi-titre {
  flex: none; font-size: 7.5px; letter-spacing: 2px; font-weight: 800; color: #00d4ff;
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4);
  border-radius: 5px; padding: 2px 6px; white-space: nowrap;
}
#wti-fil .fi-piste { flex: 1; overflow: hidden; white-space: nowrap; position: relative; height: 15px; }
#wti-fil .fi-rouleau {
  position: absolute; top: 0; left: 0; will-change: transform;
  animation: wti-defile 46s linear infinite;
}
#wti-fil:hover .fi-rouleau { animation-play-state: paused; }
#wti-fil .fi-rouleau a, #wti-fil .fi-rouleau span { margin-right: 26px; color: rgba(232,234,237,0.9); text-decoration: none; }
#wti-fil .fi-rouleau a:hover { color: #00d4ff; text-decoration: underline; }
#wti-fil .fi-rouleau i { color: rgba(232,234,237,0.45); font-style: normal; }
#wti-fil .fi-vide { color: rgba(232,234,237,0.4); }
#wti-fil .fi-src { flex: none; display: flex; gap: 3px; }
#wti-fil .fi-src a {
  font-size: 7px; letter-spacing: .5px; text-decoration: none; color: #7dd3c8;
  border: 1px solid rgba(125,211,200,0.35); border-radius: 999px; padding: 1px 5px;
}
#wti-fil .fi-src a:hover { background: rgba(125,211,200,0.16); }
@keyframes wti-defile { from { transform: translateX(6%); } to { transform: translateX(-100%); } }

.wti-vue { padding: 8px 2px 0; }
.wti-vue .v-titre { font-size: 8px; letter-spacing: 2px; color: #00d4ff; margin-bottom: 5px; }
.wti-vue .v-sous { font-size: 7.5px; letter-spacing: 1.5px; color: rgba(232,234,237,0.4); margin: 7px 0 3px; }
.wti-vue .v-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.wti-vue .v-actions button {
  cursor: pointer; padding: 5px 7px; border-radius: 7px; font-family: inherit; font-size: 8px;
  letter-spacing: 1px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
.wti-vue .v-actions button:hover { background: rgba(0,212,255,0.24); color: #fff; }
.wti-vue .v-actions button.actif { background: rgba(0,212,255,0.3); color: #fff; }
.wti-vue .v-grille { display: grid; grid-template-columns: 92px 1fr; gap: 2px 8px; font-size: 9px; line-height: 1.6; }
.wti-vue .v-grille .k { color: rgba(232,234,237,0.45); letter-spacing: 1px; }
.wti-vue .v-grille .v { color: rgba(232,234,237,0.92); }
.wti-vue .v-liste { display: flex; flex-direction: column; gap: 3px; font-size: 9px; line-height: 1.5; }
.wti-vue .v-liste a { color: #7dd3c8; text-decoration: none; }
.wti-vue .v-liste a:hover { text-decoration: underline; }
.wti-vue .v-liste .li { border-bottom: 1px dashed rgba(255,255,255,0.06); padding: 2px 0; }
.wti-vue .v-liens { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.wti-vue .v-liens a {
  font-size: 8px; text-decoration: none; color: #00d4ff; background: rgba(0,212,255,0.07);
  border: 1px solid rgba(0,212,255,0.3); border-radius: 999px; padding: 2px 6px;
}
.wti-vue .v-note { margin-top: 6px; font-size: 8px; line-height: 1.6; color: rgba(232,234,237,0.45); }
.wti-vue .v-note a { color: #00d4ff; text-decoration: none; }
`;

const h = () => (typeof window === 'undefined' ? {} : (window.__godsEyeView || {}));
const ech = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const nombre = (n) => (Number.isFinite(n) ? Number(n).toLocaleString('fr-FR') : '—');

async function jsonOuNull(url, delai = 9000) {
  try {
    const controle = new AbortController();
    const t = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    clearTimeout(t);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function actions(conteneur, boutons) {
  const zone = conteneur.querySelector('.v-actions');
  if (!zone) return;
  zone.innerHTML = '';
  for (const b of boutons) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = b.nom;
    if (b.actif?.()) btn.classList.add('actif');
    btn.addEventListener('click', async () => {
      try { await b.aller?.(); } catch { /* remonté ailleurs */ }
      if (b.actif) btn.classList.toggle('actif', Boolean(b.actif()));
    });
    zone.appendChild(btn);
  }
}

// ───────────────────────── les vues ─────────────────────────

async function rendreJumeau(c, ctx) {
  actions(c, [
    { nom: '🏙 BÂTI 3D', aller: () => h().dock?.ouvrir?.('bati') },
    { nom: '🗺 CADASTRE', aller: () => { h().cadastre?.activer?.(); h().dock?.ouvrir?.('cadastre'); } },
    { nom: '🏷 ENTITÉS', aller: () => { h().entites?.basculer?.(true); } },
    { nom: '🗺 VUE COMMUNALE', aller: () => h().vues?.appliquer?.('communale') },
    { nom: '👁 IMMERSION', aller: () => h().vues?.appliquer?.('immersion') },
    { nom: '🌍 ORBITE', aller: () => h().vues?.appliquer?.('orbite') },
  ]);
  c.querySelector('.v-contenu').innerHTML = `
    <div class="v-titre">🛰 JUMEAU NUMÉRIQUE</div>
    <div class="v-grille">
      <span class="k">POINT</span><span class="v">${Number.isFinite(ctx.lat) ? `${ctx.lat.toFixed(5)}, ${ctx.lon.toFixed(5)}` : '—'}</span>
      <span class="k">COMMUNE</span><span class="v">${ech(ctx.commune?.nom || '—')}</span>
      <span class="k">ALTITUDE VUE</span><span class="v">${nombre(Math.round(ctx.hauteur || 0))} m</span>
    </div>
    <div class="v-sous">COMPOSER LE JUMEAU</div>
    <div class="v-note">Le jumeau n'est pas une image : c'est un <b>empilement de couches réelles</b>.
    Volumes de bâtiments (OpenStreetMap), parcelles (cadastre IGN), entités nommées
    (Overpass) et couche AR. Chaque couche s'active ici, dans l'ordre que tu veux —
    c'est ce qui permet de juger une zone avant de s'y rendre.</div>
    <div class="v-liens">${htmlSources(['osm', 'ign', 'apicarto', 'overpass'])}</div>
    <div class="v-sous">DOCUMENTS À TÉLÉCHARGER</div>
    <div class="v-liens">${(liensVerification(ctx.lat, ctx.lon, ctx.commune?.code || '') || [])
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.nom}</a>`).join('')}</div>`;
}

async function rendreCommunal(c, ctx) {
  actions(c, [
    { nom: '🔲 TRACER LES CADRANS', aller: () => h().cadrans?.basculer?.(true) },
    { nom: '🗺 CADASTRE', aller: () => { h().cadastre?.activer?.(); } },
    { nom: '🏷 ENTITÉS', aller: () => h().entites?.basculer?.(true) },
    { nom: '🗺 VUE COMMUNALE', aller: () => h().vues?.appliquer?.('communale') },
    { nom: '🔥 HEATZONES', aller: () => h().vues?.appliquer?.('heatzones') },
  ]);
  const com = ctx.commune || {};
  const stats = h().cadrans?.cadrans?.() || [];
  const officiels = stats.filter((x) => x.nomOfficiel).length;
  c.querySelector('.v-contenu').innerHTML = `
    <div class="v-titre">🏛 ÉCHELLE COMMUNALE</div>
    <div class="v-grille">
      <span class="k">COMMUNE</span><span class="v"><b>${ech(com.nom || '—')}</b></span>
      <span class="k">CODE INSEE</span><span class="v">${ech(com.code || '—')}</span>
      <span class="k">POPULATION</span><span class="v">${nombre(com.population)} hab.</span>
      <span class="k">CODE POSTAL</span><span class="v">${ech((com.codesPostaux || []).join(', ') || '—')}</span>
      <span class="k">CADRANS</span><span class="v">${stats.length ? `${stats.length} (dont ${officiels} nommés d’après OpenStreetMap)` : 'non tracés'}</span>
    </div>
    <div class="v-sous">ÉQUIPEMENTS RECENSÉS (OpenStreetMap, 1,2 km)</div>
    <div class="v-liste">${(ctx.listes ? Object.entries(ctx.listes) : []).slice(0, 8)
      .map(([k, v]) => `<div class="li">${ech(k)} — <b>${(v?.length ?? v) || 0}</b></div>`).join('')
      || '<div class="li">Lance « ANALYSER LA VUE » pour compter les équipements.</div>'}</div>
    <div class="v-sous">SOURCES</div>
    <div class="v-liens">${htmlSources(['osm', 'insee', 'geoapigouv', 'ign'])}</div>
    <div class="v-note">Les cadrans découpent la commune en zones lisibles : les quartiers
    officiels OpenStreetMap les baptisent quand ils existent, sinon l'alphabet OTAN
    (ALPHA, BRAVO…). C'est la même logique qu'un plan de chantier : on numérote
    avant de discuter.</div>`;
}

async function rendreIndividuel(c, ctx) {
  const { lat, lon } = ctx;
  actions(c, [
    { nom: '📐 PARCELLE (CADASTRE)', aller: () => { h().cadastre?.activer?.(); h().dock?.ouvrir?.('cadastre'); } },
    { nom: 'ℹ️ FICHE DU POINT', aller: () => h().fiche?.ouvrir?.(lon, lat) },
    { nom: '🏙 BÂTI 3D', aller: () => h().dock?.ouvrir?.('bati') },
    { nom: '🛣 VUE DE RUE', aller: () => h().streetView?.ouvrir?.(lat, lon) },
  ]);
  const stats = h().cadastre?.statistiques?.() || {};
  c.querySelector('.v-contenu').innerHTML = `
    <div class="v-titre">🏠 ÉCHELLE INDIVIDUELLE</div>
    <div class="v-grille">
      <span class="k">POINT</span><span class="v">${Number.isFinite(lat) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : '—'}</span>
      <span class="k">PARCELLES</span><span class="v">${nombre(stats.parcelles ?? stats.nb ?? null) || 'active le cadastre'}</span>
      <span class="k">ADRESSE</span><span class="v">${ech(ctx.adresse || '—')}</span>
    </div>
    <div class="v-sous">CE QU'ON PEUT ÉTABLIR, ET CE QU'IL FAUT VÉRIFIER</div>
    <div class="v-note">À cette échelle on ne devine rien : emprise et propriété viennent du
    <b>cadastre</b> (IGN, sans clé) et les données fiscales (taxe foncière, loyers)
    n'existent <b>pas en open data individuel</b> en France — seules des sources
    officielles (impots.gouv.fr, DVF) ou un géomètre peuvent les confirmer. On donne
    donc les liens pour vérifier, jamais un chiffre inventé.</div>
    <div class="v-liens">${htmlSources(['ign', 'apicarto', 'osm', 'datagouv'])}</div>
    <div class="v-sous">VÉRIFIER</div>
    <div class="v-liens">
      <a href="https://www.impots.gouv.fr/" target="_blank" rel="noopener">impots.gouv.fr</a>
      <a href="https://explore.data.gouv.fr/#!/search/dvf" target="_blank" rel="noopener">DVF — valeurs foncières</a>
      <a href="https://www.geoportail.gouv.fr/" target="_blank" rel="noopener">Géoportail</a>
    </div>`;
}

async function rendrePolitique(c, ctx) {
  const com = ctx.commune || {};
  actions(c, [
    { nom: '🧠 ANALYSER LA VUE', aller: () => h().intel?.analyser?.() },
    { nom: '📰 FLUX PRESSE (GDELT)', aller: () => h().dock?.ouvrir?.('chat') },
  ]);
  c.querySelector('.v-contenu').innerHTML = `
    <div class="v-titre">🗳 GOUVERNANCE & DOCUMENTS</div>
    <div class="v-grille">
      <span class="k">COMMUNE</span><span class="v">${ech(com.nom || '—')}</span>
      <span class="k">CODE INSEE</span><span class="v">${ech(com.code || '—')}</span>
    </div>
    <div class="v-sous">REGISTRES OFFICIELS (à consulter)</div>
    <div class="v-liste">
      <div class="li"><a href="https://lannuaire.service-public.fr/" target="_blank" rel="noopener">Annuaire du service public</a> — mairie, services, horaires</div>
      <div class="li"><a href="https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus/" target="_blank" rel="noopener">Répertoire national des élus (RNE)</a> — le fichier officiel des élus</div>
      <div class="li"><a href="https://www.legifrance.gouv.fr/" target="_blank" rel="noopener">Légifrance</a> — textes, arrêtés</div>
      <div class="li"><a href="https://www.bodacc.fr/" target="_blank" rel="noopener">BODACC</a> — annonces légales, marchés publics</div>
      <div class="li"><a href="https://www.insee.fr/fr/statistiques/2011101?geo=COM-${ech(com.code || '')}" target="_blank" rel="noopener">Dossier INSEE</a> — population, revenus, emploi</div>
      ${com.nom ? `<div class="li"><a href="https://www.wikidata.org/w/index.php?search=${encodeURIComponent(com.nom)}&ns0=1&ns120=1" target="_blank" rel="noopener">Wikidata</a> — maire, mandats, liens</div>` : ''}
    </div>
    <div class="v-sous">SOURCES</div>
    <div class="v-liens">${htmlSources(['datagouv', 'bodacc', 'insee', 'wikidata', 'gdelt'])}</div>
    <div class="v-note">Aucune donnée « politique » n'est recalculée ici : on renvoie vers les
    <b>registres officiels</b>, seuls habilités. L'app ne note personne et n'évalue
    personne — elle donne les pièces du dossier.</div>`;
}

async function rendreEconomique(c, ctx) {
  const { lat, lon } = ctx;
  const zone = c.querySelector('.v-contenu');
  zone.innerHTML = `<div class="v-titre">💼 TISSU ÉCONOMIQUE AUTOUR DU POINT</div>
    <div class="v-note">⏳ Interrogation du registre des entreprises (DINUM/INSEE, sans clé)…</div>`;
  const depeches = await filEconomie(lat, lon, 2);
  const total = depeches.length;
  zone.innerHTML = `
    <div class="v-titre">💼 TISSU ÉCONOMIQUE AUTOUR DU POINT</div>
    <div class="v-grille">
      <span class="k">RAYON</span><span class="v">2 km autour du point visé</span>
      <span class="k">ENTREPRISES</span><span class="v"><b>${total}</b> (10 premières affichées)</span>
    </div>
    <div class="v-sous">ÉTABLISSEMENTS (SIREN · activité · effectif)</div>
    <div class="v-liste">${depeches.length
      ? depeches.map((d) => `<div class="li">${d.ic} <a href="${d.url}" target="_blank" rel="noopener">${ech(d.titre)}</a> — ${ech(d.detail)}</div>`).join('')
      : '<div class="li">Aucune entreprise retournée (réseau ou zone sans établissement).</div>'}</div>
    <div class="v-sous">ALLER PLUS LOIN</div>
    <div class="v-liens">
      <a href="https://annuaire-entreprises.data.gouv.fr/" target="_blank" rel="noopener">Annuaire des entreprises</a>
      <a href="https://www.pappers.fr/" target="_blank" rel="noopener">Pappers (comptes annuels)</a>
      <a href="https://www.bodacc.fr/" target="_blank" rel="noopener">BODACC</a>
      <a href="https://www.insee.fr/" target="_blank" rel="noopener">INSEE</a>
    </div>
    <div class="v-sous">SOURCES</div>
    <div class="v-liens">${htmlSources(['entreprises', 'insee', 'pappers', 'bodacc'])}</div>
    <div class="v-note">Les comptes annuels certifiés (CA, résultat) demandent un jeton
    <b>Pappers</b> ou <b>API Entreprise</b> : sans jeton, l'app affiche l'identité et
    l'activité — et renvoie vers la source officielle pour les chiffres.</div>`;
}

async function rendreProduction(c, ctx) {
  const { lat, lon } = ctx;
  const zone = c.querySelector('.v-contenu');
  zone.innerHTML = `<div class="v-titre">🏭 PRODUCTION · RÉSEAUX · RISQUES</div>
    <div class="v-note">⏳ Interrogation de Géorisques (Ministère de la Transition écologique)…</div>`;
  const brut = await jsonOuNull(urlGeorisques('installations_classees', lon, lat, 3000));
  const sites = resumeGeorisques(brut, 'installations_classees', 8, { lat, lon });
  const brutSis = await jsonOuNull(urlGeorisques('secteurs_information_sols', lon, lat, 3000));
  const sis = resumeGeorisques(brutSis, 'secteurs_information_sols', 5, { lat, lon });
  zone.innerHTML = `
    <div class="v-titre">🏭 PRODUCTION · RÉSEAUX · RISQUES</div>
    <div class="v-grille">
      <span class="k">RAYON</span><span class="v">3 km autour du point visé</span>
      <span class="k">ICPE</span><span class="v"><b>${sites.length}</b> installation(s) classée(s)</span>
      <span class="k">SOLS POLLUÉS</span><span class="v">${sis.length} secteur(s) d’information</span>
    </div>
    <div class="v-sous">INSTALLATIONS CLASSÉES (ICPE)</div>
    <div class="v-liste">${sites.length
      ? sites.map((s) => `<div class="li">🏭 <a href="${s.sourceUrl}" target="_blank" rel="noopener">${ech(s.nom)}</a> — ${ech(s.detail)}</div>`).join('')
      : '<div class="li">Aucune installation classée dans ce rayon.</div>'}</div>
    <div class="v-sous">SECTEURS D’INFORMATION SUR LES SOLS</div>
    <div class="v-liste">${sis.length
      ? sis.map((s) => `<div class="li">☣️ <a href="${s.sourceUrl}" target="_blank" rel="noopener">${ech(s.nom)}</a> — ${ech(s.detail)}</div>`).join('')
      : '<div class="li">Aucun secteur recensé.</div>'}</div>
    <div class="v-sous">SOURCES</div>
    <div class="v-liens">${htmlSources(['georisques', 'osm', 'usgs', 'nasa_eonet'])}</div>
    <div class="v-note">Installations classées, sols pollués, cavités, radon, argiles,
    sismicité : ces données sont <b>publiques et opposables</b> — c'est la base pour juger
    un environnement avant d'y installer quoi que ce soit.</div>`;
}

/** Association vue → fonction de rendu (exposée pour les tests). */
export const RENDUS = Object.freeze({
  jumeau: rendreJumeau,
  communal: rendreCommunal,
  individuel: rendreIndividuel,
  politique: rendrePolitique,
  economique: rendreEconomique,
  production: rendreProduction,
});

/**
 * Branche les vues et le bandeau sur la fenêtre INTEL existante.
 * @param {HTMLElement} root #wt-intel
 * @param {{intel?:object, surMessage?:Function}} [options]
 */
export function initIntelVues(root, options = {}) {
  if (!root) return null;
  const { intel = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── 🎞 BANDEAU HAUT (façon Bloomberg) ──
  const fil = document.createElement('div');
  fil.id = 'wti-fil';
  fil.innerHTML = `
    <span class="fi-titre">FIL — CONTEXTE</span>
    <span class="fi-piste"><span class="fi-rouleau"><span class="fi-vide">⏳ collecte des dépêches…</span></span></span>
    <span class="fi-src"></span>`;
  const haut = root.querySelector('#wti-haut');
  if (haut?.parentNode) haut.parentNode.insertBefore(fil, haut.nextSibling);
  else root.appendChild(fil);

  const rouleau = fil.querySelector('.fi-rouleau');
  const titreFil = fil.querySelector('.fi-titre');
  const zoneSrc = fil.querySelector('.fi-src');

  // ── onglets + conteneurs ──
  const ongles = root.querySelector('.ongles');
  const droit = root.querySelector('#wti-droit');
  const vueContexte = root.querySelector('.vue-contexte');
  const vueProfil = root.querySelector('.vue-profil');
  const conteneurs = new Map();

  for (const v of VUES_INTEL) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ong';
    b.dataset.v = v.cle;
    b.textContent = `${v.ic} ${v.nom}`;
    b.title = `${v.nom} — ${v.sous}`;
    if (ongles) ongles.appendChild(b);

    const d = document.createElement('div');
    d.className = `wti-vue vue-${v.cle}`;
    d.style.display = 'none';
    d.innerHTML = `<div class="v-actions"></div><div class="v-contenu"></div>`;
    if (droit) droit.appendChild(d);
    conteneurs.set(v.cle, d);

    b.addEventListener('click', () => {
      for (const o of ongles?.querySelectorAll('.ong') || []) o.classList.remove('actif');
      b.classList.add('actif');
      if (vueContexte) vueContexte.style.display = 'none';
      if (vueProfil) vueProfil.style.display = 'none';
      for (const [cle, node] of conteneurs) node.style.display = cle === v.cle ? '' : 'none';
      majBandeau(v.cle);
      RENDUS[v.cle]?.(node_(v.cle), contexte()).catch(() => {});
    });
  }
  const node_ = (cle) => conteneurs.get(cle);

  // les onglets d'origine (CONTEXTE / PROFIL) replient nos vues
  for (const o of ongles?.querySelectorAll('.ong') || []) {
    if (VUES_INTEL.some((v) => v.cle === o.dataset.v)) continue;
    o.addEventListener('click', () => {
      for (const node of conteneurs.values()) node.style.display = 'none';
      majBandeau(o.dataset.v === 'profil' ? 'profil' : 'contexte');
    });
  }

  // ── état ──
  let depeches = [];
  let sources = [];
  let categorie = 'contexte';
  let majLe = 0;

  function contexte() {
    const d = intel?.derniere?.() || {};
    const g = h();
    let hauteur = 0;
    try { hauteur = g.viewer?.camera?.positionCartographic?.height || 0; } catch { hauteur = 0; }
    return {
      lat: d.lat, lon: d.lon, commune: d.commune || null, listes: d.listes || null,
      indices: d.indices || null, hauteur, adresse: '',
    };
  }

  function majBandeau(cat) {
    categorie = cat || 'contexte';
    const v = VUES_INTEL.find((x) => x.cle === categorie);
    titreFil.textContent = `FIL — ${v ? v.nom : (categorie === 'profil' ? 'PROFIL' : 'CONTEXTE')}`;
    rouleau.innerHTML = tickerHtml(filtrerParCategorie(depeches, categorie));
    zoneSrc.innerHTML = htmlSources(sources);
  }

  async function rafraichir(force = false) {
    const maintenant = Date.now();
    if (!force && maintenant - majLe < 90_000 && depeches.length) { majBandeau(categorie); return; }
    majLe = maintenant;
    const ctx = contexte();
    const r = await filComplet(ctx);
    depeches = r.depeches;
    sources = r.sources;
    majBandeau(categorie);
    if (!depeches.length) surMessage?.('🎞 Fil d’informations indisponible (sources injoignables).');
  }

  rafraichir();
  const minuteur = window.setInterval(() => rafraichir(), 120_000);

  return {
    element: fil,
    rafraichir,
    depeches: () => depeches.slice(),
    categorie: () => categorie,
    majBandeau,
    vues: VUES_INTEL.map((v) => v.cle),
    arreter: () => window.clearInterval(minuteur),
  };
}
