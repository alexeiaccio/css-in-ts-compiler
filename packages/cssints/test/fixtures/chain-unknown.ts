import { chain } from "cssints" with { type: "cssints" };

// A chain is properties only: conditions and builders stay outside it.
export const bad = chain().hover("red");
