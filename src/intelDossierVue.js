/**
 * WATCHTOWER — VUE INTEL « DOSSIER » (le classeur territorial).
 *
 * Septième lentille de l'INTEL : celle qui ne va PAS chercher de nouvelles
 * données sur le réseau, mais qui montre le CLASSEUR déjà constitué —
 * 13 fiches projets, 32 chiffres sourcés, 110 sources datées, 13 lacunes, les
 * 14 communes de l'agglo, les trois scénarios 2040 et le registre de veille.
 *
 * Pourquoi une lentille à part : les autres vues répondent à « qu'y a-t-il
 * ici ? ». Celle-ci répond à « qu'est-ce qu'on SAIT, qui le dit, et qu'est-ce
 * qu'on ne sait pas ? ». Les deux questions n'ont pas la même source : la
 * première interroge des API, la seconde lit une base consolidée et datée.
 *
 * Règle tenue ici comme ailleurs : ce qui est incertain est écrit incertain,
 * ce qui manque est écrit manquant, et chaque ligne porte son lien.
 */

import {
  CONTRAT, STATUTS_PREUVE, cheminTerritoire, chiffre, etatTerritoire, lacunesOuvertes,
  planDeBranchement, registreClaims, resumeClaims, resumeIntel, scenariosCompare,
  statistiquesIntel, tousLesCsv, versCsv, versJson, verifierIntel,
} from './dossierIntel.js';
import {
  CATEGORIES_CHANTIER, FICHIERS_CHANTIER, COUVERTURE, gabaritFiche, plusGrosFichiers,
  resumeChantier, statistiquesChantier,
} from './data/dossierChantier.js';
import { CHIFFRES, PROJETS, SOURCES, VISION } from './data/frontignanDossier.js';
import { COMMUNES, INDICATEURS_COMMUNES, PROVENANCE_ATLAS } from './data/atlasThau.js';
import { FAMILLES_VEILLE, SOURCES_VEILLE } from './data/veilleOfficielle.js';

const ech = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const court = (s, n = 150) => (String(s ?? '').length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s ?? ''));
const fr = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('fr-FR') : '—');

/** Les onglets du classeur. */
export const ONGLETS_DOSSIER = Object.freeze([
  { cle: 'projets', ic: '🏗', nom: 'PROJETS', quoi: 'les 13 fiches §7 du dossier' },
  { cle: 'chiffres', ic: '📊', nom: 'CHIFFRES', quoi: 'chaque valeur avec sa source' },
  { cle: 'communes', ic: '🏘', nom: 'AGGLO', quoi: 'les 14 communes et leurs indicateurs' },
  { cle: 'lacunes', ic: '🕳', nom: 'LACUNES', quoi: 'ce que personne n’a publié' },
  { cle: 'futur', ic: '🔮', nom: '2040', quoi: 'focale 2030 et trois scénarios' },
  { cle: 'veille', ic: '📡', nom: 'VEILLE', quoi: 'les sources à brancher' },
  { cle: 'sources', ic: '📚', nom: 'SOURCES', quoi: 'le registre du dossier' },
  { cle: 'chantier', ic: '🏗', nom: 'CHANTIER', quoi: 'le gabarit de pièces d’un vrai chantier' },
  { cle: 'claims', ic: '⚖️', nom: 'PREUVES', quoi: 'ce qui est établi, contredit ou inconnu' },
]);

