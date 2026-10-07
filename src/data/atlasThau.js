/**
 * WATCHTOWER — ATLAS DE THAU (base de données territoriale).
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Généré par `tools/extraire-atlas-thau.mjs` depuis :
 *   · atlas.json — graphe de territoire, 79 nœuds, 167 liens
 *   · communes-thau.csv — les 14 communes de l'agglo × 23 colonnes
 *
 * Empreinte des sources : 64a26d1b09b02135
 *
 * C'est le MAILLAGE de la vue INTEL : qui agit (acteurs), où (communes,
 * quartiers), sur quoi (projets, risques), avec quoi (ressources, données),
 * et vers quoi (futurs, scénarios). Chaque fait porte sa source datée quand
 * l'atlas en avait une ; quand il n'y en a pas, la base le laisse vide plutôt
 * que de compléter toute seule.
 */

/** D'où vient cette base, et dans quelles conditions. */
export const PROVENANCE_ATLAS = Object.freeze({
  titre: "Atlas interactif — Frontignan la Peyrade",
  sousTitre: "Acteurs, données et futurs du bassin de Thau (2026 → 2040)",
  genereLe: "2026-09-08 17:46 UTC",
  methode: "Données INSEE (RP2023, Filosofi 2023, Flores 2024, état civil 2025) recalculées ici ; documents budgétaires et délibérations ; presse locale datée ; estimations d'analyste explicitement signalées.",
  echelles: ["Frontignan","La ville","L'agglo de Thau","Les environs","La France"],
  atlas: "atlas.json",
  communes: "communes-thau.csv",
  empreinte: "64a26d1b09b02135",
  peuplementTotal: 131216,
  avertissement:
    'Les faits de l’atlas sont repris tels quels, avec leurs sources quand elles existent. '
    + 'Les estimations d’analyste y sont signalées comme telles par l’atlas ; elles ne sont pas des données officielles.',
});

