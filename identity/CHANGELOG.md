# Changelog — fiche d'identité

## v3.1.0 — 2026-09-05

Clarifications en conversation. **99 champs, 76 % connu, trust moyen 92 %.**
Les 4 lacunes critiques de la v3.0 sont résolues — et remplacées par 3 autres, plus profondes.

### Lacunes critiques résolues

| Question v3.0 | Réponse | Effet |
|---|---|---|
| CAO / Covadis / BIM ? | **Lecture et compréhension de plans, sans production** | Blocage BTP levé : suffisant pour aide conducteur et chef de chantier |
| Sur quoi reposent dev / 3D / IA ? | **3 ans de recherche personnelle**, autodidacte, sans livrable | Passe de `contradicted` à `declared·75` — pratique réelle, non objectivable |
| Situation depuis 2025 ? | **Demandeur d'emploi**, veille scientifique, recherche tous azimuts | Nouveau bloc `situation_actuelle` |
| Objectif 2026 ? | **Aucun objectif court terme.** Horizon : mégacorp, IA et robotique, « ordi and a dream » | Nouveau bloc `horizon_long_terme` |

### Nouvelles règles de discours

- **La vision long terme ne se dit jamais** à un recruteur, un client ou un acheteur public.
  C'est le moteur, pas un argument de vente.
- **Ne jamais revendiquer AutoCAD ou Covadis.** Lecture de plans uniquement.
- **Contrainte matérielle** à intégrer dans toute recommandation : pas de capital, pas d'équipe,
  un ordinateur.

### Requalification

Les 3 ans d'autodidaxie valent moins comme compétence technique que comme **preuve de
persistance** : apprentissage non encadré et non rémunéré, mené pendant une reconversion BTP puis
une période sans emploi. Cohérent avec la « curiosité intellectuelle » du CV 2021.

### Nouvelles lacunes critiques

1. **Premier livrable** — la plus petite chose finissable et montrable en deux semaines.
2. **Revenu** — de quoi vit-il, jusqu'à quand ? Détermine toute la stratégie.
3. **Contenu réel des 3 ans** — langages, logiciels, essais menés jusqu'au bout.

---

## v3.0.0 — 2026-09-05

Apport de deux CV (2025 généraliste, 2021 spécialisé recherche).
**Trust moyen 75 % → 92 %. Champs `cv` : 49 sur 85 (58 %).**

### Corrections critiques

| Champ | v2 | v3 | Gravité |
|---|---|---|---|
| `core.prenom` | Säthan | **Näthan** | **critique** — le champ le plus visible du dossier était faux, et la v2 contenait une règle « ne jamais écrire Nathan » à l'inverse de la réalité |
| `core.commune` | Bassin de Thau, commune inconnue | Frontignan 34110 | — |
| `formation.master` | Master Psychologie cognitive | Master Psychologie — Évaluation du fonctionnement cognitif et des comportements | l'intitulé exact est plus professionnalisant |
| `specialite` | cognition générique | **attention spatiale et temporelle, cognition spatiale, wayfinding** | majeure — spécialiste, pas généraliste |

### Découvertes non anticipées

- **Tobii / eye-tracking** — compétence rare, directement monnayable en UX research. Absente de la v2.
- **SST et AIPR encadrant** — habilitations réglementaires, différenciateur VRD concret.
- **SNCF Innovation & Recherche** — 160 participants, sujet wayfinding. Expérience la plus valorisable, réduite à deux lignes sur le CV 2025.
- **CATIE** — recherche livrée en réponse à appel d'offres, avec client. Preuve de prestation.
- **Représentant étudiant UFR5 (2017-2019)** — mandat électif, gouvernance et budget.
- **BTP dès 2016**, pendant les études : le terrain n'est pas une reconversion tardive.
- **Mémoire 2017-18** — conception d'un instrument de mesure, première trace de démarche de conception d'outil.

### Invalidations

`competences.techniques` v2 listait développement, cartographie, 3D, outils IA.
**Aucun des deux CV n'atteste d'un langage, d'un SIG, d'un CAO ou d'un outil IA.**
L'outillage réel est statistique et expérimental (R, JASP, OpenSesame, E-Prime, Tobii).
Ces compétences passent en `capacites.revendique_non_atteste`.

### Confirmations d'inférences v2

| Champ | Trust v2 | Trust v3 |
|---|---|---|
| Séquence du parcours | 65 % | 100 % — Bac 2013 → Master 2019 → AFPA 2023 |
| Outils probables (R, E-Prime, OpenSesame) | 55 % | 100 % — tous confirmés, plus JASP et Tobii |
| Capacité de reconversion | 80 % | 95 % — objectivée par les dates |
| Genre grammatical | 75 % | 100 % |

### Ajouts structurels

`missions_types` · `savoirs` (théoriques / techniques métier) · `problemes_types` (formulation
commerciale) · `capacites` (autonome / avec appui / revendiqué non attesté) · `chronologie`
(19 jalons) · `comparaison_cv` · nouvelles sources `cv` et `contradicted`.

### Nouvelle audience prioritaire

**UX research / ergonomie / facteur humain** devient l'audience n°1, devant le BTP.
Elle n'existait pas en v2. **Transport et mobilité** entre en n°3 : seul secteur où les deux
moitiés du parcours servent simultanément.

---

## v2.0.0 — 2026-09-05
Modèle de provenance `{src, trust, why}`. Enrichissement référentiel RNCP / Éducation nationale.
Rapport de couverture automatique. 105 champs, trust moyen 75 %.

## v1.0.0 — 2026-09-05
Fiche d'identité machine-readable initiale (JSON + contexte prompt). 23 champs.
