import { keyframes, opacity } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";
const fade = keyframes({ from: opacity(0) });
export const { m } = scope("sc-nest", {
  core: {
    css: (css) => [
      css.vars({ "--_gap": "1rem", "--_kf": fade }),
      css.display("flex"),
      css.nest("& > * + *")(css.marginTop("var(--_gap)")),
      css.hover(css.nest("& > *")(css.opacity(0.5))),
      css.nest("& > *")(css.hover(css.opacity(1))),
      css.animationName(fade),
    ],
  },
  m: { uses: ["core"], chain: {} },
}).export();
