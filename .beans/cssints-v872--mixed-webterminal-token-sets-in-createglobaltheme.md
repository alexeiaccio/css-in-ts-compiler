---
# cssints-v872
title: Mixed web/terminal token sets in createGlobalTheme crash without a clear message
status: in-progress
type: bug
created_at: 2026-10-11T08:21:52Z
updated_at: 2026-10-11T08:21:52Z
---

Passing a web token set to cssints/tui's createGlobalTheme (or a terminal set to the web one) crashes instead of a clear error naming the call site and what to import.

## Todo
- [ ] Failing test: both directions, the message names the call and the right import
- [ ] A clear error in tui.ts / the web createGlobalTheme
