---
# cssints-n49y
title: 'Skin 01: the pocket-instrument set, built on our primitives'
status: completed
type: feature
priority: high
created_at: 2026-11-15T07:35:45Z
updated_at: 2026-11-15T08:07:01Z
---

A second look for `apps/ui`, after SPEC-01 (github.com/shuding/spec-01, MIT): light molded panels, keys standing in their holes, an LCD, LEDs, printed scales. It is a **skin**, not a theme in the token sense — the shapes are the point (`cssints-sehi`), and it lives in plain CSS scoped to `[data-skin="01"]` rather than in `css.cn` calls, so none of the existing components are touched.

**The set** (each a thin component over an existing primitive, all parts carrying `data-part`): faceplate/panel, key (`createButton`), rocker, slide-switch (`createSwitch`), fader (`createSlider`), dial (`createKnob`), LCD/display, LED, bar graph (`createMeter`). Plus one composed device (a dashboard faceplate) so the look is legible in the catalog.

**The theme comes from one colour**: `keyColor` as OKLCH l/c/h, turned into roles with relative colour syntax (key face, ink capped for light keys, highlighter, lit lamp, key cap) — SPEC-01's rule, ported.

**Attribution**: MIT, Copyright (c) 2026 Shu Ding — add to `apps/ui/NOTICE` the way the React Aria starter theme already is, and a header in each ported file.

**A11y kept**: `focus-visible` rings that survive the light panel (contrast-checked), 24 px targets, `prefers-reduced-motion` for the key travel, real labels.

**Not in this slice**: the other ~50 SPEC-01 components, the sound and haptics (`cssints-h43z`… no, the haptics bean), the installable bundle (waits for `data-part` on the shipped props, `cssints-jdmq`).

## Summary of Changes

PR **#187** (`skin/01`), open, not merged.

**The set** (`apps/ui/src/registry/hardware/`) — each part over an existing primitive, every part carrying `data-part`:

| file | primitive | look |
|---|---|---|
| `faceplate.tsx` | — | moulded panel: surface, optional printed title, optional `keyColor` |
| `key.tsx` | `createButton` | cap standing in its hole, 10 px travel, latch (`aria-pressed`) |
| `rocker.tsx` | `createSwitch` | two-position rocker, the cap tips (ON's end down) |
| `slide-switch.tsx` | `createSwitch` | lever in a slot with a printed tick per position |
| `fader.tsx` | `createSlider` | groove + printed scale + ribbed cap |
| `dial.tsx` | `createKnob` | knurled crown, printed tick arc, pointer |
| `lcd.tsx` | — | gray glass + faint grid, `role="status"` on the value only |
| `led.tsx` | — | `role="img"` with a name, `data-state`, specular dot when lit |
| `bar-graph.tsx` | `createMeter` | segments lit to the value, dark screen, two-step glow |
| `device.tsx` | the above | dashboard: LCD + 3 keys + fader + dial + lamp + graph, one number |

Sheet: `tokens-01.css` (colour) + `skin.css` (parts), imported once from `faceplate.tsx` — the panel *is* the scope (`[data-skin="01"]`).

**Ported** (geometry and token rules, never their selectors or class names): the `keyColor` role derivation (`--key-ink` capped at 0.62, lamp at 0.86, glow, `--on-accent`), the panel shadow and the one animated `--lift`, the printed scale, the ribbed cap, the crown rings, the LCD glass and well, the masked tick arc, the slider slot and detent, the rocker's registered wall gradients, the bar-graph pitch and glow. **Written**: all markup and selectors, the fader's light slot (their groove is dark and hides a black fill), 36 ticks instead of a 270° sweep, the LCD grid, the lamp gloss, the device.

**Colour**: `keyColor {l,c,h}` → `--theme-*` → `--key-color/-ink/-highlight/-cap/-lamp/-glow`, `--on-accent`, `--ring` = `--key-ink`, so the focus ring is measured against the **panel** (asserted ≥ 3 : 1 against the faceplate) rather than the page.

**NOTICE**: MIT entry beside the React Aria one — Copyright (c) 2026 Shu Ding, source URL, and which rule came from which file.

**Checks**: `apps/ui` typecheck, build, `test` 64 files / 980 passed (717 skipped), `test:site`, `diff:check --base origin/master` all green; the root lint has no finding in `apps/ui` (its 24 errors are pre-existing in `packages/tui` on `origin/master`); formatted. Registry item regenerated (`r/hardware.json`), catalog shows five stories (Dashboard, Key colours, Keys, Controls, Readouts).

**Refused to fake**: the slide switch has no drag and no detent report (`createSwitch` reports a state, not a position); the fader has no live region (`createSlider` has no `valueProps`); the dial has no disabled look (the primitive has none). Left for later: the other ~50 SPEC-01 components, sound/haptics, and the installable bundle (`cssints-jdmq`).
