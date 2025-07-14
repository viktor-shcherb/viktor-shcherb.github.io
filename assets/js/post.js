/* ------------------------------------------------------------------
 *  • lazy-loads Anchor-JS the first time it’s needed
 *  • adds clean, right-hand anchor links to every heading
 *  • re-runs on each Turbo navigation so “next/prev” posts work
 * ----------------------------------------------------------------- */

(() => {
  const SRC = 'https://cdn.jsdelivr.net/npm/anchor-js@5.0.0/anchor.min.js';

  /* ------------------------------------------------ ensure library -- */
  function ensureAnchorLib() {
    return window.anchors
      ? Promise.resolve(window.anchors)
      : new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = SRC;
          s.defer = true;                      // don’t block paint
          s.onload = () => res(window.anchors);
          s.onerror = rej;
          document.head.appendChild(s);
        });
  }

  /* --------------------------------------------- add / refresh links -- */
  function addHeadingAnchors() {
    const article = document.querySelector('.post-content');
    if (!article) return;                     // nothing to do

    ensureAnchorLib().then(anchors => {
      anchors.options = { placement: 'right', icon: '', visible: 'hover' };

      /* remove any anchors Turbo carried over from the previous post */
      anchors.remove('h1,h2,h3,h4,h5,h6', article);

      /* add fresh ones for the current post */
      anchors.add('h1,h2,h3,h4,h5,h6', article);
    });
  }

  /* ---------------------------------------------------- run once + on Turbo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addHeadingAnchors, { once: true });
  } else {
    addHeadingAnchors();
  }
  document.addEventListener('turbo:load', addHeadingAnchors);
})();
