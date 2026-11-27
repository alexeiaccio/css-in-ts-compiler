// The layered (Sugiyama) pipeline of Eclipse Layout Kernel, over a graph of four nodes and six pairs — small enough that
// every state of every phase is checked by hand.
//
// Source of truth: ELK's pipeline — Cycle Breaking, Layer Assignment, Crossing Minimization, Node Placement, Edge Routing,
// with intermediate processors between the phases — as its reference documents it (the `org.eclipse.elk.layered`
// algorithm page, the "Layered (overview)" post of 2025-08-21, and `ElkLayered.java`). The implementation the scenarios
// are checked against is elk-rs 0.12.2 (`@openedges/elk-layout`, a port of Java ELK 0.12.0), with the portable strategies
// pinned: cycle breaking by model order, longest-path layering, no crossing minimization — so the discrete result is a
// function of the graph, not of a heuristic's tie-breaks.
//
// MODELLED: the graph is one of six (a chain, a diamond, two islands, a long edge, a two-cycle, a three-cycle), chosen by
// the `pick` of `set_graph`; a pair of nodes carries one edge, 0 absent / 1 earlier -> later / 2 backwards. `reverse` is
// phase 1's decision (a backwards edge is reversed: on a graph this size every backwards edge is the back edge of a
// depth-first walk in model order, which is ELK's MODEL_ORDER breaker), `layer` is phase 2's (the longest path from a
// source over the reversed graph), `order` is phase 3's (the rank of a node among its layer's nodes, in model order).
// `phase` is the pipeline's own position: 0 input, 1 broken, 2 layered, 3 ordered.
//
// NOT MODELLED:
//   - Crossing minimization's choice: with model order and no crossing minimization ELK orders a layer by the order of
//     the edges that reach it, not by the node order (`a -> d, a -> b` puts `d` above `b`), so the order is the spec's own
//     model-order rank and the scenarios compare layers, not ranks. A crossing count needs the dummy nodes a long edge is
//     split into, which belongs to routing.
//   - Node placement and edge routing: coordinates, spacing, bend points and ports are geometry, not state; the rank is
//     what placement consumes and what this spec can state without inventing a pixel model. The discrete part of routing
//     (an edge crosses each layer boundary between its ends once) follows from the layers.
//   - Compound graphs, ports, labels, partitions, layer constraints and self loops: the pipeline handles them with
//     intermediate processors and node splitting; this is the four-node slice, each of those a second one.
//   - The strategy knobs (network simplex, Brandes-Köpf, orthogonal routing): they pick which valid layout is drawn, not
//     which invariants hold.
//
// Generator gaps hit: one nondet pool per action and no collections, so the graph is a literal `pick` and the six pairs
// and four nodes are their own vars; every action assigns every var, and a phase is entered by its own action and refuses
// in any other (the assignments keep the state, so an out-of-order step is a no-op the invariants still check).
module patterns_graph_layout {
  var e_ab: int // 0 absent, 1 a -> b, 2 b -> a
  var e_ac: int
  var e_ad: int
  var e_bc: int
  var e_bd: int
  var e_cd: int
  var r_ab: bool // phase 1: the edge was reversed to make the graph acyclic
  var r_ac: bool
  var r_ad: bool
  var r_bc: bool
  var r_bd: bool
  var r_cd: bool
  var layer_a: int // phase 2: the longest path from a source
  var layer_b: int
  var layer_c: int
  var layer_d: int
  var order_a: int // phase 3: the rank within the layer, in model order
  var order_b: int
  var order_c: int
  var order_d: int
  var phase: int // 0 input, 1 broken, 2 layered, 3 ordered

  def ZERO: int = 0
  def ONE: int = 1
  def TWO: int = 2
  def THREE: int = 3
  def FOUR: int = 4

  // 1 chain, 2 diamond, 3 two islands, 4 a long edge, 5 a two-cycle, 6 a three-cycle
  def edgeAb(pick: int): int = ONE
  def edgeAc(pick: int): int = if (pick == 2) ONE else if (pick == 6) TWO else ZERO
  def edgeAd(pick: int): int = if (pick == 4) ONE else ZERO
  def edgeBc(pick: int): int =
    if (pick == 2) ZERO else if (pick == 3) ZERO else if (pick == 5) TWO else ONE
  def edgeBd(pick: int): int = if (pick == 2) ONE else ZERO
  def edgeCd(pick: int): int = if (or(pick == 2, or(pick == 3, pick == 4))) ONE else ZERO

