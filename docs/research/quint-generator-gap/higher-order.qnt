// Higher-order def: `apply(f, x)` is the standard pass-a-pure-function shape.
module higher_order {
  var x: int
  def inc(a: int): int = a + 1
  def apply(f: (int) => int, y: int): int = f(y)

  action init = all { x' = 0 }
  action bump = all { x' = apply(inc, x) }
  action step = any { init, bump }
}
