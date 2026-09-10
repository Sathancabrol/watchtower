# 🧠 Charge mentale — état de l'art utile et ce qu'on en fait

Note de travail. Objectif : séparer ce qui est **solide et vérifié** de ce qui
est **douteux**, puis n'implémenter que ce qui a un sens pour watchtower.

⚠ **Le document source qui a lancé ce sujet contient des références
fabriquées.** Voir la section « Références à ne pas citer ». Tout ce qui suit
a été vérifié en ligne ou porte une mention explicite de doute.

---

## 1. Ce qui est solide

### Théorie de la charge cognitive (Sweller)

Trois charges qui s'additionnent contre une mémoire de travail limitée :

| Type | Définition | Levier pour nous |
|---|---|---|
| **Intrinsèque** | complexité propre à la tâche | faible : c'est le métier de l'utilisateur |
| **Extrinsèque** | effort imposé par la **présentation** | 🔥 **c'est là qu'on agit** |
| **Germane** | construction de schémas mentaux | à préserver, ne pas parasiter |

**La seule charge qu'une interface peut réduire est l'extrinsèque.** Tout le
reste de ce document en découle.

### NASA-TLX — vérifié

Six dimensions : demande mentale, demande physique, demande temporelle,
performance perçue, effort, frustration. Développé par **Hart & Staveland
(1988)**. Notation 0–100 par incréments de 5, puis pondération par **15
comparaisons par paires**.

