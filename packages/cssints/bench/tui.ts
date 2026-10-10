// cssints/tui as a terminal app writes it: colour members (the web's `color` grammar), cells, states, tokens.
import * as css from "cssints/tui";

const t = css.createTokens({
  color: { $type: "color", bg: { $value: "#1e1e2e" }, fg: { $value: "#cdd6f4" } },
});
css.createGlobalTheme(t, "light", { color: { bg: "#eff1f5", fg: "#4c4f69" } });

export const button = css.cn(
  css.border("rounded", "#585b70"),
  css.p(0, 1),
  css.width(12),
  css.height("50%"),
  css.bg(t.color.bg),
  css.color(t.color.fg),
  css.cursor("pointer"),
  css.hover(css.bg("oklch(0.3 0.02 270)"), css.borderColor("#89b4fa")),
  css.focus(css.borderStyle("double")),
  css.active(css.fontWeight("bold"), css.textDecoration("underline")),
);
export const row = css.cn(
  css.flexDirection("row"),
  css.gap(1),
  css.justifyContent("space-between"),
);
