import { initTabSwitcher }  from '/assets/js/tab-switcher.js';
import { loadTask }         from '/assets/js/task-loader.js';
import { renderTask,
         ensureTaskSkeleton,
         signatureToDef }   from '/assets/js/task-render.js';
import { setupEditor,
         setupRunner,
         updateEditorTheme } from '/assets/js/editor.js';
import { initStateSettings } from '/assets/js/state-settings.js';

let currentTask = null;
let editorReady = false;
let editorInitializing = false;
let lastSlugLoaded = null;
let listenersBound = false;

async function renderPage() {
  // Identify task slug
  const pre  = window.PRE_RENDERED_TASK;
  const slug = pre?.slug || new URLSearchParams(location.search).get('id');
  if (!slug) return;

  lastSlugLoaded = slug;

  ensureTaskSkeleton();
  editorReady = false;
  editorInitializing = false;
  currentTask = null;

  try {
    currentTask = pre || await loadTask(slug);
    // Abort if navigation changed slug while awaiting
    if (slug !== lastSlugLoaded) return;

    window.currentTask = currentTask; // optional; remove if you dislike globals
    renderTask(currentTask, document);
  } catch (err) {
    console.error('Task load failed', err);
    const container = document.querySelector('#panel-desc') || document.body;
    container.innerHTML = `<p class="error">Failed to load task.</p>`;
    return;
  }

  initTabSwitcher(document);
  updateEditorTheme();       // pre-editor (sets baseline)
}

function bindGlobalListenersOnce() {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('tabshown', async ({ detail }) => {
    if (!currentTask) return;
    if (detail.panel.id !== 'panel-code') return;
    if (editorReady || editorInitializing) return;

    editorInitializing = true; // lock
    try {
      await setupEditor(signatureToDef(currentTask.signature), currentTask.slug);
      await initStateSettings(); // modal + state settings
      await setupRunner(currentTask);
      updateEditorTheme(); // ensure theme after editor init
      editorReady = true;
    } finally {
      editorInitializing = false;
    }
  });

  document.addEventListener('themechange', updateEditorTheme);
}

bindGlobalListenersOnce();

// Turbo full or partial load
document.addEventListener('turbo:load', renderPage);

// Initial (non-turbo) load fallback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderPage, { once: true });
} else {
  renderPage();
}
