/**
 * WATCHTOWER — DOSSIER DE CHANTIER (base de données, matrice de pièces).
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Généré par `tools/extraire-dossier-chantier.mjs` depuis :
 *   · DOSSIER-CHANTIER-INDEX.md — inventaire classé d'un dossier de marché réel
 *
 * Empreinte de la source : 7bf29a06aa026aac
 *
 * Ce que c'est : la preuve, pièce par pièce, de ce que contient RÉELLEMENT un
 * dossier de chantier public — 220 fichiers réels, du CCTP au DOE, en passant
 * par les récepissés DT/DICT et les ordres de service. La vue INTEL s'en sert
 * de gabarit : quand elle décrit un chantier, elle sait quelles pièces doivent
 * exister, et lesquelles manquent au dossier examiné.
 *
 * « Présente » veut dire : un fichier de l'inventaire correspond au motif.
 * Cela ne dit rien de la validité de la pièce — c'est un inventaire, pas un
 * contrôle de conformité.
 */

/** Provenance et cadre. */
export const PROVENANCE_CHANTIER = Object.freeze({
  source: "DOSSIER-CHANTIER-INDEX.md",
  empreinte: "7bf29a06aa026aac",
  nature: 'Dossier de marché construction (Lotissement Pruniaux / Giratoire de Barbazan / NOE) — 220 fichiers, archivés le 07/10/2026',
  avertissement: 'Inventaire de fichiers, pas contrôle de conformité : « présente » signifie qu’un fichier correspond, pas que la pièce est valable.',
});

