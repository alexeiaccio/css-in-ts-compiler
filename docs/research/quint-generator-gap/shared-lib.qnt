// Shared library spec: the service will factor common types/predicates into a
// module imported by several specs.
module shared_lib {
  def isKnownUser(u: str): bool = Set("alice", "bob").contains(u)
}
