import {
  type CardBoard,
  type CardBoardCard,
  type CardBoardColumn,
  type CardBoardState,
  createCardBoard,
} from "../src/cardboard";
import { For, createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

const CARDS: ReadonlyArray<CardBoardCard> = [
  { id: "a1", label: "A1" },
  { id: "a2", label: "A2" },
  { id: "b1", label: "B1" },
];

const COLUMNS: ReadonlyArray<CardBoardColumn> = [
  { id: "a", label: "Todo", cards: ["a1", "a2"] },
  { id: "b", label: "Doing", cards: ["b1"] },
  { id: "c", label: "Done", cards: [] },
];

interface Mounted {
  readonly api: CardBoard;
  readonly root: HTMLElement;
  /** Every state the host was handed, oldest first. */
  readonly moved: CardBoardState[];
  readonly activated: string[];
  readonly columns: () => ReadonlyArray<CardBoardColumn>;
  readonly column: (id: string) => HTMLElement;
  readonly card: (id: string) => HTMLElement;
  readonly status: () => HTMLElement;
  readonly frame: () => HTMLElement;
  readonly dispose: () => void;
}

const disposers: Array<() => void> = [];

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
  document.body.replaceChildren();
});

const settle = async (): Promise<void> => {
  flush();
  await Promise.resolve();
  flush();
};

const mount = (options: {
  readonly columns?: ReadonlyArray<CardBoardColumn> | undefined;
  readonly cards?: ReadonlyArray<CardBoardCard> | undefined;
  readonly canDrop?: ((card: string, column: string) => boolean) | undefined;
  readonly labels?: { readonly board?: string } | undefined;
}): Mounted => {
  const root = document.createElement("div");
  root.style.width = "640px";
  document.body.append(root);
  const moved: CardBoardState[] = [];
  const activated: string[] = [];
  const cards = options.cards ?? CARDS;
  const initial = options.columns ?? COLUMNS;
  const [columns, setColumns] = createSignal(initial);
  let api: CardBoard | undefined;
  const dispose = render(() => {
    const board = createCardBoard({
      cards,
      columns: () => columns(),
      canDrop: options.canDrop,
      labels: options.labels,
      onMove: (state) => {
        moved.push(state);
        setColumns(state.columns);
      },
      onActivate: (card) => activated.push(card),
    });
    api = board;
    return (
      <div>
        <div {...board.boardProps} style={{ display: "flex", gap: "20px" }}>
          <For each={initial}>
            {(meta) => {
              const column = () => columns().find((candidate) => candidate.id === meta.id);
              return (
                <div
                  {...board.columnProps(meta.id)}
                  style={{ flex: "1 1 0", padding: "8px", "min-height": "240px" }}
                >
                  <For each={column()?.cards ?? []}>
                    {(id) => (
                      <div {...board.cardProps(id)} style={{ height: "40px", margin: "6px 0" }}>
                        {id}
                      </div>
                    )}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
        <p {...board.statusProps}>{board.status()}</p>
      </div>
    );
  }, root);
  disposers.push(dispose);
  if (api === undefined) {
    throw new Error("not mounted");
  }
  const required = (selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element === null) {
      throw new Error(`no ${selector}`);
    }
    return element;
  };
  return {
    api,
    root,
    moved,
    activated,
    columns,
    column: (id) => required(`[data-column="${id}"]`),
    card: (id) => required(`[data-card="${id}"]`),
    status: () => required('[data-part="status"]'),
    frame: () => required('[data-part="board"]'),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const centre = (element: Element): { x: number; y: number } => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const pointer = (
  target: Element,
  type: string,
  at: { readonly x: number; readonly y: number },
  button = 0,
): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: at.x,
      clientY: at.y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button,
      buttons: type === "pointerup" ? 0 : 1,
    }),
  );
};

