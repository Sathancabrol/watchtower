/**
 * WATCHTOWER — GRAPHE DE CONNAISSANCES « SÈTE AGGLOPÔLE MÉDITERRANÉE ».
 *
 * Base LOCALE (aucune requête réseau) destinée au MODE RÉUNION de l'INTEL :
 * elle sert de support de présentation et d'ordre du jour pour une réunion
 * de mairie.
 *
 * ⚠️ HONNÊTETÉ DES DONNÉES — règle du projet : on ne présente jamais un
 * chiffre comme vérifié s'il ne l'est pas. Chaque attribut porte un drapeau
 * `fiable` :
 *   - `fiable: true`  → recoupé sur une source officielle (voir `source`)
 *   - `fiable: false` → provient du graphe fourni par l'utilisateur, non
 *     recoupé ici. L'interface l'affiche avec « ~ » et la mention « à vérifier ».
 *
 * Les écarts connus avec les données déjà vérifiées du dépôt
 * (`frontignanDetail.js`, référentiel communal) sont listés dans `ECARTS`.
 */

/** Petite fabrique d'attribut, pour ne pas répéter la structure. */
const a = (libelle, valeur, fiable = false, source = 'graphe utilisateur') =>
  Object.freeze({ libelle, valeur, fiable, source });

/**
 * Nœuds du graphe. `cle` est l'identifiant stable, `liens` cite d'autres clés.
 * @type {ReadonlyArray<object>}
 */
