---
layout: default
title: "Algorithms Preparation"
permalink: /algoprep/
---

## Available Tasks

<ul>
  {% for task in site.algoprep_tasks %}
    <li><a href="{{ task.url }}">{{ task.title }}</a></li>
  {% endfor %}
</ul>
