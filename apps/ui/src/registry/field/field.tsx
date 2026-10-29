import { createField, type Field as FieldController } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, omit, useContext } from "solid-js";

import { Input } from "../input/input.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What a control's `render` sees: the field's state, so a custom control can paint itself. */
export interface FieldState {
  readonly invalid: () => boolean;
}

export interface FieldProps {
  /** The base of every id the field makes (`<id>-control`, `-label`, `-hint`, `-error`). */
  readonly id?: string;
  readonly required?: boolean;
  /** `true` marks the control invalid, a string is the error message; left out, the field is invalid exactly when `error` is set. */
  readonly invalid?: boolean | string;
  readonly hint?: string;
  readonly error?: string;
  /** Ids the host owns, appended to `aria-describedby` after the field's own. */
  readonly describedby?: string | readonly string[];
  readonly class?: string;
  readonly children?: JSX.Element;
}

export type FieldLabelPartProps = PartProps;

export interface FieldLabelProps extends Renderable<FieldLabelPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** What a control's `render` gets: the props the field owns, and the caller's own. Generic element attributes, since a
 * control is an `Input`, a `Button` or a widget of the host's. */
export type FieldControlPartProps = PartProps;

export interface FieldControlProps
  extends
    Omit<JSX.HTMLAttributes<HTMLElement>, "class" | "ref">,
    Renderable<FieldControlPartProps, FieldState> {
  readonly class?: string;
}

export type FieldMessagePartProps = PartProps;

export interface FieldMessageProps extends Renderable<FieldMessagePartProps, void> {
  readonly class?: string;
}

const FieldContext = createContext<{ readonly field: FieldController }>();

const fieldClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._1));
const labelClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.color(t.color.text),
);
const hintClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const errorClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.invalid));

/**
 * A form field: `createField` owns the ids, `aria-describedby` and `aria-invalid`, and the parts read them from the context —
 * `Field.Message` goes anywhere inside, and `Field.Control` renders the `Input` or whatever `render` gives it. The control
 * part owns `id` and the ARIA attributes; the caller owns everything else.
 */
export const Field = (props: FieldProps): JSX.Element => {
  const field = createField({
    get id() {
      return props.id;
    },
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
    get describedby() {
      return props.describedby;
    },
  });
  return (
    <FieldContext value={{ field }}>
      <div data-part="field" class={css.cn(fieldClass, props.class)}>
        {props.children}
      </div>
    </FieldContext>
  );
};

/** The label: the field's `for` and id, so the control gets its name without one. */
export const FieldLabel = (props: FieldLabelProps): JSX.Element => {
  const { field } = useContext(FieldContext);
  const rest = omit(props, "render", "class", "children");
  const merged = merge(rest, field.labelProps, () => ({
    "data-part": "label",
    class: css.cn(labelClass, props.class),
  }));
  return renderPart(props, merged, undefined, (part) => <label {...part}>{props.children}</label>);
};

/** The control: `id`, `aria-describedby`, `aria-invalid` and `required` from the field, an `Input` by default. */
export const FieldControl = (props: FieldControlProps): JSX.Element => {
  const { field } = useContext(FieldContext);
  const rest = omit(props, "render", "class");
  // the field owns the ids and the ARIA state, the caller the rest: a caller's `aria-invalid` cannot contradict the field
  const merged = merge(rest, field.controlProps, () => ({ class: props.class }));
  return renderPart(props, merged, { invalid: field.invalid }, (part) => <Input {...part} />);
};

/** The hint and the error, always rendered and hidden when absent, so `aria-describedby` never names a missing id. */
export const FieldMessage = (props: FieldMessageProps): JSX.Element => {
  const { field } = useContext(FieldContext);
  return renderPart(
    props,
    { "data-part": "message", class: css.cn(hintClass, props.class) },
    undefined,
    () => (
      <>
        <p {...field.hintProps} data-part="hint" class={hintClass}>
          {field.hint()}
        </p>
        <p {...field.errorProps} data-part="error" class={errorClass}>
          {field.error()}
        </p>
      </>
    ),
  );
};
