// Resizable panels: a group of N panes and N-1 separators (bean cssints-pyit).
//
// Not an APG pattern: it is a group of APG window splitters, so the vocabulary
// and the keyboard contract come from windowsplitter.qnt, the layout from
// react-resizable-panels. Researched for the decisions below:
//   - react-resizable-panels v4 (bvaughn): panels carry min/max in % of the
//     group, `collapsible` + `collapsedSize`, a layout is a list of percentages
//     that always sums to 100, `onLayoutChange` fires on every pointer move and
//     `onLayoutChanged` on release (persist there), drag is pointer capture,
//     double-click resets to the default layout, Home/End and arrows resize,
//     Enter toggles collapse.
//   - Radix/Ark splitter: the same model (sizes %, min/max, collapsible, arrows,
//     Enter), one separator between two neighbours.
//   - APG window splitter: the separator is the focusable widget; aria-valuenow
//     is the size of the pane it resizes (aria-controls), aria-valuemin / -max
//     its bounds, orientation names the bar, arrows move by a step, Home/End are
//     optional jumps, Enter collapses and restores, F6 cycles panes.
//
// MODELLED: three panes in percentages on a 10% grid, 100 in total, MIN 10 and
// MAX 80 per pane, pane 0 collapsible at collapsedSize 0. One separator sits
// between each pair, its aria-valuenow is the size of the pane on its left.
// Focus is per separator (the group's tab stops; no F6: with three panes the
// cycle buys nothing a Tab does not, so the primitive leaves it out).
//
// A MOVE (arrow, Home/End, drag) changes only the separator's two neighbours:
// pane i grows or shrinks, pane i+1 takes the opposite amount, and the result is
// clamped by BOTH panes' bounds (no cascade past the neighbour). Collapsing pane
// 0 gives its space to the nearest pane that can take it and cascades outward
// (pane 1 up to MAX, then pane 2); restoring takes it back in the same order, so
// a restore always returns exactly the remembered size (prev0 <= 80 and the
// panes right of a collapsed pane hold 100, so the space is always there).
// A separator next to a collapsed pane is immovable: its arrows and its drag are
// no-ops, and only Enter (the restore) acts. Collapsed size 0 is the collapsed
// state; a pane cannot be dragged below MIN while expanded.
//
// DRAG is snapshot + delta, as in canvas/pointer.qnt: pointerdown remembers the
// layout (k0..k2) and the separator (dr), each move adds NOTCH to the delta (dd,
// bounded to +/-100) and the layout is re-solved from the snapshot, never
// accumulated, so dragging back past a clamp recovers exactly. pointerup ends
// the drag (the newest pointerdown takes over and re-snapshots); a host write
// cancels it. A drag never changes a pane outside its
// pair (DragMovesOnlyNeighbours).
//
// REQUEST VS COMMIT is the windowsplitter contract (map ticket rt1p), applied to
// the whole layout: every move requests the target layout (rq0..rq2) and bumps
// `requests` when it differs from the current sizes; uncontrolled (or a
// controlled host that accepts, `accepting`) commits it, a controlled host that
// holds ignores it ("rejected"). The host writes the layout with hostEqual /
// hostWide / hostNarrow / hostCollapsed (the only commit while controlled) and
// settles `outcome` back to "none". base0..base2 is the layout a request found.
//
// NOT MODELLED: pane min/max other than 10/80, collapsedSize other than 0, more
// than three panes (the primitive takes N; this model is the three-pane instance
// its tests run), collapsing a pane other than pane 0, the collapsed threshold
// react-resizable-panels uses (a pane collapses on Enter or at the host's
// request, never by dragging through MIN), persistence (host storage), nested
// groups, and F6.
//
// GENERATOR GAPS HIT: no parameterized actions and no collections, so a drag
// delta is a bounded int advanced by dragNext/dragPrev and the three sizes are
// three vars; every action assigns every var.
module patterns_resizable_panels {
  import aria.* from "../../shared/aria"

