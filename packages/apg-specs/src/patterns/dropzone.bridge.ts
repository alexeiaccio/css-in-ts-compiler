import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

/**
 * Scenario `config` -> what both targets are mounted with. The spec models the
 * zone's drag state, not the file rules, so the only knob is `disabled`; the
 * fixture's batch is fixed (one image that fits, one text file refused by
 * `accept: "image/*"`, or nothing).
 */
export interface DropZoneConfig {
  readonly disabled: boolean;
}

export const dropzoneConfig = (config: ScenarioConfig): DropZoneConfig => {
  let disabled = false;
  for (const [key, raw] of Object.entries(config)) {
    if (key === "disabled" && typeof raw === "boolean") {
      disabled = raw;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return { disabled };
};

/**
 * The fixture's batch, and the sentence the primitive's default `message()`
 * builds from it: one file, accepted or refused by type. The spec's `batch` is
 * this summary (counts and reasons), so its announcement is fixed.
 */
export const DROPZONE_BATCHES = {
  accepted: { files: [{ name: "ok.png", type: "image/png", bytes: 8 }], message: "1 file" },
  rejected: {
    files: [{ name: "notes.txt", type: "text/plain", bytes: 8 }],
    message: "1 file, 1 rejected: unsupported type",
  },
  empty: { files: [], message: null },
} as const;

export type DropZoneBatch = keyof typeof DROPZONE_BATCHES;

const isBatch = (value: Schema.Json | undefined): value is DropZoneBatch =>
  typeof value === "string" && Object.hasOwn(DROPZONE_BATCHES, value);

/** The parts a drag event can be delivered to. A grandchild is the child's column. */
const dragTarget = (target: string | undefined): "zone" | "child" => {
  if (target === "zone" || target === "child") {
    return target;
  }
  throw new Unsupported(`part ${target ?? ""}`);
};

const partOf = (target: string): string => target.replace(/:0$/, "");

/**
 * Drop zone vocabulary <-> `specs/patterns/dropzone.qnt`. Parts: `zone` and
 * `child` (the drag surface; a grandchild is the same column), plus `status`
 * for the live region. The drag events are their own vocabulary — `dragEnter`,
 * `dragOver`, `dragLeave` and `drop` with a `value` of `accepted`, `rejected` or
 * `empty` — so the spec's depth and the DOM's real `DragEvent`s see the same
 * steps.
 */
export const dropzoneBridge: SpecBridge = {
  setup: (config) => {
    const c = dropzoneConfig(config);
    return c.disabled ? [specEvent("set_disabled", { off: true })] : [];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "dragEnter":
        return [specEvent(dragTarget(step.target) === "child" ? "enter_child" : "enter_zone")];
      case "dragOver":
        // preventDefault only: the drop target stays alive, no state changes
        dragTarget(step.target);
        return [];
      case "dragLeave":
        return [specEvent(dragTarget(step.target) === "child" ? "leave_child" : "leave_zone")];
      case "drop":
        if (!isBatch(step.value)) {
          throw new Unsupported(`drop ${JSON.stringify(step.value)}`);
        }
        dragTarget(step.target ?? "zone");
        return [
          specEvent(
            step.value === "accepted"
              ? "drop_accepted"
              : step.value === "rejected"
                ? "drop_rejected"
                : "drop_empty",
          ),
        ];
      case "prop":
        if (step.prop === "disabled" && typeof step.value === "boolean") {
          return [specEvent("set_disabled", { off: step.value })];
        }
        throw new Unsupported(`prop ${step.prop ?? ""}`);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => {
    const batch = state["batch"];
    const message =
      batch === "accepted" || batch === "rejected" ? DROPZONE_BATCHES[batch].message : null;
    return { dragging: state["highlight"] === true, message };
  },
  focus: () => null,
  visible: () => [],
  attr: (state: QuintModelValue, target: string, name: string) => {
    switch (partOf(target)) {
      case "zone":
        switch (name) {
          case "role":
            return "group";
          case "aria-disabled":
            return state["disabled"] === true ? "true" : null;
          default:
            throw new Unsupported(`attribute ${name} on ${target}`);
        }
      case "status":
        switch (name) {
          case "role":
            return "status";
          case "aria-live":
            return "polite";
          case "aria-atomic":
            return "true";
          default:
            throw new Unsupported(`attribute ${name} on ${target}`);
        }
      default:
        throw new Unsupported(`part ${target}`);
    }
  },
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const dropzoneSteps: ReadonlyArray<ActionStep> = [
  { event: "dragEnter", target: "zone" },
  { event: "dragEnter", target: "child" },
  { event: "dragOver", target: "zone" },
  { event: "dragOver", target: "child" },
  { event: "dragLeave", target: "child" },
  { event: "dragLeave", target: "zone" },
  { event: "drop", target: "zone", value: "accepted" },
  { event: "drop", target: "zone", value: "rejected" },
  { event: "drop", target: "zone", value: "empty" },
  { event: "prop", prop: "disabled", value: true },
  { event: "prop", prop: "disabled", value: false },
];

export const dropzoneProbe: Probe = {
  attrs: [
    ["zone", "role"],
    ["zone", "aria-disabled"],
    ["status", "role"],
    ["status", "aria-live"],
    ["status", "aria-atomic"],
  ],
  // `dragging()` and `message()` are the primitive's observables and have no
  // attribute of their own (`dragging()` is the styling hook, the message the
  // live region's text), so the walk compares them as the pattern's value.
  value: true,
  events: [],
};
