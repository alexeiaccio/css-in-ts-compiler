---
# cssints-n9my
title: 'reset(): a modern CSS reset as a global in its own layer'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
`reset()` emits a small modern reset as `{ rule, layer: "reset" }` globals, declared below the app layers so anything beats it.

## Sources
- https://jakelazaroff.com/words/my-modern-css-reset/
- https://vale.rocks/posts/css-reset
- https://github.com/elad2412/the-new-css-reset
- https://piccalil.li/blog/my-favourite-3-lines-of-css/
- https://impeccable.style/
- https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025

## Shape
- scope `reset`, one `layers: ["reset"]` entry and one global; options as flags: `reset({ prose?: boolean, media?: boolean })`.

## Todo
- [ ] pick the rule set (jakelazaroff + piccalil 3 lines)
- [ ] global + layer
- [ ] fixture
