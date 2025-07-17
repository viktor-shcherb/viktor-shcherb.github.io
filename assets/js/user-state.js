const API_BASE = 'https://open-user-state-personal-website.viktoroo-sch.workers.dev';

async function fetchFile(path) {
  try {
    const res = await fetch(`${API_BASE}/api/file?path=${encodeURIComponent(path)}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content;
  } catch { return null; }
}

async function commitFile(path, content, message) {
  try {
    await fetch(`${API_BASE}/api/file`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, message })
    });
  } catch {}
}

export async function loadTaskState(slug) {
  try {
    const json = localStorage.getItem(`task-state:${slug}`);
    if (json) return JSON.parse(json);
  } catch {}

  const meta = await fetchFile(`user_state/algoprep/${slug}/metadata.json`);
  if (!meta) return {};
  const state = {};
  try {
    Object.assign(state, JSON.parse(meta));
  } catch {}
  state.code = await fetchFile(`user_state/algoprep/${slug}/code.py`) || '';
  const tests = await fetchFile(`user_state/algoprep/${slug}/custom_tests.json`);
  if (tests) {
    try { state.tests = JSON.parse(tests); } catch {}
  }
  localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
  return state;
}

export async function saveTaskState(slug, state) {
  state.lastSaved = Date.now();
  localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
  await commitFile(
    `user_state/algoprep/${slug}/metadata.json`,
    JSON.stringify({ lastSaved: state.lastSaved, name: state.name || '' }),
    `Update state meta for ${slug}`
  );
  if ('code' in state) {
    await commitFile(`user_state/algoprep/${slug}/code.py`, state.code, `Update code for ${slug}`);
  }
  await commitFile(`user_state/algoprep/${slug}/custom_tests.json`, JSON.stringify(state.tests || []), `Update tests for ${slug}`);
}
