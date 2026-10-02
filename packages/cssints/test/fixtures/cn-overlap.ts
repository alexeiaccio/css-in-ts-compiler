import { borderColor, borderTop, cn } from "cssints" with { type: "cssints" };

// border-top sets border-top-color, border-color sets it too: neither contains the other, so the order would decide
export const bad = cn(borderTop("1px solid red"), borderColor("blue"));
