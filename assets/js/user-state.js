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
const lastCommitMeta = new Map(); // slug -> { ts: number, hash: string }

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

function computeStateHash(slug, state) {
  // Only hash the parts we actually commit remotely
  const meta = JSON.stringify({
    lastSaved: state.lastSaved || 0,
    name: state.name || ''
  });
  const code = typeof state.code === 'string' ? state.code : '';
  const tests = JSON.stringify(state.tests || []);
  return hashString(`${slug}::${meta}::${code}::${tests}`);
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
      if (parsed && typeof parsed.ts === 'number' && typeof parsed.hash === 'string') {
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

  const codeObj = await fetchFile(`user_state/algoprep/${slug}/code.py`);
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
    // Create a synthetic hash so an immediate unchanged forced save does nothing
    const syntheticHash = computeStateHash(slug, state);
    storeCommitMeta(slug, { ts: state.lastSaved, hash: syntheticHash });
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
    const commitInfo = loadPersistedCommitMeta(slug) || { ts: 0, hash: '' };
    const now = Date.now();
    const newHash = computeStateHash(slug, state);

    const tooSoon = !force && (now - commitInfo.ts < COMMIT_MIN_INTERVAL_MS);
    const unchanged = newHash === commitInfo.hash;

    // If it's too soon OR unchanged, we still update meta timestamp ONLY if force?
    if (!force && (tooSoon || unchanged)) {
      // Optionally refresh lastSaved in commit meta if changed a lot locally:
      // We *do not* update commit meta hash/time unless forced & changed.
      return; // skip remote commits
    }

    if (unchanged && force) {
      // Force requested but content identical: nothing to send.
      // Still update stored timestamp so next minute window references now.
      storeCommitMeta(slug, { ts: now, hash: newHash });
      return;
    }

    // 3. Perform remote commits (only changed & allowed)
    const basePath = `user_state/algoprep/${slug}`;

    const metaPayload = JSON.stringify({
      lastSaved: state.lastSaved,
      name: state.name || ''
    });

    // Commit metadata
    await commitFile(
      `${basePath}/metadata.json`,
      metaPayload,
      `Update state meta for ${slug}`
    );

    // Commit code (guard)
    if ('code' in state) {
      await commitFile(
        `${basePath}/code.py`,
        state.code || '',
        `Update code for ${slug}`
      );
    }

    // Commit tests
    await commitFile(
      `${basePath}/custom_tests.json`,
      JSON.stringify(state.tests || []),
      `Update tests for ${slug}`
    );

    // 4. Record commit meta
    storeCommitMeta(slug, { ts: now, hash: newHash });
  })();

  try {
    await _inFlightSave;
  } finally {
    _inFlightSave = null;
  }
}

export { API_BASE };
