export function initTabSwitcher(root = document) {
  // find every .tab-switcher in `root`
  root.querySelectorAll('.tab-switcher').forEach(switcher => {
    const radios = Array.from(
      switcher.querySelectorAll('input[type="radio"][data-panel]')
    );
    const labels = switcher.querySelectorAll('label');

    const anchorMap = new Map();
    radios.forEach(r => {
      if (r.dataset.anchor) anchorMap.set(r.dataset.anchor, r);
    });
    const useHash = anchorMap.size > 0;

    function show(panelSel, anchor){
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

      if (useHash && anchor) {
        history.replaceState(null, '', '#' + anchor);
      }
    }

    function applyHash(hash){
      if (!useHash || !hash) return;
      const anchor = hash.replace(/^#/, '');
      const radio = anchorMap.get(anchor);
      if (radio) {
        radio.checked = true;
        show(radio.dataset.panel, anchor);
      }
    }

    // initial state
    const current = switcher.querySelector('input[type="radio"]:checked');
    if (useHash && location.hash) {
      applyHash(location.hash);
    } else if (current) {
      show(current.dataset.panel, current.dataset.anchor);
    }

    // delegate change events
    switcher.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"][data-panel]')) {
        show(e.target.dataset.panel, e.target.dataset.anchor);
      }
    });

    if (useHash) {
      window.addEventListener('hashchange', () => applyHash(location.hash));
    }
  });
}
