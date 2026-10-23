// APG combobox — the editable combobox with a listbox popup and the three
// autocomplete behaviours: aria-autocomplete none / list / both.
//
// Sources (W3C WAI-ARIA Authoring Practices Guide):
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//     - "About This Pattern" (the four forms of autocomplete), "Keyboard
//       Interaction" (Combobox + Listbox Popup), "WAI-ARIA Roles, States, and
//       Properties"
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/
//     - "Keyboard Support" (Textbox, Listbox Popup), "Role, Property, State, and
//       Tabindex Attributes" (Textbox, Listbox Popup, Button)
//
// Modelled behaviour
//   - DOM focus stays on the input (`focused`); the popup's visual focus is
//     aria-activedescendant (`active`). A popup can only be open while the input
//     has DOM focus; active != NONE implies the popup is open and the referenced
//     option is currently visible. active == NONE with the popup open means
//     visual focus is on the textbox itself.
//   - Autocomplete mode (`mode`, aria-autocomplete): 0 none = the suggestion list
//     is the same whatever is typed; 1 list = suggestions are filtered by the
//     typed text, nothing is selected automatically (manual selection);
//     2 both = like list, plus the first match is selected automatically after an
//     edit and its completion string is shown inline (`inlineCompletion`).
//   - Typing / Backspace edit the text; the popup opens iff there are
//     suggestions (and, for filtered modes, text is non-empty) and closes when
//     the filter has no match. Editing returns visual focus to the textbox
//     (active = NONE) except in "both", which re-selects the first match.
//   - ArrowDown / ArrowUp open the popup (first / last visible option) or move
//     the visual focus with wrap-around; with an auto-selected suggestion,
//     ArrowDown goes to the following one. Alt+ArrowDown opens without moving
//     focus; Alt+ArrowUp closes. Left / Right / Home / End / Delete return the
//     visual focus to the textbox without closing the popup.
//   - Enter commits the visually focused option (`picked`) and closes; without a
//     focused option it just closes. Escape closes an open popup keeping the
//     value (inline completion dropped); with the popup closed it clears the
//     textbox, except in mode none (whose APG example has no such Escape).
//     Blur / Tab close the popup; in "both" the auto-selected suggestion is
//     accepted as the value, in none / list the typed text stays.
//   - Pointer: click on the input / open button toggles the popup and keeps DOM
//     focus on the input; clicking an option commits it.
//   - Prop changes: `set_autocomplete` swaps the mode (popup closes), `set_value`
//     replaces the committed suggestion from outside (popup closes).
//   - The ARIA contract is derived: aria-autocomplete, aria-expanded,
//     aria-activedescendant (only meaningful while open), aria-selected (exactly
//     the active option).
//
// Text model: the typed text is a node of a tiny prefix trie over the corpus
//   0 Alabama, 1 Alaska, 2 Arizona, 3 Colorado, 4 Connecticut, 5 Delaware
//   (node 0 "", 1 "A", 2 "Al", 3 "Ar", 4 "C", 5 "Co", 6 "Col", 7 "D", 8 any
//   non-matching text), typed with the character pool A l r C o D Z. A committed
//   suggestion is `picked` (the textbox then shows its full name); typing after
//   a commit appends to a full name, which matches nothing (node 8).
//
// Deliberate omissions
//   - Cursor position / text selection and the standard text-editing keys
//     (Left/Right/Home/End/Delete are modelled only for their effect on visual
//     focus); the textual content of the inline completion.
//   - Autocomplete none's `Escape` on a closed popup is a no-op, as in the APG
//     example; the pattern's other optional Escape / Alt behaviours are chosen,
//     not parameterised.
//   - Grid / tree / dialog popups (see combobox-grid / -tree / -dialog), the
//     Open button's own focus (it is out of the Tab sequence, tabindex=-1),
//     asynchronous suggestions, scrolling the active option into view, hover,
//     multi-select and `aria-controls` / label wiring.
//
// Generator notes: no action preconditions (key actions guard their
// assignments with `focused`), only str/int/bool vars (int sentinels, `NONE`),
// and a single nondet per action.
module combobox_autocomplete {
  var mode: int           // aria-autocomplete: 0 none, 1 list, 2 both
  var open: bool          // popup displayed == aria-expanded
  var text: int           // typed text (prefix-trie node)
  var picked: int         // committed suggestion shown in the textbox, NONE = typed text
  var active: int         // aria-activedescendant option index, NONE = visual focus on textbox
  var focused: bool       // DOM focus is on the input
  var lastEvent: str      // name of the last event, for transition invariants
  var valueChanged: bool  // the last event changed the committed text / suggestion
  var wasOpen: bool       // the popup was open before the last event
  var controlled: bool    // the host owns the picked suggestion (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled picked suggestion
  var requested: int      // intent of the last request
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // picked when the last request was received
  var requests: int       // number of requests that fired a change callback

