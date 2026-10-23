// shared/popover.qnt — the platform contract of the `popover` attribute
// (`:popover-open`, light dismiss, Esc, focus return) for ONE popover.
//
// Pure defs only: import with `import popover.* from "../../shared/popover"`.
// Defs are prefixed `popover`. The open flag is passed in and the next flag
// comes back out; the pattern owns the var and feeds platform events to it, so
// a menu-button writes `open' = popoverOpenAfter(kind, open, "outsidePress")`
// and models only its own delta (menu keys, typeahead, aria-haspopup).
//
// Kinds: "auto" (light dismiss, closes unrelated autos and hints), "hint"
// (light dismiss, closes only other hints, built for tooltips), "manual"
// (no light dismiss, no Esc, closes nothing).
//
// Events a pattern may pass to `popoverOpenAfter`:
//   show | hide | toggle          invoker command or showPopover()/hidePopover()
//   esc                           the close request reached THIS popover (it is
//                                 the topmost one)
//   outsidePress                  pointer press outside the popover AND its invoker
//                                 (a press on the invoker is `toggle`, not a dismiss
//                                 followed by a re-open)
//   focusOut                      focus moved elsewhere: never closes a popover
//   showUnrelatedAuto | showUnrelatedHint   another popover of that kind opened
//                                 and is neither an ancestor nor a descendant
//
// Provided: `:popover-open` is the open flag; show on an open popover and hide
// on a closed one are no-ops; focus that was inside returns to the element
// focused before it opened.
//
// NOT provided, still the pattern's: menu semantics, typeahead, hover intent,
// submenus, aria-haspopup, positioning (anchor positioning is CSS). The invoker
// button exposes `aria-expanded` implicitly (see invokers.qnt).
//
// NOT expressible as pure defs, so NOT modelled: the stack of open popovers.
// Which popover is topmost, ancestor / descendant relations (a nested auto
// popover keeps its ancestors open) and "Esc closes only the topmost" need a
// collection of open popovers, which a pure module cannot carry. A pattern with
// nested popovers states the relation itself as environment events
// (`esc` only reaches the topmost, `showUnrelatedAuto` only for non-ancestors).
// Follow-up of effects-of-atmosphere-dx00 (collections, item 6).
//
// Verified in Chromium 153.0.8010.12 (Playwright 1.63.0, native, 2026-10-07):
// toggle/show/hide, Esc with focus inside returns focus to the invoker, outside
// click closes an auto popover and focus goes to the click target, Tab or
// script focus moving outside does not close, `manual` ignores Esc and outside
// press, opening an unrelated auto closes the other, a nested child keeps its
// ancestor, Esc closes only the topmost, `hint` stays alongside an open auto,
// a second hint closes the first, showing an auto closes an open hint.
// Pin: WHATWG HTML popover API (Baseline newly: C114 / F125 / S17); `hint`
// C151 / F153 per docs/research/apg-platform-features.md.
module popover {
  def popoverKindKnown(kind: str): bool =
    or(or(kind == "auto", kind == "hint"), kind == "manual")

  // Esc and an outside press dismiss every kind but manual
  def popoverLightDismisses(kind: str): bool = kind != "manual"

  def popoverOpenAfter(kind: str, open: bool, ev: str): bool =
    if (ev == "show") true
    else if (ev == "hide") false
    else if (ev == "toggle") not(open)
    else if (or(ev == "esc", ev == "outsidePress"))
      (if (popoverLightDismisses(kind)) false else open)
    else if (ev == "showUnrelatedAuto") (if (kind == "manual") open else false)
    else if (ev == "showUnrelatedHint") (if (kind == "hint") false else open)
    else open

  // does closing by this event hand focus back to the pre-open element?
  // (only when focus was inside; a pointer press moves focus to its target)
  def popoverReturnsFocus(ev: str, focusInside: bool): bool =
    and(focusInside, or(or(ev == "hide", ev == "toggle"), ev == "esc"))
}
