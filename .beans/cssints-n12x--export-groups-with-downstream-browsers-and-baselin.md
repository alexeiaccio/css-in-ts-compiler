---
# cssints-n12x
title: Export groups with downstream browsers and Baseline years
status: in-progress
type: feature
created_at: 2026-10-11T10:51:40Z
updated_at: 2026-10-11T10:51:40Z
---

User (2026-10-11): the 'fallback' status meant browserslist-config-baseline's `/with-downstream` (https://github.com/web-platform-dx/browserslist-config-baseline): the Baseline set checked also against Chromium/WebKit downstream browsers (Opera, Opera Mobile, Samsung Internet, Android WebView, UC, QQ) at the versions baseline-browser-mapping gives.

- [ ] research baseline-browser-mapping (downstream versions per feature set / per year) and how a feature's downstream support is decided (BCD versions of the downstream browsers vs the core date)
- [ ] groups `cssints/widely-available/with-downstream`, `cssints/newly-available/with-downstream`, and Baseline years as browserslist-config-baseline has them: `cssints/baseline-YYYY` and `cssints/baseline-YYYY/with-downstream` (cumulative: what was Baseline by the end of that year)
- [ ] generator, exports, tests, docs/API.md groups section, docs/research/groups.md
- [ ] changeset (minor)
