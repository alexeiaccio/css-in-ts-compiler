// The overlay's own styles, on cssints: built ahead with the package (vite.config.ts), into a sheet of its own that sits in
// the overlay's shadow root. No tokens: `@property` is ignored inside a shadow root, so the colours are constants.
import {
  bg,
  border,
  borderBottom,
  borderColor,
  borderLeft,
  borderRadius,
  borderTop,
  bottom,
  boxSizing,
  cn,
  color,
  cursor,
  display,
  flex,
  flexGrow,
  font,
  fontFamily,
  fontSize,
  fontWeight,
  global,
  grid,
  hover,
  left,
  letterSpacing,
  lineHeight,
  margin,
  maxHeight,
  marginBlock,
  marginBottom,
  marginInlineEnd,
  opacity,
  outline,
  overflow,
  overflowWrap,
  p,
  padding,
  paddingBlock,
  paddingInline,
  paddingInlineStart,
  pointerEvents,
  position,
  right,
  textAlign,
  textDecoration,
  textTransform,
  top,
  whiteSpace,
  width,
  zIndex,
} from "cssints" with { type: "cssints" };

const ink = "#e5e7eb";
const dim = "#9ca3af";
const line = "#374151";
const panelBg = "#111827";
const accent = "#60a5fa";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

global("*", boxSizing("border-box"));

export const fab = cn(
  position("fixed"),
  right("12px"),
  bottom("12px"),
  zIndex(2147483647),
  p(2),
  borderRadius("999px"),
  border("1px solid", line),
  bg(panelBg),
  color(ink),
  fontFamily(mono),
  fontSize("11px"),
  cursor("pointer"),
  opacity(0.75),
  hover(opacity(1)),
);

export const highlight = cn(
  position("fixed"),
  zIndex(2147483646),
  pointerEvents("none"),
  outline("2px solid", accent),
  bg("rgb(96 165 250 / 0.12)"),
);

export const tag = cn(
  position("absolute"),
  top("-20px"),
  left("0"),
  paddingInline("4px"),
  bg(accent),
  color("#0b1220"),
  fontFamily(mono),
  fontSize("11px"),
  whiteSpace("nowrap"),
);

export const panel = cn(
  position("fixed"),
  top("0"),
  right("0"),
  bottom("0"),
  width("min(440px, 100vw)"),
  zIndex(2147483647),
  overflow("auto"),
  bg(panelBg),
  color(ink),
  borderLeft("1px solid", line),
  fontFamily("system-ui, sans-serif"),
  fontSize("12px"),
  lineHeight("1.45"),
);

export const bar = cn(
  flex().alignItems("center").gap(2),
  position("sticky"),
  top("0"),
  p(2),
  bg(panelBg),
  borderBottom("1px solid", line),
);

export const title = cn(flexGrow(1), fontFamily(mono), fontWeight("600"));

export const button = cn(
  paddingInline("6px"),
  paddingBlock("2px"),
  border("1px solid", line),
  borderRadius("4px"),
  bg("transparent"),
  color(ink),
  font("inherit"),
  cursor("pointer"),
  hover(borderColor(accent)),
);
export const pressed = cn(bg(accent), color("#0b1220"));

export const section = cn(p(2), borderBottom("1px solid", line));
export const heading = cn(
  marginBlock("0 6px"),
  fontSize("11px"),
  textTransform("uppercase"),
  letterSpacing("0.06em"),
  color(dim),
);

export const site = cn(
  display("block"),
  marginBottom("2px"),
  padding("0"),
  border("none"),
  bg("transparent"),
  color(accent),
  fontFamily(mono),
  fontSize("11px"),
  cursor("pointer"),
  textAlign("start"),
  hover(textDecoration("underline")),
);

export const code = cn(fontFamily(mono), fontSize("11px"), overflowWrap("anywhere"));
export const callText = cn(
  code,
  margin("0 0 4px"),
  p(1),
  maxHeight("120px"),
  overflow("auto"),
  bg("#0b1220"),
  // pre, not pre-wrap: a long line wrapped after its indent read as a blank line and a dedent
  whiteSpace("pre"),
);

export const siteText = cn(
  display("block"),
  marginBottom("2px"),
  color(accent),
  fontFamily(mono),
  fontSize("11px"),
);

export const classRow = cn(
  grid().templateColumns("auto 1fr auto").gap(2),
  paddingBlock("1px"),
  fontFamily(mono),
  fontSize("11px"),
);
export const off = opacity(0.5);
export const muted = color(dim);

export const chip = cn(
  display("inline-block"),
  marginInlineEnd("4px"),
  paddingInline("4px"),
  borderRadius("3px"),
  border("1px solid", line),
  fontFamily(mono),
  fontSize("10px"),
);
export const holds = cn(borderColor("#16a34a"), color("#86efac"));

export const prop = cn(paddingBlock("4px"), borderTop("1px solid", "#1f2937"));
export const propHead = cn(flex().alignItems("baseline").gap(2), fontFamily(mono));
export const propName = cn(color("#f9a8d4"), fontSize("11px"));
export const value = cn(flexGrow(1), fontSize("11px"), overflowWrap("anywhere"));
export const struck = cn(textDecoration("line-through"), color(dim));
export const sub = cn(paddingInlineStart("12px"), fontFamily(mono), fontSize("11px"));
export const ok = color("#86efac");
export const bad = color("#fca5a5");
export const unsure = color("#fcd34d");
export const reason = cn(paddingInlineStart("12px"), color("#fca5a5"), fontSize("11px"));
export const hint = cn(p(2), color(dim));

export const ask = cn(
  position("sticky"),
  bottom("0"),
  p(2),
  bg(panelBg),
  borderTop("1px solid", line),
);
export const askInput = cn(
  display("block"),
  width("100%"),
  p(1),
  border("1px solid", line),
  borderRadius("4px"),
  bg("#0b1220"),
  color(ink),
  font("inherit"),
);
