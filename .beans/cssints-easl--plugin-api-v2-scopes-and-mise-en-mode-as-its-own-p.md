---
# cssints-easl
title: 'Plugin API v2: scopes, and mise-en-mode as its own package'
status: completed
type: epic
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T11:19:49Z
---

Asked by the user (2026-10-05): a more convenient plugin API, ArkType-scope-like, so mise-en-mode lives outside the core. Three designs drafted (docs/research/plugin-api.md, drafts in docs/research/plugin-api-proto/); the user chose the A+C synthesis in three steps.

## Summary of Changes

Done 2026-10-05 in four tickets: engine seams (cssints-0v30: content-keyed per-module globals, theme layer/scope, declared layers, layered contrast, themes from members), @cssints/mise-en-mode as its own package (cssints-by3v), scope() as the plugin API with frame/surface/icons migrated (cssints-8ogz), mise-en-mode on scope() and the legacy helpers deleted (cssints-rmws). The engine has no mise-en-mode code; the plugin API is scope(name, table).build(impl).export(), typed from one definition and namespaced by the scope name.