  var o: str            // orientation: "vertical" (columns) | "horizontal" (rows)
  var s0: int           // committed size of pane 0, in percent (0 = collapsed)
  var s1: int           // pane 1
  var s2: int           // pane 2
  var prev0: int        // pane 0's size remembered at its last collapse
  var focus: str        // "none" | "sep0" | "sep1"
  var justRestored: bool // the last event was an Enter that restored pane 0
  var rq0: int          // target of the last request: pane 0
  var rq1: int          // pane 1
  var rq2: int          // pane 2
  var b0: int           // sizes when the last request was received
  var b1: int
  var b2: int
  var k0: int           // pointerdown snapshot of a drag
  var k1: int
  var k2: int
  var dd: int           // drag delta since pointerdown, percent
  var dr: int           // separator being dragged (-1 = none)
  var outcome: str      // "none" | "accepted" | "rejected"
  var controlled: bool  // the host owns the layout (`sizes` prop present)
  var accepting: bool   // controlled host that answers every request with its intent
  var requests: int     // onSizesChange calls

  def MIN: int = 10
  def MAX: int = 80
  def ZERO: int = 0
  def FULL: int = 100
  def STEP: int = 10
  def NOTCH: int = 10
  def DMAX: int = 100
  def FAR: int = 100
  def INIT0: int = 20
  def INIT1: int = 40
  def INIT2: int = 40

  def clampI(v: int, lo: int, hi: int): int = if (v < lo) lo else if (v > hi) hi else v
  def minI(a: int, b: int): int = if (a < b) a else b
  def maxI(a: int, b: int): int = if (a > b) a else b

  // --- the layout ---------------------------------------------------------
  def isCollapsed(i: int): bool = and(i == 0, s0 == ZERO)
  def onSep(i: int): bool = focus == (if (i == 0) "sep0" else "sep1")
  def sepA(i: int): int = if (i == 0) s0 else s1
  def sepB(i: int): int = if (i == 0) s1 else s2
  // the new size of the left pane of a pair (a, b) moved by d, clamped by both
  def solved(a: int, b: int, d: int): int =
    clampI(a + d, maxI(MIN, a + b - MAX), minI(MAX, a + b - MIN))

  // the focused separator, or -1
  def fIdx: int = if (focus == "sep0") 0 else if (focus == "sep1") 1 else 0 - 1
  def fA: int = sepA(fIdx)
  def fB: int = sepB(fIdx)
  def fMovable: bool = and(fIdx >= 0, and(not(isCollapsed(fIdx)), not(isCollapsed(fIdx + 1))))
  // the pointer owns the interaction while a drag runs: keys are no-ops then
  def dragging: bool = dr >= 0
  def arrowA(axis: str, d: int): int =
    if (and(fMovable, and(o == axis, not(dragging)))) solved(fA, fB, d) else fA
  def jumpA(d: int): int = if (and(fMovable, not(dragging))) solved(fA, fB, d) else fA
  // the requested layout after the focused separator's left pane becomes na
  def triple0(na: int): int = if (fIdx == 0) na else s0
  def triple1(na: int): int = if (fIdx == 0) fA + fB - na else if (fIdx == 1) na else s1
  def triple2(na: int): int = if (fIdx == 1) fA + fB - na else s2

  // --- collapse / restore (pane 0 only) -----------------------------------
  def enterOn: bool = and(focus == "sep0", not(dragging))
  def collapsedNow: bool = s0 == ZERO
  def restGive1: int = minI(prev0, s1 - MIN)
  def enterA: int = if (enterOn) (if (collapsedNow) prev0 else ZERO) else s0
  def enterB: int =
    if (enterOn) (if (collapsedNow) s1 - restGive1 else minI(s0 + s1, MAX)) else s1
  def enterC: int = if (enterOn) FULL - enterA - enterB else s2

