import {
  type Accessor,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createUniqueId,
  getOwner,
  onCleanup,
  runWithOwner,
  untrack,
} from "solid-js";
import {
  type Boxes,
  type IndexSet,
  type MarqueeMode,
  type SnapCandidates,
  type SnapNode,
  TONE,
  TWEEN_TICKS,
  WORLD_BOUND,
  ZONE,
  anchoredT,
  at,
  centreT,
  clampI,
  clampPos,
  clampZ,
  gridCandidates,
  hitAt,
  lerp,
  liveDD,
  moved,
  nearestOn,
  only,
  panGrab,
  panT,
  rawD,
  rectHits,
  roundHalfUp,
  sameSet,
  screenToWorld,
  snapHit,
  sole,
  toggled,
  union,
  zoomRequest,
} from "./canvas-math";
import { type Prefs, withPrefs } from "./prefs";

export {
  DRAG_PX,
  GRID,
  SNAP_PX,
  TONE,
  TWEEN_TICKS,
  WORLD_BOUND,
  ZMAX,
  ZMIN,
  ZONE,
  gridCandidates,
  type MarqueeMode,
  type SnapAxis,
  type SnapCandidates,
  type SnapContext,
} from "./canvas-math";

/**
 * Headless infinite canvas: camera, selection and node-move state plus attribute / prop objects
 * for a viewport, a camera layer, the nodes and a live region. No elements, no styling beyond the
 * geometry the layout needs (positions, sizes, the camera transform, `content-visibility`).
 * Behaviour is checked against `specs/canvas/{camera,pointer}.qnt` by the scenario bridge
 * (`packages/apg-specs/src/canvas/canvas.bridge.ts`), not by running the generated machines here.
 *
 * ## What this module owns
 * Conventions that mirror the specs exactly (so the bridge can compare bit for bit): integer
 * fixed point, zoom `value * 4096`, translation `world units * 256`, `screen = (world + t) * z`,
 * round half up, top-left-anchored resize, the viewport origin bounded to +-1e6 units, a clamp
 * re-anchors the zoom, a 4 px SCREEN drag threshold, an 8 px SCREEN snap threshold on a 50-unit
 * grid, reduced motion jumps to the same end state a tween reaches. Pointer positions are rounded
 * to whole CSS px.
 *
 * Accessibility (effects-of-atmosphere-h9vk): every node is a real focusable element (`role`,
 * `aria-roledescription`, `aria-label`, `tabindex=0`; never `role=application`); `nodeIds()` is the
 * DOM order = the spatial order (rows by y, then x, then the paint order: the input order until
 * `setOrder`) so Tab and the screen
 * reader follow what is on screen; selected / focused / editing nodes are never culled
 * (`content-visibility: visible`), the rest are `auto` with `contain-intrinsic-size`; focusing a
 * node that is not fully in view pans it to the centre (no animation under reduced motion); a live
 * region announces settled selections and keyboard moves; arrows move the focused node
 * (`keyboardStep`, times `keyboardShiftMultiplier` with Shift) - the no-mouse path.
 *
 * ## What the adapter / host owns (NOT implemented here)
 * - wheel / pinch normalisation: turn a gesture into `panBy` / `zoomBy` / `zoomTo` calls;
 * - easing and durations: `requestFrame` drives the 4 linear ticks (default `requestAnimationFrame`);
 * - fit-to-bounds: compute a goal and call `animateTo`;
 * - the snap candidate policy (`snapCandidates`; a 50-unit grid by default) and hollow / rotated
 *   shape hit rules (a node is its box);
 * - node geometry, z-order and membership when they come from elsewhere (an auto-layout, a node
 *   that grows to its text): push them with `setGeometry` / `setOrder` / `addNodes` /
 *   `removeNodes`. Membership is not in `pointer.qnt` (its node set is fixed at three): it is
 *   tested here, on the real DOM, not replayed against the model;
 * - viewport measuring (call `resize` from a ResizeObserver), the reduced-motion preference (call
 *   `setReducedMotion` from `matchMedia`), the visually-hidden style of the live region, edges.
 *
 * ## Divergences from the specs that are deliberate
 * Keyboard (arrows, Enter, F2, Escape), focus auto-pan and the announcement text are not in the
 * specs; they are tested directly. `role=group` does not list `aria-selected` in ARIA 1.2: pass
 * `role: 'option' | 'treeitem' | 'gridcell'` per node when that matters, otherwise the live region
 * carries the selection.
 *
 * ponytail: a node's label and role are fixed while its id exists (change them by removing and
 * re-adding it after a flush); the row tie-break is the exact y; no window-blur reset of Shift / Space.
 */

export type CanvasMode = "idle" | "pointing" | "panning" | "marquee" | "dragging";

/** Roles that fit a focusable, nameable box; `option` / `treeitem` / `gridcell` accept `aria-selected`. */
export type CanvasNodeRole =
  | "group"
  | "article"
  | "figure"
  | "listitem"
  | "option"
  | "treeitem"
  | "gridcell";

export interface CanvasNodeInput {
  readonly id: string;
  /** World units, whole numbers. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  /** Default `group`. */
  readonly role?: CanvasNodeRole;
  /** Default `canvas node`. */
  readonly roleDescription?: string;
}

/**
 * A host-side change of one node (`Canvas.setGeometry`); omitted fields keep their value. World
 * units; a fractional value rounds half up. A `CanvasNodeInput` is a valid patch.
 */
