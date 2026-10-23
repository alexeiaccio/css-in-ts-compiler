// Infinite canvas: the camera machine (viewport transform, zoom, tween).
// Implements docs/research/canvas-prior-art.md (Decision 2, items 1-3 and 9). Bean e9jm.
//
// CONVENTIONS (the tracer / adapter must reproduce these exactly)
//   - Integer fixed point, power-of-two denominators, so TS doubles and Quint ints agree
//     bit-for-bit (every intermediate stays below 2^53; pan products reach ~2^43):
//       zoom      z  = zoom * ZONE,  ZONE = 4096 (2^12)      [ZMIN = 1/16, ZMAX = 8]
//       camera    tx = (world units) * TONE, TONE = 256 (2^8)   (sub-unit offsets keep zoom smooth)
//     World coordinates of persisted nodes are whole integers (atproto has no floats); the camera
//     and pointer-derived world points are in 1/256 units ("fp").
//   - World-offset form (tldraw / Excalidraw / panzoom):  screen = (world + t) * zoom.
//       screenToWorld(s) = rdiv(s * TZ, z) - t           worldToScreen(w) = rdiv((w + t) * z, TZ)
//     with TZ = ZONE * TONE = 2^20.
//   - ROUNDING RULE for every division: round half up = floor(a / b + 1/2) (rdiv); fdiv is floor
//     division. Quint "/" truncates toward zero, so fdiv is built from "/" on non-negative
//     operands only. In TS use Math.floor on integers (exact below 2^53) or BigInt.
//   - Zoom about an anchor s:  t' = t + rdiv(s * TZ, z') - rdiv(s * TZ, z), with z' = clamp(request).
//     The translation is ALWAYS solved with the clamped z', i.e. a limit clamp re-anchors instead
//     of drifting (tldraw preserveFocalPoint). With this rounding the anchor's world point is
//     preserved EXACTLY (0 fp units); the invariant allows < 1 world unit (TONE fp units) so
//     other roundings still pass.
//   - WORLD BOUND: |tx|, |ty| <= WB * TONE with WB = 1e6 units: the viewport ORIGIN (top-left)
//     stays inside +-1e6 (Excalidraw's own flag, the float32 spacing at 1e6). The far corner can
//     exceed it by vw / ZMIN (<= 65536 units); a host that needs the whole viewport inside +-1e6
//     passes a smaller WB. A move that would leave the bound is CLAMPED; the anchor guarantee is
//     therefore "within 1 unit, unless the origin is pinned at the bound on that axis".
//   - RESIZE ANCHOR POLICY: top-left fixed. Resizing changes only vw / vh; tx, ty, z are
//     untouched (what tldraw / Excalidraw / xyflow do; no division, nothing to round). A
//     centre-anchored policy (Figma) would be t' = t + rdiv((vw' - vw) * TZ, 2 * z): a different
//     def, not modelled.
//   - TWEENS: a request is an output with a duration the adapter may set to zero. Under reduced
//     motion (rm) the camera jumps to the target at once. Otherwise TN = 4 ticks interpolate
//     linearly from the start camera to the target: lerp(a, b, p) = a + fdiv((b - a) * p, TN),
//     which is exactly b at p = TN and always between a and b (so every in-between camera is
//     inside the zoom limits and the world bound). Easing and viewport-box interpolation are
//     adapter policy. ANY gesture (pan, zoom) or cancel stops the tween where the camera is.
//     At rest, camera == target == start (RestIsOnTarget); a finished tween and an instant jump
//     therefore end in the same state.
//
// EVENTS (one nondet per action, so selectors are packed ints): init, resize, set_motion,
// pan_by, zoom_at, zoom_limit, request_tween, tween_tick, cancel_tween.
//
// INVARIANTS ACHIEVED: ViewportInRange, ZoomInRange (ZMIN > 0 = invertibility), OriginInBound,
// TweenEndpointsValid, ScreenWorldRoundTrip, AnchorFixed, TweenFollowsLerp, RestIsOnTarget,
// ReducedMotionNeverTweens. No NaN / non-finite state exists by construction (integers only).
//
// NOT MODELLED (adapter / host policy, per the research): wheel / pinch normalisation, device
// pixel snapping, easing curves, fit-to-bounds, inertia, rendering. No focus / keyboard model:
// "reveal the focused node" is a request_tween goal, so either focus model (real DOM focus or
// virtual focus + live region) can drive it; announcements live in pointer.qnt as outputs.
//
// GENERATOR GAPS HIT: no collections / const (constants are zero-arg defs); one nondet per
// action (packed selectors); no let in defs (long arg lists, repeated subexpressions); every
// action assigns every var (this file's frame lines were emitted by a throwaway script, the
// output is plain Quint); bool helper vals would be misclassified as invariants (helpers are
// defs); no bitwise ops; defs are not callable from the reference model, so the exact-double
// claim is checked against an independent TS implementation in test/canvas/camera.test.ts.
module canvas_camera {
  var vw: int // viewport width, screen px
  var vh: int // viewport height, screen px
  var tx: int // camera x: world units * TONE (world-offset: screen = (world + t) * z)
  var ty: int // camera y: world units * TONE
  var z: int // camera zoom: zoom * ZONE
  var rm: bool // reduced motion: a tween request jumps to its target at once
  var active: bool // a tween is running
  var tp: int // ticks done; TN = at rest
  var stx: int // tween start x (== target at rest)
  var sty: int // tween start y
  var sz: int // tween start zoom
  var ttx: int // tween target x (== camera at rest)
  var tty: int // tween target y
  var tz: int // tween target zoom
  var anch: bool // witness: the last camera move was an anchored zoom
  var asx: int // that zoom's anchor, screen px
  var asy: int
  var awx: int // the world point (fp) under the anchor BEFORE the zoom
  var awy: int

