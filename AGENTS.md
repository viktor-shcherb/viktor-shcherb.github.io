# Repository Structure

This repository contains the source for a Jekyll-based personal website. Below is a brief overview of the key files and directories and how they relate to each other.

## Root Files

- `README.md` – Overview of the website and the Algoprep project. Links to `algoprep/` and explains how to contribute tasks.
- `LICENSE` – Repository license information.
- `Gemfile` / `Gemfile.lock` – Ruby dependencies required for building the site with GitHub Pages.
- `package.json` / `package-lock.json` – Node dependencies used mainly by build scripts in `scripts/` and tasks under `algoprep/`.
- `_config.yml` – Jekyll configuration. Determines site metadata (title, baseurl, author, etc.) and interacts with layouts under `_layouts/` and data files under `_data/`.
- `index.md` – Home page. Uses the `default` layout defined in `_layouts/`.
- `about.md` – “About me” page. Also uses the `default` layout and includes structured data via `_includes/person-schema.html`.
- `robots.txt` – Sitemap reference for search engines.
- `service-worker.js` – Caches algorithm task JSON files and Pyodide resources using Workbox.

## Core Directories

- `_data/` – YAML data files used by Jekyll. `nav.yml` defines the site navigation and is referenced by layout templates.
 - `_includes/` – Reusable partial templates and assets. For example, `task-head-template.html` and `task-body-template.html` are injected into `algoprep/task.html` when rendering algorithm tasks. `user-state-modal.html` defines the modal for saving user progress and configuring repository, PAT, save name and timeout, and now includes logout and token deletion controls.
- `_layouts/` – Page layouts for Jekyll. `default.html` is the base layout and `post.html` extends it for blog posts. Markdown files in `_posts/` and pages like `about.md` use these layouts via their front-matter.
- `_posts/` – Blog posts written in Markdown. Each file has YAML front-matter specifying `layout: post` so they render with `_layouts/post.html`.
 - `assets/` – Static assets. Contains SCSS stylesheets under `css/`, JavaScript modules in `js` (e.g., `editor.js` bundles CodeMirror modules from a CDN while sharing a single `@codemirror/state` instance, `state-settings.js` wires up the user state modal via the `/api/profile` endpoint), GitHub logos in `github/`, and images under `python/`.
  Code blocks with classes like `language-python-codemirror` are replaced at runtime by `editor.js` with `<div class="cm-static-view" data-code="…">` wrappers. A dedicated `pyodide-worker.js` runs the Python interpreter in a Web Worker for task execution. `copy-code.js` attaches copy buttons to these blocks and swaps the icon to a checkmark when the copy succeeds.
- `algoprep/` – JSON definitions of algorithm tasks, the `index.md` page, and the dynamic `task.html` used for interactive code execution. `scripts/prerender-tasks.mjs` reads these JSON files to generate static HTML using the templates from `_includes/`.
- `blog/` – Landing page for the blog. Displays the latest post and links to others.
- `logos-flavicon/` – Favicon and web manifest files.
- `scripts/` – Build and pre-render scripts. `prerender-tasks.mjs` runs during site builds to convert algorithm tasks into ready-to-serve HTML pages.
- `node_modules/` – Third‑party dependencies installed from `package.json`. Typically not edited directly.

## Maintenance Instruction

Whenever you add, remove, or modify files in this repository, update this `AGENTS.md` file accordingly so that it reflects the current structure and purpose of each file or directory.
