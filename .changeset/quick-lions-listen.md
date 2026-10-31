---
"cssints": minor
---

A plugin runtime with a `script` (or `css`) and no `polyfills` is delivered for every target, not only where a target lacks a feature: a plugin whose own script is the feature (`@cssints/reactive`) ships it in every build. `ship({ owner, open })` (from `cssints/plugin`) is a site that returns more than a class string: each style becomes its class string and the rest its JSON, so `state()`'s owner and its sources reach the browser as an object.
