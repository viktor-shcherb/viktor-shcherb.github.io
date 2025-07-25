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

    const authSection = $('auth-section');   // container hidden after auth or partial
    const patSection  = $('pat-section');    // container shown after auth or partial
    const stateSection= $('state-section');  // timeout / save name display
    const saveBtn     = $('save-pat-btn');
    const logoutBtn   = $('logout-btn');
    const delTokenBtn = $('delete-pat-btn');
    const patInput    = $('pat-input');
    const patOkWrap   = $('pat-valid');
    const repoInput   = $('repo-input');
    const statusEl    = $('state-status');
    const saveName    = $('save-name');
    const timeoutInp  = $('test-timeout');

    /* ------------- UI helpers ---------------- */
    const show = el => el && (el.style.display = '');
    const hide = el => el && (el.style.display = 'none');
    const message = txt => {
      if (!statusEl) return;
      statusEl.textContent = txt;
    };
    const clearMessage = () => {
      if (statusEl) statusEl.textContent = '';
    };

    const updateSummary = () => {
      if (!statusEl) return;
      const repo = repoInput?.value.trim() || '(none)';
      const name = saveName?.value.trim() || '(none)';
      statusEl.textContent = `Repo: ${repo} \u2013 Save: ${name}`;
    };

    const updatePatUI = valid => {
      if (!patInput || !patOkWrap) return;
      if (valid) {
        hide(patInput);
        show(patOkWrap);
      } else {
        show(patInput);
        hide(patOkWrap);
      }
    };

    updatePatUI(false);

    function setUI(state) {
      switch (state) {
        case 'anon':
          show(authSection);
          hide(patSection);
          hide(stateSection);
          message('Connect GitHub to enable state-saving.');
          break;
        case 'partial':
          hide(authSection);
          show(patSection);
          show(stateSection);
          message('Finish token / repo setup to save state.');
          updateSummary();
          break;
        case 'ready':
          hide(authSection);
          show(patSection);
          show(stateSection);
          clearMessage();
          updateSummary();
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
          '#code';
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
        const res = await probeSetup();
        setUI(res.state);
        updateSummary();
        updatePatUI(res.patValid);
      }

      if (btn.id === 'delete-pat-btn') {
        e.preventDefault();
        await fetch(`${API_BASE}/api/token`, {
          method: 'DELETE',
          credentials: 'include'
        }).catch(() => {});
        updatePatUI(false);
      }

      if (btn.id === 'logout-btn') {
        e.preventDefault();
        await fetch(`${API_BASE}/api/logout`, {
          method: 'POST',
          credentials: 'include'
        }).catch(() => {});
        setUI('anon');
        updatePatUI(false);
      }
    });

    repoInput?.addEventListener('input', updateSummary);
    saveName?.addEventListener('input', updateSummary);
    timeoutInp?.addEventListener('input', updateSummary);

    /* ------------- Probe existing setup ------------- */
    async function probeSetup() {
      const res = await fetch(`${API_BASE}/api/profile`, {
        credentials: 'include'
      });
      if (res.status === 401) return { state: 'anon', repo: null, patValid: false };
      if (!res.ok) return { state: 'anon', repo: null, patValid: false };

      let info = {};
      try { info = await res.json(); } catch {}
      if (info.repo && repoInput) repoInput.value = info.repo;

      const state = info.repo && info.patValid ? 'ready' : 'partial';
      return { state, repo: info.repo || null, patValid: !!info.patValid };
    }

    /* ------------- Kick-off ------------- */
    setUI('anon');
    probeSetup()
      .then(res => {
        setUI(res.state);
        updateSummary();
        updatePatUI(res.patValid);
      })
      .catch(() => setUI('anon'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
