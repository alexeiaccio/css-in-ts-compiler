import { scope } from "cssints/plugin";
export const { m } = scope("sc-around-a", {
  core: {
    css: (css) => {
      const clock = css.keyframes({ from: css.vars({ "--_p": "100%" }), to: css.vars({ "--_p": "0%" }) });
      return [
        css.backgroundPosition("var(--_p) 0"),
        css.nest(":root:has(&)")(css.animation(clock, "1s infinite")),
        css.hover(css.nest(":root:has(&)")(css.color("red"))),
        css.nest(":root:has(&)")(css.focus(css.color("blue"))),
        css.nest(".dark &")(css.opacity(0.5)),
        css.nest("& > *")(css.nest(".x &")(css.margin(0))),
      ];
    },
  },
  m: { uses: ["core"], chain: {} },
}).export();
