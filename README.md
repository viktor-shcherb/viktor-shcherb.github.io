This repository contains the source for my personal website. The site is built with [Jekyll](https://jekyllrb.com/) and hosts my blog, pages about me, and small projects.

## Projects

### Algoprep

**Algoprep** is an interactive collection of Python algorithm problems. Tasks can be solved right in the browser thanks to Pyodide. You can visit it at [`/algoprep/`](https://viktor-shcherb.github.io/algoprep/).

#### Contributing a Task

1. Go to the [Algoprep page](https://viktor-shcherb.github.io/algoprep/) and click **"Contribute new task"**.
2. Fill in the form describing your problem. Submitting the form opens a new GitHub issue pre-filled with your task JSON. You may also add your name and GitHub profile in the `contributor` section.
3. Complete the issue and submit it. After a moderator reviews and applies the `approved task` label, a GitHub Action automatically commits your JSON file into the `algoprep` directory and closes the issue with a link to the new task page.
4. The site rebuilds via another workflow whenever the `master` branch updates, so your task becomes available on the website shortly afterwards.

---

Feel free to explore the code or open issues for suggestions and feedback.
