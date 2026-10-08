import { display } from "cssints" with { type: "cssints" };

// @ts-expect-error engine gap: mdn-data's <display-inside> has no grid-lanes
export const a = display("grid-lanes");
