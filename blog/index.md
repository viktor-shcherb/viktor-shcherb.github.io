---
layout: default
permalink: /blog/
title: "Blog"
description: "All posts by Viktor Shcherbakov — long-form notes on ML, software, and the practical side of life and work in Switzerland."
---

<h1 class="archive-title">Blog</h1>

{%- assign visible_posts = site.posts | where_exp: "p", "p.hidden != true" -%}
{%- if visible_posts == empty -%}
  <p>No posts yet.</p>
{%- else -%}
  <ol class="archive-list">
  {%- for post in visible_posts -%}
    <li class="archive-entry">
      {%- if post.image -%}
        <a class="archive-entry-cover" href="{{ post.url | relative_url }}" aria-hidden="true" tabindex="-1">
          <img src="{{ post.image }}" alt="" loading="lazy" decoding="async">
        </a>
      {%- endif -%}
      <h2 class="archive-entry-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h2>
      <p class="archive-entry-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d, %Y" }}</time>
      </p>
      {%- if post.description -%}
        <p class="archive-entry-desc">{{ post.description | strip_newlines | strip }}</p>
      {%- endif -%}
    </li>
  {%- endfor -%}
  </ol>
{%- endif -%}
