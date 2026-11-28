import type { CardBoardColumn, CardBoardState } from "@cssints/headless";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Kanban, type KanbanCard } from "./kanban.tsx";

/** The six things a sprint board is doing, and the columns they start in. */
export const KANBAN_CARDS: ReadonlyArray<KanbanCard> = [
  {
    id: "spec",
    label: "Write the spec",
    note: "One paragraph, no code",
    tag: "Writing",
  },
  {
    id: "api",
    label: "Shape the API",
    note: "Names before bodies",
    tag: "Design",
  },
  {
    id: "empty",
    label: "Empty states",
    note: "What a column says with no cards",
    tag: "Design",
  },
  {
    id: "drag",
    label: "Drag a card",
    note: "The measured boxes, once per gesture",
    tag: "Build",
  },
  {
    id: "keys",
    label: "Space, arrows, Enter",
    note: "The same states on the keyboard",
    tag: "Build",
  },
  {
    id: "release",
    label: "Ship 0.49",
    note: "The changeset is written",
    tag: "Ops",
  },
];

export const KANBAN_COLUMNS: ReadonlyArray<CardBoardColumn> = [
  { id: "todo", label: "Todo", cards: ["spec", "api", "empty"] },
  { id: "doing", label: "Doing", cards: ["drag", "keys"] },
  { id: "done", label: "Done", cards: ["release"] },
];

/** The board's name: its frame's label and the prefix of every announcement. */
export const KANBAN_LABEL = "Sprint board";

/** The one sentence the demo says about the drag and the keys. */
export const KANBAN_HINT =
  "Drag a card to another column, or focus a card and press Space to lift it, the arrows to move it, Enter to drop it and Escape to leave it.";

/** A second, smaller board: the same primitive in two columns rather than three. */
export const PAIR_CARDS: ReadonlyArray<KanbanCard> = [
  { id: "paper", label: "Read the paper", note: "Declarative dragging", tag: "Read" },
  { id: "note", label: "Take notes", note: "The states, not the geometry", tag: "Read" },
  { id: "plan", label: "Write the plan", note: "One commit", tag: "Write" },
];

export const PAIR_COLUMNS: ReadonlyArray<CardBoardColumn> = [
  { id: "backlog", label: "Backlog", cards: ["paper", "note"] },
  { id: "shipped", label: "Shipped", cards: ["plan"] },
];

export interface KanbanExampleProps {
  readonly class?: string | undefined;
  readonly onMove?: ((state: CardBoardState) => void) | undefined;
}

/** The starter in ordinary use: a sprint board, its six cards and the three columns they start in. */
export const KanbanExample = (props: KanbanExampleProps): JSX.Element => (
  <Kanban
    class={props.class}
    cards={KANBAN_CARDS}
    columns={KANBAN_COLUMNS}
    label={KANBAN_LABEL}
    hint={KANBAN_HINT}
    onMove={props.onMove}
  />
);

/** What a mounted demo hands the test: where it lives, the models a page would have heard, and a teardown. */
export interface MountedKanban {
  readonly root: HTMLElement;
  /** Every `onMove` the host received, oldest first. */
  readonly calls: () => ReadonlyArray<CardBoardState>;
  readonly dispose: () => void;
}

/** Mounts the styled board at the demo's width. The primitive owns the model inside; the host only hears the moves. */
export const mountKanban = (): MountedKanban => {
  const root = document.createElement("div");
  root.style.width = "56rem";
  document.body.append(root);
  const calls: CardBoardState[] = [];
  const dispose = render(
    () => (
      <KanbanExample
        onMove={(state) => {
          calls.push(state);
        }}
      />
    ),
    root,
  );
  return {
    root,
    calls: () => calls,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
