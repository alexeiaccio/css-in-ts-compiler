// The layered pipeline with slots and edge labels: after the slots are ordered, every edge label takes the middle of the
// boundaries its edge crosses and a track of its own at that boundary.
//
// Source: the same ELK pipeline as `graph-layout.qnt` (cycle breaking by model order, longest-path layering), the slots of
// `graph-layout-slots.qnt` (a long edge is a chain of dummies), plus the discrete half of the engine's `label`: which boundary
// a route's label sits at, and its order among the labels there. The six graphs are the same fixture. Pixels are not here.
//
// MODELLED: the six graphs of `graph-layout.qnt` and their slots, and phase 4 `place_labels`. Per pair (`ab, ac, ad, bc, bd,
// cd`) two values: the label's boundary `l_<pair>`, one-based with 0 for "no label" (so the state has no negative number and
// an absent pair is a zero), and its track `o_<pair>`, 0 the topmost at that boundary. The boundary is the middle of the ones
// the edge crosses, `first + (last - first - 1) / 2`, which for a one-boundary edge is that boundary and for a two-boundary
// edge the first of them. The track is the count of labels at the same boundary whose key is smaller, the key being the
// edge's right-side slot in the next layer and then the pair's model order — so ties at one slot (two edges into one node)
// follow `ab < ac < ad < bc < bd < cd`.
//
// NOT MODELLED:
//   - Label sizes, widths, the channel band and every pixel: a label's box is the skin's, the engine's `label` measures it.
//   - The y stacking that keeps two labels apart once their heights are known, and the greedy first-fit it is measured
//     against: both are about sizes, which a discrete model does not carry.
//   - More than six labels, or a boundary with more than six: the bounds of four nodes and six pairs, not widened.
//   - Labels of loops: none of the six graphs has a self loop, and a loop's label has no boundary to sit between.
//   - Multi-edges: a pair is one edge either way, as in the first two slices; two edges between the same nodes are one line.
//
// Generator gaps hit: no collections, so the labels are twelve named vars and the key of a pair is a def over its own code;
// primes are not expressions, so `place_labels` writes each value from a def over the layers and slots it is leaving, never
// from a value it is writing.
module patterns_graph_layout_labels {
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
  var l_ab: int // phase 4: the label's boundary, 1-based, 0 when the pair has no label
  var l_ac: int
  var l_ad: int
  var l_bc: int
  var l_bd: int
  var l_cd: int
  var o_ab: int // phase 4: the label's track at that boundary, 0 the topmost
  var o_ac: int
  var o_ad: int
  var o_bc: int
  var o_bd: int
  var o_cd: int
  var phase: int // 0 input, 1 broken, 2 layered, 3 slotted, 4 labelled

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
  // a label's boundary is the middle of the ones its edge crosses: one-based, 0 when the pair has no label
  def middle(first: int, last: int): int = first + (last - first - ONE) / TWO + ONE

  // the occupant of boundary `b`'s next layer on the edge's right side: the target node, or the pair's dummy there
  def rightOf(b: int, last: int, target: int, pair: int): int = if (b == last) target else pair

  def slotAt(L: int, k: int): int =
    if (L == ZERO) (if (k == ZERO) s_00 else s_01)
    else if (L == ONE) (if (k == ZERO) s_10 else s_11)
    else if (L == TWO) (if (k == ZERO) s_20 else s_21)
    else (if (k == ZERO) s_30 else s_31)

  def slotIndexOf(L: int, code: int): int = if (slotAt(L, ZERO) == code) ZERO else ONE

  // the key of a pair's label at boundary b: the right-side slot first, then the pair's model order as its code
  def keyOf(b: int, last: int, target: int, pair: int): int =
    if (b == ZERO) ZERO else slotIndexOf(b, rightOf(b, last, target, pair)) * SIX + pair

