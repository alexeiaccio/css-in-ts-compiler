// Infinite canvas: the pointer / interaction machine over a fixed node set.
// Implements docs/research/canvas-prior-art.md (Decision 2, items 4-7). Bean e9jm.
//
// STATES: idle | pointing (down, below the drag threshold) | panning | marquee | dragging.
//   idle -> pointing | panning;  pointing -> marquee | dragging | idle;  panning | marquee |
//   dragging -> idle.  `prev` records the previous mode so OnlyLegalTransitions can check the edge.
//
// WORLD / SCREEN SPLIT (the contract). Pointer positions and the drag threshold are SCREEN
// quantities; the grab point, node geometry, marquee rectangle and snap candidates are WORLD
// quantities. The camera is the camera.qnt convention (world-offset, z = zoom * 4096, t in
// 1/256 world units, round-half-up division); node coordinates are whole world units, pointer-
// derived world points are in 1/256 units ("fp"). The ~10 camera defs below are COPIES of
// camera.qnt's (a spec file cannot import a machine, and shared/ is closed to this ticket):
// test/canvas/pointer.test.ts asserts they are structurally identical.
//
// WHAT IS ENCODED
//   - ONE CAPTURE OWNER: `owner` is the pointer id holding the capture (0 iff idle). While a
//     gesture runs a pointerdown from the other pointer is ignored, as are its moves and ups.
//   - DRAG THRESHOLD in screen px (DRAG_PX = 4, squared distance > 16 leaves `pointing`). The move
//     pool contains positions at 5, 16 (boundary: still pointing) and 25 squared px from the down
//     position, at every zoom.
//   - A DRAG = POINTERDOWN SNAPSHOT + WORLD DELTA: committed node positions do not change during a
//     drag; the live delta (ddx, ddy) is f(world pointer, world grab point) and is recomputed on
//     every move AND on every camera change (zoom_to), never accumulated. The grabbed point stays
//     under the pointer within half a unit (DragPreservesGrabOffset), plus the snap distance when
//     snapped. pointercancel aborts to the snapshot (nothing was committed).
//   - SNAPPING, host policy reduced to a grid (candidates every GRID = 50 units on the dragged node's
//     origin): SNAP_PX = 8 SCREEN px, converted by the zoom (a world distance d snaps iff d * z <=
//     8 * ZONE). Guides are an OUTPUT cleared on every non-drag state.
//   - MARQUEE, mode a parameter (contain default, as Excalidraw; tldraw touch / xyflow full differ),
//     selection live while the rectangle changes, shift = additive over the pointerdown snapshot.
//     contain is checked to be a subset of overlap (ContainSubsetOfOverlap).
//   - CULLING as a derived predicate: a node is culled iff outside the viewport AND not exempt;
//     selected, cursor (focus candidate) and editing nodes are exempt. Geometry, not the DOM,
//     decides hits and marquee, so a culled node can still be selected.
//   - TOPMOST HIT WINS: higher node index = higher z-order.
//   - HOST-CONTROLLED POSITIONS (host_move): a host (auto-layout, a controlled scene) sets one node's
//     committed position in any mode, clamped into the world bound (NodesInWorldBound). A running
//     drag or marquee is re-solved against the new geometry, like zoom_to for the camera. The one
//     thing it can break is "the target was the topmost hit at pointerdown", so `hostMoved`
//     (cleared when the gesture ends) stands TargetIsTopmostHit down for that gesture. Node SIZES
//     (constants here) and the Z-ORDER (index = z) are host-controlled in the primitive too, but not
//     modelled: tested directly in packages/headless/test/canvas.controlled.browser.test.tsx.
//
// ACCESSIBILITY CONTRACT (no focus model is chosen here; h9vk decides). The cursor, the selection
// and the node geometry live in WORLD space with no DOM reference. `annCount` / `annSel` are
// OUTPUTS: annCount increases (and annSel carries the new selection) whenever a gesture ends with a
// changed selection; never mid-gesture. Real DOM focus and virtual focus + live region can both
// consume them; `cursor` is the node a focus model would move to.
//
// INVARIANTS ACHIEVED (the ticket's list): selection is a subset of the nodes (SelectionSubsetOfNodes,
// IdsInRange); exactly one capture owner (OneCaptureOwner); a gesture is reachable only from idle
// (OnlyLegalTransitions, via `prev`); drag preserves the grab offset (DragPreservesGrabOffset,
// DragIsSnapshotPlusDelta); contain selects a subset of overlap (ContainSubsetOfOverlap) and a marquee
// selects exactly its mode's hits (MarqueeSelectionExact). Also IdleIsClean, GestureTargetConsistent,
// PointingWithinThreshold, TargetIsTopmostHit, SnappedPositionOnGrid, NoMissedSnap,
// GuidesOnlyWhileSnapping, PanKeepsGrabUnderPointer, CameraInBound, NodesInWorldBound,
// MarqueeAdditiveKeepsBase, ExemptNodesNeverCulled, CulledOnlyWhenOffscreen,
// EditingIsTheSingleSelection, AnnouncementsTrackSelection. The two culling invariants restate the
// `culled` def and cannot fail on their own; the test mutates the def to show they catch a forgetful
// implementation. Not achieved: "a node stays within bounds while resizing" (no resize here).
//
// NOT MODELLED: host-set sizes and z-order (see HOST-CONTROLLED POSITIONS), resize / rotate
// handles, edge auto-pan, pinch (two-pointer) zoom, locked / hidden nodes, groups and frames,
// hollow-shape hit rules, undo, keyboard, wheel normalisation. A touch
// (coarse) threshold is host policy. The grid is this model's instance of the host's snap
// candidates: the primitive takes them as an injected per-axis function (whole world units) and
// defaults to this grid.
//
// GENERATOR GAPS HIT: no const / collections (3 nodes = 6 position vars + pure defs; selection =
// bitmask with arithmetic bit tests, no bitwise ops); one nondet per action (touch = pointer * 12 +
// palette); no let in defs; every action assigns every var (frame lines emitted by a throwaway
// script); `size`-like builtin names are rejected (QNT101); a spec cannot import another machine
// (camera math is duplicated, see above).
module canvas_pointer {
  var mode: str // "idle" | "pointing" | "panning" | "marquee" | "dragging"
  var owner: int // capture owner: pointer id (1 or 2), 0 = nobody (iff idle)
  var prev: str // the mode before the last event (checks the legal-edge graph)
  var tgt: int // node under the pointer at pointerdown (-1 = empty canvas / pan)
  var shift: bool // additive-select modifier, sampled at pointerdown (frozen while a gesture runs)
  var space: bool // pan modifier (hand tool), sampled at pointerdown
  var mqmode: str // marquee mode parameter: "contain" | "overlap"
  var snapOn: bool // snapping enabled (sampled at pointerdown)
  var tx: int // camera x, world units * TONE (same convention as camera.qnt)
  var ty: int // camera y
  var z: int // camera zoom * ZONE
  var px: int // pointer, screen px
  var py: int
  var downx: int // pointerdown position, screen px (drag threshold origin)
  var downy: int
  var gx: int // WORLD point under the pointer at pointerdown (fp); the grab point of drag / pan / marquee
  var gy: int
  var sel: int // selection: bit i = node i is selected (world-space ids, no DOM)
  var selSnap: int // selection at pointerdown (abort-to-snapshot, additive base); == sel when idle
  var cursor: int // last interacted node, -1 = none (consumed by whichever focus model h9vk picks)
  var editing: int // node being edited, -1 = none
  var n0x: int // COMMITTED node positions, whole world units (sizes are constants)
  var n0y: int
  var n1x: int
  var n1y: int
  var n2x: int
  var n2y: int
  var ddx: int // live drag delta, whole units: f(snapshot, pointer) - recomputed, never accumulated
  var ddy: int
  var guide: int // snap guides, OUTPUT: bit 0 = x snapped, bit 1 = y snapped; 0 unless dragging
  var annCount: int // announcements emitted (OUTPUT: a live region / focus model reads this)
  var annSel: int // selection carried by the last announcement
  var hostMoved: bool // a host_move landed during the running gesture (history: relaxes TargetIsTopmostHit); false when idle