  // a pair is present whatever way it points; a backwards edge is the one to reverse
  def has(e: int): bool = e != ZERO
  def flips(e: int): bool = e == TWO
  def mx(x: int, y: int): int = if (x > y) x else y
  // a predecessor one layer below makes a longest-path layer tight
  def rank(pred: int, mine: bool): int = if (mine) pred + ONE else ZERO

  def layerOfB(ab: int): int = if (has(ab)) ONE else ZERO
  def layerOfC(ac: int, bc: int, ab: int): int =
    mx(if (has(ac)) ONE else ZERO, rank(layerOfB(ab), has(bc)))
  def layerOfD(ad: int, bd: int, cd: int, ab: int, ac: int, bc: int): int =
    mx(
      mx(if (has(ad)) ONE else ZERO, rank(layerOfB(ab), has(bd))),
      rank(layerOfC(ac, bc, ab), has(cd)),
    )

  action init = all {
    e_ab' = ZERO, e_ac' = ZERO, e_ad' = ZERO, e_bc' = ZERO, e_bd' = ZERO, e_cd' = ZERO,
    r_ab' = false, r_ac' = false, r_ad' = false, r_bc' = false, r_bd' = false, r_cd' = false,
    layer_a' = ZERO, layer_b' = ZERO, layer_c' = ZERO, layer_d' = ZERO,
    order_a' = ZERO, order_b' = ZERO, order_c' = ZERO, order_d' = ZERO,
    phase' = ZERO
  }

  action set_graph = {
    nondet pick = Set(1, 2, 3, 4, 5, 6).oneOf()
    all {
      e_ab' = edgeAb(pick), e_ac' = edgeAc(pick), e_ad' = edgeAd(pick),
      e_bc' = edgeBc(pick), e_bd' = edgeBd(pick), e_cd' = edgeCd(pick),
      r_ab' = false, r_ac' = false, r_ad' = false, r_bc' = false, r_bd' = false, r_cd' = false,
      layer_a' = ZERO, layer_b' = ZERO, layer_c' = ZERO, layer_d' = ZERO,
      order_a' = ZERO, order_b' = ZERO, order_c' = ZERO, order_d' = ZERO,
      phase' = ZERO
    }
  }

  action break_cycles = all {
    e_ab' = e_ab, e_ac' = e_ac, e_ad' = e_ad, e_bc' = e_bc, e_bd' = e_bd, e_cd' = e_cd,
    r_ab' = if (phase == ZERO) flips(e_ab) else r_ab,
    r_ac' = if (phase == ZERO) flips(e_ac) else r_ac,
    r_ad' = if (phase == ZERO) flips(e_ad) else r_ad,
    r_bc' = if (phase == ZERO) flips(e_bc) else r_bc,
    r_bd' = if (phase == ZERO) flips(e_bd) else r_bd,
    r_cd' = if (phase == ZERO) flips(e_cd) else r_cd,
    layer_a' = layer_a, layer_b' = layer_b, layer_c' = layer_c, layer_d' = layer_d,
    order_a' = order_a, order_b' = order_b, order_c' = order_c, order_d' = order_d,
    phase' = if (phase == ZERO) ONE else phase
  }

  action assign_layers = all {
    e_ab' = e_ab, e_ac' = e_ac, e_ad' = e_ad, e_bc' = e_bc, e_bd' = e_bd, e_cd' = e_cd,
    r_ab' = r_ab, r_ac' = r_ac, r_ad' = r_ad, r_bc' = r_bc, r_bd' = r_bd, r_cd' = r_cd,
    layer_a' = ZERO,
    layer_b' = if (phase == ONE) layerOfB(e_ab) else layer_b,
    layer_c' = if (phase == ONE) layerOfC(e_ac, e_bc, e_ab) else layer_c,
    layer_d' = if (phase == ONE) layerOfD(e_ad, e_bd, e_cd, e_ab, e_ac, e_bc) else layer_d,
    order_a' = order_a, order_b' = order_b, order_c' = order_c, order_d' = order_d,
    phase' = if (phase == ONE) TWO else phase
  }

