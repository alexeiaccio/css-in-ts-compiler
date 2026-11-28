// Nondeterminism over a *state-derived* or named pool: the `auth.qnt` `*Any`
// pattern draws senders from `state.admins` or a top-level `def`.
module nondet_named {
  var current: str
  def users = Set("alice", "bob", "carol")

  action init = all { current' = "none" }
  action pick = {
    nondet u = users.oneOf()
    all { current' = u }
  }
  action step = any { init, pick }
}
