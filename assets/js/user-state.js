export function loadTaskState(slug) {
  try {
    const json = localStorage.getItem(`task-state:${slug}`);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export function saveTaskState(slug, state) {
  localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
}
