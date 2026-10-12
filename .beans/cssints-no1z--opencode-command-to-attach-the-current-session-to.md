---
# cssints-no1z
title: OpenCode command to attach the current session to a specific devtools (dev server)
status: completed
type: feature
created_at: 2026-10-12T13:57:38Z
updated_at: 2026-10-12T13:57:38Z
---

User (2026-10-12): not a field in the panel; an OpenCode command that attaches a specific session to specific devtools. Today the panel's box starts a NEW session per prompt (devtools-server.ts ask()).

Design (default, state deviations): an OpenCode V2 plugin (@opencode/plugin, Plugin.define; docs https://opencode.ai/v2/docs/build/plugins/) registers a command with ctx.command.transform: editor.add({ name, execute({ sessionID, prompt, delivery }) }). The executor gets the id of the session the command runs in (a markdown command cannot know it). No network route on the dev server (the ask channel is HMR on purpose: it carries Vite's token): the rendezvous is files under <git root>/node_modules/.cache/cssints-devtools/: a dev server with opencode on writes <id>.json {root, pid, url} on start and removes it on close; the command writes <id>.session.json {sessionID} (or removes it to detach); the dev server reads it on each ask and each link probe. id = the Vite root relative to the git root, / replaced by -.

- [x] the plugin: shipped by @cssints/cssints-devtools (subpath, e.g. @cssints/cssints-devtools/opencode, loadable from opencode.json plugins) and dogfooded in this repo (.opencode/plugins or opencode.jsonc plugins); command /cssints-devtools: no argument: the live dev servers of this repo (pid alive); one -> attach this session to it; several -> list them in a synthetic message and attach none; /cssints-devtools <id-or-substring> picks one (docs, demo...); /cssints-devtools off [id] detaches; every outcome is told in the session (ctx.session.synthetic), not only in logs
- [x] the dev server: registers and unregisters its <id>.json (also on a crashed process: a stale pid is ignored); ask() sends the prompt to the attached session (client.session.prompt with that sessionID; no session.create) and creates a new one only when none is attached; a missing session reports failed with a message telling to run /cssints-devtools again; the link probe replies with the attached session id
- [x] the panel's not-connected text (cssints-oceg) tells to run the command in an OpenCode session; connected shows 'attached session <id>' (title: full id), 'no session attached: a prompt starts a new one' otherwise
- [x] verified against the real OpenCode (opencode run / --standalone in a temp project with the plugin) that the command is listed, runs with the right sessionID and the file appears; plus unit tests with a fake ctx; tests of the dev server (opencode.mjs with fake-opencode.mjs) for attach, detach, stale pid, two dev servers, missing session
- [x] README of @cssints/cssints-devtools (Ask OpenCode: the command), AGENTS.md line, changeset

## Summary of Changes

The command is `/cssints-devtools` (the user's change of name; `devtools` was not taken, but this one cannot clash). Deviations from the default design, found against OpenCode 2.0.27:

- Loading: `plugins: ["@cssints/devtools/opencode"]` is not loaded (a subpath is read as a folder; a `.js` file path "must be a directory"; a folder with only a package.json is silently skipped). What loads is a file in `.opencode/plugins/`: `export { default } from "@cssints/devtools/opencode";`. This repo has `.opencode/plugins/cssints-devtools.ts` (a relative path to dist/opencode.js).
- `Plugin.define` is the identity, so the plugin is a plain `{ id, setup }` object with local types (no dependency on `@opencode/plugin`: it would add 500 lines to bun.lock).
- The shared module is `cssints/devtools-link` (packages/cssints/src/devtools-link.ts, a new export): `@cssints/devtools` cannot be imported by cssints (optional peer), so it lives in cssints, and the plugin imports it. Plain Node fs; both files are in the `plainCode` override of vite.config.ts.
- `ctx.session.synthetic` with `resume: false` keeps the notice in the session's inbox, out of the transcript; so the notice is admitted with resume (the model acknowledges it in one sentence).
- `opencode run "/cssints-devtools"` sends the text to the model as a prompt (it does not run slash commands); the command runs through `POST /api/session/{id}/command` (`{name, text}`, `text` is the argument).
- The session file stays after a dev server closes (an attach survives a restart); `off` removes it. A gone session is found with `session.get` before the prompt.

Verified against the real OpenCode 2.0.27 (private `opencode serve` on port 4391 in a temp project, the dev server on 5391): the command is listed, runs with the right sessionID, writes `app.session.json`; two prompts posted over the HMR socket landed in that session and not in a new one; `off` removes the file; a made-up session id reports failed with the message; kill -9 leaves a stale file that the command ignores and removes; SIGTERM removes the file. Tests: devtools `opencode.mjs` (attach, detach, two servers, gone session, stale), `opencode-plugin.mjs` (fake ctx), `ask-browser.mjs` (panel texts).