/** Le classeur d'ouverture : ce qu'on sait, et ce qu'on ne sait pas. */
function enteteDossier() {
  const e = etatTerritoire();
  const s = statistiquesIntel();
  const v = verifierIntel();
  return `<div class="v-titre">📚 DOSSIER TERRITORIAL — CE QU'ON SAIT, ET QUI LE DIT</div>
    <div class="v-grille">
      <span class="k">TERRITOIRE</span><span class="v">${ech(e.commune.nom)} (${e.commune.codeInsee}) — <b>${fr(e.commune.population)} hab.</b>, ${e.commune.rangAgglo}ᵉ de l'agglo</span>
      <span class="k">AGGLO</span><span class="v">${s.atlas.communes} communes · <b>${fr(e.commune.agglo.population)} hab.</b> (${PROVENANCE_ATLAS.titre})</span>
      <span class="k">CLASSEUR</span><span class="v">${s.projets} projets · ${s.chiffres} chiffres · ${s.sources} sources · ${s.dossier.lacunes} lacunes</span>
      <span class="k">MAILLAGE</span><span class="v">${s.atlas.noeuds} nœuds · ${s.atlas.liens} liens · ${s.atlas.sources} sources d'atlas</span>
      <span class="k">VEILLE</span><span class="v">${s.veille.total} sources publiques listées · ${s.veille.avecApi} avec API</span>
      <span class="k">INTÉGRITÉ</span><span class="v">${v.ok ? '✅ contrôle OK (' + v.controle + ' points)' : '⚠️ ' + v.problemes.length + ' anomalie(s)'}</span>
    </div>
    <div class="v-note">${ech(CONTRAT.but)} <b>Contrat ${CONTRAT.nom}@${CONTRAT.version}</b> — export JSON et CSV compris.</div>`;
}

/** La frise d'échelles : France → Occitanie → Hérault → Thau → Frontignan. */
function friseDossier() {
  return `<div class="v-sous">CHEMIN DE CONNAISSANCE</div>
    <div class="v-liste">${cheminTerritoire().map((n) => `<div class="li">${'·'.repeat(n.niveau)} <b>${ech(n.nom)}</b> — ${ech(n.sait)}</div>`).join('')}</div>`;
}

/** 🏗 Les fiches projets, avec statut, budget et sources cliquables. */
function panneauProjets() {
  return `<div class="v-liste">${PROJETS.map((p) => `<div class="li">
      <b>${ech(p.titre)}</b><br>
      <span class="k">STATUT</span> ${ech(court(p.statut, 190))}<br>
      <span class="k">BUDGET</span> ${ech(court(p.budget || 'non chiffré publiquement', 170))}<br>
      ${p.calendrier ? `<span class="k">CALENDRIER</span> ${ech(court(p.calendrier, 150))}<br>` : ''}
      ${p.sources.length
        ? `<span class="k">SOURCES</span> ${p.sources.slice(0, 4).map((s) => `<a href="${ech(s.url)}" target="_blank" rel="noopener">${ech(court(s.libelle, 46))}</a>`).join(' · ')}`
        : '<span class="k">SOURCES</span> <i>aucun lien direct dans le dossier</i>'}
    </div>`).join('')}</div>
    <div class="v-note">Le dossier §7 distingue les projets achevés (Le Quai), en travaux (cœur de ville, port),
    en étude (PEM, friche) et sensibles (Mas de Chave). Les montants sont ceux des annonces officielles,
    y compris quand elles ont été révisées — l'écart est écrit, pas effacé.</div>`;
}

/** 📊 Les chiffres, groupés par domaine du dossier. */
function panneauChiffres() {
  const domaines = {};
  for (const c of CHIFFRES) (domaines[c.domaine] = domaines[c.domaine] || []).push(c);
  return Object.entries(domaines).map(([domaine, lignes]) => `<div class="v-sous">${ech(domaine.toUpperCase())}</div>
    <div class="v-grille">${lignes.map((c) => `<span class="k">${ech(court(c.indicateur, 34))}</span><span class="v">${ech(court(c.valeur, 120))}${c.marqueurs.length ? ' ' + c.marqueurs.join('') : ''}</span>`).join('')}</div>`).join('')
    + `<div class="v-note">Chaque valeur vient d'une ligne du dossier, elle-même suivie de sa source.
    Rappel de lecture : ✅ fait constaté · 📅 annoncé · 🔮 tendance · ⚠️ incertain · ❓ non publié.</div>`;
}