Source vérifiée : [AHRQ Digital Healthcare Research](https://digital.ahrq.gov/health-it-tools-and-resources/evaluation-resources/workflow-assessment-health-it-toolkit/all-workflow-tools/nasa-task-load-index)
et le [catalogue logiciel NASA](https://software.nasa.gov/software/ARC-15150-1A).

⚠ Le dump source écrit « Stevland » : c'est **Staveland**. Détail, mais
révélateur du soin apporté au reste.

**Variante « Raw TLX » (RTLX)** : on saute les 15 comparaisons par paires et
on fait la moyenne simple des six notes. Bien moins pénible, et la littérature
la considère comme largement équivalente. **C'est celle à utiliser** si on en
arrive là.

### Outils open source réellement existants

Tous vérifiés :

| Outil | Ce qu'il fait | Licence / statut |
|---|---|---|
| [rPPG-Toolbox](https://github.com/ubicomplab/rPPG-Toolbox) | fréquence cardiaque par caméra ; GREEN, ICA, CHROM + modèles neuronaux | **NeurIPS 2023**, labo UW, sérieux |
| [DeepFace](https://github.com/serengil/deepface) | 7 émotions + âge/genre/origine | **MIT**, très utilisé |
| [marnixnaber/rPPG](https://github.com/marnixnaber/rPPG) | rPPG MATLAB adossé à un article évalué par les pairs | Springer 2019 |
| [heartbeat-js](https://github.com/prouast/heartbeat-js) | rPPG en JavaScript, navigateur | simple, ancien |

**EyeTrace** et **PulseRoute** existent bien, mais ⚠ **0 à 5 étoiles** sur
GitHub. Le dump les présentait comme « la » référence à adopter : ce sont des
projets personnels sans validation ni communauté. **Ne pas bâtir dessus.**

---

## 2. Le blocage juridique — décisif

**Le règlement européen sur l'IA interdit la reconnaissance émotionnelle sur
le lieu de travail et dans l'éducation.** Article 5(1)(f), applicable depuis
le **2 février 2025**.

- Sanction : jusqu'à **35 M€ ou 7 % du chiffre d'affaires mondial**.
- Motif (considérant 44) : **absence de base scientifique**, fiabilité
  limitée, mauvaise généralisation, risque de discrimination.
- Exceptions **étroites** : raisons **médicales** ou de **sécurité**.

Deux nuances qui comptent :

1. **La fatigue et la douleur ne sont pas des émotions** (considérant 18).
   Détecter la somnolence d'un conducteur pour l'alerter **n'est pas** de la
   reconnaissance émotionnelle. C'est explicitement cité comme licite.
2. **Observer n'est pas inférer.** Constater « la personne sourit » est hors
   champ ; conclure « la personne est heureuse » tombe sous l'interdiction.

Sources : [Future of Privacy Forum](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/),
[Inside Privacy — lignes directrices de la Commission](https://www.insideprivacy.com/artificial-intelligence/european-commission-guidelines-on-prohibited-ai-practices-under-the-eu-artificial-intelligence-act/).

### Conséquence pour nous

Le dump proposait DeepFace + webcam pour scorer l'état affectif d'ouvriers du
BTP. **En Europe, sur un lieu de travail, c'est la catégorie interdite, pas la
catégorie à risque.** Watchtower est un projet français, destiné à des amis
autour de Thau. **On n'implémente pas de reconnaissance émotionnelle.**

C'est aussi une bonne nouvelle : ça oriente vers ce qui marche mieux.

---

## 3. Ce qu'on fait dans watchtower

Aucune caméra, aucun capteur, aucune donnée biométrique. On agit sur la
**charge extrinsèque**, la seule que l'interface crée elle-même — et on la
mesure par des **indicateurs d'interface**, pas par le corps de l'utilisateur.

### 3.1 Réduire la charge extrinsèque — déjà engagé

L'audit UI en cours faisait déjà de la réduction de charge sans le nommer :

| Action | Principe CLT |
|---|---|
| Barre unique au lieu du rail à 2 niveaux | supprime la **recherche visuelle** |
| Pastilles éteintes par défaut | supprime le **bruit permanent** |
| Catégories nommées et encadrées | **regroupement** (chunking) |
| Boutons 28 px minimum | réduit le **coût moteur** (loi de Fitts) |
| État des bascules mémorisé (`wt-volant-bascules`) | supprime la **reconfiguration répétée** |

**Constat chiffré** : la barre expose **28 fonctions en 5 catégories**. La
mémoire de travail tient ~4 éléments simultanés. 5 groupes, c'est à la limite
haute — **acceptable parce que les groupes sont nommés et stables**, donc
parcourus, pas mémorisés. À ne pas dépasser.

### 3.2 Indicateurs d'interface — proposition, non implémenté

Mesurables **sans rien capter de l'utilisateur**, uniquement des traces
d'usage locales :

- **hésitation** : temps entre l'ouverture de la barre et le premier clic ;
- **errance** : nombre de panneaux ouverts puis refermés en moins de 3 s ;
- **retours** : réouvertures du même panneau dans la minute ;
- **abandons** : panneau ouvert puis fermé sans interaction.

Un seuil franchi ne « diagnostique » rien sur la personne : il **désigne un
écran à simplifier**. C'est un outil de conception, pas de surveillance.

Règles si on l'implémente :
1. **Local uniquement** (`localStorage`), jamais transmis.
2. **Désactivable** — cohérent avec « tout doit être togglable ».
3. **Jamais nominatif**, jamais de score « utilisateur ».
4. Affiché comme métrique **d'interface**, jamais de personne.

### 3.3 Auto-évaluation RTLX — optionnel

Si Näthan veut comparer deux versions d'un écran : six curseurs 0–100, moyenne
simple, stockage local. Volontaire, ponctuel, jamais imposé au démarrage.

---

## 4. Ce qu'on ne fait pas, et pourquoi

| Piste du dump | Décision | Motif |
|---|---|---|
| Reconnaissance émotionnelle (DeepFace) | ❌ **écarté** | interdit — art. 5(1)(f) |
| EEG / BCI passif | ❌ écarté | 300–1000 €, 20–40 min de calibration par personne, hors sujet |
| rPPG (FC par webcam) | ❌ écarté | donnée de santé (RGPD art. 9) pour un gain nul ici |
| Eye-tracking webcam | ❌ écarté | biométrie, précision surestimée, sensible aux lunettes et à la lumière |
| EyeTrace / PulseRoute | ❌ écarté | projets à 0–5 étoiles présentés comme des références |
| Réduction de charge extrinsèque | ✅ **en cours** | gratuit, sans donnée, effet réel |
| Indicateurs d'interface locaux | 🟡 proposé | mesure l'écran, pas la personne |
| RTLX volontaire | 🟡 proposé | validé, sans capteur |

---

## 5. Références à ne pas citer

Le dump source liste des dizaines d'URLs. Plusieurs signaux montrent qu'une
**partie est inventée** :

- des dizaines d'articles datés **2026** sur des sujets de niche, tous
  convergents — invraisemblable ;
- des **précisions de 99,4 %** pour classer la charge mentale par EEG ; ce
  domaine plafonne en réalité bien plus bas, surtout entre sujets ;
- des identifiants arXiv (`2602.23660`, `2603.17767`, `2601.05825`) au format
  **AAMM** correspondant à des mois futurs ;
- des liens **LinkedIn** et **Scribd** présentés comme sources scientifiques ;
- des chiffres invérifiables : « réduction de 24–40 points NASA-TLX ».

**Règle** : ne rien reprendre de cette liste sans l'avoir ouvert. Les seules
références de ce document sont celles vérifiées en section 1 et 2.

Le fond du dump n'est pas faux — CLT, NASA-TLX, les signatures EEG thêta/alpha
sont réels. **C'est l'appareil bibliographique qui est décoratif**, et les
chiffres de performance qui sont gonflés.

---

## 6. Si tu veux aller plus loin

Trois questions à trancher avant toute ligne de code :

1. **Pour qui ?** Si c'est watchtower (Näthan et ses amis), la section 3.1
   suffit et est déjà en route.
2. **Cognitorium, c'est du BTP salarié ?** Si oui, le lieu de travail est
   concerné : **la reconnaissance émotionnelle est fermée**, et il faut passer
   par la **sécurité** (fatigue, somnolence) qui est explicitement licite.
3. **Faut-il vraiment mesurer la personne ?** Dans la majorité des cas, mesurer
   l'**interface** répond à la même question, sans capteur, sans juridique,
   sans matériel.
