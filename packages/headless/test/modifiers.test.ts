import { createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  createModifiers,
  type Modifier,
  type ModifierAction,
  type Modifiers,
  type ModifierTarget,
} from "../src/modifiers";

const targets: ReadonlyArray<ModifierTarget> = [
  { key: "audience", label: "Audience" },
  { key: "critics", label: "Critics" },
  { key: "gross", label: "Gross" },
];

const actions: ReadonlyArray<ModifierAction> = [
  { kind: "color", label: "Color", encodings: ["color"] },
  { kind: "size", label: "Size", encodings: ["size"] },
  { kind: "axis", label: "Axis", encodings: ["y", "order"] },
];

const roots: Array<() => void> = [];

afterEach(() => {
  for (const dispose of roots.splice(0)) {
    dispose();
  }
});

/**
 * Mounts the primitive in a root of its own (an effect can then be flushed with no component), and
 * runs the setup outside that root: a write inside an owned scope is refused by the dev build.
 */
const mounted = (
  setup: (rail: Modifiers) => void,
  options: Partial<Parameters<typeof createModifiers>[0]> = {},
): { readonly rail: Modifiers } => {
  const rail = createRoot((dispose) => {
    roots.push(dispose);
    return createModifiers({ targets, actions, ...options });
  });
  setup(rail);
  return { rail };
};

const key = (init: KeyboardEventInit): KeyboardEvent =>
  new KeyboardEvent("keydown", { cancelable: true, ...init });

const stack = (rail: Modifiers): ReadonlyArray<Modifier> => rail.modifiers();

describe("createModifiers: one encoding, one owner", () => {
  it("takes the topmost modifier that spans the column", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.add("size", ["audience"]);
    });
    const [first, second] = stack(rail);
    expect(first).toBeDefined();
    expect(second).toBeDefined();

    // each owns its own encoding, and neither takes the other's
    expect(rail.owner("audience", "color")?.id).toBe(first?.id);
    expect(rail.owner("audience", "size")?.id).toBe(second?.id);
    expect(rail.owner("audience", "x")).toBeUndefined();
    expect([...rail.encoded("audience").keys()]).toEqual(["color", "size"]);
  });

  it("makes the order mean something: the same action, twice, is the upper one", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.add("color", ["audience"]);
    });
    const [first, second] = stack(rail);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(rail.owner("audience", "color")?.id).toBe(second?.id);

    // a move is the whole point: bring the upper one down and the other owns it
    rail.move(second?.id ?? "", -1);
    expect(rail.owner("audience", "color")?.id).toBe(first?.id);
  });

  it("leaves a column no modifier spans alone", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
    });
    expect(rail.encoded("gross").size).toBe(0);
  });
});

