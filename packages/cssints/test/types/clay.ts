// What the types of cssints/clay accept and reject (`@ts-expect-error` marks what must fail).
import * as css from "cssints/clay";

export const ok = css.cn(
  css.width(200),
  css.height("50%"),
  css.width("stretch"),
  css.p(4, "8px"),
  css.bg("oklch(0.7 0.15 50)"),
  css.border(1, "red"),
  css.flexDirection("column"),
  css.color("#fff"),
);
// @ts-expect-error a CSS length other than px
css.width("10rem");
// @ts-expect-error not a colour
css.bg("blu");
// @ts-expect-error Clay has no space-between
css.justifyContent("space-between");
// @ts-expect-error no such member: Clay draws no shadow
css.boxShadow("0 0 1px red");
// @ts-expect-error cn() takes styles only
css.cn("x");

const t = css.createTokens({ color: { $type: "color", bg: { $value: "#000" } } });
css.createGlobalTheme(t, "light", { color: { bg: "#fff" } });
// @ts-expect-error no token at this path
css.createGlobalTheme(t, "light", { color: { fg: "#fff" } });
// @ts-expect-error not a colour
css.createGlobalTheme(t, "light", { color: { bg: "blu" } });
const font = css.fonts("Roboto", "Mono");
export const states = css.cn(
  font.Mono,
  css.bg(t.color.bg),
  css.hover(css.bg("red")),
  css.active(css.p(2)),
  css.focus(css.border(1, "blue")),
);
// @ts-expect-error a font the list does not declare
css.cn(font.Serif);
// @ts-expect-error a state takes styles
css.hover("red");
// @ts-expect-error fonts() takes at least one name
css.fonts();

export const floats = css.cn(
  css.float(),
  css.float({
    attach: { element: "left top", parent: "left bottom" },
    parent: "Units",
    offset: { x: 4, y: "-2px" },
    expand: { width: 2, height: 3 },
    zIndex: 10,
    capture: false,
    clip: "parent",
  }),
  css.float({ root: true, attach: { parent: "center center" } }),
  css.hover(css.float({ zIndex: 1 })),
);
// @ts-expect-error a point is x then y, as Clay names it
css.float({ attach: { element: "top left" } });
// @ts-expect-error a point of the parent that Clay has not
css.float({ attach: { parent: "middle" } });
// @ts-expect-error not a length Clay counts
css.float({ offset: { x: "1em" } });
// @ts-expect-error no such option
css.float({ zindex: 1 });
// @ts-expect-error capture is a boolean
css.float({ capture: "no" });
// @ts-expect-error clip is none or parent
css.float({ clip: "attached" });
// @ts-expect-error a parent is the string of its CLAY_ID
css.float({ parent: 3 });
// @ts-expect-error a parent and the root are two places
css.float({ parent: "Units", root: true });
// @ts-expect-error float takes options, not a style
css.float(css.p(1));

export const images = css.cn(
  css.image("glyph.png", { width: 32, height: 32 }),
  css.image("logo.png", { width: 64, height: 32, fit: "contain" }),
);
// @ts-expect-error fill or contain, as CSS's object-fit
css.image("a.png", { width: 1, height: 1, fit: "cover" });
// @ts-expect-error the image's size is required
css.image("a.png", { width: 1 });
// @ts-expect-error no such option: the path is the first argument
css.image({ src: "a.png", width: 1, height: 1 });