const drag = async (
  mounted: Mounted,
  card: string,
  at: { readonly x: number; readonly y: number },
): Promise<void> => {
  const element = mounted.card(card);
  pointer(element, "pointerdown", centre(element));
  pointer(element, "pointermove", at);
  await settle();
  pointer(element, "pointerup", at);
  await settle();
};

const press = async (element: HTMLElement, key: string): Promise<void> => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

const stateAt = (states: ReadonlyArray<CardBoardState>, column: string, index: number) =>
  states.find((state) => state.column === column && state.index === index);

const cardsIn = (state: CardBoardState, column: string): ReadonlyArray<string> =>
  state.columns.find((candidate) => candidate.id === column)?.cards ?? [];

describe("createCardBoard: the declaration", () => {
  it("declares every reachable (column, index) of a card, with the board after the move", async () => {
    const { api, dispose } = mount({});
    await settle();
    try {
      const states = api.statesOf("a1");
      expect(states.map((state) => [state.column, state.index])).toEqual([
        ["a", 0],
        ["a", 1],
        ["b", 0],
        ["b", 1],
        ["c", 0],
      ]);
      // the state at the card's own column and index is the no-move state
      const still = stateAt(states, "a", 0);
      expect(still?.columns).toEqual(COLUMNS);
      expect(cardsIn(states[1] as CardBoardState, "a")).toEqual(["a2", "a1"]);
      expect(cardsIn(states[2] as CardBoardState, "b")).toEqual(["a1", "b1"]);
      expect(cardsIn(states[4] as CardBoardState, "c")).toEqual(["a1"]);
      // a card the board does not hold declares nothing
      expect(api.statesOf("ghost")).toEqual([]);
    } finally {
      dispose();
    }
  });

  it("lets canDrop take a column out of the declaration", async () => {
    const { api, dispose } = mount({ canDrop: (_card, column) => column !== "c" });
    await settle();
    try {
      const states = api.statesOf("a1");
      expect(states.every((state) => state.column !== "c")).toBe(true);
      expect(states).toHaveLength(4);
      // a card that is blocked from its own column has nowhere to stay either
      expect(api.statesOf("b1").every((state) => state.column !== "c")).toBe(true);
    } finally {
      dispose();
    }
  });
});

