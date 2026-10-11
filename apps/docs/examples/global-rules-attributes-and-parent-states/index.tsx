import * as css from "cssints" with { type: "cssints" };

import "./base.ts" with { type: "cssints" };

// attr() styles an attribute state; group() marks an ancestor and within() reads its state.
const nav = css.cn(css.flex().direction("column").gap(1), css.p(3), css.maxWidth("22rem"));
const row = css.cn(
  css.group(),
  css.flex().alignItems("center").justifyContent("space-between"),
  css.padding("0.5rem", "0.75rem"),
  css.borderRadius("8px"),
  css.color("#475569"),
  css.hover(css.bg("#f1f5f9")),
  css.attr(
    "aria-current",
    "page",
  )(css.cn(css.color("#1d4ed8"), css.fontWeight(700), css.bg("#dbeafe"))),
);
const actions = css.cn(
  css.opacity(0),
  css.fontSize("0.8125rem"),
  css.within(css.hover)(css.opacity(1)),
  css.within(css.focusVisible)(css.opacity(1)),
);
const pdf = css.attr("href", ".pdf", "$=")(css.textDecoration("underline"));

export default function App() {
  return (
    <nav className={nav} aria-label="Files">
      {[
        ["Overview", "overview.html", true],
        ["Pricing", "pricing.html", false],
        ["Handbook", "handbook.pdf", false],
      ].map(([name, href, current]) => (
        <div className={row} aria-current={current ? "page" : undefined}>
          <a href={href as string} className={css.cn(css.color("inherit"), pdf)}>
            {name}
          </a>
          <span className={actions}>Rename · Delete</span>
        </div>
      ))}
    </nav>
  );
}
