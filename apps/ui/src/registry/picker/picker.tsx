// A native <select> whose options carry what a person decides with — a time, a price, a department, a badge, a typeface —
// instead of one line of text. It is the browser's own control (`appearance: base-select`), so the keyboard, type-to-jump,
// the form value, `required` and the role stay where they belong, and a browser without customizable select draws an
// ordinary select whose option text still reads as a sentence.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createUniqueId, For, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface PickerOption {
  readonly value: string;
  /** The name column. It is also the whole option in a browser without customizable select, so it has to stand alone. */
  readonly label: string;
  /** The fact the choice turns on: a time, a price, a title and department. */
  readonly detail?: string | undefined;
  /** A third column, for what needs saying: "needs approval", a currency, a weight. */
  readonly note?: string | undefined;
  /** An inline style for the label alone: the font-preview case, where the option is set in its own typeface. */
  readonly style?: Readonly<Record<string, string>> | undefined;
  readonly disabled?: boolean | undefined;
}

export interface PickerProps {
  /** The field's name, which is also the select's accessible name. */
  readonly label: string;
  /** The form field's name, when the select is in a form. */
  readonly name?: string | undefined;
  readonly options: ReadonlyArray<PickerOption>;
  /** Controlled: the chosen value. Leave it out and the select owns it. */
  readonly value?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  /** The option grid's columns (default `1fr auto auto`): wide enough for the widest detail and note in the list. */
  readonly columns?: string | undefined;
  readonly class?: string | undefined;
}

/** True where the browser draws a customizable select: the rich layout is only worth having where it is understood. */
const CUSTOM = "(appearance: base-select)";
/** And only with a precise pointer: a touch device keeps the operating system's own picker, which is the better control. */
const FINE = "(hover: hover) and (pointer: fine)";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

const labelClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.color(t.color.text),
);

// The closed control. `appearance: auto` is the native select everywhere; the rich half is the two conditions below, so a
// browser without either keeps the platform's control and the option text alone.
const selectClass = css.cn(
  css.appearance("auto"),
  css.width("100%"),
  css.font("inherit"),
  css.color(t.color.text),
  css.media(FINE)(
    css.supports(CUSTOM)(
      css.appearance("base-select"),
      css.boxSizing("border-box"),
      css.bg(t.color.surface),
      css.border("1px solid", t.color.border),
      css.borderRadius(t.radius.md),
      css.padding("0", t.space._3),
      css.cursor("pointer"),
      css.fontSize(t.font.size),
      css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
      // the arrow is the UA's ::picker-icon; it takes the muted colour and turns over when the list is open
      css.pickerIcon(css.color(t.color.muted), css.transition("rotate 120ms")),
      css.open(css.pickerIcon(css.rotate("180deg"))),
      // the list itself: the UA places it; the skin paints it
      css.picker(
        css.bg(t.color.surface),
        css.border("1px solid", t.color.border),
        css.borderRadius(t.radius.md),
        css.padding(t.space._1),
        css.boxShadow("0 8px 24px rgb(0 0 0 / 0.18)"),
      ),
    ),
  ),
);

// The button the browser puts inside the control ("selectedcontent"), so the closed form shows the same row the list does.
const buttonClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.width("100%"),
  css.padding(t.space._2, "0"),
  css.bg("transparent"),
  css.border("none"),
  css.color("inherit"),
  css.font("inherit"),
  css.textAlign("start"),
  css.cursor("pointer"),
);

// One option: the article's grid — a name that takes what is left, then the facts in columns, so a comparison is a glance
// down one column and not a sentence to hold in the head.
const optionClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("var(--picker-columns, 1fr auto auto)"),
  css.alignItems("center"),
  css.gap(t.space._3),
  css.padding(t.space._2),
  css.borderRadius(t.radius.sm),
  css.checked(css.fontWeight("600")),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled)),
);

const nameClass = css.cn(css.color(t.color.text), css.overflowWrap("anywhere"));

const detailClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.whiteSpace("nowrap"),
);

// A note is a badge, and only the options that carry one: the list says which choices need attention before the value moves.
const noteClass = css.cn(
  css.justifySelf("end"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
  css.whiteSpace("nowrap"),
);

const badgeClass = css.cn(
  css.padding("0.125rem", t.space._2),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
  css.color(t.color.text),
);

// Between the columns in the plain control: a comma keeps the option a sentence where the spans are flattened to text, and
// the rich layout hides it.
const separatorClass = css.cn(css.supports(CUSTOM)(css.display("none")));

/**
 * A native `<select>` with rich options.
 *
 * `appearance: base-select` makes the options part of the page, so each one can hold a grid: the name, the fact it turns on
 * and a note. The control is still the platform's — arrows, type-to-jump, Escape, the form value and the accessible name are
 * the browser's — and where the platform does not draw a customizable select (or the pointer is coarse) the same markup is
 * an ordinary select whose options are their text, which is why the separator spans exist.
 */
export const Picker = (props: PickerProps): JSX.Element => {
  const id = createUniqueId();
  // A controlled value is written to the control after its options exist: a `value` bound while the list is still being
  // built lands on an empty select and is dropped (Chrome resets it to no selection), so the write is an effect and the
  // uncontrolled case never writes at all (the browser starts on the first option).
  let element: HTMLSelectElement | undefined;
  createEffect(
    () => props.value,
    (next) => {
      if (next !== undefined && element !== undefined && element.value !== next) {
        element.value = next;
      }
    },
  );

  return (
    <div data-part="picker" class={css.cn(rootClass, props.class)}>
      <label class={labelClass} for={id}>
        {props.label}
      </label>
      <select
        id={id}
        name={props.name}
        ref={(select) => {
          element = select;
        }}
        class={selectClass}
        style={{ "--picker-columns": props.columns ?? "1fr auto auto" }}
        onChange={(event) => props.onValueChange?.(event.currentTarget.value)}
      >
        <button type="button" class={buttonClass}>
          <selectedcontent />
        </button>
        <For each={props.options}>
          {(option) => (
            <option value={option.value} disabled={option.disabled} class={optionClass}>
              <span class={nameClass} style={option.style}>
                {option.label}
              </span>
              <Show when={option.detail}>
                {(detail) => (
                  <>
                    <span class={separatorClass} aria-hidden="true">
                      ,{" "}
                    </span>
                    <span class={detailClass}>{detail()}</span>
                  </>
                )}
              </Show>
              <Show when={option.note}>
                {(note) => (
                  <>
                    <span class={separatorClass} aria-hidden="true">
                      ,{" "}
                    </span>
                    <span class={`${badgeClass} ${noteClass}`}>{note()}</span>
                  </>
                )}
              </Show>
            </option>
          )}
        </For>
      </select>
    </div>
  );
};