  // ---- constants (camera constants are copies of camera.qnt) --------------
  def ZONE: int = 4096
  def TONE: int = 256
  def TZ: int = ZONE * TONE
  def ZMIN: int = 256
  def ZMAX: int = 32768
  def WB: int = 1000000
  def WT: int = WB * TONE
  def DRAG_PX: int = 4
  def SNAP_PX: int = 8
  def GRID: int = 50
  def VW: int = 1024
  def VH: int = 768

  // ---- integer helpers (absI, clampI, fdiv, rdiv are copies of camera.qnt) -
  def absI(a: int): int = if (a < 0) -a else a
  def minI(a: int, b: int): int = if (a < b) a else b
  def maxI(a: int, b: int): int = if (a > b) a else b
  def clampI(v: int, lo: int, hi: int): int = if (v < lo) lo else if (v > hi) hi else v
  def fdiv(a: int, b: int): int = if (a >= 0) a / b else -((-a + b - 1) / b)
  def rdiv(a: int, b: int): int = fdiv(2 * a + b, 2 * b)
  def one(b: bool): int = if (b) 1 else 0

  // ---- camera (copies of camera.qnt) ---------------------------------------
  def screenToWorld(s: int, t: int, zf: int): int = rdiv(s * TZ, zf) - t
  def clampZ(zf: int): int = clampI(zf, ZMIN, ZMAX)
  def clampT(t: int): int = clampI(t, -WT, WT)
  def anchoredT(t: int, zf: int, zf2: int, s: int): int =
    clampT(t + rdiv(s * TZ, zf2) - rdiv(s * TZ, zf))
  // panning: keep the grab world point g under screen point s
  def panGrab(s: int, zf: int, g: int): int = clampT(rdiv(s * TZ, zf) - g)
  def zoomPreset(k: int): int =
    if (k == 0) ZMIN else if (k == 1) 2048 else if (k == 2) 4096 else if (k == 3) 8192 else ZMAX

  // ---- the fixed node set: 0 (bottom) .. 2 (top); sizes are constants, positions are vars
  def NW(i: int): int = if (i == 0) 200 else if (i == 1) 200 else 100
  def NH(i: int): int = if (i == 0) 100 else if (i == 1) 150 else 100
  def pick(i: int, a: int, b: int, c: int): int = if (i == 0) a else if (i == 1) b else c
  // node ids as bitmasks (3 bits)
  def pow2(k: int): int = if (k == 0) 1 else if (k == 1) 2 else 4
  def bit(m: int, k: int): bool = (m / pow2(k)) % 2 == 1
  def maskOr(a: int, b: int): int =
    one(or(bit(a, 0), bit(b, 0))) + 2 * one(or(bit(a, 1), bit(b, 1))) + 4 * one(or(bit(a, 2), bit(b, 2)))
  def toggleBit(m: int, k: int): int = if (bit(m, k)) m - pow2(k) else m + pow2(k)
  def single(m: int): int = if (m == 1) 0 else if (m == 2) 1 else if (m == 4) 2 else -1

