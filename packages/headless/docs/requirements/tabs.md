# Tabs — accessibility requirements

The worked template for the [requirement catalogue](./README.md), done the way TetraLogical do tabs:
the problem, when to use it, the requirements by theme, the assistive-technology table — with each
requirement pointing at the Quint spec, the browser test or the manual row that holds it. TetraLogical
publish Gherkin and Cucumber; we publish the artefact.

Source: `packages/headless/src/tabs.ts`, `packages/apg-specs/specs/apg/tabs.qnt`, the ported scenario
sets in `packages/apg-specs/scenarios/apg/tabs.*.json`, the tests named below.

## The problem it solves

Tabs break related content into labelled chunks and show one chunk at a time. They help people find
and read content without scrolling past everything else, and they cut cognitive load. The metaphor is
a paper folder: pages in sections, each section indexed by a protruding labelled tab.

## When to use it

- the content separates into clearly labelled sections;
- the first section is the most relevant for most people;
- nobody needs two sections at once.

## When not to use it

- unrelated sections — separate pages;
- important information someone may miss;
- content that must be read in a fixed order, such as a step-by-step process;
- blocks people need to compare: switching back and forth asks them to memorise.

In our stack, a page whose sections are only links in a table of contents is better served by
`createScrollspy` plus anchors; a single collapsible section is `createDisclosure`.

## How ours works

`createTabs` is state plus attribute objects: `tablistProps`, `tabProps(i)`, `tabpanelProps(i)`, and
the close / rename extension's parts. Roving tabindex, wrapping arrows on the tablist's axis,
Home/End, automatic or manual activation, disabled tabs, and a selection that is a request
(`value` + `onValueChange`) or uncontrolled (`defaultSelected`).

The model is `specs/apg/tabs.qnt` (four tab slots, activation × orientation × deletable × disabled
mask as one packed variant, request vs commit). The DOM is checked against it by the scenario replay
and the differential walk in `test/tabs.browser.test.tsx`; the extension by
`test/tabs-close.browser.test.tsx`.

**The host owns the elements.** No role, name, size, colour or animation is rendered by the
primitive, so the rows about naming, contrast, hit area and no-JS are either a browser test of a
host (`apps/ui/src/registry/tabs/tabs.tsx`) or a gap with an owner — never a test of a primitive that
cannot carry them.

## Requirements

`quint:` names the spec; a spec-only test or a scenario id in the same cell is the evidence.
`test:` names a browser test and, in parentheses, the scenario whose `expect` states it. `manual:`
names the row of the assistive-technology table. `gap:` names the open task at the bottom.