export const NOEUDS = Object.freeze([
  {
    cle: 'sam',
    nom: 'Sète Agglopôle Méditerranée',
    type: 'Intercommunalité',
    categorie: 'gouvernance',
    resume: "Communauté d'agglomération née en 2017 de la fusion de Thau Agglo et de la CC Nord du bassin de Thau. Siège à Frontignan.",
    attributs: [
      a('Création', '2017 (fusion Thau Agglo + CC Nord bassin de Thau)', true, 'geo.api.gouv.fr EPCI 200066355'),
      a('Communes', '14', true, 'référentiel communal du dépôt'),
      a('Population (2021)', '128 868 hab.', true, 'INSEE RP 2021, EPCI 200066355'),
      a('Population (2023)', '131 216 hab.', true, 'INSEE RP 2023 / agglopole.fr'),
      a('Superficie', '310,3 km²', true, 'INSEE / agglopole.fr'),
      a('Espaces naturels/agricoles', '80 %'),
      a('Siège', 'Frontignan', true, 'référentiel communal du dépôt'),
      a('Axes stratégiques 2026', 'Climat · Économie · Social'),
      a('Concertation citoyenne', '2026 — film + 7 réunions publiques'),
    ],
    tags: ['gouvernance', 'intercommunalité', 'PPA', 'climat', 'économie', 'social'],
    liens: ['frontignan', 'sete', 'etang-thau', 'projet-territoire-2026', 'ppa', 'concertation-2026'],
  },
  {
    cle: 'frontignan',
    nom: 'Frontignan',
    type: 'Commune — ville-centre industrielle, viticole, littorale',
    categorie: 'commune',
    resume: "Ville-centre de l'agglomération : muscat AOC, héritage pétrolier, front de mer exposé au recul du trait de côte.",
    attributs: [
      a('Code INSEE', '34108', true, 'référentiel communal du dépôt'),
      a('Population (2021)', '23 808 hab.'),
      a('Densité', '750,6 hab./km²'),
      a('Revenu médian', '21 830 €'),
      a('Taux de pauvreté', '16 %'),
      a('Chômage (15-64 ans)', '14,4 %'),
      a('Emplois sur place', '6 133'),
      a('Établissements (2022)', '666'),
      a('Budget primitif 2026', '52,36 M€ (39,23 fonctionnement + 13,13 investissement)', true, 'frontignan.fr — conseil municipal du 13/01/2026'),
      a('Maire', 'Michel Arrouy, réélu au 1er tour le 15/03/2026 (51,16 %)', true, 'frontignan.fr'),
    ],
    tags: ['commune', 'industrie', 'viticulture', 'littoral', 'PPA', 'recomposition'],
    liens: ['sam', 'muscat', 'frontignan-plage', 'exxonmobil', 'lido', 'triangle'],
  },
  {
    cle: 'sete',
    nom: 'Sète',
    type: 'Commune — ville portuaire, culturelle, ouvrière',
    categorie: 'commune',
    resume: "Premier pôle d'emploi de l'agglomération (45 % des emplois) mais aussi la commune la plus touchée par la pauvreté.",
    attributs: [
      a('Code INSEE', '34301', true, 'référentiel communal du dépôt'),
      a('Population (2021)', '44 712 hab.'),
      a('Densité', '1 846,8 hab./km²'),
      a('Revenu médian', '19 960 €'),
      a('Taux de pauvreté', '25 %', true, 'INSEE RP/Filosofi 2021 (19,4 % dans l\'Hérault, 15 % en France)'),
      a('Chômage (15-64 ans)', '19,1 %'),
      a('Emplois sur place', '17 275 (45 % de l\'agglo)'),
      a('Établissements (2022)', '1 849'),
      a('Repères 2023 (INSEE)', 'niveau de vie médian 22 740 €, pauvreté 26 %, 18 025 emplois, chômage 17,1 %', true, 'INSEE, comparateur de territoires, commune 34301'),
    ],
    tags: ['commune', 'port', 'culture', 'pauvreté', 'emploi'],
    liens: ['sam', 'port', 'histoire-1666', 'triangle'],
  },
  {
    cle: 'etang-thau',
    nom: 'Étang de Thau',
    type: 'Lagune / plan d\'eau côtier',
    categorie: 'milieu',
    resume: "Cœur écologique et économique du territoire : conchyliculture, pêche, paysage, identité.",
    attributs: [
      a('Production conchylicole (2021)', '7 070 t d\'huîtres + 3 700 t de moules = 10 770 t de coquillages (bassin méditerranéen)', true, 'Chambre d\'agriculture Occitanie, Agriscopie 2023 — CORRIGE le graphe fourni, qui annonçait « 10 129 t d\'huîtres » : ce volume correspond à l\'ensemble des coquillages, pas aux seules huîtres'),
      a('Poids de Thau', '90 % de la production conchylicole de Méditerranée française, 10 % de la production nationale', true, 'CRCM / Chambre d\'agriculture Occitanie'),
      a('Menaces', 'Pollution, ruissellement urbain, sécheresse, salinisation, pluies intenses'),
    ],
    tags: ['lagune', 'conchyliculture', 'eau', 'biodiversité', 'risque'],
    liens: ['sam', 'conchyliculture', 'risques'],
  },
  {
    cle: 'lido',
    nom: 'Lido de Frontignan',
    type: 'Cordon littoral sableux',
    categorie: 'milieu',
    resume: "Cordon dunaire entre mer et étang d'Ingril, en recul, rechargé et consolidé entre 2014 et 2021.",
    attributs: [
      a('Risques', 'Érosion, submersion marine, recul du trait de côte'),
      a('Travaux 2014-2021', 'Rechargement en sable, consolidation dunaire (UE + État + Région + Département + Agglopôle)'),
    ],
    tags: ['littoral', 'érosion', 'submersion', 'PPA', 'recomposition'],
    liens: ['frontignan', 'frontignan-plage', 'ppa', 'risques'],
  },
  {
    cle: 'frontignan-plage',
    nom: 'Frontignan-Plage',
    type: 'Quartier littoral — démonstrateur PPA',
    categorie: 'milieu',
    resume: "Site pilote du scénario de recomposition spatiale : environ 3 000 habitants exposés à l'horizon fin de siècle.",
    attributs: [
      a('Habitants exposés (horizon 2100)', '~3 000'),
      a('Statut', 'Démonstrateur du PPA'),
    ],
    tags: ['littoral', 'submersion', 'PPA', 'recomposition'],
    liens: ['frontignan', 'lido', 'ppa', 'mission-racine'],
  },
  {
    cle: 'triangle',
    nom: 'Triangle Sète-Balaruc-Frontignan',
    type: 'Périmètre de projet PPA',
    categorie: 'projet',
    resume: "Périmètre du plan-guide de régénération urbaine et de la stratégie foncière ZAN, à 30-100 ans.",
    attributs: [
      a('Objectif', 'Plan-guide de régénération + stratégie foncière ZAN'),
      a('Horizon', '30 à 100 ans'),
    ],
    tags: ['PPA', 'aménagement', 'ZAN', 'recomposition', 'foncier'],
    liens: ['ppa', 'sete', 'frontignan', 'zan'],
  },
  {
    cle: 'port',
    nom: 'Port de Sète-Frontignan',
    type: 'Port de commerce, pêche, plaisance, logistique',
    categorie: 'economie',
    resume: "Opéré par Port Sud de France ; 9e année record consécutive hors 2020. Concurrence forte entre usages.",
    attributs: [
      a('Chiffre d\'affaires 2023', '+15 % vs 2022'),
      a('Trafic commerce', '22 100 k€'),
      a('Trafic pêche', '2 720 k€'),
      a('Enjeux', 'Concurrence des usages : commerce, industrie, pêche, plaisance, tourisme, environnement'),
    ],
    tags: ['port', 'logistique', 'commerce', 'pêche', 'industrie', 'transition'],
    liens: ['sete', 'frontignan', 'sam', 'transition-industrielle', 'occitanie'],
  },
  {
    cle: 'muscat',
    nom: 'Muscat de Frontignan',
    type: 'Vin AOC',
    categorie: 'economie',
    resume: "AOC depuis 1936, culture attestée depuis les XVIe-XVIIe siècles, exportée en Europe et aux Amériques.",
    attributs: [
      a('AOC depuis', '1936'),
      a('Conditionnement historique', 'Flacons de verre (frontignane, bouteille torsadée) dès le XVIIe siècle'),
      a('Menaces', 'Sécheresse, salinisation, pression foncière, changement climatique'),
    ],
    tags: ['viticulture', 'AOC', 'patrimoine', 'agriculture', 'climat'],
    liens: ['frontignan', 'histoire-avant-1666'],
  },
  {
    cle: 'conchyliculture',
    nom: 'Conchyliculture',
    type: 'Ostréiculture + mytiliculture',
    categorie: 'economie',
    resume: "Filière entièrement dépendante de la qualité de l'eau et de la stabilité écologique de la lagune.",
    attributs: [
      a('Production (2021)', '7 070 t d\'huîtres et 3 700 t de moules sur le bassin méditerranéen', true, 'Chambre d\'agriculture Occitanie, Agriscopie 2023'),
      a('Entreprises', '441 entreprises de production, dont 322 individuelles', true, 'Agriscopie 2023'),
      a('Emploi et CA (Thau)', '656 salariés, 881 saisonniers, 41 M€ de chiffre d\'affaires', true, 'Agriscopie 2023'),
      a('Tables exploitées', '2 782 tables et 181 filières', true, 'Agriscopie 2023'),
      a('Vulnérabilités', 'Pollutions, ruissellements, fortes chaleurs, pluies intenses. Précédents : malaïgue de 2018, norovirus en décembre 2022 (-40 % de chiffre d\'affaires)', true, 'Sénat 2019 / Assemblée nationale, question n°678'),
    ],
    tags: ['aquaculture', 'huîtres', 'lagune', 'économie', 'environnement'],
    liens: ['etang-thau', 'risques'],
  },
  {
    cle: 'exxonmobil',
    nom: 'ExxonMobil (site de Frontignan)',
    type: 'Ancien site industriel pétrolier',
    categorie: 'economie',
    resume: "Friche en cours de dépollution : mémoire ouvrière, emprise foncière stratégique, risques résiduels.",
    attributs: [
      a('Statut', 'Friche en cours de dépollution (2026)'),
      a('Enjeux', 'Reconversion, emplois, risques environnementaux'),
    ],
    tags: ['industrie', 'pétrole', 'friche', 'dépollution', 'reconversion'],
    liens: ['frontignan', 'transition-industrielle', 'ppa'],
  },
  {
    cle: 'tourisme',
    nom: 'Tourisme Archipel de Thau',
    type: 'Activité touristique',
    categorie: 'economie',
    resume: "Poids économique majeur mais saisonnier, avec une pression directe sur le logement, l'eau et les routes.",
    attributs: [
      a('Touristes en séjour', '~1,5 M par an', true, 'Sète Agglopôle / office de tourisme Archipel de Thau'),
      a('Visiteurs toutes catégories', '~14 M sur la destination, dont ~8 M d\'excursionnistes', true, 'Dossier de presse Archipel de Thau — NUANCE le graphe fourni : les « 1,45 M de visiteurs » sont les touristes en séjour, pas la fréquentation totale'),
      a('Nuitées touristiques', '10 M, dont 71 % françaises et 29 % étrangères', true, 'Observatoire Archipel de Thau'),
      a('Retombées économiques', '1,4 Md€ en 2024 (600 M€ touristes + 840 M€ excursionnistes) ; ~1 Md€ en 2022 ; 706 M€ en 2021', true, 'Observatoire Archipel de Thau / Midi Libre'),
      a('Poids dans l\'emploi', '19 % de l\'emploi direct et indirect (1 emploi sur 5)', true, 'Office de tourisme Archipel de Thau'),
      a('Problèmes', 'Saisonnalité, pression sur le logement, saturation routière, consommation d\'eau, déchets'),
    ],
    tags: ['tourisme', 'saisonnalité', 'économie', 'logement'],
    liens: ['sam', 'frontignan-plage', 'sete', 'logement', 'mobilites'],
  },
  {
    cle: 'demographie',
    nom: 'Démographie de Sète Agglopôle',
    type: 'Indicateurs démographiques',
    categorie: 'socio',
    resume: "Croissance portée uniquement par le solde migratoire : le solde naturel est négatif (vieillissement).",
    attributs: [
      a('Population (2021)', '128 868 hab.', true, 'INSEE RP 2021, EPCI 200066355'),
      a('Évolution 2015-2021', '+3 990 hab. (124 878 → 128 868)', true, 'INSEE RP 2021'),
      a('Variation annuelle 2015-2021', '+0,5 % par an au total', true, 'INSEE RP 2021'),
      a('Solde naturel', '-0,2 % par an', true, 'INSEE RP 2021 — CORRIGE le graphe fourni, qui indiquait -0,1 %'),
      a('Solde migratoire', '+0,7 % par an', true, 'INSEE RP 2021 — CORRIGE le graphe fourni, qui indiquait +0,5 % (c\'est la variation TOTALE, pas le solde migratoire)'),
      a('Densité moyenne', '415,3 hab./km²', true, 'INSEE : 128 868 / 310,3 km²'),
      a('Vieillissement', '13,2 % de 75 ans ou plus en 2021, contre 10,8 % en 2010', true, 'INSEE RP 2021'),
    ],
    tags: ['démographie', 'population', 'vieillissement', 'migration'],
    liens: ['sam', 'logement', 'mobilites'],
  },
  {
    cle: 'emploi',
    nom: 'Emploi et entreprises',
    type: 'Indicateurs économiques',
    categorie: 'socio',
    resume: "Économie de services et de commerce, concentrée à Sète, en croissance sur 2017-2022.",
    attributs: [
      a('Emplois (2021)', '38 373 (45 % à Sète)'),
      a('Évolution 2017-2022', '+12,8 % d\'emplois salariés'),
      a('Établissements (2024)', '25 000'),
      a('Santé des entreprises', '66 % en « bonne santé » (Banque de France)'),
      a('Secteurs dominants', 'Commerce, transports, services (68,6 %)'),
    ],
    tags: ['emploi', 'entreprises', 'économie', 'secteurs'],
    liens: ['sam', 'port', 'tourisme'],
  },
  {
    cle: 'logement',
    nom: 'Logement',
    type: 'Indicateurs logement',
    categorie: 'socio',
    resume: "Un quart du parc en résidences secondaires : loger les actifs devient le point de tension.",
    attributs: [
      a('Parc (2021)', '89 540 logements'),
      a('Résidences secondaires', '26,2 % (21,9 % à Sète, 21,1 % à Frontignan)'),
      a('Enjeux', 'Loger les actifs, limiter les résidences secondaires, densifier sans artificialiser, adapter au vieillissement'),
    ],
    tags: ['logement', 'résidence_secondaire', 'densification', 'vieillissement'],
    liens: ['sam', 'sete', 'frontignan', 'zan', 'ppa'],
  },
  {
    cle: 'mobilites',
    nom: 'Mobilités',
    type: 'Flux et transports',
    categorie: 'socio',
    resume: "Territoire aimanté par Montpellier : 14,3 % des actifs y travaillent, d'où la priorité ferroviaire et cyclable.",
    attributs: [
      a('Navetteurs SAM → Montpellier', '6 473 résidents (14,3 % des actifs)'),
      a('Flux inverse', '1 441 Montpelliérains → Sète'),
      a('Enjeux', 'Ferroviaire, mobilités cyclables, transports collectifs, voies fluviales, flux poids lourds du port'),
    ],
    tags: ['mobilité', 'transport', 'Montpellier', 'ferroviaire', 'vélo'],
    liens: ['sam', 'port', 'logement'],
  },
  {
    cle: 'ppa',
    nom: 'PPA — Projet Partenarial d\'Aménagement',
    type: 'Dispositif contractuel État / collectivités',
    categorie: 'projet',
    resume: "Outil central de la recomposition spatiale du littoral, largement financé par l'État, sur 2023-2026 et au-delà.",
    attributs: [
      a('Période', '2023-2026 et au-delà'),
      a('Budget', '~700 k€ (État 80 %, Banque des territoires 15 %, EPF/Région/Département 5 %)'),
      a('Axe 1', 'Cartographie des vulnérabilités (recul du trait de côte à 30 et 100 ans)'),
      a('Axe 2', 'Plan-guide du triangle Sète-Balaruc-Frontignan + stratégie foncière ZAN'),
      a('Axe 3', 'Scénario de recomposition de Frontignan-Plage (démonstrateur)'),
      a('Axe 4', 'Concertation citoyenne transversale'),
    ],
    tags: ['PPA', 'climat', 'recomposition', 'ZAN', 'concertation'],
    liens: ['sam', 'triangle', 'frontignan-plage', 'concertation-2026', 'zan', 'etat'],
  },
  {
    cle: 'projet-territoire-2026',
    nom: 'Projet de territoire 2026',
    type: 'Stratégie territoriale',
    categorie: 'projet',
    resume: "Stratégie long terme structurée par trois axes — climat, économie, social — nourrie par la concertation.",
    attributs: [
      a('Méthode', 'Concertation citoyenne (film + 7 réunions) + diagnostic qualitatif et quantitatif'),
      a('Objectif', 'Définir les priorités à court, moyen et long terme'),
    ],
    tags: ['stratégie', 'projet_territoire', 'climat', 'économie', 'social'],
    liens: ['sam', 'concertation-2026', 'ppa'],
  },
  {
    cle: 'concertation-2026',
    nom: 'Concertation citoyenne 2026',
    type: 'Démocratie participative',
    categorie: 'projet',
    resume: "80 habitants interviewés, un film documentaire et 7 réunions publiques en novembre 2026.",
    attributs: [
      a('Méthode', '80 habitants interviewés (agence Grand Public), film documentaire'),
      a('Réunions publiques', '7, en novembre 2026'),
      a('Objectif', 'Co-construire le projet de territoire (climat, économie, social)'),
    ],
    tags: ['participation', 'citoyens', 'démocratie', 'projet_territoire'],
    liens: ['sam', 'projet-territoire-2026', 'ppa'],
  },
  {
    cle: 'scot',
    nom: 'SCOT Sète Agglopôle',
    type: 'Schéma de Cohérence Territoriale',
    categorie: 'projet',
    resume: "Révision en cours : diviser par deux l'extension urbaine et basculer la moitié des logements sur la rénovation.",
    attributs: [
      a('Historique', '2014 (1re génération), révision en cours 2024-2026'),
      a('Extension urbaine', '240 ha → 120-140 ha'),
      a('Renaturation', '20 %'),
      a('Logements en rénovation', '50 %'),
    ],
    tags: ['SCOT', 'urbanisme', 'ZAN', 'sobriété_foncière'],
    liens: ['sam', 'ppa', 'dreal', 'zan'],
  },
  {
    cle: 'atelier-territoires',
    nom: 'Atelier des territoires 2019-2023',
    type: 'Démarche d\'ingénierie territoriale',
    categorie: 'projet',
    resume: "30 mois de co-construction pilotés par la DREAL : 7 principes et une feuille de route de 13 actions.",
    attributs: [
      a('Porteurs', 'DREAL Occitanie, DDTM Hérault, Sète Agglopôle'),
      a('Durée', '30 mois'),
      a('Produits', '7 principes de recomposition spatiale, feuille de route (5 axes, 13 actions)'),
    ],
    tags: ['atelier_territoires', 'recomposition', 'co-construction', 'DREAL'],
    liens: ['ppa', 'dreal', 'sam'],
  },
  {
    cle: 'zan',
    nom: 'Zéro Artificialisation Nette (ZAN)',
    type: 'Objectif national',
    categorie: 'enjeu',
    resume: "Cadre issu de la loi Climat et Résilience qui contraint toute la stratégie foncière locale.",
    attributs: [
      a('Définition', 'Stopper l\'artificialisation nette des sols (lois Climat & Résilience)'),
      a('Application locale', 'Révision du SCOT, stratégie foncière du PPA, renaturation, rénovation'),
    ],
    tags: ['ZAN', 'foncier', 'urbanisme', 'climat'],
    liens: ['scot', 'ppa', 'logement'],
  },
  {
    cle: 'transition-industrielle',
    nom: 'Transition industrielle',
    type: 'Enjeu transversal',
    categorie: 'enjeu',
    resume: "Dépollution et reconversion des friches (ExxonMobil, Timac, Lafarge) : foncier, emplois et risques.",
    attributs: [
      a('Friches concernées', 'ExxonMobil, Timac, Lafarge'),
      a('Acteurs', 'Agglopôle, Région, État, industriels'),
    ],
    tags: ['industrie', 'friche', 'dépollution', 'reconversion', 'emploi'],
    liens: ['exxonmobil', 'port', 'sam', 'occitanie'],
  },
  {
    cle: 'risques',
    nom: 'Risques environnementaux',
    type: 'Enjeu transversal',
    categorie: 'enjeu',
    resume: "Érosion, submersion, inondation, sécheresse, salinisation, pollution de l'eau — cumulés sur les mêmes zones.",
    attributs: [
      a('Types', 'Érosion, submersion, inondation, sécheresse, salinisation, pollution de l\'eau'),
      a('Zones critiques', 'Lido de Frontignan, Frontignan-Plage, étang de Thau, zones industrielles'),
    ],
    tags: ['risques', 'climat', 'eau', 'érosion', 'submersion'],
    liens: ['lido', 'etang-thau', 'ppa', 'exxonmobil', 'conchyliculture'],
  },
  {
    cle: 'etat',
    nom: 'État français',
    type: 'Acteur institutionnel',
    categorie: 'gouvernance',
    resume: "Principal financeur du PPA et détenteur de la réglementation littorale et de la police de l'eau.",
    attributs: [
      a('Rôle', 'Financement du PPA (50-80 %), réglementation littoral, plans de prévention des risques, police de l\'eau'),
      a('Programmes', 'PPA, Atelier des territoires, TPSF, Plan Littoral 21'),
    ],
    tags: ['État', 'financement', 'réglementation', 'PPA', 'risques'],
    liens: ['ppa', 'sam', 'occitanie', 'dreal'],
  },
  {
    cle: 'occitanie',
    nom: 'Région Occitanie',
    type: 'Acteur institutionnel',
    categorie: 'gouvernance',
    resume: "Autorité portuaire et cofinanceur ; porte le Plan Littoral 21 et la stratégie de transition énergétique.",
    attributs: [
      a('Rôle', 'Cofinanceur du PPA (5 %), stratégie portuaire, Plan Littoral 21, transition énergétique'),
    ],
    tags: ['région', 'port', 'financement', 'Plan_Littoral_21'],
    liens: ['port', 'ppa', 'etat', 'sam'],
  },
  {
    cle: 'dreal',
    nom: 'DREAL Occitanie',
    type: 'Service déconcentré de l\'État',
    categorie: 'gouvernance',
    resume: "Pilote de l'Atelier des territoires et garant de la sobriété foncière dans l'accompagnement du PPA.",
    attributs: [
      a('Rôle', 'Pilotage de l\'Atelier des territoires (2019-2023), accompagnement du PPA, sobriété foncière'),
    ],
    tags: ['DREAL', 'aménagement', 'sobriété_foncière', 'PPA'],
    liens: ['atelier-territoires', 'ppa', 'scot'],
  },
  {
    cle: 'histoire-1666',
    nom: 'Fondation du port de Sète (1666)',
    type: 'Événement historique',
    categorie: 'histoire',
    resume: "Le 29 juillet 1666, la pose du môle Saint-Louis fait basculer la hiérarchie portuaire du bassin de Thau.",
    attributs: [
      a('Date', '29 juillet 1666 — môle Saint-Louis'),
      a('Contexte', 'Louis XIV, Colbert, canal du Midi'),
      a('Conséquence', 'Sète devient le grand port régional ; Frontignan perd ses fonctions portuaires majeures'),
    ],
    tags: ['histoire', 'port', '1666', 'Colbert'],
    liens: ['sete', 'frontignan', 'port', 'histoire-avant-1666'],
  },
  {
    cle: 'histoire-avant-1666',
    nom: 'Frontignan avant 1666',
    type: 'Période historique',
    categorie: 'histoire',
    resume: "Du XIe au XVIIe siècle, Frontignan est un port de commerce administré par des consuls, vivant du sel, du muscat et des lagunes.",
    attributs: [
      a('Période', 'XIe-XVIIe siècles'),
      a('Activités', 'Port de commerce, pêche, salines, muscat, pâturages du lido'),
      a('Gouvernance', 'Conseils de consuls dès le XIIIe siècle, droits de pêche et d\'usage des lagunes'),
    ],
    tags: ['histoire', 'port', 'muscat', 'Moyen_Âge'],
    liens: ['frontignan', 'muscat', 'histoire-1666', 'etang-thau'],
  },
  {
    cle: 'mission-racine',
    nom: 'Mission Racine (années 1960)',
    type: 'Programme d\'aménagement',
    categorie: 'histoire',
    resume: "L'aménagement touristique du littoral languedocien, dont Frontignan sort avec une urbanisation plus mesurée que ses voisines.",
    attributs: [
      a('Impact sur Frontignan', 'Développement progressif (campings, maisons de plage, port de plaisance), urbanisation massive évitée'),
    ],
    tags: ['tourisme', 'littoral', 'aménagement', 'années_1960'],
    liens: ['frontignan-plage', 'tourisme', 'lido'],
  },
]);