  // ---- screen palette (px): 0-3 on node 0, at 0 / 5 / 16 / 25 squared px from position 0;
  // 4 in nodes 0 and 1 (node 1 is on top); 5 node 1; 6 node 2; 7 empty; 8 node 1; 9-11 empty
  def posX(k: int): int =
    if (k == 0) 150 else if (k == 1) 152 else if (k == 2) 154 else if (k == 3) 155
    else if (k == 4) 280 else if (k == 5) 400 else if (k == 6) 650 else if (k == 7) 60
    else if (k == 8) 320 else if (k == 9) 500 else if (k == 10) 800 else 600
  def posY(k: int): int =
    if (k == 0) 130 else if (k == 1) 131 else if (k == 2) 130 else if (k == 3) 130
    else if (k == 4) 170 else if (k == 5) 250 else if (k == 6) 450 else if (k == 7) 60
    else if (k == 8) 220 else if (k == 9) 350 else if (k == 10) 600 else 60
  def ptrOf(c: int): int = c / 12 + 1
  def posOf(c: int): int = c % 12

  // ---- hit testing, topmost first (half-open boxes, fp) --------------------
  def inBox(wx: int, wy: int, bx: int, by: int, w: int, h: int): bool =
    and(wx >= bx * TONE, wx < (bx + w) * TONE, wy >= by * TONE, wy < (by + h) * TONE)
  def hitAt(wx: int, wy: int, x0: int, y0: int, x1: int, y1: int, x2: int, y2: int): int =
    if (inBox(wx, wy, x2, y2, NW(2), NH(2))) 2
    else if (inBox(wx, wy, x1, y1, NW(1), NH(1))) 1
    else if (inBox(wx, wy, x0, y0, NW(0), NH(0))) 0
    else -1

  // ---- marquee: contain (rect encloses the box) vs overlap (positive-area intersection)
  def contained(rx0: int, ry0: int, rx1: int, ry1: int, bx: int, by: int, w: int, h: int): bool =
    and(rx0 <= bx * TONE, (bx + w) * TONE <= rx1, ry0 <= by * TONE, (by + h) * TONE <= ry1)
  def overlapped(rx0: int, ry0: int, rx1: int, ry1: int, bx: int, by: int, w: int, h: int): bool =
    and(rx0 < (bx + w) * TONE, bx * TONE < rx1, ry0 < (by + h) * TONE, by * TONE < ry1)
  def hitBy(m: str, rx0: int, ry0: int, rx1: int, ry1: int, bx: int, by: int, w: int, h: int): bool =
    if (m == "contain") contained(rx0, ry0, rx1, ry1, bx, by, w, h)
    else overlapped(rx0, ry0, rx1, ry1, bx, by, w, h)
  def rectMask(m: str, rx0: int, ry0: int, rx1: int, ry1: int, x0: int, y0: int, x1: int, y1: int, x2: int, y2: int): int =
    one(hitBy(m, rx0, ry0, rx1, ry1, x0, y0, NW(0), NH(0)))
    + 2 * one(hitBy(m, rx0, ry0, rx1, ry1, x1, y1, NW(1), NH(1)))
    + 4 * one(hitBy(m, rx0, ry0, rx1, ry1, x2, y2, NW(2), NH(2)))
  // marquee between the world grab point (gxM, gyM) and the world pointer (wx, wy)
  def maskBy(m: str, gxM: int, gyM: int, wx: int, wy: int, x0: int, y0: int, x1: int, y1: int, x2: int, y2: int): int =
    rectMask(m, minI(gxM, wx), minI(gyM, wy), maxI(gxM, wx), maxI(gyM, wy), x0, y0, x1, y1, x2, y2)
  // live selection while marquee-ing: (shift ? snapshot : nothing) + the hits
  def liveSel(m: str, shiftB: bool, snapM: int, gxM: int, gyM: int, wx: int, wy: int, x0: int, y0: int, x1: int, y1: int, x2: int, y2: int): int =
    maskOr(if (shiftB) snapM else 0, maskBy(m, gxM, gyM, wx, wy, x0, y0, x1, y1, x2, y2))

  // ---- selection at pointerdown / pointerup --------------------------------
  def selOnDown(hit: int, spaceB: bool, shiftB: bool, selM: int): int =
    if (spaceB) selM
    else if (hit >= 0) (if (bit(selM, hit)) selM else if (shiftB) maskOr(selM, pow2(hit)) else pow2(hit))
    else (if (shiftB) selM else 0)
  def selAfterUp(m: str, tg: int, shiftB: bool, selM: int, snapM: int): int =
    if (m == "pointing")
      (if (tg >= 0) (if (shiftB) toggleBit(snapM, tg) else pow2(tg)) else (if (shiftB) snapM else 0))
    else selM

