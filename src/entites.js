/**
 * WATCHTOWER — ENTITÉS DE LA CARTE (couche « qui est là ? »).
 *
 * Principe : sur la vue satellite / 2D, on voit des BÂTIMENTS. On ne sait pas
 * ce qu'il y a dedans. Cette couche pose, au-dessus de chaque emprise, une
 * pastille 2D **façon OSM** (disque sombre + pictogramme de la fonction réelle
 * du lieu) :
 *
 *   · une boulangerie → 🥐 « Boulangerie — La Frontignanaise » ;
 *   · une bibliothèque → 📚 « Bibliothèque municipale de Frontignan » ;
 *   · une maison → 🏠 « Maison — 14 rue des Bleuets » ;
 *   · des cuves → 🛢 « Cuves de stockage ×4 » …
 *
 * Les données viennent **exclusivement d'OpenStreetMap** (Overpass) : si une
 * entité n'est pas dans OSM, elle n'est pas affichée — on n'invente rien. Le
 * panneau rappelle la source et sa licence (ODbL) et chaque donnée est
 * cliquable pour remonter à la fiche OSM d'origine.
 *
 * RÈGLE DE REGROUPEMENT « CADASTRE » : plusieurs entités de la MÊME fonction
 * côte à côte (parcelles voisines, cellules commerciales, cuves jumelles…)
 * partagent UNE SEULE pastille, marquée du nombre d'entités. Un clic sur la
 * pastille ouvre alors un SÉLECTEUR qui liste chaque entité séparément (avec
 * son nom, son adresse et le lien vers sa fiche OSM) — on ne perd aucune
 * entité, on évite juste le tas d'icônes.
 *
 * Aucune clé, aucune donnée propriétaire : Overpass + l'ellipsoïde Cesium.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';

/** Pastille par défaut quand on ne sait pas ce que c'est. */
export const ICONE_DEFAUT = { ic: '📌', nom: 'Lieu', cle: 'autre', couleur: '#8ea0b5' };

/** Palette par grande famille (utilisée pour le liseré de la pastille). */
export const FAMILLES = Object.freeze({
  alimentation: { nom: 'ALIMENTATION', couleur: '#ffb454' },
  restauration: { nom: 'RESTAURATION', couleur: '#ff8b6b' },
  sante: { nom: 'SANTÉ', couleur: '#ff6b8b' },
  enseignement: { nom: 'ENSEIGNEMENT', couleur: '#8ad2ff' },
  culture: { nom: 'CULTURE', couleur: '#c79bff' },
  sport: { nom: 'SPORT', couleur: '#7ef0c0' },
  transport: { nom: 'TRANSPORT', couleur: '#9fb8ff' },
  administration: { nom: 'SERVICE PUBLIC', couleur: '#7fd1ff' },
  finance: { nom: 'FINANCE', couleur: '#d8e06b' },
  industrie: { nom: 'INDUSTRIE · ÉNERGIE', couleur: '#ffa04d' },
  dechets: { nom: 'DÉCHETS', couleur: '#b0c46b' },
  agriculture: { nom: 'AGRICULTURE', couleur: '#a8e05f' },
  tourisme: { nom: 'TOURISME', couleur: '#67d5f0' },
  habitat: { nom: 'HABITAT', couleur: '#e0d0a8' },
  nature: { nom: 'NATURE', couleur: '#6bbf7a' },
  service: { nom: 'SERVICES', couleur: '#c9d4e2' },
  telecom: { nom: 'TÉLÉCOM', couleur: '#8ef0ff' },
  autre: { nom: 'AUTRE', couleur: '#8ea0b5' },
});

/**
 * Table des fonctions : `clé OSM = valeur` → pictogramme + libellé + famille.
 * `clé OSM = *` sert de repli pour toutes les autres valeurs de cette clé.
 */
