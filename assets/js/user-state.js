export function loadTaskFile(slug, name) {
  try {
    return localStorage.getItem(`task-file:${slug}:${name}`);
  } catch {
    return null;
  }
}

export function saveTaskFile(slug, name, content) {
  localStorage.setItem(`task-file:${slug}:${name}`, content);
}

export function loadTaskState(slug) {
  const code = loadTaskFile(slug, 'code1.py') || '';
  let tests;
  try {
    const stored = loadTaskFile(slug, 'custom_tests.jsonl');
    tests = stored ? JSON.parse(stored) : [];
  } catch {
    tests = [];
  }
  const hidePassed = localStorage.getItem(`task-flag:${slug}:hidePassed`);
  const hideSample = localStorage.getItem(`task-flag:${slug}:hideSample`);
  return {
    code,
    tests,
    hidePassed: hidePassed === null ? undefined : hidePassed === 'true',
    hideSample: hideSample === null ? undefined : hideSample === 'true'
  };
}

export function saveTaskState(slug, state) {
  if('code' in state) saveTaskFile(slug, 'code1.py', state.code);
  if('tests' in state) saveTaskFile(slug, 'custom_tests.jsonl', JSON.stringify(state.tests));
  if('hidePassed' in state) localStorage.setItem(`task-flag:${slug}:hidePassed`, String(state.hidePassed));
  if('hideSample' in state) localStorage.setItem(`task-flag:${slug}:hideSample`, String(state.hideSample));
}
