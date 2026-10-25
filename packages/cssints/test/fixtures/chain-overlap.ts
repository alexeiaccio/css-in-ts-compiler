import { chain } from "cssints" with { type: "cssints" };

// border-top sets border-top-color, border-color sets it too: neither contains the other.
export const bad = chain().borderTop("1px solid red").borderColor("blue");
