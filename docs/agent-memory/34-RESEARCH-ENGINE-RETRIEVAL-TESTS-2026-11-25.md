# Audit 34 — Retrieval : fallback et qualification des sources

Date : 2026-11-25. Statut TEST_LOCAL_SANDBOX, fixtures synthétiques, aucun réseau ni runtime tour.

Navigation : [[33-RESEARCH-ENGINE-ORCHESTRATION-CHECKPOINT-RETRIEVAL-2026-11-25]] · [[32-RESEARCH-ENGINE-VALIDATION-SUFFISANCE-2026-11-25]] · [[01-HUB-SUIVI-AGENTS]].

## Provenance
Sathancabrol/reaserch-engine → main → engine/retrieval.py → blob 82af2f4ee6b1aef5748745864debc52cfe483b44.
[Source](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/retrieval.py).
Fichier reproduit dans le sandbox, git hash-object retrieval.py identique au blob GitHub avant exécution. Commit de référence applicatif non relevé. Dernier commit documentaire retrouvé avant cette passe : 32c68bda60b3d11d8bd8a3ce7591334f26fe413c.

## Interfaces et dépendances
- SearchRequest(query, subquestion_id, source_types, max_results, recency_days) → Retriever.search → list[SearchResult].
- InMemoryRetriever : corpus injecté, classement lexical titre/snippet.
- LocalFirstRetriever : deux implémentations Retriever injectées, appel externe si liste locale vide.
- CrossrefRetriever : http_get injectable, urllib/json/re/dataclasses standard, endpoint Crossref works ; DOI obligatoire, type et dates issus des métadonnées.
- Aucun fournisseur réel sollicité.

## Reproduction exécutée
Commande : python avec import retrieval depuis le répertoire contenant le fichier authentifié. Code de sortie 0.
```python
from retrieval import *
q=SearchRequest('memory',source_types=['review'],recency_days=1)
d=SearchResult('1','memory',source_type='primary_study',metadata={'year':2000})
class Spy:
 def __init__(self,fail=False): self.calls=0; self.fail=fail
 def search(self,q):
  self.calls+=1
  if self.fail: raise TimeoutError('synthetic')
  return [d]
s=Spy(); assert LocalFirstRetriever(InMemoryRetriever(),s).search(q)==[d]; print('empty fallback',s.calls)
s=Spy(); assert LocalFirstRetriever(InMemoryRetriever([d]),s).search(q)==[d]; print('local hit ignores filters; external calls',s.calls)
s=Spy()
try: LocalFirstRetriever(Spy(True),s).search(q)
except TimeoutError: print('local timeout propagated; external calls',s.calls)
else: raise AssertionError
urls=[]
def get(url):
 urls.append(url); return {'message':{'items':[{'DOI':'10.0000/mock','title':['Systematic review'],'type':'journal-article','published-print':{'date-parts':[[2000]]}}]}}
r=CrossrefRetriever(http_get=get).search(q); print('crossref',urls,r[0].source_type); assert r[0].source_type=='primary_study' and 'filter=' not in urls[0]
```

| Scénario | Observé | Interprétation |
|---|---|---|
| Corpus vide | externe appelé 1 fois | fallback nominal fonctionnel |
| Corpus avec document incompatible | externe appelé 0 fois, document retourné | source_types et récence non appliqués |
| Timeout local | TimeoutError propagée, externe appelé 0 fois | fallback sur panne absent |
| Crossref fixture revue | URL query=memory&rows=10, type primary_study | filtres non transmis, type bibliographique insuffisant pour qualifier une étude primaire |

Les assertions caractérisent le comportement actuel ; elles ne constituent pas une recette de conformité. Le titre de la fixture n'est pas une preuve de classification scientifique d'un article réel.

## Décisions cibles (non implémentées)
- P1 : distinguer résultat vide, panne récupérable, erreur de configuration et annulation ; politique de fallback explicite, journal de provenance et budget.
- P1 : ne pas confondre journal-article et étude primaire ; conserver type brut, classification incertaine et preuve de qualification.
- P2 : définir sémantique de récence et source_types, filtrer avant classement et décider du comportement si dates inconnues.
- P1 : tester orchestrateur deux cycles et reprise checkpoint ; aucune intégration CRONOS/Hermes validée.

Aucun code applicatif modifié.
