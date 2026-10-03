---
# cssints-r2qq
title: Observability for the Effect engine (traces for debugging)
status: in-progress
type: feature
created_at: 2026-10-03T12:56:21Z
updated_at: 2026-10-03T12:56:21Z
---

Asked by the user (2026-10-03): o11y for Effect, for debugging. The engine already names its work with Effect.fn spans and runs Effects at sync edges in plugin.ts (Effect.runSync in config/load/transform/hotUpdate) and at __at/__site. effect 4.0.0-beta.107 ships effect/unstable/observability (OtlpTracer, OtlpLogger, OtlpMetrics, PrometheusMetrics) and effect/unstable/devtools (DevTools for the Effect VS Code extension). Opt-in by env var, zero cost when off (perf.mjs within budget), a documented way to see a sky build/dev/HMR trace locally.