  // ---- constants ----------------------------------------------------------
  def ZONE: int = 4096
  def TONE: int = 256
  def TZ: int = ZONE * TONE
  def ZMIN: int = 256
  def ZMAX: int = 32768
  def WB: int = 1000000
  def WT: int = WB * TONE
  def TN: int = 4

  // ---- integer helpers ----------------------------------------------------
  def absI(a: int): int = if (a < 0) -a else a
  def clampI(v: int, lo: int, hi: int): int = if (v < lo) lo else if (v > hi) hi else v
  // floor division, b > 0
  def fdiv(a: int, b: int): int = if (a >= 0) a / b else -((-a + b - 1) / b)
  // round half up, b > 0
  def rdiv(a: int, b: int): int = fdiv(2 * a + b, 2 * b)

  // ---- the transform ------------------------------------------------------
  def screenToWorld(s: int, t: int, zf: int): int = rdiv(s * TZ, zf) - t
  def worldToScreen(w: int, t: int, zf: int): int = rdiv((w + t) * zf, TZ)
  def clampZ(zf: int): int = clampI(zf, ZMIN, ZMAX)
  def clampT(t: int): int = clampI(t, -WT, WT)
  // zoom to zf2 about screen point s; the translation is solved for the CLAMPED zoom
  def anchoredT(t: int, zf: int, zf2: int, s: int): int =
    clampT(t + rdiv(s * TZ, zf2) - rdiv(s * TZ, zf))
  def panT(t: int, zf: int, d: int): int = clampT(t + rdiv(d * TZ, zf))
  def zoomRequest(zf: int, f: int): int = clampZ(rdiv(zf * f, ZONE))
  def lerp(a: int, b: int, p: int): int = a + fdiv((b - a) * p, TN)

