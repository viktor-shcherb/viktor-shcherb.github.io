export function addCopyButtons(scope = document) {
  scope.querySelectorAll('pre > code, .cm-static-view').forEach(el => {
    const pre = el.matches('pre > code') ? el.parentElement : el;
    if (pre.querySelector('.copy-btn')) return;
    pre.classList.add('copy-wrap');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.innerHTML =
      '<span class="material-symbols-outlined btn-icon-material-symbols" aria-hidden="true">content_copy</span>';

    btn.addEventListener('click', () => {
      const text = el.matches('pre > code')
        ? el.innerText // (Consider textContent; see note below.)
        : el.getAttribute('data-code') || '';
      navigator.clipboard.writeText(text).catch(() => {});
    });

    pre.appendChild(btn);
  });
}
