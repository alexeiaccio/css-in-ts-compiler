---
# cssints-oceg
title: 'Devtools: the Ask OpenCode box always shown, pinned to the panel''s bottom edge, with how to connect and which session'
status: in-progress
type: feature
created_at: 2026-10-12T13:20:56Z
updated_at: 2026-10-12T13:20:56Z
---

User (2026-10-12): show the prompt box even when no element is picked; pin it to the bottom edge of the panel; it needs text on how to connect an OpenCode session and then which session is connected.

- [ ] box shown whenever opencode is on (no selected element needed); a prompt without an element is just the instruction (plus the page url)
- [ ] pinned to the bottom of the panel in every dock (left/right/bottom/top) and in the detached window; the inspection above scrolls, the box never scrolls away
- [ ] a line under/over it: not connected -> how to connect (start OpenCode or opencode serve --service; the dev server finds it; sessions open in the repo folder; @opencode/client installed); connected -> service address and the session (id of the last session; click copies / title shows it)
- [ ] the dev server answers a link probe (Service.discover) when the panel opens and when the box is focused or a send failed, so starting OpenCode later shows up without a reload
- [ ] tests (opencode.mjs, ask-browser.mjs, fake-opencode.mjs) updated and extended; dist of devtools and cssints rebuilt
