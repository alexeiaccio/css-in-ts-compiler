import { color } from "cssints" with { type: "cssints" };
import { lacking, scope } from "cssints/plugin";
const boom = () => { throw new Error("boom"); };
export const { ch, ca, va, ke, off } = scope("sc-throw", {
  "#k": { css: () => boom() },
  ch: { chain: { x: { args: "<length>", emit: () => boom() } } },
  ca: { args: [] },
  va: { args: "<length>", value: () => boom() },
  ke: { uses: ["k"], chain: {} },
  off: { args: [], value: () => lacking("css.at-rules.container.scroll-state_queries", "css.at-rules.property").join(", ") },
})
  .build({ ca: () => boom() })
  .export();
export const helper = () => (boom(), color("red"));
