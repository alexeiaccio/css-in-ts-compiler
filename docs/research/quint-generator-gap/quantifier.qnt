// Quantification + set membership: the authz oracle is built from these.
module quantifier {
  var x: int
  def users = Set("alice", "bob")
  def allKnown(u: str): bool = users.contains(u)
  def somePositive(s: Set[int]): bool = exists(s, y => y > 0)
  def allNonNeg(s: Set[int]): bool = forall(s, y => y >= 0)

  action init = all { x' = 0 }
  action check = all { x' = if (somePositive(Set(1, 2))) 1 else x }
  action step = any { init, check }
}
