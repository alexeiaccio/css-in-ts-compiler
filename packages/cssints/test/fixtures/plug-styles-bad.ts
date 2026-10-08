// An error in a kernel written as styles names the value as the sheet prints it.
import { scope } from "cssints/plugin";

export const { bad } = scope("swb", {
  "#k": { css: (css) => css.color("rgb(var(--_g) 1s)") },
  bad: { args: [], uses: ["k"] },
})
  .build({ bad: () => ({}) })
  .export();
