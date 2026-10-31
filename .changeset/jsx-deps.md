---
"cssints": patch
---

The evaluation server compiles a dependency's `.jsx` inertly too.

A package that ships `.jsx` sources (`@solidjs/router` does, behind its `solid` condition) reached the private Vite server of a build and the app server's `ssr` environment untransformed, where Vite's generic transform asked for `react/jsx-runtime` — which an app on another framework does not install, so the build failed on the first module importing it. A `.jsx` the runner follows into has the same job as the app's own components: its top level must run, its elements are irrelevant.
