import { type Accessor, createSignal, createUniqueId, onSettled } from "solid-js";

/**
 * A card board — cards in columns, one drag between them — where the movement is a
 * **declared set of model states** rather than a hit test. The paper it borrows
 * from (Horowitz, Blinn and Heer, _Declarative Dragging_, UIST 2026) has the
 * author declare which future model states a drag should reach and lets the
 * engine render them speculatively and read where the glyphs land. The kit keeps
 * the declaration and the reading, not the engine: `statesOf(card)` is every
 * state the host allows (a column, an insertion index, and the whole board after
 * the move), `landing()` is the one the pointer picks from the measured boxes,
 * and the keyboard walks the same list.
 *
 * **The model is the host's.** `columns` is read whenever the primitive needs it
 * (pass a getter when the board arrives later or changes) and the primitive
 * writes nothing back: `commit()` hands the host one `CardBoardState` and the
 * host decides what to do with the columns it contains. The card ids in the
 * columns are the identity; `cards` carries the names the live region and the
 * attributes use.
 *
 * **The landing is measured, once per gesture.** A press under `dragThreshold`
 * is a click; past it the primitive reads each `[data-column]` box and each
 * `[data-card]` box once, takes the pointer capture, and from then on answers
 * from that snapshot: the column whose x-range holds the pointer (else the
 * nearest centre), and the number of that column's other cards whose centre is
 * above it. A release over the channel between columns still lands; a release
 * outside the frame, on a column `canDrop` refuses, or after `pointercancel`
 * moves nothing, and the click the browser sends after a drag activates nothing.
 *
 * **No APG pattern exists for a card board**, so there is no Quint spec and no
 * ported scenarios: `test/cardboard.browser.test.tsx` is its oracle. The
 * keyboard path is a group of buttons, not a composite: every card is a tab
 * stop, Space lifts it, the arrows walk the declared states (left/right the
 * neighbouring column at that index, clamped; up/down an index in the column),
 * Enter drops it, Escape forgets it, and the polite live region says where it
 * would land.
 *
 * ponytail: one card at a time, no piles, no free placement, no multi-select and
 * no speculative rendering: the reachable states are data the host may draw, and
 * a pile or a freely placed card would need a state that is not (column, index).
 */

export interface CardBoardCard {
  readonly id: string;
  /** The card's accessible name, and the name the live region uses. */
  readonly label: string;
}

export interface CardBoardColumn {
  readonly id: string;
  /** The column's name, in the live region and in `aria-label`. */
  readonly label: string;
  /** The card ids in this column, in order. */
  readonly cards: ReadonlyArray<string>;
}

/** A future model state of the board: where the card would be, and the whole board after the move. */
export interface CardBoardState {
  readonly card: string;
  readonly column: string;
  readonly index: number;
  readonly columns: ReadonlyArray<CardBoardColumn>;
}

export interface CardBoardLabels {
  /** The board's name, prefixed to every announcement ("Sprint. Doing, position 2 of 4"). */
  readonly board?: string | undefined;
}

export interface CardBoardOptions {
  /** The cards the board knows, for names; a getter when the set changes. */
  readonly cards: ReadonlyArray<CardBoardCard> | (() => ReadonlyArray<CardBoardCard>);
  /** The columns, in the order the keyboard and the hit test walk them. */
  readonly columns: ReadonlyArray<CardBoardColumn> | (() => ReadonlyArray<CardBoardColumn>);
  /**
   * Whether a card may land in a column (default: all). Called once per column
   * whenever the declaration is read, so a board with a full column declares
   * fewer states rather than refusing a drop after the fact.
   */
  readonly canDrop?: ((card: string, column: string) => boolean) | undefined;
  /** The host's move: called by `commit()` with the state it accepted. */
  readonly onMove?: ((state: CardBoardState) => void) | undefined;
  /** Enter or a click on a card that is not being moved. */
  readonly onActivate?: ((card: string) => void) | undefined;
  /**
   * How far, in screen px, a press must travel before it is a drag rather than a
   * click. Default 4: the pointer machine's `DRAG_PX` (`pointer.qnt`).
   */
  readonly dragThreshold?: number | undefined;
  readonly labels?: CardBoardLabels | undefined;
  /** Base for the cards' element ids. Generated when absent. */
  readonly id?: string | undefined;
}

