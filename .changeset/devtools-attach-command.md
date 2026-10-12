---
"@cssints/devtools": minor
"cssints": minor
---

The devtools OpenCode box sends its prompts to the session that the new OpenCode command `/cssints-devtools` (plugin `@cssints/devtools/opencode`) attached to a dev server, instead of starting a session each time; files in `node_modules/.cache/cssints-devtools/` are the rendezvous (new export `cssints/devtools-link`), and the link probe tells the attached session.
