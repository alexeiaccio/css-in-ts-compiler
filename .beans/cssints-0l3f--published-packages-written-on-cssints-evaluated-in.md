---
# cssints-0l3f
title: 'Published packages written on cssints: evaluated in the app or pre-compiled?'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-02T07:52:36Z
parent: cssints-9js6
---

## Question

A dependency written on cssints (a component library in node_modules) is consumed by an app on cssints. Today the engine evaluates every attributed site in the app's Module Runner (cssints-grrd kept the library in the runner), which works for source dependencies but not for a package shipping compiled JS. Decide with the user: (a) packages ship source (.ts with the attribute, evaluated in the consumer), (b) packages ship compiled class strings plus their own sheet fragment that the consumer's sheet merges by layer, or (c) both, chosen by the package. What the types see across the boundary, how a kernel/token/@property dedupes across packages, and what plugins (frame, icons) need. Panda 2.0 "designSystem" is the prior art. Answer: a decision and, if needed, an implementation ticket.

## Resolution (with the user, 2026-10-02)

(a) Source, evaluated in the consumer. A package written on cssints ships its JS with `with { type: "cssints" }` kept (tsdown keeps import attributes) and its `.d.ts`; the consuming app's engine evaluates it in its Module Runner. One sheet, the app's targets and themes; tokens, kernels and `@property` dedupe because a module is evaluated once. Recognition by the marker in the file, the same check as app code, nothing to declare. The engine keeps such packages out of `optimizeDeps` so the attributes survive. Today plugin.ts skips everything in node_modules (the transform at line ~203 and `runnerDeps`). (b) pre-compiled classes plus a sheet fragment, for apps without cssints, waits for a first user. Implementation: "Consume packages written on cssints from node_modules".
