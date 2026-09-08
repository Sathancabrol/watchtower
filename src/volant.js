/**
 * 🎛 LE VOLANT (chantier B).
 *
 * Un moyeu unique à gauche, sous le logo, qui déploie en éventail **toutes** les
 * fonctions de l'application. Esprit Google Maps / Claude : un seul point
 * d'entrée, tout est à deux clics.
 *
 * ## Principe : référencer, ne pas absorber
 *
 * Le volant ne réimplémente rien. Il pointe vers les modules déjà en place :
 *   - les panneaux, via l'API du dock (`ouvrir`, `ouvrirExistant`) ;
 *   - les décors, via des sélecteurs CSS (`registreBascules.js`).
 *
 * Si le volant disparaissait, l'application resterait entière. **Rien n'est perdu.**
 *
 * ## Position
 *
 * Le moyeu se place **sous le logo WATCHTOWER**, en haut à gauche — c'est le
 * point d'ancrage naturel du regard, et l'emplacement demandé pour le bouton œil.
 *
 * @module volant
 */

import {
  BASCULES_AFFICHAGE, normaliserEtat, basculer as inverser, toutEteindre, toutAllumer,
  compter, parFamille, CLE_ETAT,
} from './data/volant/registreBascules.js';

const STYLE_ID = 'wt-volant-css';

const CSS = `
#wt-volant {
  position: fixed; top: 104px; left: 40px; z-index: 962;
  font-family: system-ui, -apple-system, sans-serif;
}
#wt-volant .wt-v-moyeu {
  position: relative; width: 52px; height: 52px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  background: radial-gradient(circle at 40% 35%, rgba(0,60,90,0.96), rgba(2,10,18,0.98));
  border: 2px solid rgba(0,212,255,0.55);
  box-shadow: 0 0 18px rgba(0,212,255,0.35), inset 0 0 12px rgba(0,212,255,0.12);
  font-size: 22px; line-height: 1; color: #7fe7ff; transition: transform .18s ease;
}
#wt-volant .wt-v-moyeu:hover { transform: scale(1.06); }
#wt-volant.ouvert .wt-v-moyeu { border-color: rgba(255,120,120,0.7); }
#wt-volant .wt-v-pastille {
  position: absolute; right: -4px; bottom: -4px; min-width: 18px; height: 18px;
  padding: 0 4px; border-radius: 9px; background: #04202c; color: #7fe7ff;
  border: 1px solid rgba(0,212,255,0.5); font: 700 10px/17px system-ui, sans-serif;
  text-align: center;
}
#wt-volant .wt-v-rayons { position: absolute; inset: 0; pointer-events: none; }
#wt-volant .wt-v-rayon {
  position: absolute; top: 14px; left: 14px; width: 40px; height: 40px;
  border-radius: 50%; display: grid; place-items: center; cursor: pointer;
  background: rgba(4,14,24,0.94); border: 1px solid rgba(0,212,255,0.4);
  color: #cfefff; font-size: 17px; pointer-events: auto;
  opacity: 0; transform: translate(0,0) scale(.5);
  transition: transform .22s cubic-bezier(.2,.9,.3,1.3), opacity .18s ease;
}
#wt-volant.ouvert .wt-v-rayon { opacity: 1; }
#wt-volant .wt-v-rayon:hover { border-color: rgba(0,212,255,0.9); background: rgba(0,60,90,0.9); }
#wt-volant .wt-v-rayon .wt-v-info {
  position: absolute; left: 46px; white-space: nowrap; font: 600 10px/1 system-ui, sans-serif;
  background: rgba(2,10,18,0.92); border: 1px solid rgba(0,212,255,0.3);
  padding: 4px 7px; border-radius: 4px; color: #9fdcff;
  opacity: 0; transition: opacity .15s ease; pointer-events: none;
}
#wt-volant .wt-v-rayon:hover .wt-v-info { opacity: 1; }

#wt-volant-panneau {
  position: fixed; top: 104px; left: 108px; z-index: 961;
  width: 268px; max-height: 68vh; overflow: auto; display: none;
  background: rgba(3,11,19,0.96); border: 1px solid rgba(0,212,255,0.35);
  border-radius: 8px; padding: 10px; color: #cfefff;
  font: 12px/1.45 system-ui, sans-serif;
  box-shadow: 0 10px 32px rgba(0,0,0,0.6);
}
#wt-volant-panneau.ouvert { display: block; }
#wt-volant-panneau h3 {
  margin: 0 0 8px; font: 700 11px/1 system-ui, sans-serif; letter-spacing: .1em;
  text-transform: uppercase; color: #7fe7ff;
}
#wt-volant-panneau .wt-v-fam {
  margin: 10px 0 4px; font: 700 10px/1 system-ui, sans-serif; letter-spacing: .08em;
  text-transform: uppercase; color: #6aa9c4;
}
#wt-volant-panneau label {
  display: flex; align-items: center; gap: 7px; padding: 5px 6px;
  border-radius: 5px; cursor: pointer;
}
#wt-volant-panneau label:hover { background: rgba(0,212,255,0.1); }
#wt-volant-panneau input { accent-color: #00d4ff; cursor: pointer; }
#wt-volant-panneau .wt-v-actions { display: flex; gap: 6px; margin-top: 10px; }
#wt-volant-panneau .wt-v-actions button {
  flex: 1; padding: 6px; border-radius: 5px; cursor: pointer;
  background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.4);
  color: #cfefff; font: 600 10px/1 system-ui, sans-serif; text-transform: uppercase;
}
#wt-volant-panneau .wt-v-actions button:hover { background: rgba(0,212,255,0.24); }
`;

