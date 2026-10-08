// Runtimes with a script of their own: two entries share one script (Firefox 128 lacks both features), one is for a
// feature every target has.
import { scope } from "cssints/plugin";

const script = "/fixtures/plug-script-run.js";

export const { one, two, lit } = scope("ps", {
  "#a": { polyfills: ["css.at-rules.container.style_queries_for_custom_properties"], script },
  "#b": { polyfills: ["css.at-rules.container.scroll-state_queries"], script },
  "#c": { polyfills: ["css.properties.color"], script },
  one: { args: [], uses: ["a"] },
  two: { args: [], uses: ["b"] },
  lit: { args: [], uses: ["c"] },
})
  .build({ one: () => ({}), two: () => ({}), lit: () => ({}) })
  .export();
