// the escape: methods that are not a token setter, and a verbatim kernel (container style queries are not styles)
import { method, plugin } from "cssints/plugin";

const p = plugin("sf2");
const t = p.tokens({ base: { $type: "color", $value: "#ffffff" } });
const step = "<number [0,1]>" as const;
export const surface = p.context(t, {
  kernel: { css: "._sf2{background-color:var(--sf2-base)}", requires: ["css.at-rules.property"] },
  methods: {
    lighten: method({ grammar: step, excludes: ["darken"], emit: (v) => [["--sf2-d", v]] }),
    darken: method({ grammar: step, excludes: ["lighten"], emit: (v) => [["--sf2-d", `calc(${v} * -1)`]] }),
    ink: method({ grammar: "", emit: () => [["color", "black"]] }),
  },
});
export const dot = p.member("small | large", (css, size) => css.cn());
export const ok = surface().base("red").lighten(0.1).ink();
// @ts-expect-error lighten excludes darken
export const no1 = surface().lighten(0.1).darken(0.1);
// @ts-expect-error not a colour
export const no2 = surface().base("1px");
// @ts-expect-error not in the grammar
export const no3 = dot("medium");
export const yes = dot("small");