export const TABLE_ENTITES = Object.freeze({
  // ——— alimentation ———
  'shop=bakery': { ic: '🥐', nom: 'Boulangerie', cle: 'alimentation' },
  'shop=pastry': { ic: '🥮', nom: 'Pâtisserie', cle: 'alimentation' },
  'shop=butcher': { ic: '🥩', nom: 'Boucherie', cle: 'alimentation' },
  'shop=greengrocer': { ic: '🥬', nom: 'Primeur', cle: 'alimentation' },
  'shop=seafood': { ic: '🐟', nom: 'Poissonnerie', cle: 'alimentation' },
  'shop=cheese': { ic: '🧀', nom: 'Fromagerie', cle: 'alimentation' },
  'shop=supermarket': { ic: '🛒', nom: 'Supermarché', cle: 'alimentation' },
  'shop=convenience': { ic: '🏪', nom: 'Épicerie', cle: 'alimentation' },
  'shop=frozen_food': { ic: '🧊', nom: 'Surgelés', cle: 'alimentation' },
  'shop=beverages': { ic: '🍾', nom: 'Caviste', cle: 'alimentation' },
  'shop=alcohol': { ic: '🍷', nom: 'Vins & spiritueux', cle: 'alimentation' },
  'shop=wine': { ic: '🍇', nom: 'Cave à vins', cle: 'alimentation' },
  'shop=deli': { ic: '🥗', nom: 'Traiteur', cle: 'alimentation' },
  // ——— restauration ———
  'amenity=restaurant': { ic: '🍽', nom: 'Restaurant', cle: 'restauration' },
  'amenity=fast_food': { ic: '🍔', nom: 'Restauration rapide', cle: 'restauration' },
  'amenity=cafe': { ic: '☕', nom: 'Café', cle: 'restauration' },
  'amenity=bar': { ic: '🍺', nom: 'Bar', cle: 'restauration' },
  'amenity=pub': { ic: '🍻', nom: 'Pub', cle: 'restauration' },
  'amenity=ice_cream': { ic: '🍦', nom: 'Glacier', cle: 'restauration' },
  'amenity=food_court': { ic: '🍜', nom: 'Aire de restauration', cle: 'restauration' },
  // ——— santé ———
  'amenity=pharmacy': { ic: '💊', nom: 'Pharmacie', cle: 'sante' },
  'amenity=hospital': { ic: '🏥', nom: 'Hôpital', cle: 'sante' },
  'amenity=clinic': { ic: '🏨', nom: 'Clinique', cle: 'sante' },
  'amenity=doctors': { ic: '🩺', nom: 'Cabinet médical', cle: 'sante' },
  'amenity=dentist': { ic: '🦷', nom: 'Dentiste', cle: 'sante' },
  'amenity=veterinary': { ic: '🐾', nom: 'Vétérinaire', cle: 'sante' },
  'healthcare=*': { ic: '🩺', nom: 'Santé', cle: 'sante' },
  // ——— enseignement ———
  'amenity=school': { ic: '🏫', nom: 'École', cle: 'enseignement' },
  'amenity=college': { ic: '🎒', nom: 'Collège', cle: 'enseignement' },
  'amenity=university': { ic: '🎓', nom: 'Université', cle: 'enseignement' },
  'amenity=kindergarten': { ic: '🧸', nom: 'Crèche', cle: 'enseignement' },
  'amenity=library': { ic: '📚', nom: 'Bibliothèque', cle: 'enseignement' },
  'amenity=language_school': { ic: '🗣', nom: 'École de langues', cle: 'enseignement' },
  'amenity=driving_school': { ic: '🚗', nom: 'Auto-école', cle: 'enseignement' },
  // ——— culture ———
  'amenity=theatre': { ic: '🎭', nom: 'Théâtre', cle: 'culture' },
  'amenity=cinema': { ic: '🎬', nom: 'Cinéma', cle: 'culture' },
  'amenity=arts_centre': { ic: '🎨', nom: 'Centre d’art', cle: 'culture' },
  'amenity=place_of_worship': { ic: '⛪', nom: 'Lieu de culte', cle: 'culture' },
  'amenity=archive': { ic: '🗄', nom: 'Archives', cle: 'culture' },
  'tourism=museum': { ic: '🖼', nom: 'Musée', cle: 'culture' },
  'tourism=gallery': { ic: '🖼', nom: 'Galerie', cle: 'culture' },
  'tourism=artwork': { ic: '🗿', nom: 'Œuvre d’art', cle: 'culture' },
  'historic=*': { ic: '🏛', nom: 'Patrimoine', cle: 'culture' },
  // ——— sport ———
  'leisure=sports_centre': { ic: '🏋', nom: 'Salle de sport', cle: 'sport' },
  'leisure=fitness_centre': { ic: '🏋', nom: 'Fitness', cle: 'sport' },
  'leisure=swimming_pool': { ic: '🏊', nom: 'Piscine', cle: 'sport' },
  'leisure=stadium': { ic: '🏟', nom: 'Stade', cle: 'sport' },
  'leisure=pitch': { ic: '⚽', nom: 'Terrain de sport', cle: 'sport' },
  'leisure=playground': { ic: '🛝', nom: 'Aire de jeux', cle: 'sport' },
  'leisure=marina': { ic: '⚓', nom: 'Port de plaisance', cle: 'tourisme' },
  'leisure=park': { ic: '🌳', nom: 'Parc', cle: 'nature' },
  'leisure=garden': { ic: '🌷', nom: 'Jardin', cle: 'nature' },
  'leisure=*': { ic: '🎯', nom: 'Loisir', cle: 'sport' },
  // ——— transport ———
  'amenity=fuel': { ic: '⛽', nom: 'Station-service', cle: 'transport' },
  'amenity=parking': { ic: '🅿', nom: 'Parking', cle: 'transport' },
  'amenity=parking_entrance': { ic: '🅿', nom: 'Entrée parking', cle: 'transport' },
  'amenity=charging_station': { ic: '🔌', nom: 'Borne de recharge', cle: 'transport' },
  'amenity=bicycle_parking': { ic: '🚲', nom: 'Parking vélos', cle: 'transport' },
  'amenity=bus_station': { ic: '🚌', nom: 'Gare routière', cle: 'transport' },
  'highway=bus_stop': { ic: '🚏', nom: 'Arrêt de bus', cle: 'transport' },
  'railway=station': { ic: '🚉', nom: 'Gare', cle: 'transport' },
  'railway=halt': { ic: '🚉', nom: 'Halte', cle: 'transport' },
  'railway=tram_stop': { ic: '🚊', nom: 'Arrêt tram', cle: 'transport' },
  'aeroway=aerodrome': { ic: '🛫', nom: 'Aérodrome', cle: 'transport' },
  'public_transport=*': { ic: '🚏', nom: 'Transport', cle: 'transport' },
  // ——— service public ———
  'amenity=townhall': { ic: '🏛', nom: 'Mairie', cle: 'administration' },
  'amenity=post_office': { ic: '📮', nom: 'Bureau de poste', cle: 'administration' },
  'amenity=police': { ic: '👮', nom: 'Police', cle: 'administration' },
  'amenity=fire_station': { ic: '🚒', nom: 'Caserne', cle: 'administration' },
  'amenity=courthouse': { ic: '⚖', nom: 'Tribunal', cle: 'administration' },
  'amenity=prison': { ic: '🔒', nom: 'Établissement pénitentiaire', cle: 'administration' },
  'amenity=embassy': { ic: '🏳', nom: 'Ambassade', cle: 'administration' },
  'amenity=public_building': { ic: '🏛', nom: 'Bâtiment public', cle: 'administration' },
  'amenity=community_centre': { ic: '🏘', nom: 'Centre social', cle: 'administration' },
  'amenity=recycling': { ic: '♻️', nom: 'Point de tri', cle: 'dechets' },
  'amenity=waste_transfer_station': { ic: '♻️', nom: 'Déchetterie', cle: 'dechets' },
  'amenity=water_point': { ic: '🚰', nom: 'Point d’eau', cle: 'service' },
  'amenity=drinking_water': { ic: '🚰', nom: 'Eau potable', cle: 'service' },
  'amenity=toilets': { ic: '🚻', nom: 'Toilettes', cle: 'service' },
  'emergency=*': { ic: '🚑', nom: 'Secours', cle: 'administration' },
  'office=*': { ic: '💼', nom: 'Bureau', cle: 'service' },
  // ——— finance / services aux entreprises ———
  'amenity=bank': { ic: '🏦', nom: 'Banque', cle: 'finance' },
  'amenity=atm': { ic: '💳', nom: 'Distributeur', cle: 'finance' },
  'amenity=bureau_de_change': { ic: '💱', nom: 'Change', cle: 'finance' },
  'office=insurance': { ic: '🛡', nom: 'Assurance', cle: 'finance' },
  'office=estate_agent': { ic: '🏠', nom: 'Agence immobilière', cle: 'finance' },
  'office=lawyer': { ic: '⚖', nom: 'Avocat', cle: 'finance' },
  'office=accountant': { ic: '🧮', nom: 'Expert-comptable', cle: 'finance' },
  // ——— commerce de détail ———
  'shop=clothes': { ic: '👕', nom: 'Vêtements', cle: 'service' },
  'shop=shoes': { ic: '👟', nom: 'Chaussures', cle: 'service' },
  'shop=hairdresser': { ic: '💇', nom: 'Coiffeur', cle: 'service' },
  'shop=beauty': { ic: '💅', nom: 'Esthétique', cle: 'service' },
  'shop=florist': { ic: '💐', nom: 'Fleuriste', cle: 'service' },
  'shop=books': { ic: '📚', nom: 'Librairie', cle: 'culture' },
  'shop=newsagent': { ic: '📰', nom: 'Presse', cle: 'service' },
  'shop=hardware': { ic: '🔧', nom: 'Quincaillerie', cle: 'service' },
  'shop=doityourself': { ic: '🛠', nom: 'Bricolage', cle: 'service' },
  'shop=furniture': { ic: '🛋', nom: 'Ameublement', cle: 'service' },
  'shop=electronics': { ic: '📺', nom: 'Électronique', cle: 'service' },
  'shop=computer': { ic: '💻', nom: 'Informatique', cle: 'service' },
  'shop=mobile_phone': { ic: '📱', nom: 'Téléphonie', cle: 'telecom' },
  'shop=optician': { ic: '👓', nom: 'Opticien', cle: 'sante' },
  'shop=laundry': { ic: '🧺', nom: 'Laverie', cle: 'service' },
  'shop=car_repair': { ic: '🔧', nom: 'Garage', cle: 'service' },
  'shop=car': { ic: '🚗', nom: 'Concessionnaire', cle: 'service' },
  'shop=bicycle': { ic: '🚲', nom: 'Cycles', cle: 'service' },
  'shop=*': { ic: '🏬', nom: 'Commerce', cle: 'service' },
  // ——— artisanat / production ———
  'craft=*': { ic: '🛠', nom: 'Artisan', cle: 'service' },
  // ——— industrie, énergie, stockage ———
  'man_made=storage_tank': { ic: '🛢', nom: 'Cuve de stockage', cle: 'industrie' },
  'man_made=silo': { ic: '🛢', nom: 'Silo', cle: 'industrie' },
  'man_made=water_tower': { ic: '🚰', nom: 'Château d’eau', cle: 'industrie' },
  'man_made=reservoir_covered': { ic: '🛢', nom: 'Réservoir', cle: 'industrie' },
  'man_made=pumping_station': { ic: '⚙', nom: 'Station de pompage', cle: 'industrie' },
  'man_made=works': { ic: '🏭', nom: 'Usine', cle: 'industrie' },
  'man_made=tower': { ic: '📡', nom: 'Tour', cle: 'telecom' },
  'man_made=mast': { ic: '📡', nom: 'Pylône', cle: 'telecom' },
  'man_made=pipeline': { ic: '🛢', nom: 'Canalisation', cle: 'industrie' },
  'man_made=wastewater_plant': { ic: '💧', nom: 'Station d’épuration', cle: 'dechets' },
  'man_made=water_works': { ic: '🚰', nom: 'Usine des eaux', cle: 'industrie' },
  'man_made=*': { ic: '🏗', nom: 'Ouvrage', cle: 'industrie' },
  'power=plant': { ic: '⚡', nom: 'Centrale', cle: 'industrie' },
  'power=substation': { ic: '🔌', nom: 'Poste électrique', cle: 'industrie' },
  'power=generator': { ic: '🔋', nom: 'Générateur', cle: 'industrie' },
  'power=*': { ic: '⚡', nom: 'Réseau électrique', cle: 'industrie' },
  'landuse=industrial': { ic: '🏭', nom: 'Zone industrielle', cle: 'industrie' },
  'landuse=commercial': { ic: '🏬', nom: 'Zone commerciale', cle: 'service' },
  'landuse=retail': { ic: '🏬', nom: 'Zone commerciale', cle: 'service' },
  'landuse=landfill': { ic: '♻️', nom: 'Décharge', cle: 'dechets' },
  'landuse=quarry': { ic: '⛏', nom: 'Carrière', cle: 'industrie' },
  'landuse=farmyard': { ic: '🚜', nom: 'Corps de ferme', cle: 'agriculture' },
  'landuse=vineyard': { ic: '🍇', nom: 'Vignoble', cle: 'agriculture' },
  'landuse=orchard': { ic: '🍎', nom: 'Verger', cle: 'agriculture' },
  'landuse=greenhouse_horticulture': { ic: '🌿', nom: 'Serres', cle: 'agriculture' },
  'landuse=residential': { ic: '🏘', nom: 'Zone résidentielle', cle: 'habitat' },
  'landuse=cemetery': { ic: '🪦', nom: 'Cimetière', cle: 'culture' },
  'landuse=*': { ic: '🗺', nom: 'Occupation du sol', cle: 'autre' },
  // ——— habitat ———
  'building=house': { ic: '🏠', nom: 'Maison', cle: 'habitat' },
  'building=detached': { ic: '🏠', nom: 'Maison individuelle', cle: 'habitat' },
  'building=residential': { ic: '🏘', nom: 'Immeuble résidentiel', cle: 'habitat' },
  'building=apartments': { ic: '🏢', nom: 'Immeuble', cle: 'habitat' },
  'building=farm': { ic: '🚜', nom: 'Ferme', cle: 'agriculture' },
  'building=industrial': { ic: '🏭', nom: 'Bâtiment industriel', cle: 'industrie' },
  'building=warehouse': { ic: '📦', nom: 'Entrepôt', cle: 'industrie' },
  'building=commercial': { ic: '🏬', nom: 'Local commercial', cle: 'service' },
  'building=retail': { ic: '🏪', nom: 'Magasin', cle: 'service' },
  'building=office': { ic: '🏢', nom: 'Bureaux', cle: 'service' },
  'building=hotel': { ic: '🏨', nom: 'Hôtel', cle: 'tourisme' },
  'building=church': { ic: '⛪', nom: 'Église', cle: 'culture' },
  'building=chapel': { ic: '⛪', nom: 'Chapelle', cle: 'culture' },
  'building=school': { ic: '🏫', nom: 'École', cle: 'enseignement' },
  'building=hospital': { ic: '🏥', nom: 'Hôpital', cle: 'sante' },
  'building=garage': { ic: '🚗', nom: 'Garage', cle: 'service' },
  'building=garages': { ic: '🚗', nom: 'Garages', cle: 'service' },
  'building=cabin': { ic: '🛖', nom: 'Cabane', cle: 'habitat' },
  'building=hut': { ic: '🛖', nom: 'Abri', cle: 'habitat' },
  'building=*': { ic: '🏢', nom: 'Bâtiment', cle: 'habitat' },
  // ——— tourisme ———
  'tourism=hotel': { ic: '🏨', nom: 'Hôtel', cle: 'tourisme' },
  'tourism=guest_house': { ic: '🛏', nom: 'Chambre d’hôte', cle: 'tourisme' },
  'tourism=hostel': { ic: '🛏', nom: 'Auberge', cle: 'tourisme' },
  'tourism=camp_site': { ic: '⛺', nom: 'Camping', cle: 'tourisme' },
  'tourism=caravan_site': { ic: '🚐', nom: 'Aire camping-cars', cle: 'tourisme' },
  'tourism=attraction': { ic: '⭐', nom: 'Attraction', cle: 'tourisme' },
  'tourism=viewpoint': { ic: '👁', nom: 'Point de vue', cle: 'tourisme' },
  'tourism=*': { ic: '🧳', nom: 'Tourisme', cle: 'tourisme' },
  // ——— nature ———
  'natural=water': { ic: '💧', nom: 'Étendue d’eau', cle: 'nature' },
  'natural=wood': { ic: '🌲', nom: 'Bois', cle: 'nature' },
  'natural=beach': { ic: '🏖', nom: 'Plage', cle: 'nature' },
  'natural=wetland': { ic: '🌾', nom: 'Zone humide', cle: 'nature' },
  'natural=scrub': { ic: '🌿', nom: 'Garrigue', cle: 'nature' },
  'natural=*': { ic: '🌱', nom: 'Élément naturel', cle: 'nature' },
  // ——— repli par clé ———
  'amenity=*': { ic: '🏷', nom: 'Équipement', cle: 'autre' },
});

