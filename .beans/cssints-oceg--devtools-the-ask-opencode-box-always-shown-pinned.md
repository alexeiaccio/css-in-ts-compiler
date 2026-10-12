---
# cssints-oceg
title: 'Devtools: the Ask OpenCode box always shown, pinned to the panel''s bottom edge, with how to connect and which session'
status: completed
type: feature
created_at: 2026-10-12T13:20:56Z
updated_at: 2026-10-12T14:30:00Z
---

User (2026-10-12): show the prompt box even when no element is picked; pin it to the bottom edge of the panel; it needs text on how to connect an OpenCode session and then which session is connected.

- [x] box shown whenever opencode is on (no selected element needed); a prompt without an element is just the instruction (plus the page url)
- [x] pinned (user refinement): at the bottom of the panel in a left or right dock, at the right edge (20 rem column) in a top or bottom dock, in the detached window by its shape; the inspection scrolls, the box never scrolls away
- [x] a title row `OpenCode` with the connection state (dot and word) over the input and the status line
- [x] a line under/over it: not connected -> how to connect (start OpenCode or opencode serve --service; the dev server finds it; sessions open in the repo folder; @opencode/client installed); connected -> service address and the session (id of the last session; click copies / title shows it)
- [x] the dev server answers a link probe (Service.discover) when the panel opens and when the box is focused or a send failed, so starting OpenCode later shows up without a reload
- [x] tests (opencode.mjs, ask-browser.mjs, fake-opencode.mjs) updated and extended; dist of devtools and cssints rebuilt

## Summary of Changes

- The OpenCode box shows whenever `opencode` is on. Nothing picked: the prompt is the instruction and the page url (`pagePrompt`, core/prompt.ts, unit test in core.mjs).
- Layout: the panel is a flex container; `main` (bar + a `body` that scrolls) and the box. Left/right dock and a tall window: column, box at the bottom. Top/bottom dock and a wide window (inner width > height, read on the 600 ms timer): row, box a 20 rem column at the right edge, the textarea growing. `horizontal()` is untouched; the new flag is `strip()`.
- The box: title row (`OpenCode`, dot + connected / not connected / checking), input, one status line. Not connected: how to connect, with the server's own message when the client is missing. Connected: `connected to <url> · session · <id> · <state>`; the title holds the full id, `no session yet` before the first send; the id of the last session survives the next send.
- Probe: `cssints:devtools:link` / `cssints:devtools:linked` `{ connected, url?, directory, message? }` in devtools-server.ts (`connect()` now returns the client and the url; `link` is an Effect.fn; `message` only when the failure is not "no service running"). `TransportApi.link` is optional, entryModule passes it with `opencode`; the page probes on open, on focus and after an `unavailable` send.
- Tests: opencode.mjs (probe with the service, without, started later, option off, client missing through a module hook in a child run), ask-browser.mjs (box with nothing picked, pinned geometry in four docks and both window shapes, connect text, found on focus, page prompt, session id, service gone), fake-opencode.mjs (`url()`). build.mjs: the demo config regex accepts `opencode: true` (the apps commit broke it) and the build needle is the client's calls, not the name the overlay prints.
- Not mine: packages/cssints/test/sheet.mjs fails on master too (an extra `reset` layer).
- dist of devtools and cssints rebuilt; changeset patch for the fixed group.
