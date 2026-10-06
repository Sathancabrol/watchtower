/**
 * WATCHTOWER — BASE LOCALE FRONTIGNAN (amorçage, données pures).
 *
 * ⚠️ CE FICHIER EST UN AMORÇAGE, PAS UNE ENCYCLOPÉDIE.
 *
 * Il contient (a) le REGISTRE DES SOURCES et (b) des fiches réelles au niveau
 * de complétude 1-2, volontairement limitées à ce qui est vérifiable par un
 * tiers (un lieu public connu, une source officielle, une coordonnée
 * approximative assumée). Le reste se remplit par IMPORT :
 *
 *   · guide municipal des associations (millésime)  → associations
 *   · agenda culturel / saison                       → événements
 *   · plans d'exploitants + DT-DICT                  → réseaux
 *   · délibérations, DECP, presse locale             → transformations
 *   · archives municipales, cartes postales          → médias
 *
 * Chaque fiche porte `confiance` ET `source_id`. Une fiche inventée ne rend
 * service à personne : le module préfère afficher « à importer ».
 */

/** Types de lieux, repris de la taxonomie du schéma (`attributsTerritoire.js`). */
export const CATEGORIES_POI = Object.freeze({
  nature: ['etang', 'lagune', 'salin', 'zone_humide', 'massif', 'garrigue', 'parc', 'jardin', 'sentier', 'plage', 'lido'],
  eau_littoral: ['canal', 'quai', 'port_maritime', 'halte_fluviale', 'pont', 'passerelle', 'zone_baignade', 'poste_refoulement', 'bassin_retention'],
  patrimoine: ['monument_historique', 'eglise', 'chapelle', 'musee', 'archives', 'halles', 'chai', 'friche_industrielle', 'site_archeologique', 'lieu_memoire'],
  culture: ['cinema', 'salle_spectacle', 'centre_culturel', 'mediatheque', 'conservatoire', 'galerie', 'tiers_lieu', 'atelier_artistique'],
  education: ['creche', 'ecole_maternelle', 'ecole_elementaire', 'groupe_scolaire', 'college', 'lycee', 'centre_formation', 'accueil_periscolaire'],
  commerce: ['marche', 'halle_marchande', 'boulangerie', 'patisserie', 'restaurant', 'cafe', 'cave', 'poissonnerie', 'pharmacie', 'artisan', 'zone_activites'],
  sante_social: ['centre_social', 'ccas', 'maison_seniors', 'cabinet_medical', 'aide_alimentaire', 'acces_aux_droits'],
  sports_loisirs: ['centre_nautique', 'piscine', 'gymnase', 'terrain_sport', 'skatepark', 'aire_jeux', 'randonnee', 'vtt', 'plongee', 'peche', 'voile', 'paddle', 'canoe', 'joutes'],
  mobilite: ['gare', 'arret_bus', 'parking', 'parking_velo', 'borne_recharge', 'piste_cyclable', 'cheminement_pieton', 'pole_multimodal', 'voirie'],
  administration: ['mairie', 'service_public', 'police', 'poste', 'equipement_technique', 'office_tourisme'],
});

/**
 * Registre des sources — priorité 1 (ville), 2 (intercommunalité / national),
 * 3 (collaboratif / presse). `fiabilite` est une APPRÉCIATION, pas une mesure.
 */