/** Spread onto the element that holds the columns: it is the frame the pointer is measured in. */
export interface CardBoardFrameProps {
  readonly "data-part": "board";
  readonly ref: (element: Element | undefined) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onLostPointerCapture: (event: PointerEvent) => void;
}

/** Spread onto the element that draws one column. */
export interface CardBoardColumnProps {
  readonly "data-part": "column";
  /** The column's id, for the hit test: the landing finds its column box by this attribute. */
  readonly "data-column": string;
  readonly role: "group";
  readonly "aria-label": string;
  /**
   * While a state is held: `source` (where the card is), `target` (where it would
   * land, when that is another column), `blocked` (`canDrop` refuses it, or it is
   * a column that is neither), absent when the column is reachable but unchosen.
   */
  readonly "data-drop-column"?: "source" | "target" | "blocked" | undefined;
}

/** Spread onto the element that draws one card; it is also the drag handle. */
export interface CardBoardCardProps {
  readonly "data-part": "card";
  /** The card's id, for the hit test. */
  readonly "data-card": string;
  readonly id: string;
  readonly role: "button";
  readonly "aria-roledescription": "card";
  readonly "aria-label": string;
  readonly tabindex: 0;
  /** While a state is held: the card being dropped. */
  readonly "data-drop-target"?: "true" | undefined;
  /** While a state is held: this card's index in the target column after the move. */
  readonly "data-drop-index"?: string | undefined;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
}

/** Spread onto the element that carries the announcement; render it once, always. */
export interface CardBoardStatusProps {
  readonly "data-part": "status";
  readonly role: "status";
  readonly "aria-live": "polite";
}

export interface CardBoard {
  readonly columns: Accessor<ReadonlyArray<CardBoardColumn>>;
  /**
   * The declared reachable states of one card: every column `canDrop` allows,
   * every insertion index in it, each with the board after the move. The state
   * at the card's own column and index is the no-move state.
   */
  readonly statesOf: (card: string) => ReadonlyArray<CardBoardState>;
  /** The state the pointer picks from the measured boxes; undefined before a drag starts and after it ends. */
  readonly landing: Accessor<CardBoardState | undefined>;
  /** The state the keyboard cursor is on; undefined when the keyboard walk is not running. */
  readonly chosen: Accessor<CardBoardState | undefined>;
  /** The state a drag or the keyboard holds: the landing while a pointer drags, else the cursor. */
  readonly held: Accessor<CardBoardState | undefined>;
  /** The card a pointer is dragging (past the threshold), or undefined. */
  readonly dragging: Accessor<string | undefined>;
  /**
   * Hand the held state to `onMove` and end the gesture. Returns whether it moved
   * anything: the no-move state, no held state and a refusal all commit nothing.
   */
  readonly commit: () => boolean;
  /** Drop the held state without moving anything. */
  readonly cancel: () => void;
  /** Start the keyboard walk on a card, at its own slot. A card the board does not hold is a no-op. */
  readonly startMove: (card: string) => void;
  /** What a polite live region says now; empty while nothing is held. */
  readonly status: Accessor<string>;
  readonly statusProps: CardBoardStatusProps;
  readonly boardProps: CardBoardFrameProps;
  readonly columnProps: (column: string) => CardBoardColumnProps;
  readonly cardProps: (card: string) => CardBoardCardProps;
}

type Direction = "up" | "down" | "left" | "right";

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface ColumnBox extends Box {
  readonly id: string;
}

interface CardBox extends Box {
  readonly id: string;
  readonly column: string;
}

interface Geometry {
  readonly frame: Box;
  readonly columns: ReadonlyArray<ColumnBox>;
  readonly cards: ReadonlyArray<CardBox>;
}

interface Cursor {
  readonly card: string;
  readonly column: string;
  readonly index: number;
}

const boxOf = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});

const centreX = (box: Box): number => (box.left + box.right) / 2;
const centreY = (box: Box): number => (box.top + box.bottom) / 2;

