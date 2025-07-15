/**
 * Build-time script that expands each algorithm task JSON into a static
 * HTML page under `_site/algoprep/task/`.  By doing this after Jekyll
 * has built the site we keep all source files untouched while reducing
 * runtime work in the browser.
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { ensureTaskSkeleton, populateTaskDOM } from '../assets/js/task-render-core.js';

const SITE_DIR = '_site';
const TASK_TEMPLATE = join(SITE_DIR, 'algoprep', 'task.html');
const TASK_JSON_DIR = 'algoprep';

async function main() {
  // Jekyll already produced `task.html` with the layout and scripts.
  // We load that file once and reuse it as a DOM template for every
  // algorithm task.
  const templateHtml = await readFile(TASK_TEMPLATE, 'utf8');

  // Collect all task files and prepare a summary object that the list
  // page will later consume instead of fetching JSON.
  const taskFiles = (await readdir(TASK_JSON_DIR)).filter(f => f.endsWith('.json'));
  const summary = {};
  for (const file of taskFiles) {
    const slug = file.replace(/\.json$/, '');
    const json = JSON.parse(await readFile(join(TASK_JSON_DIR, file), 'utf8'));
    // Start from the template each time so every page has the same
    // structure as the dynamic one.
    const dom = new JSDOM(templateHtml);
    const { document } = dom.window;
    // Insert the placeholders and populate them with the task data.
    ensureTaskSkeleton(document);
    populateTaskDOM(json, document, marked.parse);
    // Embed the task object so `task-page.js` can skip the fetch.
    const script = document.createElement('script');
    script.textContent = `window.PRE_RENDERED_TASK = ${JSON.stringify({ slug, ...json })}`;
    document.body.appendChild(script);
    const outDir = join(SITE_DIR, 'algoprep', 'task', slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'index.html'), dom.serialize());
    summary[slug] = { title: json.title, contributor: json.contributor };
  }
  // Save the summary so the list page can render without extra requests.
  const summaryPath = join(SITE_DIR, 'assets', 'js', 'prerendered-tasks.js');
  await mkdir(dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `window.preRenderedTasks = ${JSON.stringify(summary)};`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
