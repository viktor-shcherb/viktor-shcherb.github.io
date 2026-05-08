/* ------------------------------------------------------------------
 *  – registers the (self-unregistering) Service Worker
 *  – handles the nav dropdowns with event-delegation
 * ----------------------------------------------------------------- */

/* ———————————————————————————————————————— service-worker — */
/* The SW only exists to clean up a previous install from the algoprep
 * era. Once activated, it unregisters itself; visitors with no prior
 * SW will register the stub and immediately drop it. Both calls are
 * deferred to load so they never block first paint. */
if ('serviceWorker' in navigator) {
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
