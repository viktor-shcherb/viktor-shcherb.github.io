const KEY = 'prefers-dark';
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');

if (toggle) {
  /* Initial paint already handled by theme-sniff.js. CSS picks the
   * right SVG via [data-theme]; this listener flips the attribute. */
  toggle.addEventListener('click', () => {
    const next = root.dataset['theme'] !== 'dark';
    root.dataset['theme'] = next ? 'dark' : 'light';
    localStorage.setItem(KEY, String(next));
  });
}
