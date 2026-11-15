---
# cssints-egl4
title: 'The conformance results are stale: 7 items of 65 have one, and it is three weeks old'
status: completed
type: bug
priority: normal
created_at: 2026-11-15T12:08:36Z
updated_at: 2026-11-15T14:02:55Z
---

The docs page asks the registry host for `r/<name>.result.json` before it shows the 'Add it' block, and hides the block on a 404 **by design**. After the registry went live (`ui.cssints.dev/r/hardware.json` now 200) that lookup is what still keeps the block empty for most items:

- `apps/ui/public/r` holds 7 `.result.json` files against 65 `.json` items;
- the newest content is `{ "item": "accordion", "version": "0.4.1", "files": 7, "passedAt": "2026-10-26T16:01:35.786Z" }` — three weeks old, and the versions it names (`0.4.1`) have long moved on (0.37.1 next);
- nothing in `apps/ui/scripts` writes it; only `src/docs/app.tsx:208` reads it.

So an item that has never been through the preflight is installable (`npx shadcn add https://ui.cssints.dev/r/<name>.json` works) while its own page pretends it is not published. The one place that knows the answer is the starter smoke test, which copies every item and runs its conformance — the producer should be that run, publishing `{item, version, files, passedAt}` per item once its copied tests pass.

Decide first: is the record **a fact about a released version** (then it is written by the release, and the page should compare it against the item's current files) or **a build artifact of the smoke run** (then it is regenerated on master and committed)? The second is cheaper and always current; the first is honest about what a consumer actually installs.

## Summary of Changes

PR **#192** (`results/smoke`), open.

Decided with the user: the conformance record is an **artifact of the starter smoke**, **committed in master** next to the items, and it carries **no date and no version** — a `passedAt` would make the "registry items are current" step dirty after every merge, and a version goes stale the moment it is written.

**The fingerprint.** `apps/ui/src/docs/item-hash.ts`, one function both sides call: sha256 over the item JSON's `files` **in their order**, each contributing `target`, a NUL, `content`, a NUL; lowercase hex, prefixed `sha256:`. WebCrypto, so Node, Bun and the browser agree. Record: `{"item":"<name>","files":"sha256:<hex>"}`.

**Producer.** `scripts/starter-smoke.mjs` writes the record after an item's copied conformance passed and the copy type-checked, from the same item JSON the local server handed the shadcn CLI; it rewrites only when the bytes differ. `theme` has no test and is not a page — 64 records, not 65.

**Consumer.** The page hashes the item JSON it bundles and draws the section only when `record.item === item` **and** the fingerprints match; a stale record hides it again. The fetch is now `${location.origin}/r/<name>.result.json` — since `ed53f16f` the items are built into this site, so the page had been asking another deployment.

**The 7 stale files** (`accordion`, `button`, `checkbox`, `disclosure`, `radio`, `switch`, `tabs`, all naming `0.4.1` and 2026-10-26) are deleted; the smoke wrote all 64 in the new shape.

**CI.** `check` gets `contents: write` for one guarded step (`push`, `refs/heads/master`): `git add -- 'apps/ui/public/r/*.result.json'`, an ordinary commit, `git push origin HEAD:master`; a `GITHUB_TOKEN` push starts no run, so no loop. PRs write into their own checkout and stop — the fingerprint makes staleness harmless. The results also travel as an artifact to `deploy`, whose own checkout is older, so the deployed record is not one deploy behind.

Also in this PR, my miss from #189: `templates/solid-vite/components.json` still named the dead `packages.cssints.dev`, which broke every scaffolded project and is what made the smoke's LIVE step time out.

Evidence: the smoke from an empty tree writes 64 and passes; a second run rewrites 0; `test/site.mjs` asserts the section draws for `#accordion` and hides for `#tabs` with a doctored fingerprint; the registry regeneration is a no-op twice in a row.
