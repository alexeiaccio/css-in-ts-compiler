// APG Listbox, typeahead — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
//
// Sections modelled:
//   - "Keyboard Interaction": "Type-ahead is recommended for all listboxes":
//       type a character      focus moves to the next option whose name starts
//                             with that character
//       type several quickly  focus moves to the next option whose name starts
//                             with the string typed so far
//     and the "Printable Characters" row of every example's keyboard table.
//
// The pool is a three-letter alphabet (a=1, b=2, c=3) and six options named
//   0 "aa"  1 "ab"  2 "b"  3 "ba"  4 "bc"  5 "c"
// Names are digit strings in base 4 (first char most significant, 0 is never a
// char), so a prefix test is one integer division. The type-ahead buffer is the
// same encoding plus its length. The inactivity timer is an event: type_char
// arms it, `timeout` clears the buffer.
//
// Search rule (the pattern text, made precise):
//   - empty buffer: the first option AFTER the active one that starts with the
//     typed char, wrapping; the active option itself is the last candidate, so
//     no other match means focus stays
//   - non-empty buffer: the first option from the active one (inclusive) that
//     starts with the whole buffer, wrapping — so continuing a word keeps focus
//     on an option that still matches
//   - no match: focus does not move (the buffer still grows)
//
// Request vs commit (map ticket rt1p). Type-ahead is a *focus move*, and this
// machine's controllable value is the active option: type_char and the plain
// moves (arrow_down/up, home, end) are *requests* carrying the intended active
// index. A request fires onValueChange (`requests` counts the calls) when the
// intent differs from the current active option, and the active option commits
// through `landed(holds, active, intent)`:
//   uncontrolled        accepted: focus commits the intent
//   controlled, holds   rejected: focus is untouched (the type-ahead buffer still
//                       grows, exactly as the primitive's internal buffer does)
//   controlled, accepts accepted through the controlled value (`hostWrites`)
// The controlled value is `valueProp` (the active index); `setValue` /
// `hostToggle` are the host moving focus. `control` / `acceptRequests` are
// configuration events (init is literal-only). Toggling a listbox with
// selection-follows-focus composes this focus move with the selection requests
// of listbox-single.qnt; this machine models only the focus move.
//
// The prefix invariant is scoped to the uncontrolled path: a controlled host
// owns the active option, so a rejected request may leave focus on an option
// that no longer matches the (grown) buffer.
//
// Deliberate omissions / choices (ponytail):
//   - the buffer saturates at three chars: every name has at most two, so a
//     longer buffer can never match and its exact content is unobservable; this
//     keeps the state space finite
//   - navigation keys and blur clear the buffer (the pattern is silent; the
//     example script keeps the buffer until its timeout fires)
//   - the example script never matches option 0 on a multi-char search; the
//     pattern text does not call for that quirk, so it is not modelled
//   - repeating the same char to cycle ("aaa"), case folding, non-letter chars,
//     the real 500ms duration, and IME composition
//
// Generator notes: no parameterized actions and no `let`, so a request spells
// `landed(...)` out per assignment and every action assigns every var.
module apg_listbox_typeahead {
  import aria.* from "../../shared/aria"

  var hasFocus: bool // the listbox is the focused element
  var active: int    // the active option (aria-activedescendant target)
  var buf: int       // typed chars so far, base-4 digit string
  var bufLen: int    // number of chars in the buffer (saturates at maxBuffer)
  var armed: bool    // the clear-buffer timer is running
  var matched: bool  // the last typed char focused a matching option
  var controlled: bool // the host owns the value (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (the active index)
  var requested: int   // intent of the last request (active index)
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // active index when the last request was received
  var requests: int    // number of requests that fired onValueChange