export const SOURCES = Object.freeze([
  { id: 'src_import_utilisateur', titre: 'Fichier importé — transmis par un utilisateur', url: 'https://github.com/Sathancabrol/watchtower', type_source: 'import_utilisateur', editeur: 'non qualifié', licence: 'à préciser', fiabilite: 2, notes: 'Source par DÉFAUT de tout import : un fichier transmis n’est pas une preuve. Son origine précise (producteur, date) doit être saisie au fur et à mesure ; tant qu’elle ne l’est pas, les fiches restent « à vérifier » et la lentille le dit.' },
  { id: 'src_frontignan_officiel', titre: 'Ville de Frontignan la Peyrade — site officiel', url: 'https://www.frontignan.fr/', type_source: 'site_officiel', editeur: 'Ville de Frontignan', licence: 'non précisée', fiabilite: 5, notes: 'Équipements, écoles, agenda, urbanisme, vie associative.' },
  { id: 'src_frontignan_agenda', titre: 'Agenda culturel de Frontignan la Peyrade', url: 'https://www.frontignan.fr/', type_source: 'site_officiel', editeur: 'Ville de Frontignan', fiabilite: 4, notes: 'Source du calendrier des événements ; les fiches d’agenda se périment vite.' },
  { id: 'src_guide_associations', titre: 'Guide des associations (millésime municipal)', url: 'https://www.frontignan.fr/', type_source: 'site_officiel', editeur: 'Ville de Frontignan', fiabilite: 4, notes: 'Annuaire associatif : domaines, contacts, lieux de pratique. À importer par millésime.' },
  { id: 'src_agglopole', titre: 'Sète Agglopôle Méditerranée', url: 'https://www.agglopole.fr/', type_source: 'site_officiel', editeur: 'Sète Agglopôle Méditerranée', fiabilite: 5, notes: 'Eau, assainissement, déchets, transports, médiathèques, marchés.' },
  { id: 'src_insee', titre: 'INSEE — dossier complet de la commune', url: 'https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108', type_source: 'registre_officiel', editeur: 'INSEE', licence: 'Licence Ouverte', fiabilite: 5, notes: 'Population légale, logement, emploi, revenus.' },
  { id: 'src_banatic', titre: 'BANATIC — base nationale de l’intercommunalité', url: 'https://www.banatic.interieur.gouv.fr/', type_source: 'registre_officiel', editeur: 'Ministère de l’Intérieur', licence: 'Licence Ouverte', fiabilite: 5, notes: 'Périmètre, communes membres, sièges, compétences.' },
  { id: 'src_georisques', titre: 'Géorisques', url: 'https://www.georisques.gouv.fr/', type_source: 'registre_officiel', editeur: 'Ministère de la Transition écologique', licence: 'Licence Ouverte', fiabilite: 5, notes: 'Inondation, submersion, séisme, mouvements de terrain, ICPE, sols pollués.' },
  { id: 'src_geoportail', titre: 'Géoportail / IGN', url: 'https://www.geoportail.gouv.fr/', type_source: 'open_data', editeur: 'IGN', licence: 'Licence Ouverte', fiabilite: 5, notes: 'Orthophotos, plan IGN, remonter le temps, couches environnement.' },
  { id: 'src_cadastre', titre: 'Cadastre Etalab', url: 'https://cadastre.data.gouv.fr/', type_source: 'open_data', editeur: 'DGFiP / Etalab', licence: 'Licence Ouverte', fiabilite: 4, notes: 'Parcelles (PCI) — pour la descente parcelle par parcelle.' },
  { id: 'src_osm', titre: 'OpenStreetMap (Overpass)', url: 'https://www.openstreetmap.org/', type_source: 'base_collaborative', editeur: 'Contributeurs OSM', licence: 'ODbL', fiabilite: 3, notes: 'Géométries, équipements, commerces. À recouper : la base est collaborative.' },
  { id: 'src_pop', titre: 'POP — plateforme ouverte du patrimoine (base Mérimée)', url: 'https://www.pop.culture.gouv.fr/', type_source: 'registre_officiel', editeur: 'Ministère de la Culture', licence: 'Licence Ouverte', fiabilite: 5, notes: 'Protections, inventaire général, dossiers documentaires.' },
  { id: 'src_annuaire_entreprises', titre: 'Annuaire des entreprises', url: 'https://annuaire-entreprises.data.gouv.fr/', type_source: 'registre_officiel', editeur: 'DINUM / INSEE', licence: 'Licence Ouverte', fiabilite: 5, notes: 'SIREN, activité (NAF), adresse, effectif — pour la lentille ÉCONOMIE.' },
  { id: 'src_decp', titre: 'DECP — marchés publics (données essentielles)', url: 'https://data.economie.gouv.fr/', type_source: 'open_data', editeur: 'DGFiP / data.economie.gouv.fr', licence: 'Licence Ouverte', fiabilite: 4, notes: 'Titulaires, montants, dates : la matière première des CHANTIERS.' },
  { id: 'src_transport_data', titre: 'transport.data.gouv.fr (GTFS / GTFS-RT)', url: 'https://transport.data.gouv.fr/', type_source: 'open_data', editeur: 'DINUM', licence: 'Licence Ouverte', fiabilite: 4, notes: 'Horaires théoriques et temps réel des réseaux de bus et de cars.' },
  { id: 'src_archipel_thau', titre: 'Office de tourisme Archipel de Thau', url: 'https://www.archipel-thau.com/', type_source: 'site_officiel', editeur: 'Office de tourisme intercommunal', fiabilite: 4, notes: 'Plages, nautisme, visites, fêtes — utile pour la lentille CULTURE et le littoral.' },
  { id: 'src_archives_municipales', titre: 'Archives municipales de Frontignan', url: 'https://www.frontignan.fr/', type_source: 'archive', editeur: 'Ville de Frontignan', fiabilite: 4, notes: 'Délibérations, cartes postales, photographies anciennes — pour la lentille TEMPS.' },
  { id: 'src_observatoire_dt_dic', titre: 'Observatoire national DT-DICT', url: 'https://www.observatoire-national-dt-dict.fr/', type_source: 'rapport', editeur: 'Observatoires DT-DICT', fiabilite: 5, notes: 'Endommagements de réseaux, retours d’expérience, bonnes pratiques.' },
  { id: 'src_inrs', titre: 'INRS — santé et sécurité au travail (BTP, réseaux)', url: 'https://www.inrs.fr/', type_source: 'rapport', editeur: 'INRS', fiabilite: 5, notes: 'Risques, presque-accidents, fiches de prévention.' },
  { id: 'src_oppbtp', titre: 'OPPBTP / PreventionBTP', url: 'https://www.preventionbtp.fr/', type_source: 'rapport', editeur: 'OPPBTP', fiabilite: 5, notes: 'Métiers, modes opératoires, retours d’expérience terrain.' },
  { id: 'src_cerema', titre: 'Cerema', url: 'https://www.cerema.fr/', type_source: 'rapport', editeur: 'Cerema', fiabilite: 5, notes: 'Voirie, réseaux, patrimoine d’infrastructure, adaptation au climat.' },
]);

