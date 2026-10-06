/**
 * WATCHTOWER — IMPRÉVUS DE CHANTIER TP (base d'amorçage, données pures).
 *
 * Objectif : pouvoir répondre, sur un territoire donné, à
 *   « qu'est-ce qui peut mal tourner à cette étape ? »,
 *   « qu'est-ce qui est déjà arrivé dans une situation comparable ? »,
 *   « quels signaux faibles annoncent le problème ? »,
 *   « que fait l'équipe quand ça arrive ? »
 *
 * TROIS NIVEAUX DE PREUVE, jamais mélangés :
 *   · `documenté`  — appuyé sur une source institutionnelle identifiée ;
 *   · `rapporté`   — remonté par la profession (presse spécialisée, REX) ;
 *   · `déduit`     — conséquence logique d'un mécanisme connu, à confirmer.
 *
 * Ce fichier est un AMORÇAGE volontairement court (~70 fiches) : il donne le
 * CONTRAT de colonnes, la mécanique des cascades et les signaux faibles. La
 * base complète se remplit par import (REX, rapports, presse locale) et chaque
 * ajout doit porter sa source et son niveau de preuve.
 *
 * Faits vérifiés et sourcés qui structurent la base (INRS, guichet unique) :
 *  · les dommages aux réseaux enterrés coûtent la vie à près de dix
 *    travailleurs du régime général chaque année (Travail & Sécurité / INRS) ;
 *  · la zone d'approche prudente d'une canalisation isolée enterrée est de
 *    0,50 m ; les distances aux lignes aériennes sont de 3 m (≤ 50 kV) et 5 m ;
 *  · deux accidents graves en 2024 sont survenus en plantant des fiches au sol
 *    pour implanter des bordures de trottoir ;
 *  · l'AIPR ne remplace pas l'habilitation électrique (NF C18-510) ;
 *  · la DT doit précéder la DICT ; les délais de réponse des exploitants sont
 *    de 9 jours en dématérialisé (15 jours sinon) ;
 *  · un réseau sensible découvert impose l'arrêt, l'information écrite du
 *    maître d'ouvrage et un constat contradictoire (cerfa 14767).
 */

/** Les 19 colonnes du contrat — l'ordre est celui de l'export CSV. */
export const COLONNES = Object.freeze([
  'id', 'phase', 'categorie', 'sous_categorie', 'probleme', 'exemple', 'cause',
  'consequence', 'gravite', 'frequence', 'detection_avant', 'detection_pendant',
  'action_immediate', 'prevention', 'source', 'date', 'pays', 'type_source',
  'confiance', 'contextes',
]);

/** Phases du chantier, de la préparation à la remise en état. */
export const PHASES = Object.freeze([
  { id: 'preparation', nom: 'A — Avant chantier / préparation' },
  { id: 'approvisionnement', nom: 'B — Approvisionnement / logistique' },
  { id: 'sol', nom: 'C — Sol, terrain, sous-sol' },
  { id: 'reseaux', nom: 'D — Réseaux existants' },
  { id: 'meteo', nom: 'E — Météo / environnement' },
  { id: 'engins', nom: 'F — Engins / matériel' },
  { id: 'main_oeuvre', nom: 'G — Main-d’œuvre / humain' },
  { id: 'securite', nom: 'H — Sécurité' },
  { id: 'coordination', nom: 'I — Coordination / organisation' },
  { id: 'conception', nom: 'J — Conception / études' },
  { id: 'administratif', nom: 'K — Administratif / réglementaire' },
  { id: 'riverains', nom: 'L — Riverains / usagers' },
  { id: 'qualite', nom: 'M — Qualité / technique' },
  { id: 'delais', nom: 'N — Délais / planning' },
  { id: 'couts', nom: 'O — Coûts' },
  { id: 'communication', nom: 'P — Communication / information' },
  { id: 'fin_chantier', nom: 'Q — Fin de chantier' },
  { id: 'rare_grave', nom: 'R — Rare mais grave' },
]);

/** Gravité : ce que la fiche coûte si elle se produit. */
export const GRAVITES = Object.freeze(['Faible', 'Modérée', 'Forte', 'Critique', 'Catastrophique']);

/** Fréquence estimée : une appréciation, jamais un taux inventé. */
export const FREQUENCES = Object.freeze(['Très fréquente', 'Fréquente', 'Occasionnelle', 'Rare', 'Très rare']);

/** Prévisibilité : ce que la donnée disponible permet d'anticiper. */
export const PREVISIBILITE = Object.freeze([
  'facilement prévisible',
  'prévisible avec de bonnes données',
  'difficilement prévisible',
  'quasiment imprévisible',
]);

/** Contextes de terrain — c'est ce qui relie la base TP à un TERRITOIRE. */
export const CONTEXTES = Object.freeze([
  { id: 'urbain_ancien', nom: 'Centre ancien dense' },
  { id: 'urbain_recent', nom: 'Quartier récent / lotissement' },
  { id: 'littoral', nom: 'Littoral et lido' },
  { id: 'lagune', nom: 'Berge de lagune / étang' },
  { id: 'canal', nom: 'Canal et berges' },
  { id: 'zone_humide', nom: 'Zone humide / salins' },
  { id: 'massif', nom: 'Garrigue et massif boisé' },
  { id: 'viticole', nom: 'Vignoble et parcellaire agricole' },
  { id: 'zone_activites', nom: 'Zone d’activités' },
  { id: 'grande_voirie', nom: 'Grande voirie / axe structurant' },
]);

/**
 * Sources institutionnelles utilisées par la base. Toutes ont été ouvertes :
 * aucune URL n'est citée « de mémoire ».
 */
export const SOURCES_IMPREVUS = Object.freeze([
  { id: 'inrs_ts871', titre: 'Connaître les réseaux sous terre pour terrasser en sécurité', url: 'https://www.travail-et-securite.fr/ts/871/DOS/travailler-a-proximite-de-reseaux-electriques/connaitre-les-reseaux-sous-terre-pour-terrasser-en-securite.html', editeur: 'INRS — Travail & Sécurité', type_source: 'article professionnel', fiabilite: 5 },
  { id: 'inrs_ed790', titre: 'Aide-mémoire BTP — prévention des accidents du travail', url: 'https://www.inrs.fr/', editeur: 'INRS (ED 790)', type_source: 'document technique', fiabilite: 5 },
  { id: 'guichet_unique', titre: 'Téléservice « réseaux et canalisations » (guichet unique DT-DICT)', url: 'https://www.reseaux-et-canalisations.gouv.fr/', editeur: 'INERIS', type_source: 'document technique', fiabilite: 5 },
  { id: 'observatoire_dt_dict', titre: 'Observatoire national DT-DICT — focus et retours d’expérience', url: 'https://www.observatoire-national-dt-dict.fr/', editeur: 'Observatoires DT-DICT', type_source: 'rapport officiel', fiabilite: 5 },
  { id: 'oppbtp', titre: 'OPPBTP / PreventionBTP — situations de travail et modes opératoires', url: 'https://preventionbtp.fr/', editeur: 'OPPBTP', type_source: 'document technique', fiabilite: 5 },
  { id: 'carsat', titre: 'CARSAT — retours d’expérience d’accidents', url: 'https://www.carsat-sudest.fr/', editeur: 'Assurance Maladie — Risques professionnels', type_source: 'rapport officiel', fiabilite: 5 },
  { id: 'georisques', titre: 'Géorisques — aléas naturels et technologiques', url: 'https://www.georisques.gouv.fr/', editeur: 'Ministère de la Transition écologique', type_source: 'registre officiel', fiabilite: 5 },
  { id: 'legifrance', titre: 'Réglementation anti-endommagement et sécurité des chantiers', url: 'https://www.legifrance.gouv.fr/', editeur: 'Légifrance', type_source: 'rapport officiel', fiabilite: 5 },
  { id: 'cerema', titre: 'Cerema — voirie, réseaux, adaptation au changement climatique', url: 'https://www.cerema.fr/', editeur: 'Cerema', type_source: 'publication scientifique', fiabilite: 5 },
  { id: 'inrap', titre: 'INRAP — archéologie préventive', url: 'https://www.inrap.fr/', editeur: 'INRAP', type_source: 'rapport officiel', fiabilite: 5 },
  { id: 'fntp', titre: 'Fédération nationale des travaux publics — métiers et REX', url: 'https://www.fntp.fr/', editeur: 'FNTP', type_source: 'article professionnel', fiabilite: 4 },
  { id: 'service_public', titre: 'Service-public — autorisations et démarches (voirie, travaux)', url: 'https://www.service-public.fr/', editeur: 'DILA', type_source: 'registre officiel', fiabilite: 5 },
  { id: 'transport_data', titre: 'transport.data.gouv.fr — données de mobilité et perturbations', url: 'https://transport.data.gouv.fr/', editeur: 'DINUM', type_source: 'open_data', fiabilite: 4 },
]);

