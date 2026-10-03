---
# cssints-z2i6
title: 'sky: recheck on the latest Solid 2 RC and @solidjs/vite-plugin'
status: completed
type: task
priority: normal
created_at: 2026-10-03T12:48:57Z
updated_at: 2026-10-03T13:10:15Z
---

Asked by the user (2026-10-03) after 0.3. apps/sky pins solid-js@next, @solidjs/router ^2.0.0-next.34, @solidjs/vite-plugin 3.0.0-next.47 (a -next line). Find the latest Solid 2 RC, router 2 and vite plugin releases (npm dist-tags, changelogs), bump, fix what breaks, rerun every sky check, recheck the open notes: Solid Router 2 server code in the client bundle (~100 kB), the JSX no-op in the Module Runner, inert JSX in imported .tsx. Pin exact versions.

## Summary of Changes

- Versions: solid-js and @solidjs/web 2.0.0-rc.13 (already installed through the `next` tag, now pinned exact; rc.13 is the newest, there is no rc.12 on npm), @solidjs/router ^2.0.0-next.34 to 2.0.0-next.35 (exact), @solidjs/vite-plugin 3.0.0-next.47 (already the newest; its `latest` tag points at it, there is no non-next 3.x, the `next` tag is stale at next.35), @solidjs/signals 2.0.0-rc.13 and @solidjs/compiler 2.0.0-rc.13 come in transitively, no babel preset is used.
- Router next.35 changes link state (aria-current needs the query to match too); sky's nav links carry no query, so nothing broke. No code change in sky or in the engine.
- Rechecked: the JSX no-op (`inertJsx` in plugin.ts) and the one for imported .tsx without sites are both still needed (without either, `apps/sky/test/build.mjs` fails to parse JSX). Router 2 server code: lazy chunks only, see numbers below.
- Sizes (minify off): entry JS 454.29 to 457.10 kB (gzip 137.91 to 139.00); lazy chunks server 4.64 (same), serverForms 48.19 to 50.18, decode 50.27 (same). Chrome downloads only the entry JS and the CSS on /, /settings and /dev/posts. No new warnings (the same two cssints support warnings).
- All checks green: root test, typecheck, lint, fmt, and in apps/sky test, build, test:browser, test:posts, test:home, test:profile, test:thread.
