(() => {
  const key = 'prefers-dark';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored = localStorage.getItem(key);
  const startDark = stored ? stored === 'true' : prefers;
  let fontsReady = false;

  function setIcon(isDark) {
    icon.dataset.icon = isDark ? 'light_mode' : 'dark_mode';
    if (fontsReady) icon.textContent = icon.dataset.icon;
  }

  function apply(isDark) {
    root.dataset.theme = isDark ? 'dark' : 'light';
    setIcon(isDark);
  }

  document.fonts.ready.then(() => {
    fontsReady = true;
    for (const el of document.querySelectorAll('.material-symbols-outlined[data-icon]')) {
      el.textContent = el.dataset.icon;
    }
  });

  apply(startDark);

  toggle.addEventListener('click', () => {
    const isDark = root.dataset.theme === 'dark';
    apply(!isDark);
    localStorage.setItem(key, !isDark);
  });
})();
