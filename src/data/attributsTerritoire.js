/**
 * WATCHTOWER — ATTRIBUTS DU TERRITOIRE (schéma d'attributs, données pures).
 *
 * Demande d'origine : « structure les attributs pour Frontignan », « ajoute les
 * attributs pour les réseaux techniques », « détaille la structure des
 * événements culturels », « intègre les données du guide des associations ».
 *
 * Ce fichier ne contient AUCUNE donnée locale : c'est le CONTRAT. Il dit
 * quelles colonnes existent, ce qu'elles veulent dire, à partir de quel niveau
 * de complétude elles deviennent obligatoires, et comment valider une fiche
 * avant de l'ajouter à la base cartographique.
 *
 *   1 — CARTOGRAPHIABLE  le minimum pour poser un point sur la carte ;
 *   2 — UTILISABLE       adresse, horaires, contact, accès PMR ;
 *   3 — ENRICHI          activités, relations, photos, saisonnalité, sources ;
 *   4 — TERRITORIAL      risques, transformations, médias historiques, projets ;
 *   5 — JUMEAU LOCAL     observations, capteurs, fréquentation, maintenance.
 *
 * Le module `territoire.js` lit ces définitions pour afficher l'inspecteur,
 * compter la complétude d'une fiche et générer l'en-tête CSV d'export.
 * Testé dans `attributsTerritoire.test.mjs` (aucun DOM, aucun réseau).
 */

/** Les cinq niveaux de complétude — un objet du monde réel se remplit par paliers. */
export const NIVEAUX_COMPLETUDE = Object.freeze([
  { niveau: 1, nom: 'CARTOGRAPHIABLE', aide: 'nom, type, catégorie, coordonnées, statut — la fiche existe sur la carte' },
  { niveau: 2, nom: 'UTILISABLE', aide: 'adresse, horaires, contact, accès PMR, gestionnaire — la fiche sert sur le terrain' },
  { niveau: 3, nom: 'ENRICHI', aide: 'activités, relations, photos, saisonnalité, sources datées' },
  { niveau: 4, nom: 'TERRITORIAL', aide: 'risques, transformations, médias historiques, projets' },
  { niveau: 5, nom: 'JUMEAU LOCAL', aide: 'observations, capteurs, fréquentation, maintenance' },
]);

/** Types de champs acceptés par le validateur. */
export const TYPES_CHAMP = Object.freeze([
  'texte', 'nombre', 'date', 'heure', 'booleen', 'enum', 'liste', 'json', 'geojson', 'url', 'reference', 'duree',
]);

// ───────────────────────── briques de base ─────────────────────────

