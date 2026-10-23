// APG Alert and Message Dialogs pattern — the discard-notes confirmation.
//
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
//   sections: About This Pattern, Keyboard Interaction (defers to the modal
//   dialog pattern), WAI-ARIA Roles, States, and Properties
//   example:  https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/
//   keyboard: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (Keyboard
//   Interaction, Notes 1-2)
//
// A page with a Notes textarea, Save and Discard buttons; Discard opens an
// alertdialog with No and Yes buttons. Focus is one encoded target
// `layer * 100 + position`: layer 0 is the page (1 textarea, 2 Save,
// 3 Discard), layer 1 the alertdialog (1 No, 2 Yes).
//
// Modelled
//   - open: activating an enabled Discard opens the alertdialog and moves focus
//     to the LEAST DESTRUCTIVE action ("No"); the invoker is remembered.
//   - Tab / Shift+Tab: cycle (wrap) within the dialog, never leaving it.
//   - Escape or "No": close without discarding; "Yes": discard the notes and
//     storage, then close. Focus returns to the invoker (Discard); when the
//     buttons use aria-disabled (the example) the emptied Discard stays
//     focusable, so focus really lands there.
//   - Discard is aria-disabled while the textarea is empty and Save while the
//     textarea equals storage; aria-disabled controls stay in the tab sequence
//     but cannot be activated. USE_ARIA_DISABLED=false models the HTML
//     `disabled` variant for Discard (it drops out of the tab sequence and the
//     return focus falls back to the textarea).
//   - Ctrl/Cmd+S in the textarea saves; typing/clearing edit the textarea.
//   - focus_attempt (pointer click / programmatic focus) is refused outside
//     the active layer; pointer_outside never dismisses an alertdialog (it
//     demands a response).
//   - ARIA contract (derived defs): role=alertdialog, aria-modal=true, a name
//     (aria-labelledby: the "Confirmation" heading) and a REQUIRED
//     aria-describedby referencing the message.
//
// Request vs commit (map ticket rt1p). The dialog's `isOpen` is the controlled
// value: `activate` and `escape` are requests carrying the open intent
// (`requested`). A request fires onValueChange (`requests` counts the calls)
// when the intent differs from the current open state, and then:
//   uncontrolled        the request is accepted: the state commits the intent
//   controlled, holds   the host ignores it ("rejected"): the state is untouched
//   controlled, accepts the host writes the intent back (`accepting`)
// `valueProp` is the host's copy (meaningful while `controlled`); `setValue` /
// `hostToggle` are the host writing it, the only commit while controlled.
// `control` / `acceptRequests` configure the host (init is literal-only). A
// rejected open/close request leaves focus, the return target and the notes
// untouched too, so the whole transition is gated by the rejection.
//
// Invariants for the model: ControlledFollowsProp (in controlled mode no event
// commits), RejectedRequestUntouched, AcceptedRequestCommits.
//
// Deliberately omitted
//   - the non-modal Alert pattern shown beside it (the "saved" alert), which
//     never moves focus or changes this machine's state;
//   - Save's own aria-disabled/disabled variant (only Discard has the variant);
//   - stacking an alertdialog over another modal (see dialog-modal.qnt);
//   - the notes' real text: contents are three revisions (0 empty, 1, 2);
//   - the system alert sound, visual dimming, aria-hidden legacy handling.
module apg_alertdialog {
  var isOpen: bool // the alertdialog is open
  var focus: int // layer * 100 + position
  var ret: int // focus target to restore on close (0 = none)
  var interacted: bool // focus moved since the dialog opened
  var notes: int // textarea content revision (0 = empty)
  var stored: int // localStorage content revision (0 = empty)
  var requests: int // number of requests that fired onValueChange
  var controlled: bool // the host owns the open state (`value` prop present)
  var accepting: bool // controlled host that answers every request with its intent
  var valueProp: bool // the controlled value prop (meaningful while controlled)
  var requested: bool // intent of the last request
  var outcome: str // "none" | "accepted" | "rejected"
  var base: bool // open state when the last request was received

  // --- configuration -----------------------------------------------------------
  def USE_ARIA_DISABLED: bool = true
  def NO_POS: int = 1 // least destructive action
  def YES_POS: int = 2 // destructive action
  def FALLBACK_TARGET: int = 1 // textarea, when the invoker cannot take focus

