// APG combobox — the editable combobox with a tree popup (aria-haspopup="tree").
//
// Sources (W3C WAI-ARIA Authoring Practices Guide):
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//     - "Keyboard Interaction" (Combobox + Tree Popup Keyboard Interaction and
//       its note on parent nodes that are category labels), "WAI-ARIA Roles,
//       States, and Properties" (aria-haspopup, aria-activedescendant,
//       aria-selected on treeitem)
//   https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ (popup roles / states
//     are defined there; only the combobox-relevant subset is modelled)
//
// Modelled behaviour
//   - DOM focus stays on the input; the visually focused tree node is exposed
//     through aria-activedescendant (`active`, NONE = visual focus on the
//     textbox). A node can only be focused while the popup is open and the node
//     is currently visible (all its ancestors expanded).
//   - Tree: 0 Fruits (parent) {1 Apple, 2 Banana}, 3 Vegetables (parent)
//     {4 Carrot, 5 Dill}, 6 Water (root leaf); parents 0 and 3 expand with
//     Right / collapse with Left (`e0`, `e3`).
//   - Variants of the "selection" note (`labelMode`, prop `set_label_mode`):
//       0 every node, parents included, is a selectable value, so selection
//         follows focus everywhere;
//       1 parents are category labels; focusing one leaves the previously
//         selected node selected ("sticky");
//       2 parents are category labels; focusing one leaves nothing selected.
//     Focus is distinct from selection: `active` vs `selected` (aria-selected).
//   - Down / Up move to the next / previous visible node without opening or
//     closing nodes (no wrap); on a closed popup they open it on the first /
//     last visible node. Right: closed parent -> expand (focus and selection do
//     not move), open parent -> first child, leaf -> nothing. Left: open parent
//     -> collapse, child that is a leaf / closed -> its parent, root -> nothing.
//     Home / End focus the first / last visible node. Left / Right only act on
//     tree nodes while one is focused.
//   - Enter accepts the *selected* node (so a focused non-selectable parent in
//     labelMode 2 accepts nothing) and closes; Escape closes an open popup keeping
//     the value and clears the textbox when already closed; typing returns the
//     visual focus to the textbox without closing the popup; blur / Tab close
//     the popup committing nothing.
//   - Pointer: click on the input toggles the popup; clicking a selectable node
//     commits it, clicking a category label toggles it and focuses it.
//   - Prop changes: `set_label_mode`, `set_value` (non-selectable values ignored).
//
// Deliberate omissions
//   - Typed text and filtering (see combobox-autocomplete), horizontal
//     orientation (Down/Right swap), more than two tree levels, typeahead for
//     non-editable trees, aria-level / aria-setsize / aria-posinset, scrolling.
//   - Programmatic expand/collapse of nodes by props and `*` (expand all).
//
// Generator notes: no action preconditions (key actions guard their assignments
// with `focused` / `open`), only str/int/bool vars, a single nondet per action.
module combobox_tree {
  var open: bool          // tree popup displayed == aria-expanded
  var active: int         // aria-activedescendant node, NONE = textbox
  var selected: int       // node with aria-selected=true, NONE = none
  var e0: bool            // node 0 (Fruits) expanded
  var e3: bool            // node 3 (Vegetables) expanded
  var focused: bool       // DOM focus is on the input
  var labelMode: int        // 0 all selectable, 1 labels + sticky selection, 2 labels + cleared selection
  var picked: int         // committed node, NONE = none
  var lastEvent: str      // name of the last event, for transition invariants
  var valueChanged: bool  // the last event changed the committed value
  var wasOpen: bool       // the popup was open before the last event
  var controlled: bool    // the host owns the picked node (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled picked node
  var requested: int      // intent of the last request
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // picked when the last request was received
  var requests: int       // number of requests that fired a change callback

  // --- configuration ------------------------------------------------------
  def NONE: int = -1
  def NODES: int = 7

