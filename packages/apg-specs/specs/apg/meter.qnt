// APG Meter — https://www.w3.org/WAI/ARIA/apg/patterns/meter/
//
// A graphical display of a numeric value within a defined range (battery level,
// fuel). NOT a progressbar (no completion semantics) and not for unbounded
// values. The spec models the rendered attributes next to the input so the APG
// contract is checkable:
//   - aria-valuemin < aria-valuemax;
//   - aria-valuenow lies in [min, max] (the raw value is clamped, and is
//     re-clamped when the range changes);
//   - aria-valuetext is present when a bare percentage would not be friendly,
//     and a present valuetext describes the CURRENT value (never stale).
//
// Events:
//   setValue            the consumer feeds a raw value (may be out of range)
//   setRange            the consumer changes [min, max] (one selector `r`
//                       encodes the pair); an invalid pair (min >= max) is ignored
//   addText/removeText  render / drop aria-valuetext
//   percentFriendly / percentUnfriendly
//                       whether a percentage alone is understandable
//
// Keyboard: not applicable. Label (aria-labelledby / aria-label) is a static DOM
// contract, see specs/apg/STATIC.md.
module apg_meter {
  var min: int        // aria-valuemin
  var max: int        // aria-valuemax
  var raw: int        // the consumer's unclamped value
  var now: int        // aria-valuenow (clamped raw)
  var friendly: bool  // a percentage alone is understandable
  var hasText: bool   // aria-valuetext is rendered
  var textNow: int    // the value aria-valuetext describes (0 when absent)

  def clamp(v: int, lo: int, hi: int): int =
    if (v < lo) lo else if (v > hi) hi else v
  // range selector: 0..2 are valid ranges, 3 (min > max) and 4 (min == max) are not
  def loOf(r: int): int = if (r == 0) 0 else if (r == 1) 10 else if (r == 2) 20 else if (r == 3) 20 else 10
  def hiOf(r: int): int = if (r == 0) 100 else if (r == 1) 50 else if (r == 2) 200 else if (r == 3) 10 else 10
  def pickMin(lo: int, hi: int): int = if (lo < hi) lo else min
  def pickMax(lo: int, hi: int): int = if (lo < hi) hi else max

  action init = all {
    min' = 0,
    max' = 100,
    raw' = 50,
    now' = 50,
    friendly' = true,
    hasText' = false,
    textNow' = 0
  }

  action setValue = {
    nondet v = Set(-5, 0, 5, 15, 25, 60, 100, 150).oneOf()
    all {
      min' = min,
      max' = max,
      raw' = v,
      now' = clamp(v, min, max),
      friendly' = friendly,
      hasText' = hasText,
      textNow' = if (hasText) clamp(v, min, max) else 0
    }
  }

  action setRange = {
    nondet r = Set(0, 1, 2, 3, 4).oneOf()
    all {
      min' = pickMin(loOf(r), hiOf(r)),
      max' = pickMax(loOf(r), hiOf(r)),
      raw' = raw,
      now' = clamp(raw, pickMin(loOf(r), hiOf(r)), pickMax(loOf(r), hiOf(r))),
      friendly' = friendly,
      hasText' = hasText,
      textNow' = if (hasText) clamp(raw, pickMin(loOf(r), hiOf(r)), pickMax(loOf(r), hiOf(r))) else 0
    }
  }

  action addText = all {
    min' = min,
    max' = max,
    raw' = raw,
    now' = now,
    friendly' = friendly,
    hasText' = true,
    textNow' = now
  }

  // a meter whose percentage is not friendly keeps its valuetext
  action removeText = all {
    min' = min,
    max' = max,
    raw' = raw,
    now' = now,
    friendly' = friendly,
    hasText' = if (friendly) false else hasText,
    textNow' = if (friendly) 0 else textNow
  }

  action percentFriendly = all {
    min' = min,
    max' = max,
    raw' = raw,
    now' = now,
    friendly' = true,
    hasText' = hasText,
    textNow' = textNow
  }

  action percentUnfriendly = all {
    min' = min,
    max' = max,
    raw' = raw,
    now' = now,
    friendly' = false,
    hasText' = true,
    textNow' = now
  }

  action step = any { init, setValue, setRange, addText, removeText, percentFriendly, percentUnfriendly }

  // APG: aria-valuemin is less than aria-valuemax
  val RangeValid: bool = min < max
  // APG: aria-valuenow is between aria-valuemin and aria-valuemax
  val NowInRange: bool = and(min <= now, now <= max)
  // the rendered value is exactly the clamped raw value
  val NowIsClampedRaw: bool = now == clamp(raw, min, max)
  // APG: valuetext is set when the percentage alone is not user friendly
  val TextWhenNotFriendly: bool = or(friendly, hasText)
  // aria-valuetext never describes a stale value
  val TextNeverStale: bool = if (hasText) textNow == now else textNow == 0
}
