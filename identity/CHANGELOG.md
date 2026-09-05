# Changelog — fiche d'identité

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