/** Les nœuds : un objet = une entité du territoire et ce qu'on sait d'elle. */
export const NOEUDS = Object.freeze([
  { id: "frontignan", libelle: "Frontignan la Peyrade", type: "territoire", echelle: "Frontignan", tier: 0, icone: "🍇", parent: null, sous: "24 136 hab. · siège de Sète Agglopôle · 34110", texte: "Ville littorale de 24 136 habitants (2023) entre Sète (7 km) et Montpellier (21 km), au pied de la Gardiole et entre étangs, canal et lido. 2ᵉ commune et siège de Sète Agglopôle Méditerranée, elle entame en 2026 le plus grand cycle de transformation urbaine depuis les années 1970 : 11 ha de friche dépolluée restitués, une gare nouvelle actée, un label Action cœur de Ville et la présidence de l'agglo.", faits: [{"cle":"Population 2023","valeur":"24 136 hab."},{"cle":"Densité","valeur":"760,9 hab./km²"},{"cle":"Superficie","valeur":"40,0 km²"},{"cle":"Niveau de vie médian","valeur":"24 580 €/UC"},{"cle":"Taux de pauvreté","valeur":"17,0 %"},{"cle":"Chômage 15-64 ans","valeur":"14,0 %"},{"cle":"Emplois sur place","valeur":"6 556"}], puces: ["Croissance portée à 100 % par le solde migratoire (+1,1 %/an) : une attractivité réversible.","1 emploi local pour 1,5 actif résident → ville d'habitat à ré-équiper en emplois.","Cumul rare : siège de l'agglo + présidence + vice-présidence tourisme."], sources: [{"libelle":"INSEE — Comparateur de territoires","url":"https://www.insee.fr/fr/statistiques/1405599?geo=COM-34108","date":"27/08/2026"}], donnees: "communes", enfants: ["identite","demographie","revenus","emploi","economie","budget","gouvernance","q-centre","q-peyrade","q-plage","q-hierles","q-qpv","friche-mobil","pem-gare","submersion","canicule","sam","focus-2030","scenarios-2040","trajectoire","swot","acteurs","recos"] },
  { id: "identite", libelle: "Identité & mémoire", type: "ressource", echelle: "La ville", tier: 1, icone: "🏺", parent: "frontignan", sous: "Muscat · sel · pétrole · polar · joutes", texte: "Quatre couches de mémoire structurent l'image de la ville : le muscat (AOP 1936, 90 ans en 2026), le sel (salins fermés en 1968, devenus espace naturel de 149 ha), le pétrole (raffinerie Mobil fermée en 1986) et le roman noir (FIRN depuis 1998). Un capital symbolique riche mais éclaté, encore peu traduit en stratégie d'expérience.", faits: [{"cle":"AOP Muscat","valeur":"1936 — 1ʳᵉ appellation muscat de France"},{"cle":"Salins","valeur":"149 ha, fermés en 1968"},{"cle":"Raffinerie","valeur":"1904-1986, 11 ha restitués en 2026"},{"cle":"FIRN","valeur":"29ᵉ édition en 2026"}], puces: ["Marqueurs forts mais non fédérés : pas de plateforme de marque territoriale.","Trois pôles urbains à relier : centre médiéval, La Peyrade, Frontignan-Plage."], sources: [{"libelle":"Ville de Frontignan — dossier Muscat 90 ans","url":"https://www.frontignan.fr/flp-mag-51-le-dossier-muscat-90-ans-dappellation-celebres/","date":"06/07/2026"}], donnees: null, enfants: [] },
  { id: "demographie", libelle: "Démographie", type: "data", echelle: "La ville", tier: 1, icone: "👥", parent: "frontignan", sous: "+6,0 % depuis 2017 · âge médian ≈ 45 ans", texte: "La ville a retrouvé une croissance (+1,0 %/an entre 2017 et 2023) après dix ans de stagnation, mais elle vieillit : 25,3 % de 65 ans et plus, un solde naturel devenu négatif (−0,1 %/an) et 9,4 ‰ de natalité contre 10,5 ‰ de mortalité.", faits: [{"cle":"1968 → 2023","valeur":"11 141 → 24 136 hab."},{"cle":"Variation 2017-2023","valeur":"+1,0 %/an"},{"cle":"65 ans et +","valeur":"25,3 %"},{"cle":"Moins de 15 ans","valeur":"14,8 %"},{"cle":"Ménages","valeur":"11 183"},{"cle":"Taille moyenne des ménages","valeur":"2,1"}], puces: ["Croissance longue : TCAM 1968-2023 = +1,42 %/an, mais rupture nette après 2007.","Le vieillissement est plus rapide que la croissance : +5,0 points de 65 ans et + depuis 2012."], sources: [{"libelle":"INSEE — RP2023","url":"https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108","date":"27/08/2026"}], donnees: "pop_serie", enfants: ["ages"] },
  { id: "ages", libelle: "Pyramide des âges", type: "data", echelle: "La ville", tier: 1, icone: "📊", parent: "demographie", sous: "Vieillissement net entre 2012 et 2023", texte: "En onze ans, la structure par âge bascule : les moins de 15 ans perdent 1,6 point, les 65-79 ans en gagnent 3,3 et les 80 ans et plus 1,7. Les 55 ans et plus représentent désormais 40,4 % de la population.", faits: [{"cle":"65-79 ans","valeur":"17,4 % (14,1 % en 2012)"},{"cle":"80 ans et +","valeur":"7,9 %"},{"cle":"Personnes seules 65-79 ans","valeur":"28,1 %"},{"cle":"Familles monoparentales","valeur":"16,8 %"}], puces: ["Deux bouts de pyramide à tenir simultanément : petite enfance et grand âge.","L'espace public doit intégrer confort thermique, repos et accessibilité."], sources: [{"libelle":"INSEE — RP2023","url":"https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108","date":"27/08/2026"}], donnees: "ages", enfants: [] },
  { id: "revenus", libelle: "Revenus & pauvreté", type: "data", echelle: "La ville", tier: 1, icone: "💶", parent: "frontignan", sous: "24 580 €/UC · 17 % de pauvreté", texte: "Le niveau de vie médian frontignanais (24 580 €) est proche de la moyenne du bassin (24 500 €) et de l'Hérault (24 280 €), mais reste 5,2 % sous la France métropolitaine (25 920 €). Le taux de pauvreté de 17 % est supérieur à la moyenne nationale (15,9 %) tout en étant nettement inférieur à Sète (26 %).", faits: [{"cle":"Niveau de vie médian","valeur":"24 580 €/UC"},{"cle":"Écart à la France","valeur":"−1 340 € (−5,2 %)"},{"cle":"Taux de pauvreté","valeur":"17,0 %"},{"cle":"Rang dans l'agglo","valeur":"9ᵉ / 13 pour le niveau de vie"}], puces: ["Frontignan est la commune médiane du bassin : ni Sète (26 % de pauvreté), ni Balaruc-le-Vieux (7 %).","L'écart intercommunal de niveau de vie atteint 6 870 € entre Bouzigues et Sète."], sources: [{"libelle":"INSEE — Filosofi 2023","url":"https://www.insee.fr/fr/statistiques/1405599?geo=COM-34108","date":"27/08/2026"}], donnees: "communes", enfants: [] },
  { id: "emploi", libelle: "Emploi & navettes", type: "data", echelle: "La ville", tier: 1, icone: "🧰", parent: "frontignan", sous: "14,0 % de chômage · 67 % de navetteurs", texte: "6 556 emplois au lieu de travail pour 9 565 actifs occupés : la ville n'offre qu'un emploi pour 1,5 actif résident. 67 % des actifs travaillent hors de la commune, dont l'essentiel vers Sète et Montpellier, et 80 % s'y rendent en voiture.", faits: [{"cle":"Emplois au lieu de travail","valeur":"6 556"},{"cle":"Taux de chômage 15-64","valeur":"14,0 %"},{"cle":"Chômage des 15-24 ans","valeur":"28,9 %"},{"cle":"Actifs travaillant hors commune","valeur":"67 %"},{"cle":"Part voiture","valeur":"80 %"},{"cle":"Part transports en commun","valeur":"7,1 %"}], puces: ["Le ratio emploi/actif (0,69) est la justification économique de la friche Mobil.","Un gradient social fort : 26,2 % de chômage chez les sans-diplôme contre 6,9 % à bac+5."], sources: [{"libelle":"INSEE — RP2023","url":"https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108","date":"27/08/2026"}], donnees: "mobilites", enfants: [] },
  { id: "economie", libelle: "Tissu économique", type: "ressource", echelle: "La ville", tier: 1, icone: "🏭", parent: "frontignan", sous: "2 263 établissements · 6 311 postes salariés", texte: "Économie résidentielle et publique (39,9 % des emplois en administration, enseignement, santé, action sociale) avec un socle industriel rare pour une ville littorale de cette taille (16,4 % des emplois), concentré sur la Z.A. de La Peyrade (15,4 ha, 55 entreprises).", faits: [{"cle":"Établissements actifs","valeur":"2 263"},{"cle":"Postes salariés","valeur":"6 311"},{"cle":"Sphère présentielle","valeur":"67 %"},{"cle":"Établissements de 50 salariés et +","valeur":"18"},{"cle":"Créations","valeur":"≈ 470/an"}], puces: ["Hexis (≈ 194 salariés) est le premier employeur industriel privé.","La ZAE du Barnier (2,7 M€, livraison juin 2027) est le vivier d'emplois de court terme."], sources: [{"libelle":"INSEE — Flores 2024","url":"https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108","date":"27/08/2026"}], donnees: "secteurs", enfants: [] },
  { id: "budget", libelle: "Budget & finances", type: "data", echelle: "La ville", tier: 1, icone: "🏛️", parent: "frontignan", sous: "≈ 65 M€ · dette 995 €/hab. · taux stables depuis 9 ans", texte: "Des comptes sains mais contraints : une fiscalité déjà élevée (1 011 €/hab. contre 793 € pour la strate) qui interdit de financer l'investissement par l'impôt, une épargne nette en reconstruction (1,4 M€ en 2025) et un investissement par habitant contenu (270 € contre 438 €).", faits: [{"cle":"Budget 2026 (BP+BS+reports)","valeur":"64,9 M€"},{"cle":"Dette/hab. 2024","valeur":"995 € (strate : 986 €)"},{"cle":"Capacité de désendettement","valeur":"7,5 ans (strate : 5,5)"},{"cle":"Investissement/hab.","valeur":"270 € (strate : 438)"},{"cle":"Épargne nette 2025","valeur":"≈ 1,4 M€"}], puces: ["Écart-type des ratios vs strate : la ville est atypique surtout par sa pression fiscale (+27,5 %).","Conséquence design : projets à fort effet de levier, phasés, avec des preuves rapides et peu coûteuses."], sources: [{"libelle":"Décomptes publics — comptes 2024","url":"https://www.decomptes-publics.fr/villes/34108-34110-frontignan","date":"2025"}], donnees: "finances", enfants: [] },
  { id: "gouvernance", libelle: "Gouvernance municipale", type: "acteur", echelle: "La ville", tier: 1, icone: "🗳️", parent: "frontignan", sous: "Arrouy réélu à 51,16 % · RN à 35,87 %", texte: "Michel Arrouy (PS) est réélu dès le 1ᵉʳ tour le 15 mars 2026 avec 51,16 % et 27 sièges sur 35, en remportant les 19 bureaux de vote. Mais le RN atteint 35,87 % et l'abstention 38,1 % : une société clivée que tout dispositif participatif doit prendre au sérieux.", faits: [{"cle":"Maire","valeur":"Michel Arrouy (PS), 2ᵉ mandat"},{"cle":"Majorité","valeur":"27 sièges / 35"},{"cle":"Opposition","valeur":"RN 6 · DVD 2"},{"cle":"Abstention","valeur":"38,1 %"},{"cle":"Prochaine échéance","valeur":"municipales 2032"}], puces: ["Mandat frais 2026-2032 : fenêtre d'action réelle 2026-2029.","10 adjoints dont plusieurs portefeuilles directement « design-pertinents » (cadre de vie, patrimoine, participation)."], sources: [{"libelle":"Midi Libre — résultats 2026","url":"https://www.midilibre.fr/2026/03/15/resultats-des-municipales-2026-a-frontignan-le-maire-sortant-michel-arrouy-fait-le-grand-chelem-et-conserve-son-poste-13274171.php","date":"15/03/2026"}], donnees: "municipales", enfants: ["participation"] },
  { id: "participation", libelle: "Démocratie participative", type: "acteur", echelle: "La ville", tier: 1, icone: "🤝", parent: "gouvernance", sous: "6 comités habitants · 50 k€ de budget participatif", texte: "La ville dispose déjà d'une infrastructure participative : Maison des projets et de la Citoyenneté (2021), six comités habitants (2022), budget participatif de 50 000 €/an, concertations réglementaires et « ateliers du territoire ». Elle est sous-outillée en méthodes de design.", faits: [{"cle":"Maison des projets","valeur":"ouverte en septembre 2021"},{"cle":"Comités habitants","valeur":"6 (ex-11 conseils de quartier)"},{"cle":"Budget participatif","valeur":"50 000 €/an"},{"cle":"Contrat de ville","valeur":"Quartiers 2030 (2024-2030)"}], puces: ["Risque identifié : la parole se concentre sur les habitants déjà organisés.","Deux dossiers exigent une concertation irréprochable : friche Mobil et Mas de Chave."], sources: [{"libelle":"Ville de Frontignan — concertation citoyenne","url":"https://www.frontignan.fr/la-concertation-citoyenne-est-lancee/","date":"28/09/2021"}], donnees: null, enfants: [] },
  { id: "q-centre", libelle: "Frontignan-centre", type: "territoire", echelle: "La ville", tier: 1, icone: "🏘️", parent: "frontignan", sous: "Cœur médiéval · halles · chantier permanent depuis 2023", texte: "Le centre historique concentre l'ORU (≈ 15 M€ sur 10 ans), les commerces (vacance ≈ 4 %), le marché et le stationnement gratuit. Il est en travaux depuis 2023 et le restera jusqu'en 2029+, ce qui use commerçants et riverains.", faits: [{"cle":"Vacance commerciale","valeur":"≈ 4 % (moyenne strate ≈ 12 %)"},{"cle":"Commerces","valeur":"≈ 180"},{"cle":"ORU","valeur":"≈ 15 M€ / 10 ans"},{"cle":"Label","valeur":"Action cœur de Ville (mars 2025)"}], puces: ["Le « design des transitions » de chantier est le quick win le plus rentable.","QPV centre (Calmette, Anatole-France) : attention à la paupérisation."], sources: [], donnees: null, enfants: ["oru","le-quai"] },
  { id: "q-peyrade", libelle: "La Peyrade", type: "territoire", echelle: "La ville", tier: 1, icone: "⚙️", parent: "frontignan", sous: "Quartier canal · zone d'activité · Seveso", texte: "Quartier nord de la ville, adossé au canal du Rhône à Sète et à la zone d'activité (15,4 ha, 55 entreprises). Il porte la mémoire industrielle, les deux sites Seveso seuil haut et la mobilisation habitante la plus vive (Mas de Chave).", faits: [{"cle":"Z.A. de La Peyrade","valeur":"15,4 ha · 55 entreprises"},{"cle":"Hexis","valeur":"≈ 194 salariés"},{"cle":"Sites Seveso seuil haut","valeur":"2 (GDH, SCORI) + PPRT"}], puces: ["Interface la plus sensible entre habitat, industrie et projet urbain.","La limite avec l'AOP muscat est le point dur du dossier Mas de Chave."], sources: [], donnees: null, enfants: ["mas-de-chave","zae-barnier","seveso"] },
  { id: "q-plage", libelle: "Frontignan-Plage", type: "territoire", echelle: "La ville", tier: 1, icone: "🏖️", parent: "frontignan", sous: "Station · lido 7 km · scénario de recomposition", texte: "La station balnéaire concentre le port de plaisance, le lido de 7 km et l'essentiel des ≈ 3 000 résidences secondaires (20,6 % du parc). C'est aussi le secteur le plus exposé : le PPA de 2024 prévoit explicitement un « scénario de recomposition spatiale de Frontignan-Plage ».", faits: [{"cle":"Lido","valeur":"7 km (canal de Sète → Aresquiers)"},{"cle":"Résidences secondaires","valeur":"20,6 % du parc communal"},{"cle":"Campings","valeur":"6 (508 emplacements)"},{"cle":"Hôtels","valeur":"3 (130 chambres)"}], puces: ["Offre hôtelière quasi inexistante : la station capte peu de valeur.","La recomposition sera d'abord un problème d'acceptabilité, donc de design de la concertation."], sources: [], donnees: null, enfants: ["port","lido"] },
  { id: "q-hierles", libelle: "Les Hierles", type: "territoire", echelle: "La ville", tier: 1, icone: "🏊", parent: "frontignan", sous: "Futur centre aquatique intercommunal · friche Lafarge", texte: "Quartier retenu pour le centre aquatique intercommunal (marchés lancés au budget agglo 2026) et concerné par l'étude de renaturation de la friche Lafarge.", faits: [{"cle":"Centre aquatique","valeur":"études 2025 (100 k€), marchés 2026"},{"cle":"Horizon","valeur":"2028-2030"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "q-qpv", libelle: "QPV Deux Pins & centre", type: "territoire", echelle: "La ville", tier: 1, icone: "🏢", parent: "frontignan", sous: "Contrat de ville Quartiers 2030 (2024-2030)", texte: "Quartiers prioritaires élargis en 2024 (Deux Pins, puis Calmette et Anatole-France au centre). Crédits d'intervention annuels et appels à projets — un levier de financement pour des dispositifs de design social.", faits: [{"cle":"Périmètre","valeur":"Deux Pins + centre (Calmette, Anatole-France)"},{"cle":"Cadre","valeur":"Quartiers 2030, 2024-2030"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "friche-mobil", libelle: "Friche ExxonMobil", type: "projet", echelle: "La ville", tier: 1, icone: "🏗️", parent: "frontignan", sous: "11 ha dépollués restitués le 27 mai 2026", texte: "Le projet du siècle frontignanais : 11 hectares en cœur de ville, dépollués de 2022 à 2026 selon le principe pollueur-payeur et restitués à la Ville le 27 mai 2026. Les études d'usages rendent leurs résultats fin 2026 ; l'arrêté de récolement n'autorise pour l'instant qu'un usage industriel.", faits: [{"cle":"Surface","valeur":"11 ha"},{"cle":"Restitution","valeur":"27 mai 2026"},{"cle":"Dépollution","valeur":"2022-2026, pollueur-payeur"},{"cle":"Ambition","valeur":"emplois non délocalisables + quartier de gare"},{"cle":"Premiers usages","valeur":"≈ 2030"}], puces: ["Foncier public rarissime : un « martyr foncier » déjà consommé, donc une avance en régime ZAN.","Point de fragilité : les usages tertiaires/culturels dépendent d'études complémentaires.","Usages transitoires dès 2027 = la meilleure façon de tenir le récit pendant 8 ans de projet."], sources: [{"libelle":"Rapport d'analyse territoriale §7.2","url":"rapport-frontignan-analyse-territoriale.md","date":"08/09/2026"}], donnees: null, enfants: [] },
  { id: "pem-gare", libelle: "Gare nouvelle & PEM", type: "projet", echelle: "La ville", tier: 1, icone: "🚉", parent: "frontignan", sous: "25 M€ · livraison visée 2028-2029", texte: "Déplacement de la gare et création d'un pôle d'échanges multimodal sur la friche Mobil, chiffré à 25 M€ (Région 40 % plafonnés à 10 M€, agglo 20 %, État, Ville). Livré avant la bascule LGV de 2034, le PEM est conçu pour un monde de « trains du quotidien ».", faits: [{"cle":"Coût","valeur":"25 M€"},{"cle":"Financement","valeur":"Région ≤ 10 M€ · agglo 20 % · État · Ville"},{"cle":"Horizon","valeur":"2028-2029"},{"cle":"Ligne","valeur":"Montpellier-Sète, axe TER le plus fréquenté d'Occitanie"}], puces: ["Le vrai risque n'est pas le bâtiment, c'est la cadence TER après 2034 (SERM non contractualisé).","Le PEM est le seul projet capable de faire bouger la part modale (80 % de voiture aujourd'hui)."], sources: [{"libelle":"Vision 2026-2040 §1.3","url":"vision-frontignan-2026-2040.md","date":"08/09/2026"}], donnees: null, enfants: [] },
  { id: "oru", libelle: "ORU Cœur de Ville", type: "projet", echelle: "La ville", tier: 1, icone: "🧱", parent: "q-centre", sous: "≈ 15 M€ sur 10 ans · label ACV 2025", texte: "Opération de renouvellement urbain matricielle : requalification des espaces publics, habitat, commerces. Le label Action cœur de Ville obtenu en mars 2025 apporte ingénierie ANCT et accès renforcé aux dispositifs (Fonds vert, DSIL).", faits: [{"cle":"Enveloppe","valeur":"≈ 15 M€ / 10 ans"},{"cle":"Label ACV","valeur":"mars 2025, convention juin 2025"},{"cle":"Maîtrise d'œuvre espaces publics","valeur":"Humbert & David"}], puces: ["Phase 2 nationale de l'ACV élargie aux entrées de ville et quartiers de gare : sur mesure pour Frontignan."], sources: [], donnees: null, enfants: [] },
  { id: "port", libelle: "Port de plaisance", type: "projet", echelle: "La ville", tier: 1, icone: "⛵", parent: "q-plage", sous: "≈ 4,5 M€ · 603 → 750 anneaux (2026-2029)", texte: "Restructuration lancée à l'hiver 2025-2026 : avant-port et promenade Rive Est d'abord, puis bassins, pontons et espace des petits métiers de la pêche. Le port est excédentaire (607 505 € d'excédent d'exploitation 2025) : une ressource, pas une charge.", faits: [{"cle":"Budget","valeur":"≈ 4,5 M€"},{"cle":"Capacité","valeur":"603 → 750 anneaux (plafond SCoT 880)"},{"cle":"Excédent 2025","valeur":"607 505 €"},{"cle":"Calendrier","valeur":"2026-2029"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "mas-de-chave", libelle: "Mas de Chave", type: "projet", echelle: "La ville", tier: 1, icone: "🏡", parent: "q-peyrade", sous: "≈ 400 logements · calendrier fragilisé", texte: "Seule zone AU « fermée » du PLU. Programme initial de 336 logements, revu à ≈ 400 puis « ramené à la baisse » après la reprise de concertation votée le 15 juillet 2026. L'enquête publique annoncée pour 2026 est fragilisée.", faits: [{"cle":"Programme","valeur":"≈ 400 logements + parc urbain > 2 ha"},{"cle":"Statut","valeur":"déclaration de projet / DPMEC"},{"cle":"Concertation","valeur":"reprise le 15 juillet 2026"},{"cle":"Maîtrise d'œuvre","valeur":"Urban Projects"}], puces: ["Dossier le plus conflictuel du mandat : les riverains de La Peyrade sont organisés.","Interface directe avec l'AOP muscat : la limite ville/vignoble est un sujet de projet, pas de règlement."], sources: [], donnees: null, enfants: [] },
  { id: "le-quai", libelle: "Pôle culturel Le Quai", type: "projet", echelle: "La ville", tier: 1, icone: "🎬", parent: "q-centre", sous: "Chais Botta · cinéma 3 salles ouvert en déc. 2025", texte: "Reconversion des chais Botta en pôle culturel : cinéma de trois salles (2,6 M€ pour l'espace cinéma, exploité en DSP par un groupement incluant Véo Cinémas), librairie, école de cinéma. Livré avec ≈ 18 mois de retard.", faits: [{"cle":"Ouverture","valeur":"décembre 2025"},{"cle":"Espace cinéma","valeur":"2,6 M€ · 2 108 m²"},{"cle":"Salle Maison Mathieu","valeur":"≈ 150 places, 220 k€ au BP 2025"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "zae-barnier", libelle: "ZAE du Barnier", type: "projet", echelle: "La ville", tier: 1, icone: "🏬", parent: "q-peyrade", sous: "2,7 M€ · livraison juin 2027", texte: "Requalification de zone d'activité portée par la SPL Bassin de Thau : le levier d'emplois locaux le plus rapide du portefeuille de projets.", faits: [{"cle":"Budget","valeur":"2,7 M€"},{"cle":"Maître d'ouvrage","valeur":"SPL Bassin de Thau"},{"cle":"Livraison","valeur":"juin 2027"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "lido", libelle: "Lido & trait de côte", type: "risque", echelle: "La ville", tier: 1, icone: "🌊", parent: "q-plage", sous: "Érosion chronique · cartes 30/100 ans à produire", texte: "Frontignan fait partie des 31 communes maritimes inscrites au décret « recul du trait de côte » (31 juillet 2023) : elle doit produire des cartes d'exposition à 30 et 100 ans, finançables jusqu'à 80 % par le Fonds vert. Les protections du lido sont explicitement considérées comme temporaires.", faits: [{"cle":"Linéaire","valeur":"7 km"},{"cle":"Programme de défense","valeur":"≈ 13,5 M€ HT (estimation AVP 2012)"},{"cle":"Cartes réglementaires","valeur":"30 et 100 ans, attendues 2026-2027"},{"cle":"Fonds vert","valeur":"jusqu'à 80 %"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "submersion", libelle: "Submersion marine", type: "risque", echelle: "La ville", tier: 1, icone: "🌀", parent: "frontignan", sous: "Commune la plus exposée du bassin de Thau", texte: "Frontignan concentre ≈ 33 % des dommages estimés du bassin à aléa décennal (Q10 : 343,5 M€) et ≈ 26 % à aléa centennal (Q100 : 970,9 M€). L'A9 devient impraticable dès Q10 et 19 % du linéaire d'infrastructures est impacté. Le PPRI retient une PHE centennale de 2,00 m.", faits: [{"cle":"Part des dommages Q10","valeur":"≈ 33 %"},{"cle":"Part des dommages Q100","valeur":"≈ 26 %"},{"cle":"PHE de référence","valeur":"2,00 m"},{"cle":"Événements","valeur":"nov. 2014, oct. 2019"}], puces: ["Le risque est déjà chiffré : le sujet n'est plus la connaissance, mais l'appropriation collective."], sources: [{"libelle":"SMBT — fiche risques du SCoT","url":"https://www.smbt.fr/storage/2020/04/3.1.9-ANNEXE-EIE-Fiche-Risques-SCOT-BASIN-DE-THAU-ARRET-15-10-24.pdf","date":"15/10/2024"}], donnees: "submersion", enfants: [] },
  { id: "canicule", libelle: "Chaleur & sécheresse", type: "risque", echelle: "La ville", tier: 1, icone: "🔥", parent: "frontignan", sous: "1,3 → 7,7 jours > 35 °C par an en 2050", texte: "Les projections TRACC de Météo-France donnent +2,2 °C en 2050 pour l'Occitanie (+2,5 °C en été dans l'Hérault), une multiplication par ~6 des jours à plus de 35 °C, des nuits tropicales passant de 5 à 24 par an et un risque de feu multiplié par 2,5. Vigilances orange répétées durant l'été 2026.", faits: [{"cle":"2050","valeur":"+2,2 °C (Occitanie)"},{"cle":"Jours > 35 °C","valeur":"1,3 → 7,7 / an"},{"cle":"Nuits tropicales","valeur":"5 → 24 / an"},{"cle":"Feux","valeur":"× 2,5"}], puces: [], sources: [{"libelle":"Météo-France — TRACC Occitanie","url":"https://meteofrance.com/changement-climatique/quel-climat-futur-en-occitanie","date":"13/05/2026"}], donnees: "climat", enfants: [] },
  { id: "seveso", libelle: "Risque industriel", type: "risque", echelle: "La ville", tier: 1, icone: "☣️", parent: "q-peyrade", sous: "2 sites Seveso seuil haut + PPRT", texte: "GDH (dépôt d'hydrocarbures) et SCORI (traitement de déchets) imposent un plan de prévention des risques technologiques qui contraint l'urbanisme de La Peyrade — et pèse sur l'image de la ville.", faits: [{"cle":"Sites Seveso seuil haut","valeur":"2"},{"cle":"Outil","valeur":"PPRT"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "sam", libelle: "Sète Agglopôle Méditerranée", type: "territoire", echelle: "L'agglo de Thau", tier: 2, icone: "🏛️", parent: "frontignan", sous: "14 communes · 131 216 hab. · 310 km²", texte: "Née en 2017 de la fusion de Thau Agglo et de la CCNBT, la 2ᵉ agglomération de l'Hérault a son siège à Frontignan. Depuis mai 2025, elle est présidée par le Frontignanais Loïc Linares (réélu le 31 mars 2026) : un rééquilibrage historique face à la ville-centre sétoise.", faits: [{"cle":"Communes","valeur":"14"},{"cle":"Population 2023","valeur":"131 216 hab."},{"cle":"Superficie","valeur":"310 km²"},{"cle":"Budget 2026","valeur":"242 M€ dont 68 M€ d'investissement"},{"cle":"Dette fin 2025","valeur":"99,7 M€"},{"cle":"Épargne brute","valeur":"18,4 %"},{"cle":"Désendettement","valeur":"6,3 ans"}], puces: ["Le poids de Frontignan (18,4 % de la population) est doublé par le poids politique (siège + présidence).","13,1 M€ d'investissements 2026 fléchés contre les risques dans la lagune de Thau.","Budget « tagué climat » (méthodologie I4CE) pour la 2ᵉ année."], sources: [{"libelle":"Sète Agglopôle — budget 2026","url":"https://www.agglopole.fr/le-budget-2026-de-l-agglopole-a-ete-vote/","date":"05/03/2026"}], donnees: "communes", enfants: ["thau","sete","communes-thau","scot","ppa","mobilites-agglo","centre-aquatique","herault"] },
  { id: "thau", libelle: "Lagune de Thau", type: "ressource", echelle: "L'agglo de Thau", tier: 2, icone: "🦪", parent: "sam", sous: "7 500 ha · ≈ 4 000 emplois conchylicoles", texte: "La lagune est à la fois le capital naturel, économique et symbolique du bassin. Elle est aussi son point de fragilité : suspension sanitaire de 28 jours fin décembre 2025 (norovirus après fortes pluies), mortalités récurrentes, 120 M€ investis en dix ans dans l'assainissement.", faits: [{"cle":"Surface","valeur":"7 500 ha"},{"cle":"Emplois de filière","valeur":"≈ 4 000 sur le bassin"},{"cle":"Assainissement","valeur":"120 M€ en 10 ans"},{"cle":"Plan 2026","valeur":"+2,1 M€ fonctionnement, +5,3 M€ investissement"}], puces: ["La qualité de l'eau de Thau est l'indicateur vital du territoire à l'horizon 2030-2040.","Le nombre de jours de fermeture sanitaire par an est le meilleur signal faible à suivre."], sources: [], donnees: null, enfants: [] },
  { id: "sete", libelle: "Sète", type: "commune", echelle: "L'agglo de Thau", tier: 2, icone: "🐟", parent: "sam", sous: "45 337 hab. · ville-centre · 26 % de pauvreté", texte: "Ville-centre du bassin, port de commerce et de pêche, capitale culturelle (MIAM, di Rosa). Elle concentre 34,6 % de la population de l'agglo et 44,8 % de ses emplois, mais affiche le taux de pauvreté le plus élevé du bassin (26 %) et le niveau de vie le plus bas (22 740 €).", faits: [{"cle":"Population","valeur":"45 337 hab."},{"cle":"Emplois","valeur":"18 025"},{"cle":"Pauvreté","valeur":"26 %"},{"cle":"Niveau de vie médian","valeur":"22 740 €"},{"cle":"Densité","valeur":"1 872,7 hab./km²"}], puces: ["Relation Frontignan-Sète : interdépendance forte (bus express, rail, bassin d'emploi) et rivalité historique atténuée.","Hervé Marquès (Sète) est 1ᵉʳ vice-président de l'agglo : cogestion gauche-droite."], sources: [], donnees: "communes", enfants: [] },
  { id: "communes-thau", libelle: "Les 12 autres communes", type: "commune", echelle: "L'agglo de Thau", tier: 2, icone: "🗺️", parent: "sam", sous: "De Bouzigues (1 601 hab.) à Mèze (12 669 hab.)", texte: "Le bassin est très hétérogène : densités de 107 à 1 873 hab./km², niveaux de vie de 22 740 à 29 610 €, taux de résidences secondaires de 1,7 % (Gigean) à 59,7 % (Marseillan). Les villages du nord (Poussan, Gigean, Montbazin, Villeveyrac) sont des communes de report résidentiel ; les rives de l'étang (Bouzigues, Loupian, Mèze) vivent de la conchyliculture.", faits: [{"cle":"Communes","valeur":"14 au total"},{"cle":"Étendue des densités","valeur":"107 → 1 873 hab./km²"},{"cle":"Étendue des niveaux de vie","valeur":"22 740 → 29 610 €"},{"cle":"Croissance la plus forte","valeur":"Poussan +2,2 %/an"},{"cle":"Seules communes en recul","valeur":"Bouzigues, Montbazin"}], puces: ["Deux communes perdent des habitants (Bouzigues −0,6 %/an, Montbazin −0,4 %/an).","La moitié des communes ont un solde naturel négatif : le bassin ne se renouvelle plus par lui-même."], sources: [], donnees: "communes", enfants: [] },
  { id: "scot", libelle: "SCoT du bassin de Thau", type: "politique", echelle: "L'agglo de Thau", tier: 2, icone: "📐", parent: "sam", sous: "Révision : −54 % d'artificialisation · approbation fin 2026", texte: "Porté par le SMBT, le SCoT révisé traduit localement le ZAN : accueil ramené à +12 000 / +16 400 habitants à l'horizon 2043-2045 (contre +40 500 à 2030 dans la version précédente), −54 % d'artificialisation, ≈ 1 000 logements/an, priorité au renouvellement urbain et aux friches.", faits: [{"cle":"Horizon","valeur":"2043-2045"},{"cle":"Accueil démographique","valeur":"+12 000 à +16 400 hab."},{"cle":"Artificialisation","valeur":"−54 % vs SCoT précédent"},{"cle":"Production de logements","valeur":"≈ 1 000/an"},{"cle":"Friches à remobiliser","valeur":"≈ 30 ha sur le bassin"}], puces: [], sources: [{"libelle":"SMBT — révision du SCoT","url":"https://www.smbt.fr/blog/2026/02/06/revision-du-scot-du-bassin-de-thau/","date":"06/02/2026"}], donnees: null, enfants: [] },
  { id: "ppa", libelle: "PPA « recomposition spatiale »", type: "politique", echelle: "L'agglo de Thau", tier: 2, icone: "🧭", parent: "sam", sous: "Mai 2024 · 700 k€ d'études · 4 axes", texte: "Projet partenarial d'aménagement signé en mai 2024 entre l'agglo, l'État (Fonds vert), la Banque des Territoires, l'EPF Occitanie, la Région et le Département. Quatre axes : cartes du recul du trait de côte à 30/100 ans, plan-guide du triangle Sète-Balaruc-Frontignan, scénario de recomposition de Frontignan-Plage, association des habitants.", faits: [{"cle":"Signature","valeur":"mai 2024"},{"cle":"Budget d'études","valeur":"700 k€ HT"},{"cle":"Partenaires","valeur":"État, agglo, Banque des Territoires, EPF, Région, Département"},{"cle":"Statut","valeur":"l'un des premiers PPA « trait de côte » de France"}], puces: ["C'est LE cadre méthodologique et financier de tout projet littoral frontignanais.","Doctrine assumée (avis MRAe 2025) : les protections sont temporaires, le retrait est jugé inéluctable."], sources: [{"libelle":"Dossier de presse PPA","url":"https://www.agglopole.fr/storage/2024/06/Dossier-de-Presse-du-Projet-Partenarial-dAmenagement.pdf","date":"2024"}], donnees: null, enfants: [] },
  { id: "mobilites-agglo", libelle: "Mobilités du bassin", type: "projet", echelle: "L'agglo de Thau", tier: 2, icone: "🚌", parent: "sam", sous: "TCSP RD2 · SAMobilité · ≈ 30 M€ de sections à venir", texte: "Phase 1 du TCSP RD2 et nouveau réseau bus en service le 5 janvier 2026 (ligne express électrique Sète-Frontignan). Les sections sur Frontignan, Balaruc-les-Bains et Balaruc-le-Vieux, estimées à ≈ 30 M€, sont attendues entre 2027 et 2030. PDU agglo 2020-2030 : ≈ 154 M€ programmés.", faits: [{"cle":"TCSP phase 1","valeur":"en service le 05/01/2026"},{"cle":"Requalification RD2","valeur":"12 M€"},{"cle":"Sections à venir","valeur":"≈ 30 M€"},{"cle":"Bus électriques","valeur":"3 + 3 (1,65 M€ en 2026)"},{"cle":"Réseau","valeur":"SAMobilité — Keolis, DSP 2022-2030"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "centre-aquatique", libelle: "Centre aquatique intercommunal", type: "projet", echelle: "L'agglo de Thau", tier: 2, icone: "🏊‍♀️", parent: "sam", sous: "À Frontignan (Hierles) · marchés lancés en 2026", texte: "Équipement intercommunal localisé à Frontignan : études en 2025 (100 k€), lancement des marchés au budget agglo 2026, horizon de mise en service 2028-2030. Coût public non encore publié.", faits: [{"cle":"Localisation","valeur":"Frontignan, quartier des Hierles"},{"cle":"Études","valeur":"100 k€ en 2025"},{"cle":"Horizon","valeur":"2028-2030"},{"cle":"Coût","valeur":"non publié ❓"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "herault", libelle: "Hérault", type: "territoire", echelle: "Les environs", tier: 3, icone: "🌍", parent: "sam", sous: "1 230 289 hab. · +1,2 %/an · 21 % de pauvreté", texte: "Département le plus dynamique du littoral occitan (+1,2 %/an), mais aussi l'un des plus pauvres (21 %). Il atteindrait 1 430 000 habitants en 2050 (+245 000), dont 60 % des gains captés par le Montpelliérain.", faits: [{"cle":"Population 2023","valeur":"1 230 289 hab."},{"cle":"Croissance","valeur":"+1,2 %/an"},{"cle":"Pauvreté","valeur":"21,0 %"},{"cle":"Projection 2050","valeur":"1 430 000 hab."}], puces: [], sources: [], donnees: "echelles", enfants: ["montpellier","occitanie"] },
  { id: "montpellier", libelle: "Montpellier Méditerranée Métropole", type: "territoire", echelle: "Les environs", tier: 3, icone: "🚊", parent: "herault", sous: "522 542 hab. · +1,7 %/an · à 21 km", texte: "La métropole voisine croît quatre fois plus vite que la France et capterait 60 % des gains démographiques du département d'ici 2050. Elle est à la fois le marché d'emploi des navetteurs frontignanais, la source de pression foncière et le débouché culturel du territoire.", faits: [{"cle":"Population","valeur":"522 542 hab."},{"cle":"Croissance","valeur":"+1,7 %/an"},{"cle":"Emplois","valeur":"257 597"},{"cle":"Distance","valeur":"21 km · ligne TER la plus fréquentée d'Occitanie"}], puces: ["Le système à deux vitesses est le fait majeur : métropole en croissance, bassin de Thau à +0,05 %/an."], sources: [], donnees: "echelles", enfants: [] },
  { id: "occitanie", libelle: "Occitanie", type: "territoire", echelle: "Les environs", tier: 3, icone: "🌞", parent: "herault", sous: "6 124 653 hab. · +640 000 hab. attendus d'ici 2050", texte: "Région parmi les plus attractives de France (+0,8 %/an, quasi exclusivement migratoire). D'ici 2050 : +640 000 habitants, +570 000 ménages, un besoin estimé à 29 000 logements/an et une bascule des personnes seules en tête des types de ménages dès 2035.", faits: [{"cle":"Population 2023","valeur":"6 124 653 hab."},{"cle":"Croissance","valeur":"+0,8 %/an (dont +0,9 migratoire)"},{"cle":"Horizon 2050","valeur":"+640 000 hab., +570 000 ménages"},{"cle":"Besoin de logements","valeur":"29 000/an"}], puces: [], sources: [{"libelle":"INSEE Analyses Occitanie n°115","url":"https://www.insee.fr/fr/statistiques/8568012","date":"15/05/2025"}], donnees: "echelles", enfants: ["thau-2050","lgv","climat-2050","france"] },
  { id: "thau-2050", libelle: "Bassin de Thau 2050", type: "futur", echelle: "Les environs", tier: 3, icone: "⏳", parent: "occitanie", sous: "+0,05 %/an : la plus faible croissance héraultaise", texte: "Le territoire « Étang de Thau » atteindrait seulement ≈ 127 000 habitants en 2050 selon l'INSEE, soit une quasi-stagnation. Autrement dit : la croissance frontignanaise récente se fait en captant des flux, pas en créant de la démographie — une position réversible.", faits: [{"cle":"Croissance projetée","valeur":"+0,05 %/an"},{"cle":"Population 2050","valeur":"≈ 127 000 hab."},{"cle":"Comparaison","valeur":"Hérault +0,8 %/an, Montpelliérain +60 % des gains"}], puces: [], sources: [{"libelle":"INSEE Analyses — 170 000 ménages de plus dans l'Hérault","url":"https://www.insee.fr/fr/statistiques/8283176","date":"14/11/2024"}], donnees: null, enfants: [] },
  { id: "lgv", libelle: "LGV Montpellier-Perpignan", type: "projet", echelle: "Les environs", tier: 3, icone: "🚄", parent: "occitanie", sous: "Travaux 2029 · phase 1 en service 2034", texte: "La ligne nouvelle rebat les cartes ferroviaires du littoral : à partir de 2034, Sète et Frontignan seront « orphelines de la plupart des TGV », la compensation devant venir des TER (SERM : amplitude 5 h-23 h, jusqu'à un train toutes les 10 minutes aux heures de pointe). Phase 2 : DUP ≈ 2030, service ≈ 2040.", faits: [{"cle":"Appel d'offres phase 1","valeur":"≈ 1,5 Md€, fin 2026"},{"cle":"Travaux","valeur":"2029"},{"cle":"Mise en service phase 1","valeur":"2034"},{"cle":"Phase 2","valeur":"≈ 2040"},{"cle":"Compensations LGV pour l'agglo","valeur":"10-15 M€"}], puces: ["Ne pas caler le modèle économique local sur la LGV : miser sur le train du quotidien.","Le PEM aura 5 ans d'avance sur la bascule — atout si l'offre TER suit, risque sinon."], sources: [], donnees: null, enfants: [] },
  { id: "climat-2050", libelle: "Climat littoral 2050", type: "risque", echelle: "Les environs", tier: 3, icone: "🌡️", parent: "occitanie", sous: "+24 cm de mer en 2050 · +2,2 °C", texte: "Le littoral occitan est sous contrainte croissante mais à vitesse connue : c'est ce qui rend la planification possible. La mer monte de +24 cm en 2050 et de +62 à +81 cm en 2100, tandis que le PPRI retient déjà une PHE centennale de 2,00 m.", faits: [{"cle":"Mer 2050","valeur":"+24 cm"},{"cle":"Mer 2100","valeur":"+62 à +81 cm"},{"cle":"Été héraultais 2050","valeur":"+2,5 °C"}], puces: [], sources: [], donnees: "climat", enfants: [] },
  { id: "france", libelle: "France", type: "territoire", echelle: "La France", tier: 4, icone: "🇫🇷", parent: "occitanie", sous: "66,2 M hab. · le cadre des marges de manœuvre", texte: "Le dernier palier ne sert pas de décor : il fixe les règles (ZAN, trait de côte, loi 3DS), les guichets (ACV, Fonds vert, DSIL, FCTVA) et la contrainte budgétaire des collectivités. C'est là que se décide ce qu'une ville de 24 000 habitants peut financer.", faits: [{"cle":"Population métropolitaine","valeur":"66 165 815 hab."},{"cle":"Croissance","valeur":"+0,4 %/an"},{"cle":"Niveau de vie médian","valeur":"25 920 €"},{"cle":"Pauvreté","valeur":"15,9 %"},{"cle":"Chômage 15-64","valeur":"11,0 %"}], puces: [], sources: [], donnees: "echelles", enfants: ["zan","trait-de-cote","acv","finances-nat"] },
  { id: "zan", libelle: "ZAN & loi Climat", type: "politique", echelle: "La France", tier: 4, icone: "📉", parent: "france", sous: "−50 % d'artificialisation en 2031 · ZAN 2050", texte: "La loi Climat et résilience du 22 août 2021 impose de réduire de moitié la consommation d'espaces naturels, agricoles et forestiers entre 2021 et 2031, puis d'atteindre le zéro artificialisation nette en 2050. Frontignan, qui a déjà « consommé » ses friches, part avec une avance stratégique.", faits: [{"cle":"Loi","valeur":"22 août 2021"},{"cle":"Décrets","valeur":"28 novembre 2023"},{"cle":"Palier 2031","valeur":"−50 %"},{"cle":"Cible","valeur":"ZAN 2050"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "trait-de-cote", libelle: "Dispositif recul du trait de côte", type: "politique", echelle: "La France", tier: 4, icone: "📏", parent: "france", sous: "Décret du 31 juillet 2023 · Frontignan inscrite", texte: "Frontignan fait partie des communes maritimes tenues de cartographier leur exposition à 30 et 100 ans, aux côtés de Sète, Marseillan, Villeneuve-lès-Maguelone ou Mauguio. Ces cartes deviendront un front d'urbanisme — et un sujet politique majeur pour la station balnéaire.", faits: [{"cle":"Décret-liste","valeur":"31 juillet 2023"},{"cle":"Horizons","valeur":"30 et 100 ans"},{"cle":"Financement","valeur":"Fonds vert jusqu'à 80 %"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "acv", libelle: "Action cœur de Ville", type: "politique", echelle: "La France", tier: 4, icone: "🎯", parent: "france", sous: "Label obtenu en mars 2025 · prolongé fin 2025", texte: "Programme national de revitalisation : ingénierie ANCT, accès facilité aux financements, phase 2 élargie aux entrées de ville et quartiers de gare. Frontignan est la 5ᵉ ville héraultaise labellisée ; plus de 200 M€ ont déjà été mobilisés par l'ACV dans le département.", faits: [{"cle":"Label","valeur":"mars 2025, convention juin 2025"},{"cle":"Phase 2","valeur":"entrées de ville & quartiers de gare"},{"cle":"Effet levier dans l'Hérault","valeur":"> 200 M€"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "finances-nat", libelle: "Contraction des financements", type: "politique", echelle: "La France", tier: 4, icone: "📉", parent: "france", sous: "Fonds vert 2,5 Md€ → 834 M€ · FCTVA −2 pts", texte: "L'ère de la rareté maîtrisée : le Fonds vert passe de 2,5 Md€ (2024) à 1,15 Md€ (2025) puis 834 M€ (2026), le taux de FCTVA baisse de 16,4 % à 14,85 %, les taux d'intérêt montent (+27,6 % de charge d'intérêts pour l'agglo en 2025). Les financements existent mais se gagnent dossier par dossier.", faits: [{"cle":"Fonds vert 2026","valeur":"834 M€ (−67 % en 2 ans)"},{"cle":"FCTVA","valeur":"16,4 % → 14,85 %"},{"cle":"Intérêts agglo 2025","valeur":"+27,6 %"}], puces: [], sources: [], donnees: null, enfants: [] },
  { id: "focus-2030", libelle: "Focus 2030", type: "futur", echelle: "La ville", tier: 1, icone: "🎯", parent: "frontignan", sous: "5 conditions de succès mesurables", texte: "2030 est la première date où le mandat 2026-2032 sera jugé sur pièces : PEM livré et desservi, programmation de la friche validée et financée, +300 à +600 emplois locaux, qualité de l'eau de Thau en amélioration, trajectoire démographique tenue sans gentrification du centre.", faits: [{"cle":"Population 2030","valeur":"≈ 25 000 hab. (estimation)"},{"cle":"Emplois visés","valeur":"+300 à +600"},{"cle":"Jalons visibles","valeur":"PEM, centre aquatique, port, premiers usages de la friche"}], puces: [], sources: [], donnees: "conditions", enfants: [] },
  { id: "scenarios-2040", libelle: "Trois scénarios 2040", type: "futur", echelle: "La ville", tier: 1, icone: "🔮", parent: "frontignan", sous: "Thau tranquille · Couronne métropolitaine · Pôle de la transition", texte: "S1 « Thau tranquille » : stagnation, friche sous-aménagée, ville-dortoir vieillissante. S2 « Couronne métropolitaine » : débordement montpelliérain, spéculation, gentrification. S3 « Pôle de la transition » ★ : friche + PEM + identité produisent +500 à +1 000 emplois. Les probabilités affichées sont une lecture d'analyste, pas une prévision.", faits: [{"cle":"S1","valeur":"24-25 000 hab., 65+ > 30 %"},{"cle":"S2","valeur":"> 27 000 hab., 25-30 % de résidences secondaires"},{"cle":"S3 ★","valeur":"≈ 26 000 hab., +500 à +1 000 emplois"}], puces: [], sources: [], donnees: "scenarios", enfants: [] },
  { id: "trajectoire", libelle: "Trajectoire 2026-2040", type: "futur", echelle: "La ville", tier: 1, icone: "🛤️", parent: "frontignan", sous: "2030 la ville rééquipée · 2034 la bascule ferroviaire · 2040 le littoral recomposé", texte: "Trois blocs : 2026-2030 « tout se joue maintenant » (friche, PEM, port, centre aquatique, SCoT/PLU), 2030-2034 « le temps des preuves » (municipales 2032, LGV 2034), 2034-2040 « la maturité » (recomposition de la plage, désaisonnalisation, services au vieillissement).", faits: [], puces: [], sources: [], donnees: "jalons", enfants: [] },
  { id: "swot", libelle: "SWOT", type: "data", echelle: "La ville", tier: 1, icone: "⚖️", parent: "frontignan", sous: "9 forces · 9 faiblesses · 9 opportunités · 8 menaces", texte: "Forces : muscat, littoral, position bipolaire, poids intercommunal, finances maîtrisées, 11 ha dépollués, faible vacance commerciale, culture, équipe réélue. Faiblesses : chômage et pauvreté, vieillissement, dépendance automobile, risques majeurs, pression fiscale, offre hôtelière, image industrielle, fracture civique, offre de soins.", faits: [], puces: [], sources: [], donnees: "swot", enfants: [] },
  { id: "acteurs", libelle: "Cartographie des acteurs", type: "acteur", echelle: "La ville", tier: 1, icone: "🕸️", parent: "frontignan", sous: "28 acteurs positionnés en influence × intérêt", texte: "Trois familles : institutionnels (co-construction obligatoire), acteurs économiques (alliances gagnant-gagnant) et société civile (écoute et preuve). Le point singulier de Frontignan est la superposition ville/agglo : les mêmes personnes décident aux deux échelles.", faits: [], puces: ["Dynamiques à surveiller : couple ville/agglo, relation Sète-Frontignan, clivage centre / Peyrade / plage, fatigue démocratique.","Les scores d'influence et d'intérêt sont une estimation d'analyste (fiabilité C), à valider en entretien."], sources: [], donnees: "acteurs", enfants: ["a-arrouy","a-linares","a-adjoints","a-services","a-opposition","a-etat","a-region","a-departement","a-smbt","a-anct","a-sncf","a-bdt","a-cave","a-vignerons","a-hexis","a-seveso","a-conchyliculteurs","a-commercants","a-tourisme","a-promoteurs","a-comites","a-assos","a-qpv","a-seniors","a-jeunes","a-navetteurs","a-riverains","a-presse"] },
  { id: "recos", libelle: "Recommandations design", type: "data", echelle: "La ville", tier: 1, icone: "✅", parent: "frontignan", sous: "10 recommandations priorisées impact × faisabilité", texte: "R1 plateforme d'identité et signalétique · R2 concertation outillée friche & Mas de Chave · R3 design du pôle gare · R4 « bien vivre les chantiers » · R5 stratégie muscat 90→100 ans · R6 design du risque · R7 revitalisation commerciale · R8 écoconception des espaces publics · R9 montée en gamme de la plage · R10 observatoire du territoire.", faits: [], puces: [], sources: [], donnees: "recos", enfants: [] },
  { id: "a-arrouy", libelle: "Michel Arrouy", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🧑‍💼", parent: "acteurs", sous: "Maire (PS), réélu au 1ᵉʳ tour en 2026", texte: "Maire (PS), réélu au 1ᵉʳ tour en 2026. Levier détenu : décision politique, agenda, budget. Posture recommandée : commanditaire — arbitre final.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"5/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"25"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-linares", libelle: "Loïc Linares", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "Président de Sète Agglopôle, élu frontignanais", texte: "Président de Sète Agglopôle, élu frontignanais. Levier détenu : budget agglo 242 m€, compétences mobilités/eau/déchets. Posture recommandée : allié structurel — clé de l'échelle intercommunale.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Agglo"},{"cle":"Influence","valeur":"5/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"20"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-adjoints", libelle: "Adjoints & conseillers délégués", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🧑‍💼", parent: "acteurs", sous: "Cadre de vie, culture, urbanisme, participation, risques, finances", texte: "Cadre de vie, culture, urbanisme, participation, risques, finances. Levier détenu : portefeuilles thématiques, relais terrain. Posture recommandée : co-constructeurs quotidiens de la mission.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"4/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"20"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-services", libelle: "Services municipaux (≈ 700 agents)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🧑‍💼", parent: "acteurs", sous: "DGS, urbanisme, technique, culture, communication", texte: "DGS, urbanisme, technique, culture, communication. Levier détenu : maîtrise d'ouvrage, données, continuité. Posture recommandée : alliés indispensables — attention à la charge.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"4/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"16"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-opposition", libelle: "Opposition (RN 6 élus, DVD 2)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🧑‍💼", parent: "acteurs", sous: "35,9 % des voix au 1ᵉʳ tour 2026", texte: "35,9 % des voix au 1ᵉʳ tour 2026. Levier détenu : tribune, représentation d'un électorat massif. Posture recommandée : à ne pas ignorer : la concertation doit être inattaquable.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"8"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-etat", libelle: "État / Préfecture de l'Hérault", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "ACV, PPRI, PPRT, ZAN, Fonds vert, DSIL", texte: "ACV, PPRI, PPRT, ZAN, Fonds vert, DSIL. Levier détenu : réglementation et subventions. Posture recommandée : cadre contraignant + guichet — dossiers à documenter.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"National"},{"cle":"Influence","valeur":"5/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"15"},{"cle":"Quadrant","valeur":"Tenir informés"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-region", libelle: "Région Occitanie", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "Gare/PEM (≤ 10 M€), TER, Plan Littoral 21, friches", texte: "Gare/PEM (≤ 10 M€), TER, Plan Littoral 21, friches. Levier détenu : financement du pem et de la desserte. Posture recommandée : décideur du calendrier ferroviaire — à sécuriser.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Région"},{"cle":"Influence","valeur":"5/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"20"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-departement", libelle: "Département de l'Hérault", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "RD2, chemin de halage, collèges, social", texte: "RD2, chemin de halage, collèges, social. Levier détenu : voirie départementale, action sociale. Posture recommandée : partenaire d'aménagement de proximité.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Département"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"9"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-smbt", libelle: "SMBT — Syndicat mixte du bassin de Thau", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "SCoT, SAGE, gestion de la lagune", texte: "SCoT, SAGE, gestion de la lagune. Levier détenu : règles d'urbanisme opposables. Posture recommandée : cadre juridique du littoral — à mobiliser en amont.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"Bassin"},{"cle":"Influence","valeur":"4/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"16"},{"cle":"Quadrant","valeur":"Co-construire"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-anct", libelle: "ANCT", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "Action cœur de Ville, ingénierie territoriale", texte: "Action cœur de Ville, ingénierie territoriale. Levier détenu : ingénierie, cofinancement d'études. Posture recommandée : levier d'expertise sous-utilisé.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"National"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"2/5"},{"cle":"Priorité (I×I)","valeur":"6"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-sncf", libelle: "SNCF Réseau / SNCF Gares & Connexions", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "Maîtrise d'ouvrage ferroviaire du PEM", texte: "Maîtrise d'ouvrage ferroviaire du PEM. Levier détenu : emprise et calendrier ferroviaires. Posture recommandée : contrainte technique majeure du projet gare.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"National"},{"cle":"Influence","valeur":"4/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"12"},{"cle":"Quadrant","valeur":"Tenir informés"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-bdt", libelle: "Banque des Territoires / EPF Occitanie", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🧑‍💼", parent: "acteurs", sous: "PPA recomposition spatiale, portage foncier", texte: "PPA recomposition spatiale, portage foncier. Levier détenu : ingénierie financière, foncier. Posture recommandée : partenaires du temps long littoral.", faits: [{"cle":"Famille","valeur":"Institutionnel"},{"cle":"Échelle","valeur":"National"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"9"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-cave", libelle: "Cave coopérative Frontignan Muscat", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "≈ 80 % de l'AOP, 1904, ≈ 9 M€ de CA", texte: "≈ 80 % de l'AOP, 1904, ≈ 9 M€ de CA. Levier détenu : patrimoine, marque, foncier viticole. Posture recommandée : pivot de la stratégie œnotouristique.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"12"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-vignerons", libelle: "8 vignerons indépendants", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "≈ 800 ha d'AOP avec Vic-la-Gardiole", texte: "≈ 800 ha d'AOP avec Vic-la-Gardiole. Levier détenu : paysage, récit, accueil. Posture recommandée : alliés d'un parcours muscat.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"8"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-hexis", libelle: "Hexis & industriels de La Peyrade", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "≈ 194 salariés (Hexis), 55 entreprises en ZA", texte: "≈ 194 salariés (Hexis), 55 entreprises en ZA. Levier détenu : emploi productif, taxe économique. Posture recommandée : à associer à la programmation de la friche.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"9"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-seveso", libelle: "GDH & SCORI (Seveso seuil haut)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "Dépôt d'hydrocarbures, traitement de déchets", texte: "Dépôt d'hydrocarbures, traitement de déchets. Levier détenu : pprt — servitudes d'urbanisme. Posture recommandée : contrainte foncière et enjeu d'image.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"2/5"},{"cle":"Priorité (I×I)","valeur":"6"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-conchyliculteurs", libelle: "Conchyliculteurs & pêcheurs de Thau", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🏭", parent: "acteurs", sous: "≈ 4 000 emplois de filière sur le bassin", texte: "≈ 4 000 emplois de filière sur le bassin. Levier détenu : identité, économie bleue, alerte sanitaire. Posture recommandée : baromètre de la santé du territoire.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Bassin"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"15"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-commercants", libelle: "Commerçants du centre-ville", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "≈ 180 commerces, vacance ≈ 4 %", texte: "≈ 180 commerces, vacance ≈ 4 %. Levier détenu : vitalité perçue du cœur de ville. Posture recommandée : fatigue des chantiers — quick wins nécessaires.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"10"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-tourisme", libelle: "Office de tourisme intercommunal « Archipel de Thau »", type: "acteur", echelle: "Acteurs", tier: 2, icone: "🏭", parent: "acteurs", sous: "Présidé par K. Gouvernayre (Frontignan)", texte: "Présidé par K. Gouvernayre (Frontignan). Levier détenu : promotion, données de fréquentation. Posture recommandée : canal de la désaisonnalisation.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Agglo"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"12"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-promoteurs", libelle: "Promoteurs & aménageurs", type: "acteur", echelle: "Acteurs", tier: 1, icone: "🏭", parent: "acteurs", sous: "Mas de Chave, Pielles, opérations privées", texte: "Mas de Chave, Pielles, opérations privées. Levier détenu : capacité à produire du logement. Posture recommandée : à encadrer par la qualité et la mixité.", faits: [{"cle":"Famille","valeur":"Économique"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"12"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-comites", libelle: "6 comités habitants & budget participatif", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "50 000 €/an, Maison des projets (2021)", texte: "50 000 €/an, Maison des projets (2021). Levier détenu : légitimité d'usage, veille de terrain. Posture recommandée : infrastructure participative existante à outiller.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"8"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-assos", libelle: "Associations (FIRN, joutes, patrimoine, environnement)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "FIRN depuis 1998, 29ᵉ édition en 2026", texte: "FIRN depuis 1998, 29ᵉ édition en 2026. Levier détenu : capital culturel et bénévole. Posture recommandée : producteurs de récit local.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"8"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-qpv", libelle: "Habitants des QPV (Deux Pins, centre)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "Contrat de ville Quartiers 2030 (2024-2030)", texte: "Contrat de ville Quartiers 2030 (2024-2030). Levier détenu : expérience vécue des services publics. Posture recommandée : public prioritaire — inclusion à construire.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"1/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"5"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-seniors", libelle: "Seniors (25,3 % de 65 ans et +)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "28,1 % des 65-79 ans vivent seuls", texte: "28,1 % des 65-79 ans vivent seuls. Levier détenu : temps, mémoire, usage quotidien. Posture recommandée : cible n°1 du confort urbain (chaleur, marche, santé).", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"10"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-jeunes", libelle: "Jeunes 15-24 ans (10,3 %)", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "Chômage des 15-24 ans : 28,9 %", texte: "Chômage des 15-24 ans : 28,9 %. Levier détenu : usages numériques, avenir du territoire. Posture recommandée : grand absent des dispositifs classiques.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"1/5"},{"cle":"Intérêt","valeur":"4/5"},{"cle":"Priorité (I×I)","valeur":"4"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-navetteurs", libelle: "Navetteurs (67 % des actifs)", type: "acteur", echelle: "Acteurs", tier: 2, icone: "👥", parent: "acteurs", sous: "80 % en voiture, double bassin Sète/Montpellier", texte: "80 % en voiture, double bassin Sète/Montpellier. Levier détenu : masse critique du pem. Posture recommandée : utilisateurs finaux du projet gare.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Bassin"},{"cle":"Influence","valeur":"1/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"5"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-riverains", libelle: "Riverains de La Peyrade & des chantiers", type: "acteur", echelle: "Acteurs", tier: 1, icone: "👥", parent: "acteurs", sous: "Mobilisés sur Mas de Chave (2025-2026)", texte: "Mobilisés sur Mas de Chave (2025-2026). Levier détenu : capacité de blocage / contentieux. Posture recommandée : co-conception obligatoire, sinon recours.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Commune"},{"cle":"Influence","valeur":"2/5"},{"cle":"Intérêt","valeur":"5/5"},{"cle":"Priorité (I×I)","valeur":"10"},{"cle":"Quadrant","valeur":"Écouter activement"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
  { id: "a-presse", libelle: "Presse locale (Midi Libre, Hérault Tribune, Plurielle)", type: "acteur", echelle: "Acteurs", tier: 2, icone: "👥", parent: "acteurs", sous: "Fabrique de l'opinion territoriale", texte: "Fabrique de l'opinion territoriale. Levier détenu : mise à l'agenda, récit public. Posture recommandée : relais des preuves visibles.", faits: [{"cle":"Famille","valeur":"Société civile"},{"cle":"Échelle","valeur":"Bassin"},{"cle":"Influence","valeur":"3/5"},{"cle":"Intérêt","valeur":"3/5"},{"cle":"Priorité (I×I)","valeur":"9"},{"cle":"Quadrant","valeur":"Surveiller"}], puces: [], sources: [], donnees: "acteurs", enfants: [] },
]);

/** Les liens : qui touche à quoi, et de quelle façon. */
export const LIENS = Object.freeze([
  { source: "frontignan", cible: "identite", type: "compose", poids: 3, libelle: "capital symbolique" },
  { source: "frontignan", cible: "demographie", type: "compose", poids: 3, libelle: null },
  { source: "demographie", cible: "ages", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "revenus", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "emploi", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "economie", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "budget", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "gouvernance", type: "compose", poids: 3, libelle: null },
  { source: "gouvernance", cible: "participation", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "q-centre", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "q-peyrade", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "q-plage", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "q-hierles", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "q-qpv", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "swot", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "acteurs", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "recos", type: "compose", poids: 2, libelle: null },
  { source: "frontignan", cible: "focus-2030", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "scenarios-2040", type: "compose", poids: 3, libelle: null },
  { source: "frontignan", cible: "trajectoire", type: "compose", poids: 2, libelle: null },
  { source: "q-peyrade", cible: "friche-mobil", type: "compose", poids: 3, libelle: "11 ha en cœur de ville" },
  { source: "friche-mobil", cible: "pem-gare", type: "depend", poids: 4, libelle: "le PEM s'implante sur la friche" },
  { source: "q-centre", cible: "oru", type: "compose", poids: 3, libelle: null },
  { source: "q-plage", cible: "port", type: "compose", poids: 3, libelle: null },
  { source: "q-plage", cible: "lido", type: "expose", poids: 3, libelle: null },
  { source: "q-peyrade", cible: "mas-de-chave", type: "compose", poids: 3, libelle: null },
  { source: "q-centre", cible: "le-quai", type: "compose", poids: 2, libelle: null },
  { source: "q-peyrade", cible: "zae-barnier", type: "compose", poids: 2, libelle: null },
  { source: "q-hierles", cible: "centre-aquatique", type: "compose", poids: 3, libelle: null },
  { source: "oru", cible: "acv", type: "finance", poids: 3, libelle: "label et ingénierie ANCT" },
  { source: "friche-mobil", cible: "zan", type: "depend", poids: 2, libelle: "friche = foncier ZAN-compatible" },
  { source: "friche-mobil", cible: "emploi", type: "produit", poids: 3, libelle: "emplois non délocalisables visés" },
  { source: "pem-gare", cible: "emploi", type: "produit", poids: 2, libelle: "accès au bassin d'emploi" },
  { source: "pem-gare", cible: "a-region", type: "finance", poids: 4, libelle: "≤ 10 M€ (40 %)" },
  { source: "pem-gare", cible: "a-sncf", type: "depend", poids: 3, libelle: "emprise et calendrier ferroviaires" },
  { source: "pem-gare", cible: "lgv", type: "depend", poids: 3, libelle: "bascule TER 2034" },
  { source: "pem-gare", cible: "mobilites-agglo", type: "coopere", poids: 3, libelle: "intermodalité TCSP/TER" },
  { source: "centre-aquatique", cible: "sam", type: "finance", poids: 3, libelle: "maîtrise d'ouvrage agglo" },
  { source: "mas-de-chave", cible: "a-riverains", type: "tension", poids: 4, libelle: "concertation reprise en 2026" },
  { source: "mas-de-chave", cible: "identite", type: "tension", poids: 2, libelle: "limite ville / AOP muscat" },
  { source: "zae-barnier", cible: "economie", type: "produit", poids: 2, libelle: null },
  { source: "le-quai", cible: "identite", type: "produit", poids: 2, libelle: null },
  { source: "frontignan", cible: "submersion", type: "expose", poids: 4, libelle: "1ʳᵉ commune exposée du bassin" },
  { source: "frontignan", cible: "canicule", type: "expose", poids: 3, libelle: null },
  { source: "q-peyrade", cible: "seveso", type: "expose", poids: 3, libelle: null },
  { source: "submersion", cible: "ppa", type: "depend", poids: 3, libelle: "cadre de recomposition" },
  { source: "lido", cible: "trait-de-cote", type: "depend", poids: 3, libelle: "cartes 30/100 ans" },
  { source: "canicule", cible: "climat-2050", type: "depend", poids: 3, libelle: null },
  { source: "submersion", cible: "q-plage", type: "expose", poids: 3, libelle: null },
  { source: "thau", cible: "submersion", type: "depend", poids: 2, libelle: null },
  { source: "frontignan", cible: "sam", type: "gouverne", poids: 5, libelle: "siège + présidence + VP tourisme" },
  { source: "sam", cible: "sete", type: "compose", poids: 4, libelle: null },
  { source: "sam", cible: "communes-thau", type: "compose", poids: 4, libelle: null },
  { source: "sam", cible: "thau", type: "compose", poids: 3, libelle: null },
  { source: "sam", cible: "scot", type: "gouverne", poids: 3, libelle: "via le SMBT" },
  { source: "sam", cible: "ppa", type: "gouverne", poids: 3, libelle: null },
  { source: "sam", cible: "mobilites-agglo", type: "gouverne", poids: 4, libelle: null },
  { source: "sam", cible: "centre-aquatique", type: "gouverne", poids: 3, libelle: null },
  { source: "sete", cible: "frontignan", type: "tension", poids: 3, libelle: "interdépendance et rivalité" },
  { source: "sete", cible: "emploi", type: "depend", poids: 3, libelle: "bassin d'emploi partagé" },
  { source: "communes-thau", cible: "thau", type: "depend", poids: 3, libelle: "conchyliculture" },
  { source: "thau", cible: "a-conchyliculteurs", type: "produit", poids: 3, libelle: null },
  { source: "scot", cible: "zan", type: "depend", poids: 3, libelle: "−54 % d'artificialisation" },
  { source: "scot", cible: "mas-de-chave", type: "gouverne", poids: 2, libelle: null },
  { source: "scot", cible: "port", type: "gouverne", poids: 2, libelle: "plafond de 880 anneaux" },
  { source: "mobilites-agglo", cible: "sete", type: "dessert", poids: 3, libelle: "ligne express RD2" },
  { source: "mobilites-agglo", cible: "frontignan", type: "dessert", poids: 3, libelle: null },
  { source: "sam", cible: "herault", type: "compose", poids: 3, libelle: null },
  { source: "herault", cible: "montpellier", type: "compose", poids: 3, libelle: null },
  { source: "herault", cible: "occitanie", type: "compose", poids: 3, libelle: null },
  { source: "montpellier", cible: "frontignan", type: "depend", poids: 4, libelle: "pression résidentielle & emploi" },
  { source: "montpellier", cible: "emploi", type: "depend", poids: 3, libelle: "navetteurs" },
  { source: "occitanie", cible: "thau-2050", type: "produit", poids: 2, libelle: null },
  { source: "thau-2050", cible: "sam", type: "depend", poids: 3, libelle: "+0,05 %/an" },
  { source: "occitanie", cible: "lgv", type: "gouverne", poids: 3, libelle: null },
  { source: "occitanie", cible: "climat-2050", type: "expose", poids: 3, libelle: null },
  { source: "occitanie", cible: "a-region", type: "gouverne", poids: 3, libelle: null },
  { source: "occitanie", cible: "france", type: "compose", poids: 3, libelle: null },
  { source: "france", cible: "zan", type: "gouverne", poids: 3, libelle: null },
  { source: "france", cible: "trait-de-cote", type: "gouverne", poids: 3, libelle: null },
  { source: "france", cible: "acv", type: "finance", poids: 3, libelle: null },
  { source: "france", cible: "finances-nat", type: "gouverne", poids: 3, libelle: null },
  { source: "finances-nat", cible: "budget", type: "depend", poids: 3, libelle: "FCTVA, dotations" },
  { source: "trait-de-cote", cible: "ppa", type: "finance", poids: 3, libelle: "Fonds vert 80 %" },
  { source: "zan", cible: "scot", type: "gouverne", poids: 3, libelle: null },
  { source: "acv", cible: "q-centre", type: "finance", poids: 3, libelle: null },
  { source: "finances-nat", cible: "sam", type: "depend", poids: 2, libelle: null },
  { source: "focus-2030", cible: "pem-gare", type: "depend", poids: 3, libelle: "condition n°1" },
  { source: "focus-2030", cible: "friche-mobil", type: "depend", poids: 3, libelle: "condition n°2" },
  { source: "focus-2030", cible: "emploi", type: "depend", poids: 3, libelle: "condition n°3" },
  { source: "focus-2030", cible: "thau", type: "depend", poids: 3, libelle: "condition n°4" },
  { source: "focus-2030", cible: "demographie", type: "depend", poids: 3, libelle: "condition n°5" },
  { source: "scenarios-2040", cible: "focus-2030", type: "depend", poids: 3, libelle: null },
  { source: "trajectoire", cible: "focus-2030", type: "depend", poids: 2, libelle: null },
  { source: "scenarios-2040", cible: "montpellier", type: "depend", poids: 2, libelle: "S2 couronne métropolitaine" },
  { source: "scenarios-2040", cible: "friche-mobil", type: "depend", poids: 3, libelle: "S3 pôle de la transition" },
  { source: "acteurs", cible: "gouvernance", type: "compose", poids: 2, libelle: null },
  { source: "acteurs", cible: "participation", type: "compose", poids: 2, libelle: null },
  { source: "recos", cible: "acteurs", type: "depend", poids: 2, libelle: null },
  { source: "swot", cible: "recos", type: "produit", poids: 2, libelle: null },
  { source: "identite", cible: "a-cave", type: "produit", poids: 3, libelle: null },
  { source: "economie", cible: "a-hexis", type: "compose", poids: 2, libelle: null },
  { source: "economie", cible: "a-commercants", type: "compose", poids: 2, libelle: null },
  { source: "q-centre", cible: "a-commercants", type: "tension", poids: 3, libelle: "fatigue des chantiers" },
  { source: "a-arrouy", cible: "gouvernance", type: "gouverne", poids: 5, libelle: null },
  { source: "a-arrouy", cible: "friche-mobil", type: "gouverne", poids: 4, libelle: null },
  { source: "a-arrouy", cible: "frontignan", type: "gouverne", poids: 5, libelle: null },
  { source: "a-linares", cible: "sam", type: "gouverne", poids: 5, libelle: null },
  { source: "a-linares", cible: "frontignan", type: "coopere", poids: 4, libelle: null },
  { source: "a-linares", cible: "pem-gare", type: "coopere", poids: 3, libelle: null },
  { source: "a-linares", cible: "scot", type: "coopere", poids: 3, libelle: null },
  { source: "a-adjoints", cible: "gouvernance", type: "compose", poids: 4, libelle: null },
  { source: "a-adjoints", cible: "participation", type: "gouverne", poids: 3, libelle: null },
  { source: "a-adjoints", cible: "q-centre", type: "gouverne", poids: 2, libelle: null },
  { source: "a-services", cible: "budget", type: "gouverne", poids: 3, libelle: null },
  { source: "a-services", cible: "oru", type: "gouverne", poids: 3, libelle: null },
  { source: "a-opposition", cible: "gouvernance", type: "tension", poids: 3, libelle: null },
  { source: "a-opposition", cible: "participation", type: "tension", poids: 2, libelle: null },
  { source: "a-etat", cible: "zan", type: "gouverne", poids: 4, libelle: null },
  { source: "a-etat", cible: "trait-de-cote", type: "gouverne", poids: 4, libelle: null },
  { source: "a-etat", cible: "acv", type: "finance", poids: 3, libelle: null },
  { source: "a-etat", cible: "seveso", type: "gouverne", poids: 3, libelle: null },
  { source: "a-region", cible: "pem-gare", type: "finance", poids: 5, libelle: null },
  { source: "a-region", cible: "lgv", type: "gouverne", poids: 4, libelle: null },
  { source: "a-region", cible: "port", type: "finance", poids: 2, libelle: null },
  { source: "a-departement", cible: "mobilites-agglo", type: "coopere", poids: 2, libelle: null },
  { source: "a-departement", cible: "q-centre", type: "finance", poids: 2, libelle: null },
  { source: "a-smbt", cible: "scot", type: "gouverne", poids: 4, libelle: null },
  { source: "a-smbt", cible: "thau", type: "gouverne", poids: 3, libelle: null },
  { source: "a-smbt", cible: "submersion", type: "gouverne", poids: 3, libelle: null },
  { source: "a-anct", cible: "acv", type: "finance", poids: 3, libelle: null },
  { source: "a-anct", cible: "oru", type: "coopere", poids: 2, libelle: null },
  { source: "a-sncf", cible: "pem-gare", type: "gouverne", poids: 4, libelle: null },
  { source: "a-bdt", cible: "ppa", type: "finance", poids: 3, libelle: null },
  { source: "a-bdt", cible: "friche-mobil", type: "coopere", poids: 2, libelle: null },
  { source: "a-cave", cible: "identite", type: "produit", poids: 3, libelle: null },
  { source: "a-cave", cible: "economie", type: "compose", poids: 2, libelle: null },
  { source: "a-vignerons", cible: "identite", type: "produit", poids: 2, libelle: null },
  { source: "a-vignerons", cible: "mas-de-chave", type: "tension", poids: 2, libelle: null },
  { source: "a-hexis", cible: "economie", type: "compose", poids: 3, libelle: null },
  { source: "a-hexis", cible: "friche-mobil", type: "coopere", poids: 2, libelle: null },
  { source: "a-seveso", cible: "seveso", type: "compose", poids: 3, libelle: null },
  { source: "a-seveso", cible: "q-peyrade", type: "tension", poids: 2, libelle: null },
  { source: "a-conchyliculteurs", cible: "thau", type: "depend", poids: 4, libelle: null },
  { source: "a-conchyliculteurs", cible: "sam", type: "tension", poids: 3, libelle: null },
  { source: "a-commercants", cible: "q-centre", type: "depend", poids: 4, libelle: null },
  { source: "a-commercants", cible: "oru", type: "tension", poids: 3, libelle: null },
  { source: "a-tourisme", cible: "identite", type: "coopere", poids: 3, libelle: null },
  { source: "a-tourisme", cible: "q-plage", type: "coopere", poids: 3, libelle: null },
  { source: "a-promoteurs", cible: "mas-de-chave", type: "produit", poids: 3, libelle: null },
  { source: "a-promoteurs", cible: "q-plage", type: "tension", poids: 2, libelle: null },
  { source: "a-comites", cible: "participation", type: "compose", poids: 4, libelle: null },
  { source: "a-comites", cible: "friche-mobil", type: "coopere", poids: 2, libelle: null },
  { source: "a-assos", cible: "identite", type: "produit", poids: 3, libelle: null },
  { source: "a-assos", cible: "participation", type: "coopere", poids: 2, libelle: null },
  { source: "a-qpv", cible: "q-qpv", type: "compose", poids: 3, libelle: null },
  { source: "a-qpv", cible: "participation", type: "depend", poids: 3, libelle: null },
  { source: "a-seniors", cible: "demographie", type: "compose", poids: 3, libelle: null },
  { source: "a-seniors", cible: "canicule", type: "expose", poids: 3, libelle: null },
  { source: "a-jeunes", cible: "emploi", type: "depend", poids: 3, libelle: null },
  { source: "a-jeunes", cible: "participation", type: "depend", poids: 2, libelle: null },
  { source: "a-navetteurs", cible: "pem-gare", type: "depend", poids: 4, libelle: null },
  { source: "a-navetteurs", cible: "montpellier", type: "depend", poids: 3, libelle: null },
  { source: "a-riverains", cible: "mas-de-chave", type: "tension", poids: 4, libelle: null },
  { source: "a-riverains", cible: "q-peyrade", type: "compose", poids: 3, libelle: null },
  { source: "a-presse", cible: "gouvernance", type: "coopere", poids: 2, libelle: null },
  { source: "a-presse", cible: "participation", type: "coopere", poids: 2, libelle: null },
]);

/** Les 14 communes de Sète Agglopôle Méditerranée, triées par population. */
export const COMMUNES = Object.freeze([
  { nom: "Sète", pop: 45337, part_agglo: 34.55, surf_km2: 40.58, dens: 1872.7, tvam: 0.8, sn: -0.5, sm: 1.3, nat: 6.4, mort: 14.8, nvm: 22740, pauv: 26, tcho: 17.1, tact: 67.9, emp: 18025, emp_100hab: 39.8, etab: 1864, etab_1000hab: 41.1, rs: 21.4, vac: 5.5, prop: 47.5, logts_men: 1.36, men: 24859, code: "34301", rangPopulation: 1 },
  { nom: "Frontignan", pop: 24136, part_agglo: 18.39, surf_km2: 40.01, dens: 760.9, tvam: 1, sn: -0.1, sm: 1.1, nat: 7.2, mort: 11.3, nvm: 24580, pauv: 17, tcho: 14, tact: 75.3, emp: 6556, emp_100hab: 27.2, etab: 671, etab_1000hab: 27.8, rs: 20.6, vac: 2.9, prop: 61.6, logts_men: 1.3, men: 11183, code: "34108", rangPopulation: 2 },
  { nom: "Mèze", pop: 12669, part_agglo: 9.66, surf_km2: 47.73, dens: 366.3, tvam: 1.5, sn: -0.5, sm: 2, nat: 6.6, mort: 12.5, nvm: 24180, pauv: 20, tcho: 15.1, tact: 72.1, emp: 3196, emp_100hab: 25.2, etab: 418, etab_1000hab: 33, rs: 13.8, vac: 5, prop: 58.1, logts_men: 1.22, men: 6157, code: "34157", rangPopulation: 3 },
  { nom: "Marseillan", pop: 8414, part_agglo: 6.41, surf_km2: 52.73, dens: 162.7, tvam: 1.3, sn: -0.7, sm: 2.1, nat: 7, mort: 14.7, nvm: 23800, pauv: 19, tcho: 16.8, tact: 71.7, emp: 2190, emp_100hab: 26, etab: 476, etab_1000hab: 56.6, rs: 59.7, vac: 0.4, prop: 59.7, logts_men: 2.5, men: 4360, code: "34150", rangPopulation: 4 },
  { nom: "Balaruc-les-Bains", pop: 7139, part_agglo: 5.44, surf_km2: 8.67, dens: 824.4, tvam: 0.9, sn: -0.3, sm: 1.3, nat: 5.7, mort: 7.1, nvm: 26450, pauv: 13, tcho: 13.7, tact: 74.2, emp: 2267, emp_100hab: 31.8, etab: 287, etab_1000hab: 40.2, rs: 54.3, vac: 1.2, prop: 65, logts_men: 2.24, men: 3444, code: "34023", rangPopulation: 5 },
  { nom: "Poussan", pop: 6797, part_agglo: 5.18, surf_km2: 29.92, dens: 226, tvam: 2.2, sn: 0.2, sm: 2, nat: 8.7, mort: 9.1, nvm: 25860, pauv: 13, tcho: 9.1, tact: 78, emp: 1389, emp_100hab: 20.4, etab: 178, etab_1000hab: 26.2, rs: 2.7, vac: 5, prop: 70.3, logts_men: 1.08, men: 2926, code: "34213", rangPopulation: 6 },
  { nom: "Gigean", pop: 6639, part_agglo: 5.06, surf_km2: 16.3, dens: 400.9, tvam: 0.5, sn: 0.3, sm: 0.3, nat: 9.9, mort: 8.9, nvm: 25740, pauv: 16, tcho: 10.5, tact: 77.3, emp: 1843, emp_100hab: 27.8, etab: 235, etab_1000hab: 35.4, rs: 1.7, vac: 7.8, prop: 70.5, logts_men: 1.11, men: 2709, code: "34113", rangPopulation: 7 },
  { nom: "Villeveyrac", pop: 3972, part_agglo: 3.03, surf_km2: 37.26, dens: 107, tvam: 0.8, sn: 0, sm: 0.8, nat: 7.8, mort: 11.6, nvm: 25390, pauv: 12, tcho: 10.1, tact: 81.7, emp: 851, emp_100hab: 21.4, etab: 112, etab_1000hab: 28.2, rs: 4.1, vac: 7.2, prop: 72.8, logts_men: 1.12, men: 1614, code: "34341", rangPopulation: 8 },
  { nom: "Vic-la-Gardiole", pop: 3428, part_agglo: 2.61, surf_km2: 30.72, dens: 185.4, tvam: 0.8, sn: 0, sm: 0.9, nat: 7.3, mort: 12.3, nvm: 25970, pauv: 13, tcho: 12, tact: 80.6, emp: 694, emp_100hab: 20.2, etab: 147, etab_1000hab: 42.9, rs: 27.5, vac: 5.3, prop: 66.3, logts_men: 1.49, men: 1681, code: "34333", rangPopulation: 9 },
  { nom: "Mireval", pop: 3301, part_agglo: 2.52, surf_km2: 11.23, dens: 298.7, tvam: 0.1, sn: -0.6, sm: 0.7, nat: 5.8, mort: 12.4, nvm: 27260, pauv: 10, tcho: 8, tact: 78.5, emp: 693, emp_100hab: 21, etab: 73, etab_1000hab: 22.1, rs: 3.8, vac: 4.8, prop: 72.9, logts_men: 1.09, men: 1457, code: "34159", rangPopulation: 10 },
  { nom: "Montbazin", pop: 2877, part_agglo: 2.19, surf_km2: 21.49, dens: 136.2, tvam: -0.4, sn: 0.3, sm: -0.8, nat: 10.1, mort: 7, nvm: 26870, pauv: 11, tcho: 9.2, tact: 77.8, emp: 359, emp_100hab: 12.5, etab: 56, etab_1000hab: 19.5, rs: 2.6, vac: 5.5, prop: 76.7, logts_men: 1.1, men: 1212, code: "34165", rangPopulation: 11 },
  { nom: "Balaruc-le-Vieux", pop: 2737, part_agglo: 2.09, surf_km2: 6.92, dens: 462.3, tvam: 0.7, sn: -0.6, sm: 1.3, nat: 3.7, mort: 15, nvm: 27840, pauv: 7, tcho: 10.2, tact: 78.1, emp: 1220, emp_100hab: 44.6, etab: 149, etab_1000hab: 54.4, rs: 11.2, vac: 1.1, prop: 72.7, logts_men: 1.14, men: 1205, code: "34024", rangPopulation: 12 },
  { nom: "Loupian", pop: 2169, part_agglo: 1.65, surf_km2: 23.26, dens: 135.6, tvam: 0.1, sn: 0.2, sm: -0.1, nat: 7.4, mort: 8.8, nvm: 25580, pauv: 13, tcho: 13, tact: 78.8, emp: 575, emp_100hab: 26.5, etab: 85, etab_1000hab: 39.2, rs: 14.4, vac: 10.1, prop: 72.5, logts_men: 1.32, men: 975, code: "34143", rangPopulation: 13 },
  { nom: "Bouzigues", pop: 1601, part_agglo: 1.22, surf_km2: 6.5, dens: 524.9, tvam: -0.6, sn: -0.1, sm: -0.4, nat: 10.6, mort: 5, nvm: 29610, pauv: null, tcho: 5.1, tact: 75.2, emp: 412, emp_100hab: 25.7, etab: 97, etab_1000hab: 60.6, rs: 22.5, vac: 4.5, prop: 73.7, logts_men: 1.38, men: 770, code: "34039", rangPopulation: 14 },
]);

/** Ce que veux dire chaque colonne du tableau des communes. */
export const INDICATEURS_COMMUNES = Object.freeze({
  "pop": [
    "Population municipale (2023)",
    "hab."
  ],
  "part_agglo": [
    "Part dans la population de l’agglo",
    "%"
  ],
  "surf_km2": [
    "Superficie",
    "km²"
  ],
  "dens": [
    "Densité",
    "hab./km²"
  ],
  "tvam": [
    "Taux de variation annuel moyen",
    "%/an"
  ],
  "sn": [
    "Solde naturel",
    "%/an"
  ],
  "sm": [
    "Solde migratoire",
    "%/an"
  ],
  "nat": [
    "Taux de natalité",
    "‰"
  ],
  "mort": [
    "Taux de mortalité",
    "‰"
  ],
  "nvm": [
    "Niveau de vie médian",
    "€/UC"
  ],
  "pauv": [
    "Taux de pauvreté",
    "%"
  ],
  "tcho": [
    "Taux de chômage (15-64 ans)",
    "%"
  ],
  "tact": [
    "Taux d’activité",
    "%"
  ],
  "emp": [
    "Emplois sur place",
    "emplois"
  ],
  "emp_100hab": [
    "Emplois pour 100 habitants",
    ""
  ],
  "etab": [
    "Établissements actifs",
    ""
  ],
  "etab_1000hab": [
    "Établissements pour 1 000 habitants",
    ""
  ],
  "rs": [
    "Résidences secondaires",
    "%"
  ],
  "vac": [
    "Logements vacants",
    "%"
  ],
  "prop": [
    "Propriétaires occupants",
    "%"
  ],
  "logts_men": [
    "Logements par ménage",
    ""
  ],
  "men": [
    "Ménages",
    ""
  ],
  "code": [
    "Code INSEE",
    ""
  ]
});

/** Répartition des nœuds — pour le bandeau de la vue. */
export const REPARTITION = Object.freeze({
  parType: {"territoire":11,"ressource":3,"data":7,"acteur":31,"projet":10,"risque":5,"commune":2,"politique":6,"futur":4},
  parEchelle: {"Frontignan":1,"La ville":31,"L'agglo de Thau":8,"Les environs":6,"La France":5,"Acteurs":28},
  liens: 167,
  sourcesDeNoeuds: 19,
});

// ───────────────────────── accès ─────────────────────────

/** Un nœud par son identifiant. */
export function noeud(id) {
  return NOEUDS.find((x) => x.id === String(id || '')) || null;
}

/** Les nœuds d'un type (acteur, projet, risque, futur, commune…). */
export function noeudsParType(type) {
  return type ? NOEUDS.filter((x) => x.type === String(type)) : [...NOEUDS];
}

/** Les enfants directs d'un nœud. */
export function enfantsDe(id) {
  return NOEUDS.filter((x) => x.parent === String(id || ''));
}

/** Le voisinage d'un nœud dans le graphe, avec le libellé du lien et de l'autre bout. */
export function voisinage(id) {
  const cle = String(id || '');
  const out = [];
  for (const l of LIENS) {
    const autre = l.source === cle ? l.cible : l.cible === cle ? l.source : null;
    if (!autre) continue;
    const cible = noeud(autre);
    if (!cible) continue;
    out.push({ sens: l.source === cle ? 'sortant' : 'entrant', lien: l.type, libelle: l.libelle, noeud: cible });
  }
  return out.sort((a, b) => (b.noeud.tier ?? 9) - (a.noeud.tier ?? 9));
}

/** Une commune par son nom ou son code INSEE. */
export function commune(cle) {
  const c = String(cle || '').toLowerCase();
  return COMMUNES.find((x) => x.code === String(cle) || x.nom.toLowerCase() === c
    || x.nom.toLowerCase().startsWith(c)) || null;
}

/** Le classement des communes selon une colonne (population par défaut). */
export function classement(cle = 'pop', sens = 'desc') {
  const colonne = INDICATEURS_COMMUNES[cle] ? cle : 'pop';
  return [...COMMUNES].sort((a, b) => {
    const x = a[colonne];
    const y = b[colonne];
    if (x === null) return 1;
    if (y === null) return -1;
    return sens === 'desc' ? y - x : x - y;
  });
}

/** Un nœud comparable à une valeur, pour la frise ou le fil. */
export function valeurCommune(nom, cle) {
  const c = commune(nom);
  if (!c) return null;
  const v = c[cle];
  if (v === null || v === undefined) return null;
  const [libelle, unite] = INDICATEURS_COMMUNES[cle] || [cle, ''];
  const texte = Number.isInteger(v) ? v.toLocaleString('fr-FR') : String(v).replace('.', ',');
  return { commune: c.nom, indicateur: libelle, valeur: v, unite, affichage: texte + (unite ? ' ' + unite : '') };
}

/** Toutes les sources portées par les nœuds, dédoublonnées. */
export function sourcesAtlas() {
  const vues = new Map();
  for (const x of NOEUDS) {
    for (const s of x.sources) {
      if (!s.url) continue;
      if (!vues.has(s.url)) vues.set(s.url, { url: s.url, libelle: s.libelle, date: s.date, noeuds: [] });
      vues.get(s.url).noeuds.push(x.id);
    }
  }
  return [...vues.values()];
}

/** Contrôle d'intégrité : ce qui doit être vrai d'un graphe rangé. */
export function verifierAtlas() {
  const problemes = [];
  const ids = new Set(NOEUDS.map((x) => x.id));
  if (ids.size !== NOEUDS.length) problemes.push('identifiants de nœuds dupliqués');
  for (const l of LIENS) {
    if (!ids.has(l.source)) problemes.push(`lien depuis un nœud inconnu : ${l.source}`);
    if (!ids.has(l.cible)) problemes.push(`lien vers un nœud inconnu : ${l.cible}`);
  }
  for (const x of NOEUDS) {
    if (x.parent && !ids.has(x.parent)) problemes.push(`parent inconnu pour ${x.id} : ${x.parent}`);
  }
  for (const c of COMMUNES) {
    if (!c.nom || !c.code) problemes.push('commune sans nom ou sans code INSEE');
  }
  return { ok: problemes.length === 0, problemes, nœuds: NOEUDS.length, liens: LIENS.length, communes: COMMUNES.length };
}

/** Statistiques pour le bandeau de la vue INTEL. */
export function statistiquesAtlas() {
  return {
    noeuds: NOEUDS.length,
    liens: LIENS.length,
    communes: COMMUNES.length,
    peuplement: PROVENANCE_ATLAS.peuplementTotal,
    types: REPARTITION.parType,
    sources: sourcesAtlas().length,
    noeudsSansSource: NOEUDS.filter((x) => x.sources.length === 0).length,
    projets: NOEUDS.filter((x) => x.type === 'projet').length,
    acteurs: NOEUDS.filter((x) => x.type === 'acteur').length,
    risques: NOEUDS.filter((x) => x.type === 'risque').length,
  };
}
