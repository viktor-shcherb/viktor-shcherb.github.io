/**
 * user-state.js
 *  - Loads & saves per-task user state via the Worker API
 *  - Chooses API base depending on current host (localhost => dev worker)
 *  - Throttles remote commits (>= 60s interval) unless forced
 *  - Skips commits if hash unchanged
 */

/* ---------------- Environment / API base detection ------------------ */
const DEV_WORKER_ORIGIN  = 'https://open-user-state-personal-website-dev.viktoroo-sch.workers.dev';
const PROD_WORKER_ORIGIN = 'https://open-user-state-personal-website.viktoroo-sch.workers.dev';

function isLocalHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function getApiBase() {
  const host = (typeof location !== 'undefined' && location.hostname) || '';
  return isLocalHost(host) ? DEV_WORKER_ORIGIN : PROD_WORKER_ORIGIN;
}

const API_BASE = getApiBase();

/* ---------------- Throttle / hash configuration --------------------- */
const COMMIT_MIN_INTERVAL_MS = 60_000; // 1 minute

// In-memory caches keyed by slug
const lastCommitMeta = new Map();
// slug -> {
//   ts: number,
//   metaHash: string,
//   codeHash: string,
//   testsHash: string
// }

// Persist key builder (optional localStorage persistence)
const persistKey = slug => `task-commit-info:${slug}`;

/* ---------------- Lightweight hash (djb2) ---------------------------- */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i); // XOR variant
  }
  // Return unsigned 32-bit in hex
  return (h >>> 0).toString(16);
}

function computeStateHashes(slug, state) {
  const metaPayload = JSON.stringify({
    lastSaved: state.lastSaved || 0,
    name: state.name || ''
  });
  const code = typeof state.code === 'string' ? state.code : '';
  const tests = JSON.stringify(state.tests || []);
  return {
    metaHash:  hashString(`${slug}::meta::${metaPayload}`),
    codeHash:  hashString(`${slug}::code::${code}`),
    testsHash: hashString(`${slug}::tests::${tests}`)
  };
}

function computeStateHash(slug, state) {
  const h = computeStateHashes(slug, state);
  return hashString(`${h.metaHash}::${h.codeHash}::${h.testsHash}`);
}

/* ---------------- Small fetch helpers -------------------------------- */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

async function fetchFile(path) {
  return fetchJSON(`${API_BASE}/api/file?path=${encodeURIComponent(path)}`);
  // Worker returns { content } or an error JSON; null on 404 path -> null
}

/* ---------------- Remote commit helper (with retry) ------------------ */
async function commitFile(path, content, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/api/file`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content, message })
      });
      if (res.ok) return true;
    } catch (err) {
      if (attempt === 1 && isLocalHost(location.hostname)) {
        console.warn('[user-state] commit failed', path, err);
      }
    }
    await new Promise(r => setTimeout(r, 150 * (attempt + 1)));
  }
  return false;
}

/* ---------------- Load last commit meta (optional) ------------------- */
function loadPersistedCommitMeta(slug) {
  if (lastCommitMeta.has(slug)) return lastCommitMeta.get(slug);
  try {
    const raw = localStorage.getItem(persistKey(slug));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ts === 'number') {
        if (typeof parsed.metaHash !== 'string') {
          const legacy = parsed.hash || '';
          parsed.metaHash = legacy;
          parsed.codeHash = legacy;
          parsed.testsHash = legacy;
        }
        lastCommitMeta.set(slug, parsed);
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function storeCommitMeta(slug, meta) {
  lastCommitMeta.set(slug, meta);
  try {
    localStorage.setItem(persistKey(slug), JSON.stringify(meta));
  } catch { /* ignore quota */ }
}

/* ---------------- Public: load task state ---------------------------- */
export async function loadTaskState(slug) {
  // 1. localStorage first
  try {
    const json = localStorage.getItem(`task-state:${slug}`);
    if (json) return JSON.parse(json);
  } catch { /* ignore */ }

  // 2. Remote fetch
  const metaObj = await fetchFile(`user_state/algoprep/${slug}/metadata.json`);
  if (!metaObj || typeof metaObj.content !== 'string') {
    return {};
  }

  const state = {};
  try { Object.assign(state, JSON.parse(metaObj.content)); } catch { /* ignore */ }

  const codeFile = state.name ? `${state.name}.py` : 'code.py';
  const codeObj = await fetchFile(`user_state/algoprep/${slug}/${codeFile}`);
  state.code = (codeObj && typeof codeObj.content === 'string') ? codeObj.content : '';

  const testsObj = await fetchFile(`user_state/algoprep/${slug}/custom_tests.json`);
  if (testsObj && typeof testsObj.content === 'string') {
    try { state.tests = JSON.parse(testsObj.content); } catch { /* ignore */ }
  }

  try {
    localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
  } catch { /* ignore quota */ }

  // Seed commit meta cache if lastSaved present
  if (state.lastSaved) {
    const hashes = computeStateHashes(slug, state);
    storeCommitMeta(slug, { ts: state.lastSaved, ...hashes });
  }

  return state;
}

/* ---------------- Public: save task state ---------------------------- */
/**
 * saveTaskState(slug, state, options?)
 *  - Throttled to 1 commit / minute unless { force: true }
 *  - Skips remote commit if hash unchanged
 */
let _inFlightSave = null;

export async function saveTaskState(slug, state, options = {}) {
  const { force = false } = options;

  // Serialize saves
  if (_inFlightSave) {
    try { await _inFlightSave; } catch { /* ignore prior failure */ }
  }

  _inFlightSave = (async () => {
    state.lastSaved = Date.now();

    // 1. Local fast persistence
    try {
      localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
    } catch { /* ignore quota */ }

    // 2. Hash & throttle check
    const commitInfo =
      loadPersistedCommitMeta(slug) ||
      { ts: 0, metaHash: '', codeHash: '', testsHash: '' };
    const now = Date.now();
    const hashes = computeStateHashes(slug, state);

    const tooSoon = !force && (now - commitInfo.ts < COMMIT_MIN_INTERVAL_MS);
    const changedMeta = hashes.metaHash !== commitInfo.metaHash;
    const changedCode = 'code' in state && hashes.codeHash !== commitInfo.codeHash;
    const changedTests = hashes.testsHash !== commitInfo.testsHash;
    const anyChanged = changedMeta || changedCode || changedTests;

    if (!force && (tooSoon || !anyChanged)) {
      return; // skip remote commits
    }

    if (!anyChanged && force) {
      storeCommitMeta(slug, { ts: now, ...hashes });
      return;
    }

    // 3. Perform remote commits (only changed & allowed)
    const basePath = `user_state/algoprep/${slug}`;

    if (changedMeta || force) {
      const metaPayload = JSON.stringify({
        lastSaved: state.lastSaved,
        name: state.name || ''
      });
      await commitFile(
        `${basePath}/metadata.json`,
        metaPayload,
        `Update state meta for ${slug}`
      );
    }

    if (changedCode || force) {
      const codeFile = state.name ? `${state.name}.py` : 'code.py';
      await commitFile(
        `${basePath}/${codeFile}`,
        state.code || '',
        `Update code for ${slug}`
      );
    }

    if (changedTests || force) {
      await commitFile(
        `${basePath}/custom_tests.json`,
        JSON.stringify(state.tests || []),
        `Update tests for ${slug}`
      );
    }

    // 4. Record commit meta
    storeCommitMeta(slug, { ts: now, ...hashes });
  })();

  try {
    await _inFlightSave;
  } finally {
    _inFlightSave = null;
  }
}

export { API_BASE };