/** Index rapide source_id → source. */
export const SOURCE_PAR_ID = Object.freeze(
  Object.fromEntries(SOURCES.map((s) => [s.id, s])),
);

/** Retourne une source du registre, ou null. */
export function source(id) {
  return SOURCE_PAR_ID[id] || null;
}

/**
 * Points d'intérêt d'amorçage. `precision_m` dit l'honnêteté de la position :
 * ~250 m pour un toponyme, ~50 m pour un bâtiment public identifié.
 */
export const POIS = Object.freeze([
  { id: 'poi_frontignan_mairie', nom: 'Mairie de Frontignan la Peyrade', type_objet: 'mairie', categorie: 'administration', quartier: 'Cœur de ville / Anatole-France', lat: 43.4480, lon: 3.7560, precision_m: 50, statut: 'active', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'Hôtel de ville — siège de l’agglomération à la même adresse (4 avenue d’Aigues).' },
  { id: 'poi_frontignan_halles', nom: 'Halles municipales', type_objet: 'halle_marchande', categorie: 'commerce', quartier: 'Cœur de ville / Anatole-France', lat: 43.4476, lon: 3.7571, precision_m: 60, statut: 'active', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'Marché couvert du centre ancien — commerces de détail et produits de la lagune.' },
  { id: 'poi_frontignan_eglise_saint_paul', nom: 'Église Saint-Paul', type_objet: 'eglise', categorie: 'patrimoine', quartier: 'Cœur de ville / Anatole-France', lat: 43.4474, lon: 3.7554, precision_m: 60, statut: 'active', confiance: 'à vérifier', source_id: 'src_pop', description_courte: 'Église du centre ancien — élément du noyau historique viticole.' },
  { id: 'poi_frontignan_gare', nom: 'Gare de Frontignan', type_objet: 'gare', categorie: 'mobilite', quartier: 'Les Vignaux / Europe', lat: 43.4453, lon: 3.7509, precision_m: 80, statut: 'active', confiance: 'à vérifier', source_id: 'src_transport_data', description_courte: 'Ligne Montpellier — Sète — Narbonne ; porte d’entrée ferroviaire du territoire.' },
  { id: 'poi_frontignan_port', nom: 'Port de plaisance de Frontignan', type_objet: 'port_maritime', categorie: 'eau_littoral', quartier: 'Frontignan-Plage', lat: 43.4290, lon: 3.7990, precision_m: 300, statut: 'active', confiance: 'à vérifier', source_id: 'src_archipel_thau', description_courte: 'Port de plaisance et de pêche à l’interface entre le canal, l’étang d’Ingril et la mer.' },
  { id: 'poi_frontignan_plage', nom: 'Frontignan-Plage', type_objet: 'plage', categorie: 'nature', quartier: 'Frontignan-Plage', lat: 43.4255, lon: 3.8055, precision_m: 700, statut: 'active', confiance: 'documenté', source_id: 'src_archipel_thau', description_courte: 'Front de mer : plages, centres nautiques, commerces saisonniers.' },
  { id: 'poi_frontignan_etang_ingril', nom: 'Étang d’Ingril', type_objet: 'lagune', categorie: 'nature', quartier: 'Frontignan-Plage', lat: 43.4370, lon: 3.8150, precision_m: 900, statut: 'active', confiance: 'documenté', source_id: 'src_geoportail', description_courte: 'Lagune littorale : roselière, avifaune, kitesurf ; qualité d’eau suivie.' },
  { id: 'poi_frontignan_canal', nom: 'Canal du Rhône à Sète (traverse Frontignan)', type_objet: 'canal', categorie: 'eau_littoral', quartier: 'Cœur de ville / Anatole-France', lat: 43.4428, lon: 3.7560, precision_m: 400, statut: 'active', confiance: 'documenté', source_id: 'src_geoportail', description_courte: 'Canal structurant : quais, navigation, connexion des lagunes.' },
  { id: 'poi_frontignan_gardiole', nom: 'Massif de la Gardiole (versant Frontignan)', type_objet: 'massif', categorie: 'nature', quartier: 'Carrières / Les Deux Pins', lat: 43.4650, lon: 3.7450, precision_m: 900, statut: 'active', confiance: 'documenté', source_id: 'src_geoportail', description_courte: 'Garrigue et pinède en grande partie protégée ; risque incendie estival.' },
  { id: 'poi_frontignan_salins', nom: 'Salins et zones humides', type_objet: 'salin', categorie: 'nature', quartier: 'Frontignan-Plage', lat: 43.4450, lon: 3.8150, precision_m: 900, statut: 'active', confiance: 'à vérifier', source_id: 'src_geoportail', description_courte: 'Anciens salins : gestion hydraulique, zones d’accueil de l’avifaune.' },
  { id: 'poi_frontignan_centre_nautique', nom: 'Centre nautique (base de voile)', type_objet: 'centre_nautique', categorie: 'sports_loisirs', quartier: 'Frontignan-Plage', lat: 43.4282, lon: 3.8004, precision_m: 400, statut: 'active', confiance: 'rapporté', source_id: 'src_archipel_thau', description_courte: 'Voile, paddle, canoë — un des points de départ nautiques de la commune.' },
  { id: 'poi_frontignan_pielles', nom: 'Écoquartier des Pielles (site en transformation)', type_objet: 'friche_industrielle', categorie: 'patrimoine', quartier: 'Crozes / Pielles', lat: 43.4535, lon: 3.7420, precision_m: 500, statut: 'projet', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'La requalification des Pielles est un des grands chantiers d’aménagement de la ville ; à documenter projet par projet.' },
  { id: 'poi_frontignan_terres_blanches', nom: 'Groupe scolaire des Terres Blanches', type_objet: 'groupe_scolaire', categorie: 'education', quartier: 'Terres Blanches', lat: 43.4557, lon: 3.7685, precision_m: 300, statut: 'active', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'École du quartier des Terres Blanches — sujette aux travaux de confort d’été et de rénovation énergétique.' },
  { id: 'poi_frontignan_anatole_france', nom: 'École Anatole-France', type_objet: 'ecole_elementaire', categorie: 'education', quartier: 'Cœur de ville / Anatole-France', lat: 43.4488, lon: 3.7590, precision_m: 200, statut: 'active', confiance: 'rapporté', source_id: 'src_archives_municipales', description_courte: 'École du centre ancien — un siècle de vie scolaire documenté par les archives municipales.' },
  { id: 'poi_frontignan_mediatheque', nom: 'Médiathèque / lieu de lecture', type_objet: 'mediatheque', categorie: 'culture', quartier: 'Crozes / Pielles', lat: 43.4522, lon: 3.7444, precision_m: 400, statut: 'active', confiance: 'à vérifier', source_id: 'src_agglopole', description_courte: 'Réseau de lecture de l’agglomération — à rattacher au bon lieu après vérification.' },
  { id: 'poi_frontignan_la_peyrade', nom: 'La Peyrade — quartier en renouvellement urbain', type_objet: 'centre_social', categorie: 'sante_social', quartier: 'La Peyrade / Méreville', lat: 43.4334, lon: 3.7408, precision_m: 500, statut: 'active', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'Quartier historique entre Frontignan et Sète : équipements publics, renouvellement urbain, vie associative.' },
  { id: 'poi_frontignan_mas_de_chave', nom: 'Mas de Chave (équipements de quartier)', type_objet: 'terrain_sport', categorie: 'sports_loisirs', quartier: 'Mas de Chave', lat: 43.4420, lon: 3.7330, precision_m: 500, statut: 'active', confiance: 'à vérifier', source_id: 'src_frontignan_officiel', description_courte: 'Quartier d’équipements sportifs et de loisirs à l’ouest de la ville.' },
  { id: 'poi_frontignan_zones_activites', nom: 'Zones d’activités (périphérie)', type_objet: 'zone_activites', categorie: 'commerce', quartier: 'Barnier', lat: 43.4360, lon: 3.7480, precision_m: 700, statut: 'active', confiance: 'à vérifier', source_id: 'src_annuaire_entreprises', description_courte: 'Tissu économique de périphérie : à inventorier via le registre des entreprises.' },
]);

