import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/+esm";
import { initTabSwitcher }  from '/assets/js/tab-switcher.js';
import { renderTask } from '/assets/js/task-render.js';


const TYPE_KEYS  = ['int', 'float', 'str', 'bool'];
const TYPE_LABEL = {
  int:   'Integer',
  float: 'Float',
  str:   'String',
  bool:  'Boolean',
};
const TYPE_DEFS = {
  int: {
    label: 'Integer',
    makeInput: ({ id, idx }) => `
      <div class="input-wrapper">
        <input id="${id}" class="test-arg-input" data-idx="${idx}"
               type="number" step="1" placeholder="0">
        <div class="stepper">
          <button type="button" class="step up"   aria-label="increment">+</button>
          <button type="button" class="step down" aria-label="decrement">−</button>
        </div>
      </div>`,
  },
  float: {
    label: 'Float',
    makeInput: ({ id, idx }) => `
      <div class="input-wrapper-float">
        <input id="${id}" class="test-arg-input" data-idx="${idx}"
                type="number" step="any" placeholder="0.0">
      </div>`,
  },
  str: {
    label: 'String',
    makeInput: ({ id, idx }) =>
      `<input id="${id}" class="test-arg-input" data-idx="${idx}"
              type="text" placeholder="text">`,
  },
  bool: {
    label: 'Boolean',
    makeInput: ({ id, idx }) => `
      <button id="${id}"
              class="test-arg-input bool-toggle bool-field"
              data-idx="${idx}"
              data-value="false"
              type="button">
        false
      </button>`,
  },
};

function typeToClass(type){
  switch (type){
    case 'bool':              return 'bool-field';
    case 'int':
    case 'float':             return 'number-field';
    case 'str':               return 'string-field';
    default:                  return '';            // no type selected yet
  }
}

function buildTestField({ tId, argIdx, argName, argType }){
  /* decide which class the wrapper should get */
  const typeClass = typeToClass(argType);

  /* fallback placeholder when no type yet */
  if (!argType){
    return `
      <div class="test-field ${typeClass}">
        <label for="${tId}-${argIdx}">${argName}</label>
        <input class="test-arg-input"
               data-idx="${argIdx}"
               id="${tId}-${argIdx}"
               disabled
               placeholder="Select type first...">
      </div>`;
  }

  /* normal path */
  const inputHTML =
    (TYPE_DEFS[argType] ?? TYPE_DEFS.str)
      .makeInput({ id: `${tId}-${argIdx}`, idx: argIdx });

  return `
    <div class="test-field ${typeClass}">
      <label for="${tId}-${argIdx}">${argName}</label>
      ${inputHTML}
    </div>`;
}


function buildReturnField(tId, type){
  const typeClass = typeToClass(type);

  /* show disabled placeholder if the user hasn’t chosen a type yet */
  if (!type){
    return `
      <div class="test-field return-field ${typeClass}">
        <label for="${tId}-return">return</label>
        <input class="test-arg-input"
               data-idx="return"
               disabled
               placeholder="Select type first...">
      </div>`;
  }

  /* normal path once a type is selected */
  const inner = (TYPE_DEFS[type] ?? TYPE_DEFS.str)
                  .makeInput({ id:`${tId}-return`, idx:'return' });

  return `
    <div class="test-field return-field ${typeClass}">
      <label for="${tId}-return">return</label>
      ${inner}
    </div>`;
}

function buildStdInField(tId){
  return `
    <div class="test-field full-row io-field stdin-field">
      <label for="${tId}-stdin">stdin</label>
      <textarea id="${tId}-stdin"
                name="testStdin"
                class="auto-grow"
                rows="1"
                placeholder="Input sent to stdin"></textarea>
    </div>`;
}

function buildStdOutField(tId){
  return `
    <div class="test-field full-row io-field stdout-field">
      <label for="${tId}-stdout">stdout</label>
      <textarea id="${tId}-stdout"
                name="testStdout"
                class="auto-grow"
                rows="1"
                placeholder="Expected stdout"></textarea>
    </div>`;
}

