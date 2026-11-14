---
# cssints-jr2a
title: 'headless: host recipes and kit markup for the native labels'
status: todo
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-14T10:42:10Z
parent: cssints-oeb0
---

## What
Cash the summary table's "native" recommendation where an app renders DOM: `details name` for accordion/disclosure
(with `::details-content` + `interpolate-size` for the animation), `<dialog showModal()>` for dialog-modal/alertdialog
(with `closedby` as enhancement), `<input type=range>`, `<meter>`, `<input type=checkbox switch>` in Safari with the
styled checkbox elsewhere. The primitives stay as the contract and the fallback.

## Todo
- [ ] The recipes in the package README (or a `hosts.md`): which element each primitive's props go on, and what the
      platform then owns
- [ ] One story per recipe in the kit (`apps/ui`), with the conformance test as usual
- [ ] `field-sizing: content` and `:user-invalid` in the text field story (Baseline newly 2026-06-16)
