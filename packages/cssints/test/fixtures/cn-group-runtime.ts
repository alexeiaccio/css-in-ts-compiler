import { cn, p } from "cssints/widely-available" with { type: "cssints" };
import * as css from "cssints/widely-available" with { type: "cssints" };

export const a = (on: boolean, props: { class?: string }) => cn(p(2), on && p(4), props.class);
export const b = (on: boolean) => css.cn(css.display("grid"), on && css.padding(1));
