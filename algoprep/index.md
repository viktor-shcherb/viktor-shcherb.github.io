---
layout: default
title: "Algorithms Preparation"
permalink: /algoprep/
---

<!--
  This page intentionally left blank: task list and content are rendered by JS at runtime.
-->

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

