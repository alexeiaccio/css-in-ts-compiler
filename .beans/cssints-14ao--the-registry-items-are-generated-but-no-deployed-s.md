---
# cssints-14ao
title: The registry items are generated but no deployed site serves them
status: todo
type: bug
priority: high
created_at: 2026-11-15T09:38:28Z
updated_at: 2026-11-15T09:38:28Z
---

The docs' 'Add it' block fetches `https://packages.cssints.dev/r/<name>.result.json` and got a 404 for `hardware`. It is **not** a deploy lag — two independent breaks:

1. **The items are written outside the build.** `apps/ui/scripts/registry-json.ts` writes `r/<name>.json` (`apps/ui/r/`, 72 files incl. `hardware.json` and `hardware.result.json`), while the site ships `public/` → `dist/`. The deployed build has `dist/{assets,index.html,llms.txt}` and **no `r/`** — verified on the just-deployed `ui.cssints.dev`. (`llms.txt` *is* written into `public/` at line 736, which is why it ships and the items do not.)
2. **The advertised host is stale.** Line 719 and line 696 write `https://packages.cssints.dev/r/{name}.json`, and `apps/ui/src/docs/app.tsx:22` hardcodes `HOST = "https://packages.cssints.dev"`. This repo deploys `ui.cssints.dev` (`apps/ui/alchemy.run.ts`) and `cssints.dev` (`apps/docs/alchemy.run.ts`); nothing serves `packages.`, and `/r/hardware.result.json` 404s on all three.

**Consequence**: `npx shadcn@latest add @cssints/hardware` cannot work from the deployed site, and the catalog's install snippet is empty. The skin itself is fine — it renders at `ui.cssints.dev/#hardware`.

**Fix**: write the items into `public/r/` (one path change in `registry-json.ts`, plus whatever reads `apps/ui/r` — check `test/site.mjs` and the registry tests), and point the four host strings at the site that actually serves them (`ui.cssints.dev`). Then the block works without any further deployment machinery.

Noticed while looking: the deployed bundle is a single 3.58 MB chunk (963 kB gzipped) — the build already warns; code-splitting is a separate item.
