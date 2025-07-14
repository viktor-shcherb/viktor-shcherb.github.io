const key   = 'prefers-dark';
const root  = document.documentElement;
const toggle= document.getElementById('theme-toggle');
const icon  = document.getElementById('theme-icon');

const prefers = matchMedia('(prefers-color-scheme: dark)').matches;
const stored  = localStorage.getItem(key);
const startDark = stored ? stored === 'true' : prefers;

/* --- helpers ---------------------------------------------------- */
function setIcon(isDark){
  const glyph = isDark ? 'light_mode' : 'dark_mode';
  icon.dataset.icon = glyph;     // for future paint calls
  icon.textContent  = glyph;     // visible right now
}

function paintMaterialIcons(scope = document){
  scope.querySelectorAll('.material-symbols-outlined[data-icon]')
       .forEach(el => { el.textContent = el.dataset.icon; });
}

/* --- initial boot ----------------------------------------------- */
if (toggle && icon){
  applyTheme(startDark);         // sets icon & html[data-theme]

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme !== 'dark';
    applyTheme(next);
    localStorage.setItem(key, next);
    document.dispatchEvent(new CustomEvent('themechange', { bubbles:true, composed:true }));
  });
}

/* --- theme / icon application ----------------------------------- */
function applyTheme(isDark){
  root.dataset.theme = isDark ? 'dark' : 'light';
  setIcon(isDark);
}

/* --- once fonts are ready, paint all glyphs --------------------- */
document.fonts.ready.then(paintMaterialIcons.bind(null, document));

/* --- repaint on every Turbo render (new <body>) ----------------- */
document.addEventListener('turbo:render', () => {
  setIcon(root.dataset.theme === 'dark');   // refresh the toggle itself
  paintMaterialIcons();                     // paint any new glyphs
});
