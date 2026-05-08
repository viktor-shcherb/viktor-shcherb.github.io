function closeAllDropdowns(except: Element | null = null): void {
  document.querySelectorAll('.dropdown.open').forEach(dd => {
    if (dd !== except) dd.classList.remove('open');
  });
}

document.addEventListener('click', e => {
  const target = e.target as Element | null;
  const toggle = target?.closest('.dropdown-toggle');
  if (toggle) {
    e.stopPropagation();
    const wrapper = toggle.parentElement;
    closeAllDropdowns(wrapper);
    wrapper?.classList.toggle('open');
  } else {
    closeAllDropdowns();
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const target = e.target as Element | null;
  const menu = target?.closest('.dropdown-menu');
  if (!menu) return;
  const wrapper = menu.parentElement;
  wrapper?.classList.remove('open');
  wrapper?.querySelector<HTMLButtonElement>('.dropdown-toggle')?.focus();
});
