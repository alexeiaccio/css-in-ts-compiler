import { balance } from "../../src/index.ts" with { type: "cssints" };

// the same heading twice, balanced and not: at 420px its last line holds one word
const text =
  "Balanced headings read better when every line holds about the same number of words today";
export const render = (): void => {
  for (const [id, cls] of [
    ["b", balance()],
    ["plain", ""],
  ]) {
    const h = document.createElement("h1");
    h.id = id;
    h.className = cls;
    h.textContent = text;
    document.body.append(h);
  }
};
