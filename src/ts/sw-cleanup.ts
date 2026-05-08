/* The service worker is a self-unregistering stub left over from
 * algoprep. Registering it ensures previous visitors hit the stub
 * once and clean up; new visitors install it briefly and drop it. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}