/**
 * Questions ouvertes destinées à l'ordre du jour d'une réunion.
 * @type {ReadonlyArray<object>}
 */
export const QUESTIONS_OUVERTES = Object.freeze([
  { cle: 'q-indicateurs', question: 'Quels indicateurs précis ont justifié les axes climat / économie / social ?', noeuds: ['projet-territoire-2026', 'sam'] },
  { cle: 'q-vulnerabilites', question: 'Existe-t-il une cartographie fine croisant aléas et vulnérabilités sociales sur les zones inondables ?', noeuds: ['ppa', 'risques', 'frontignan-plage'] },
  { cle: 'q-memoire', question: 'Comment intégrer la mémoire industrielle (ExxonMobil) et viticole (muscat) dans les scénarios ?', noeuds: ['exxonmobil', 'muscat'] },
  { cle: 'q-gouvernance', question: 'Qui décide in fine des scénarios de recomposition ? Quel poids réel pour la concertation citoyenne ?', noeuds: ['concertation-2026', 'ppa', 'etat'] },
  { cle: 'q-angles-morts', question: 'Pourquoi pas d\'axe spécifique « eau et lagune » ou « justice environnementale » ?', noeuds: ['etang-thau', 'projet-territoire-2026'] },
  { cle: 'q-demographie', question: 'Comment sont pris en compte le vieillissement, la stagnation et la dépendance au solde migratoire ?', noeuds: ['demographie', 'logement'] },
]);