  // --- configuration ------------------------------------------------------
  def NONE: int = -1
  def OPTION_COUNT: int = 6

  // --- helpers ------------------------------------------------------------
  def cyc(from: int, k: int): int = (from + k) % OPTION_COUNT
  def cycBack(from: int, k: int): int = (from + OPTION_COUNT - k) % OPTION_COUNT

  // corpus prefix trie
  def matches(i: int, t: int): bool =
    if (t == 0) true
    else if (t == 1) i <= 2
    else if (t == 2) i <= 1
    else if (t == 3) i == 2
    else if (t == 4) or(i == 3, i == 4)
    else if (t == 5) or(i == 3, i == 4)
    else if (t == 6) i == 3
    else if (t == 7) i == 5
    else false
  // characters: 0 A, 1 l, 2 r, 3 C, 4 o, 5 D, 6 Z
  def typeNext(t: int, c: int): int =
    if (t == 0) (if (c == 0) 1 else if (c == 3) 4 else if (c == 5) 7 else 8)
    else if (t == 1) (if (c == 1) 2 else if (c == 2) 3 else 8)
    else if (t == 4) (if (c == 4) 5 else 8)
    else if (t == 5) (if (c == 1) 6 else 8)
    else 8
  def parentNode(t: int): int =
    if (t == 2) 1 else if (t == 3) 1 else if (t == 5) 4 else if (t == 6) 5 else 0
  def firstLetterNode(i: int): int = if (i <= 2) 1 else if (i <= 4) 4 else 7

  // visibility of an option under (mode, picked, text)
  def matchesFor(i: int, m: int, t: int): bool = if (m == 0) true else matches(i, t)
  def visFor(i: int, m: int, p: int, t: int): bool =
    if (and(p >= 0, m != 0)) i == p else matchesFor(i, m, t)
  def vis(i: int): bool = visFor(i, mode, picked, text)
  def count(m: int, p: int, t: int): int =
    (if (visFor(0, m, p, t)) 1 else 0) + (if (visFor(1, m, p, t)) 1 else 0) +
    (if (visFor(2, m, p, t)) 1 else 0) + (if (visFor(3, m, p, t)) 1 else 0) +
    (if (visFor(4, m, p, t)) 1 else 0) + (if (visFor(5, m, p, t)) 1 else 0)
  def firstFor(m: int, p: int, t: int): int =
    if (visFor(0, m, p, t)) 0 else if (visFor(1, m, p, t)) 1
    else if (visFor(2, m, p, t)) 2 else if (visFor(3, m, p, t)) 3
    else if (visFor(4, m, p, t)) 4 else if (visFor(5, m, p, t)) 5 else NONE
  def lastFor(m: int, p: int, t: int): int =
    if (visFor(5, m, p, t)) 5 else if (visFor(4, m, p, t)) 4
    else if (visFor(3, m, p, t)) 3 else if (visFor(2, m, p, t)) 2
    else if (visFor(1, m, p, t)) 1 else if (visFor(0, m, p, t)) 0 else NONE
  def visCount: int = count(mode, picked, text)
  def firstVis: int = firstFor(mode, picked, text)
  def lastVis: int = lastFor(mode, picked, text)
  def nextVis(from: int): int =
    if (vis(cyc(from, 1))) cyc(from, 1) else if (vis(cyc(from, 2))) cyc(from, 2)
    else if (vis(cyc(from, 3))) cyc(from, 3) else if (vis(cyc(from, 4))) cyc(from, 4)
    else if (vis(cyc(from, 5))) cyc(from, 5) else if (vis(cyc(from, 6))) cyc(from, 6)
    else NONE
  def prevVis(from: int): int =
    if (vis(cycBack(from, 1))) cycBack(from, 1) else if (vis(cycBack(from, 2))) cycBack(from, 2)
    else if (vis(cycBack(from, 3))) cycBack(from, 3) else if (vis(cycBack(from, 4))) cycBack(from, 4)
    else if (vis(cycBack(from, 5))) cycBack(from, 5) else if (vis(cycBack(from, 6))) cycBack(from, 6)
    else NONE