/**
 * Associations — TROIS MODÈLES de fiches pour montrer comment le guide
 * municipal se branche (domaines, lieu de pratique, publics). Les noms sont
 * donnés pour l'EXEMPLE : ils doivent être confirmés par le guide en cours.
 */
export const ASSOCIATIONS = Object.freeze([
  { id: 'asso_jouteurs_frontignan', nom: 'Société des jouteurs frontignanais', domaines: ['culture', 'sport'], sous_domaines: ['joutes_languedociennes', 'nautisme'], commune: 'Frontignan', lieu_activite: 'poi_frontignan_canal', publics: ['tous'], statut: 'active', confiance: 'à vérifier', source_id: 'src_guide_associations' },
  { id: 'asso_nature_thau', nom: 'Association de protection de la nature (groupe local)', domaines: ['environnement', 'education'], sous_domaines: ['oiseaux', 'biodiversite', 'littoral'], commune: 'Frontignan', lieu_activite: 'poi_frontignan_etang_ingril', publics: ['adultes', 'familles', 'scolaires'], statut: 'active', confiance: 'à vérifier', source_id: 'src_guide_associations' },
  { id: 'asso_aviron_rame', nom: 'Club d’aviron / rame traditionnelle', domaines: ['sport', 'nautisme', 'patrimoine'], sous_domaines: ['rame', 'patrimoine_industriel'], commune: 'Frontignan', lieu_activite: 'poi_frontignan_canal', publics: ['jeunes', 'adultes'], statut: 'active', confiance: 'à vérifier', source_id: 'src_guide_associations' },
  { id: 'asso_patrimoine_viticole', nom: 'Association de valorisation du patrimoine viticole', domaines: ['patrimoine', 'culture', 'economie'], sous_domaines: ['viticulture', 'oenotourisme'], commune: 'Frontignan', lieu_activite: 'poi_frontignan_halles', publics: ['tous'], statut: 'active', confiance: 'à vérifier', source_id: 'src_guide_associations' },
]);

