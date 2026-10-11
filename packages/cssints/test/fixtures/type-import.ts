import type { CvProps, Style } from "cssints";
import { type ClassValue } from "cssints";
import { cn, cv, p } from "cssints" with { type: "cssints" };

// type imports are erased: they need no attribute, alone or beside a type
const button = cv({ base: p(2), variants: { size: { sm: p(1) } } });
export type Props = CvProps<{ size: { sm: Style } }>;
export type Parts = ClassValue[];
export const a = cn(button({ size: "sm" }), p(2));