  // after an edit the textbox holds typed text (picked == NONE)
  def editBase: int = if (picked >= 0) 8 else text
  def typedText(c: int): int = typeNext(editBase, c)
  def backText: int = if (picked >= 0) firstLetterNode(picked) else parentNode(text)
  def edits: bool = or(text != 0, picked >= 0)
  def editOpen(m: int, t: int): bool =
    and(count(m, NONE, t) > 0, or(m == 0, t != 0))
  // list / none return visual focus to the textbox; both re-selects the first match
  def editActive(m: int, t: int): int =
    if (and(editOpen(m, t), m == 2)) firstFor(m, NONE, t) else NONE

  def canOpen: bool = visCount > 0
  def downActive: int =
    if (open) (if (active >= 0) nextVis(active) else firstVis)
    else (if (canOpen) firstVis else NONE)
  def upActive: int =
    if (open) (if (active >= 0) prevVis(active) else lastVis)
    else (if (canOpen) lastVis else NONE)
  // Enter accepts the visually focused option
  def accepts: bool = and(focused, active >= 0)
  // leaving the input accepts the auto-selected suggestion in mode both only
  def blurAccepts: bool = and(mode == 2, active >= 0)
  def escapeClears: bool = and(and(focused, not(open)), and(mode != 0, edits))

  // --- derived ARIA attribute contract -----------------------------------
  def ariaAutocomplete: str = if (mode == 0) "none" else if (mode == 1) "list" else "both"
  def ariaExpanded: bool = open
  def ariaActivedescendant: int = if (open) active else NONE
  def ariaSelected(i: int): bool = and(open, i == active)
  def inlineCompletion: bool = and(mode == 2, active >= 0)
  def selectedCount: int =
    (if (ariaSelected(0)) 1 else 0) + (if (ariaSelected(1)) 1 else 0) +
    (if (ariaSelected(2)) 1 else 0) + (if (ariaSelected(3)) 1 else 0) +
    (if (ariaSelected(4)) 1 else 0) + (if (ariaSelected(5)) 1 else 0)
  def isEdit(e: str): bool = or(e == "type_char", e == "backspace")
  def isNavigation(e: str): bool =
    or(e == "arrow_down", e == "arrow_up", e == "alt_arrow_down", e == "alt_arrow_up",
       e == "arrow_left", e == "arrow_right", e == "home", e == "end", e == "delete")
  def mayChangeValue(e: str): bool =
    or(e == "enter", e == "tab", e == "blur", e == "click_option", e == "set_value",
       e == "type_char", e == "backspace", e == "escape")

