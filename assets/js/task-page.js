import { initTabSwitcher }  from '/assets/js/tab-switcher.js';
import { loadTask }         from '/assets/js/task-loader.js';
import { renderTask,
         ensureTaskSkeleton,
         signatureToString } from '/assets/js/task-render.js';
import { setupEditor,
         setupRunner,
         updateEditorTheme } from '/assets/js/editor.js';

let currentTask, editorReady = false;

async function renderPage() {
  const slug = new URLSearchParams(location.search).get('id');
  if (!slug) return;

  // 1. make sure the placeholders exist in the live DOM
  ensureTaskSkeleton();

  // 2. fetch the task JSON and render it into those placeholders
  currentTask = await loadTask(slug);
  renderTask(currentTask, document);

  // 3. normal boot-strapping
  initTabSwitcher(document);
  updateEditorTheme();
}

// first run + every Turbo visit
document.addEventListener('turbo:load', renderPage);
renderPage();

document.addEventListener('themechange', updateEditorTheme);

document.addEventListener('tabshown', async ({ detail }) => {
  if (detail.panel.id !== 'panel-code' || editorReady) return;
  setupEditor(signatureToString(currentTask.signature));
  setupRunner();
  editorReady = true;
});
