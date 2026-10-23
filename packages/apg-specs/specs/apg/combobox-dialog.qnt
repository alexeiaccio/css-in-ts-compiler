// APG combobox — the date picker combobox: an editable date input whose popup is
// a modal dialog containing a calendar grid (aria-haspopup="dialog").
//
// Sources (W3C WAI-ARIA Authoring Practices Guide):
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//     - "Keyboard Interaction" (Dialog Popup Keyboard Interaction and its note:
//       "dialogs do not support aria-activedescendant so DOM focus moves into
//       the dialog from the combobox"), "WAI-ARIA Roles, States, and Properties"
//       (aria-haspopup="dialog", aria-expanded)
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/
//     - "Keyboard Support" (Combobox, Date Picker Dialog, Calendar Buttons,
//       Date Grid, OK and Cancel Buttons), "Role, Property, State, and Tabindex
//       Attributes" (aria-autocomplete="none", aria-modal, roving tabindex,
//       aria-selected on the cell of the current value)
//
// Modelled behaviour
//   - Unlike list / grid / tree popups, DOM focus MOVES into the dialog
//     (`domFocus`): while the dialog is open focus is on one of its seven tab
//     stops (Previous Year, Previous Month, Next Month, Next Year, the calendar
//     grid's single roving cell, Cancel, OK) and never on the combobox; while it
//     is closed focus is on the combobox or outside. aria-activedescendant is
//     never set.
//   - Down / Alt+Down on the combobox open the dialog and focus the grid on the
//     combobox's date if it holds a valid one, otherwise on today.
//   - Tab / Shift+Tab cycle through the dialog tab stops and wrap around (focus
//     trap); in the combobox they leave it.
//   - Date grid: Up / Down +-1 week, Left / Right +-1 day (crossing months),
//     Home / End first / last day of the week, PageUp / PageDown +-1 month and
//     Shift+PageUp / Shift+PageDown +-1 year keeping the day number or, if that
//     day does not exist, the last day of the month. Space updates the combobox
//     value (dialog stays open); Enter updates it and closes the dialog.
//   - The calendar buttons change the displayed month / year (same clamping as
//     the Page keys). Cancel and Escape close the dialog, return DOM focus to the
//     combobox and never change the value; OK closes and returns focus too.
//   - Typing in the combobox replaces its text (valid date or not); the Choose
//     Date button (pointer) opens the dialog; `set_value` is the prop change.
//
// Calendar model: dates are absolute day numbers 0..266 over nine months of
// three "years" (31, 28, 30 days each), day 0 = weekday 0; `TODAY` = day 15 of
// month 4. The displayed month is the month containing the grid's focused date,
// so the Page keys, buttons and week keys all reduce to integer arithmetic.
//
// Deliberate omissions
//   - Real calendar arithmetic (leap years, 31-day months, locales, week start),
//     the date text format / aria-describedby, aria-live announcements, the
//     keyboard-help panel, min / max dates.
//   - OK vs Cancel staging: the example's table updates the value on Space /
//     Enter of a day, so OK and Cancel differ only by wording here (neither
//     changes `value` itself).
//   - Pointer selection of a day, clicking the dialog backdrop, and the combobox
//     input's own click behaviour.
//
// Generator notes: no action preconditions (key actions guard their assignments
// with `atCombo` / `inDialog` / `inGrid`), only str/int/bool vars, a single
// nondet per action.
module combobox_dialog {
  var open: bool          // dialog displayed == aria-expanded
  var domFocus: int       // 0 outside, 1 combobox, 2 prev year, 3 prev month, 4 next month, 5 next year, 6 grid, 7 cancel, 8 ok
  var focusAbs: int       // the grid's roving-tabindex date (absolute day number)
  var value: int          // combobox value: date, NONE = no valid date
  var lastEvent: str      // name of the last event, for transition invariants
  var valueChanged: bool  // the last event changed `value`
  var wasOpen: bool       // the dialog was open before the last event
  var controlled: bool    // the host owns the date value (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled date value
  var requested: int      // intent of the last request
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // value when the last request was received
  var requests: int       // number of requests that fired a change callback

  // --- configuration ------------------------------------------------------
  def NONE: int = -1
  def LAST: int = 266
  def TODAY: int = 134
  def INVALID_TEXT: int = 999