  action order_nodes = all {
    e_ab' = e_ab, e_ac' = e_ac, e_ad' = e_ad, e_bc' = e_bc, e_bd' = e_bd, e_cd' = e_cd,
    r_ab' = r_ab, r_ac' = r_ac, r_ad' = r_ad, r_bc' = r_bc, r_bd' = r_bd, r_cd' = r_cd,
    layer_a' = layer_a, layer_b' = layer_b, layer_c' = layer_c, layer_d' = layer_d,
    order_a' = ZERO,
    order_b' = if (phase == TWO) (if (layer_b == layer_a) ONE else ZERO) else order_b,
    order_c' =
      if (phase == TWO)
        (if (layer_c == layer_a) ONE else ZERO) + (if (layer_c == layer_b) ONE else ZERO)
      else order_c,
    order_d' =
      if (phase == TWO)
        (if (layer_d == layer_a) ONE else ZERO) +
          (if (layer_d == layer_b) ONE else ZERO) +
          (if (layer_d == layer_c) ONE else ZERO)
      else order_d,
    phase' = if (phase == TWO) THREE else phase
  }

  action step = any { init, set_graph, break_cycles, assign_layers, order_nodes }

  val GraphWellFormed: bool =
    and(e_ab >= ZERO, and(e_ab <= TWO, and(e_ac >= ZERO, and(e_ac <= TWO, and(e_ad >= ZERO, and(e_ad <= TWO, and(e_bc >= ZERO, and(e_bc <= TWO, and(e_bd >= ZERO, and(e_bd <= TWO, and(e_cd >= ZERO, e_cd <= TWO)))))))))))

  val PhaseInRange: bool = and(phase >= ZERO, phase <= THREE)

  // phase 1 is the only place a reversal happens, and it reverses exactly the backwards edges
  val ReversedOnlyBackwards: bool =
    if (phase == ZERO)
      and(
        not(r_ab),
        and(not(r_ac), and(not(r_ad), and(not(r_bc), and(not(r_bd), not(r_cd))))),
      )
    else
      and(
        r_ab == flips(e_ab),
        and(
          r_ac == flips(e_ac),
          and(
            r_ad == flips(e_ad),
            and(r_bc == flips(e_bc), and(r_bd == flips(e_bd), r_cd == flips(e_cd))),
          ),
        ),
      )

  // a layer exists only after layering, and the first node of the model is always a source
  val LayersOnlyAfterLayering: bool =
    if (phase < TWO)
      and(layer_a == ZERO, and(layer_b == ZERO, and(layer_c == ZERO, layer_d == ZERO)))
    else layer_a == ZERO

  // every edge of the broken graph points down the model order: the layering is what makes the graph acyclic
  val LayersForward: bool =
    or(
      phase < TWO,
      and(
        or(not(has(e_ab)), layer_a < layer_b),
        and(
          or(not(has(e_ac)), layer_a < layer_c),
          and(
            or(not(has(e_ad)), layer_a < layer_d),
            and(
              or(not(has(e_bc)), layer_b < layer_c),
              and(or(not(has(e_bd)), layer_b < layer_d), or(not(has(e_cd)), layer_c < layer_d)),
            ),
          ),
        ),
      ),
    )

  // longest path: a node above a source sits one layer below a predecessor
  val LayersTight: bool =
    or(
      phase < TWO,
      and(
        or(layer_c == ZERO, or(and(has(e_ac), layer_a + ONE == layer_c), and(has(e_bc), layer_b + ONE == layer_c))),
        or(
          layer_d == ZERO,
          or(
            and(has(e_ad), layer_a + ONE == layer_d),
            or(and(has(e_bd), layer_b + ONE == layer_d), and(has(e_cd), layer_c + ONE == layer_d)),
          ),
        ),
      ),
    )

  val OrdersOnlyAfterOrdering: bool =
    or(phase < THREE, and(order_a == ZERO, and(order_b < TWO, and(order_c < THREE, order_d < FOUR))))

  // within a layer the ranks follow the model order, one rank per node
  val OrdersFollowModel: bool =
    or(
      phase < THREE,
      and(
        or(not(layer_a == layer_b), order_a < order_b),
        and(
          or(not(layer_a == layer_c), order_a < order_c),
          and(
            or(not(layer_a == layer_d), order_a < order_d),
            and(
              or(not(layer_b == layer_c), order_b < order_c),
              and(or(not(layer_b == layer_d), order_b < order_d), or(not(layer_c == layer_d), order_c < order_d)),
            ),
          ),
        ),
      ),
    )
}
