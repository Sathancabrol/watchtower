/**
 * WATCHTOWER — VUE INTEL « TERRAIN » (les six sources officielles en ligne).
 *
 * C'est la lentille du terrain : au point visé, elle va chercher ce que
 * personne ne peut deviner — le zonage du PLU qui s'applique VRAIMENT là,
 * la parcelle cadastrale sous le curseur, les prix réellement signés dans la
 * commune, les marchés publics en cours, et ce qui est protégé au titre de
 * la nature.
 *
 * Chaque bloc suit la même discipline :
 *   1. il annonce ce qu'il interroge (producteur, licence, format) ;
 *   2. il affiche ce qu'il reçoit, ou dit franchement « rien » ;
 *   3. si la source ne répond pas, il donne l'URL exacte qu'il a appelée —
 *      l'utilisateur peut la coller dans son navigateur et vérifier lui-même.
 *
 * Aucune donnée n'est mise en cache : ces sources bougent (un PLU se révise,
 * un marché se publie, une vente se signe), et une réponse d'hier présentée
 * comme celle d'aujourd'hui serait un mensonge de plus.
 */

import {
  SOURCES_OFFICIELLES, lireCommune, lireDvf, lireMarchesBoamp, lireMarchesDecp,
  lireNature, lireParcelles, lirePrescriptions, lireZonage, resumeDvf,
  urlBoamp, urlCadastre, urlCommunePoint, urlDecp, urlDvfCommune, urlNature,
  urlPrescriptions, urlZonage,
} from './sourcesOfficielles.js';
import { htmlSources } from './tracabilite.js';

const ech = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const fr = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('fr-FR') : '—');
const euro = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('fr-FR') + ' €' : '—');
const court = (s, n = 120) => (String(s ?? '').length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s ?? ''));

