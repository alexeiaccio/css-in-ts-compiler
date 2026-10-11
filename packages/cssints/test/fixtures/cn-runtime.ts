import { bg, cn, hover, media, p, pl, pt } from "cssints" with { type: "cssints" };

const md = media("(width >= 40rem)");

// a runtime part replaces the static classes it overrides while it is active; a class string is only appended
export const a = (on: boolean, props: { class?: string }) =>
  cn(p(2), bg("red"), on && p(4), props.class);
// a longhand after the shorthand replaces nothing; a conditional shorthand replaces the earlier longhand
export const b = (on: boolean) => cn(pl(1), pt(1), on ? p(3) : bg("blue"));
// the same property under another condition is another class: nothing is dropped
export const c = (on: boolean, hot: boolean) =>
  cn(p(2), hover(p(3)), md(p(5)), on && hover(p(4)), hot && md(p(6)));
// later static arguments win over earlier runtime ones; a literal string is a runtime value too
export const d = (on: boolean) => cn(on && p(4), p(2), "legacy");
// a runtime-only call and an array of parts
export const e = (props: { class?: string }, on: boolean) => cn(props.class, [on && p(1), "x"]);
// spread build-time lists merge with the rest
const list = [p(1), bg("blue")];
export const f = (on: boolean) => cn(...list, on && p(3));
