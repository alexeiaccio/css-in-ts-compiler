import { cn, color, width } from "cssints" with { type: "cssints" };

import { mix, quad } from "./plug-kit" with { type: "cssints" };

export const a = color(mix("red", "blue"));
export const b = width(quad(2));
export const c = mix("red", "white");
export const d = cn(color(mix("red", "black")), width(quad(1)));
