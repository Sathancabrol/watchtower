# 36 — Checkpoints : six scénarios exécutés
Date : 2026-11-25. Statut TEST_LOCAL_SANDBOX, composant isolé ; runtime intégré et tour non testés.
Navigation : [[01-HUB-SUIVI-AGENTS]] · [[35-RESEARCH-ENGINE-CHECKPOINT-CONTRAT-2026-11-25]] · [[33-RESEARCH-ENGINE-ORCHESTRATION-CHECKPOINT-RETRIEVAL-2026-11-25]].

## Provenance et méthode
Source : Sathancabrol/reaserch-engine, main, [engine/persistence.py](https://github.com/Sathancabrol/reaserch-engine/blob/main/engine/persistence.py), blob 9484f2bc01b0c21a842d4cbcf8d42aee0e2cad29. Copie locale vérifiée par git hash-object : égalité exacte. Six documents centraux Watchtower et annexe 35 récupérés ; dernier commit observé 018d0508feb615c63088cbeaec3dd7bade07592a.
JsonRunStore.save/load exécutés en Python, fichiers temporaires réels, données synthétiques. Dépendances internes remplacées par doubles : ResearchRun=SimpleNamespace, ResearchState=Enum CREATED, EvidenceGraph=classe vide. Pas de réseau. Le test du marqueur ne valide donc pas la classe EvidenceGraph réelle.

## Résultats observés
| Cas | Résultat |
|---|---|
| run_id ../bad | ValueError, révision 2 au lieu de 1, ancien fichier intact, 0 temporaire |
| context object() | TypeError, révision 2, ancien fichier intact, 1 temporaire résiduel |
| Path.replace injecté OSError | OSError, révision 2, ancien fichier intact, 1 temporaire résiduel |
| Deux lecteurs de révision 1, écritures successives | Les deux atteignent 2 ; seul {b:1} subsiste, perte silencieuse de {a:1} |
| Marqueur __type__ EvidenceGraph sans snapshot | Sauvegarde remplace ancien fichier ; load échoue avec AttributeError du double dépourvu de from_snapshot ; exception réelle à vérifier |
| Tuple (1,2) | Restauré en list |

## Reproduction
```python
import sys, types, tempfile
from enum import Enum
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace as Run
class State(Enum): CREATED='created'
for name, attrs in [('evidence_graph',{'EvidenceGraph':type('EvidenceGraph',(),{})}),('state_machine',{'ResearchState':State}),('orchestrator',{'ResearchRun':Run})]:
    m=types.ModuleType('engine.'+name); m.__dict__.update(attrs); sys.modules[m.__name__]=m
from engine.persistence import JsonRunStore
for case in range(6):
    with tempfile.TemporaryDirectory() as d:
        s=JsonRunStore(d)
        r=Run(run_id='r',question='q',state=State.CREATED,iteration=0,revision=0,context={},history=[])
        p=s.save(r); old=p.read_bytes()
        try:
            if case==0: r.run_id='../bad'; s.save(r)
            if case==1: r.context={'x':object()}; s.save(r)
            if case==2:
                with patch.object(Path,'replace',side_effect=OSError('fixture')): s.save(r)
            if case==3:
                a,b=s.load('r'),s.load('r'); a.context={'a':1}; b.context={'b':1}; s.save(a); s.save(b); print(a.revision,b.revision,s.load('r').context)
            if case==4: r.context={'__type__':'EvidenceGraph'}; s.save(r); s.load('r')
            if case==5: r.context={'x':(1,2)}; s.save(r); print(type(s.load('r').context['x']).__name__)
        except Exception as e:
            print(case,type(e).__name__,r.revision,p.read_bytes()==old,len(list(Path(d).iterdir()))-1)
```

## Décision
P1 : contrôle CAS sous verrou, validation avant mutation de revision, nettoyage des temporaires. P2 : schéma de sérialisation et marqueur réservé. Les écritures obsolètes successives sont reproduites, pas une course simultanée interprocessus. Prochain lot : dépendances réelles, reprise orchestrateur et deux cycles. Aucun code applicatif modifié.
