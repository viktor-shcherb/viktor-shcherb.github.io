---
layout: default
permalink: /blog/
title: "Blog"
description: "Latest post by Viktor Shcherbakov."
sitemap: false
---
{% assign latest = site.posts | first %}
<meta name="robots" content="noindex, follow">

<h1>{{ latest.title }}</h1>
<p class="post-meta">
  {%- if latest.author -%}
    <span class="byline">{{ latest.author }}</span>
    &nbsp;•&nbsp;
  {%- endif -%}

  <time datetime="{{ latest.date | date_to_xmlschema }}">
    {{ latest.date | date: "%b %-d, %Y" }}
  </time>
</p>

{% include post-cover.html post=latest %}

{{ latest.content }}

{%- if latest.tags and latest.tags != empty -%}
  <p class="post-tags">
    <strong><em>Keywords: </em></strong>
    {%- for tag in latest.tags -%}
      <em>{{ tag }}</em>{% unless forloop.last %}&nbsp;&middot;&nbsp;{% endunless %}
    {%- endfor -%}
  </p>
{%- endif -%}
