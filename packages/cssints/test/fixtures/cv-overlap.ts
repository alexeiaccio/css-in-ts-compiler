import { borderBottom, borderColor, cv } from "cssints" with { type: "cssints" };

// border-bottom sets border-bottom-color, border-color sets it too: neither contains the other
export const bad = cv({
  base: borderBottom("3px solid transparent"),
  variants: { active: { yes: borderColor("blue") } },
});
