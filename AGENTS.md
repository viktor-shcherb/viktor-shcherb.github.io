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
- `assets/` — Static assets. SCSS stylesheets under `css/`, JS bundle output under `js/`, images under `images/`.
  - `assets/images/posts/<post-slug>/` — per-post images. Drop the cover image (and any inline figures used by the post) here. Keep the raw original alongside any stylized variants you ship — e.g. `cover.jpg` plus `cover.original.jpg`.
- `blog/` — Landing page for the blog. Displays the latest post.
- `logos-flavicon/` — Favicon and web manifest files.

## Posts: cover image + attribution

Every post can declare a cover image in front matter. The post layout (and the blog landing) renders it via `_includes/post-cover.html`.

```yaml
image:        /assets/images/posts/<post-slug>/cover.jpg   # local path, or external URL
image_alt:    "Short description for screen readers"
image_credit:
  by:          "Photographer Name"
  url:         https://example.com/photographer-profile     # optional
  source:      "Unsplash"                                   # optional
  source_url:  https://unsplash.com/photos/abc              # optional
```

Both `by` and `source` (with their optional URLs) get rendered as a single linked caption beneath the image: *Photo by **Name** on **Source***. Drop the inline `<img>` from the body — front matter is the single source of truth.

For inline figures inside the body, use semantic `<figure>` markup:

```html
<figure>
  <img src="/assets/images/posts/<slug>/diagram.png" alt="...">
  <figcaption>Caption with <a href="...">link</a> if needed.</figcaption>
</figure>
```

## Maintenance

When adding, removing, or renaming files in this repository, update this `AGENTS.md` so it reflects the current structure.
