// Every style of the app, on cssints/tui: the plugin compiles each site to a prop object at build time, and
// @cssints/tui/opentui puts it on a renderable (`<box {...use(s.card)} />`) and keeps it in step with the mouse, the
// focus and the theme. Dark is the default theme, `light` the other one (setTheme).
import * as css from "cssints/tui" with { type: "cssints" };

export const c = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#101316" },
    card: { $value: "#171b20" },
    hover: { $value: "#222831" },
    text: { $value: "#e6e9ec" },
    muted: { $value: "#8b98a5" },
    border: { $value: "#323a44" },
    accent: { $value: "#3b9cf0" },
    link: { $value: "#5cb0ff" },
    onAccent: { $value: "#ffffff" },
  },
});
css.createGlobalTheme(c, "light", {
  color: {
    bg: "#f3f5f7",
    card: "#ffffff",
    hover: "#e8eef4",
    text: "#0f1419",
    muted: "#56636f",
    border: "#cfd8df",
    accent: "#1170cf",
    link: "#0b62bd",
  },
});

export const screen = css.cn(
  css.flexDirection("column"),
  css.width("100%"),
  css.height("100%"),
  css.bg(c.color.bg),
);
export const bar = css.cn(
  css.flexDirection("row"),
  css.flexShrink(0),
  css.gap(2),
  css.p(0, 1),
  css.bg(c.color.card),
);
export const tab = css.cn(
  css.color(c.color.muted),
  css.bg(c.color.card),
  css.cursor("pointer"),
  css.hover(css.color(c.color.text), css.bg(c.color.hover)),
);
export const tabActive = css.cn(
  css.color(c.color.onAccent),
  css.bg(c.color.accent),
  css.cursor("pointer"),
);
export const list = css.cn(css.flexGrow(1), css.bg(c.color.bg));
export const footer = css.cn(
  css.color(c.color.muted),
  css.bg(c.color.card),
  css.flexShrink(0),
  css.p(0, 1),
);

// A row of a list: the selected one has the keyboard focus and the accent border.
export const row = css.cn(
  css.flexDirection("column"),
  css.flexShrink(0),
  css.border("rounded", c.color.border),
  css.bg(c.color.card),
  css.p(0, 1),
  css.focus(css.borderColor(c.color.accent)),
);
// A row that opens something: a lighter background and the pointer under the mouse.
export const card = css.cn(row, css.cursor("pointer"), css.hover(css.bg(c.color.hover)));
export const quote = css.cn(
  css.flexDirection("column"),
  css.border("solid", c.color.border),
  css.p(0, 1),
);
export const body = css.color(c.color.text);
export const muted = css.color(c.color.muted);

// Spans: `<span {...use(s.name)}>`, the props and the theme (a text node has no states).
export const title = css.cn(css.color(c.color.accent), css.fontWeight("bold"));
export const name = css.cn(css.color(c.color.text), css.fontWeight("bold"));
export const meta = css.color(c.color.muted);
export const link = css.cn(css.color(c.color.link), css.textDecoration("underline"));
export const tag = css.color(c.color.link);