/**
 * Lit l'état mémorisé des bascules.
 * @param {Storage} [stockage] - Stockage local.
 * @returns {Record<string, boolean>} État normalisé.
 */
export function lireEtat(stockage = globalThis.localStorage) {
  try { return normaliserEtat(JSON.parse(stockage.getItem(CLE_ETAT))); }
  catch { return normaliserEtat(null); }
}

/**
 * Mémorise l'état des bascules.
 * @param {Record<string, boolean>} etat - État à écrire.
 * @param {Storage} [stockage] - Stockage local.
 */
export function ecrireEtat(etat, stockage = globalThis.localStorage) {
  try { stockage.setItem(CLE_ETAT, JSON.stringify(etat)); } catch { /* quota ou mode privé */ }
}

/**
 * Applique une bascule au DOM : masque ou révèle les éléments visés.
 * @param {object} bascule - Entrée du registre.
 * @param {boolean} actif - Visible ou non.
 * @param {Document} doc - Document hôte.
 */
export function appliquerBascule(bascule, actif, doc) {
  if (!bascule?.selecteur || !doc) return;
  for (const n of doc.querySelectorAll(bascule.selecteur)) {
    // `visibility` plutôt que `display` : on ne casse pas les mises en page qui
    // dépendent de la taille des éléments (et Cesium n'aime pas être décalé).
    n.style.visibility = actif ? '' : 'hidden';
    n.style.pointerEvents = actif ? '' : 'none';
  }
}

/**
 * Installe le volant.
 *
 * @param {{dock?:object, document?:Document, surMessage?:function}} [options]
 * @returns {{ouvrir:function, fermer:function, basculer:function, etat:function, detruire:function}}
 */
