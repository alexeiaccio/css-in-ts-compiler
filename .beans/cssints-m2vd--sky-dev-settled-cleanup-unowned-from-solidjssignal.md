---
# cssints-m2vd
title: 'sky dev: SETTLED_CLEANUP_UNOWNED from @solidjs/signals rc.13'
status: completed
type: bug
priority: normal
created_at: 2026-10-05T11:27:20Z
updated_at: 2026-10-05T11:44:36Z
---

Found in cssints-lfoi: every apps/sky dev run logs [SETTLED_CLEANUP_UNOWNED] onSettled returned a cleanup in an unowned scope (@solidjs/signals 2.0.0-rc.13). Find the call site in sky (or the router/plugin), fix it in sky if it is ours, else document upstream with a minimal repro and an issue link draft; a dev check that fails on that warning.

## Summary of Changes

- Source: `apps/sky/src/profile/Sentinel.tsx` (the profile's infinite-scroll sentinel, browser only, dev build only; no SSR in sky) called `onSettled` with a cleanup inside a `ref` callback. `@solidjs/web`'s `ref()` runs the callback under `runWithOwner(null, ...)`, so the cleanup had no owner: dev throws SETTLED_CLEANUP_UNOWNED, production drops the cleanup silently (the IntersectionObserver was never disconnected). The router's own `onSettled` calls return nothing and are not affected; Home's sentinel already called it in the body.
- Fix: `onSettled` in the component body, the box through a `ref` assignment (as Home's sentinel does).
- Found on the way, same dev-build check: Thread.tsx's `createEffect(..., () => focused?.scrollIntoView(...))` returned Chrome's scrollIntoView promise as the effect cleanup: dev showed "Could not load the thread: effect callback returned an invalid cleanup value". Block body now.
- Guard: `apps/sky/test/dev-browser.mjs` (`bun run test:dev`) opens `/`, `/settings`, a profile, a thread and `/dev/posts` on the vite dev server in Chrome with the API stubbed by the recorded fixtures; fails on a page error, a console error or a SETTLED_CLEANUP_UNOWNED message. Checked to fail on the old Sentinel.
- Upstream: not a solid bug strictly (the diagnostic is documented, ref callbacks unowned by design); the gap is that nothing says refs are unowned. Draft issue in the final report of the agent.
