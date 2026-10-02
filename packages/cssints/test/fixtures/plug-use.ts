import { cn } from "cssints" with { type: "cssints" };

import { frame } from "cssints/frame" with { type: "cssints" };

import { lit, smoothing } from "./plug-kit" with { type: "cssints" };

export const a = smoothing("antialiased");
export const b = frame().radius("8px").padding(4);
export const c = cn(frame().radius("2px"), smoothing("none"));
export const d = lit().color("red");