  // --- calendar -------------------------------------------------------------
  def minI(a: int, b: int): int = if (a < b) a else b
  def mstart(k: int): int =
    if (k == 0) 0 else if (k == 1) 31 else if (k == 2) 59 else if (k == 3) 89
    else if (k == 4) 120 else if (k == 5) 148 else if (k == 6) 178
    else if (k == 7) 209 else if (k == 8) 237 else 267
  def monthOf(a: int): int =
    if (a < 31) 0 else if (a < 59) 1 else if (a < 89) 2 else if (a < 120) 3
    else if (a < 148) 4 else if (a < 178) 5 else if (a < 209) 6
    else if (a < 237) 7 else 8
  def mlen(k: int): int = mstart(k + 1) - mstart(k)
  def dayOf(a: int): int = a - mstart(monthOf(a))
  // +-d months keeping the day number, or the month's last day; the ends of
  // the calendar do not move
  def shiftMonths(a: int, d: int): int =
    if (or(monthOf(a) + d < 0, monthOf(a) + d > 8)) a
    else mstart(monthOf(a) + d) + minI(dayOf(a), mlen(monthOf(a) + d) - 1)
  def weekStart(a: int): int = a - a % 7
  def weekEnd(a: int): int = minI(weekStart(a) + 6, LAST)

  // --- where DOM focus is ---------------------------------------------------
  def atCombo: bool = and(not(open), domFocus == 1)
  def inDialog: bool = and(open, domFocus >= 2)
  def inGrid: bool = and(open, domFocus == 6)
  def onMonthButton: bool = and(open, domFocus >= 2, domFocus <= 5)
  def onCancelOrOk: bool = and(open, domFocus >= 7)
  def nextStop(f: int): int = if (f == 8) 2 else f + 1
  def prevStop(f: int): int = if (f == 2) 8 else f - 1
  // Previous Year, Previous Month, Next Month, Next Year
  def buttonDelta: int = if (domFocus == 2) 0 - 3 else if (domFocus == 3) 0 - 1 else if (domFocus == 4) 1 else 3
  // the grid opens on the combobox's date, or today
  def openTarget: int = if (value >= 0) value else TODAY
  def buttonTarget: int = shiftMonths(focusAbs, buttonDelta)
  def closesOnEnter: bool = or(inGrid, onCancelOrOk)

  // --- derived ARIA attribute contract -----------------------------------
  def ariaHasPopup: str = "dialog"
  def ariaAutocomplete: str = "none"
  def ariaExpanded: bool = open
  // dialogs do not use aria-activedescendant: DOM focus moves instead
  def ariaActivedescendant: int = NONE
  def ariaModal: bool = open
  def isNavigation(e: str): bool =
    or(e == "arrow_down", e == "arrow_up", e == "arrow_left", e == "arrow_right",
       e == "home", e == "end", e == "page_up", e == "page_down",
       e == "shift_page_up", e == "shift_page_down", e == "tab", e == "shift_tab")
  def opensDialog(e: str): bool =
    or(e == "arrow_down", e == "alt_arrow_down", e == "click_button")
  def mayChangeValue(e: str): bool =
    or(e == "enter", e == "space", e == "type_text", e == "set_value")

