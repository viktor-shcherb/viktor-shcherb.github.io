export function ensureTaskSkeleton(doc) {
  if (doc.querySelector('.task-title')) return;
  const headTpl = doc.getElementById('task-head-template');
  const bodyTpl = doc.getElementById('task-body-template');
  if (!headTpl || !bodyTpl) return;
  const tabs = doc.getElementById('task-tabs');
  const panel = doc.getElementById('panel-desc');
  tabs.parentNode.insertBefore(headTpl.content.cloneNode(true), tabs);
  panel.appendChild(bodyTpl.content.cloneNode(true));
}

export function signatureToString(sig) {
  if (!sig?.name) return '';
  const args = (sig.args || [])
    .map(a => a.name + (a.type ? `: ${a.type}` : ''))
    .join(', ');
  const ret = sig.return_type || sig.returnType || '';
  const arrow = ret ? ` -> ${ret}` : '';
  return `def ${sig.name}(${args})${arrow}:\n    pass`;
}

export function buildExamples(tests = [], signature = {}) {
  if (!tests.length) return '';
  const esc = s =>
    String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  const fn = signature.name ?? 'fn';
  return (
    '<h2>Examples</h2>\n' +
    tests.slice(0, 3).map((test, i) => {
      const argLines = Object.entries(test.args ?? {})
        .map(([k, v]) => `  ${k}=${JSON.stringify(v)}`)
        .join(',\n');
      const call = argLines ? `${fn}(\n${argLines}\n)` : `${fn}()`;
      const callLine = 'return' in test ? `${call} == ${JSON.stringify(test.return)}` : call;
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
      ? `<pre><code class="language-python-codemirror">${signatureToString(task.signature)}</code></pre>`
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
