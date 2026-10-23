// APG Link — https://www.w3.org/WAI/ARIA/apg/patterns/link/
//
// A link is an interactive reference to a resource. A native <a href> brings
// focusability and activation for free; a non-native element with role=link
// must supply both itself (tabindex=0 and an Enter handler), because "applying
// the link role will not cause browsers to enhance the element".
//
// Keyboard (APG): Enter executes the link and moves focus to the link target.
// Space does NOT activate a link.
//
// Events:
//   focusLink / blur   the link gains / loses focus (a link that is not
//                      focusable ignores focusLink)
//   press              Enter on the focused link
//   pressSpace         Space on the focused link (no effect)
//   click              pointer activation (focuses, then executes)
//   back               the user navigates back to the origin
//   setNative / setCustom   the element is a native <a href> / a role=link span
//
// location: 0 = origin, 1 = link target. focus: "none" | "link" | "target".
//
// ponytail: the optional Shift+F10 context menu is not modelled; add a
// `menuOpen` var when the widget implements it.
module apg_link {
  var native: bool       // native <a href> (no role needed)
  var tabindex: bool     // tabindex=0 present (custom role=link only)
  var focus: str         // "none" | "link" | "target"
  var location: int      // 0 = origin, 1 = target
  var activations: int   // times the link executed

  def focusable: bool = or(native, tabindex)

  action init = all {
    native' = true,
    tabindex' = false,
    focus' = "none",
    location' = 0,
    activations' = 0
  }

  action focusLink = all {
    native' = native,
    tabindex' = tabindex,
    focus' = if (focusable) "link" else focus,
    location' = location,
    activations' = activations
  }

  action blur = all {
    native' = native,
    tabindex' = tabindex,
    focus' = "none",
    location' = location,
    activations' = activations
  }

  action press = all {
    native' = native,
    tabindex' = tabindex,
    focus' = if (focus == "link") "target" else focus,
    location' = if (focus == "link") 1 else location,
    activations' = if (focus == "link") activations + 1 else activations
  }

  action pressSpace = all {
    native' = native,
    tabindex' = tabindex,
    focus' = focus,
    location' = location,
    activations' = activations
  }

  action click = all {
    native' = native,
    tabindex' = tabindex,
    focus' = "target",
    location' = 1,
    activations' = activations + 1
  }

  action back = all {
    native' = native,
    tabindex' = tabindex,
    focus' = "none",
    location' = 0,
    activations' = activations
  }

  action setNative = all {
    native' = true,
    tabindex' = false,
    focus' = focus,
    location' = location,
    activations' = activations
  }

  action setCustom = all {
    native' = false,
    tabindex' = true,
    focus' = focus,
    location' = location,
    activations' = activations
  }

  action step = any { init, focusLink, blur, press, pressSpace, click, back, setNative, setCustom }

  // APG: a non-native link role must be keyboard reachable (tabindex=0)
  val KeyboardReachable: bool = focusable
  // only a focusable element can hold focus on the link
  val FocusOnLinkImpliesFocusable: bool = or(focus != "link", focusable)
  // focus lands on the target only after arriving there
  val TargetFocusImpliesArrived: bool = or(focus != "target", location == 1)
  // being at the target means the link ran at least once
  val ArrivedImpliesActivated: bool = or(location == 0, activations >= 1)
  // only the origin and the target exist
  val LocationKnown: bool = or(location == 0, location == 1)
  // the activation count only grows from zero
  val ActivationsNonNegative: bool = activations >= 0
}
