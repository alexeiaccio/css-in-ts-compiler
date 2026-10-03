import * as css from "cssints" with { type: "cssints" };

const current = css.attr("aria-current", "page");
const [md] = css.media("(width >= 40rem)", "(width >= 60rem)");

export const row = css.cn(css.group(), css.p(2));
export const outer = css.group("outer");
export const link = css.cn(
  css.color("gray"),
  css.hover(css.color("black")),
  current(css.color("blue")),
  css.within(css.hover)(css.color("red")),
  css.within(css.focusVisible, "outer")(css.color("green")),
  md(css.within(css.hover)(css.textDecoration("underline"))),
);
export const ops = css.cn(
  css.attr("disabled")(css.opacity(0.5)),
  css.attr("data-x", 'a"b\\c')(css.opacity(0.6)),
  css.attr("lang", "en", "|=")(css.opacity(0.7)),
  css.attr("class", "x", "~=")(css.opacity(0.8)),
  css.attr("href", "https", "^=")(css.opacity(0.9)),
  css.attr("href", ".pdf", "$=")(css.opacity(0.1)),
  css.attr("href", "ex", "*=")(css.opacity(0.2)),
);