describe("createModifiers: join, reuse, split", () => {
  it("joins a unit with the one above it, in stack order", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.add("size", ["audience"]);
      modifiers.add("axis", ["audience"]);
    });
    const [, size, axis] = stack(rail);
    expect(size).toBeDefined();
    expect(axis).toBeDefined();

    rail.joinWithAbove(axis?.id ?? "");

    const joined = stack(rail);
    expect(joined.length).toBe(2);
    expect(joined[1]?.parts.map((part) => part.kind)).toEqual(["size", "axis"]);
    // the unit the reader acted on keeps its id and the upper one's position
    expect(joined[1]?.id).toBe(axis?.id);
    expect(rail.nameOf(axis?.id ?? "")).toBe("Size + Axis, applied to Audience");
  });

  it("reuses a joined unit by retargeting it: the steps follow the columns, not the keys", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("axis", ["audience"]);
      modifiers.add("color", ["audience"]);
      const [axis, color] = stack(modifiers);
      modifiers.joinWithAbove(color?.id ?? "");
      expect(axis).toBeDefined();
    });
    const [joined] = stack(rail);
    expect(joined?.targets).toEqual(["audience"]);

    rail.toggleTarget(joined?.id ?? "", "critics");

    const [brushed] = stack(rail);
    expect(brushed?.targets).toEqual(["audience", "critics"]);
    // the brush is the whole sequence: every step takes the new column, in order
    expect(brushed?.parts.every((part) => part.slots.join() === "0,1")).toBe(true);
    expect(rail.owner("critics", "color")?.id).toBe(joined?.id);
    expect(rail.owner("critics", "y")?.id).toBe(joined?.id);

    rail.toggleTarget(joined?.id ?? "", "audience");
    const [onlyCritics] = stack(rail);
    expect(onlyCritics?.targets).toEqual(["critics"]);
    // the slot was dropped, so position 0 is now "critics" and both steps still reach it
    expect(onlyCritics?.parts.every((part) => part.slots.join() === "0")).toBe(true);
    expect(rail.owner("critics", "color")?.id).toBe(joined?.id);
  });

  it("splits back into the steps it was joined from", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.add("size", ["audience"]);
      const [, size] = stack(modifiers);
      modifiers.joinWithAbove(size?.id ?? "");
    });
    const [joined] = stack(rail);
    expect(joined?.parts.length).toBe(2);

    rail.split(joined?.id ?? "");

    const pieces = stack(rail);
    expect(pieces.map((unit) => unit.parts[0]?.kind)).toEqual(["color", "size"]);
    expect(pieces[0]?.targets).toEqual(["audience"]);
    expect(pieces[1]?.targets).toEqual(["audience"]);
    // the first piece keeps the id, so the focused element survives a split too
    expect(pieces[0]?.id).toBe(joined?.id);
  });

  it("flattens the stack for the host, in order", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience", "critics"]);
      modifiers.add("axis", ["gross"]);
      const [, axis] = stack(modifiers);
      modifiers.joinWithAbove(axis?.id ?? "");
    });
    expect(rail.steps().map((step) => [step.kind, step.targets])).toEqual([
      ["color", ["audience", "critics"]],
      ["axis", ["gross"]],
    ]);
  });
});

describe("createModifiers: the lock", () => {
  it("carries the locked column as data: the host computes the inherited outcome, the rail names it", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.toggleTarget(stack(modifiers)[0]?.id ?? "", "critics");
    });
    const id = stack(rail)[0]?.id ?? "";
    expect(stack(rail)[0]?.locked ?? null).toBeNull();

    rail.lock(id, 0);

    // the lock is a descriptor, as a table's sort is: the primitive says which column is the input
    expect(stack(rail)[0]?.locked).toBe(0);
    expect(rail.nameOf(id)).toBe("Color, applied to Audience, Critics, locked to Audience");

    rail.lock(id, 9);
    expect(stack(rail)[0]?.locked).toBeNull();
  });

  it("drops the lock when the locked column leaves the span", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
      modifiers.toggleTarget(stack(modifiers)[0]?.id ?? "", "critics");
    });
    const id = stack(rail)[0]?.id ?? "";
    rail.lock(id, 0);

    rail.toggleTarget(id, "audience");

    expect(stack(rail)[0]?.locked).toBeNull();
    expect(rail.nameOf(id)).toBe("Color, applied to Critics");
  });

  it("keeps the last column: a modifier over nothing is not a modifier", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
    });
    const id = stack(rail)[0]?.id ?? "";
    rail.toggleTarget(id, "audience");
    expect(stack(rail)[0]?.targets).toEqual(["audience"]);
  });
});

