import { type Button as ButtonController, createButton } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { untrack } from "solid-js";

import { t } from "./theme.ts" with { type: "cssints" };

export interface ButtonProps {
  readonly tone?: "neutral" | "accent" | "quiet";
  readonly size?: "sm" | "md";
  readonly isToggle?: boolean;
  readonly value?: boolean | undefined;
  readonly defaultValue?: boolean;
  readonly disabled?: boolean;
  readonly class?: string;
  readonly children?: JSX.Element;
  readonly onClick?: () => void;
  readonly onValueChange?: (pressed: boolean) => void;
  /** The primitive, once: a story that asserts the pressed state needs it; a page rarely does. */
  readonly onReady?: (button: ButtonController) => void;
}

const button = css.cv({
  base: css.cn(
    css.boxSizing("border-box"),
    css.display("inline-flex"),
    css.alignItems("center"),
    css.justifyContent("center"),
    css.gap(t.space.sm),
    css.width("max-content"),
    css.border("1px solid", "transparent"),
    css.borderRadius(t.radius.md),
    css.fontSize(t.font.size),
    css.lineHeight(t.line.height),
    css.fontWeight("500"),
    css.cursor("pointer"),
    css.transition("background-color 120ms, border-color 120ms"),
    css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
    css.attr("aria-pressed", "true")(
      css.bg(t.color.accent),
      css.color(t.color.onAccent),
      css.border("1px solid", t.color.accent),
    ),
    css.attr("aria-disabled", "true")(css.cursor("not-allowed"), css.opacity("0.6")),
  ),
  variants: {
    tone: {
      neutral: css.cn(
        css.bg(t.color.surface),
        css.color(t.color.text),
        css.border("1px solid", t.color.line),
      ),
      accent: css.cn(
        css.bg(t.color.accent),
        css.color(t.color.onAccent),
        css.border("1px solid", t.color.accent),
      ),
      quiet: css.cn(css.bg("transparent"), css.color(t.color.text)),
    },
    size: {
      sm: css.cn(css.padding(t.space.sm, t.space.md), css.fontSize(t.font.sizeSm)),
      md: css.cn(css.padding(t.space.md, t.space.lg), css.fontSize(t.font.size)),
    },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

/**
 * APG button on `@cssints/headless`: a command button, and a toggle button with `isToggle`. `tone` and `size` are the look;
 * the pressed and disabled states are the primitive's, not props of this component.
 *
 * @param {ButtonProps} props the tone, the size, the toggle flag and the handlers
 * @returns {JSX.Element} the button
 */
export const Button = (props: ButtonProps) => {
  const api = createButton({
    isToggle: props.isToggle ?? false,
    value: props.value,
    defaultValue: props.defaultValue ?? false,
    disabled: props.disabled ?? false,
    onClick: () => props.onClick?.(),
    onValueChange: (pressed: boolean) => props.onValueChange?.(pressed),
  });
  untrack(() => props.onReady)?.(api);
  return (
    <button
      {...api.buttonProps}
      class={css.cn(button({ tone: props.tone, size: props.size }), props.class)}
    >
      {props.children}
    </button>
  );
};
