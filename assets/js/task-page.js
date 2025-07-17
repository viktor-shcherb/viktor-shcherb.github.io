// Page controller for an individual algorithm task.
// It can operate on either a pre-rendered task object embedded by the
// build step or a JSON file fetched at runtime.
import { initTabSwitcher }  from '/assets/js/tab-switcher.js';
import { loadTask }         from '/assets/js/task-loader.js';
import { renderTask,
         ensureTaskSkeleton,
         signatureToDef } from '/assets/js/task-render.js';
import { setupEditor,
         setupRunner,
         updateEditorTheme } from '/assets/js/editor.js';
import { initStateSettings } from '/assets/js/state-settings.js';

let currentTask, editorReady = false;

async function renderPage() {
  // When the page was created by the prerender script it defines
  // `window.PRE_RENDERED_TASK` to avoid fetching the JSON again.
  const pre  = window.PRE_RENDERED_TASK;
  const slug = pre?.slug || new URLSearchParams(location.search).get('id');
  if (!slug) return;

  // 1. Ensure the layout slots exist.  This runs here so the same
  //    templates can also be injected by the prerender step.
  ensureTaskSkeleton();

  // Reset editor state when navigating between tasks
  editorReady = false;

  // 2. Either reuse the embedded object or fetch the task JSON and
  //    render it into the skeleton.
  currentTask = pre || await loadTask(slug);
  window.currentTask = currentTask;
  renderTask(currentTask, document);

  // 3. Continue with the interactive features once the static
  //    content is in place.
  initTabSwitcher(document);
  updateEditorTheme();
  initStateSettings();
}

// first run + every Turbo visit
document.addEventListener('turbo:load', renderPage);
renderPage();

document.addEventListener('themechange', updateEditorTheme);

document.addEventListener('tabshown', async ({ detail }) => {
  if (detail.panel.id !== 'panel-code' || editorReady) return;
  await setupEditor(signatureToDef(currentTask.signature), currentTask.slug);
  await setupRunner(currentTask);
  editorReady = true;
});
