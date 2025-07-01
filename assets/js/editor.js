import {EditorView, lineNumbers, keymap, drawSelection} from "https://esm.sh/@codemirror/view";
import {python} from "https://esm.sh/@codemirror/lang-python";

import {githubDark, githubLight} from "https://esm.sh/@uiw/codemirror-theme-github";
import {Compartment} from "https://esm.sh/@codemirror/state";
import {lintKeymap} from "https://esm.sh/@codemirror/lint";
import {searchKeymap, highlightSelectionMatches as selectionMatches} from "https://esm.sh/@codemirror/search";

import {insertTab, history} from "https://esm.sh/@codemirror/commands";
import {autocompletion, closeBrackets} from "https://esm.sh/@codemirror/autocomplete";

const themeCompartment = new Compartment();

export function updateEditorTheme() {
  const editorContainer = document.getElementById("editor");
  if (!editorContainer || !editorContainer.cmView) return;
  editorContainer.cmView.dispatch({
    effects: themeCompartment.reconfigure(getThemeExtension())
  });
}

// Helper: key for storage (can be per-page, or global)
const STORAGE_KEY = "cm-editor-doc";

// Save on every change
function persistExtension() {
  return EditorView.updateListener.of(update => {
    if (update.docChanged) {
      localStorage.setItem(STORAGE_KEY, update.state.doc.toString());
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

export async function setupEditor(initialDoc) {
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

  // Priority: localStorage > provided argument > default
  let savedDoc = localStorage.getItem(STORAGE_KEY);
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
      persistExtension(),
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
    wrapper.setAttribute('data-code', code); // <-- Store code for re-theming
    block.parentNode.replaceWith(wrapper);

    // Create read-only CodeMirror view
    new EditorView({
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

export function rerenderStaticCodeBlocks() {
  document.querySelectorAll('.cm-static-view').forEach(wrapper => {
    const code = wrapper.getAttribute('data-code');
    if (code == null) return;
    const parent = wrapper.parentNode;
    const newWrapper = document.createElement('div');
    newWrapper.className = 'cm-static-view';
    newWrapper.setAttribute('data-code', code);
    parent.replaceChild(newWrapper, wrapper);

    new EditorView({
      doc: code,
      extensions: [
        python(),
        themeCompartment.of(getThemeExtension()),
        EditorView.editable.of(false),
        customTheme
      ],
      parent: newWrapper
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
    new EditorView({
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
  const codeOutput = document.getElementById('code-output');
  const codeInput = document.getElementById('code-input');
  const editorContainer = document.getElementById('editor');
  if (!runBtn || !codeOutput || !editorContainer) return;

  // Disable run button while loading Pyodide
  runBtn.disabled = true;
  codeOutput.textContent = "⏳ Loading Python interpreter...";
  codeOutputWrapper.style.display = "";

  // Only load Pyodide once
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = window.loadPyodide ? window.loadPyodide() : Promise.reject("Pyodide not loaded");
  }

  let pyodide;
  try {
    pyodide = await pyodideReadyPromise;
  } catch (e) {
    codeOutput.textContent = "❌ Failed to load Python environment.";
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

    codeOutput.textContent = "⏳ Running...";
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
      let errOutput = "";
      pyodide.setStdout({
        batched: (s) => output += s,
      });
      pyodide.setStderr({
        batched: (s) => errOutput += s,
      });

      await pyodide.runPythonAsync(code);

      codeOutput.textContent = output || errOutput || "[No output]";
    } catch (err) {
      codeOutput.textContent = "❌ Error:\n" + (err.message || err.toString());
    }
  };
}


// Call setupRunner after DOM ready:
document.addEventListener("DOMContentLoaded", setupRunner);
document.addEventListener("turbo:load", setupRunner);
document.addEventListener("page:change", setupRunner);