const SRC = Object.freeze(Object.fromEntries(SOURCES_IMPREVUS.map((s) => [s.id, s])));

/** Retourne une source de la base imprévus, ou null. */
export function sourceImprevu(id) {
  return SRC[id] || null;
}

/**
 * LA BASE. Granularité volontaire : « problème d'approvisionnement » n'existe
 * pas ici — chaque ligne est un problème distinct, avec sa cause et son geste.
 */
export const IMPREVUS = Object.freeze([
  // ── A. Préparation ────────────────────────────────────────────────
  { id: 'IMP-001', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'DT/DICT', probleme: 'DICT établie trop tard, moins de 15 jours avant les travaux', cause: 'planning serré, emprise modifiée en urgence', consequence: 'travaux à proximité de réseaux sans réponse d’exploitant ; ajournement possible', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'suspendre la zone concernée, déposer la DICT, informer le maître d’ouvrage', prevention: 'DT au moins 3 mois avant pour les réseaux sensibles ; DICT 15 jours avant, emprise figée', source: 'guichet_unique', date: '2015-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'grande_voirie'] },
  { id: 'IMP-002', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'DT/DICT conjointe', probleme: 'DT-DICT conjointe utilisée hors des cas autorisés', cause: 'gain de temps apparent, méconnaissance du fascicule', consequence: 'procédure irrégulière ; responsabilité engagée en cas de dommage', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'séparer DT et DICT, reprendre la déclaration', prevention: 'vérifier l’éligibilité de l’emprise avant de cocher la déclaration conjointe', source: 'guichet_unique', date: '2015-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-003', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'Plans', probleme: 'Récépissés et plans d’exploitants absents du chantier', cause: 'documents restés au bureau, transmission orale', consequence: 'excavation sans connaissance des réseaux ; endommagement possible', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêter la zone, récupérer les plans, reprise après marquage', prevention: 'dossier DT-DICT obligatoirement présent sur site, avec le plan de chaque exploitant', source: 'guichet_unique', date: '2015-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_activites'] },
  { id: 'IMP-004', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'Classe de précision', probleme: 'Plans en classe B ou C utilisés comme si la position était exacte', cause: 'confusion entre « réseau localisé » et « réseau repéré »', consequence: 'godet dans le réseau : fuite, coupure, procédure d’urgence', gravite: 'Critique', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'méthodes douces obligatoires à proximité, sondage avant excavation', prevention: 'lire la classe de précision, exiger des investigations complémentaires en classe B/C', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien', 'viticole'] },
  { id: 'IMP-005', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'Affleurants', probleme: 'Borne ou affleurant pris pour la position exacte du réseau', cause: 'habitude, pression du planning', consequence: 'atteinte du réseau à quelques dizaines de centimètres de la borne', gravite: 'Critique', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêt, marquage complémentaire, sondage', prevention: 'rappeler que l’affleurant signale la proximité, pas le tracé', source: 'observatoire_dt_dict', date: '2020-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-006', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'Branchements', probleme: 'Branchement particulier non cartographié (gaz, eau, électricité)', cause: 'branchements rarement reportés sur les plans', consequence: 'atteinte d’un branchement en service : coupure, fuite, procédure gaz renforcée', gravite: 'Catastrophique', frequence: 'Très fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêt immédiat, périmètre, alerte exploitant', prevention: 'repérage des coffrets et compteurs, sondages systématiques sur les accotements', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien', 'urbain_recent', 'viticole'] },
  { id: 'IMP-007', phase: 'preparation', categorie: 'Réseaux', sous_categorie: 'Zone d’approche', probleme: 'Méthode de terrassement inadaptée dans la zone d’approche prudente (0,50 m)', cause: 'pelle mécanique utilisée au contact d’une canalisation isolée', consequence: 'endommagement du réseau, accident grave possible', gravite: 'Catastrophique', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'passer en méthode douce (aspiration, pioche, eau), arrêt si doute', prevention: 'zone d’approche prudente matérialisée au sol et rappelée au conducteur d’engin', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-008', phase: 'preparation', categorie: 'Études', sous_categorie: 'Topographie', probleme: 'Relevé topographique ancien ou non rattaché au système de coordonnées du projet', cause: 'plans hétérogènes repris sans contrôle, changement de système', consequence: 'implantation décalée, reprise de métrés, avenant', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêter l’implantation, refaire un levé de contrôle sur points connus', prevention: 'exiger un levé récent géoréférencé (RGF93) et deux points de référence vérifiables', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'déduit', contextes: ['urbain_ancien', 'grande_voirie'] },
  { id: 'IMP-009', phase: 'preparation', categorie: 'Études', sous_categorie: 'Géotechnique', probleme: 'Portance du sol différente de l’hypothèse de calcul', cause: 'essais insuffisants, hétérogénéité du terrain non détectée', consequence: 'reprise de la plateforme ou des fondations, surcoût et retard', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'sonder l’anomalie, mission géotechnique complémentaire', prevention: 'campagne d’essais adaptée à l’emprise réelle, pas au seul axe principal', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'déduit', contextes: ['littoral', 'lagune', 'zone_humide'] },
  { id: 'IMP-010', phase: 'preparation', categorie: 'Environnement', sous_categorie: 'Archéologie', probleme: 'Prescription de fouilles découverte en phase travaux', cause: 'zone à potentiel archéologique non identifiée en amont', consequence: 'arrêt de la zone, retard de plusieurs semaines, surcoût', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêter la zone, alerter le maître d’ouvrage, saisir le service régional de l’archéologie', prevention: 'consulter le SRA en amont ; intégrer un aléa archéologique au planning et au budget', source: 'inrap', date: '2020-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-011', phase: 'preparation', categorie: 'Administratif', sous_categorie: 'Autorisations', probleme: 'Autorisation de voirie ou arrêté de circulation non obtenu avant démarrage', cause: 'dépôt tardif, dossier incomplet, délai d’instruction sous-estimé', consequence: 'arrêt sur le domaine public, arrêté préfectoral, retard', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'stopper l’emprise concernée, déposer le dossier, tenir le maître d’ouvrage informé', prevention: 'déposer 3 à 6 mois avant, check-list des pièces, relances écrites', source: 'service_public', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['urbain_ancien', 'grande_voirie'] },
  { id: 'IMP-012', phase: 'preparation', categorie: 'Sécurité', sous_categorie: 'Habilitation', probleme: 'Personnel sans AIPR ou habilitation électrique sur les travaux concernés', cause: 'affectation d’urgence, formation non suivie', consequence: 'non-conformité immédiate, arrêt possible, risque d’accident grave', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'écarter du poste, affecter un titulaire, planifier la formation', prevention: 'vérifier AIPR + habilitation (NF C18-510) à l’affectation ; l’AIPR ne remplace pas l’habilitation', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien'] },

  // ── B. Approvisionnement ──────────────────────────────────────────
  { id: 'IMP-020', phase: 'approvisionnement', categorie: 'Livraison', sous_categorie: 'Retard', probleme: 'Livraison de matériaux reportée à la veille de la pose', cause: 'rupture de stock fournisseur, priorisation d’un autre client', consequence: 'équipes en attente, décalage de la tâche suivante', gravite: 'Forte', frequence: 'Très fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'réaffecter les équipes, confirmer un créneau ferme, chercher un fournisseur de repli', prevention: 'confirmation J-5 et J-1 ; commande ferme des matériaux critiques avant démarrage', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['urbain_recent', 'grande_voirie'] },
  { id: 'IMP-021', phase: 'approvisionnement', categorie: 'Livraison', sous_categorie: 'Bonne référence', probleme: 'Livraison d’une référence ou d’un diamètre différents de la commande', cause: 'erreur de préparation côté fournisseur ou commande ambigüe', consequence: 'retour, nouvelle livraison, journée perdue', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'refuser la livraison, faire constater au bon de livraison, recommander', prevention: 'bon de commande avec référence + diamètre + quantité ; contrôle à la réception', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['urbain_recent'] },
  { id: 'IMP-022', phase: 'approvisionnement', categorie: 'Accès', sous_categorie: 'Voirie', probleme: 'Camion de livraison ne peut pas accéder à l’emprise', cause: 'rue étroite, gabarit, stationnement, tonnage limité d’un ouvrage', consequence: 'livraison reportée, stockage intermédiaire, surcoût', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'itinéraire alternatif, transbordement depuis un point de dépose', prevention: 'reconnaissance d’accès avant chantier (gabarit, tonnage, rayons de giration)', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien', 'littoral'] },
  { id: 'IMP-023', phase: 'approvisionnement', categorie: 'Stockage', sous_categorie: 'Exiguïté', probleme: 'Aucune place pour stocker : livraisons bloquantes au milieu du chantier', cause: 'emprise réduite en site occupé', consequence: 'matériaux dans les circulations, perte/vol, gêne aux riverains', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'déplacer le stock, revoir les créneaux de livraison', prevention: 'plan d’installation de chantier avec zones de stockage et rotations justes-à-temps', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-024', phase: 'approvisionnement', categorie: 'Coordination', sous_categorie: 'Attente', probleme: 'Camions en attente faute de moyen de déchargement disponible', cause: 'engin occupé ailleurs, absence de créneau', consequence: 'surestaries, tension avec le transporteur, heures perdues', gravite: 'Faible', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'prioriser le déchargement, décaler la tâche en cours', prevention: 'créneaux de livraison contractualisés avec l’engin de déchargement dédié', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'rapporté', contextes: ['urbain_ancien', 'zone_activites'] },

  // ── C. Sol / sous-sol ─────────────────────────────────────────────
  { id: 'IMP-030', phase: 'sol', categorie: 'Nature du sol', sous_categorie: 'Roche', probleme: 'Roche ou dalles non détectées par les sondages', cause: 'couverture d’essais insuffisante', consequence: 'abattage nécessaire, engins inadaptés, surcoût et retard', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêter, brise-roche, réévaluer le mode d’exécution', prevention: 'sondages densifiés sur les points singuliers (raccordements, ouvrages)', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'déduit', contextes: ['massif', 'viticole'] },
  { id: 'IMP-031', phase: 'sol', categorie: 'Eau', sous_categorie: 'Nappe', probleme: 'Remontée de nappe dans la fouille', cause: 'niveau saisonnier mal appréhendé, forte pluie', consequence: 'fouille impraticable, remblai délavé, pompage continu', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'pompage, protection des talus, reprise du fond de fouille', prevention: 'relevé piézométrique en période défavorable, prévoir le pompage au marché', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['lagune', 'littoral', 'zone_humide'] },
  { id: 'IMP-032', phase: 'sol', categorie: 'Stabilité', sous_categorie: 'Talus', probleme: 'Éboulement de talus en fouille', cause: 'talus non blindé, vibrations d’engin, sol saturé', consequence: 'ensevelissement possible, reprise complète de l’excavation', gravite: 'Catastrophique', frequence: 'Rare', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'évacuer la zone, secours, étaiement avant reprise', prevention: 'blindage ou talutage selon l’étude, interdiction de stationner en crête', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'littoral'] },
  { id: 'IMP-033', phase: 'sol', categorie: 'Sous-sol', sous_categorie: 'Cavités', probleme: 'Cavité, ancien puits ou cave non recensée découverte en terrassant', cause: 'sous-sol ancien non cartographié', consequence: 'arrêt, comblement, risque de rupture sous un engin', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'évacuer la zone, baliser, faire constater et combler', prevention: 'consulter la carte des cavités (Géorisques) ; sondages en zone à risque', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['urbain_ancien', 'massif', 'viticole'] },
  { id: 'IMP-034', phase: 'sol', categorie: 'Pollution', sous_categorie: 'Découverte', probleme: 'Sol pollué, dépôt de déchets ou cuve enterrée découverts en fouille', cause: 'activité ancienne mal documentée (artisanat, station-service, remblai)', consequence: 'évacuation en filière adaptée, analyse, arrêt de la zone', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'cantonner, ne pas mélanger, faire analyser avant évacuation', prevention: 'consulter BASIAS/BASOL, étude historique du site avant travaux', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['zone_activites', 'urbain_ancien'] },
  { id: 'IMP-035', phase: 'sol', categorie: 'Sous-sol', sous_categorie: 'Matière dangereuse', probleme: 'Amiante ou matériaux amiantés dans le sol ou les enrobés', cause: 'réseaux ou revêtements posés avant interdiction', consequence: 'arrêt, mode opératoire spécifique, évacuation en filière spécialisée', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'stopper, baliser, appliquer le mode opératoire amiante, protéger les opérateurs', prevention: 'repérage amiante avant travaux (RAT) sur tout réseau ou revêtement suspect', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_activites'] },
  { id: 'IMP-036', phase: 'sol', categorie: 'Géométrie', sous_categorie: 'Niveaux', probleme: 'Fond de forme ou fil d’eau hors des tolérances de pente', cause: 'réglage à vue, contrôle insuffisant, base topographique mal contrôlée', consequence: 'stagnation d’eau, reprise partielle, non-conformité à la réception', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'refaire le réglage, contrôler au niveau et au profil en long', prevention: 'contrôle systématique avant remblai, points de niveau fréquents', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_recent', 'lagune'] },

  // ── D. Réseaux existants ──────────────────────────────────────────
  { id: 'IMP-040', phase: 'reseaux', categorie: 'Réseau non identifié', sous_categorie: 'Découverte', probleme: 'Réseau non identifié découvert en creusant', cause: 'réseau non déclaré, abandonné non déposé, branchement privé', consequence: 'arrêt obligatoire de la zone, constat contradictoire, délai', gravite: 'Critique', frequence: 'Fréquente', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'suspendre les travaux, sécuriser, informer par écrit le maître d’ouvrage, constat (cerfa 14767)', prevention: 'plans à jour, marquage-piquetage contradictoire, sondages en zone douteuse', source: 'guichet_unique', date: '2015-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_activites', 'viticole'] },
  { id: 'IMP-041', phase: 'reseaux', categorie: 'Écart au plan', sous_categorie: 'Profondeur', probleme: 'Profondeur réelle très différente de celle annoncée', cause: 'relevé ancien imprécis, remblais successifs', consequence: 'godet dans le réseau malgré une marge apparente', gravite: 'Critique', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêt, sondage progressif en méthode douce', prevention: 'jamais de tranchée à l’aveugle sous la cote annoncée : sondage-témoin d’abord', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-042', phase: 'reseaux', categorie: 'Endommagement', sous_categorie: 'Gaz', probleme: 'Atteinte d’une conduite de gaz en service', cause: 'absence de sondage, méthode inadaptée, marquage effacé', consequence: 'fuite, périmètre de sécurité, procédure gaz renforcée, explosion possible', gravite: 'Catastrophique', frequence: 'Rare', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêt total, interdiction de fumer, périmètre, appel de l’exploitant (numéro d’urgence), évacuation si nécessaire', prevention: 'DICT à jour, sondages, mise hors service si nécessaire, formation AIPR', source: 'observatoire_dt_dict', date: '2020-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien', 'urbain_recent'] },
  { id: 'IMP-043', phase: 'reseaux', categorie: 'Endommagement', sous_categorie: 'Électricité', probleme: 'Câble électrique sectionné par un engin ou un outil', cause: 'câble hors plan, profondeur faible, détection incomplète', consequence: 'risque d’électrisation, coupure de secteur, intervention de l’exploitant', gravite: 'Catastrophique', frequence: 'Rare', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'ne pas toucher, éloigner les personnes, alerter gestionnaire et secours', prevention: 'détection par induction, mise hors tension, distances de sécurité respectées', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_activites'] },
  { id: 'IMP-044', phase: 'reseaux', categorie: 'Endommagement', sous_categorie: 'Eau', probleme: 'Canalisation d’eau potable crevée : fouille inondée', cause: 'réseau à une profondeur inattendue, absence de sondage', consequence: 'coupure d’eau, inondation, pompage, réparation sous pression', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'fermer la vanne avec l’exploitant, pomper, réparer, rincer', prevention: 'repérage des vannes, sondage avant excavation profonde', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['urbain_ancien'] },
  { id: 'IMP-045', phase: 'reseaux', categorie: 'Endommagement', sous_categorie: 'Télécom', probleme: 'Fibre ou câble télécom arraché (fourreau écrasé, câble coupé)', cause: 'réseau dense en chambre, détection peu fiable sur les fourreaux', consequence: 'coupure d’un quartier, réparation longue (soudure optique)', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêter, protéger, déclarer à l’exploitant, photos', prevention: 'photos avant travaux, sondage des chambres, coordination avec les opérateurs', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-046', phase: 'reseaux', categorie: 'Récolement', sous_categorie: 'Traçabilité', probleme: 'Récolement non fait ou faux : le prochain chantier frappera au même endroit', cause: 'levé oublié, plan non mis à jour, copie de l’ancien plan', consequence: 'dégât futur garanti, recherche de responsabilité', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'non', detection_pendant: 'partiel', action_immediate: 'lever le récolement avant remblai, transmettre à l’exploitant', prevention: 'récolement contractuel avant remblaiement, contrôle par échantillon', source: 'guichet_unique', date: '2015-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'grande_voirie'] },

  // ── E. Météo / environnement ──────────────────────────────────────
  { id: 'IMP-050', phase: 'meteo', categorie: 'Pluie', sous_categorie: 'Impraticabilité', probleme: 'Chantier impraticable après plusieurs jours de pluie', cause: 'sol argileux, plateforme non traitée, ruissellement', consequence: 'arrêt des terrassements, ornières, reprise de plateforme', gravite: 'Modérée', frequence: 'Très fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'stopper la circulation, protéger les zones travaillées, purger et recomposer', prevention: 'plateforme traitée, assainissement provisoire, planning avec aléa météo', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['viticole', 'lagune', 'urbain_recent'] },
  { id: 'IMP-051', phase: 'meteo', categorie: 'Pluie', sous_categorie: 'Ruissellement', probleme: 'Ruissellement chargé qui inonde une propriété en aval du chantier', cause: 'terre nue, absence de décantation ou de merlon', consequence: 'plainte, remise en état, mise en cause', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'dévier, mettre en place décantation, constater les dégâts', prevention: 'bassin de décantation provisoire, merlon, nettoyage des points bas', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['viticole', 'urbain_recent'] },
  { id: 'IMP-052', phase: 'meteo', categorie: 'Chaleur', sous_categorie: 'Canicule', probleme: 'Journées de forte chaleur : arrêt ou décalage des postes', cause: 'épisode caniculaire, absence d’ombre, équipements (EPI) contraignants', consequence: 'perte de production, risque de malaise, décalage horaire', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'décaler tôt le matin, pauses fréquentes, eau à disposition, surveillance mutuelle', prevention: 'plan canicule (horaires, zones ombragées, hydratation, surveillance des nouveaux)', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['littoral', 'massif', 'urbain_recent'] },
  { id: 'IMP-053', phase: 'meteo', categorie: 'Vent', sous_categorie: 'Levage', probleme: 'Vent fort : grue ou nacelle immobilisée', cause: 'rafales au-delà des limites du constructeur', consequence: 'arrêt du levage, équipes en attente, décalage', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêter les manutentions en hauteur, sécuriser les charges et le matériel léger', prevention: 'suivi météo, planifier les levages critiques tôt, limite anémométrique connue', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['littoral', 'grande_voirie'] },
  { id: 'IMP-054', phase: 'meteo', categorie: 'Épisode méditerranéen', sous_categorie: 'Submersion', probleme: 'Épisode pluvieux intense / submersion marine sur chantier littoral', cause: 'épisode méditerranéen, surcote, mer forte', consequence: 'chantier noyé, matériel endommagé, mise en sécurité des équipes', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'évacuer, mettre le matériel en sécurité, suivre la vigilance officielle', prevention: 'prise en compte du calendrier des marées et de la vigilance météo ; pas de stockage en zone basse', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['littoral', 'lagune', 'zone_humide'] },
  { id: 'IMP-055', phase: 'meteo', categorie: 'Incendie', sous_categorie: 'Massif', probleme: 'Interdiction d’accès aux massifs et risque incendie (travaux en été)', cause: 'arrêté préfectoral d’accès aux massifs, risque très sévère', consequence: 'arrêt du chantier, fermeture de pistes, retard', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêter les travaux concernés, appliquer les obligations (débroussaillage, points d’eau, permis de feu)', prevention: 'consulter l’arrêté d’accès aux massifs, planifier hors période rouge', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['massif'] },

  // ── F. Engins / matériel ──────────────────────────────────────────
  { id: 'IMP-060', phase: 'engins', categorie: 'Panne', sous_categorie: 'Hydraulique', probleme: 'Fuite hydraulique importante : engin à l’arrêt', cause: 'flexible usé, joint défaillant, entretien insuffisant', consequence: 'immobilisation, pollution du sol, retard', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêter l’engin, absorber la pollution, réparer ou remplacer', prevention: 'contrôle des fuites en prise de poste, kit anti-pollution sur chantier', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_humide'] },
  { id: 'IMP-061', phase: 'engins', categorie: 'Panne', sous_categorie: 'Immobilisation', probleme: 'Engin critique en panne au moment du poste clé', cause: 'usure, absence de VGP, pièce indisponible', consequence: 'arrêt de la chaîne, location en urgence coûteuse', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'dépannage, engin de remplacement, réorganisation du poste', prevention: 'VGP à jour, contrat de dépannage, engin de secours identifié sur les chantiers longs', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'rapporté', contextes: ['grande_voirie'] },
  { id: 'IMP-062', phase: 'engins', categorie: 'Stabilité', sous_categorie: 'Renversement', probleme: 'Renversement d’engin sur talus ou plateforme non stabilisée', cause: 'dévers, sol meuble, chargement au-delà de la capacité', consequence: 'accident grave, engin détruit, arrêt du chantier', gravite: 'Catastrophique', frequence: 'Rare', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'secours, sécuriser, enquête, remise en état de la plateforme avant reprise', prevention: 'porter la ceinture (elle empêche l’écrasement), plateforme contrôlée, dévers limité', source: 'carsat', date: '2022-01-01', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['littoral', 'viticole', 'massif'] },
  { id: 'IMP-063', phase: 'engins', categorie: 'Coactivité', sous_categorie: 'Angle mort', probleme: 'Piéton ou compagnon dans l’angle mort d’un engin en manœuvre', cause: 'cheminement piéton non séparé, absence de guideur', consequence: 'écrasement, accident mortel possible', gravite: 'Catastrophique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêt d’urgence, secours, retour d’expérience immédiat', prevention: 'cheminements piétons séparés et balisés, guideur, caméras, règles de priorité', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'grande_voirie'] },
  { id: 'IMP-064', phase: 'engins', categorie: 'Guidage', sous_categorie: 'Calibration', probleme: 'Système de guidage GPS mal calibré : profil décalé', cause: 'étalonnage non refait, référence erronée', consequence: 'tranchée hors tracé, rattrapage, conflit avec les réseaux', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêter, recalibrer sur deux points connus, contrôler par levé', prevention: 'calibration en début de poste et après tout choc ; contrôle indépendant', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'déduit', contextes: ['grande_voirie'] },

  // ── G. Main-d’œuvre ───────────────────────────────────────────────
  { id: 'IMP-070', phase: 'main_oeuvre', categorie: 'Absence', sous_categorie: 'Maladie', probleme: 'Absence de dernière minute : équipe incomplète', cause: 'maladie, accident domestique, intempérie personnelle', consequence: 'poste décalé, surcharge des présents', gravite: 'Modérée', frequence: 'Très fréquente', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'réaffecter les tâches critiques, faire appel à la liste d’intérimaires', prevention: 'polyvalence des équipes, liste d’intérimaires à jour, postes critiques doublés', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'rapporté', contextes: ['urbain_recent'] },
  { id: 'IMP-071', phase: 'main_oeuvre', categorie: 'Compétence', sous_categorie: 'Inexpérience', probleme: 'Tâche confiée à quelqu’un qui ne l’a jamais faite', cause: 'affectation d’urgence, encadrement absent', consequence: 'erreur d’exécution, reprise, accident', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'stopper, refaire sans reproche, former ou réaffecter', prevention: 'matrice de compétences, tutorat des nouveaux, briefing avant tâche nouvelle', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_recent', 'littoral'] },
  { id: 'IMP-072', phase: 'main_oeuvre', categorie: 'Compréhension', sous_categorie: 'Consigne', probleme: 'Consigne mal comprise (langue, bruit, jargon, consigne orale)', cause: 'transmission orale, absent de consigne écrite, langue d’origine différente', consequence: 'travail à refaire, dégât, presque-accident', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'faire reformuler la consigne par l’exécutant, réécrire en phrases courtes', prevention: 'consignes écrites illustrées, vérification par reformulation, pictogrammes', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-073', phase: 'main_oeuvre', categorie: 'Fatigue', sous_categorie: 'Cadence', probleme: 'Effet de la fatigue sur la vigilance en fin de journée ou fin de semaine', cause: 'heures supplémentaires cumulées, rattrapage de retard', consequence: 'erreur, accident, non-qualité', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'pause, répartition des tâches sensibles sur les heures fraîches', prevention: 'limiter le cumul, planifier les tâches à risque tôt, surveiller les signes', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['grande_voirie'] },

  // ── H. Sécurité ───────────────────────────────────────────────────
  { id: 'IMP-080', phase: 'securite', categorie: 'Ensevelissement', sous_categorie: 'Tranchée', probleme: 'Travailleur en fond de tranchée non protégé', cause: 'tranchée non blindée, accès direct sans échelle, profondeur sous-estimée', consequence: 'ensevelissement, asphyxie, décès', gravite: 'Catastrophique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêt immédiat, retrait des personnes, blindage ou talutage', prevention: 'blindage obligatoire au-delà du seuil, échelle tous les 10 m, surveillance de surface', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'zone_activites'] },
  { id: 'IMP-081', phase: 'securite', categorie: 'Électrisation', sous_categorie: 'Aérien', probleme: 'Franchissement d’une distance de sécurité sous une ligne aérienne', cause: 'engin de levage ou châssis trop près, gabarit sous-estimé', consequence: 'arc électrique, électrisation, décès', gravite: 'Catastrophique', frequence: 'Rare', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'dégager l’engin sans en descendre si contact, alerter, baliser la zone', prevention: '3 m pour ≤ 50 kV, 5 m au-delà : balisage, butées de hauteur, mise hors tension', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_recent', 'grande_voirie', 'viticole'] },
  { id: 'IMP-082', phase: 'securite', categorie: 'Circulation', sous_categorie: 'Signalisation', probleme: 'Signalisation temporaire insuffisante ou dégradée', cause: 'vent, vandalisme, plan de signalisation non adapté à la vitesse', consequence: 'accident avec un usager, responsabilité de l’entreprise', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'reconstituer la signalisation, avertir la police/gendarmerie si accident', prevention: 'plan de signalisation validé, ronde de contrôle matin et soir, stock de remplacement', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['grande_voirie', 'urbain_ancien'] },
  { id: 'IMP-083', phase: 'securite', categorie: 'Plantage', sous_categorie: 'Piquets', probleme: 'Plantage de fiches ou de piquets dans le sol à l’aveugle (bordures, signalisation, clôtures)', cause: 'geste banal considéré sans risque', consequence: 'deux accidents graves recensés en 2024 par ce seul geste (réseaux enterrés atteints)', gravite: 'Catastrophique', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'arrêt, alerte exploitant, recherche du réseau par méthode douce', prevention: 'traiter le plantage comme un terrassement : DICT + marquage + détection', source: 'inrs_ts871', date: '2025-05-23', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_ancien', 'urbain_recent'] },
  { id: 'IMP-084', phase: 'securite', categorie: 'Presque-accident', sous_categorie: 'Remontée', probleme: 'Presque-accident non remonté, donc non traité', cause: 'peur de la sanction, formulaire trop lourd, culture orale', consequence: 'répétition du scénario jusqu’à l’accident', gravite: 'Forte', frequence: 'Très fréquente', detection_avant: 'non', detection_pendant: 'partiel', action_immediate: 'recueillir le récit sans jugement, corriger la situation, rediffuser en briefing', prevention: 'fiche de remontée ultra-courte, retour rapide sur les actions menées', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'rapporté', contextes: ['urbain_ancien'] },

  // ── I. Coordination ───────────────────────────────────────────────
  { id: 'IMP-090', phase: 'coordination', categorie: 'Coactivité', sous_categorie: 'Zones', probleme: 'Deux corps de métier dans la même zone au même moment', cause: 'planning non partagé, zones non attribuées', consequence: 'gêne, tension, risque d’accident, travaux refaits', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'séparer les zones dans l’heure, replanifier', prevention: 'plan de circulation et d’occupation des zones, réunion de coordination hebdomadaire', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['grande_voirie', 'zone_activites'] },
  { id: 'IMP-091', phase: 'coordination', categorie: 'Sous-traitant', sous_categorie: 'Absence', probleme: 'Sous-traitant annoncé absent le jour de son intervention', cause: 'surcharge, autre chantier prioritaire, confirmation verbale', consequence: 'attente d’une équipe entière, décalage en cascade', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'confirmer par écrit un nouveau créneau, réaffecter l’équipe présente', prevention: 'confirmation écrite J-1, créneau contractuel, fournisseur alternatif identifié', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['urbain_recent'] },
  { id: 'IMP-092', phase: 'coordination', categorie: 'Phasage', sous_categorie: 'Découpage', probleme: 'Découpage en phases incompatible avec l’accès des riverains', cause: 'phasage étudié sur plan sans reconnaissance terrain', consequence: 'accès coupé, médiation, reprise du phasage', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'créer un passage provisoire, informer les riverains, réviser le phasage', prevention: 'intégrer les accès riverains au plan de circulation dès la conception', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien'] },

  // ── J. Conception / études ────────────────────────────────────────
  { id: 'IMP-100', phase: 'conception', categorie: 'Plans', sous_categorie: 'Incohérence', probleme: 'Incohérence entre plans (réseaux secs / humides, niveaux, emprises)', cause: 'absence de synthèse, versions multiples', consequence: 'conflit en exécution, reprise, avenant', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'arrêter, réunir les parties, figer une version corrigée', prevention: 'synthèse des plans avant travaux, index de versions unique', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-101', phase: 'conception', categorie: 'Métrés', sous_categorie: 'Quantités', probleme: 'Quantités sous-évaluées au marché', cause: 'métré approximatif, oubli de poste', consequence: 'rupture d’approvisionnement, avenant, retard', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'commander le complément au plus vite, tracer l’écart', prevention: 'double lecture des métrés, marge sur les postes critiques', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['grande_voirie'] },
  { id: 'IMP-102', phase: 'conception', categorie: 'Découverte', sous_categorie: 'Contrainte tardive', probleme: 'Contrainte technique découverte tard (ouvrage non repéré, servitude)', cause: 'études de site incomplètes', consequence: 'modification de tracé, avenant, retard', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'stoppé la zone, informer le maître d’œuvre, proposer une variante', prevention: 'visite de site contradictoire + consultation des servitudes avant projet', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'déduit', contextes: ['urbain_ancien', 'viticole'] },

  // ── K. Administratif ──────────────────────────────────────────────
  { id: 'IMP-110', phase: 'administratif', categorie: 'Contrôle', sous_categorie: 'Non-conformité', probleme: 'Contrôle inopiné avec constat de non-conformité', cause: 'documents absents, marquage incomplet, habilitations non vérifiées', consequence: 'mise en demeure, arrêt possible, sanction', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'corriger immédiatement, tracer, former', prevention: 'auto-contrôle périodique sur les points les plus regardés (DT-DICT, EPI, balisage)', source: 'legifrance', date: '2015-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-111', phase: 'administratif', categorie: 'Marché', sous_categorie: 'Avenant', probleme: 'Travaux supplémentaires exécutés avant accord écrit', cause: 'pression du planning, urgence ressentie', consequence: 'travaux non payés, litige, tension avec le maître d’ouvrage', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'régulariser par constat contradictoire, photographies, ordre de service', prevention: 'aucun travail hors marché sans ordre écrit, même urgent', source: 'legifrance', date: '2015-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['grande_voirie'] },

  // ── L. Riverains / usagers ────────────────────────────────────────
  { id: 'IMP-120', phase: 'riverains', categorie: 'Nuisance', sous_categorie: 'Bruit', probleme: 'Plainte de riverains pour bruit ou horaires', cause: 'démarrage trop tôt, absence d’information préalable', consequence: 'médiation, contrainte horaire, tension', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'écouter, adapter les horaires des tâches bruyantes, informer', prevention: 'réunion d’information avant travaux, courrier, panneau avec numéro de contact', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-121', phase: 'riverains', categorie: 'Accès', sous_categorie: 'Propriété', probleme: 'Accès à un domicile ou à un commerce coupé sans solution', cause: 'phasage non anticipé, absence de passage provisoire', consequence: 'blocage, plainte, intervention de la mairie, retard', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'ouvrir un passage immédiatement, informer, s’excuser, tracer', prevention: 'maintenir un accès piéton permanent, prévoir les livraisons des commerces', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-122', phase: 'riverains', categorie: 'Dommage', sous_categorie: 'Véhicule', probleme: 'Véhicule ou clôture riveraine endommagés par un engin', cause: 'manœuvre en espace contraint, absence de reconnaissance', consequence: 'réclamation, expertise, indemnisation', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'constat amiable, photographies, déclaration à l’assurance', prevention: 'état des lieux photographique avant travaux, protection des points exposés', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'rapporté', contextes: ['urbain_ancien'] },
  { id: 'IMP-123', phase: 'riverains', categorie: 'Sécurité', sous_categorie: 'Intrusion', probleme: 'Personne extérieure qui entre sur le chantier (curiosité, vol)', cause: 'clôture incomplète, portail ouvert le soir', consequence: 'blessure, vol, responsabilité', gravite: 'Critique', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'faire sortir sans agressivité, fermer, consigner l’incident', prevention: 'clôture complète, fermeture systématique, éclairage, stockage sécurisé', source: 'inrs_ed790', date: '2009-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien', 'littoral'] },

  // ── M. Qualité ────────────────────────────────────────────────────
  { id: 'IMP-130', phase: 'qualite', categorie: 'Compactage', sous_categorie: 'Essais', probleme: 'Essai de compactage non conforme', cause: 'nombre de passes insuffisant, teneur en eau inadaptée, matériau non conforme', consequence: 'reprise du remblai, retard, coût', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'reprendre la zone, refaire l’essai en présence du contrôle', prevention: 'autocontrôle avant l’essai officiel, planche d’essai en début de chantier', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['grande_voirie'] },
  { id: 'IMP-131', phase: 'qualite', categorie: 'Réseaux neufs', sous_categorie: 'Essais', probleme: 'Fuite détectée à l’épreuve du réseau neuf posé', cause: 'joint mal assemblé, tuyau heurté pendant la pose', consequence: 'reprise d’une portion, réouverture de tranchée', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'localiser, reprendre, refaire l’épreuve avant remblai', prevention: 'épreuve avant remblai, dossier de pose, formation au jointoiement', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'documenté', contextes: ['urbain_recent'] },
  { id: 'IMP-132', phase: 'qualite', categorie: 'Enrobés', sous_categorie: 'Température', probleme: 'Enrobé mis en œuvre hors plage de température', cause: 'attente du camion, transport long, temps froid', consequence: 'adhérence et durabilité dégradées, arrachements à venir', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'refuser la charge si température hors plage, tracer le contrôle', prevention: 'créneaux serrés avec la centrale, contrôle de température à la mise en œuvre', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['grande_voirie'] },
  { id: 'IMP-133', phase: 'qualite', categorie: 'Finition', sous_categorie: 'Réseaux', probleme: 'Regard ou tampon posé au mauvais niveau : ressaut visible', cause: 'réglage tardif, chaussée reprofilée après coup', consequence: 'reprise localisée, insatisfaction, bruit', gravite: 'Faible', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'reprendre le réglage au bon niveau, avant réception', prevention: 'réglage des tampons après reprofilage définitif', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_ancien', 'grande_voirie'] },

  // ── N. Délais ─────────────────────────────────────────────────────
  { id: 'IMP-140', phase: 'delais', categorie: 'Intempéries', sous_categorie: 'Cumul', probleme: 'Cumul de jours d’intempérie non prévus au planning', cause: 'planning sans aléa météo, hiver/printemps pluvieux', consequence: 'décalage global, pénalités possibles', gravite: 'Forte', frequence: 'Très fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'recaler le chemin critique, informer par écrit le maître d’ouvrage', prevention: 'marge météo intégrée, clauses intempéries au marché', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['viticole', 'littoral'] },
  { id: 'IMP-141', phase: 'delais', categorie: 'Décision', sous_categorie: 'Validation', probleme: 'Validation d’un choix technique en attente côté maître d’ouvrage', cause: 'circuit de décision long, absence de relance tracée', consequence: 'équipes arrêtées sur un poste non bloquant en apparence', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'relance écrite datée, proposer une option par défaut avec date limite', prevention: 'délais de validation contractualisés, liste des décisions attendues en réunion', source: 'legifrance', date: '2015-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['grande_voirie'] },

  // ── O. Coûts ──────────────────────────────────────────────────────
  { id: 'IMP-150', phase: 'couts', categorie: 'Immobilisation', sous_categorie: 'Location', probleme: 'Engins de location immobilisés sans production (attente, météo)', cause: 'phasage glissant, engin gardé « au cas où »', consequence: 'coût de location sans valeur ajoutée', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'restituer ce qui n’est pas indispensable cette semaine', prevention: 'location calée sur le chemin critique, point hebdomadaire d’utilisation', source: 'fntp', date: '2020-2026', pays: 'FR', type_source: 'article professionnel', confiance: 'rapporté', contextes: ['grande_voirie'] },
  { id: 'IMP-151', phase: 'couts', categorie: 'Reprise', sous_categorie: 'Malfaçon', probleme: 'Reprise de travaux terminés (niveau, pente, finition)', cause: 'contrôle tardif, exigence découverte', consequence: 'coût de reprise, retard, tension', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'constater contradictoirement, chiffrer, planifier la reprise', prevention: 'point d’arrêt avant recouvrement, PV de contrôle par phase', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['urbain_recent'] },

  // ── P. Communication ──────────────────────────────────────────────
  { id: 'IMP-160', phase: 'communication', categorie: 'Information', sous_categorie: 'Version', probleme: 'Deux versions différentes d’un plan circulent en même temps', cause: 'diffusion par mail et par papier, pas d’index unique', consequence: 'exécution sur une version périmée, reprise', gravite: 'Forte', frequence: 'Occasionnelle', detection_avant: 'non', detection_pendant: 'oui', action_immediate: 'figer une version, marquer les anciennes « périmé », diffuser', prevention: 'un seul dépôt de documents, index de version, accusé de réception', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-161', phase: 'communication', categorie: 'Transmission', sous_categorie: 'Équipe', probleme: 'Consigne non transmise à l’équipe suivante (poste en 2×8 ou changement d’équipe)', cause: 'pas de passation écrite, information dans une seule tête', consequence: 'erreur d’exécution, sécurité engagée', gravite: 'Forte', frequence: 'Fréquente', detection_avant: 'non', detection_pendant: 'partiel', action_immediate: 'rétablir la passation, consigner par écrit', prevention: 'cahier de consignes par poste, transmission orale + écrite systématique', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['grande_voirie'] },

  // ── Q. Fin de chantier ────────────────────────────────────────────
  { id: 'IMP-170', phase: 'fin_chantier', categorie: 'Réception', sous_categorie: 'Réserves', probleme: 'Réserves nombreuses à la réception (finitions, niveaux, propreté)', cause: 'auto-contrôle insuffisant, précipitation de fin', consequence: 'réception repoussée, retenue de garantie, paiement différé', gravite: 'Modérée', frequence: 'Fréquente', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'traiter les réserves par ordre d’impact, produire les preuves de levée', prevention: 'pré-réception interne avec le même niveau d’exigence que le maître d’œuvre', source: 'legifrance', date: '2015-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_recent'] },
  { id: 'IMP-171', phase: 'fin_chantier', categorie: 'Dossier', sous_categorie: 'DOE', probleme: 'DOE incomplet : plans de récolement, notices, essais manquants', cause: 'collecte non organisée pendant le chantier', consequence: 'réception retardée, exploitation future aveugle', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'lister les pièces manquantes, relancer les fournisseurs, reconstituer', prevention: 'DOE alimenté en continu, responsable désigné, contrôle à 80 % d’avancement', source: 'cerema', date: '2020-2026', pays: 'FR', type_source: 'publication scientifique', confiance: 'documenté', contextes: ['grande_voirie'] },
  { id: 'IMP-172', phase: 'fin_chantier', categorie: 'Remise en état', sous_categorie: 'Voirie', probleme: 'Remise en état des voiries et accès non conforme ou incomplète', cause: 'travaux de fin traités à la hâte, matériaux manquants', consequence: 'réclamation de la collectivité, reprise à la charge de l’entreprise', gravite: 'Modérée', frequence: 'Occasionnelle', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'reprendre, photographier, faire constater', prevention: 'état des lieux avant/après, remise en état inscrite au marché', source: 'legifrance', date: '2015-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },

  // ── R. Rare mais grave ────────────────────────────────────────────
  { id: 'IMP-180', phase: 'rare_grave', categorie: 'Explosion', sous_categorie: 'Gaz', probleme: 'Explosion après atteinte d’une conduite de gaz', cause: 'endommagement non détecté, accumulation de gaz, source d’inflammation', consequence: 'destruction de bâtiment, blessés, décès, enquête judiciaire', gravite: 'Catastrophique', frequence: 'Très rare', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'évacuer, interdire toute flamme et tout moteur, appeler les secours et l’exploitant', prevention: 'DT-DICT, sondages, méthode douce, formation, détection de gaz avant travaux', source: 'observatoire_dt_dict', date: '2020-2026', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-181', phase: 'rare_grave', categorie: 'Inondation', sous_categorie: 'Soudaine', probleme: 'Crue soudaine d’un cours d’eau ou d’un canal pendant les travaux', cause: 'événement méditerranéen, ouvrage de régulation manipulé', consequence: 'équipes et matériel pris au piège, dégâts, arrêt long', gravite: 'Catastrophique', frequence: 'Très rare', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'mettre les personnes en hauteur, alerter, ne pas franchir les écoulements', prevention: 'vigilance et prévision de crue, plan de repli, pas de base de vie en zone basse', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['lagune', 'canal', 'zone_humide'] },
  { id: 'IMP-182', phase: 'rare_grave', categorie: 'Découverte', sous_categorie: 'Munitions', probleme: 'Découverte d’engin explosif ou de munitions anciennes', cause: 'terrain anciennement militaire ou bombardé', consequence: 'arrêt complet, périmètre, intervention des démineurs', gravite: 'Catastrophique', frequence: 'Très rare', detection_avant: 'partiel', detection_pendant: 'oui', action_immediate: 'ne pas toucher, baliser largement, alerter police/gendarmerie', prevention: 'consulter les archives de bombardements et les servitudes avant terrassement', source: 'georisques', date: '2020-2026', pays: 'FR', type_source: 'registre officiel', confiance: 'documenté', contextes: ['littoral', 'urbain_ancien', 'zone_activites'] },
  { id: 'IMP-183', phase: 'rare_grave', categorie: 'Accident', sous_categorie: 'Mortel', probleme: 'Accident mortel sur chantier', cause: 'combinaison de facteurs (habitude, pression, protection retirée, contrôle absent)', consequence: 'arrêt du chantier, enquête, procédure, impact durable sur les équipes', gravite: 'Catastrophique', frequence: 'Très rare', detection_avant: 'partiel', detection_pendant: 'non', action_immediate: 'secours, préservation des lieux, information de la hiérarchie et des autorités, soutien des équipes', prevention: 'prévention sur les gestes banals, autorité d’arrêt donnée à chacun, analyses de presque-accidents', source: 'carsat', date: '2022-01-01', pays: 'FR', type_source: 'rapport officiel', confiance: 'documenté', contextes: ['urbain_ancien'] },
  { id: 'IMP-184', phase: 'rare_grave', categorie: 'Pollution', sous_categorie: 'Accidentelle', probleme: 'Déversement d’hydrocarbures dans un réseau pluvial ou une lagune', cause: 'rupture hydraulique, avitaillement sauvage, cuve percée', consequence: 'pollution du milieu, plainte, dépollution, procédure', gravite: 'Critique', frequence: 'Très rare', detection_avant: 'oui', detection_pendant: 'oui', action_immediate: 'colmater la fuite, mettre un barrage absorbant, prévenir la commune et l’exploitant du réseau', prevention: 'kit anti-pollution, avitaillement sur aire étanche, vérification des capacités', source: 'oppbtp', date: '2020-2026', pays: 'FR', type_source: 'document technique', confiance: 'documenté', contextes: ['lagune', 'zone_humide', 'canal', 'littoral'] },
]);

/** Champs manquants à la base d'amorçage — ce qui reste à documenter. */
export const CHAMPS_RESTANTS = Object.freeze([
  'preuve chiffrée de fréquence par sous-catégorie (référentiel de coûts, rapports annuels)',
  'coût moyen constaté par type d’imprévu (observatoires, assurances, presse spécialisée)',
  'retour d’expérience local : marchés publics de l’agglomération et de la commune',
  'presse locale : incidents de chantier documentés sur le bassin de Thau',
  'comptage des presque-accidents déclarés (quasi inexistant dans les sources publiques)',
]);

// ───────────────────────── cascades d’imprévus ─────────────────────────

/**
 * Une CASCADE est l'enchaînement réel : un déclencheur, une suite d'événements
 * et une conséquence finale. C'est ce qui explique la plupart des retards
 * « inexplicables » à la lecture d’un planning.
 */
export const CASCADES = Object.freeze([
  { id: 'CAS-01', declencheur: 'Pluie soutenue plusieurs jours', etapes: ['plateforme détrempée', 'terrassements arrêtés', 'réseaux décalés', 'sous-traitant enrobés déplacé', 'location d’engins prolongée'], final: 'retard cumulé et surcoût de location + heures de rattrapage', contextes: ['viticole', 'lagune'] },
  { id: 'CAS-02', declencheur: 'Réseau non identifié découvert', etapes: ['arrêt de la zone', 'sondages et constat contradictoire', 'recherche de l’exploitant', 'modification de tracé', 'avenant'], final: 'retard de 5 à 15 jours et surcoût d’études', contextes: ['urbain_ancien', 'zone_activites'] },
  { id: 'CAS-03', declencheur: 'Livraison critique reportée', etapes: ['équipe en attente', 'tâche suivante décalée', 'sous-traitant suivant déplacé', 'rattrapage en heures supplémentaires'], final: 'retard d’une semaine et fatigue qui augmente le risque d’erreur', contextes: ['urbain_recent'] },
  { id: 'CAS-04', declencheur: 'Atteinte d’un branchement de gaz', etapes: ['arrêt immédiat', 'périmètre de sécurité', 'intervention de l’exploitant', 'procédure gaz renforcée', 'enquête et constat'], final: 'arrêt de plusieurs jours, procédure, coût et image dégradée', contextes: ['urbain_ancien'] },
  { id: 'CAS-05', declencheur: 'Panne de l’engin principal', etapes: ['poste arrêté', 'dépannage ou location relais', 'décalage du phasage', 'engins suivants bloqués'], final: '3 à 5 jours perdus sur le chemin critique', contextes: ['grande_voirie'] },
  { id: 'CAS-06', declencheur: 'Découverte de pollution', etapes: ['cantonnement de la zone', 'analyses', 'filière d’évacuation', 'avenant', 'décalage du planning'], final: 'retard de 2 à 4 semaines et surcoût d’évacuation', contextes: ['zone_activites'] },
  { id: 'CAS-07', declencheur: 'Sous-traitant défaillant', etapes: ['équipe en attente', 'recherche d’un remplaçant', 'négociation de délais', 'nouvelle mise en route'], final: '10 à 20 jours de retard et surcoût de mobilisation', contextes: ['urbain_recent'] },
  { id: 'CAS-08', declencheur: 'Prescription archéologique', etapes: ['arrêt de la zone', 'fouilles', 'réorganisation des équipes', 'décalage de la saison de travaux'], final: 'plusieurs semaines à plusieurs mois, rentabilité menacée', contextes: ['urbain_ancien'] },
  { id: 'CAS-09', declencheur: 'Épisode méditerranéen', etapes: ['mise en sécurité', 'chantier inondé', 'matériel à contrôler', 'nettoyage et remise en état'], final: 'arrêt d’une semaine, matériel endommagé, remise en état', contextes: ['littoral', 'lagune', 'zone_humide'] },
  { id: 'CAS-10', declencheur: 'Accident grave', etapes: ['secours', 'arrêt du chantier', 'enquête', 'reprise encadrée', 'soutien des équipes'], final: 'arrêt de plusieurs semaines, procédure, effet durable sur la vigilance', contextes: ['urbain_ancien'] },
  { id: 'CAS-11', declencheur: 'Intempéries + heures supplémentaires', etapes: ['fatigue', 'erreurs de réglage', 'reprises', 'nouveau décalage'], final: 'la vitesse de rattrapage détruit la qualité et nourrit le retard', contextes: ['grande_voirie'] },
  { id: 'CAS-12', declencheur: 'Réserves de réception', etapes: ['reprise des finitions', 'second passage sur site', 'paiement différé', 'déception du maître d’ouvrage'], final: 'trésorerie tendue sur le chantier suivant', contextes: ['urbain_recent'] },
]);

// ───────────────────────── signaux faibles ─────────────────────────

/**
 * Les signaux faibles sont ce qu'on peut OBSERVER avant que ça casse. Un
 * signal faible n'est pas une preuve : c'est une invitation à vérifier.
 */
export const SIGNAUX_FAIBLES = Object.freeze([
  { signal: 'Le fournisseur ne reconfirme pas la date de livraison', probleme: 'retard de livraison imminent', action: 'appeler, exiger une date écrite, activer le fournisseur de repli', source: 'fntp' },
  { signal: 'Le sous-traitant ne répond plus au téléphone', probleme: 'défaillance ou désistement', action: 'confirmer par écrit, préparer un remplaçant', source: 'fntp' },
  { signal: 'Récépissé de DICT non reçu à J-8', probleme: 'travaux sans réponse d’exploitant', action: 'relancer, reporter la zone concernée, tracer', source: 'guichet_unique' },
  { signal: 'Marquage au sol effacé ou partiel', probleme: 'excavation à l’aveugle', action: 'refaire le marquage contradictoire avant de creuser', source: 'observatoire_dt_dict' },
  { signal: 'Un engin qui fume ou freine mal', probleme: 'panne immobilisante ou accident', action: 'immobiliser, VGP, réparer avant reprise', source: 'carsat' },
  { signal: 'Talus qui fissure ou qui suinte', probleme: 'éboulement', action: 'évacuer la zone, étayer, reprendre le talutage', source: 'inrs_ed790' },
  { signal: 'Odeur de gaz ou sifflement près d’une fouille', probleme: 'fuite de gaz', action: 'arrêt, évacuation, interdiction de flamme, alerte exploitant et secours', source: 'inrs_ts871' },
  { signal: 'Odeur d’hydrocarbures ou sol noirâtre', probleme: 'pollution du sol', action: 'cantonner, ne pas mélanger, analyser avant évacuation', source: 'georisques' },
  { signal: 'Cavité qui apparaît en fond de fouille', probleme: 'sous-sol instable', action: 'évacuer, baliser, expertise géotechnique', source: 'georisques' },
  { signal: 'Niveau d’eau qui remonte plus vite que prévu', probleme: 'nappe haute', action: 'renforcer le pompage, revoir le fond de fouille, protéger les talus', source: 'georisques' },
  { signal: 'Vigilance météo orange annoncée', probleme: 'arrêt imminent, dégâts sur matériel', action: 'sécuriser les zones basses, rentrer le petit matériel, avancer les tâches abritées', source: 'georisques' },
  { signal: 'Deux versions de plan sur le chantier', probleme: 'exécution sur une version périmée', action: 'figer une version, retirer les anciennes, diffuser', source: 'oppbtp' },
  { signal: 'Une consigne transmise seulement à l’oral', probleme: 'erreur d’exécution', action: 'écrire, faire reformuler, afficher au bungalow', source: 'oppbtp' },
  { signal: 'Un presque-accident raconté à la pause', probleme: 'accident futur', action: 'recueillir le récit, corriger, rediffuser en briefing', source: 'oppbtp' },
  { signal: 'Un compagnon qui refuse de porter ses EPI', probleme: 'rupture de la règle commune', action: 'recadrer par le chef d’équipe, vérifier la cause (confort, taille, usure)', source: 'inrs_ed790' },
  { signal: 'Signalisation temporaire déplacée par le vent ou par des véhicules', probleme: 'accident avec un usager', action: 'ronde de contrôle, stock de remplacement', source: 'oppbtp' },
  { signal: 'Essai d’autocontrôle non fait avant le contrôle officiel', probleme: 'essai non conforme', action: 'planifier l’autocontrôle en amont, ne pas improviser', source: 'cerema' },
  { signal: 'Empilement de matériaux dans les circulations', probleme: 'chute, incendie, entrave à l’évacuation', action: 'dégager, réorganiser les zones de stockage', source: 'oppbtp' },
  { signal: 'Heures supplémentaires qui s’accumulent sans récupération', probleme: 'erreurs et accident', action: 'rééquilibrer, rotation, revoir les objectifs de la semaine', source: 'inrs_ed790' },
  { signal: 'Une seule personne détient l’information clé', probleme: 'blocage en cas d’absence', action: 'écrire la procédure, former une doublure, documenter', source: 'oppbtp' },
  { signal: 'Le maître d’ouvrage ne valide pas dans les délais annoncés', probleme: 'arrêt de fait sur des choix bloquants', action: 'relance écrite, proposer une option par défaut datée', source: 'legifrance' },
  { signal: 'Des riverains posent des questions de plus en plus précises', probleme: 'conflit naissant', action: 'réunion courte sur place, information écrite, contact dédié', source: 'cerema' },
]);

// ───────────────────────── fonctions (pures) ─────────────────────────

/** Filtre la base : phase, catégorie, gravité, contexte, texte libre. */
export function filtrerImprevus({ phase, categorie, gravite, contexte, texte, confiance } = {}) {
  const t = String(texte || '').toLowerCase();
  return IMPREVUS.filter((i) => {
    if (phase && i.phase !== phase) return false;
    if (categorie && i.categorie !== categorie) return false;
    if (gravite && i.gravite !== gravite) return false;
    if (confiance && i.confiance !== confiance) return false;
    if (contexte && !(i.contextes || []).includes(contexte)) return false;
    if (t && !`${i.probleme} ${i.cause} ${i.consequence}`.toLowerCase().includes(t)) return false;
    return true;
  });
}

const POIDS_GRAVITE = { Faible: 1, 'Modérée': 2, Forte: 3, Critique: 4, Catastrophique: 5 };
const POIDS_FREQUENCE = { 'Très fréquente': 5, 'Fréquente': 4, Occasionnelle: 3, Rare: 2, 'Très rare': 1 };
const POIDS_FACILITE = {
  'facilement prévisible': 1,
  'prévisible avec de bonnes données': 2,
  'difficilement prévisible': 4,
  'quasiment imprévisible': 5,
};

/** Note de gravité (1-5) d'une fiche. */
export function poidsGravite(imprevu) {
  return POIDS_GRAVITE[imprevu?.gravite] || 0;
}

/** Note de fréquence (1-5) d'une fiche. */
export function poidsFrequence(imprevu) {
  return POIDS_FREQUENCE[imprevu?.frequence] || 0;
}

/**
 * Prévisibilité déduite de la fiche : un problème sur réseau non déclaré est
 * difficilement prévisible, un retard de livraison l'est beaucoup plus.
 * `confiance: 'déduit'` — c'est une aide au tri, pas une vérité.
 */
export function previsibilite(imprevu) {
  if (!imprevu) return 'difficilement prévisible';
  if (imprevu.detection_avant === 'non') return 'difficilement prévisible';
  if (imprevu.detection_avant === 'partiel') return 'prévisible avec de bonnes données';
  if (String(imprevu.frequence).startsWith('Très rare')) return 'quasiment imprévisible';
  return 'facilement prévisible';
}

/** Note de difficulté à prévoir (1-5). */
export function poidsPrevisibilite(imprevu) {
  return POIDS_FACILITE[previsibilite(imprevu)] || 0;
}

/** Les n premiers problèmes selon un critère : gravite, frequence, imprevisibilite. */
export function top(n = 10, critere = 'gravite', liste = IMPREVUS) {
  const note = critere === 'frequence' ? poidsFrequence
    : critere === 'imprevisibilite' ? poidsPrevisibilite
      : poidsGravite;
  return [...liste]
    .sort((a, b) => note(b) - note(a) || poidsGravite(b) - poidsGravite(a))
    .slice(0, Math.max(0, n));
}

/** Cascades touchant un contexte de terrain. */
export function cascadesPour(contexte) {
  if (!contexte) return [...CASCADES];
  return CASCADES.filter((c) => (c.contextes || []).includes(contexte));
}

/** Signaux faibles rattachés à un problème (recherche par mots-clés). */
export function signauxPour(motCle) {
  const t = String(motCle || '').toLowerCase();
  if (!t) return [...SIGNAUX_FAIBLES];
  return SIGNAUX_FAIBLES.filter((s) => `${s.signal} ${s.probleme} ${s.action}`.toLowerCase().includes(t));
}

/**
 * Le point d'entrée du module TERRITOIRE : « sur CE terrain, à CETTE étape,
 * qu'est-ce qui peut mal tourner ? » Retourne les fiches du contexte triées par
 * gravité, plus les cascades et les signaux associés.
 */
export function imprevusPourTerrain({ contexte, phase } = {}) {
  const liste = filtrerImprevus({ contexte, phase });
  return {
    contexte: contexte || null,
    phase: phase || null,
    problemes: top(12, 'gravite', liste),
    total: liste.length,
    cascades: cascadesPour(contexte),
    signaux: SIGNAUX_FAIBLES.slice(0, 8),
  };
}

/** Statistiques de couverture de la base (affichées dans le module). */
export function statistiquesImprevus(liste = IMPREVUS) {
  const par = (cle) => {
    const m = new Map();
    for (const i of liste) m.set(i[cle], (m.get(i[cle]) || 0) + 1);
    return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
  };
  return {
    total: liste.length,
    parPhase: par('phase'),
    parGravite: par('gravite'),
    parConfiance: par('confiance'),
    cascades: CASCADES.length,
    signaux: SIGNAUX_FAIBLES.length,
  };
}

/**
 * CSV de la base filtrée (colonnes du contrat, séparateur « ; »).
 * Les listes sont sérialisées en JSON pour rester relisibles.
 */
export function versCsvImprevus(liste = IMPREVUS) {
  const cellule = (v) => {
    if (v === null || v === undefined) return '';
    const t = Array.isArray(v) ? v.join('|') : String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lignes = [COLONNES.join(';')];
  for (const i of liste) lignes.push(COLONNES.map((c) => cellule(i[c])).join(';'));
  return lignes.join('\n');
}
