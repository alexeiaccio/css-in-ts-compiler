import type { CvProps } from "cssints";
import { cx, type Style } from "cssints";
import { cv, p } from "cssints" with { type: "cssints" };

// type imports are erased: they need no attribute, alone or beside a runtime name
const button = cv({ base: p(2), variants: { size: { sm: p(1) } } });
export type Props = CvProps<{ size: { sm: Style } }>;
export const a = cx(button({ size: "sm" }));
