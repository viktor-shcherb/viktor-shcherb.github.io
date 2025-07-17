const API_BASE = 'https://open-user-state-personal-website.viktoroo-sch.workers.dev';

export async function initStateSettings() {
  const btn = document.getElementById('state-settings-btn');
  const modal = document.getElementById('user-state-modal');
  const warning = document.getElementById('state-warning');
  const saveInput = document.getElementById('save-name');
  if (!btn || !modal) return;

  function toggleAuth(auth) {
    if (auth) {
      warning?.classList.add('hidden');
      if (saveInput) saveInput.style.display = 'inline-block';
    } else {
      warning?.classList.remove('hidden');
      if (saveInput) saveInput.style.display = 'none';
    }
  }

  btn.addEventListener('click', () => modal.classList.add('open'));
  modal.addEventListener('click', e => {
    if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay'))
      modal.classList.remove('open');
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'Escape') modal.classList.remove('open');
  });

  const authBtn = document.getElementById('github-auth-btn');
  const patForm = document.getElementById('pat-form');
  const repoInput = document.getElementById('repo-input');
  const patInput = document.getElementById('pat-input');

  async function checkAuth() {
    try {
      const res = await fetch(`${API_BASE}/api/repository`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.repo && repoInput) repoInput.value = data.repo;
        authBtn.style.display = 'none';
        patForm.style.display = 'block';
        toggleAuth(true);
      } else {
        authBtn.style.display = 'block';
        patForm.style.display = 'none';
        toggleAuth(false);
      }
    } catch {
      authBtn.style.display = 'block';
      patForm.style.display = 'none';
      toggleAuth(false);
    }
  }

  authBtn?.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/github`, {
        method: 'POST',
        credentials: 'include',
        redirect: 'manual'
      });
      const url = res.redirected ? res.url : res.headers.get('Location');
      if (url) window.location.href = url;
    } catch {
      window.location.href = `${API_BASE}/api/auth/github`;
    }
  });

  patForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pat = patInput.value.trim();
    const repo = repoInput.value.trim();
    if (pat) {
      await fetch(`${API_BASE}/api/token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat })
      });
    }
    if (repo) {
      await fetch(`${API_BASE}/api/repository`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo })
      });
    }
    modal.classList.remove('open');
    toggleAuth(true);
  });

  await checkAuth();
}
