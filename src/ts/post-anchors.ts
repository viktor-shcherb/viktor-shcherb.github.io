import AnchorJS from 'anchor-js';

function addHeadingAnchors(): void {
  const article = document.querySelector('.post-content');
  if (!article) return;
  const anchors = new AnchorJS();
  anchors.options = { placement: 'right', icon: '#', visible: 'hover' };
  anchors.add('h1, h2, h3, h4, h5, h6', article);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addHeadingAnchors, { once: true });
} else {
  addHeadingAnchors();
}
