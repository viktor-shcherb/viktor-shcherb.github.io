import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';
import { renderReadOnlyCodeBlocks } from './editor.js';
import {
  ensureTaskSkeleton as ensureDocSkeleton,
  signatureToString,
  populateTaskDOM,
} from './task-render-core.js';

export { signatureToString } from './task-render-core.js';

export function ensureTaskSkeleton() {
  ensureDocSkeleton(document);
}

export function renderTask(task, container) {
  populateTaskDOM(task, container, marked.parse);
  renderReadOnlyCodeBlocks();
}
