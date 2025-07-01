---
layout: default
title: "Algorithms Preparation"
permalink: /algoprep/
description: "Practice Python algorithm problems interactively in your browser. Browse, solve, and contribute new tasks."
robots: index, follow
---

# Algorithms Preparation Tasks

Welcome! This page contains a collection of Python algorithm problems for practice, contributed by the community.
Browse, solve, and contribute your own!

Find the source and contribute at [GitHub](https://github.com/viktor-shcherb/viktor-shcherb.github.io).

<hr>

## Available Tasks

<ul id="task-list" style="margin-top:2em;"><li>Loading tasks...</li></ul>

<script>
  window.taskFiles = [
    {% assign algoprep_jsons = site.static_files | where: "extname", ".json" %}
    {% assign files = algoprep_jsons | where_exp: "file", "file.path contains '/algoprep/'" %}
    {% for file in files %}
      "{{ file.name | replace: '.json', '' }}"{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];
</script>
<script type="module">
  import { renderTaskList } from '/assets/js/algoprep-list.js';
  // Wait for DOM and data
  function safe() {
    if (window.taskFiles && document.getElementById('task-list')) {
      renderTaskList(window.taskFiles);
    } else {
      setTimeout(safe, 30);
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    safe();
  } else {
    document.addEventListener('DOMContentLoaded', safe);
  }
</script>

