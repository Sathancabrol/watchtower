# Audit 25 — Hermes / CRONOS : branche de secours et diagnostic

Date de collecte : 2026-11-24. Statut : CODE_OBSERVE / DOC_HISTORIQUE ; runtime Windows non testé.
Navigation : [[00-WATCHTOWER-COGNITORIUM-CARRE-DAS-MINDMAP]] · [[01-HUB-SUIVI-AGENTS]] · [[12-ARBORESCENCE-PROFONDE-MULTI-NIVEAUX]] · [[24-OLYMPUS-RELAIS-CAMERA-TESTS-2026-11-24]].

## Provenance et divergence
Dépôt Sathancabrol/monorepo, branche fix/hermes-autonomy-rescue-20261114, commit c1a164b16c12ed31ad3bd361e725b3b96dd85ad0, arbre 984058602f3932587a06980aa2078631aa0a63d9 (lecture récursive non tronquée).
Comparaison GitHub avec main a18938d4f309c3de753c3cbe587ad06a111ecbea : 8 commits devant, 0 derrière, cinq fichiers ops/hermes-continuity ajoutés. [Comparaison](https://github.com/Sathancabrol/monorepo/compare/main...fix/hermes-autonomy-rescue-20261114).
Les cinq fichiers ont été lus au commit fixé. SHA ci-dessous = blob, non commit.

| Fichier sous ops/hermes-continuity | Blob SHA | Nature |
|---|---|---|
| README.md | 7ce19d003773f9cca45a4eb6c7f25dba30ab8d06 | cible et exemple de fallback |
| STATE.md | 650f63642073a8b8ff777d0b2058901a94281a3e | diagnostic historique du 14/11 |
| DIAGNOSTIC_POWERSHELL.ps1 | 0d780a78cf8d8bc1d03fe398a7041d4e82f0143c | script de collecte |
| AGENTS.md | 9fe5800009cedf8a90c1ecbc34f36c202cf670dc | règles de travail |
| INVENTORY_MODELS.md | b9cb96df908b73072e8cf5cf4c121a48b04e3530 | inventaire historique |

[Sources immuables](https://github.com/Sathancabrol/monorepo/tree/c1a164b16c12ed31ad3bd361e725b3b96dd85ad0/ops/hermes-continuity).

## Arborescence fonctionnelle
- ops/hermes-continuity → DIAGNOSTIC_POWERSHELL.ps1 (47 lignes selon compare).
  - Record(Line:string) → ajoute à List[string] et affiche en console.
  - SafeCommand(Name:string, CommandArgs:string[]) → exécute une commande externe, agrège stdout/stderr, masque les lignes correspondant à une regex de secrets, journalise les exceptions par type.
  - Flux principal → vérifie présence de trois configurations (default, cronos, cronoslocal), lit leur texte entier et détecte seulement la présence de fallback_providers par regex.
  - Dépendances : Windows PowerShell, système de fichiers, Hermes CLI et Ollama CLI facultatifs.
  - Sortie : rapport texte UTF-8 horodaté sur le bureau ; aucune modification de configuration, mais écriture locale effective.
  - Commandes : version, profils, gateway, deux fallback check statiques, ollama list et ps.
- README → exemple YAML Gemini puis Ollama ; aucun contrôle live effectué par ce fichier.
- STATE → distingue gateway, profils, MCP et modèles ; observations historiques, non état actuel.
- INVENTORY → sept tags Ollama historiques, pas nécessairement sept poids distincts ; ASR et embeddings ne sont pas des LLM conversationnels.
- AGENTS → critères de reprise et preuve, pas moteur exécutable.

## Lacunes statiques et recette
| Priorité | Constat | Test proposé (non exécuté) |
|---|---|---|
| P1 | SafeCommand ne fixe aucun timeout explicite | commande factice bloquante, délai maximal et arrêt propre |
| P1 | Aucun contrôle explicite de LASTEXITCODE | commande factice retournant 1, statut erreur attendu |
| P1 | Masquage regex non exhaustif ; lecture complète du YAML malgré commentaire sur les clés | fixtures synthétiques sans vrais secrets, vérifier absence de fuite |
| P1 | Présence de fallback_providers ne prouve ni YAML valide ni liste non vide | fixtures vide, commentée, invalide, valide |
| P1 | Aucun appel live ni tool_calls dans le script | test primaire puis secours avec outil inoffensif et résultat vérifié |
| P2 | Chemin de configuration supposé, pas résolu par CLI | profil avec répertoire personnalisé |
| P2 | Aucun test automatisé dédié dans les cinq fichiers | tests Pester avec commandes simulées |

## Convergence cible (non implémentée par ce lot)
CRONOS → classification → choix agent/modèle → Hermes → outil → résultat vérifié. Le dossier de secours ne contient pas le routeur CRONOS ni un adaptateur Olympus. Ne pas confondre fallback fournisseur, profil, canal et délégation. Exiger un contrat de capacité distinguant configuré, joignable, inférence réussie, appel outil réussi, quota et date de vérification. Les crons et sous-agents nécessitent des tests séparés. Aucun modèle cloud déclaré disponible actuellement sur la seule base de cet inventaire.

## Décision
Préserver cette branche et ses preuves ; ne pas fusionner automatiquement. Prochain lot : localiser le code réel du routeur CRONOS et les adaptateurs Hermes/Olympus ; vérifier la documentation d'intégration Research Engine repérée dans l'arbre. Aucun test PowerShell ni runtime exécuté.