  // --- tree structure -------------------------------------------------------
  def isParent(n: int): bool = or(n == 0, n == 3)
  def selectable(v: int, n: int): bool = or(v == 0, not(isParent(n)))
  def parentOf(n: int): int =
    if (or(n == 1, n == 2)) 0 else if (or(n == 4, n == 5)) 3 else NONE
  def firstChild(n: int): int = if (n == 0) 1 else if (n == 3) 4 else NONE
  def expandedNode(n: int): bool = if (n == 0) e0 else if (n == 3) e3 else false
  def vis(n: int): bool =
    if (n < 0) false
    else if (or(n == 0, n == 3)) true
    else if (or(n == 1, n == 2)) e0
    else if (or(n == 4, n == 5)) e3
    else n == 6
  def nextVis(n: int): int =
    if (vis(n + 1)) n + 1 else if (vis(n + 2)) n + 2 else if (vis(n + 3)) n + 3
    else if (vis(n + 4)) n + 4 else if (vis(n + 5)) n + 5 else if (vis(n + 6)) n + 6
    else n
  def prevVis(n: int): int =
    if (vis(n - 1)) n - 1 else if (vis(n - 2)) n - 2 else if (vis(n - 3)) n - 3
    else if (vis(n - 4)) n - 4 else if (vis(n - 5)) n - 5 else if (vis(n - 6)) n - 6
    else n

  // --- helpers ------------------------------------------------------------
  // focus moved onto node m: selection follows focus when m is selectable,
  // otherwise it is kept (labelMode 1) or cleared (labelMode 2)
  def selectedFor(m: int): int =
    if (selectable(labelMode, m)) m else (if (labelMode == 1) selected else NONE)
  def nav: bool = and(focused, open)
  def onNode: bool = and(nav, active >= 0)
  def downTarget: int = if (and(open, active >= 0)) nextVis(active) else 0
  def upTarget: int = if (and(open, active >= 0)) prevVis(active) else NODES - 1
  def parentOpen: bool = and(isParent(active), expandedNode(active))
  def rightTarget: int = if (and(onNode, parentOpen)) firstChild(active) else active
  def leftTarget: int =
    if (and(onNode, and(not(parentOpen), parentOf(active) >= 0))) parentOf(active) else active
  def commitsSelected: bool = and(nav, selected >= 0)
  def escapeClears: bool = and(and(focused, not(open)), picked >= 0)

