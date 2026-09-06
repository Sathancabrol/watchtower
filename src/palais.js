/**
 * WATCHTOWER — PALAIS MENTAL (chambre de motel, années 70).
 *
 * Nouveau MODE D'AFFICHAGE : à la place de la carte, on entre dans une pièce
 * — un mobile-home fixe, papier peint jauni, lit défait, bureau encombré.
 * C'est l'équivalent « physique » de l'application : chaque outil devient un
 * objet posé dans la pièce, chaque dossier devient une carte épinglée au mur.
 * (Hommage assumé à la salle des scénaristes d'Alan Wake 2 — sans en copier
 * un seul pixel : tout est dessiné en CSS/SVG, aucune image, aucun modèle 3D.)
 *
 *  · le MUR : une fenêtre aux rideaux tirés (dehors, un néon d'hôtel clignote
 *    à peine), une porte fermée, et le GRAND TABLEAU interactif ;
 *  · le TABLEAU : les dossiers (chantier, commune, sources…) sous forme de
 *    cartes analogiques — photo aérienne, mugshot, polaroïd, plan, planche
 *    contact — qu'on OUvre pour descendre jusqu'au plus petit élément, avec
 *    une recherche qui affine en direct ;
 *  · le BUREAU : les outils de l'app incarnés — carte papier épinglée (vue
 *    principale), drone bas de gamme (pilotage), téléphone satellite (chat +
 *    IA locale), calendrier relié (planning/budget), radio, moniteur
 *    (caméras), lampe (ambiance), chemise cartonnée (dossiers) ;
 *  · la PIÈCE vit : lumière chaude de la lampe, halo, grain argentique,
 *    vignette, néon qui grésille.
 *
 * Rien n'est chargé depuis le réseau : tout est généré (voir
 * `data/vignettes.js` et `data/dossiers.js`, tous deux purs et testés).
 */

import { aplatir, compter, filtrer, mur, noeud } from './data/dossiers.js';
import { svgEnUrl, vignette } from './data/vignettes.js';