| Requirement                                                                                      | Theme                                | Where it is checked                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The tablist can be horizontal or vertical, and says which                                        | Adaptability                         | quint: `specs/apg/tabs.qnt` (`orientation`, `ConfigValid`, `ariaOrientationKnown`); test: `test/tabs.browser.test.tsx` (`tabs.base-ui.aria-orientation-vertical`)                                                                                                                    |
| Orientation is announced, so the arrow keys are described correctly                              | Assistive technologies and semantics | quint: `specs/apg/tabs.qnt`; test: `test/tabs.browser.test.tsx` (`tabs.base-ui.aria-orientation-default-absent` — horizontal omits the attribute, the ARIA default)                                                                                                                  |
| Text scales to 200 % without loss                                                                | Adaptability                         | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("keeps the labels whole at 200 % text" — 28 px labels, each tab and the tablist `scrollWidth <= clientWidth`)                                                                                                               |
| Content reflows at 320 px without horizontal scrolling                                           | Adaptability                         | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("reflows at 320 px without a horizontal scrollbar" — the tablist and every tab `scrollWidth <= clientWidth`)                                                                                                                |
| No loss when line, letter and word spacing are increased                                         | Adaptability                         | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("keeps the labels whole with increased text spacing" — same boxes at 0.12em letter, 0.16em word, 1.5 line spacing)                                                                                                          |
| Content and the selected tab stay identifiable in high contrast themes                           | Adaptability                         | manual: Windows Contrast themes                                                                                                                                                                                                                                                      |
| Below 800 px the same sections are an accordion, one open at a time, same section selected       | Adaptability                         | gap: G2                                                                                                                                                                                                                                                                              |
| There is no animation, so `prefers-reduced-motion` has nothing to reduce                         | Animation and movement               | manual: `prefers-reduced-motion` (N/A)                                                                                                                                                                                                                                               |
| The tab that looks selected is the one identified as selected in the code                        | Assistive technologies and semantics | quint: `specs/apg/tabs.qnt` (`ExactlyOneSelectedTab`); test: `test/tabs.browser.test.tsx` (`tabs.ariakit.default-selected-tab`)                                                                                                                                                      |
| Exactly one panel is shown, and it is the selected tab's                                         | Assistive technologies and semantics | quint: `specs/apg/tabs.qnt` (`VisiblePanelIsSelectedTabPanel`); test: `test/tabs.browser.test.tsx` (`tabs.base-ui.click-selects`)                                                                                                                                                    |
| The accessibility tree order is the visual order                                                 | Assistive technologies and semantics | manual: JAWS + Chrome, NVDA + Firefox (reading order)                                                                                                                                                                                                                                |
| Each tab's accessible name matches or includes its visible label                                 | Assistive technologies and semantics | test: `test/tabs-requirements.browser.test.tsx` ("names every tab, panel and state in the accessibility tree")                                                                                                                                                                       |
| Each tabpanel's accessible name comes from the tab that controls it                              | Assistive technologies and semantics | test: `test/tabs.browser.test.tsx` (`tabs.react-aria.panel-aria-relationships` — `aria-labelledby`)                                                                                                                                                                                  |
| Each tab is programmatically associated with the panel it controls                               | Assistive technologies and semantics | test: `test/tabs.browser.test.tsx` (`tabs.react-aria.panel-aria-relationships` — `aria-controls`)                                                                                                                                                                                    |
| The tablist has role `tablist`, each tab role `tab` inside it, each panel `tabpanel`             | Assistive technologies and semantics | test: `test/tabs-requirements.browser.test.tsx` ("names every tab, panel and state in the accessibility tree")                                                                                                                                                                       |
| A disabled tab is announced as disabled                                                          | Assistive technologies and semantics | test: `test/tabs-requirements.browser.test.tsx` ("names every tab, panel and state in the accessibility tree" — `aria-disabled`)                                                                                                                                                     |
| The markup is parsed and exposed to the accessibility tree                                       | Assistive technologies and semantics | test: `test/tabs.browser.test.tsx` (every mount is parsed by Chromium)                                                                                                                                                                                                               |
| Colour alone does not identify the active tab                                                    | Colour and contrast                  | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("marks the selected tab with more than colour" — the selected underline is 3 px, the unselected 2 px)                                                                                                                       |
| Text in the component has 4.5 : 1 contrast (7 : 1 at AAA)                                        | Colour and contrast                  | theme: `apps/ui/src/registry/theme.ts` (`check.contrast` text/page ≥ 7, muted/page ≥ 4.5)                                                                                                                                                                                            |
| The active-tab indicator has 3 : 1 against its background and the unselected tabs                | Colour and contrast                  | theme: `apps/ui/src/registry/theme.ts` (`check.contrast` highlight/page ≥ 3; the skin's underline)                                                                                                                                                                                   |
| A custom focus style has 3 : 1 against adjacent colours                                          | Colour and contrast                  | theme: `apps/ui/src/registry/theme.ts` (`check.contrast` focusRing/page ≥ 3; test: the focus-ring test asserts the computed ratio)                                                                                                                                                   |
| Receiving focus on a tab does not change context                                                 | Consistency and predictability       | manual: all five screen-reader rows                                                                                                                                                                                                                                                  |
| An icon used instead of a visible label has a text alternative; an icon beside a label is hidden | Images and media                     | host obligation, checked by the AT table (see Host obligations)                                                                                                                                                                                                                      |
| Real text is used, not images of text                                                            | Images and media                     | N/A — the primitive renders no media                                                                                                                                                                                                                                                 |
| Each tab can be reached and activated by keyboard                                                | Keyboard                             | quint: `specs/apg/tabs.qnt` (`press`); test: `test/tabs.browser.test.tsx` (`tabs.react-aria.manual-activation-enter`)                                                                                                                                                                |
| Tab enters the tablist on the selected tab                                                       | Keyboard                             | quint: `specs/apg/tabs.qnt` (`tab_key`, `enteringTablist`); test: `test/tabs.browser.test.tsx` (`tabs.react-aria.tab-into-selects-selected-tab`)                                                                                                                                     |
| Each tab is activated on focus (automatic) or by Enter / Space (manual)                          | Keyboard                             | quint: `specs/apg/tabs.qnt` (`AutomaticSelectionFollowsFocus`, `pressSelected`); test: `test/tabs.browser.test.tsx` (`tabs.base-ui.keyboard-activation-enter-space`)                                                                                                                 |
| Left / Right (horizontal) and Up / Down (vertical) move between tabs, wrapping at the ends       | Keyboard                             | quint: `specs/apg/tabs.qnt` (`nextWrap`, `prevWrap`); test: `test/tabs.browser.test.tsx` (`tabs.react-aria.arrow-horizontal`, `tabs.ariakit.arrow-selects-automatic`); RTL: `test/tabs-requirements.browser.test.tsx` ("swaps ArrowLeft and ArrowRight in a horizontal rtl tablist") |
| Home and End move to the first and last enabled tab                                              | Keyboard                             | quint: `specs/apg/tabs.qnt` (`firstTab`, `lastTab`); test: `test/tabs.browser.test.tsx` (`tabs.react-aria.home-end`)                                                                                                                                                                 |
| Disabled tabs are skipped by arrows, Home and End, and ignore clicks                             | Keyboard                             | quint: `specs/apg/tabs.qnt` (`focusable`, `nextWrap`, `prevWrap`); test: `test/tabs.browser.test.tsx` (`tabs.react-aria.arrow-skips-disabled`, `tabs.base-ui.click-disabled-does-not-select`)                                                                                        |
| The component does not trap focus                                                                | Keyboard                             | test: `test/tabs-requirements.browser.test.tsx` ("lets focus leave the tablist and keeps hidden panels out of the tab order")                                                                                                                                                        |
| Focus cannot move into the content of a hidden panel                                             | Keyboard                             | test: `test/tabs-requirements.browser.test.tsx` ("lets focus leave the tablist and keeps hidden panels out of the tab order" — native `hidden`)                                                                                                                                      |
| The panel is not in the tab order when its content is focusable                                  | Keyboard                             | test: `test/tabs.browser.test.tsx` (`tabs.ariakit.panel-tabindex-no-tabbable`) — see the divergence below                                                                                                                                                                            |
| Each tab has a visible focus indicator                                                           | Keyboard                             | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("draws a 2 px focus ring with 3 : 1 against the page" — `outline-style: solid`, width ≥ 2 px, computed ring/page ratio ≥ 3)                                                                                                 |
| A focused tab is not fully hidden by other content (AA), and fully visible (AAA)                 | Keyboard                             | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("keeps a focused tab clear of a sticky header" — `tabs.fixture.tsx`'s `mountTabsUnderStickyHeader`; after `scrollIntoView` the tab's top is at or below the header's bottom)                                                |
| A custom focus style has a 2 px solid perimeter                                                  | Keyboard                             | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("draws a 2 px focus ring with 3 : 1 against the page" — `outline-width` is at least 2 px and `outline-style` is `solid`)                                                                                                    |
| Each tab has a clear label that says what its panel holds                                        | Navigation                           | manual: JAWS + Chrome, NVDA + Firefox (name and role announcement)                                                                                                                                                                                                                   |
| A tab is activated on the up event, not the down event                                           | Pointer and touch                    | test: `test/tabs-requirements.browser.test.tsx` ("selects on the up event, not the down event")                                                                                                                                                                                      |
| Each tab's target is at least 24 × 24 CSS px, alone or with spacing (AA)                         | Pointer and touch                    | test: `apps/ui/src/registry/tabs/tabs.browser.test.tsx` ("gives every tab a 24 x 24 target" — a one-letter label's box is ≥ 24 × 24; `tabs.tsx` sets `min-height`/`min-width: 24px`)                                                                                                 |
| Each tab's target is at least 44 × 44 CSS px (AAA)                                               | Pointer and touch                    | not met: the skin's box is about 33 px; the 24 × 24 floor is asserted above, 44 × 44 is an AAA departure                                                                                                                                                                             |
| A close button is out of the tablist's tab order and named after its tab                         | Pointer and touch (extension)        | test: `test/tabs-close.browser.test.tsx` ("keeps the close buttons out of the tablist's tab order")                                                                                                                                                                                  |
| Delete closes the focused tab, focus goes to the tab that took its place or the previous one     | Keyboard (extension)                 | quint: `specs/apg/tabs.qnt` (`deleting`, `afterDelete`); test: `test/tabs-close.browser.test.tsx` ("closes the focused tab with Delete…")                                                                                                                                            |
| The last remaining tab is never closed                                                           | Consistency and predictability       | test: `test/tabs-close.browser.test.tsx` ("refuses to close the last remaining tab")                                                                                                                                                                                                 |
| Rename starts on a double click; Enter and blur commit, Escape reverts, an empty label cancels   | Keyboard (extension)                 | test: `test/tabs-close.browser.test.tsx` (the rename suite)                                                                                                                                                                                                                          |
| Without JavaScript the sections are a list of in-page links, then a heading and the content      | Adaptability                         | gap: G10                                                                                                                                                                                                                                                                             |

## Assistive technology compatibility

`not run` is the status of every screen-reader row: this table has never been through the ATs. The tag
says how the row is checked — `@automatic` where a machine artefact already proves it (`automatic` in
the status column, no hand pass needed), `@manual` where a person must.

| Assistive technology                         | What the row checks                                                          | Tag          | Status    |
| -------------------------------------------- | ---------------------------------------------------------------------------- | ------------ | --------- |
| Keyboard only                                | Tab enters at the selected tab; arrows wrap; Home/End; Enter/Space in manual | `@automatic` | automatic |
| JAWS 2026 / Chrome / Windows 11              | Role, name and selected state of each tab and panel; reading order           | `@manual`    | not run   |
| NVDA 2026 / Firefox / Windows 11             | Same, including `aria-orientation` and the disabled announcement             | `@manual`    | not run   |
| VoiceOver / Safari / macOS                   | Rotor lists the tabs and panels; the selected tab is announced as selected   | `@manual`    | not run   |
| VoiceOver / Safari / iOS                     | Swipe order, double-tap activation, the selected state                       | `@manual`    | not run   |
| TalkBack / Chrome / Android                  | Explore-by-touch order, activation, the selected state                       | `@manual`    | not run   |
| Voice Access / Chrome                        | "Click <tab name>" selects the named tab                                     | `@manual`    | not run   |
| Windows Contrast themes                      | Content stays visible; the selected tab stays identifiable                   | `@manual`    | not run   |
| Windows Magnifier / Apple Zoom, browser zoom | A focused tab is not obscured; reflow at 320 px                              | `@manual`    | not run   |
| `prefers-reduced-motion`                     | N/A — the component has no animation                                         | `@manual`    | N/A       |

## Where we deliberately differ from TetraLogical

- **The panel's tab stop is conditional.** TetraLogical's tabs own their panels and never put the
  panel itself in the tab order. Ours cannot inspect panel content, so `tabpanelProps` emits
  `tabindex="0"` unless the host declares the panel among `focusablePanels` — APG's rule for a panel
  with nothing focusable inside. A host that passes `focusablePanels` for every panel that has
  focusable content meets the requirement; one that forgets gets an extra tab stop on the panel. This
  is a host duty, recorded here so it is not mistaken for a model gap.
- **The model is four tabs.** `tabs.qnt` models four slots as bit masks and the bridge rejects
  anything else; the primitive takes any `items`. Five tabs are not unmodelled behaviour, only
  unmodelled test data.
- **Close and rename are ours.** The spec models a `deletable` flavour and no rename; the primitive
  owns no list, so `tabs-close.browser.test.tsx` is the oracle for both. That is a declared
  extension, not a divergence from APG.
- **RTL is implemented but not modelled.** `dir: "rtl"` swaps ArrowLeft / ArrowRight on a
  horizontal tablist (a vertical one is unaffected); `tabs.qnt` still models ltr only, so the
  `direction` scenarios stay `Unsupported` and skipped in the differential walk. The swap is held
  by `test/tabs-requirements.browser.test.tsx`, not by the spec — see gap G11.

## Gaps (open tasks)

The requirements above that no artefact holds. Each is a task, in this document, until it has one.

- [x] **G1 — Reflow and text scaling.** `apps/ui/src/registry/tabs/tabs.browser.test.tsx` mounts the
      skin at a 320 px viewport: the tablist and every tab keep `scrollWidth <= clientWidth`. At
      200 % text (32 px root, 28 px labels) the same boxes hold, and so they do with 0.12em letter,
      0.16em word and 1.5 line spacing. `tabs.tsx` wraps the tablist so four labels reflow instead
      of scrolling horizontally.

- [ ] **G2 — The narrow accordion.** Below 800 px TetraLogical switch the same sections to an
      accordion that keeps one open. Nothing composes `createAccordion` with `createTabs` and
      nothing tests a breakpoint; the chevron-before-label rule has no home until this exists.

- [x] **G3 — Roles and names.** `test/tabs-requirements.browser.test.tsx` ("names every tab,
      panel and state in the accessibility tree") asserts `role="tablist" | "tab" | "tabpanel"` on
      the real elements, `aria-controls` and `aria-labelledby` as reciprocal ids, exactly one
      `aria-selected="true"` and one `tabindex="0"`, `aria-disabled` on the disabled tab, and each
      tab's accessible name through Playwright's role + name query (4.1.2 and 2.5.3).

- [x] **G4 — Contrast.** The tabs pair is gated in `apps/ui/src/registry/theme.ts` by
      `check.contrast` in both modes: text/page ≥ 7, muted/page ≥ 4.5, highlight/page ≥ 3 (the
      active underline) and focusRing/page ≥ 3. Every pair passes; the closest is the dark-mode
      underline at 3.17 : 1 with the indigo preset. `tabs.browser.test.tsx` ("marks the selected tab
      with more than colour") asserts the selected underline is 3 px against the unselected 2 px, so
      the cue is a weight, not colour alone.

- [x] **G5 — Icons.** Host obligation, checked by the AT table: the primitive renders no icon and
      names nothing. Beside a visible label the icon is `aria-hidden="true"`; when the icon is the
      tab's only content the tab is named from `label(index)` (an `aria-label` or visually hidden
      text on the tab), because `label` is the one text the host already supplies. See Host
      obligations.

- [x] **G6 — Focus leaves, and hidden panels stay out of it.** `test/tabs-requirements.browser.test.tsx`
      ("lets focus leave the tablist and keeps hidden panels out of the tab order") focuses the
      tablist, walks Tab through the real DOM to the sibling after the component (no trap), and
      proves a `<button>` in an unselected panel is never reached: `tabpanelProps(i).hidden` is
      `true` and the native `hidden` keeps the child out of the tab order.

- [x] **G7 — Focus appearance and obscuring.** `tabs.browser.test.tsx` ("draws a 2 px focus ring
      with 3 : 1 against the page") reads the computed `outline-style` (`solid`), `outline-width`
      (≥ 2 px) and the ring/background ratio (≥ 3, from the computed colours). The composition test
      ("keeps a focused tab clear of a sticky header") mounts `tabs.fixture.tsx`'s
      `mountTabsUnderStickyHeader`, reveals the tab at the scrollport's start and asserts its top is
      at or below the 32 px header's bottom, backed by `scroll-margin-top: 40px` on the tab.

- [x] **G8 — Activation on the up event.** `test/tabs-requirements.browser.test.tsx` ("selects on
      the up event, not the down event") dispatches a `mousedown` alone (inert), then the full
      pointerup / click sequence (selects), then `pointercancel` between a down and its release
      (the selection is untouched). 2.5.2 now has evidence, not a construction claim.

- [x] **G9 — Target size.** `tabs.browser.test.tsx` ("gives every tab a 24 x 24 target") asserts a
      one-letter label's rendered box is at least 24 × 24 CSS px; `tabs.tsx` sets `min-height` and
      `min-width` to 24 px so the padding is no longer the only floor. The AAA 44 × 44 target is not
      claimed — the box is about 33 px — and the requirements table records that departure.

- [ ] **G10 — No-JS fallback.** Nothing renders TetraLogical's fallback (a list of in-page links,
      then a heading and the full content per section) and nothing tests that the script's replacement
      leaves no unreachable content. This is the catalogue's no-JS rule with no implementation behind
      it yet, and the largest gap in this page.

- [x] **G11 — RTL.** `dir: "ltr" | "rtl"` (default ltr) is an option on the primitive: a
      horizontal tablist swaps ArrowLeft / ArrowRight, a vertical one is unaffected.
      `tabs.qnt` still models ltr only, so the `direction` scenarios stay `Unsupported` and skipped.
      `test/tabs-requirements.browser.test.tsx` holds both halves ("swaps ArrowLeft and ArrowRight
      in a horizontal rtl tablist", "keeps the ltr arrows and the vertical axis unchanged"); the
      spec gaining `direction` is still open work, not this gap's residue.

- [ ] **G12 — The AT table has never been run.** Every row is `not run`. The first pass is the gap.

## Host obligations

Named here so a page like this does not read as a promise the primitive made:

- render `role=tab` elements with a visible label, and pass `tabProps` through unchanged;
- give an icon inside a tab `aria-hidden="true"` when it sits beside a visible label; when the
  icon is the tab's only content the tab is named from `label(index)` — the host puts that text in
  an `aria-label` or in visually hidden text, since the primitive emits no name;
- set `dir` on the host's element when the page is right-to-left: the primitive swaps the
  horizontal arrows from the option, but the visual order is the host's `dir`;
- declare `focusablePanels` for every panel whose content can take focus;
- give each tab a target of at least 24 × 24 px (44 × 44 for AAA) and a 2 px, 3 : 1 focus ring;
- keep the contrast values above in the theme;
- render the no-JS fallback and replace it on load.
