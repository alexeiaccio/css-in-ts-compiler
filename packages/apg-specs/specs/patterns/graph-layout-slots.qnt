// The layered pipeline with the junction points made explicit: a long edge is a chain of dummy nodes, one per layer it
// crosses, and a layer's slots hold its nodes and the dummies that pass through it.
//
// Source: the same ELK pipeline as `graph-layout.qnt` (cycle breaking by model order, longest-path layering), plus the
// intermediate processors that splice a long edge into dummies — the discrete structure crossing minimization and routing
// consume. The six graphs are the same fixture, and the same elk-rs 0.12.2 with the portable strategies pinned is the
// implementation the scenarios are checked against; the dummies are visible in its routes, so the projection reads them back
// from the drawn polyline: an edge crosses each layer strictly between its ends.
//
// MODELLED: the six graphs of `graph-layout.qnt` (nothing new arrives with the second slice — the same pairs, the same
// phases), and phase 3 becomes slots: two per layer (`s_<layer><slot>`), each holding 0 (empty), a node (1..4 for a, b, c, d)
// or a dummy of a pair (5..10 for ab, ac, ad, bc, bd, cd). With four nodes a layer holds at most two occupants, and in these
// six graphs a layer with two nodes has no dummy through it — `AtMostOneLongEdgePerLayer` and `NoCrowdedLayer` state both, so a
// graph the two slots cannot express fails an invariant instead of dropping a dummy.
//
// NOT MODELLED:
//   - The slot order's choice: nodes first in model order, then the dummy. It is a baseline, not a claim about a drawing —
//     ELK orders a layer by the edges that reach it — so the scenarios compare each layer's occupants as a set.
//   - More than one dummy in a layer, more than four layers, more than two occupants: the bounds of four nodes and six pairs,
//     checked above rather than widened.
//   - Crossing minimization over these slots, placement and routing: the next slices, each with its own spec.
//   - Ports, labels, compound graphs, self loops and partitions: as in `graph-layout.qnt`, the deferred slice.
//
// Generator gaps hit: no collections, so the slots are eight named vars and each layer's occupant is a def over the four
// layer values; one nondet pool per action, so the graph is still the literal `pick` of six.
module patterns_graph_layout_slots {
  var e_ab: int // 0 absent, 1 a -> b, 2 b -> a
  var e_ac: int
  var e_ad: int
  var e_bc: int
  var e_bd: int
  var e_cd: int
  var r_ab: bool // phase 1: the edge was reversed to point forward in model order
  var r_ac: bool
  var r_ad: bool
  var r_bc: bool
  var r_bd: bool
  var r_cd: bool
  var layer_a: int // phase 2: the longest path from a source
  var layer_b: int
  var layer_c: int
  var layer_d: int
  var s_00: int // phase 3: the slots of layer 0, 0 empty / 1..4 a node / 5..10 a dummy
  var s_01: int
  var s_10: int
  var s_11: int
  var s_20: int
  var s_21: int
  var s_30: int
  var s_31: int
  var phase: int // 0 input, 1 broken, 2 layered, 3 slotted

  def ZERO: int = 0
  def ONE: int = 1
  def TWO: int = 2
  def THREE: int = 3
  def FOUR: int = 4
  def FIVE: int = 5
  def SIX: int = 6
  def SEVEN: int = 7
  def EIGHT: int = 8
  def NINE: int = 9
  def TEN: int = 10

  def A: int = ONE
  def B: int = TWO
  def C: int = THREE
  def D: int = FOUR
  def AB: int = FIVE
  def AC: int = SIX
  def AD: int = SEVEN
  def BC: int = EIGHT
  def BD: int = NINE
  def CD: int = TEN