/** 🏘 Les 14 communes de l'agglo, triées par population. */
function panneauCommunes() {
  return `<div class="v-grille">${COMMUNES.map((c) => `<span class="k">${c.rangPopulation}. ${ech(c.nom)}</span><span class="v">${fr(c.pop)} hab. · niveau de vie ${fr(c.nvm)} €/uc · pauvreté ${String(c.pauv ?? '—').replace('.', ',')} % · chômage ${String(c.tcho ?? '—').replace('.', ',')} % · ${String(c.part_agglo ?? '—').replace('.', ',')} % de l'agglo</span>`).join('')}</div>
    <div class="v-note">Source : ${ech(PROVENANCE_ATLAS.titre)} (${ech(PROVENANCE_ATLAS.genereLe)}) — indicateurs INSEE recalculés à l'échelle de l'agglo :
    ${Object.values(INDICATEURS_COMMUNES).length} colonnes par commune, dont densité, solde migratoire, résidences secondaires et vacance.</div>`;
}

/** 🕳 Ce que le dossier n'a PAS pu établir. */
function panneauLacunes() {
  const l = lacunesOuvertes();
  return `<div class="v-sous">ANGLE MORT (priorité n°1)</div>
    <div class="v-liste">${l.angleMort.map((x) => `<div class="li">🕳 ${ech(court(x.texte, 320))}</div>`).join('')}</div>
    <div class="v-sous">CE QUI MANQUE (${l.autres.length})</div>
    <div class="v-liste">${l.autres.map((x) => `<div class="li"><b>${x.rang}.</b> ${ech(court(x.texte, 210))}</div>`).join('')}</div>
    <div class="v-sous">CONTRADICTIONS ENTRE SOURCES (${l.contradictions.length})</div>
    <div class="v-liste">${l.contradictions.map((c) => `<div class="li">⚖️ <b>${ech(c.sujet)}</b> — ${ech(court(c.conflit, 170))}<br><span class="k">RETENU</span> ${ech(court(c.traitement, 170))}</div>`).join('')}</div>
    <div class="v-note">Une lacune publiée vaut mieux qu'un chiffre inventé : c'est la liste à demander à la Ville et à l'agglo.</div>`;
}

/** 🔮 La focale 2030 et les trois scénarios 2040. */
function panneauFutur() {
  const s = scenariosCompare();
  return `<div class="v-sous">FOCALE 2030 — ${VISION.population2030 ? fr(VISION.population2030[0]) + ' à ' + fr(VISION.population2030[1]) + ' habitants' : 'estimation non publiée'}</div>
    <div class="v-liste">${VISION.points2030.map((p) => `<div class="li">${ech(court(p, 200))}</div>`).join('')}</div>
    <div class="v-sous">CONDITIONS DE SUCCÈS</div>
    <div class="v-liste">${VISION.conditions.map((c) => `<div class="li">→ ${ech(court(c, 170))}</div>`).join('')}</div>
    <div class="v-sous">SCÉNARIOS 2040</div>
    <div class="v-liste">${s.map((x) => `<div class="li">${x.recommande ? '★' : '○'} <b>${ech(x.nom)}</b> — ${ech(x.population || '')}<br><span class="k">MOTEUR</span> ${ech(court(x.moteur || '', 150))}<br><span class="k">RISQUE</span> ${ech(court(x.risque || '', 150))}</div>`).join('')}</div>
    <div class="v-sous">FRAGILITÉS DU CALENDRIER (${VISION.fragilites.length})</div>
    <div class="v-liste">${VISION.fragilites.map((f) => `<div class="li">⚠️ <b>${ech(f.fragilite)}</b> — ${ech(court(f.detail, 170))}${f.marqueurs.length ? ' ' + f.marqueurs.join('') : ''}</div>`).join('')}</div>
    <div class="v-sous">SIGNAUX FAIBLES À SURVEILLER</div>
    <div class="v-liste">${VISION.signaux.map((x) => `<div class="li">👁 ${ech(x)}</div>`).join('')}</div>`;
}

