---
"@cssints/apg-specs": patch
---

`specs/patterns/workspace.qnt`: tabs and tabsets in one window — a tab lives in exactly one home (docked, floating, an edge tabset, out of the window, or closed), a drop names its target as data and the model never sees a pixel, an emptied tabset disappears unless `keepWhenEmpty`, a copy keeps its source, and a refused drop changes nothing and says `reason = "none"`. The vocabulary is `specs/apg/tabs.qnt`'s; this spec models only the delta. Its bridge marks the per-tab payload (`tabs`) as a sink key, so `IGNORED_CONFIG_KEYS` grows by the one entry that made no other bridge change.
