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

<div class="tasks-header">
  <h2 id="available-tasks">Available Tasks</h2>
  <button id="contribute-btn" class="contribute-btn">
    Contribute new task
  </button>
</div>

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

{% include contribute-modal.html %}

<!-- Contains a summary produced at build time so this page can render
     without fetching every task JSON file. -->
<script src="/assets/js/prerendered-tasks.js"></script>
<script type="module" src="/assets/js/algoprep-list.js"></script>
<script type="module" src="/assets/js/algoprep-contribute.js"></script>
