# WATCHTOWER — Audit Oracle Axis et plan de récupération modulaire
Date : 2026-11-13 · Statut : recherche et proposition, aucune fonctionnalité nouvelle installée.

## 0. Périmètre, preuves et limites

Cible étudiée : https://oracleaxis.com/dashboard ; documentation : https://oracleaxis.com/getting-started ; offres : https://oracleaxis.com/plans .
Le dashboard public a été inspecté en navigateur le 13 novembre 2026. Certaines pages renvoient des erreurs selon le mode d'accès ; de nombreuses lentilles sont verrouillées selon le forfait. L'existence d'un bouton ne démontre ni l'implémentation complète ni la qualité de son résultat.

- OBSERVÉ SUR ORACLE AXIS : espaces Command, Monitor, Investigate, Analyze, Forecast, Plan, Mobility, Resilience ; domaines Conflict, Cyber, Infrastructure, Environmental, Economic, Supply Chain, Health, Political, Information, Energy ; score global/régional, une priorité du jour, niveaux de risque et de confiance, une liste de développements, sélection géographique, assistant et visite guidée ; sources publiquement nommées FAA, EMSC, NWS, plus sources web.
- DOCUMENTATION OFFICIELLE : pipeline « signals arrive → incidents form → risk prioritized → map presents it → act/share » ; regroupement claims/counterclaims/réponses officielles/effets ultérieurs ; impact et confiance DISTINCTS ; sous-systèmes consommateurs d'une image commune des incidents ; absence d'alerte personnelle activée du seul fait de choisir une zone.
- OFFRES PUBLIÉES : Scout gratuit pour Monitor avec connexion, Operator 9 USD/mois après essai 7 jours pour Investigate/Analyze/alerts/briefings, Analyst 29 USD/mois après essai pour Forecast/Plan/Mobility/Resilience ; Command futur non achetable au moment du relevé. Ces tarifs sont à revérifier.
- TECHNIQUE : un globe « Loading Google Earth… » et des fonds cartographiques Google/Carto/Esri ont été observés ou détectés publiquement ; un hébergement Vercel et des DNS Cloudflare sont signalés par des sources de domaine. Ce sont des indices, PAS une preuve du framework UI, du stockage, des modèles IA, du score ou des pipelines internes. Aucun code source officiel ni documentation publique d'API de données Oracle Axis n'ont été confirmés. Ne PAS affirmer qu'il s'agit d'un produit Oracle Corporation.

Distinguer dans tout développement : 1. mesure native confirmée ; 2. article/affirmation rapportée ; 3. association algorithmique ; 4. hypothèse ; 5. scénario prospectif.

## 1. Notre socle actuel (lecture de Sathancabrol/watchtower sur main, 2026-11-13)

- Front : Vite/JavaScript, CesiumJS, rendu cartographique tridimensionnel, gestion de calques, minicarte, cockpit, historique, dossier, INSPECTION/INTEL.
- UI existante : src/vuesIntel.js, src/intelTwin.js, src/posteCommandement.js, src/filInfo.js, src/dossier.js, src/ficheLieu.js, src/urgence.js, src/urgenceMode.js.
- Données / analyse : src/data/analystEngine.js (requêtes sur couches déjà en mémoire, PAS ingestion externe) ; src/data/regionalBrief.js (GDELT actualités, géocodage, météo) ; src/data/contextStore.js (sélection entité) ; src/tracabilite.js (sources et journal consultatif local).
- Passerelle actuelle : vite.config.js comporte des proxies pour OpenSky, CelesTrak, Overpass, GBFS, CCTV, adsb.lol, AISStream, terrain, TomTom, FIRMS, contexte OSM, brief régional, météo, missions spatiales, radio.
- Conserver : règle de sources traçables, zones/couches à activation, repli hors ligne, confidentialité, gratuité par défaut, journal avant nouveau calque, filtres LOD/performance, interdiction de pister des personnes physiques.
- Manques à vérifier/combler : modèle canonique d'incident multi-sources, ingestion planifiée persistante, stockage temporel des révisions, fusion explicite des affirmations et contradictions, cotations impact/confiance distinctes, règles d'alertes à retour sur état, graphes causaux explicitement typés, analyse de conséquences et simulations. « Non vu dans l'arbre de modules consulté » ne veut pas dire absent dans toute branche ou tout environnement.

## 2. Catalogue de 32 capacités à construire ou adapter

