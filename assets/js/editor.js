import {EditorView, lineNumbers, keymap, drawSelection} from "https://esm.sh/@codemirror/view?bundle&external=@codemirror/state";
import {python} from "https://esm.sh/@codemirror/lang-python?bundle&external=@codemirror/state";

import {githubDark, githubLight} from "https://esm.sh/@uiw/codemirror-theme-github?bundle&external=@codemirror/state";
import {Compartment} from "https://esm.sh/@codemirror/state";
import {lintKeymap} from "https://esm.sh/@codemirror/lint?bundle&external=@codemirror/state";
import {searchKeymap, highlightSelectionMatches as selectionMatches} from "https://esm.sh/@codemirror/search?bundle&external=@codemirror/state";

import {insertTab, history} from "https://esm.sh/@codemirror/commands?bundle&external=@codemirror/state";
import {autocompletion, closeBrackets} from "https://esm.sh/@codemirror/autocomplete?bundle&external=@codemirror/state";

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

export async function setupRunner() {
  const runBtn = document.getElementById('run-code-btn');
  const codeOutputWrapper = document.getElementById('output-wrapper');
  // a helper to (re)fetch the current <code> element
  function setCodeOutput(text) {
    codeOutputWrapper.firstElementChild.innerHTML = `<pre><code class="language-io-codemirror">${text}</code></pre>`;
    renderReadOnlyInputOutputBlocks();
  }

  const codeInput = document.getElementById('code-input');
  const editorContainer = document.getElementById('editor');
  if (!runBtn || !editorContainer) return;

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
    const stdin = codeInput.value;

    setCodeOutput("⏳ Running...")
    codeOutputWrapper.style.display = "";

    try {
      pyodide.globals.set("input_data", stdin);
      pyodide.runPython(`
import sys
from io import StringIO

class PatchedInput:
    def __init__(self, data):
        self.lines = data.splitlines()
        self.index = 0
    def __call__(self, prompt=None):
        if self.index < len(self.lines):
            line = self.lines[self.index]
            self.index += 1
            return line
        else:
            raise EOFError("No more input")

_input = PatchedInput(input_data)
__builtins__.input = _input
`);
      // Capture stdout/stderr
      let output = "";

      function appendChunk(text) {
        output += text + '\n';             // fresh reference
        setCodeOutput(output)
      }

      pyodide.setStdout({ batched: appendChunk });
      pyodide.setStderr({ batched: appendChunk });

      await pyodide.runPythonAsync(code);
    } catch (err) {
      let codeOutput = codeOutputWrapper.firstElementChild;

      let error_msg = "❌ Error:\n" + (err.message || err.toString());
      setCodeOutput(error_msg);
    }
  };
}


// Call setupRunner after DOM ready:
document.addEventListener("DOMContentLoaded", setupRunner);
document.addEventListener("turbo:load", setupRunner);
document.addEventListener("page:change", setupRunner);

