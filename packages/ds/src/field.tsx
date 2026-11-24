import { createField } from "@cssints/headless";
import * as css from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

export interface FieldProps {
  readonly label: string;
  readonly value?: string;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly class?: string;
  readonly onInput?: (value: string) => void;
}

const field = css.cn(css.display("grid"), css.gap(t.space.sm));
const label = css.cn(css.fontSize(t.font.sizeSm), css.fontWeight("500"), css.color(t.color.text));
const control = css.cn(
  css.boxSizing("border-box"),
  css.width("100%"),
  css.padding(t.space.md, t.space.lg),
  css.border("1px solid", t.color.line),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-invalid", "true")(css.border("1px solid", t.color.danger)),
);
const message = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const problem = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.danger));

/**
 * A labelled text field on `@cssints/headless`: the label, the control, the hint and the error are one field — the ids, the
 * `aria-describedby` chain and `aria-invalid` are the primitive's, so a message is read with its control and never orphaned.
 * Both message elements are always rendered, and the primitive hides the empty one.
 */
export const Field = (props: FieldProps) => {
  const api = createField({
    get required() {
      return props.required;
    },
    get invalid() {
      return props.invalid;
    },
    get hint() {
      return props.hint;
    },
    get error() {
      return props.error;
    },
  });
  return (
    <div class={css.cn(field, props.class)}>
      <label {...api.labelProps} class={label}>
        {props.label}
      </label>
      <input
        {...api.controlProps}
        class={control}
        type="text"
        value={props.value ?? ""}
        placeholder={props.placeholder}
        onInput={(event) => props.onInput?.(event.currentTarget.value)}
      />
      <p {...api.hintProps} class={message}>
        {props.hint}
      </p>
      <p {...api.errorProps} class={problem}>
        {props.error}
      </p>
    </div>
  );
};