| # | Capacité | Statut relatif au socle main | Priorité | Réutilisation envisagée |
|---|---|---|---|---|
| 01 | Event / Incident canonical model | nouveau | P0 | Schéma local, pas d'Oracle code |
| 02 | Evidence ledger / preuves et URLs primaires | étendre traçabilité | P0 | tracabilite.js |
| 03 | Registry des sources + licence + auth + fraîcheur | étendre registre existant | P0 | SOURCES_ET_OUTILS + générateur de référence |
| 04 | Normalisation temps (survenu/publié/observé/collecté) | nouveau | P0 | filtres pure JS |
| 05 | Qualité géographique (point/zone/ville/aucune) | nouveau | P0 | Cesium + GeoJSON |
| 06 | Déduplication par identifiant source natif | nouveau | P0 | canonical event ID, pas de fusion texte naïve |
| 07 | Regroupement multi-source et indépendance | nouveau | P0 | pistes dédup/corrélation, contrôle manuel |
| 08 | Claims, counterclaims, statut de corroboration | nouveau | P0 | graphe relationnel |
| 09 | Impact et confiance séparés + inconnus | nouveau | P0 | cartes et table |
| 10 | Fiche incident à 3 onglets (situation/sources/détails) | adapter dossier existant | P0 | dossier.js, ficheLieu.js |
| 11 | Watch areas persistantes / périmètres | étendre lieux/pins | P1 | géofences locales |
| 12 | Monitor « what changed » | étendre historique | P1 | diff snapshots |
| 13 | Snapshot historique et relecture | partiel (historique) | P1 | IndexedDB/SQLite selon hôte |
| 14 | Ingestion périodique hors front | nouveau | P1 | worker Node ou Hermes cron |
| 15 | Refresh TTL + dédup requêtes + stale fallback | partiel via proxies | P1 | code MIT OSIRIS sourceCache.ts à adapter |
| 16 | État source FRESH/STALE/UNAVAILABLE | partiel | P1 | gestionnaire de couches |
| 17 | Alertes géographiques basées sur seuil + hystérésis | nouveau | P1 | Hermes cron + notifications opt-in |
| 18 | Triage (critique confirmé / impact incertain / escalade) | nouveau | P1 | règles transparentes, non-IA |
| 19 | Recherche événements/acteurs/actifs/lieux | partiel (lieux) | P1 | index local |
| 20 | Chronologie des preuves et révisions | étendre historique | P1 | UI INTEL |
| 21 | Graphe incidents-entités-sources | nouveau | P2 | OSIRIS MIT graph, D3/vis-network |
| 22 | Relations « observée/mentionnée/hypothèse » | nouveau | P2 | arêtes typées |
| 23 | Contradictions et angles de couverture | nouveau | P2 | OSIRIS MIT alert-digest, contrôle |
| 24 | Vue Analyze corrélations interdomaines | nouveau | P2 | analystEngine + graphe |
| 25 | Dépendances d'infrastructures / propagation | nouveau | P2 | OSM/OpenInfraMap |
| 26 | Exposition population/actifs par zone | nouveau | P2 | WorldPop seulement après contrôle licence |
| 27 | SITREP/briefing source-cité « Why/Do now » | partiel (regionalBrief) | P2 | Ollama/Hermes local, gabarit vérifiable |
| 28 | Forecast scénarios / hypothèses falsifiables | nouveau | P3 | OSIRIS MIT forecast comme étude |
| 29 | Plan mesures, priorité, échéance, propriétaire | nouveau | P3 | tâche locale, sans action autonome dangereuse |
| 30 | Mobility : itinéraire + incidents intersectés | partiel (trajets) | P3 | OSRM, événements bornés et datés |
| 31 | Resilience : dépendances, alternatives, temps de reprise | nouveau | P3 | graphes + inventaire local |
| 32 | MCP read-only Watchtower pour Hermes | nouveau | P2 | OSIRIS MIT src/app/api/mcp, adapter à Vite/Node |

Note : les huit espaces sont des LENTILLES sur le même modèle canonique, pas huit bases de données indépendantes. « Risk score » doit afficher sa formule, version, données manquantes et calibration ; jamais assimiler score, confiance et probabilité réelle.

## 3. Sources à reprendre : inventaire / conditions d'accès

Sources identifiées chez Oracle Axis dans la vue publique : FAA (alertes aériennes), EMSC (séismes), NWS (alertes météo) et des références web non documentées. Les sources suivantes sont des PROPOSITIONS pour WATCHTOWER, PAS des fournisseurs attribués à Oracle Axis.

