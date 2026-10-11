import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const radius = css.token.length("12px", "radius-lg");

// A frame passes its inner radius down the tree: the field inside gets 24 - 16 - 1 = 7px, the button inside the field less again,
// with no radius written on them. A condition sets the custom property and the whole subtree follows.
const card = css.cn(
  frame().radius("1.5rem").padding(4).border("1px"),
  css.bg("white"),
  css.borderColor("#9ca3af"),
  css.flex().direction("column").gap(3),
  css.maxWidth("22rem"),
  css.media("(width >= 40rem)")(frame().padding(6)),
);
const field = css.cn(
  frame().padding(2).border("1px"),
  css.borderColor("#9ca3af"),
  css.flex().justifyContent("space-between").alignItems("center"),
);
const button = css.cn(frame().padding(2).border("0"), css.bg("#2563eb"), css.color("white"));
const small = css.cn(frame().radius(radius).padding(2), css.bg("#e0e7ff"));

export default function App() {
  return (
    <div className={css.cn(css.p(4), css.bg("#f1f5f9"))}>
      <div className={card}>
        <label className={field}>
          <input
            defaultValue="ada@example.com"
            className={css.cn(css.border("0", "none"), css.bg("transparent"))}
          />
          <button className={button}>Send</button>
        </label>
        <div className={small}>12px frame, set by a token</div>
      </div>
    </div>
  );
}
