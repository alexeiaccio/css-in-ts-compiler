---
# cssints-ro4k
title: 'Devtools: send the picked element to OpenCode'
status: completed
type: feature
created_at: 2026-10-10T12:01:45Z
updated_at: 2026-10-10T12:01:45Z
---

Asked by the user (2026-10-10), after brendonovich/vite-plugin-opencode (MIT): pick an element in the app and send a change request to a running OpenCode with its context.
- [x] In the devtools overlay (dev only, devtools: true): a prompt box for the picked element (Enter sends), and the session it started (status, link/id), using the @opencode/client V2 SDK on the dev server (Service.discover, OpenCode.make, session.create + prompt; the server side in the devtools Vite plugin's configureServer, a middleware endpoint, never in the browser; no credentials in the client).
- [x] Context is cssints' own, no Babel source markers: the element (tag, classes, text excerpt, a short DOM path), the css.* calls that style it (file:line and call text, from the table), the cascade winners and overridden values, tokens; the workspace root (the Vite root's git repo) as the session directory. A bounded size.
- [x] Options: cssints({ devtools: { opencode: true | { agent?, skills? } } }) or a separate option; off by default; a clear message when no OpenCode service is running.
- [x] A build ('build' mode on the docs site) has none of it.
- [x] Tests: the endpoint with a fake OpenCode service (the prompt it receives holds the call sites and the instruction), the overlay in Chrome (the box appears for a picked element; a missing service gives the message), build test (absent in a build). README and API.md.

## Summary of Changes

- Option `cssints({ devtools: true, opencode: true | { agent?, skills? } })`, a separate option (it starts an agent in the repository, so it is asked for by name), off by default, dev only (`apply: "serve"` plugin). `@opencode/client` 2.0.26 is an optional peer dependency of cssints (devDependency here); a missing install gives a message that names it.
- Transport: Vite's HMR channel, not a middleware route (`cssints:devtools:ask` from the page, `cssints:devtools:asked` back). The ticket said "a middleware endpoint": a route can be posted to by any page of another origin; the HMR channel carries Vite's token, and the table already travels there. The server (devtools-server.ts) does `Service.discover`, `OpenCode.make`, `session.create` in the workspace root (nearest `.git` up from the Vite root), `session.prompt`, `session.wait`, `session.get`, and reports `running` (with the id), then `completed`, `failed` or `interrupted`; no service gives `unavailable` with the message "No OpenCode service is running. ...".
- Prompt: `packages/devtools/src/core/prompt.ts` builds it in the page from the inspection (instruction, element, DOM path, text, classes, call sites as file:line plus call text, winners with what they beat, tokens), bounded per list; the server cuts it at 16000 characters.
- Overlay: a prompt box under the panel for a picked element (Enter sends, Shift+Enter new line, arrows stay in the box), status line with the session id; the text stays until the session exists.
- Build: the server side is in the serve-only plugin; `devtools: "build"` with `opencode` gives a loader without `ask`. The dormant box is part of the overlay chunk (about 1 kB), so "none of it" holds for the entry, the server code and the client: tested.
- Tests: core.mjs (prompt), opencode.mjs (dev server with a fake OpenCode service: prompt as sent, agent, skills, directory, status, failure, bad payload, no service, option off), ask-browser.mjs (Chrome), build.mjs (a build with the option on). README of the package and API.md.
- Duplicate `effect`: @opencode/client pins effect 4.0.0-rc.112, so the Effect language service reported `duplicatePackage` everywhere; `allowedDuplicatedPackages: ["effect"]` in tsconfig.json and tsconfig.effect.json (a bun override did not dedupe).