/** Le socle commun à tout objet cartographiable (niveau 1). */
export const BASE_LOCALISEE = Object.freeze([
  { cle: 'id', libelle: 'Identifiant stable', type: 'texte', niveau: 1, exemple: 'poi_frontignan_halles', aide: 'jamais réutilisé, jamais traduit : `type_commune_objet`' },
  { cle: 'nom', libelle: 'Nom courant', type: 'texte', niveau: 1, exemple: 'Halles municipales' },
  { cle: 'nom_officiel', libelle: 'Nom officiel', type: 'texte', niveau: 2, exemple: 'Halles municipales de Frontignan', aide: 'seulement s’il diffère du nom courant' },
  { cle: 'type_objet', libelle: 'Type précis', type: 'enum', niveau: 1, exemple: 'halle_marchande', taxonomie: 'CATEGORIES_POI', aide: 'voir la taxonomie du type d’entité' },
  { cle: 'categorie', libelle: 'Catégorie racine', type: 'enum', niveau: 1, exemple: 'commerce', taxonomie: 'CATEGORIES_POI' },
  { cle: 'sous_categories', libelle: 'Étiquettes secondaires', type: 'liste', niveau: 3, exemple: ['marche_couvert', 'patrimoine'] },
  { cle: 'commune', libelle: 'Commune', type: 'texte', niveau: 1, exemple: 'Frontignan' },
  { cle: 'code_insee', libelle: 'Code INSEE', type: 'texte', niveau: 1, exemple: '34108' },
  { cle: 'quartier', libelle: 'Quartier / IRIS', type: 'texte', niveau: 2, exemple: 'Cœur de ville / Anatole-France' },
  { cle: 'lat', libelle: 'Latitude', type: 'nombre', niveau: 1, exemple: 43.4480 },
  { cle: 'lon', libelle: 'Longitude', type: 'nombre', niveau: 1, exemple: 3.7560 },
  { cle: 'geometrie', libelle: 'Géométrie (point/ligne/polygone)', type: 'geojson', niveau: 1, exemple: { type: 'Point', coordinates: [3.756, 43.448] }, aide: 'WGS84 (EPSG:4326) ; la géométrie fine remplace lat/lon quand elle existe' },
  { cle: 'precision_m', libelle: 'Précision géométrique (m)', type: 'nombre', niveau: 2, exemple: 25 },
  { cle: 'statut', libelle: 'Statut', type: 'enum', niveau: 1, exemple: 'active', enum: ['active', 'fermee', 'projet', 'historique', 'saisonniere'] },
  { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, exemple: 'documenté', enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
  { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1, exemple: 'src_frontignan_officiel', aide: 'obligatoire : une fiche sans source n’entre pas dans la base' },
  { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2, exemple: '2026-10-06' },
]);

/** Le socle commun à tout objet géré par quelqu’un (niveau 2). */
export const BASE_GESTION = Object.freeze([
  { cle: 'adresse', libelle: 'Adresse', type: 'texte', niveau: 2, exemple: '1 place de la Mairie' },
  { cle: 'code_postal', libelle: 'Code postal', type: 'texte', niveau: 2, exemple: '34110' },
  { cle: 'ouverture', libelle: 'Horaires', type: 'texte', niveau: 2, exemple: 'Ma-Sa 07:00-13:30', aide: 'format lisible ; le format machine (opening_hours OSM) peut vivre en `json_details`' },
  { cle: 'saisonnalite', libelle: 'Saisonnalité', type: 'enum', niveau: 3, exemple: 'toute_annee', enum: ['toute_annee', 'ete', 'hiver', 'printemps', 'automne', 'scolaire', 'evenementiel'] },
  { cle: 'site_web', libelle: 'Site web', type: 'url', niveau: 2, exemple: 'https://www.frontignan.fr/' },
  { cle: 'telephone', libelle: 'Téléphone', type: 'texte', niveau: 2, exemple: '04 67 18 44 00' },
  { cle: 'courriel', libelle: 'Courriel', type: 'texte', niveau: 3 },
  { cle: 'acces_pmr', libelle: 'Accessibilité PMR', type: 'enum', niveau: 2, exemple: 'partiel', enum: ['oui', 'non', 'partiel', 'inconnu'] },
  { cle: 'org_gestionnaire', libelle: 'Gestionnaire', type: 'reference', niveau: 2, exemple: 'org_ville_frontignan' },
  { cle: 'org_proprietaire', libelle: 'Propriétaire', type: 'reference', niveau: 3 },
  { cle: 'tarif_min_eur', libelle: 'Tarif minimum (€)', type: 'nombre', niveau: 3 },
  { cle: 'tarif_max_eur', libelle: 'Tarif maximum (€)', type: 'nombre', niveau: 3 },
  { cle: 'gratuit', libelle: 'Gratuit', type: 'booleen', niveau: 3 },
  { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'le champ « plus tard » : tout ce qui n’a pas encore de colonne propre' },
]);

/** Le socle commun au patrimoine et à la mémoire (niveaux 3-4). */
export const BASE_PATRIMOINE = Object.freeze([
  { cle: 'statut_patrimonial', libelle: 'Statut patrimonial', type: 'enum', niveau: 3, enum: ['classe', 'inscrit', 'inventaire_general', 'remarquable', 'aucun', 'inconnu'] },
  { cle: 'annee_construction', libelle: 'Année de construction', type: 'nombre', niveau: 3, exemple: 1895 },
  { cle: 'architecte', libelle: 'Architecte / maître d’œuvre', type: 'texte', niveau: 4 },
  { cle: 'usage_ancien', libelle: 'Usage ancien', type: 'texte', niveau: 4, exemple: 'chai_viticole' },
  { cle: 'usage_actuel', libelle: 'Usage actuel', type: 'texte', niveau: 3 },
  { cle: 'etat_conservation', libelle: 'État de conservation', type: 'enum', niveau: 4, enum: ['bon', 'moyen', 'degrade', 'ruine', 'restaure'] },
  { cle: 'protection_ref', libelle: 'Référence de protection', type: 'texte', niveau: 4, aide: 'base Mérimée / POP (plateforme ouverte du patrimoine)' },
]);

// ───────────────────────── les types d’entités ─────────────────────────

/**
 * Chaque type d'entité = une TABLE (poi.csv, associations.csv…) avec :
 *  · `cle`   — préfixe d'identifiant ;
 *  · `champs` — colonnes, chacune avec son niveau de complétude.
 * Une fiche est valide dès que ses champs de niveau 1 sont tous remplis.
 */
export const TYPES_ENTITE = Object.freeze({
  poi: {
    nom: 'Lieu / point d’intérêt', icone: '📍', table: 'poi.csv', cle: 'poi',
    champs: [
      ...BASE_LOCALISEE, ...BASE_GESTION,
      { cle: 'description_courte', libelle: 'Description courte', type: 'texte', niveau: 2, exemple: 'Marché couvert de la ville' },
      { cle: 'description_longue', libelle: 'Description longue', type: 'texte', niveau: 3 },
      { cle: 'risques', libelle: 'Risques associés', type: 'liste', niveau: 4, exemple: ['inondation', 'submersion'] },
      ...BASE_PATRIMOINE,
    ],
  },
  organisation: {
    nom: 'Organisation', icone: '🏢', table: 'organisations.csv', cle: 'org',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1, exemple: 'org_ville_frontignan' },
      { cle: 'nom', libelle: 'Nom', type: 'texte', niveau: 1, exemple: 'Ville de Frontignan la Peyrade' },
      { cle: 'raison_sociale', libelle: 'Raison sociale', type: 'texte', niveau: 2 },
      { cle: 'type_org', libelle: 'Type', type: 'enum', niveau: 1, enum: ['collectivite', 'service_public', 'association', 'entreprise', 'commerce', 'ecole', 'sante', 'operateur_culturel', 'club_sportif', 'service_social', 'office_tourisme', 'media', 'collectif'] },
      { cle: 'domaines', libelle: 'Domaines', type: 'liste', niveau: 1, exemple: ['administration', 'culture', 'education'] },
      { cle: 'statut', libelle: 'Statut', type: 'enum', niveau: 1, enum: ['active', 'dissoute', 'sommeil', 'projet'], exemple: 'active' },
      { cle: 'commune', libelle: 'Commune', type: 'texte', niveau: 1, exemple: 'Frontignan' },
      { cle: 'code_insee', libelle: 'Code INSEE', type: 'texte', niveau: 2, exemple: '34108' },
      { cle: 'siren', libelle: 'SIREN / SIRET', type: 'texte', niveau: 2, aide: 'vérifiable dans l’annuaire des entreprises (data.gouv)' },
      { cle: 'adresse', libelle: 'Adresse', type: 'texte', niveau: 2 },
      { cle: 'lat', libelle: 'Latitude', type: 'nombre', niveau: 3 },
      { cle: 'lon', libelle: 'Longitude', type: 'nombre', niveau: 3 },
      { cle: 'site_web', libelle: 'Site web', type: 'url', niveau: 2 },
      { cle: 'telephone', libelle: 'Téléphone', type: 'texte', niveau: 2 },
      { cle: 'courriel', libelle: 'Courriel', type: 'texte', niveau: 2 },
      { cle: 'reseaux_sociaux', libelle: 'Réseaux sociaux', type: 'json', niveau: 3 },
      { cle: 'annee_creation', libelle: 'Année de création', type: 'nombre', niveau: 3 },
      { cle: 'annee_fin', libelle: 'Année de fin', type: 'nombre', niveau: 4 },
      { cle: 'org_parente', libelle: 'Organisation parente', type: 'reference', niveau: 3 },
      { cle: 'confiance', libelle: 'Confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 3 },
    ],
  },
  association: {
    nom: 'Association', icone: '🤝', table: 'associations.csv', cle: 'asso',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1, exemple: 'asso_societe_jouteurs' },
      { cle: 'nom', libelle: 'Nom', type: 'texte', niveau: 1 },
      { cle: 'domaines', libelle: 'Domaines', type: 'liste', niveau: 1, exemple: ['culture', 'sport', 'tradition'] },
      { cle: 'sous_domaines', libelle: 'Sous-domaines', type: 'liste', niveau: 2, exemple: ['joutes_languedociennes'] },
      { cle: 'description', libelle: 'Description', type: 'texte', niveau: 2 },
      { cle: 'commune', libelle: 'Commune', type: 'texte', niveau: 1, exemple: 'Frontignan' },
      { cle: 'adresse', libelle: 'Adresse / siège', type: 'texte', niveau: 2 },
      { cle: 'lieu_activite', libelle: 'Lieu de pratique (POI)', type: 'reference', niveau: 2, exemple: 'poi_frontignan_port', aide: 'relie l’association au lieu : canal, port, gymnase, salle' },
      { cle: 'contact_nom', libelle: 'Contact', type: 'texte', niveau: 2 },
      { cle: 'telephone', libelle: 'Téléphone', type: 'texte', niveau: 2 },
      { cle: 'courriel', libelle: 'Courriel', type: 'texte', niveau: 2 },
      { cle: 'site_web', libelle: 'Site web', type: 'url', niveau: 2 },
      { cle: 'reseaux_sociaux', libelle: 'Réseaux sociaux', type: 'json', niveau: 3 },
      { cle: 'statut', libelle: 'Statut', type: 'enum', niveau: 1, enum: ['active', 'sommeil', 'dissoute', 'projet'] },
      { cle: 'annee_creation', libelle: 'Année de création', type: 'nombre', niveau: 3 },
      { cle: 'adhesion_type', libelle: 'Type d’adhésion', type: 'enum', niveau: 3, enum: ['gratuite', 'payante', 'libre', 'sur_dossier'] },
      { cle: 'publics', libelle: 'Publics', type: 'liste', niveau: 3, exemple: ['enfants', 'adultes', 'seniors', 'familles'] },
      { cle: 'accessibilite', libelle: 'Accessibilité PMR', type: 'enum', niveau: 3, enum: ['oui', 'non', 'partiel', 'inconnu'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1, exemple: 'src_guide_associations', aide: 'guide municipal des associations, millésime en clair' },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  education: {
    nom: 'Établissement scolaire / périscolaire', icone: '🎓', table: 'education.csv', cle: 'edu',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'poi_id', libelle: 'Lieu', type: 'reference', niveau: 1, exemple: 'poi_frontignan_terres_blanches' },
      { cle: 'niveau_scolaire', libelle: 'Niveau', type: 'enum', niveau: 1, enum: ['creche', 'maternelle', 'elementaire', 'primaire', 'college', 'lycee', 'formation', 'periscolaire', 'accueil_loisirs'] },
      { cle: 'type_etablissement', libelle: 'Type', type: 'enum', niveau: 1, enum: ['public', 'prive_sous_contrat', 'prive_hors_contrat', 'municipal', 'intercommunal', 'associatif'] },
      { cle: 'operator_org_id', libelle: 'Gestionnaire', type: 'reference', niveau: 2 },
      { cle: 'effectif', libelle: 'Effectif élèves', type: 'nombre', niveau: 2, aide: 'source : ministère / rectorat, jamais estimé à la main' },
      { cle: 'nb_classes', libelle: 'Nombre de classes', type: 'nombre', niveau: 3 },
      { cle: 'capacite', libelle: 'Capacité', type: 'nombre', niveau: 4 },
      { cle: 'age_min', libelle: 'Âge minimum', type: 'nombre', niveau: 3 },
      { cle: 'age_max', libelle: 'Âge maximum', type: 'nombre', niveau: 3 },
      { cle: 'restauration', libelle: 'Restauration', type: 'booleen', niveau: 2 },
      { cle: 'periscolaire', libelle: 'Périscolaire', type: 'booleen', niveau: 2 },
      { cle: 'equipements_sportifs', libelle: 'Équipements sportifs', type: 'booleen', niveau: 3 },
      { cle: 'renovation_energetique', libelle: 'Rénovation énergétique', type: 'enum', niveau: 4, enum: ['aucune', 'programmee', 'en_cours', 'terminee'], exemple: 'terminee' },
      { cle: 'adaptation_climat', libelle: 'Adaptation climatique', type: 'liste', niveau: 4, exemple: ['photovoltaique', 'cour_vegetalisee', 'desimpermeabilisation', 'brasseurs_air'] },
      { cle: 'acces_pmr', libelle: 'Accessibilité PMR', type: 'enum', niveau: 3, enum: ['oui', 'non', 'partiel', 'inconnu'] },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 3 },
    ],
  },
  commerce: {
    nom: 'Commerce / activité économique', icone: '🛒', table: 'commerce.csv', cle: 'com',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'org_id', libelle: 'Exploitant', type: 'reference', niveau: 2 },
      { cle: 'poi_id', libelle: 'Local', type: 'reference', niveau: 1, aide: 'le LOCAL reste sur la carte même quand le commerce change de mains' },
      { cle: 'type_commerce', libelle: 'Type', type: 'enum', niveau: 1, enum: ['restaurant', 'cafe', 'bar', 'boulangerie', 'patisserie', 'poissonnerie', 'boucherie', 'primeur', 'pharmacie', 'epicerie', 'cave', 'coiffeur', 'barbier', 'serrurerie', 'couture', 'auto_ecole', 'informatique', 'seconde_main', 'reparation', 'marche', 'stand_marche', 'autre'] },
      { cle: 'produits', libelle: 'Produits', type: 'liste', niveau: 3 },
      { cle: 'services', libelle: 'Services', type: 'liste', niveau: 3 },
      { cle: 'produits_locaux', libelle: 'Produits locaux', type: 'booleen', niveau: 3 },
      { cle: 'cuisine', libelle: 'Type de cuisine', type: 'texte', niveau: 3 },
      { cle: 'gamme_prix', libelle: 'Gamme de prix', type: 'enum', niveau: 3, enum: ['€', '€€', '€€€', '€€€€'] },
      { cle: 'date_ouverture', libelle: 'Date d’ouverture', type: 'date', niveau: 3 },
      { cle: 'date_fermeture', libelle: 'Date de fermeture', type: 'date', niveau: 4 },
      { cle: 'poi_precedent', libelle: 'Local précédent', type: 'reference', niveau: 4, aide: 'déménagement : on garde la trace' },
      { cle: 'enseigne_precedente', libelle: 'Enseigne précédente', type: 'texte', niveau: 4 },
      { cle: 'jours_marche', libelle: 'Jours de marché', type: 'liste', niveau: 3, exemple: ['mardi', 'vendredi'] },
      { cle: 'livraison', libelle: 'Livraison', type: 'booleen', niveau: 3 },
      { cle: 'commande_en_ligne', libelle: 'Commande en ligne', type: 'url', niveau: 3 },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  activite: {
    nom: 'Activité proposée', icone: '🎯', table: 'activites.csv', cle: 'act',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'nom', libelle: 'Nom', type: 'texte', niveau: 1, exemple: 'Voile scolaire' },
      { cle: 'type_activite', libelle: 'Type', type: 'enum', niveau: 1, enum: ['baignade', 'voile', 'paddle', 'canoe', 'kitesurf', 'plongee', 'peche_mer', 'peche_lagune', 'joutes', 'randonnee', 'vtt', 'course_a_pied', 'skate', 'lecture', 'atelier_artistique', 'atelier_numerique', 'spectacle', 'visite_guidee', 'degustation_muscat', 'marche', 'atelier_associatif', 'autre'] },
      { cle: 'domaines', libelle: 'Domaines', type: 'liste', niveau: 2 },
      { cle: 'poi_id', libelle: 'Lieu', type: 'reference', niveau: 1 },
      { cle: 'org_id', libelle: 'Organisateur', type: 'reference', niveau: 1 },
      { cle: 'publics', libelle: 'Publics', type: 'liste', niveau: 2 },
      { cle: 'age_min', libelle: 'Âge minimum', type: 'nombre', niveau: 3 },
      { cle: 'age_max', libelle: 'Âge maximum', type: 'nombre', niveau: 3 },
      { cle: 'niveau_requis', libelle: 'Niveau requis', type: 'enum', niveau: 3, enum: ['debutant', 'intermediaire', 'confirme', 'tous'] },
      { cle: 'saisonnalite', libelle: 'Saisonnalité', type: 'enum', niveau: 3, enum: ['toute_annee', 'ete', 'hiver', 'printemps', 'automne', 'scolaire', 'evenementiel'] },
      { cle: 'jours', libelle: 'Jours', type: 'liste', niveau: 3 },
      { cle: 'horaires', libelle: 'Horaires', type: 'texte', niveau: 3 },
      { cle: 'tarif_min_eur', libelle: 'Tarif min (€)', type: 'nombre', niveau: 3 },
      { cle: 'tarif_max_eur', libelle: 'Tarif max (€)', type: 'nombre', niveau: 3 },
      { cle: 'reservation', libelle: 'Réservation', type: 'url', niveau: 3 },
      { cle: 'accessibilite', libelle: 'Accessibilité PMR', type: 'enum', niveau: 3, enum: ['oui', 'non', 'partiel', 'inconnu'] },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  evenement: {
    nom: 'Événement (culturel, sportif, marchand)', icone: '🎭', table: 'evenements.csv', cle: 'evt',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'nom', libelle: 'Nom', type: 'texte', niveau: 1 },
      { cle: 'type_evenement', libelle: 'Type', type: 'enum', niveau: 1, enum: ['festival', 'spectacle', 'concert', 'exposition', 'atelier', 'visite_guidee', 'conference', 'projection', 'marche', 'salon', 'brocante', 'joute', 'competition_sportive', 'ceremonie', 'cinema_plein_air', 'autre'] },
      { cle: 'themes', libelle: 'Thèmes', type: 'liste', niveau: 2, exemple: ['gastronomie', 'viticulture', 'patrimoine'] },
      { cle: 'disciplines', libelle: 'Disciplines / genres', type: 'liste', niveau: 3, exemple: ['cirque', 'danse', 'musique'] },
      { cle: 'description', libelle: 'Description', type: 'texte', niveau: 2 },
      { cle: 'debut', libelle: 'Début', type: 'date', niveau: 1, aide: 'avec heure locale en `heure_debut`' },
      { cle: 'fin', libelle: 'Fin', type: 'date', niveau: 2 },
      { cle: 'heure_debut', libelle: 'Heure de début', type: 'heure', niveau: 3, exemple: '20:30' },
      { cle: 'fuseau', libelle: 'Fuseau horaire', type: 'texte', niveau: 3, exemple: 'Europe/Paris' },
      { cle: 'poi_id', libelle: 'Lieu principal', type: 'reference', niveau: 1 },
      { cle: 'pois_secondaires', libelle: 'Autres lieux', type: 'liste', niveau: 3, aide: 'un festival peut tenir sur plusieurs lieux' },
      { cle: 'org_id', libelle: 'Organisateur', type: 'reference', niveau: 2 },
      { cle: 'partenaires', libelle: 'Partenaires', type: 'liste', niveau: 4 },
      { cle: 'jauge', libelle: 'Jauge (personnes)', type: 'nombre', niveau: 3 },
      { cle: 'prix_eur', libelle: 'Prix (€)', type: 'nombre', niveau: 3 },
      { cle: 'gratuit', libelle: 'Gratuit', type: 'booleen', niveau: 2 },
      { cle: 'billetterie', libelle: 'Billetterie', type: 'url', niveau: 3 },
      { cle: 'publics', libelle: 'Publics visés', type: 'liste', niveau: 3, exemple: ['familles', 'scolaires', 'seniors'] },
      { cle: 'age_min', libelle: 'Âge minimum', type: 'nombre', niveau: 4 },
      { cle: 'acces_pmr', libelle: 'Accessibilité PMR', type: 'enum', niveau: 3, enum: ['oui', 'non', 'partiel', 'inconnu'] },
      { cle: 'recurrence', libelle: 'Récurrence (RRULE)', type: 'texte', niveau: 3, exemple: 'FREQ=YEARLY', aide: 'RFC 5545 : FREQ=WEEKLY;BYDAY=WE;BYMONTH=7,8 pour un marché nocturne d’été' },
      { cle: 'statut', libelle: 'Statut', type: 'enum', niveau: 1, enum: ['programme', 'en_cours', 'termine', 'annule', 'reporte', 'a_confirmer'] },
      { cle: 'source_calendrier', libelle: 'Source du calendrier', type: 'url', niveau: 2 },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  transport: {
    nom: 'Transport / mobilité', icone: '🚌', table: 'transport.csv', cle: 'tra',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'poi_id', libelle: 'Lieu', type: 'reference', niveau: 1 },
      { cle: 'mode', libelle: 'Mode', type: 'enum', niveau: 1, enum: ['train', 'bus', 'car', 'velo', 'marche', 'voiture', 'bateau', 'navette_maritime'] },
      { cle: 'type_objet', libelle: 'Type', type: 'enum', niveau: 1, enum: ['gare', 'arret_bus', 'ligne_bus', 'piste_cyclable', 'stationnement_velo', 'parking', 'borne_recharge', 'quai', 'pont', 'passerelle', 'pole_multimodal'] },
      { cle: 'reseau', libelle: 'Réseau', type: 'texte', niveau: 2, exemple: 'SAM / Sète Agglopôle' },
      { cle: 'ligne', libelle: 'Ligne', type: 'texte', niveau: 2 },
      { cle: 'sens', libelle: 'Sens / direction', type: 'texte', niveau: 3 },
      { cle: 'exploitant', libelle: 'Exploitant', type: 'reference', niveau: 2 },
      { cle: 'accessible_pmr', libelle: 'Accessible PMR', type: 'booleen', niveau: 2 },
      { cle: 'acces_velo', libelle: 'Accès vélo', type: 'booleen', niveau: 3 },
      { cle: 'capacite_stationnement', libelle: 'Capacité de stationnement', type: 'nombre', niveau: 3 },
      { cle: 'bornes_recharge', libelle: 'Bornes de recharge', type: 'nombre', niveau: 3 },
      { cle: 'temps_reel', libelle: 'Info trafic temps réel', type: 'url', niveau: 3, aide: 'GTFS-RT (transport.data.gouv.fr)' },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  nature: {
    nom: 'Site naturel / environnement', icone: '🌿', table: 'nature_environnement.csv', cle: 'env',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'poi_id', libelle: 'Lieu', type: 'reference', niveau: 1 },
      { cle: 'type_site', libelle: 'Type de site', type: 'enum', niveau: 1, enum: ['lagune', 'etang', 'zone_humide', 'salin', 'plage', 'dune', 'lido', 'foret', 'garrigue', 'massif', 'cours_d_eau', 'canal', 'parc', 'jardin', 'sentier', 'zone_protegee'] },
      { cle: 'statut_protection', libelle: 'Statut de protection', type: 'liste', niveau: 2, exemple: ['natura_2000', 'znieff', 'arrêté_biotope'] },
      { cle: 'habitats', libelle: 'Habitats', type: 'liste', niveau: 3, exemple: ['roseliere', 'herbiers_de_zostere'] },
      { cle: 'especes_remarquables', libelle: 'Espèces remarquables', type: 'liste', niveau: 3 },
      { cle: 'masse_eau', libelle: 'Masse d’eau', type: 'texte', niveau: 3 },
      { cle: 'qualite_eau', libelle: 'Qualité d’eau', type: 'enum', niveau: 4, enum: ['bonne', 'moyenne', 'mauvaise', 'inconnue'] },
      { cle: 'risque_inondation', libelle: 'Risque inondation', type: 'enum', niveau: 3, enum: ['faible', 'moyen', 'fort', 'inconnu'] },
      { cle: 'risque_submersion', libelle: 'Risque submersion', type: 'enum', niveau: 3, enum: ['faible', 'moyen', 'fort', 'inconnu'] },
      { cle: 'risque_incendie', libelle: 'Risque incendie', type: 'enum', niveau: 3, enum: ['faible', 'moyen', 'fort', 'inconnu'] },
      { cle: 'erosion', libelle: 'Érosion', type: 'enum', niveau: 4, enum: ['faible', 'moyenne', 'forte', 'inconnue'] },
      { cle: 'regles_acces', libelle: 'Règles d’accès', type: 'texte', niveau: 3 },
      { cle: 'activites_permises', libelle: 'Activités permises', type: 'liste', niveau: 3, exemple: ['observation_nature', 'randonnee', 'kitesurf'] },
      { cle: 'activites_interdites', libelle: 'Activités interdites', type: 'liste', niveau: 4 },
      { cle: 'source_suivi', libelle: 'Source de suivi', type: 'reference', niveau: 3 },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  transformation: {
    nom: 'Transformation urbaine', icone: '🔄', table: 'transformations.csv', cle: 'trf',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'poi_id', libelle: 'Objet transformé', type: 'reference', niveau: 2 },
      { cle: 'nom', libelle: 'Nom de l’opération', type: 'texte', niveau: 1, exemple: 'Requalification des Pielles', aide: 'le nom sous lequel l’opération est connue : celui de la délibération, du panneau, de la presse' },
      { cle: 'projet_id', libelle: 'Projet / opération', type: 'reference', niveau: 3 },
      { cle: 'type_transformation', libelle: 'Type', type: 'enum', niveau: 1, enum: ['construction', 'demolition', 'renovation', 'rehabilitation', 'extension', 'conversion', 'depollution', 'pietonnisation', 'vegetalisation', 'desimpermeabilisation', 'renouvellement_reseaux', 'changement_exploitant', 'ouverture', 'fermeture', 'deplacement', 'restauration_patrimoine'] },
      { cle: 'usage_avant', libelle: 'Usage avant', type: 'texte', niveau: 2 },
      { cle: 'usage_apres', libelle: 'Usage après', type: 'texte', niveau: 2 },
      { cle: 'debut', libelle: 'Début', type: 'date', niveau: 2, aide: 'année suffisante ; une année inconnue reste vide, jamais devinée' },
      { cle: 'fin', libelle: 'Fin', type: 'date', niveau: 2 },
      { cle: 'maitre_ouvrage', libelle: 'Maître d’ouvrage', type: 'texte', niveau: 2, exemple: 'Sète Agglopôle Méditerranée', aide: 'la personne publique ou privée pour qui l’ouvrage est réalisé' },
      { cle: 'maitre_oeuvre', libelle: 'Maîtrise d’œuvre', type: 'texte', niveau: 3 },
      { cle: 'entreprise', libelle: 'Entreprise / titulaire', type: 'texte', niveau: 3, aide: 'titulaire du marché ; vérifiable dans les DECP (data.economie.gouv.fr)' },
      { cle: 'montant_eur', libelle: 'Montant du marché (€)', type: 'nombre', niveau: 3, aide: 'distinct du budget d’opération : un marché est un contrat' },
      { cle: 'phase', libelle: 'Phase du chantier', type: 'enum', niveau: 3, enum: ['etudes', 'concertation', 'autorisations', 'travaux', 'reception', 'termine', 'suspendu', 'abandonne'] },
      { cle: 'raison', libelle: 'Raison', type: 'texte', niveau: 3 },
      { cle: 'budget_eur', libelle: 'Budget (€)', type: 'nombre', niveau: 3, aide: 'source : délibération, DECP, presse — jamais estimé' },
      { cle: 'description_avant', libelle: 'Description avant', type: 'texte', niveau: 4 },
      { cle: 'description_apres', libelle: 'Description après', type: 'texte', niveau: 4 },
      { cle: 'impact_environnement', libelle: 'Impact environnemental', type: 'texte', niveau: 4 },
      { cle: 'impact_social', libelle: 'Impact social', type: 'texte', niveau: 4 },
      { cle: 'impact_economique', libelle: 'Impact économique', type: 'texte', niveau: 4 },
      { cle: 'confiance', libelle: 'Niveau de confiance', type: 'enum', niveau: 1, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier', 'observé'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'json_details', libelle: 'Détails spécifiques (JSON)', type: 'json', niveau: 3, aide: 'colonnes d’un import qui n’ont pas encore de colonne propre : elles sont conservées ici, jamais jetées' },
      { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
    ],
  },
  media: {
    nom: 'Média (photo, plan, archive, 3D)', icone: '🖼', table: 'medias.csv', cle: 'med',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'type_entite', libelle: 'Type d’objet visé', type: 'enum', niveau: 1, enum: ['poi', 'organisation', 'association', 'activite', 'evenement', 'transformation', 'quartier', 'commune'] },
      { cle: 'entite_id', libelle: 'Objet visé', type: 'reference', niveau: 1 },
      { cle: 'type_media', libelle: 'Type de média', type: 'enum', niveau: 1, enum: ['photo', 'photo_historique', 'carte_postale', 'plan', 'cadastre', 'carte_ancienne', 'vue_aerienne', 'drone', 'video', 'audio', 'scan_archive', 'modele_3d'] },
      { cle: 'date_capture', libelle: 'Date de capture', type: 'date', niveau: 2 },
      { cle: 'legende', libelle: 'Légende', type: 'texte', niveau: 2 },
      { cle: 'auteur', libelle: 'Auteur', type: 'texte', niveau: 3 },
      { cle: 'licence', libelle: 'Licence', type: 'texte', niveau: 2, aide: 'obligatoire pour republier : CC BY-SA, Licence Ouverte, domaine public…' },
      { cle: 'reference_archive', libelle: 'Référence d’archive', type: 'texte', niveau: 3 },
      { cle: 'url', libelle: 'URL', type: 'url', niveau: 1 },
      { cle: 'vignette_url', libelle: 'Vignette', type: 'url', niveau: 3 },
      { cle: 'lat', libelle: 'Latitude', type: 'nombre', niveau: 3 },
      { cle: 'lon', libelle: 'Longitude', type: 'nombre', niveau: 3 },
      { cle: 'azimut_deg', libelle: 'Azimut de prise de vue (°)', type: 'nombre', niveau: 4, aide: 'permet de recomposer la vue d’époque dans le globe' },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
      { cle: 'confiance', libelle: 'Confiance', type: 'enum', niveau: 2, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier'] },
    ],
  },
  relation: {
    nom: 'Relation entre objets', icone: '🔗', table: 'relations.csv', cle: 'rel',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
      { cle: 'type_source', libelle: 'Type source', type: 'enum', niveau: 1, enum: ['poi', 'organisation', 'association', 'activite', 'evenement', 'transformation', 'reseau', 'quartier'] },
      { cle: 'objet_source_id', libelle: 'Objet source', type: 'reference', niveau: 1 },
      { cle: 'type_relation', libelle: 'Relation', type: 'enum', niveau: 1, enum: ['appartient_au_quartier', 'geree_par', 'possedee_par', 'exploitee_par', 'situee_dans', 'adjacente_a', 'proche_de', 'traverse', 'connectee_a', 'desservie_par', 'possede_arret', 'possede_parking', 'propose_activite', 'accueille_evenement', 'organise_evenement', 'membre_de', 'partenaire_de', 'usage_ancien_de', 'transformee_en', 'renovee_par', 'financee_par', 'exposee_a', 'protegee_par', 'partie_de_parcours', 'alimentee_par_reseau'] },
      { cle: 'type_cible', libelle: 'Type cible', type: 'enum', niveau: 1, enum: ['poi', 'organisation', 'association', 'activite', 'evenement', 'transformation', 'reseau', 'quartier'] },
      { cle: 'cible_id', libelle: 'Objet cible', type: 'reference', niveau: 1 },
      { cle: 'valide_de', libelle: 'Valide de', type: 'date', niveau: 3 },
      { cle: 'valide_jusqua', libelle: 'Valide jusqu’à', type: 'date', niveau: 3 },
      { cle: 'confiance', libelle: 'Confiance', type: 'enum', niveau: 2, enum: ['documenté', 'rapporté', 'déduit', 'à vérifier'] },
      { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
    ],
  },
  source: {
    nom: 'Source', icone: '📚', table: 'sources.csv', cle: 'src',
    champs: [
      { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1, exemple: 'src_frontignan_officiel' },
      { cle: 'titre', libelle: 'Titre', type: 'texte', niveau: 1 },
      { cle: 'url', libelle: 'URL', type: 'url', niveau: 1 },
      { cle: 'type_source', libelle: 'Type', type: 'enum', niveau: 1, enum: ['site_officiel', 'open_data', 'registre_officiel', 'presse', 'presse_specialisee', 'temoignage', 'rapport', 'publication', 'archive', 'photo', 'base_collaborative', 'import_utilisateur'] },
      { cle: 'editeur', libelle: 'Éditeur', type: 'texte', niveau: 2 },
      { cle: 'date_publication', libelle: 'Date de publication', type: 'date', niveau: 2 },
      { cle: 'date_consultation', libelle: 'Date de consultation', type: 'date', niveau: 2 },
      { cle: 'licence', libelle: 'Licence', type: 'texte', niveau: 2 },
      { cle: 'fiabilite', libelle: 'Fiabilité (0-5)', type: 'nombre', niveau: 3 },
      { cle: 'notes', libelle: 'Notes', type: 'texte', niveau: 3 },
    ],
  },
});

