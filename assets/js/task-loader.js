export async function loadTask(slug){
  const r = await fetch(`/algoprep/${slug}.json`);
  if (!r.ok) throw new Error('Task not found');
  return r.json();                       // { title, description, signature, tests, … }
}
