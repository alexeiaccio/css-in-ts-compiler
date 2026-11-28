// List/array state: a real service spec carries collections (an outbox, a
// pending set, an ordered journal). Generator claims str/int/bool vars only.
module list_state {
  var pending: List[int]

  action init = all { pending' = [] }
  action push = {
    nondet n = Set(1, 2, 3).oneOf()
    all { pending' = pending.append(n) }
  }
  action step = any { init, push }
}