// ───────────────────────── RÉSEAUX TECHNIQUES ─────────────────────────

/**
 * Classes de précision réglementaires (DT-DICT) — elles commandent la méthode
 * de terrassement et le niveau d'investigation avant travaux. C'est la
 * distinction la plus importante de tout le chantier enterré.
 */
export const CLASSES_PRECISION = Object.freeze([
  { classe: 'A', ecartMax: '± 40 cm', lecture: 'localisation précise', consequence: 'travaux possibles avec précautions normales' },
  { classe: 'B', ecartMax: '40 cm à 1,50 m', lecture: 'localisation imprécise', consequence: 'investigations complémentaires recommandées avant travaux' },
  { classe: 'C', ecartMax: '> 1,50 m', lecture: 'localisation très imprécise', consequence: 'marquage-piquetage + sondages ; méthodes douces obligatoires à proximité' },
  { classe: 'inconnue', ecartMax: 'inconnu', lecture: 'réseau non renseigné', consequence: 'traiter comme réseau sensible : sondage, arrêt si doute' },
]);

/**
 * Familles de réseaux techniques. Pour chacune : qui l'exploite, ce qu'on
 * regarde, quelle contrainte elle impose au chantier, et par où on vérifie.
 * `sensibles: true` = risque mortel ou service vital en cas d'atteinte.
 */
