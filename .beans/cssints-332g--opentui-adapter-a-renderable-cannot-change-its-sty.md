---
# cssints-332g
title: 'OpenTUI adapter: a renderable cannot change its style after attach'
status: todo
type: feature
created_at: 2026-10-10T17:41:18Z
updated_at: 2026-10-10T17:41:18Z
parent: cssints-06ws
---

Found by cssints-m0yj (sky-tui), looked at in cssints-5vnf/cssints-pkpg.

attach(r, style) and use(style) bind one style for the life of the renderable. sky-tui's active tab needs a second style, so App.tsx Tab swaps two <text> elements with <Show> (the renderable is made again when the tab turns active).

use() cannot follow a changing style by itself: the adapter is framework-neutral, and Solid calls a ref once; a function argument (use(() => active() ? a : b)) would need a Solid effect inside the adapter, or a getter prop that Solid's spread reads in an effect (a hack that writes an unknown prop on the renderable). In React, use() is a new ref each render, so React detaches and attaches again on every render (hooks stack up): a related gap.

Proposal: attach() returns (or stores on the renderable) a way to swap the style, e.g. restyle(r, style): resolve the new style in the current state and theme, restore the props the old one set and the new one does not (the saved map already does this). Solid: createEffect(() => restyle(r, props.active ? s.tabActive : s.tab)). Then use() in React could cache by renderable.

## Todo

- [ ] restyle(r, style) in @cssints/tui/opentui (and the bomb tracker if it applies)
- [ ] a render test: swap a style, states and theme kept
- [ ] sky-tui Tab: one <text> with restyle, no <Show>