const CSS = `
#wt-palais {
  position: fixed; inset: 0; z-index: 9950; display: none; overflow: hidden;
  background: #07090c; color: #e8eaed;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  user-select: none;
}
#wt-palais.ouvert { display: block; animation: wt-palais-entree .7s ease both; }
@keyframes wt-palais-entree { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }

#wt-palais .scene { position: absolute; inset: 0; perspective: 900px; }

/* ── le mur du fond ─────────────────────────────────────────────────────── */
#wt-palais .mur {
  position: absolute; left: 0; right: 0; top: 0; height: 74%;
  background:
    repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 2px, transparent 2px 46px),
    linear-gradient(180deg, #4a3b28 0%, #3a2e20 55%, #241c14 100%);
  box-shadow: inset 0 -80px 120px rgba(0,0,0,.6);
}
#wt-palais .mur::after { /* papier peint décollé */
  content: ''; position: absolute; right: 6%; top: 18%; width: 22%; height: 40%;
  background: linear-gradient(120deg, rgba(0,0,0,.25), transparent 60%);
  transform: rotate(-2deg); border-radius: 6px;
}

/* ── fenêtre : rideaux tirés, néon dehors ───────────────────────────────── */
#wt-palais .fenetre {
  position: absolute; left: 5%; top: 16%; width: 250px; height: 190px;
  background: radial-gradient(circle at 50% 60%, rgba(120,60,160,.35), rgba(10,12,20,.95) 70%);
  border: 6px solid #2a2018; border-radius: 3px; overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0,0,0,.9), 0 0 30px rgba(120,40,160,.25);
}
#wt-palais .neon {
  position: absolute; left: 14%; top: 26%; font-size: 22px; font-weight: 800; letter-spacing: 4px;
  color: #ff5fa2; text-shadow: 0 0 8px #ff2f8a, 0 0 24px #ff2f8a, 0 0 60px rgba(255,47,138,.6);
  animation: wt-neon 3.4s steps(1) infinite; opacity: .85;
}
#wt-palais .neon small { display: block; font-size: 9px; letter-spacing: 3px; color: #7ef0c0;
  text-shadow: 0 0 8px #35e0a0; margin-top: 4px; }
@keyframes wt-neon {
  0%, 42%, 44%, 60%, 62%, 100% { opacity: .82; }
  43%, 61% { opacity: .18; }
}
#wt-palais .rideau {
  position: absolute; top: -4%; bottom: -4%; width: 52%;
  background: linear-gradient(90deg, #6b2130, #4a1622 60%, #33101a);
  box-shadow: 0 0 24px rgba(0,0,0,.7);
}
#wt-palais .rideau.g { left: -2%; border-radius: 0 40% 40% 0 / 0 20% 20% 0; }
#wt-palais .rideau.d { right: -2%; background: linear-gradient(270deg, #6b2130, #4a1622 60%, #33101a); border-radius: 40% 0 0 40% / 20% 0 0 20%; }
#wt-palais .pluie {
  position: absolute; inset: 0; opacity: .35;
  background: repeating-linear-gradient(102deg, rgba(180,210,255,.16) 0 1px, transparent 1px 9px);
  animation: wt-pluie 1.1s linear infinite;
}
@keyframes wt-pluie { from { background-position: 0 0; } to { background-position: -14px 60px; } }

/* ── porte fermée ───────────────────────────────────────────────────────── */
#wt-palais .porte {
  position: absolute; right: 6%; bottom: 0; width: 130px; height: 74%;
  background: linear-gradient(180deg, #3b2a1c, #241a12);
  border: 4px solid #1b120c; border-radius: 4px 4px 0 0; cursor: pointer;
  box-shadow: inset 0 0 30px rgba(0,0,0,.6);
}
#wt-palais .porte::before {
  content: ''; position: absolute; left: 12%; top: 12%; width: 76%; height: 34%;
  border: 3px solid rgba(0,0,0,.35); border-radius: 3px;
}
#wt-palais .porte::after {
  content: ''; position: absolute; right: 10%; top: 54%; width: 10px; height: 10px;
  border-radius: 50%; background: #c8a24a; box-shadow: 0 0 8px rgba(200,162,74,.6);
}
#wt-palais .jour {
  position: absolute; right: 6%; bottom: 0; width: 130px; height: 6px;
  background: linear-gradient(90deg, rgba(255,225,170,.7), rgba(255,225,170,.15));
  filter: blur(2px);
}

/* ── le tableau (mur interactif) ────────────────────────────────────────── */
#wt-palais .tableau {
  position: absolute; left: 30%; top: 12%; width: 44%; height: 62%;
  background: linear-gradient(180deg, #20242a, #14181d);
  border: 3px solid #0c0e11; border-radius: 6px;
  box-shadow: 0 18px 50px rgba(0,0,0,.75), inset 0 0 60px rgba(0,0,0,.6);
  display: flex; flex-direction: column; overflow: hidden;
}
#wt-palais .tableau .t {
  display: flex; gap: 6px; align-items: center; padding: 6px 8px;
  font-size: 9px; letter-spacing: 2px; color: #00d4ff; background: rgba(0,212,255,.07);
  border-bottom: 1px solid rgba(0,212,255,.25);
}
#wt-palais .tableau .t .fil-ariane { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .8; }
#wt-palais .tableau .t input {
  width: 150px; padding: 4px 7px; font-family: inherit; font-size: 9.5px;
  background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.15);
  border-radius: 6px; color: inherit; outline: none;
}
#wt-palais .tableau .t input:focus { border-color: #00d4ff; }
#wt-palais .tableau .t button {
  cursor: pointer; font-family: inherit; font-size: 9px; padding: 4px 7px; border-radius: 6px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.16); color: inherit;
}
#wt-palais .tableau .t button:hover { border-color: #00d4ff; color: #00d4ff; }
#wt-palais .tableau .t button:disabled { opacity: .35; cursor: default; }
#wt-palais .cartes {
  flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-wrap: wrap;
  gap: 10px; align-content: flex-start;
}
#wt-palais .carte {
  position: relative; width: 118px; padding: 5px 5px 8px; border-radius: 3px; cursor: pointer;
  background: linear-gradient(180deg, #efe9dc, #ded6c4);
  color: #23201c; box-shadow: 0 6px 14px rgba(0,0,0,.6);
  transform: rotate(var(--rot, 0deg));
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
}
#wt-palais .carte:hover { transform: rotate(0deg) scale(1.06) translateY(-3px); z-index: 3;
  box-shadow: 0 14px 26px rgba(0,0,0,.75); filter: brightness(1.06); }
#wt-palais .carte.selectionnee { outline: 2px solid #ff5fa2; outline-offset: 2px; }
#wt-palais .carte img { width: 100%; height: 88px; object-fit: cover; display: block;
  background: #101418; border-radius: 2px; }
#wt-palais .carte .leg {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 3px 4px; text-align: center;
  font-size: 8.5px; letter-spacing: .4px; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; background: rgba(255,255,255,.72); border-radius: 0 0 3px 3px;
}
#wt-palais .carte .puce {
  position: absolute; left: 50%; top: -7px; width: 12px; height: 12px; margin-left: -6px;
  border-radius: 50%; background: #d23b3b; box-shadow: 0 2px 5px rgba(0,0,0,.6), inset 0 -2px 3px rgba(0,0,0,.35);
  z-index: 2;
}
#wt-palais .carte .sous {
  position: absolute; right: 3px; top: 3px; font-size: 7.5px; padding: 1px 4px; border-radius: 999px;
  background: rgba(0,0,0,.55); color: #fff;
}
#wt-palais .carte .chemin { font-size: 7px; opacity: .55; padding: 3px 2px 0; height: 12px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* mini-animations : chaque type de carte « vit » un peu */
#wt-palais .carte[data-type="video"] img { animation: wt-film 1.1s steps(4) infinite; }
@keyframes wt-film { 0% { object-position: 0 0; } 100% { object-position: 0 -96px; } }
#wt-palais .carte[data-type="aerien"] img { animation: wt-kenburns 9s ease-in-out infinite alternate; }
@keyframes wt-kenburns { from { transform: scale(1); } to { transform: scale(1.14); } }
#wt-palais .carte[data-type="plan"]::after {
  content: ''; position: absolute; left: 5px; right: 5px; top: 5px; height: 88px;
  background: linear-gradient(180deg, transparent, rgba(0,212,255,.25), transparent);
  animation: wt-scan 3.2s linear infinite; pointer-events: none;
}
@keyframes wt-scan { from { transform: translateY(-88px); } to { transform: translateY(88px); } }
#wt-palais .carte[data-type="mugshot"] img { filter: contrast(1.15) grayscale(.35); }
#wt-palais .vide { opacity: .5; font-size: 10px; padding: 12px; line-height: 1.7; }

/* ── sol ────────────────────────────────────────────────────────────────── */
#wt-palais .sol {
  position: absolute; left: 0; right: 0; bottom: 0; height: 30%;
  background:
    repeating-linear-gradient(90deg, rgba(0,0,0,.25) 0 2px, transparent 2px 64px),
    linear-gradient(180deg, #3a2a1b 0%, #241a11 60%, #16100a 100%);
  transform: rotateX(58deg); transform-origin: top center;
  box-shadow: inset 0 60px 80px rgba(0,0,0,.7);
}

/* ── lit ────────────────────────────────────────────────────────────────── */
#wt-palais .lit {
  position: absolute; left: 2%; bottom: 4%; width: 300px; height: 190px;
}
#wt-palais .lit .matelas {
  position: absolute; left: 0; right: 0; bottom: 0; height: 92px; border-radius: 10px;
  background: linear-gradient(180deg, #6d5b4a, #4a3c30);
  box-shadow: 0 12px 30px rgba(0,0,0,.7), inset 0 6px 12px rgba(255,255,255,.06);
}
#wt-palais .lit .drap {
  position: absolute; left: -6px; right: 40px; bottom: 62px; height: 44px; border-radius: 8px;
  background: linear-gradient(180deg, #cfc6b4, #a99f8c);
  box-shadow: 0 4px 10px rgba(0,0,0,.5); transform: rotate(-1deg);
}
#wt-palais .lit .oreiller {
  position: absolute; left: 2px; top: 6px; width: 96px; height: 46px; border-radius: 14px;
  background: linear-gradient(180deg, #e6ded0, #bdb3a1); transform: rotate(-3deg);
  box-shadow: 0 4px 10px rgba(0,0,0,.45);
}
#wt-palais .lit .tete {
  position: absolute; left: -14px; bottom: 0; width: 18px; height: 150px; border-radius: 6px;
  background: linear-gradient(180deg, #4a3623, #2b1e13);
}

/* ── bureau et ses objets ───────────────────────────────────────────────── */
#wt-palais .bureau {
  position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
  width: 62%; height: 210px;
}
#wt-palais .bureau .plateau {
  position: absolute; left: 0; right: 0; bottom: 66px; height: 26px; border-radius: 4px;
  background: linear-gradient(180deg, #6b4b2c, #4a3320);
  box-shadow: 0 18px 40px rgba(0,0,0,.75), inset 0 2px 0 rgba(255,255,255,.08);
}
#wt-palais .bureau .pieds { position: absolute; bottom: 0; left: 6%; right: 6%; height: 70px;
  background: linear-gradient(180deg, #3a2818, #241810); }
#wt-palais .bureau .tiroir {
  position: absolute; right: 8%; bottom: 26px; width: 150px; height: 44px; border-radius: 3px;
  background: linear-gradient(180deg, #54391f, #3a2615); border: 2px solid #2a1c10;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 8px; letter-spacing: 1px; color: rgba(255,255,255,.5);
}
#wt-palais .obj {
  position: absolute; bottom: 92px; cursor: pointer; text-align: center;
  transition: transform .18s ease, filter .18s ease;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,.6));
}
#wt-palais .obj:hover { transform: translateY(-6px) scale(1.05); filter: drop-shadow(0 0 14px rgba(255,220,150,.55)); z-index: 5; }
#wt-palais .obj svg { display: block; }
#wt-palais .obj .bulle {
  position: absolute; left: 50%; bottom: 100%; transform: translateX(-50%);
  white-space: nowrap; padding: 3px 7px; border-radius: 6px; font-size: 8.5px;
  background: rgba(6,10,14,.94); border: 1px solid rgba(0,212,255,.4); color: #cfe9f5;
  opacity: 0; transition: opacity .15s; pointer-events: none;
}
#wt-palais .obj:hover .bulle { opacity: 1; }

/* ── chaise ─────────────────────────────────────────────────────────────── */
#wt-palais .chaise {
  position: absolute; right: 22%; bottom: 2%; width: 96px; height: 150px; opacity: .95;
}
#wt-palais .chaise .dossier {
  position: absolute; left: 8px; top: 0; width: 80px; height: 78px; border-radius: 8px 8px 3px 3px;
  background: linear-gradient(180deg, #5a3f26, #3a2817); box-shadow: inset 0 2px 0 rgba(255,255,255,.07);
}
#wt-palais .chaise .assise {
  position: absolute; left: 0; top: 78px; width: 96px; height: 16px; border-radius: 4px;
  background: linear-gradient(180deg, #6b4b2c, #402c19);
}
#wt-palais .chaise .pied { position: absolute; top: 94px; width: 8px; height: 56px; background: #2a1c10; }
#wt-palais .chaise .pied.g { left: 10px; }
#wt-palais .chaise .pied.d { right: 10px; }

/* ── lumière : plafonnier éteint + halo de la lampe ─────────────────────── */
#wt-palais .plafonnier { position: absolute; left: 50%; top: 0; transform: translateX(-50%); }
#wt-palais .plafonnier .fil { width: 2px; height: 34px; background: #1a1a1a; margin: 0 auto; }
#wt-palais .plafonnier .ampoule {
  width: 26px; height: 26px; border-radius: 50%; margin: 0 auto;
  background: radial-gradient(circle at 40% 35%, #4a4636, #232019);
  box-shadow: 0 0 0 2px #17150f;
}
#wt-palais.allume .plafonnier .ampoule {
  background: radial-gradient(circle at 40% 35%, #fff6d8, #d8b45a);
  box-shadow: 0 0 30px 12px rgba(255,220,150,.35);
}
#wt-palais .halo {
  position: absolute; left: 50%; bottom: 60px; width: 620px; height: 420px; transform: translateX(-50%);
  background: radial-gradient(ellipse at 50% 40%, rgba(255,206,130,.20), rgba(255,206,130,.06) 45%, transparent 70%);
  pointer-events: none; animation: wt-halo 5.5s ease-in-out infinite;
}
@keyframes wt-halo { 0%, 100% { opacity: .9; } 50% { opacity: 1; } }
#wt-palais .grain {
  position: absolute; inset: 0; pointer-events: none; opacity: .06; mix-blend-mode: overlay;
  background-image: radial-gradient(rgba(255,255,255,.7) .5px, transparent .6px);
  background-size: 3px 3px; animation: wt-grain .6s steps(2) infinite;
}
@keyframes wt-grain { from { background-position: 0 0; } to { background-position: 3px 3px; } }
#wt-palais .vignette {
  position: absolute; inset: 0; pointer-events: none;
  box-shadow: inset 0 0 220px 60px rgba(0,0,0,.85);
}

/* ── bandeau (toujours visible, il dit comment sortir) ──────────────────── */
/* fenêtre ouverte depuis un OBJET du bureau (le téléphone = le chat…) */
/* 🪟 Rideaux : fermés par défaut, ils s'ouvrent quand on clique la fenêtre */
#wt-palais .rideau { transition: transform 900ms cubic-bezier(.4,0,.2,1), opacity 900ms ease; }
body.wt-rideaux-ouverts #wt-palais .rideau-g { transform: translateX(-17px); opacity: .55; }
body.wt-rideaux-ouverts #wt-palais .rideau-d { transform: translateX(17px); opacity: .55; }
body.wt-rideaux-ouverts #wt-palais { box-shadow: inset 0 -40px 90px rgba(120,160,255,0.10); }
#wt-palais .objet-fenetre {
  position: absolute; z-index: 8; width: 340px; max-height: 62vh; display: flex; flex-direction: column;
  background: rgba(8,12,18,.96); border: 1px solid rgba(0,212,255,.5); border-radius: 12px;
  box-shadow: 0 18px 50px rgba(0,0,0,.8); overflow: hidden;
}
#wt-palais .objet-fenetre .of-t {
  display: flex; gap: 6px; align-items: center; padding: 6px 9px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; font-weight: 700; color: #00d4ff; background: rgba(0,212,255,.08);
}
#wt-palais .objet-fenetre .of-t button { margin-left: auto; background: none; border: none; color: inherit; font-size: 12px; cursor: pointer; }
#wt-palais .objet-fenetre .of-c { flex: 1; overflow: auto; }
#wt-palais .objet-fenetre .of-c > * { height: 100%; }

#wt-palais .barre {
  position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%);
  display: flex; gap: 8px; align-items: center; padding: 6px 10px; border-radius: 999px;
  background: rgba(6,10,14,.8); border: 1px solid rgba(255,255,255,.12);
  font-size: 9px; letter-spacing: 1.5px; z-index: 9;
}
#wt-palais .barre button {
  cursor: pointer; font-family: inherit; font-size: 9px; letter-spacing: 1px; padding: 5px 10px;
  border-radius: 999px; background: rgba(0,212,255,.12); border: 1px solid rgba(0,212,255,.45); color: #00d4ff;
}
#wt-palais .barre button:hover { background: rgba(0,212,255,.25); }
#wt-palais .barre .t { opacity: .6; }
`;

