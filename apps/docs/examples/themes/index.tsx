import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

reset();

// The second panel has the class "brand": the theme moves the accent, and the link and the hover colour (derived from it) follow.
const panel = css.cn(
  css.bg(t.color.bg),
  css.color(t.color.fg),
  css.p(t.space.md),
  css.borderRadius("12px"),
  css.border("1px solid", t.color.fg),
);
const link = css.cn(
  css.color(t.color.link),
  css.textDecoration("none"),
  css.hover(css.color(t.color.hover), css.textDecoration("underline")),
);

export default function App() {
  return (
    <div className={css.cn(css.flex().direction("column").gap(3), css.p(4))}>
      {[false, true].map((brand) => (
        <section className={css.cn(panel, brand && "brand")}>
          <h2 className={css.margin("0")}>{brand ? "Brand theme" : "Default theme"}</h2>
          <p>
            Read the{" "}
            <a href="#" className={link}>
              release notes
            </a>{" "}
            before you upgrade.
          </p>
        </section>
      ))}
    </div>
  );
}
