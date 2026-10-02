import { cn, hover, media } from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

export const a = surface().color("#2b3a67").lighten(0.06).ink();
export const b = surface().darken(0.1);
export const c = surface().contrast(0.15);
export const d = cn(surface().lighten(0.02), hover(surface().lighten(0.06)));
export const e = cn(surface().color("oklch(from #123 l c h)"), media("(width >= 40rem)")(surface().darken(0.05)));