describe("createModifiers: the announcement follows the commit", () => {
  it("says what changed, one sentence per structural change", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience"]);
    });
    flush();
    expect(rail.status.message()).toBe("Color added, applied to Audience");

    const color = stack(rail)[0]?.id ?? "";
    rail.add("size", ["audience"]);
    flush();
    expect(rail.status.message()).toBe("Size added, applied to Audience");

    rail.move(color, 1);
    flush();
    expect(rail.status.message()).toBe("Color moved to position 2 of 2");

    rail.lock(color, 0);
    flush();
    expect(rail.status.message()).toBe("Color, locked to Audience");

    rail.lock(color, null);
    flush();
    expect(rail.status.message()).toBe("Color unlocked");

    rail.joinWithAbove(stack(rail)[1]?.id ?? "");
    flush();
    expect(rail.status.message()).toBe("2 modifiers joined");

    rail.split(stack(rail)[0]?.id ?? "");
    flush();
    expect(rail.status.message()).toBe("joined unit split");

    // the split kept the joined id on its first piece, which is the upper step
    rail.remove(stack(rail)[0]?.id ?? "");
    flush();
    expect(rail.status.message()).toBe("Size removed");
  });

  it("says nothing when a controlled host refuses the request", () => {
    const requests: ReadonlyArray<Modifier>[] = [];
    const { rail } = mounted(
      (modifiers) => {
        modifiers.add("color", ["audience"]);
      },
      {
        modifiers: [],
        onModifiersChange: (next) => requests.push(next),
      },
    );
    flush();

    expect(rail.modifiers()).toEqual([]);
    expect(requests.length).toBe(1);
    expect(rail.status.message()).toBeUndefined();
  });
});

describe("createModifiers: the rail's contract", () => {
  it("names every unit with its span and its lock, and keeps one tab stop", () => {
    const { rail } = mounted((modifiers) => {
      modifiers.add("color", ["audience", "critics"]);
      modifiers.add("size", ["gross"]);
    });
    const list = stack(rail);
    const first = list[0]?.id ?? "";
    const second = list[1]?.id ?? "";

    expect(rail.toolbarProps.role).toBe("toolbar");
    expect(rail.toolbarProps["aria-orientation"]).toBe("vertical");
    expect(rail.toolbarProps["aria-label"]).toBe("Table transformations");
    expect(rail.itemProps(first).role).toBe("button");
    expect(rail.itemProps(first)["aria-haspopup"]).toBe("menu");
    expect(rail.itemProps(first)["aria-label"]).toBe("Color, applied to Audience, Critics");
    expect(rail.itemProps(first).tabindex).toBe(0);
    expect(rail.itemProps(second).tabindex).toBe(-1);
  });

  it("moves the stack with Alt+arrow, opens the menu with Enter, removes with Delete", () => {
    const opened: string[] = [];
    const { rail } = mounted(
      (modifiers) => {
        modifiers.add("color", ["audience"]);
        modifiers.add("size", ["audience"]);
      },
      { onActivate: (id) => opened.push(id) },
    );
    const [first, second] = stack(rail);
    const firstKey = rail.itemProps(first?.id ?? "").onKeyDown;
    const secondKey = rail.itemProps(second?.id ?? "").onKeyDown;

    // a plain arrow is a focus move, not a reorder
    firstKey(key({ key: "ArrowDown" }));
    expect(stack(rail).map((unit) => unit.id)).toEqual([first?.id, second?.id]);

    firstKey(key({ key: "ArrowDown", altKey: true }));
    expect(stack(rail).map((unit) => unit.id)).toEqual([second?.id, first?.id]);
    expect(opened).toEqual([]);

    secondKey(key({ key: "Enter" }));
    expect(opened).toEqual([second?.id]);

    secondKey(key({ key: "Delete" }));
    expect(stack(rail).map((unit) => unit.id)).toEqual([first?.id]);
  });

  it("starts empty and refuses a kind outside the host's vocabulary", () => {
    const { rail } = mounted(() => undefined);
    expect(rail.modifiers()).toEqual([]);
    expect(rail.add("strobe", ["audience"])).toBeUndefined();
    expect(rail.add("color", ["nowhere"])).toBeUndefined();
    expect(rail.modifiers()).toEqual([]);
  });
});
