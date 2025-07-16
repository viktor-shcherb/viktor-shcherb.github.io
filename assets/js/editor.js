import {EditorView, lineNumbers, keymap, drawSelection} from "https://esm.sh/@codemirror/view";
import {python} from "https://esm.sh/@codemirror/lang-python";

import {githubDark, githubLight} from "https://esm.sh/@uiw/codemirror-theme-github";
import {Compartment} from "https://esm.sh/@codemirror/state";
import {lintKeymap} from "https://esm.sh/@codemirror/lint";
import {searchKeymap, highlightSelectionMatches as selectionMatches} from "https://esm.sh/@codemirror/search";

import {insertTab, history} from "https://esm.sh/@codemirror/commands";
import {autocompletion, closeBrackets} from "https://esm.sh/@codemirror/autocomplete";
import {
  buildTestField,
  buildReturnField,
  buildStdInField,
  buildStdOutField,
  readValue,
  html as htmlEl,
  uuid
} from '/assets/js/test-fields.js';

const themeCompartment = new Compartment();

export function updateEditorTheme() {
  const effect = themeCompartment.reconfigure(getThemeExtension());

  const editorContainer = document.getElementById("editor");
  if (editorContainer && editorContainer.cmView) {
    editorContainer.cmView.dispatch({ effects: effect });
  }

  document.querySelectorAll('.cm-static-view').forEach(el => {
    if (el.cmView) {
      el.cmView.dispatch({ effects: effect });
    }
  });
}

// Helper: key for storage (can be per-page, or global)
function storageKey(slug) {
  return slug ? `cm-editor-doc:${slug}` : "cm-editor-doc";
}

// Save on every change
function persistExtension(key) {
  return EditorView.updateListener.of(update => {
    if (update.docChanged) {
      localStorage.setItem(key, update.state.doc.toString());
    }
  });
}


function getThemeExtension() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? githubDark
    : githubLight;
}

const customTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--surface) !important",
  },
  ".cm-gutters": {
    backgroundColor: "var(--surface) !important",
    border: "none",
  }
});

export async function setupEditor(initialDoc, slug = null) {
  const editorContainer = document.getElementById("editor");
  if (!editorContainer) return;

  // Remove any existing editor
  if (editorContainer.cmView) {
    editorContainer.cmView.destroy();
    editorContainer.cmView = null;
  }

  // Only initialize if visible
  const isVisible = !!(editorContainer.offsetWidth || editorContainer.offsetHeight || editorContainer.getClientRects().length);
  if (!isVisible) return;

  const key = storageKey(slug);
  // Priority: localStorage > provided argument > default
  let savedDoc = localStorage.getItem(key);
  if (!savedDoc) {
    savedDoc = typeof initialDoc === "string" ? initialDoc : "# Write your Python code here\nprint('Hello!')";
  }

  editorContainer.cmView = new EditorView({
    doc: savedDoc,
    parent: editorContainer,
    extensions: [
      keymap.of([
        {key: "Tab", run: insertTab},
        ...searchKeymap,
        ...lintKeymap
      ]),
      history(),
      drawSelection(),
      selectionMatches(),
      autocompletion(),
      closeBrackets(),
      persistExtension(key),
      lineNumbers(),
      themeCompartment.of(getThemeExtension()),
      python(),
      customTheme
    ]
  });
}

/* --- STATIC CODE BLOCK RENDERING --- */

export function renderReadOnlyCodeBlocks() {
  // For every <pre><code class="language-python-codemirror">...</code></pre>
  document.querySelectorAll('pre code.language-python-codemirror').forEach(block => {
    // Get code text (trim whitespace)
    const code = block.textContent.replace(/^\n+|\n+$/g, '');

    // Create a container for CodeMirror
    const wrapper = document.createElement('div');
    wrapper.className = "cm-static-view";
    wrapper.id = block.id;
    wrapper.setAttribute('data-code', code); // <-- Store code for re-theming
    block.parentNode.replaceWith(wrapper);

    // Create read-only CodeMirror view
    wrapper.cmView = new EditorView({
      doc: code,
      extensions: [
        python(),
        themeCompartment.of(getThemeExtension()),
        EditorView.editable.of(false),
        customTheme
      ],
      parent: wrapper
    });
  });
}


const customThemeStatic = EditorView.theme({
  "&": {
    backgroundColor: "var(--surface) !important",
  },
  ".cm-gutters": {
    backgroundColor: "var(--surface) !important",
    border: "none",
  },
  ".cm-content": {
    color: "var(--text) !important"
  }
});


export function renderReadOnlyInputOutputBlocks() {
  // For every <pre><code class="language-python">...</code></pre>
  document.querySelectorAll('pre code.language-io-codemirror').forEach(block => {

    // Get code text (trim whitespace)
    const code = block.textContent.replace(/^\n+|\n+$/g, '');

    // Create a container for CodeMirror
    const wrapper = document.createElement('div');
    wrapper.className = "cm-static-view";
    block.parentNode.replaceWith(wrapper);

    // Create read-only CodeMirror view
    wrapper.cmView = new EditorView({
      doc: code,
      extensions: [
        themeCompartment.of(getThemeExtension()),
        EditorView.editable.of(false),
          customThemeStatic
      ],
      parent: wrapper
    });
  });
}


let pyodideReadyPromise = null;

