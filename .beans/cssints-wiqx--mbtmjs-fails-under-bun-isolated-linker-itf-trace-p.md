---
# cssints-wiqx
title: mbt.mjs fails under bun isolated linker (itf-trace-parser gets Effect 4)
status: completed
type: bug
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T12:36:13Z
updated_at: 2026-09-29T13:34:56Z
parent: cssints-vy0o
---

After the move to one bun workspace (cssints-vq75), `bun run test:mbt` in packages/cssints fails with `Schema.pattern is not a function`. @firfi/itf-trace-parser has effect as an optional peer; bun's isolated linker resolves it from the hoisted fallback (effect 4.0.0-rc.118, from plugin-icon's ^4.0.0-beta.30) instead of quint-connect's effect 3.22.2. npm nested it correctly. Options: bun patch/override, try the quint-connect effect4 tag with a matching effect, or run mbt with its own npm install.

## Summary of Changes

Cause: bun 1.3.1 links the optional `effect` peer of @firfi/itf-trace-parser only on some installs. A fresh resolve (no bun.lock) creates an unhashed `@firfi+itf-trace-parser@0.1.2` with no `effect` link, so Node climbs to the hoisted effect 4.0.0-rc.118. A later install against the lockfile creates the peer-hashed variant linked to quint-connect's effect 3.22.2. The committed lockfile happened to be in the good state, but any lockfile regeneration (or stale node_modules from the first install) brought the failure back. The `effect4` tag doesn't help: quint-connect 2.0.2-effect4.2 pins effect 4.0.0-rc.112, while its parser peers `^4.0.0-beta.99` and would get beta.107/rc.118. Same split, same resolution quirk.

Fix: test/spec/mbt.mjs no longer uses quint-connect. It runs `quint run --mbt --out-itf` itself (QUINT_BIN or `quint`, npx fallback like quint-connect), decodes the ITF JSON with the same one-liner as spec/trace.mjs, and replays each state: dispatch `mbt::actionTaken` with the Some picks, then compare served modules with the model after every step, init included. The seed is random or QUINT_SEED, and it is printed on success and failure. @firfi/quint-connect and zod are removed from cssints devDependencies, so the Effect 3 subtree is gone from bun.lock. `generateTraces` alone was not an option: it is quint-connect's Effect 3 code and parses through the same itf-trace-parser.

Verified: `bun run test:mbt` ok (10x8); with the plugin.mjs half of 1931181 reverse-applied, mbt fails (trace_1 state 6 mbtFetchDone tokens: card served stale, QUINT_SEED=0x7586314b, exit 1) and race.mjs fails too; `bun run test` green; clean `bun install` ok.

Not done: the wayfinder.md lines about quint-connect/effect4 and the known gap are stale (not edited per instructions).
