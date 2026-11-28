module lib {
  def helper(x: int): int = x + 1
}
module main {
  var y: int
  action init = all { y' = 0 }
  action bump = all { y' = helper(y) }
  action step = any { init, bump }
}
