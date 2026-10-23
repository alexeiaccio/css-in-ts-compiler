import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import { type ScenarioConfig, Unsupported } from "../scenario";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
export const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

export type ListboxSelectionMode = "single" | "multiple" | "none";
export type ListboxAutoFocus = boolean | number | "first";

/**
 * What every listbox fixture is mounted with. `items` are the option labels
 * (the DOM's visible/typeahead text); the spec models are index-based, so the
 * differential walk mounts the spec's option names as labels.
 */
export interface ListboxMountConfig {
  readonly items: ReadonlyArray<string>;
  readonly selectionMode: ListboxSelectionMode;
  readonly followsFocus: boolean;
  /** Option indices selected at mount (uncontrolled default / controlled initial). */
  readonly defaultSelected: ReadonlyArray<number>;
  /** Option indices that cannot be selected or focused by navigation. */
  readonly disabled: ReadonlyArray<number>;
  readonly focusOnHover: boolean;
  readonly autoFocus: ListboxAutoFocus | undefined;
  readonly ariaLabel: string | undefined;
  /** The host owns the value: the fixture passes it as `value`. */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back as the value. */
  readonly accepts: boolean;
  /** Uncontrolled active option at mount (the type-ahead model's value). */
  readonly defaultActive: number | undefined;
}

const toItems = (value: Schema.Json | undefined): ReadonlyArray<string> => {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new Unsupported(`items ${String(value)}`);
    }
    return Array.from({ length: value }, (_, i) => String(i));
  }
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value;
  }
  throw new Unsupported(`items ${JSON.stringify(value)}`);
};

const indexOfLabel = (items: ReadonlyArray<string>, key: string): number => {
  const exact = items.indexOf(key);
  if (exact >= 0) {
    return exact;
  }
  const lower = key.toLowerCase();
  const folded = items.findIndex((item) => item.toLowerCase() === lower);
  if (folded < 0) {
    throw new Unsupported(`key ${key}`);
  }
  return folded;
};

const numberArray = (value: Schema.Json | undefined): ReadonlyArray<number> => {
  if (Array.isArray(value) && value.every((v) => typeof v === "number" && Number.isInteger(v))) {
    return value;
  }
  throw new Unsupported(`indices ${JSON.stringify(value)}`);
};

const keyIndices = (
  items: ReadonlyArray<string>,
  value: Schema.Json | undefined,
): ReadonlyArray<number> => {
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value.map((key) => indexOfLabel(items, key));
  }
  throw new Unsupported(`keys ${JSON.stringify(value)}`);
};

const MODES = new Set<ListboxSelectionMode>(["single", "multiple", "none"]);

/**
 * Scenario `config` -> the fixture mount config, shared by every listbox
 * bridge and every target. Unknown keys (triggers, popups, layouts, value
 * plumbing, ...) throw `Unsupported`, which skips the scenario everywhere.
 */