/** Ordre de priorité des clés OSM : la plus « fonctionnelle » d'abord. */
const ORDRE_CLES = [
  'man_made', 'power', 'amenity', 'shop', 'craft', 'office', 'tourism',
  'leisure', 'healthcare', 'emergency', 'railway', 'highway', 'landuse',
  'building', 'natural', 'historic',
];

const cleDe = (v) => String(v || '').trim();

/**
 * Déduit la fonction réelle d'une entité OSM à partir de ses tags.
 * @param {object} tags
 * @returns {{ic:string, nom:string, cle:string, couleur:string, valeur?:string, source:string}}
 */
export function categorieDe(tags = {}) {
  const t = tags || {};
  for (const cle of ORDRE_CLES) {
    const valeur = cleDe(t[cle]);
    if (!valeur || valeur === 'no') continue;
    if (cle === 'highway' && valeur !== 'bus_stop') continue;
    if (cle === 'railway' && !['station', 'halt', 'tram_stop'].includes(valeur)) continue;
    const exact = TABLE_ENTITES[`${cle}=${valeur}`];
    if (exact) return { ...exact, couleur: FAMILLES[exact.cle]?.couleur || ICONE_DEFAUT.couleur, valeur, source: `${cle}=${valeur}` };
    const repli = TABLE_ENTITES[`${cle}=*`];
    if (repli) return { ...repli, couleur: FAMILLES[repli.cle]?.couleur || ICONE_DEFAUT.couleur, valeur, source: `${cle}=${valeur}` };
  }
  if (t.building) {
    const r = TABLE_ENTITES['building=*'];
    return { ...r, couleur: FAMILLES.habitat.couleur, valeur: 'yes', source: 'building=yes' };
  }
  return { ...ICONE_DEFAUT, valeur: '', source: '' };
}