  // --- derived ARIA attribute contract -----------------------------------
  def ariaHasPopup: str = "tree"
  def ariaExpanded: bool = open
  def ariaActivedescendant: int = if (open) active else NONE
  def ariaSelected(n: int): bool = and(open, n == selected)
  def selectedCount: int =
    (if (ariaSelected(0)) 1 else 0) + (if (ariaSelected(1)) 1 else 0) +
    (if (ariaSelected(2)) 1 else 0) + (if (ariaSelected(3)) 1 else 0) +
    (if (ariaSelected(4)) 1 else 0) + (if (ariaSelected(5)) 1 else 0) +
    (if (ariaSelected(6)) 1 else 0)
  def isNavigation(e: str): bool =
    or(e == "arrow_down", e == "arrow_up", e == "arrow_left", e == "arrow_right",
       e == "home", e == "end")
  def mayChangeValue(e: str): bool =
    or(e == "enter", e == "click_node", e == "set_value", e == "set_label_mode",
       e == "type_char", e == "escape")

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
    active' = NONE,
    selected' = NONE,
    e0' = false,
    e3' = false,
    focused' = false,
    labelMode' = 0,
    picked' = NONE,
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
    open' = open,
    active' = active,
    selected' = selected,
    e0' = e0,
    e3' = e3,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  action blur = all {
    open' = false,
    active' = NONE,
    selected' = NONE,
    focused' = false,
    lastEvent' = "blur",
    valueChanged' = false,
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // Tab: the popup and its nodes are out of the Tab sequence
  action tab = all {
    open' = if (focused) false else open,
    active' = if (focused) NONE else active,
    selected' = if (focused) NONE else selected,
    focused' = false,
    lastEvent' = "tab",
    valueChanged' = false,
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // typing: visual focus back to the textbox, the popup opens / stays open
  action type_char = all {
    open' = if (focused) true else open,
    active' = if (focused) NONE else active,
    selected' = if (focused) NONE else selected,
    picked' = landedInt(holds, picked, if (focused) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (focused) NONE else picked),
    requested' = if ((if (focused) NONE else picked) != picked) if (focused) NONE else picked else requested,
    outcome' = if ((if (focused) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (focused) NONE else picked) != picked) picked else base,
    requests' = if ((if (focused) NONE else picked) != picked) requests + 1 else requests,
    lastEvent' = "type_char",
    valueChanged' = and(focused, picked >= 0),
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode
  }

  // --- navigation keys --------------------------------------------------------
  action arrow_down = all {
    open' = if (focused) true else open,
    active' = if (focused) downTarget else active,
    selected' = if (focused) selectedFor(downTarget) else selected,
    lastEvent' = "arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  action arrow_up = all {
    open' = if (focused) true else open,
    active' = if (focused) upTarget else active,
    selected' = if (focused) selectedFor(upTarget) else selected,
    lastEvent' = "arrow_up",
    valueChanged' = false,
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // closed parent: expand in place; open parent: first child; leaf: nothing
  action arrow_right = all {
    e0' = if (and(onNode, and(active == 0, not(e0)))) true else e0,
    e3' = if (and(onNode, and(active == 3, not(e3)))) true else e3,
    active' = rightTarget,
    selected' = if (rightTarget != active) selectedFor(rightTarget) else selected,
    lastEvent' = "arrow_right",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // open parent: collapse; other child: its parent; root: nothing
  action arrow_left = all {
    e0' = if (and(onNode, and(active == 0, e0))) false else e0,
    e3' = if (and(onNode, and(active == 3, e3))) false else e3,
    active' = leftTarget,
    selected' = if (leftTarget != active) selectedFor(leftTarget) else selected,
    lastEvent' = "arrow_left",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  action home = all {
    active' = if (nav) 0 else active,
    selected' = if (nav) selectedFor(0) else selected,
    lastEvent' = "home",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  action end = all {
    active' = if (nav) NODES - 1 else active,
    selected' = if (nav) selectedFor(NODES - 1) else selected,
    lastEvent' = "end",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // --- commit / dismiss ---------------------------------------------------
  // Enter accepts the selected node; with nothing selected it does nothing
  action enter = all {
    open' = if (commitsSelected) false else open,
    picked' = landedInt(holds, picked, if (commitsSelected) selected else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (commitsSelected) selected else picked),
    requested' = if ((if (commitsSelected) selected else picked) != picked) if (commitsSelected) selected else picked else requested,
    outcome' = if ((if (commitsSelected) selected else picked) != picked) verdict else outcome,
    base' = if ((if (commitsSelected) selected else picked) != picked) picked else base,
    requests' = if ((if (commitsSelected) selected else picked) != picked) requests + 1 else requests,
    active' = if (commitsSelected) NONE else active,
    selected' = if (commitsSelected) NONE else selected,
    lastEvent' = "enter",
    valueChanged' = and(commitsSelected, picked != selected),
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode
  }

  // open: close, keep the value; closed: clear the textbox
  action escape = all {
    open' = if (focused) false else open,
    active' = if (focused) NONE else active,
    selected' = if (focused) NONE else selected,
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
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode
  }

  // --- pointer -------------------------------------------------------------
  action click_input = all {
    focused' = true,
    open' = not(open),
    active' = NONE,
    selected' = NONE,
    lastEvent' = "click_input",
    valueChanged' = false,
    wasOpen' = open,
    e0' = e0,
    e3' = e3,
    labelMode' = labelMode,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
  }

  // a selectable node is committed; a category label is toggled and focused
  action click_node = {
    nondet n = Set(0, 1, 2, 3, 4, 5, 6).oneOf()
    all {
      picked' = landedInt(holds, picked, if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked),
      requested' = if ((if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked) != picked) if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked else requested,
      outcome' = if ((if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked) != picked) verdict else outcome,
      base' = if ((if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked) != picked) picked else base,
      requests' = if ((if (and(and(open, vis(n)), selectable(labelMode, n))) n else picked) != picked) requests + 1 else requests,
      open' = if (and(and(open, vis(n)), selectable(labelMode, n))) false else open,
      active' = if (and(open, vis(n))) (if (selectable(labelMode, n)) NONE else n) else active,
      selected' = if (and(open, vis(n))) (if (selectable(labelMode, n)) NONE else selectedFor(n)) else selected,
      e0' = if (and(and(open, vis(n)), and(n == 0, not(selectable(labelMode, n))))) not(e0) else e0,
      e3' = if (and(and(open, vis(n)), and(n == 3, not(selectable(labelMode, n))))) not(e3) else e3,
      lastEvent' = "click_node",
      valueChanged' = and(and(and(open, vis(n)), selectable(labelMode, n)), picked != n),
      wasOpen' = open,
      focused' = focused,
      labelMode' = labelMode
    }
  }

  // --- prop changes ---------------------------------------------------------
  // the labelMode changes which nodes are values: popup closes, a no-longer
  // selectable committed value is dropped
  action set_label_mode = {
    nondet v = Set(0, 1, 2).oneOf()
    all {
      labelMode' = v,
      open' = false,
      active' = NONE,
      selected' = NONE,
      picked' = if (selectable(v, picked)) picked else NONE,
      lastEvent' = "set_label_mode",
      valueChanged' = and(picked >= 0, not(selectable(v, picked))),
      wasOpen' = open,
      e0' = e0,
      e3' = e3,
      focused' = focused,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) (if (selectable(v, picked)) picked else NONE) else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // a non-selectable value is ignored
  action set_value = {
    nondet n = Set(0, 1, 2, 3, 4, 5, 6).oneOf()
    all {
      picked' = if (selectable(labelMode, n)) n else picked,
      open' = false,
      active' = NONE,
      selected' = NONE,
      lastEvent' = "set_value",
      valueChanged' = and(selectable(labelMode, n), picked != n),
      wasOpen' = open,
      e0' = e0,
      e3' = e3,
      focused' = focused,
      labelMode' = labelMode,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) (if (selectable(labelMode, n)) n else picked) else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the picked node
  action hostToggle = all {
    open' = open,
    active' = active,
    selected' = selected,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = if (controlled) (if (picked >= 0) NONE else 1) else picked,
    lastEvent' = "hostToggle",
    valueChanged' = false,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (picked >= 0) NONE else 1) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the picked node, adopting it
  action control = all {
    open' = open,
    active' = active,
    selected' = selected,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = picked,
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
    open' = open,
    active' = active,
    selected' = selected,
    e0' = e0,
    e3' = e3,
    focused' = focused,
    labelMode' = labelMode,
    picked' = picked,
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
    init, focus, blur, tab, type_char, arrow_down, arrow_up, arrow_right,
    arrow_left, home, end, enter, escape, click_input, click_node, set_label_mode,
    set_value, hostToggle, control, acceptRequests
  }

  // --- invariants (APG guarantees) ----------------------------------------
  // aria-activedescendant refers to a visible node of the open popup
  val ActiveNodeIsVisibleInOpenPopup: bool = or(active == NONE, and(open, vis(active)))
  // DOM focus stays on the combobox while its popup is open
  val DomFocusStaysOnCombobox: bool = or(not(open), focused)
  // at most one aria-selected node, only in an open popup, always a selectable value
  val SelectionIsSingleAndSelectable: bool = and(
    selectedCount == (if (selected >= 0) 1 else 0),
    or(selected == NONE, and(open, selectable(labelMode, selected)))
  )
  // selection follows focus on selectable nodes; on a label it is kept
  // (labelMode 1) or cleared (labelMode 2); nothing is selected without focus
  val SelectionFollowsFocus: bool = and(
    or(active != NONE, selected == NONE),
    or(active == NONE, not(selectable(labelMode, active)), selected == active),
    or(active == NONE, selectable(labelMode, active), labelMode == 1, selected == NONE)
  )
  // the rendered attributes agree with the state; non-listbox popups declare
  // their type through aria-haspopup
  val AriaContractConsistent: bool = and(
    ariaActivedescendant == active,
    ariaHasPopup == "tree",
    ariaExpanded == open
  )
  val EscapeOnOpenPopupKeepsValue: bool =
    or(not(lastEvent == "escape"), not(wasOpen), not(valueChanged))
  val NavigationKeepsValue: bool = or(not(isNavigation(lastEvent)), not(valueChanged))
  val ValueChangesOnlyOnCommitOrEdit: bool = or(not(valueChanged), mayChangeValue(lastEvent))
  // the committed value is always a selectable node
  val PickedIsSelectable: bool =
    and(picked >= NONE, picked < NODES, selectable(labelMode, picked))
  val FocusLossClosesPopup: bool =
    or(not(or(lastEvent == "blur", lastEvent == "tab")), and(not(open), not(focused)))
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the picked node, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), picked == valueProp)
  // a rejected request leaves the picked node as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), picked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), picked == requested)
}
