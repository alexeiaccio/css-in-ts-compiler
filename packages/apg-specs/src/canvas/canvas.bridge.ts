import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue, QuintValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

/**
 * Canvas vocabulary <-> `specs/canvas/camera.qnt` and `specs/canvas/pointer.qnt`.
 *
 * Two machines, so two bridges (`cameraBridge`, `pointerBridge`). Both parse a scenario step into
 * a typed, library-neutral OP (`parseCameraOp`, `parsePointerOp`); the spec side turns the op into
 * spec events, the DOM driver (packages/headless/test) turns the same op into real input. Anything
 * outside the model's pools throws `Unsupported`, which skips the scenario on every target.
 *
 * Why steps are pool-shaped: the specs pick every selector from a small fixed pool (one nondet per
 * action), so a step may only name a pool member - a palette position `p0..p11`, a pan delta from
 * {-9e6, -400, 0, 5, 9e6}, a zoom factor from {1/2, 3/4, 5/4, 3/2, 2, 16, 1/16}, a named anchor.
 *
 * Observation targets (probe / `expect.attrs`):
 *   `layer`   `--canvas-x` `--canvas-y` `--canvas-zoom`   the rendered camera custom properties
 *   `node<i>` `aria-selected` `--node-x` `--node-y` `content-visibility`
 *   `live`    `text`                                      the live region
 *   `state`   `mode owner selection cursor editing guides culled announcements`  (pointer)
 *             `camera viewport tweening reducedMotion`                           (camera)
 * `state` reads the primitive's own snapshot (`Canvas.peek()`), JSON-formatted by `formatValue`.
 *
 * Not an oracle: `culled` is an independent TS port of the spec's `culled` def (defs are not
 * callable from the reference model), so it checks the primitive against the port, not the spec.
 */

// ---- the fixed fixture the pointer machine models -----------------------------------------

/** pointer.qnt's three nodes, bottom of the z-order first. */
export const NODES = [
  { id: "0", x: 100, y: 100, width: 200, height: 100, label: "Node A" },
  { id: "1", x: 250, y: 150, width: 200, height: 150, label: "Node B" },
  { id: "2", x: 600, y: 400, width: 100, height: 100, label: "Node C" },
] as const;

/** pointer.qnt's VW / VH: the viewport its culling predicate uses. */
export const POINTER_VIEWPORT = { width: 1024, height: 768 } as const;

/** pointer.qnt's screen palette (px): `p<k>` is `PALETTE[k]`. */
export const PALETTE: ReadonlyArray<readonly [x: number, y: number]> = [
  [150, 130],
  [152, 131],
  [154, 130],
  [155, 130],
  [280, 170],
  [400, 250],
  [650, 450],
  [60, 60],
  [320, 220],
  [500, 350],
  [800, 600],
  [600, 60],
];

/** pointer.qnt's `extX(k)` / `extY(k)`: the positions a host move can set (the last is far past the world bound). */
export const HOST_POSITIONS: ReadonlyArray<readonly [x: number, y: number]> = [
  [0, 0],
  [320, 200],
  [-300, -300],
  [5_000_000, -5_000_000],
];

/** pointer.qnt's `zoomPreset(level)`, as zoom values. */
export const ZOOM_LEVELS: ReadonlyArray<number> = [1 / 16, 1 / 2, 1, 2, 8];

// camera.qnt pools
export const VIEWPORTS: ReadonlyArray<readonly [width: number, height: number]> = [
  [320, 240],
  [800, 600],
  [1024, 768],
  [1920, 1080],
  [4096, 2160],
];
export const PAN_DELTAS: ReadonlyArray<number> = [-9_000_000, -400, 0, 5, 9_000_000];
export const ZOOM_FACTORS: ReadonlyArray<number> = [1 / 2, 3 / 4, 5 / 4, 3 / 2, 2, 16, 1 / 16];
export const ANCHORS = ["top-left", "centre", "bottom-right", "quarter"] as const;
export type AnchorName = (typeof ANCHORS)[number];
export const CENTRE_POINTS: ReadonlyArray<readonly [x: number, y: number]> = [
  [0, 0],
  [1000, 500],
  [-250_000, 400_000],
  [999_000, -999_000],
];

const FIXED_ONE = 4096;
const TONE = 256;