describe("createCardBoard: the landing", () => {
  it("picks the column under the pointer and the index from the card centres", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, card, column } = mounted;
      const from = card("a2");
      const start = centre(from);

      pointer(from, "pointerdown", start);
      pointer(from, "pointermove", { x: start.x, y: start.y + 6 });
      await settle();
      expect(api.dragging()).toBe("a2");

      // below b1's centre: the end of Doing, whose only card is above the pointer
      const doing = column("b").getBoundingClientRect();
      const b1 = card("b1").getBoundingClientRect();
      const below = { x: doing.left + doing.width / 2, y: b1.bottom + 8 };
      pointer(from, "pointermove", below);
      expect(api.landing()).toMatchObject({ card: "a2", column: "b", index: 1 });

      // above b1's centre: the start of Doing
      const above = { x: doing.left + doing.width / 2, y: b1.top - 4 };
      pointer(from, "pointermove", above);
      expect(api.landing()).toMatchObject({ card: "a2", column: "b", index: 0 });

      // the empty column is one slot
      const done = column("c").getBoundingClientRect();
      pointer(from, "pointermove", { x: done.left + done.width / 2, y: done.top + 10 });
      expect(api.landing()).toMatchObject({ card: "a2", column: "c", index: 0 });

      // in the source column the card being dragged is not counted
      const todo = column("a").getBoundingClientRect();
      const a2 = card("a2").getBoundingClientRect();
      pointer(from, "pointermove", { x: todo.left + todo.width / 2, y: a2.top - 2 });
      // a1's centre is above the pointer and a2 is the dragged card, so the slot is 1
      expect(api.landing()).toMatchObject({ column: "a", index: 1 });
      // the board after the move is the whole board, not a pair
      expect(api.landing()?.columns).toHaveLength(3);

      pointer(from, "pointerup", below);
      await settle();
      expect(api.landing()).toBeUndefined();
    } finally {
      mounted.dispose();
    }
  });

  it("a release in the channel between columns still lands in the nearest one", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, card, column } = mounted;
      const from = card("a1");
      const start = centre(from);
      const doing = column("b").getBoundingClientRect();
      const todo = column("a").getBoundingClientRect();
      // the gap between Todo and Doing, nearer Doing
      const gap = { x: (todo.right + doing.left) / 2 + 2, y: doing.top + 20 };

      pointer(from, "pointerdown", start);
      pointer(from, "pointermove", gap);
      await settle();
      expect(api.landing()?.column).toBe("b");
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCardBoard: the commit", () => {
  it("hands the host the landing state and the board with the card moved", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { moved, columns, column } = mounted;
      const doing = column("b").getBoundingClientRect();
      const below = { x: doing.left + doing.width / 2, y: doing.bottom - 6 };

      await drag(mounted, "a1", below);

      expect(moved).toHaveLength(1);
      const state = moved[0] as CardBoardState;
      expect(state).toMatchObject({ card: "a1", column: "b", index: 1 });
      expect(cardsIn(state, "a")).toEqual(["a2"]);
      expect(cardsIn(state, "b")).toEqual(["b1", "a1"]);
      // the host applied it, so the DOM followed the model
      expect(columns().map((entry) => entry.cards)).toEqual([["a2"], ["b1", "a1"], []]);
      expect(
        [...mounted.column("b").querySelectorAll("[data-card]")].map((el) => el.textContent),
      ).toEqual(["b1", "a1"]);
    } finally {
      mounted.dispose();
    }
  });

  it("the no-move state commits nothing", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, moved } = mounted;
      api.startMove("a1");
      await settle();
      expect(api.commit()).toBe(false);
      expect(moved).toEqual([]);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCardBoard: the pointer rules", () => {
  it("a press under the threshold is a click, and a click after a drag activates nothing", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, card, column, activated } = mounted;
      const element = card("a1");
      const start = centre(element);
      pointer(element, "pointerdown", start);
      pointer(element, "pointermove", { x: start.x + 2, y: start.y });
      await settle();
      expect(api.dragging()).toBeUndefined();
      expect(api.landing()).toBeUndefined();
      pointer(element, "pointerup", { x: start.x + 2, y: start.y });
      await settle();
      element.click();
      await settle();
      expect(activated).toEqual(["a1"]);

      const doing = column("b").getBoundingClientRect();
      await drag(mounted, "a2", { x: doing.left + doing.width / 2, y: doing.top + 20 });
      // the click the browser sends after the drag is swallowed once
      element.click();
      await settle();
      expect(activated).toEqual(["a1"]);
      element.click();
      await settle();
      expect(activated).toEqual(["a1", "a1"]);
    } finally {
      mounted.dispose();
    }
  });

  it("pointercancel and a release outside the board cancel", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, moved, card, column, frame } = mounted;
      const element = card("a1");
      const doing = column("b").getBoundingClientRect();
      const target = { x: doing.left + doing.width / 2, y: doing.top + 20 };

      pointer(element, "pointerdown", centre(element));
      pointer(element, "pointermove", target);
      await settle();
      expect(api.landing()?.column).toBe("b");
      pointer(element, "pointercancel", target);
      await settle();
      expect(api.landing()).toBeUndefined();
      expect(moved).toEqual([]);

      const outside = frame().getBoundingClientRect();
      pointer(element, "pointerdown", centre(element));
      pointer(element, "pointermove", { x: outside.right + 40, y: outside.top + 20 });
      await settle();
      expect(api.landing()).toBeUndefined();
      pointer(element, "pointerup", { x: outside.right + 40, y: outside.top + 20 });
      await settle();
      expect(moved).toEqual([]);
      expect(api.dragging()).toBeUndefined();
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCardBoard: the keyboard", () => {
  it("walks the declared states, commits on Enter and names the target", async () => {
    const mounted = mount({ labels: { board: "Sprint" } });
    await settle();
    try {
      const { api, moved, columns, card, status } = mounted;
      const element = card("a1");
      await press(element, " ");
      expect(api.chosen()).toMatchObject({ card: "a1", column: "a", index: 0 });
      expect(status().textContent).toBe(
        "Sprint. A1 to Todo, position 1 of 2. Enter to drop, Escape to cancel.",
      );

      // right: the next column, the same index
      await press(element, "ArrowRight");
      expect(api.chosen()).toMatchObject({ column: "b", index: 0 });
      expect(status().textContent).toContain("A1 to Doing, position 1 of 2");
      // down: the end of Doing
      await press(element, "ArrowDown");
      expect(api.chosen()).toMatchObject({ column: "b", index: 1 });
      expect(status().textContent).toContain("Doing, position 2 of 2");
      // down again is clamped
      await press(element, "ArrowDown");
      expect(api.chosen()).toMatchObject({ column: "b", index: 1 });
      // right: the empty column, one slot
      await press(element, "ArrowRight");
      expect(api.chosen()).toMatchObject({ column: "c", index: 0 });
      expect(status().textContent).toContain("Done, position 1 of 1");
      // left again, index clamped to Doing's two slots
      await press(element, "ArrowLeft");
      expect(api.chosen()).toMatchObject({ column: "b", index: 0 });

      await press(element, "Enter");
      expect(api.chosen()).toBeUndefined();
      expect(moved).toHaveLength(1);
      expect(moved[0]).toMatchObject({ card: "a1", column: "b", index: 0 });
      expect(columns().map((entry) => entry.cards)).toEqual([["a2"], ["a1", "b1"], []]);
      expect(status().textContent).toBe("");
      // the card moved in the DOM too, and the focus went with it
      expect(document.activeElement).toBe(card("a1"));
    } finally {
      mounted.dispose();
    }
  });

  it("Escape forgets the walk, and Space starts it on the focused card", async () => {
    const mounted = mount({});
    await settle();
    try {
      const { api, moved, card } = mounted;
      const element = card("b1");
      element.focus();
      await settle();
      await press(element, " ");
      expect(api.chosen()).toMatchObject({ card: "b1", column: "b", index: 0 });
      await press(element, "ArrowLeft");
      expect(api.chosen()).toMatchObject({ column: "a", index: 0 });
      await press(element, "Escape");
      expect(api.chosen()).toBeUndefined();
      expect(moved).toEqual([]);
      // Enter is a card's own action, not a lift
      await press(element, "Enter");
      expect(api.chosen()).toBeUndefined();
      expect(mounted.activated).toEqual(["b1"]);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCardBoard: the declaration as attributes", () => {
  it("marks the source, the target, the blocked columns and the drop index", async () => {
    const mounted = mount({ canDrop: (_card, column) => column !== "c" });
    await settle();
    try {
      const { api, card, column } = mounted;
      const dragged = card("a1");
      expect(column("a").getAttribute("data-drop-column")).toBeNull();

      await press(dragged, " ");
      expect(column("a").getAttribute("data-drop-column")).toBe("source");
      expect(column("b").getAttribute("data-drop-column")).toBeNull();
      expect(column("c").getAttribute("data-drop-column")).toBe("blocked");
      expect(dragged.getAttribute("data-drop-target")).toBe("true");
      expect(card("b1").getAttribute("data-drop-index")).toBeNull();

      await press(dragged, "ArrowRight");
      await settle();
      expect(column("a").getAttribute("data-drop-column")).toBe("source");
      expect(column("b").getAttribute("data-drop-column")).toBe("target");
      expect(card("b1").getAttribute("data-drop-index")).toBe("1");
      expect(dragged.getAttribute("data-drop-index")).toBeNull();
      await press(dragged, "Escape");
      await settle();
      expect(column("a").getAttribute("data-drop-column")).toBeNull();
      expect(dragged.getAttribute("data-drop-target")).toBeNull();
      expect(card("b1").getAttribute("data-drop-index")).toBeNull();
      expect(api.held()).toBeUndefined();
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCardBoard: the numbers", () => {
  const COLS = ["todo", "doing", "done"];
  const many = (): {
    readonly columns: ReadonlyArray<CardBoardColumn>;
    readonly cards: ReadonlyArray<CardBoardCard>;
  } => {
    const cards: CardBoardCard[] = Array.from({ length: 40 }, (_, index) => ({
      id: `k${index}`,
      label: `Card ${index}`,
    }));
    const columns = COLS.map((id, at) => ({
      id,
      label: id,
      cards: cards.filter((_, index) => index % COLS.length === at).map((card) => card.id),
    }));
    return { columns, cards };
  };

  it("declares the board's states and prices the landing against a per-card hit test", async () => {
    const { columns, cards } = many();
    const mounted = mount({ columns, cards });
    await settle();
    try {
      const { api, card, column, frame } = mounted;
      const perCard = cards.map((entry) => api.statesOf(entry.id).length);
      const total = perCard.reduce((sum, count) => sum + count, 0);
      expect(perCard).toHaveLength(40);
      expect(new Set(perCard).size).toBe(1);
      // every card may go before or after every card of the other columns, and stay where it is
      expect(perCard[0]).toBe(40 + 2);
      expect(total).toBe(40 * 42);

      const time = (runs: number, body: () => void): number => {
        body();
        const started = performance.now();
        for (let run = 0; run < runs; run++) {
          body();
        }
        return ((performance.now() - started) / runs) * 1000;
      };

      const states = time(200, () => {
        for (const entry of cards) {
          api.statesOf(entry.id);
        }
      });

      const element = card("k0");
      const start = centre(element);
      const doing = column("doing").getBoundingClientRect();
      const target = { x: doing.left + doing.width / 2, y: doing.top + 40 };
      pointer(element, "pointerdown", start);
      pointer(element, "pointermove", target);
      await settle();
      expect(api.landing()?.column).toBe("doing");

      const landing = time(2000, () => {
        pointer(element, "pointermove", target);
        api.landing();
      });

      const all = [...frame().querySelectorAll("[data-card]")];
      const baseline = time(500, () => {
        let best = Number.POSITIVE_INFINITY;
        for (const other of all) {
          const box = other.getBoundingClientRect();
          const distance = Math.hypot(
            box.left + box.width / 2 - target.x,
            box.top + box.height / 2 - target.y,
          );
          if (distance < best) {
            best = distance;
          }
        }
      });

      let reads = 0;
      const prototype = Element.prototype;
      const original = Object.getOwnPropertyDescriptor(prototype, "getBoundingClientRect")
        ?.value as (this: Element) => DOMRect;
      prototype.getBoundingClientRect = function measured(this: Element): DOMRect {
        reads += 1;
        return original.call(this);
      };
      let gesture = 0;
      try {
        pointer(element, "pointerup", { x: 0, y: 0 });
        const fresh = time(20, () => {
          pointer(element, "pointerdown", start);
          pointer(element, "pointermove", target);
          gesture += 1;
          pointer(element, "pointercancel", target);
        });
        console.log(
          `cardboard: 40 cards, ${perCard[0]} states each, ${total} declared states; ` +
            `statesOf (all 40) ${states.toFixed(1)} µs, one landing ${landing.toFixed(2)} µs, ` +
            `per-card hit test ${baseline.toFixed(1)} µs, one gesture's measurement ${fresh.toFixed(1)} µs ` +
            `(${reads / gesture} rects read)`,
        );
      } finally {
        prototype.getBoundingClientRect = original;
      }

      pointer(element, "pointerup", { x: 0, y: 0 });
      await settle();
    } finally {
      mounted.dispose();
    }
  });
});
