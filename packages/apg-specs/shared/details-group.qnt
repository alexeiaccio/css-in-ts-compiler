// shared/details-group.qnt — the platform contract of `<details name="group">`:
// an exclusive accordion with no script.
//
// Pure defs only: import with `import details_group.* from "../../shared/details-group"`.
// Defs are prefixed `dg`. Exclusivity is built into the representation: a group
// is ONE int, the index of its open `<details>` (`-1` = all closed), so two
// open members of one group cannot be written down. A pattern with `n` panels
// keeps `open: int` and applies `dgToggle` / `dgSetOpen`.
//
// Provided:
//   - at most one open member per `name`, per tree scope (a shadow root is a
//     separate scope: verified, both stay open)
//   - opening one closes the other, whether by summary click, Enter, Space or
//     `open = true`; the last opened wins
//   - ALL may be closed: toggling the open member closes it (no "keep one open")
//   - at parse time with several `open` in one group the FIRST stays open
//     (`dgParseOpen`); other groups and unnamed `<details>` are unaffected
//
// NOT provided, still the pattern's (or a reason to use the library accordion):
//   - heading semantics: `<summary>` is not a heading, and there is no
//     `aria-level`; the group is exposed as plain groups
//   - arrow-key / Home / End navigation between summaries (APG: optional)
//   - aria-disabled panels, a "single vs multiple" mode switch (no `name` means
//     multiple), `hidden=until-found` search reveal, animated height
//   - the `toggle` event ordering across the closing and opening members
//
// Verified in Chromium 153.0.8010.12 (Playwright 1.63.0, native, 2026-10-07):
// initial open member, opening another closes it, a different group is
// unaffected, clicking the open summary closes it, Enter and Space on a focused
// summary toggle, programmatic `open` on two members leaves the last open,
// three `open` at parse leaves the first, `name` is scoped per tree.
// Pin: WHATWG HTML `details` `name` (Baseline newly: C120 / F130 / S17.2).
module details_group {
  // the user toggles member i of the group
  def dgToggle(open: int, i: int): int = if (open == i) -1 else i

  // script sets member i's `open` to wanted
  def dgSetOpen(open: int, i: int, wanted: bool): int =
    if (wanted) i else if (open == i) -1 else open

  // the member left open when the parser meets members `a` and `b` (both
  // `open`, -1 = not open) of one group: the first one wins
  def dgParseOpen(a: int, b: int): int = if (a >= 0) a else b

  def dgIsOpen(open: int, i: int): bool = open == i

  // invariant predicate (wrap in a `val` in the pattern): the open index names
  // a real member of an n-member group, or none
  def dgValid(n: int, open: int): bool = and(open >= -1, open <= n - 1)
}
