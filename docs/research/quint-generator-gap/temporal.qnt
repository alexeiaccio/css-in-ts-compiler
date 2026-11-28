// Temporal property. Parses as `def` with qualifier "temporal", so the
// generator emits it as a plain `function` def and the invariant list never
// includes it — the property is silently never checked.
module temporal {
  var x: int

  action init = all { x' = 0 }
  action dec = all { x' = x - 1 }
  action step = any { init, dec }

  temporal XStaysNonNegative = always(x >= 0)
}
