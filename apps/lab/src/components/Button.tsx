import { createButton } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

export interface ButtonProps {
  readonly tone?: "primary" | "quiet";
  readonly size?: "sm" | "md";
  /** A toggle button: it carries aria-pressed, and the pressed tone replaces the given one. */
  readonly isToggle?: boolean;
  readonly disabled?: boolean;
  readonly children?: JSX.Element;
}

// One cv() for every button: a variant wins over the base, and the devtools panel names which class won.
const button = css.cv({
  base: css.cn(
    css.display("inline-flex"),
    css.alignItems("center"),
    css.justifyContent("center"),
    css.gap(2),
    css.border("1px solid", "transparent"),
    css.borderRadius(t.radius.md),
    css.fontSize(t.fontSize.md),
    css.fontWeight("600"),
    css.cursor("pointer"),
    css.transition("background-color 150ms, border-color 150ms"),
    css.attr("aria-disabled", "true")(css.opacity(0.45), css.cursor("not-allowed")),
  ),
  variants: {
    tone: {
      primary: css.cn(css.bg(t.color.accent), css.color(t.color.onAccent)),
      quiet: css.cn(
        css.bg(t.color.bg),
        css.color(t.color.text),
        css.border("1px solid", t.color.border),
        css.hover(css.border("1px solid", t.color.accent)),
      ),
      pressed: css.cn(css.bg(t.color.accentSoft), css.color(t.color.text)),
    },
    size: {
      sm: css.cn(css.padding("6px 10px"), css.fontSize(t.fontSize.sm)),
      md: css.padding("10px 16px"),
    },
  },
  defaultVariants: { tone: "primary", size: "md" },
});

// The styled button of the lab: `createButton` under `cv()` variants. The pressed state is the widget's, not a prop.
export function Button(props: ButtonProps) {
  const control = createButton({
    get isToggle() {
      return props.isToggle ?? false;
    },
    get disabled() {
      return props.disabled ?? false;
    },
  });

  const tone = () => {
    if (!props.isToggle) {
      return props.tone ?? "primary";
    }
    return control.pressed() ? "pressed" : (props.tone ?? "quiet");
  };

  return (
    <button {...control.buttonProps} class={button({ tone: tone(), size: props.size ?? "md" })}>
      {props.children}
    </button>
  );
}
