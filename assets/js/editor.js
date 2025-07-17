import {EditorView, lineNumbers, keymap, drawSelection} from "https://esm.sh/@codemirror/view";
import {python} from "https://esm.sh/@codemirror/lang-python";

import {githubDark, githubLight} from "https://esm.sh/@uiw/codemirror-theme-github";
import {Compartment} from "https://esm.sh/@codemirror/state";
import {lintKeymap} from "https://esm.sh/@codemirror/lint";
import {searchKeymap, highlightSelectionMatches as selectionMatches} from "https://esm.sh/@codemirror/search";

import {insertTab, history} from "https://esm.sh/@codemirror/commands";
import {autocompletion, closeBrackets, completeAnyWord} from "https://esm.sh/@codemirror/autocomplete";
import {indentOnInput} from "https://esm.sh/@codemirror/language";
import {
  buildTestField,
  buildReturnField,
  buildStdInField,
  buildStdOutField,
  readValue,
  html as htmlEl,
  uuid
} from '/assets/js/test-fields.js';
import { loadTaskState, saveTaskState } from '/assets/js/user-state.js';
import { callFromSignature } from '/assets/js/task-render-core.js';

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

// Save editor content on every change
function persistExtension(slug, state) {
  return EditorView.updateListener.of(update => {
    if (update.docChanged) {
      state.code = update.state.doc.toString();
      saveTaskState(slug, state);
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

  const state = slug ? loadTaskState(slug) : {};
  let savedDoc = state.code;
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
      autocompletion({override: [completeAnyWord]}),
      indentOnInput(),
      closeBrackets(),
      persistExtension(slug, state),
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
  const state = loadTaskState(task.slug);
  const runBtn = document.getElementById('run-code-btn');
  const testsList = document.getElementById('tests-list');
  const addTestBtn = document.getElementById('add-test');
  const statusRow = document.getElementById('runner-status');
  const hidePassedCB = document.getElementById('hide-passed');
  const hideSampleCB = document.getElementById('hide-sample');
  const stopBtn = document.getElementById('stop-code-btn');
  const timeoutInput = document.getElementById('test-timeout');
  const infoModal = document.getElementById('test-info-modal');
  const infoBody  = infoModal?.querySelector('.info-body');

  if(hidePassedCB) hidePassedCB.checked = state.hidePassed ?? true;
  if(hideSampleCB) hideSampleCB.checked = state.hideSample ?? true;
  if(timeoutInput) timeoutInput.value = state.timeout ?? 5;

  const editorContainer = document.getElementById('editor');
  if (!runBtn || !editorContainer || !testsList || !addTestBtn) return;

  const hasStdin  = task.tests?.some(t => 'stdin'  in t);
  const hasStdout = task.tests?.some(t => 'stdout' in t);


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
        ${hasStdin ? buildStdInField(tId) : ''}
        ${hasStdout ? buildStdOutField(tId) : ''}
        <span class="anchor-end io-end" aria-hidden="true"></span>
        <div class="item-actions">
          <button type="button" class="info-btn" title="Details">
            <span class="material-symbols-outlined">info</span>
          </button>
          <button type="button" class="del-btn"><span class="material-symbols-outlined delete-icon">delete</span></button>
        </div>
      </div>`;
  }

  function fillTest(el, data){
    for(const a of task.signature.args){
      const inp = el.querySelector(`.test-arg-input[data-idx="${a.name}"]`);
      if(!inp) continue;
      let val = data.args?.[a.name];
      if(a.type === 'bool'){
        const boolVal = Boolean(val);
        inp.dataset.value = boolVal ? 'true':'false';
        inp.textContent = boolVal ? 'true':'false';
      }else if(val !== undefined){
        inp.value = val;
      }
    }
    if(task.signature.return_type){
      const retInp = el.querySelector('.return-field .test-arg-input');
      if(retInp && 'return' in data){
        if(task.signature.return_type === 'bool'){
          const b = Boolean(data.return);
          retInp.dataset.value = b ? 'true':'false';
          retInp.textContent = b ? 'true':'false';
        }else{
          retInp.value = data.return;
        }
      }
    }
    if(hasStdin){
      const inp = el.querySelector('.stdin-field textarea');
      if(inp && data.stdin) inp.value = data.stdin;
    }
    if(hasStdout){
      const inp = el.querySelector('.stdout-field textarea');
      if(inp && 'stdout' in data) inp.value = typeof data.stdout === 'object' ? JSON.stringify(data.stdout) : data.stdout;
    }
  }

  function createTest(data = {}, sample = false){
    const el = testTemplate(uuid());
    if(sample) el.classList.add('sample-test');
    testsList.appendChild(el);
    fillTest(el, data);
    return el;
  }

  function serializeTest(el){
    const obj = { args:{} };
    for(const a of task.signature.args){
      const inp = el.querySelector(`.test-arg-input[data-idx="${a.name}"]`);
      if(inp) obj.args[a.name] = readValue(inp, a.type);
    }
    if(task.signature.return_type){
      const inp = el.querySelector('.return-field .test-arg-input');
      if(inp) obj.return = readValue(inp, task.signature.return_type);
    }
    if(hasStdin){
      const inp = el.querySelector('.stdin-field textarea');
      if(inp && inp.value) obj.stdin = inp.value;
    }
    if(hasStdout){
      const inp = el.querySelector('.stdout-field textarea');
      if(inp && inp.value) obj.stdout = inp.value;
    }
    return obj;
  }

  function saveCurrentState(){
    state.hidePassed = hidePassedCB?.checked;
    state.hideSample = hideSampleCB?.checked;
    state.timeout = parseInt(timeoutInput?.value || '5', 10);
    state.tests = [...testsList.querySelectorAll('.test-item')]
      .filter(el => !el.classList.contains('sample-test'))
      .map(serializeTest);
    saveTaskState(task.slug, state);
  }

  function addTest(){
    createTest();
    saveCurrentState();
  }
  addTestBtn.addEventListener('click', addTest);
  testsList.addEventListener('click', e => {
    if(e.target.closest('.del-btn')) {
      e.target.closest('.test-item').remove();
      saveCurrentState();
      return;
    }
    if(e.target.closest('.info-btn')) {
      const item = e.target.closest('.test-item');
      showInfoModal(JSON.parse(item.dataset.info || '{}'));
      return;
    }
  });
  testsList.addEventListener('click', e => {
    const btn = e.target.closest('.bool-toggle');
    if(!btn) return;
    const isTrue = btn.dataset.value === 'true';
    btn.dataset.value = isTrue ? 'false' : 'true';
    btn.textContent   = isTrue ? 'false' : 'true';
    saveCurrentState();
  });
  testsList.addEventListener('input', saveCurrentState);
  timeoutInput?.addEventListener('input', saveCurrentState);
  document.querySelector('.controls-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.step');
    if (!btn) return;
    const input = btn.closest('.input-wrapper')?.querySelector('input[type="number"]');
    if (!input) return;
    const step = Number(input.step) || 1;
    const min  = input.min === '' ? -Infinity : Number(input.min);
    const max  = input.max === '' ?  Infinity : Number(input.max);
    const val  = Number(input.value) || 0;
    const next = btn.classList.contains('up') ? val + step : val - step;
    input.value = Math.min(max, Math.max(min, next));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  task.tests?.forEach(t => createTest(t, true));
  state.tests?.forEach(t => createTest(t));
  updateVisibility();

  function updateVisibility(){
    const hidePassed = hidePassedCB?.checked;
    const hideSample = hideSampleCB?.checked;
    testsList.querySelectorAll('.test-item').forEach(item => {
      const passed = item.classList.contains('pass');
      const sample = item.classList.contains('sample-test');
      item.style.display = (hidePassed && passed) || (hideSample && sample) ? 'none' : '';
    });
  }

  hidePassedCB?.addEventListener('change', () => { updateVisibility(); saveCurrentState(); });
  hideSampleCB?.addEventListener('change', () => { updateVisibility(); saveCurrentState(); });

  // Disable run button while loading Pyodide
  runBtn.disabled = true;
  if(statusRow) statusRow.textContent = 'Loading interpreter...';

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
    if(statusRow) statusRow.textContent = 'Failed to load interpreter';
    runBtn.disabled = true;
    return;
  }

  let interruptArr;
  if (typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated) {
    interruptArr = new Int32Array(new SharedArrayBuffer(4));
    pyodide.setInterruptBuffer(interruptArr);
  } else {
    console.warn('SharedArrayBuffer not available; interrupt disabled');
  }
  let running = false;
  stopBtn.disabled = true;

  runBtn.disabled = false;
  runBtn.title = "Run code";
  if(statusRow) statusRow.textContent = '';

  runBtn.onclick = async () => {
    saveCurrentState();
    running = true;
    runBtn.disabled = true;
    stopBtn.disabled = false;

    let code = "";
    if (editorContainer.cmView) {
      code = editorContainer.cmView.state.doc.toString();
    }

    if(statusRow) statusRow.textContent = 'Running tests...';

    const tests = [...testsList.querySelectorAll('.test-item')];
    const timeoutSec = parseInt(timeoutInput?.value || '5', 10);
    let passedCount = 0;
    for(let i=0; i<tests.length; i++){
      const testEl = tests[i];
      testEl.classList.remove('pass','fail');
      if(statusRow) statusRow.textContent = `Running tests ${i+1}/${tests.length}`;
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

      const callLine = callFromSignature(task.signature, args, 40);
      let info = { call: callLine };
      if(stdin) info.stdin = stdin;
      if(retInp) info.expectedReturn = expectedReturn;
      if(stdoutInp) info.expectedStdout = expectedStdout;
      let timer;
      try {
        if(interruptArr && timeoutSec > 0){
          interruptArr[0] = 0;
          timer = setTimeout(() => { interruptArr[0] = 2; }, timeoutSec * 1000);
        }
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

        const resStr = await pyodide.runPythonAsync(
          code.replace(/\t/g, '    ') + '\n' + snippet
        );
        if(timer) clearTimeout(timer);
        if(interruptArr) interruptArr[0] = 0;
        const res = JSON.parse(resStr);

        let ok = true;
        if(retInp){
          ok = ok && JSON.stringify(res.return) === JSON.stringify(expectedReturn);
        }
        if(stdoutInp){
          ok = ok && res.stdout.trim() === expectedStdout;
        }
        if(retInp || res.return !== undefined) info.return = res.return;
        if(stdoutInp || res.stdout.trim()) info.stdout = res.stdout.trim();
        testEl.classList.add(ok ? 'pass' : 'fail');
        if(ok) passedCount++;
      } catch(err){
        if(timer) clearTimeout(timer);
        testEl.classList.add('fail');
        info.error = err.message || String(err);
      }
      testEl.dataset.info = JSON.stringify(info);
    }
    if(statusRow){
      const pct = Math.round((passedCount/tests.length)*100);
      statusRow.textContent = `Passed tests: ${passedCount}/${tests.length} (${pct}%)`;
    }
    updateVisibility();
    running = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
  };

  stopBtn.onclick = () => {
    if(!running || !interruptArr) return;
    interruptArr[0] = 2;
  };

  infoModal?.addEventListener('click', e => {
    if(e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay'))
      infoModal.classList.remove('open');
  });
  document.addEventListener('keyup', e => {
    if(e.key === 'Escape') infoModal?.classList.remove('open');
  });

  function showInfoModal(info){
    if(!infoModal || !infoBody) return;
    const esc = t => t == null ? '' : String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    let html = `<div class="io-block call"><span class="io-label">Call</span><pre><code class="language-python-codemirror">${esc(info.call)}</code></pre></div>`;
    if(info.stdin){
      html += `<div class="io-block input"><span class="io-label">stdin</span><div class="io-surface">${esc(info.stdin)}</div></div>`;
    }
    if('return' in info || 'expectedReturn' in info){
      html += `<div class="io-row"><div><div class="io-label">return</div><div class="io-surface">${esc(JSON.stringify(info.return))}</div></div>`;
      html += `<div><div class="io-label">expected</div><div class="io-surface">${esc(JSON.stringify(info.expectedReturn))}</div></div></div>`;
    }
    if('expectedStdout' in info || 'stdout' in info){
      html += `<div class="io-row"><div><div class="io-label">stdout</div><div class="io-surface">${esc(info.stdout)}</div></div><div><div class="io-label">expected stdout</div><div class="io-surface">${esc(info.expectedStdout)}</div></div></div>`;
    }
    if(info.error){
      html += `<div><div class="io-label">error</div><div class="io-surface">${esc(info.error)}</div></div>`;
    }
    infoBody.innerHTML = html;
    renderReadOnlyCodeBlocks();
    renderReadOnlyInputOutputBlocks();
    infoModal.classList.add('open');
  }
}


// setupRunner is invoked from task-page.js once the code panel becomes visible