  // --- ARIA contract -----------------------------------------------------------
  def dialogRole: str = "alertdialog"
  def ariaModal(open: bool): bool = open
  def hasAccessibleName: bool = true // aria-labelledby -> heading "Confirmation"
  def hasDescription: bool = true // aria-describedby is required for alertdialog
  def contractOk(open: bool): bool =
    and(dialogRole == "alertdialog", ariaModal(open), hasAccessibleName, hasDescription)
  def discardAriaDisabled: bool = notes == 0
  def saveAriaDisabled: bool = notes == stored
  def pageInert: bool = isOpen

  // --- derived state -------------------------------------------------------------
  def discardFocusable: bool = or(USE_ARIA_DISABLED, notes != 0)
  def layer: int = if (isOpen) 1 else 0
  def focusLayer: int = focus / 100
  def focusPos: int = focus % 100
  def tabCount(l: int): int =
    if (l == 1) 2 else if (discardFocusable) 3 else 2
  def validPos(l: int, pos: int): bool = and(pos >= 1, pos <= tabCount(l))
  def validTarget(target: int): bool =
    and(target / 100 == layer, validPos(layer, target % 100))
  def nextPos(pos: int, n: int): int = if (pos >= n) 1 else pos + 1
  def prevPos(pos: int, n: int): int = if (pos <= 1) n else pos - 1
  def isDestructive(pos: int): bool = pos == YES_POS
  // focus restored on close, given the notes revision after the close
  def retFocus(notesAfter: int): int =
    if (and(ret == 3, not(or(USE_ARIA_DISABLED, notesAfter != 0)))) FALLBACK_TARGET else ret

  // --- transition kernel ---------------------------------------------------------
  // ev: 1 escape, 2 activate, 3 tab, 4 shift_tab, 5 focus_attempt, 6 ctrl_s,
  //     7 type_text, 8 clear_text, 9 pointer_outside
  // mode: 0 none, 1 open, 2 close (dismiss), 3 close (confirm discard),
  //       4 save, 5 type, 6 clear
  def activateMode: int =
    if (isOpen) (if (focus == 100 + NO_POS) 2 else if (focus == 100 + YES_POS) 3 else 0)
    else if (and(focus == 3, notes != 0)) 1
    else if (and(focus == 2, notes != stored)) 4
    else 0
  def modeOf(ev: int): int =
    if (ev == 1) (if (isOpen) 2 else 0)
    else if (ev == 2) activateMode
    else if (ev == 6) (if (and(not(isOpen), focus == 1, notes != stored)) 4 else 0)
    else if (ev == 7) (if (and(not(isOpen), focus == 1)) 5 else 0)
    else if (ev == 8) (if (and(not(isOpen), focus == 1)) 6 else 0)
    else 0