export const RESEAUX_TECHNIQUES = Object.freeze([
  {
    id: 'eau_potable', nom: 'Eau potable', icone: '🚰', couleur: '#4aa3ff', sensibles: true,
    famille: 'humide', exploitants: ['régie / syndicat des eaux', 'délégataire privé'],
    ouvrages: ['conduite de distribution', 'adduction', 'branchement particulier', 'réservoir', 'surpresseur', 'compteur', 'poteau incendie'],
    attributs: ['diametre_mm', 'materiau', 'annee_pose', 'pression_service_bar', 'profondeur_pose_m', 'gestionnaire', 'classe_precision', 'sens_ecoulement', 'vanne_associee'],
    verification: ['DT-DICT obligatoire', 'plans du gestionnaire', 'affleurants et vannes', 'sondage par aspiration'],
    consequence: ['coupure d’eau de quartier', 'inondation de fouille', 'potabilité compromise', 'dégât à un branchement'],
  },
  {
    id: 'assainissement_eu', nom: 'Assainissement eaux usées', icone: '🚽', couleur: '#b07dff', sensibles: false,
    famille: 'humide', exploitants: ['intercommunalité (compétence assainissement)', 'régie/délégataire'],
    ouvrages: ['réseau gravitaire', 'réseau de refoulement', 'regard de visite', 'poste de refoulement', 'branchement', 'station d’épuration'],
    attributs: ['diametre_mm', 'materiau', 'annee_pose', 'pente_mm_m', 'profondeur_pose_m', 'gestionnaire', 'sens_ecoulement', 'regards', 'type_reseau'],
    verification: ['DT-DICT', 'plans de récolement', 'inspection caméra si doute', 'levée des regards'],
    consequence: ['débordement et pollution', 'reprise d’une portion posée', 'mise en sécurité sanitaire', 'défaut de pente non rattrapable'],
  },
  {
    id: 'assainissement_ep', nom: 'Assainissement eaux pluviales', icone: '🌧', couleur: '#5ec8d8', sensibles: false,
    famille: 'humide', exploitants: ['commune', 'intercommunalité'],
    ouvrages: ['réseau pluvial', 'avaloir', 'buse', 'bassin de rétention', 'noue', 'déversoir d’orage', 'exutoire'],
    attributs: ['diametre_mm', 'materiau', 'pente_mm_m', 'profondeur_pose_m', 'exutoire', 'coefficient_ruissellement', 'gestionnaire'],
    verification: ['DT-DICT', 'plan de zonage pluvial', 'PPRI / étude hydraulique'],
    consequence: ['inondation par ruissellement', 'défaut de capacité en crue', 'rejet non conforme au milieu récepteur'],
  },
  {
    id: 'electricite_ht', nom: 'Électricité — haute tension', icone: '⚡', couleur: '#ffd166', sensibles: true,
    famille: 'sec', exploitants: ['Enedis', 'RTE', 'producteur'],
    ouvrages: ['ligne HTA', 'poste de transformation', 'liaison souterraine', 'pylône', 'câble aérien'],
    attributs: ['tension_kv', 'nb_cables', 'nature_cable', 'profondeur_pose_m', 'gestionnaire', 'distance_securite_m', 'poste_associe'],
    verification: ['DT-DICT', 'plans Enedis', 'détection par induction', 'mise hors tension si nécessaire'],
    consequence: ['électrisation / électrocution', 'coupure de secteur', 'intervention de l’exploitant obligatoire'],
  },
  {
    id: 'electricite_bt', nom: 'Électricité — basse tension / éclairage public', icone: '💡', couleur: '#ffb84d', sensibles: true,
    famille: 'sec', exploitants: ['Enedis', 'commune (éclairage public)', 'syndicat d’énergie'],
    ouvrages: ['réseau BT', 'câble d’éclairage public', 'candélabre', 'coffret', 'armoire de commande'],
    attributs: ['tension_v', 'nature_cable', 'profondeur_pose_m', 'gestionnaire', 'numero_depart', 'point_lumineux'],
    verification: ['DT-DICT', 'plans éclairage public', 'détection', 'consignation'],
    consequence: ['électrisation', 'rue sans éclairage', 'câble sectionné par une pelle'],
  },
  {
    id: 'gaz', nom: 'Gaz naturel', icone: '🔥', couleur: '#ff8a5c', sensibles: true,
    famille: 'sec', exploitants: ['GRDF', 'GRTgaz', 'régie locale'],
    ouvrages: ['conduite de distribution', 'branchement', 'poste de détente', 'compteur', 'robnet'],
    attributs: ['diametre_mm', 'materiau', 'pression_bar', 'profondeur_pose_m', 'gestionnaire', 'branchements_cartographies', 'organe_coupure'],
    verification: ['DT-DICT', 'plans GRDF', 'affleurants et coffrets', 'détection gaz avant travaux'],
    consequence: ['Procédure Gaz Renforcée (PGR)', 'fuite puis explosion', 'évacuation de riverains', 'confinement'],
  },
  {
    id: 'telecom', nom: 'Télécommunications / fibre', icone: '📡', couleur: '#9ad1ff', sensibles: false,
    famille: 'sec', exploitants: ['Orange', 'opérateurs', 'collectivité (fibre)'],
    ouvrages: ['fourreau', 'chambre de tirage', 'câble cuivre', 'câble optique', 'poteau', 'point de branchement'],
    attributs: ['diametre_fourreau_mm', 'nb_fourreaux', 'nature_cable', 'profondeur_pose_m', 'gestionnaire', 'occupation_fourreaux'],
    verification: ['DT-DICT', 'plans opérateur', 'détection géoradar', 'photos avant travaux'],
    consequence: ['coupure internet/téléphone d’un quartier', 'astreinte opérateur', 'réparation longue (soudure optique)'],
  },
  {
    id: 'chaleur', nom: 'Réseaux de chaleur / froid', icone: '♨️', couleur: '#ff9ecb', sensibles: false,
    famille: 'humide', exploitants: ['collectivité', 'délégataire'],
    ouvrages: ['conduite isolée aller', 'conduite retour', 'sous-station', 'chambre de visite'],
    attributs: ['diametre_mm', 'fluide', 'temperature_c', 'profondeur_pose_m', 'gestionnaire', 'installation_associee'],
    verification: ['DT-DICT', 'plans du réseau', 'marquage spécifique'],
    consequence: ['brûlure / projection', 'arrêt du chauffage', 'reprise après arrêt'],
  },
  {
    id: 'hydraulique', nom: 'Hydraulique / irrigation / drainage', icone: '💧', couleur: '#7ad4b8', sensibles: false,
    famille: 'humide', exploitants: ['ASA', 'agriculteurs', 'commune', 'gestionnaire de lagune'],
    ouvrages: ['canal d’irrigation', 'canal de drainage', 'buse sous chaussée', 'ouvrage de régulation', 'roubine', 'martelière'],
    attributs: ['section', 'materiau', 'profondeur_pose_m', 'gestionnaire', 'regime', 'sens_ecoulement'],
    verification: ['DT-DICT', 'plans du gestionnaire', 'relevé d’hiver (réseau souvent à sec)'],
    consequence: ['destruction d’un ouvrage agricole', 'assèchement ou submersion d’une parcelle', 'litige d’exploitation'],
  },
  {
    id: 'eaux_souterraines', nom: 'Eaux souterraines / forages', icone: '🕳', couleur: '#8fb8d8', sensibles: false,
    famille: 'humide', exploitants: ['particuliers', 'collectivité', 'industriel'],
    ouvrages: ['forage', 'puits', 'piézomètre', 'source captée'],
    attributs: ['profondeur_m', 'usage', 'gestionnaire', 'nappe_captee', 'protection'],
    verification: ['DT-DICT (forages déclarés)', 'BSS (Bureau de recherches géologiques)', 'retours d’expérience'],
    consequence: ['débit d’une source captée', 'qualité d’eau dégradée', 'remontée de nappe non prévue'],
  },
]);