export function initVolant({ dock, document: doc = globalThis.document, surMessage } = {}) {
  if (!doc?.body) {
    return { ouvrir() {}, fermer() {}, basculer() {}, etat: () => ({}), detruire() {} };
  }

  if (!doc.getElementById(STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    doc.head.appendChild(st);
  }

  let etat = lireEtat();
  let ouvert = false;

  const racine = doc.createElement('div');
  racine.id = 'wt-volant';
  racine.innerHTML = `
    <div class="wt-v-moyeu" role="button" tabindex="0"
         title="Le volant — toutes les fonctions, un seul bouton">👁<span class="wt-v-pastille"></span></div>
    <div class="wt-v-rayons"></div>`;
  doc.body.appendChild(racine);

  const panneau = doc.createElement('div');
  panneau.id = 'wt-volant-panneau';
  doc.body.appendChild(panneau);

  const moyeu = racine.querySelector('.wt-v-moyeu');
  const pastille = racine.querySelector('.wt-v-pastille');

  /** Met à jour la pastille de décompte du moyeu. */
  const majPastille = () => {
    const { allumes, total } = compter(etat);
    pastille.textContent = `${allumes}/${total}`;
  };

  /** Applique tout l'état courant au DOM et le mémorise. */
  const appliquerTout = () => {
    for (const b of BASCULES_AFFICHAGE) appliquerBascule(b, etat[b.id], doc);
    ecrireEtat(etat);
    majPastille();
  };

  /** (Re)construit le panneau des bascules. */
  const rendrePanneau = () => {
    const groupes = parFamille();
    panneau.innerHTML = `<h3>🎛 Affichage — ${compter(etat).allumes}/${compter(etat).total}</h3>`;
    for (const g of groupes) {
      const titre = doc.createElement('div');
      titre.className = 'wt-v-fam';
      titre.textContent = `${g.famille.icone} ${g.famille.libelle}`;
      panneau.appendChild(titre);
      for (const b of g.entrees) {
        const l = doc.createElement('label');
        l.title = b.aide;
        const c = doc.createElement('input');
        c.type = 'checkbox';
        c.checked = Boolean(etat[b.id]);
        c.addEventListener('change', () => {
          etat = inverser(etat, b.id);
          appliquerTout();
          rendrePanneau();
        });
        l.appendChild(c);
        l.appendChild(doc.createTextNode(`${b.icone} ${b.libelle}`));
        panneau.appendChild(l);
      }
    }
    const actions = doc.createElement('div');
    actions.className = 'wt-v-actions';
    const bTout = doc.createElement('button');
    bTout.type = 'button';
    bTout.textContent = '✓ Tout';
    bTout.addEventListener('click', () => { etat = toutAllumer(etat); appliquerTout(); rendrePanneau(); });
    const bRien = doc.createElement('button');
    bRien.type = 'button';
    bRien.textContent = '✕ Vue nue';
    bRien.title = 'Dégager entièrement la vue';
    bRien.addEventListener('click', () => {
      etat = toutEteindre(etat);
      appliquerTout();
      rendrePanneau();
      surMessage?.('Vue dégagée — tout est réactivable depuis le volant.');
    });
    actions.append(bTout, bRien);
    panneau.appendChild(actions);
  };

  /** Rayons : les raccourcis vers les modules existants. */
  const RAYONS = [
    { icone: '🎛', info: 'Affichage', action: () => { panneau.classList.toggle('ouvert'); rendrePanneau(); } },
    { icone: '💬', info: 'Chat', action: () => dock?.ouvrir?.('chat') },
    { icone: '🧭', info: 'Lieux', action: () => dock?.ouvrir?.('lieux') },
    { icone: '🗺', info: 'Minicarte', action: () => dock?.ouvrirExistant?.('wt-minimap') },
    { icone: '🧠', info: 'Intel', action: () => dock?.ouvrirExistant?.('wt-intel') },
    { icone: '📷', info: 'Caméras', action: () => dock?.ouvrir?.('cam') },
    { icone: '🏙', info: 'Bâti 3D', action: () => dock?.ouvrir?.('bati') },
    { icone: '✈', info: 'Vol', action: () => dock?.ouvrir?.('vol') },
  ];

  const zoneRayons = racine.querySelector('.wt-v-rayons');
  const boutons = RAYONS.map((r, i) => {
    const b = doc.createElement('div');
    b.className = 'wt-v-rayon';
    b.setAttribute('role', 'button');
    b.setAttribute('tabindex', '0');
    b.innerHTML = `${r.icone}<span class="wt-v-info">${r.info}</span>`;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); r.action(); });
    zoneRayons.appendChild(b);
    return { el: b, index: i };
  });

  /** Déploie ou replie l'éventail. */
  const placerRayons = () => {
    // Éventail vertical vers le bas : le volant est ancré en haut à gauche,
    // déployer vers la droite masquerait la carte.
    const n = boutons.length;
    boutons.forEach(({ el, index }) => {
      if (!ouvert) { el.style.transform = 'translate(0,0) scale(.5)'; return; }
      const y = 58 + index * 46;
      el.style.transform = `translate(0px, ${y}px) scale(1)`;
      el.style.transitionDelay = `${index * 24}ms`;
    });
    void n;
  };

  const ouvrir = () => { ouvert = true; racine.classList.add('ouvert'); placerRayons(); };
  const fermer = () => {
    ouvert = false;
    racine.classList.remove('ouvert');
    panneau.classList.remove('ouvert');
    placerRayons();
  };
  const basculerVolant = () => (ouvert ? fermer() : ouvrir());

  moyeu.addEventListener('click', basculerVolant);
  moyeu.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculerVolant(); }
  });

  appliquerTout();
  placerRayons();

  return {
    ouvrir,
    fermer,
    basculer: basculerVolant,
    etat: () => ({ ...etat }),
    detruire() { racine.remove(); panneau.remove(); },
  };
}