function readValue(el, type) {
  if (type === 'bool') {
    // our bool field is a <button> with a data-value attr
    return el.dataset.value === 'true';
  }
  if (type === 'int')   return el.value === '' ? null : parseInt(el.value, 10);
  if (type === 'float') return el.value === '' ? null : parseFloat(el.value);
  /* str  or fallback */
  return el.value;
}


/* lazy boot + open */
document.addEventListener('click', e => {
  if (!e.target.closest('#contribute-btn')) return;

  const modal = document.getElementById('contribute-modal');
  if (!modal) return;

  if (!modal.dataset.bound) {
    setupContribute(modal);   // ← one-time wiring
  }
  modal.classList.add('open');
});


export function setupContribute(modal) {
  if (!modal || modal.dataset?.bound) return;
  modal.dataset.bound = '1';

  /* ────────── wire up the tab switching logic ────────── */
  initTabSwitcher(modal);
  modal.addEventListener('tabshown', e => {
    if (e.detail.panel.id !== 'panel-preview') return;      // only run on preview

    // build a task object from form fields
    const fakeTask = collectTaskFromForm();

    // clear previous preview
    e.detail.panel.innerHTML = '<hr style="margin:1.5rem 0;">';

    // clone both template snippets into the panel
    const headClone = document.getElementById('task-head-template')
                              .content.cloneNode(true);
    const bodyClone = document.getElementById('task-body-template')
                              .content.cloneNode(true);

    e.detail.panel.appendChild(headClone);
    e.detail.panel.appendChild(bodyClone);

    // now render
    renderTask(fakeTask, e.detail.panel);
  });

  function collectTaskFromForm() {
    const argDefs = [...modal.querySelectorAll('#args-list .arg-item')].map(row => ({
      idx:  row.dataset.idx,                                    // ← uuid
      name: row.querySelector('.name-input').value || 'x',
      type: row.querySelector('.type-select').value || undefined
    }));

    const task = {
      title:       modal.querySelector('#title').value,
      description: modal.querySelector('#description').value,
      signature: {
        name: modal.querySelector('#functionName').value || 'func',
        args: argDefs.map(({ name, type }) => ({ name, type }))   // idx stripped
      },
      tests: [],       // <- see below
      contributor: null
    };

    /* optional return-type */
    if (modal.querySelector('#hasReturn').checked) {
      task.signature.return_type =
        modal.querySelector('#returnType').value || 'None';
    }

    // ─── tests  ─────────────────────────────────────────────────────────
    task.tests = [...modal.querySelectorAll('#tests-list .test-item')].map(testEl => {
      const out   = {};
      const args  = {};

      /* positional / keyword arguments ----------------------- */
      for (const def of argDefs) {
        const inp = testEl.querySelector(
          `.test-arg-input[data-idx="${def.idx}"]`
        );
        if (!inp) continue;                       // arg was deleted afterwards
        const v = readValue(inp, def.type);
        if (v !== null && v !== '') args[def.name] = v;
      }
      if (Object.keys(args).length) out.args = args;

      /* return value ----------------------------------------- */
      if (modal.querySelector('#hasReturn').checked) {
        const retInp = testEl.querySelector('.return-field .test-arg-input');
        if (retInp) {
          const v = readValue(
            retInp,
            modal.querySelector('#returnType').value
          );
          if (v !== null && v !== '') out.return = v;
        }
      }

      /* stdin / stdout --------------------------------------- */
      const stdin  = testEl.querySelector('.stdin-field  textarea')?.value.trim();
      const stdout = testEl.querySelector('.stdout-field textarea')?.value.trim();
      if (stdin)  out.stdin  = stdin;
      if (stdout) out.stdout = stdout;

      return out;
    });

    return task;
  }

  async function makeIssueMarkdown(){
    /* 1 ─ fetch the raw issue-template markdown from GitHub  */
    const rawURL =
      'https://raw.githubusercontent.com/viktor-shcherb/' +
      'viktor-shcherb.github.io/master/.github/ISSUE_TEMPLATE/new-task.md';

    const res = await fetch(rawURL);
    if (!res.ok) throw new Error(`unable to fetch template (${res.status})`);
    let templateMD = (await res.text())
        /* strip YAML front-matter at the very top ------------------ */
        .replace(/^---[\s\S]*?---\s*/, '');

    /* 2 ─ find every  ```json …``` fence                       */
    const fences = [...templateMD.matchAll(/```json\s+([\s\S]*?)```/g)];

    if (!fences.length) throw new Error('No JSON blocks found in template');

    /* helper that decides “is this the skeleton we expect?”   */
    const looksLikeTask = obj =>
          obj && typeof obj === 'object' &&
          'title' in obj && 'description' in obj &&
          'tests' in obj && Array.isArray(obj.tests);

    /* 3 ─ pick the first JSON fence that parses & matches keys */
    let skeleton, fenceText;
    for (const m of fences){
      try{
        const parsed = JSON.parse(m[1]);
        if (looksLikeTask(parsed)){ skeleton = parsed; fenceText = m[0]; break; }
      }catch{ /* ignore malformed */ }
    }
    if (!skeleton) throw new Error('No matching task-JSON skeleton found');

    /* 4 ─ build the “filled” object from the form  */
    const filled = collectTaskFromForm();

    /* 5 ─ stringify (pretty-print) and substitute in the markdown  */
    const prettyJSON = JSON.stringify(filled, null, 2);
    const filledFence = '```json\n' + prettyJSON + '\n```';

    return templateMD.replace(fenceText, filledFence);
  }


  /* ────────── tiny helpers ────────── */
  const $  = (sel, scope = modal) => scope.querySelector(sel);
  const $$ = (sel, scope = modal) => [...scope.querySelectorAll(sel)];

  const uuid = () => crypto.randomUUID();          // unique id for args/tests
  const html = (strings, ...vals) =>
    Object.assign(document.createElement('template'), {
      innerHTML: String.raw(strings, ...vals).trim(),
    }).content.firstElementChild;

  /* ────────── wire up the modal ────────── */
  modal?.addEventListener('click', e => {
    if (
      e.target.closest('.modal-close') ||
      e.target.classList.contains('modal-overlay')
    ) modal.classList.remove('open');
  });
  document.addEventListener('keyup', e => e.key === 'Escape' && modal.classList.remove('open'));

  /* ────────── dynamic lists ────────── */
  const argsList  = $('#args-list');
  const testsList = $('#tests-list');

  /* initial Sortable instances */
  Sortable.create(argsList,  {
    handle: '.drag-handle',
    animation: 150,
    onEnd: reorderTestInputs,
  });
  Sortable.create(testsList, {
    handle: '.drag-handle',
    animation: 150,
  });

  /* add-item buttons */
  $('#add-arg')?.addEventListener('click', () => addArg());
  $('#add-test')?.addEventListener('click', () => addTest());

  modal.addEventListener('click', e => {
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

  /* event delegation for args */
  argsList.addEventListener('input',  e => {
    if (e.target.matches('.name-input')) {
      const idx = e.target.dataset.idx;
      syncArgName(idx, e.target.value.trim() || '??');
    }
  });
  argsList.addEventListener('click', e => {
    if (e.target.closest('.del-btn')) {
      const wrap = e.target.closest('.arg-item');
      removeArg(wrap.dataset.idx);
      wrap.remove();
    }
  });
  argsList.addEventListener('change', e => {
    if (!e.target.matches('.type-select')) return;
    const idx     = e.target.dataset.idx;
    const newType = e.target.value;
    updateArgTypeInTests(idx, newType);
  });

  /* event delegation for tests */
  testsList.addEventListener('click', e => {
    if (e.target.closest('.del-btn')) {
      e.target.closest('.test-item').remove();
    }
  });
  testsList.addEventListener('click', e => {
    const btn = e.target.closest('.bool-toggle');
    if (!btn) return;

    const isTrue = btn.dataset.value === 'true';
    btn.dataset.value = isTrue ? 'false' : 'true';
    btn.textContent   = isTrue ? 'false' : 'true';   // or any icons you like
  });

  /* ────────── return-type toggle ────────── */
  const hasReturnCB   = modal.querySelector('#hasReturn');
  const returnTypeSel = modal.querySelector('#returnType');

  hasReturnCB.addEventListener('change', () => {
    returnTypeSel.disabled = !hasReturnCB.checked;
    if (!hasReturnCB.checked) returnTypeSel.value = '';

    syncReturnFields()
  });
  returnTypeSel.addEventListener('change', syncReturnFields);

  /* ────────── I/O fields checkboxes  ────────── */
  const enableStdinCB  = modal.querySelector('#enableStdin');
  const enableStdoutCB = modal.querySelector('#enableStdout');

  enableStdinCB.addEventListener('change', syncIOFields);
  enableStdoutCB.addEventListener('change', syncIOFields);

  /* ────────── template HTML ────────── */
  function argTemplate(idx, name = `arg${idx}`, type = '') {
    return html/*html*/`
      <div class="arg-item" data-idx="${idx}">
        <input class="name-input" placeholder="x" value="${name}" data-idx="${idx}">
        <select class="type-select" required data-idx="${idx}">
          <option value="" disabled selected>Select type...</option>
          ${TYPE_KEYS.map(t => `<option value="${t}">${TYPE_LABEL[t]}</option>`).join('')}
        </select>
        <div class="item-actions">
          <button type="button" class="del-btn">
            <span class="material-symbols-outlined">delete</span>
          </button>
          <span class="material-symbols-outlined drag-handle">drag_indicator</span>
        </div>
      </div>`;
  }

  function testTemplate(tId, args) {
    const argFields = args
      .map(a => buildTestField({
        tId,
        argIdx:  a.idx,
        argName: a.name,
        argType: a.type,
      }))
      .join('');

    return html/*html*/`
      <div class="test-item" data-test-id="${tId}">
        ${argFields}
        <span class="anchor-end args-end" aria-hidden="true"></span>
        ${ hasReturnCB.checked
          ? buildReturnField(tId, returnTypeSel.value)
          : '' }
        <span class="anchor-end return-end" aria-hidden="true"></span>
        ${ enableStdinCB.checked  ? buildStdInField(tId)  : '' }
        ${ enableStdoutCB.checked ? buildStdOutField(tId) : '' }
        <span class="anchor-end io-end" aria-hidden="true"></span>
        <div class="item-actions">
          <button type="button" class="del-btn">
            <span class="material-symbols-outlined">delete</span>
          </button>
          <span class="material-symbols-outlined drag-handle">drag_indicator</span>
        </div>
      </div>`;
  }

  /* ────────── add / remove items ────────── */
  function addArg(name = '', type = '') {
    const idx = uuid();
    const el  = argTemplate(idx, name, type);
    argsList.appendChild(el);
    appendArgToTests(idx);
  }

  function removeArg(idx) {
    $$(`[data-idx="${idx}"]`, testsList).forEach(inp => inp.closest('.test-field')?.remove());
  }

  function addTest() {
    const tId  = uuid();
    const args = $$('.arg-item[data-idx]', argsList).map(n => ({
      idx: n.dataset.idx,
      name: n.querySelector('.name-input').value.trim() || '??',
      type: n.querySelector('.type-select').value,
    }));
    testsList.appendChild(testTemplate(tId, args));
  }

  /* ────────── sync helpers ────────── */
  function syncArgName(idx, newName) {
    $$(`.test-arg-input[data-idx="${idx}"]`, testsList)
      .forEach(inp => inp.closest('.test-field').querySelector('label').textContent = newName);
  }

  function syncReturnFields(){
    $$('.test-item', testsList).forEach(test => {
      let field = test.querySelector('.return-field');
      if (hasReturnCB.checked){
        if (!field){
          const htmlStr = buildReturnField(test.dataset.testId, returnTypeSel.value);
          const before = test.querySelector('.return-end');
          test.insertBefore(html/*html*/`${htmlStr}`, before);
        }else{
          // swap type if user changed selector
          field.outerHTML = buildReturnField(test.dataset.testId, returnTypeSel.value);
        }
      }else if (field){
        field.remove();                         // hide when unchecked
      }
    });
  }

  function syncIOFields(){
    $$('.test-item', testsList).forEach(test => {
      const tId = test.dataset.testId;

      // ---- stdin ---------------------------------------------------------
      let inField = test.querySelector('.stdin-field');
      if (enableStdinCB.checked){
        if (!inField){
          const htmlStr = buildStdInField(tId);
          const before  = test.querySelector('.io-end');
          test.insertBefore(html/*html*/`${htmlStr}`, before);
        }
      }else if (inField){
        inField.remove();
      }

      // ---- stdout --------------------------------------------------------
      let outField = test.querySelector('.stdout-field');
      if (enableStdoutCB.checked){
        if (!outField){
          const htmlStr = buildStdOutField(tId);
          const before  = test.querySelector('.io-end');
          test.insertBefore(html/*html*/`${htmlStr}`, before);
        }
      }else if (outField){
        outField.remove();
      }
    });
  }

  function updateArgTypeInTests(idx, newType){
    // for every input/select/textarea representing this argument…
    $$(`.test-arg-input[data-idx="${idx}"]`, testsList).forEach(inp => {
      const field    = inp.closest('.test-field');
      const testItem = field.closest('.test-item');
      const tId      = testItem.dataset.testId;
      const argName  = field.querySelector('label').textContent;

      field.outerHTML = buildTestField({
        tId,
        argIdx : idx,
        argName: argName,
        argType: newType,
      });
    });
  }

  function appendArgToTests(idx) {
    const argItem = $(`.arg-item[data-idx="${idx}"]`, argsList);
    const argName = argItem.querySelector('.name-input').value.trim() || '??';
    const argType = argItem.querySelector('.type-select').value;

    $$('.test-item', testsList).forEach(test => {
      const before = test.querySelector('.args-end');
      const htmlStr = buildTestField({
        tId:   test.dataset.testId || crypto.randomUUID(),   // fallback if not stored
        argIdx: idx,
        argName: argName,
        argType: argType,
      });
      test.insertBefore(html/*html*/`${htmlStr}`, before);
    });
  }

  function reorderTestInputs() {
    const order = $$('.arg-item[data-idx]', argsList).map(n => n.dataset.idx);
    $$('.test-item', testsList).forEach(test => {
      const before = test.querySelector('.anchor-end');
      order.forEach(idx => {
        const wrap = test
          .querySelector(`.test-arg-input[data-idx="${idx}"]`)
          ?.closest('.test-field');
        if (wrap) test.insertBefore(wrap, before);
      });
    });
  }

  /* ────────── form submission – open GitHub issue ────────── */
  modal.querySelector('#task-form')?.addEventListener('submit', async e => {
    /* validation */
    if ($$('.type-select:invalid', argsList).length) {
      alert('Please choose a type for every argument.');
      return;
    }
    if (hasReturnCB.checked && !returnTypeSel.value) {
      alert('Please choose a return type.');
      return;
    }

    e.preventDefault();               // stay on the page

    try {
      const bodyMd = await makeIssueMarkdown(modal);
      const title  = modal.querySelector('#title')?.value.trim() || 'New task';

      const params = new URLSearchParams({
        template : 'new-task.md',                       // selects template
        title    : 'New task: ' + title,
        body     : bodyMd
      });

      const repo = 'viktor-shcherb/viktor-shcherb.github.io';
      const issueUrl = `https://github.com/${repo}/issues/new?${params}`;

      /* open in a new tab so the user can review & submit */
      window.open(issueUrl, '_blank', 'noopener,noreferrer');

      modal.classList.remove('open'); // close the dialog
    } catch (err) {
      alert('Could not create GitHub issue: ' + err.message);
    }
  });

  /* — download the current form state as task.json — */
  modal.querySelector('#download-json').addEventListener('click', () => {
    const taskObj = collectTaskFromForm();
    const blob    = new Blob(
                      [JSON.stringify(taskObj, null, 2)],
                      { type: 'application/json' }
                    );
    const url     = URL.createObjectURL(blob);

    /* trigger a download without leaving the page */
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${taskObj.title || 'task'}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
  });
}
