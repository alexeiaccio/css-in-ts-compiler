// Nondeterminism over a *range*, not a literal set: the natural way to draw an
// arbitrary seq number / timestamp without enumerating it.
module nondet_range {
  var cursor: int
  def seqPool: Set[int] = 1.to(1000)

  action init = all { cursor' = 0 }
  action ingest = {
    nondet seq = seqPool.oneOf()
    all { cursor' = seq }
  }
  action step = any { init, ingest }
}
