---
name: New task
about: Use this template to propose a new task
title: ''
labels: New task
assignees: viktor-shcherb

---

# Context

_Describe where you encountered this task, or any other comments that would help reviewers understand the context and motivation for adding this problem._

# Task JSON

**Fill out the JSON below.**
- You can look at [examples in the `algoprep` directory](https://github.com/viktor-shcherb/viktor-shcherb.github.io/tree/main/algoprep) for inspiration.
- The **first three tests** you provide will be shown to users as examples; additional tests will be hidden but still used for validation.

```json
{
  "title": "",
  "description": "",
  "signature": { "name": "", "args": [] },
  "tests": [
    { "input": {}, "output": "" }
  ],
  "contributor": {
    "name": "",
    "github": ""
  }
}
````

### **Field Explanations**

* **title**:
  The short name of the task, e.g., `"Hello World"`.

* **description**:
  The full task statement. You can use Markdown here and include example inputs/outputs for clarity.

* **signature**:
  The function signature the user needs to implement:

  * **name**: The function name, e.g., `"hello_world"`.
  * **args**: A list of argument definitions.
    Each argument is a dictionary with:

    * **name**: The argument name (string).
    * **type**: The argument type (string, e.g., `"int"`, `"str"`, etc.).
      Example:

    ```json
    "args": [ {"name": "x", "type": "int"}, {"name": "y", "type": "str"} ]
    ```

    If no arguments are required, use an empty list: `[]`.

* **tests**:
  A list of test cases for this task.

  * Each test has:

    * **input**: An object mapping argument names to example values.
    * **output**: The expected output for those inputs.
  * The **first three tests** will be shown as examples on the site; the rest will be used for validation but hidden.

* **contributor**:
  Credit for the author of the problem.

  * **name**: Your name.
  * **github**: Link to your GitHub profile, e.g., `"https://github.com/yourusername"`.

*If in doubt, check existing tasks in the [`algoprep` directory](https://github.com/viktor-shcherb/viktor-shcherb.github.io/tree/master/algoprep) as reference!*
Thank you for your contribution!