/** 📡 La veille : ce qu'on peut brancher, et à quelles conditions. */
function panneauVeille() {
  const plan = planDeBranchement();
  return `<div class="v-grille">${Object.entries(plan.parFamille).map(([famille, liste]) => `<span class="k">${ech((FAMILLES_VEILLE[famille] || {}).ic || '')} ${ech((FAMILLES_VEILLE[famille] || {}).nom || famille)}</span><span class="v">${liste.length}</span>`).join('')}</div>
    <div class="v-sous">SOURCES AVEC API (${SOURCES_VEILLE.filter((s) => s.api).length})</div>
    <div class="v-liste">${SOURCES_VEILLE.filter((s) => s.api).map((s) => `<div class="li">🔌 <a href="${ech(s.url)}" target="_blank" rel="noopener">${ech(s.nom)}</a> — <span class="k">${ech(court(s.api, 70))}</span><br>${ech(court(s.donnees, 170))}<br><span class="k">USAGE</span> ${ech(court(s.usage, 140))} <i>(vérifié le ${ech(s.verifieLe)})</i></div>`).join('')}</div>
    <div class="v-sous">À BRANCHER (${plan.avecApi} avec API connue sur ${plan.total} identifiées)</div>
    <div class="v-note">Chaque source porte sa date de vérification : le 07/10/2026 pour celles revues en ligne,
    le 08/09/2026 pour celles héritées du dossier territorial. Une source sans date n'entre pas ici.</div>`;
}

/** 📚 Le registre des sources du dossier (annexe A). */
function panneauSources() {
  const parFamille = SOURCES.reduce((m, s) => ({ ...m, [s.famille]: (m[s.famille] || 0) + 1 }), {});
  return `<div class="v-grille">${Object.entries(parFamille).map(([f, n]) => `<span class="k">${ech(f)}</span><span class="v">${n} sources</span>`).join('')}</div>
    <div class="v-sous">LES SOURCES DU DOSSIER (${SOURCES.length})</div>
    <div class="v-liste">${SOURCES.slice(0, 40).map((s) => `<div class="li">📄 <a href="${ech(s.url)}" target="_blank" rel="noopener">${ech(court(s.libelle, 64))}</a> — ${ech(court(s.contenu, 110))}${s.date ? ' <i>(' + ech(s.date) + ')</i>' : ''}</div>`).join('')}</div>
    <div class="v-note">${SOURCES.length - 40} autres sources sont dans la base complète
    (${ech(CONTRAT.destinations[0])}).</div>`;
}

/** 🏗 Le gabarit de pièces d'un dossier de chantier (220 fichiers réels). */
function panneauChantier() {
  const s = statistiquesChantier();
  const gabarit = gabaritFiche();
  return `<div class="v-grille">
      <span class="k">INVENTAIRE</span><span class="v">${fr(s.fichiers)} fichiers · ${fr(s.poidsMo)} Mo · ${s.categories} catégories</span>
      <span class="k">GABARIT</span><span class="v">${s.piecesPresentes}/${s.piecesAttendues} pièces du dossier de référence (${s.couverturePct} %)</span>
    </div>
    <div class="v-note">Un dossier de chantier public réel, pièce par pièce : c'est le gabarit de la
    fiche CHANTIER de l'INTEL. Quand un chantier est décrit, ces 27 pièces disent ce qui doit exister —
    et ce qui manque se voit tout de suite.</div>
    ${gabarit.map((g) => `<div class="v-sous">${ech(g.phase.toUpperCase())} — ${g.presentes}/${g.total}</div>
      <div class="v-liste">${g.pieces.map((p) => `<div class="li">${p.presente ? '✅' : '⬜'} <b>${ech(p.nom)}</b>${p.nombre ? ' <i>(' + p.nombre + ')' + '</i>' : ''}<br>
        <span class="k">${ech(p.exemples.slice(0, 2).join(' · ') || 'aucun fichier correspondant')}</span></div>`).join('')}</div>`).join('')}
    <div class="v-sous">CATÉGORIES DE L'INVENTAIRE</div>
    <div class="v-grille">${CATEGORIES_CHANTIER.map((c) => `<span class="k">${ech(c.nom.slice(0, 40))}</span><span class="v">${c.fichiers} fichiers · ${String(c.tailleMo ?? '—').replace('.', ',')} Mo</span>`).join('')}</div>
    <div class="v-sous">LES PLUS GROS FICHIERS (là où sont les plans)</div>
    <div class="v-liste">${plusGrosFichiers(6).map((f) => `<div class="li">📄 ${ech(court(f.nom, 70))} — ${String(f.tailleMo).replace('.', ',')} Mo <span class="k">(${ech(f.categorie.slice(0, 26))})</span></div>`).join('')}</div>
    <div class="v-note">${ech(resumeChantier())} — inventaire de fichiers, pas contrôle de conformité.</div>`;
}