  // ---- packed selectors ---------------------------------------------------
  def VW(i: int): int =
    if (i == 0) 320 else if (i == 1) 800 else if (i == 2) 1024 else if (i == 3) 1920 else 4096
  def VH(i: int): int =
    if (i == 0) 240 else if (i == 1) 600 else if (i == 2) 768 else if (i == 3) 1080 else 2160
  // 0 top-left, 1 centre, 2 bottom-right, 3 (1/4, 3/4)
  def anchorX(a: int, w: int): int = if (a == 0) 0 else if (a == 1) w / 2 else if (a == 2) w else w / 4
  def anchorY(a: int, h: int): int = if (a == 0) 0 else if (a == 1) h / 2 else if (a == 2) h else 3 * h / 4
  // x0.5 x0.75 x1.25 x1.5 x2 x16 x1/16 (ZONE = x1)
  def zoomFactor(k: int): int =
    if (k == 0) 2048 else if (k == 1) 3072 else if (k == 2) 5120 else if (k == 3) 6144
    else if (k == 4) 8192 else if (k == 5) 65536 else 256
  // screen deltas in px: far beyond the world bound on purpose
  def panDelta(k: int): int =
    if (k == 0) -9000000 else if (k == 1) -400 else if (k == 2) 0 else if (k == 3) 5 else 9000000
  // world points (units) a tween can centre on; the last is near the bound
  def pointX(i: int): int = if (i == 0) 0 else if (i == 1) 1000 else if (i == 2) -250000 else 999000
  def pointY(i: int): int = if (i == 0) 0 else if (i == 1) 500 else if (i == 2) 400000 else -999000
  // tween goals: kind = goal / 4 (0 ZMIN, 1 ZMAX, 2 100%, 3 centre on a point)
  def tgtZ(g: int, zf: int): int =
    if (g / 4 == 0) ZMIN else if (g / 4 == 1) ZMAX else if (g / 4 == 2) ZONE else zf
  def tgtX(g: int, t: int, zf: int, w: int): int =
    if (g / 4 == 3) clampT(rdiv((w / 2) * TZ, zf) - pointX(g % 4) * TONE)
    else anchoredT(t, zf, tgtZ(g, zf), anchorX(g % 4, w))
  def tgtY(g: int, t: int, zf: int, h: int): int =
    if (g / 4 == 3) clampT(rdiv((h / 2) * TZ, zf) - pointY(g % 4) * TONE)
    else anchoredT(t, zf, tgtZ(g, zf), anchorY(g % 4, h))

  // ---- predicates used by the invariants ----------------------------------
  def zoomOk(zf: int): bool = and(ZMIN > 0, zf >= ZMIN, zf <= ZMAX)
  def tOk(t: int): bool = absI(t) <= WT
  def axisAnchored(s: int, w0: int, t: int, zf: int): bool =
    or(absI(t) == WT, and(zf > 0, absI(screenToWorld(s, t, zf) - w0) < TONE))

  action init = all {
    vw' = 800,
    vh' = 600,
    tx' = 0,
    ty' = 0,
    z' = 4096,
    rm' = false,
    active' = false,
    tp' = 4,
    stx' = 0,
    sty' = 0,
    sz' = 4096,
    ttx' = 0,
    tty' = 0,
    tz' = 4096,
    anch' = false,
    asx' = 0,
    asy' = 0,
    awx' = 0,
    awy' = 0
  }

  // host resize: the TOP-LEFT stays fixed (tx, ty, z untouched); `vp` picks one of 5 viewports
  action resize = {
    nondet vp = Set(0, 1, 2, 3, 4).oneOf()
    all {
      vw' = VW(vp),
      vh' = VH(vp),
      tx' = tx,
      ty' = ty,
      z' = z,
      rm' = rm,
      active' = active,
      tp' = tp,
      stx' = stx,
      sty' = sty,
      sz' = sz,
      ttx' = ttx,
      tty' = tty,
      tz' = tz,
      anch' = anch,
      asx' = asx,
      asy' = asy,
      awx' = awx,
      awy' = awy
    }
  }

  // reduced-motion preference; turning it on settles a running tween on its target
  action set_motion = {
    nondet reduced = Set(true, false).oneOf()
    all {
      vw' = vw,
      vh' = vh,
      tx' = if (and(reduced, active)) ttx else tx,
      ty' = if (and(reduced, active)) tty else ty,
      z' = if (and(reduced, active)) tz else z,
      rm' = reduced,
      active' = if (reduced) false else active,
      tp' = if (and(reduced, active)) TN else tp,
      stx' = if (and(reduced, active)) ttx else stx,
      sty' = if (and(reduced, active)) tty else sty,
      sz' = if (and(reduced, active)) tz else sz,
      ttx' = ttx,
      tty' = tty,
      tz' = tz,
      anch' = if (and(reduced, active)) false else anch,
      asx' = asx,
      asy' = asy,
      awx' = awx,
      awy' = awy
    }
  }