/**
 * Événements — QUATRE FORMES typiques de la programmation d'une ville
 * littorale. `statut: 'a_confirmer'` est explicite : aucune date n'est
 * inventée ici. Le module les affiche comme des GABARITS tant que l'agenda
 * municipal n'a pas été importé.
 */
export const EVENEMENTS = Object.freeze([
  { id: 'evt_joutes_estivales', nom: 'Joutes languedociennes (saison estivale)', type_evenement: 'joute', themes: ['sport', 'tradition', 'nautisme'], lieux: ['poi_frontignan_canal'], recurrence: 'FREQ=WEEKLY;BYMONTH=6,7,8', statut: 'a_confirmer', gratuit: true, confiance: 'rapporté', source_id: 'src_archipel_thau' },
  { id: 'evt_marche_nocturne_plage', nom: 'Marché nocturne de Frontignan-Plage', type_evenement: 'marche', themes: ['artisanat', 'commerce', 'tourisme'], lieux: ['poi_frontignan_plage'], recurrence: 'FREQ=WEEKLY;BYDAY=WE;BYMONTH=7,8', statut: 'a_confirmer', confiance: 'rapporté', source_id: 'src_frontignan_agenda' },
  { id: 'evt_fete_muscat', nom: 'Fête du Muscat / vignoble', type_evenement: 'festival', themes: ['gastronomie', 'viticulture', 'patrimoine'], lieux: ['poi_frontignan_halles'], recurrence: 'FREQ=YEARLY', statut: 'a_confirmer', confiance: 'à vérifier', source_id: 'src_frontignan_agenda' },
  { id: 'evt_exposition_ecole_anatole', nom: 'Exposition « un siècle d’école » (archives municipales)', type_evenement: 'exposition', themes: ['patrimoine', 'education', 'memoire'], lieux: ['poi_frontignan_anatole_france'], statut: 'a_confirmer', confiance: 'rapporté', source_id: 'src_archives_municipales' },
]);

