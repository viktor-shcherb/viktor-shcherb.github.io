(() => {
  function addButtons(scope = document) {
    scope.querySelectorAll('pre > code').forEach(code => {
      const pre = code.parentElement;
      if (pre.querySelector('.copy-btn')) return;
      pre.classList.add('copy-wrap');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.innerHTML =
        '<span class="material-symbols-outlined btn-icon-material-symbols" aria-hidden="true">content_copy</span>';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(code.innerText).catch(() => {});
      });
      pre.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => addButtons());
  } else {
    addButtons();
  }
  document.addEventListener('turbo:load', () => addButtons());
})();
