// Browser-specific wrapper around the core DOM helpers.
// This module wires in Marked and CodeMirror, leaving the generic
// DOM manipulation code reusable from Node during prerendering.

import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';
import { renderReadOnlyCodeBlocks } from './editor.js';
import {
  ensureTaskSkeleton as ensureDocSkeleton,
  signatureToDef,
  callFromSignature,
  populateTaskDOM,
} from './task-render-core.js';

export { signatureToDef, callFromSignature } from './task-render-core.js';

export function ensureTaskSkeleton() {
  // Keep a single implementation for injecting templates.
  // In the browser we simply delegate to the shared helper.
  ensureDocSkeleton(document);
}

export function renderTask(task, container) {
  // Fill the placeholders using the shared logic and then
  // activate CodeMirror so the code samples look the same as
  // those built dynamically.
  populateTaskDOM(task, container, marked.parse);
  renderReadOnlyCodeBlocks();
}
