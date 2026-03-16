---
# css-in-ts-compiler-o5a6
title: Implement iconify provider with on-demand API
status: completed
type: task
priority: normal
created_at: 2026-03-06T14:19:35Z
updated_at: 2026-03-16T15:54:26Z
parent: css-in-ts-compiler-8307
---

Create src/providers/iconify.ts with createIconifyProvider function that fetches icons from Iconify API on-demand, supports name transforms, and includes caching.

## Summary

Fixed providers/index.ts to use proper Effect patterns. createIconifyProvider, createFilesystemProvider, createInlineProvider all use Effect.gen correctly.
