// shared/invokers.qnt — the platform contract of invoker commands
// (`<button commandfor="id" command="...">`) on the element they target.
//
// Pure defs only: import with `import invokers.* from "../../shared/invokers"`.
// Defs are prefixed `invoker`. The target's open flag is passed in and the next
// one comes back out. For a popover target feed `invokerPopoverEvent(cmd)` to
// popover.qnt's `popoverOpenAfter`, so a menu-button imports both modules and
// states only its own delta.
//
// Built-in commands (exactly six in the WHATWG source):
//   popover target   toggle-popover | show-popover | hide-popover
//   dialog target    show-modal | close | request-close
//   custom           any `--name`: no state change, only a `command` event
//                    on the target (the author's listener decides)
// A built-in command aimed at the wrong kind of target does nothing (a
// `show-modal` on a popover is a no-op). A disabled button or a `commandfor`
// that resolves to no element does nothing. A command that is neither built in
// nor `--`-prefixed is not delivered (verified).
//
// Provided: the activation (click, Enter, Space) -> command mapping and the
// implicit `aria-expanded` on an invoker of a popover (verified: false closed,
// true open), no script.
//
// NOT provided, still the pattern's: any state beyond open/closed, the
// `request-close` outcome (the target's `cancel` handler may veto it, so the
// platform contract leaves `open` unchanged here), `aria-haspopup`, menu keys,
// `details` commands (none exist yet), focus placement inside the target.
//
// Verified in Chromium 153.0.8010.12 (Playwright 1.63.0, native, 2026-10-07):
// toggle/show/hide-popover (incl. show twice stays open, hide when closed is a
// no-op), show-modal makes the dialog `:modal`, request-close closes it,
// `--foo` reaches the target as a `command` event, `nonsense` does not,
// show-modal on a popover is a no-op. Not verified: `aria-expanded` for dialog
// invokers (the modal makes the invoker inert).
// Pin: WHATWG HTML button `command` (Baseline newly 2025-12-12:
// C135 / F144 / S26.2); polyfill `invokers-polyfill` 1.0.4.
//
// Strings are opaque in the supported subset (no prefix test), so the pattern
// says whether a command is `--`-prefixed via the `custom` flag.
module invokers {
  def invokerIsPopoverCmd(cmd: str): bool =
    or(or(cmd == "toggle-popover", cmd == "show-popover"), cmd == "hide-popover")
  def invokerIsDialogCmd(cmd: str): bool =
    or(or(cmd == "show-modal", cmd == "close"), cmd == "request-close")
  def invokerIsBuiltin(cmd: str): bool =
    or(invokerIsPopoverCmd(cmd), invokerIsDialogCmd(cmd))

  // targetKind: "popover" | "dialog" | "other"
  def invokerCmdApplies(cmd: str, targetKind: str): bool =
    or(
      and(invokerIsPopoverCmd(cmd), targetKind == "popover"),
      and(invokerIsDialogCmd(cmd), targetKind == "dialog")
    )

  // the button fires only when enabled and its commandfor resolves
  def invokerFires(disabled: bool, targetExists: bool): bool =
    and(not(disabled), targetExists)

  // the `command` event is dispatched on the target for built-ins and `--` names
  def invokerDispatches(cmd: str, custom: bool): bool = or(invokerIsBuiltin(cmd), custom)

  // the popover.qnt event a popover command stands for
  def invokerPopoverEvent(cmd: str): str =
    if (cmd == "toggle-popover") "toggle"
    else if (cmd == "show-popover") "show"
    else if (cmd == "hide-popover") "hide"
    else ""

  // open flag of the target after the command (request-close: unchanged, the
  // target's cancel handler decides)
  def invokerOpenAfter(cmd: str, targetKind: str, open: bool): bool =
    if (not(invokerCmdApplies(cmd, targetKind))) open
    else if (cmd == "toggle-popover") not(open)
    else if (or(cmd == "show-popover", cmd == "show-modal")) true
    else if (or(cmd == "hide-popover", cmd == "close")) false
    else open

  // implicit aria-expanded of a popover invoker; no value for other targets
  def invokerExpandedKnown(cmd: str, targetKind: str): bool =
    and(invokerIsPopoverCmd(cmd), targetKind == "popover")
}
