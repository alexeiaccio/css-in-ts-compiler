import { bg, cn, p } from "cssints" with { type: "cssints" };

// A package written on cssints that no app lists: it arrives behind another one (pkg/ui imports it), which is how
// @cssints/motion arrives behind @cssints/reveal.
export const raised = cn(p(8), bg("#059669"));