/** Objets posés sur le bureau (outils de l'app incarnés). */
export const OBJETS = Object.freeze([
  { id: 'carte', nom: 'Carte papier épinglée', aide: 'la vue principale, en version papier', gauche: '4%', taille: 96 },
  { id: 'drone', nom: 'Drone bas de gamme', aide: 'mode pilotage / parcours de vol', gauche: '22%', taille: 84 },
  { id: 'telephone', nom: 'Téléphone satellite', aide: 'le chat (+ IA locale)', gauche: '38%', taille: 70 },
  { id: 'calendrier', nom: 'Calendrier relié', aide: 'planning, phasage et budget', gauche: '50%', taille: 78 },
  { id: 'radio', nom: 'Radio de chantier', aide: 'radios du monde entier', gauche: '63%', taille: 74 },
  { id: 'moniteur', nom: 'Moniteur de surveillance', aide: 'caméras et flux en direct', gauche: '76%', taille: 90 },
  { id: 'chemise', nom: 'Chemise cartonnée', aide: 'les dossiers sources du chantier', gauche: '89%', taille: 76 },
  { id: 'tableau', nom: 'Tableau de liège', aide: 'le dossier d’investigation : étapes et notes', gauche: '13%', taille: 92 },
  { id: 'tele', nom: 'Télé cathodique', aide: 'visualiser le dossier en cours', gauche: '58%', taille: 86 },
  { id: 'fenetre', nom: 'Fenêtre (rideaux)', aide: 'ouvrir les rideaux → vue stellaire', gauche: '31%', taille: 88 },
]);