  def nextOpen(ev: int): bool =
    if (modeOf(ev) == 1) true
    else if (or(modeOf(ev) == 2, modeOf(ev) == 3)) false
    else isOpen
  def nextNotes(ev: int): int =
    if (or(modeOf(ev) == 3, modeOf(ev) == 6)) 0
    else if (modeOf(ev) == 5) (if (notes == 1) 2 else 1)
    else notes
  def nextStored(ev: int): int =
    if (modeOf(ev) == 3) 0
    else if (modeOf(ev) == 4) notes
    else stored
  def nextRet(ev: int): int =
    if (modeOf(ev) == 1) focus
    else if (or(modeOf(ev) == 2, modeOf(ev) == 3)) 0
    else ret
  def nextInteracted(ev: int, arg: int): bool =
    if (modeOf(ev) == 1) false
    else if (or(ev == 3, ev == 4)) true
    else if (and(ev == 5, validTarget(arg))) true
    else interacted
  def nextFocus(ev: int, arg: int): int =
    if (modeOf(ev) == 1) 100 + NO_POS
    else if (modeOf(ev) == 2) retFocus(notes)
    else if (modeOf(ev) == 3) retFocus(0)
    else if (ev == 3) layer * 100 + nextPos(focusPos, tabCount(layer))
    else if (ev == 4) layer * 100 + prevPos(focusPos, tabCount(layer))
    else if (and(ev == 5, validTarget(arg))) arg
    else focus

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(a: bool, b: bool): int = if (a == b) 0 else 1
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the open state after a request for `want`
  def landed(h: bool, v: bool, want: bool): bool = if (h) v else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: bool, want: bool): bool = if (f) want else p
  // the open intent of each request event
  def wantOpenActivate: bool = nextOpen(2)
  def wantOpenEscape: bool = nextOpen(1)
  // only a request that actually changes the open state can be rejected
  def rejectActivate: bool = and(holds, wantOpenActivate != isOpen)
  def rejectEscape: bool = and(holds, wantOpenEscape != isOpen)

  // --- host writes (the only commit while controlled) ----------------------
  // opening keeps the least destructive focus and remembers Discard as invoker
  def setOpen(c: bool, v: bool): bool = if (c) v else false
  def openingSet(c: bool, v: bool, open: bool): bool = and(c, and(v, not(open)))
  def closingSet(c: bool, v: bool, open: bool): bool = and(c, and(not(v), open))
  def toggleOpen(c: bool, open: bool): bool = if (c) not(open) else open
  def toggleOpening(c: bool, open: bool): bool = and(c, not(open))
  def toggleClosing(c: bool, open: bool): bool = and(c, open)

  action init = all {
    isOpen' = false,
    focus' = 1,
    ret' = 0,
    interacted' = false,
    notes' = 1,
    stored' = 1,
    requests' = 0,
    controlled' = false,
    accepting' = false,
    valueProp' = false,
    requested' = false,
    outcome' = "none",
    base' = false
  }

  // request: Escape closes the dialog (a no-op while already closed)
  action escape = all {
    isOpen' = landed(holds, isOpen, wantOpenEscape),
    focus' = if (rejectEscape) focus else nextFocus(1, 0),
    ret' = if (rejectEscape) ret else nextRet(1),
    interacted' = if (rejectEscape) interacted else nextInteracted(1, 0),
    notes' = if (rejectEscape) notes else nextNotes(1),
    stored' = if (rejectEscape) stored else nextStored(1),
    requests' = requests + moved(isOpen, wantOpenEscape),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantOpenEscape),
    requested' = if (isOpen == wantOpenEscape) requested else wantOpenEscape,
    outcome' = if (isOpen == wantOpenEscape) outcome else verdict,
    base' = if (isOpen == wantOpenEscape) base else isOpen
  }

  // request: activate (Discard opens, "No" closes, "Yes" discards and closes,
  // Save stores; only the open-changing paths are requests)
  action activate = all {
    isOpen' = landed(holds, isOpen, wantOpenActivate),
    focus' = if (rejectActivate) focus else nextFocus(2, 0),
    ret' = if (rejectActivate) ret else nextRet(2),
    interacted' = if (rejectActivate) interacted else nextInteracted(2, 0),
    notes' = if (rejectActivate) notes else nextNotes(2),
    stored' = if (rejectActivate) stored else nextStored(2),
    requests' = requests + moved(isOpen, wantOpenActivate),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantOpenActivate),
    requested' = if (isOpen == wantOpenActivate) requested else wantOpenActivate,
    outcome' = if (isOpen == wantOpenActivate) outcome else verdict,
    base' = if (isOpen == wantOpenActivate) base else isOpen
  }

  action tab = all {
    isOpen' = nextOpen(3),
    focus' = nextFocus(3, 0),
    ret' = nextRet(3),
    interacted' = nextInteracted(3, 0),
    notes' = nextNotes(3),
    stored' = nextStored(3),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action shift_tab = all {
    isOpen' = nextOpen(4),
    focus' = nextFocus(4, 0),
    ret' = nextRet(4),
    interacted' = nextInteracted(4, 0),
    notes' = nextNotes(4),
    stored' = nextStored(4),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // pointer click / programmatic focus on any encoded target (valid or not)
  action focus_attempt = {
    nondet target = Set(0, 1, 2, 3, 4, 100, 101, 102, 103).oneOf()
    all {
      isOpen' = nextOpen(5),
      focus' = nextFocus(5, target),
      ret' = nextRet(5),
      interacted' = nextInteracted(5, target),
      notes' = nextNotes(5),
      stored' = nextStored(5),
      requests' = requests,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base
    }
  }

  action ctrl_s = all {
    isOpen' = nextOpen(6),
    focus' = nextFocus(6, 0),
    ret' = nextRet(6),
    interacted' = nextInteracted(6, 0),
    notes' = nextNotes(6),
    stored' = nextStored(6),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action type_text = all {
    isOpen' = nextOpen(7),
    focus' = nextFocus(7, 0),
    ret' = nextRet(7),
    interacted' = nextInteracted(7, 0),
    notes' = nextNotes(7),
    stored' = nextStored(7),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action clear_text = all {
    isOpen' = nextOpen(8),
    focus' = nextFocus(8, 0),
    ret' = nextRet(8),
    interacted' = nextInteracted(8, 0),
    notes' = nextNotes(8),
    stored' = nextStored(8),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // a click on the inert page never dismisses an alertdialog
  action pointer_outside = all {
    isOpen' = nextOpen(9),
    focus' = nextFocus(9, 0),
    ret' = nextRet(9),
    interacted' = nextInteracted(9, 0),
    notes' = nextNotes(9),
    stored' = nextStored(9),
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // commit: the host writes the controlled open state (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(true, false).oneOf()
    all {
      isOpen' = if (controlled) setOpen(true, v) else isOpen,
      focus' = if (openingSet(controlled, v, isOpen)) (100 + NO_POS)
        else if (closingSet(controlled, v, isOpen)) retFocus(notes) else focus,
      ret' = if (openingSet(controlled, v, isOpen)) 3
        else if (closingSet(controlled, v, isOpen)) 0 else ret,
      interacted' = if (openingSet(controlled, v, isOpen)) false else interacted,
      notes' = notes,
      stored' = stored,
      requests' = requests,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) setOpen(true, v) else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // commit: the host flips its own copy of the open state
  action hostToggle = all {
    isOpen' = if (controlled) toggleOpen(true, isOpen) else isOpen,
    focus' = if (toggleOpening(controlled, isOpen)) (100 + NO_POS)
      else if (toggleClosing(controlled, isOpen)) retFocus(notes) else focus,
    ret' = if (toggleOpening(controlled, isOpen)) 3
      else if (toggleClosing(controlled, isOpen)) 0 else ret,
    interacted' = if (toggleOpening(controlled, isOpen)) false else interacted,
    notes' = notes,
    stored' = stored,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) toggleOpen(true, isOpen) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base
  }

  // configuration: the host starts owning the open state, adopting the current one
  action control = all {
    isOpen' = isOpen,
    focus' = focus,
    ret' = ret,
    interacted' = interacted,
    notes' = notes,
    stored' = stored,
    requests' = requests,
    controlled' = true,
    accepting' = accepting,
    valueProp' = isOpen,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    isOpen' = isOpen,
    focus' = focus,
    ret' = ret,
    interacted' = interacted,
    notes' = notes,
    stored' = stored,
    requests' = requests,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action step = any {
    init, escape, activate, tab, shift_tab, focus_attempt, ctrl_s, type_text,
    clear_text, pointer_outside, setValue, hostToggle, control, acceptRequests
  }

  // --- invariants ------------------------------------------------------------
  // focus never leaves the alertdialog while open (page when closed)
  val FocusInActiveLayer: bool = focusLayer == layer
  // focus sits on a real, focusable element (a disabled Discard is not one
  // unless it uses aria-disabled)
  val FocusPositionValid: bool = validPos(layer, focusPos)
  // the dialog is only reachable through an enabled Discard, so notes exist
  // (a controlled host may still force it open with an empty textarea)
  val OpenImpliesNotes: bool = or(not(isOpen), or(notes != 0, controlled))
  // return focus: the invoker (Discard) while open, nothing remembered when closed
  val ReturnTargetIsInvoker: bool = if (isOpen) ret == 3 else ret == 0
  // initial focus is the least destructive action until the user moves focus
  val InitialFocusLeastDestructive: bool =
    or(not(isOpen), interacted, not(isDestructive(focusPos)))
  // role=alertdialog, aria-modal=true, accessible name and description
  val AlertDialogHonoursContract: bool = or(not(isOpen), contractOk(isOpen))
  // the page is inert exactly while the dialog is open
  val PageInertIffOpen: bool = if (isOpen) focusLayer == 1 else not(pageInert)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), isOpen == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), isOpen == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), isOpen == requested)
}
