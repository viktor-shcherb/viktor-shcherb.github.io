# Repository Structure

This repository contains the source for a Jekyll-based personal website. Below is a brief overview of the key files and directories.

## Root Files

- `README.md` — Overview of the website.
- `LICENSE` — Repository license.
- `Gemfile` / `Gemfile.lock` — Ruby dependencies for building the site with GitHub Pages.
- `package.json` / `package-lock.json` — Node tooling (esbuild + TypeScript) for the bundled site script. `npm run build` emits `assets/js/site.js` from sources under `src/ts/`. Run before `jekyll build` (CI does this automatically).
- `tsconfig.json` — Strict TypeScript config used by `npm run typecheck`.
- `src/ts/` — TypeScript sources for the bundle: nav dropdown, theme toggle, copy-code button, post-page heading anchors, and the SW cleanup registration.
- `_config.yml` — Jekyll configuration. Determines site metadata (title, baseurl, author, etc.) and interacts with layouts under `_layouts/` and data files under `_data/`.
- `index.md` — Home page, uses `_layouts/default.html`.
- `about.md` — "About me" page. Uses `_layouts/default.html` and includes structured data via `_includes/person-schema.html`.
- `robots.txt` — Sitemap reference for search engines.
- `service-worker.js` — Self-unregistering stub kept around so visitors with a cached service worker from the algoprep era clean up on their next visit.

## Core Directories

- `_data/` — YAML data files used by Jekyll. `nav.yml` defines the site navigation and is referenced by layout templates.
- `_includes/` — Reusable partial templates and assets.
- `_layouts/` — Page layouts. `default.html` is the base layout; `post.html` extends it for blog posts.
- `_posts/` — Blog posts in Markdown. Each file has front-matter `layout: post`.
- `assets/` — Static assets. Contains SCSS stylesheets under `css/` and JavaScript modules under `js/`.
- `blog/` — Landing page for the blog. Displays the latest post.
- `logos-flavicon/` — Favicon and web manifest files.

## Maintenance

When adding, removing, or renaming files in this repository, update this `AGENTS.md` so it reflects the current structure.