  // 1 chain, 2 diamond, 3 two islands, 4 a long edge, 5 a two-cycle, 6 a three-cycle
  def edgeAb(pick: int): int = ONE
  def edgeAc(pick: int): int = if (pick == 2) ONE else if (pick == 6) TWO else ZERO
  def edgeAd(pick: int): int = if (pick == 4) ONE else ZERO
  def edgeBc(pick: int): int =
    if (pick == 2) ZERO else if (pick == 3) ZERO else if (pick == 5) TWO else ONE
  def edgeBd(pick: int): int = if (pick == 2) ONE else ZERO
  def edgeCd(pick: int): int = if (pick == 2) ONE else if (pick == 3) ONE else if (pick == 4) ONE else ZERO

  def has(e: int): bool = e != ZERO
  def flips(e: int): bool = e == TWO
  def mx(x: int, y: int): int = if (x > y) x else y
  def rank(pred: int, mine: bool): int = if (mine) pred + ONE else ZERO

  def layerOfB(ab: int): int = if (has(ab)) ONE else ZERO
  def layerOfC(ac: int, bc: int, ab: int): int =
    mx(if (has(ac)) ONE else ZERO, rank(layerOfB(ab), has(bc)))
  def layerOfD(ad: int, bd: int, cd: int, ab: int, ac: int, bc: int): int =
    mx(
      mx(if (has(ad)) ONE else ZERO, rank(layerOfB(ab), has(bd))),
      rank(layerOfC(ac, bc, ab), has(cd)),
    )

  // every effective edge points from a smaller model index to a larger one, so a pair's span is its layers' difference
  def layers: int = mx(mx(layer_a, layer_b), mx(layer_c, layer_d)) + ONE
  def spanAb: int = layer_b - layer_a
  def spanAc: int = layer_c - layer_a
  def spanAd: int = layer_d - layer_a
  def spanBc: int = layer_c - layer_b
  def spanBd: int = layer_d - layer_b
  def spanCd: int = layer_d - layer_c

  // the pair passes through L as a dummy: present, longer than one layer, and L strictly between its ends
  def dummyAb(L: int): bool = and(has(e_ab), and(spanAb >= TWO, and(layer_a < L, L < layer_b)))
  def dummyAc(L: int): bool = and(has(e_ac), and(spanAc >= TWO, and(layer_a < L, L < layer_c)))
  def dummyAd(L: int): bool = and(has(e_ad), and(spanAd >= TWO, and(layer_a < L, L < layer_d)))
  def dummyBc(L: int): bool = and(has(e_bc), and(spanBc >= TWO, and(layer_b < L, L < layer_c)))
  def dummyBd(L: int): bool = and(has(e_bd), and(spanBd >= TWO, and(layer_b < L, L < layer_d)))
  def dummyCd(L: int): bool = and(has(e_cd), and(spanCd >= TWO, and(layer_c < L, L < layer_d)))

  def longCount(L: int): int =
    (if (dummyAb(L)) ONE else ZERO) +
      (if (dummyAc(L)) ONE else ZERO) +
      (if (dummyAd(L)) ONE else ZERO) +
      (if (dummyBc(L)) ONE else ZERO) +
      (if (dummyBd(L)) ONE else ZERO) +
      (if (dummyCd(L)) ONE else ZERO)

  def dummyAt(L: int): int =
    if (dummyAb(L)) AB
    else if (dummyAc(L)) AC
    else if (dummyAd(L)) AD
    else if (dummyBc(L)) BC
    else if (dummyBd(L)) BD
    else if (dummyCd(L)) CD
    else ZERO

  def firstNode(L: int): int =
    if (layer_a == L) A
    else if (layer_b == L) B
    else if (layer_c == L) C
    else if (layer_d == L) D
    else ZERO

  def secondNode(L: int): int =
    if (and(layer_b == L, layer_a == L)) B
    else if (and(layer_c == L, or(layer_a == L, layer_b == L))) C
    else if (and(layer_d == L, or(layer_a == L, or(layer_b == L, layer_c == L)))) D
    else ZERO

  def slotOne(L: int): int = if (secondNode(L) != ZERO) secondNode(L) else dummyAt(L)

