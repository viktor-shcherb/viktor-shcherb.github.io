export async function loadTask(slug){
  const r = await fetch(`/algoprep/${slug}.json`);
  if (!r.ok) throw new Error('Task not found');
  const task = await r.json();          // { title, description, signature, tests, … }
  task.slug = slug;
  return task;
}
