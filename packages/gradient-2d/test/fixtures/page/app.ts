// the mesh and freeform classes: this module is evaluated at build time, so the DOM is touched in render(), not at the top
import { freeformGradient, meshGradient } from "../../../src/index.ts" with { type: "cssints" };

export const hero = meshGradient("red, blue, yellow; green, white, black; cyan, magenta, #888");
export const token = meshGradient("var(--accent), blue; green, yellow");
export const ff = freeformGradient("red top left, gold 4 60% 40%, yellow bottom right");

export const render = () => {
  document.getElementById("hero")!.className = hero;
  document.getElementById("token")!.className = token;
  document.getElementById("ff")!.className = ff;
};
