// Runtimes with a script of their own: two entries share one script (Firefox 128 lacks both features), one is for a
// feature every target has, and one polyfills nothing at all (the plugin's own script: every target gets it).
import { scope } from "cssints/plugin";

const script = "/fixtures/plug-script-run.js";

export const { one, two, lit, all } = scope("ps", {
  "#a": { polyfills: ["css.at-rules.container.style_queries_for_custom_properties"], script },
  "#b": { polyfills: ["css.at-rules.container.scroll-state_queries"], script },
  "#c": { polyfills: ["css.properties.color"], script },
  "#d": { polyfills: [], script },
  one: { args: [], uses: ["a"] },
  two: { args: [], uses: ["b"] },
  lit: { args: [], uses: ["c"] },
  all: { args: [], uses: ["d"] },
})
  .build({ one: () => ({}), two: () => ({}), lit: () => ({}), all: () => ({}) })
  .export();