/** Silhouettes SVG des objets (dessinées à la main, aucun asset). */
function svgObjet(id, taille = 84) {
  const T = taille;
  const commun = `width="${T}" height="${T}" viewBox="0 0 100 100"`;
  const formes = {
    carte: `<g><rect x="6" y="18" width="88" height="62" rx="3" fill="#d9cfae"/><rect x="6" y="18" width="88" height="62" rx="3" fill="none" stroke="#8a7c58"/>
      <path d="M10 44 C26 34, 40 52, 56 42 S80 30, 90 40" stroke="#7f8f6a" stroke-width="2.5" fill="none"/>
      <path d="M14 60 L34 66 L44 52 L64 70 L88 56" stroke="#a08a5e" stroke-width="1.6" fill="none"/>
      <circle cx="40" cy="34" r="4" fill="#d23b3b"/><circle cx="62" cy="58" r="4" fill="#2f6fd0"/>
      <path d="M38 36 L34 48" stroke="#5a4a2a" stroke-width="1.2"/><path d="M60 60 L58 48" stroke="#5a4a2a" stroke-width="1.2"/></g>`,
    drone: `<g><rect x="34" y="40" width="32" height="20" rx="6" fill="#3d4750"/><rect x="38" y="44" width="24" height="8" rx="3" fill="#68757f"/>
      <line x1="38" y1="42" x2="20" y2="30" stroke="#2c343b" stroke-width="4"/><line x1="62" y1="42" x2="80" y2="30" stroke="#2c343b" stroke-width="4"/>
      <line x1="38" y1="58" x2="20" y2="72" stroke="#2c343b" stroke-width="4"/><line x1="62" y1="58" x2="80" y2="72" stroke="#2c343b" stroke-width="4"/>
      <ellipse cx="18" cy="28" rx="14" ry="4" fill="#8d9aa5" opacity=".75"/><ellipse cx="82" cy="28" rx="14" ry="4" fill="#8d9aa5" opacity=".75"/>
      <ellipse cx="18" cy="74" rx="14" ry="4" fill="#8d9aa5" opacity=".75"/><ellipse cx="82" cy="74" rx="14" ry="4" fill="#8d9aa5" opacity=".75"/>
      <circle cx="50" cy="60" r="5" fill="#0f1418" stroke="#ff6b6b" stroke-width="2"/></g>`,
    telephone: `<g><rect x="30" y="20" width="40" height="64" rx="8" fill="#22282e" stroke="#3f4a55"/>
      <rect x="35" y="27" width="30" height="18" rx="3" fill="#7fd4ff" opacity=".85"/>
      <circle cx="50" cy="56" r="3" fill="#8e9aa5"/><circle cx="42" cy="66" r="3" fill="#8e9aa5"/>
      <circle cx="50" cy="66" r="3" fill="#8e9aa5"/><circle cx="58" cy="66" r="3" fill="#8e9aa5"/>
      <circle cx="42" cy="56" r="3" fill="#8e9aa5"/><circle cx="58" cy="56" r="3" fill="#8e9aa5"/>
      <circle cx="50" cy="76" r="3" fill="#8e9aa5"/><line x1="50" y1="6" x2="50" y2="20" stroke="#3f4a55" stroke-width="3"/>
      <circle cx="50" cy="6" r="3" fill="#ff6b6b"/></g>`,
    calendrier: `<g><rect x="20" y="18" width="60" height="66" rx="4" fill="#7a4a3a" stroke="#4a2c22" stroke-width="2"/>
      <rect x="26" y="18" width="48" height="14" fill="#e8e0cf"/>
      <g fill="#c9bfa8"><rect x="28" y="40" width="10" height="8"/><rect x="42" y="40" width="10" height="8"/>
      <rect x="56" y="40" width="10" height="8"/><rect x="28" y="54" width="10" height="8"/>
      <rect x="42" y="54" width="10" height="8" fill="#ff9a6b"/><rect x="56" y="54" width="10" height="8"/>
      <rect x="28" y="68" width="10" height="8"/><rect x="42" y="68" width="10" height="8"/></g>
      <path d="M32 18 v-8 M68 18 v-8" stroke="#4a2c22" stroke-width="2"/></g>`,
    radio: `<g><rect x="12" y="34" width="76" height="44" rx="6" fill="#4a4a44" stroke="#2c2c28" stroke-width="2"/>
      <circle cx="34" cy="58" r="15" fill="#1c1c18"/><circle cx="34" cy="58" r="6" fill="#6d6d63"/>
      <rect x="58" y="42" width="24" height="12" rx="2" fill="#9fd8ff" opacity=".5"/>
      <rect x="58" y="58" width="24" height="4" rx="2" fill="#2c2c28"/><rect x="58" y="66" width="24" height="4" rx="2" fill="#2c2c28"/>
      <line x1="26" y1="34" x2="52" y2="14" stroke="#6d6d63" stroke-width="2"/><circle cx="52" cy="12" r="3" fill="#6d6d63"/></g>`,
    moniteur: `<g><rect x="12" y="26" width="76" height="54" rx="8" fill="#2a2f35" stroke="#454d56" stroke-width="2"/>
      <rect x="20" y="34" width="60" height="38" rx="4" fill="#0f1a20"/>
      <path d="M24 62 L38 50 L48 58 L58 44 L74 62" stroke="#7ef0c0" stroke-width="2" fill="none" opacity=".8"/>
      <circle cx="66" cy="42" r="3" fill="#ff6b6b"/><rect x="38" y="82" width="24" height="6" fill="#3a4048"/>
      <rect x="30" y="88" width="40" height="5" rx="2" fill="#2a2f35"/></g>`,
    tableau: `<g><rect x="8" y="14" width="84" height="58" rx="3" fill="#6b5638" stroke="#3f3220" stroke-width="2"/>
      <rect x="13" y="19" width="74" height="48" rx="2" fill="#cbb489"/>
      <rect x="24" y="26" width="34" height="18" fill="#f2ecd8" stroke="#9a8a6a" stroke-width="1"/>
      <rect x="62" y="30" width="22" height="14" fill="#e8dfc4" stroke="#9a8a6a" stroke-width="1"/>
      <rect x="20" y="50" width="26" height="12" fill="#f6f1e0" stroke="#9a8a6a" stroke-width="1"/>
      <circle cx="40" cy="35" r="2" fill="#d23b3b"/><circle cx="73" cy="37" r="2" fill="#2f6fd0"/>
      <path d="M28 26 L28 20" stroke="#8a7c58" stroke-width="1.5"/><path d="M70 30 L70 24" stroke="#8a7c58" stroke-width="1.5"/></g>`,
    tele: `<g><rect x="14" y="24" width="72" height="52" rx="10" fill="#4a4038" stroke="#2c2620" stroke-width="2"/>
      <rect x="21" y="31" width="58" height="38" rx="12" fill="#12202a"/>
      <path d="M26 58 Q40 40 52 54 T74 46" stroke="#7ef0c0" stroke-width="1.8" fill="none" opacity=".7"/>
      <circle cx="66" cy="38" r="2.5" fill="#ffd166"/><rect x="30" y="78" width="40" height="5" rx="2" fill="#3a332c"/>
      <line x1="30" y1="24" x2="52" y2="10" stroke="#6d6d63" stroke-width="2"/><circle cx="52" cy="8" r="2.5" fill="#6d6d63"/></g>`,
    fenetre: `<g><rect x="12" y="14" width="76" height="60" rx="3" fill="#0b1420" stroke="#5a4a3a" stroke-width="3"/>
      <rect x="16" y="18" width="68" height="52" fill="#101c2c"/>
      <circle cx="30" cy="30" r="1.8" fill="#cfe6ff"/><circle cx="52" cy="26" r="1.4" fill="#cfe6ff"/>
      <circle cx="70" cy="38" r="1.6" fill="#cfe6ff"/><circle cx="42" cy="46" r="1.2" fill="#cfe6ff"/>
      <path d="M50 14 v60 M12 44 h76" stroke="#5a4a3a" stroke-width="2.5"/>
      <rect class="rideau rideau-g" x="6" y="10" width="20" height="66" rx="3" fill="#7a3f52" opacity=".92"/>
      <rect class="rideau rideau-d" x="74" y="10" width="20" height="66" rx="3" fill="#7a3f52" opacity=".92"/></g>`,
    chemise: `<g><path d="M16 30 h26 l6 8 h36 v46 H16 Z" fill="#c8a24a" stroke="#8a6f2e" stroke-width="2"/>
      <path d="M16 46 h68" stroke="#8a6f2e" stroke-width="1.5" opacity=".6"/>
      <rect x="30" y="54" width="40" height="4" fill="#8a6f2e" opacity=".5"/>
      <rect x="30" y="62" width="30" height="4" fill="#8a6f2e" opacity=".5"/></g>`,
  };
  return `<svg ${commun} aria-hidden="true">${formes[id] || formes.chemise}</svg>`;
}

