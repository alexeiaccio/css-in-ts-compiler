import { type Alert as AlertController, createAlert } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, untrack } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the live region, `data-part` and the caller's class merged in. */
export interface AlertPartProps extends PartProps, Renderable<AlertPartProps, void> {}

export interface AlertProps extends AlertPartProps {
  /** What the live region announces, read once at mount: a page mounts the alert when it has something to say. */
  readonly message?: string;
  /** `neutral` is the default look, `invalid` the one an error takes. */
  readonly tone?: "neutral" | "invalid";
  readonly onDismiss?: () => void;
  readonly children?: JSX.Element;
  /** The primitive, once: a page that shows a later message calls its `show()`. */
  readonly onReady?: (alert: AlertController) => void;
}

// A message is a surface one step off the page, with a rule of its tone on the left. The region is the root, and it is live
// only while `createAlert` says it is: `role`, `aria-atomic` and `hidden` come from the primitive, never from a prop here.
const alert = css.cv({
  base: css.cn(
    css.group("alert"),
    css.boxSizing("border-box"),
    css.display("flex"),
    css.flexDirection("column"),
    css.gap(t.space._1),
    css.padding(t.space._3),
    css.border("1px solid", "transparent"),
    css.borderInlineStartWidth(t.space._1),
    css.borderRadius(t.radius.lg),
    css.fontSize(t.font.size),
    css.color(t.color.text),
  ),
  variants: {
    tone: {
      neutral: css.cn(css.bg(t.color.buttonBackground), css.borderColor(t.color.border)),
      invalid: css.cn(css.bg(t.color.surface), css.borderColor(t.color.invalid)),
    },
  },
  defaultVariants: { tone: "neutral" },
});

const titleClass = css.cn(
  css.fontWeight("500"),
  css.within(css.attr("data-tone", "invalid"), "alert")(css.color(t.color.invalid)),
);

const bodyClass = css.cn(css.color(t.color.muted), css.lineHeight(1.5));

/**
 * APG alert: a message in a live region (`role="alert"`, `aria-atomic`) that `createAlert` mounts and hides. The tone paints
 * the rule and the title; a reader hears the message either way.
 */
export const Alert = (props: AlertProps): JSX.Element => {
  const controller = createAlert({
    message: props.message,
    get onDismiss() {
      return props.onDismiss;
    },
  });
  untrack(() => props.onReady)?.(controller);
  const own = {
    "data-part": "alert",
    "data-tone": props.tone ?? "neutral",
    get class() {
      return css.cn(alert({ tone: props.tone }), props.class);
    },
  } as PartProps;
  return renderPart(props, merge(controller.alertProps, own), undefined, (part) => (
    <div {...part}>{props.children ?? controller.message()}</div>
  ));
};

/** The alert's title: a line above the body. */
export const AlertTitle = (props: AlertPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "alert-title",
      get class() {
        return css.cn(titleClass, props.class);
      },
    },
    undefined,
    (part) => <p {...part}>{props.children}</p>,
  );

/** The alert's body: the sentence that says what happened. */
export const AlertBody = (props: AlertPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "alert-body",
      get class() {
        return css.cn(bodyClass, props.class);
      },
    },
    undefined,
    (part) => <p {...part}>{props.children}</p>,
  );
