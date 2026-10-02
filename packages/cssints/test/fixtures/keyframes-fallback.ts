import { animation, firstThatWorks, keyframes, opacity } from "cssints" with { type: "cssints" };
const k = keyframes({ to: opacity(1) });
export const a =
  animation(firstThatWorks(k, "none"), "1s");
