// Two nondeterministic arguments in one action: e.g. grant(subject, scope).
module nondet_two {
  var x: int
  var y: int

  action init = all { x' = 0, y' = 0 }
  action pair = {
    nondet a = Set(1, 2).oneOf()
    nondet b = Set(3, 4).oneOf()
    all { x' = a, y' = b }
  }
  action step = any { init, pair }
}
