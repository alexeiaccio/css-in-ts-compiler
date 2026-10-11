import { cn, paddingInline, paddingLeft } from "cssints" with { type: "cssints" };

export const a = (on: boolean) => cn(paddingInline(1), on && paddingLeft(2));
