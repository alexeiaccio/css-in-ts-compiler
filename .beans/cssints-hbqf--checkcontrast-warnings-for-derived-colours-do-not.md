---
# cssints-hbqf
title: check.contrast warnings for derived colours do not show in dev
status: in-progress
type: bug
priority: normal
created_at: 2026-10-02T14:44:23Z
updated_at: 2026-10-02T14:44:56Z
parent: cssints-co8y
---

## Problem

Found in cssints-uifu: a `check.contrast` on a derived colour (`color-mix()`, relative colour) should warn that it cannot read the value (API.md), and errors do show, but the warnings did not appear in a dev run (they are collected in `state.warnings` in contrast.ts). Reproduce with apps/sky's tokens, find where dev drops them (the end-of-build pass vs the per-module pass, or the logger), fix, and add a dev-mode test.