export const listboxConfig = (
  config: ScenarioConfig,
  defaultMode: ListboxSelectionMode = "single",
): ListboxMountConfig => {
  let items: ReadonlyArray<string> = [];
  let selectionMode = defaultMode;
  let followsFocus = false;
  let defaultSelected: ReadonlyArray<number> = [];
  let disabled: ReadonlyArray<number> = [];
  let focusOnHover = false;
  let autoFocus: ListboxAutoFocus | undefined;
  let ariaLabel: string | undefined;
  let controlled = false;
  let accepts = false;
  let defaultActive: number | undefined;

  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "items":
        items = toItems(value);
        break;
      case "selectionMode":
        if (typeof value !== "string" || !MODES.has(value as ListboxSelectionMode)) {
          throw new Unsupported(`selectionMode ${JSON.stringify(value)}`);
        }
        selectionMode = value as ListboxSelectionMode;
        break;
      case "selectionModel":
        if (value !== "recommended") {
          throw new Unsupported(`selectionModel ${JSON.stringify(value)}`);
        }
        break;
      case "followsFocus":
        followsFocus = value === true;
        break;
      case "defaultSelectedKeys":
        defaultSelected = keyIndices(items, value);
        break;
      case "defaultSelected":
        defaultSelected = numberArray(value);
        break;
      case "value":
      case "selected":
        // a pinned controlled value: the host rejects every request
        defaultSelected = numberArray(value);
        controlled = true;
        break;
      case "controlled":
        if (typeof value !== "boolean") {
          throw new Unsupported(`controlled ${JSON.stringify(value)}`);
        }
        controlled = value;
        accepts = value;
        break;
      case "accepts":
        if (typeof value !== "boolean") {
          throw new Unsupported(`accepts ${JSON.stringify(value)}`);
        }
        controlled = true;
        accepts = value;
        break;
      case "defaultActive":
        if (typeof value !== "number" || !Number.isInteger(value)) {
          throw new Unsupported(`defaultActive ${JSON.stringify(value)}`);
        }
        defaultActive = value;
        break;
      case "disabledKeys":
        disabled = keyIndices(items, value);
        break;
      case "disabled":
        disabled = numberArray(value);
        break;
      case "shouldFocusOnHover":
        focusOnHover = value === true;
        break;
      case "autoFocus":
        if (
          value === true ||
          value === "first" ||
          (typeof value === "number" && Number.isInteger(value))
        ) {
          autoFocus = value;
        } else if (value === false) {
          autoFocus = undefined;
        } else {
          throw new Unsupported(`autoFocus ${JSON.stringify(value)}`);
        }
        break;
      case "ariaLabel":
        if (typeof value !== "string") {
          throw new Unsupported(`ariaLabel ${JSON.stringify(value)}`);
        }
        ariaLabel = value;
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  if (items.length === 0) {
    throw new Unsupported("config has no items");
  }
  return {
    items,
    selectionMode,
    followsFocus,
    defaultSelected,
    disabled,
    focusOnHover,
    autoFocus,
    ariaLabel,
    controlled,
    accepts,
    defaultActive,
  };
};

// ---------------------------------------------------------------------------
// Vocabulary <-> spec helpers
// ---------------------------------------------------------------------------

/** `option:3`/`option` -> index; anything else is unsupported. */
export const optionIndexOf = (target: string | undefined): number => {
  const part = (target ?? "option").replace(/:0$/, "");
  if (part === "option") {
    return 0;
  }
  const match = /^option:(\d+)$/.exec(part);
  if (match?.[1] === undefined) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return Number(match[1]);
};

export const partOf = (target: string | undefined): string => (target ?? "").replace(/:0$/, "");

const isJsonObject = (value: Schema.Json): value is Readonly<Record<string, Schema.Json>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const jsonRecord = (
  value: Schema.Json | undefined,
): Readonly<Record<string, Schema.Json>> => {
  if (value === undefined || !isJsonObject(value)) {
    throw new Unsupported(`value ${JSON.stringify(value)}`);
  }
  return value;
};

export interface KeyModifiers {
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly alt: boolean;
}

export const keyModifiers = (value: Schema.Json | undefined): KeyModifiers => {
  const record = jsonRecord(value);
  return {
    shift: record["shift"] === true,
    ctrl: record["ctrl"] === true,
    // mac's Mod is Meta; the primitive folds it onto ctrl
    meta: record["meta"] === true || record["ctrl"] === true,
    alt: record["alt"] === true,
  };
};

/** bit i of a selection mask. */
export const bit = (mask: bigint, index: number): boolean => (mask >> BigInt(index)) % 2n === 1n;

export const maskOf = (state: QuintModelValue): bigint => {
  const value = state["selected"];
  return typeof value === "bigint" ? value : 0n;
};

export const selectedIndices = (mask: bigint, count: number): ReadonlyArray<number> => {
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (bit(mask, i)) {
      out.push(i);
    }
  }
  return out;
};

/** Option indices -> a selection bitmask (bit i = option i). */
export const indicesMask = (indices: ReadonlyArray<number>): number =>
  indices.reduce((mask, index) => mask + 2 ** index, 0);

/** Parse a `prop setValue`/`value`/`selected` payload into option indices. */
export const indicesOf = (value: Schema.Json | undefined): ReadonlyArray<number> =>
  numberArray(value);

/** The last request's intent, as option indices (reads the `requested` mask). */
export const requestedIndices = (state: QuintModelValue, count: number): ReadonlyArray<number> => {
  const value = state["requested"];
  return selectedIndices(typeof value === "bigint" ? value : 0n, count);
};
