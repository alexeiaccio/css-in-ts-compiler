// Set state: membership/bans/roles are all sets in an authz spec.
module set_state {
  var members: Set[str]

  action init = all { members' = Set() }
  action add = {
    nondet u = Set("alice", "bob").oneOf()
    all { members' = members.union(Set(u)) }
  }
  action step = any { init, add }
}
