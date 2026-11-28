import { type CardBoardColumn, type CardBoardState, createCardBoard } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, Show, createSignal } from "solid-js";

import { Badge } from "../badge/badge.tsx";
import { Button } from "../button/button.tsx";
import { Card } from "../card/card.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** One card: its name, the line under it and the label it carries. */
export interface KanbanCard {
  readonly id: string;
  readonly label: string;
  readonly note?: string | undefined;
  readonly tag?: string | undefined;
}

export interface KanbanProps {
  /** The cards the board can show, by id. */
  readonly cards: ReadonlyArray<KanbanCard>;
  /**
   * The columns and the cards they start with. Read once: the board owns the model from then on, and `onMove` says
   * where it went. A page that needs to drive the columns itself keeps them in its own signal and passes `onMove`.
   */
  readonly columns: ReadonlyArray<CardBoardColumn>;
  /** The board's name: the frame's label and the live region's prefix. @default "Sprint board" */
  readonly label?: string | undefined;
  /** The line under the board, which is also its keyboard instructions. */
  readonly hint?: string | undefined;
  /** The move the board accepted, with the whole model after it. */
  readonly onMove?: ((state: CardBoardState) => void) | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_LABEL = "Sprint board";
const DEFAULT_HINT =
  "Drag a card to another column, or focus a card and press Space to lift it, the arrows to move it, Enter to drop it and Escape to leave it where it was.";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._3), css.minWidth("0"));

const headClass = css.cn(
  css.display("flex"),
  css.alignItems("baseline"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

const titleClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeLg), css.fontWeight("600"));

const totalClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
);

const boardClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("repeat(auto-fit, minmax(14rem, 1fr))"),
  css.gap(t.space._3),
  css.alignItems("start"),
  css.minWidth("0"),
);

const columnClass = css.cn(
  css.display("grid"),
  css.minWidth("0"),
  css.outline("2px dashed", "transparent"),
  css.outlineOffset(t.space._1),
  css.attr("data-drop-column", "target")(css.outline("2px dashed", t.color.highlight)),
  css.attr("data-drop-column", "blocked")(css.opacity("0.5")),
  css.media("(prefers-reduced-motion: no-preference)")(css.transition("opacity 120ms ease-out")),
);

const columnCardClass = css.cn(css.minHeight(t.space._10), css.gap(t.space._3));

const columnHeadClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

const columnTitleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.size),
  css.fontWeight("600"),
  css.whiteSpace("nowrap"),
);

const columnBodyClass = css.cn(
  css.display("grid"),
  css.gap(t.space._2),
  css.minHeight(t.space._10),
);

const cardClass = css.cn(
  css.display("grid"),
  css.gap(t.space._1),
  css.padding(t.space._3),
  css.boxSizing("border-box"),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.cursor("grab"),
  css.userSelect("none"),
  css.touchAction("none"),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.hover(css.borderColor(t.color.borderHover)),
  css.attr("data-drop-target", "true")(
    css.cursor("grabbing"),
    css.borderColor(t.color.highlight),
    css.boxShadow(t.shadow.popover),
  ),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("border-color 120ms ease-out, box-shadow 120ms ease-out"),
  ),
);

const cardLabelClass = css.cn(css.fontWeight("500"));

const cardNoteClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

const cardBadgeClass = css.cn(css.marginTop(t.space._1), css.width("max-content"));

const footClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

const statusClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
);

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/**
 * A kanban board on `createCardBoard`: three columns of cards, a pointer drag that reads the measured boxes, and the
 * same movement on the keyboard — Space lifts a card, the arrows walk the declared states, Enter drops it, Escape
 * leaves it. The skin owns the surface, the borders, the target and refused columns, the lifted card, the status line
 * and `onMove`; the primitive owns which states are reachable, where the pointer lands and the announcement.
 *
 * The card elements are keyed by column, so a card that changes column is a new element in the DOM: its move is a
 * jump, not the FLIP animation `reorder` plays. A shared card layer would be the way to animate across columns, and
 * the primitive's `data-drop-*` attributes are what it would need — see `docs/wayfinder.md`, 2026-11-28.
 */
export const Kanban = (props: KanbanProps): JSX.Element => {
  const label = props.label ?? DEFAULT_LABEL;
  const [columns, setColumns] = createSignal(props.columns);
  const byId = new Map(props.cards.map((card) => [card.id, card]));

  const board = createCardBoard({
    cards: props.cards,
    columns: () => columns(),
    labels: { board: label },
    onMove: (state) => {
      setColumns(state.columns);
      props.onMove?.(state);
    },
  });

  const cardsOf = (column: string): ReadonlyArray<string> =>
    columns().find((candidate) => candidate.id === column)?.cards ?? [];

  const total = (): number => columns().reduce((count, column) => count + column.cards.length, 0);

  const reset = (): void => {
    board.cancel();
    setColumns(props.columns);
  };

  return (
    <div data-part="kanban" class={css.cn(rootClass, props.class)}>
      <div class={headClass}>
        <h2 class={titleClass}>{label}</h2>
        <span class={totalClass}>{total()} cards</span>
      </div>
      <div {...board.boardProps} class={boardClass} aria-label={label}>
        <For each={props.columns}>
          {(meta) => (
            <div {...board.columnProps(meta.id)} class={columnClass}>
              <Card class={columnCardClass}>
                <div class={columnHeadClass}>
                  <h3 class={columnTitleClass}>{meta.label}</h3>
                  <Badge tone="quiet">{cardsOf(meta.id).length}</Badge>
                </div>
                <div class={columnBodyClass}>
                  <For each={cardsOf(meta.id)}>
                    {(id) => {
                      const card = byId.get(id);
                      return (
                        <Show when={card}>
                          {(entry) => (
                            <div {...board.cardProps(id)} class={cardClass}>
                              <span data-part="kanban-card-label" class={cardLabelClass}>
                                {entry().label}
                              </span>
                              <Show when={entry().note}>
                                {(note) => <span class={cardNoteClass}>{note()}</span>}
                              </Show>
                              <Show when={entry().tag}>
                                {(tag) => (
                                  <Badge class={cardBadgeClass} tone="neutral">
                                    {tag()}
                                  </Badge>
                                )}
                              </Show>
                            </div>
                          )}
                        </Show>
                      );
                    }}
                  </For>
                </div>
              </Card>
            </div>
          )}
        </For>
      </div>
      <div class={footClass}>
        <p {...board.statusProps} class={statusClass}>
          {board.status()}
        </p>
        <Button size="sm" tone="quiet" onClick={reset}>
          Reset
        </Button>
      </div>
      <p class={hintClass}>{props.hint ?? DEFAULT_HINT}</p>
    </div>
  );
};
