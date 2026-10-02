import { all, border, borderBlock, borderBlockStart, borderInline, borderInlineColor, borderInlineStart, borderInlineStartColor, borderTopWidth, cn, color, font, fontSize, fontVariant, fontVariantCaps, p } from "cssints" with { type: "cssints" };

// the cases the mdn-data leaf counts got wrong (docs/research/sublayers.md): each pair is a shorthand, then a longhand
// it contains, written in the order that used to lose
export const c1 = cn(borderInlineStart("1px solid red"), borderInline("2px dashed blue"));
export const c2 = cn(borderBlockStart("1px solid red"), borderBlock("2px dashed blue"));
export const c3 = cn(borderInlineStartColor("red"), borderInlineColor("blue"));
export const c4 = cn(fontVariantCaps("small-caps"), fontVariant("normal"));
export const c5 = cn(fontVariantCaps("small-caps"), font("16px serif"));
export const c6 = cn(p(4), all("initial"));
export const c7 = cn(color("red"), all("initial"));
export const c8 = cn(border("1px solid red"), all("initial"));
export const c9 = cn(borderTopWidth("3px"), all("initial"));
export const c10 = cn(fontSize("2rem"), all("initial"));