export async function setupRunner(task) {
  const runBtn = document.getElementById('run-code-btn');
  const testsList = document.getElementById('tests-list');
  const addTestBtn = document.getElementById('add-test');
  const codeOutputWrapper = document.getElementById('output-wrapper');
  function setCodeOutput(text) {
    codeOutputWrapper.firstElementChild.innerHTML = `<pre><code class="language-io-codemirror">${text}</code></pre>`;
    renderReadOnlyInputOutputBlocks();
  }

  const editorContainer = document.getElementById('editor');
  if (!runBtn || !editorContainer || !testsList || !addTestBtn) return;


  function testTemplate(tId){
    const argFields = task.signature.args.map(a =>
      buildTestField({tId, argIdx:a.name, argName:a.name, argType:a.type})
    ).join('');
    const ret = task.signature.return_type ? buildReturnField(tId, task.signature.return_type) : '';
    return htmlEl/*html*/`
      <div class="test-item" data-test-id="${tId}">
        ${argFields}
        <span class="anchor-end args-end" aria-hidden="true"></span>
        ${ret}
        <span class="anchor-end return-end" aria-hidden="true"></span>
        ${buildStdInField(tId)}
        ${buildStdOutField(tId)}
        <span class="anchor-end io-end" aria-hidden="true"></span>
        <div class="item-actions">
          <button type="button" class="del-btn"><span class="material-symbols-outlined delete-icon">delete</span></button>
        </div>
      </div>`;
  }

  function addTest(){ testsList.appendChild(testTemplate(uuid())); }
  addTestBtn.addEventListener('click', addTest);
  testsList.addEventListener('click', e => {
    if(e.target.closest('.del-btn')) e.target.closest('.test-item').remove();
  });
  testsList.addEventListener('click', e => {
    const btn = e.target.closest('.bool-toggle');
    if(!btn) return;
    const isTrue = btn.dataset.value === 'true';
    btn.dataset.value = isTrue ? 'false' : 'true';
    btn.textContent   = isTrue ? 'false' : 'true';
  });
  addTest();

  // Disable run button while loading Pyodide
  runBtn.disabled = true;
  setCodeOutput("⏳ Loading Python interpreter...");
  codeOutputWrapper.style.display = "";

  // Only load Pyodide once
  if (!pyodideReadyPromise) {
    if (window.loadPyodide) {
      pyodideReadyPromise = window.loadPyodide();
    } else {
      pyodideReadyPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.onload = () => window.loadPyodide().then(resolve).catch(reject);
        script.onerror = () => reject('Pyodide not loaded');
        document.head.appendChild(script);
      });
    }
  }

  let pyodide;
  try {
    pyodide = await pyodideReadyPromise;
  } catch (e) {
    setCodeOutput("❌ Failed to load Python environment");
    runBtn.disabled = true;
    return;
  }

  runBtn.disabled = false;
  runBtn.title = "Run code";
  codeOutputWrapper.style.display = "none";

  runBtn.onclick = async () => {
    let code = "";
    if (editorContainer.cmView) {
      code = editorContainer.cmView.state.doc.toString();
    }

    setCodeOutput("⏳ Running...");
    codeOutputWrapper.style.display = "";

    const tests = [...testsList.querySelectorAll('.test-item')];

    for(const testEl of tests){
      testEl.classList.remove('pass','fail');
      const args = {};
      for(const a of task.signature.args){
        const inp = testEl.querySelector(`.test-arg-input[data-idx="${a.name}"]`);
        if(!inp) continue;
        const val = readValue(inp, a.type);
        args[a.name] = val;
      }
      const retInp = testEl.querySelector('.return-field .test-arg-input');
      const expectedReturn = retInp
          ? readValue(retInp, task.signature.return_type)
          : undefined;
      const stdin = testEl.querySelector('.stdin-field textarea')?.value || '';
      const stdoutInp = testEl.querySelector('.stdout-field textarea');
      const expectedStdout = stdoutInp ? stdoutInp.value.trim() : undefined;

      try {
        const snippet = String.raw`
import json, sys
from io import StringIO

input_data = ${JSON.stringify(stdin)}
class PatchedInput:
    def __init__(self, data):
        self.lines = data.splitlines()
        self.index = 0
    def __call__(self, prompt=None):
        if self.index < len(self.lines):
            line = self.lines[self.index]
            self.index += 1
            return line
        raise EOFError('No more input')
_input = PatchedInput(input_data)
__builtins__.input = _input
_out_buf = StringIO()
_sys_out = sys.stdout
sys.stdout = _out_buf
args = json.loads('${JSON.stringify(args)}')
result = ${task.signature.name}(**args)
sys.stdout = _sys_out
json.dumps({'return': result, 'stdout': _out_buf.getvalue()})`;

        const resStr = await pyodide.runPythonAsync(code + '\n' + snippet);
        const res = JSON.parse(resStr);

        let ok = true;
        if(retInp){
          ok = ok && JSON.stringify(res.return) === JSON.stringify(expectedReturn);
        }
        if(stdoutInp){
          ok = ok && res.stdout.trim() === expectedStdout;
        }

        testEl.classList.add(ok ? 'pass' : 'fail');
      } catch(err){
        testEl.classList.add('fail');
      }
    }
  };
}


// setupRunner is invoked from task-page.js once the code panel becomes visible