/**
 * Écarts constatés entre le graphe fourni et les données déjà vérifiées du
 * dépôt. On les EXPOSE au lieu de trancher en silence : la plupart sont des
 * millésimes différents, pas des erreurs.
 */
export const CORRECTIONS = Object.freeze([
  {
    sujet: 'Soldes démographiques de l\'agglomération',
    fourni: 'Solde migratoire +0,5 % · solde naturel -0,1 %',
    corrige: 'Variation totale +0,5 %/an · solde naturel -0,2 % · solde migratoire +0,7 %',
    source: 'INSEE, RP 2021, EPCI 200066355 (période 2015-2021)',
    lecture: 'Le « +0,5 % » du document est la variation ANNUELLE TOTALE, pas le solde migratoire. Le vieillissement est donc deux fois plus marqué qu\'annoncé, et l\'attractivité migratoire nettement plus forte. À corriger avant toute projection démographique.',
  },
  {
    sujet: 'Production conchylicole',
    fourni: '~10 129 t d\'huîtres (2021)',
    corrige: '7 070 t d\'huîtres + 3 700 t de moules = 10 770 t de coquillages (bassin méditerranéen, 2021)',
    source: 'Chambre d\'agriculture Occitanie, Agriscopie 2023',
    lecture: 'Le volume avancé correspond à l\'ensemble des coquillages, pas aux seules huîtres. Annoncer « 10 129 t d\'huîtres » surestime la filière ostréicole d\'environ 45 %.',
  },
  {
    sujet: 'Fréquentation touristique',
    fourni: '1,45 M de visiteurs (2023), retombées ~1,1 Md€',
    corrige: '~1,5 M de touristes en séjour, mais ~14 M de visiteurs toutes catégories ; retombées 1,4 Md€ en 2024, ~1 Md€ en 2022',
    source: 'Observatoire Archipel de Thau, dossier de presse et bilans de saison',
    lecture: 'Confusion de périmètre : les 1,45 M sont les touristes en séjour. En incluant les excursionnistes, la destination accueille près de dix fois plus de monde — ce qui change tout au discours sur la saturation.',
  },
]);

