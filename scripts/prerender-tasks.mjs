import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { ensureTaskSkeleton, populateTaskDOM } from '../assets/js/task-render-core.js';

const SITE_DIR = '_site';
const TASK_TEMPLATE = join(SITE_DIR, 'algoprep', 'task.html');
const TASK_JSON_DIR = 'algoprep';

async function main() {
  const templateHtml = await readFile(TASK_TEMPLATE, 'utf8');
  const taskFiles = (await readdir(TASK_JSON_DIR)).filter(f => f.endsWith('.json'));
  const summary = {};
  for (const file of taskFiles) {
    const slug = file.replace(/\.json$/, '');
    const json = JSON.parse(await readFile(join(TASK_JSON_DIR, file), 'utf8'));
    const dom = new JSDOM(templateHtml);
    const { document } = dom.window;
    ensureTaskSkeleton(document);
    populateTaskDOM(json, document, marked.parse);
    const script = document.createElement('script');
    script.textContent = `window.PRE_RENDERED_TASK = ${JSON.stringify({ slug, ...json })}`;
    document.body.appendChild(script);
    const outDir = join(SITE_DIR, 'algoprep', 'task', slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'index.html'), dom.serialize());
    summary[slug] = { title: json.title, contributor: json.contributor };
  }
  const summaryPath = join(SITE_DIR, 'assets', 'js', 'prerendered-tasks.js');
  await mkdir(dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `window.preRenderedTasks = ${JSON.stringify(summary)};`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
