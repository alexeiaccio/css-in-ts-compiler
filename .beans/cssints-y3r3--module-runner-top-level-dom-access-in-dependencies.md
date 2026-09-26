---
# cssints-y3r3
title: 'Module Runner: top-level DOM access in dependencies fails (no shaker)'
status: todo
type: bug
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

`spikes/runner/fixtures/risk6.ts` fails with `document is not defined`: the whole module executes in the runner, with no shaker and no DOM stub. `apps/demo` does not hit this, because `main.tsx` does not import cssints.

- [ ] Try `happy-dom` globals in the runner environment (wyw does the same)
- [ ] `fixtures/risk6.ts` passes
- [ ] Only then consider a shaker
