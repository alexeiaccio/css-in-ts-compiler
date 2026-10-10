---
# cssints-ro4k
title: 'Devtools: send the picked element to OpenCode'
status: in-progress
type: feature
created_at: 2026-10-10T12:01:45Z
updated_at: 2026-10-10T12:01:45Z
---

Asked by the user (2026-10-10), after brendonovich/vite-plugin-opencode (MIT): pick an element in the app and send a change request to a running OpenCode with its context.
- [ ] In the devtools overlay (dev only, devtools: true): a prompt box for the picked element (Enter sends), and the session it started (status, link/id), using the @opencode/client V2 SDK on the dev server (Service.discover, OpenCode.make, session.create + prompt; the server side in the devtools Vite plugin's configureServer, a middleware endpoint, never in the browser; no credentials in the client).
- [ ] Context is cssints' own, no Babel source markers: the element (tag, classes, text excerpt, a short DOM path), the css.* calls that style it (file:line and call text, from the table), the cascade winners and overridden values, tokens; the workspace root (the Vite root's git repo) as the session directory. A bounded size.
- [ ] Options: cssints({ devtools: { opencode: true | { agent?, skills? } } }) or a separate option; off by default; a clear message when no OpenCode service is running.
- [ ] A build ('build' mode on the docs site) has none of it.
- [ ] Tests: the endpoint with a fake OpenCode service (the prompt it receives holds the call sites and the instruction), the overlay in Chrome (the box appears for a picked element; a missing service gives the message), build test (absent in a build). README and API.md.
