---
# css-in-ts-compiler-6w49
title: Implement filesystem provider
status: completed
type: task
priority: normal
created_at: 2026-03-06T14:19:35Z
updated_at: 2026-03-16T15:54:49Z
parent: css-in-ts-compiler-8307
---

Create src/providers/fs.ts with createFilesystemProvider function that loads SVGs from local filesystem, supports name transforms, and handles both .svg and .json files.

## Summary

File system operations removed from config - simplified to in-memory config for now.