/**
 * Réseaux techniques — SIX TRONÇONS D'EXEMPLE, un par famille, avec des
 * attributs volontairement INCOMPLETS : ce sont les colonnes à remplir depuis
 * les plans d'exploitants et les DT-DICT. `classe_precision` est la colonne
 * qui décide de la méthode de terrassement.
 */
export const RESEAUX = Object.freeze([
  { id: 'res_eau_potable_centre', famille: 'eau_potable', gestionnaire: 'régie / délégataire (à préciser)', classe_precision: 'inconnue', materiau: 'inconnu', statut_donnee: 'a_importer', confiance: 'à vérifier', source_id: 'src_agglopole' },
  { id: 'res_assainissement_eu_centre', famille: 'assainissement_eu', gestionnaire: 'Sète Agglopôle Méditerranée (compétence assainissement)', classe_precision: 'inconnue', statut_donnee: 'a_importer', confiance: 'rapporté', source_id: 'src_agglopole' },
  { id: 'res_assainissement_ep_pluvial', famille: 'assainissement_ep', gestionnaire: 'commune', classe_precision: 'inconnue', statut_donnee: 'a_importer', confiance: 'rapporté', source_id: 'src_frontignan_officiel' },
  { id: 'res_electricite_bt', famille: 'electricite_bt', gestionnaire: 'Enedis / commune (éclairage public)', classe_precision: 'inconnue', statut_donnee: 'a_importer', confiance: 'rapporté', source_id: 'src_cadastre' },
  { id: 'res_gaz_distribution', famille: 'gaz', gestionnaire: 'GRDF', classe_precision: 'inconnue', statut_donnee: 'a_importer', confiance: 'rapporté', source_id: 'src_cadastre' },
  { id: 'res_telecom_fibre', famille: 'telecom', gestionnaire: 'opérateurs d’infrastructure', classe_precision: 'inconnue', statut_donnee: 'a_importer', confiance: 'rapporté', source_id: 'src_cadastre' },
]);

/**
 * Transformations — quatre chantiers/requalifications connus comme SUJETS,
 * sans budget ni dates inventés : le module les présente comme dossiers à
 * documenter (délibérations, DECP, presse).
 */
