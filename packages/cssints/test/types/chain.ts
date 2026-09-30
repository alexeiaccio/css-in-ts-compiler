// What user code sees of flex(), grid() and cv(): `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import { cx, _cv } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { cn, cv, flex, fontSize, grid, hover, maxWidth, p } from "cssints" with { type: "cssints" };
import type { Style } from "cssints";

// Chain methods are their properties (flex-direction, gap, ...), and every step is still a class string.
export const row: Style = flex()
  .direction("column")
  .wrap("wrap")
  .alignItems("center")
  .justifyContent("space-between");
export const spaced: Style = css.flex().gap(4).rowGap("1rem").columnGap(0);
export const cols: Style = grid()
  .templateColumns("1fr 2fr")
  .gap(4)
  .autoFlow("row dense")
  .placeItems("center");
export const areas: Style = css.grid().templateAreas('"a b" "c d"').justifyItems("start");
export const merged: string = cx(
  row,
  cols,
  css.cn(flex().gap(2), p(1)),
  hover(flex().direction("row")),
);

// @ts-expect-error a keyword that is not in flex-direction
flex().direction("sideways");
// @ts-expect-error align-items takes no numbers
flex().alignItems(1);
// @ts-expect-error a flex container has no padding
flex().padding("1rem");
// @ts-expect-error item properties are plain functions
flex().flexGrow(1);
// @ts-expect-error grid properties do not chain on flex()
flex().templateColumns("1fr");
// @ts-expect-error flex properties do not chain on grid()
grid().direction("row");
// @ts-expect-error plain styles do not chain
p(1).gap(2);
// @ts-expect-error a method takes a value
grid().gap();

// With parts, flex() and grid() are the shorthand properties: a plain style, checked by the grammar.
export const item: Style = flex("1");
export const item2: Style = css.flex(1);
export const item3: Style = flex("1 1 0");
export const template: Style = grid("auto / 1fr 1fr");
export const both: Style = cn(flex("none"), flex().gap(2));
// @ts-expect-error flex() with parts is a plain style: it does not chain
flex("1").gap(2);
// @ts-expect-error not a flex value
flex("sideways");
// @ts-expect-error a number is a <number>, not a length
flex("1 1 2");
// @ts-expect-error not a grid value
grid("sideways");

// cv takes styles, not CSS strings.
export const button = cv({
  base: cn(p(2), fontSize("1rem")),
  variants: {
    size: { sm: p(1), lg: cn(p(4), fontSize("1.25rem")) },
    wide: { yes: maxWidth("100%"), no: flex().gap(1) },
  },
  defaultVariants: { size: "sm" },
});
export const className: string = _cv(button)({ size: "lg" });

// @ts-expect-error a CSS string is no style
cv({ base: "padding: 1rem" });
// @ts-expect-error a class name is no style
cv({ variants: { size: { sm: "_abc" } } });
// @ts-expect-error a variant is a style, not a list
cv({ variants: { size: { sm: [p(1)] } } });
// @ts-expect-error cx gives a runtime string, not a build-time style
cv({ base: cx(p(1)) });
// @ts-expect-error a default is a name
cv({ defaultVariants: { size: 1 } });
