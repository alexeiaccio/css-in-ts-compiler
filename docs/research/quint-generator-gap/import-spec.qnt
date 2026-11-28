// Module import: reuse the shared library in a runnable spec.
module import_spec {
  import shared_lib.*

  var known: bool

  action init = all { known' = false }
  action touch = {
    nondet u = Set("alice", "bob", "carol").oneOf()
    all { known' = isKnownUser(u) }
  }
  action step = any { init, touch }
}
