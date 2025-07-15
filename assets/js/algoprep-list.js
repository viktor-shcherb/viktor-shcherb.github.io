export async function renderTaskList(taskFiles) {
  const list = document.getElementById('task-list');
  if (!list) return;

  list.innerHTML = '<ul id="task-list-ul"><li>Loading tasks...</li></ul>';

  // Fetch all JSON files in parallel, preferring pre-rendered data
  const tasks = await Promise.all(
    taskFiles.map(async (slug) => {
      if (window.preRenderedTasks && window.preRenderedTasks[slug]) {
        return { slug, ...window.preRenderedTasks[slug] };
      }
      try {
        const res  = await fetch(`/algoprep/${slug}.json`);
        if (!res.ok) return null;
        const task = await res.json();
        return { slug, ...task };
      } catch {
        return null;
      }
    })
  );

  // Build list HTML
  const html = tasks
    .filter(Boolean)
    .map((task) => {
      const pre = window.preRenderedTasks && window.preRenderedTasks[task.slug];
      const url = pre
        ? `/algoprep/task/${task.slug}/`
        : `/algoprep/task?id=${encodeURIComponent(task.slug)}`;
      return `
        <li>
          <a href="${url}">
            ${task.title || task.slug}
          </a>
          <span style="font-size:.95em;color:#888;">
            ${task.contributor ? `&mdash; ${task.contributor.name}` : ''}
          </span>
        </li>`;
    })
    .join('');

  document.getElementById('task-list-ul').innerHTML =
    html || '<li>No tasks found.</li>';
}

(function initWhenReady() {
  // Run only in the browser (harmless in SSR/Tests)
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function safe() {
    if (window.taskFiles && document.getElementById('task-list')) {
      renderTaskList(window.taskFiles);
    } else {
      setTimeout(safe, 30);     // retry until both are available
    }
  }

  safe();
  document.addEventListener('turbo:load', safe);
  document.addEventListener('page:change', safe);
  document.addEventListener('DOMContentLoaded', safe);
})();