export const TRANSFORMATIONS = Object.freeze([
  { id: 'trf_pielles_requalification', nom: 'Requalification des Pielles',  type_transformation: 'rehabilitation', usage_avant: 'friche_industrielle', usage_apres: 'quartier_mixte', statut: 'en_projet', confiance: 'à vérifier', source_id: 'src_frontignan_officiel' },
  { id: 'trf_quais_canal', nom: 'Quais du canal du Rhône à Sète',  type_transformation: 'pietonnisation', usage_avant: 'quai_fonctionnel', usage_apres: 'promenade_amenagee', statut: 'realisee_ou_en_cours', confiance: 'à vérifier', source_id: 'src_frontignan_officiel' },
  { id: 'trf_ecoles_confort_ete', nom: 'Confort d’été des écoles',  type_transformation: 'renovation', usage_avant: 'ecole_energivore', usage_apres: 'ecole_adaptee_climat', statut: 'en_projet', confiance: 'à vérifier', source_id: 'src_frontignan_officiel' },
  { id: 'trf_la_peyrade_renouvellement', nom: 'Renouvellement urbain de La Peyrade',  type_transformation: 'rehabilitation', usage_avant: 'quartier_ancien', usage_apres: 'quartier_requalifie', statut: 'en_projet', confiance: 'à vérifier', source_id: 'src_frontignan_officiel' },
]);

/**
 * Médias — l'axe TEMPS a besoin de couples AVANT / APRÈS. Ce sont des
 * emplacements à alimenter (archives municipales, cartes postales, IGN
 * « remonter le temps »), pas des images embarquées.
 */
export const MEDIAS = Object.freeze([
  { id: 'med_quai_avant', type_media: 'carte_postale', entite_id: 'poi_frontignan_canal', legende: 'Le canal et les quais — avant réaménagement', statut_donnee: 'a_rechercher', confiance: 'à vérifier', source_id: 'src_archives_municipales' },
  { id: 'med_quai_apres', type_media: 'photo', entite_id: 'poi_frontignan_canal', legende: 'Le canal aujourd’hui (promenade, berges)', statut_donnee: 'a_produire', confiance: 'à vérifier', source_id: 'src_geoportail' },
  { id: 'med_plage_avant', type_media: 'photo_historique', entite_id: 'poi_frontignan_plage', legende: 'Frontignan-Plage — station balnéaire', statut_donnee: 'a_rechercher', confiance: 'à vérifier', source_id: 'src_archives_municipales' },
  { id: 'med_ecole_anatole', type_media: 'scan_archive', entite_id: 'poi_frontignan_anatole_france', legende: 'École Anatole-France — cent ans de vie scolaire', statut_donnee: 'a_rechercher', confiance: 'à vérifier', source_id: 'src_archives_municipales' },
]);

/** La base locale complète, prête à être validée par le schéma. */
export const BASE_LOCALE = Object.freeze({
  sources: SOURCES,
  pois: POIS,
  associations: ASSOCIATIONS,
  evenements: EVENEMENTS,
  reseaux: RESEAUX,
  transformations: TRANSFORMATIONS,
  medias: MEDIAS,
});

/** Compte des fiches par table — le bandeau « ce qui est rempli / à importer ». */
export function inventaireBase() {
  return {
    poi: POIS.length,
    associations: ASSOCIATIONS.length,
    evenements: EVENEMENTS.length,
    reseaux: RESEAUX.length,
    transformations: TRANSFORMATIONS.length,
    medias: MEDIAS.length,
    sources: SOURCES.length,
  };
}

/** Nombre de fiches marquées « à vérifier » — la dette de vérification, affichée. */
export function detteVerification() {
  const tables = [
    ['poi', POIS], ['associations', ASSOCIATIONS], ['evenements', EVENEMENTS],
    ['reseaux', RESEAUX], ['transformations', TRANSFORMATIONS], ['medias', MEDIAS],
  ];
  return tables.reduce((n, [, liste]) => n + liste.filter((e) => e.confiance === 'à vérifier').length, 0);
}
