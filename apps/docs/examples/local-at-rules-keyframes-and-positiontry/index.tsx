import * as css from "cssints" with { type: "cssints" };

// keyframes() writes the at-rule next to the styles that use it and returns its name; the rule goes into the sheet of the module.
const fade = css.keyframes({ from: css.opacity(0), to: css.opacity(1) });
const wiggle = css.keyframes({
  from: css.transform("rotate(0deg)"),
  "50%": css.cn(css.transform("rotate(8deg)"), css.opacity(0.6)),
  to: css.transform("rotate(0deg)"),
});
const spin = css.keyframes({ to: css.transform("rotate(360deg)") });

const toast = css.cn(
  css.p(4),
  css.bg("#0f172a"),
  css.color("white"),
  css.borderRadius("10px"),
  css.animation(fade, "400ms", "ease-out"),
);
const bell = css.cn(
  css.display("inline-block"),
  css.fontSize("2rem"),
  css.hover(css.animation(wiggle, "600ms", "ease-in-out", "infinite")),
);
const spinner = css.cn(
  css.width("2rem"),
  css.height("2rem"),
  css.border("4px solid #cbd5e1"),
  css.borderTopColor("#2563eb"),
  css.borderRadius("50%"),
  css.animation(spin, "900ms", "linear", "infinite"),
);

export default function App() {
  return (
    <div
      className={css.cn(css.flex().direction("column").alignItems("flex-start").gap(4), css.p(4))}
    >
      <div className={toast}>Saved. This fades in.</div>
      <span className={bell}>🔔</span>
      <div className={spinner} aria-label="Loading" />
    </div>
  );
}
