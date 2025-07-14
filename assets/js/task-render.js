import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';

import { renderReadOnlyCodeBlocks } from './editor.js';

/* -----------------------------------------------------------
   Inject task skeleton if it is not in the live DOM yet
----------------------------------------------------------- */
export function ensureTaskSkeleton() {
  if (document.querySelector('.task-title')) return;          // already done

  const headTpl = document.getElementById('task-head-template');
  const bodyTpl = document.getElementById('task-body-template');
  if (!headTpl || !bodyTpl) return;

  /* ---- 1. head goes ABOVE the switcher ------------------------- */
  const head = headTpl.content.cloneNode(true);
  const tabs = document.getElementById('task-tabs');          // <div class="tab-switcher">
  tabs.parentNode.insertBefore(head, tabs);

  /* ---- 2. body stays inside the description panel -------------- */
  const body = bodyTpl.content.cloneNode(true);
  const panel = document.getElementById('panel-desc');
  panel.appendChild(body);
}


export function signatureToString(sig) {
  if (!sig?.name) return '';

  /*-- arguments --*/
  const args = (sig.args || [])
    .map(a => a.name + (a.type ? `: ${a.type}` : ''))
    .join(', ');

  /*-- optional return annotation --*/
  const ret = sig.return_type || sig.returnType || '';
  const arrow = ret ? ` -> ${ret}` : '';

  return `def ${sig.name}(${args})${arrow}:\n    pass`;
}

/**
 * Render up to three tests as mini-cards.
 * @param {Array}  tests      — task.tests
 * @param {Object} signature  — task.signature  (needs .name)
 */
function buildExamples(tests = [], signature = {}) {
  if (!tests.length) return '';

  const esc = s =>
    String(s).replace(/[&<>"']/g, m =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  const fn = signature.name ?? 'fn';

  return (
    '<h2>Examples</h2>\n' +
    tests.slice(0, 3).map((test, i) => {
      /* -------- build the function-call line -------------------- */
      const argLines = Object.entries(test.args ?? {})
        .map(([k, v]) => `  ${k}=${JSON.stringify(v)}`)
        .join(',\n');

      const call = argLines ? `${fn}(\n${argLines}\n)` : `${fn}()`;
      const callLine =
        'return' in test ? `${call} == ${JSON.stringify(test.return)}` : call;

      /* -------- assemble one card ------------------------------- */
      const html = [`
        <div class="example-card">

          <div class="io-block call" aria-labelledby="lbl-call-${i}">
            <span id="lbl-call-${i}" class="io-label">Function call</span>
            <pre id="call-${i}">
              <code class="language-python-codemirror">${esc(callLine)}</code>
            </pre>
          </div>`];

      if (test.stdin) {
        html.push(`
          <div class="io-block input" aria-labelledby="lbl-stdin-${i}">
            <span id="lbl-stdin-${i}" class="io-label">stdin</span>
            <div id="stdin-${i}" class="io-surface">${esc(test.stdin)}</div>
          </div>`);
      }

      if ('stdout' in test) {
        const out =
          typeof test.stdout === 'object'
            ? JSON.stringify(test.stdout, null, 2)
            : test.stdout;

        html.push(`
          <div class="io-block output" aria-labelledby="lbl-stdout-${i}">
            <span id="lbl-stdout-${i}" class="io-label">stdout&nbsp;(expected)</span>
            <div id="stdout-${i}" class="io-surface">${esc(out)}</div>
          </div>`);
      }

      html.push('</div>'); // close .example-card
      return html.join('');
    }).join('')
  );
}

export function renderTask(task, container){
  /* container should have the five placeholders below */
  const els = {
    title:       container.querySelector('.task-title'),
    desc:        container.querySelector('.task-description'),
    signature:   container.querySelector('.task-signature'),
    examples:    container.querySelector('.task-examples'),
    contributor: container.querySelector('.task-contributor')
  };

  if (els.title)  els.title.textContent = task.title ?? 'Untitled task';
  if (els.desc)   els.desc.innerHTML    = marked.parse(task.description ?? '');
  if (els.signature){
    els.signature.innerHTML = task.signature ?
        `<pre><code class="language-python-codemirror">${signatureToString(task.signature)}</code></pre>`
        : '';
  }
  if (els.examples){
    els.examples.innerHTML = buildExamples(task.tests, task.signature);
    els.examples.style.display = task.tests?.length ? '' : 'none';
  }
  if (els.contributor){
    els.contributor.innerHTML = task.contributor ?
      `Contributed by <a href="${task.contributor.github}" target="_blank">${task.contributor.name}</a>`
      : '';
  }

  /* let Prism/CodeMirror read-only renderer update colours */
  renderReadOnlyCodeBlocks();
}
