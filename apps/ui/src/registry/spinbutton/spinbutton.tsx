import {
  type Spinbutton as SpinbuttonController,
  type SpinbuttonOptions,
  createSpinbutton,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, omit, untrack } from "solid-js";

import { type PartProps, type Render, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the field's props, its class merged with the caller's, and `data-part`. */
export type SpinbuttonPartProps = PartProps;

export interface SpinbuttonProps
  extends
    Omit<SpinbuttonOptions, "id" | "value">,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      | "class"
      | "value"
      | "defaultValue"
      | "min"
      | "max"
      | "step"
      | "disabled"
      | "onInput"
      | "onKeyDown"
      | "onFocus"
      | "onBlur"
    >,
    Renderable<SpinbuttonPartProps, void> {
  /** `true` at a bound: the primitive announces it and the kit paints and disables the stepper. */
  readonly value?: number | undefined;
  readonly onValueChange?: (value: number) => void;
  /** The field: `render` replaces the `<input>`, with the primitive's ids, ARIA and handlers on it. */
  readonly renderIncrement?: Render<PartProps, void>;
  readonly renderDecrement?: Render<PartProps, void>;
  readonly class?: string;
  /** The primitive, once: a page that drives the number from elsewhere. */
  readonly onReady?: (spinbutton: SpinbuttonController) => void;
}

// The field and the two steppers are one line: the field keeps the text look of an `Input`, the steppers are a column on
// its end. The primitive owns the value, the bounds, the draft, the keys and the two button labels; it announces a bound by
// `aria-disabled` on the stepper, and only then is the native `disabled` set and the look painted.
const group = css.cn(
  css.display("inline-flex"),
  css.alignItems("stretch"),
  css.width("max-content"),
);

const field = css.cn(
  css.boxSizing("border-box"),
  css.display("block"),
  css.width("6rem"),
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderStartStartRadius(t.radius.md),
  css.borderEndStartRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.textAlign("center"),
  css.hover(css.border("1px solid", t.color.borderHover)),
  css.focusVisible(
    css.outline("2px solid", t.color.focusRing),
    css.outlineOffset("2px"),
    css.border("1px solid", t.color.focusRing),
  ),
  css.attr("aria-invalid", "true")(
    css.border("1px solid", t.color.invalid),
    css.outline("2px solid", t.color.invalid),
  ),
);

const steppers = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.marginInlineStart("-1px"),
);

const stepper = css.cn(
  css.boxSizing("border-box"),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width("1.75rem"),
  css.flex("1"),
  css.padding("0"),
  css.border("1px solid", t.color.border),
  css.bg(t.color.buttonBackground),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.lineHeight("1"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackgroundPressed), css.border("1px solid", t.color.borderHover)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-disabled", "true")(
    css.bg(t.color.page),
    css.color(t.color.textDisabled),
    css.border("1px solid", t.color.borderDisabled),
    css.cursor("not-allowed"),
  ),
);

const incrementClass = css.cn(stepper, css.borderStartEndRadius(t.radius.md));

const decrementClass = css.cn(
  stepper,
  css.borderEndEndRadius(t.radius.md),
  css.marginBlockStart("-1px"),
);

/**
 * APG spinbutton, styled: a text field with `role="spinbutton"` and a stepper at its end. `createSpinbutton` owns the value,
 * the bounds, the stepped keys (arrows, Page Up/Down, Home/End), the typed draft that commits on Enter or blur and reverts
 * on Escape, and the two steppers' labels; at a bound it announces `aria-disabled` on the stepper, and the kit sets the
 * native `disabled` from that announced state and paints it.
 *
 * `id` is the field's (`Field.Control` hands the one its label points at), so `Field` names the input without a second
 * prop; the field's `aria-invalid` joins the primitive's draft-invalid instead of replacing it. The primitive has no
 * `disabled`: a host disables the control by not rendering it.
 */
export const Spinbutton = (props: SpinbuttonProps): JSX.Element => {
  const spinbutton = createSpinbutton({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    get largeStep() {
      return props.largeStep;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get wrap() {
      return props.wrap;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(spinbutton);

  const rest = omit(
    props,
    "min",
    "max",
    "step",
    "largeStep",
    "value",
    "defaultValue",
    "wrap",
    "onValueChange",
    "onReady",
    "class",
    "render",
    "renderIncrement",
    "renderDecrement",
  );

  const fieldPart = merge(spinbutton.inputProps, rest, {
    "data-part": "spinbutton-input",
    get class() {
      return css.cn(field, props.class);
    },
    // the field's invalid state is a second reason, never a replacement: a draft out of range is invalid too
    get "aria-invalid"() {
      const announced = spinbutton.inputProps["aria-invalid"];
      const fieldInvalid = props["aria-invalid"];
      return announced === "true" || fieldInvalid === "true" ? "true" : undefined;
    },
  });

  const incrementPart = merge(spinbutton.incrementProps, {
    "data-part": "spinbutton-increment",
    class: incrementClass,
    get disabled() {
      return spinbutton.incrementProps["aria-disabled"] === "true";
    },
  });

  const decrementPart = merge(spinbutton.decrementProps, {
    "data-part": "spinbutton-decrement",
    class: decrementClass,
    get disabled() {
      return spinbutton.decrementProps["aria-disabled"] === "true";
    },
  });

  return (
    <div data-part="spinbutton" class={group}>
      {renderPart(props, fieldPart, undefined, (part) => (
        <input {...part} />
      ))}
      <div data-part="spinbutton-steppers" class={steppers}>
        {renderPart({ render: props.renderIncrement }, incrementPart, undefined, (part) => (
          <button type="button" {...part}>
            +
          </button>
        ))}
        {renderPart({ render: props.renderDecrement }, decrementPart, undefined, (part) => (
          <button type="button" {...part}>
            −
          </button>
        ))}
      </div>
    </div>
  );
};
