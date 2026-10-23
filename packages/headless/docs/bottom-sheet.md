# Is a bottom sheet a pattern the headless library should build?

> Moved from effects-of-atmosphere `docs/research/` on 2026-10-23 with the widgets. `effects-of-atmosphere-xxxx` ids are beans in that repository.

Research for `effects-of-atmosphere-zgpx`
(parent map: `effects-of-atmosphere-0lab`,
the headless APG library). Compiled **2026-10-10**. Reading only: no code was installed; the
sources were read from the GitHub raw endpoints, the project site and the React Aria docs.

Method: `pure-web-bottom-sheet` facts come from its README, `package.json` and the actual
`src/web/*.ts` sources at `main`; the write-up is the author's blog post. The React Aria claim
is checked against the React Aria Components docs, the release page and the release blog post.
APG status is checked against the APG Patterns index. Where a fact comes from a blog post rather
than source it is marked _(secondary)_.

## Verdict up front

A bottom sheet is **not a WAI-ARIA APG pattern**. It is a **presentation of Dialog (Modal)** —
native `<dialog>` / Popover for semantics, CSS scroll snap for position. `pure-web-bottom-sheet`
ships **no ARIA of its own**: every bit of its accessibility comes from the native elements it
wraps. So the library should **not add a `sheet` primitive**. The right split is:

- **native** — `<dialog>` + `showModal()`, the Popover API, `::backdrop`, CSS scroll snap,
  scroll-driven animations, `scrollsnapchange`, the VirtualKeyboard API;
- **host-composed** — the bottom sheet is the existing **`dialog-modal`** primitive (already
  `native` in [apg-platform-features.md](apg-platform-features.md)) composed with native CSS
  scroll snap. The library documents the stack; it owns no sheet behaviour;
- **library** — nothing. The only candidate surface (a snap index / `sheetState` readout and a
  `snapToPoint` command) is a derived reading of the browser's own scroll position, not a state
  machine.

