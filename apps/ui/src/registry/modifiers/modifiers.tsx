// A table a reader reshapes in place: every transformation stays on a rail as a unit — not a command whose result is all
// that is left — so the shape on screen can be explained, undone and extended. The rail is `createModifiers`'s: a toolbar
// of buttons, and the panel under it is the unit's own settings (the columns it spans, the column it takes as input, its
// place in the stack). The table reads what the stack owns: a tint, a bar, an order.
//
// The values never leave the cells. A cell that became a coloured bar is still the number as text, so a reader on a screen
// reader, or with the stylesheet off, gets the table it was before the rail touched it; the tint and the bar are decoration
// and say so (`aria-hidden`).
import {
  createModifiers,
  type Modifier,
  type ModifierAction,
  type ModifierEncoding,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createSignal, For, Show } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the figure, `data-part` and the caller's class merged in. */
export type ModifiersPartProps = PartProps;

/** A column of the table: its key in a row's cells, its label, and whether it is a number. */
export interface ModifiersColumn {
  readonly key: string;
  readonly label: string;
  readonly numeric?: boolean | undefined;
}

/** A row: an id the primitive and the story can name it by, and its cells. */
export interface ModifiersRow {
  readonly id: string;
  readonly cells: Readonly<Record<string, string | number>>;
}

export interface ModifiersProps extends Renderable<ModifiersPartProps, void> {
  readonly rows: ReadonlyArray<ModifiersRow>;
  /** The columns, in reading order; the first non-numeric one is the row header. */
  readonly columns: ReadonlyArray<ModifiersColumn>;
  /** The table's caption, which also names it. */
  readonly caption: string;
  readonly class?: string;
}

/**
 * The vocabulary this starter offers: one action per category the paper names — style (`Color`, `Size`) and layout
 * (`Sort`). Computation (aggregation, binning) is the half of MuTable a table of eight rows does not need.
 */
export const MODIFIER_ACTIONS: ReadonlyArray<ModifierAction> = [
  { kind: "color", label: "Color", encodings: ["color"] },
  { kind: "size", label: "Size", encodings: ["size"] },
  { kind: "sort", label: "Sort", encodings: ["order"] },
];

const actionOf = (kind: string): ModifierAction | undefined =>
  MODIFIER_ACTIONS.find((action) => action.kind === kind);

const labelOfPart = (part: { readonly kind: string }): string =>
  actionOf(part.kind)?.label ?? part.kind;

const figure = css.cn(css.display("grid"), css.gap(t.space._3), css.width("100%"), css.margin(0));

// The tools sit above the table they change: the add buttons, then the rail itself.
const tools = css.cn(
  css.display("flex"),
  css.gap(t.space._3),
  css.flexWrap("wrap"),
  css.alignItems("flex-start"),
);
const adds = css.cn(css.display("flex"), css.gap(t.space._2), css.flexWrap("wrap"));

// One button shape for the add buttons, the units and the panel's actions, since they are the same kind of control.
const control = css.cn(
  css.padding("2px 8px"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.cursor("pointer"),
  css.disabled(css.opacity(0.45), css.cursor("not-allowed")),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("1px")),
);

const add = css.cn(control);