  // pan by a screen delta (5 x 5 pool: dx = delta % 5, dy = delta / 5); a gesture cancels any tween
  action pan_by = {
    nondet delta = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24).oneOf()
    all {
      vw' = vw,
      vh' = vh,
      tx' = panT(tx, z, panDelta(delta % 5)),
      ty' = panT(ty, z, panDelta(delta / 5)),
      z' = z,
      rm' = rm,
      active' = false,
      tp' = TN,
      stx' = panT(tx, z, panDelta(delta % 5)),
      sty' = panT(ty, z, panDelta(delta / 5)),
      sz' = z,
      ttx' = panT(tx, z, panDelta(delta % 5)),
      tty' = panT(ty, z, panDelta(delta / 5)),
      tz' = z,
      anch' = false,
      asx' = asx,
      asy' = asy,
      awx' = awx,
      awy' = awy
    }
  }

  // zoom by a factor about an anchor: gesture = anchor (% 4) + 4 * factor (7 factors)
  action zoom_at = {
    nondet gesture = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27).oneOf()
    all {
      vw' = vw,
      vh' = vh,
      tx' = anchoredT(tx, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorX(gesture % 4, vw)),
      ty' = anchoredT(ty, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorY(gesture % 4, vh)),
      z' = zoomRequest(z, zoomFactor(gesture / 4)),
      rm' = rm,
      active' = false,
      tp' = TN,
      stx' = anchoredT(tx, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorX(gesture % 4, vw)),
      sty' = anchoredT(ty, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorY(gesture % 4, vh)),
      sz' = zoomRequest(z, zoomFactor(gesture / 4)),
      ttx' = anchoredT(tx, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorX(gesture % 4, vw)),
      tty' = anchoredT(ty, z, zoomRequest(z, zoomFactor(gesture / 4)), anchorY(gesture % 4, vh)),
      tz' = zoomRequest(z, zoomFactor(gesture / 4)),
      anch' = true,
      asx' = anchorX(gesture % 4, vw),
      asy' = anchorY(gesture % 4, vh),
      awx' = screenToWorld(anchorX(gesture % 4, vw), tx, z),
      awy' = screenToWorld(anchorY(gesture % 4, vh), ty, z)
    }
  }

  // zoom straight to a limit about an anchor: limit = anchor (% 4) + 4 * (0 = ZMIN, 1 = ZMAX)
  action zoom_limit = {
    nondet limit = Set(0, 1, 2, 3, 4, 5, 6, 7).oneOf()
    all {
      vw' = vw,
      vh' = vh,
      tx' = anchoredT(tx, z, if (limit < 4) ZMIN else ZMAX, anchorX(limit % 4, vw)),
      ty' = anchoredT(ty, z, if (limit < 4) ZMIN else ZMAX, anchorY(limit % 4, vh)),
      z' = if (limit < 4) ZMIN else ZMAX,
      rm' = rm,
      active' = false,
      tp' = TN,
      stx' = anchoredT(tx, z, if (limit < 4) ZMIN else ZMAX, anchorX(limit % 4, vw)),
      sty' = anchoredT(ty, z, if (limit < 4) ZMIN else ZMAX, anchorY(limit % 4, vh)),
      sz' = if (limit < 4) ZMIN else ZMAX,
      ttx' = anchoredT(tx, z, if (limit < 4) ZMIN else ZMAX, anchorX(limit % 4, vw)),
      tty' = anchoredT(ty, z, if (limit < 4) ZMIN else ZMAX, anchorY(limit % 4, vh)),
      tz' = if (limit < 4) ZMIN else ZMAX,
      anch' = true,
      asx' = anchorX(limit % 4, vw),
      asy' = anchorY(limit % 4, vh),
      awx' = screenToWorld(anchorX(limit % 4, vw), tx, z),
      awy' = screenToWorld(anchorY(limit % 4, vh), ty, z)
    }
  }

  // request a camera move to `goal` (0..11: zoom to ZMIN / ZMAX / 100% about anchor goal % 4;
  // 12..15: centre world point goal - 12 at the current zoom). Under reduced motion the camera
  // jumps to the target at once (the same state a finished tween reaches); otherwise a tween starts.
  action request_tween = {
    nondet goal = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15).oneOf()
    all {
      vw' = vw,
      vh' = vh,
      tx' = if (rm) tgtX(goal, tx, z, vw) else tx,
      ty' = if (rm) tgtY(goal, ty, z, vh) else ty,
      z' = if (rm) tgtZ(goal, z) else z,
      rm' = rm,
      active' = not(rm),
      tp' = if (rm) TN else 0,
      stx' = if (rm) tgtX(goal, tx, z, vw) else tx,
      sty' = if (rm) tgtY(goal, ty, z, vh) else ty,
      sz' = if (rm) tgtZ(goal, z) else z,
      ttx' = tgtX(goal, tx, z, vw),
      tty' = tgtY(goal, ty, z, vh),
      tz' = tgtZ(goal, z),
      anch' = false,
      asx' = asx,
      asy' = asy,
      awx' = awx,
      awy' = awy
    }
  }

  // one animation frame: advance the tween; the last tick lands exactly on the target
  action tween_tick = all {
    vw' = vw,
    vh' = vh,
    tx' = if (active) lerp(stx, ttx, tp + 1) else tx,
    ty' = if (active) lerp(sty, tty, tp + 1) else ty,
    z' = if (active) lerp(sz, tz, tp + 1) else z,
    rm' = rm,
    active' = and(active, tp + 1 < TN),
    tp' = if (active) tp + 1 else tp,
    stx' = if (and(active, tp + 1 >= TN)) ttx else stx,
    sty' = if (and(active, tp + 1 >= TN)) tty else sty,
    sz' = if (and(active, tp + 1 >= TN)) tz else sz,
    ttx' = ttx,
    tty' = tty,
    tz' = tz,
    anch' = and(anch, not(active)),
    asx' = asx,
    asy' = asy,
    awx' = awx,
    awy' = awy
  }

  // stop where the camera is: the target becomes the camera (rest)
  action cancel_tween = all {
    vw' = vw,
    vh' = vh,
    tx' = tx,
    ty' = ty,
    z' = z,
    rm' = rm,
    active' = false,
    tp' = TN,
    stx' = tx,
    sty' = ty,
    sz' = z,
    ttx' = tx,
    tty' = ty,
    tz' = z,
    anch' = anch,
    asx' = asx,
    asy' = asy,
    awx' = awx,
    awy' = awy
  }

  action step = any { init, resize, set_motion, pan_by, zoom_at, zoom_limit, request_tween, tween_tick, cancel_tween }

  // viewport sizes come from the pool
  val ViewportInRange: bool = and(vw >= 320, vw <= 4096, vh >= 240, vh <= 2160)
  // zoom stays in [ZMIN, ZMAX] and ZMIN > 0: screenToWorld is invertible
  val ZoomInRange: bool = zoomOk(z)
  // the viewport origin never leaves the hard world bound
  val OriginInBound: bool = and(tOk(tx), tOk(ty))
  // the tween's start and target are themselves valid cameras
  val TweenEndpointsValid: bool =
    and(zoomOk(sz), zoomOk(tz), tOk(stx), tOk(sty), tOk(ttx), tOk(tty))
  // screen -> world -> screen is the identity on whole pixels (zoom <= 128 keeps it exact)
  val ScreenWorldRoundTrip: bool = and(
    z > 0,
    worldToScreen(screenToWorld(0, tx, z), tx, z) == 0,
    worldToScreen(screenToWorld(vw, tx, z), tx, z) == vw,
    worldToScreen(screenToWorld(vw / 2, tx, z), tx, z) == vw / 2,
    worldToScreen(screenToWorld(0, ty, z), ty, z) == 0,
    worldToScreen(screenToWorld(vh, ty, z), ty, z) == vh,
    worldToScreen(screenToWorld(vh / 3, ty, z), ty, z) == vh / 3
  )
  // zoom about an anchor keeps the anchor's world point within one unit (a limit clamp
  // re-anchors; only a pinned world bound may move it)
  val AnchorFixed: bool =
    or(not(anch), and(axisAnchored(asx, awx, tx, z), axisAnchored(asy, awy, ty, z)))
  // while a tween runs the camera is exactly the interpolation of start -> target at tick tp
  val TweenFollowsLerp: bool =
    or(not(active), and(
      tp >= 0, tp < TN,
      tx == lerp(stx, ttx, tp), ty == lerp(sty, tty, tp), z == lerp(sz, tz, tp)
    ))
  // at rest the camera IS the target: tweened and instant moves end in the same state
  val RestIsOnTarget: bool =
    or(active, and(
      tp == TN, tx == ttx, ty == tty, z == tz, stx == ttx, sty == tty, sz == tz
    ))
  // reduced motion never leaves a tween running
  val ReducedMotionNeverTweens: bool = or(not(rm), not(active))
}