  // --- request / commit (map ticket rt1p) --------------------------------
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landedInt(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  action init = all {
    mode' = 1,
    open' = false,
    text' = 0,
    picked' = NONE,
    active' = NONE,
    focused' = false,
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

  // --- focus / blur --------------------------------------------------------
  action focus = all {
    focused' = true,
    lastEvent' = "focus",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    active' = active
  }

  // focus leaves the input by pointer
  action blur = all {
    open' = false,
    active' = NONE,
    picked' = landedInt(holds, picked, if (blurAccepts) active else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (blurAccepts) active else picked),
    requested' = if ((if (blurAccepts) active else picked) != picked) if (blurAccepts) active else picked else requested,
    outcome' = if ((if (blurAccepts) active else picked) != picked) verdict else outcome,
    base' = if ((if (blurAccepts) active else picked) != picked) picked else base,
    requests' = if ((if (blurAccepts) active else picked) != picked) requests + 1 else requests,
    focused' = false,
    lastEvent' = "blur",
    valueChanged' = and(blurAccepts, picked != active),
    wasOpen' = open,
    mode' = mode,
    text' = text
  }

  // Tab: same as blur; the popup is out of the Tab sequence
  action tab = all {
    open' = if (focused) false else open,
    active' = if (focused) NONE else active,
    picked' = landedInt(holds, picked, if (and(focused, blurAccepts)) active else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (and(focused, blurAccepts)) active else picked),
    requested' = if ((if (and(focused, blurAccepts)) active else picked) != picked) if (and(focused, blurAccepts)) active else picked else requested,
    outcome' = if ((if (and(focused, blurAccepts)) active else picked) != picked) verdict else outcome,
    base' = if ((if (and(focused, blurAccepts)) active else picked) != picked) picked else base,
    requests' = if ((if (and(focused, blurAccepts)) active else picked) != picked) requests + 1 else requests,
    focused' = false,
    lastEvent' = "tab",
    valueChanged' = and(and(focused, blurAccepts), picked != active),
    wasOpen' = open,
    mode' = mode,
    text' = text
  }

  // --- text editing ---------------------------------------------------------
  action type_char = {
    nondet ch = Set(0, 1, 2, 3, 4, 5, 6).oneOf()
    all {
      text' = if (focused) typedText(ch) else text,
      picked' = landedInt(holds, picked, if (focused) NONE else picked),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (focused) NONE else picked),
      requested' = if ((if (focused) NONE else picked) != picked) if (focused) NONE else picked else requested,
      outcome' = if ((if (focused) NONE else picked) != picked) verdict else outcome,
      base' = if ((if (focused) NONE else picked) != picked) picked else base,
      requests' = if ((if (focused) NONE else picked) != picked) requests + 1 else requests,
      open' = if (focused) editOpen(mode, typedText(ch)) else open,
      active' = if (focused) editActive(mode, typedText(ch)) else active,
      lastEvent' = "type_char",
      valueChanged' = and(focused, or(typedText(ch) != text, picked >= 0)),
      wasOpen' = open,
      mode' = mode,
      focused' = focused
    }
  }

  // with nothing to delete only the visual focus returns to the textbox
  action backspace = all {
    text' = if (and(focused, edits)) backText else text,
    picked' = landedInt(holds, picked, if (focused) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (focused) NONE else picked),
    requested' = if ((if (focused) NONE else picked) != picked) if (focused) NONE else picked else requested,
    outcome' = if ((if (focused) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (focused) NONE else picked) != picked) picked else base,
    requests' = if ((if (focused) NONE else picked) != picked) requests + 1 else requests,
    open' = if (and(focused, edits)) editOpen(mode, backText) else open,
    active' = if (focused) (if (edits) editActive(mode, backText) else NONE) else active,
    lastEvent' = "backspace",
    valueChanged' = and(and(focused, edits), or(backText != text, picked >= 0)),
    wasOpen' = open,
    mode' = mode,
    focused' = focused
  }

  // Delete drops the selected suggestion / inline completion; the popup stays
  action delete = all {
    active' = if (focused) NONE else active,
    lastEvent' = "delete",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  // --- navigation keys --------------------------------------------------------
  action arrow_down = all {
    open' = if (focused) or(open, canOpen) else open,
    active' = if (focused) downActive else active,
    lastEvent' = "arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  action arrow_up = all {
    open' = if (focused) or(open, canOpen) else open,
    active' = if (focused) upActive else active,
    lastEvent' = "arrow_up",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  // opens without moving the visual focus
  action alt_arrow_down = all {
    open' = if (focused) or(open, canOpen) else open,
    lastEvent' = "alt_arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    active' = active,
    focused' = focused
  }

  // closes the popup; visual focus returns to the textbox
  action alt_arrow_up = all {
    open' = if (focused) false else open,
    active' = if (focused) NONE else active,
    lastEvent' = "alt_arrow_up",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  // Left / Right / Home / End: visual focus back to the textbox, popup stays open
  action arrow_left = all {
    active' = if (focused) NONE else active,
    lastEvent' = "arrow_left",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  action arrow_right = all {
    active' = if (focused) NONE else active,
    lastEvent' = "arrow_right",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  action home = all {
    active' = if (focused) NONE else active,
    lastEvent' = "home",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  action end = all {
    active' = if (focused) NONE else active,
    lastEvent' = "end",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    open' = open,
    text' = text,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    focused' = focused
  }

  // --- commit / dismiss ---------------------------------------------------
  // accepts the focused option and closes; without one it only closes
  action enter = all {
    open' = if (focused) false else open,
    picked' = landedInt(holds, picked, if (accepts) active else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (accepts) active else picked),
    requested' = if ((if (accepts) active else picked) != picked) if (accepts) active else picked else requested,
    outcome' = if ((if (accepts) active else picked) != picked) verdict else outcome,
    base' = if ((if (accepts) active else picked) != picked) picked else base,
    requests' = if ((if (accepts) active else picked) != picked) requests + 1 else requests,
    active' = if (focused) NONE else active,
    lastEvent' = "enter",
    valueChanged' = and(accepts, picked != active),
    wasOpen' = open,
    mode' = mode,
    text' = text,
    focused' = focused
  }

  // open: close, keep the value; closed: clear the textbox (not in mode none)
  action escape = all {
    open' = if (focused) false else open,
    active' = if (focused) NONE else active,
    text' = if (escapeClears) 0 else text,
    picked' = landedInt(holds, picked, if (escapeClears) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (escapeClears) NONE else picked),
    requested' = if ((if (escapeClears) NONE else picked) != picked) if (escapeClears) NONE else picked else requested,
    outcome' = if ((if (escapeClears) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (escapeClears) NONE else picked) != picked) picked else base,
    requests' = if ((if (escapeClears) NONE else picked) != picked) requests + 1 else requests,
    lastEvent' = "escape",
    valueChanged' = escapeClears,
    wasOpen' = open,
    mode' = mode,
    focused' = focused
  }

  // --- pointer -------------------------------------------------------------
  // click on the input toggles the popup; DOM focus stays on the input
  action click_input = all {
    focused' = true,
    open' = if (open) false else canOpen,
    active' = NONE,
    lastEvent' = "click_input",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = picked,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // the Open button (tabindex -1) toggles the popup and focuses the input
  action click_button = all {
    focused' = true,
    open' = if (open) false else canOpen,
    active' = NONE,
    lastEvent' = "click_button",
    valueChanged' = false,
    wasOpen' = open,
    mode' = mode,
    text' = text,
    picked' = picked,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // clicking a visible option of the open popup commits it
  action click_option = {
    nondet i = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      picked' = landedInt(holds, picked, if (and(open, vis(i))) i else picked),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (and(open, vis(i))) i else picked),
      requested' = if ((if (and(open, vis(i))) i else picked) != picked) if (and(open, vis(i))) i else picked else requested,
      outcome' = if ((if (and(open, vis(i))) i else picked) != picked) verdict else outcome,
      base' = if ((if (and(open, vis(i))) i else picked) != picked) picked else base,
      requests' = if ((if (and(open, vis(i))) i else picked) != picked) requests + 1 else requests,
      open' = if (and(open, vis(i))) false else open,
      active' = if (and(open, vis(i))) NONE else active,
      focused' = if (and(open, vis(i))) true else focused,
      lastEvent' = "click_option",
      valueChanged' = and(and(open, vis(i)), picked != i),
      wasOpen' = open,
      mode' = mode,
      text' = text
    }
  }

  // --- prop changes ---------------------------------------------------------
  // aria-autocomplete prop swapped: the popup closes, the value is kept
  action set_autocomplete = {
    nondet m = Set(0, 1, 2).oneOf()
    all {
      mode' = m,
      open' = false,
      active' = NONE,
      lastEvent' = "set_autocomplete",
      valueChanged' = false,
      wasOpen' = open,
      text' = text,
      picked' = landedInt(holds, picked, picked),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, picked),
      requested' = if ((picked) != picked) picked else requested,
      outcome' = if ((picked) != picked) verdict else outcome,
      base' = if ((picked) != picked) picked else base,
      requests' = if ((picked) != picked) requests + 1 else requests,
      focused' = focused
    }
  }

  // the committed suggestion is replaced from outside: the popup closes
  action set_value = {
    nondet i = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      picked' = i,
      open' = false,
      active' = NONE,
      lastEvent' = "set_value",
      valueChanged' = picked != i,
      wasOpen' = open,
      mode' = mode,
      text' = text,
      focused' = focused,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) i else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the picked suggestion
  action hostToggle = all {
    mode' = mode,
    open' = open,
    text' = text,
    picked' = if (controlled) (if (picked >= 0) NONE else 0) else picked,
    active' = NONE,
    focused' = focused,
    lastEvent' = "hostToggle",
    valueChanged' = false,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (picked >= 0) NONE else 0) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the picked suggestion, adopting it
  action control = all {
    mode' = mode,
    open' = open,
    text' = text,
    picked' = picked,
    active' = active,
    focused' = focused,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    wasOpen' = open,
    controlled' = true,
    accepting' = accepting,
    valueProp' = picked,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    mode' = mode,
    open' = open,
    text' = text,
    picked' = picked,
    active' = active,
    focused' = focused,
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
    init, focus, blur, tab, type_char, backspace, delete, arrow_down, arrow_up,
    alt_arrow_down, alt_arrow_up, arrow_left, arrow_right, home, end, enter,
    escape, click_input, click_button, click_option, set_autocomplete, set_value,
    hostToggle, control, acceptRequests
  }

  // --- invariants (APG guarantees) ----------------------------------------
  // aria-activedescendant refers to a currently visible option of an open popup
  // (a controlled host may reject an edit, so the committed picked suggestion
  // can lag the text the visual focus was computed from)
  val ActiveDescendantRefersToVisibleOption: bool =
    or(controlled, or(active == NONE, and(open, vis(active))))
  // an open popup is never empty
  val OpenPopupHasSuggestions: bool = or(controlled, or(not(open), visCount > 0))
  // DOM focus stays on the combobox while its popup is open
  val DomFocusStaysOnCombobox: bool = or(not(open), focused)
  // rendered attributes agree with the state; the inline completion is only
  // ever exposed under aria-autocomplete="both"
  val AriaContractConsistent: bool = and(
    ariaActivedescendant == active,
    selectedCount == (if (active >= 0) 1 else 0),
    or(not(inlineCompletion), ariaAutocomplete == "both")
  )
  // editing returns visual focus to the textbox (none / list never select
  // automatically) ...
  val EditingReturnsVisualFocusToTextbox: bool =
    or(not(isEdit(lastEvent)), mode == 2, active == NONE)
  // ... except that mode "both" selects the first match automatically
  val BothModeAutoSelectsFirstMatchOnEdit: bool =
    or(controlled, or(not(isEdit(lastEvent)), mode != 2, active == NONE, active == firstVis))
  // Escape on an open popup never changes the value
  val EscapeOnOpenPopupKeepsValue: bool =
    or(not(lastEvent == "escape"), not(wasOpen), not(valueChanged))
  // navigating never changes the committed value
  val NavigationKeepsValue: bool = or(not(isNavigation(lastEvent)), not(valueChanged))
  // the value changes only on commit / edit / dismiss / prop events
  val ValueChangesOnlyOnCommitOrEdit: bool = or(not(valueChanged), mayChangeValue(lastEvent))
  // losing focus closes the popup
  val FocusLossClosesPopup: bool =
    or(not(or(lastEvent == "blur", lastEvent == "tab")), and(not(open), not(focused)))
  val StateInRange: bool = and(
    mode >= 0, mode <= 2, text >= 0, text <= 8,
    picked >= NONE, picked < OPTION_COUNT, active >= NONE, active < OPTION_COUNT
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the picked suggestion, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), picked == valueProp)
  // a rejected request leaves the picked suggestion as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), picked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), picked == requested)
}
