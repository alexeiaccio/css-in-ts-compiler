import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

reset();

// A value that a browser in your browserslist lacks is a warning, not an error: it appears under the editor, with the BCD feature.
// Text that balances, a colour in OKLCH, anchor names and the standard line-clamp are all newer than the default targets.
const article = css.cn(css.maxWidth("34rem"), css.p(6), css.flex().direction("column").gap(3));
const title = css.cn(
  css.margin("0"),
  css.fontSize("2rem"),
  css.textWrap("balance"),
  css.color(css.oklch(0.4, 0.15, 260)),
);
const lead = css.cn(css.margin("0"), css.textWrap("pretty"), css.lineHeight(1.6));
const teaser = css.cn(css.lineClamp(2), css.overflow("hidden"), css.color("#475569"));
const sticky = css.cn(
  css.position("sticky"),
  css.top(0),
  css.bg("white"),
  css.p(2),
  css.accentColor("#2563eb"),
);

export default function App() {
  return (
    <article className={article}>
      <label className={sticky}>
        <input type="checkbox" defaultChecked /> Keep me posted
      </label>
      <h1 className={title}>What the build says about the browsers you support</h1>
      <p className={lead}>
        Browser support comes from @mdn/browser-compat-data against your browserslist, as build
        warnings.
      </p>
      <p className={teaser}>
        There is no per-property table in the types: the warning names the property, the value and
        the browsers that lack it, and it is said once per file per build, at the call that made it.
      </p>
    </article>
  );
}
