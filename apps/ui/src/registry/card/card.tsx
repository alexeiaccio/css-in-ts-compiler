import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the element, `data-part` and the caller's class merged in. */
export interface CardPartProps extends PartProps, Renderable<CardPartProps, void> {}

export interface CardProps extends CardPartProps {
  readonly children?: JSX.Element;
}

// A card is a surface one step off the page and a frame that hands its inner radius down: a card inside a card is concentric
// with no prop, and the colours of everything inside follow the mode the card sits in.
const card = css.cn(
  frame().radius(t.radius.xl).padding(t.space._3).border("1px"),
  surface().color(t.color.surface),
  css.borderColor(t.color.border),
  css.color(t.color.text),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space._3),
);

const header = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

const body = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const footer = css.cn(
  css.display("flex"),
  css.justifyContent("flex-end"),
  css.gap(t.space._2),
  css.paddingTop(t.space._3),
  css.borderTop("1px solid", t.color.border),
);

/**
 * A card: `surface()` for its colour and `frame()` for its radius, padding and border, with the parts below. The theme is the
 * context — a card in `data-mode="dark"` is dark without a prop, and a card in a card is concentric with it.
 */
export const Card = (props: CardProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "card",
      get class() {
        return css.cn(card, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The top row of a card: a title on one side, an action on the other. */
export const CardHeader = (props: CardPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "card-header",
      get class() {
        return css.cn(header, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The content of a card. */
export const CardBody = (props: CardPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "card-body",
      get class() {
        return css.cn(body, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The bottom row of a card: its actions, above a rule. */
export const CardFooter = (props: CardPartProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "card-footer",
      get class() {
        return css.cn(footer, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );
