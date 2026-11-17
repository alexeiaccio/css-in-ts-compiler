import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";

import { createControllable } from "./controllable";
import { createStatus, type Status } from "./status";

/**
 * Reified table transformations: the mechanics of MuTable (Sun et al., UIST '26) as a headless
 * rail, with the accessibility a pointer-only version would lose.
 *
 * **A modifier is data, not a command.** The stack keeps every transformation a reader made, in
 * order, over the columns it spans, so the current view can be explained and each step revisited
 * (the paper's *persistent, composable, reusable* modifiers). One encoding has one owner: the
 * topmost modifier that spans the column and owns that encoding, which is what makes the order
 * mean something (`Group` then `Count` is not `Count` then `Group`).
 *
 * **Every pointer gesture has a keyboard route, and every structural change is announced.** The
 * rail is a `toolbar` of menu buttons: arrows move the focus, `Alt`+arrow moves the modifier,
 * `Delete` removes it, `Enter`/`Space`/`Shift+F10` opens its menu (where a column is added to its
 * span or locked as the input). A drag across column headers is not available to a keyboard, and
 * neither is a pointer-only "brush": the span is a checkbox per column, and the lock is a radio,
 * both inside that menu. The status region says what changed ("Axis moved to position 2 of 4").
 *
 * **Encodings are decoration; the values stay text.** `encoded()` says which modifier owns which
 * encoding of a column, and the host paints beside the value, never instead of it: a cell whose
 * number became a bar keeps its number in the accessibility tree (`mark`, the "dense" cell, is a
 * smaller rendering of the value, not an `aria-hidden` one).
 *
 * The host owns the data: the primitive carries the stack and announces it, like `createTable`
 * carries a sort without sorting (`modifiers` + `onModifiersChange`, or uncontrolled).
 */

/** What a modifier can take over on a column; one owner per encoding, the topmost modifier. */
export type ModifierEncoding = "color" | "size" | "mark" | "order" | "x" | "y";

/** The host's vocabulary: what a modifier of this kind is called and what it takes over. */
export interface ModifierAction {
  readonly kind: string;
  readonly label: string;
  readonly encodings: ReadonlyArray<ModifierEncoding>;
}

/** One step of a unit, over the unit's columns by position (a joined unit is reused by retargeting). */
export interface ModifierPart {
  readonly kind: string;
  /** The positions in the unit's `targets` this step covers. */
  readonly slots: ReadonlyArray<number>;
}

/**
 * A unit on the rail: one modifier, or the modifiers joined into one (`parts.length > 1`). A join
 * takes the upper unit's place and the id of the unit the reader acted on, so the focused element
 * survives it.
 */
export interface Modifier {
  readonly id: string;
  /** The columns it spans, in order; a part's slots index this list. */
  readonly targets: ReadonlyArray<string>;
  readonly parts: ReadonlyArray<ModifierPart>;
  /** The slot whose outcome the other slots inherit (the paper's lock); `null` is unlocked. */
  readonly locked?: number | null | undefined;
}

export interface ModifierTarget {
  readonly key: string;
  readonly label: string;
}

export interface ModifierLabels {
  /** The rail's accessible name. Defaults to "Table transformations". */
  readonly rail?: string | undefined;
  /** How a span reads in a name. Defaults to `applied to <names>`. */
  readonly appliedTo?: ((names: string) => string) | undefined;
  /** How a lock reads in a name. Defaults to `locked to <name>`. */
  readonly lockedTo?: ((name: string) => string) | undefined;
  /** A join's announcement. Defaults to `<count> modifiers joined`. */
  readonly joined?: ((count: number) => string) | undefined;
  /** A split's announcement. Defaults to "joined unit split". */
  readonly split?: string | undefined;
}