  def optionCount: int = 6
  def lastIndex: int = 5
  def noOption: int = 6
  def maxBuffer: int = 3
  // base-4 digit strings: a=1 b=2 c=3
  def nameCode(i: int): int =
    if (i == 0) 5
    else if (i == 1) 6
    else if (i == 2) 2
    else if (i == 3) 9
    else if (i == 4) 11
    else 3
  def nameLen(i: int): int = if (or(i == 2, i == 5)) 1 else 2
  def pow4(n: int): int =
    if (n == 0) 1
    else if (n == 1) 4
    else if (n == 2) 16
    else 64
  def nextIndex(i: int): int = if (i < lastIndex) i + 1 else i
  def prevIndex(i: int): int = if (i > 0) i - 1 else i

  // option i's name starts with the buffer (len chars, base-4 code)
  def startsWith(i: int, buffer: int, len: int): bool =
    and(len >= 1, len <= nameLen(i), nameCode(i) / pow4(nameLen(i) - len) == buffer)
  // the first matching option, scanning optionCount candidates from start
  // (candidates and the start rule are shared/aria.qnt: ariaCycle0, ariaTaStart0)
  def candidate(start: int, k: int): int = ariaCycle0(optionCount, start, k)
  def matchFrom(start: int, buffer: int, len: int): int =
    if (startsWith(candidate(start, 0), buffer, len)) candidate(start, 0)
    else if (startsWith(candidate(start, 1), buffer, len)) candidate(start, 1)
    else if (startsWith(candidate(start, 2), buffer, len)) candidate(start, 2)
    else if (startsWith(candidate(start, 3), buffer, len)) candidate(start, 3)
    else if (startsWith(candidate(start, 4), buffer, len)) candidate(start, 4)
    else if (startsWith(candidate(start, 5), buffer, len)) candidate(start, 5)
    else noOption
  def nextBuffer(buffer: int, len: int, ch: int): int =
    if (len < maxBuffer) buffer * 4 + ch else buffer
  def nextLength(len: int): int = if (len < maxBuffer) len + 1 else len
  // the option typing ch would focus (noOption = no match)
  def typeTarget(act: int, buffer: int, len: int, ch: int): int =
    matchFrom(
      ariaTaStart0(optionCount, act, len == 0),
      nextBuffer(buffer, len, ch),
      nextLength(len)
    )

  // --- request / commit (map ticket rt1p) ---------------------------------
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def hostWrites: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the active option after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // the intended active option of each request
  def typedIntent(ch: int): int =
    if (hasFocus) (if (typeTarget(active, buf, bufLen, ch) == noOption) active else typeTarget(active, buf, bufLen, ch)) else active
  def downIntent: int = if (hasFocus) nextIndex(active) else active
  def upIntent: int = if (hasFocus) prevIndex(active) else active
  def homeIntent: int = if (hasFocus) 0 else active
  def endIntent: int = if (hasFocus) lastIndex else active

  // --- ARIA contract, derived from the state ------------------------------
  def ariaActiveDescendant(focused: bool, idx: int): int =
    if (focused) idx else noOption

