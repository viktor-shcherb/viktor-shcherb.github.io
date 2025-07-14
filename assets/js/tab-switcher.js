export function initTabSwitcher(root = document) {
  // find every .tab-switcher in `root`
  root.querySelectorAll('.tab-switcher').forEach(switcher => {
    const radios = switcher.querySelectorAll('input[type="radio"][data-panel]');
    const labels = switcher.querySelectorAll('label');

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

    // initial state
    const current = switcher.querySelector('input[type="radio"]:checked');
    if (current) show(current.dataset.panel);

    // delegate change events
    switcher.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"][data-panel]')) {
        show(e.target.dataset.panel);
      }
    });
  });
}