/** ⚖️ Le registre de preuves : méthode Talbot appliquée à la base territoriale. */
function panneauClaims() {
  const r = registreClaims();
  const parStatut = Object.entries(STATUTS_PREUVE)
    .map(([cle, meta]) => ({ cle, ...meta, nombre: r.parStatut[cle] || 0 }))
    .filter((x) => x.nombre > 0);
  const contredits = r.claims.filter((c) => c.statut === 'contredit');
  const inconnus = r.claims.filter((c) => c.statut === 'inconnu');
  return `<div class="v-grille">${parStatut.map((x) => `<span class="k">${x.ic} ${x.nom}</span><span class="v"><b>${x.nombre}</b> — ${ech(x.quoi)}</span>`).join('')}
      <span class="k">AVEC SOURCE</span><span class="v">${r.avecSource} sur ${r.total}</span>
      <span class="k">SANS SOURCE</span><span class="v">${r.sansSource} (lacunes et budgets non publiés, assumés)</span>
    </div>
    <div class="v-note">${ech(resumeClaims())}. Principe repris de la synthèse Talbot :
    <b>aucune affirmation n'est présentée comme établie si elle n'a pas été vérifiée</b> — et une
    contradiction se publie avec son arbitrage, jamais en la supprimant.</div>
    <div class="v-sous">AFFIRMATIONS CONTREDITES ET ARBITRAGE RETENU (${contredits.length})</div>
    <div class="v-liste">${contredits.map((c) => `<div class="li">⚖️ <b>${ech(court(c.assertion, 170))}</b><br>
      <span class="k">RETENU</span> ${ech(court(c.arbitrage || '—', 190))}</div>`).join('')}</div>
    <div class="v-sous">CE QUE PERSONNE N'A PUBLIÉ (${inconnus.length})</div>
    <div class="v-liste">${inconnus.map((c) => `<div class="li">🕳 ${ech(court(c.assertion, 170))}${c.angleMort ? ' <b>← angle mort n°1</b>' : ''}</div>`).join('')}</div>`;
}

const PANNEAUX = Object.freeze({
  projets: panneauProjets,
  chiffres: panneauChiffres,
  communes: panneauCommunes,
  lacunes: panneauLacunes,
  futur: panneauFutur,
  veille: panneauVeille,
  sources: panneauSources,
  chantier: panneauChantier,
  claims: panneauClaims,
});

