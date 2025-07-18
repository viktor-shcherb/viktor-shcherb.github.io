/* ---------------------------------------------------------------------------
 *  state‑settings.js   –   plain‑JavaScript (ES modules) version
 *     · resilient if some DOM nodes are missing
 *     · clear “anon | partial | ready” UI states
 *     · inline validation + error feedback
 * ------------------------------------------------------------------------ */

const API_BASE =
  'https://open-user-state-personal-website.viktoroo-sch.workers.dev';

export async function initStateSettings() {
  async function run() {
    /* ---------- fast DOM look‑ups -------------------------------------- */
    const $        = id => /** @type {HTMLElement|null} */ (document.getElementById(id));
    const btn      = $('#state-settings-btn');
    const modal    = $('#user-state-modal');
    if (!btn || !modal) return;  // nothing to do on pages without the dialog

    const authBtn    = $('#github-auth-btn');
    const patSection = $('#pat-section');
    const saveBtn    = $('#save-pat-btn');
    const patInput   = /** @type {HTMLInputElement|null} */ ($('#pat-input'));
    const repoInput  = /** @type {HTMLInputElement|null} */ ($('#repo-input'));
    const warning    = $('#state-warning');
    const saveName   = $('#save-name');

    /* ---------- tiny helpers --------------------------------------------- */
    const show = el => el && (el.style.display = '');
    const hide = el => el && (el.style.display = 'none');
    const message = txt => {
      if (warning) {
        warning.textContent = txt;
        warning.classList.remove('hidden');
      }
    };

    /** @param {'anon'|'partial'|'ready'} state */
    function setUI(state) {
      switch (state) {
        case 'anon':
          show(authBtn);
          hide(patSection);
          message('Connect GitHub to enable state‑saving.');
          hide(saveName);
          break;

        case 'partial':
          hide(authBtn);
          show(patSection);
          message('Finish token / repo setup to save state.');
          show(saveName);
          break;

        case 'ready':
          hide(authBtn);
          show(patSection);
          warning && warning.classList.add('hidden');
          show(saveName);
          break;
      }
    }

    /* ---------- modal open / close logic --------------------------------- */
    btn.addEventListener('click', () => modal.classList.add('open'));

    modal.addEventListener('click', e => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (t.closest('.modal-close') || t.classList.contains('modal-overlay')) {
        modal.classList.remove('open');
      }
    });

    document.addEventListener('keyup', e => {
      if (e.key === 'Escape') modal.classList.remove('open');
    });

    /* ---------- OAuth kick‑off ------------------------------------------- */
    authBtn && authBtn.addEventListener(
      'click',
      () => (window.location.href = `${API_BASE}/api/auth/github`),
    );

    /* ---------- current setup probe -------------------------------------- */
    async function probeSetup() {
      // 1‑ Does the user have a session cookie?
      const repoRes = await fetch(`${API_BASE}/api/repository`, {
        credentials: 'include',
      });
      if (repoRes.status === 401) return 'anon';

      let repo = null;
      try {
        const { repo: r } = await repoRes.json();
        repo = r || null;
        if (repo && repoInput) repoInput.value = repo;
      } catch { /* ignore JSON error */ }

      // 2‑ Is a PAT stored?  Use OPTIONS as a cheap probe that the worker answers 204 on success
      const tokenOk = await fetch(`${API_BASE}/api/token`, {
        method: 'OPTIONS',
        credentials: 'include',
      }).then(r => r.status === 204);

      return repo && tokenOk ? 'ready' : 'partial';
    }

    /* ---------- save / update handler ------------------------------------ */
    saveBtn && saveBtn.addEventListener('click', async () => {
      if (!patInput || !repoInput) return;

      saveBtn.disabled = true;

      const pat  = patInput.value.trim();
      const repo = repoInput.value.trim();

      /* client‑side regexes mirror the worker */
      const patOk  =
        !pat ||
        /^(gh[pous]_)[A-Za-z0-9_]{20,}|^(github_pat_)[A-Za-z0-9_]{20,}|^[0-9a-f]{40}$/i.test(pat);
      const repoOk = !repo || /^[\w.-]+\/[\w.-]+$/.test(repo);

      if (!patOk)   { message('PAT format looks wrong.'); saveBtn.disabled = false; return; }
      if (!repoOk)  { message('Repo must be “owner/name”.'); saveBtn.disabled = false; return; }

      const tasks = [];
      if (pat)  tasks.push(fetch(`${API_BASE}/api/token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat }),
      }));
      if (repo) tasks.push(fetch(`${API_BASE}/api/repository`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo }),
      }));

      const results = await Promise.allSettled(tasks);
      const fail = results.find(r =>
        r.status === 'rejected' || (r.value && !r.value.ok),
      );

      saveBtn.disabled = false;

      if (fail) {
        message('Save failed – check PAT / repo permissions.');
        return;
      }

      modal.classList.remove('open');
      setUI('ready');
    });

    /* ---------- kick‑off -------------------------------------------------- */
    setUI('anon');
    setUI(await probeSetup());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
