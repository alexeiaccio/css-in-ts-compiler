import { p, scv } from "cssints" with { type: "cssints" };

// a record by slot names slots: `labl` is a typo, and it would style nothing
export const bad = scv({
  slots: { base: p(2), label: p(1) },
  variants: { size: { sm: { labl: p(1) } } },
});
