/* ------------------------------------------------------------------
 *  – registers the Service Worker
 *  – handles the nav dropdowns with event-delegation
 *  – repeats the loader-fade after every Turbo navigation
 * ----------------------------------------------------------------- */

/* ———————————————————————————————————————— service-worker — */
if ('serviceWorker' in navigator) {
  /* defer until full load so it never blocks first paint */
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  );
}

/* ————————————————————————————————————— dropdown nav — */
function closeAllDropdowns(except = null) {
  document.querySelectorAll('.dropdown.open').forEach(dd => {
    if (dd !== except) dd.classList.remove('open');
  });
}

document.addEventListener('click', e => {
  const toggle = e.target.closest('.dropdown-toggle');
  if (toggle) {
    e.stopPropagation();
    const wrapper = toggle.parentElement;
    closeAllDropdowns(wrapper);
    wrapper.classList.toggle('open');
  } else {
    /* click anywhere else closes any open menu */
    closeAllDropdowns();
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const menu = e.target.closest('.dropdown-menu');
  if (!menu) return;
  const wrapper = menu.parentElement;
  wrapper.classList.remove('open');
  wrapper.querySelector('.dropdown-toggle')?.focus();
});