  def isNode(code: int): bool = and(code >= A, code <= D)
  def isDummy(code: int): bool = code >= AB
  def layerOfCode(code: int): int =
    if (code == A) layer_a else if (code == B) layer_b else if (code == C) layer_c else layer_d

  def dummyOfLayer(code: int, L: int): bool =
    if (code == AB) dummyAb(L)
    else if (code == AC) dummyAc(L)
    else if (code == AD) dummyAd(L)
    else if (code == BC) dummyBc(L)
    else if (code == BD) dummyBd(L)
    else if (code == CD) dummyCd(L)
    else false

  def inSlots(L: int, code: int): bool =
    or(
      (if (L == ZERO) s_00 else if (L == ONE) s_10 else if (L == TWO) s_20 else s_30) == code,
      (if (L == ZERO) s_01 else if (L == ONE) s_11 else if (L == TWO) s_21 else s_31) == code,
    )

  def dummyInSlots(L: int): int =
    if (isDummy(if (L == ZERO) s_00 else if (L == ONE) s_10 else if (L == TWO) s_20 else s_30))
      (if (L == ZERO) s_00 else if (L == ONE) s_10 else if (L == TWO) s_20 else s_30)
    else if (isDummy(if (L == ZERO) s_01 else if (L == ONE) s_11 else if (L == TWO) s_21 else s_31))
      (if (L == ZERO) s_01 else if (L == ONE) s_11 else if (L == TWO) s_21 else s_31)
    else ZERO

  action init = {
    all {
    e_ab' = edgeAb(ONE),
    e_ac' = edgeAc(ONE),
    e_ad' = edgeAd(ONE),
    e_bc' = edgeBc(ONE),
    e_bd' = edgeBd(ONE),
    e_cd' = edgeCd(ONE),
    r_ab' = false,
    r_ac' = false,
    r_ad' = false,
    r_bc' = false,
    r_bd' = false,
    r_cd' = false,
    layer_a' = ZERO,
    layer_b' = ZERO,
    layer_c' = ZERO,
    layer_d' = ZERO,
    s_00' = ZERO,
    s_01' = ZERO,
    s_10' = ZERO,
    s_11' = ZERO,
    s_20' = ZERO,
    s_21' = ZERO,
    s_30' = ZERO,
    s_31' = ZERO,
    phase' = ZERO
    }
  }

  action set_graph = {
    nondet pick = Set(1, 2, 3, 4, 5, 6).oneOf()
    all {
    e_ab' = edgeAb(pick),
    e_ac' = edgeAc(pick),
    e_ad' = edgeAd(pick),
    e_bc' = edgeBc(pick),
    e_bd' = edgeBd(pick),
    e_cd' = edgeCd(pick),
    r_ab' = false,
    r_ac' = false,
    r_ad' = false,
    r_bc' = false,
    r_bd' = false,
    r_cd' = false,
    layer_a' = ZERO,
    layer_b' = ZERO,
    layer_c' = ZERO,
    layer_d' = ZERO,
    s_00' = ZERO,
    s_01' = ZERO,
    s_10' = ZERO,
    s_11' = ZERO,
    s_20' = ZERO,
    s_21' = ZERO,
    s_30' = ZERO,
    s_31' = ZERO,
    phase' = ZERO
    }
  }

  action break_cycles = {
    all {
    e_ab' = e_ab,
    e_ac' = e_ac,
    e_ad' = e_ad,
    e_bc' = e_bc,
    e_bd' = e_bd,
    e_cd' = e_cd,
    r_ab' = if (phase == ZERO) flips(e_ab) else r_ab,
    r_ac' = if (phase == ZERO) flips(e_ac) else r_ac,
    r_ad' = if (phase == ZERO) flips(e_ad) else r_ad,
    r_bc' = if (phase == ZERO) flips(e_bc) else r_bc,
    r_bd' = if (phase == ZERO) flips(e_bd) else r_bd,
    r_cd' = if (phase == ZERO) flips(e_cd) else r_cd,
    layer_a' = layer_a,
    layer_b' = layer_b,
    layer_c' = layer_c,
    layer_d' = layer_d,
    s_00' = s_00,
    s_01' = s_01,
    s_10' = s_10,
    s_11' = s_11,
    s_20' = s_20,
    s_21' = s_21,
    s_30' = s_30,
    s_31' = s_31,
    phase' = if (phase == ZERO) ONE else phase
    }
  }