/** camera.qnt's `anchorX` / `anchorY`: where an anchor name sits in a viewport of this size. */
export const anchorPoint = (
  anchor: AnchorName,
  width: number,
  height: number,
): readonly [x: number, y: number] => {
  switch (anchor) {
    case "top-left":
      return [0, 0];
    case "centre":
      return [Math.floor(width / 2), Math.floor(height / 2)];
    case "bottom-right":
      return [width, height];
    case "quarter":
      return [Math.floor(width / 4), Math.floor((3 * height) / 4)];
  }
};

const MIN_ZOOM_GOAL = 0;
const MAX_ZOOM_GOAL = 1;
const UNIT_ZOOM_GOAL = 2;
const CENTRE_GOAL = 3;
const ANCHOR_COUNT = 4;
const PAN_POOL = 5;

// ---- step parsing ------------------------------------------------------------------------

type Json = Schema.Json;

const isRecord = (value: Json | undefined): value is Readonly<Record<string, Json>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const indexIn = <T>(pool: ReadonlyArray<T>, value: T, what: string): number => {
  const index = pool.indexOf(value);
  if (index < 0) {
    throw new Unsupported(`${what} ${JSON.stringify(value)} is not in the spec pool`);
  }
  return index;
};

const anchorOf = (value: Json | undefined): number => {
  const index = ANCHORS.findIndex((name) => name === value);
  if (index < 0) {
    throw new Unsupported(`anchor ${JSON.stringify(value)}`);
  }
  return index;
};

const anchorName = (index: number): AnchorName => ANCHORS[index] ?? "top-left";

export type CameraOp =
  | { readonly op: "resize"; readonly viewport: number }
  | { readonly op: "motion"; readonly reduced: boolean }
  | { readonly op: "pan"; readonly dx: number; readonly dy: number }
  | {
      readonly op: "zoom";
      /** Fixed point (4096 = x1). */
      readonly factor: number;
      readonly anchor: AnchorName;
    }
  | {
      readonly op: "zoomLimit";
      readonly limit: "min" | "max";
      readonly anchor: AnchorName;
    }
  | {
      readonly op: "tween";
      readonly goal:
        | {
            readonly kind: "zoom";
            readonly zoom: number;
            readonly anchor: AnchorName;
          }
        | { readonly kind: "centre"; readonly x: number; readonly y: number };
    }
  | { readonly op: "tick" }
  | { readonly op: "cancelTween" };

const zoomGoalKinds = new Map<string, number>([
  ["min", MIN_ZOOM_GOAL],
  ["max", MAX_ZOOM_GOAL],
  ["100%", UNIT_ZOOM_GOAL],
]);
const ZOOM_GOAL_VALUES = [256, 32_768, FIXED_ONE] as const;

