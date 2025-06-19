---
layout: default 
permalink: /blog/        # keep the /blog/ URL
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <!-- Liquid grabs the first post (newest) -->
    {% assign latest = site.posts | first %}
    <meta http-equiv="refresh"
          content="0; url={{ latest.url | relative_url }}">
    <link rel="canonical"
          href="{{ latest.url | absolute_url }}">
    <title>Redirecting to {{ latest.title }}</title>
  </head>
  <body>
    <p>
      Redirecting to
      <a href="{{ latest.url | relative_url }}">{{ latest.title }}</a>…
    </p>
  </body>
</html>