export interface ModifiersOptions {
  /** The columns a modifier can span, in the order the host renders them. */
  readonly targets: ReadonlyArray<ModifierTarget>;
  /** The vocabulary; a kind outside it is refused by `add`. */
  readonly actions: ReadonlyArray<ModifierAction>;
  /** Controlled: the host owns the stack and this is the only thing that changes it. */
  readonly modifiers?: ReadonlyArray<Modifier> | undefined;
  /** Uncontrolled starting stack; ignored while `modifiers` is set. */
  readonly defaultModifiers?: ReadonlyArray<Modifier> | undefined;
  /** A request to change the stack; a controlled host may ignore it. */
  readonly onModifiersChange?: ((modifiers: ReadonlyArray<Modifier>) => void) | undefined;
  /** Called when a unit is activated (a click, `Enter`, `Space`, `Shift+F10`): the host opens its menu. */
  readonly onActivate?: ((id: string) => void) | undefined;
  readonly labels?: ModifierLabels | undefined;
  /** Base for generated ids. */
  readonly id?: string | undefined;
}

/** Spread onto the rail: one tab stop, arrows between the units. */
export interface ModifierToolbarProps {
  readonly "data-part": string;
  readonly role: "toolbar";
  readonly id: string;
  readonly "aria-label": string;
  readonly "aria-orientation": "vertical";
}

/**
 * Spread onto a unit. The name carries the span and the lock, since the visible text is only the
 * action's label. What activation opens is the host's: it adds `aria-haspopup="menu"` for a menu,
 * or `aria-expanded` and `aria-controls` for a panel of its own — an inline form of checkboxes and
 * radios is a disclosure, not a menu, and saying "menu" there would be a promise it does not keep.
 */
export interface ModifierItemProps {
  readonly "data-part": string;
  readonly role: "button";
  readonly id: string;
  readonly "aria-label": string;
  readonly tabindex: 0 | -1;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
}

/** One step as the host lays it out: which unit, which action, over which columns. */
export interface ModifierStep {
  readonly unit: string;
  readonly kind: string;
  readonly targets: ReadonlyArray<string>;
}

export interface Modifiers {
  readonly modifiers: Accessor<ReadonlyArray<Modifier>>;
  /** The id with the rail's tab stop, and the one a move keeps. */
  readonly active: Accessor<string | undefined>;
  /** The polite region: every structural change lands here once the host's stack says it happened. */
  readonly status: Status;
  readonly targets: ReadonlyArray<ModifierTarget>;
  readonly actions: ReadonlyArray<ModifierAction>;
  readonly toolbarProps: ModifierToolbarProps;
  readonly itemProps: (id: string) => ModifierItemProps;
  /** The unit's accessible name, for a host that wants the same sentence elsewhere. */
  readonly nameOf: (id: string) => string;
  /** Which modifier owns which encoding of a column: what the host paints. */
  readonly encoded: (targetKey: string) => ReadonlyMap<ModifierEncoding, Modifier>;
  readonly owner: (targetKey: string, encoding: ModifierEncoding) => Modifier | undefined;
  /** The stack flattened, in order: the sequence the host renders as the current form. */
  readonly steps: Accessor<ReadonlyArray<ModifierStep>>;
  /** Appends a modifier; returns its id (the host may focus it), or `undefined` when refused. */
  readonly add: (kind: string, targetKeys: ReadonlyArray<string>) => string | undefined;
  readonly remove: (id: string) => void;
  readonly move: (id: string, delta: number) => void;
  readonly toggleTarget: (id: string, targetKey: string) => void;
  readonly lock: (id: string, slot: number | null) => void;
  readonly joinWithAbove: (id: string) => void;
  readonly split: (id: string) => void;
  readonly activate: (id: string) => void;
}

const DEFAULT_APPLIED = (names: string): string => `applied to ${names}`;
const DEFAULT_LOCKED = (name: string): string => `locked to ${name}`;
const DEFAULT_JOINED = (count: number): string => `${count} modifiers joined`;
const DEFAULT_SPLIT = "joined unit split";