/** Déclenche le téléchargement d'un contenu déjà calculé (aucun réseau). */
function telecharger(nom, contenu, type = 'application/octet-stream') {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;
  try {
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

/** Les boutons d'export : JSON (pour les autres branches) et CSV (pour un tableur). */
function brancherExports(zone) {
  const act = zone.querySelector('[data-export]');
  if (!act) return;
  act.addEventListener('click', (e) => {
    const type = e.target?.dataset?.export;
    if (!type) return;
    if (type === 'json') telecharger('watchtower-intel.json', JSON.stringify(versJson({ genereLe: new Date().toISOString().slice(0, 10) }), null, 1), 'application/json');
    else if (type === 'csv-projets') telecharger('projets.csv', versCsv('projets'), 'text/csv');
    else if (type === 'csv-communes') telecharger('communes-thau.csv', versCsv('communes'), 'text/csv');
    else if (type === 'csv-tout') {
      const tous = tousLesCsv();
      telecharger('intel-csv.txt', Object.entries(tous).map(([n, c]) => '# ===== ' + n + ' =====\n' + c).join('\n'), 'text/plain');
    }
  });
}

/**
 * Rend la vue DOSSIER dans le conteneur de la fenêtre INTEL.
 * @param {HTMLElement} c conteneur de vue (`.wti-vue`)
 */
export async function rendreDossier(c) {
  const zone = c.querySelector('.v-contenu');
  if (!zone) return;
  zone.innerHTML = enteteDossier() + friseDossier()
    + `<div class="v-actions" data-onglets>${ONGLETS_DOSSIER.map((o, i) => `<button data-onglet="${o.cle}" class="${i === 0 ? 'actif' : ''}">${o.ic} ${o.nom}</button>`).join('')}</div>
       <div class="v-actions" data-export>
         <button data-export="json">⬇ JSON (contrat)</button>
         <button data-export="csv-projets">⬇ projets.csv</button>
         <button data-export="csv-communes">⬇ communes.csv</button>
         <button data-export="csv-tout">⬇ tous les CSV</button>
       </div>
       <div data-panneau></div>`;

  const poser = (cle) => {
    const panneau = zone.querySelector('[data-panneau]');
    const onglet = ONGLETS_DOSSIER.find((o) => o.cle === cle) || ONGLETS_DOSSIER[0];
    const rendu = PANNEAUX[onglet.cle];
    panneau.innerHTML = `<div class="v-sous">${onglet.ic} ${onglet.nom} — ${onglet.quoi}</div>`
      + (rendu ? rendu() : '<div class="v-note">Panneau indisponible.</div>');
    for (const b of zone.querySelectorAll('[data-onglet]')) b.classList.toggle('actif', b.dataset.onglet === onglet.cle);
  };

  zone.querySelector('[data-onglets]')?.addEventListener('click', (e) => {
    const cle = e.target?.dataset?.onglet;
    if (cle) poser(cle);
  });
  brancherExports(zone);
  poser('projets');

  const fil = document.createElement('div');
  fil.className = 'v-note';
  fil.textContent = resumeIntel();
  zone.appendChild(fil);
  return true;
}

/** Les dépêches locales du dossier (aucun réseau) — pour un fil hors ligne. */
export function depechesDossier() {
  const e = etatTerritoire();
  const l = lacunesOuvertes();
  return [
    { ic: '🏛', titre: 'Frontignan la Peyrade', detail: fr(e.commune.population) + ' hab. · ' + e.commune.rangAgglo + 'ᵉ de l’agglo', url: 'https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108', categorie: 'dossier' },
    { ic: '🏗', titre: e.projets.total + ' projets au dossier', detail: e.projets.montantsCites.length + ' avec montant public', url: SOURCES[0]?.url || null, categorie: 'dossier' },
    { ic: '🕳', titre: l.total + ' lacunes publiées', detail: l.angleMort.length + ' angle(s) mort(s) — à demander', url: null, categorie: 'dossier' },
    { ic: '⚠️', titre: 'Risque submersion', detail: chiffre('dommages')?.valeur || '33 % des dommages du bassin (aléa décennal)', url: 'https://www.georisques.gouv.fr/', categorie: 'dossier' },
    { ic: '📡', titre: 'Veille : ' + statistiquesIntel().veille.total + ' sources publiques', detail: planDeBranchement().avecApi + ' avec API connue', url: null, categorie: 'dossier' },
  ];
}
