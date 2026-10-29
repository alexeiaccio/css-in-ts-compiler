import {
  type Button as ButtonController,
  type ButtonOptions,
  createButton,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, omit, untrack } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** The button's state, as accessors: `render` can branch on `pressed()` without a re-render. */
export interface ButtonState {
  readonly pressed: () => boolean;
  readonly disabled: () => boolean;
}

/** What `render` gets: the button's props, its class merged with the caller's, and `data-part`. */
export type ButtonPartProps = PartProps;

export interface ButtonProps
  extends
    Omit<ButtonOptions, "id" | "onClick">,
    Omit<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      "type" | "children" | "class" | "onClick" | "disabled" | "value"
    >,
    Renderable<ButtonPartProps, ButtonState> {
  /** `neutral` is the default look, `accent` the highlighted one, `quiet` a button with no fill. */
  readonly tone?: "neutral" | "accent" | "quiet";
  readonly size?: "sm" | "md";
  readonly class?: string;
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (button: ButtonController) => void;
  /** The activation happened (Enter, Space or pointer). */
  readonly onClick?: () => void;
}

// One cv() for every button. The states are the widget's, read off the attrs it announces — never a second copy of the
// pressed state — and an ancestor with `data-size="sm"` shrinks the button without a prop: a toolbar is the context.
const button = css.cv({
  base: css.cn(
    css.boxSizing("border-box"),
    css.display("inline-flex"),
    css.alignItems("center"),
    css.justifyContent("center"),
    css.gap(t.space._2),
    css.width("max-content"),
    css.border("1px solid", "transparent"),
    css.borderRadius(t.radius.md),
    css.fontSize(t.font.size),
    css.fontWeight("500"),
    css.cursor("pointer"),
    css.transition("background-color 120ms, border-color 120ms"),
    css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
    css.attr("aria-pressed", "true")(
      css.bg(t.color.highlight),
      css.color(t.color.onHighlight),
      css.border("1px solid", t.color.highlight),
      css.hover(
        css.bg(t.color.highlightPressed),
        css.border("1px solid", t.color.highlightPressed),
      ),
    ),
    css.attr("aria-disabled", "true")(
      css.color(t.color.textDisabled),
      css.border("1px solid", t.color.borderDisabled),
      css.cursor("not-allowed"),
    ),
    // The container is the context: a compact toolbar sizes what it holds, and its rule sorts after a size variant.
    css.within(css.attr("data-size", "sm"))(
      css.padding(t.space._1, t.space._2),
      css.fontSize(t.font.sizeSm),
    ),
  ),
  variants: {
    tone: {
      neutral: css.cn(
        css.bg(t.color.buttonBackground),
        css.color(t.color.text),
        css.border("1px solid", t.color.border),
        css.hover(
          css.bg(t.color.buttonBackgroundPressed),
          css.border("1px solid", t.color.borderHover),
        ),
      ),
      accent: css.cn(
        css.bg(t.color.highlight),
        css.color(t.color.onHighlight),
        css.border("1px solid", t.color.highlight),
        css.hover(
          css.bg(t.color.highlightPressed),
          css.border("1px solid", t.color.highlightPressed),
        ),
      ),
      quiet: css.cn(
        css.bg("transparent"),
        css.color(t.color.text),
        css.border("1px solid", "transparent"),
        css.hover(css.bg(t.color.buttonBackground)),
      ),
    },
    size: {
      sm: css.cn(css.padding(t.space._1, t.space._2), css.fontSize(t.font.sizeSm)),
      md: css.cn(css.padding(t.space._2, t.space._4), css.fontSize(t.font.size)),
    },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

/**
 * APG button, styled: a command button, and a toggle button with `isToggle`. `tone` and `size` are the look; `render`
 * replaces the `<button>` with another component or tag (`<a>` for a link that acts as a button). A pressed toggle, a
 * disabled button and the compact size are read off `aria-pressed`, `aria-disabled` and an ancestor's `data-size`.
 */
export const Button = (props: ButtonProps): JSX.Element => {
  const buttonControl = createButton({
    get isToggle() {
      return props.isToggle;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get disabled() {
      return props.disabled;
    },
    get onClick() {
      return props.onClick;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  // a structural prop, read once: it is the primitive for a fixture, not a signal
  untrack(() => props.onReady)?.(buttonControl);

  const rest = omit(
    props,
    "render",
    "tone",
    "size",
    "class",
    "children",
    "onReady",
    "isToggle",
    "value",
    "defaultValue",
    "disabled",
    "onClick",
    "onValueChange",
  );
  const merged = merge(buttonControl.buttonProps, rest, () => ({
    "data-part": "button",
    class: css.cn(button({ tone: props.tone, size: props.size }), props.class),
  }));
  const state: ButtonState = {
    pressed: buttonControl.pressed,
    disabled: () => props.disabled === true,
  };
  return renderPart(props, merged, state, (part) => <button {...part}>{props.children}</button>);
};
