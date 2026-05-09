#!/usr/bin/env python3
"""Refresh the 'Recently on the blog' block in README.md from _posts/.

Parses the post filenames + frontmatter directly so it doesn't depend on
a built site or a published feed (no race with GH Pages deploy).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
POSTS_DIR = ROOT / "_posts"
SITE_URL = "https://vshcherbakov.com"
START = "<!-- RECENT_POSTS_START -->"
END = "<!-- RECENT_POSTS_END -->"
N = 5

FILENAME_RE = re.compile(
    r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})-(?P<slug>.+)\.md$"
)


def parse_post(path: Path):
    m = FILENAME_RE.match(path.name)
    if not m:
        return None
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None
    frontmatter = parts[1]
    if re.search(r"^hidden:\s*true\b", frontmatter, re.MULTILINE):
        return None
    if re.search(r"^sitemap:\s*false\b", frontmatter, re.MULTILINE):
        return None
    title_match = re.search(r"^title:\s*(.+)$", frontmatter, re.MULTILINE)
    if not title_match:
        return None
    title = title_match.group(1).strip().strip('"').strip("'")
    date = f"{m['year']}-{m['month']}-{m['day']}"
    url = f"{SITE_URL}/{m['year']}/{m['month']}/{m['day']}/{m['slug']}/"
    return (date, title, url)


def main():
    posts = []
    for path in POSTS_DIR.glob("*.md"):
        parsed = parse_post(path)
        if parsed:
            posts.append(parsed)
    posts.sort(key=lambda x: x[0], reverse=True)
    posts = posts[:N]

    if posts:
        body = "\n".join(
            f"- [{title}]({url}) — {date[:7]}" for date, title, url in posts
        )
    else:
        body = "_No posts yet._"

    text = README.read_text(encoding="utf-8")
    pattern = re.compile(rf"{re.escape(START)}.*?{re.escape(END)}", re.DOTALL)
    new_block = f"{START}\n{body}\n{END}"
    if not pattern.search(text):
        raise SystemExit(
            f"README.md is missing the {START} ... {END} marker block."
        )
    updated = pattern.sub(new_block, text)
    if updated == text:
        print("README unchanged.")
        return
    README.write_text(updated, encoding="utf-8")
    print("README updated.")


if __name__ == "__main__":
    main()
