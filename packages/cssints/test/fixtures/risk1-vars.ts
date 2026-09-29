import { alignItems, cn, flex, justifyContent } from "cssints" with { type: "cssints" };

const center = alignItems("center");
const between = justifyContent("space-between");

export const b = cn(flex(), center);
export const c = cn(flex(), center, between);