  action assign_layers = {
    all {
    e_ab' = e_ab,
    e_ac' = e_ac,
    e_ad' = e_ad,
    e_bc' = e_bc,
    e_bd' = e_bd,
    e_cd' = e_cd,
    r_ab' = r_ab,
    r_ac' = r_ac,
    r_ad' = r_ad,
    r_bc' = r_bc,
    r_bd' = r_bd,
    r_cd' = r_cd,
    layer_a' = if (phase == ONE) ZERO else layer_a,
    layer_b' = if (phase == ONE) layerOfB(e_ab) else layer_b,
    layer_c' = if (phase == ONE) layerOfC(e_ac, e_bc, e_ab) else layer_c,
    layer_d' = if (phase == ONE) layerOfD(e_ad, e_bd, e_cd, e_ab, e_ac, e_bc) else layer_d,
    s_00' = s_00,
    s_01' = s_01,
    s_10' = s_10,
    s_11' = s_11,
    s_20' = s_20,
    s_21' = s_21,
    s_30' = s_30,
    s_31' = s_31,
    phase' = if (phase == ONE) TWO else phase
    }
  }

  action order_slots = {
    all {
    e_ab' = e_ab,
    e_ac' = e_ac,
    e_ad' = e_ad,
    e_bc' = e_bc,
    e_bd' = e_bd,
    e_cd' = e_cd,
    r_ab' = r_ab,
    r_ac' = r_ac,
    r_ad' = r_ad,
    r_bc' = r_bc,
    r_bd' = r_bd,
    r_cd' = r_cd,
    layer_a' = layer_a,
    layer_b' = layer_b,
    layer_c' = layer_c,
    layer_d' = layer_d,
    s_00' = if (phase == TWO) firstNode(ZERO) else s_00,
    s_01' = if (phase == TWO) slotOne(ZERO) else s_01,
    s_10' = if (phase == TWO) firstNode(ONE) else s_10,
    s_11' = if (phase == TWO) slotOne(ONE) else s_11,
    s_20' = if (phase == TWO) firstNode(TWO) else s_20,
    s_21' = if (phase == TWO) slotOne(TWO) else s_21,
    s_30' = if (phase == TWO) firstNode(THREE) else s_30,
    s_31' = if (phase == TWO) slotOne(THREE) else s_31,
    phase' = if (phase == TWO) THREE else phase
    }
  }

  action step = any { init, set_graph, break_cycles, assign_layers, order_slots }

  val GraphWellFormed: bool =
    and(e_ab >= ZERO, and(e_ab <= TWO, and(e_ac >= ZERO, and(e_ac <= TWO, and(e_ad >= ZERO, and(e_ad <= TWO, and(e_bc >= ZERO, and(e_bc <= TWO, and(e_bd >= ZERO, and(e_bd <= TWO, and(e_cd >= ZERO, e_cd <= TWO)))))))))))

  val PhaseInRange: bool = and(phase >= ZERO, phase <= THREE)

  val ReversedOnlyBackwards: bool =
    if (phase == ZERO)
      and(not(r_ab), and(not(r_ac), and(not(r_ad), and(not(r_bc), and(not(r_bd), not(r_cd))))))
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

  val LayersOnlyAfterLayering: bool =
    if (phase < TWO)
      and(layer_a == ZERO, and(layer_b == ZERO, and(layer_c == ZERO, layer_d == ZERO)))
    else layer_a == ZERO

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

