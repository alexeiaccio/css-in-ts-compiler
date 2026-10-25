import { p, scv } from "cssints" with { type: "cssints" };

// a variant value that is a style styles the base slot: this config has no slot named base
export const bad = scv({
  slots: { trigger: p(2), content: p(1) },
  variants: { size: { sm: p(1) } },
});
