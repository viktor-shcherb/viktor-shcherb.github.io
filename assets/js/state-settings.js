import {API_BASE} from "./user-state.js";


/* ------------------------- DOM acquisition helpers --------------------- */
async function waitForElement(id, maxMs = 1000) {
  const start = performance.now();
  while (performance.now() - start < maxMs) {
    const el = document.getElementById(id);
    if (el) return el;
    await new Promise(r => requestAnimationFrame(r));
  }
  return null;
}

/* ------------------------- Regex & constants --------------------------- */
const PAT_REGEX =
  /^(?:gh[pous]_)[A-Za-z0-9_]{20,}|^(?:github_pat_)[A-Za-z0-9_]{20,}|^[0-9a-f]{40}$/i;
const REPO_REGEX = /^[\w.-]+\/[\w.-]+$/;

/* ------------------------- Idempotent initializer ---------------------- */
let _initStarted = false;

export async function initStateSettings() {
  if (_initStarted) return;
  _initStarted = true;

  async function run() {
    const modal = await waitForElement('user-state-modal');
    if (!modal) {
      console.warn('[state-settings] modal not found');
      return;
    }

    /* Fast getters */
    const $ = id => document.getElementById(id);

    const authBtn    = $('github-auth-btn');
    const patSection = $('pat-section');    // container shown after auth or partial
    const saveBtn    = $('save-pat-btn');
    const patInput   = $('pat-input');
    const repoInput  = $('repo-input');
    const warning    = $('state-warning');
    const saveName   = $('save-name');

    /* ------------- UI helpers ---------------- */
    const show = el => el && (el.style.display = '');
    const hide = el => el && (el.style.display = 'none');
    const message = txt => {
      if (!warning) return;
      warning.textContent = txt;
      warning.classList.remove('hidden');
    };
    const clearMessage = () => warning && warning.classList.add('hidden');

    function setUI(state) {
      switch (state) {
        case 'anon':
          show(authBtn);
          hide(patSection);
          message('Connect GitHub to enable state-saving.');
          hide(saveName);
          break;
        case 'partial':
          hide(authBtn);
            show(patSection);
          message('Finish token / repo setup to save state.');
          show(saveName);
          break;
        case 'ready':
          hide(authBtn);
          show(patSection);
          clearMessage();
          show(saveName);
          break;
      }
    }

    /* ------------- Modal open / close (delegated) ------------- */
    document.addEventListener('click', e => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      if (t.id === 'state-settings-btn' || t.closest('#state-settings-btn')) {
        modal.classList.add('open');
      } else if (
        t.classList.contains('modal-overlay') ||
        t.closest('.modal-close')
      ) {
        modal.classList.remove('open');
      }
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'Escape') modal.classList.remove('open');
    });

    /* ------------- Button actions (delegated) ------------- */
    modal.addEventListener('click', async e => {
      const btn = e.target instanceof Element ? e.target.closest('button') : null;
      if (!btn) return;

      // Start OAuth
      if (btn.id === 'github-auth-btn') {
        e.preventDefault();
        const next =
          window.location.pathname +
          window.location.search +
          window.location.hash;
        window.location.href = `${API_BASE}/api/auth/github?next=${encodeURIComponent(next)}`;
        return;
      }

      // Save settings
      if (btn.id === 'save-pat-btn') {
        e.preventDefault();
        if (!patInput || !repoInput) return;
        if (btn.disabled) return;

        btn.disabled = true;

        const patValue  = patInput.value.trim();
        const repoValue = repoInput.value.trim();

        const patOk  = !patValue || PAT_REGEX.test(patValue);
        const repoOk = !repoValue || REPO_REGEX.test(repoValue);

        if (!patOk)  { message('PAT format looks wrong.'); btn.disabled = false; return; }
        if (!repoOk) { message('Repo must be “owner/name”.'); btn.disabled = false; return; }

        const tasks = [];
        if (patValue) {
          tasks.push(fetch(`${API_BASE}/api/token`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pat: patValue }),
          }));
        }
        if (repoValue) {
          tasks.push(fetch(`${API_BASE}/api/repository`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo: repoValue }),
          }));
        }

        const results = await Promise.allSettled(tasks);
        const fail = results.find(r =>
          r.status === 'rejected' || (r.value && !r.value.ok)
        );

        btn.disabled = false;

        if (fail) {
          message('Save failed – check PAT / repo permissions.');
          return;
        }

        modal.classList.remove('open');
        setUI('ready');
      }
    });

    /* ------------- Probe existing setup ------------- */
    async function probeSetup() {
      // Check repo (auth presence)
      let repoState = null;
      const repoRes = await fetch(`${API_BASE}/api/repository`, {
        credentials: 'include',
      });
      if (repoRes.status === 401) return 'anon';
      if (repoRes.ok) {
        try {
          const { repo } = await repoRes.json();
            repoState = repo || null;
            if (repoState && repoInput) repoInput.value = repoState;
        } catch { /* ignore parse error */ }
      }

      // Check PAT via OPTIONS
      const tokenOk = await fetch(`${API_BASE}/api/token`, {
        method: 'OPTIONS',
        credentials: 'include'
      }).then(r => r.status === 204).catch(() => false);

      return repoState && tokenOk ? 'ready' : 'partial';
    }

    /* ------------- Kick-off ------------- */
    setUI('anon');
    probeSetup()
      .then(state => setUI(state))
      .catch(() => setUI('anon'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
