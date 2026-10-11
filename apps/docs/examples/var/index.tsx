import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

reset();

// A token is its var() already. css.var(token, fallback) adds a fallback, checked as a value of the token's type.
const t = css.createTokens({
  color: {
    $type: "color",
    accent: { $value: "#2563eb" },
    surface: { $value: "#eff6ff" },
  },
  space: { $type: "dimension", sm: { $value: "8px" } },
});

const alert = css.cn(
  css.flex().alignItems("center").gap(css.var(t.space.sm, "4px")),
  css.padding(css.var(t.space.sm, "4px"), "16px"),
  css.bg(css.var(t.color.surface, css.rgb(255, 255, 255))),
  css.color(css.var(t.color.accent, "black")),
  css.border("1px solid", css.var(t.color.accent, "currentColor")),
  css.borderRadius("10px"),
);

export default function App() {
  return (
    <div className={css.p(4)}>
      <div className={alert} role="alert">
        <strong>Heads up.</strong> The fallbacks apply where the token is not set.
      </div>
    </div>
  );
}