/** Les 12 catégories de l'inventaire, avec leurs volumes. */
export const CATEGORIES_CHANTIER = Object.freeze([
  { nom: "Prescriptions d'exécution F2–F39 (corps d'état)", fichiers: 30, tailleMo: 56.9 },
  { nom: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", fichiers: 20, tailleMo: 19.9 },
  { nom: "Consultation entreprises (DCE, mémoires, DICT)", fichiers: 21, tailleMo: 16.1 },
  { nom: "Devis, prix & budget", fichiers: 10, tailleMo: 9.7 },
  { nom: "Planning & délais", fichiers: 4, tailleMo: 2.6 },
  { nom: "Administration, salaires & autorisations", fichiers: 11, tailleMo: 12.8 },
  { nom: "Plans, situations & plans d'exécution", fichiers: 30, tailleMo: 22.2 },
  { nom: "Images & vues (satellite, streetview)", fichiers: 9, tailleMo: 11.9 },
  { nom: "Suivi de chantier (comptes-rendus, fiches, factures)", fichiers: 24, tailleMo: 6 },
  { nom: "Signalisation & sécurité", fichiers: 5, tailleMo: 13.1 },
  { nom: "Références techniques & normes (guides, DTU, normes)", fichiers: 11, tailleMo: 14.8 },
  { nom: "Travaux & corps d'état (terrassements, chaussées, voirie)", fichiers: 39, tailleMo: 27.4 },
  { nom: "Divers", fichiers: 6, tailleMo: 11.6 },
]);

/** Le catalogue complet (220 fichiers). */
export const FICHIERS_CHANTIER = Object.freeze([
  { nom: "F2 - Terrassements généraux.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.2 },
  { nom: "F23 - Fournitures de granulats employés à la construction et à l’entretien des chaussées.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.6 },
  { nom: "F24 - Fourniture de liants bitumineux pour la construction et l’entretien des chaussées.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2.4 },
  { nom: "F25 - Exécution des corps de chaussées.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.9 },
  { nom: "F26 - Exécution des enduits superficiels d’usure.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2 },
  { nom: "F27 - Fabrication et mise en oeuvre des enrobés hydrocarbonés.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.3 },
  { nom: "F28 - Exécution des chaussées en béton.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.6 },
  { nom: "F29 - Exécution des revêtements de voiries et espaces publics en produits modulaires.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.7 },
  { nom: "F31 - Bordures et caniveaux en pierre naturelle ou en béton et dispositif de retenue en béton.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2 },
  { nom: "F32 - Construction de trottoirs.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.45 },
  { nom: "F34 - Travaux forestiers de boisement.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1 },
  { nom: "F35 - Aménagements paysagers- Aires de sports et de loisirs en plein air.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2.6 },
  { nom: "F36 -Réseau d’éclairage public- Conception et réalisation.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.7 },
  { nom: "F39 - Travaux d’assainissement et de drainage de terres agricoles.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.2 },
  { nom: "F62-V - Règles techniques de conception et de calcul des fondations d’ouvrages de génie civil.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.9 },
  { nom: "F64 - Travaux de maçonnerie d’ouvrages de génie civil.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.49 },
  { nom: "F65 - Exécution des ouvrages de génie civil en béton armé ou précontraint.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2 },
  { nom: "F66 - Exécution des ouvrages de génie civil à ossature en acier.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.83 },
  { nom: "F67-I - Etanchéité des ponts routes- Support en béton de ciment.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.75 },
  { nom: "F67-III - Etanchéité des ouvrages souterrains.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 0.86 },
  { nom: "F70 - Ouvrages d’assainissement, Ouvrages de recueil, de restitution et de stockage des eaux pluviales.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 4.9 },
  { nom: "F71 - Fourniture et pose de conduites d’adduction et de distribution d’eau.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 4.7 },
  { nom: "F73 - Equipement hydraulique, mécanique et électrique des stations de pompage d’eaux.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.3 },
  { nom: "F74 - Construction des réservoirs en béton.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.7 },
  { nom: "F75 - Conception et exécution des installations de traitement des eaux destinées à la consommation humaine.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 3.3 },
  { nom: "F76 - Travaux de forage pour la recherche et l’exploitation d’eau potable.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2.1 },
  { nom: "F78 - Canalisations et ouvrages de transport et de distribution de chaleur ou de froid.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 2.5 },
  { nom: "F81-II - Conception et exécution d’installations d’épuration d’eaux usées.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 3.1 },
  { nom: "F82 - Construction d’installations d’incinération avec fours à grille, oscillants ou tournants de déchets ménagers, autres déchets non dangereux et DASRI.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 1.1 },
  { nom: "F85 - Construction d’installation de broyage des déchets ménagers.pdf", categorie: "Prescriptions d'exécution F2–F39 (corps d'état)", tailleMo: 3.8 },
  { nom: "03 - Acte d'engagement.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.03 },
  { nom: "04 - CCAP.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.17 },
  { nom: "05 - CCTP.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.32 },
  { nom: "06 - BPU.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.16 },
  { nom: "07 - DQE.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.12 },
  { nom: "10 - Récepissés DT .pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 1.1 },
  { nom: "Acte d-engagement.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.21 },
  { nom: "AIPR CORRECTION.xlsx", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 5.1 },
  { nom: "aipr test complet.xlsx", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 6.1 },
  { nom: "aipr test result.png", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.09 },
  { nom: "BPU LOT1 unique.xls", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.13 },
  { nom: "BPU LOT2 unique.xls", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.05 },
  { nom: "Cahier des Clauses Administratives Particulières.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.2 },
  { nom: "CCAP.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.09 },
  { nom: "CCTP LOT1.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.15 },
  { nom: "CCTP.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.29 },
  { nom: "CDPGF Noé Rempli Marché.xlsx", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.03 },
  { nom: "DQE VERIF.xls", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.37 },
  { nom: "LOT 2 CCTP.pdf", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 0.09 },
  { nom: "QCM AIPR Encadrant.xls", categorie: "Actes & marchés (engagement, CCAP/CCTP, réceptions)", tailleMo: 5.1 },
  { nom: "AE.doc", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.22 },
  { nom: "BP.doc", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.21 },
  { nom: "brochure_entreprises dict.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.47 },
  { nom: "ccag-travaux-2021.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.7 },
  { nom: "cerfa_14023-01.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.17 },
  { nom: "cerfa_14024-01.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.67 },
  { nom: "cerfa_14434 Dict.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.23 },
  { nom: "dc4mod2007.rtf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.11 },
  { nom: "dc5mod2007.rtf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.15 },
  { nom: "DICT.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.22 },
  { nom: "enedis demande Dict.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.22 },
  { nom: "Etude de dossier Giratoire de BARBAZAN Conduite M4 - L.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.11 },
  { nom: "Etude de dossier Lotissement Pruniaux Préparation M4 2022.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.1 },
  { nom: "invitation-première_reunion.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.27 },
  { nom: "memoire justificatif Giratoire.doc", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 10.8 },
  { nom: "mémoire technique v1.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.82 },
  { nom: "Notice DICT.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.18 },
  { nom: "REGLEMENT-CONSULTATION.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.07 },
  { nom: "Réglement de consultation.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.19 },
  { nom: "SOMMAIRE-DCE.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.02 },
  { nom: "UN MÉMOIRE TECHNIQUE.pdf", categorie: "Consultation entreprises (DCE, mémoires, DICT)", tailleMo: 0.14 },
  { nom: "23-LGPM-044_LABASTIDE D'ANJOU_DEVIS EXE ENTREPRISE-02-02-24.xls", categorie: "Devis, prix & budget", tailleMo: 0.57 },
  { nom: "Bibliothèque Prix Fournitures.xlsx", categorie: "Devis, prix & budget", tailleMo: 0.02 },
  { nom: "COURS etude de prix 2018.pdf", categorie: "Devis, prix & budget", tailleMo: 0.1 },
  { nom: "DE LOT 1 T1.xls", categorie: "Devis, prix & budget", tailleMo: 0.06 },
  { nom: "DE LOT 1 T2.xls", categorie: "Devis, prix & budget", tailleMo: 0.06 },
  { nom: "DE LOT 2 T1.xls", categorie: "Devis, prix & budget", tailleMo: 0.05 },
  { nom: "DE LOT 2 T2.xls", categorie: "Devis, prix & budget", tailleMo: 0.05 },
  { nom: "DETAIL-ESTIMATIF.xls", categorie: "Devis, prix & budget", tailleMo: 0.33 },
  { nom: "FACTURE DE SITUATION PHASE 1.xlsx", categorie: "Devis, prix & budget", tailleMo: 0.08 },
  { nom: "métré.xlsx", categorie: "Devis, prix & budget", tailleMo: 8.4 },
  { nom: "2024 - PLANNING ANNUEL S10.xlsx", categorie: "Planning & délais", tailleMo: 1.8 },
  { nom: "planning BARBAZAN (Enregistré automatiquement).pdf", categorie: "Planning & délais", tailleMo: 0.57 },
  { nom: "planning BARBAZAN (Enregistré automatiquement).xls", categorie: "Planning & délais", tailleMo: 0.13 },
  { nom: "planning BARBAZAN.xls", categorie: "Planning & délais", tailleMo: 0.11 },
  { nom: "Arrêté de circulation.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 1.2 },
  { nom: "AUTORISATION DE VOIRIE.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.75 },
  { nom: "DDE-ODP-SURPLOMB-SAILLIE-ENSEIGNE.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 7.5 },
  { nom: "demande d'arrete de circulation.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.6 },
  { nom: "doe.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.18 },
  { nom: "ordre de service.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.07 },
  { nom: "Permission et autorisation de voirie pour travaux.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.17 },
  { nom: "salaire_minima_hierarchiques_occitanie_2022_0.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.37 },
  { nom: "sivom.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.22 },
  { nom: "standard-interne-doe.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 1.6 },
  { nom: "tableau_reclassement_ETAM.pdf", categorie: "Administration, salaires & autorisations", tailleMo: 0.05 },
  { nom: "00 - Cartouche et Nomenclature.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.12 },
  { nom: "02 - Plan de situation.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.92 },
  { nom: "08 - Plan Etat des lieux.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.28 },
  { nom: "09 - Plan voirie - Eaux pluviales.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.46 },
  { nom: "20190318_F1106.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.17 },
  { nom: "5683-19.02.2018_controle-exterieur-de-ch.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.9 },
  { nom: "GEOPORTAIL.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 1.3 },
  { nom: "OJ-FT-Grilles_de_protection_pr_chambres_telecom_(E01062018).pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.44 },
  { nom: "Plan AEP 500e.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.68 },
  { nom: "Plan Assainissement 500e.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 1.4 },
  { nom: "Plan Assainissement bassin ouvert 500e.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 1.4 },
  { nom: "plan de situation 10000.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.75 },
  { nom: "Plan de situation.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 3 },
  { nom: "Plan Voirie 500e.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 1.3 },
  { nom: "PLAN-GENERAL-COORDINATION.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.22 },
  { nom: "PLAN-MASSE.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.88 },
  { nom: "PLAN-PHASE- enrobé.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.91 },
  { nom: "PLAN-PHASE- gnt-2.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.86 },
  { nom: "PLAN-PHASE- gnt-3.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.86 },
  { nom: "PLAN-PHASE- gnt-4.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.86 },
  { nom: "PLAN-PHASE- gnt.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.86 },
  { nom: "PLAN-PHASE-1 et 2 elargissement voie.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.86 },
  { nom: "PLAN-PHASE-3 création giratoire.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.93 },
  { nom: "PLAN-PROFIL-EN-LONG-AXE1.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.14 },
  { nom: "PLAN-PROFIL-EN-LONG-AXE2.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.14 },
  { nom: "PLAN-PROFIL-EN-LONG-AXE3.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.14 },
  { nom: "PLAN-PROFIL-EN-LONG-AXE4.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.14 },
  { nom: "PLAN-PROFIL-EN-LONG-GIRATOIRE.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.15 },
  { nom: "PLAN-PROFILS TYPE.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.67 },
  { nom: "PLAN-SITUATION.pdf", categorie: "Plans, situations & plans d'exécution", tailleMo: 0.41 },
  { nom: "aret 1.jpeg", categorie: "Images & vues (satellite, streetview)", tailleMo: 1.1 },
  { nom: "aret.jpeg", categorie: "Images & vues (satellite, streetview)", tailleMo: 0.82 },
  { nom: "couches-chaussee-différente couche 2.jpg", categorie: "Images & vues (satellite, streetview)", tailleMo: 0.15 },
  { nom: "couches-chaussee-différente couche.jpg", categorie: "Images & vues (satellite, streetview)", tailleMo: 0.05 },
  { nom: "essai hydraulique.JPG", categorie: "Images & vues (satellite, streetview)", tailleMo: 0.05 },
  { nom: "logo stagiaire tp.JPG", categorie: "Images & vues (satellite, streetview)", tailleMo: 0.09 },
  { nom: "satellite 85.PNG", categorie: "Images & vues (satellite, streetview)", tailleMo: 2.8 },
  { nom: "satellite.PNG", categorie: "Images & vues (satellite, streetview)", tailleMo: 4 },
  { nom: "streetview.PNG", categorie: "Images & vues (satellite, streetview)", tailleMo: 2.9 },
  { nom: "CHANTIER EN COURS-Nathan (2).xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.16 },
  { nom: "compte-rendu_n°1.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.13 },
  { nom: "compte-rendu_n°2.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.22 },
  { nom: "compte-rendu_n°3.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.13 },
  { nom: "compte-rendu_n°4.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.18 },
  { nom: "compte-rendu_n°5.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.19 },
  { nom: "compte-rendu_n°6.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.15 },
  { nom: "compte-rendu_n°7.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.14 },
  { nom: "compte-rendu_n°9.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.14 },
  { nom: "Dossier des Ouvrages Exécutés.docx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.01 },
  { nom: "Equipement 30-05.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.03 },
  { nom: "fiche de nonconformité.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.02 },
  { nom: "fiche de tache barbazan.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.16 },
  { nom: "fiche de tache Exemple bassin.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.04 },
  { nom: "fiche de tache NOE.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.38 },
  { nom: "fichetechnique9.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 1.1 },
  { nom: "O015_-_Fiche_n5_-_Essai_Double-anneau_FR.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.99 },
  { nom: "Page de garde - suivi chantier BARBAZAN.xls", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.14 },
  { nom: "Page de garde - suivi chantier noe.xls", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.14 },
  { nom: "Rapport Chantier NOE.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.58 },
  { nom: "Recours Barbazan.docx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.02 },
  { nom: "Recours Barbazan.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.18 },
  { nom: "Support animation - Fiches sensibilisation petits matériels.pdf", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.76 },
  { nom: "tableau recap 30-05.xlsx", categorie: "Suivi de chantier (comptes-rendus, fiches, factures)", tailleMo: 0.01 },
  { nom: "courrier-signalisation.pdf", categorie: "Signalisation & sécurité", tailleMo: 0.03 },
  { nom: "Signalisation OPPBTP.pdf", categorie: "Signalisation & sécurité", tailleMo: 5.2 },
  { nom: "SIGNALISATION TEMPORAIRE DES CHANTIERS 1.ppt", categorie: "Signalisation & sécurité", tailleMo: 5.7 },
  { nom: "SIGNALISATION TEMPORAIRE DES CHANTIERS 2.ppt", categorie: "Signalisation & sécurité", tailleMo: 1.3 },
  { nom: "SIGNALISATION TEMPORAIRE DEVIATIONS.ppt", categorie: "Signalisation & sécurité", tailleMo: 0.9 },
  { nom: "abréviation et signification.xlsx", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.12 },
  { nom: "blpc_231_33-38.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.46 },
  { nom: "Exemple de PAQ COLAS.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 3.9 },
  { nom: "fntp_journalkitpedago2015_v8.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 4.3 },
  { nom: "guide-conception-ice.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 1.3 },
  { nom: "notice_51404#01.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.1 },
  { nom: "notice_51406#01.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.1 },
  { nom: "PAQ_qualiroute.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 1.9 },
  { nom: "SeQuelec_Guide_3.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 2.3 },
  { nom: "TB-5.5-EN13036-4-Method-for-measurement-of-slip-resistance-of-a-surface-The-pendulum-test-FR.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.17 },
  { nom: "telecom.pdf", categorie: "Références techniques & normes (guides, DTU, normes)", tailleMo: 0.22 },
  { nom: "307732019R10FR_manuel-terrassement.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 3 },
  { nom: "arrachage arbre.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "bordure CC1.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "bordure I1.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.26 },
  { nom: "bordure I2.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "BORDURE P2.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.26 },
  { nom: "Bordures et Caniveaux.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 4.9 },
  { nom: "BORUDRE P1.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "confection surface en galet maconne giratoire.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "couche de fondation.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "couche de reprofilage.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "couche de roulement.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "couche de réglage.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "cunette.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "demo decoupe chaussé.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "DESC-v1.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.43 },
  { nom: "DESC.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.44 },
  { nom: "DESCexpl ss chant I OT 2.6.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.16 },
  { nom: "décapage terre végé.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "démolition trottoir ilot.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "essai de plaque.docx", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.02 },
  { nom: "Essai de qualité.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.18 },
  { nom: "essai.xlsx", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.22 },
  { nom: "glisière.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "ilot en béton et galet de garonne.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "janolene Ø110.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.26 },
  { nom: "Liant et gravillong.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.11 },
  { nom: "Manuel_exploitation.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 9 },
  { nom: "Module-15-Connaissance des essais des sols et des produits composés .pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 1.9 },
  { nom: "pvc Ø300.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "QUALITE.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.05 },
  { nom: "rabotage.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "regard 40x40.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "remblai d'apport.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "remplissage ilot en béton.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "reprise terre végétale.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "sciage chaussée.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "SDP terrassement & voirie.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.42 },
  { nom: "trottoir béton.pdf", categorie: "Travaux & corps d'état (terrassements, chaussées, voirie)", tailleMo: 0.25 },
  { nom: "enedis.pdf", categorie: "Divers", tailleMo: 0.22 },
  { nom: "lordre-de-service.pdf", categorie: "Divers", tailleMo: 0.13 },
  { nom: "lotissement la croix pruniau 03460 aurouer 2021 fps.pdf", categorie: "Divers", tailleMo: 9.6 },
  { nom: "objectif PAE2.pdf", categorie: "Divers", tailleMo: 0.11 },
  { nom: "SDN_P2_Pré_OPR_11-044_240104.xlsx", categorie: "Divers", tailleMo: 0.96 },
  { nom: "SDP TX.xls", categorie: "Divers", tailleMo: 0.58 },
]);

/**
 * La matrice de couverture : 27 pièces attendues sur 27 sont présentes.
 * C'est le gabarit d'une fiche chantier — et la liste de ce qu'un dossier
 * incomplet ne contient pas.
 */
export const COUVERTURE = Object.freeze([
  { cle: "acte-engagement", nom: "Acte d’engagement", phase: "consultation", presente: true, nombre: 2, exemples: ["03 - Acte d'engagement.pdf","Acte d-engagement.pdf"] },
  { cle: "ccap", nom: "CCAP — clauses administratives", phase: "consultation", presente: true, nombre: 3, exemples: ["04 - CCAP.pdf","Cahier des Clauses Administratives Particulières.pdf","CCAP.pdf"] },
  { cle: "cctp", nom: "CCTP — clauses techniques", phase: "consultation", presente: true, nombre: 4, exemples: ["05 - CCTP.pdf","CCTP LOT1.pdf","CCTP.pdf","LOT 2 CCTP.pdf"] },
  { cle: "bpu", nom: "BPU — bordereau des prix unitaires", phase: "consultation", presente: true, nombre: 3, exemples: ["06 - BPU.pdf","BPU LOT1 unique.xls","BPU LOT2 unique.xls"] },
  { cle: "dqe", nom: "DQE — devis quantitatif estimatif", phase: "consultation", presente: true, nombre: 7, exemples: ["07 - DQE.pdf","DQE VERIF.xls","DE LOT 1 T1.xls","DE LOT 1 T2.xls"] },
  { cle: "reglement-consultation", nom: "Règlement de la consultation", phase: "consultation", presente: true, nombre: 2, exemples: ["REGLEMENT-CONSULTATION.pdf","Réglement de consultation.pdf"] },
  { cle: "memoire-technique", nom: "Mémoire technique", phase: "consultation", presente: true, nombre: 3, exemples: ["memoire justificatif Giratoire.doc","mémoire technique v1.pdf","UN MÉMOIRE TECHNIQUE.pdf"] },
  { cle: "planning", nom: "Planning d’exécution", phase: "preparation", presente: true, nombre: 4, exemples: ["2024 - PLANNING ANNUEL S10.xlsx","planning BARBAZAN (Enregistré automatiquement).pdf","planning BARBAZAN (Enregistré automatiquement).xls","planning BARBAZAN.xls"] },
  { cle: "dt-dict", nom: "Récepissés DT / DICT", phase: "preparation", presente: true, nombre: 6, exemples: ["10 - Récepissés DT .pdf","brochure_entreprises dict.pdf","cerfa_14434 Dict.pdf","DICT.pdf"] },
  { cle: "autorisation-voirie", nom: "Autorisation de voirie", phase: "preparation", presente: true, nombre: 2, exemples: ["AUTORISATION DE VOIRIE.pdf","Permission et autorisation de voirie pour travaux.pdf"] },
  { cle: "arrete-circulation", nom: "Arrêté de circulation", phase: "preparation", presente: true, nombre: 2, exemples: ["Arrêté de circulation.pdf","demande d'arrete de circulation.pdf"] },
  { cle: "aipr", nom: "AIPR — autorisation d’intervention à proximité des réseaux", phase: "preparation", presente: true, nombre: 4, exemples: ["AIPR CORRECTION.xlsx","aipr test complet.xlsx","aipr test result.png","QCM AIPR Encadrant.xls"] },
  { cle: "plan-masse", nom: "Plan de masse", phase: "plans", presente: true, nombre: 1, exemples: ["PLAN-MASSE.pdf"] },
  { cle: "plan-situation", nom: "Plan de situation", phase: "plans", presente: true, nombre: 3, exemples: ["02 - Plan de situation.pdf","plan de situation 10000.pdf","Plan de situation.pdf"] },
  { cle: "plans-phase", nom: "Plans de phase (exécution)", phase: "plans", presente: true, nombre: 7, exemples: ["PLAN-PHASE- enrobé.pdf","PLAN-PHASE- gnt-2.pdf","PLAN-PHASE- gnt-3.pdf","PLAN-PHASE- gnt-4.pdf"] },
  { cle: "profils-long", nom: "Profils en long", phase: "plans", presente: true, nombre: 5, exemples: ["PLAN-PROFIL-EN-LONG-AXE1.pdf","PLAN-PROFIL-EN-LONG-AXE2.pdf","PLAN-PROFIL-EN-LONG-AXE3.pdf","PLAN-PROFIL-EN-LONG-AXE4.pdf"] },
  { cle: "plan-reseaux", nom: "Plans de réseaux (AEP, assainissement, voirie)", phase: "plans", presente: true, nombre: 5, exemples: ["09 - Plan voirie - Eaux pluviales.pdf","Plan AEP 500e.pdf","Plan Assainissement 500e.pdf","Plan Assainissement bassin ouvert 500e.pdf"] },
  { cle: "comptes-rendus", nom: "Comptes rendus de chantier", phase: "execution", presente: true, nombre: 8, exemples: ["compte-rendu_n°1.pdf","compte-rendu_n°2.pdf","compte-rendu_n°3.pdf","compte-rendu_n°4.pdf"] },
  { cle: "ordres-service", nom: "Ordres de service", phase: "execution", presente: true, nombre: 2, exemples: ["ordre de service.pdf","lordre-de-service.pdf"] },
  { cle: "fiches-tache", nom: "Fiches de tâche / suivi d’exécution", phase: "execution", presente: true, nombre: 3, exemples: ["fiche de tache barbazan.xlsx","fiche de tache Exemple bassin.xlsx","fiche de tache NOE.xlsx"] },
  { cle: "factures", nom: "Factures et situations", phase: "execution", presente: true, nombre: 5, exemples: ["FACTURE DE SITUATION PHASE 1.xlsx","02 - Plan de situation.pdf","plan de situation 10000.pdf","Plan de situation.pdf"] },
  { cle: "essais-controle", nom: "Essais et contrôle extérieur", phase: "execution", presente: true, nombre: 7, exemples: ["5683-19.02.2018_controle-exterieur-de-ch.pdf","essai hydraulique.JPG","O015_-_Fiche_n5_-_Essai_Double-anneau_FR.pdf","essai de plaque.docx"] },
  { cle: "doe", nom: "DOE — dossier des ouvrages exécutés", phase: "reception", presente: true, nombre: 3, exemples: ["doe.pdf","standard-interne-doe.pdf","Dossier des Ouvrages Exécutés.docx"] },
  { cle: "devis-exe", nom: "Devis d’exécution", phase: "reception", presente: true, nombre: 1, exemples: ["23-LGPM-044_LABASTIDE D'ANJOU_DEVIS EXE ENTREPRISE-02-02-24.xls"] },
  { cle: "prix-fournitures", nom: "Bibliothèque de prix / fournitures", phase: "preparation", presente: true, nombre: 1, exemples: ["Bibliothèque Prix Fournitures.xlsx"] },
  { cle: "prescriptions-f", nom: "Prescriptions d’exécution (cahiers F…)", phase: "normes", presente: true, nombre: 30, exemples: ["F2 - Terrassements généraux.pdf","F23 - Fournitures de granulats employés à la construction et à l’entretien des chaussées.pdf","F24 - Fourniture de liants bitumineux pour la construction et l’entretien des chaussées.pdf","F25 - Exécution des corps de chaussées.pdf"] },
  { cle: "gtR-normes", nom: "Normes et guides techniques (GTR, DTU, manuels)", phase: "normes", presente: true, nombre: 4, exemples: ["guide-conception-ice.pdf","SeQuelec_Guide_3.pdf","307732019R10FR_manuel-terrassement.pdf","Manuel_exploitation.pdf"] },
]);

/** Ce que la matrice dit, par phase du chantier. */
export const COUVERTURE_PAR_PHASE = Object.freeze({"consultation":{"presentes":7,"total":7},"preparation":{"presentes":6,"total":6},"plans":{"presentes":5,"total":5},"execution":{"presentes":5,"total":5},"reception":{"presentes":2,"total":2},"normes":{"presentes":2,"total":2}});

// ───────────────────────── accès ─────────────────────────

/** Une pièce attendue par sa clé. */
export function piece(cle) {
  return COUVERTURE.find((p) => p.cle === String(cle || '')) || null;
}

/** Les pièces présentes (ou absentes) — pour piloter un dossier. */
export function piecesPresentes(presente = true) {
  return COUVERTURE.filter((p) => p.presente === Boolean(presente));
}

/** Les fichiers d'une catégorie (recherche souple sur le nom). */
export function fichiersDeCategorie(fragment) {
  const t = String(fragment || '').toLowerCase();
  return FICHIERS_CHANTIER.filter((f) => f.categorie.toLowerCase().includes(t));
}

/** Les fichiers qui correspondent à un motif libre. */
export function chercherFichiers(motif) {
  const t = String(motif || '').toLowerCase();
  if (!t) return [];
  return FICHIERS_CHANTIER.filter((f) => f.nom.toLowerCase().includes(t));
}

/** Le poids d'une catégorie, en Mo (somme des fichiers listés). */
export function poidsCategorie(nom) {
  return Math.round(fichiersDeCategorie(nom).reduce((s, f) => s + (f.tailleMo || 0), 0) * 100) / 100;
}

/** Les plus gros fichiers — là où se cachent les plans et les DCE scannés. */
export function plusGrosFichiers(n = 10) {
  return [...FICHIERS_CHANTIER].sort((a, b) => (b.tailleMo || 0) - (a.tailleMo || 0)).slice(0, n);
}

/**
 * Le gabarit de fiche chantier : quelles pièces existent, par phase.
 * C'est ce que la vue INTEL affiche pour expliquer ce qu'est un dossier
 * complet — et ce qu'un dossier donné oublie.
 */
export function gabaritFiche() {
  const phases = {};
  for (const p of COUVERTURE) (phases[p.phase] = phases[p.phase] || []).push(p);
  return Object.entries(phases).map(([phase, pieces]) => ({
    phase,
    presentes: pieces.filter((p) => p.presente).length,
    total: pieces.length,
    pieces,
  }));
}

/** Contrôle d'intégrité : les compteurs doivent se recouper. */
export function verifierChantier() {
  const problemes = [];
  const somme = CATEGORIES_CHANTIER.reduce((s, c) => s + c.fichiers, 0);
  if (somme !== FICHIERS_CHANTIER.length) {
    problemes.push('compteurs incohérents : ' + somme + ' annoncés, ' + FICHIERS_CHANTIER.length + ' listés');
  }
  for (const f of FICHIERS_CHANTIER) {
    if (!f.nom || !f.categorie) problemes.push('fichier sans nom ou sans catégorie : ' + JSON.stringify(f.nom));
  }
  const cles = new Set();
  for (const p of COUVERTURE) {
    if (cles.has(p.cle)) problemes.push('pièce en double : ' + p.cle);
    cles.add(p.cle);
    if (!p.nom || !p.phase) problemes.push('pièce incomplète : ' + p.cle);
  }
  return { ok: problemes.length === 0, problemes, controle: FICHIERS_CHANTIER.length + COUVERTURE.length };
}

/** Statistiques pour le bandeau. */
export function statistiquesChantier() {
  const presentes = piecesPresentes(true).length;
  return {
    fichiers: FICHIERS_CHANTIER.length,
    categories: CATEGORIES_CHANTIER.length,
    piecesAttendues: COUVERTURE.length,
    piecesPresentes: presentes,
    couverturePct: COUVERTURE.length ? Math.round((presentes / COUVERTURE.length) * 100) : 0,
    poidsMo: Math.round(FICHIERS_CHANTIER.reduce((s, f) => s + (f.tailleMo || 0), 0) * 10) / 10,
  };
}

/** Une ligne de résumé, pour l'interface. */
export function resumeChantier() {
  const s = statistiquesChantier();
  return s.fichiers + ' fichiers · ' + s.categories + ' catégories · ' + s.piecesPresentes
    + '/' + s.piecesAttendues + ' pièces du gabarit (' + s.couverturePct + ' %)';
}
