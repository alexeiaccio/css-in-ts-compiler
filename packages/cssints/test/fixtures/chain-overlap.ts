import { sx } from "cssints" with { type: "cssints" };

// border-top sets border-top-color, border-color sets it too: neither contains the other.
export const bad = sx().borderTop("1px solid red").borderColor("blue");
