import * as css from "cssints" with { type: "cssints" };

// Every argument of cn() is known at build time, so the whole call is one class string and no runtime is imported: open the
// Module tab and look for `import`.
const badge = css.cn(
  css.flex().alignItems("center").gap(1),
  css.padding("0.125rem", "0.625rem"),
  css.borderRadius("999px"),
  css.bg("#dcfce7"),
  css.color("#166534"),
  css.fontSize("0.8125rem"),
  css.fontWeight(600),
);
const list = css.cn(css.flex().wrap("wrap").gap(2), css.p(4));

export default function App() {
  return (
    <div className={list}>
      {["stable", "beta", "alpha"].map((name) => (
        <span className={badge}>{name}</span>
      ))}
    </div>
  );
}
