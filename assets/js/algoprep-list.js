// assets/js/algoprep-list.js

// Renders the task list at /algoprep/
export async function renderTaskList(taskFiles) {
  const list = document.getElementById('task-list');
  if (!list) return;
  list.innerHTML = '<h2>Available Tasks</h2><ul id="task-list-ul"><li>Loading tasks...</li></ul>';

  // Fetch all JSON files in parallel
  const tasks = await Promise.all(
    taskFiles.map(async slug => {
      try {
        const res = await fetch(`/algoprep/${slug}.json`);
        if (!res.ok) return null;
        const task = await res.json();
        return {slug, ...task};
      } catch (e) {
        return null;
      }
    })
  );

  // Build list HTML
  const html = tasks
    .filter(Boolean)
    .map(task =>
      `<li>
        <a href="/algoprep/task?id=${encodeURIComponent(task.slug)}">${task.title || task.slug}</a>
        <span style="font-size:0.95em; color: #888;">
          ${task.contributor ? `&mdash; ${task.contributor.name}` : ""}
        </span>
      </li>`
    ).join('');
  document.getElementById('task-list-ul').innerHTML = html || '<li>No tasks found.</li>';
}