/** Colonnes détaillées d'un tronçon de réseau (table `reseaux.csv`). */
export const CHAMPS_RESEAU = Object.freeze([
  { cle: 'id', libelle: 'Identifiant', type: 'texte', niveau: 1 },
  { cle: 'famille', libelle: 'Famille', type: 'enum', niveau: 1, enum: RESEAUX_TECHNIQUES.map((r) => r.id) },
  { cle: 'gestionnaire', libelle: 'Gestionnaire (exploitant)', type: 'texte', niveau: 1, exemple: 'Enedis / GRDF / Agglopôle' },
  { cle: 'classe_precision', libelle: 'Classe de précision', type: 'enum', niveau: 1, enum: ['A', 'B', 'C', 'inconnue'], aide: 'voir CLASSES_PRECISION — elle décide de la méthode de terrassement' },
  { cle: 'geometrie', libelle: 'Tracé', type: 'geojson', niveau: 1, aide: 'LineString WGS84 ; un tronçon = un objet' },
  { cle: 'profondeur_pose_m', libelle: 'Profondeur de pose (m)', type: 'nombre', niveau: 2 },
  { cle: 'diametre_mm', libelle: 'Diamètre (mm)', type: 'nombre', niveau: 2 },
  { cle: 'materiau', libelle: 'Matériau', type: 'enum', niveau: 2, enum: ['fonte', 'acier', 'beton', 'pvc', 'pehd', 'amiante_ciment', 'cuivre', 'plomb', 'inconnu'] },
  { cle: 'annee_pose', libelle: 'Année de pose', type: 'nombre', niveau: 3 },
  { cle: 'etat', libelle: 'État', type: 'enum', niveau: 3, enum: ['bon', 'moyen', 'degrade', 'hors_service', 'inconnu'] },
  { cle: 'sens_ecoulement', libelle: 'Sens d’écoulement', type: 'enum', niveau: 3, enum: ['amont_vers_aval', 'aval_vers_amont', 'sans_objet'] },
  { cle: 'branchements', libelle: 'Branchements connus', type: 'nombre', niveau: 3, aide: 'un branchement non cartographié est LE piège n°1 des terrassements' },
  { cle: 'date_leve', libelle: 'Date du levé', type: 'date', niveau: 3 },
  { cle: 'methode_leve', libelle: 'Méthode de levé', type: 'enum', niveau: 3, enum: ['plans_exploitant', 'georadar', 'induction', 'sondage_ouvert', 'recolement_apres_travaux', 'inconnue'] },
  { cle: 'source_id', libelle: 'Source', type: 'reference', niveau: 1 },
  { cle: 'derniere_verif', libelle: 'Dernière vérification', type: 'date', niveau: 2 },
]);

