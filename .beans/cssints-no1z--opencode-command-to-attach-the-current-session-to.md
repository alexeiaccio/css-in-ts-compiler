---
# cssints-no1z
title: OpenCode command to attach the current session to a specific devtools (dev server)
status: in-progress
type: feature
created_at: 2026-10-12T13:57:38Z
updated_at: 2026-10-12T13:57:38Z
---

User (2026-10-12): not a field in the panel; an OpenCode command that attaches a specific session to specific devtools. Today the panel's box starts a NEW session per prompt (devtools-server.ts ask()).

Design (default, state deviations): an OpenCode V2 plugin (@opencode/plugin, Plugin.define; docs https://opencode.ai/v2/docs/build/plugins/) registers a command with ctx.command.transform: editor.add({ name, execute({ sessionID, prompt, delivery }) }). The executor gets the id of the session the command runs in (a markdown command cannot know it). No network route on the dev server (the ask channel is HMR on purpose: it carries Vite's token): the rendezvous is files under <git root>/node_modules/.cache/cssints-devtools/: a dev server with opencode on writes <id>.json {root, pid, url} on start and removes it on close; the command writes <id>.session.json {sessionID} (or removes it to detach); the dev server reads it on each ask and each link probe. id = the Vite root relative to the git root, / replaced by -.

- [ ] the plugin: shipped by @cssints/devtools (subpath, e.g. @cssints/devtools/opencode, loadable from opencode.json plugins) and dogfooded in this repo (.opencode/plugins or opencode.jsonc plugins); command /devtools: no argument: the live dev servers of this repo (pid alive); one -> attach this session to it; several -> list them in a synthetic message and attach none; /devtools <id-or-substring> picks one (docs, demo...); /devtools off [id] detaches; every outcome is told in the session (ctx.session.synthetic), not only in logs
- [ ] the dev server: registers and unregisters its <id>.json (also on a crashed process: a stale pid is ignored); ask() sends the prompt to the attached session (client.session.prompt with that sessionID; no session.create) and creates a new one only when none is attached; a missing session reports failed with a message telling to run /devtools again; the link probe replies with the attached session id
- [ ] the panel's not-connected text (cssints-oceg) tells to run the command in an OpenCode session; connected shows 'attached session <id>' (title: full id), 'no session attached: a prompt starts a new one' otherwise
- [ ] verified against the real OpenCode (opencode run / --standalone in a temp project with the plugin) that the command is listed, runs with the right sessionID and the file appears; plus unit tests with a fake ctx; tests of the dev server (opencode.mjs with fake-opencode.mjs) for attach, detach, stale pid, two dev servers, missing session
- [ ] README of @cssints/devtools (Ask OpenCode: the command), AGENTS.md line, changeset
