---
# cssints-rmws
title: 'mise-en-mode on scope(): look() as a call member, delete style()/context()/method()/property()/fn() shims'
status: todo
type: task
created_at: 2026-10-05T10:30:02Z
updated_at: 2026-10-05T10:30:02Z
parent: cssints-easl
---

Follow-up of cssints-8ogz, after the branches plugin-scope and mise-en-mode both merged. packages/mise-en-mode moves from cssints/plugin style() to scope(): look(tokens, expression, source, overrides, { scope? }) is a call member with args ["$tokens", "<expression>", "<source>", "$overrides", { "scope?": "<selector>" }] returning themes and layers (see test/fixtures/scope-kit.ts, the look there is the same shape). Then delete from cssints/plugin what nothing uses: style(), context(), method(), property() with Engine.style/context/property and their tests (plugins.mjs, test/types/plugins.ts, fixtures plug-kit/seam-kit/member-theme-kit, bench cases); fn() stays while functions.ts builds colorMix/min/max/clamp on it (or move those to scope value members).
