/**
 * WATCHTOWER — HUD en FRANÇAIS (version gratuite, best-effort).
 *
 * Traduction au vol des libellés anglais du HUD d'origine : un dictionnaire
 * des termes connus est appliqué aux nœuds texte de la page, au démarrage
 * puis périodiquement (les panneaux se créent dynamiquement). Rudimentaire
 * mais gratuit et sans toucher aux 9 000 lignes du code d'origine.
 */

const DICO = {
  'LOCATION': 'POSITION', 'DISPLAY': 'AFFICHAGE', 'DATA LAYERS': 'COUCHES DE DONNÉES',
  'MAP SOURCE': 'FOND DE CARTE', 'ACTIVE STYLE': 'STYLE ACTIF', 'PARAMETERS': 'PARAMÈTRES',
  'SEARCH NEARBY SITES': 'CHERCHER À PROXIMITÉ', 'AIRCRAFT': 'AVIONS', 'GROUND SPEED': 'VITESSE SOL',
  'NEWS': 'ACTUALITÉS', 'READY': 'PRÊT', 'START': 'DÉMARRER', 'PLAY': 'LECTURE',
  'NEXT': 'SUIVANT', 'PREV': 'PRÉCÉD.', 'RESET': 'RÉINITIALISER', 'IMPORT': 'IMPORTER',
  'EXPORT PRESETS': 'EXPORTER PRÉRÉGLAGES', 'LEVEL': 'NIVEAU', 'SCENES': 'SCÈNES',
  'SCENE SUMMARY': 'RÉSUMÉ DE SCÈNE', 'LIVE CONTACTS': 'CONTACTS EN DIRECT',
  'LOADING LIVE DATA': 'CHARGEMENT DES DONNÉES', 'EXPLORE MANUALLY': 'EXPLORER MANUELLEMENT',
  'POWER UP': 'ALLUMER', 'CAPTURE SHOT': "CAPTURE D'ÉCRAN", 'EXIT COCKPIT': 'QUITTER LE COCKPIT',
  'FIRST PERSON': 'VUE SUBJECTIVE', 'AVAILABLE MISSIONS': 'MISSIONS DISPONIBLES',
  'SPACE MISSIONS': 'MISSIONS SPATIALES', 'SELECT A MISSION TO INSPECT': 'CHOISIR UNE MISSION',
  'ADJUST': 'AJUSTER', 'ENABLE': 'ACTIVER', 'DETECT': 'DÉTECTER', 'CURRENT': 'ACTUEL',
  'NEAREST': 'LE PLUS PROCHE', 'CONTACT': 'CONTACT', 'ALTITUDE': 'ALTITUDE',
  'ESTIMATED FLIGHT PLAN': 'PLAN DE VOL ESTIMÉ', 'ROUTE DATA UNAVAILABLE': 'ITINÉRAIRE INDISPONIBLE',
  'NO STATION SELECTED': 'AUCUNE STATION CHOISIE', 'STATION SITE': 'SITE STATION',
  'RESOLVING REGION': 'ANALYSE DE LA RÉGION', 'ACQUIRING REGIONAL NEWS': 'RÉCUPÉRATION DES ACTUS',
  'SELECT CONTEXT': 'CHOISIR LE CONTEXTE', 'CONTEXT ONLY': 'CONTEXTE SEUL',
  'OBSERVED / MAPPED PINGS': 'PINGS OBSERVÉS / CARTOGRAPHIÉS', 'RUN LOG': 'JOURNAL',
  'DRAG TO TUNE': 'GLISSER POUR RÉGLER', 'SAVE KEYS': 'ENREGISTRER LES CLÉS',
  'SAVE CAL': 'SAUVER CAL', 'RESET CAL': 'RESET CAL', 'RADIO READY': 'RADIO PRÊTE',
  'NO PLACE LEFT BEHIND': 'AUCUN LIEU OUBLIÉ', 'ESC to close': 'ÉCHAP pour fermer',
  'ESC to dismiss': 'ÉCHAP pour fermer', 'Begin with a clean globe': 'Commencer avec un globe vierge',
  'Choose your first view': 'Choisis ta première vue', 'Power up the globe': 'Allumer le globe',
  'Clean UI': 'UI épurée', 'Density': 'Densité', 'Layout': 'Disposition', 'Style': 'Style',
  'Minimal': 'Minimal', 'Radio off': 'Radio coupée', 'Operator': 'Opérateur',
  'Models': 'Modèles', 'Proximity': 'Proximité', 'Outside': 'Extérieur', 'Fade': 'Fondu',
  'Feather': 'Adoucir', 'Snow': 'Neige', 'Allocation': 'Répartition',
};

export function initFrenchHud() {
  function traduire(racine) {
    const marche = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = marche.nextNode())) {
      const t = n.nodeValue?.trim();
      if (t && DICO[t]) n.nodeValue = n.nodeValue.replace(t, DICO[t]);
    }
  }
  // au démarrage puis périodiquement (les panneaux apparaissent dynamiquement)
  traduire(document.body);
  const timer = window.setInterval(() => traduire(document.body), 4000);
  return { stop: () => window.clearInterval(timer) };
}
