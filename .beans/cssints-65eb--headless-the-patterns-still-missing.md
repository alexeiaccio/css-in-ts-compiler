---
# cssints-65eb
title: 'headless: the patterns still missing'
status: completed
type: epic
priority: normal
created_at: 2026-10-30T10:50:48Z
updated_at: 2026-10-31T11:40:14Z
---

What @cssints/headless does not have yet, from the coverage map in effects-of-atmosphere (docs/plans/ui-cssints-coverage.md, bean g8mc) and the references (TetraLogical's eight components; Base UI / Ariakit / React Aria compositions; the GarageBand knob).

Have already: accordion, alert, alertdialog, breadcrumb, button, canvas, carousel, checkbox(+group), combobox, confirm, dialog-modal, disclosure, feed, field, grid, link, listbox, menu, menubar, meter, player, radio-group, rearrangeable listbox, resizable panels, slider(+multithumb), spinbutton, switch, tabs, timeline, toolbar, tooltip-group, treegrid, treeview, window splitter.

Missing, one bean per item below. Ordering: the TetraLogical set first (pagination, text input, textarea), then the compositions the sites are blocked on, then the round-interface knob.

## The twenty beans

- cssints-3by9 pagination
- cssints-e0li text input and textarea (skin over createField)
- cssints-vk1y non-modal popover
- cssints-jzwx drawer/sheet shell
- cssints-6ca5 toast queue and status region
- cssints-h0d5 hotkeys
- cssints-qzkr scrollspy TOC
- cssints-zovu pan-zoom image
- cssints-gdv2 closable/renamable tabs
- cssints-03li data table (sortable, selection)
- cssints-6sib drop zone
- cssints-t4c4 timeline span data (waterfall)
- cssints-bkdm diagram focus (canvas nodes/edges)
- cssints-yntz compositions: filterable menu, command palette, date picker
- cssints-77wx research: Base UI / Ariakit / React Aria
- cssints-nxwa knob / dial for round interfaces
- cssints-mt0b the requirement catalogue (TetraLogical model, Quint where it is behaviour)

Where each came from: TetraLogical's eight components (pagination, text input, textarea are the gap), the coverage map in effects-of-atmosphere (g8mc), bottom-sheet.md (drawer), and the two references added 2026-10-30 (Base UI filterable menu, GarageBand knobs).

## Closed 2026-10-31

All twenty beans are completed: pagination, text input/textarea, popover, drawer, toast/status, hotkeys, scrollspy, pan-zoom, closable tabs, table, drop zone, timeline span data, diagram focus, the three compositions (command palette, filterable menu, date picker), the research note, the knob and the requirement catalogue.

What ships after this epic is still open elsewhere: the twelve gaps the catalogue found in tabs (`packages/headless/docs/requirements/tabs.md`), the AT table runs, and the adoption work in the apps (beans in effects-of-atmosphere).
