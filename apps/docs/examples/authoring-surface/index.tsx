import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };
import { CSS } from "cssints" with { type: "cssints" };

import { page, row, stack } from "./stack.ts" with { type: "cssints" };

reset();

// Names are the CSS properties in camelCase, plus a few short ones (p, m, bg). A bare number is a step of 0.25rem in padding,
// margin, gap and inset, and a plain number elsewhere. flex() and grid() chain their container properties.
const frame = css.cn(page, css.maxWidth("32rem"), css.marginInline("auto"));
const panel = css.cn(
  stack,
  css.padding(CSS.rem(1), CSS.rem(1.5)),
  css.border("1px solid", "#d4d8e1"),
  css.borderRadius("12px"),
  css.bg("#fafbfd"),
  css.color("#0f172a"),
);
const person = css.cn(row, css.minHeight("3rem"));
const avatar = css.cn(
  css.width("2.5rem"),
  css.height("2.5rem"),
  css.borderRadius("50%"),
  css.bg("#c7d2fe"),
  css.color("#1e1b4b"),
  css.flex().alignItems("center").justifyContent("center"),
  css.fontWeight(700),
);
const grid = css.cn(
  css.grid().templateColumns("repeat(3, 1fr)").gap(2),
  css.textAlign("center"),
  css.fontSize("0.875rem"),
);
const cell = css.cn(
  css.p(2),
  css.bg("white"),
  css.color("#0f172a"),
  css.border("1px solid", "#e5e7eb"),
  css.opacity(0.9),
);

const people = ["Ada", "Grace", "Linus"];

export default function App() {
  return (
    <div className={frame}>
      <section className={panel}>
        <h2 className={css.cn(css.margin("0"), css.fontSize("1.125rem"))}>Team</h2>
        {people.map((name) => (
          <div className={person}>
            <span className={avatar}>{name[0]}</span>
            <span>{name}</span>
          </div>
        ))}
      </section>
      <section className={grid}>
        <span className={cell}>p(2)</span>
        <span className={cell}>opacity(0.9)</span>
        <span className={cell}>gap(2)</span>
      </section>
    </div>
  );
}
