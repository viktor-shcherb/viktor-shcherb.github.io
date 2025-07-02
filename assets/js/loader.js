function hideLoader() {
  const fontsReady = document.fonts.ready;
  const cssReady = new Promise(resolve => {
    const link = document.querySelector('link[href*="style.css"]');
    if (!link) return resolve();
    if (link.sheet) return resolve();
    link.addEventListener('load', resolve, { once: true });
  });
  Promise.all([fontsReady, cssReady]).then(() => {
    const l = document.getElementById('app-loader');
    if (!l) return;
    l.classList.add('fade');
    setTimeout(() => l.remove(), 500);
  });
}

document.addEventListener('turbo:load', hideLoader);
