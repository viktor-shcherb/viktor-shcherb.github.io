export function initTabSwitcher(root = document) {
  // find every .tab-switcher in `root`
  root.querySelectorAll('.tab-switcher').forEach(switcher => {
    const radios = switcher.querySelectorAll('input[type="radio"][data-panel]');
    const labels = switcher.querySelectorAll('label');

    // choose the element that should get the `show-both` class
    // If the panels live inside the `.tab-switcher` element itself (e.g. task page),
    // use that as the container. Otherwise (e.g. contribute form) the panels are
    // siblings of the switcher, so use its parent element instead.
    const container = switcher.querySelector('.tab-content')
      ? switcher
      : switcher.parentElement;
    const panels = [...radios]
      .map(r => document.querySelector(r.dataset.panel))
      .filter(Boolean);

    const wideQuery = matchMedia('(min-width: 75em)');

    function show(panelSel){
      // hide all panels in this switcher
      radios.forEach(r => {
        const panel = document.querySelector(r.dataset.panel);
        if (panel) panel.classList.toggle('active', r.dataset.panel === panelSel);
      });

      // mark active label (for CSS styling)
      labels.forEach(l => l.classList.toggle(
        'active', l.htmlFor && switcher.querySelector(`#${l.htmlFor}`).checked));

      // ↪︎ emit a custom event so feature-code can react
      switcher.dispatchEvent(new CustomEvent('tabshown', {
        detail:{panel: document.querySelector(panelSel)}, bubbles:true
      }));
    }

    function updateLayout(){
      if (wideQuery.matches){
        container.classList.add('show-both');
        panels.forEach(p => p.classList.add('active'));
      }else{
        container.classList.remove('show-both');
        const current = switcher.querySelector('input[type="radio"]:checked');
        if (current) show(current.dataset.panel);
      }
    }

    // initial state
    updateLayout();
    wideQuery.addEventListener('change', updateLayout);

    // delegate change events
    switcher.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"][data-panel]')) {
        show(e.target.dataset.panel);
      }
    });
  });
}
