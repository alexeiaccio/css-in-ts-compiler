---
# cssints-h0d5
title: 'Hotkeys: one registry instead of a handler per app'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T17:31:21Z
parent: cssints-65eb
---

Every app rewrites /, Cmd+K, Cmd+S, arrows: apps/docs Search.tsx, cms-admin, kocharin Artworks.

- [ ] a small composable (register a chord with modifiers, ignore while a text field is focused unless asked, scope to a subtree)
- [x] documented collisions with the browser's own chords (README 'Hotkeys', docs/API.md)
- [ ] adopt in apps/docs (search focus) and cms-admin (save, publish)

## Notes

`createHotkeys(options?: { isApple?: boolean })` in `packages/headless/src/hotkeys.ts`: `bind({ keys, onTrigger, when?, preventDefault?, allowInEditable?, scope? })` returns an idempotent unbind; `dispose()` clears the registry.

Decisions:

- **One document `keydown` listener in the capture phase**, not one per scope: a `scope` only filters the event target, so precedence is one list rather than the capture order (a document listener would otherwise beat an element listener no matter when it was bound). The listener is added with the first binding and removed with the last one or `dispose`.
- **Last bound wins**, the only firing binding per event; a `when` that is false falls through to the next match so a modal can close its gate without unbinding. `preventDefault` defaults on.
- **Exact modifiers**: a chord without `shift` does not fire while Shift is held; a shifted character implies Shift (`"?"`), otherwise `"?"` could never match on a US layout.
- **`isApple` injected** for `mod`, because the default reads `navigator.platform` and a test must not depend on the runner's OS.
- Editable guard: `input`, `textarea` and `isContentEditable` (inherited included); an unknown modifier or a chord with no key throws a `TypeError` at `bind`.
- No APG pattern exists for a keyboard registry, so no Quint spec: `packages/headless/test/hotkeys.browser.test.tsx` (11 tests, real Chromium) is the oracle.

Still open: adoption in apps/docs (search focus) and cms-admin (save, publish) - not part of this change.