  // ---- drag, snapping (threshold in SCREEN px, candidates and results in WORLD units)
  def moved(xM: int, yM: int, dxM: int, dyM: int): bool =
    (xM - dxM) * (xM - dxM) + (yM - dyM) * (yM - dyM) > DRAG_PX * DRAG_PX
  def modeAfter(m: str, tg: int, mv: bool): str =
    if (and(m == "pointing", mv)) (if (tg >= 0) "dragging" else "marquee") else m
  def rawD(w: int, g: int): int = rdiv(w - g, TONE)
  def snapNearest(v: int): int = rdiv(v, GRID) * GRID
  def snapHit(v: int, on: bool, zf: int): bool =
    and(on, absI(v - snapNearest(v)) * zf <= SNAP_PX * ZONE)
  def snapNudge(v: int, on: bool, zf: int): int = if (snapHit(v, on, zf)) snapNearest(v) - v else 0
  // base = the dragged node's committed position on this axis
  def liveDD(w: int, g: int, base: int, on: bool, zf: int): int =
    rawD(w, g) + snapNudge(base + rawD(w, g), on, zf)
  def liveGuide(wx: int, gxM: int, bx: int, wy: int, gyM: int, by: int, on: bool, zf: int): int =
    one(snapHit(bx + rawD(wx, gxM), on, zf)) + 2 * one(snapHit(by + rawD(wy, gyM), on, zf))
  def clampPos(v: int, extent: int): int = clampI(v, -WB, WB - extent)
  def committed(i: int, v: int, d: int, selM: int, m: str, extent: int): int =
    if (and(m == "dragging", bit(selM, i))) clampPos(v + d, extent) else v

  // ---- the legal mode graph --------------------------------------------------
  def legalEdge(a: str, b: str): bool =
    or(
      a == b,
      and(a == "idle", or(b == "pointing", b == "panning")),
      and(a == "pointing", or(b == "marquee", b == "dragging", b == "idle")),
      and(or(a == "panning", a == "marquee", a == "dragging"), b == "idle")
    )

  // ---- derived views of the state (used by the invariants) -------------------
  def curWx: int = screenToWorld(px, tx, z)
  def curWy: int = screenToWorld(py, ty, z)
  def primX: int = pick(tgt, n0x, n1x, n2x)
  def primY: int = pick(tgt, n0y, n1y, n2y)
  // live (on screen) node origin: a dragged node is its committed position + the live delta
  def liveX(i: int): int = pick(i, n0x, n1x, n2x) + (if (and(mode == "dragging", bit(sel, i))) ddx else 0)
  def liveY(i: int): int = pick(i, n0y, n1y, n2y) + (if (and(mode == "dragging", bit(sel, i))) ddy else 0)
  def inView(i: int): bool =
    and(
      liveX(i) * TONE < screenToWorld(VW, tx, z), (liveX(i) + NW(i)) * TONE > screenToWorld(0, tx, z),
      liveY(i) * TONE < screenToWorld(VH, ty, z), (liveY(i) + NH(i)) * TONE > screenToWorld(0, ty, z)
    )
  def exempt(i: int): bool = or(bit(sel, i), cursor == i, editing == i)
  def culled(i: int): bool = and(not(inView(i)), not(exempt(i)))

