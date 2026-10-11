---
# cssints-n12x
title: Export groups with downstream browsers and Baseline years
status: completed
type: feature
created_at: 2026-10-11T10:51:40Z
updated_at: 2026-10-11T10:51:40Z
---

User (2026-10-11): the 'fallback' status meant browserslist-config-baseline's `/with-downstream` (https://github.com/web-platform-dx/browserslist-config-baseline): the Baseline set checked also against Chromium/WebKit downstream browsers (Opera, Opera Mobile, Samsung Internet, Android WebView, UC, QQ) at the versions baseline-browser-mapping gives.

- [x] research baseline-browser-mapping (downstream versions per feature set / per year) and how a feature's downstream support is decided (BCD versions of the downstream browsers vs the core date)
- [x] groups `cssints/widely-available/with-downstream`, `cssints/newly-available/with-downstream`, and Baseline years as browserslist-config-baseline has them: `cssints/baseline-YYYY` and `cssints/baseline-YYYY/with-downstream` (cumulative: what was Baseline by the end of that year)
- [x] generator, exports, tests, docs/API.md groups section, docs/research/groups.md
- [x] changeset (minor)

## Summary of Changes

Done in the branch groups-ds (research and numbers: docs/research/groups.md, "Downstream groups and Baseline years").

- **Groups:** 26 more subpaths (122 in all): `widely-available/with-downstream`, `newly-available/with-downstream`, `baseline-2015` to `baseline-2026` (2015 is the first year in web-features, 2026 the current) and `baseline-YYYY/with-downstream`. `baseline-YYYY` is cumulative: `baseline_low_date` of the BCD key in YYYY or before. Counts: widely 521 members (520 downstream), newly 567 (533), baseline-2015 220, 2020 387, 2024 537 (527), 2026 567 (533).
- **Downstream rule:** baseline-browser-mapping 2.11.28 (pinned) gives the minimum version of each browser per target (widely: `widelyAvailableOnDate` 2026-10-09; years and newly: `targetYear`). A key is in a downstream group when the Baseline group has it and `lackingOf` (the rule of the support warnings) finds no lack in `opera`, `opera_android`, `samsunginternet_android`, `webview_android` at those versions. UC and QQ (no BCD) are checked as Chrome at the Blink version baseline-browser-mapping names for their build (UC 17.6 = 123, QQ 19.1 = 121): the groups from 2024 on shrink, because those builds lag (skipping them: newly with downstream 563 members, not 533).
- **Size:** the plain shape cost +109 kB in the tarball (303 to 412 kB). A downstream group re-exports by name the members it shares with its Baseline group (same functions and units, same words for that member), and `baseline-2026` is `newly-available`: 384.4 kB (+81 kB), `dist/groups` 965 KB, groups-data 74 to 320 KB (+7.6 KB gzip). The bundler writes every re-export as a list of names, so this is the floor of the shapes tried.
- **Plugin and exports:** `"./*"` matches `widely-available/with-downstream` (Node: `*` holds `/`; TypeScript too); `isCssints` takes the nested ids with no change (it reads the data). tsconfig, vite.config.ts (recursive entries) and the playground types (apps/docs/plugin/playground.ts, relative imports from nested files) follow.
- **Tests:** test/groups.mjs (declarations and data agree through the re-exports, a downstream group is inside its Baseline group, 5 located errors, a fixture that passes), test/types/groups.ts (a value widely available but not downstream fails only in the downstream group; a year group refuses what became Baseline later), docs/API.md (a ts block, checked by docs.mjs), a changeset.