| Domaine | Source | Mode / statut WATCHTOWER main | Précondition |
|---|---|---|---|
| Presse mondiale | GDELT DOC 2.0 | déjà présente via regionalBrief | bruit média != incident confirmé |
| Événements géolocalisés | GDELT 2.0 Events + Mentions | nouveau | utiliser ActionGeo, vérifier géocodage |
| Séismes | USGS GeoJSON | déjà présent | compléter EMSC pour double piste |
| Séismes Europe | EMSC | nouveau | conditions API et citation à vérifier |
| Alertes États-Unis | NWS CAP / JSON-LD | nouveau | API officielle, cadence raisonnable (>=30s) |
| Aviation | FAA ATCSCC | nouveau | document d'avis source, UTC, état |
| Catastrophes | GDACS API/GeoJSON/RSS | nouveau | signal d'alerte gradué, crédit |
| Humanitaire | ReliefWeb v2 | nouveau | « appname » approuvé obligatoire |
| Feux / catastrophes | NASA FIRMS / EONET | déjà présent | FIRMS peut requérir clé gratuite |
| Crues France | Vigicrues API v1.1 | nouveau | tronçons, stations, timestamps |
| Risques industriels FR | Géorisques | déjà présent | séparer stock inventaire et incident |
| Cyber FR | CERT-FR OpenAPI JSON/RSS | nouveau | GET sans auth pour avis/alertes |
| Cyber international | CISA KEV, NVD | nouveau | version CVE, sévérité != exploit local |
| Infrastructure internet | RIPEstat / IODA | nouveau | disponibilité et conditions à vérifier |
| Transports | OpenSky / adsb.lol / AISStream | déjà présent | limites, licence, précision |
| Météo | Open-Meteo | déjà présent | prévision distincte d'observation |
| Energie | EIA / ENTSO-E / RTE | nouveau | clé ou enregistrement selon source |
| Économie et entreprises FR | INSEE / recherche-entreprises / BODACC | déjà partiel | révisions/publications distinctes |
| Immobilier local | DVF+ Cerema | nouveau | données transactions, pas annonces en temps réel |
| Marchés publics | BOAMP / TED | nouveau | provenance, attributs, dates |
| Géographie | OSM / BAN / cadastre / Panoramax | déjà présent | licences et attribution |
| Conflits | UCDP GED / ACLED | nouveau | version, géocodage, accès/usage ACLED à vérifier |
| Santé / crises | OMS, ECDC, Santé publique France | nouveau | agrégation, pas de données médicales individuelles |
| Cartographie | CesiumJS + fonds ouverts | déjà présent | ne pas substituer un autre globe sans justification |

Références principales :
- Oracle Axis : https://oracleaxis.com/getting-started ; https://oracleaxis.com/plans
- NWS : https://www.weather.gov/documentation/services-web-alerts
- CERT-FR : https://cert.cyber.gouv.fr/openapi ; https://cert.cyber.gouv.fr/flux-rss/
- GDACS : https://www.gdacs.org/feed_reference.aspx
- Vigicrues : https://www.vigicrues.gouv.fr/services/v1.1
- GDELT : https://gdeltproject.org/data.html
- ReliefWeb : https://apidoc.reliefweb.int/
- DVF+ : https://www.data.gouv.fr/datasets/dvf-open-data
- FAA : https://www.fly.faa.gov/
- USGS : https://earthquake.usgs.gov/fdsnws/event/1/

## 4. Dépôts de récupération et barrières de licences

- https://github.com/simplifaisoul/osiris — licence MIT CONFIRMÉE dans LICENSE. Revoir spécifiquement src/lib/sourceCache.ts (TTL/in-flight/stale), src/lib/alert-digest.ts (clustering = regroupement, NON vérification), src/lib/gdeltEvents.ts (export GDELT géolocalisé), src/lib/oi/graph.ts (graphe), src/lib/oi/forecast.ts (format estimation) et src/app/api/mcp/route.ts (transport MCP). Il fonctionne avec Next.js/TS/MapLibre : recodage JS Cesium et tests nécessaires. Préserver attribution MIT. src/lib/country-risk.ts reconnaît explicitement un classement éditorial non calibré : NE PAS adopter les nombres comme faits.
- https://github.com/koala73/worldmonitor — AGPL-3.0 ; conception inspirante (multi-domaines, veille de convergence, IA locale, caches, alertes et atlas). Ne pas copier directement dans le fork MIT avant audit juridique AGPL et des conditions complémentaires.
- https://github.com/JRE-Lab/OSIRIS — pas de licence détectée à l'audit : inspiration uniquement, code non réutilisable par défaut.
- https://github.com/bilawalsidhu/gods-eye-view — base amont déjà utilisée ; éviter refonte redondante.
- https://www.watchtower.technology/ — produit homonyme TIERS, NON le dépôt personnel Sathancabrol/watchtower. Ne pas mélanger leurs inventaires ni leurs prétendues fonctionnalités.

## 5. Architecture cible sans casser la tour

  Collecteurs publics (Node/Hermes cron, horaires par quota)
    -> adaptateurs et validation source, licence, date, lat/lon
    -> journal append-only des observations (recorder-4d)
    -> stock local brut et cache avec dernière valeur saine
    -> rapprochement des événements (claims + incidents, SANS confirmer seul)
    -> moteur règles vérifiables (risque, niveau impact, confiance, fraîcheur)
    -> projection : carte Cesium, liste, timeline, dossiers, graphe
    -> lentilles Command/Monitor/Investigate/Analyze/Forecast/Plan/Mobility/Resilience
    -> MCP local read-only + outils Hermes optionnels

