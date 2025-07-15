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

<div style="text-align:center; margin:3em 0;">
  <button id="contribute-btn" class="contribute-btn">
    Contribute new task
  </button>
</div>

<div id="contribute-modal" class="contribute-modal">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Contribute a New Task</h2>
    
      <!-- close button -->
      <button type="button" class="modal-close" title="Close">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
        <span class="visually-hidden">Close</span>
      </button>
    </div>

    <form id="task-form" autocomplete="off">
      <div class="tab-switcher">
        <div class="tab-btn-row">
          <!-- Task description tab -->
          <input type="radio" id="tab-edit" name="tabSwitcher" data-panel="#panel-edit" checked hidden>
          <label for="tab-edit" class="tab-btn" tabindex="0">
            <span class="material-symbols-outlined btn-icon-material-symbols" aria-hidden="true">
              edit  
            </span>
            Edit
          </label>
    
          <!-- Code interpreter tab -->
          <input type="radio" id="tab-preview" name="tabSwitcher" data-panel="#panel-preview" hidden>
          <label for="tab-preview" class="tab-btn" tabindex="0">
            <span class="material-symbols-outlined btn-icon-material-symbols" aria-hidden="true">
              visibility  
            </span>
            Preview
          </label>
        </div>
      </div>
      
      <section class="tab-panel" id="panel-edit">
        <div class="form-field">
          <label for="title">Title</label>
          <input id="title" name="title" required>
          <small class="hint">Shown in the task list.</small>
        </div>

        <div class="form-field">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="3" required class="auto-grow"></textarea>
          <small class="hint">Describe the task in as much detail as possible. Markdown is supported!</small>
        </div>

        <div class="form-field">
          <label for="functionName">Function Name</label>
          <input id="functionName" name="functionName" required>
          <small class="hint">The user will be asked to implement this function to solve the task.</small>
        </div>

        <!-- one shared row -------------------------------------------------------->
        <div class="form-row" style="display:flex; gap:3em; align-items:flex-start;">
        
          <!-- column 1 : return checkbox + type ---------------------------------->
          <div class="form-field return-config" style="flex:1;">
            <label>
              <input type="checkbox" id="hasReturn">
              Function returns a value
            </label>
        
            <select id="returnType" class="type-select" disabled>
              <option value="" disabled selected>Select return type...</option>
              <option value="int">Integer</option>
              <option value="float">Float</option>
              <option value="str">String</option>
              <option value="bool">Boolean</option>
            </select>
          </div>
        
          <!-- column 2 : stdin / stdout ----------------------------------------->
          <div class="form-field io-config" style="flex:1; background=var(--surface-accented)">
            <label class="visually-hidden">I/O behaviour</label>
        
            <div class="io-row" style="display:flex; justify-content:space-between;">
              <label>
                <input type="checkbox" id="enableStdin">
                Enable stdin
              </label>
        
              <label>
                <input type="checkbox" id="enableStdout">
                Enable stdout
              </label>
            </div>
        
            <small class="hint">
              If enabled, the function will be expected to read from <code>stdin</code>
              and/or write to <code>stdout</code>.
            </small>
          </div>
        </div>

        <div class="form-field">
          <label>Function Arguments</label>
          <div id="args-list"></div>
          <button type="button" id="add-arg" class="add-btn">
            Add argument
          </button>
        </div>

        <div class="form-field">
          <label>Tests</label>
          <div id="tests-list"></div>
          <button type="button" id="add-test" class="add-btn">
            Add test
          </button>
        </div>

        <div class="action-row">
          <!-- download button – left-aligned -->
          <button type="button" id="download-json" class="submit-btn">
            <span class="material-symbols-outlined btn-icon-material-symbols" aria-hidden="true">download</span>
            Download JSON
          </button>
        
          <!-- existing submit button – right-aligned -->
          <button type="submit" class="submit-btn">
            <img src="/assets/github/github-mark-white.svg"
                 alt="GitHub" class="submit-btn-icon">
            Submit
          </button>
        </div>
      </section>
      
      <section class="tab-panel" id="panel-preview">
        {% include task-head-template.html %}
        {% include task-body-template.html %}
      </section>
    </form>
  </div>
</div>

<!-- Contains a summary produced at build time so this page can render
     without fetching every task JSON file. -->
<script src="/assets/js/prerendered-tasks.js"></script>
<script type="module" src="/assets/js/algoprep-list.js"></script>
<script type="module" src="/assets/js/algoprep-contribute.js"></script>
