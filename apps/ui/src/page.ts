import {
  borderColor,
  color,
  cn,
  display,
  fontSize,
  minHeight,
  padding,
  placeItems,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { reset } from "@cssints/reset" with { type: "cssints" };

import { t } from "./registry/theme.ts" with { type: "cssints" };

// The page the starters are written against: a card, a row inside it, and the styled switch.
// The card and the row are frames — the card names the only radius and the row inherits the
// inner one — and each level is the surface above it, lightened or darkened, so no element
// names a colour twice.
//
// The reset (border-box, no margins) goes below every style of the sheet.
reset();

// Classes live in this module, not in the page's TSX: cssints evaluates a module that calls it
// at build time, and a module that reaches JSX cannot be evaluated there.
export const page = cn(
  display("grid"),
  placeItems("center"),
  minHeight("100dvh"),
  padding(t.space._8),
  surface().color(t.color.page),
);

export const card = cn(
  display("grid"),
  frame().radius(t.radius.xl).padding(2).border("1px"),
  surface().lighten(0.05),
  borderColor(t.color.border),
);

export const row = cn(
  display("grid"),
  frame().padding(2),
  surface().darken(0.04),
  fontSize(t.font.size),
  color(t.color.text),
);