// The rail: the stack, in order, above the table. Empty is a state worth saying, not a hole to leave.
const rail = css.cn(
  css.display("flex"),
  css.gap(t.space._2),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.minHeight(t.space._8),
  css.padding(t.space._1),
  css.border("1px dashed", t.color.border),
  css.borderRadius(t.radius.md),
);
const empty = css.cn(css.margin(0), css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const unit = css.cn(
  control,
  css.attr("aria-expanded", "true")(css.bg(t.color.highlight), css.color(t.color.onHighlight)),
);
const unitCount = css.cn(css.marginInlineStart(t.space._1), css.opacity(0.7));

// The panel is the unit's own settings: a disclosure's region, opened by the unit above it.
const panel = css.cn(
  css.display("grid"),
  css.gap(t.space._2),
  css.padding(t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.fontSize(t.font.sizeSm),
);
const panelTitle = css.cn(css.margin(0), css.fontWeight("600"));
const group = css.cn(
  css.display("flex"),
  css.gap(t.space._3),
  css.flexWrap("wrap"),
  css.margin(0),
  css.padding(0),
  css.border("none"),
);
const legend = css.cn(css.padding(0), css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const choice = css.cn(
  css.display("inline-flex"),
  css.gap(t.space._1),
  css.alignItems("center"),
  css.cursor("pointer"),
);
const panelActions = css.cn(css.display("flex"), css.gap(t.space._2), css.flexWrap("wrap"));

const table = css.cn(
  css.width("100%"),
  css.borderCollapse("collapse"),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);
const caption = css.cn(
  css.textAlign("start"),
  css.paddingBlock(t.space._2),
  css.color(t.color.muted),
  css.fontSize(t.font.sizeSm),
);
const headCell = css.cn(
  css.padding("4px 6px"),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.color(t.color.muted),
  css.borderBlockEnd("1px solid", t.color.border),
);
const rowHead = css.cn(
  css.padding("4px 6px"),
  css.fontWeight("500"),
  css.textAlign("start"),
  css.whiteSpace("nowrap"),
);

// A cell is a value first. The tint and the bar are layers over it, and the cell keeps the text where it was.
const cell = css.cn(
  css.position("relative"),
  css.padding("4px 6px"),
  css.textAlign("end"),
  css.fontVariantNumeric("tabular-nums"),
  css.borderBlockEnd("1px solid", t.color.border),
);
// The tint is the value's share of the column's scale, at the strength the bars use for a number that runs over them (a
// fifth of the highlight, not a solid): the cell's text sits on this wash, so the wash may not become a background.
const tinted = css.cn(
  css.bg("color-mix(in oklab, var(--color-highlight) calc(var(--share) * 22%), transparent)"),
);
// The bar is a rule under the number: a size encoding over a value that stays readable.
const bar = css.cn(
  css.position("absolute"),
  css.insetBlockEnd("0"),
  css.insetInlineStart("0"),
  css.height("3px"),
  css.bg(t.color.highlight),
  css.borderRadius("2px"),
);
const status = css.cn(
  css.margin(0),
  css.minHeight("1.25em"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

const numberCell = css.cn();

/**
 * A table under a rail of transformations: add `Color`, `Size` or `Sort`, drag the rail's units by their menu, span a
 * unit over more than one column, lock one column as the input, and join two units into a reusable sequence.
 *
 * The mechanic is `@cssints/headless`'s `createModifiers`; everything a reader can reach with a pointer is also a menu
 * item or a key there, and every change is announced in the status line under the table.
 */
export const Modifiers = (props: ModifiersProps): JSX.Element => {
  const panelId = "modifiers-panel";
  const numbers = props.columns.filter((column) => column.numeric === true);
  const [open, setOpen] = createSignal<string | undefined>(undefined);
  const modifiers = createModifiers({
    targets: numbers.map((column) => ({ key: column.key, label: column.label })),
    actions: MODIFIER_ACTIONS,
    onActivate: (id) => setOpen((current) => (current === id ? undefined : id)),
  });

  const labelOfKey = (key: string): string =>
    props.columns.find((column) => column.key === key)?.label ?? key;
  const numberOf = (row: ModifiersRow, key: string): number => {
    const value = row.cells[key];
    return typeof value === "number" ? value : Number(value ?? 0);
  };
  const rangeOf = (key: string): { readonly min: number; readonly max: number } => {
    const values = props.rows
      .map((row) => numberOf(row, key))
      .filter((value) => Number.isFinite(value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    // a flat column has no range to divide by; every share is then the same, full bar
    return { min: min === max ? min - 1 : min, max };
  };
  const shareOf = (key: string, value: number): number => {
    const range = rangeOf(key);
    const span = range.max - range.min;
    return span <= 0 ? 1 : Math.min(1, Math.max(0, (value - range.min) / span));
  };

  // The order encoding is the topmost unit that owns it: the stack's last `Sort`, over the first column it covers.
  const sortKey = (): string | undefined => {
    const steps = modifiers.steps();
    for (let index = steps.length - 1; index >= 0; index -= 1) {
      const step = steps[index];
      if (step === undefined) {
        continue;
      }
      const action = actionOf(step.kind);
      if (action !== undefined && action.encodings.includes("order") && step.targets.length > 0) {
        return step.targets[0];
      }
    }
    return undefined;
  };

  const rows = (): ReadonlyArray<ModifiersRow> => {
    const key = sortKey();
    const list = props.rows.slice();
    if (key === undefined) {
      return list;
    }
    // descending: a first look at a column asks "who is biggest", and a second `Sort` on another column answers again
    return list.sort((a, b) => numberOf(b, key) - numberOf(a, key));
  };

  const owners = (key: string): ReadonlyMap<ModifierEncoding, Modifier> => modifiers.encoded(key);
  const active = (): Modifier | undefined =>
    modifiers.modifiers().find((candidate) => candidate.id === open());

  const own = {
    "data-part": "modifiers",
    get class() {
      return css.cn(figure, props.class);
    },
  } as unknown as PartProps;

  return renderPart(props, own, undefined, (part) => (
    <figure {...part}>
      <div data-part="modifiers-tools" class={tools}>
        <div data-part="modifiers-add" class={adds} role="group" aria-label="Add a transformation">
          <For each={MODIFIER_ACTIONS}>
            {(action) => {
              const first = numbers[0]?.key;
              return (
                <button
                  type="button"
                  class={add}
                  disabled={first === undefined}
                  onClick={() => {
                    if (first === undefined) {
                      return;
                    }
                    const id = modifiers.add(action.kind, [first]);
                    if (id !== undefined) {
                      setOpen(id);
                    }
                  }}
                >
                  {`+ ${action.label}`}
                </button>
              );
            }}
          </For>
        </div>
        <div {...modifiers.toolbarProps} data-part="modifiers-rail" class={rail}>
          <For each={modifiers.modifiers()}>
            {(entry) => (
              <button
                {...modifiers.itemProps(entry.id)}
                type="button"
                data-part="modifiers-unit"
                class={unit}
                aria-expanded={open() === entry.id ? "true" : "false"}
                aria-controls={open() === entry.id ? panelId : undefined}
              >
                {entry.parts.map(labelOfPart).join(" + ")}
                <span class={unitCount} aria-hidden="true">
                  {entry.targets.length}
                </span>
              </button>
            )}
          </For>
          <Show when={modifiers.modifiers().length === 0}>
            <p data-part="modifiers-empty" class={empty}>
              No transformations yet: the table is the data, as it came.
            </p>
          </Show>
        </div>
      </div>

      <Show when={active()}>
        {(entry) => {
          const id = (): string => entry().id;
          const index = (): number =>
            modifiers.modifiers().findIndex((candidate) => candidate.id === id());
          const locked = (): number | null => entry().locked ?? null;
          return (
            <div
              data-part="modifiers-panel"
              class={panel}
              id={panelId}
              role="group"
              aria-labelledby={`${panelId}-title`}
            >
              <p class={panelTitle} id={`${panelId}-title`}>
                {modifiers.nameOf(id())}
              </p>
              <fieldset class={group}>
                <legend class={legend}>Applies to</legend>
                <For each={modifiers.targets}>
                  {(target) => (
                    <label class={choice}>
                      <input
                        type="checkbox"
                        checked={entry().targets.includes(target.key)}
                        onChange={() => modifiers.toggleTarget(id(), target.key)}
                      />
                      {target.label}
                    </label>
                  )}
                </For>
              </fieldset>
              <fieldset class={group}>
                <legend class={legend}>Uses as input</legend>
                <label class={choice}>
                  <input
                    type="radio"
                    name={`${panelId}-lock`}
                    checked={locked() === null}
                    onChange={() => modifiers.lock(id(), null)}
                  />
                  None
                </label>
                <For each={entry().targets}>
                  {(key, slot) => (
                    <label class={choice}>
                      <input
                        type="radio"
                        name={`${panelId}-lock`}
                        checked={locked() === slot()}
                        onChange={() => modifiers.lock(id(), slot())}
                      />
                      {labelOfKey(key)}
                    </label>
                  )}
                </For>
              </fieldset>
              <div class={panelActions} role="group" aria-label="Change the stack">
                <button
                  type="button"
                  class={control}
                  disabled={index() === 0}
                  onClick={() => modifiers.joinWithAbove(id())}
                >
                  Join with above
                </button>
                <button
                  type="button"
                  class={control}
                  disabled={entry().parts.length < 2}
                  onClick={() => modifiers.split(id())}
                >
                  Split
                </button>
                <button
                  type="button"
                  class={control}
                  disabled={index() === 0}
                  onClick={() => modifiers.move(id(), -1)}
                >
                  Move up
                </button>
                <button
                  type="button"
                  class={control}
                  disabled={index() === modifiers.modifiers().length - 1}
                  onClick={() => modifiers.move(id(), 1)}
                >
                  Move down
                </button>
                <button
                  type="button"
                  class={control}
                  onClick={() => {
                    modifiers.remove(id());
                    setOpen(undefined);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        }}
      </Show>

      <table data-part="modifiers-table" class={table}>
        <caption class={caption}>{props.caption}</caption>
        <thead>
          <tr>
            {/* the corner is the grid's first cell, not a header: it names nothing */}
            <td aria-hidden="true" class={headCell} />
            <For each={numbers}>
              {(column) => (
                <th scope="col" class={css.cn(headCell, css.textAlign("end"))}>
                  {column.label}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={rows()}>
            {(row) => (
              <tr data-part="modifiers-row" data-row={row.id}>
                <For each={props.columns.filter((column) => column.numeric !== true)}>
                  {(column) => (
                    <th scope="row" class={rowHead}>
                      {row.cells[column.key]}
                    </th>
                  )}
                </For>
                <For each={numbers}>
                  {(column) => {
                    const value = (): number => numberOf(row, column.key);
                    return (
                      <td
                        data-part="modifiers-cell"
                        class={owners(column.key).has("color") ? css.cn(cell, tinted) : cell}
                        style={{ "--share": shareOf(column.key, value()) } as never}
                      >
                        <span class={numberCell}>{row.cells[column.key]}</span>
                        <Show when={owners(column.key).has("size")}>
                          <span
                            data-part="modifiers-bar"
                            aria-hidden="true"
                            class={bar}
                            style={{ width: `${Math.round(shareOf(column.key, value()) * 100)}%` }}
                          />
                        </Show>
                      </td>
                    );
                  }}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <p {...modifiers.status.statusProps} data-part="modifiers-status" class={status}>
        {modifiers.status.message() ?? ""}
      </p>
    </figure>
  ));
};