/**
 * Ce qu'il faut avoir fait AVANT de creuser, réseau par réseau. C'est la
 * check-list que le module affiche quand on sélectionne la lentille RÉSEAUX.
 */
export const CHECKLIST_RESEAUX = Object.freeze([
  { etape: 'Déclarer', detail: 'DICT adressée à chaque exploitant (réseau sensible : 3 mois à l’avance, sinon 15 jours)', ref: 'Réglementation anti-endommagement (DT-DICT)' },
  { etape: 'Recevoir', detail: 'récépissés + plans de chaque exploitant, classés par classe de précision A/B/C', ref: 'Service-public / guichet unique réseaux' },
  { etape: 'Repérer', detail: 'marquage-piquetage au sol contradictoire ; ne JAMAIS confondre une borne avec la position du réseau', ref: 'Fascicule DT-DICT' },
  { etape: 'Sonder', detail: 'sondages par méthodes douces (aspiratrice, pioche, eau) dans les zones en classe B/C ou encombrées', ref: 'Bonnes pratiques exploitants' },
  { etape: 'Consigner', detail: 'mise hors tension / coupure pour l’électricité et le gaz si rapprochement dangereux', ref: 'Prescriptions de l’exploitant' },
  { etape: 'Relever', detail: 'levé du récolement APRÈS pose, avant remblai : c’est ce qui évitera le prochain accident', ref: 'Récolement obligatoire' },
  { etape: 'Déclarer l’anomalie', detail: 'réseau inconnu ou écart au plan : arrêt de la zone, information de l’exploitant et du maître d’ouvrage', ref: 'Courrier de découverte de réseau non identifié' },
]);

