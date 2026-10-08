import * as css from "cssints" with { type: "cssints" };

// cubicBezier and shadow: DTCG values or CSS strings, `@property` syntax "*", themeable.
export const t = css.createTokens({
  es: {
    ease: {
      $type: "cubicBezier",
      out: { $value: [0, 0, 0.3, 1] },
      spring: { $value: "linear(0, 0.5 20%, 1)" },
    },
    shadow: {
      $type: "shadow",
      sm: {
        $value: {
          color: "#0000001a",
          offsetX: { value: 0, unit: "px" },
          offsetY: { value: 1, unit: "px" },
          blur: "2px",
          spread: { value: 0, unit: "rem" },
        },
      },
      lg: {
        $value: [
          { color: "#0000001a", offsetX: "0", offsetY: "4px", blur: "8px", spread: "-2px" },
          {
            color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.2 },
            offsetX: "0",
            offsetY: "0",
            blur: "0",
            spread: "1px",
            inset: true,
          },
        ],
      },
    },
  },
});
css.createGlobalTheme(t, ".es-dark", {
  es: { shadow: { sm: "0 1px 2px 0.5rem #000" }, ease: { out: [0.2, 0, 0, 1] } },
});
export const quick = css.token.easingFunction("ease-out", "es-quick");

export const box = css.cn(
  css.transitionTimingFunction(t.es.ease.out),
  css.animationTimingFunction(quick),
  css.boxShadow(t.es.shadow.lg),
);