/**
 * Écarts qui ne sont PAS des erreurs : millésimes différents entre le graphe
 * fourni et les données déjà présentes dans le dépôt.
 */
export const ECARTS = Object.freeze([
  {
    sujet: 'Population de Frontignan',
    graphe: '23 808 hab. (RP 2021)',
    depot: '24 136 hab.',
    lecture: 'Millésimes différents : 23 808 hab. au RP 2021, 24 136 au RP 2023. Les deux sont exacts ; préciser l\'année en réunion.',
  },
  {
    sujet: 'Population de Sète Agglopôle',
    graphe: '128 868 hab. (RP 2021)',
    depot: '≈131 000 hab.',
    lecture: 'VÉRIFIÉ : 128 868 hab. au RP 2021 (INSEE) et 131 216 au RP 2023. Les deux chiffres sont bons, à des dates différentes.',
  },
  {
    sujet: 'Nombre de communes',
    graphe: '14',
    depot: '14',
    lecture: 'Concordant.',
  },
]);

/** Index clé → nœud, construit une seule fois. */
const INDEX = new Map(NOEUDS.map((n) => [n.cle, n]));

/**
 * Récupère un nœud par sa clé.
 * @param {string} cle
 * @returns {object|null}
 */
export function noeud(cle) {
  if (typeof cle !== 'string') return null;
  return INDEX.get(cle) || null;
}

