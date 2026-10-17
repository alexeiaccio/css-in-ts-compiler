---
# cssints-smjd
title: '@cssints/color-names: named() value member on the Color Name List'
status: todo
type: feature
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T10:21:19Z
---

Design and measurements: docs/research/color-names.md (2026-10-17, cssints-sh52).

- [ ] package @cssints/color-names (25th of the fixed group once gradient-2d lands): `named("tangerine")` is a value member returning hex as CSSColorValue; data from the `color-name-list` dependency, not copied
- [ ] names checked in the types with `arg<Name>()` (31,938 keys; keep the union behind one `Name` alias so errors stay short); try the grammar route `args: "<name>"` too and report
- [ ] unknown name is a build error with edit-distance suggestions
- [ ] `nearest(hex)` (CIEDE2000 on Lab, as the list's API) build-time only, in its own subpath so the 1.27 MB data never reaches the client
- [ ] decide the 63 CSS keywords whose list hex differs (CSS green #008000, list Green #00ff00): the CSS keyword wins or the list name is suffixed
- [ ] check per-source licences of the list and the list's policy on offensive names; attribution in README
- [ ] tests (names, suggestions, collisions of kebab keys, type test), README, docs/API.md Plugin packages, changeset, RELEASING.md and AGENTS.md counts
- [ ] user: set up the trusted publisher on npmjs.com for the new package (RELEASING.md); the first publish of a new name is by hand
Not a DTCG token set: 31,935 leaves cost 15-26 s and 3.6 M instantiations.

## Idea from the user (2026-10-17): hue sectors

Split the names by hue so that completion is short and cheap: `colorNames.red("ferrari red")`. The type check does not need it (research: the union of all names costs nothing measurable); the editor does (`named("|")` lists 31,939 names).

- [ ] sector = the hue of the name's colour in oklch, computed by the generator; about 12 sectors (red, orange, yellow, green, cyan, blue, purple, pink) plus one `neutral` sector for low chroma (grays, whites, blacks; user decision 2026-10-17); every name in exactly one sector
- [ ] sector members `colorNames.<sector>(name)` with `arg<SectorName>()`; the flat `named(name)` stays for an exact name
- [ ] a name in the wrong sector is a build error that says its sector (`"ferrari red" is in red`), from a name-to-sector index
- [ ] measure completion on the sector unions (count and latency, as the research did for the whole list) before committing to the shape; sector sizes are uneven, so check the biggest
- [ ] data per sector in its own file, loaded at build time only
Risk: the user must guess the sector (a "red" may sit in orange). The error message is the mitigation.
