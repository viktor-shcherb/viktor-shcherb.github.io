---
layout: default
permalink: /projects/
title: "Projects"
description: "Things Viktor Shcherbakov is building. Currently featured: jseek.co — a watchlist-style aggregator for company career pages."
---

<h1 class="archive-title">Projects</h1>

{%- assign visible_projects = site.projects | where_exp: "p", "p.hidden != true" | sort: 'order' -%}
{%- if visible_projects == empty -%}
  <p>No projects yet.</p>
{%- else -%}
  <ul class="project-list">
  {%- for p in visible_projects -%}
    <li class="project-card">
      <a class="project-card-link" href="{{ p.url | relative_url }}">
        {%- if p.logo -%}
          <img class="project-card-logo" src="{{ p.logo | relative_url }}" alt="" loading="lazy" decoding="async">
        {%- endif -%}
        <div class="project-card-text">
          <h2 class="project-card-title">
            {{ p.title }}
            {%- if p.status -%}
              <span class="project-status project-status--{{ p.status }}">{{ p.status }}</span>
            {%- endif -%}
          </h2>
          {%- if p.tagline -%}
            <p class="project-card-tagline">{{ p.tagline }}</p>
          {%- endif -%}
          {%- if p.description -%}
            <p class="project-card-desc">{{ p.description | strip_newlines | strip }}</p>
          {%- endif -%}
        </div>
      </a>
    </li>
  {%- endfor -%}
  </ul>
{%- endif -%}