/**
 * Nœuds voisins (liens sortants ET entrants — le graphe se lit dans les deux sens).
 * @param {string} cle
 * @returns {object[]}
 */
export function voisins(cle) {
  const n = noeud(cle);
  if (!n) return [];
  const cles = new Set(n.liens || []);
  for (const autre of NOEUDS) {
    if (autre.cle !== cle && (autre.liens || []).includes(cle)) cles.add(autre.cle);
  }
  cles.delete(cle);
  return [...cles].map((c) => INDEX.get(c)).filter(Boolean);
}

/**
 * Tous les nœuds d'une catégorie (gouvernance, commune, milieu, economie,
 * socio, projet, enjeu, histoire).
 * @param {string} categorie
 * @returns {object[]}
 */
export function parCategorie(categorie) {
  return NOEUDS.filter((n) => n.categorie === categorie);
}

/**
 * Tous les nœuds portant un tag donné (insensible à la casse).
 * @param {string} tag
 * @returns {object[]}
 */
export function parTag(tag) {
  const t = String(tag || '').toLowerCase();
  if (!t) return [];
  return NOEUDS.filter((n) => (n.tags || []).some((x) => String(x).toLowerCase() === t));
}

/**
 * Recherche plein texte simple sur le nom, le résumé, les tags et les attributs.
 * @param {string} texte
 * @returns {object[]}
 */