// ───────────────────────── ÉVÉNEMENTS CULTURELS ─────────────────────────

/**
 * La programmation culturelle d'une ville n'est pas un seul objet : c'est un
 * système. Sept familles, avec ce qui les distingue en base.
 */
export const FAMILLES_EVENEMENT = Object.freeze([
  { id: 'saison', nom: 'Saison / programmation annuelle', duree: 'mois', structure: 'plusieurs rendez-vous sous un même label', points_cles: ['saison de spectacle vivant', 'abonnement', 'dossier de saison'] },
  { id: 'festival', nom: 'Festival', duree: '1 à 10 jours', structure: 'plusieurs lieux, jauge forte, billetterie dédiée', points_cles: ['jauge', 'billetterie', 'logistique multi-lieux', 'bénévolat'] },
  { id: 'spectacle', nom: 'Spectacle ponctuel', duree: 'soirée', structure: 'un lieu, une représentation, reprise possible', points_cles: ['salle', 'jauge', 'technique'] },
  { id: 'exposition', nom: 'Exposition', duree: '2 à 12 semaines', structure: 'un lieu, accrochage, médiation', points_cles: ['dates d’accrochage', 'médiation', 'scolaires'] },
  { id: 'atelier_pratique', nom: 'Atelier / pratique', duree: '1 h à 1 journée', structure: 'petit jauge, inscription, public défini', points_cles: ['âge minimum', 'matériel', 'inscription'] },
  { id: 'patrimoine_visite', nom: 'Visite / action patrimoine', duree: '1 à 3 h', structure: 'parcours, guide, jauge limitée', points_cles: ['point de départ', 'parcours', 'accessibilité'] },
  { id: 'marche_saison', nom: 'Marché / rendez-vous saisonnier', duree: 'récurrent', structure: 'jours fixes, emplacements, saison', points_cles: ['jours', 'saison', 'emplacements', 'exposants'] },
]);