Conserver Cesium comme moteur principal ; MapLibre 2D seulement si son utilité/performance est démontrée. Pour le stockage, commencer par IndexedDB browser pour le prototype utilisateur + JSONL/SQLite du collecteur Node (pas Redis/Postgres imposés sur PC personnel). Pour la persistance multi-device, une API locale authentifiée reste un jalon distinct.

## 6. Schéma canonique minimal (proposition)

    Incident {
      id, kind, title, summary,
      status: reported|corroborated|confirmed|disputed|resolved|unknown,
      impact: {level, basis, methodologyVersion},
      confidence: {level, basis, assessor, assessedAt},
      location: {geojson, precision, locationBasis} | null,
      time: {occurredAt, reportedAt, collectedAt, updatedAt},
      claims: [{id, text, attribution, stance, sourceIds}],
      evidence: [{sourceId, sourceRecordId, url, publishedAt, collectedAt, kind}],
      links: [{fromId, toId, relation, basis, evidenceIds}],
      sourceCoverage: {observed, stale, missing},
      snapshots: [snapshotId]
    }

Invariants :
- Une même nouvelle retransmise par cinq sites ne compte PAS comme cinq sources indépendantes.
- Une mention de pays dans un article n'est pas une coordonnée d'incident.
- Une « source officielle » ne garantit pas toutes les affirmations citées dans un article.
- Une association temporelle/spatiale n'est PAS un lien causal.
- Les scénarios et données éditoriales sont distincts des observations, sans transformer une prédiction en événement.
- « Aucune alerte » n'est pas synonyme de « aucune menace » ; afficher lacunes et vétusté.
- Les recommandations en contexte de crise renvoient prioritairement vers les autorités compétentes.
- RGPD et données DVF : aucun recoupement pour réidentifier des habitants ; éviter toute fonction de pistage d'individu.
- Affichage alerte : ne jamais cacher le niveau de confiance et la date de mise à jour.

## 7. Découpage en lots vérifiables

**L0, architecture de vérité (P0).** Écrire Incident/Evidence/Source, normalisation, registre, sorties GeoJSON ; brancher sources déjà présentes GDELT/USGS/FIRMS sans écraser anciennes couches. Tests : pas de point sans coordonnées fiables, pas d'incident sans source, stockage des quatre horloges, id stable, qualification des inconnues, source citée cliquable.

**L1, surveillance utile (P1).** Adapter librement l'idée du cache MIT OSIRIS ; ajouter GDACS, NWS, CERT-FR, Vigicrues, FAA en adaptateurs isolés ; consigner chaque résultat dans recorder-4d avant affichage. Tests : gestion 429/timeout/JSON invalide, source stale annoncée, pas de doublons, pas de requête de masse sans quota.

**L2, incidents (P1/P2).** Regroupement multi-source, preuves et contre-indications, suivi des révisions, triage incertain/confirmé, zone surveillée et notifications opt-in. Tests : GDELT n'est jamais autoconfirmé ; source unique identifiée ; deux rapports indépendants explicitement reconnus ou laissés inconnus ; alerte rétractée si événement corrigé.

**L3, investigations (P2).** Graphe de relation typé, dossiers sourcés, recherche plein texte, rejouabilité de la timeline et briefing local Ollama/Hermes. Tests : chaque arête a justification, les citations mènent aux preuves, modèle local indisponible => résumé non-IA.

**L4, résilience (P3).** Prévisions présentées comme scénarios, itinéraires impactés, dépendances techniques et réactions possibles. Tests : incertitude mesurable, référentiel temporel, scénario jamais présenté comme fait, fonds cartographique jamais bloqué par le moteur d'analyse.

Ne pas afficher des scores agrégés numériques avant d'avoir une méthode publiée, un jeu de calibration et les taux de données absentes. Les prévisions doivent distinguer incertitude épistémique et fréquence statistique ; privilégier des scénarios qualitatifs avant les probabilités.

## 8. Limites et prochaine exécution

Ce document ne crée pas les intégrations. Aucun compte Oracle Axis ni plan payant n'a été exploité ; pas d'API propriétaire copiée. L'architecture interne Oracle reste non vérifiée ; les nouveaux endpoints/protocoles/licences doivent passer par audit/reference/generate-reference.py puis être régénérés selon AGENTS.md, avec doctor.py avant/après installation. Ne pas modifier AGENTS.md ou REFERENCE.md à la main.

Décision recommandée : commencer par L0 puis L1 et L2 avant le « joli dashboard ». On obtient ainsi une Watchtower plus robuste qu'une simple juxtaposition de signaux, sans pénaliser l'ordinateur local et sans coût obligatoire.