  val SlotsEmptyBeforeOrdering: bool =
    or(
      phase == THREE,
      and(
        s_00 == ZERO,
        and(s_01 == ZERO, and(s_10 == ZERO, and(s_11 == ZERO, and(s_20 == ZERO, and(s_21 == ZERO, and(s_30 == ZERO, s_31 == ZERO)))))),
      ),
    )

  // a layer is filled only if the layer exists, and no layer is empty below a filled one
  val SlotsDense: bool =
    or(
      phase < THREE,
      and(
        s_00 != ZERO,
        and(
          (s_10 != ZERO) == (layers > ONE),
          and((s_20 != ZERO) == (layers > TWO), (s_30 != ZERO) == (layers > THREE)),
        ),
      ),
    )

  // every node sits in a slot of its own layer, and no other layer's
  val NodesInTheirLayers: bool =
    or(
      phase < THREE,
      and(
        inSlots(ZERO, A) == (layer_a == ZERO),
        and(
          inSlots(ZERO, B) == (layer_b == ZERO),
          and(
            inSlots(ZERO, C) == (layer_c == ZERO),
            and(
              inSlots(ZERO, D) == (layer_d == ZERO),
              and(
                inSlots(ONE, A) == (layer_a == ONE),
                and(
                  inSlots(ONE, B) == (layer_b == ONE),
                  and(
                    inSlots(ONE, C) == (layer_c == ONE),
                    and(
                      inSlots(ONE, D) == (layer_d == ONE),
                      and(
                        inSlots(TWO, A) == (layer_a == TWO),
                        and(
                          inSlots(TWO, B) == (layer_b == TWO),
                          and(
                            inSlots(TWO, C) == (layer_c == TWO),
                            and(
                              inSlots(TWO, D) == (layer_d == TWO),
                              and(
                                inSlots(THREE, A) == (layer_a == THREE),
                                and(
                                  inSlots(THREE, B) == (layer_b == THREE),
                                  and(
                                    inSlots(THREE, C) == (layer_c == THREE),
                                    inSlots(THREE, D) == (layer_d == THREE),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    )

  // within a layer the nodes follow the model order
  val NodesInModelOrder: bool =
    or(
      phase < THREE,
      and(
        or(not(and(isNode(s_00), isNode(s_01))), s_00 < s_01),
        and(
          or(not(and(isNode(s_10), isNode(s_11))), s_10 < s_11),
          and(
            or(not(and(isNode(s_20), isNode(s_21))), s_20 < s_21),
            or(not(and(isNode(s_30), isNode(s_31))), s_30 < s_31),
          ),
        ),
      ),
    )

  // a layer's dummy, if it has one, is exactly the pair that passes through it
  val DummyInItsLayer: bool =
    or(
      phase < THREE,
      and(
        dummyInSlots(ZERO) == dummyAt(ZERO),
        and(
          dummyInSlots(ONE) == dummyAt(ONE),
          and(dummyInSlots(TWO) == dummyAt(TWO), dummyInSlots(THREE) == dummyAt(THREE)),
        ),
      ),
    )

  // the two slots can hold three occupants only if no layer ever needs them: a layer with two nodes has no dummy through it
  val NoCrowdedLayer: bool =
    or(
      phase < THREE,
      and(
        or(secondNode(ZERO) == ZERO, dummyAt(ZERO) == ZERO),
        and(
          or(secondNode(ONE) == ZERO, dummyAt(ONE) == ZERO),
          and(
            or(secondNode(TWO) == ZERO, dummyAt(TWO) == ZERO),
            or(secondNode(THREE) == ZERO, dummyAt(THREE) == ZERO),
          ),
        ),
      ),
    )

  val AtMostOneLongEdgePerLayer: bool =
    or(
      phase < THREE,
      and(
        longCount(ZERO) <= ONE,
        and(longCount(ONE) <= ONE, and(longCount(TWO) <= ONE, longCount(THREE) <= ONE)),
      ),
    )
}
