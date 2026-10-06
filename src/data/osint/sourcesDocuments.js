/**
 * WATCHTOWER — COUCHE OSINT « DOCUMENTS » : retrouver le texte integral d'un
 * document qui semble payant.
 *
 * Le besoin est reel : on tombe sur une etude sur la lagune de Thau, sur un
 * arrete prefectoral ou sur un article de revue, et l'editeur demande 35 €.
 * Dans la grande majorite des cas, une version legale et gratuite EXISTE
 * deja — deposee par l'auteur, par son laboratoire ou par l'administration —
 * mais personne ne va la chercher. C'est ce travail-la que ce module
 * automatise.
 *
 * CE MODULE N'OUVRE QUE DES SOURCES LEGALES : archives ouvertes, depots
 * institutionnels, publications officielles, domaine public. Il ne contient
 * aucun miroir pirate. Une version deposee par l'auteur se cite, s'archive et
 * ne disparait pas du jour au lendemain — c'est aussi, pour de l'OSINT, la
 * seule chaine de provenance defendable.
 *
 * PUR : constructeurs d'URL et normalisation seulement, aucun appel reseau,
 * aucune cle. Les requetes sont faites par l'interface, qui sait ce qui est
 * disponible hors ligne.
 */

/**
 * Registre des sources, de la plus universelle a la plus specialisee.
 *
 *  · `portee` : 'mondial' | 'france' | 'local'
 *  · `genre`  : ce qu'on y trouve
 *  · `parDoi` / `parTexte` : constructeurs d'URL, ou null si non pertinent
 *  · `api`    : point d'entree JSON sans cle, ou null
 *  · `note`   : ce que la source apporte VRAIMENT, pour choisir vite
 */
