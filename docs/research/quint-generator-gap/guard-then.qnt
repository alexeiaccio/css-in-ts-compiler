// Guarded / composed actions: `a.then(b)` chains actions (loudly unsupported);
// guards gate feasibility.
module guard_then {
  var x: int

  action init = all { x' = 0 }
  action inc = all { x' = x + 1 }
  action thened = inc.then(inc)
  action step = any { init, thened }
}
