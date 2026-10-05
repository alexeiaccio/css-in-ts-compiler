---
# cssints-r2qq
title: Observability for the Effect engine (traces for debugging)
status: completed
type: feature
priority: normal
created_at: 2026-10-03T12:56:21Z
updated_at: 2026-10-03T13:27:39Z
---

Asked by the user (2026-10-03): o11y for Effect, for debugging. The engine already names its work with Effect.fn spans and runs Effects at sync edges in plugin.ts (Effect.runSync in config/load/transform/hotUpdate) and at __at/__site. effect 4.0.0-beta.107 ships effect/unstable/observability (OtlpTracer, OtlpLogger, OtlpMetrics, PrometheusMetrics) and effect/unstable/devtools (DevTools for the Effect VS Code extension). Opt-in by env var, zero cost when off (perf.mjs within budget), a documented way to see a sky build/dev/HMR trace locally.

## Summary of Changes

- `CSSINTS_TRACE=otlp[:url]` (default http://localhost:4318), read once when src/trace.ts loads. Only OTLP traces: Jaeger has no logs endpoint and warnings/errors are span events anyway. DevTools not wired (needs the VS Code extension, unreadable by a script or agent); no console mode (an agent reads the backend's HTTP API).
- Provided once: src/trace-otlp.ts builds one ManagedRuntime (OtlpTracer + JSON serialization + fetch client) and awaits its context; trace.ts exports runSync and runPromiseExit, which are Effect's own functions when the variable is unset (the OTLP module is not even imported). plugin.ts: the hook edges use them; `hook(name, file, program)` makes a root span with the file attribute, records errors as `cssints.error` events (file, offset) and stamps traceId/spanId and '(trace <id>)' on the error that reaches Vite; `warned` makes `cssints.warning` events. closeBundle flushes and stops the exporter (its timer would keep Node alive).
- Spans: vite.transform/hotUpdate/load/renderChunk/buildStart/buildEnd/closeBundle (root, file attribute), cssints.runner.import (new), cssints.lightningcss and cssints.cssPost (new, split of the renderChunk CSS pipeline), plus the existing Effect.fn spans. Per-site/per-declaration work stays untraced.
- Tests: test/trace.mjs (in bun run test, in-process OTLP collector: span names, file attribute, error trace id and event with file and offset, warning event, hotUpdate); test/trace-live.mjs (Jaeger via docker, skips without it: sky build + HMR traced and read back through /api/traces). perf.mjs repaired for the { order, handler } transform.
- Docs: API.md Debugging section, README pointer, AGENTS.md Commands.
- Follow-ups: warnings carry no offset (their strings are built in token.ts/macro.ts/kernel.ts; a structured warning would need those files); the trace.mjs line in packages/cssints/package.json's test script may conflict with the mise-en-mode work.
