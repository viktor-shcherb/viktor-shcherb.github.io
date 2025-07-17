/**
 * DOM helpers shared by the runtime and the prerender script.
 * They contain no references to browser-only APIs so that jsdom can
 * evaluate them when generating static pages.
 */

/**
 * Ensure the task placeholders are present.
 * This runs in both Node (via jsdom) and the browser so that the
 * prerender script and runtime share exactly the same markup.
 */
export function ensureTaskSkeleton(doc) {
  if (doc.querySelector('.task-title')) return;
  const headTpl = doc.getElementById('task-head-template');
  const bodyTpl = doc.getElementById('task-body-template');
  if (!headTpl || !bodyTpl) return;
  const tabs = doc.getElementById('task-tabs');
  const panel = doc.getElementById('panel-desc');
  if (!tabs || !panel) return;
  tabs.parentNode.insertBefore(headTpl.content.cloneNode(true), tabs);
  panel.appendChild(bodyTpl.content.cloneNode(true));
}

/**
 * Build a minimal Python function stub from a signature object.
 * Sharing this logic keeps editor hints identical between prerender
 * and client side.
 */
export function signatureToDef(sig) {
  if (!sig?.name) return '';
  const parts = (sig.args || []).map(a =>
    `${a.name}${a.type ? `: ${a.type}` : ''}`);
  const ret = sig.return_type || sig.returnType || '';
  const arrow = ret ? ` -> ${ret}` : '';
  return `def ${sig.name}(${parts.join(', ')})${arrow}:\n    pass`;
}

export function callFromSignature(sig, argValues = {}, wrap = 40) {
  if (!sig?.name) return '';
  const parts = (sig.args || []).map(a =>
    `${a.name}=${JSON.stringify(argValues[a.name])}`);
  let call = `${sig.name}(${parts.join(', ')})`;
  if (call.length > wrap && parts.length > 1) {
    call = `${sig.name}(\n  ${parts.join(',\n  ')}\n)`;
  }
  return call;
}

/**
 * Render a couple of example cards for display below the task
 * description.  These examples are static HTML so they can be
 * embedded during prerendering and later enhanced in the browser.
 */
export function buildExamples(tests = [], signature = {}) {
  if (!tests.length) return '';
  const esc = s =>
    String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  return (
    '<h2>Examples</h2>\n' +
    tests.slice(0, 3).map((test, i) => {
      const callLine = 'return' in test
        ? `${callFromSignature(signature, test.args, 40)} == ${JSON.stringify(test.return)}`
        : callFromSignature(signature, test.args, 40);
      const html = [`<div class="example-card">`,
        `<div class="io-block call" aria-labelledby="lbl-call-${i}">`,
        `<span id="lbl-call-${i}" class="io-label">Function call</span>`,
        `<pre id="call-${i}"><code class="language-python-codemirror">${esc(callLine)}</code></pre>`,
        `</div>`];
      if (test.stdin) {
        html.push(`<div class="io-block input" aria-labelledby="lbl-stdin-${i}">`,
          `<span id="lbl-stdin-${i}" class="io-label">stdin</span>`,
          `<div id="stdin-${i}" class="io-surface">${esc(test.stdin)}</div>`,
          `</div>`);
      }
      if ('stdout' in test) {
        const out = typeof test.stdout === 'object'
          ? JSON.stringify(test.stdout, null, 2)
          : test.stdout;
        html.push(`<div class="io-block output" aria-labelledby="lbl-stdout-${i}">`,
          `<span id="lbl-stdout-${i}" class="io-label">stdout&nbsp;(expected)</span>`,
          `<div id="stdout-${i}" class="io-surface">${esc(out)}</div>`,
          `</div>`);
      }
      html.push('</div>');
      return html.join('');
    }).join('')
  );
}

/**
 * Fill the task placeholders with data.  `parseMarkdown` is supplied by
 * the caller so we can use the same function in Node and the browser.
 */
export function populateTaskDOM(task, container, parseMarkdown) {
  const els = {
    title: container.querySelector('.task-title'),
    desc: container.querySelector('.task-description'),
    signature: container.querySelector('.task-signature'),
    examples: container.querySelector('.task-examples'),
    contributor: container.querySelector('.task-contributor')
  };
  if (els.title) els.title.textContent = task.title ?? 'Untitled task';
  if (els.desc) els.desc.innerHTML = parseMarkdown ? parseMarkdown(task.description ?? '') : (task.description ?? '');
  if (els.signature) {
    els.signature.innerHTML = task.signature
      ? `<pre><code class="language-python-codemirror">${signatureToDef(task.signature)}</code></pre>`
      : '';
  }
  if (els.examples) {
    els.examples.innerHTML = buildExamples(task.tests, task.signature);
    els.examples.style.display = task.tests?.length ? '' : 'none';
  }
  if (els.contributor) {
    els.contributor.innerHTML = task.contributor
      ? `Contributed by <a href="${task.contributor.github}" target="_blank">${task.contributor.name}</a>`
      : '';
  }
}
