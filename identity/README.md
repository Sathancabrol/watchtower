# identity/

Fiche d'identité de référence, chargée par les agents IA de **Gobonet** avant tout
raisonnement, génération ou recommandation concernant la personne.

| Fichier | Usage |
|---|---|
| `nathan-cabrol.identity.json` | Source de vérité machine. Spec `gobonet.identity/2.0`. |
| `nathan-cabrol.context.md` | Même contenu en texte, prêt à injecter dans un prompt système. |
| `coverage.py` | Rapport de couverture et de confiance. `python3 identity/coverage.py` |

Version narrative et déclinaisons par audience : `../docs/profil-nathan-cabrol.md`.

## Modèle de provenance

Chaque fait porte un `_meta : {src, trust, why}`.

| `src` | Sens |
|---|---|
| `verified` | Confirmé par une source publique. |
| `declared` | Déclaré par la personne. Autoritatif, non vérifié. |
| `referential` | Dérivé d'un référentiel officiel (RNCP, Éducation nationale, Legifrance). |
| `inferred` | Déduit par raisonnement. Hypothèse, pas un fait. |
| `unknown` | Manquant. À demander, jamais à combler. |

Seuils d'exposition de `trust` : `≥80` affirmable · `60-79` à modaliser ·
`40-59` hypothèse seulement · `<40` ne pas exposer.

**Règle d'or** : préférer une lacune explicite à une inférence exposée.

## État — v2.0.0 (2026-09-05)

105 champs tracés.

| Source | n | % |
|---|---|---|
| verified | 6 | 5,7 % |
| declared | 34 | 32,4 % |
| referential | 20 | 19,0 % |
| inferred | 31 | 29,5 % |
| unknown | 14 | 13,3 % |

**Connu 57,1 % · inféré 29,5 % · manquant 13,3 % · trust moyen 75 %.**
70 champs exposables sans réserve, 21 à modaliser, 14 non exposables.

## Charger le contexte

```python
import json, pathlib
ident  = json.loads(pathlib.Path("identity/nathan-cabrol.identity.json").read_text("utf-8"))
prompt = pathlib.Path("identity/nathan-cabrol.context.md").read_text("utf-8")
```

Filtrer les faits selon le destinataire :

```python
def exposable(meta, seuil=70):
    return meta.get("trust", 0) >= seuil and meta.get("src") != "unknown"
```

## Synchronisation

Toute modification doit être portée dans **les deux** fichiers, puis `version` et `updated`
incrémentés dans le JSON, et `coverage.py` relancé pour mettre à jour le bloc `couverture`.