  // --- drag (snapshot + delta) --------------------------------------------
  def dragOk: bool = and(dr >= 0, and(not(isCollapsed(dr)), not(isCollapsed(dr + 1))))
  def dragA: int = if (dr == 0) k0 else k1
  def dragB: int = if (dr == 0) k1 else k2
  def dragSolved(d: int): int = if (dragOk) solved(dragA, dragB, d) else dragA
  def dragT0(d: int): int = if (dragOk) (if (dr == 0) dragSolved(d) else k0) else s0
  def dragT1(d: int): int =
    if (dragOk) (if (dr == 0) dragA + dragB - dragSolved(d) else dragSolved(d)) else s1
  def dragT2(d: int): int = if (dragOk) (if (dr == 1) dragA + dragB - dragSolved(d) else k2) else s2
  def ddNext(d: int): int = clampI(dd + d, 0 - DMAX, DMAX)

  // --- request / commit ---------------------------------------------------
  def holds: bool = and(controlled, not(accepting))
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, v: int, want: int): int = if (h) v else want
  def differs(a0: int, a1: int, a2: int): bool = or(s0 != a0, or(s1 != a1, s2 != a2))
  def moved(a0: int, a1: int, a2: int): int = if (differs(a0, a1, a2)) 1 else 0
  def enterChanged: bool = differs(enterA, enterB, enterC)
  def rejectedEnter: bool = and(holds, enterChanged)

  def left0: int = triple0(arrowA("vertical", 0 - STEP))
  def left1: int = triple1(arrowA("vertical", 0 - STEP))
  def left2: int = triple2(arrowA("vertical", 0 - STEP))
  def leftChanged: bool = differs(left0, left1, left2)

  def right0: int = triple0(arrowA("vertical", STEP))
  def right1: int = triple1(arrowA("vertical", STEP))
  def right2: int = triple2(arrowA("vertical", STEP))
  def rightChanged: bool = differs(right0, right1, right2)

  def up0: int = triple0(arrowA("horizontal", 0 - STEP))
  def up1: int = triple1(arrowA("horizontal", 0 - STEP))
  def up2: int = triple2(arrowA("horizontal", 0 - STEP))
  def upChanged: bool = differs(up0, up1, up2)

  def down0: int = triple0(arrowA("horizontal", STEP))
  def down1: int = triple1(arrowA("horizontal", STEP))
  def down2: int = triple2(arrowA("horizontal", STEP))
  def downChanged: bool = differs(down0, down1, down2)

  def home0: int = triple0(jumpA(0 - FAR))
  def home1: int = triple1(jumpA(0 - FAR))
  def home2: int = triple2(jumpA(0 - FAR))
  def homeChanged: bool = differs(home0, home1, home2)

  def end0: int = triple0(jumpA(FAR))
  def end1: int = triple1(jumpA(FAR))
  def end2: int = triple2(jumpA(FAR))
  def endChanged: bool = differs(end0, end1, end2)

  def dragNextD: int = ddNext(NOTCH)
  def dragNext0: int = dragT0(dragNextD)
  def dragNext1: int = dragT1(dragNextD)
  def dragNext2: int = dragT2(dragNextD)
  def dragNextChanged: bool = differs(dragNext0, dragNext1, dragNext2)

  def dragPrevD: int = ddNext(0 - NOTCH)
  def dragPrev0: int = dragT0(dragPrevD)
  def dragPrev1: int = dragT1(dragPrevD)
  def dragPrev2: int = dragT2(dragPrevD)
  def dragPrevChanged: bool = differs(dragPrev0, dragPrev1, dragPrev2)

  action init = all {
    o' = "vertical",
    s0' = INIT0,
    s1' = INIT1,
    s2' = INIT2,
    prev0' = INIT0,
    focus' = "none",
    justRestored' = false,
    rq0' = INIT0,
    rq1' = INIT1,
    rq2' = INIT2,
    b0' = INIT0,
    b1' = INIT1,
    b2' = INIT2,
    k0' = INIT0,
    k1' = INIT1,
    k2' = INIT2,
    dd' = 0,
    dr' = 0 - 1,
    outcome' = "none",
    controlled' = false,
    accepting' = false,
    requests' = 0
  }

  action focusSep0 = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = "sep0",
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action focusSep1 = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = "sep1",
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action blur = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = "none",
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action left = all {
    o' = o,
    s0' = landed(holds, s0, left0),
    s1' = landed(holds, s1, left1),
    s2' = landed(holds, s2, left2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (leftChanged) left0 else rq0,
    rq1' = if (leftChanged) left1 else rq1,
    rq2' = if (leftChanged) left2 else rq2,
    b0' = if (leftChanged) s0 else b0,
    b1' = if (leftChanged) s1 else b1,
    b2' = if (leftChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (leftChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(left0, left1, left2)
  }

  action right = all {
    o' = o,
    s0' = landed(holds, s0, right0),
    s1' = landed(holds, s1, right1),
    s2' = landed(holds, s2, right2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (rightChanged) right0 else rq0,
    rq1' = if (rightChanged) right1 else rq1,
    rq2' = if (rightChanged) right2 else rq2,
    b0' = if (rightChanged) s0 else b0,
    b1' = if (rightChanged) s1 else b1,
    b2' = if (rightChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (rightChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(right0, right1, right2)
  }

  action up = all {
    o' = o,
    s0' = landed(holds, s0, up0),
    s1' = landed(holds, s1, up1),
    s2' = landed(holds, s2, up2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (upChanged) up0 else rq0,
    rq1' = if (upChanged) up1 else rq1,
    rq2' = if (upChanged) up2 else rq2,
    b0' = if (upChanged) s0 else b0,
    b1' = if (upChanged) s1 else b1,
    b2' = if (upChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (upChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(up0, up1, up2)
  }

  action down = all {
    o' = o,
    s0' = landed(holds, s0, down0),
    s1' = landed(holds, s1, down1),
    s2' = landed(holds, s2, down2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (downChanged) down0 else rq0,
    rq1' = if (downChanged) down1 else rq1,
    rq2' = if (downChanged) down2 else rq2,
    b0' = if (downChanged) s0 else b0,
    b1' = if (downChanged) s1 else b1,
    b2' = if (downChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (downChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(down0, down1, down2)
  }

  action home = all {
    o' = o,
    s0' = landed(holds, s0, home0),
    s1' = landed(holds, s1, home1),
    s2' = landed(holds, s2, home2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (homeChanged) home0 else rq0,
    rq1' = if (homeChanged) home1 else rq1,
    rq2' = if (homeChanged) home2 else rq2,
    b0' = if (homeChanged) s0 else b0,
    b1' = if (homeChanged) s1 else b1,
    b2' = if (homeChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (homeChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(home0, home1, home2)
  }

  action end = all {
    o' = o,
    s0' = landed(holds, s0, end0),
    s1' = landed(holds, s1, end1),
    s2' = landed(holds, s2, end2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (endChanged) end0 else rq0,
    rq1' = if (endChanged) end1 else rq1,
    rq2' = if (endChanged) end2 else rq2,
    b0' = if (endChanged) s0 else b0,
    b1' = if (endChanged) s1 else b1,
    b2' = if (endChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (endChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(end0, end1, end2)
  }

  action enter = all {
    o' = o,
    s0' = landed(holds, s0, enterA),
    s1' = landed(holds, s1, enterB),
    s2' = landed(holds, s2, enterC),
    prev0' = if (rejectedEnter) prev0 else (if (and(enterOn, not(collapsedNow))) s0 else prev0),
    focus' = focus,
    justRestored' = if (rejectedEnter) justRestored else (and(enterOn, collapsedNow)),
    rq0' = if (enterChanged) enterA else rq0,
    rq1' = if (enterChanged) enterB else rq1,
    rq2' = if (enterChanged) enterC else rq2,
    b0' = if (enterChanged) s0 else b0,
    b1' = if (enterChanged) s1 else b1,
    b2' = if (enterChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = if (enterChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(enterA, enterB, enterC)
  }

  action orientVertical = all {
    o' = "vertical",
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action orientHorizontal = all {
    o' = "horizontal",
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action dragDown0 = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = "sep0",
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = if (isCollapsed(0)) k0 else s0,
    k1' = if (isCollapsed(0)) k1 else s1,
    k2' = if (isCollapsed(0)) k2 else s2,
    dd' = if (isCollapsed(0)) dd else 0,
    dr' = if (isCollapsed(0)) dr else 0,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action dragDown1 = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = "sep1",
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = if (isCollapsed(1)) k0 else s0,
    k1' = if (isCollapsed(1)) k1 else s1,
    k2' = if (isCollapsed(1)) k2 else s2,
    dd' = if (isCollapsed(1)) dd else 0,
    dr' = if (isCollapsed(1)) dr else 1,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action dragNext = all {
    o' = o,
    s0' = landed(holds, s0, dragNext0),
    s1' = landed(holds, s1, dragNext1),
    s2' = landed(holds, s2, dragNext2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (dragNextChanged) dragNext0 else rq0,
    rq1' = if (dragNextChanged) dragNext1 else rq1,
    rq2' = if (dragNextChanged) dragNext2 else rq2,
    b0' = if (dragNextChanged) s0 else b0,
    b1' = if (dragNextChanged) s1 else b1,
    b2' = if (dragNextChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dragNextD,
    dr' = dr,
    outcome' = if (dragNextChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(dragNext0, dragNext1, dragNext2)
  }

  action dragPrev = all {
    o' = o,
    s0' = landed(holds, s0, dragPrev0),
    s1' = landed(holds, s1, dragPrev1),
    s2' = landed(holds, s2, dragPrev2),
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = if (dragPrevChanged) dragPrev0 else rq0,
    rq1' = if (dragPrevChanged) dragPrev1 else rq1,
    rq2' = if (dragPrevChanged) dragPrev2 else rq2,
    b0' = if (dragPrevChanged) s0 else b0,
    b1' = if (dragPrevChanged) s1 else b1,
    b2' = if (dragPrevChanged) s2 else b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dragPrevD,
    dr' = dr,
    outcome' = if (dragPrevChanged) verdict else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests + moved(dragPrev0, dragPrev1, dragPrev2)
  }

  action dragUp = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = 0,
    dr' = 0 - 1,
    outcome' = outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action hostEqual = all {
    o' = o,
    s0' = if (controlled) 30 else s0,
    s1' = if (controlled) 30 else s1,
    s2' = if (controlled) 40 else s2,
    prev0' = if (controlled) (if (30 == ZERO) (if (s0 == ZERO) prev0 else s0) else 30) else prev0,
    focus' = focus,
    justRestored' = if (controlled) false else justRestored,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = if (controlled) 0 else dd,
    dr' = if (controlled) 0 - 1 else dr,
    outcome' = if (controlled) "none" else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action hostWide = all {
    o' = o,
    s0' = if (controlled) 50 else s0,
    s1' = if (controlled) 30 else s1,
    s2' = if (controlled) 20 else s2,
    prev0' = if (controlled) (if (50 == ZERO) (if (s0 == ZERO) prev0 else s0) else 50) else prev0,
    focus' = focus,
    justRestored' = if (controlled) false else justRestored,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = if (controlled) 0 else dd,
    dr' = if (controlled) 0 - 1 else dr,
    outcome' = if (controlled) "none" else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action hostNarrow = all {
    o' = o,
    s0' = if (controlled) 10 else s0,
    s1' = if (controlled) 40 else s1,
    s2' = if (controlled) 50 else s2,
    prev0' = if (controlled) (if (10 == ZERO) (if (s0 == ZERO) prev0 else s0) else 10) else prev0,
    focus' = focus,
    justRestored' = if (controlled) false else justRestored,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = if (controlled) 0 else dd,
    dr' = if (controlled) 0 - 1 else dr,
    outcome' = if (controlled) "none" else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action hostCollapsed = all {
    o' = o,
    s0' = if (controlled) ZERO else s0,
    s1' = if (controlled) 50 else s1,
    s2' = if (controlled) 50 else s2,
    prev0' = if (controlled) (if (ZERO == ZERO) (if (s0 == ZERO) prev0 else s0) else ZERO) else prev0,
    focus' = focus,
    justRestored' = if (controlled) false else justRestored,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = if (controlled) 0 else dd,
    dr' = if (controlled) 0 - 1 else dr,
    outcome' = if (controlled) "none" else outcome,
    controlled' = controlled,
    accepting' = accepting,
    requests' = requests
  }

  action control = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = "none",
    controlled' = true,
    accepting' = accepting,
    requests' = requests
  }

  action acceptRequests = all {
    o' = o,
    s0' = s0,
    s1' = s1,
    s2' = s2,
    prev0' = prev0,
    focus' = focus,
    justRestored' = false,
    rq0' = rq0,
    rq1' = rq1,
    rq2' = rq2,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    k0' = k0,
    k1' = k1,
    k2' = k2,
    dd' = dd,
    dr' = dr,
    outcome' = "none",
    controlled' = controlled,
    accepting' = true,
    requests' = requests
  }

  action step = any {
    init, focusSep0, focusSep1, blur, left, right, up, down, home, end, enter, orientVertical, orientHorizontal, dragDown0, dragDown1, dragNext, dragPrev, dragUp, hostEqual, hostWide, hostNarrow, hostCollapsed, control, acceptRequests
  }

  // the three panes are a layout: percentages always add up to 100
  val PaneSizesSumTo100: bool = s0 + s1 + s2 == FULL
  // every pane is inside its own bounds; only pane 0 can sit at collapsedSize
  val PaneInBounds: bool =
    and(s0 >= ZERO, and(s0 <= MAX, and(s1 >= MIN, and(s1 <= MAX, and(s2 >= MIN, s2 <= MAX)))))
  // the remembered size is always a size a pane can have
  val PrevInBounds: bool = and(prev0 >= MIN, prev0 <= MAX)
  // restoring returns pane 0 to exactly the remembered size
  val RestoreReturnsPrev: bool = or(not(justRestored), s0 == prev0)
  // focus is one of the modelled separators
  val FocusKnown: bool = or(focus == "none", or(focus == "sep0", focus == "sep1"))
  // orientation is one of the two APG orientations
  val OrientationKnown: bool = ariaOrientationKnown(o)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // a holding host never sees an accepted request: nothing commits
  val HoldingLayoutStable: bool = or(not(holds), not(outcome == "accepted"))
  // a rejected request leaves the layout as it found it
  val RejectedRequestUntouched: bool =
    or(not(outcome == "rejected"), and(s0 == b0, and(s1 == b1, s2 == b2)))
  // an accepted request committed exactly its target
  val AcceptedRequestCommits: bool =
    or(not(outcome == "accepted"), and(s0 == rq0, and(s1 == rq1, s2 == rq2)))
  // a drag only ever moves the two panes around the dragged separator
  val DragMovesOnlyNeighbours: bool =
    and(or(not(dr == 0), s2 == k2), or(not(dr == 1), s0 == k0))
  // the drag delta stays bounded (the layout is clamped, the delta is not the state)
  val DragDeltaBounded: bool = and(dd >= 0 - DMAX, dd <= DMAX)
}