/** Champs de gestion supplémentaires quand un événement est récurrent. */
export const CHAMPS_RECURRENCE = Object.freeze([
  { cle: 'recurrence', libelle: 'Règle de récurrence (RFC 5545)', type: 'texte', niveau: 3, exemple: 'FREQ=WEEKLY;BYDAY=WE;BYMONTH=7,8' },
  { cle: 'exceptions', libelle: 'Exceptions / annulations', type: 'liste', niveau: 4, exemple: ['2026-08-15 annulé (vigilance orange)'] },
  { cle: 'editions_precedentes', libelle: 'Éditions précédentes', type: 'liste', niveau: 4, aide: 'historique pour comparer fréquentation et jauge' },
]);

/** La chaîne complète d'un rendez-vous, du calendrier à l’affichage. */
export const CYCLE_EVENEMENT = Object.freeze([
  { etape: 'programmation', qui: 'service culturel / association', sortie: 'date retenue, lieu, budget' },
  { etape: 'publication', qui: 'communication', sortie: 'fiche d’agenda, affiche, réseaux' },
  { etape: 'billetterie', qui: 'régie / billetterie', sortie: 'ouverture des ventes, jauge suivie' },
  { etape: 'logistique', qui: 'technique / sécurité', sortie: 'montage, sonorisation, restauration, sécurité' },
  { etape: 'realisation', qui: 'équipe d’accueil', sortie: 'jauge réelle, incidents, accessibilité' },
  { etape: 'bilan', qui: 'service culturel', sortie: 'fréquentation, coûts, décision de reconduction' },
]);

// ───────────────────────── ASSOCIATIONS ─────────────────────────

/** Domaines du guide associatif municipal (classement par finalité). */
export const DOMAINES_ASSOCIATION = Object.freeze([
  'citoyennete', 'solidarite', 'environnement', 'patrimoine', 'culture', 'education',
  'parentalite', 'sante', 'handicap', 'sport', 'nautisme', 'loisirs', 'economie',
  'commerce', 'quartier', 'jeunesse', 'seniors', 'international', 'cultes',
]);

/** Sous-domaines fréquents dans une ville littorale et lagunaire. */
export const SOUS_DOMAINES_ASSOCIATION = Object.freeze([
  'joutes_languedociennes', 'voile', 'rame', 'plongee', 'peche', 'kitesurf', 'gymnastique',
  'football', 'rugby', 'basket', 'tennis', 'arts_martiaux', 'danse', 'musique', 'theatre',
  'arts_plastiques', 'photographie', 'lecture', 'generalogie', 'patrimoine_industriel',
  'viticulture', 'oenotourisme', 'oiseaux', 'biodiversite', 'littoral', 'jardins_partages',
  'tiers_lieu', 'reparation', 'seconde_main', 'aide_alimentaire', 'accompagnement_scolaire',
  'logement', 'mobilite', 'culture_sourde', 'anosmie', 'handicap_moteur',
]);

/**
 * Ce que le module doit dire quand on importe le guide des associations :
 * un guide est un MILLÉSIME. Il se périme, il se réimporte, et on garde
 * toujours la date de dernière vérification.
 */
export const GUIDE_ASSOCIATIONS = Object.freeze({
  niveau_confiance: 'rapporté',
  champs_souvent_absents: ['lat', 'lon', 'siret', 'courriel', 'site_web'],
  a_verifier_toujours: ['contact_nom', 'telephone', 'lieu_activite', 'statut'],
  conseil: 'Importer le guide comme un millésime (source_id = src_guide_associations_ANNEE). Les fiches sans coordonnées restent valides au niveau 1 si elles portent le lieu de pratique, sinon elles sont regroupées sous « adresse à géocoder ».',
});

// ───────────────────────── fonctions (pures) ─────────────────────────

/** La définition d'un type d'entité, ou null. */
export function typeEntite(type) {
  return TYPES_ENTITE[String(type || '')] || null;
}

/** Toutes les colonnes d'un type, dans l'ordre. */
export function champsDe(type) {
  const t = typeEntite(type);
  return t ? [...t.champs] : [];
}

/** Les colonnes obligatoires jusqu'au niveau demandé (inclus). */
export function champsRequis(type, niveau = 1) {
  return champsDe(type).filter((c) => Number(c.niveau) <= Number(niveau));
}

/** Liste des colonnes pour un export CSV (dans l'ordre du schéma). */
export function colonnesCsv(type) {
  return champsDe(type).map((c) => c.cle);
}

/** Valeurs autorisées d'un champ énuméré (ou null si le champ n'est pas un enum). */
export function enumDe(type, cle) {
  const champ = champsDe(type).find((c) => c.cle === cle);
  return champ && Array.isArray(champ.enum) ? [...champ.enum] : null;
}

const VIDE = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * Valide une fiche : dit exactement ce qui manque pour atteindre le niveau
 * visé, et signale les champs hors contrat. Aucune exception, jamais de
 * jugement de valeur sur le contenu.
 */
export function valider(entite, type, niveauVise = 1) {
  const champs = champsDe(type);
  const objet = entite || {};
  const connus = new Set(champs.map((c) => c.cle));
  const manquants = champs
    .filter((c) => Number(c.niveau) <= Number(niveauVise) && VIDE(objet[c.cle]))
    .map((c) => c.cle);
  const horsContrat = Object.keys(objet).filter((k) => !connus.has(k));
  return { ok: manquants.length === 0, manquants, horsContrat, champs: champs.length };
}

/**
 * Niveau de complétude atteint par une fiche (1 à 5).
 * On monte tant que TOUS les champs du niveau sont renseignés.
 */
export function niveauAtteint(entite, type) {
  const champs = champsDe(type);
  if (!champs.length) return 0;
  const objet = entite || {};
  let niveau = 0;
  for (let n = 1; n <= 5; n += 1) {
    const duNiveau = champs.filter((c) => Number(c.niveau) === n);
    if (!duNiveau.length) continue;
    if (duNiveau.every((c) => !VIDE(objet[c.cle]))) niveau = n;
    else break;
  }
  return niveau;
}

/** Nom lisible du niveau atteint (« 2 — UTILISABLE »). */
export function nomNiveau(niveau) {
  const n = NIVEAUX_COMPLETUDE.find((x) => x.niveau === Number(niveau));
  return n ? `${n.niveau} — ${n.nom}` : '0 — HORS CONTRAT';
}

/** Répartition des fiches d'une collection par niveau de complétude. */
export function repartitionNiveaux(entites = [], type) {
  const out = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const e of entites) out[niveauAtteint(e, type)] += 1;
  return out;
}

/** Résumé d'une collection : total, niveaux, champs manquants les plus fréquents. */
export function diagnosticCollection(entites = [], type) {
  const liste = Array.isArray(entites) ? entites : [];
  const compteurManquants = new Map();
  for (const e of liste) {
    for (const m of valider(e, type).manquants) compteurManquants.set(m, (compteurManquants.get(m) || 0) + 1);
  }
  return {
    type,
    total: liste.length,
    niveaux: repartitionNiveaux(liste, type),
    manquants: [...compteurManquants.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([cle, n]) => ({ cle, n })),
  };
}

/** Sérialise une collection en CSV (en-tête = schéma, valeurs JSON quand objet). */
export function versCsv(entites = [], type) {
  const cols = colonnesCsv(type);
  if (!cols.length) return '';
  const cellule = (v) => {
    if (v === null || v === undefined) return '';
    const t = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lignes = [cols.join(';')];
  for (const e of entites) lignes.push(cols.map((c) => cellule((e || {})[c])).join(';'));
  return lignes.join('\n');
}
