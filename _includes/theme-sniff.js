/* Decide initial colour-scheme before the first paint. */
(() => {
  const KEY   = 'prefers-dark';
  const saved = localStorage.getItem(KEY);                   // "true" | "false" | null

  const dark =
    saved === 'true' ? true :
    saved === 'false'? false :
    matchMedia('(prefers-color-scheme: dark)').matches;      // follow OS

  if (dark) document.documentElement.dataset.theme = 'dark';
})();