export function chercher(texte) {
  const q = String(texte || '').trim().toLowerCase();
  if (!q) return [];
  return NOEUDS.filter((n) => {
    const foin = [
      n.nom,
      n.type,
      n.resume,
      ...(n.tags || []),
      ...(n.attributs || []).flatMap((at) => [at.libelle, String(at.valeur)]),
    ].join(' ').toLowerCase();
    return foin.includes(q);
  });
}

/** Liste dédoublonnée et triée de tous les tags du graphe. */
export function tousLesTags() {
  const s = new Set();
  for (const n of NOEUDS) for (const t of n.tags || []) s.add(t);
  return [...s].sort((x, y) => x.localeCompare(y, 'fr'));
}

/**
 * Convertit le graphe en triplets (sujet, prédicat, objet, source, fiable),
 * prêts pour une ingestion RDF/CSV.
 * @returns {Array<{sujet:string, predicat:string, objet:string, source:string, fiable:boolean}>}
 */
export function versTriplets() {
  const out = [];
  for (const n of NOEUDS) {
    out.push({ sujet: n.cle, predicat: 'rdfs:label', objet: n.nom, source: 'graphe', fiable: true });
    out.push({ sujet: n.cle, predicat: 'rdf:type', objet: n.type, source: 'graphe', fiable: true });
    for (const t of n.tags || []) out.push({ sujet: n.cle, predicat: 'dc:subject', objet: t, source: 'graphe', fiable: true });
    for (const l of n.liens || []) out.push({ sujet: n.cle, predicat: 'skos:related', objet: l, source: 'graphe', fiable: true });
    for (const at of n.attributs || []) {
      out.push({ sujet: n.cle, predicat: at.libelle, objet: String(at.valeur), source: at.source, fiable: at.fiable === true });
    }
  }
  return out;
}

/** Échappe une cellule CSV (RFC 4180). */
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * Export CSV des triplets, pour ingestion dans un outil tiers.
 * @returns {string}
 */
export function versCSV() {
  const lignes = ['sujet,predicat,objet,source,fiable'];
  for (const t of versTriplets()) {
    lignes.push([t.sujet, t.predicat, t.objet, t.source, t.fiable].map(csv).join(','));
  }
  return lignes.join('\n');
}

/**
 * Compte les attributs non recoupés — sert à afficher honnêtement la part
 * de données « à vérifier » dans le bandeau du mode réunion.
 * @returns {{total:number, fiables:number, aVerifier:number}}
 */
export function fiabilite() {
  let total = 0;
  let fiables = 0;
  for (const n of NOEUDS) {
    for (const at of n.attributs || []) {
      total += 1;
      if (at.fiable === true) fiables += 1;
    }
  }
  return { total, fiables, aVerifier: total - fiables };
}