/**
 * Ouvre le palais mental.
 * @param {object} [options]
 * @param {(id:string)=>void} [options.surObjet] clic sur un objet du bureau
 * @param {(noeud:object)=>void} [options.surCarte] clic sur une carte-feuille
 * @param {()=>void} [options.surSortie] clic sur la porte / bouton sortir
 * @param {Function} [options.surMessage] toast
 * @param {Array} [options.dossiers] dossiers à épingler au mur
 * @returns {object} API du palais
 */
export function initPalais(options = {}) {
  const { surObjet = null, surCarte = null, surSortie = null, surMessage = null } = options || {};

  let style = document.getElementById('wt-palais-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-palais-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const el = document.createElement('div');
  el.id = 'wt-palais';
  el.setAttribute('data-veille-exclu', '');
  el.innerHTML = `
    <div class="scene">
      <div class="mur">
        <div class="fenetre">
          <div class="neon">MOTEL<small>CHAMBRE 7 · LIBRE</small></div>
          <div class="pluie"></div>
          <div class="rideau g"></div>
          <div class="rideau d"></div>
        </div>
        <div class="porte" title="Sortir du palais (retour à la carte)"></div>
        <div class="jour"></div>
        <div class="tableau">
          <div class="t">
            <span>🗂</span>
            <span class="fil-ariane">TABLEAU</span>
            <input class="cherche" type="text" placeholder="🔍 affiner…" spellcheck="false" />
            <button class="retour" type="button" disabled>↑ REMONTER</button>
          </div>
          <div class="cartes"></div>
        </div>
      </div>
      <div class="sol"></div>
      <div class="lit"><div class="tete"></div><div class="matelas"></div><div class="drap"></div><div class="oreiller"></div></div>
      <div class="chaise"><div class="dossier"></div><div class="assise"></div><div class="pied g"></div><div class="pied d"></div></div>
      <div class="bureau">
        <div class="pieds"></div>
        <div class="tiroir">🗄 DOSSIERS SOURCES</div>
        <div class="plateau"></div>
      </div>
      <div class="plafonnier"><div class="fil"></div><div class="ampoule"></div></div>
      <div class="halo"></div>
      <div class="grain"></div>
      <div class="vignette"></div>
      <div class="barre">
        <button class="sortir" type="button">🚪 SORTIR DU PALAIS</button>
        <span class="t">PALAIS MENTAL — CHAMBRE 7 · MOBILE-HOME</span>
      </div>
    </div>`;
  document.body.appendChild(el);

  const cartesEl = el.querySelector('.cartes');
  const arianeEl = el.querySelector('.fil-ariane');
  const chercheEl = el.querySelector('.cherche');
  const retourEl = el.querySelector('.retour');
  const bureauEl = el.querySelector('.bureau');

  let racine = mur(options.dossiers || [], 'PALAIS MENTAL');
  let pile = [];      // chemin de nœuds ouverts
  let recherche = '';

  // ── les objets du bureau ────────────────────────────────────────────────
  try { if (window.localStorage.getItem('watchtower.rideaux.v1') === '1') document.body.classList.add('wt-rideaux-ouverts'); } catch { /* plein */ }
  for (const o of OBJETS) {
    const d = document.createElement('div');
    d.className = 'obj';
    d.dataset.obj = o.id;
    d.style.left = o.gauche;
    d.style.width = `${o.taille}px`;
    d.innerHTML = `${svgObjet(o.id, o.taille)}<span class="bulle">${o.nom} — ${o.aide}</span>`;
    d.title = `${o.nom} — ${o.aide}`;
    d.addEventListener('click', () => {
      surObjet?.(o.id);
      surMessage?.(`${o.nom} — ${o.aide}`);
    });
    bureauEl.appendChild(d);
  }

  // ── le tableau ──────────────────────────────────────────────────────────
  function courant() { return pile.length ? pile[pile.length - 1] : racine; }

  function rendre() {
    cartesEl.innerHTML = '';
    const noeudCourant = courant();
    arianeEl.textContent = ['TABLEAU', ...pile.map((p) => p.nom)].join(' › ');
    retourEl.disabled = pile.length === 0;

    let entrees = [];
    if (recherche.trim()) {
      // recherche : on descend directement jusqu'aux éléments trouvés
      const filtre = filtrer(noeudCourant, recherche);
      entrees = filtre ? aplatir(filtre, 6).slice(1).map((x) => ({
        noeud: x.noeud,
        chemin: [...pile.map((p) => p.nom), ...x.chemin.slice(1).map((p) => p.nom)].join(' › '),
      })) : [];
    } else {
      entrees = (noeudCourant.enfants || []).map((n) => ({ noeud: n, chemin: '' }));
    }

    if (!entrees.length) {
      cartesEl.innerHTML = `<div class="vide">${recherche.trim()
        ? `Aucun élément ne correspond à « ${recherche} ».<br>Le filtre cherche aussi dans les détails.`
        : 'Tableau vide — ouvre 🏗 CHANTIER ou 🏷 ENTITÉS pour alimenter le mur.'}</div>`;
      return;
    }

    for (const [i, e] of entrees.slice(0, 60).entries()) {
      const n = e.noeud;
      const c = document.createElement('div');
      c.className = 'carte';
      c.dataset.type = n.type;
      c.dataset.id = n.id;
      c.style.setProperty('--rot', `${((i % 5) - 2) * 1.4}deg`);
      const url = svgEnUrl(vignette(n.type, { titre: n.nom, graine: `${n.id}${n.nom}`, taille: 200 }));
      c.innerHTML = `<span class="puce"></span><img alt="" src="${url}" />`
        + (n.enfants?.length ? `<span class="sous">${compter(n) - 1} ↳</span>` : '')
        + (e.chemin ? `<div class="chemin">${e.chemin}</div>` : '')
        + `<div class="leg">${n.ic} ${n.nom}</div>`;
      c.title = n.detail ? `${n.nom} — ${n.detail}` : n.nom;
      c.addEventListener('click', () => {
        if (n.enfants?.length) {
          pile.push(n);
          recherche = '';
          chercheEl.value = '';
          rendre();
          surMessage?.(`🗂 ${n.nom} — ${n.enfants.length} sous-élément(s). Clic sur une carte pour descendre encore.`);
        } else {
          surCarte?.(n);
          surMessage?.(`🗂 ${n.nom}${n.detail ? ` — ${n.detail}` : ''}`);
        }
      });
      cartesEl.appendChild(c);
    }
  }

  chercheEl.addEventListener('input', () => { recherche = chercheEl.value; rendre(); });
  retourEl.addEventListener('click', () => { pile.pop(); rendre(); });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (recherche) { recherche = ''; chercheEl.value = ''; rendre(); }
      else if (pile.length) { pile.pop(); rendre(); }
      else api.fermer();
    }
  });
  el.tabIndex = 0;

  el.querySelector('.porte').addEventListener('click', () => api.fermer());
  el.querySelector('.sortir').addEventListener('click', () => api.fermer());
  el.querySelector('.tiroir').addEventListener('click', () => surObjet?.('chemise'));

  const api = {
    element: el,
    /** Ouvre le palais (et masque la carte). */
    ouvrir() {
      el.classList.add('ouvert');
      document.body.classList.add('wt-palais-ouvert');
      rendre();
      el.dispatchEvent(new CustomEvent('wt-palais-ouvert'));
      el.focus?.();
      surMessage?.('🧠 PALAIS MENTAL — chambre 7. Le mur garde tes dossiers, le bureau tes outils.');
      return api;
    },
    /** Ferme le palais (retour à la carte). */
    fermer() {
      el.classList.remove('ouvert');
      document.body.classList.remove('wt-palais-ouvert');
      surSortie?.();
      return api;
    },
    basculer() { return el.classList.contains('ouvert') ? api.fermer() : api.ouvrir(); },
    estOuvert: () => el.classList.contains('ouvert'),
    /** Remplace les dossiers épinglés au mur. */
    setDossiers(liste = [], titre = 'PALAIS MENTAL') {
      racine = mur(liste, titre);
      pile = [];
      rendre();
      return api;
    },
    /** Ouvre directement un dossier (par identifiant). */
    ouvrirDossier(id) {
      const n = (racine.enfants || []).find((e) => e.id === id);
      if (n) { pile = [n]; rendre(); }
      return Boolean(n);
    },
    /** Ajoute un dossier sans effacer les autres. */
    ajouterDossier(brut) {
      racine.enfants = [...(racine.enfants || []), noeud(brut, 1)];
      racine.detail = `${racine.enfants.length} dossier(s)`;
      rendre();
      return api;
    },
    /**
     * Incarne un module de l'application dans un objet du bureau : l'élément
     * s'affiche dans une fenêtre posée sur la scène (le téléphone = le chat,
     * le moniteur = les caméras, le calendrier = le planning…). En fermant la
     * fenêtre, l'élément retourne EXACTEMENT où il était (dock, panneau…).
     *
     * @param {string} idObjet identifiant de l'objet (voir `OBJETS`)
     * @param {HTMLElement} element module à afficher
     * @param {{titre?:string, largeur?:number}} [options]
     */
    ouvrirObjet(idObjet, element, options = {}) {
      const hote = el.querySelector(`.obj[data-obj="${idObjet}"]`);
      if (!hote || !element) return null;
      const parent = element.parentNode;
      const suivant = element.nextSibling;
      const precedent = element.previousSibling;
      const fenetre = document.createElement('div');
      fenetre.className = 'objet-fenetre';
      fenetre.innerHTML = `<div class="of-t"><span>${options.titre || idObjet}</span><button type="button">✕</button></div><div class="of-c"></div>`;
      const corps = fenetre.querySelector('.of-c');
      corps.appendChild(element);
      const r = hote.getBoundingClientRect();
      const rEl = el.getBoundingClientRect();
      const largeur = Math.max(240, Number(options.largeur) || 340);
      let x = (r.left - rEl.left) + r.width / 2 - largeur / 2;
      x = Math.max(12, Math.min(x, rEl.width - largeur - 12));
      const y = Math.max(70, (r.top - rEl.top) - 40);
      fenetre.style.left = `${x}px`;
      fenetre.style.width = `${largeur}px`;
      fenetre.style.bottom = `${Math.max(20, rEl.height - y - 40)}px`;
      const fermer = () => {
        if (element.parentNode === corps) {
          if (suivant && suivant.parentNode === parent) parent.insertBefore(element, suivant);
          else if (precedent && precedent.parentNode === parent) parent.insertBefore(element, precedent.nextSibling);
          else parent?.appendChild(element);
        }
        fenetre.remove();
        return true;
      };
      fenetre.querySelector('.of-t button').addEventListener('click', fermer);
      el.querySelector('.scene').appendChild(fenetre);
      // déplaçable par la barre de titre
      let depart = null;
      const t = fenetre.querySelector('.of-t');
      t.addEventListener('pointerdown', (e) => {
        depart = { x: e.clientX, y: e.clientY, l: fenetre.offsetLeft, b: parseFloat(fenetre.style.bottom || '0') };
        t.setPointerCapture?.(e.pointerId);
      });
      t.addEventListener('pointermove', (e) => {
        if (!depart) return;
        fenetre.style.left = `${depart.l + (e.clientX - depart.x)}px`;
        fenetre.style.bottom = `${depart.b - (e.clientY - depart.y)}px`;
      });
      t.addEventListener('pointerup', () => { depart = null; });
      return { element: fenetre, fermer };
    },
    /** Allume / éteint le plafonnier (ambiance). */
    lumiere(on) {
      el.classList.toggle('allume', on === undefined ? !el.classList.contains('allume') : Boolean(on));
      return el.classList.contains('allume');
    },
    /** Le nœud courant (pour les tests / le pilotage externe). */
    courant,
    rendre,
    dossierRacine: () => racine,
  };

  rendre();
  return api;
}