export interface CanvasNodeGeometry {
  readonly id: string;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface CanvasMove {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface CanvasMessages {
  readonly selection: (labels: readonly string[]) => string;
  readonly moved: (
    label: string,
    direction: "left" | "right" | "up" | "down",
    x: number,
    y: number,
  ) => string;
}

/** A camera goal: zoom to `zoom` (fixed point) about a screen point, or centre a world point. */
export type CanvasGoal =
  | {
      readonly kind: "zoom";
      readonly zoom: number;
      readonly anchor: readonly [x: number, y: number];
    }
  | { readonly kind: "centre"; readonly x: number; readonly y: number };

export interface CanvasOptions {
  /** The initial nodes, bottom of the z-order first. `addNodes` / `removeNodes` change the set later. */
  readonly nodes: readonly CanvasNodeInput[];
  /** Base for the generated DOM ids. */
  readonly id?: string;
  /** Accessible name of the viewport region. */
  readonly label?: string;
  /** Initial viewport size, screen px (default 800 x 600). */
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly marquee?: MarqueeMode;
  readonly snap?: boolean;
  /**
   * The snap policy while `snap` is on: candidate positions per axis for a dragged node's origin,
   * WHOLE world units (a fractional one is ignored). Called on every pointer move of a drag, so it
   * may read live host state. The context carries the dragged node's `id`, `width` and `height`,
   * so edge alignment is `target - width`. With several nodes selected the pressed one is asked.
   * Default `gridCandidates` (every 50 units, what `pointer.qnt` models).
   */
  readonly snapCandidates?: SnapCandidates;
  readonly reducedMotion?: boolean;
  /**
   * Structural mirror of `ing.lexicon.ui.prefs` (`./prefs`). The host resolves
   * the record and injects; honoured here: `motion`, `announce`,
   * `focusFollowsCamera`. Absent prefs keep today's behaviour.
   */
  readonly prefs?: Partial<Prefs> | undefined;
  /** World units per arrow key press (default 10). */
  readonly keyboardStep?: number;
  /** Shift multiplies the step (default 5, so Shift + arrow = one grid cell). */
  readonly keyboardShiftMultiplier?: number;
  /** Drives the tween ticks; default `requestAnimationFrame` when it exists. */
  readonly requestFrame?: (callback: () => void) => void;
  readonly messages?: CanvasMessages;
  /** The settled selection (after a gesture or a key press), never mid-gesture. */
  readonly onSelectionChange?: (ids: readonly string[]) => void;
  /**
   * Committed node positions (pointer up or a key press), changed nodes only. A host's own
   * `setGeometry` echoes here too, with the position AFTER the world-bound clamp.
   */
  readonly onNodesMove?: (moves: readonly CanvasMove[]) => void;
}

export interface CanvasSnapshot {
  readonly viewport: { readonly width: number; readonly height: number };
  /** Fixed point: `tx`, `ty` in world units * 256, `z` = zoom * 4096. */
  readonly camera: {
    readonly tx: number;
    readonly ty: number;
    readonly z: number;
  };
  readonly tweening: boolean;
  readonly reducedMotion: boolean;
  readonly mode: CanvasMode;
  /** Pointer id holding the capture, or `null`. */
  readonly owner: number | null;
  readonly selection: readonly string[];
  readonly cursor: string | null;
  readonly editing: string | null;
  readonly guides: { readonly x: boolean; readonly y: boolean };
  readonly culled: readonly string[];
  readonly announcements: number;
  readonly announcement: string;
}

/**
 * `overflow: clip`, not `hidden`: a `hidden` box is still a scroll container, and focusing a node
 * that is off screen makes the browser scroll it natively (measured: scrollLeft/Top jump to the
 * node) while the camera has not moved yet, which breaks every pointer coordinate. `clip` never
 * scrolls.
 */
export interface CanvasViewportStyle {
  readonly position: "relative";
  readonly overflow: "clip";
  readonly "touch-action": "none";
}

/** Spread onto the labelled region that clips the canvas. */
export interface CanvasViewportProps {
  readonly ref: (element: HTMLElement) => void;
  readonly role: "region";
  readonly "aria-label": string;
  /** Focusable by click only, so Shift / Space keep reaching the canvas after a click on empty space. */
  readonly tabindex: number;
  readonly style: CanvasViewportStyle;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onLostPointerCapture: (event: PointerEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onKeyUp: (event: KeyboardEvent) => void;
}

/**
 * Spread onto the single element that holds the nodes. The camera is one CSS transform
 * (`scale(zoom) translate(t)`) driven by custom properties, so it is observable exactly.
 * `style` is a getter returning a fresh object: Solid spreads read it inside the tracking scope.
 */
export interface CanvasLayerProps {
  readonly style: Readonly<Record<string, string>>;
}

export interface CanvasNodeProps {
  readonly id: string;
  readonly role: CanvasNodeRole;
  readonly "aria-roledescription": string;
  readonly "aria-label": string;
  readonly "aria-selected": "true" | "false";
  readonly tabindex: number;
  readonly style: Readonly<Record<string, string>>;
  readonly onFocus: () => void;
  readonly onFocusOut: (event: FocusEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface CanvasLiveRegionProps {
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface PointerInput {
  /** `PointerEvent.pointerId`. */
  readonly id: number;
  /** Position relative to the viewport, screen px. */
  readonly x: number;
  readonly y: number;
}

export interface Canvas {
  /** Reactive snapshot of everything observable. */
  readonly state: Accessor<CanvasSnapshot>;
  /** Synchronous truth (Solid 2 applies signal writes on the microtask flush). */
  readonly peek: () => CanvasSnapshot;
  /** Node ids in DOM order: rows by y, then x, then input order. */
  readonly nodeIds: Accessor<readonly string[]>;
  readonly isSelected: (id: string) => boolean;
  /** The spec's cull predicate (off screen and not selected / focused / editing). */
  readonly isCulled: (id: string) => boolean;
  /** Live position (whole units): the committed one plus the drag delta of a dragged node. */
  readonly position: (id: string) => { readonly x: number; readonly y: number };
  readonly viewportProps: CanvasViewportProps;
  readonly layerProps: CanvasLayerProps;
  readonly nodeProps: (id: string) => CanvasNodeProps;
  readonly liveRegionProps: CanvasLiveRegionProps;
  /** Pointer entry points (the viewport props call these; adapters may too). */
  readonly pointerDown: (input: PointerInput) => void;
  readonly pointerMove: (input: PointerInput) => void;
  readonly pointerUp: (id: number) => void;
  readonly pointerCancel: (id: number) => void;
  /** Modifiers and parameters are sampled at pointerdown: ignored while a gesture runs. */
  readonly setShift: (held: boolean) => void;
  readonly setSpace: (held: boolean) => void;
  readonly setMarqueeMode: (mode: MarqueeMode) => void;
  readonly setSnap: (on: boolean) => void;
  /** Host resize: the top-left stays fixed. */
  readonly resize: (width: number, height: number) => void;
  /** Turning it on settles a running tween on its target. */
  readonly setReducedMotion: (reduced: boolean) => void;
  /** Pan by a screen delta; cancels a tween. */
  readonly panBy: (dx: number, dy: number) => void;
  /** Zoom by `factor` (fixed point, 4096 = x1) about a screen point (default: the last pointer). */
  readonly zoomBy: (factor: number, anchor?: readonly [number, number]) => void;
  /** Zoom to `zoom` (fixed point), clamped and re-anchored. */
  readonly zoomTo: (zoom: number, anchor?: readonly [number, number]) => void;
  readonly animateTo: (goal: CanvasGoal) => void;
  /** One animation frame of a running tween. */
  readonly tick: () => void;
  readonly cancelTween: () => void;
  /** Enter / leave editing of the single selected node (idle only). */
  readonly toggleEdit: () => void;
  /**
   * Host-controlled geometry (an auto-layout, a node that grew to its text): set the position
   * and / or size of the named nodes, in any mode. Positions are clamped into the world bound
   * (with the new size), a running drag or marquee is re-derived, the DOM order follows (focus is
   * kept) and `onNodesMove` reports the nodes that moved. Throws on an unknown id or a non-finite
   * number, before anything changes.
   */
  readonly setGeometry: (patches: readonly CanvasNodeGeometry[]) => void;
  /**
   * Host-controlled paint order: `ids` is EVERY node id exactly once, bottom of the z-order first
   * (the `nodes` option's convention). Decides `z-index`, the topmost hit and the DOM order's
   * tie-break. Throws if `ids` is not a permutation of the node ids.
   */
  readonly setOrder: (ids: readonly string[]) => void;
  /**
   * Host-controlled membership: insert nodes on top of the z-order, in input order (call
   * `setOrder` to place them elsewhere). Positions are clamped into the world bound and an
   * inserted node whose position was clamped is reported through `onNodesMove`. Existing nodes keep
   * their position, selection, cursor and focus; a running marquee is re-derived. Throws on an id
   * that exists already or repeats, or a non-finite number, before anything changes.
   */
  readonly addNodes: (nodes: readonly CanvasNodeInput[]) => void;
  /**
   * Remove nodes. They leave the selection (a settled selection that lost a member is announced
   * and reported through `onSelectionChange`) and clear the cursor / editing when they held it;
   * removing the node a pointer gesture started on cancels that gesture. Survivors keep their DOM
   * ids and focus; the z-order closes up. Throws on an unknown or repeated id before anything
   * changes.
   */
  readonly removeNodes: (ids: readonly string[]) => void;
}

const DEFAULT_VIEWPORT = { width: 800, height: 600 } as const;
const DEFAULT_STEP = 10;
const DEFAULT_SHIFT_MULTIPLIER = 5;
const PRIMARY_BUTTON = 0;

const DEFAULT_MESSAGES: CanvasMessages = {
  selection: (labels) => {
    if (labels.length === 0) {
      return "Selection cleared";
    }
    return labels.length === 1
      ? `${labels[0] ?? ""} selected`
      : `${labels.length} nodes selected: ${labels.join(", ")}`;
  },
  moved: (label, direction, x, y) => `${label} moved ${direction} to ${x}, ${y}`,
};

type Direction = "left" | "right" | "up" | "down";
const ARROWS = new Map<string, readonly [number, number, Direction]>([
  ["ArrowLeft", [-1, 0, "left"]],
  ["ArrowRight", [1, 0, "right"]],
  ["ArrowUp", [0, -1, "up"]],
  ["ArrowDown", [0, 1, "down"]],
]);

/** What a node keeps besides its geometry; resolved once, when the node is added. */
interface NodeMeta {
  readonly id: string;
  readonly label: string;
  readonly role: CanvasNodeRole;
  readonly roleDescription: string;
}

interface State extends Boxes {
  /** Per node, parallel to the geometry arrays; every index below is a position in here. */
  readonly meta: readonly NodeMeta[];
  /** `meta` by id: replaced only when membership changes. */
  readonly index: ReadonlyMap<string, number>;
  readonly vw: number;
  readonly vh: number;
  readonly tx: number;
  readonly ty: number;
  readonly z: number;
  readonly rm: boolean;
  readonly active: boolean;
  readonly tp: number;
  readonly stx: number;
  readonly sty: number;
  readonly sz: number;
  readonly ttx: number;
  readonly tty: number;
  readonly tz: number;
  readonly mode: CanvasMode;
  readonly owner: number | null;
  readonly tgt: number;
  readonly shift: boolean;
  readonly space: boolean;
  readonly mqmode: MarqueeMode;
  readonly snapOn: boolean;
  readonly candidates: SnapCandidates;
  readonly px: number;
  readonly py: number;
  readonly downx: number;
  readonly downy: number;
  /** The world point (fp) under the pointer at pointerdown. */
  readonly gx: number;
  readonly gy: number;
  readonly sel: IndexSet;
  /** The selection at pointerdown: the abort target and the additive base. */
  readonly selSnap: IndexSet;
  readonly cursor: number;
  readonly editing: number;
  readonly ddx: number;
  readonly ddy: number;
  readonly guideX: boolean;
  readonly guideY: boolean;
  readonly annCount: number;
  readonly annSel: IndexSet;
  readonly annText: string;
}

const metaOf = (node: CanvasNodeInput): NodeMeta => ({
  id: node.id,
  label: node.label,
  role: node.role ?? "group",
  roleDescription: node.roleDescription ?? "canvas node",
});

const indexOfMeta = (meta: readonly NodeMeta[]): ReadonlyMap<string, number> =>
  new Map(meta.map((node, index) => [node.id, index]));

const idAt = (s: State, index: number): string => s.meta[index]?.id ?? "";
const labelAt = (s: State, index: number): string => s.meta[index]?.label ?? "";

/**
 * The scale an element inherits from ancestor CSS transforms: its rendered width over its layout
 * width. `getBoundingClientRect` folds every ancestor transform into the rect, so a canvas nested
 * in a scaled ancestor reads screen px; dividing by this recovers the element's own px. At scale 1
 * this is 1, so an ordinary canvas is untouched. A hidden element (no layout or rendered width)
 * has no scale to read, so it stays 1.
 */
const renderedScale = (element: Element): number => {
  if (!(element instanceof HTMLElement)) {
    return 1;
  }
  const layout = element.offsetWidth;
  const rendered = element.getBoundingClientRect().width;
  return layout === 0 || rendered === 0 ? 1 : rendered / layout;
};

interface NodeMemos {
  readonly x: Accessor<number>;
  readonly y: Accessor<number>;
  readonly selected: Accessor<boolean>;
  readonly exempt: Accessor<boolean>;
  readonly culled: Accessor<boolean>;
}

/**
 * What a node id keeps for the host's rendering: its props and reactive reads. Per id, not per
 * index, so a node inserted or removed elsewhere changes neither, and it outlives the node until
 * the next flush - a render computation that still holds a removed id must not find it missing.
 */
interface NodeSlot {
  readonly props: CanvasNodeProps;
  readonly memos: NodeMemos;
  readonly key: number;
  readonly dispose: () => void;
}

/** Ranks 0..n-1 in the same relative order: the paint order after nodes left. */
const densed = (ranks: readonly number[]): number[] => {
  const out = ranks.map(() => 0);
  ranks
    .map((_, i) => i)
    .sort((a, b) => at(ranks, a) - at(ranks, b))
    .forEach((i, rank) => {
      out[i] = rank;
    });
  return out;
};

const snapNode = (s: State, index: number): SnapNode => ({
  id: idAt(s, index),
  width: at(s.ws, index),
  height: at(s.hs, index),
});

// ---- pure transitions over a State (the spec's actions) ------------------------------------

/** Set the camera and stop any tween where it is. */
const rest = (s: State, tx: number, ty: number, z: number): State => ({
  ...s,
  tx,
  ty,
  z,
  active: false,
  tp: TWEEN_TICKS,
  stx: tx,
  sty: ty,
  sz: z,
  ttx: tx,
  tty: ty,
  tz: z,
});

/** Re-derive what a running gesture computes from the pointer and the camera. */
const derive = (s: State): State => {
  const wx = screenToWorld(s.px, s.tx, s.z);
  const wy = screenToWorld(s.py, s.ty, s.z);
  if (s.mode === "dragging") {
    const bx = at(s.xs, s.tgt);
    const by = at(s.ys, s.tgt);
    const node = snapNode(s, s.tgt);
    const nearX = nearestOn(s.candidates, "x", node);
    const nearY = nearestOn(s.candidates, "y", node);
    return {
      ...s,
      ddx: liveDD(wx, s.gx, bx, s.snapOn, s.z, nearX),
      ddy: liveDD(wy, s.gy, by, s.snapOn, s.z, nearY),
      guideX: snapHit(bx + rawD(wx, s.gx), s.snapOn, s.z, nearX),
      guideY: snapHit(by + rawD(wy, s.gy), s.snapOn, s.z, nearY),
    };
  }
  if (s.mode === "marquee") {
    const hits = rectHits(
      s,
      s.mqmode,
      Math.min(s.gx, wx),
      Math.min(s.gy, wy),
      Math.max(s.gx, wx),
      Math.max(s.gy, wy),
    );
    return { ...s, sel: s.shift ? union(s.selSnap, hits) : hits };
  }
  return s;
};

const zoomedTo = (s: State, request: number, ax: number, ay: number): State => {
  const z = clampZ(request);
  // a hand-tool pan re-grabs so it never keeps a stale offset; anything else zooms about the anchor
  return derive(
    s.mode === "panning"
      ? rest(s, panGrab(s.px, z, s.gx), panGrab(s.py, z, s.gy), z)
      : rest(s, anchoredT(s.tx, s.z, z, ax), anchoredT(s.ty, s.z, z, ay), z),
  );
};

/** Request a camera move: a tween, or the same end state at once under reduced motion. */
const animated = (s: State, goal: CanvasGoal): State => {
  const target =
    goal.kind === "centre"
      ? {
          tx: centreT(s.vw, s.z, goal.x),
          ty: centreT(s.vh, s.z, goal.y),
          z: s.z,
        }
      : {
          tx: anchoredT(s.tx, s.z, clampZ(goal.zoom), goal.anchor[0]),
          ty: anchoredT(s.ty, s.z, clampZ(goal.zoom), goal.anchor[1]),
          z: clampZ(goal.zoom),
        };
  if (s.rm) {
    return rest(s, target.tx, target.ty, target.z);
  }
  return {
    ...s,
    active: true,
    tp: 0,
    stx: s.tx,
    sty: s.ty,
    sz: s.z,
    ttx: target.tx,
    tty: target.ty,
    tz: target.z,
  };
};

const ticked = (s: State): State => {
  if (!s.active) {
    return s;
  }
  const p = s.tp + 1;
  const done = p >= TWEEN_TICKS;
  return {
    ...s,
    tx: lerp(s.stx, s.ttx, p),
    ty: lerp(s.sty, s.tty, p),
    z: lerp(s.sz, s.tz, p),
    active: !done,
    tp: p,
    stx: done ? s.ttx : s.stx,
    sty: done ? s.tty : s.sty,
    sz: done ? s.tz : s.sz,
  };
};

const liveX = (s: State, i: number): number =>
  at(s.xs, i) + (s.mode === "dragging" && s.sel.has(i) ? s.ddx : 0);
const liveY = (s: State, i: number): number =>
  at(s.ys, i) + (s.mode === "dragging" && s.sel.has(i) ? s.ddy : 0);

const inView = (s: State, i: number): boolean =>
  liveX(s, i) * TONE < screenToWorld(s.vw, s.tx, s.z) &&
  (liveX(s, i) + at(s.ws, i)) * TONE > screenToWorld(0, s.tx, s.z) &&
  liveY(s, i) * TONE < screenToWorld(s.vh, s.ty, s.z) &&
  (liveY(s, i) + at(s.hs, i)) * TONE > screenToWorld(0, s.ty, s.z);

const exempt = (s: State, i: number): boolean => s.sel.has(i) || s.cursor === i || s.editing === i;

const culled = (s: State, i: number): boolean => !inView(s, i) && !exempt(s, i);

const fullyInView = (s: State, i: number): boolean =>
  at(s.xs, i) * TONE >= screenToWorld(0, s.tx, s.z) &&
  (at(s.xs, i) + at(s.ws, i)) * TONE <= screenToWorld(s.vw, s.tx, s.z) &&
  at(s.ys, i) * TONE >= screenToWorld(0, s.ty, s.z) &&
  (at(s.ys, i) + at(s.hs, i)) * TONE <= screenToWorld(s.vh, s.ty, s.z);

const spatialOrder = (s: State): readonly number[] =>
  s.xs
    .map((_, i) => i)
    .sort(
      (a, b) =>
        at(s.ys, a) - at(s.ys, b) || at(s.xs, a) - at(s.xs, b) || at(s.ranks, a) - at(s.ranks, b),
    );

const initialState = (nodes: readonly CanvasNodeInput[], options: CanvasOptions): State => ({
  xs: nodes.map((node) => node.x),
  ys: nodes.map((node) => node.y),
  ws: nodes.map((node) => node.width),
  hs: nodes.map((node) => node.height),
  ranks: nodes.map((_, index) => index),
  meta: nodes.map(metaOf),
  index: indexOfMeta(nodes.map(metaOf)),
  vw: (options.viewport ?? DEFAULT_VIEWPORT).width,
  vh: (options.viewport ?? DEFAULT_VIEWPORT).height,
  tx: 0,
  ty: 0,
  z: ZONE,
  rm: options.reducedMotion ?? withPrefs(options.prefs).motion === "reduce",
  active: false,
  tp: TWEEN_TICKS,
  stx: 0,
  sty: 0,
  sz: ZONE,
  ttx: 0,
  tty: 0,
  tz: ZONE,
  mode: "idle",
  owner: null,
  tgt: -1,
  shift: false,
  space: false,
  mqmode: options.marquee ?? "contain",
  snapOn: options.snap ?? false,
  candidates: options.snapCandidates ?? gridCandidates,
  px: 0,
  py: 0,
  downx: 0,
  downy: 0,
  gx: 0,
  gy: 0,
  sel: new Set(),
  selSnap: new Set(),
  cursor: -1,
  editing: -1,
  ddx: 0,
  ddy: 0,
  guideX: false,
  guideY: false,
  annCount: 0,
  annSel: new Set(),
  annText: "",
});

const selectionOnDown = (hit: number, space: boolean, shift: boolean, sel: IndexSet): IndexSet => {
  if (space) {
    return sel;
  }
  if (hit >= 0) {
    if (sel.has(hit)) {
      return sel;
    }
    return shift ? union(sel, only(hit)) : only(hit);
  }
  return shift ? sel : new Set();
};

const selectionAfterUp = (s: State): IndexSet => {
  if (s.mode !== "pointing") {
    return s.sel;
  }
  if (s.tgt >= 0) {
    return s.shift ? toggled(s.selSnap, s.tgt) : only(s.tgt);
  }
  return s.shift ? s.selSnap : new Set();
};

export const createCanvas = (options: CanvasOptions): Canvas => {
  const prefs = withPrefs(options.prefs);
  const base = options.id ?? createUniqueId();
  const owner = getOwner();
  const messages = (): CanvasMessages => options.messages ?? DEFAULT_MESSAGES;

  let state = initialState(options.nodes, options);
  let nextKey = 0;
  const indexFor = (id: string): number => {
    const index = state.index.get(id);
    if (index === undefined) {
      throw new Error(`canvas has no node "${id}"`);
    }
    return index;
  };
  const [view, setView] = createSignal(state);
  // Sizes and paint order change only by the host, so they get their own signal: a pointer move
  // must not re-run a per-node size / z-index computation for every node.
  const [boxes, setBoxes] = createSignal<State>(state);
  let viewport: HTMLElement | undefined;
  let internalFocus = false;
  let restoreFocus: HTMLElement | null = null;
  let frameQueued = false;
  let disposed = false;
  const retired: string[] = [];
  const slots = new Map<string, NodeSlot>();
  const domId = (key: number): string => `${base}-node-${key}`;
  onCleanup(() => {
    disposed = true;
  });

  const idsOf = (s: State, set: IndexSet): readonly string[] =>
    [...set].sort((a, b) => a - b).map((i) => idAt(s, i));

  const snapshotOf = (s: State): CanvasSnapshot => ({
    viewport: { width: s.vw, height: s.vh },
    camera: { tx: s.tx, ty: s.ty, z: s.z },
    tweening: s.active,
    reducedMotion: s.rm,
    mode: s.mode,
    owner: s.owner,
    selection: idsOf(s, s.sel),
    cursor: s.cursor < 0 ? null : idAt(s, s.cursor),
    editing: s.editing < 0 ? null : idAt(s, s.editing),
    guides: { x: s.guideX, y: s.guideY },
    culled: s.xs.flatMap((_, i) => (culled(s, i) ? [idAt(s, i)] : [])),
    announcements: s.annCount,
    announcement: s.annText,
  });

  const orderedIds = (s: State): readonly string[] => spatialOrder(s).map((i) => idAt(s, i));
  const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && a.every((id, i) => id === b[i]);
  // equal order keeps the array, so `For` is not re-run by a pointer move
  const nodeIds = createMemo(() => orderedIds(view()), { equals: sameIds });

  // ---- DOM helpers (only touched from event handlers and effects) --------------------------

  const nodeElement = (index: number): HTMLElement | null => {
    const slot = slots.get(idAt(state, index));
    return slot === undefined
      ? null
      : (viewport?.querySelector<HTMLElement>(`[id="${domId(slot.key)}"]`) ?? null);
  };

  const focusNode = (index: number): void => {
    const element = nodeElement(index);
    if (element !== null) {
      internalFocus = true;
      element.focus({ preventScroll: true });
      internalFocus = false;
    }
  };

  /** The focused element inside the viewport (a node, or the host's editor in one), if any. */
  const focusedInside = (): HTMLElement | null => {
    const active = viewport?.ownerDocument.activeElement;
    return viewport !== undefined &&
      active instanceof HTMLElement &&
      active !== viewport &&
      viewport.contains(active)
      ? active
      : null;
  };

  // Moving a focused element in the DOM drops its focus; the DOM order follows the committed
  // positions, so a commit that reorders the nodes gives the focus back afterwards - to the
  // element that had it, which is the host's editor when a node is being edited. Runs after every
  // flush so a reorder that was undone before the DOM moved does not leave `restoreFocus` set.
  createEffect(view, () => {
    const element = restoreFocus;
    restoreFocus = null;
    if (element?.isConnected === true) {
      internalFocus = true;
      element.focus({ preventScroll: true });
      internalFocus = false;
    }
    // the slots of removed nodes go once the DOM no longer reads them (unless the id came back)
    for (const id of retired.splice(0)) {
      if (!state.index.has(id)) {
        slots.get(id)?.dispose();
        slots.delete(id);
      }
    }
  });

  // ---- commit ------------------------------------------------------------------------------

  const frameScheduler = (): ((callback: () => void) => void) | undefined => {
    if (options.requestFrame !== undefined) {
      return options.requestFrame;
    }
    return typeof requestAnimationFrame === "function"
      ? (callback) => {
          requestAnimationFrame(callback);
        }
      : undefined;
  };

  const notify = (prev: State, next: State): void => {
    if (next.annCount !== prev.annCount) {
      options.onSelectionChange?.(idsOf(next, next.annSel));
    }
    if (next.xs === prev.xs && next.ys === prev.ys) {
      return;
    }
    // by id: membership changes shift the indices
    const moves = next.meta.flatMap(({ id }, i) => {
      const was = prev.index.get(id);
      return was !== undefined &&
        (at(next.xs, i) !== at(prev.xs, was) || at(next.ys, i) !== at(prev.ys, was))
        ? [{ id, x: at(next.xs, i), y: at(next.ys, i) }]
        : [];
    });
    if (moves.length > 0) {
      options.onNodesMove?.(moves);
    }
  };

  const commit = (next: State): void => {
    const prev = state;
    if (next === prev) {
      return;
    }
    // a membership change moves elements too, even when the survivors keep their relative order
    if (
      next.meta !== prev.meta ||
      ((next.xs !== prev.xs || next.ys !== prev.ys || next.ranks !== prev.ranks) &&
        !sameIds(orderedIds(next), orderedIds(prev)))
    ) {
      restoreFocus = focusedInside() ?? restoreFocus;
    }
    state = next;
    setView(next);
    if (next.ws !== prev.ws || next.hs !== prev.hs || next.ranks !== prev.ranks) {
      setBoxes(next);
    }
    notify(prev, next);
    const schedule = frameScheduler();
    if (next.active && !frameQueued && schedule !== undefined) {
      frameQueued = true;
      schedule(() => {
        frameQueued = false;
        if (!disposed) {
          commit(ticked(state));
        }
      });
    }
  };

  /** Announce a settled selection, once per change (the spec's annCount / annSel outputs). */
  const announcing = (s: State, ann: IndexSet): State => ({
    ...s,
    annCount: s.annCount + 1,
    annSel: ann,
    annText: prefs.announce
      ? messages().selection([...ann].sort((a, b) => a - b).map((i) => labelAt(s, i)))
      : "",
  });

  const announced = (s: State, sel: IndexSet): State =>
    sameSet(sel, s.annSel) ? { ...s, sel } : announcing({ ...s, sel }, sel);

  // ---- the pointer machine -----------------------------------------------------------------

  const pointerDown = ({ id, x, y }: PointerInput): void => {
    const s = state;
    if (s.mode !== "idle") {
      return;
    }
    const px = roundHalfUp(x);
    const py = roundHalfUp(y);
    const gx = screenToWorld(px, s.tx, s.z);
    const gy = screenToWorld(py, s.ty, s.z);
    const hit = hitAt(s, gx, gy);
    // A press whose topmost hit is the node being edited is not a gesture: it leaves the machine
    // idle and keeps `editing`, so a mouse press inside a text editor selects text instead of
    // starting a drag. Mirrors `downGesture` in pointer.qnt. A press elsewhere ends editing.
    if (s.editing >= 0 && hit === s.editing) {
      return;
    }
    const grabbed = !s.space && hit >= 0;
    commit({
      ...rest(s, s.tx, s.ty, s.z),
      mode: s.space ? "panning" : "pointing",
      owner: id,
      tgt: s.space ? -1 : hit,
      px,
      py,
      downx: px,
      downy: py,
      gx,
      gy,
      sel: selectionOnDown(hit, s.space, s.shift, s.sel),
      selSnap: s.sel,
      cursor: grabbed ? hit : s.cursor,
      editing: -1,
    });
    if (grabbed) {
      focusNode(hit);
    }
  };

  const pointerMove = ({ id, x, y }: PointerInput): void => {
    const s = state;
    const px = roundHalfUp(x);
    const py = roundHalfUp(y);
    if (s.mode === "idle") {
      commit({ ...s, px, py });
      return;
    }
    if (id !== s.owner) {
      return;
    }
    const mode: CanvasMode =
      s.mode === "pointing" && moved(px, py, s.downx, s.downy)
        ? s.tgt >= 0
          ? "dragging"
          : "marquee"
        : s.mode;
    const grabbing = s.mode === "panning";
    commit(
      derive({
        ...(grabbing ? rest(s, panGrab(px, s.z, s.gx), panGrab(py, s.z, s.gy), s.z) : s),
        mode,
        px,
        py,
      }),
    );
  };

  const finish = (s: State, sel: IndexSet): State => ({
    ...announced(s, sel),
    mode: "idle",
    owner: null,
    tgt: -1,
    selSnap: sel,
    ddx: 0,
    ddy: 0,
    guideX: false,
    guideY: false,
  });

  const pointerUp = (id: number): void => {
    const s = state;
    if (s.mode === "idle" || id !== s.owner) {
      return;
    }
    const dragged = s.mode === "dragging";
    const committedAt = (values: readonly number[], extents: readonly number[], d: number) =>
      values.map((value, i) =>
        dragged && s.sel.has(i) ? clampPos(value + d, at(extents, i)) : value,
      );
    commit({
      ...finish(s, selectionAfterUp(s)),
      xs: committedAt(s.xs, s.ws, s.ddx),
      ys: committedAt(s.ys, s.hs, s.ddy),
    });
  };

  const pointerCancel = (id: number): void => {
    const s = state;
    if (s.mode === "idle" || id !== s.owner) {
      return;
    }
    commit(finish(s, s.selSnap));
  };

  // modifiers and parameters are sampled at pointerdown: a change mid-gesture is ignored
  const whileIdle = (change: (s: State) => State): void => {
    if (state.mode === "idle") {
      commit(change(state));
    }
  };

  const setModifier = (key: "shift" | "space", held: boolean): void => {
    if (state[key] !== held) {
      whileIdle((s) => (key === "shift" ? { ...s, shift: held } : { ...s, space: held }));
    }
  };

  // ---- host-controlled geometry ------------------------------------------------------------
  // Mirrors `host_move` in pointer.qnt for positions (sizes and order are not modelled): applied
  // at once in every mode, clamped, and a running drag / marquee re-derived like a camera change.

  const whole = (id: string, value: number): number => {
    if (!Number.isFinite(value)) {
      throw new Error(`canvas node "${id}" needs finite geometry, got ${value}`);
    }
    return roundHalfUp(value);
  };

  const extent = (id: string, value: number): number =>
    clampI(whole(id, value), 0, 2 * WORLD_BOUND);

  const setGeometry = (patches: readonly CanvasNodeGeometry[]): void => {
    const s = state;
    const xs = [...s.xs];
    const ys = [...s.ys];
    const ws = [...s.ws];
    const hs = [...s.hs];
    for (const patch of patches) {
      const index = indexFor(patch.id);
      const width = patch.width === undefined ? at(ws, index) : extent(patch.id, patch.width);
      const height = patch.height === undefined ? at(hs, index) : extent(patch.id, patch.height);
      ws[index] = width;
      hs[index] = height;
      xs[index] = clampPos(patch.x === undefined ? at(xs, index) : whole(patch.id, patch.x), width);
      ys[index] = clampPos(
        patch.y === undefined ? at(ys, index) : whole(patch.id, patch.y),
        height,
      );
    }
    commit(derive({ ...s, xs, ys, ws, hs }));
  };

  const setOrder = (ids: readonly string[]): void => {
    const count = state.meta.length;
    const ranks = state.meta.map(() => -1);
    ids.forEach((id, rank) => {
      const index = indexFor(id);
      if (ranks[index] !== -1) {
        throw new Error(`canvas order lists node "${id}" twice`);
      }
      ranks[index] = rank;
    });
    if (ids.length !== count) {
      throw new Error(`canvas order lists ${ids.length} of ${count} nodes`);
    }
    commit({ ...state, ranks });
  };

  // ---- host-controlled membership ----------------------------------------------------------
  // Not in pointer.qnt (its node set is fixed): the survivors' indices shift, so every index held
  // in the state (selections, cursor, editing, the pressed node) is renumbered here.

  const addNodes = (inputs: readonly CanvasNodeInput[]): void => {
    const s = state;
    if (inputs.length === 0) {
      return;
    }
    const seen = new Set(s.index.keys());
    const placed = inputs.map((node) => {
      if (seen.has(node.id)) {
        throw new Error(`canvas already has node "${node.id}"`);
      }
      seen.add(node.id);
      const width = extent(node.id, node.width);
      const height = extent(node.id, node.height);
      return {
        node,
        width,
        height,
        x: clampPos(whole(node.id, node.x), width),
        y: clampPos(whole(node.id, node.y), height),
      };
    });
    const meta = [...s.meta, ...placed.map(({ node }) => metaOf(node))];
    commit(
      derive({
        ...s,
        meta,
        index: indexOfMeta(meta),
        xs: [...s.xs, ...placed.map(({ x }) => x)],
        ys: [...s.ys, ...placed.map(({ y }) => y)],
        ws: [...s.ws, ...placed.map(({ width }) => width)],
        hs: [...s.hs, ...placed.map(({ height }) => height)],
        ranks: [...s.ranks, ...placed.map((_, k) => s.ranks.length + k)],
      }),
    );
    const clamped = placed.flatMap(({ node, x, y }) =>
      x === node.x && y === node.y ? [] : [{ id: node.id, x, y }],
    );
    if (clamped.length > 0) {
      options.onNodesMove?.(clamped);
    }
  };

  const removeNodes = (ids: readonly string[]): void => {
    const s = state;
    const dropped = new Set<number>();
    for (const id of ids) {
      const index = indexFor(id);
      if (dropped.has(index)) {
        throw new Error(`canvas removes node "${id}" twice`);
      }
      dropped.add(index);
    }
    if (dropped.size === 0) {
      return;
    }
    const renumbered = new Map(
      s.meta
        .flatMap((_, i) => (dropped.has(i) ? [] : [i]))
        .map((was, now): [number, number] => [was, now]),
    );
    const renumber = (index: number): number => renumbered.get(index) ?? -1;
    const renumberSet = (set: IndexSet): IndexSet =>
      new Set(
        [...set].flatMap((index) => {
          const now = renumber(index);
          return now < 0 ? [] : [now];
        }),
      );
    const keep = <T>(values: readonly T[]): T[] => values.filter((_, i) => !dropped.has(i));
    const meta = keep(s.meta);
    const trimmed: State = {
      ...s,
      meta,
      index: indexOfMeta(meta),
      xs: keep(s.xs),
      ys: keep(s.ys),
      ws: keep(s.ws),
      hs: keep(s.hs),
      ranks: densed(keep(s.ranks)),
      sel: renumberSet(s.sel),
      selSnap: renumberSet(s.selSnap),
      annSel: renumberSet(s.annSel),
      cursor: renumber(s.cursor),
      editing: renumber(s.editing),
      tgt: renumber(s.tgt),
    };
    // the pressed node is gone: the gesture has nothing to act on, so it ends like a cancel
    const settled =
      s.tgt >= 0 && dropped.has(s.tgt) ? finish(trimmed, trimmed.selSnap) : derive(trimmed);
    const lostAnnounced = [...s.annSel].some((index) => dropped.has(index));
    commit(
      lostAnnounced && settled.annCount === s.annCount
        ? announcing(settled, settled.annSel)
        : settled,
    );
    // unless the id comes back before then
    retired.push(...ids);
  };

  // ---- keyboard ----------------------------------------------------------------------------

  const toggleEdit = (): void => {
    const s = state;
    if (s.mode !== "idle") {
      return;
    }
    const single = sole(s.sel);
    commit({
      ...s,
      cursor: s.editing < 0 && single >= 0 ? single : s.cursor,
      editing: s.editing >= 0 ? -1 : single,
    });
  };

  const moveFrom = (index: number, dx: number, dy: number, direction: Direction): void => {
    const s = state;
    if (s.mode !== "idle") {
      return;
    }
    const group = s.sel.has(index) ? s.sel : only(index);
    const xs = s.xs.map((x, i) => (group.has(i) ? clampPos(x + dx, at(s.ws, i)) : x));
    const ys = s.ys.map((y, i) => (group.has(i) ? clampPos(y + dy, at(s.hs, i)) : y));
    commit({
      ...s,
      xs,
      ys,
      annCount: s.annCount + 1,
      annText: prefs.announce
        ? messages().moved(labelAt(s, index), direction, at(xs, index), at(ys, index))
        : "",
    });
  };

  const activate = (index: number, additive: boolean): void => {
    const s = state;
    if (s.mode === "idle") {
      const sel = additive ? toggled(s.sel, index) : only(index);
      commit({ ...announced({ ...s, cursor: index }, sel), selSnap: sel });
    }
  };

  const onNodeFocus = (id: string): void => {
    const index = state.index.get(id);
    if (internalFocus || index === undefined) {
      return;
    }
    const s = { ...state, cursor: index };
    commit(
      s.mode === "idle" && prefs.focusFollowsCamera && !fullyInView(s, index)
        ? animated(s, {
            kind: "centre",
            x: at(s.xs, index) + Math.floor(at(s.ws, index) / 2),
            y: at(s.ys, index) + Math.floor(at(s.hs, index) / 2),
          })
        : s,
    );
  };

  // Leaving the node ends editing - that is how a native Tab from the host's editor continues in
  // spatial order. Moving focus to something INSIDE the node must not end it: that is the host
  // focusing its editor when `editing` becomes this node.
  const onNodeFocusOut = (id: string, event: FocusEvent): void => {
    const index = state.index.get(id);
    // the focus-out of a node that a reorder is moving is not the user leaving it
    if (index === undefined || state.editing !== index || restoreFocus !== null) {
      return;
    }
    const element = nodeElement(index);
    const next = event.relatedTarget;
    if (element === null || !(next instanceof Node) || !element.contains(next)) {
      toggleEdit();
    }
  };

  const onNodeKey = (id: string, event: KeyboardEvent): void => {
    const index = state.index.get(id);
    // An IME composition owns the keyboard: Escape / F2 / arrows must not act mid-composition
    // (keyCode 229 is the legacy "composition in progress" marker).
    if (index === undefined || event.isComposing || event.keyCode === 229) {
      return;
    }
    if (state.editing === index) {
      if (event.key === "Escape" || event.key === "F2") {
        event.preventDefault();
        toggleEdit();
        // The host's editor unmounts when editing ends; put focus back on the node. The
        // focus-out path (Tab) must NOT do this - focus is already moving to the next node.
        focusNode(index);
      }
      return;
    }
    const arrow = ARROWS.get(event.key);
    if (arrow !== undefined) {
      event.preventDefault();
      const step =
        (options.keyboardStep ?? DEFAULT_STEP) *
        (event.shiftKey ? (options.keyboardShiftMultiplier ?? DEFAULT_SHIFT_MULTIPLIER) : 1);
      moveFrom(index, arrow[0] * step, arrow[1] * step, arrow[2]);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(index, event.shiftKey);
    } else if (event.key === "F2") {
      event.preventDefault();
      toggleEdit();
    }
  };

  // ---- DOM event adapters ------------------------------------------------------------------

  const local = (event: PointerEvent): PointerInput => {
    const element = event.currentTarget instanceof Element ? event.currentTarget : viewport;
    const rect = element?.getBoundingClientRect();
    // The rect is in screen px (ancestor transforms included); the border offsets scale with it.
    const scale = element === undefined ? 1 : renderedScale(element);
    return {
      id: event.pointerId,
      x: (event.clientX - (rect?.left ?? 0)) / scale - (element?.clientLeft ?? 0),
      y: (event.clientY - (rect?.top ?? 0)) / scale - (element?.clientTop ?? 0),
    };
  };

  const capture = (event: PointerEvent): void => {
    try {
      if (event.currentTarget instanceof Element) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch {
      // synthetic pointers (tests, assistive technology) are not active pointers: nothing to capture
    }
  };

  const viewportProps: CanvasViewportProps = {
    ref: (element) => {
      viewport = element;
    },
    role: "region",
    "aria-label": options.label ?? "Canvas",
    tabindex: -1,
    style: {
      position: "relative",
      overflow: "clip",
      "touch-action": "none",
    },
    onPointerDown: (event) => {
      if (event.button === PRIMARY_BUTTON) {
        pointerDown(local(event));
        if (state.owner === event.pointerId) {
          capture(event);
        }
      }
    },
    onPointerMove: (event) => pointerMove(local(event)),
    onPointerUp: (event) => pointerUp(event.pointerId),
    onPointerCancel: (event) => pointerCancel(event.pointerId),
    onLostPointerCapture: (event) => pointerCancel(event.pointerId),
    onKeyDown: (event) => {
      if (event.key === "Shift") {
        setModifier("shift", true);
      } else if (event.key === " " && state.editing < 0) {
        event.preventDefault();
        setModifier("space", true);
      }
    },
    onKeyUp: (event) => {
      if (event.key === "Shift") {
        setModifier("shift", false);
      } else if (event.key === " ") {
        setModifier("space", false);
      }
    },
  };

  // ---- reactive views ----------------------------------------------------------------------

  const pick = <T>(read: (s: State) => T): Accessor<T> => createMemo(() => read(view()));
  const tx = pick((s) => s.tx);
  const ty = pick((s) => s.ty);
  const zoom = pick((s) => s.z);
  // Made on first use, under the canvas's owner (not the caller's, which may be a `For` row that
  // goes away first). A node that is gone reads as index -1, so a stale memo cannot throw.
  const makeSlot = (id: string): NodeSlot => {
    const node = state.meta[indexFor(id)];
    const key = nextKey;
    nextKey += 1;
    // untracked: the first caller is often a render computation that must not subscribe to `view`
    const made = untrack(() =>
      runWithOwner(owner, () =>
        createRoot((dispose) => {
          const slot = (s: State): number => s.index.get(id) ?? -1;
          const memos: NodeMemos = {
            x: pick((s) => liveX(s, slot(s))),
            y: pick((s) => liveY(s, slot(s))),
            selected: pick((s) => s.sel.has(slot(s))),
            exempt: pick((s) => exempt(s, slot(s))),
            culled: pick((s) => culled(s, slot(s))),
          };
          return { memos, dispose };
        }),
      ),
    );
    if (made === undefined) {
      throw new Error(`canvas could not track node "${id}"`);
    }
    const { memos } = made;
    return {
      key,
      memos,
      dispose: made.dispose,
      props: {
        id: domId(key),
        role: node?.role ?? "group",
        "aria-roledescription": node?.roleDescription ?? "canvas node",
        "aria-label": node?.label ?? "",
        get "aria-selected"() {
          return memos.selected() ? "true" : "false";
        },
        tabindex: 0,
        get style() {
          const box = boxes();
          const index = box.index.get(id) ?? -1;
          return {
            position: "absolute",
            left: "0px",
            top: "0px",
            width: `${at(box.ws, index)}px`,
            height: `${at(box.hs, index)}px`,
            "--node-x": String(memos.x()),
            "--node-y": String(memos.y()),
            transform: "translate(calc(var(--node-x) * 1px), calc(var(--node-y) * 1px))",
            "z-index": String(at(box.ranks, index)),
            "content-visibility": memos.exempt() ? "visible" : "auto",
            "contain-intrinsic-size": `auto ${at(box.ws, index)}px ${at(box.hs, index)}px`,
          };
        },
        onFocus: () => onNodeFocus(id),
        onFocusOut: (event) => onNodeFocusOut(id, event),
        onKeyDown: (event) => onNodeKey(id, event),
      },
    };
  };

  /** A removed id keeps its slot until the next flush: its row may still re-read the props. */
  const slotFor = (id: string): NodeSlot => {
    const known = slots.get(id);
    if (known !== undefined) {
      return known;
    }
    const made = makeSlot(id);
    slots.set(id, made);
    return made;
  };
  const memosFor = (id: string): NodeMemos => {
    indexFor(id);
    return slotFor(id).memos;
  };

  const layerProps: CanvasLayerProps = {
    get style() {
      return {
        position: "absolute",
        left: "0px",
        top: "0px",
        "transform-origin": "0 0",
        // Marquee drags must not select node text. The host's editor re-enables it with
        // `user-select: text` on the editor element.
        "user-select": "none",
        "--canvas-x": String(tx() / TONE),
        "--canvas-y": String(ty() / TONE),
        "--canvas-zoom": String(zoom() / ZONE),
        transform:
          "scale(var(--canvas-zoom)) translate(calc(var(--canvas-x) * 1px), calc(var(--canvas-y) * 1px))",
      };
    },
  };

  return {
    state: createMemo(() => snapshotOf(view())),
    peek: () => snapshotOf(state),
    nodeIds,
    isSelected: (id) => memosFor(id).selected(),
    isCulled: (id) => memosFor(id).culled(),
    position: (id) => ({ x: memosFor(id).x(), y: memosFor(id).y() }),
    viewportProps,
    layerProps,
    nodeProps: (id) => slotFor(id).props,
    liveRegionProps: {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    setShift: (held) => setModifier("shift", held),
    setSpace: (held) => setModifier("space", held),
    setMarqueeMode: (mode) => whileIdle((s) => ({ ...s, mqmode: mode })),
    setSnap: (on) => whileIdle((s) => ({ ...s, snapOn: on })),
    resize: (width, height) => commit({ ...state, vw: width, vh: height }),
    setReducedMotion: (reduced) => {
      const s = state;
      commit(
        reduced && s.active
          ? { ...rest(s, s.ttx, s.tty, s.tz), rm: true }
          : { ...s, rm: reduced, active: reduced ? false : s.active },
      );
    },
    panBy: (dx, dy) => {
      const s = state;
      commit(
        derive(rest(s, panT(s.tx, s.z, roundHalfUp(dx)), panT(s.ty, s.z, roundHalfUp(dy)), s.z)),
      );
    },
    zoomBy: (factor, anchor) =>
      commit(
        zoomedTo(
          state,
          zoomRequest(state.z, factor),
          anchor?.[0] ?? state.px,
          anchor?.[1] ?? state.py,
        ),
      ),
    zoomTo: (target, anchor) =>
      commit(zoomedTo(state, target, anchor?.[0] ?? state.px, anchor?.[1] ?? state.py)),
    animateTo: (goal) => commit(animated(state, goal)),
    tick: () => commit(ticked(state)),
    cancelTween: () => commit(rest(state, state.tx, state.ty, state.z)),
    toggleEdit,
    setGeometry,
    setOrder,
    addNodes,
    removeNodes,
  };
};
