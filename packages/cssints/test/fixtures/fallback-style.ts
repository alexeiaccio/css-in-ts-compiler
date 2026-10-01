import { minHeight, firstThatWorks, style } from "cssints" with { type: "cssints" };

export const a = style(minHeight(firstThatWorks("100dvh", "100vh")));