  def labAb: int = if (has(e_ab)) middle(layer_a, layer_b) else ZERO
  def labAc: int = if (has(e_ac)) middle(layer_a, layer_c) else ZERO
  def labAd: int = if (has(e_ad)) middle(layer_a, layer_d) else ZERO
  def labBc: int = if (has(e_bc)) middle(layer_b, layer_c) else ZERO
  def labBd: int = if (has(e_bd)) middle(layer_b, layer_d) else ZERO
  def labCd: int = if (has(e_cd)) middle(layer_c, layer_d) else ZERO

  def keyAb: int = keyOf(labAb, layer_b, B, AB)
  def keyAc: int = keyOf(labAc, layer_c, C, AC)
  def keyAd: int = keyOf(labAd, layer_d, D, AD)
  def keyBc: int = keyOf(labBc, layer_c, C, BC)
  def keyBd: int = keyOf(labBd, layer_d, D, BD)
  def keyCd: int = keyOf(labCd, layer_d, D, CD)

  def rankAb: int =
    (if (and(labAc == labAb, keyAc < keyAb)) ONE else ZERO) +
    (if (and(labAd == labAb, keyAd < keyAb)) ONE else ZERO) +
    (if (and(labBc == labAb, keyBc < keyAb)) ONE else ZERO) +
    (if (and(labBd == labAb, keyBd < keyAb)) ONE else ZERO) +
    (if (and(labCd == labAb, keyCd < keyAb)) ONE else ZERO)
  def rankAc: int =
    (if (and(labAb == labAc, keyAb < keyAc)) ONE else ZERO) +
    (if (and(labAd == labAc, keyAd < keyAc)) ONE else ZERO) +
    (if (and(labBc == labAc, keyBc < keyAc)) ONE else ZERO) +
    (if (and(labBd == labAc, keyBd < keyAc)) ONE else ZERO) +
    (if (and(labCd == labAc, keyCd < keyAc)) ONE else ZERO)
  def rankAd: int =
    (if (and(labAb == labAd, keyAb < keyAd)) ONE else ZERO) +
    (if (and(labAc == labAd, keyAc < keyAd)) ONE else ZERO) +
    (if (and(labBc == labAd, keyBc < keyAd)) ONE else ZERO) +
    (if (and(labBd == labAd, keyBd < keyAd)) ONE else ZERO) +
    (if (and(labCd == labAd, keyCd < keyAd)) ONE else ZERO)
  def rankBc: int =
    (if (and(labAb == labBc, keyAb < keyBc)) ONE else ZERO) +
    (if (and(labAc == labBc, keyAc < keyBc)) ONE else ZERO) +
    (if (and(labAd == labBc, keyAd < keyBc)) ONE else ZERO) +
    (if (and(labBd == labBc, keyBd < keyBc)) ONE else ZERO) +
    (if (and(labCd == labBc, keyCd < keyBc)) ONE else ZERO)
  def rankBd: int =
    (if (and(labAb == labBd, keyAb < keyBd)) ONE else ZERO) +
    (if (and(labAc == labBd, keyAc < keyBd)) ONE else ZERO) +
    (if (and(labAd == labBd, keyAd < keyBd)) ONE else ZERO) +
    (if (and(labBc == labBd, keyBc < keyBd)) ONE else ZERO) +
    (if (and(labCd == labBd, keyCd < keyBd)) ONE else ZERO)
  def rankCd: int =
    (if (and(labAb == labCd, keyAb < keyCd)) ONE else ZERO) +
    (if (and(labAc == labCd, keyAc < keyCd)) ONE else ZERO) +
    (if (and(labAd == labCd, keyAd < keyCd)) ONE else ZERO) +
    (if (and(labBc == labCd, keyBc < keyCd)) ONE else ZERO) +
    (if (and(labBd == labCd, keyBd < keyCd)) ONE else ZERO)


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
    l_ab' = ZERO,
    l_ac' = ZERO,
    l_ad' = ZERO,
    l_bc' = ZERO,
    l_bd' = ZERO,
    l_cd' = ZERO,
    o_ab' = ZERO,
    o_ac' = ZERO,
    o_ad' = ZERO,
    o_bc' = ZERO,
    o_bd' = ZERO,
    o_cd' = ZERO,
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
    l_ab' = ZERO,
    l_ac' = ZERO,
    l_ad' = ZERO,
    l_bc' = ZERO,
    l_bd' = ZERO,
    l_cd' = ZERO,
    o_ab' = ZERO,
    o_ac' = ZERO,
    o_ad' = ZERO,
    o_bc' = ZERO,
    o_bd' = ZERO,
    o_cd' = ZERO,
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
    l_ab' = l_ab,
    l_ac' = l_ac,
    l_ad' = l_ad,
    l_bc' = l_bc,
    l_bd' = l_bd,
    l_cd' = l_cd,
    o_ab' = o_ab,
    o_ac' = o_ac,
    o_ad' = o_ad,
    o_bc' = o_bc,
    o_bd' = o_bd,
    o_cd' = o_cd,
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
    l_ab' = l_ab,
    l_ac' = l_ac,
    l_ad' = l_ad,
    l_bc' = l_bc,
    l_bd' = l_bd,
    l_cd' = l_cd,
    o_ab' = o_ab,
    o_ac' = o_ac,
    o_ad' = o_ad,
    o_bc' = o_bc,
    o_bd' = o_bd,
    o_cd' = o_cd,
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
    l_ab' = l_ab,
    l_ac' = l_ac,
    l_ad' = l_ad,
    l_bc' = l_bc,
    l_bd' = l_bd,
    l_cd' = l_cd,
    o_ab' = o_ab,
    o_ac' = o_ac,
    o_ad' = o_ad,
    o_bc' = o_bc,
    o_bd' = o_bd,
    o_cd' = o_cd,
    phase' = if (phase == TWO) THREE else phase
    }
  }

  action place_labels = {
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
    s_00' = s_00,
    s_01' = s_01,
    s_10' = s_10,
    s_11' = s_11,
    s_20' = s_20,
    s_21' = s_21,
    s_30' = s_30,
    s_31' = s_31,
    l_ab' = if (phase == THREE) labAb else l_ab,
    l_ac' = if (phase == THREE) labAc else l_ac,
    l_ad' = if (phase == THREE) labAd else l_ad,
    l_bc' = if (phase == THREE) labBc else l_bc,
    l_bd' = if (phase == THREE) labBd else l_bd,
    l_cd' = if (phase == THREE) labCd else l_cd,
    o_ab' = if (phase == THREE) rankAb else o_ab,
    o_ac' = if (phase == THREE) rankAc else o_ac,
    o_ad' = if (phase == THREE) rankAd else o_ad,
    o_bc' = if (phase == THREE) rankBc else o_bc,
    o_bd' = if (phase == THREE) rankBd else o_bd,
    o_cd' = if (phase == THREE) rankCd else o_cd,
    phase' = if (phase == THREE) FOUR else phase
    }
  }

  action step = any { init, set_graph, break_cycles, assign_layers, order_slots, place_labels }

  val GraphWellFormed: bool =
    and(e_ab >= ZERO, and(e_ab <= TWO, and(e_ac >= ZERO, and(e_ac <= TWO, and(e_ad >= ZERO, and(e_ad <= TWO, and(e_bc >= ZERO, and(e_bc <= TWO, and(e_bd >= ZERO, and(e_bd <= TWO, and(e_cd >= ZERO, e_cd <= TWO)))))))))))

  val PhaseInRange: bool = and(phase >= ZERO, phase <= FOUR)

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
      phase >= THREE,
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
  // an absent pair has no label, and a label sits strictly between the boundaries its edge crosses
  val LabelOnSpan: bool =
    or(
      phase < FOUR,
      and(
        if (has(e_ab)) and(layer_a < l_ab, l_ab <= layer_b) else l_ab == ZERO,
        if (has(e_ac)) and(layer_a < l_ac, l_ac <= layer_c) else l_ac == ZERO,
        if (has(e_ad)) and(layer_a < l_ad, l_ad <= layer_d) else l_ad == ZERO,
        if (has(e_bc)) and(layer_b < l_bc, l_bc <= layer_c) else l_bc == ZERO,
        if (has(e_bd)) and(layer_b < l_bd, l_bd <= layer_d) else l_bd == ZERO,
        if (has(e_cd)) and(layer_c < l_cd, l_cd <= layer_d) else l_cd == ZERO,
      ),
    )

  // the boundary is the middle of the ones the edge crosses, `first + (last - first - 1) / 2`, one-based
  val MiddleBoundary: bool =
    or(
      phase < FOUR,
      and(
        l_ab == labAb,
        l_ac == labAc,
        l_ad == labAd,
        l_bc == labBc,
        l_bd == labBd,
        l_cd == labCd,
      ),
    )

  // two labels at one boundary are never on one track
  def apartIs(bOne: int, oOne: int, bTwo: int, oTwo: int): bool =
    or(bOne == ZERO, or(bTwo == ZERO, or(bOne != bTwo, oOne != oTwo)))

  val DistinctTracks: bool =
    or(
      phase < FOUR,
      and(
        apartIs(l_ab, o_ab, l_ac, o_ac),
        apartIs(l_ab, o_ab, l_ad, o_ad),
        apartIs(l_ab, o_ab, l_bc, o_bc),
        apartIs(l_ab, o_ab, l_bd, o_bd),
        apartIs(l_ab, o_ab, l_cd, o_cd),
        apartIs(l_ac, o_ac, l_ad, o_ad),
        apartIs(l_ac, o_ac, l_bc, o_bc),
        apartIs(l_ac, o_ac, l_bd, o_bd),
        apartIs(l_ac, o_ac, l_cd, o_cd),
        apartIs(l_ad, o_ad, l_bc, o_bc),
        apartIs(l_ad, o_ad, l_bd, o_bd),
        apartIs(l_ad, o_ad, l_cd, o_cd),
        apartIs(l_bc, o_bc, l_bd, o_bd),
        apartIs(l_bc, o_bc, l_cd, o_cd),
        apartIs(l_bd, o_bd, l_cd, o_cd),
      ),
    )

  // at one boundary the tracks run in the order of the right-side slots, ties in the pairs' model order
  def orderedBy(
    bOne: int,
    oOne: int,
    kOne: int,
    bTwo: int,
    oTwo: int,
    kTwo: int,
  ): bool = or(bOne == ZERO, or(bTwo == ZERO, or(bOne != bTwo, (oOne < oTwo) == (kOne < kTwo))))

  val TrackOrder: bool =
    or(
      phase < FOUR,
      and(
        orderedBy(l_ab, o_ab, keyAb, l_ac, o_ac, keyAc),
        orderedBy(l_ab, o_ab, keyAb, l_ad, o_ad, keyAd),
        orderedBy(l_ab, o_ab, keyAb, l_bc, o_bc, keyBc),
        orderedBy(l_ab, o_ab, keyAb, l_bd, o_bd, keyBd),
        orderedBy(l_ab, o_ab, keyAb, l_cd, o_cd, keyCd),
        orderedBy(l_ac, o_ac, keyAc, l_ad, o_ad, keyAd),
        orderedBy(l_ac, o_ac, keyAc, l_bc, o_bc, keyBc),
        orderedBy(l_ac, o_ac, keyAc, l_bd, o_bd, keyBd),
        orderedBy(l_ac, o_ac, keyAc, l_cd, o_cd, keyCd),
        orderedBy(l_ad, o_ad, keyAd, l_bc, o_bc, keyBc),
        orderedBy(l_ad, o_ad, keyAd, l_bd, o_bd, keyBd),
        orderedBy(l_ad, o_ad, keyAd, l_cd, o_cd, keyCd),
        orderedBy(l_bc, o_bc, keyBc, l_bd, o_bd, keyBd),
        orderedBy(l_bc, o_bc, keyBc, l_cd, o_cd, keyCd),
        orderedBy(l_bd, o_bd, keyBd, l_cd, o_cd, keyCd),
      ),
    )

}
