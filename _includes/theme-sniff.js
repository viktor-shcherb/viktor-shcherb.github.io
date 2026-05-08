/* Decide initial colour-scheme before the first paint, and keep it in sync
   when the page becomes visible from BFCache or speculation-rules prerender. */
(() => {
  const KEY = 'prefers-dark';
  function apply() {
    const saved = localStorage.getItem(KEY);
    const dark =
      saved === 'true'  ? true  :
      saved === 'false' ? false :
      matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }
  apply();
  /* If this document is being prerendered, re-apply on activation so any
     theme change the user made on the previous page is honoured. */
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', apply, { once: true });
  }
  /* Re-apply on BFCache restore (back/forward navigation). */
  window.addEventListener('pageshow', e => { if (e.persisted) apply(); });
})();
