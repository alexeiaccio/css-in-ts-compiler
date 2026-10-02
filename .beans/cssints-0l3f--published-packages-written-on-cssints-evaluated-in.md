---
# cssints-0l3f
title: 'Published packages written on cssints: evaluated in the app or pre-compiled?'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-01T07:28:59Z
parent: cssints-9js6
---

## Question

A dependency written on cssints (a component library in node_modules) is consumed by an app on cssints. Today the engine evaluates every attributed site in the app's Module Runner (cssints-grrd kept the library in the runner), which works for source dependencies but not for a package shipping compiled JS. Decide with the user: (a) packages ship source (.ts with the attribute, evaluated in the consumer), (b) packages ship compiled class strings plus their own sheet fragment that the consumer's sheet merges by layer, or (c) both, chosen by the package. What the types see across the boundary, how a kernel/token/@property dedupes across packages, and what plugins (frame, icons) need. Panda 2.0 "designSystem" is the prior art. Answer: a decision and, if needed, an implementation ticket.
