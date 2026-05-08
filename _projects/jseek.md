---
title: jseek.co
slug: jseek
order: 1
featured: true
status: beta
tagline: A watchlist-style aggregator for company career pages.
description: >
  jseek monitors a curated set of company career pages and surfaces every new
  posting in a single feed — built to power "wait for the right opportunity"
  applying instead of spray-and-pray.
live_url: https://jseek.co
repo_url: https://github.com/colophon-group/jobseek
logo: /assets/images/projects/jseek/logo.png
image: /assets/images/projects/jseek/logo.png
image_alt: "jseek.co — a watchlist-style aggregator for company career pages"
---

### Origin

When I started applying for jobs in Switzerland I quickly exhausted the pool of postings my profile suited. My fallback became a daily ritual: open the career pages of every company I knew was hiring in roles I wanted, scan, close, repeat. Twenty-plus tabs at any given time, much of the same content from yesterday.

So I built a scraper for myself. It re-ran every morning and replaced an hour of clicking with thirty seconds of reading. The first version was a small Streamlit app — [job-seek][prequel] — built fast and just for me.

It worked well enough that I figured the daily-monitor *habit* was the actual product, not the scraper underneath it. [jseek.co][live] is that habit, productised.

### What it is

A watchlist-style aggregator. You pick a set of companies; jseek monitors their career pages and feeds new postings into one place. The opposite of spray-and-pray: it powers a "wait for the right opportunity" approach to the search.

### How it's built (short)

- **Crawler** — Python (asyncio, httpx, redis). Per-board monitors fan out scrape tasks; a Lua-backed Redis queue schedules them. CPU work and R2 staging happen in workers.
- **Storage** — Local Postgres is the system of record; a CDC-style exporter pushes deltas to Supabase + Typesense.
- **Search** — Typesense for everything user-facing (typeahead, browse, watchlist filters). Postgres only handles auth and the full posting blob.
- **Frontend** — Next.js on Vercel with Drizzle ORM, Better Auth, and Lingui for i18n.

### Status

In active development. Companies are added by community-contributed agents resolving open `company-request` issues — the contribution flow uses a small CLI (`ws`) that walks an LLM agent through the per-company setup and verifies the work before opening a PR.

The Streamlit prototype, [`viktor-shcherb/job-seek`][prequel], is preserved as the prequel: the working artefact that proved the daily-monitor habit was worth productising.

[live]: https://jseek.co
[prequel]: https://github.com/viktor-shcherb/job-seek
