import { borderBottom, borderColor, scv } from "cssints" with { type: "cssints" };

// border-bottom sets border-bottom-color, border-color sets it too: neither contains the other
export const bad = scv({
  slots: { base: borderBottom("3px solid transparent"), label: borderColor("blue") },
  variants: { active: { yes: { base: borderColor("red") } } },
});