export const SOURCES_DOCUMENTS = Object.freeze([
  {
    id: 'unpaywall', nom: 'Unpaywall', portee: 'mondial', genre: 'article scientifique',
    parDoi: (doi) => `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=`,
    parTexte: null,
    api: 'https://api.unpaywall.org/v2/',
    note: 'Dit si une version gratuite et LEGALE du DOI existe, et ou. Le premier reflexe. '
      + 'Demande une adresse de courriel en parametre, pas de cle.',
  },
  {
    id: 'openalex', nom: 'OpenAlex', portee: 'mondial', genre: 'article, auteur, institution',
    parDoi: (doi) => `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`,
    parTexte: (q) => `https://api.openalex.org/works?search=${encodeURIComponent(q)}`,
    api: 'https://api.openalex.org/',
    note: 'Catalogue ouvert de 250 M de travaux, successeur de Microsoft Academic. '
      + 'Sans cle, et renvoie directement le lien en acces libre quand il existe.',
  },
  {
    id: 'core', nom: 'CORE', portee: 'mondial', genre: 'texte integral en archive ouverte',
    parDoi: null,
    parTexte: (q) => `https://core.ac.uk/search?q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Agrege le texte integral de milliers de depots universitaires. '
      + 'Utile quand Unpaywall ne trouve rien mais qu’un depot local existe.',
  },
  {
    id: 'hal', nom: 'HAL', portee: 'france', genre: 'publication de la recherche publique',
    parDoi: (doi) => `https://api.archives-ouvertes.fr/search/?q=doiId_s:"${encodeURIComponent(doi)}"&fl=title_s,uri_s,fileMain_s`,
    parTexte: (q) => `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(q)}&fl=title_s,uri_s,fileMain_s`,
    api: 'https://api.archives-ouvertes.fr/search/',
    note: 'Depot national de la recherche francaise. Pour tout ce qui touche '
      + 'l’etang de Thau, l’Ifremer ou les universites de Montpellier, c’est ici qu’on trouve.',
  },
  {
    id: 'theses', nom: 'theses.fr', portee: 'france', genre: 'these de doctorat',
    parDoi: null,
    parTexte: (q) => `https://theses.fr/?q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Toutes les theses soutenues en France, souvent en texte integral. '
      + 'Une these couvre un sujet local bien plus en profondeur qu’un article.',
  },
  {
    id: 'arxiv', nom: 'arXiv', portee: 'mondial', genre: 'preprint sciences exactes',
    parDoi: null,
    parTexte: (q) => `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=20`,
    api: 'https://export.arxiv.org/api/query',
    note: 'Preprints en libre acces. La version auteur precede souvent la version payante.',
  },
  {
    id: 'pmc', nom: 'PubMed Central', portee: 'mondial', genre: 'biologie, sante, environnement',
    parDoi: null,
    parTexte: (q) => `https://www.ncbi.nlm.nih.gov/pmc/?term=${encodeURIComponent(q)}`,
    api: null,
    note: 'Texte integral gratuit en sciences du vivant — pertinent pour la '
      + 'conchyliculture, les malaigues et la qualite des eaux.',
  },
  {
    id: 'doaj', nom: 'DOAJ', portee: 'mondial', genre: 'revue entierement en libre acces',
    parDoi: null,
    parTexte: (q) => `https://doaj.org/search/articles?ref=homepage&q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Annuaire des revues 100 % ouvertes : rien n’y est payant.',
  },
  {
    id: 'openaire', nom: 'OpenAIRE', portee: 'mondial', genre: 'resultats de recherche finances sur fonds publics',
    parDoi: (doi) => `https://api.openaire.eu/search/publications?doi=${encodeURIComponent(doi)}`,
    parTexte: (q) => `https://explore.openaire.eu/search/find?keyword=${encodeURIComponent(q)}`,
    api: 'https://api.openaire.eu/search/publications',
    note: 'Agrege les depots europeens. Un financement public implique '
      + 'generalement une obligation de depot en libre acces.',
  },
  {
    id: 'zenodo', nom: 'Zenodo', portee: 'mondial', genre: 'jeu de donnees, rapport, annexe',
    parDoi: null,
    parTexte: (q) => `https://zenodo.org/search?q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Heberge les donnees et annexes que les revues ne publient pas.',
  },
  {
    id: 'gallica', nom: 'Gallica', portee: 'france', genre: 'archive, presse ancienne, carte',
    parDoi: null,
    parTexte: (q) => `https://gallica.bnf.fr/services/engine/search/sru?operation=searchRetrieve&query=gallica%20all%20%22${encodeURIComponent(q)}%22`,
    api: 'https://gallica.bnf.fr/services/engine/search/sru',
    note: 'Domaine public numerise par la BnF : presse locale ancienne, '
      + 'cartes, cadastres. Irremplacable pour l’histoire d’une commune.',
  },
  {
    id: 'persee', nom: 'Persée', portee: 'france', genre: 'revue de sciences humaines retronumerisee',
    parDoi: null,
    parTexte: (q) => `https://www.persee.fr/search?ta=article&q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Revues francaises anciennes en texte integral et gratuit.',
  },
  {
    id: 'legifrance', nom: 'Légifrance', portee: 'france', genre: 'texte de droit, arrete, decret',
    parDoi: null,
    parTexte: (q) => `https://www.legifrance.gouv.fr/search/all?tab_selection=all&query=${encodeURIComponent(q)}`,
    api: null,
    note: 'Le droit applicable, publie par l’Etat. Un arrete prefectoral '
      + 'revendu par un tiers est ici, gratuitement et en version qui fait foi.',
  },
  {
    id: 'datagouv', nom: 'data.gouv.fr', portee: 'france', genre: 'jeu de donnees public',
    parDoi: null,
    parTexte: (q) => `https://www.data.gouv.fr/api/1/datasets/?q=${encodeURIComponent(q)}`,
    api: 'https://www.data.gouv.fr/api/1/datasets/',
    note: 'Donnees publiques ouvertes, souvent la source primaire des etudes payantes.',
  },
  {
    id: 'boamp', nom: 'BOAMP', portee: 'france', genre: 'marche public',
    parDoi: null,
    parTexte: (q) => `https://www.boamp.fr/pages/recherche/?q=${encodeURIComponent(q)}`,
    api: null,
    note: 'Avis de marches publics : qui depense quoi, pour quel projet, et quand.',
  },
]);

