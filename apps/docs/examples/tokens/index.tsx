import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

reset();

// A token is a typed value that prints as var(--name). A name makes it settable; without one it is private to the file.
const brand = css.token.color("#2563eb", "brand");
const gap = css.token.length("12px", { var: "swatch-gap", inherit: false });
const ink = css.token.color("#0f172a");

const swatches = css.cn(css.flex().wrap("wrap").gap(gap), css.p(4));
const swatch = css.cn(
  css.width("6rem"),
  css.height("6rem"),
  css.borderRadius("12px"),
  css.bg(brand),
  css.color("white"),
  css.flex().alignItems("flex-end").justifyContent("flex-start"),
  css.p(2),
  css.fontSize("0.8125rem"),
  css.border("2px solid", ink),
);

// token.set() and style() give an inline style for one element: the whole subtree follows the new value
const palette = [
  ["brand", undefined],
  ["rose", css.style(css.token.set(brand, "#e11d48"))],
  ["amber", css.style(css.token.set(brand, "#d97706"))],
  ["teal", css.style(css.token.set(brand, "#0d9488"))],
] as const;

export default function App() {
  return (
    <div className={swatches}>
      {palette.map(([name, style]) => (
        <div className={swatch} style={style}>
          {name}
        </div>
      ))}
    </div>
  );
}
