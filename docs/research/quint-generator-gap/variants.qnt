// Constructor-union ("sum type") state. `Channel` is a nullary constructor,
// `Thread(1)` a unary one; `r' = Channel` is a bare *name* to the generator.
module variants {
  type Room = Channel | Thread(int)
  var room: Room

  action init = all { room' = Channel }
  action pick = {
    nondet r = Set(Channel, Thread(1)).oneOf()
    all { room' = r }
  }
  action step = any { init, pick }
}
