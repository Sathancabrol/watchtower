# identity/

Fiche d'identité de référence, destinée à être **chargée par les agents IA de Gobonet**
avant tout raisonnement ou génération concernant la personne.

| Fichier | Usage |
|---|---|
| `sathan-cabrol.identity.json` | Source de vérité machine. À parser par Gobonet. Spec `gobonet.identity/1.0`. |
| `sathan-cabrol.context.md` | Même contenu en texte, prêt à injecter dans un prompt système. |

Version narrative longue et déclinaisons par audience : `../docs/profil-sathan-cabrol.md`.

## Charger le contexte dans un agent

```python
import json, pathlib

ident = json.loads(pathlib.Path("identity/sathan-cabrol.identity.json").read_text("utf-8"))
system_prompt = pathlib.Path("identity/sathan-cabrol.context.md").read_text("utf-8")
```

Ou, pour un prompt système direct :

```
<identity_context>
{contenu de sathan-cabrol.context.md}
</identity_context>
```

## Sections structurantes du JSON

- `identite_synthetique` — titre canonique, phrase de 25 mots, trois piliers, thèse centrale.
- `disambiguation` — ce que le profil **n'est pas** + erreurs d'interprétation fréquentes.
- `audiences` — 6 déclinaisons avec accroche, mises en avant et **mises en retrait**.
- `regles_editoriales` — contraintes fortes, notamment sur le parcours personnel.
- `instructions_agent` — directives explicites (`toujours` / `jamais`).
- `lacunes_a_completer` — champs manquants à ne pas combler par déduction.

## Règle de synchronisation

Toute modification doit être portée dans **les deux** fichiers, puis `version` et
`updated` incrémentés dans le JSON.