/** Récupère du JSON, ou null — sans jamais lever, avec un délai borné. */
async function jsonOuNull(url, delai = 12000) {
  if (!url) return null;
  try {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    clearTimeout(minuteur);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

/** Récupère du texte (CSV), ou null. */
async function texteOuNull(url, delai = 15000) {
  if (!url) return null;
  try {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    clearTimeout(minuteur);
    return r.ok ? await r.text() : null;
  } catch { return null; }
}

/** Le bloc « source injoignable » : on dit ce qu'on a appelé, on ne remplace rien. */
function blocInjoignable(titre, url, quoi) {
  return `<div class="v-sous">${titre}</div>
    <div class="v-liste"><div class="li">⚠️ Source injoignable depuis ce navigateur (réseau, pare-feu ou service indisponible).
    ${quoi ? ech(quoi) : ''}<br>
    <a href="${ech(url || '#')}" target="_blank" rel="noopener">Vérifier directement à la source ↗</a></div></div>`;
}

/** Le pied de bloc : la source, sa licence, son état de vérification. */
function piedSource(cle, { url = null } = {}) {
  const s = SOURCES_OFFICIELLES.find((x) => x.cle === cle);
  if (!s) return '';
  return `<div class="v-note">Source : <a href="${ech(url || s.doc)}" target="_blank" rel="noopener">${ech(s.nom)}</a>
    — ${ech(s.producteur)} · ${ech(s.licence)} · ${ech(s.format)}
    ${s.verifieEnLigne ? '' : '<b>⚠️ point d’entrée non encore confirmé en ligne</b> (l’appel réel se fait dans votre navigateur).'}</div>`;
}

// ───────────────────────── blocs ─────────────────────────

/** 🏛 Le zonage d'urbanisme qui s'applique au point. */
async function blocUrbanisme(lon, lat) {
  const url = urlZonage(lon, lat);
  const urlP = urlPrescriptions(lon, lat);
  const brut = await jsonOuNull(url);
  const pres = await jsonOuNull(urlP);
  if (!brut) return blocInjoignable('🏛 ZONAGE D’URBANISME AU POINT', url,
    'Le Géoportail de l’urbanisme ne peut pas être interrogé ici.') + piedSource('urbanisme', { url });
  const z = lireZonage(brut);
  const p = lirePrescriptions(pres);
  const lignes = z.zones.map((x) => `<div class="li"><b>${ech(x.libelle)}</b>${x.type ? ' — type ' + ech(x.type) : ''}
    ${x.destination ? ' · destination : ' + ech(x.destination) : ''}
    ${x.approuve ? ' · approuvé le ' + ech(x.approuve) : ''}
    ${x.reglement ? `<br><a href="${ech(x.reglement)}" target="_blank" rel="noopener">Règlement de la zone (PDF officiel) ↗</a>` : ''}</div>`).join('');
  return `<div class="v-sous">🏛 ZONAGE D’URBANISME AU POINT</div>
    ${z.vide ? '<div class="v-liste"><div class="li">Aucune zone retournée : le document d’urbanisme de cette commune n’est peut-être pas encore dématérialisé, ou le point est hors périmètre.</div></div>'
      : `<div class="v-liste">${lignes}</div>`}
    ${p.length ? `<div class="v-sous">PRESCRIPTIONS SURFACIQUES (${p.length})</div><div class="v-liste">${p.slice(0, 6).map((x) => `<div class="li">${ech(x.libelle)}${x.categorie ? ' — ' + ech(x.categorie) : ''}</div>`).join('')}</div>` : ''}
    ${piedSource('urbanisme', { url })}`;
}

/** 📐 La parcelle cadastrale sous le point. */
async function blocParcelle(lon, lat) {
  const url = urlCadastre(lon, lat);
  const brut = await jsonOuNull(url);
  if (!brut) return blocInjoignable('📐 PARCELLE SOUS LE POINT', url, 'Le cadastre IGN n’a pas répondu.') + piedSource('cadastre', { url });
  const parcelles = lireParcelles(brut);
  if (!parcelles.length) {
    return `<div class="v-sous">📐 PARCELLE SOUS LE POINT</div>
      <div class="v-liste"><div class="li">Aucune parcelle à ce point (domaine public, emprise ferroviaire, plan d’eau…).</div></div>
      ${piedSource('cadastre', { url })}`;
  }
  return `<div class="v-sous">📐 PARCELLE SOUS LE POINT</div>
    <div class="v-grille">${parcelles.slice(0, 3).map((x) => `
      <span class="k">SECTION / N°</span><span class="v"><b>${ech(x.section || '—')} ${ech(x.numero || '')}</b>${x.prefixe ? ' (préfixe ' + ech(x.prefixe) + ')' : ''}</span>
      <span class="k">CONTENANCE</span><span class="v">${x.contenance === null ? 'non publiée' : fr(x.contenance) + ' m² (' + String(x.contenanceHa).replace('.', ',') + ' ha)'}</span>
      <span class="k">COMMUNE</span><span class="v">${ech(x.commune || '—')}</span>`).join('')}</div>
    <div class="v-note">C’est la parcelle qui porte le zonage ci-dessus et qui sert de référence pour toute autorisation d’urbanisme.</div>
    ${piedSource('cadastre', { url })}`;
}

/** 🌿 Ce qui est protégé au titre de la nature, au point. */
async function blocNature(lon, lat) {
  const url = urlNature(lon, lat);
  const brut = await jsonOuNull(url);
  if (!brut) return blocInjoignable('🌿 NATURA 2000 & ZNIEFF', url, 'L’inventaire du patrimoine naturel n’a pas répondu.') + piedSource('nature', { url });
  const zones = lireNature(brut);
  const types = zones.reduce((m, z) => ({ ...m, [z.type]: (m[z.type] || 0) + 1 }), {});
  return `<div class="v-sous">🌿 NATURA 2000 & ZNIEFF</div>
    ${zones.length ? `<div class="v-grille">${Object.entries(types).map(([t, n]) => `<span class="k">${ech(t)}</span><span class="v">${n}</span>`).join('')}</div>
      <div class="v-liste">${zones.slice(0, 8).map((z) => `<div class="li">🌿 <b>${ech(z.nom)}</b> — ${ech(z.type)}${z.identifiant ? ' · ' + ech(z.identifiant) : ''}</div>`).join('')}</div>`
      : '<div class="v-liste"><div class="li">Aucun zonage naturel inventorié à ce point.</div></div>'}
    <div class="v-note">Ces zonages ne sont pas des interdictions : ils déclenchent une <b>évaluation des incidences</b> pour tout projet en Natura 2000.</div>
    ${piedSource('nature', { url })}`;
}

/** 💰 Les prix réellement signés dans la commune (DVF). */
async function blocPrix(communeInfo) {
  const code = communeInfo?.codeInsee || null;
  const url = urlDvfCommune(code);
  if (!url) {
    return `<div class="v-sous">💰 PRIX SIGNÉS (DVF)</div>
      <div class="v-liste"><div class="li">Code INSEE de la commune non identifié : impossible de désigner le bon fichier (la France compte 34 000 communes — on ne devine pas).</div></div>`;
  }
  const csv = await texteOuNull(url);
  if (csv === null) return blocInjoignable('💰 PRIX SIGNÉS (DVF)', url, 'Le fichier des valeurs foncières n’a pas répondu.') + piedSource('dvf', { url });
  const r = resumeDvf(lireDvf(csv), { depuis: new Date().getFullYear() - 3 });
  if (!r.nombre) {
    return `<div class="v-sous">💰 PRIX SIGNÉS (DVF) — ${ech(communeInfo?.nom || '')}</div>
      <div class="v-liste"><div class="li">Aucune transaction publiée depuis ${new Date().getFullYear() - 3} dans cette commune.</div></div>
      ${piedSource('dvf', { url })}`;
  }
  return `<div class="v-sous">💰 PRIX SIGNÉS (DVF) — ${ech(communeInfo?.nom || '')} depuis ${r.depuis}</div>
    <div class="v-grille">
      <span class="k">TRANSACTIONS</span><span class="v"><b>${fr(r.nombre)}</b> (la plus récente : ${ech(String(r.anneeRecente || ''))})</span>
      <span class="k">PRIX MÉDIAN</span><span class="v">${r.prixM2Global === null ? 'non calculable' : fr(r.prixM2Global) + ' €/m² (tous biens bâtis)'}</span>
      ${r.parType.map((p) => `<span class="k">${ech(p.type.toUpperCase())}</span><span class="v">${p.medianeM2 === null ? '—' : fr(p.medianeM2) + ' €/m²'} · ${fr(p.nombre)} vente(s)</span>`).join('')}
    </div>
    <div class="v-sous">DERNIÈRES VENTES</div>
    <div class="v-liste">${r.dernieres.map((v) => `<div class="li">${ech(v.date)} — ${v.type ? ech(v.type) : 'bien'}${v.surface ? ' de ' + fr(v.surface) + ' m²' : ''}${v.voie ? ' · ' + ech(court(v.voie, 34)) : ''} → <b>${euro(v.prix)}</b>${v.prixM2 ? ' (' + fr(v.prixM2) + ' €/m²)' : ''}</div>`).join('')}</div>
    <div class="v-note">Le prix médian est calculé <b>ici</b>, à partir des ventes réellement enregistrées — ce n’est pas une estimation d’agence.</div>
    ${piedSource('dvf', { url })}`;
}

/** 📄 Les marchés publics : avis en cours (BOAMP) et marchés attribués (DECP). */
async function blocMarches(communeInfo) {
  const nom = communeInfo?.nom || '';
  const urlB = urlBoamp(nom, { limite: 8 });
  const urlD = urlDecp(nom, { limite: 8 });
  const [boamp, decp] = await Promise.all([jsonOuNull(urlB), jsonOuNull(urlD)]);
  if (!boamp && !decp) {
    return `<div class="v-sous">📄 MARCHÉS PUBLICS</div>
      <div class="v-liste"><div class="li">⚠️ Ni le BOAMP ni les DECP n’ont répondu depuis ce navigateur.<br>
        <a href="${ech(urlB || urlD)}" target="_blank" rel="noopener">Consulter le BOAMP directement ↗</a></div></div>
      ${piedSource('boamp', { url: urlB })}`;
  }
  const avis = boamp ? lireMarchesBoamp(boamp) : [];
  const attribues = decp ? lireMarchesDecp(decp) : [];
  return `<div class="v-sous">📄 AVIS EN COURS (BOAMP) — ${ech(nom)}</div>
    ${avis.length ? `<div class="v-liste">${avis.slice(0, 8).map((m) => `<div class="li">📢 <a href="${ech(m.url || '#')}" target="_blank" rel="noopener">${ech(court(m.objet, 110))}</a>
      <br><span class="k">ACHETEUR</span> ${ech(m.acheteur || '—')} · <span class="k">PARU</span> ${ech(m.date || '—')}${m.limite ? ' · <span class="k">RÉPONSE AVANT</span> ' + ech(m.limite) : ''}</div>`).join('')}</div>`
      : '<div class="v-liste"><div class="li">Aucun avis en cours pour cette commune.</div></div>'}
    <div class="v-sous">MARCHÉS ATTRIBUÉS (DECP)</div>
    ${attribues.length ? `<div class="v-liste">${attribues.slice(0, 8).map((m) => `<div class="li">🧾 <b>${ech(court(m.objet, 100))}</b><br>
      <span class="k">TITULAIRE</span> ${ech(m.titulaire || '—')} · <span class="k">MONTANT</span> ${m.montant === null ? 'non publié' : euro(m.montant)}${m.dureeMois ? ' · ' + m.dureeMois + ' mois' : ''}</div>`).join('')}</div>`
      : '<div class="v-liste"><div class="li">Aucun marché attribué retrouvé (le jeu DECP couvre les marchés publiés depuis 2018).</div></div>'}
    <div class="v-note">Un avis BOAMP annonce un chantier <b>avant</b> qu’il ne commence ; les DECP disent ce qu’il a coûté et à qui. Les deux ensemble forment l’historique d’un marché public.</div>
    ${piedSource('boamp', { url: urlB })}
    ${piedSource('decp', { url: urlD })}`;
}

// ───────────────────────── rendu ─────────────────────────

/**
 * Rend la vue TERRAIN. Tout est interrogé en parallèle : six sources lentes
 * valent mieux qu’une seule lente et cinq qui attendent.
 * @param {HTMLElement} c conteneur `.wti-vue`
 * @param {object} ctx contexte de l'INTEL (lat, lon, commune)
 */
export async function rendreTerrain(c, ctx = {}) {
  const zone = c.querySelector('.v-contenu');
  if (!zone) return false;
  const lon = Number(ctx.lon);
  const lat = Number(ctx.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    zone.innerHTML = `<div class="v-titre">🔎 TERRAIN</div>
      <div class="v-note">Aucun point visé : déplacez la caméra sur une commune (ou utilisez
      « ME LOCALISER »), puis revenez ici. Les six sources interrogées le sont <b>au point</b>.</div>`;
    return false;
  }

  zone.innerHTML = `<div class="v-titre">🔎 TERRAIN — CE QUE DIT L’ÉTAT CIVIL DU SOL</div>
    <div class="v-note">⏳ Interrogation de six sources officielles au point
    ${lat.toFixed(5)}, ${lon.toFixed(5)} — zonage du PLU, parcelle cadastrale, prix signés,
    marchés publics, zonages naturels…</div>`;

  // La commune d'abord : elle conditionne le fichier DVF et la recherche des marchés.
  const communeInfo = lireCommune(await jsonOuNull(urlCommunePoint(lon, lat)));

  const [urbanisme, parcelle, nature, prix, marches] = await Promise.all([
    blocUrbanisme(lon, lat),
    blocParcelle(lon, lat),
    blocNature(lon, lat),
    blocPrix(communeInfo),
    blocMarches(communeInfo),
  ]);

  zone.innerHTML = `
    <div class="v-titre">🔎 TERRAIN — CE QUE DIT L’ÉTAT CIVIL DU SOL</div>
    <div class="v-grille">
      <span class="k">POINT VISÉ</span><span class="v">${lat.toFixed(5)}, ${lon.toFixed(5)}</span>
      <span class="k">COMMUNE</span><span class="v">${communeInfo ? `<b>${ech(communeInfo.nom)}</b> (${ech(communeInfo.codeInsee)})${communeInfo.population ? ' · ' + fr(communeInfo.population) + ' hab.' : ''}` : 'non identifiée — la source d’adressage n’a pas répondu'}</span>
      <span class="k">SOURCES</span><span class="v">6 interrogées · ${SOURCES_OFFICIELLES.length} au registre</span>
    </div>
    ${urbanisme}
    ${parcelle}
    ${prix}
    ${marches}
    ${nature}
    <div class="v-sous">SOURCES OFFICIELLES UTILISÉES</div>
    <div class="v-liens">${htmlSources(['apicarto', 'ban', 'geoapigouv', 'datagouv', 'insee'])}</div>
    <div class="v-note">Rien n’est mis en cache : un PLU se révise, un marché se publie, une vente se
    signe. Ce que vous lisez est ce que la source renvoie <b>maintenant</b>. Quand une source ne
    répond pas, l’app donne l’URL exacte au lieu d’inventer une réponse.</div>
    <div class="v-actions">
      <button data-terrain="cadastre">🗺 Voir la parcelle au cadastre</button>
      <button data-terrain="recharger">⟳ Recharger les six sources</button>
    </div>`;

  zone.querySelector('[data-terrain="cadastre"]')?.addEventListener('click', () => {
    const g = (typeof window === 'undefined' ? {} : (window.__godsEyeView || {}));
    g.dock?.ouvrir?.('cadastre');
  });
  zone.querySelector('[data-terrain="recharger"]')?.addEventListener('click', () => {
    rendreTerrain(c, ctx).catch(() => {});
  });
  return true;
}

/** Les dépêches « terrain » d'un point, sans réseau : ce qu'on sait déjà du lieu. */
export function depechesTerrain(ctx = {}) {
  const out = [];
  if (Number.isFinite(Number(ctx.lon)) && Number.isFinite(Number(ctx.lat))) {
    out.push({ ic: '🔎', titre: 'Terrain interrogé', detail: 'six sources officielles au point visé', url: null, categorie: 'terrain' });
  }
  return out;
}
