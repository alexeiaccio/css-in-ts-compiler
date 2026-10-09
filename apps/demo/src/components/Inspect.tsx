// The hard cases of the devtools overlay (cssints({ devtools: true }), Alt+Shift+C), checked by packages/devtools/test/browsers.mjs:
// hover and a media query in one layer (hover wins by specificity), a group's state (within), a user's rule outside every
// layer that beats cssints' classes, and a look confined to a subtree (@scope).
import "./inspect.css";
import { cx } from "cssints";
import {
  bg,
  cn,
  color,
  group,
  hover,
  media,
  p,
  textDecoration,
  within,
} from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

const md = media("(width >= 40rem)");

look(t, "hero", "author", { color: { surface: "#fef3c7" } }, { scope: "[data-case=scope-root]" });

const both = cn(hover(color("#dc2626")), md(color("#2563eb")));
const row = cn(group(), p(2));
const underline = within(hover)(textDecoration("underline"));
const surface = cn(p(2), bg(t.color.surface));

export function Inspect() {
  return (
    <section data-demo="inspect">
      <a data-case="hover-md" href="#inspect" className={both}>
        hover beats the query by specificity
      </a>
      <div data-case="group" className={row}>
        <span data-case="within" className={underline}>
          underlined while the row is hovered
        </span>
      </div>
      <p data-case="unlayered" className={cx(color("#dc2626"), "mine")}>
        a rule of inspect.css outside every layer beats the class
      </p>
      <div data-case="scope-root">
        <div data-mode="hero">
          <p data-case="scoped" className={surface}>
            a look in @scope sets the surface here
          </p>
        </div>
      </div>
    </section>
  );
}