/** Index par identifiant, construit une fois. */
const PAR_ID = new Map(SOURCES_DOCUMENTS.map((s) => [s.id, s]));

/**
 * Un DOI ecrit par un humain arrive sous toutes les formes :
 * « https://doi.org/10.1016/j.marpolbul.2019.01.023 », « doi:10.1016/... »,
 * avec des espaces, en majuscules. On ramene a la forme canonique.
 *
 * @param {string} brut
 * @returns {string} le DOI nu, ou '' si ce n'en est pas un
 */
export function normaliserDoi(brut) {
  const t = String(brut || '').trim().toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '')
    .replace(/\s+/g, '');
  // Un DOI commence par « 10. », un prefixe d'au moins 4 chiffres, puis un suffixe.
  return /^10\.\d{4,9}\/\S+$/.test(t) ? t : '';
}

/**
 * Repere un DOI quelque part dans un texte colle (une reference bibliographique
 * entiere, par exemple).
 * @param {string} texte
 * @returns {string} le premier DOI trouve, ou ''
 */
export function extraireDoi(texte) {
  const m = String(texte || '').match(/10\.\d{4,9}\/[^\s"'<>,;)\]]+/i);
  if (!m) return '';
  // Une reference se termine par un point ou un point-virgule : il appartient
  // a la phrase, pas au DOI. Sans ce nettoyage la resolution echoue.
  return normaliserDoi(m[0].replace(/[.,;:]+$/, ''));
}

/**
 * Ordre d'interrogation. Avec un DOI on sait repondre precisement, donc on
 * commence par les sources qui savent le resoudre ; sans DOI il faut chercher
 * par mots, et les sources francaises passent devant parce que l'application
 * sert un territoire francais.
 *
 * @param {{doi?:string, texte?:string}} requete
 * @returns {object[]} les sources a interroger, dans l'ordre
 */
export function planDeRecherche(requete = {}) {
  const doi = normaliserDoi(requete.doi) || extraireDoi(requete.texte || '');
  if (doi) {
    const avecDoi = SOURCES_DOCUMENTS.filter((s) => s.parDoi);
    const sansDoi = SOURCES_DOCUMENTS.filter((s) => !s.parDoi && s.parTexte);
    return [...avecDoi, ...sansDoi];
  }
  const fr = SOURCES_DOCUMENTS.filter((s) => s.parTexte && s.portee === 'france');
  const reste = SOURCES_DOCUMENTS.filter((s) => s.parTexte && s.portee !== 'france');
  return [...fr, ...reste];
}

/**
 * URL a ouvrir ou a interroger pour une source donnee.
 *
 * @param {string} id Identifiant de la source.
 * @param {{doi?:string, texte?:string}} requete
 * @returns {string} l'URL, ou '' si cette source ne sait pas traiter la requete
 */
export function urlPour(id, requete = {}) {
  const s = PAR_ID.get(id);
  if (!s) return '';
  const doi = normaliserDoi(requete.doi) || extraireDoi(requete.texte || '');
  if (doi && s.parDoi) return s.parDoi(doi);
  const texte = String(requete.texte || '').trim();
  if (texte && s.parTexte) return s.parTexte(texte);
  return '';
}

/**
 * Sources utiles pour un sujet LOCAL — c'est le cas d'usage reel de
 * l'application : une etude sur la lagune, un arrete municipal, une these sur
 * la conchyliculture.
 * @returns {object[]}
 */
export function sourcesFrancaises() {
  return SOURCES_DOCUMENTS.filter((s) => s.portee === 'france');
}
