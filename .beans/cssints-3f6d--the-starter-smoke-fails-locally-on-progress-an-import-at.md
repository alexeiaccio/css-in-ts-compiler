---
# smoke
title: 'the starter smoke fails locally on progress (an import attribute Bun will not load)'
status: todo
type: bug
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-22T20:40:00Z
updated_at: 2026-11-22T20:40:00Z
---

`bun scripts/starter-smoke.mjs` on this machine (Bun 1.3.1, macOS) ends with:

```
these copied tests failed: src/components/ui/progress.browser.test.tsx
Error: Failed to import test file … TEMP/cssints-starter-…/src/components/ui/progress.browser.test.tsx
Caused by: TypeError: Failed to fetch dynamically imported module: …
```

and above it, from Vite's module runner: `Import attribute "type" with value "cssints" is not supported in file://…
/node_modules/cssints/dist/index.mjs` (the attribute lives in `dist/instrument-*.mjs`, which `index.mjs` imports).

The same script, same commit, is green in CI (`ui` workflow, `The starter kit, end to end`) — twice — and reproduces here
twice, in two different temp directories under `/private/var/folders/…`. So it is environmental: the OS temp path, or Bun's
loader in this version refusing the `with { type: "cssints" }` that the plugin's own module runner is supposed to intercept.
No starter code is involved: `progress` is untouched and every other copied test (70 of them) passes.

What to try: run the smoke with `TMPDIR=/tmp` (the path is the only difference from CI besides the Bun build), then with a
Bun version from `setup-bun` (`bun --version` there), and if the temp path is the trigger, normalise it in the script.

Not urgent — CI is the gate — but it makes the smoke unusable locally, which is how the picker's hold-back was found and
would be found again.