const arrowOf = (key: string): Direction | undefined => {
  if (key === "ArrowUp") {
    return "up";
  }
  if (key === "ArrowDown") {
    return "down";
  }
  if (key === "ArrowLeft") {
    return "left";
  }
  if (key === "ArrowRight") {
    return "right";
  }
  return undefined;
};

const isLift = (key: string): boolean => key === " " || key === "Spacebar";
const isDrop = (key: string): boolean => key === "Enter" || isLift(key);

const sameColumns = (
  a: ReadonlyArray<CardBoardColumn>,
  b: ReadonlyArray<CardBoardColumn>,
): boolean =>
  a.length === b.length &&
  a.every((column, at) => {
    const other = b[at];
    return (
      other !== undefined &&
      column.id === other.id &&
      column.cards.length === other.cards.length &&
      column.cards.every((card, index) => card === other.cards[index])
    );
  });

export const createCardBoard = (options: CardBoardOptions): CardBoard => {
  const base = options.id ?? createUniqueId();
  const threshold = options.dragThreshold ?? 4;
  const cardSource = (): ReadonlyArray<CardBoardCard> =>
    typeof options.cards === "function" ? options.cards() : options.cards;
  const columnSource = (): ReadonlyArray<CardBoardColumn> =>
    typeof options.columns === "function" ? options.columns() : options.columns;
  const allowed = (card: string, column: string): boolean =>
    options.canDrop?.(card, column) ?? true;
  const labelOf = (card: string): string =>
    cardSource().find((candidate) => candidate.id === card)?.label ?? card;

  const [version, setVersion] = createSignal(0);
  const bump = (): void => {
    setVersion((count) => count + 1);
  };

  let frame: Element | undefined;
  let press:
    | { readonly card: string; readonly x: number; readonly y: number; moved: boolean }
    | undefined;
  let dragged: string | undefined;
  let point: { readonly x: number; readonly y: number } | undefined;
  let geometry: Geometry | undefined;
  let cursor: Cursor | undefined;
  let suppressClick = false;

  const sourceOf = (card: string): CardBoardColumn | undefined =>
    columnSource().find((column) => column.cards.includes(card));

  const restOf = (column: CardBoardColumn, card: string): ReadonlyArray<string> =>
    column.cards.filter((id) => id !== card);

  const build = (
    card: string,
    columnId: string,
    index: number,
    columns: ReadonlyArray<CardBoardColumn>,
  ): CardBoardState => ({
    card,
    column: columnId,
    index,
    columns: columns.map((column) => {
      const rest = restOf(column, card);
      if (column.id !== columnId) {
        return rest.length === column.cards.length ? column : { ...column, cards: rest };
      }
      return {
        ...column,
        cards: [...rest.slice(0, index), card, ...rest.slice(index)],
      };
    }),
  });

  const statesOf = (card: string): ReadonlyArray<CardBoardState> => {
    const columns = columnSource();
    if (!columns.some((column) => column.cards.includes(card))) {
      return [];
    }
    const states: CardBoardState[] = [];
    for (const column of columns) {
      if (!allowed(card, column.id)) {
        continue;
      }
      const count = restOf(column, card).length;
      for (let index = 0; index <= count; index++) {
        states.push(build(card, column.id, index, columns));
      }
    }
    return states;
  };

  const measure = (): Geometry | undefined => {
    if (frame === undefined) {
      return undefined;
    }
    const columns: ColumnBox[] = [];
    const seen = new Set<string>();
    for (const element of frame.querySelectorAll("[data-column]")) {
      const id = element instanceof HTMLElement ? element.dataset["column"] : undefined;
      if (id === undefined || seen.has(id)) {
        continue;
      }
      seen.add(id);
      columns.push({ id, ...boxOf(element.getBoundingClientRect()) });
    }
    const cards: CardBox[] = [];
    for (const element of frame.querySelectorAll("[data-card]")) {
      const id = element instanceof HTMLElement ? element.dataset["card"] : undefined;
      const owner = element.closest("[data-column]");
      const column = owner instanceof HTMLElement ? owner.dataset["column"] : undefined;
      if (id === undefined || column === undefined) {
        continue;
      }
      cards.push({ id, column, ...boxOf(element.getBoundingClientRect()) });
    }
    return { frame: boxOf(frame.getBoundingClientRect()), columns, cards };
  };

  const pick = (
    card: string,
    x: number,
    y: number,
    measured: Geometry,
  ): CardBoardState | undefined => {
    const { frame: board, columns, cards } = measured;
    if (x < board.left || x > board.right || y < board.top || y > board.bottom) {
      return undefined;
    }
    let column: ColumnBox | undefined = columns.find(
      (candidate) => x >= candidate.left && x <= candidate.right,
    );
    if (column === undefined) {
      let best = Number.POSITIVE_INFINITY;
      for (const candidate of columns) {
        const distance = Math.abs(centreX(candidate) - x);
        if (distance < best) {
          best = distance;
          column = candidate;
        }
      }
    }
    if (column === undefined || !allowed(card, column.id)) {
      return undefined;
    }
    const target = columnSource().find((candidate) => candidate.id === column?.id);
    if (target === undefined) {
      return undefined;
    }
    const above = cards.filter(
      (box) => box.column === column?.id && box.id !== card && centreY(box) < y,
    ).length;
    const index = Math.min(above, restOf(target, card).length);
    return build(card, target.id, index, columnSource());
  };

  const landing = (): CardBoardState | undefined => {
    version();
    if (dragged === undefined || point === undefined || geometry === undefined) {
      return undefined;
    }
    return pick(dragged, point.x, point.y, geometry);
  };

  const chosen = (): CardBoardState | undefined => {
    version();
    const held = cursor;
    if (held === undefined) {
      return undefined;
    }
    return statesOf(held.card).find(
      (state) => state.column === held.column && state.index === held.index,
    );
  };

  const held = (): CardBoardState | undefined => landing() ?? chosen();

  const clear = (): void => {
    press = undefined;
    dragged = undefined;
    point = undefined;
    geometry = undefined;
    cursor = undefined;
  };

  const commit = (): boolean => {
    const state = held();
    const fromKeyboard = cursor !== undefined;
    clear();
    bump();
    if (state === undefined || sameColumns(state.columns, columnSource())) {
      return false;
    }
    options.onMove?.(state);
    if (fromKeyboard && typeof document !== "undefined") {
      onSettled(() => {
        document.getElementById(`${base}-card-${state.card}`)?.focus();
      });
    }
    return true;
  };

  const cancel = (): void => {
    clear();
    bump();
  };

  const startMove = (card: string): void => {
    const source = sourceOf(card);
    if (source === undefined) {
      return;
    }
    press = undefined;
    dragged = undefined;
    point = undefined;
    geometry = undefined;
    cursor = { card, column: source.id, index: source.cards.indexOf(card) };
    bump();
  };

  const walk = (direction: Direction): void => {
    const held = cursor;
    if (held === undefined) {
      return;
    }
    const states = statesOf(held.card);
    if (states.length === 0) {
      return;
    }
    if (direction === "left" || direction === "right") {
      const order = columnSource().map((column) => column.id);
      const step = direction === "right" ? 1 : -1;
      for (let at = order.indexOf(held.column) + step; at >= 0 && at < order.length; at += step) {
        const column = order[at];
        if (column === undefined) {
          continue;
        }
        const inColumn = states.filter((state) => state.column === column);
        if (inColumn.length > 0) {
          cursor = { card: held.card, column, index: Math.min(held.index, inColumn.length - 1) };
          bump();
          return;
        }
      }
      return;
    }
    const inColumn = states.filter((state) => state.column === held.column);
    const index = held.index + (direction === "down" ? 1 : -1);
    if (index >= 0 && index < inColumn.length) {
      cursor = { card: held.card, column: held.column, index };
      bump();
    }
  };

  const keyDown = (card: string, event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const held = cursor;
    if (held !== undefined && held.card === card) {
      const direction = arrowOf(event.key);
      if (direction !== undefined) {
        event.preventDefault();
        walk(direction);
        return;
      }
      if (isDrop(event.key)) {
        event.preventDefault();
        commit();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
      return;
    }
    if (isLift(event.key)) {
      event.preventDefault();
      startMove(card);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      options.onActivate?.(card);
    }
  };

  const pointerDown = (event: PointerEvent, card: string): void => {
    if (event.button !== 0 || cardSource().every((candidate) => candidate.id !== card)) {
      return;
    }
    if (cursor !== undefined) {
      cursor = undefined;
      bump();
    }
    press = { card, x: event.clientX, y: event.clientY, moved: false };
    suppressClick = false;
    try {
      if (event.currentTarget instanceof Element) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch {
      return;
    }
  };

  const pointerMove = (event: PointerEvent): void => {
    if (press === undefined) {
      return;
    }
    if (!press.moved) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < threshold) {
        return;
      }
      press.moved = true;
      dragged = press.card;
      geometry = measure();
    }
    point = { x: event.clientX, y: event.clientY };
    bump();
  };

  const endPress = (): boolean => {
    const moved = press?.moved === true;
    press = undefined;
    dragged = undefined;
    point = undefined;
    geometry = undefined;
    return moved;
  };

  const pointerUp = (event: PointerEvent): void => {
    if (press === undefined) {
      return;
    }
    if (!press.moved) {
      endPress();
      return;
    }
    point = { x: event.clientX, y: event.clientY };
    suppressClick = true;
    commit();
    endPress();
    bump();
  };

  const pointerCancel = (): void => {
    if (endPress()) {
      suppressClick = true;
    }
    cursor = undefined;
    bump();
  };

  const dropColumn = (columnId: string): "source" | "target" | "blocked" | undefined => {
    const state = held();
    if (state === undefined) {
      return undefined;
    }
    if (!allowed(state.card, columnId)) {
      return "blocked";
    }
    if (columnId === sourceOf(state.card)?.id) {
      return "source";
    }
    return columnId === state.column ? "target" : undefined;
  };

  const dropIndex = (card: string): string | undefined => {
    const state = held();
    if (state === undefined || card === state.card) {
      return undefined;
    }
    const column = state.columns.find((candidate) => candidate.cards.includes(card));
    if (column === undefined || column.id !== state.column) {
      return undefined;
    }
    return String(column.cards.indexOf(card));
  };

  const status = (): string => {
    const state = chosen();
    if (state === undefined) {
      return "";
    }
    const column = columnSource().find((candidate) => candidate.id === state.column);
    const count =
      state.columns.find((candidate) => candidate.id === state.column)?.cards.length ?? 0;
    const prefix = options.labels?.board === undefined ? "" : `${options.labels.board}. `;
    return `${prefix}${labelOf(state.card)} to ${column?.label ?? state.column}, position ${state.index + 1} of ${count}. Enter to drop, Escape to cancel.`;
  };

  return {
    columns: () => {
      version();
      return columnSource();
    },
    statesOf,
    landing,
    chosen,
    held,
    dragging: () => {
      version();
      return dragged;
    },
    commit,
    cancel,
    startMove,
    status: () => {
      version();
      return status();
    },
    statusProps: { "data-part": "status", role: "status", "aria-live": "polite" },
    boardProps: {
      "data-part": "board",
      ref: (element) => {
        frame = element ?? undefined;
      },
      onPointerMove: pointerMove,
      onPointerUp: pointerUp,
      onPointerCancel: pointerCancel,
      onLostPointerCapture: pointerCancel,
    },
    columnProps: (column) => ({
      "data-part": "column",
      "data-column": column,
      role: "group",
      get "aria-label"() {
        return columnSource().find((candidate) => candidate.id === column)?.label ?? column;
      },
      get "data-drop-column"() {
        return dropColumn(column);
      },
    }),
    cardProps: (card) => ({
      "data-part": "card",
      "data-card": card,
      id: `${base}-card-${card}`,
      role: "button",
      "aria-roledescription": "card",
      get "aria-label"() {
        return labelOf(card);
      },
      tabindex: 0,
      get "data-drop-target"() {
        return held()?.card === card ? ("true" as const) : undefined;
      },
      get "data-drop-index"() {
        return dropIndex(card);
      },
      onClick: () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        options.onActivate?.(card);
      },
      onKeyDown: (event) => keyDown(card, event),
      onPointerDown: (event) => pointerDown(event, card),
    }),
  };
};
