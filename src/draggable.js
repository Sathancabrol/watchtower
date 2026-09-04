/**
 * WATCHTOWER — utilitaire : rendre n'importe quelle fenêtre DÉPLAÇABLE.
 * On saisit la poignée (en-tête) et on glisse ; les boutons/champs restent
 * cliquables. Fonctionne à la souris et au tactile.
 */
export function rendreDeplacable(el, poignee) {
  const h = poignee || el;
  h.style.touchAction = 'none';
  if (!poignee) h.style.cursor = 'move';
  let d = null;
  h.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, select, textarea, a, canvas, [contenteditable]')) return;
    const r = el.getBoundingClientRect();
    d = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { h.setPointerCapture(e.pointerId); } catch { /* ok */ }
    h.style.cursor = 'grabbing';
  });
  h.addEventListener('pointermove', (e) => {
    if (!d) return;
    el.style.left = `${Math.max(0, e.clientX - d.dx)}px`;
    el.style.top = `${Math.max(0, e.clientY - d.dy)}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';
  });
  const fin = () => { d = null; h.style.cursor = poignee ? '' : 'move'; };
  h.addEventListener('pointerup', fin);
  h.addEventListener('pointercancel', fin);
}
