---
layout: post
permalink: /blog/
---

{% assign latest = site.posts | first %}
<link rel="canonical" href="{{ latest.url | absolute_url }}">

<h1>{{ latest.title }}</h1>
<p class="post-meta">
  <time datetime="{{ latest.date | date_to_xmlschema }}">
    {{ latest.date | date: "%b %-d, %Y" }}
  </time>
</p>

{{ latest.content }}
