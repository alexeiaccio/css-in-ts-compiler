---
# cssints-5mwm
title: 'Devtools prompt: more context (route, app, display state, element attributes)'
status: completed
type: feature
priority: normal
created_at: 2026-10-12T14:49:32Z
updated_at: 2026-10-12T15:28:58Z
---

User (2026-10-12): look at what else to add to the message from the devtools panel; the route path?

Found while receiving two prompts from the panel in an OpenCode session attached by /cssints-devtools: with an element picked the prompt has NO page (pagePrompt has it only when nothing is picked), no app (files are relative to the Vite root: 'src/landing/page.ts' in a monorepo of three apps is ambiguous), no display state, and only tag/path/text/classes of the element. I had to guess the page from the element's text (an Install page example panel).

- [x] route in both prompt variants: location.pathname + search + hash (and the page title)
- [x] app: the server (it knows root and the git root, devtools-link) adds 'App: apps/docs (http://localhost:5173), file paths are relative to it'
- [x] display state that decides how the UI looks: viewport size, the html element's class and data-* attributes (mode, palette, hue, text, density, radius), prefers-color-scheme / prefers-reduced-motion, the element's rendered size and position
- [x] element: id, role/aria-label, href/src/alt/type/name, data-* of the element and its nearest ancestors that carry meaning; bounded
- [x] everything bounded (the prompt stays a few KB), tests, README/AGENTS.md, dist rebuilt

## Summary of Changes

- `packages/devtools/src/core/prompt.ts`: both prompts get a header after the Instruction: `Page:` (pathname + search + hash), `Title:` and a `Display:` block (viewport and devicePixelRatio when not 1, the class and data-* of `<html>`, prefers-color-scheme, prefers-reduced-motion when set; for an element its `rect` and hovered/focused/disabled). The element variant adds `Attributes:` (id, role, aria-label, href, src, alt, type, name, placeholder, title; never a value) and `Data of <tag>:` for the element and its three nearest ancestors. Every value is cut at 80 characters, lists at 8 or 12, the instruction at 4000. The instruction line now says: start from the files under `Styled by`, and for the markup from the route and the app. `pagePrompt` takes the document instead of a URL.
- `packages/cssints/src/devtools-server.ts`: `ask()` puts `App: <root relative to the git root, "." for the root itself> (<url>); file paths below are relative to it` on top. The url is the one `announce` writes (`urlOf`, from the listening socket, always known at ask time). The cut is still a plain `slice(0, 16000)` from the end, so the App line, the Instruction and the header (the first ~600 characters) cannot be dropped.
- Tests: core.mjs (header in both variants, display, attributes cut, no value, bounded on a huge page), opencode.mjs (App line for a root two levels deep and for the git root; an over-long prompt keeps App and Instruction), ask-browser.mjs (Page, Title, Display, rect, hovered, Attributes in the prompt the fake OpenCode received from Chrome).
- Prompt of the picked `p#p` of fixtures/app: 581 -> 931 characters.
- README of the package lists what the prompt holds; AGENTS.md is still right. dist of devtools and cssints rebuilt; changeset added.
