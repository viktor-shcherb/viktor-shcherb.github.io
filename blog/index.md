---
layout: post
permalink: /blog/
---
{% assign latest = site.posts | first %}
<link rel="canonical" href="{{ latest.url | absolute_url }}">

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

{{ latest.content }}

{%- if latest.tags and latest.tags != empty -%}
  <p class="post-tags" style="font-size:0.85em;">
    <strong><em>Keywords:</em></strong>
    {%- for tag in latest.tags -%}
      <em>{{ tag }}</em>{% unless forloop.last %}&nbsp;&middot;&nbsp;{% endunless %}
    {%- endfor -%}
  </p>
{%- endif -%}