const sameSlots = (a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean =>
  a.length === b.length && a.every((slot, index) => slot === b[index]);

const sameUnit = (a: Modifier, b: Modifier): boolean =>
  // the id is part of it: a move reorders the same units, and a stack that only reorders is a change
  a.id === b.id &&
  a.targets.length === b.targets.length &&
  a.targets.every((key, index) => key === b.targets[index]) &&
  (a.locked ?? null) === (b.locked ?? null) &&
  a.parts.length === b.parts.length &&
  a.parts.every((part, index) => {
    const other = b.parts[index];
    return other !== undefined && part.kind === other.kind && sameSlots(part.slots, other.slots);
  });

const sameStack = (a: ReadonlyArray<Modifier>, b: ReadonlyArray<Modifier>): boolean =>
  a.length === b.length &&
  a.every((unit, index) => {
    const other = b[index];
    return other !== undefined && sameUnit(unit, other);
  });

export const createModifiers = (options: ModifiersOptions): Modifiers => {
  const base = options.id ?? createUniqueId();
  const targets = options.targets.slice();
  const actions = options.actions.slice();
  const labels = options.labels ?? {};
  const appliedTo = labels.appliedTo ?? DEFAULT_APPLIED;
  const lockedTo = labels.lockedTo ?? DEFAULT_LOCKED;
  const joinedLabel = labels.joined ?? DEFAULT_JOINED;
  const splitLabel = labels.split ?? DEFAULT_SPLIT;

  const targetLabel = (key: string): string =>
    targets.find((target) => target.key === key)?.label ?? key;
  const actionOf = (kind: string): ModifierAction | undefined =>
    actions.find((action) => action.kind === kind);
  const labelOf = (kind: string): string => actionOf(kind)?.label ?? kind;
  const encodingsOf = (kind: string): ReadonlyArray<ModifierEncoding> =>
    actionOf(kind)?.encodings ?? [];

  // The host's controlled prop is a JSX expression: reading it in an effect's callback is refused,
  // so it is snapshotted in the compute, and the stack reads the snapshot (as `createTable` does).
  const [hostModifiers, setHostModifiers] = createSignal<ReadonlyArray<Modifier> | undefined>(
    options.modifiers,
  );
  createEffect(
    () => options.modifiers,
    (value) => {
      setHostModifiers(() => value);
    },
  );
  const [units, request] = createControllable<ReadonlyArray<Modifier>>({
    value: hostModifiers,
    initial: options.defaultModifiers ?? [],
    onChange: () => options.onModifiersChange,
    same: sameStack,
  });

  const [active, setActive] = createSignal<string | undefined>(undefined);
  const activeId = (): string | undefined => {
    const id = active();
    const list = units();
    if (id !== undefined && list.some((unit) => unit.id === id)) {
      return id;
    }
    return list[0]?.id;
  };

  let serial = 0;
  const nextId = (): string => `${base}-m${serial++}`;
  const itemId = (id: string): string => `${base}-${id}`;

  const targetAt = (unit: Modifier, slot: number): string | undefined => unit.targets[slot];
  const slotKey = (unit: Modifier, slot: number | null | undefined): string | undefined =>
    slot === null || slot === undefined ? undefined : targetAt(unit, slot);
  const namesOf = (unit: Modifier): string => appliedTo(unit.targets.map(targetLabel).join(", "));
  const actionName = (unit: Modifier): string =>
    unit.parts.length > 1
      ? unit.parts.map((part) => labelOf(part.kind)).join(" + ")
      : labelOf(unit.parts[0]?.kind ?? "");

  const nameOf = (id: string): string => {
    const unit = units().find((candidate) => candidate.id === id);
    if (unit === undefined) {
      return "";
    }
    const key = slotKey(unit, unit.locked);
    const locked = key === undefined ? "" : `, ${lockedTo(targetLabel(key))}`;
    return `${actionName(unit)}, ${namesOf(unit)}${locked}`;
  };

  const owner = (targetKey: string, encoding: ModifierEncoding): Modifier | undefined => {
    const list = units();
    for (let u = list.length - 1; u >= 0; u -= 1) {
      const unit = list[u];
      if (unit === undefined) {
        continue;
      }
      const slot = unit.targets.indexOf(targetKey);
      if (slot < 0) {
        continue;
      }
      for (let p = unit.parts.length - 1; p >= 0; p -= 1) {
        const part = unit.parts[p];
        if (part === undefined) {
          continue;
        }
        if (part.slots.includes(slot) && encodingsOf(part.kind).includes(encoding)) {
          return unit;
        }
      }
    }
    return undefined;
  };

  const encoded = (targetKey: string): ReadonlyMap<ModifierEncoding, Modifier> => {
    const found = new Map<ModifierEncoding, Modifier>();
    for (const action of actions) {
      for (const encoding of action.encodings) {
        if (found.has(encoding)) {
          continue;
        }
        const unit = owner(targetKey, encoding);
        if (unit !== undefined) {
          found.set(encoding, unit);
        }
      }
    }
    return found;
  };

  const steps = (): ReadonlyArray<ModifierStep> => {
    const flat: ModifierStep[] = [];
    for (const unit of units()) {
      for (const part of unit.parts) {
        const covered = part.slots
          .map((slot) => targetAt(unit, slot))
          .filter((key): key is string => key !== undefined);
        flat.push({ unit: unit.id, kind: part.kind, targets: covered });
      }
    }
    return flat;
  };

  const replace = (id: string, next: Modifier): void => {
    const list = units();
    if (!list.some((unit) => unit.id === id)) {
      return;
    }
    request(list.map((unit) => (unit.id === id ? next : unit)));
  };

  const add = (kind: string, targetKeys: ReadonlyArray<string>): string | undefined => {
    if (actionOf(kind) === undefined) {
      return undefined;
    }
    const span = targetKeys.filter((key) => targets.some((target) => target.key === key));
    if (span.length === 0) {
      return undefined;
    }
    const unit: Modifier = {
      id: nextId(),
      targets: span,
      parts: [{ kind, slots: span.map((_, slot) => slot) }],
      locked: null,
    };
    setActive(unit.id);
    request([...units(), unit]);
    return unit.id;
  };

  const remove = (id: string): void => {
    const list = units();
    if (!list.some((unit) => unit.id === id)) {
      return;
    }
    request(list.filter((unit) => unit.id !== id));
  };

  // `move` knows which unit the reader moved; a diff of two stacks cannot tell a swap's two ends apart
  let moved: string | undefined;

  const move = (id: string, delta: number): void => {
    const list = units();
    const from = list.findIndex((unit) => unit.id === id);
    if (from < 0 || delta === 0) {
      return;
    }
    const to = Math.min(Math.max(from + delta, 0), list.length - 1);
    if (to === from) {
      return;
    }
    const next = list.slice();
    const [unit] = next.splice(from, 1);
    if (unit === undefined) {
      return;
    }
    next.splice(to, 0, unit);
    moved = id;
    request(next);
  };

  /** Drops a position: the steps lose it and the ones above it shift down, the lock included. */
  const withoutSlot = (unit: Modifier, slot: number): Modifier => {
    const shift = (index: number): number => (index > slot ? index - 1 : index);
    const parts = unit.parts.map((part) => ({
      kind: part.kind,
      slots: part.slots.filter((index) => index !== slot).map(shift),
    }));
    const locked =
      unit.locked === null || unit.locked === undefined || unit.locked === slot
        ? null
        : shift(unit.locked);
    return {
      ...unit,
      targets: unit.targets.filter((_, index) => index !== slot),
      parts: parts.filter((part) => part.slots.length > 0),
      locked,
    };
  };

  const toggleTarget = (id: string, targetKey: string): void => {
    const unit = units().find((candidate) => candidate.id === id);
    if (unit === undefined || !targets.some((target) => target.key === targetKey)) {
      return;
    }
    const slot = unit.targets.indexOf(targetKey);
    if (slot >= 0) {
      // the last column stays: a modifier over nothing is not a modifier
      if (unit.targets.length === 1) {
        return;
      }
      replace(id, withoutSlot(unit, slot));
      return;
    }
    // extending is the brush: every step of the unit takes the new column, in order
    const added = unit.targets.length;
    replace(id, {
      ...unit,
      targets: [...unit.targets, targetKey],
      parts: unit.parts.map((part) => ({ kind: part.kind, slots: [...part.slots, added] })),
    });
  };

  const lock = (id: string, slot: number | null): void => {
    const unit = units().find((candidate) => candidate.id === id);
    if (unit === undefined) {
      return;
    }
    const valid = slot !== null && slot >= 0 && slot < unit.targets.length ? slot : null;
    replace(id, { ...unit, locked: valid });
  };

  const joinWithAbove = (id: string): void => {
    const list = units();
    const index = list.findIndex((unit) => unit.id === id);
    const lower = list[index];
    const upper = index > 0 ? list[index - 1] : undefined;
    if (lower === undefined || upper === undefined) {
      return;
    }
    // The upper unit's columns first, then the ones only the lower spans: every step keeps its
    // coverage by position, so retargeting the joined unit moves the whole sequence.
    const span = [...upper.targets];
    for (const key of lower.targets) {
      if (!span.includes(key)) {
        span.push(key);
      }
    }
    const remap = (unit: Modifier, part: ModifierPart): ModifierPart => ({
      kind: part.kind,
      slots: part.slots
        .map((slot) => span.indexOf(slotKey(unit, slot) ?? ""))
        .filter((slot) => slot >= 0),
    });
    const parts: ModifierPart[] = [
      ...upper.parts.map((part) => remap(upper, part)),
      ...lower.parts.map((part) => remap(lower, part)),
    ];
    // the unit the reader acted on keeps its own lock; an unlocked lower unit inherits the upper's
    const keep = slotKey(lower, lower.locked) ?? slotKey(upper, upper.locked);
    const locked = keep === undefined ? null : span.indexOf(keep);
    const joined: Modifier = { id: lower.id, targets: span, parts, locked };
    const next = list.slice();
    next.splice(index - 1, 2, joined);
    setActive(joined.id);
    request(next);
  };

  const split = (id: string): void => {
    const unit = units().find((candidate) => candidate.id === id);
    if (unit === undefined || unit.parts.length < 2) {
      return;
    }
    const pieces: Modifier[] = unit.parts.map((part, index) => ({
      // the first piece keeps the id, so the focused element is not thrown away
      id: index === 0 ? unit.id : nextId(),
      targets: part.slots
        .map((slot) => targetAt(unit, slot))
        .filter((key): key is string => key !== undefined),
      parts: [{ kind: part.kind, slots: part.slots.map((_, slot) => slot) }],
      locked: null,
    }));
    const list = units();
    const at = list.findIndex((candidate) => candidate.id === id);
    const next = list.slice();
    next.splice(at, 1, ...pieces);
    request(next);
  };

  const activate = (id: string): void => {
    setActive(id);
    options.onActivate?.(id);
  };

  const onItemKeyDown = (id: string, event: KeyboardEvent): void => {
    const list = units();
    const index = list.findIndex((unit) => unit.id === id);
    if (index < 0) {
      return;
    }
    const vertical = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (vertical !== 0) {
      event.preventDefault();
      if (event.altKey) {
        // the drag is a pointer's; this is the keyboard's way to reorder the stack
        move(id, vertical);
        return;
      }
      const next = list[Math.min(Math.max(index + vertical, 0), list.length - 1)];
      if (next !== undefined) {
        setActive(next.id);
        document.getElementById(itemId(next.id))?.focus();
      }
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const edge = event.key === "Home" ? list[0] : list[list.length - 1];
      if (edge !== undefined) {
        setActive(edge.id);
        document.getElementById(itemId(edge.id))?.focus();
      }
      return;
    }
    if (event.key === "Enter" || event.key === " " || event.key === "ContextMenu") {
      event.preventDefault();
      activate(id);
      return;
    }
    if (event.key === "F10" && event.shiftKey) {
      event.preventDefault();
      activate(id);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove(id);
    }
  };

  /** The stack as one sentence: what changed, from the two stacks themselves. */
  const describeChange = (
    before: ReadonlyArray<Modifier>,
    next: ReadonlyArray<Modifier>,
  ): string | undefined => {
    const old = new Map(before.map((unit) => [unit.id, unit]));
    const fresh = new Map(next.map((unit) => [unit.id, unit]));

    for (const unit of next) {
      const was = old.get(unit.id);
      if (was === undefined) {
        continue;
      }
      if (was.parts.length < unit.parts.length) {
        return joinedLabel(unit.parts.length);
      }
      if (was.parts.length > unit.parts.length) {
        return splitLabel;
      }
    }

    const added = next.find((unit) => !old.has(unit.id));
    if (added !== undefined) {
      return `${actionName(added)} added, ${namesOf(added)}`;
    }

    const removed = before.find((unit) => !fresh.has(unit.id));
    if (removed !== undefined) {
      return `${actionName(removed)} removed`;
    }

    for (const unit of next) {
      const was = old.get(unit.id);
      if (was === undefined || (was.locked ?? null) === (unit.locked ?? null)) {
        continue;
      }
      const key = slotKey(unit, unit.locked);
      return key === undefined
        ? `${actionName(unit)} unlocked`
        : `${actionName(unit)}, ${lockedTo(targetLabel(key))}`;
    }

    for (const unit of next) {
      const was = old.get(unit.id);
      if (was !== undefined && was.targets.join(" ") !== unit.targets.join(" ")) {
        return `${actionName(unit)}, ${namesOf(unit)}`;
      }
    }

    if (
      before.length === next.length &&
      before.some((unit, index) => next[index]?.id !== unit.id)
    ) {
      const id = moved ?? next.find((unit, index) => before[index]?.id !== unit.id)?.id;
      const unit = next.find((candidate) => candidate.id === id);
      if (unit !== undefined) {
        return `${actionName(unit)} moved to position ${next.indexOf(unit) + 1} of ${next.length}`;
      }
    }
    return undefined;
  };

  const status = createStatus();

  // The announcement follows the commit, not the request: a controlled host that refuses a change
  // must not be described as having made it (`createControllable`'s request/commit split). The first
  // stack is read here, at creation, not left to the effect's first run: an effect runs after the
  // first flush, and an `add` before that flush would be read as the stack the host started with.
  let previous: ReadonlyArray<Modifier> = units();
  createEffect(
    () => units(),
    (next) => {
      const before = previous;
      previous = next;
      const text = describeChange(before, next);
      moved = undefined;
      if (text !== undefined) {
        status.show(text);
      }
    },
  );

  return {
    modifiers: units,
    active: activeId,
    status,
    targets,
    actions,
    toolbarProps: {
      "data-part": "toolbar",
      role: "toolbar",
      id: base,
      get "aria-label"() {
        return labels.rail ?? "Table transformations";
      },
      "aria-orientation": "vertical",
    },
    itemProps: (id: string): ModifierItemProps => ({
      "data-part": "item",
      role: "button",
      id: itemId(id),
      get "aria-label"() {
        return nameOf(id);
      },
      get tabindex() {
        return activeId() === id ? 0 : -1;
      },
      onKeyDown: (event) => onItemKeyDown(id, event),
      onClick: () => activate(id),
      onFocus: () => setActive(id),
    }),
    nameOf,
    encoded,
    owner,
    steps,
    add,
    remove,
    move,
    toggleTarget,
    lock,
    joinWithAbove,
    split,
    activate,
  };
};