  // --- request / commit (map ticket rt1p) --------------------------------
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landedInt(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  action init = all {
    open' = false,
    domFocus' = 0,
    focusAbs' = TODAY,
    value' = NONE,
    lastEvent' = "init",
    valueChanged' = false,
    wasOpen' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = NONE,
    requested' = NONE,
    outcome' = "none",
    base' = NONE,
    requests' = 0
  }

  // --- focus ------------------------------------------------------------------
  action focus = all {
    domFocus' = if (domFocus == 0) 1 else domFocus,
    lastEvent' = "focus",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focusAbs' = focusAbs,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action blur = all {
    domFocus' = if (atCombo) 0 else domFocus,
    lastEvent' = "blur",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focusAbs' = focusAbs,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // Tab: leaves the combobox; inside the dialog it cycles the tab stops
  action tab = all {
    domFocus' = if (atCombo) 0 else if (inDialog) nextStop(domFocus) else domFocus,
    lastEvent' = "tab",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focusAbs' = focusAbs,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action shift_tab = all {
    domFocus' = if (atCombo) 0 else if (inDialog) prevStop(domFocus) else domFocus,
    lastEvent' = "shift_tab",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focusAbs' = focusAbs,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // --- open ---------------------------------------------------------------------
  // ArrowDown on the combobox opens the dialog; in the grid it moves a week
  action arrow_down = all {
    open' = if (atCombo) true else open,
    domFocus' = if (atCombo) 6 else domFocus,
    focusAbs' = if (atCombo) openTarget else if (and(inGrid, focusAbs + 7 <= LAST)) focusAbs + 7 else focusAbs,
    lastEvent' = "arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action alt_arrow_down = all {
    open' = if (atCombo) true else open,
    domFocus' = if (atCombo) 6 else domFocus,
    focusAbs' = if (atCombo) openTarget else focusAbs,
    lastEvent' = "alt_arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // the Choose Date button (tabindex -1) opens the dialog by pointer
  action click_button = all {
    open' = true,
    domFocus' = if (open) domFocus else 6,
    focusAbs' = if (open) focusAbs else openTarget,
    lastEvent' = "click_button",
    valueChanged' = false,
    wasOpen' = open,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // --- date grid navigation ---------------------------------------------------
  action arrow_up = all {
    focusAbs' = if (and(inGrid, focusAbs >= 7)) focusAbs - 7 else focusAbs,
    lastEvent' = "arrow_up",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action arrow_right = all {
    focusAbs' = if (and(inGrid, focusAbs < LAST)) focusAbs + 1 else focusAbs,
    lastEvent' = "arrow_right",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action arrow_left = all {
    focusAbs' = if (and(inGrid, focusAbs > 0)) focusAbs - 1 else focusAbs,
    lastEvent' = "arrow_left",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action home = all {
    focusAbs' = if (inGrid) weekStart(focusAbs) else focusAbs,
    lastEvent' = "home",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action end = all {
    focusAbs' = if (inGrid) weekEnd(focusAbs) else focusAbs,
    lastEvent' = "end",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action page_up = all {
    focusAbs' = if (inGrid) shiftMonths(focusAbs, 0 - 1) else focusAbs,
    lastEvent' = "page_up",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action page_down = all {
    focusAbs' = if (inGrid) shiftMonths(focusAbs, 1) else focusAbs,
    lastEvent' = "page_down",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action shift_page_up = all {
    focusAbs' = if (inGrid) shiftMonths(focusAbs, 0 - 3) else focusAbs,
    lastEvent' = "shift_page_up",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  action shift_page_down = all {
    focusAbs' = if (inGrid) shiftMonths(focusAbs, 3) else focusAbs,
    lastEvent' = "shift_page_down",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    domFocus' = domFocus,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // --- activation -----------------------------------------------------------------
  // grid: select + close; month / year buttons: change the view; Cancel / OK: close
  action enter = all {
    open' = if (closesOnEnter) false else open,
    domFocus' = if (closesOnEnter) 1 else domFocus,
    focusAbs' = if (onMonthButton) buttonTarget else focusAbs,
    value' = landedInt(holds, value, if (inGrid) focusAbs else value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (inGrid) focusAbs else value),
    requested' = if ((if (inGrid) focusAbs else value) != value) if (inGrid) focusAbs else value else requested,
    outcome' = if ((if (inGrid) focusAbs else value) != value) verdict else outcome,
    base' = if ((if (inGrid) focusAbs else value) != value) value else base,
    requests' = if ((if (inGrid) focusAbs else value) != value) requests + 1 else requests,
    lastEvent' = "enter",
    valueChanged' = and(inGrid, value != focusAbs),
    wasOpen' = open
  }

  // grid: select (the dialog stays open); buttons as for Enter
  action space = all {
    open' = if (onCancelOrOk) false else open,
    domFocus' = if (onCancelOrOk) 1 else domFocus,
    focusAbs' = if (onMonthButton) buttonTarget else focusAbs,
    value' = landedInt(holds, value, if (inGrid) focusAbs else value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (inGrid) focusAbs else value),
    requested' = if ((if (inGrid) focusAbs else value) != value) if (inGrid) focusAbs else value else requested,
    outcome' = if ((if (inGrid) focusAbs else value) != value) verdict else outcome,
    base' = if ((if (inGrid) focusAbs else value) != value) value else base,
    requests' = if ((if (inGrid) focusAbs else value) != value) requests + 1 else requests,
    lastEvent' = "space",
    valueChanged' = and(inGrid, value != focusAbs),
    wasOpen' = open
  }

  // Escape: close the dialog, focus back on the combobox, value untouched
  action escape = all {
    open' = if (inDialog) false else open,
    domFocus' = if (inDialog) 1 else domFocus,
    lastEvent' = "escape",
    valueChanged' = false,
    wasOpen' = open,
    focusAbs' = focusAbs,
    value' = landedInt(holds, value, value),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, value),
    requested' = if ((value) != value) value else requested,
    outcome' = if ((value) != value) verdict else outcome,
    base' = if ((value) != value) value else base,
    requests' = if ((value) != value) requests + 1 else requests,
  }

  // --- text input / props -----------------------------------------------------
  // typing replaces the combobox text: a valid date or not
  action type_text = {
    nondet k = Set(0, 59, 134, 999).oneOf()
    all {
      value' = landedInt(holds, value, if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value),
      requested' = if ((if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value) != value) if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value else requested,
      outcome' = if ((if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value) != value) verdict else outcome,
      base' = if ((if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value) != value) value else base,
      requests' = if ((if (atCombo) (if (k == INVALID_TEXT) NONE else k) else value) != value) requests + 1 else requests,
      lastEvent' = "type_text",
      valueChanged' = and(atCombo, value != (if (k == INVALID_TEXT) NONE else k)),
      wasOpen' = open,
      open' = open,
      domFocus' = domFocus,
      focusAbs' = focusAbs
    }
  }

  // the value is replaced from outside; an open dialog is left as it is
  action set_value = {
    nondet k = Set(0, 59, 134, 266).oneOf()
    all {
      value' = k,
      lastEvent' = "set_value",
      valueChanged' = value != k,
      wasOpen' = open,
      open' = open,
      domFocus' = domFocus,
      focusAbs' = focusAbs,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) k else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the date value
  action hostToggle = all {
    open' = open,
    domFocus' = domFocus,
    focusAbs' = focusAbs,
    value' = if (controlled) (if (value >= 0) NONE else TODAY) else value,
    lastEvent' = "hostToggle",
    valueChanged' = false,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (value >= 0) NONE else TODAY) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the date value, adopting it
  action control = all {
    open' = open,
    domFocus' = domFocus,
    focusAbs' = focusAbs,
    value' = value,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    wasOpen' = open,
    controlled' = true,
    accepting' = accepting,
    valueProp' = value,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    open' = open,
    domFocus' = domFocus,
    focusAbs' = focusAbs,
    value' = value,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus, blur, tab, shift_tab, arrow_down, alt_arrow_down, click_button,
    arrow_up, arrow_right, arrow_left, home, end, page_up, page_down,
    shift_page_up, shift_page_down, enter, space, escape, type_text, set_value,
    hostToggle, control, acceptRequests
  }

  // --- invariants (APG guarantees) ----------------------------------------
  // DOM focus moves INTO an open dialog (one of its seven tab stops) ...
  val DomFocusInsideDialogWhenOpen: bool = or(not(open), and(domFocus >= 2, domFocus <= 8))
  // ... and is on the combobox (or outside) whenever it is closed
  val DomFocusOutsideDialogWhenClosed: bool = or(open, domFocus <= 1)
  // the dialog popup never uses aria-activedescendant; haspopup / autocomplete /
  // modal attributes follow the state
  val AriaContractConsistent: bool = and(
    ariaHasPopup == "dialog",
    ariaAutocomplete == "none",
    ariaExpanded == open,
    ariaActivedescendant == NONE,
    ariaModal == open
  )
  val DatesInRange: bool = and(
    focusAbs >= 0, focusAbs <= LAST, value >= NONE, value <= LAST
  )
  // Escape never changes the value and returns DOM focus to the combobox
  val EscapeKeepsValue: bool = or(not(lastEvent == "escape"), not(valueChanged))
  val EscapeReturnsFocusToCombobox: bool =
    or(not(lastEvent == "escape"), not(wasOpen), and(not(open), domFocus == 1))
  // moving through the dialog never changes the value
  val NavigationKeepsValue: bool = or(not(isNavigation(lastEvent)), not(valueChanged))
  val ValueChangesOnlyOnCommitOrEdit: bool = or(not(valueChanged), mayChangeValue(lastEvent))
  // a freshly opened dialog starts on the combobox's date, or today
  val OpensOnValueOrToday: bool =
    or(not(opensDialog(lastEvent)), not(open), wasOpen, focusAbs == openTarget)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the date, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), value == valueProp)
  // a rejected request leaves the date value as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), value == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), value == requested)
}
