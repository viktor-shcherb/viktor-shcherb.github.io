const COPY_SVG =
  '<svg viewBox="0 -960 960 960" width="18" height="18" fill="currentColor" aria-hidden="true">' +
  '<path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/>' +
  '</svg>';

const CHECK_SVG =
  '<svg viewBox="0 -960 960 960" width="18" height="18" fill="currentColor" aria-hidden="true">' +
  '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>' +
  '</svg>';

export function addCopyButtons(scope = document) {
  scope.querySelectorAll('pre > code, .cm-static-view').forEach(el => {
    const pre = el.matches('pre > code') ? el.parentElement : el;
    if (pre.querySelector('.copy-btn')) return;
    pre.classList.add('copy-wrap');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.innerHTML = COPY_SVG;

    btn.addEventListener('click', () => {
      const text = el.matches('pre > code')
        ? el.innerText
        : el.getAttribute('data-code') || '';
      navigator.clipboard.writeText(text)
        .then(() => {
          btn.innerHTML = CHECK_SVG;
          btn.dataset.copied = 'true';
          setTimeout(() => {
            btn.innerHTML = COPY_SVG;
            delete btn.dataset.copied;
          }, 2000);
        })
        .catch(() => {});
    });

    pre.appendChild(btn);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => addCopyButtons(), { once: true });
} else {
  addCopyButtons();
}