The rejected alternative — a non-APG `sheet` primitive — would re-implement the platform and
invent behaviour the library has no APG oracle for. See [The call](#the-call).

## 1. What `pure-web-bottom-sheet` actually is

[`viliket/pure-web-bottom-sheet`](https://github.com/viliket/pure-web-bottom-sheet) — **MIT**,
`package.json` **1.1.1**, ~196 stars, by Vili Ketonen. A framework-agnostic **web component**,
not a React/Solid library. Two custom elements:

- `<bottom-sheet>` — the sheet surface (also usable standalone, non-dismissible);
- `<bottom-sheet-dialog-manager>` — a thin wrapper that lets the sheet act as a modal inside a
  native `<dialog>`.

**Core mechanism.** The host is a scroll container with `scroll-snap-type: y mandatory`
(`bottom-sheet.template.ts` L32); the sheet is a nested element that the browser scroll-snaps to
positioned `.snap` markers. `snap-point-change`-style state is derived from an
`IntersectionObserver` over those markers, and scroll-driven animations (`animation-timeline`)
animate the sheet height / transform. The README calls this "near zero-JavaScript"; the JS that
remains is compatibility and optional features.

**Declared API** (README + `bottom-sheet.ts`):

| Surface          | Value                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| snap points      | `slot="snap"` elements; `--snap` custom property for the offset; class `initial` for the reopen target; class `top` marks the fully-expanded point  |
| attributes       | `content-height`, `nested-scroll`, `nested-scroll-optimization` (experimental), `expand-to-scroll`, `swipe-to-dismiss`                              |
| CSS custom props | `--sheet-max-height`, `--sheet-background`, `--sheet-border-radius`                                                                                 |
| shadow parts     | `sheet`, `handle`, `content`, `header`, `footer`                                                                                                    |
| event            | `snap-position-change` — `CustomEvent<{ sheetState: "collapsed" \| "partially-expanded" \| "expanded"; snapIndex: number }>`, `bubbles`, `composed` |
| method           | `snapToPoint(index: number, options?: { behavior?: ScrollBehavior }): void`                                                                         |

**Accessibility is entirely delegated.** `bottom-sheet.ts` contains no `role`, no `aria-*` and no
focus management. Modal sheets wrap the element in a native `<dialog>` opened with
`showModal()`; non-modal sheets add the `popover` attribute (the README example sets
`role="dialog" aria-modal="true"` on the host itself). `<bottom-sheet-dialog-manager>`
(`bottom-sheet-dialog-manager.ts`, 66 lines) does only three things: close the dialog on a click
on `:modal`, close it when the sheet reports `sheetState === "collapsed"` with
`swipe-to-dismiss`, and supply CSS. It adds no semantics.

### Corrections to the prior "known facts"

- **Verified:** MIT; CSS scroll snap; scroll-driven animations; native `<dialog>` / Popover;
  `snap-position-change`; `snapToPoint`.
- **`overscroll-behavior` is used, but narrowly** — `overscroll-behavior-y: none` on the host
  (L31) to stop rubber-banding, and `overscroll-behavior-x: none` only inside the iOS Safari
  `pointer-events` workaround (L253). It is **not** the scroll-chaining mechanism here.
- **`::backdrop` is not shipped by the component.** Neither `bottom-sheet.template.ts` nor the
  dialog manager defines it. The dialog/popover supplies the backdrop natively; the backdrop
  fade CSS in the blog post is **app-side example code**, not the library.
- **The event shape changed.** The Oct-2025 write-up _(secondary)_ shows an older
  `{ snapPosition: string }` detail and `dataset.sheetSnapPosition`; the current README and
  source use `{ sheetState, snapIndex }` and `dataset.sheetState`. The source is authoritative.
- **Browser floor is high.** `browserslist` requires **Safari 18.2+** (December 2024) because
  the initial-snap trick needs discrete scroll-snap animations; Chrome/Edge 121, Firefox 123.
  This is not Baseline _widely_.

## 2. The React Aria claim — verified, and very fresh

The user's claim is **correct**. React Aria Components **1.22.0** (published **2026-10-08**,
PR [#10674](https://github.com/adobe/react-spectrum/pull/10674)) introduces **`Sheet`**:
`SheetTrigger`, `SheetOverlay`, `SheetBackdrop`, `Sheet`, `SheetContent`. Documented at
<https://react-aria.adobe.com/Sheet>; the design is explained in the release blog post
[Scrolling is All You Need: Building a Swipeable Sheet](https://react-aria.adobe.com/blog/sheet).

What it is, precisely:

- A swipeable overlay that slides in from **any** edge: `position` = `bottom | top | left |
right | start | end | center`, with `start`/`end` mirrored in RTL.
- Built on **native CSS scroll snapping and view timelines, on top of their existing `Modal`**
  — the same technique as `pure-web-bottom-sheet` (blog: "entirely built using native CSS scroll
  snapping and view timelines, on top of our existing Modal component"). Swipe runs off the main
  thread; no JS touch handling.
- Supports `snapPoints`, `preventDismissal`, `overscrollPadding`, `swipeAnimation` /
  `swipeAnimationRange`, `stackAnimation` (nested sheets scale the one behind), and
  software-keyboard awareness (`padding-bottom: calc(100dvh - var(--visual-viewport-height))`).
- It is **not a new ARIA pattern**: because it composes `Modal`/`Dialog`, the dialog semantics
  (`role=dialog`, `aria-modal`, focus containment/restore, Esc) come from `Modal`, not from the
  sheet.

So react-aria "now has something like this" is right — it landed **two days before this
document** and independently chose the composed approach over a hand-rolled one. (Nightlies of
`react-aria-components` 3.0 also exist, but the shipped stable line is 1.22.x.)

## 3. Is a bottom sheet an APG pattern?

**No.** The APG [Patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/) lists no sheet,
drawer or bottom-sheet pattern. The pattern the sheet presents is
[**Dialog (Modal)**](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Split the two
layers:

| Layer                | What it is                                                                                                         | Who owns it                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Dialog semantics** | `role=dialog`, accessible name, `aria-modal`, focus trap and return, Esc/close request, inert background, backdrop | Native `<dialog>` / Popover   |
| **Presentation**     | position on an edge, slide/animation, snap points, drag physics, handle, backdrop fade, stacking, nested scroll    | Host CSS + native scroll snap |

None of the presentation layer is ARIA. Nothing in the sheet adds a role, a state or a keyboard
interaction that Dialog (Modal) does not already define.

## 4. Native / polyfill / library split

Against the same frame as [apg-platform-features.md](apg-platform-features.md):

| Concern                                 | Status                                                               | Recommendation                                     |
| --------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| `<dialog>` + `showModal()`              | Baseline widely                                                      | **native**                                         |
| Popover API (`popover`)                 | Baseline newly (C114 / F125 / S17)                                   | **native**                                         |
| `::backdrop`                            | Baseline (supplied by dialog/popover)                                | **native**                                         |
| CSS scroll snap                         | Baseline widely                                                      | **native**                                         |
| Scroll-driven animations                | Shipped in all engines by 2026 (exact versions not re-verified here) | **native** + library fallback below `@supports`    |
| `scrollsnapchange` event                | Chrome-first; the library falls back to `IntersectionObserver`       | **native** + fallback                              |
| VirtualKeyboard `keyboard-inset-height` | Chromium-only; the library falls back to `visualViewport`            | **native** + fallback                              |
| Declarative Shadow DOM                  | Baseline (SSR path)                                                  | **native**                                         |
| `overscroll-behavior`                   | Baseline                                                             | **native**                                         |
| Snap index / `sheetState` readout       | Derived from scroll position                                         | **host** (read `scrollsnapchange`, or an observer) |
| `snapToPoint` command                   | `Element.scrollIntoView({ behavior })`                               | **host** (one line)                                |

No third-party polyfill is needed: dialog, popover and scroll snap are Baseline. The JS that
`pure-web-bottom-sheet` ships (scroll fallback for scroll-driven animations, `IntersectionObserver`
fallback, `visualViewport` fallback, the iOS `pointer-events` workaround, a `ResizeObserver` for
`content-height`) is **browser-compatibility shimming, not semantics**. None of it is a machine
the library should model.

## The call

**Do not add a `sheet` primitive. Host-compose it and document the native stack.** Concretely:

1. The semantics are already covered by the existing **`dialog-modal`** primitive, which the
   platform research already classes as **native** (inert background, focus return, Esc built in).
   Nothing to add.
2. The position/animation is **native CSS scroll snap** (plus scroll-driven animations). The host
   writes the CSS; the library does not.
3. The only thing resembling state is the **snap index / `sheetState`** — a reading of the
   browser's scroll position. If a consumer needs it, read the native `scrollsnapchange` event
   (with an `IntersectionObserver` fallback) and `scrollIntoView` for programmatic snaps. That is
   a recipe in the docs, not a primitive.
4. Record the composition in [apg-platform-features.md](apg-platform-features.md) so the pattern
   inventory is complete (bean `effects-of-atmosphere-jtjk`).

### Why the rejected alternative (a non-APG `sheet` primitive) is wrong

- **No oracle.** The library's whole method is: a Quint spec of an APG pattern + scenarios ported
  from upstream tests. There is no APG pattern here and no upstream test suite to port against
  the _pattern_ (react-aria's Sheet tests exercise a React component, not an ARIA contract).
  A spec would be invented behaviour, not conformance.
- **It would re-implement the platform.** Every behaviour is native or a compat shim. The repo's
  rule is to prefer native/polyfill over hand-rolled; a primitive here is exactly the
  re-implementation the rule forbids.
- **It has no headless state to expose.** A `state + attribute objects` primitive for the sheet
  would carry no role and no `aria-*` (they come from the native dialog/popover). Its only value
  would be the derived snap index, which is not a state machine.
- **The library majority agrees.** The divergence policy's third rung ("where APG is silent, the
  majority of ariakit / Base UI / react-aria wins") points the same way: react-aria shipped the
  composition on top of its existing `Modal`, not a new primitive.

### What would have to be true for the alternative to become right

Add the primitive only if **all** of these hold:

1. a real consumer needs a **framework-neutral, controlled** `snapPoint` value that must be
   conformance-checked (rejected-request semantics, SSR/non-DOM host), **and**
2. native `scrollsnapchange` + `scrollIntoView` are insufficient for it, **or**
3. the WAI-ARIA APG adds a bottom-sheet / sheet pattern.

Until then it stays captured as a conditional, low-priority bean (`effects-of-atmosphere-aztx`).
If it ever is built, its shape is the thin **non-APG** kind the repo already has (e.g. the
timeline/waterfall primitive): compose `dialog-modal` for semantics with native scroll snap for
presentation, and model only `{ open, snapIndex, sheetState }`, with the platform as the scroll
provider.

## What the library should do instead

- **Nothing to the primitives.** `dialog-modal` already carries the semantics; the platform
  carries the rest.
- **Document the recipe** (host-side): `<dialog>` + `showModal()` (or `popover` + `role=dialog`),
  `scroll-snap-type: y mandatory` on the sheet track, `slot`-style snap markers, read
  `scrollsnapchange` for the snap state, `scrollIntoView` for programmatic snaps. Note the
  Safari 18.2 floor for the initial-snap technique.
- **Record the pattern inventory** in `apg-platform-features.md` (bean `effects-of-atmosphere-jtjk`).

## Unverified / follow-ups

- **Scroll-driven animation browser versions** were not re-verified in this pass; only the
  library's `@supports` fallback was read.
- **React Aria's Sheet internals** were read from the docs, release page and blog post, not the
  `react-aria-components` 1.22.0 source. Its `overscroll-behavior: auto`, `view-timeline` and
  `scroll-margin-top: 100dvh` details are _(secondary)_.
- **`pure-web-bottom-sheet`'s compiled `dist`** was not read; conclusions rest on `src/web/*.ts`
  at `main`, which is the published source.
- **APG corpus** was checked at the Patterns index only; the whole `aria-practices` repository was
  not grepped for the word "sheet".
- **React Aria release date** (2026-10-08) is from the release page / npm version history, not a
  signed tag.

## Sources

- `pure-web-bottom-sheet` README — <https://github.com/viliket/pure-web-bottom-sheet>
- `pure-web-bottom-sheet` `package.json` (v1.1.1, MIT, browserslist) —
  <https://raw.githubusercontent.com/viliket/pure-web-bottom-sheet/main/package.json>
- `pure-web-bottom-sheet` source —
  <https://raw.githubusercontent.com/viliket/pure-web-bottom-sheet/main/src/web/bottom-sheet.ts>,
  <https://raw.githubusercontent.com/viliket/pure-web-bottom-sheet/main/src/web/bottom-sheet.template.ts>,
  <https://raw.githubusercontent.com/viliket/pure-web-bottom-sheet/main/src/web/bottom-sheet-dialog-manager.ts>
  (fetched 2026-10-10)
- Write-up (secondary), Vili Ketonen, 2025-10-30 —
  <https://viliket.github.io/posts/native-like-bottom-sheets-on-the-web/>
- React Aria Sheet docs — <https://react-aria.adobe.com/Sheet>
- React Aria blog (secondary) — <https://react-aria.adobe.com/blog/sheet>
- React Aria Components 1.22.0 release (published 2026-10-08) —
  <https://react-aria.adobe.com/releases/v1-22-0>; PR
  <https://github.com/adobe/react-spectrum/pull/10674>
- APG Patterns index — <https://www.w3.org/WAI/ARIA/apg/patterns/>
- APG Dialog (Modal) pattern — <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- Local: `../README.md` (divergence policy, what a primitive is),
  `apg-platform-features.md` (native/polyfill/library split),
  `packages/apg-specs/scenarios/apg/README.md` (upstream scenario porting),
  `packages/apg-specs/specs/apg/dialog-modal.qnt`
- Beans: `effects-of-atmosphere-zgpx`,
  `effects-of-atmosphere-jtjk`,
  `effects-of-atmosphere-aztx`
