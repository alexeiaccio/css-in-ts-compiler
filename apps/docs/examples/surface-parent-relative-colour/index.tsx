import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

reset();

const canvas = css.token.color("#2b3a67", "canvas");

// A surface passes its colour down the tree; a nested surface is that colour with its lightness moved, through any number of
// plain wrappers. These are tonal steps, not a contrast guarantee: ink() picks a readable text colour.
const page = css.cn(
  surface().color(canvas).ink(),
  css.p(6),
  css.flex().direction("column").gap(4),
  css.minHeight("100vh"),
);
const card = css.cn(
  surface().lighten(0.06).ink(),
  css.hover(surface().lighten(0.1).ink()),
  css.p(4),
  css.borderRadius("12px"),
  css.flex().direction("column").gap(3),
);
const field = css.cn(surface().darken(0.03).ink(), css.p(2), css.borderRadius("8px"));
const cta = css.cn(
  surface().color("oklch(from #e11d48 l c h)").contrast(0.15).ink(),
  css.p(2),
  css.border("0", "none"),
  css.borderRadius("8px"),
);

export default function App() {
  return (
    <div className={page}>
      <section className={card}>
        <h2 className={css.margin("0")}>Invite someone</h2>
        <div>
          <div className={field}>ada@example.com</div>
        </div>
        <button className={cta}>Send invite</button>
      </section>
    </div>
  );
}