  action init = all {
    hasFocus' = false,
    active' = 0,
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // Tab into the listbox; focus returns to the remembered active option.
  action focus_in = all {
    hasFocus' = true,
    active' = active,
    buf' = buf,
    bufLen' = bufLen,
    armed' = armed,
    matched' = matched,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Tab out: the buffer is dropped.
  action blur = all {
    hasFocus' = false,
    active' = active,
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // A printable char: extend the buffer, re-arm the timer, request a focus move
  // to the search result (stay put when nothing matches).
  action type_char = {
    nondet ch = Set(1, 2, 3).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = landed(holds, active, typedIntent(ch)),
      buf' = if (hasFocus) nextBuffer(buf, bufLen, ch) else buf,
      bufLen' = if (hasFocus) nextLength(bufLen) else bufLen,
      armed' = if (hasFocus) true else armed,
      matched' = if (hasFocus) (and(typeTarget(active, buf, bufLen, ch) != noOption, not(holds))) else matched,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (hostWrites) typedIntent(ch) else valueProp,
      requested' = if (typedIntent(ch) != active) typedIntent(ch) else requested,
      outcome' = if (typedIntent(ch) != active) verdict else outcome,
      base' = if (typedIntent(ch) != active) active else base,
      requests' = if (typedIntent(ch) != active) requests + 1 else requests
    }
  }

  // The inactivity timer fires: the buffer is cleared.
  action timeout = all {
    hasFocus' = hasFocus,
    active' = active,
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Navigation keys request a focus move and drop the buffer.
  action arrow_down = all {
    hasFocus' = hasFocus,
    active' = landed(holds, active, downIntent),
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (hostWrites) downIntent else valueProp,
    requested' = if (downIntent != active) downIntent else requested,
    outcome' = if (downIntent != active) verdict else outcome,
    base' = if (downIntent != active) active else base,
    requests' = if (downIntent != active) requests + 1 else requests
  }

  action arrow_up = all {
    hasFocus' = hasFocus,
    active' = landed(holds, active, upIntent),
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (hostWrites) upIntent else valueProp,
    requested' = if (upIntent != active) upIntent else requested,
    outcome' = if (upIntent != active) verdict else outcome,
    base' = if (upIntent != active) active else base,
    requests' = if (upIntent != active) requests + 1 else requests
  }

  action home = all {
    hasFocus' = hasFocus,
    active' = landed(holds, active, homeIntent),
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (hostWrites) homeIntent else valueProp,
    requested' = if (homeIntent != active) homeIntent else requested,
    outcome' = if (homeIntent != active) verdict else outcome,
    base' = if (homeIntent != active) active else base,
    requests' = if (homeIntent != active) requests + 1 else requests
  }

  action end = all {
    hasFocus' = hasFocus,
    active' = landed(holds, active, endIntent),
    buf' = 0,
    bufLen' = 0,
    armed' = false,
    matched' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (hostWrites) endIntent else valueProp,
    requested' = if (endIntent != active) endIntent else requested,
    outcome' = if (endIntent != active) verdict else outcome,
    base' = if (endIntent != active) active else base,
    requests' = if (endIntent != active) requests + 1 else requests
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = if (controlled) v else active,
      buf' = buf,
      bufLen' = bufLen,
      armed' = armed,
      matched' = if (controlled) false else matched,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host advances its own copy of the value (an outside "next")
  action hostToggle = all {
    hasFocus' = hasFocus,
    active' = if (controlled) (if (active < lastIndex) active + 1 else 0) else active,
    buf' = buf,
    bufLen' = bufLen,
    armed' = armed,
    matched' = if (controlled) false else matched,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (active < lastIndex) active + 1 else 0) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    hasFocus' = hasFocus,
    active' = active,
    buf' = buf,
    bufLen' = bufLen,
    armed' = armed,
    matched' = matched,
    controlled' = true,
    accepting' = accepting,
    valueProp' = active,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    hasFocus' = hasFocus,
    active' = active,
    buf' = buf,
    bufLen' = bufLen,
    armed' = armed,
    matched' = matched,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus_in, blur, type_char, timeout, arrow_down, arrow_up, home, end,
    setValue, hostToggle, control, acceptRequests
  }

  // the active option is always a real option
  val ActiveInRange: bool = and(active >= 0, active <= lastIndex)
  // aria-activedescendant is set exactly while the listbox holds focus
  val ActiveDescendantTracksFocus: bool =
    (ariaActiveDescendant(hasFocus, active) == noOption) == not(hasFocus)
  // the buffer is a well-formed base-4 string of bufLen chars
  val BufferWellFormed: bool =
    and(bufLen >= 0, bufLen <= maxBuffer, buf >= 0, buf < pow4(bufLen))
  // the timer runs exactly while there is something to clear
  val TimerArmedIffBuffered: bool = armed == (bufLen > 0)
  // keys only reach a focused listbox, so only it has a buffer
  val BufferOnlyWhileFocused: bool = or(bufLen == 0, hasFocus)
  // when typing moved (or kept) focus on a match, the focused name starts with
  // the buffer (a rejected request never counts as matched)
  val MatchedImpliesPrefix: bool =
    or(not(matched), and(bufLen > 0, startsWith(active, buf, bufLen)))
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), active == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), active == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), active == requested)
}
