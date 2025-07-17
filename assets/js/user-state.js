export function loadTaskState(slug) {
  try {
    return JSON.parse(localStorage.getItem(`task-state:${slug}`)) || {};
  } catch {
    return {};
  }
}

export function saveTaskState(slug, state) {
  localStorage.setItem(`task-state:${slug}`, JSON.stringify(state));
}