/** A camera step -> an op; `Unsupported` for anything the camera machine does not model. */
export const parseCameraOp = (step: ActionStep): CameraOp => {
  if (step.event !== "prop") {
    throw new Unsupported(`event ${step.event}`);
  }
  const { value } = step;
  switch (step.prop) {
    case "resize":
      if (typeof value !== "number" || value < 0 || value >= VIEWPORTS.length) {
        throw new Unsupported(`viewport ${JSON.stringify(value)}`);
      }
      return { op: "resize", viewport: value };
    case "motion":
      return { op: "motion", reduced: value === true };
    case "pan": {
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Unsupported("pan needs [dx, dy]");
      }
      const [dx, dy] = value;
      if (typeof dx !== "number" || typeof dy !== "number") {
        throw new Unsupported("pan needs [dx, dy] numbers");
      }
      indexIn(PAN_DELTAS, dx, "pan dx");
      indexIn(PAN_DELTAS, dy, "pan dy");
      return { op: "pan", dx, dy };
    }
    case "zoom": {
      if (!isRecord(value) || typeof value["factor"] !== "number") {
        throw new Unsupported("zoom needs { factor, anchor }");
      }
      indexIn(ZOOM_FACTORS, value["factor"], "zoom factor");
      return {
        op: "zoom",
        factor: Math.round(value["factor"] * FIXED_ONE),
        anchor: anchorName(anchorOf(value["anchor"])),
      };
    }
    case "zoomLimit": {
      if (!isRecord(value) || (value["limit"] !== "min" && value["limit"] !== "max")) {
        throw new Unsupported("zoomLimit needs { limit: min | max, anchor }");
      }
      return {
        op: "zoomLimit",
        limit: value["limit"],
        anchor: anchorName(anchorOf(value["anchor"])),
      };
    }
    case "tween": {
      if (!isRecord(value)) {
        throw new Unsupported("tween needs a goal");
      }
      const centre = value["centre"];
      if (Array.isArray(centre)) {
        const [x, y] = centre;
        if (typeof x !== "number" || typeof y !== "number") {
          throw new Unsupported("centre needs [x, y] numbers");
        }
        const index = CENTRE_POINTS.findIndex((point) => point[0] === x && point[1] === y);
        if (index < 0) {
          throw new Unsupported(`centre [${x}, ${y}] is not in the spec pool`);
        }
        return { op: "tween", goal: { kind: "centre", x, y } };
      }
      const kind = zoomGoalKinds.get(String(value["zoom"]));
      if (kind === undefined) {
        throw new Unsupported(`tween goal ${JSON.stringify(value)}`);
      }
      return {
        op: "tween",
        goal: {
          kind: "zoom",
          zoom: ZOOM_GOAL_VALUES[kind] ?? FIXED_ONE,
          anchor: anchorName(anchorOf(value["anchor"])),
        },
      };
    }
    case "tick":
      return { op: "tick" };
    case "cancelTween":
      return { op: "cancelTween" };
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

const cameraEvents = (op: CameraOp): ReadonlyArray<QuintEvent> => {
  switch (op.op) {
    case "resize":
      return [specEvent("resize", { vp: BigInt(op.viewport) })];
    case "motion":
      return [specEvent("set_motion", { reduced: op.reduced })];
    case "pan": {
      const ix = indexIn(PAN_DELTAS, op.dx, "pan dx");
      const iy = indexIn(PAN_DELTAS, op.dy, "pan dy");
      return [specEvent("pan_by", { delta: BigInt(iy * PAN_POOL + ix) })];
    }
    case "zoom": {
      const factor = indexIn(
        ZOOM_FACTORS.map((f) => Math.round(f * FIXED_ONE)),
        op.factor,
        "zoom factor",
      );
      const anchor = ANCHORS.indexOf(op.anchor);
      return [
        specEvent("zoom_at", {
          gesture: BigInt(anchor + ANCHOR_COUNT * factor),
        }),
      ];
    }
    case "zoomLimit": {
      const anchor = ANCHORS.indexOf(op.anchor);
      return [
        specEvent("zoom_limit", {
          limit: BigInt(anchor + ANCHOR_COUNT * (op.limit === "max" ? 1 : 0)),
        }),
      ];
    }
    case "tween": {
      if (op.goal.kind === "centre") {
        const { x, y } = op.goal;
        const index = CENTRE_POINTS.findIndex((point) => point[0] === x && point[1] === y);
        return [
          specEvent("request_tween", {
            goal: BigInt(CENTRE_GOAL * ANCHOR_COUNT + index),
          }),
        ];
      }
      const { zoom } = op.goal;
      const kind = ZOOM_GOAL_VALUES.findIndex((value) => value === zoom);
      return [
        specEvent("request_tween", {
          goal: BigInt(kind * ANCHOR_COUNT + ANCHORS.indexOf(op.goal.anchor)),
        }),
      ];
    }
    case "tick":
      return [specEvent("tween_tick")];
    case "cancelTween":
      return [specEvent("cancel_tween")];
  }
};

const NODE_TARGET = /^node(\d+)$/;

export type PointerId = 1 | 2;

export type PointerOp =
  | {
      readonly op: "down" | "move";
      readonly pointer: PointerId;
      readonly at: number;
    }
  | { readonly op: "up" | "cancel"; readonly pointer: PointerId }
  | { readonly op: "shift" | "space" | "snap"; readonly on: boolean }
  | { readonly op: "marquee"; readonly mode: "contain" | "overlap" }
  | { readonly op: "zoom"; readonly level: number }
  | { readonly op: "edit" }
  /** A host sets node `node`'s committed position to `HOST_POSITIONS[position]`. */
  | { readonly op: "place"; readonly node: number; readonly position: number };

const pointerOf = (value: Json | undefined): PointerId => {
  if (value === undefined || value === 1) {
    return 1;
  }
  if (value === 2) {
    return 2;
  }
  throw new Unsupported(`pointer id ${JSON.stringify(value)}`);
};

const paletteOf = (target: string | undefined): number => {
  const match = /^p(\d+)$/.exec(target ?? "");
  const index = match === null ? -1 : Number(match[1]);
  if (index < 0 || index >= PALETTE.length) {
    throw new Unsupported(`palette position ${target ?? ""}`);
  }
  return index;
};

const parsePlace = ({ target, value }: ActionStep): PointerOp => {
  const match = NODE_TARGET.exec(target ?? "");
  const node = match === null ? -1 : Number(match[1]);
  if (node < 0 || node >= NODES.length) {
    throw new Unsupported(`place needs a node target, got ${target ?? ""}`);
  }
  const position = HOST_POSITIONS.findIndex(
    (point) => Array.isArray(value) && point[0] === value[0] && point[1] === value[1],
  );
  if (position < 0) {
    throw new Unsupported(`host position ${JSON.stringify(value)} is not in the spec pool`);
  }
  return { op: "place", node, position };
};

/**
 * A pointer step -> an op. Pointer input is `{ event: pointerdown | pointermove | pointerup |
 * pointercancel, target: "p<k>", value: <pointer id, default 1> }`; modifiers and parameters are
 * `prop` steps (`shift`, `space`, `snap`, `marquee`, `zoom`, `edit`).
 */
export const parsePointerOp = (step: ActionStep): PointerOp => {
  const { value } = step;
  switch (step.event) {
    case "pointerdown":
      return {
        op: "down",
        pointer: pointerOf(value),
        at: paletteOf(step.target),
      };
    case "pointermove":
      return {
        op: "move",
        pointer: pointerOf(value),
        at: paletteOf(step.target),
      };
    case "pointerup":
      return { op: "up", pointer: pointerOf(value) };
    case "pointercancel":
      return { op: "cancel", pointer: pointerOf(value) };
    case "prop":
      switch (step.prop) {
        case "shift":
        case "space":
        case "snap":
          return { op: step.prop, on: value === true };
        case "marquee":
          if (value === "contain" || value === "overlap") {
            return { op: "marquee", mode: value };
          }
          throw new Unsupported(`marquee ${JSON.stringify(value)}`);
        case "zoom": {
          const level = ZOOM_LEVELS.findIndex((zoom) => zoom === value);
          if (level < 0) {
            throw new Unsupported(`zoom level ${JSON.stringify(value)}`);
          }
          return { op: "zoom", level };
        }
        case "edit":
          return { op: "edit" };
        case "place":
          return parsePlace(step);
        default:
          throw new Unsupported(`prop ${step.prop ?? ""}`);
      }
    default:
      throw new Unsupported(`event ${step.event}`);
  }
};

const POINTER_POOL = PALETTE.length;

const pointerEvents = (op: PointerOp): ReadonlyArray<QuintEvent> => {
  switch (op.op) {
    case "down":
      return [
        specEvent("down", {
          touch: BigInt((op.pointer - 1) * POINTER_POOL + op.at),
        }),
      ];
    case "move":
      return [
        specEvent("move", {
          touch: BigInt((op.pointer - 1) * POINTER_POOL + op.at),
        }),
      ];
    case "up":
      return [specEvent("up", { lift: BigInt(op.pointer) })];
    case "cancel":
      return [specEvent("cancel_pointer", { lost: BigInt(op.pointer) })];
    case "shift":
      return [specEvent("set_shift", { held: op.on })];
    case "space":
      return [specEvent("set_space", { held: op.on })];
    case "snap":
      return [specEvent("set_snap", { snapping: op.on })];
    case "marquee":
      return [specEvent("set_marquee_mode", { choice: op.mode })];
    case "zoom":
      return [specEvent("zoom_to", { level: BigInt(op.level) })];
    case "edit":
      return [specEvent("toggle_edit")];
    case "place":
      return [
        specEvent("host_move", {
          place: BigInt(op.position * NODES.length + op.node),
        }),
      ];
  }
};

// ---- config -----------------------------------------------------------------------------

export interface CameraConfig {
  readonly reducedMotion: boolean;
}

/** Scenario `config` -> what both targets are mounted with. */
export const cameraConfig = (config: ScenarioConfig): CameraConfig => {
  let reducedMotion = false;
  for (const [key, value] of Object.entries(config)) {
    if (key === "reducedMotion" && typeof value === "boolean") {
      reducedMotion = value;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { reducedMotion };
};

export interface PointerConfig {
  readonly marquee: "contain" | "overlap";
  readonly snap: boolean;
}

export const pointerConfig = (config: ScenarioConfig): PointerConfig => {
  let marquee: "contain" | "overlap" = "contain";
  let snap = false;
  for (const [key, value] of Object.entries(config)) {
    if (key === "marquee" && (value === "contain" || value === "overlap")) {
      marquee = value;
    } else if (key === "snap" && typeof value === "boolean") {
      snap = value;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { marquee, snap };
};

// ---- observation -----------------------------------------------------------------------

/** How a `state` value is read as an attribute: a string as is, `null` = absent, the rest JSON. */
export const formatValue = (value: Json | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
};

const num = (value: QuintValue | undefined): number => Number(value);
const world = (fixed: number): string => String(fixed / TONE);

const layerAttr = (tx: number, ty: number, z: number, name: string): string | null => {
  switch (name) {
    case "--canvas-x":
      return world(tx);
    case "--canvas-y":
      return world(ty);
    case "--canvas-zoom":
      return String(z / FIXED_ONE);
    default:
      throw new Unsupported(`attribute ${name} on layer`);
  }
};

const stateAttr = (value: Readonly<Record<string, Json>>, name: string): string | null => {
  if (!Object.hasOwn(value, name)) {
    throw new Unsupported(`state ${name}`);
  }
  return formatValue(value[name]);
};

// type aliases (not interfaces) so the values are assignable to `Json` records
type CameraValue = {
  readonly camera: {
    readonly tx: number;
    readonly ty: number;
    readonly z: number;
  };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly tweening: boolean;
  readonly reducedMotion: boolean;
};

export const cameraValue = (state: QuintModelValue): CameraValue => ({
  camera: { tx: num(state["tx"]), ty: num(state["ty"]), z: num(state["z"]) },
  viewport: { width: num(state["vw"]), height: num(state["vh"]) },
  tweening: state["active"] === true,
  reducedMotion: state["rm"] === true,
});

export const cameraBridge: SpecBridge = {
  setup: (config) =>
    cameraConfig(config).reducedMotion ? [specEvent("set_motion", { reduced: true })] : [],
  event: (step) => cameraEvents(parseCameraOp(step)),
  value: cameraValue,
  focus: () => null,
  attr: (state, target, name) => {
    if (target === "layer") {
      return layerAttr(num(state["tx"]), num(state["ty"]), num(state["z"]), name);
    }
    if (target === "state") {
      return stateAttr(cameraValue(state), name);
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: () => [],
};

// ---- pointer model -> observations ------------------------------------------------------

const bitSet = (mask: number, bit: number): boolean => Math.floor(mask / 2 ** bit) % 2 === 1;

const maskIds = (mask: number): string[] =>
  NODES.flatMap((node, bit) => (bitSet(mask, bit) ? [node.id] : []));

const nodePosition = (state: QuintModelValue, index: number): [number, number] => {
  const dragging = state["mode"] === "dragging" && bitSet(num(state["sel"]), index);
  const dx = dragging ? num(state["ddx"]) : 0;
  const dy = dragging ? num(state["ddy"]) : 0;
  return [num(state[`n${index}x`]) + dx, num(state[`n${index}y`]) + dy];
};

const exempt = (state: QuintModelValue, index: number): boolean =>
  bitSet(num(state["sel"]), index) ||
  num(state["cursor"]) === index ||
  num(state["editing"]) === index;

const screenToWorldFp = (s: number, t: number, z: number): number => {
  const tz = FIXED_ONE * TONE;
  return Math.floor((2 * s * tz + z) / (2 * z)) - t;
};

/** Independent port of pointer.qnt's `inView` / `culled`. */
const culledNodes = (state: QuintModelValue): string[] => {
  const tx = num(state["tx"]);
  const ty = num(state["ty"]);
  const z = num(state["z"]);
  const left = screenToWorldFp(0, tx, z);
  const right = screenToWorldFp(POINTER_VIEWPORT.width, tx, z);
  const top = screenToWorldFp(0, ty, z);
  const bottom = screenToWorldFp(POINTER_VIEWPORT.height, ty, z);
  return NODES.flatMap((node, index) => {
    const [x, y] = nodePosition(state, index);
    const visible =
      x * TONE < right &&
      (x + node.width) * TONE > left &&
      y * TONE < bottom &&
      (y + node.height) * TONE > top;
    return visible || exempt(state, index) ? [] : [node.id];
  });
};

const idOf = (index: number): string | null => NODES[index]?.id ?? null;

type PointerValue = {
  readonly mode: string;
  readonly owner: number | null;
  readonly selection: ReadonlyArray<string>;
  readonly cursor: string | null;
  readonly editing: string | null;
  readonly guides: { readonly x: boolean; readonly y: boolean };
  readonly culled: ReadonlyArray<string>;
  readonly announcements: number;
};

export const pointerValue = (state: QuintModelValue): PointerValue => ({
  mode: String(state["mode"]),
  owner: num(state["owner"]) === 0 ? null : num(state["owner"]),
  selection: maskIds(num(state["sel"])),
  cursor: idOf(num(state["cursor"])),
  editing: idOf(num(state["editing"])),
  guides: {
    x: bitSet(num(state["guide"]), 0),
    y: bitSet(num(state["guide"]), 1),
  },
  culled: culledNodes(state),
  announcements: num(state["annCount"]),
});

/** The text the primitive's default messages give a settled selection. */
export const selectionText = (ids: ReadonlyArray<string>): string => {
  const labels = ids.map((id) => NODES.find((node) => node.id === id)?.label ?? id);
  if (labels.length === 0) {
    return "Selection cleared";
  }
  return labels.length === 1
    ? `${labels[0] ?? ""} selected`
    : `${labels.length} nodes selected: ${labels.join(", ")}`;
};

export const pointerBridge: SpecBridge = {
  setup: (config) => {
    const { marquee, snap } = pointerConfig(config);
    return [
      ...(marquee === "contain" ? [] : [specEvent("set_marquee_mode", { choice: marquee })]),
      ...(snap ? [specEvent("set_snap", { snapping: true })] : []),
    ];
  },
  event: (step) => pointerEvents(parsePointerOp(step)),
  value: pointerValue,
  focus: (state) => {
    const cursor = num(state["cursor"]);
    return cursor < 0 ? null : `node${cursor}`;
  },
  attr: (state, target, name) => {
    if (target === "layer") {
      return layerAttr(num(state["tx"]), num(state["ty"]), num(state["z"]), name);
    }
    if (target === "state") {
      return stateAttr(pointerValue(state), name);
    }
    if (target === "live" && name === "text") {
      return num(state["annCount"]) === 0 ? "" : selectionText(maskIds(num(state["annSel"])));
    }
    const match = NODE_TARGET.exec(target);
    const index = match === null ? -1 : Number(match[1]);
    if (index >= 0 && index < NODES.length) {
      const [x, y] = nodePosition(state, index);
      switch (name) {
        case "aria-selected":
          return String(bitSet(num(state["sel"]), index));
        case "--node-x":
          return String(x);
        case "--node-y":
          return String(y);
        case "content-visibility":
          return exempt(state, index) ? "visible" : "auto";
        default:
          break;
      }
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before, after) => {
    const out: Array<readonly [string, Json]> = [];
    if (num(before["annCount"]) !== num(after["annCount"])) {
      out.push(["onSelectionChange", maskIds(num(after["annSel"]))]);
    }
    const moves = NODES.flatMap((node, index) => {
      const [bx, by] = [num(before[`n${index}x`]), num(before[`n${index}y`])];
      const [ax, ay] = [num(after[`n${index}x`]), num(after[`n${index}y`])];
      return bx === ax && by === ay ? [] : [{ id: node.id, x: ax, y: ay }];
    });
    if (moves.length > 0) {
      out.push(["onNodesMove", moves]);
    }
    return out;
  },
};

// ---- random-walk alphabets and probes ---------------------------------------------------

const paletteIndexes = PALETTE.map((_, index) => index);
const press = (event: string, at: number, pointer: PointerId): ActionStep => ({
  event,
  target: `p${at}`,
  value: pointer,
});

/** The user-level steps a pointer differential walk draws from. */
export const pointerSteps: ReadonlyArray<ActionStep> = [
  ...paletteIndexes.map((at) => press("pointerdown", at, 1)),
  ...paletteIndexes.flatMap((at) => [
    press("pointermove", at, 1),
    // moves dominate a real gesture; the repeat makes `pointing -> dragging` reachable
    press("pointermove", at, 1),
  ]),
  press("pointerdown", 4, 2),
  press("pointerdown", 7, 2),
  press("pointermove", 9, 2),
  press("pointermove", 5, 2),
  { event: "pointerup", value: 1 },
  { event: "pointerup", value: 1 },
  { event: "pointerup", value: 2 },
  { event: "pointercancel", value: 1 },
  { event: "pointercancel", value: 2 },
  { event: "prop", prop: "shift", value: true },
  { event: "prop", prop: "shift", value: false },
  { event: "prop", prop: "space", value: true },
  { event: "prop", prop: "space", value: false },
  { event: "prop", prop: "snap", value: true },
  { event: "prop", prop: "snap", value: false },
  { event: "prop", prop: "marquee", value: "contain" },
  { event: "prop", prop: "marquee", value: "overlap" },
  ...ZOOM_LEVELS.map((value): ActionStep => ({
    event: "prop",
    prop: "zoom",
    value,
  })),
  { event: "prop", prop: "edit" },
  ...NODES.flatMap((_, node) =>
    HOST_POSITIONS.map(([x, y]): ActionStep => ({
      event: "prop",
      prop: "place",
      target: `node${node}`,
      value: [x, y],
    })),
  ),
];

export const pointerProbe: Probe = {
  attrs: [
    ["layer", "--canvas-x"],
    ["layer", "--canvas-y"],
    ["layer", "--canvas-zoom"],
    ["state", "mode"],
    ["state", "owner"],
    ["state", "selection"],
    ["state", "cursor"],
    ["state", "editing"],
    ["state", "guides"],
    ["state", "culled"],
    ["state", "announcements"],
    ["live", "text"],
    ...NODES.flatMap((_, index): Array<readonly [string, string]> => [
      [`node${index}`, "aria-selected"],
      [`node${index}`, "--node-x"],
      [`node${index}`, "--node-y"],
      [`node${index}`, "content-visibility"],
    ]),
  ],
  events: ["onSelectionChange", "onNodesMove"],
};

const anchorSteps = ANCHORS.map((anchor) => anchor);

/** The user-level steps a camera differential walk draws from. */
export const cameraSteps: ReadonlyArray<ActionStep> = [
  ...VIEWPORTS.map((_, value): ActionStep => ({
    event: "prop",
    prop: "resize",
    value,
  })),
  { event: "prop", prop: "motion", value: true },
  { event: "prop", prop: "motion", value: false },
  ...PAN_DELTAS.flatMap((dx) =>
    [-400, 5, 9_000_000].map((dy): ActionStep => ({
      event: "prop",
      prop: "pan",
      value: [dx, dy],
    })),
  ),
  ...ZOOM_FACTORS.flatMap((factor) =>
    anchorSteps.map((anchor): ActionStep => ({
      event: "prop",
      prop: "zoom",
      value: { factor, anchor },
    })),
  ),
  ...anchorSteps.flatMap((anchor): ActionStep[] => [
    { event: "prop", prop: "zoomLimit", value: { limit: "min", anchor } },
    { event: "prop", prop: "zoomLimit", value: { limit: "max", anchor } },
    { event: "prop", prop: "tween", value: { zoom: "100%", anchor } },
    { event: "prop", prop: "tween", value: { zoom: "max", anchor } },
  ]),
  ...CENTRE_POINTS.map(([x, y]): ActionStep => ({
    event: "prop",
    prop: "tween",
    value: { centre: [x, y] },
  })),
  // ticks and cancels dominate so a tween is usually in flight when something interrupts it
  ...Array.from({ length: 12 }, (): ActionStep => ({
    event: "prop",
    prop: "tick",
  })),
  { event: "prop", prop: "cancelTween" },
];

export const cameraProbe: Probe = {
  attrs: [
    ["layer", "--canvas-x"],
    ["layer", "--canvas-y"],
    ["layer", "--canvas-zoom"],
    ["state", "camera"],
    ["state", "viewport"],
    ["state", "tweening"],
    ["state", "reducedMotion"],
  ],
  events: [],
};
