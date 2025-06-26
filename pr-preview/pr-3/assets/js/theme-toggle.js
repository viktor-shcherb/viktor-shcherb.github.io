(() => {
  const STORAGE_KEY = 'prefers-dark';
  const root  = document.documentElement;
  const btn   = document.getElementById('theme-toggle');
  const icon  = document.getElementById('theme-icon');

  // initial state: OS preference, then saved choice
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved      = localStorage.getItem(STORAGE_KEY);
  const darkMode   = saved ? saved === 'true' : systemDark;

  applyTheme(darkMode);

  btn.addEventListener('click', () => {
    const isDark = root.dataset.theme === 'dark';
    applyTheme(!isDark);
    localStorage.setItem(STORAGE_KEY, !isDark);
  });

  function applyTheme(isDark){
    root.dataset.theme = isDark ? 'dark' : 'light';
    icon.textContent   = isDark ? 'light_mode' : 'dark_mode';
  }
})();
