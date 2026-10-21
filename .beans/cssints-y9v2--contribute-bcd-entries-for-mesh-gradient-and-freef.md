---
# cssints-y9v2
title: Contribute BCD entries for mesh-gradient() and freeform-gradient() upstream
status: scrapped
type: task
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-21T14:20:00Z
---

From cssints-6ctt: cssints keeps a small table of own BCD entries (version_added: false). Upstream would remove the need.

- [ ] after the table works, open a PR or issue on mdn/browser-compat-data for `css.types.gradient.mesh-gradient` and
      `css.types.gradient.freeform-gradient` (the node `css.types.gradient` is BCD's, with line/radial/conic; the CSSWG
      adopted them into css-images-5 on 2026-10-14)
- [ ] when BCD has the keys, drop our table (the real BCD already wins in get())

## State (2026-10-21, checked)

- The resolution is real: CSSWG 2026-10-14, "Adopt both freeform and mesh gradients into css-images-5, with concerns
  noted, and pull in the explainer into our repo" ([comment 6173137201](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-6173137201)).
- The explainer is in the repo (`w3c/csswg-drafts/css-images-5/explainers/2d-gradients.md`, with example images), but
  `css-images-5/Overview.bs` has no mesh/freeform section yet: there is no spec anchor for `spec_url`.
- BCD: the parent node is `css.types.gradient` (from `css/types/gradient.json`: `conic-gradient`, `linear-gradient`,
  `radial-gradient`, the three `repeating-*`); a code search for `mesh-gradient` in the repo returns 0.
- BCD data guidelines (`docs/data-guidelines/spec_links.md`): `spec_url` "must link to a specification published by a
  standards body or a formal proposal that may lead to such publication". The explainer is in the WG's repo and was
  adopted by resolution, so it is arguable, but the usual moment for the entry is when the spec text lands.
- No browser ships either function (Chrome 155.0.8059.80: `CSS.supports` false for both).

Next: a tracking issue now (resolution + explainer + the two planned keys) is cheap and gets the maintainers' answer on
whether the explainer is enough; the PR itself waits for the `Overview.bs` section, then `version_added: false` for the
11 BCD browsers and `spec_url` to the section. Nothing rots meanwhile: `get()` prefers real BCD by key, so our table
becomes dead weight the day the entries land.

## Reasons for Scrapping

User's decision (2026-10-21): the spec work is not ours to do; wait until it arrives by itself. The CSSWG adopted the two
functions on 2026-10-14 and the explainer is in `css-images-5/explainers/`, so the section will reach `Overview.bs` and
then BCD without us. Meanwhile nothing rots: `get()` prefers real BCD by key, so the day the entries land our `OWN` table
in `packages/css-grammar/src/support.ts` simply stops being read, and deleting it (and its test) is a one-line cleanup,
not a task.