/** Distance orthodromique approximative (m). */
export function distanceM(a, b) {
  const R = 6371000; const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Libellé lisible d'une entité (nom, sinon fonction + précision). */
export function titreEntite(e) {
  if (!e) return '—';
  if (e.nom) return e.nom;
  const f = e.fonction || ICONE_DEFAUT.nom;
  if (e.adresse) return `${f} — ${e.adresse}`;
  return `${f} (sans nom)`;
}

/** Adresse courte reconstituée depuis les tags OSM. */
export function adresseDe(tags = {}) {
  const n = cleDe(tags['addr:housenumber']);
  const r = cleDe(tags['addr:street']) || cleDe(tags['addr:place']);
  if (n && r) return `${n} ${r}`;
  return r || n || '';
}

/**
 * REGROUPEMENT « CADASTRE » : chaîne ensemble les entités de la MÊME fonction
 * séparées de moins de `rayonM` mètres. Chaque groupe garde la liste complète
 * de ses entités (`membres`) et un point moyen (`lat`/`lon`).
 *
 * @param {Array} liste entités {lat, lon, cle, ic, nom…}
 * @param {number} [rayonM=45]
 * @returns {Array} groupes {lat, lon, cle, ic, nom, fonction, membres, nombre}
 */
/**
 * Dispersion : deux pastilles à quelques mètres l'une de l'autre se
 * superposaient à l'écran (boulangerie + restaurant dans le même bâtiment…).
 * On les répartit sur un petit cercle autour du point, en pixels — la carte
 * reste juste, seule la pastille est décalée. Fonction pure, testée.
 * @param {Array<{lat:number,lon:number}>} groupes
 * @param {number} [seuilM] distance en deçà de laquelle on disperse
 * @param {number} [rayonPx] écart en pixels
 * @returns {Array<{dx:number,dy:number}>} décalage écran pour chaque pastille
 */
export function disperser(groupes = [], seuilM = 22, rayonPx = 26) {
  const out = groupes.map(() => ({ dx: 0, dy: 0 }));
  const clusters = [];
  groupes.forEach((g, i) => {
    if (!Number.isFinite(g?.lat) || !Number.isFinite(g?.lon)) return;
    let c = clusters.find((cl) => distanceM({ lat: cl.lat, lon: cl.lon }, g) <= seuilM);
    if (!c) { c = { lat: g.lat, lon: g.lon, membres: [] }; clusters.push(c); }
    c.membres.push(i);
  });
  for (const c of clusters) {
    const n = c.membres.length;
    if (n < 2) continue;
    c.membres.forEach((i, k) => {
      const a = (2 * Math.PI * k) / n - Math.PI / 2; // on commence en haut
      out[i] = {
        dx: Math.round(Math.cos(a) * rayonPx),
        dy: Math.round(Math.sin(a) * rayonPx),
      };
    });
  }
  return out;
}

export function regrouper(liste = [], rayonM = 45) {
  const groupes = [];
  for (const e of liste) {
    if (!Number.isFinite(e?.lat) || !Number.isFinite(e?.lon)) continue;
    const cleGroupe = `${e.cle}|${e.source || ''}`;
    // on cherche un groupe existant de même fonction dont un membre est proche
    let trouve = null;
    for (const g of groupes) {
      if (g.cleGroupe !== cleGroupe) continue;
      // ⚠ Borné : un groupe ne s'étire pas indéfiniment de proche en proche
      // (sinon la pastille atterrissait au barycentre d'un nuage large de
      // plusieurs centaines de mètres, donc « à côté » de tout).
      if (distanceM(g, e) > rayonM * 2) continue;
      if (g.membres.some((m) => distanceM(m, e) <= rayonM)) { trouve = g; break; }
    }
    if (trouve) {
      trouve.membres.push(e);
    } else {
      groupes.push({
        cleGroupe, cle: e.cle, ic: e.ic, fonction: e.fonction, couleur: e.couleur,
        lat: e.lat, lon: e.lon, membres: [e],
      });
    }
  }
  // Position + nom + compte.
  // ⚠ La pastille doit être POSÉE SUR UN LIEU RÉEL, pas au barycentre :
  //   · un membre nommé (boulangerie « Chez… ») → sa position exacte ;
  //   · un groupe de 1 ou 2 → la position du premier ;
  //   · au-delà → le barycentre (c'est alors un vrai regroupement).
  return groupes.map((g, i) => {
    const n = g.membres.length;
    const nomme = g.membres.find((m) => m.nom);
    const ancre = nomme || g.membres[0];
    const barycentre = n >= 3 && !nomme;
    const lat = barycentre ? g.membres.reduce((s, m) => s + m.lat, 0) / n : ancre.lat;
    const lon = barycentre ? g.membres.reduce((s, m) => s + m.lon, 0) / n : ancre.lon;
    return {
      id: `ent-${i}-${g.cleGroupe.replace(/[^a-z0-9]/gi, '')}`,
      lat, lon,
      cle: g.cle, ic: g.ic, fonction: g.fonction, couleur: g.couleur,
      nombre: n,
      // label : le lieu seul garde son nom, un groupe garde sa fonction (×n)
      nom: n === 1 ? (g.membres[0].nom || g.fonction) : `${g.fonction} ×${n}`,
      adresse: n === 1 ? (g.membres[0].adresse || '') : '',
      membres: g.membres,
    };
  });
}

/** Requête Overpass : toutes les entités nommées/typées autour d'un point. */
export function requeteOverpass(lat, lon, rayon = 800) {
  const R = Math.max(100, Math.round(rayon));
  const p = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  return `[out:json][timeout:25];
(
  nwr(around:${R},${p})[amenity];
  nwr(around:${R},${p})[shop];
  nwr(around:${R},${p})[craft];
  nwr(around:${R},${p})[office];
  nwr(around:${R},${p})[tourism];
  nwr(around:${R},${p})[leisure];
  nwr(around:${R},${p})[man_made];
  nwr(around:${R},${p})[power];
  nwr(around:${R},${p})[landuse];
  nwr(around:${R},${p})[building~"^(house|detached|residential|apartments|commercial|retail|industrial|warehouse|office|hotel|church|chapel|school|hospital|farm|cabin|hut|garage|garages)$"];
  nwr(around:${R},${p})[highway=bus_stop];
  nwr(around:${R},${p})[railway~"^(station|halt|tram_stop)$"];
  nwr(around:${R},${p})[healthcare];
  nwr(around:${R},${p})[emergency];
  nwr(around:${R},${p})[natural~"^(water|wood|beach|wetland|scrub)$"];
  nwr(around:${R},${p})[historic];
);
out center tags 800;`;
}

/** Transforme la réponse Overpass en entités normalisées. */
export function entitesDepuisReponse(donnees, filtre = null) {
  const elements = Array.isArray(donnees?.elements) ? donnees.elements : [];
  const vus = new Set();
  const out = [];
  for (const e of elements) {
    const lat = Number.isFinite(e.lat) ? e.lat : e.center?.lat;
    const lon = Number.isFinite(e.lon) ? e.lon : e.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tags = e.tags || {};
    const cat = categorieDe(tags);
    if (filtre && !filtre.has(cat.cle)) continue;
    const osmId = `${e.type}/${e.id}`;
    if (vus.has(osmId)) continue;
    vus.add(osmId);
    out.push({
      id: osmId,
      lat, lon,
      nom: cleDe(tags.name) || cleDe(tags['name:fr']) || '',
      fonction: cat.nom,
      cle: cat.cle,
      ic: cat.ic,
      couleur: cat.couleur,
      source: cat.source,
      adresse: adresseDe(tags),
      tags,
      osmId,
      type: e.type,
    });
  }
  return out;
}

/**
 * Dessine la pastille 2D d'une entité (disque sombre + pictogramme, badge si
 * plusieurs entités partagent la pastille). Retourne une data-URL.
 */
export function spriteEntite({ ic = '📌', couleur = '#8ea0b5', nombre = 0, taille = 96 } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = taille; c.height = taille;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const r = taille / 2;
  ctx.clearRect(0, 0, taille, taille);
  // ombre portée
  ctx.beginPath();
  ctx.arc(r, r + taille * 0.03, r * 0.74, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  // disque
  ctx.beginPath();
  ctx.arc(r, r, r - taille * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(9,14,20,0.9)';
  ctx.fill();
  ctx.lineWidth = taille * 0.07;
  ctx.strokeStyle = couleur;
  ctx.stroke();
  // pictogramme
  ctx.font = `${Math.round(taille * 0.44)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ic, r, r + taille * 0.02);
  // badge « ×N » (plusieurs entités de la même fonction côte à côte)
  if (nombre > 1) {
    const bx = taille * 0.78; const by = taille * 0.22; const br = taille * 0.19;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.strokeStyle = 'rgba(9,14,20,0.9)';
    ctx.lineWidth = taille * 0.035;
    ctx.stroke();
    ctx.fillStyle = '#071019';
    ctx.font = `bold ${Math.round(taille * 0.24)}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(nombre), bx, by + taille * 0.01);
  }
  return c.toDataURL();
}

/** Sources affichées dans le panneau (hyperliens cliquables). */
export function liensSources() {
  return [
    { nom: 'OpenStreetMap (Overpass API)', url: 'https://overpass-api.de/', detail: 'données des entités, licence ODbL' },
    { nom: 'Licence ODbL — OpenStreetMap', url: 'https://www.openstreetmap.org/copyright', detail: 'obligation de citer la source' },
    { nom: 'Inspecter une entité (OSM)', url: 'https://www.openstreetmap.org/', detail: 'fiche d’origine de chaque donnée' },
  ];
}

const CSS = `
#wt-entites {
  position: fixed; left: 12px; top: 96px; z-index: 964; width: 292px; display: none;
  font-family: var(--font-mono, monospace); color: #e8eaed; font-size: 10px;
  background: rgba(8,12,18,0.95); border: 1px solid rgba(0,212,255,0.45); border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0,0,0,0.55); overflow: hidden; max-height: 78vh;
}
#wt-entites .t { display: flex; align-items: center; gap: 6px; padding: 7px 10px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; font-weight: 700; color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-entites .t button { margin-left: auto; cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 12px; }
#wt-entites .c { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; overflow-y: auto; max-height: 62vh; }
#wt-entites .ligne { display: flex; gap: 5px; align-items: center; }
#wt-entites .b { cursor: pointer; padding: 7px 8px; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; border-radius: 8px; background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.5); color: #00d4ff; flex: 1; }
#wt-entites .b.actif { background: rgba(0,212,255,0.28); color: #fff; }
#wt-entites .fam { display: flex; flex-wrap: wrap; gap: 3px; }
#wt-entites .fam button {
  cursor: pointer; padding: 3px 6px; border-radius: 6px; font-family: inherit; font-size: 8.5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: rgba(232,234,237,0.75);
}
#wt-entites .fam button.actif { background: rgba(0,212,255,0.22); border-color: #00d4ff; color: #fff; }
#wt-entites .stats { color: rgba(232,234,237,0.55); line-height: 1.6; font-size: 8.5px; }
#wt-entites .stats a, #wt-entites .src a { color: #00d4ff; text-decoration: none; }
#wt-entites .stats a:hover, #wt-entites .src a:hover { text-decoration: underline; }
#wt-entites .liste { display: flex; flex-direction: column; gap: 3px; max-height: 24vh; overflow-y: auto; }
#wt-entites .ent { cursor: pointer; text-align: left; padding: 5px 7px; border-radius: 7px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: inherit; font-family: inherit; font-size: 9.5px; display: flex; gap: 6px; align-items: center; }
#wt-entites .ent:hover { border-color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-entites .ent .n { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-entites .src { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; color: rgba(232,234,237,0.5); font-size: 8px; line-height: 1.65; }
#wt-entites .slider { width: 100%; }

/* — SÉLECTEUR : plusieurs entités derrière une même pastille — */
#wt-ent-choix {
  position: fixed; z-index: 1580; width: 268px; display: none;
  font-family: var(--font-mono, monospace); color: #e8eaed; font-size: 10px;
  background: rgba(8,12,18,0.97); border: 1px solid #00d4ff; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6); overflow: hidden;
}
#wt-ent-choix .t { padding: 7px 10px; font-size: 8.5px; letter-spacing: 2px; font-weight: 700;
  color: #00d4ff; background: rgba(0,212,255,0.1); display: flex; gap: 6px; align-items: center; }
#wt-ent-choix .t button { margin-left: auto; cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 12px; }
#wt-ent-choix .l { padding: 6px; display: flex; flex-direction: column; gap: 3px; max-height: 44vh; overflow-y: auto; }
#wt-ent-choix .o { cursor: pointer; text-align: left; padding: 6px 7px; border-radius: 7px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: inherit; font-family: inherit; font-size: 9.5px; }
#wt-ent-choix .o:hover { border-color: #00d4ff; background: rgba(0,212,255,0.1); }
#wt-ent-choix .o b { color: #00d4ff; }
#wt-ent-choix .o .s { display: block; color: rgba(232,234,237,0.5); font-size: 8px; margin-top: 2px; }
`;

/**
 * @param {object} viewer
 * @param {{fiche?:Function, surMessage?:Function}} [options]
 */
export function initEntites(viewer, options = {}) {
  const { fiche = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const RAYON_REGROUPEMENT = 45; // m : voisinage « cadastre » considéré comme une même pastille

  const ds = new Cesium.CustomDataSource('wt-entites');
  viewer.dataSources.add(ds);

  let entites = [];        // entités brutes (OSM)
  let groupes = [];        // pastilles affichées
  let filtres = new Set(Object.keys(FAMILLES));
  let rayon = 800;
  let visible = false;
  let chargement = false;
  let majAuto = true;
  let minuteur = null;
  let derniereMaj = 0;

  // ——— panneau ———
  const el = document.createElement('div');
  el.id = 'wt-entites';
  el.innerHTML = `
    <div class="t"><span>🏷 ENTITÉS DE LA CARTE</span><button type="button" class="fermer">✕</button></div>
    <div class="c">
      <div class="ligne">
        <button class="b aff" type="button">👁 AFFICHER</button>
        <button class="b refresh" type="button">🔄 RAFRAÎCHIR</button>
      </div>
      <div class="ligne"><span style="opacity:.6">rayon</span>
        <input class="slider" type="range" min="200" max="2500" step="100" value="800" />
        <span class="r-val" style="width:52px;text-align:right;color:#00d4ff">800 m</span></div>
      <div class="fam"></div>
      <div class="stats">Couche inactive. « AFFICHER » interroge OpenStreetMap autour du point visé.</div>
      <div class="liste"></div>
      <div class="src"></div>
    </div>`;
  document.body.appendChild(el);
  rendreDeplacable(el, el.querySelector('.t'));

  const elStats = el.querySelector('.stats');
  const elListe = el.querySelector('.liste');
  const elSrc = el.querySelector('.src');
  const elFam = el.querySelector('.fam');
  const elR = el.querySelector('.r-val');
  const curseur = el.querySelector('.slider');
  const bAff = el.querySelector('.aff');

  // ——— sélecteur (pastille regroupée) ———
  const choix = document.createElement('div');
  choix.id = 'wt-ent-choix';
  choix.innerHTML = '<div class="t"><span></span><button type="button" class="fermer">✕</button></div><div class="l"></div>';
  document.body.appendChild(choix);
  const choixTitre = choix.querySelector('.t span');
  const choixListe = choix.querySelector('.l');
  choix.querySelector('.fermer').addEventListener('click', () => { choix.style.display = 'none'; });

  function rendreSources() {
    elSrc.innerHTML = `<b style="color:#00d4ff">SOURCES</b><br>` + liensSources()
      .map((s) => `• <a href="${s.url}" target="_blank" rel="noopener">${s.nom}</a> — ${s.detail}`)
      .join('<br>');
  }

  function rendreFamilles() {
    elFam.innerHTML = '';
    for (const [cle, f] of Object.entries(FAMILLES)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${f.nom}`;
      b.className = filtres.has(cle) ? 'actif' : '';
      b.style.borderColor = filtres.has(cle) ? f.couleur : '';
      b.addEventListener('click', () => {
        if (filtres.has(cle)) filtres.delete(cle); else filtres.add(cle);
        rendreFamilles();
        reconstruire();
      });
      elFam.appendChild(b);
    }
  }

  function rendreListe() {
    elListe.innerHTML = '';
    const top = [...groupes].sort((a, b) => b.nombre - a.nombre).slice(0, 40);
    for (const g of top) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ent';
      b.innerHTML = `<span>${g.ic}</span><span class="n">${g.nom}</span>${g.nombre > 1 ? `<span style="color:#00d4ff">×${g.nombre}</span>` : ''}`;
      b.addEventListener('click', () => {
        if (g.nombre > 1) ouvrirChoix(g);
        else fiche?.(g.lon, g.lat, g.membres[0]?.nom || g.nom);
      });
      elListe.appendChild(b);
    }
    if (!top.length) elListe.innerHTML = '<div style="opacity:.5;font-size:8.5px">Aucune entité (réseau ou zone sans donnée).</div>';
  }

  function ouvrirChoix(g) {
    choixTitre.textContent = `${g.ic} ${g.fonction} — ${g.nombre} ENTITÉS`;
    choixListe.innerHTML = '';
    for (const m of g.membres) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'o';
      const nom = m.nom || `${m.fonction} (sans nom)`;
      b.innerHTML = `<b>${g.ic} ${nom}</b>${m.adresse ? `<span class="s">📍 ${m.adresse}</span>` : ''}<span class="s">${m.source || ''} · ${m.osmId}</span>`;
      b.addEventListener('click', () => {
        choix.style.display = 'none';
        fiche?.(m.lon, m.lat, m.nom || nom);
      });
      choixListe.appendChild(b);
    }
    // lien « inspecter dans OSM »
    const a = document.createElement('a');
    a.className = 'o';
    a.href = `https://www.openstreetmap.org/#map=19/${g.lat.toFixed(5)}/${g.lon.toFixed(5)}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '🔎 Ouvrir la zone dans OpenStreetMap';
    a.style.display = 'block';
    a.style.textDecoration = 'none';
    choixListe.appendChild(a);

    choix.style.display = '';
    // placement près du clic
    const r = el.getBoundingClientRect();
    choix.style.left = `${Math.min(window.innerWidth - 280, r.right + 8)}px`;
    choix.style.top = `${Math.min(window.innerHeight - 260, r.top)}px`;
  }

  // ——— rendu 3D ———
  function altitudeIcone(lon, lat) {
    const h = viewer.scene.globe?.getHeight?.(Cesium.Cartographic.fromDegrees(lon, lat)) || 0;
    return h + 26; // au-dessus des toits : lisibilité « carte »
  }

  function reconstruire() {
    ds.entities.removeAll();
    const retenues = entites.filter((e) => filtres.has(e.cle));
    groupes = regrouper(retenues, RAYON_REGROUPEMENT);
    const ecarts = disperser(groupes);
    groupes.forEach((g, index) => {
      const image = spriteEntite({ ic: g.ic, couleur: g.couleur, nombre: g.nombre });
      if (!image) return;
      const { dx, dy } = ecarts[index] || { dx: 0, dy: 0 };
      ds.entities.add({
        id: `wt-ent-${g.id}`,
        position: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, altitudeIcone(g.lon, g.lat)),
        properties: {
          wtEntite: g.id, wtLon: g.lon, wtLat: g.lat, wtNom: g.nom,
          wtNombre: g.nombre, wtFonction: g.fonction,
        },
        billboard: {
          image,
          width: 34,
          height: 34,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(250, 1.05, 12000, 0.42),
          pixelOffset: new Cesium.Cartesian2(dx, dy),
        },
        label: {
          text: g.nom,
          font: '11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0a0a0f').withAlpha(0.78),
          pixelOffset: new Cesium.Cartesian2(dx, dy - 26),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1100),
          translucencyByDistance: new Cesium.NearFarScalar(300, 1, 1100, 0.25),
        },
      });
    });
    viewer.scene.requestRender?.();
    rendreListe();
    elStats.innerHTML = groupes.length
      ? `${groupes.length} pastille(s) · ${retenues.length} entité(s) OSM · rayon ${rayon} m<br>
         mise à jour ${derniereMaj ? new Date(derniereMaj).toLocaleTimeString('fr-FR') : '—'} ·
         <a href="https://overpass-api.de/" target="_blank" rel="noopener">source : OpenStreetMap (ODbL)</a>`
      : `Aucune entité dans un rayon de ${rayon} m.<br>
         <a href="https://overpass-api.de/" target="_blank" rel="noopener">source : OpenStreetMap (ODbL)</a>`;
  }

  async function charger() {
    if (chargement) return;
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    chargement = true;
    bAff.textContent = '⏳ PATIENTE…';
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(requeteOverpass(lat, lon, rayon))}`,
      });
      const d = await r.json();
      entites = entitesDepuisReponse(d);
      derniereMaj = Date.now();
      surMessage?.(`🏷 ${entites.length} entité(s) OpenStreetMap autour du point visé.`);
    } catch (err) {
      elStats.innerHTML = `⚠ Overpass indisponible (réseau saturé ou hors ligne).<br>
        <a href="https://overpass-api.de/" target="_blank" rel="noopener">réessayer depuis le site source</a>`;
      surMessage?.('🏷 Entités indisponibles (Overpass).');
    } finally {
      chargement = false;
      bAff.textContent = visible ? '👁 MASQUER' : '👁 AFFICHER';
    }
    reconstruire();
  }

  function basculer(etat) {
    const on = etat === undefined ? !visible : Boolean(etat);
    visible = on;
    bAff.textContent = on ? '👁 MASQUER' : '👁 AFFICHER';
    bAff.classList.toggle('actif', on);
    if (on) {
      el.style.display = '';
      charger();
      if (majAuto && minuteur == null) {
        minuteur = window.setInterval(() => {
          if (!visible) return;
          const h = viewer.camera.positionCartographic.height;
          if (h > 40000) return; // trop haut : pastilles inutiles
          charger();
        }, 45000);
      }
    } else {
      ds.entities.removeAll();
      groupes = [];
      if (minuteur != null) { window.clearInterval(minuteur); minuteur = null; }
    }
  }

  bAff.addEventListener('click', () => basculer());
  el.querySelector('.refresh').addEventListener('click', () => { if (visible) charger(); else basculer(true); });
  el.querySelector('.fermer').addEventListener('click', () => { el.style.display = 'none'; });
  curseur.addEventListener('input', () => {
    rayon = Number(curseur.value) || 800;
    elR.textContent = `${rayon} m`;
    if (visible) charger();
  });

  // ——— clic sur une pastille (handler dédié : un par module) ———
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((clic) => {
    if (!visible) return;
    if (window.__wtDessin || window.__wtPinArme) return;
    let picked = null;
    try { picked = viewer.scene.pick(clic.position); } catch { return; }
    const id = picked?.id?.properties?.wtEntite?.getValue?.() || picked?.id?.properties?.wtEntite;
    if (!id) return;
    const g = groupes.find((x) => x.id === id);
    if (!g) return;
    if (g.nombre > 1) ouvrirChoix(g);
    else fiche?.(g.lon, g.lat, g.membres[0]?.nom || g.nom);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  rendreFamilles();
  rendreSources();
  rendreListe();

  return {
    element: el,
    ouvrir: () => { el.style.display = ''; },
    basculer,
    rafraichir: charger,
    entites: () => entites.slice(),
    groupes: () => groupes.slice(),
    visible: () => visible,
    filtres: (liste) => { if (Array.isArray(liste)) { filtres = new Set(liste); rendreFamilles(); reconstruire(); } return [...filtres]; },
  };
}