  // A press whose TOPMOST hit is the node being edited is NOT a gesture: it must leave the machine
  // idle and keep `editing`, so a mouse press inside a text editor selects text instead of starting
  // a drag. `pointerdown` in the primitive mirrors this by returning early. A press anywhere else
  // still ends editing (the `editing' = -1` case below).
  def inEditor(t: int): bool =
    and(editing >= 0, hitAt(screenToWorld(posX(posOf(t)), tx, z), screenToWorld(posY(posOf(t)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y) == editing)
  def downGesture(t: int): bool = and(mode == "idle", not(inEditor(t)))
  def nodeOk(x: int, y: int, i: int): bool =
    and(x >= -WB, x + NW(i) <= WB, y >= -WB, y + NH(i) <= WB)
  // deviation of the grabbed point from the pointer on one axis, in fp, against its allowance
  def grabDevOk(w: int, g: int, d: int, snapped: bool, zf: int): bool =
    if (snapped) 2 * absI(w - g - d * TONE) * zf <= TONE * zf + 2 * SNAP_PX * ZONE * TONE
    else 2 * absI(w - g - d * TONE) <= TONE
  def axisGrab(s: int, g: int, t: int, zf: int): bool =
    or(absI(t) == WT, absI(screenToWorld(s, t, zf) - g) < TONE)

  // host_move pool: place = 3 * k + node. Node `place % 3` takes position k = place / 3: the origin, a spot
  // that covers palette 5, off screen (negative), and one far past the world bound (clamped).
  def extX(k: int): int = if (k == 0) 0 else if (k == 1) 320 else if (k == 2) -300 else 5000000
  def extY(k: int): int = if (k == 0) 0 else if (k == 1) 200 else if (k == 2) -300 else -5000000
  def hostX(place: int, i: int, v: int): int = if (place % 3 == i) clampPos(extX(place / 3), NW(i)) else v
  def hostY(place: int, i: int, v: int): int = if (place % 3 == i) clampPos(extY(place / 3), NH(i)) else v

  action init = all {
    mode' = "idle",
    owner' = 0,
    prev' = "idle",
    tgt' = -1,
    shift' = false,
    space' = false,
    mqmode' = "contain",
    snapOn' = false,
    tx' = 0,
    ty' = 0,
    z' = 4096,
    px' = 0,
    py' = 0,
    downx' = 0,
    downy' = 0,
    gx' = 0,
    gy' = 0,
    sel' = 0,
    selSnap' = 0,
    cursor' = -1,
    editing' = -1,
    n0x' = 100,
    n0y' = 100,
    n1x' = 250,
    n1y' = 150,
    n2x' = 600,
    n2y' = 400,
    ddx' = 0,
    ddy' = 0,
    guide' = 0,
    hostMoved' = false,
    annCount' = 0,
    annSel' = 0
  }

  // pointerdown: touch = (pointer id - 1) * 12 + palette position. Ignored unless idle, so a
  // second pointer can never start a gesture while one holds the capture. The hit is the TOPMOST
  // node under the pointer in WORLD space; the grab point g is stored in world space.
  action down = {
    nondet touch = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23).oneOf()
    all {
      mode' = if (downGesture(touch)) (if (space) "panning" else "pointing") else mode,
      owner' = if (downGesture(touch)) ptrOf(touch) else owner,
      prev' = mode,
      tgt' = if (and(downGesture(touch), not(space))) hitAt(screenToWorld(posX(posOf(touch)), tx, z), screenToWorld(posY(posOf(touch)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y) else tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = if (downGesture(touch)) posX(posOf(touch)) else px,
      py' = if (downGesture(touch)) posY(posOf(touch)) else py,
      downx' = if (downGesture(touch)) posX(posOf(touch)) else downx,
      downy' = if (downGesture(touch)) posY(posOf(touch)) else downy,
      gx' = if (downGesture(touch)) screenToWorld(posX(posOf(touch)), tx, z) else gx,
      gy' = if (downGesture(touch)) screenToWorld(posY(posOf(touch)), ty, z) else gy,
      sel' = if (downGesture(touch)) selOnDown(hitAt(screenToWorld(posX(posOf(touch)), tx, z), screenToWorld(posY(posOf(touch)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y), space, shift, sel) else sel,
      selSnap' = if (downGesture(touch)) sel else selSnap,
      cursor' = if (and(downGesture(touch), not(space), hitAt(screenToWorld(posX(posOf(touch)), tx, z), screenToWorld(posY(posOf(touch)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y) >= 0)) hitAt(screenToWorld(posX(posOf(touch)), tx, z), screenToWorld(posY(posOf(touch)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y) else cursor,
      editing' = if (downGesture(touch)) -1 else editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = ddx,
      ddy' = ddy,
      guide' = guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  // pointermove (same touch encoding). Only the capture owner drives a gesture; when idle it just
  // tracks the hover position. The drag threshold is in SCREEN px; the delta is recomputed from the
  // pointerdown snapshot every time, in WORLD space (snapshot + delta, not an accumulation).
  action move = {
    nondet touch = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23).oneOf()
    all {
      mode' = if (and(mode != "idle", ptrOf(touch) == owner)) modeAfter(mode, tgt, moved(posX(posOf(touch)), posY(posOf(touch)), downx, downy)) else mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = if (and(and(mode != "idle", ptrOf(touch) == owner), mode == "panning")) panGrab(posX(posOf(touch)), z, gx) else tx,
      ty' = if (and(and(mode != "idle", ptrOf(touch) == owner), mode == "panning")) panGrab(posY(posOf(touch)), z, gy) else ty,
      z' = z,
      px' = if (or(mode == "idle", and(mode != "idle", ptrOf(touch) == owner))) posX(posOf(touch)) else px,
      py' = if (or(mode == "idle", and(mode != "idle", ptrOf(touch) == owner))) posY(posOf(touch)) else py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = if (and(and(mode != "idle", ptrOf(touch) == owner), modeAfter(mode, tgt, moved(posX(posOf(touch)), posY(posOf(touch)), downx, downy)) == "marquee")) liveSel(mqmode, shift, selSnap, gx, gy, screenToWorld(posX(posOf(touch)), tx, z), screenToWorld(posY(posOf(touch)), ty, z), n0x, n0y, n1x, n1y, n2x, n2y) else sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = if (and(and(mode != "idle", ptrOf(touch) == owner), modeAfter(mode, tgt, moved(posX(posOf(touch)), posY(posOf(touch)), downx, downy)) == "dragging")) liveDD(screenToWorld(posX(posOf(touch)), tx, z), gx, pick(tgt, n0x, n1x, n2x), snapOn, z) else ddx,
      ddy' = if (and(and(mode != "idle", ptrOf(touch) == owner), modeAfter(mode, tgt, moved(posX(posOf(touch)), posY(posOf(touch)), downx, downy)) == "dragging")) liveDD(screenToWorld(posY(posOf(touch)), ty, z), gy, pick(tgt, n0y, n1y, n2y), snapOn, z) else ddy,
      guide' = if (and(and(mode != "idle", ptrOf(touch) == owner), modeAfter(mode, tgt, moved(posX(posOf(touch)), posY(posOf(touch)), downx, downy)) == "dragging")) liveGuide(screenToWorld(posX(posOf(touch)), tx, z), gx, pick(tgt, n0x, n1x, n2x), screenToWorld(posY(posOf(touch)), ty, z), gy, pick(tgt, n0y, n1y, n2y), snapOn, z) else guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  // pointerup from pointer `lift`: only the owner ends the gesture. A click selects / toggles, a drag
  // commits snapshot + delta (clamped into the world bound), a marquee keeps its live selection. The
  // selection is ANNOUNCED here (never mid-gesture): annCount++ when it changed.
  action up = {
    nondet lift = Set(1, 2).oneOf()
    all {
      mode' = if (and(mode != "idle", lift == owner)) "idle" else mode,
      owner' = if (and(mode != "idle", lift == owner)) 0 else owner,
      prev' = mode,
      tgt' = if (and(mode != "idle", lift == owner)) -1 else tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = if (and(mode != "idle", lift == owner)) selAfterUp(mode, tgt, shift, sel, selSnap) else sel,
      selSnap' = if (and(mode != "idle", lift == owner)) selAfterUp(mode, tgt, shift, sel, selSnap) else selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = if (and(mode != "idle", lift == owner)) committed(0, n0x, ddx, sel, mode, NW(0)) else n0x,
      n0y' = if (and(mode != "idle", lift == owner)) committed(0, n0y, ddy, sel, mode, NH(0)) else n0y,
      n1x' = if (and(mode != "idle", lift == owner)) committed(1, n1x, ddx, sel, mode, NW(1)) else n1x,
      n1y' = if (and(mode != "idle", lift == owner)) committed(1, n1y, ddy, sel, mode, NH(1)) else n1y,
      n2x' = if (and(mode != "idle", lift == owner)) committed(2, n2x, ddx, sel, mode, NW(2)) else n2x,
      n2y' = if (and(mode != "idle", lift == owner)) committed(2, n2y, ddy, sel, mode, NH(2)) else n2y,
      ddx' = if (and(mode != "idle", lift == owner)) 0 else ddx,
      ddy' = if (and(mode != "idle", lift == owner)) 0 else ddy,
      guide' = if (and(mode != "idle", lift == owner)) 0 else guide,
      hostMoved' = if (and(mode != "idle", lift == owner)) false else hostMoved,
      annCount' = if (and(and(mode != "idle", lift == owner), selAfterUp(mode, tgt, shift, sel, selSnap) != annSel)) annCount + 1 else annCount,
      annSel' = if (and(mode != "idle", lift == owner)) selAfterUp(mode, tgt, shift, sel, selSnap) else annSel
    }
  }

  // pointercancel / lost capture (palm rejection, the browser took the pointer): abort to the
  // pointerdown snapshot. Nothing was committed, so the selection snapshot is all that is restored.
  action cancel_pointer = {
    nondet lost = Set(1, 2).oneOf()
    all {
      mode' = if (and(mode != "idle", lost == owner)) "idle" else mode,
      owner' = if (and(mode != "idle", lost == owner)) 0 else owner,
      prev' = mode,
      tgt' = if (and(mode != "idle", lost == owner)) -1 else tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = if (and(mode != "idle", lost == owner)) selSnap else sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = if (and(mode != "idle", lost == owner)) 0 else ddx,
      ddy' = if (and(mode != "idle", lost == owner)) 0 else ddy,
      guide' = if (and(mode != "idle", lost == owner)) 0 else guide,
      hostMoved' = if (and(mode != "idle", lost == owner)) false else hostMoved,
      annCount' = if (and(and(mode != "idle", lost == owner), selSnap != annSel)) annCount + 1 else annCount,
      annSel' = if (and(mode != "idle", lost == owner)) selSnap else annSel
    }
  }

  // modifiers and parameters are sampled at pointerdown: changes mid-gesture are ignored
  action set_shift = {
    nondet held = Set(true, false).oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = if (mode == "idle") held else shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = ddx,
      ddy' = ddy,
      guide' = guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  action set_space = {
    nondet held = Set(true, false).oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = if (mode == "idle") held else space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = ddx,
      ddy' = ddy,
      guide' = guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  action set_marquee_mode = {
    nondet choice = Set("contain", "overlap").oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = space,
      mqmode' = if (mode == "idle") choice else mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = ddx,
      ddy' = ddy,
      guide' = guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  action set_snap = {
    nondet snapping = Set(true, false).oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = if (mode == "idle") snapping else snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = ddx,
      ddy' = ddy,
      guide' = guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  // wheel / pinch under a running gesture: zoom to a preset level about the POINTER. The pointer's
  // world point is fixed, so a drag / marquee / pan composes with it; every derived gesture value
  // is re-solved against the new camera (a panning camera re-grabs so it never keeps a stale offset).
  action zoom_to = {
    nondet level = Set(0, 1, 2, 3, 4).oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = (if (mode == "panning") panGrab(px, clampZ(zoomPreset(level)), gx) else anchoredT(tx, z, clampZ(zoomPreset(level)), px)),
      ty' = (if (mode == "panning") panGrab(py, clampZ(zoomPreset(level)), gy) else anchoredT(ty, z, clampZ(zoomPreset(level)), py)),
      z' = clampZ(zoomPreset(level)),
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = if (mode == "marquee") liveSel(mqmode, shift, selSnap, gx, gy, screenToWorld(px, if (mode == "panning") panGrab(px, clampZ(zoomPreset(level)), gx) else anchoredT(tx, z, clampZ(zoomPreset(level)), px), clampZ(zoomPreset(level))), screenToWorld(py, if (mode == "panning") panGrab(py, clampZ(zoomPreset(level)), gy) else anchoredT(ty, z, clampZ(zoomPreset(level)), py), clampZ(zoomPreset(level))), n0x, n0y, n1x, n1y, n2x, n2y) else sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = n0x,
      n0y' = n0y,
      n1x' = n1x,
      n1y' = n1y,
      n2x' = n2x,
      n2y' = n2y,
      ddx' = if (mode == "dragging") liveDD(screenToWorld(px, if (mode == "panning") panGrab(px, clampZ(zoomPreset(level)), gx) else anchoredT(tx, z, clampZ(zoomPreset(level)), px), clampZ(zoomPreset(level))), gx, pick(tgt, n0x, n1x, n2x), snapOn, clampZ(zoomPreset(level))) else ddx,
      ddy' = if (mode == "dragging") liveDD(screenToWorld(py, if (mode == "panning") panGrab(py, clampZ(zoomPreset(level)), gy) else anchoredT(ty, z, clampZ(zoomPreset(level)), py), clampZ(zoomPreset(level))), gy, pick(tgt, n0y, n1y, n2y), snapOn, clampZ(zoomPreset(level))) else ddy,
      guide' = if (mode == "dragging") liveGuide(screenToWorld(px, if (mode == "panning") panGrab(px, clampZ(zoomPreset(level)), gx) else anchoredT(tx, z, clampZ(zoomPreset(level)), px), clampZ(zoomPreset(level))), gx, pick(tgt, n0x, n1x, n2x), screenToWorld(py, if (mode == "panning") panGrab(py, clampZ(zoomPreset(level)), gy) else anchoredT(ty, z, clampZ(zoomPreset(level)), py), clampZ(zoomPreset(level))), gy, pick(tgt, n0y, n1y, n2y), snapOn, clampZ(zoomPreset(level))) else guide,
      hostMoved' = hostMoved,
      annCount' = annCount,
      annSel' = annSel
    }
  }

  // enter / leave editing of the single selected node (only while idle)
  action toggle_edit = all {
    mode' = mode,
    owner' = owner,
    prev' = mode,
    tgt' = tgt,
    shift' = shift,
    space' = space,
    mqmode' = mqmode,
    snapOn' = snapOn,
    tx' = tx,
    ty' = ty,
    z' = z,
    px' = px,
    py' = py,
    downx' = downx,
    downy' = downy,
    gx' = gx,
    gy' = gy,
    sel' = sel,
    selSnap' = selSnap,
    cursor' = if (and(mode == "idle", editing < 0, single(sel) >= 0)) single(sel) else cursor,
    editing' = if (mode != "idle") editing else if (editing >= 0) -1 else single(sel),
    n0x' = n0x,
    n0y' = n0y,
    n1x' = n1x,
    n1y' = n1y,
    n2x' = n2x,
    n2y' = n2y,
    ddx' = ddx,
    ddy' = ddy,
    guide' = guide,
    hostMoved' = hostMoved,
    annCount' = annCount,
    annSel' = annSel
  }

  // host_move: the HOST sets one node's COMMITTED position (an auto-layout, a controlled scene), in
  // ANY mode, clamped into the world bound. A running drag or marquee is re-solved against the new
  // geometry, like zoom_to does for the camera, so the derived values stay f(pointer, geometry).
  // `hostMoved` records that it happened in this gesture: the target was the topmost hit at
  // pointerdown, which a host move may since have changed. Sizes and the z-order are not modelled.
  action host_move = {
    nondet place = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      mode' = mode,
      owner' = owner,
      prev' = mode,
      tgt' = tgt,
      shift' = shift,
      space' = space,
      mqmode' = mqmode,
      snapOn' = snapOn,
      tx' = tx,
      ty' = ty,
      z' = z,
      px' = px,
      py' = py,
      downx' = downx,
      downy' = downy,
      gx' = gx,
      gy' = gy,
      sel' = if (mode == "marquee") liveSel(mqmode, shift, selSnap, gx, gy, screenToWorld(px, tx, z), screenToWorld(py, ty, z), hostX(place, 0, n0x), hostY(place, 0, n0y), hostX(place, 1, n1x), hostY(place, 1, n1y), hostX(place, 2, n2x), hostY(place, 2, n2y)) else sel,
      selSnap' = selSnap,
      cursor' = cursor,
      editing' = editing,
      n0x' = hostX(place, 0, n0x),
      n0y' = hostY(place, 0, n0y),
      n1x' = hostX(place, 1, n1x),
      n1y' = hostY(place, 1, n1y),
      n2x' = hostX(place, 2, n2x),
      n2y' = hostY(place, 2, n2y),
      ddx' = if (mode == "dragging") liveDD(screenToWorld(px, tx, z), gx, pick(tgt, hostX(place, 0, n0x), hostX(place, 1, n1x), hostX(place, 2, n2x)), snapOn, z) else ddx,
      ddy' = if (mode == "dragging") liveDD(screenToWorld(py, ty, z), gy, pick(tgt, hostY(place, 0, n0y), hostY(place, 1, n1y), hostY(place, 2, n2y)), snapOn, z) else ddy,
      guide' = if (mode == "dragging") liveGuide(screenToWorld(px, tx, z), gx, pick(tgt, hostX(place, 0, n0x), hostX(place, 1, n1x), hostX(place, 2, n2x)), screenToWorld(py, ty, z), gy, pick(tgt, hostY(place, 0, n0y), hostY(place, 1, n1y), hostY(place, 2, n2y)), snapOn, z) else guide,
      hostMoved' = or(hostMoved, mode != "idle"),
      annCount' = annCount,
      annSel' = annSel
    }
  }

  action step = any { init, down, move, up, cancel_pointer, set_shift, set_space, set_marquee_mode, set_snap, zoom_to, toggle_edit, host_move }

  val ModeValid: bool =
    or(mode == "idle", mode == "pointing", mode == "panning", mode == "marquee", mode == "dragging")
  // exactly one capture owner while a gesture runs, nobody otherwise
  val OneCaptureOwner: bool = and((mode == "idle") == (owner == 0), owner >= 0, owner <= 2)
  // a gesture starts only from idle; the others only follow the legal edges
  val OnlyLegalTransitions: bool = legalEdge(prev, mode)
  // selection (and its snapshot / announcement) is a subset of the 3 nodes
  val SelectionSubsetOfNodes: bool =
    and(sel >= 0, sel <= 7, selSnap >= 0, selSnap <= 7, annSel >= 0, annSel <= 7)
  val IdsInRange: bool =
    and(tgt >= -1, tgt <= 2, cursor >= -1, cursor <= 2, editing >= -1, editing <= 2)
  // idle carries no gesture residue and the selection snapshot is the selection
  val IdleIsClean: bool =
    or(mode != "idle", and(tgt == -1, ddx == 0, ddy == 0, guide == 0, selSnap == sel, not(hostMoved)))
  val GestureTargetConsistent: bool = and(
    or(mode != "pointing", and(ddx == 0, ddy == 0, guide == 0)),
    or(mode != "marquee", and(tgt == -1, ddx == 0, ddy == 0, guide == 0)),
    or(mode != "panning", and(tgt == -1, ddx == 0, ddy == 0, guide == 0)),
    or(mode != "dragging", and(tgt >= 0, tgt <= 2, bit(sel, tgt)))
  )
  // below the threshold (screen px, squared) a press has not become a gesture yet
  val PointingWithinThreshold: bool = or(mode != "pointing", not(moved(px, py, downx, downy)))
  // the gesture target is the topmost node under the pointer at pointerdown (world hit test); a
  // host_move during the gesture (hostMoved) may have moved it since, so the check stands down
  val TargetIsTopmostHit: bool =
    or(mode == "idle", mode == "panning", hostMoved, tgt == hitAt(gx, gy, n0x, n0y, n1x, n1y, n2x, n2y))
  // drag = snapshot + world delta: the stored delta equals f(world pointer, world grab point)
  val DragIsSnapshotPlusDelta: bool = or(mode != "dragging", and(
    ddx == liveDD(curWx, gx, primX, snapOn, z),
    ddy == liveDD(curWy, gy, primY, snapOn, z),
    guide == liveGuide(curWx, gx, primX, curWy, gy, primY, snapOn, z)
  ))
  // the grabbed point stays under the pointer (half a unit; plus the snap distance when snapped)
  val DragPreservesGrabOffset: bool = or(mode != "dragging", and(
    grabDevOk(curWx, gx, ddx, bit(guide, 0), z),
    grabDevOk(curWy, gy, ddy, bit(guide, 1), z)
  ))
  // a snapped axis sits on the grid; an unsnapped axis was not within the screen threshold
  val SnappedPositionOnGrid: bool = or(mode != "dragging", and(
    or(not(bit(guide, 0)), (primX + ddx) % GRID == 0),
    or(not(bit(guide, 1)), (primY + ddy) % GRID == 0)
  ))
  val NoMissedSnap: bool = or(mode != "dragging", not(snapOn), and(
    bit(guide, 0) == snapHit(primX + ddx, true, z),
    bit(guide, 1) == snapHit(primY + ddy, true, z)
  ))
  // guides are output state: only while dragging with snapping on
  val GuidesOnlyWhileSnapping: bool = or(and(mode == "dragging", snapOn), guide == 0)
  // panning keeps the grab world point under the pointer (unless the world bound pins the camera)
  val PanKeepsGrabUnderPointer: bool =
    or(mode != "panning", and(axisGrab(px, gx, tx, z), axisGrab(py, gy, ty, z)))
  val CameraInBound: bool =
    and(ZMIN > 0, z >= ZMIN, z <= ZMAX, absI(tx) <= WT, absI(ty) <= WT)
  val NodesInWorldBound: bool =
    and(nodeOk(n0x, n0y, 0), nodeOk(n1x, n1y, 1), nodeOk(n2x, n2y, 2))
  // marquee monotonicity: whatever the rectangle, contain selects a subset of overlap
  val ContainSubsetOfOverlap: bool =
    maskOr(
      maskBy("contain", gx, gy, curWx, curWy, n0x, n0y, n1x, n1y, n2x, n2y),
      maskBy("overlap", gx, gy, curWx, curWy, n0x, n0y, n1x, n1y, n2x, n2y)
    ) == maskBy("overlap", gx, gy, curWx, curWy, n0x, n0y, n1x, n1y, n2x, n2y)
  // while marquee-ing the selection is exactly the mode's hits, on top of the base when additive
  val MarqueeSelectionExact: bool = or(mode != "marquee",
    sel == liveSel(mqmode, shift, selSnap, gx, gy, curWx, curWy, n0x, n0y, n1x, n1y, n2x, n2y))
  val MarqueeAdditiveKeepsBase: bool =
    or(mode != "marquee", not(shift), maskOr(sel, selSnap) == sel)
  // selected / cursor / editing nodes are never culled, and a culled node is off screen
  val ExemptNodesNeverCulled: bool = and(
    or(not(exempt(0)), not(culled(0))),
    or(not(exempt(1)), not(culled(1))),
    or(not(exempt(2)), not(culled(2)))
  )
  val CulledOnlyWhenOffscreen: bool = and(
    or(not(culled(0)), not(inView(0))),
    or(not(culled(1)), not(inView(1))),
    or(not(culled(2)), not(inView(2)))
  )
  val EditingIsTheSingleSelection: bool =
    or(editing == -1, and(mode == "idle", sel == pow2(editing), cursor == editing))
  // the live region only ever carries the settled selection
  val AnnouncementsTrackSelection: bool =
    or(mode != "idle", and(annSel == sel, or(sel == 0, annCount >= 1)))
}
