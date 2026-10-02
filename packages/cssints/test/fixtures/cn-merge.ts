import { borderColor, borderInlineStartColor, cn, hover, media, p, pl, wordWrap, overflowWrap } from "cssints" with { type: "cssints" };

// the same property again: the later one stays
export const again = cn(p(4), p(2));
// under another condition both stay: they are in other layers
export const layered = cn(media("(width >= 40rem)")(p(6)), p(2));
// nested cn() is one cn()
export const nested = cn(cn(p(4), pl(1)), p(2));
// a longhand inside a shorthand stays, the sheet orders it after
export const contained = cn(borderColor("red"), borderInlineStartColor("blue"));
// an alias is the same property
export const alias = cn(wordWrap("break-word"), overflowWrap("anywhere"));
// the same inside one condition
export const hovered = hover(p(4), p(2));
