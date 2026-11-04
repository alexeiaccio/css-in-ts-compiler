import * as css from "cssints" with { type: "cssints" };

// A pseudo-element on its own: the rule is the class with `::before`.
export const bullet = css.cn(css.before(css.content("\"•\""), css.color("#333"), css.mr(2)));

// A state outside it: `.k:hover::before`.
export const hovered = css.cn(css.hover(css.before(css.content("\"\""), css.bg("#eee"))));

// An attribute state outside it too, then the one that comes with an argument.
export const invalid = css.cn(
  css.attr("aria-invalid", "true")(css.after(css.content("\"!\""), css.color("#b00"))),
);

// The ones every form and every selection wants.
export const field = css.cn(css.placeholder(css.color("#888")), css.selection(css.bg("#ff0")));

// An at-rule wraps the whole rule, so it sits outside the element and either order of the two is the same chain.
export const wide = css.cn(css.media("(width >= 40rem)")(css.before(css.content("\"\""), css.display("block"))));

export const marker = css.cn(css.markerElement(css.color("#999")));
