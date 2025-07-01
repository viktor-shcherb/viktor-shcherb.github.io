import {
  setupRunner, setupEditor, renderReadOnlyCodeBlocks,
  renderReadOnlyInputOutputBlocks, rerenderStaticCodeBlocks, updateEditorTheme
} from "./editor.js";


function signatureToString(signature) {
  if (!signature || !signature.name) return "";
  const args = (signature.args || [])
    .map(a => a.name + (a.type ? `: ${a.type}` : ""))
    .join(', ');
  return `def ${signature.name}(${args}):\n    pass`;
}

function renderSignature(signature) {
  const sigEl = document.getElementById('task-signature');
  if (!sigEl) return;
  if (!signature) {
    sigEl.innerHTML = '';
    return;
  }
  sigEl.innerHTML = `<pre><code class="language-python-codemirror">${signatureToString(signature)}</code></pre>`;
}


function renderExamples(tests) {
  // Clear example blocks first
  for (let i = 1; i <= 3; ++i) {
    const block = document.getElementById(`example-block-${i}`);
    if (block) block.innerHTML = '';
  }
  if (!tests || !tests.length) return;

  tests.slice(0, 3).forEach((test, i) => {
    const block = document.getElementById(`example-block-${i + 1}`);
    if (!block) return;
    let html = `<b>Example ${i + 1}:</b><br>`;
    if (test.input && Object.keys(test.input).length > 0) {
      html += `<span>Input:</span><pre><code class="language-io-codemirror">${JSON.stringify(test.input, null, 2)}</code></pre>`;
    }
    html += `<span>Output:</span><pre><code class="language-io-codemirror">${test.output}</code></pre>`;
    block.innerHTML = html;
  });

  document.getElementById('task-examples').style.display = '';
}

function renderContributor(contributor) {
  if (!contributor) return '';
  return `<div class="contributor">Contributed by <a href="${contributor.github}" target="_blank">${contributor.name}</a></div>`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Main render function
export async function renderTaskDetail() {
  const slug = getQueryParam('id');
  const titleEl = document.getElementById('task-title');
  const descEl = document.getElementById('task-description');
  const sigEl = document.getElementById('task-signature');
  const exEl = document.getElementById('task-examples');
  const contribEl = document.getElementById('task-contributor');
  const listEl = document.getElementById('task-list');

  // Loading state
  if (titleEl) {
    titleEl.innerText = slug ? 'Loading...' : 'No task selected!';
    titleEl.style.display = '';
  }
  if (descEl) descEl.innerHTML = '';
  if (contribEl) contribEl.innerHTML = '';

  if (!slug) return;

  try {
    const res = await fetch(`/algoprep/${slug}.json`);
    if (!res.ok) throw new Error("Task not found");
    const task = await res.json();

    if (titleEl) {
      titleEl.innerText = task.title || slug;
      titleEl.style.display = '';
    }
    if (descEl) {
      descEl.innerHTML = marked.parse(task.description || "");
      descEl.style.display = '';
    }
    if (sigEl) {
      renderSignature(task.signature);
      renderReadOnlyCodeBlocks();
    }
    if (exEl) {
      renderExamples(task.tests);
      renderReadOnlyInputOutputBlocks();
    }
    if (contribEl) {
      contribEl.innerHTML = renderContributor(task.contributor);
      contribEl.style.display = '';
    }
    if (listEl) listEl.style.display = 'none';

    // --- Always initialize editor and runner! ---
    await setupEditor(signatureToString(task.signature));
    await setupRunner();

    // --- Only set up tab switcher once ---
    setupTabSwitcher();

  } catch (err) {
    if (titleEl) {
      titleEl.innerText = 'Task not found!';
      titleEl.style.display = '';
    }
    if (descEl) descEl.innerHTML = '';
    if (contribEl) contribEl.innerHTML = '';
    if (listEl) listEl.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', renderTaskDetail);
document.addEventListener('turbo:load', renderTaskDetail);
document.addEventListener('page:change', renderTaskDetail);


// Handles tab switching between "Task Description" and "Code Interpreter"
export function setupTabSwitcher(task) {
  const descTab = document.getElementById('tab-desc');
  const codeTab = document.getElementById('tab-code');
  const descPanel = document.querySelector('.desc-panel');
  const codePanel = document.querySelector('.code-panel');
  if (!descTab || !codeTab || !descPanel || !codePanel) return;

  let editorInitialized = false;

  async function showPanel() {
    if (descTab.checked) {
      descPanel.classList.add('active');
      codePanel.classList.remove('active');
    } else {
      descPanel.classList.remove('active');
      codePanel.classList.add('active');
      // Only initialize ONCE per page load
      if (!editorInitialized) {
        await setupEditor(signatureToString(task?.signature));
        await setupRunner();
        editorInitialized = true;
      }
    }
  }

  descTab.addEventListener('change', showPanel);
  codeTab.addEventListener('change', showPanel);
  showPanel();
}

let lastTheme = document.documentElement.getAttribute('data-theme');
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.type === 'attributes' &&
      mutation.attributeName === 'data-theme'
    ) {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme !== lastTheme) {
        lastTheme = currentTheme;
        rerenderStaticCodeBlocks();
        updateEditorTheme();
      }
    }
  }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
